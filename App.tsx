
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { PrepLevel, UserProfile } from './types';
import { db as mockDb } from './services/mockDb';
import { db as firebaseDb, auth } from './services/firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import PrepLevelWidget from './components/PrepLevelWidget';
import Ledger from './components/Ledger';
import ResumeReview from './components/ResumeReview';
import MockInterview from './components/MockInterview';
import ResumeQuiz from './components/ResumeQuiz';
import Auth from './components/Auth';
import Streaks from './components/Streaks';
import Leaderboard from './components/Leaderboard';
import Me from './components/Me';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeText, setResumeText] = useState<string>("");

  useEffect(() => {
    // 1. Initial local load for all users
    const saved = localStorage.getItem('campus_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      // If it's a Guest Mode user, we finish loading immediately as no cloud sync occurs
      if (parsed.uid && parsed.uid.startsWith('guest-')) {
        setLoading(false);
      }
    }

    // 2. Auth listener for Cloud (Email) users
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(firebaseDb, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const cloudUser = userDoc.data() as UserProfile;
            setUser(cloudUser);
            localStorage.setItem('campus_user', JSON.stringify(cloudUser));
          }
        } catch (e) {
          console.warn("Cloud Sync limited (Permissions).");
        }
      } else {
        // If logged out from Firebase, verify if we're in a local Guest session
        const local = localStorage.getItem('campus_user');
        if (local) {
          const parsed = JSON.parse(local);
          if (!parsed.uid || !parsed.uid.startsWith('guest-')) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuth = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem('campus_user', JSON.stringify(newUser));
    mockDb.saveUser(newUser); 
  };

  const handleUpdateUser = async (updated: UserProfile) => {
    let level = PrepLevel.BEGINNER;
    if (updated.streakWeeks >= 4) level = PrepLevel.PRO;
    else if (updated.streakWeeks >= 2) level = PrepLevel.ADVANCED;
    else if (updated.streakWeeks >= 1) level = PrepLevel.INTERMEDIATE;
    
    const finalUser = { ...updated, prepLevel: level };
    setUser(finalUser);
    localStorage.setItem('campus_user', JSON.stringify(finalUser));
    mockDb.saveUser(finalUser);

    // PERSISTENCE RULE: Only Email users sync to Firestore
    if (auth.currentUser && !finalUser.uid.startsWith('guest-')) {
      try {
        await setDoc(doc(firebaseDb, "users", finalUser.uid), finalUser);
      } catch (e) {
        console.warn("Cloud sync suppressed (Permissions).");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('campus_user');
    auth.signOut();
    setUser(null);
  };

  if (loading && !user) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Initializing Session...</p>
    </div>
  );

  if (!user) return <Auth onAuth={handleAuth} />;

  return (
    <HashRouter>
      <div className="min-h-screen pb-24 text-slate-200">
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-6 py-4 flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${user.uid.startsWith('guest-') ? 'bg-emerald-600' : 'bg-blue-600'} rounded-xl flex items-center justify-center shadow-lg`}>
              <i className="fas fa-graduation-cap text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white">Campus<span className={user.uid.startsWith('guest-') ? 'text-emerald-500' : 'text-blue-500'}>CLEAR</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className={`text-xs font-black uppercase tracking-widest ${user.uid.startsWith('guest-') ? 'text-emerald-500' : 'text-blue-500'}`}>{user.prepLevel}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">{user.uid.startsWith('guest-') ? 'Guest Mode' : user.college}</div>
            </div>
            <div className={`w-10 h-10 rounded-full overflow-hidden border ${user.uid.startsWith('guest-') ? 'border-emerald-500/30' : 'border-slate-700'}`}>
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} alt="avatar" />
            </div>
          </div>
        </header>

        <PrepLevelWidget user={user} />

        <main className="container mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/ledger" replace />} />
            <Route path="/ledger" element={<Ledger user={user} />} />
            <Route path="/practice" element={<PracticeWrapper child={<ResumeReview resumeText={resumeText} setResumeText={setResumeText} />} />} />
            <Route path="/mock-interview" element={<PracticeWrapper child={<MockInterview user={user} resumeText={resumeText} />} />} />
            <Route path="/quiz" element={<PracticeWrapper child={<ResumeQuiz resumeText={resumeText} />} />} />
            <Route path="/streaks" element={<Streaks user={user} onUpdate={handleUpdateUser} />} />
            <Route path="/ranks" element={<Leaderboard user={user} />} />
            <Route path="/me" element={<Me user={user} onLogout={handleLogout} />} />
          </Routes>
        </main>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 glass border border-white/20 p-2 rounded-[32px] flex items-center gap-1 shadow-2xl z-50">
          <NavLink to="/ledger" className={({isActive}) => `flex items-center gap-2 px-5 py-3 rounded-[24px] transition-all ${isActive ? (user.uid.startsWith('guest-') ? 'bg-emerald-600' : 'bg-blue-600') + ' text-white font-black' : 'text-slate-500'}`}>
            <i className="fas fa-search"></i> <span className="hidden lg:inline text-sm">Ledger</span>
          </NavLink>
          <NavLink to="/practice" className={({isActive}) => `flex items-center gap-2 px-5 py-3 rounded-[24px] transition-all ${isActive || window.location.hash.includes('mock') || window.location.hash.includes('quiz') ? (user.uid.startsWith('guest-') ? 'bg-emerald-600' : 'bg-blue-600') + ' text-white font-black' : 'text-slate-500'}`}>
            <i className="fas fa-brain"></i> <span className="hidden lg:inline text-sm">Coach</span>
          </NavLink>
          <NavLink to="/streaks" className={({isActive}) => `flex items-center gap-2 px-5 py-3 rounded-[24px] transition-all ${isActive ? 'bg-emerald-600 text-white font-black' : 'text-slate-500'}`}>
            <i className="fas fa-fire"></i> <span className="hidden lg:inline text-sm">Streak</span>
          </NavLink>
          <NavLink to="/ranks" className={({isActive}) => `flex items-center gap-2 px-5 py-3 rounded-[24px] transition-all ${isActive ? 'bg-amber-600 text-white font-black' : 'text-slate-500'}`}>
            <i className="fas fa-trophy"></i> <span className="hidden lg:inline text-sm">Ranks</span>
          </NavLink>
          <NavLink to="/me" className={({isActive}) => `flex items-center gap-2 px-5 py-3 rounded-[24px] transition-all ${isActive ? 'bg-slate-700 text-white font-black' : 'text-slate-500'}`}>
            <i className="fas fa-user"></i> <span className="hidden lg:inline text-sm">Me</span>
          </NavLink>
        </nav>
      </div>
    </HashRouter>
  );
};

const PracticeWrapper: React.FC<{child: React.ReactNode}> = ({ child }) => (
  <div className="max-w-4xl mx-auto py-8 px-4">
    <div className="flex flex-col md:flex-row gap-8">
      <div className="md:w-1/3 space-y-4">
        <h2 className="text-2xl font-bold mb-6 text-white">AI Coach</h2>
        <div className="flex flex-col gap-2">
          <NavLink to="/practice" className={({isActive}) => `p-4 rounded-2xl border transition-all ${isActive ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
            <div className="flex items-center gap-3"><i className="fas fa-file-pdf"></i><div className="text-left text-sm font-bold">Resume Review</div></div>
          </NavLink>
          <NavLink to="/mock-interview" className={({isActive}) => `p-4 rounded-2xl border transition-all ${isActive ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
            <div className="flex items-center gap-3"><i className="fas fa-video"></i><div className="text-left text-sm font-bold">Mock Interview</div></div>
          </NavLink>
          <NavLink to="/quiz" className={({isActive}) => `p-4 rounded-2xl border transition-all ${isActive ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
            <div className="flex items-center gap-3"><i className="fas fa-vial"></i><div className="text-left text-sm font-bold">Resume Quiz</div></div>
          </NavLink>
        </div>
      </div>
      <div className="flex-1">{child}</div>
    </div>
  </div>
);

export default App;
