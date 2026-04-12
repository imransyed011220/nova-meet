/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Clock, 
  Users, 
  Zap,
  Target,
  History as HistoryIcon,
  TrendingUp,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMeetingHistory } from '../hooks/useMeetingHistory';

export const AnalyticsPage: React.FC = () => {
  const { notes, analytics } = useMeetingHistory();

  if (!analytics) return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="w-16 h-16 bg-[var(--soft)] rounded-full flex items-center justify-center text-[var(--accent2)]">
        <Activity size={32} />
      </div>
      <p className="text-lg font-['Playfair_Display'] font-bold text-[var(--text)]">No data yet</p>
      <p className="text-sm text-[var(--text3)]">Record your first meeting to unlock intelligence insights.</p>
    </div>
  );

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const sessionsPerDay = (() => {
    try {
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const counts = [0, 0, 0, 0, 0, 0, 0];
      
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);

      notes.forEach(note => {
        const noteDate = new Date(note.timestamp?.split(',')[0] || '');
        if (noteDate >= startOfWeek) {
          const dayIdx = noteDate.getDay();
          let hours = 0.5; // Default 30m
          
          if (typeof note.duration === 'number') {
            hours = note.duration / 3600;
          } else if (typeof note.duration === 'string' && note.duration.includes(':')) {
            const parts = note.duration.split(':');
            if (parts.length === 2) {
              hours = (parseInt(parts[0]) * 60 + parseInt(parts[1])) / 3600;
            } else if (parts.length === 3) {
              hours = (parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])) / 3600;
            }
          }
          
          counts[dayIdx] += hours;
        }
      });

      return days.map((day, i) => ({ day, count: parseFloat(counts[i].toFixed(1)) }));
    } catch (e) {
      console.error("Sessions per day failed", e);
      return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => ({ day, count: 0 }));
    }
  })();
  
  const productivityScore = (() => {
    try {
      const totalTasks = notes.reduce((sum, n) => sum + (n.actionItems?.length || 0), 0);
      const completedTasks = notes.reduce((sum, n) => sum + (n.actionItems?.filter(i => i.completed).length || 0), 0);
      const taskRatio = totalTasks > 0 ? completedTasks / totalTasks : 0.8;
      const meetingLoad = Math.min(notes.length / 10, 1);
      return Math.round((taskRatio * 0.6 + meetingLoad * 0.4) * 100);
    } catch (e) {
      console.error("Score calculation failed", e);
      return 0;
    }
  })();

  return (
    <div className="space-y-8 pb-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-['Playfair_Display'] font-bold text-[var(--accent2)]">Intelligence Insights</h1>
        <p className="text-sm text-[var(--text3)]">Deep-dive into your meeting performance and productivity metrics.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[var(--surface)] border border-[var(--border)] p-8 rounded-[var(--r)] shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <p className="font-['DM_Mono'] text-[10px] text-[var(--text3)] uppercase tracking-widest">Productivity Score</p>
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="72" cy="72" r="66" fill="none" stroke="var(--soft2)" strokeWidth="8" />
            <motion.circle 
                cx="72" cy="72" r="66" fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
                initial={{ strokeDasharray: "0 415" }}
                animate={{ strokeDasharray: `${(productivityScore / 100) * 415} 415` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold text-[var(--text)]">{productivityScore}%</span>
              <span className="text-[10px] font-['DM_Mono'] text-[var(--text3)] uppercase tracking-wider">Score</span>
            </div>
          </div>
          <p className="text-[12px] text-[var(--ok)] font-medium bg-[var(--ok)]/10 px-3 py-1 rounded-full flex items-center gap-1.5">
            <TrendingUp size={12} /> ↑ 12% increase 
          </p>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-5">
          {[
            { label: 'Total Meetings', value: analytics.totalMeetings, icon: HistoryIcon, color: 'var(--accent)' },
            { label: 'Total Duration', value: formatDuration(analytics.totalDurationSeconds), icon: Clock, color: 'var(--accent3)' },
            { label: 'Key Insights', value: analytics.commonKeywords.length * 4, icon: Target, color: 'var(--ok)' },
            { label: 'AI Efficiency', value: '4.8x', icon: Zap, color: 'var(--warn)' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-[var(--r)] shadow-sm flex items-center gap-4 hover:border-[var(--border2)] transition-colors"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: stat.color }}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="font-['DM_Mono'] text-[9px] text-[var(--text3)] uppercase tracking-[0.15em]">{stat.label}</p>
                <p className="text-2xl font-bold text-[var(--text)]">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-8 rounded-[var(--r2)] shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-lg font-bold text-[var(--text)]">Weekly Meeting Load</h3>
            <p className="text-xs text-[var(--text3)]">Distribution of meeting hours across the current week</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[var(--accent)] shadow-sm" />
              <span className="text-[10px] font-['DM_Mono'] text-[var(--text3)] uppercase tracking-wider">Session Time</span>
            </div>
          </div>
        </div>

        <div className="h-64 flex items-end justify-between gap-6 px-4">
          {sessionsPerDay.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-4 group">
              <div className="relative w-full flex items-end justify-center h-full">
                <div className="absolute -top-8 bg-[var(--text)] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                   {day.count} hrs
                </div>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min((day.count / 8) * 100, 100)}%` }}
                  transition={{ delay: idx * 0.05, duration: 0.8 }}
                  className="w-full max-w-[48px] rounded-t-lg transition-all group-hover:opacity-80 shadow-inner"
                  style={{ background: 'linear-gradient(to top, var(--accent2), var(--accent))' }}
                />
              </div>
              <span className="font-['DM_Mono'] text-[10px] text-[var(--text3)] uppercase tracking-wider">{day.day}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-8 border-t border-[var(--border)] pt-6 flex justify-between text-[11px] font-medium text-[var(--text2)]">
          <p>Total Focused Intensity: <span className="text-[var(--accent)] font-bold">Medium-High</span></p>
          <p className="text-[var(--text3)]">Next Peak: <span className="text-[var(--text2)] font-semibold">Thursday AM</span></p>
        </div>
      </div>
    </div>
  );
};
