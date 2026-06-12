# Exam Tracker Pro (v2)

Exam Tracker Pro is a production-ready, portfolio-worthy Progressive Web App (PWA) built with React, Vite, and Tailwind CSS. Backed by Firebase, it provides a seamless user experience to track application forms, admit card releases, and exam dates.

## 🚀 Key Features
- **Secure Authentication**: Google Sign-In powered by Firebase Authentication.
- **Real-Time Data Sync**: Firestore real-time snapshots with offline-first local persistence (auto-syncs when reconnecting).
- **Interactive Calendar**: Event tags showing application deadlines, start dates, admit card releases, and test days.
- **Smart Countdown Badges**: Color-coded badges indicating upcoming milestones, tomorrow, today, or expired states.
- **Automated Push Notifications**: Background service worker integrated with FCM. A scheduled daily Cloud Function alerts users 2 days before any scheduled milestone.
- **JSON Export & Restore**: Allows manual backup of data to local files and immediate parsing/restoration.
- **Polished UX**: Class-based Dark Mode, responsive layouts (mobile bottom tab-bar), and beautiful loading skeletons.

---

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Date-fns, React Calendar, React Router DOM
- **Validation**: React Hook Form, Zod schema resolver
- **State Management**: TanStack React Query (server-state & query cache)
- **Backend & Serverless**: Firebase Auth, Firestore, Cloud Messaging, Hosting, and Cloud Functions (Node.js 18, V2 Scheduled triggers)

---

## ⚙️ Setup Instructions

### 1. Firebase Project Configuration
1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add project** to create a project named `exam-tracker-pro`.
2. **Enable Authentication**:
   - Navigate to **Build > Authentication** and click **Get Started**.
   - Under **Sign-in method**, choose **Google**, enable it, select a support email, and save.
3. **Enable Firestore Database**:
   - Go to **Build > Firestore Database** and click **Create database**.
   - Start in **Test Mode** (or select default locations).
4. **Register Web App**:
   - Go to **Project Settings** (gear icon) > **General**.
   - Click the **Web (</>)** icon, register your app, and copy the `firebaseConfig` credentials.
5. **Get VAPID Key for Notifications**:
   - Go to **Project Settings > Cloud Messaging**.
   - Under **Web configuration**, look for **Web Push certificates** and click **Generate key pair**.
   - Copy this key; it will be your `VITE_FIREBASE_VAPID_KEY`.

---

### 2. Local Setup & Environment
1. Clone the repository and navigate to the project root:
   ```bash
   cd "Exam Tracker Full"
   ```
2. Install the node packages:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Create a `.env` file in the root directory by copying the `.env.example` template:
   ```bash
   copy .env.example .env
   ```
4. Open the `.env` file and populate it with your Firebase client configuration details:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=exam-tracker-pro.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=exam-tracker-pro
   VITE_FIREBASE_STORAGE_BUCKET=exam-tracker-pro.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:12345:web:abcd
   VITE_FIREBASE_MEASUREMENT_ID=G-ABCDE
   VITE_FIREBASE_VAPID_KEY=BM_long_vapid_public_key_string...
   ```
5. Open `public/firebase-messaging-sw.js` and replace the placeholder fields inside the `firebase.initializeApp()` config block with the corresponding values from your `.env` file. (The critical value is `messagingSenderId` so the device registers background notifications correctly).

---

### 3. Running Locally
To launch the developer web server locally:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 4. Setting up Firebase Cloud Functions
The scheduled Cloud Function sends automated notifications 2 days prior to any exam dates.

1. Make sure you have the Firebase CLI tools installed globally:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in to your Firebase account via CLI:
   ```bash
   firebase login
   ```
3. Use the CLI to bind your local repository to your Firebase project:
   ```bash
   firebase use --add
   ```
   Select your created Firebase project from the list.
4. Navigate into the `functions` folder and install its dependencies:
   ```bash
   cd functions
   npm install
   cd ..
   ```
5. Deploy Cloud Functions and Security Rules to Firebase:
   ```bash
   firebase deploy --only functions,firestore:rules
   ```

---

### 5. Production Build & Hosting Deployment
To build the static PWA assets and deploy the frontend to Firebase Hosting:
1. Compile the build bundles:
   ```bash
   npm run build
   ```
2. Deploy the web assets to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
3. Once completed, the CLI will output your live Hosting URL (e.g. `https://exam-tracker-pro.web.app`).

---

## 🔒 Firestore Security Rules
The database operates under user-isolation policies declared in `firestore.rules`. Users can only perform CRUD operations on their own documents:
```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  
  match /exams/{examId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
```
