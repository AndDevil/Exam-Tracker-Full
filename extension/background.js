const API_KEY = 'AIzaSyCAuR16--1J9FdogiMAI9kglujTmssuink';
const PROJECT_ID = 'exam-tracker-pro-87b3d';

// Map Firestore doc fields
const mapFirestoreDoc = (doc) => {
  const fields = doc.fields || {};
  const data = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) data[key] = value.stringValue;
    else if (value.integerValue !== undefined) data[key] = parseInt(value.integerValue, 10);
    else if (value.doubleValue !== undefined) data[key] = parseFloat(value.doubleValue);
    else if (value.booleanValue !== undefined) data[key] = value.booleanValue;
    else if (value.nullValue !== undefined) data[key] = null;
  }
  const parts = doc.name.split('/');
  data.id = parts[parts.length - 1];
  return data;
};

// Set up Alarm on Installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Exam Tracker Extension Installed.');
  // Check every 15 minutes
  chrome.alarms.create('syncBadgeAlarm', { periodInMinutes: 15 });
  syncBadge();
});

// Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncBadgeAlarm') {
    syncBadge();
  }
});

// Runtime Message Listener (trigger sync immediately on log in)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'syncBadge') {
    syncBadge();
    sendResponse({ success: true });
  }
});

// Main Sync Badge logic
async function syncBadge() {
  chrome.storage.local.get(['idToken', 'userId'], async (result) => {
    if (!result.idToken || !result.userId) {
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    try {
      let idToken = result.idToken;
      let res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${result.userId}/exams`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (res.status === 401) {
        // Try refresh token
        const tokens = await refreshAccessToken();
        if (tokens) {
          idToken = tokens.idToken;
          res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${result.userId}/exams`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
        } else {
          chrome.action.setBadgeText({ text: '' });
          return;
        }
      }

      if (!res.ok) {
        throw new Error('Failed to fetch exams in background');
      }

      const data = await res.json();
      const docs = data.documents || [];
      const exams = docs.map(mapFirestoreDoc);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const next7Days = new Date(today);
      next7Days.setDate(next7Days.getDate() + 7);

      // Filter exams with milestones in the next 7 days
      const upcomingCount = exams.filter(exam => {
        const milestoneDates = [exam.examDate, exam.formEnd, exam.admitDate].filter(Boolean);
        return milestoneDates.some(dateStr => {
          const d = new Date(dateStr);
          d.setHours(0,0,0,0);
          return d >= today && d <= next7Days;
        });
      }).length;

      // Update chrome badge
      if (upcomingCount > 0) {
        chrome.action.setBadgeText({ text: String(upcomingCount) });
        chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (err) {
      console.error('Error in syncBadge background worker:', err);
    }
  });
}

// Helper to refresh Google ID token
async function refreshAccessToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['refreshToken'], async (resStorage) => {
      if (!resStorage.refreshToken) {
        resolve(null);
        return;
      }
      try {
        const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: resStorage.refreshToken
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error('Refresh token invalid');
        }

        const { id_token, refresh_token } = data;
        chrome.storage.local.set({ idToken: id_token, refreshToken: refresh_token }, () => {
          resolve({ idToken: id_token, refreshToken: refresh_token });
        });
      } catch (err) {
        console.error('Failed to refresh token in background:', err);
        resolve(null);
      }
    });
  });
}
