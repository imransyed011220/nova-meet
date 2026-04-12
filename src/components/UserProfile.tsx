/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut,
  User,
  Settings,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser, useClerk } from '@clerk/clerk-react';

interface UserProfileProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 hover:bg-[var(--border-light)] rounded-xl transition-all"
      >
        {user?.imageUrl ? (
          <img src={user.imageUrl} alt={user.fullName || 'User'} className="w-8 h-8 rounded-xl border border-[var(--border)] object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(155deg, var(--accent), var(--accent2))' }}
          >
            {user?.firstName?.charAt(0) || 'U'}
          </div>
        )}
        <ChevronDown size={14} className={`text-[var(--ink-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{ backdropFilter: 'none' }}
              className="absolute right-0 mt-2 w-[220px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] shadow-[var(--shadow2)] z-[9999] overflow-hidden p-2"
            >
              <div className="px-3.5 py-3 border-b border-[var(--border)] bg-[var(--soft2)] rounded-t-[8px] mb-1">
                <div className="flex flex-col">
                  <p className="text-sm font-bold text-[var(--text)]">{user?.fullName}</p>
                  <p className="text-[11px] text-[var(--text3)] font-['DM_Mono'] truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>

              <div className="space-y-0.5">
                <button 
                  onClick={() => { navigate('/profile'); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--soft)] hover:text-[var(--accent2)] rounded-lg transition-all"
                >
                  <User size={15} /> Profile
                </button>
                <button 
                  onClick={() => { navigate('/settings'); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--soft)] hover:text-[var(--accent2)] rounded-lg transition-all"
                >
                  <Settings size={15} /> Settings
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-[var(--err)] bg-[var(--surface)] hover:bg-[var(--err)]/8 rounded-lg transition-all"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
