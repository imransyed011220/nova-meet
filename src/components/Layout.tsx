/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Menu,
  Search,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLoading } from '../hooks/useLoading';
import { useUser } from '@clerk/clerk-react';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { AIAssistantPanel } from './AIAssistantWidget';
import { Sidebar } from './Sidebar';
import { UserProfile } from './UserProfile';
import { Notification } from './Notification';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, ArrowRight } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    isUploading, isProcessing, isTranscribing, 
    isSummarizing, isExtracting, globalProgress 
  } = useLoading();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);
  
  const mainContentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  const handlePanelToggle = () => {
    if (mainContentRef.current) {
      scrollPositionRef.current = mainContentRef.current.scrollTop;
    }
    setIsAIPanelOpen(prev => !prev);
    requestAnimationFrame(() => {
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = scrollPositionRef.current;
      }
    });
  };
  const navigate = useNavigate();
  const { notes } = useMeetingHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  // Close search on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSearchOpen]);


  const searchResults = searchQuery.trim() 
    ? notes.filter(n => n.title?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const isGlobalLoading = isUploading || isProcessing || isTranscribing || isSummarizing || isExtracting;


  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/record') return 'Record Meeting';
    if (path === '/transcribe') return 'Transcribe Audio';
    if (path === '/paste-analysis') return 'AI Analysis';
    if (path === '/tasks') return 'Action Items';
    if (path === '/calendar') return 'Calendar';
    if (path === '/history') return 'History';
    if (path === '/analytics') return 'Analytics';
    if (path === '/settings') return 'Settings';
    if (path.startsWith('/meeting/')) return 'Meeting Details';
    return 'AI Assistant';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] font-sans">
      {/* ====== LEFT SIDEBAR (Desktop) ====== */}
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>

      {/* ====== LEFT SIDEBAR (Mobile Overlay) ====== */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[80] w-[260px] lg:hidden h-full"
            >
              <Sidebar 
                onClose={() => setIsSidebarOpen(false)} 
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ====== MAIN CONTENT AREA ====== */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-[56px] bg-[var(--surface)] border-b border-[var(--border)] px-6 flex items-center justify-between z-40 shrink-0 relative">
          {/* Global Progress Bar */}
          <AnimatePresence>
            {isGlobalLoading && (
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: globalProgress / 100 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] origin-left z-50"
              />
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-1.5 hover:bg-[var(--soft)] rounded-lg transition-all text-[var(--text3)]"
            >
              <Menu size={20} />
            </button>
            <h2 className="font-['Playfair_Display'] text-[17px] font-semibold text-[var(--accent2)]">
              {getPageTitle()}
            </h2>
          </div>

          {/* Center Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-[280px] mx-4 relative">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                   setSearchQuery(e.target.value);
                   setIsSearchOpen(true);
                }}
                placeholder="Search sessions..."
                className="w-full pl-9 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] rounded-full text-[13px] outline-none transition-all placeholder:text-[var(--text3)]"
              />
            </div>

            {/* Search Dropdown */}
            <AnimatePresence>
              {isSearchOpen && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow2)] z-50 overflow-hidden"
                >
                  <div className="p-2">
                    {searchResults.length > 0 ? (
                      <div className="space-y-1">
                        {searchResults.map(note => (
                          <button
                            key={note.id}
                            onClick={() => {
                               navigate(`/meeting/${note.id}`);
                               setSearchQuery('');
                               setIsSearchOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-[var(--soft2)] rounded-lg transition-all text-left group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[var(--bg2)] flex items-center justify-center text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all">
                               <FileText size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                               <p className="text-[12px] font-bold text-[var(--text)] truncate">{note.title}</p>
                               <p className="text-[10px] text-[var(--text3)] flex items-center gap-1"><Clock size={10} /> {note.timestamp?.split(',')[0]} • {note.duration}</p>
                            </div>
                            <ArrowRight size={12} className="text-[var(--text3)] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-[11px] text-[var(--text3)] font-medium">No sessions matching "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-[var(--bg3)] p-2 border-t border-[var(--border)]">
                     <button onClick={() => { setIsSearchOpen(false); navigate('/history'); }} className="w-full text-center text-[10px] font-bold text-[var(--accent2)] hover:underline uppercase tracking-wider py-1">View Archive</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Click-away overlay */}
            {isSearchOpen && <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} />}
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full font-['DM_Mono'] text-[11px] border ${
              isGlobalLoading 
                ? 'bg-[var(--warn)]/10 border-[var(--warn)]/30 text-[var(--warn)]' 
                : 'bg-[var(--ok)]/10 border-[var(--ok)]/30 text-[var(--ok)]'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isGlobalLoading ? 'bg-[var(--warn)] animate-pulse' : 'bg-[var(--ok)]'}`} />
              {isGlobalLoading ? 'PROCESSING' : 'READY'}
            </div>

            <Notification />

            {/* AI Panel Toggle */}
            <button
              onClick={handlePanelToggle}
              className={`p-1.5 rounded-lg transition-all ${isAIPanelOpen ? 'text-[var(--accent)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'}`}
              title={isAIPanelOpen ? 'Close AI Panel' : 'Open AI Panel'}
            >
              {isAIPanelOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
            </button>
            
            <div className="w-px h-5 bg-[var(--border)] mx-1 hidden md:block" />
            
            <UserProfile isOpen={isProfileOpen} setIsOpen={setIsProfileOpen} />
          </div>
        </header>

        {/* Content + AI Panel Row */}
        <div className="flex-1 flex overflow-hidden">
          {/* Page Content */}
          <main 
            ref={mainContentRef}
            style={{ overflowAnchor: 'none', overflowY: 'auto' }}
            className="flex-1 bg-[var(--bg)] p-6"
          >
            <div className="max-w-6xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* ====== RIGHT AI PANEL (Desktop) ====== */}
          <AnimatePresence>
            {isAIPanelOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="hidden lg:flex h-full shrink-0 border-l border-[var(--border)] bg-[var(--surface)] overflow-hidden"
              >
                <div className="w-[340px] h-full flex flex-col">
                  {/* AI Panel Header specifically for Layout context */}
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                       <h3 className="font-['Playfair_Display'] text-[15px] font-semibold text-[var(--accent2)]">Nova Chat</h3>
                       <div className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] mt-0.5" />
                    </div>
                    <button onClick={() => setIsAIPanelOpen(false)} className="text-[var(--text3)] hover:text-[var(--text)]">
                       <PanelRightClose size={16} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <AIAssistantPanel />
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ====== AI Panel FAB (Mobile) ====== */}
      <div className="lg:hidden">
        <AIAssistantPanel isMobile={true} />
      </div>
    </div>
  );

};
