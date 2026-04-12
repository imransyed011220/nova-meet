/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, CheckCircle2, Mic, FileText, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'analysis' | 'recording' | 'meeting';
  time: string;
  isRead: boolean;
}

export const Notification: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Analysis Complete',
      message: 'Your meeting with the Product Team has been analyzed.',
      type: 'analysis',
      time: '2m ago',
      isRead: false
    },
    {
      id: '2',
      title: 'Recording Finished',
      message: 'Weekly Sync recording has been saved successfully.',
      type: 'recording',
      time: '1h ago',
      isRead: true
    },
    {
      id: '3',
      title: 'Upcoming Meeting',
      message: 'Design Review starts in 15 minutes.',
      type: 'meeting',
      time: '15m ago',
      isRead: false
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <CheckCircle2 size={15} className="text-emerald-500" />;
      case 'recording': return <Mic size={15} className="text-corporate-accent" />;
      case 'meeting': return <Clock size={15} className="text-purple-500" />;
      default: return <FileText size={15} className="text-[var(--ink-muted)]" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[var(--ink-muted)] hover:text-corporate-accent hover:bg-[var(--border-light)] rounded-lg transition-all relative"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--bg-surface)]">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-[80px] mt-2 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl z-[9999] overflow-hidden"
            >
              <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="text-sm font-heading font-semibold text-[var(--ink)]">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-semibold text-corporate-accent hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={28} className="mx-auto text-[var(--border)] mb-2" />
                    <p className="text-xs text-[var(--ink-muted)]">No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-3.5 flex gap-3 hover:bg-[var(--border-light)] transition-colors relative group ${!n.isRead ? 'bg-corporate-accent/[0.03]' : ''}`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-medium text-[var(--ink)] truncate">{n.title}</p>
                            <span className="text-[9px] text-[var(--ink-muted)] whitespace-nowrap">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                        <button 
                          onClick={() => removeNotification(n.id)}
                          className="absolute top-2 right-2 p-1 text-[var(--border)] hover:text-[var(--ink-muted)] opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-2.5 border-t border-[var(--border)]">
                <button className="w-full text-center text-[10px] font-semibold text-[var(--ink-muted)] hover:text-corporate-accent py-1 transition-all">
                  View all activity
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
