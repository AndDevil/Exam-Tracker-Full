import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExams } from '../hooks/useExams';
import { useNotifications } from '../hooks/useNotifications';
import { 
  Bell, 
  Download, 
  Upload, 
  LogOut, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  FileJson,
  Sparkles,
  Mail
} from 'lucide-react';
import { importExamsSchema } from '../utils/validation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, logout } = useAuth();
  const { exams, addExam } = useExams(user?.uid, user?.isDemo);
  
  const {
    permission: notificationStatus,
    token: fcmToken,
    loading: registeringNotifications,
    error: notificationError,
    requestPermission
  } = useNotifications(user?.uid);
  
  const [importStatus, setImportStatus] = useState('');
  const [importing, setImporting] = useState(false);
  
  // Email settings states
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load User Email Notification settings
  useEffect(() => {
    if (!user || user.isDemo) return;
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setEmailNotifications(data.emailNotifications || false);
          setEmailAddress(data.emailAddress || user.email || '');
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      }
    };
    loadSettings();
  }, [user]);

  const handleEnableNotifications = async () => {
    try {
      await requestPermission();
      toast.success('Push notifications active!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Permission failed.');
    }
  };

  const handleTestNotification = () => {
    if (Notification.permission !== 'granted') {
      toast.error('Please enable notifications first!');
      return;
    }
    
    setTimeout(() => {
      new Notification('Exam Tracker Pro Test', {
        body: 'This is a test notification confirming your settings are active!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
      });
    }, 1000);
  };

  const handleSaveEmailSettings = async () => {
    if (!user) return;
    try {
      setSavingSettings(true);
      if (user.isDemo) {
        toast.error('Guest Session: Local settings changes are read-only.');
        return;
      }
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        emailNotifications,
        emailAddress: emailAddress.trim()
      }, { merge: true });
      toast.success('Email alert preferences saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update preferences.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportData = () => {
    if (exams.length === 0) {
      toast.error('You have no exams to export.');
      return;
    }
    
    const cleanExams = exams.map(({ id, userId, createdAt, updatedAt, ...rest }) => rest);
    const jsonString = JSON.stringify(cleanExams, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('JSON backup exported successfully.');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('');
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validate JSON Schema
        const validated = importExamsSchema.safeParse(parsed);
        if (!validated.success) {
          throw new Error(validated.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', '));
        }

        const dataList = validated.data;
        const confirmMsg = `Found ${dataList.length} exams in backup. Would you like to import them?\n\nExams:\n` + 
          dataList.map((ex, i) => `${i+1}. ${ex.name} (${ex.type})`).slice(0, 5).join('\n') + 
          (dataList.length > 5 ? `\n...and ${dataList.length - 5} more` : '');

        if (window.confirm(confirmMsg)) {
          let importCount = 0;
          for (const item of dataList) {
            await addExam({
              name: item.name,
              type: item.type,
              formStart: item.formStart || null,
              formEnd: item.formEnd || null,
              examDate: item.examDate || null,
              admitDate: item.admitDate || null,
              adUrl: item.adUrl || '',
              notes: item.notes || '',
              isRecurring: item.isRecurring || false,
              recurrenceRule: item.recurrenceRule || ''
            });
            importCount++;
          }
          toast.success(`Imported ${importCount} exams successfully!`);
          setImportStatus(`Successfully restored ${importCount} exams!`);
        }
      } catch (err: any) {
        console.error(err);
        setImportStatus(`Failed to import backup: ${err.message}`);
        toast.error('Import failed. JSON format mismatch.');
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Application Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Manage system configurations, backups, and fallback notifications.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center justify-between space-y-6">
          <div className="space-y-4 w-full">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-left">
              User Profile
            </h3>
            
            <img
              src={user?.photoURL || 'https://via.placeholder.com/150'}
              alt={user?.displayName || 'User'}
              className="w-20 h-20 rounded-full mx-auto ring-4 ring-indigo-500/10 shadow"
              referrerPolicy="no-referrer"
            />
            
            <div className="overflow-hidden">
              <h4 className="font-bold text-slate-850 dark:text-slate-150 leading-tight truncate">
                {user?.displayName || 'Demo Guest'}
              </h4>
              <p className="text-xs text-slate-450 dark:text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors duration-150 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Configurations Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Push Notifications Settings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-2">
              <Bell size={14} />
              <span>Push Notification Settings</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Reminders Alert System
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    Receive daily automatic push notifications on your device 2 days before any exam deadline, admit card release, or exam date.
                  </p>
                </div>

                <div className="shrink-0 pt-1">
                  {notificationStatus === 'granted' ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle size={12} />
                      <span>Enabled</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleEnableNotifications}
                      disabled={registeringNotifications}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-55 cursor-pointer"
                    >
                      {registeringNotifications ? 'Enabling...' : 'Enable Alerts'}
                    </button>
                  )}
                </div>
              </div>

              {notificationError && (
                <div className="flex items-start space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
                  <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                  <span>{notificationError}</span>
                </div>
              )}

              {notificationStatus === 'granted' && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleTestNotification}
                    className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-705 dark:text-slate-300 font-bold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>Send Test Notification</span>
                  </button>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-mono truncate">
                    FCM Token: {fcmToken || 'Retrieved & Stored in Firestore'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Email Fallback Configuration */}
          {!user?.isDemo && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-2">
                <Mail size={14} />
                <span>Email Fallback Reminders</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Email Alerts (Free Fallback)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                      Automatically receive email alerts if push notifications are blocked or fail to deliver on your devices.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer mt-1"
                  />
                </div>

                {emailNotifications && (
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Destination Email
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="alert@yourdomain.com"
                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none transition-colors"
                      />
                      <button
                        onClick={handleSaveEmailSettings}
                        disabled={savingSettings}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-55 cursor-pointer"
                      >
                        {savingSettings ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Backup Management */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-2">
              <FileJson size={14} />
              <span>Data Export & Backup</span>
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  JSON Backup Management
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Export all your exam schedules to a local JSON file, or restore them from an existing backup with full verification.
                </p>
              </div>

              {importStatus && (
                <div className={`p-3.5 rounded-xl text-xs flex items-start space-x-2 border ${
                  importStatus.includes('Successfully')
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-650 dark:text-red-400'
                }`}>
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{importStatus}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleExportData}
                  className="flex-1 inline-flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors duration-150 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Export Backup</span>
                </button>

                <button
                  onClick={handleImportClick}
                  disabled={importing}
                  className="flex-1 inline-flex items-center justify-center space-x-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors duration-150 cursor-pointer border border-indigo-200/20"
                >
                  <Upload size={14} />
                  <span>{importing ? 'Importing...' : 'Restore Backup'}</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportData}
                  accept=".json"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
