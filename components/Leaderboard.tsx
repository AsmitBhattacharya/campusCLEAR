
import React from 'react';
import { db } from '../services/mockDb';
import { UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

const Leaderboard: React.FC<Props> = ({ user }) => {
  const rankings = db.getRankings(user.college);
  
  // Find user's actual rank index
  const userRankIndex = rankings.findIndex(u => u.uid === user.uid);
  const userRank = userRankIndex + 1;

  // Icons for top 3
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <i className="fas fa-trophy text-amber-400 text-lg"></i>;
      case 1: return <i className="fas fa-medal text-slate-300 text-lg"></i>;
      case 2: return <i className="fas fa-medal text-amber-600 text-lg"></i>;
      default: return <span className="text-slate-500 font-black text-sm">{index + 1}</span>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <i className="fas fa-chart-line text-white"></i>
            </div>
            <h2 className="text-3xl font-black tracking-tight">Campus Ranks</h2>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Competitive leaderboard for <span className="text-blue-400 font-bold">{user.college}</span>
          </p>
        </div>
        
        <div className="glass px-6 py-3 rounded-2xl flex items-center gap-4">
          <div className="text-center border-r border-slate-700 pr-4">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Your Rank</div>
            <div className="text-xl font-black text-blue-400">#{userRank}</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Percentile</div>
            <div className="text-xl font-black text-emerald-400">
              {Math.round(((rankings.length - userRankIndex) / rankings.length) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Card */}
      <div className="glass rounded-[32px] overflow-hidden shadow-2xl border border-white/5">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-6 py-4 bg-slate-800/40 border-b border-slate-700/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <div className="col-span-2 text-center">Position</div>
          <div className="col-span-6">Candidate</div>
          <div className="col-span-4 text-right">Streak Consistency</div>
        </div>

        {/* Scrollable List */}
        <div className="divide-y divide-slate-800/50 max-h-[60vh] overflow-y-auto">
          {rankings.map((u, i) => {
            const isMe = u.uid === user.uid;
            return (
              <div 
                key={u.uid} 
                className={`grid grid-cols-12 items-center px-6 py-5 transition-all relative group ${
                  isMe ? 'bg-blue-600/10' : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* Visual indicator for current user */}
                {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
                
                {/* Rank Column */}
                <div className="col-span-2 flex justify-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    i < 3 ? 'bg-slate-800/80 border border-slate-700' : ''
                  }`}>
                    {getRankIcon(i)}
                  </div>
                </div>

                {/* Profile Column */}
                <div className="col-span-6 flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-transform group-hover:scale-105 ${
                      isMe ? 'border-blue-500' : 'border-slate-700'
                    }`}>
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.displayName}`} 
                        alt="avatar" 
                        className="w-full h-full bg-slate-800"
                      />
                    </div>
                    {u.prepLevel === 'Pro' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                        <i className="fas fa-check text-[6px] text-white"></i>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${isMe ? 'text-blue-400' : 'text-slate-100'}`}>
                        {u.displayName}
                      </span>
                      {isMe && (
                        <span className="text-[8px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-blue-500/20">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{u.branch}</span>
                      <span className="text-slate-700 text-[10px]">•</span>
                      <span className={`text-[10px] font-bold ${
                        u.prepLevel === 'Pro' ? 'text-emerald-500' : 
                        u.prepLevel === 'Advanced' ? 'text-blue-400' : 'text-slate-500'
                      }`}>
                        {u.prepLevel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Column */}
                <div className="col-span-4 text-right">
                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-lg font-black ${isMe ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {u.streakWeeks}
                      </span>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Weeks</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <i className="fas fa-fire text-amber-500 text-[8px]"></i>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{u.streakDays} Days Total</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {rankings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 border border-slate-700">
                <i className="fas fa-users-slash text-2xl"></i>
              </div>
              <div>
                <p className="text-slate-400 font-bold">No active students found</p>
                <p className="text-slate-600 text-xs">Be the first to start the streak in your campus!</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Stats */}
        <div className="p-4 bg-slate-900/40 border-t border-slate-800 flex justify-center">
           <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">
             Live Campus Pulse • Updated Every Session
           </p>
        </div>
      </div>

      {/* Competitive CTA */}
      {userRank > 3 && (
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400">
            <i className="fas fa-arrow-trend-up text-xl"></i>
          </div>
          <div>
            <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-1">Climb the Ranks</h4>
            <p className="text-xs text-slate-400">Complete <span className="text-white font-bold">7 sessions</span> this week to jump past the next candidate!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
