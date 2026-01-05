
import React, { useState, useEffect } from 'react';
import { UserProfile, PrepLevel } from '../types';
import { BRANCHES } from '../constants';
import { auth, db } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface Props {
  onAuth: (user: UserProfile) => void;
}

type AuthView = 'MAIN' | 'EMAIL' | 'GUEST_ENTRY' | 'GUEST_OTP' | 'ONBOARDING';

const Auth: React.FC<Props> = ({ onAuth }) => {
  const [view, setView] = useState<AuthView>('MAIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form States
  const [emailData, setEmailData] = useState({ email: '', password: '' });
  const [guestData, setGuestData] = useState({ phone: '', otp: '' });
  const [onboardingData, setOnboardingData] = useState({
    displayName: '',
    branch: 'CSE',
    college: '',
    cgpa: 8.0,
    gradYear: 2025
  });

  const checkUserExists = async (uid: string) => {
    // Guest users (starting with guest-) only exist in localStorage
    if (uid.startsWith('guest-')) {
      const saved = localStorage.getItem('campus_user');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.uid === uid) {
          onAuth(data);
          return true;
        }
      }
      return false;
    }

    // Real Firebase users check the cloud
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        onAuth(data);
        return true;
      }
    } catch (e) {
      console.warn("Firestore check skipped for Guest Mode or restricted by rules.");
    }
    return false;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, emailData.email, emailData.password);
        setView('ONBOARDING');
      } else {
        const cred = await signInWithEmailAndPassword(auth, emailData.email, emailData.password);
        const exists = await checkUserExists(cred.user.uid);
        if (!exists) setView('ONBOARDING');
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestData.phone.length !== 10) {
      setError("Enter a 10-digit number for Guest Mode.");
      return;
    }
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      setView('GUEST_OTP');
    }, 800);
  };

  const handleGuestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    setTimeout(async () => {
      if (guestData.otp.length === 6) {
        const guestUid = `guest-${guestData.phone}`;
        const exists = await checkUserExists(guestUid);
        if (!exists) {
          setLoading(false);
          setView('ONBOARDING');
        }
      } else {
        setLoading(false);
        setError("Invalid code. Enter any 6 digits.");
      }
    }, 600);
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const uid = auth.currentUser?.uid || `guest-${guestData.phone}`;
    const isGuest = uid.startsWith('guest-');
    
    const newUser: UserProfile = {
      uid: uid,
      ...onboardingData,
      streakDays: 0,
      streakWeeks: 0,
      prepLevel: PrepLevel.BEGINNER,
      milestones: [],
      weeklyCheck: [false, false, false, false, false, false, false]
    };

    try {
      // PROHIBIT Cloud writes for Guest users
      if (!isGuest) {
        await setDoc(doc(db, "users", uid), newUser);
      }
      onAuth(newUser);
    } catch (err: any) {
      console.error("Cloud Write Blocked:", err);
      if (!isGuest) {
        setError("Cloud Database restricted. Try Guest Mode instead.");
        setLoading(false);
      } else {
        onAuth(newUser); // Guest mode proceeds regardless of cloud
      }
    }
  };

  const renderHeader = (title: string, subtitle: string, icon = "fa-graduation-cap", color = "bg-blue-600") => (
    <div className="text-center mb-8">
      <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl`}>
        <i className={`fas ${icon} text-white text-3xl`}></i>
      </div>
      <h1 className="text-3xl font-black text-white tracking-tighter mb-2">{title}</h1>
      <p className="text-slate-400 text-sm px-4">{subtitle}</p>
    </div>
  );

  const renderError = () => error && (
    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold text-center">
      <i className="fas fa-circle-exclamation mr-2"></i> {error}
    </div>
  );

  if (view === 'MAIN') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center p-6">
        {renderHeader("CampusCLEAR", "The college network for placement intelligence and prep.")}
        <div className="w-full max-w-sm space-y-4">
          <button onClick={() => {setView('EMAIL'); setError(null);}} className="w-full py-5 glass rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all font-bold group border-blue-500/20">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30"><i className="fas fa-envelope text-blue-400"></i></div>
            <div className="text-left"><div className="text-sm">Email Access</div><div className="text-[10px] text-slate-500 uppercase">Sync with Cloud</div></div>
          </button>
          <button onClick={() => {setView('GUEST_ENTRY'); setError(null);}} className="w-full py-5 glass rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all font-bold group border-emerald-500/20">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30"><i className="fas fa-user-secret text-emerald-400"></i></div>
            <div className="text-left"><div className="text-sm">Guest Mode</div><div className="text-[10px] text-slate-500 uppercase">Local Session (Simulation)</div></div>
          </button>
        </div>
      </div>
    );
  }

  if (view === 'EMAIL') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => setView('MAIN')} className="text-slate-500 hover:text-white mb-8 flex items-center gap-2 text-xs font-black uppercase"><i className="fas fa-arrow-left"></i> Back</button>
          {renderHeader(isSignUp ? "Sign Up" : "Sign In", "Access your cloud-synced placement dashboard.")}
          {renderError()}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input required type="email" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500" placeholder="student@college.edu" value={emailData.email} onChange={e => setEmailData({...emailData, email: e.target.value})} />
            <input required type="password" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" value={emailData.password} onChange={e => setEmailData({...emailData, password: e.target.value})} />
            <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg uppercase text-xs mt-2">{loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Login')}</button>
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-[10px] text-slate-500 uppercase font-black tracking-widest mt-4">{isSignUp ? "Have an account? Sign In" : "New student? Sign Up"}</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'GUEST_ENTRY') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => setView('MAIN')} className="text-slate-500 hover:text-white mb-8 flex items-center gap-2 text-xs font-black uppercase"><i className="fas fa-arrow-left"></i> Back</button>
          {renderHeader("Guest Mode", "Simulate login with any 10-digit number. Data stays on this device.", "fa-mobile-screen", "bg-emerald-600")}
          {renderError()}
          <form onSubmit={handleGuestEntry} className="space-y-6">
            <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">+91</span>
              <input required type="tel" maxLength={10} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 pl-14 outline-none focus:ring-2 focus:ring-emerald-500 tracking-[0.2em]" placeholder="9876543210" value={guestData.phone} onChange={e => setGuestData({...guestData, phone: e.target.value.replace(/\D/g, '')})} />
            </div>
            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase text-xs">Simulate OTP</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'GUEST_OTP') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => setView('GUEST_ENTRY')} className="text-slate-500 hover:text-white mb-8 flex items-center gap-2 text-xs font-black uppercase"><i className="fas fa-arrow-left"></i> Edit Number</button>
          {renderHeader("Verify Mode", "Enter any 6-digit code to complete the simulation.", "fa-key", "bg-emerald-600")}
          {renderError()}
          <form onSubmit={handleGuestOtp} className="space-y-6 text-center">
            <input autoFocus required type="text" maxLength={6} className="w-full bg-slate-800/30 border-b-4 border-emerald-500 p-6 outline-none text-center text-4xl font-black tracking-[0.5em] text-emerald-400" placeholder="000000" value={guestData.otp} onChange={e => setGuestData({...guestData, otp: e.target.value.replace(/\D/g, '')})} />
            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase text-xs">Enter as Guest</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] overflow-y-auto p-6">
      <div className="max-w-md mx-auto py-12">
        <h2 className="text-3xl font-black mb-2">Campus Profile</h2>
        <p className="text-slate-500 text-sm mb-12">Set up your local or cloud profile to begin.</p>
        <form onSubmit={handleOnboarding} className="space-y-6">
          <input required placeholder="Display Name" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none" value={onboardingData.displayName} onChange={e => setOnboardingData({...onboardingData, displayName: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <select className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4" value={onboardingData.branch} onChange={e => setOnboardingData({...onboardingData, branch: e.target.value})}>{BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}</select>
            <input required type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4" value={onboardingData.gradYear} onChange={e => setOnboardingData({...onboardingData, gradYear: parseInt(e.target.value)})} />
          </div>
          <input required placeholder="College" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4" value={onboardingData.college} onChange={e => setOnboardingData({...onboardingData, college: e.target.value})} />
          <input required type="number" step="0.1" max="10" placeholder="CGPA" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4" value={onboardingData.cgpa} onChange={e => setOnboardingData({...onboardingData, cgpa: parseFloat(e.target.value)})} />
          <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs mt-4">Start Preparation</button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
