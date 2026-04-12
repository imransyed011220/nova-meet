/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Calendar as CalendarIcon,
  Video,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMeetingHistory } from '../hooks/useMeetingHistory';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'recording' | 'review';
}

export const CalendarPage: React.FC = () => {
  const { notes } = useMeetingHistory();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  const realEvents: CalendarEvent[] = (() => {
    try {
      return notes.map(note => {
        const parts = note.timestamp?.split(',')[0].split('/');
        let dateStr = '';
        if (parts && parts.length === 3) {
          const [p1, p2, p3] = parts;
          const year = p3.length === 4 ? p3 : p1;
          const month = p3.length === 4 ? p1.padStart(2, '0') : p2.padStart(2, '0');
          const day = p3.length === 4 ? p2.padStart(2, '0') : p1.padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }

        return {
          id: note.id,
          title: note.title || 'Untitled Session',
          date: dateStr,
          time: note.timestamp?.split(',')[1]?.trim().split(' ')[0] || '12:00',
          type: (note.type === 'recording' ? 'recording' : 'meeting') as any
        };
      }).filter(e => e.date !== '');
    } catch (e) {
      console.error("Calendar mapping failed", e);
      return [];
    }
  })();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (date: Date) => {
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return realEvents.filter(e => e.date === dateStr);
    } catch (e) {
      return [];
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-['Playfair_Display'] font-bold text-[var(--accent2)]">Session Timeline</h1>
          <p className="text-sm text-[var(--text3)]">Schedule and organize your upcoming AI-assisted meetings.</p>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => setShowAddModal(true)}
             className="px-5 py-2.5 bg-[var(--accent)] text-white rounded-full text-[13px] font-bold flex items-center gap-2 hover:bg-[var(--accent2)] transition-all shadow-md shadow-[var(--accent)]/20"
           >
              <Plus size={16} strokeWidth={3} />
              New Meeting
           </button>
           
           <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-full p-1 shadow-sm">
             <button onClick={prevMonth} className="p-1.5 hover:bg-[var(--soft)] rounded-full transition-all text-[var(--text3)]">
               <ChevronLeft size={18} />
             </button>
             <div className="px-5 text-xs font-bold text-[var(--text)] font-['DM_Mono'] uppercase tracking-widest min-w-[140px] text-center">
               {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
             </div>
             <button onClick={nextMonth} className="p-1.5 hover:bg-[var(--soft)] rounded-full transition-all text-[var(--text3)]">
               <ChevronRight size={18} />
             </button>
           </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] overflow-hidden shadow-[var(--shadow)]">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--bg3)]">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-bold text-[var(--text3)] tracking-[0.2em] font-['DM_Mono']">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-[130px]">
          {days.map((day, idx) => {
            const isTodayDate = isToday(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const dayEvents = getEventsForDay(day);

            return (
              <div 
                key={idx}
                className={`border-r border-b border-[var(--border)] p-3 relative group transition-all ${
                  isTodayDate ? 'bg-[var(--soft)]/30' : 'bg-[var(--surface)] hover:bg-[var(--bg3)]'
                } ${!isCurrentMonth ? 'opacity-30' : ''}`}
              >
                <span className={`text-[13px] font-bold ${
                  isTodayDate ? 'w-7 h-7 flex items-center justify-center bg-[var(--accent)] text-white rounded-full shadow-md' : 'text-[var(--text3)] group-hover:text-[var(--text2)]'
                }`}>
                  {day.getDate()}
                </span>
                
                <div className="mt-3 space-y-1.5 relative z-10">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id}
                      className="px-2 py-1 bg-[var(--bg3)] border border-[var(--border)] rounded-md text-[9px] font-bold text-[var(--accent2)] truncate shadow-sm hover:border-[var(--accent3)] transition-all cursor-pointer"
                    >
                      {event.time.split(' ')[0]} {event.title}
                    </div>
                  ))}
                </div>

                {dayEvents.length > 0 && (
                   <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[var(--accent3)] animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="flex items-center gap-8 justify-end px-4">
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <span className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono']">Current Day</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent3)]" />
            <span className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono']">AI Scheduled</span>
         </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-[var(--text)]/20 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-[var(--shadow2)] p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-['Playfair_Display'] font-bold text-[var(--accent2)]">New Session</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-[var(--soft2)] rounded-full transition-all text-[var(--text3)]">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider font-['DM_Mono']">Meeting Reference</label>
                  <input type="text" placeholder="e.g. Quarterly Review" className="w-full px-4 py-3 bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--r)] text-sm outline-none focus:border-[var(--accent)] transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider font-['DM_Mono']">Date</label>
                    <input type="date" className="w-full px-4 py-3 bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--r)] text-sm outline-none focus:border-[var(--accent)] transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider font-['DM_Mono']">Time</label>
                    <input type="time" className="w-full px-4 py-3 bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--r)] text-sm outline-none focus:border-[var(--accent)] transition-all" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-[13px] font-bold text-[var(--text3)] hover:text-[var(--text)] transition-all">
                  Discard
                </button>
                <button onClick={() => setShowAddModal(false)} className="px-8 py-2.5 bg-[var(--accent)] text-white rounded-full text-[13px] font-bold hover:bg-[var(--accent2)] transition-all shadow-lg shadow-[var(--accent)]/20">
                  Save Registry
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
