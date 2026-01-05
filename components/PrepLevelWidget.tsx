
import React from 'react';
import { UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

const PrepLevelWidget: React.FC<Props> = ({ user }) => {
  const isGlowing = user.streakDays >= 7;

  return (
    <div className={`fixed top-4 right-4 z-50 glass p-4 rounded-2xl w-48 transition-all duration-300 ${isGlowing ? 'prep-glow border-emerald-500/50' : ''}`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Prep Level</span>
          <i className={`fas fa-bolt ${isGlowing ? 'text-emerald-400' : 'text-slate-500'}`}></i>
        </div>
        <div className="text-xl font-bold text-white">{user.prepLevel}</div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex -space-x-1">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full ${i < (user.streakDays % 8) ? 'bg-emerald-500' : 'bg-slate-700'}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-400 font-medium uppercase">{user.streakDays} Day Streak</span>
        </div>
        <div className="mt-1 text-[10px] text-slate-500 italic">
          {user.streakWeeks} Weeks Consistent
        </div>
      </div>
    </div>
  );
};

export default PrepLevelWidget;
