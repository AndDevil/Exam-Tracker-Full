const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Helper function to send email notifications via SMTP or log them as a simulated dry-run.
 */
async function sendEmailFallback(userId, subject, text) {
  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists) {
      console.log(`User profile for ${userId} does not exist. Cannot send fallback email.`);
      return;
    }

    const userData = userDoc.data();
    const emailNotifications = userData.emailNotifications;
    const emailAddress = userData.emailAddress;

    if (!emailNotifications || !emailAddress) {
      console.log(`User ${userId} does not have email fallback notifications enabled or is missing an email address.`);
      return;
    }

    console.log(`Email fallback triggered for user ${userId} (${emailAddress})`);

    // Retrieve SMTP variables from runtime configuration or process environment
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || '587';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || 'alerts@exam-tracker-pro-87b3d.web.app';

    if (host && user && pass) {
      // Build Nodemailer transport
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from: `"Exam Tracker Pro" <${from}>`,
        to: emailAddress,
        subject,
        text,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 15px; border-radius: 8px; color: white; text-align: center;">
              <h2 style="margin: 0; font-size: 20px;">Exam Tracker Pro Alert</h2>
            </div>
            <div style="padding: 20px 10px; line-height: 1.6;">
              <p style="font-size: 15px;">Hello,</p>
              <p style="font-size: 15px; font-weight: bold; color: #4f46e5;">${subject}</p>
              <p style="font-size: 14px; color: #475569;">${text}</p>
              <p style="font-size: 13px; color: #64748b; margin-top: 25px; border-t: 1px solid #e2e8f0; padding-top: 15px;">
                You are receiving this email because push notifications failed to deliver or were disabled on your devices. You can customize your alert settings in the app.
              </p>
            </div>
          </div>
        `
      });
      console.log(`Successfully sent fallback email to ${emailAddress}`);
    } else {
      // Simulation dry-run fallback
      console.log(`[Email Alert Simulation Mode]
        To: ${emailAddress}
        From: ${from}
        Subject: ${subject}
        Content: ${text}
      `);
    }
  } catch (err) {
    console.error(`Failed to send fallback email for user ${userId}:`, err);
  }
}

/**
 * Daily scheduled function to check upcoming exam milestones (2 days away)
 * and send push notifications to user tokens, falling back to email if needed.
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
    const usersWithTargetMilestones = new Set();
    const userMilestonesMap = new Map(); // Map to store milestone info per user

    // Helper to process queries (limited to 500 documents per run to avoid memory limits)
    const processQuery = async (field, eventName, messageTemplate) => {
      const snapshot = await db.collectionGroup('exams')
        .where(field, '==', targetDateStr)
        .limit(500)
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

        const title = `${eventName}: ${exam.name}`;
        const body = messageTemplate(exam);

        usersWithTargetMilestones.add(userId);
        
        // Store milestone details for email fallback
        if (!userMilestonesMap.has(userId)) {
          userMilestonesMap.set(userId, []);
        }
        userMilestonesMap.get(userId).push({ title, body });

        // Fetch user device tokens
        const tokensSnap = await db.collection(`users/${userId}/tokens`).get();
        if (tokensSnap.empty) {
          console.log(`No registered device tokens for user ${userId}. Will trigger email fallback.`);
          continue;
        }

        tokensSnap.forEach((tokenDoc) => {
          const token = tokenDoc.data().token;
          if (token) {
            notificationsToSend.push({
              token,
              tokenPath: `users/${userId}/tokens/${token}`,
              userId,
              title,
              body,
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

    console.log(`Compiled ${notificationsToSend.length} push notifications to attempt.`);

    // Keep track of successful push counts per user
    const userSuccessfulPushCounts = {};
    usersWithTargetMilestones.forEach(uid => {
      userSuccessfulPushCounts[uid] = 0;
    });

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
        userSuccessfulPushCounts[item.userId] = (userSuccessfulPushCounts[item.userId] || 0) + 1;
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

    // Trigger Email Fallback for any user where successful push count is 0
    console.log('Evaluating email fallbacks for milestone users...');
    for (const userId of usersWithTargetMilestones) {
      const successes = userSuccessfulPushCounts[userId] || 0;
      if (successes === 0) {
        console.log(`User ${userId} had 0 successful push notifications. Dispatched fallback email.`);
        const milestones = userMilestonesMap.get(userId) || [];
        for (const m of milestones) {
          await sendEmailFallback(userId, m.title, m.body);
        }
      }
    }

    // Clean up stale tokens in batch
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
