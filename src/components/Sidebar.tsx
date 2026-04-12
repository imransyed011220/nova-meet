/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun,
  Sparkles,
  LogOut,
  Mic,
  Upload,
  CheckSquare,
  Calendar,
  Bell,
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { useState } from 'react';

interface SidebarProps {
  isDarkMode?: boolean;
  setIsDarkMode?: (val: boolean) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { notes } = useMeetingHistory();

  const applyTheme = (newTheme: string) => {
    localStorage.setItem('nova-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    if (newTheme === 'dark' || newTheme === 'natural' || newTheme === 'warm') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Trigger storage event for other components if needed
    window.dispatchEvent(new Event('storage'));
  };

  const navSections = [
// ... (rest of sections)
    {
      label: 'Main',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/record', label: 'Record Meeting', icon: Mic },
        { path: '/transcribe', label: 'Upload Audio', icon: Upload },
      ]
    },
    {
      label: 'Workspace',
      items: [
        { path: '/history', label: 'History', icon: History },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/tasks', label: 'Tasks', icon: CheckSquare },
        { path: '/calendar', label: 'Calendar', icon: Calendar },
      ]
    },
    {
      label: 'System',
      items: [
        { path: '/settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-full flex flex-col bg-[var(--sidebar)] border-r border-[var(--sidebar-hover)] w-[260px] shrink-0 overflow-hidden transition-colors duration-300">
      {/* ---- Logo ---- */}
      <div className="p-6 pb-8 flex items-center gap-3 shrink-0">
        <div 
          className="w-9 h-9 flex items-center justify-center rounded-full shadow-lg relative"
          style={{ background: 'linear-gradient(155deg, var(--accent), var(--accent2))' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="2.5" height="14" rx="0.5" fill="white" />
            <rect x="14.5" y="3" width="2.5" height="14" rx="0.5" fill="white" />
            <path d="M5.5 3L14.5 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex flex-col">
          <h1 className="font-['Playfair_Display'] text-[18px] font-semibold text-[var(--sidebar-text)] leading-tight tracking-[-0.3px]">Nova Meet</h1>
          <p className="font-['DM_Mono'] text-[10px] text-[var(--sidebar-muted)] uppercase tracking-[0.1em] mt-0.5">AI Assistant</p>
        </div>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-6">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="font-['DM_Mono'] text-[9px] font-medium text-[var(--sidebar-muted)] uppercase tracking-[0.14em] px-4 mb-2">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[13px] transition-all duration-200 group
                      ${active 
                        ? 'bg-[var(--primary)] text-white font-bold' 
                        : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]'}
                    `}
                  >
                    <item.icon size={18} className={`${active ? 'text-white' : 'text-[var(--sidebar-muted)] group-hover:text-[var(--sidebar-text)]'}`} />
                    {item.label}
                    {item.path === '/tasks' && (() => {
                      const count = notes.reduce((sum, note) => sum + (note.actionItems?.filter(ai => !ai.completed).length || 0), 0);
                      return count > 0 ? (
                        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20 text-white' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>{count}</span>
                      ) : null;
                    })()}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ---- Bottom Section ---- */}
      <div className="mt-auto border-t border-[var(--sidebar-hover)] p-4 shrink-0 space-y-3">
        {/* User Profile Card */}
        <Link 
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-3 group p-2 hover:bg-[var(--sidebar-hover)] rounded-xl transition-all"
        >
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={user.fullName || 'User'} className="w-8 h-8 rounded-full border border-[var(--border)] object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
              style={{ background: 'var(--primary)' }}
            >
              {user?.firstName?.charAt(0) || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[var(--sidebar-text)] truncate">{user?.fullName || 'User'}</p>
            <p className="text-[11px] text-[var(--sidebar-muted)] truncate">{user?.primaryEmailAddress?.emailAddress || 'Nova User'}</p>
          </div>
          <button 
            onClick={(e) => { e.preventDefault(); handleLogout(); }}
            className="p-1.5 text-[var(--sidebar-muted)] hover:text-red-400 transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </Link>
      </div>
    </div>
  );
};
