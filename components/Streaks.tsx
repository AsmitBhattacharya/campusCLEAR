
import React, { useState, useEffect } from 'react';
import { UserProfile, Milestone } from '../types';

interface Props {
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
}

const Streaks: React.FC<Props> = ({ user, onUpdate }) => {
  const [newMilestone, setNewMilestone] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  const toggleDay = (idx: number) => {
    const updatedCheck = [...user.weeklyCheck];
    updatedCheck[idx] = !updatedCheck[idx];
    
    let newStreakWeeks = user.streakWeeks;
    let finalCheck = updatedCheck;

    // Check if the week is complete
    if (updatedCheck.every(Boolean)) {
      newStreakWeeks += 1;
      finalCheck = [false, false, false, false, false, false, false];
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 3000);
    }
    
    // Calculate total streak days: weeks completed * 7 + current ticks
    const currentWeekTicks = finalCheck.filter(Boolean).length;
    const totalStreakDays = (newStreakWeeks * 7) + currentWeekTicks;
    
    const updatedUser = { 
      ...user, 
      weeklyCheck: finalCheck, 
      streakWeeks: newStreakWeeks,
      streakDays: totalStreakDays
    };
    onUpdate(updatedUser);
  };

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    const m: Milestone = { id: Math.random().toString(36).substr(2, 9), title: newMilestone, completed: false };
    onUpdate({ ...user, milestones: [...user.milestones, m] });
    setNewMilestone('');
  };

  const toggleMilestone = (id: string) => {
    const updated = user.milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m);
    onUpdate({ ...user, milestones: updated });
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-black flex items-center gap-3">
          <span className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-500/20"><i className="fas fa-fire text-white"></i></span>
          Prep Journey
        </h2>
        {celebrate && (
          <div className="text-emerald-400 font-black text-xs uppercase tracking-widest animate-bounce">
            <i className="fas fa-star mr-2"></i> Week Milestone Reached!
          </div>
        )}
      </div>

      <div className={`glass rounded-3xl p-8 text-center space-y-6 transition-all duration-500 ${celebrate ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : ''}`}>
        <div className="flex flex-col gap-1">
          <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Active Prep Cycle</h3>
          <p className="text-[10px] text-slate-500 mb-2">Complete all 7 days to level up your streak week.</p>
        </div>
        
        <div className="flex justify-between items-center gap-2">
          {user.weeklyCheck.map((checked, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{dayNames[i]}</span>
              <button 
                onClick={() => toggleDay(i)}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 transform active:scale-90 ${checked ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 border-emerald-400' : 'bg-slate-800 text-slate-600 border border-slate-700 hover:border-slate-500'}`}>
                <i className={`fas ${checked ? 'fa-check' : 'fa-circle-dot'} text-xs md:text-sm`}></i>
              </button>
            </div>
          ))}
        </div>
        
        <div className="pt-6 border-t border-slate-800 flex justify-around items-center">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{user.streakDays}</div>
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Total Days</div>
          </div>
          <div className="w-px h-10 bg-slate-800"></div>
          <div className="text-center">
            <div className="text-3xl font-black text-emerald-500">{user.streakWeeks}</div>
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Streak Weeks</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-white"><i className="fas fa-bullseye text-blue-500"></i> Career Milestones</h3>
        <div className="flex gap-2">
          <input className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            placeholder="e.g. Master Binary Search Trees" value={newMilestone} onChange={e => setNewMilestone(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMilestone()} />
          <button onClick={addMilestone} className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">Add</button>
        </div>
        <div className="space-y-3">
          {user.milestones.map(m => (
            <div key={m.id} onClick={() => toggleMilestone(m.id)} className={`p-5 rounded-[24px] border flex items-center justify-between cursor-pointer transition-all hover:translate-x-1 ${m.completed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${m.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'}`}>
                  {m.completed && <i className="fas fa-check text-[10px] text-slate-900"></i>}
                </div>
                <span className={`text-sm font-medium ${m.completed ? 'line-through opacity-40' : ''}`}>{m.title}</span>
              </div>
              <i className="fas fa-arrow-right text-[10px] opacity-20"></i>
            </div>
          ))}
          {user.milestones.length === 0 && (
            <div className="text-center py-16 glass rounded-[32px] border-dashed border-slate-800">
              <i className="fas fa-tasks text-slate-800 text-4xl mb-4"></i>
              <p className="text-slate-600 font-medium text-sm">No active milestones. Start tracking your progress!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Streaks;
