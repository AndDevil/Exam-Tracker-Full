import React, { useState, useRef } from 'react';
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
  Sparkles
} from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const { exams, addExam } = useExams(user?.uid);
  
  const {
    permission: notificationStatus,
    token: fcmToken,
    loading: registeringNotifications,
    error: notificationError,
    requestPermission
  } = useNotifications(user?.uid);
  
  const [importStatus, setImportStatus] = useState('');
  const [importing, setImporting] = useState(false);
  
  const fileInputRef = useRef(null);

  // Request Notification Permissions
  const handleEnableNotifications = async () => {
    try {
      await requestPermission();
    } catch (err) {
      console.error(err);
    }
  };

  // Send a test notification locally (verifies permissions work)
  const handleTestNotification = () => {
    if (Notification.permission !== 'granted') {
      alert('Please enable notifications first!');
      return;
    }
    
    // Show local Notification in 1 second
    setTimeout(() => {
      new Notification('Exam Tracker Pro Test', {
        body: 'This is a test notification confirming your settings are active!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
      });
    }, 1000);
  };

  // Export Exams to JSON File
  const handleExportData = () => {
    if (exams.length === 0) {
      alert('You have no exams to export.');
      return;
    }
    
    // Filter out firestore-specific internal fields (like ServerTimestamp references) for export compatibility
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
  };

  // Trigger File Input Click
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Import Exams from JSON File
  const handleImportData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('');
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) {
          throw new Error('Invalid backup file. Root element must be an array.');
        }

        let importCount = 0;
        for (const item of data) {
          // Basic fields validation
          if (!item.name || !item.type) continue;
          
          await addExam({
            name: item.name,
            type: item.type === 'Private' ? 'Private' : 'Government',
            formStart: item.formStart || null,
            formEnd: item.formEnd || null,
            examDate: item.examDate || null,
            admitDate: item.admitDate || null,
            adUrl: item.adUrl || '',
            notes: item.notes || ''
          });
          importCount++;
        }

        setImportStatus(`Successfully imported ${importCount} exams!`);
      } catch (err) {
        console.error(err);
        setImportStatus(`Failed to import backup: ${err.message}`);
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
          Manage system configurations, data exports, and alerts.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center justify-between space-y-6">
          <div className="space-y-4 w-full">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-left">
              User Profile
            </h3>
            
            <img
              src={user?.photoURL || 'https://via.placeholder.com/150'}
              alt={user?.displayName}
              className="w-20 h-20 rounded-full mx-auto ring-4 ring-indigo-500/10 shadow"
              referrerPolicy="no-referrer"
            />
            
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-150 leading-tight">
                {user?.displayName}
              </h4>
              <p className="text-xs text-slate-450 dark:text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/45 text-red-600 dark:text-red-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors duration-150 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Notifications & Data Backup */}
        <div className="md:col-span-2 space-y-6">
          {/* Notifications config */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
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
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                  <button
                    onClick={handleTestNotification}
                    className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>Send Test Notification</span>
                  </button>
                  <p className="text-[10px] text-slate-450 dark:text-slate-550 leading-relaxed font-mono truncate">
                    FCM Token: {fcmToken || 'Retrieved & Stored in Firestore'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Backup Config */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-2">
              <FileJson size={14} />
              <span>Data Export & Backup</span>
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  JSON Backups
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Export all your exam schedules to a local JSON file, or restore them from an existing backup.
                </p>
              </div>

              {importStatus && (
                <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 border ${
                  importStatus.includes('Successfully')
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
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
                  className="flex-1 inline-flex items-center justify-center space-x-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-550/10 dark:hover:bg-indigo-550/20 text-indigo-600 dark:text-indigo-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors duration-150 cursor-pointer"
                >
                  <Upload size={14} />
                  <span>{importing ? 'Importing...' : 'Restore Backup'}</span>
                </button>

                {/* Hidden File Input */}
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
