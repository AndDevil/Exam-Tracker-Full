const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Daily scheduled function to check upcoming exam milestones (2 days away)
 * and send push notifications to user tokens.
 * Runs every day at 09:00 AM UTC.
 */
exports.checkUpcomingExams = onSchedule({
  schedule: '0 9 * * *',
  timeZone: 'UTC',
  memory: '256MiB',
  timeoutSeconds: 300
}, async () => {
  console.log('Daily exam milestone scheduler triggered.');

  // Calculate target date (today + 2 days)
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + 2);
  const targetDateStr = targetDate.toISOString().slice(0, 10); // Format: "YYYY-MM-DD"
  
  console.log(`Checking for milestones scheduled on: ${targetDateStr}`);

  try {
    const notificationsToSend = [];
    const staleTokensToDelete = [];

    // Helper to process queries
    const processQuery = async (field, eventName, messageTemplate) => {
      const snapshot = await db.collectionGroup('exams')
        .where(field, '==', targetDateStr)
        .get();

      console.log(`Found ${snapshot.size} matches for field "${field}"`);

      for (const doc of snapshot.docs) {
        const exam = doc.data();
        const examId = doc.id;
        const userId = exam.userId;

        if (!userId) {
          console.warn(`Exam document ${examId} is missing userId. Skipping.`);
          continue;
        }

        // Fetch user device tokens
        const tokensSnap = await db.collection(`users/${userId}/tokens`).get();
        if (tokensSnap.empty) {
          console.log(`No registered tokens for user ${userId}. Skipping.`);
          continue;
        }

        const title = `${eventName}: ${exam.name}`;
        const body = messageTemplate(exam);

        tokensSnap.forEach((tokenDoc) => {
          const token = tokenDoc.data().token;
          if (token) {
            notificationsToSend.push({
              token,
              tokenPath: `users/${userId}/tokens/${token}`,
              message: {
                notification: { title, body },
                data: {
                  examId,
                  milestoneType: field,
                  click_action: `/exam/${examId}`
                }
              }
            });
          }
        });
      }
    };

    // 1. Check Exam Date
    await processQuery('examDate', 'Exam Date Reminder', (exam) => 
      `The exam for "${exam.name}" is scheduled in 2 days on ${exam.examDate}!`
    );

    // 2. Check Form Closing Date
    await processQuery('formEnd', 'Application Deadline', (exam) => 
      `The application form window for "${exam.name}" closes in 2 days on ${exam.formEnd}!`
    );

    // 3. Check Admit Card Release Date
    await processQuery('admitDate', 'Admit Card Alert', (exam) => 
      `The admit card for "${exam.name}" becomes available in 2 days on ${exam.admitDate}!`
    );

    console.log(`Compiled ${notificationsToSend.length} notifications to send.`);

    // Send the notifications
    for (const item of notificationsToSend) {
      try {
        await admin.messaging().send({
          token: item.token,
          notification: item.message.notification,
          data: item.message.data,
          webpush: {
            notification: {
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              vibrate: [200, 100, 200]
            }
          }
        });
        console.log(`Successfully sent message to token: ${item.token.slice(0, 15)}...`);
      } catch (err) {
        console.error(`Error sending message to token ${item.token.slice(0, 15)}...:`, err);
        // Identify if token is expired/invalid and add to cleanup list
        if (
          err.code === 'messaging/invalid-registration-token' ||
          err.code === 'messaging/registration-token-not-registered'
        ) {
          staleTokensToDelete.push(item.tokenPath);
        }
      }
    }

    // Clean up stale tokens
    if (staleTokensToDelete.length > 0) {
      console.log(`Cleaning up ${staleTokensToDelete.length} invalid device tokens...`);
      const batch = db.batch();
      staleTokensToDelete.forEach((path) => {
        batch.delete(db.doc(path));
      });
      await batch.commit();
      console.log('Stale tokens cleanup completed.');
    }

    console.log('Milestone check run finished successfully.');
  } catch (error) {
    console.error('Fatal error occurred during scheduler run:', error);
  }
});
