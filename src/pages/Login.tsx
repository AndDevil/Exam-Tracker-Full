import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, ShieldAlert, Wifi, Bell, Calendar, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, loginDemo } = useAuth();
  const [error, setError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  const handleLogin = async () => {
    try {
      setError('');
      setAuthenticating(true);
      await login();
      toast.success('Successfully logged in!');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in your Firebase console. Please go to Build > Authentication > Sign-in method and enable the Google provider.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain/port is not authorized for OAuth operations. Go to Firebase Console > Authentication > Settings > Authorized domains and add this URL.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('The authentication window was closed before completion. Please try again.');
      } else {
        setError(err.message || 'Failed to authenticate. Please check your network connection and .env settings.');
      }
    } finally {
      setAuthenticating(false);
    }
  };

  const handleDemoLogin = () => {
    loginDemo();
    toast.success('Entering Guest Demo Mode! Local modifications allowed.');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden text-slate-100 font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

      <div className="relative z-10 w-full max-w-5xl px-6 py-12 grid md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-7 flex flex-col space-y-6 text-left">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-full text-xs font-semibold w-fit">
            <Sparkles size={14} className="animate-pulse" />
            <span>Introducing Exam Tracker Pro v2</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
            Never miss an <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Exam Deadline
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg max-w-lg leading-relaxed">
            Manage government and private exam dates, form submission start/end dates, admit cards, and alerts. Full offline caching and real-time synchronization.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-lg pt-4">
            <div className="flex items-start space-x-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-md">
                <Wifi size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Offline First</h3>
                <p className="text-xs text-slate-400 mt-0.5">Access and add records offline. Auto-syncs when online.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-md">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Push Notifications</h3>
                <p className="text-xs text-slate-400 mt-0.5">Receive reminders 2 days before deadline dates.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
              <div className="p-2 bg-pink-500/10 text-pink-400 rounded-md">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Interactive Calendar</h3>
                <p className="text-xs text-slate-400 mt-0.5">Visual timeline and calendar dashboard layout.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-md">
                <GraduationCap size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Smart Tracking</h3>
                <p className="text-xs text-slate-400 mt-0.5">Government & Private exam tags with countdown badges.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/80 p-8 rounded-2xl shadow-2xl relative">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                <GraduationCap size={40} />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Get Started</h2>
                <p className="text-slate-400 text-sm mt-1">Sign in or explore the app instantly</p>
              </div>

              {error && (
                <div className="w-full flex items-start space-x-2 text-left bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="w-full space-y-3">
                <button
                  onClick={handleLogin}
                  disabled={authenticating}
                  className="w-full flex items-center justify-center space-x-3 bg-slate-100 hover:bg-white text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md disabled:opacity-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer active:scale-[0.98]"
                >
                  {authenticating ? (
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 0, 0)">
                          <path d="M21.35,11.1H12v2.7h5.38C17,15.11 15.82,16.53 14,17.43v2.85h3.6c2.1-1.93 3.3-4.78 3.3-8.08c0,-0.38 -0.04,-0.75 -0.1,-1.1z" fill="#4285F4" />
                          <path d="M12,20.5c2.7,0 4.96,-0.9 6.6,-2.42l-3.6,-2.85c-1,0.67 -2.28,1.07 -3.6,1.07c-2.77,0 -5.12,-1.87 -5.96,-4.38H1.7v3.08c1.7,3.38 5.2,5.58 8.8,5.58z" fill="#34A853" />
                          <path d="M6.04,11.92a6.3,6.3 0 0 1 0,-3.84V5H1.7a11.98,11.98 0 0 0 0,10l4.34,-3.08z" fill="#FBBC05" />
                          <path d="M12,3.5c1.47,0 2.8,0.5 3.84,1.52l2.87,-2.87C16.96,0.8 14.7,0 12,0c-3.6,0 -7.1,2.2 -8.8,5.58L7.54,8.66c0.84,-2.51 3.19,-4.38 5.96,-4.38z" fill="#EA4335" />
                        </g>
                      </svg>
                      <span>Sign in / Register with Google</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDemoLogin}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600/90 hover:bg-indigo-650 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer active:scale-[0.98] border border-indigo-500/20"
                >
                  <Sparkles size={16} />
                  <span>Explore Live Demo (Guest)</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/40 w-full">
                Use Google for cloud sync, or explore with a sandbox guest profile.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
