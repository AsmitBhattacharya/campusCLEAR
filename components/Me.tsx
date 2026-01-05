
import React from 'react';
import { UserProfile } from '../types';

interface Props {
  user: UserProfile;
  onLogout: () => void;
}

const Me: React.FC<Props> = ({ user, onLogout }) => {
  const isGuest = user.uid.startsWith('guest-');

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`w-32 h-32 rounded-3xl bg-slate-800 p-1 border-2 ${isGuest ? 'border-emerald-500 shadow-emerald-500/20' : 'border-blue-500 shadow-blue-500/20'} shadow-2xl`}>
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} className="w-full h-full rounded-[20px]" />
        </div>
        <div>
          <h2 className="text-3xl font-black">{user.displayName}</h2>
          <p className={`${isGuest ? 'text-emerald-400' : 'text-blue-400'} font-bold`}>{user.prepLevel} Candidate</p>
          {isGuest && (
            <div className="mt-2 inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase text-emerald-500 tracking-widest">
              <i className="fas fa-user-secret mr-1"></i> Guest Mode Active
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-6 rounded-3xl text-center">
          <div className="text-2xl font-black">{user.cgpa}</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Current CGPA</div>
        </div>
        <div className="glass p-6 rounded-3xl text-center">
          <div className="text-2xl font-black">{user.gradYear}</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Grad Year</div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 space-y-6">
        <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest border-b border-slate-700 pb-4">Academic Details</h3>
        <div className="space-y-4">
           <div className="flex justify-between items-center">
             <span className="text-slate-400 text-sm">Branch</span>
             <span className="font-bold">{user.branch}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-slate-400 text-sm">College</span>
             <span className="font-bold">{isGuest ? 'Simulated Campus' : user.college}</span>
           </div>
           {isGuest && (
             <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
               <p className="text-[10px] text-amber-500 font-bold leading-relaxed uppercase">
                 <i className="fas fa-triangle-exclamation mr-1"></i> Data Preservation Warning: 
                 <br/><span className="text-slate-400 font-medium normal-case">In Guest Mode, your data is saved only on this device. Clearing browser cache will reset your progress.</span>
               </p>
             </div>
           )}
        </div>
      </div>

      <button onClick={onLogout} className="w-full py-4 glass border-rose-500/20 text-rose-500 font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-rose-500/10 transition-all">
        <i className="fas fa-sign-out-alt"></i> Exit {isGuest ? 'Guest Mode' : 'CampusCLEAR'}
      </button>
    </div>
  );
};

export default Me;
