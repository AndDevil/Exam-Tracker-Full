const API_KEY = 'AIzaSyCAuR16--1J9FdogiMAI9kglujTmssuink';
const PROJECT_ID = 'exam-tracker-pro-87b3d';

const syncStatusEl = document.getElementById('sync-status');
const loginViewEl = document.getElementById('login-view');
const loginErrorEl = document.getElementById('login-error');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const mainViewEl = document.getElementById('main-view');
const examsListEl = document.getElementById('exams-list');
const logoutBtn = document.getElementById('logout-btn');

// Show status
const updateStatus = (text, isOnline = true) => {
  if (syncStatusEl) {
    syncStatusEl.textContent = text;
    syncStatusEl.style.backgroundColor = isOnline ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    syncStatusEl.style.color = isOnline ? '#34d399' : '#ef4444';
  }
};

// Map Firestore doc
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

// Check if user is logged in
const checkAuthState = async () => {
  chrome.storage.local.get(['idToken', 'userId', 'email'], async (result) => {
    if (result.idToken && result.userId) {
      showMainView();
      await fetchAndRenderExams(result.idToken, result.userId);
    } else {
      showLoginView();
    }
  });
};

const showLoginView = () => {
  loginViewEl.classList.remove('hidden');
  mainViewEl.classList.add('hidden');
  updateStatus('Offline', false);
};

const showMainView = () => {
  loginViewEl.classList.add('hidden');
  mainViewEl.classList.remove('hidden');
  updateStatus('Synced', true);
};

// Perform Login
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Please fill in both email and password.');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';
  loginErrorEl.classList.add('hidden');

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Authentication failed');
    }

    const { idToken, localId, refreshToken } = data;
    chrome.storage.local.set({ idToken, userId: localId, refreshToken, email }, () => {
      showMainView();
      fetchAndRenderExams(idToken, localId);
      // Trigger background update
      chrome.runtime.sendMessage({ action: 'syncBadge' });
    });
  } catch (err) {
    showError(err.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
});

// Perform Logout
logoutBtn.addEventListener('click', () => {
  chrome.storage.local.clear(() => {
    showLoginView();
    chrome.action.setBadgeText({ text: '' });
  });
});

const showError = (msg) => {
  loginErrorEl.textContent = msg;
  loginErrorEl.classList.remove('hidden');
};

// Fetch Exams
const fetchAndRenderExams = async (idToken, userId) => {
  examsListEl.innerHTML = '<div class="empty-state">Loading schedules...</div>';
  
  try {
    let res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/exams`, {
      headers: { 'Authorization': `Bearer ${idToken}` }
    });

    if (res.status === 401) {
      // Try refresh token
      const newTokens = await refreshAccessToken();
      if (newTokens) {
        return fetchAndRenderExams(newTokens.idToken, userId);
      } else {
        showLoginView();
        return;
      }
    }

    if (!res.ok) {
      throw new Error('Failed to fetch exam schedules');
    }

    const data = await res.json();
    const docs = data.documents || [];
    const exams = docs.map(mapFirestoreDoc);

    renderExamsList(exams);
  } catch (err) {
    console.error(err);
    examsListEl.innerHTML = `<div class="empty-state" style="color: #ef4444;">${err.message || 'Error loading exams'}</div>`;
    updateStatus('Error', false);
  }
};

// Refresh Access Token
const refreshAccessToken = async () => {
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
        console.error('Failed to refresh token:', err);
        resolve(null);
      }
    });
  });
};

// Render List
const renderExamsList = (exams) => {
  examsListEl.innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);

  // Filter exams that have milestone dates (formEnd or examDate) in next 7 days
  const upcomingExams = exams.filter(exam => {
    const milestoneDates = [exam.examDate, exam.formEnd, exam.admitDate].filter(Boolean);
    return milestoneDates.some(dateStr => {
      const d = new Date(dateStr);
      d.setHours(0,0,0,0);
      return d >= today && d <= next7Days;
    });
  });

  if (upcomingExams.length === 0) {
    examsListEl.innerHTML = '<div class="empty-state">No upcoming exam milestones in the next 7 days.</div>';
    return;
  }

  // Sort upcoming exams by earliest milestone in next 7 days
  upcomingExams.sort((a, b) => {
    const getEarliestMilestone = (exam) => {
      const dates = [exam.examDate, exam.formEnd, exam.admitDate]
        .filter(Boolean)
        .map(d => new Date(d).getTime())
        .filter(t => t >= today.getTime());
      return dates.length > 0 ? Math.min(...dates) : Infinity;
    };
    return getEarliestMilestone(a) - getEarliestMilestone(b);
  });

  upcomingExams.forEach(exam => {
    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = exam.name;

    const meta = document.createElement('div');
    meta.className = 'card-meta';

    const badge = document.createElement('span');
    badge.className = `type-badge ${exam.type === 'Government' ? 'type-govt' : 'type-private'}`;
    badge.textContent = exam.type;

    const dateText = document.createElement('span');
    if (exam.examDate) {
      dateText.textContent = `Exam: ${exam.examDate}`;
    } else if (exam.formEnd) {
      dateText.textContent = `End: ${exam.formEnd}`;
    } else {
      dateText.textContent = 'Active';
    }

    meta.appendChild(badge);
    meta.appendChild(dateText);
    card.appendChild(title);
    card.appendChild(meta);
    
    // Clicking card opens the web app page for it
    card.addEventListener('click', () => {
      chrome.tabs.create({ url: `https://exam-tracker-pro-87b3d.web.app/exam/${exam.id}` });
    });
    card.style.cursor = 'pointer';

    examsListEl.appendChild(card);
  });
};

// Init
checkAuthState();
