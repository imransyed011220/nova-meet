import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Sparkles,
  Settings as SettingsIcon,
  Loader2,
  Save,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../hooks/useToast';
import { useUser } from '@clerk/clerk-react';

const THEMES = [
  { id: 'blue',       label: 'Blue Enterprise', desc: 'Professional SaaS Blue (Default)', color: '#4F6BED' },
  { id: 'nova-brown', label: 'Nova Brown',       desc: 'Warm premium paper theme',        color: '#b8552f' },
  { id: 'light',      label: 'Clean Light',      desc: 'Minimalist white & gray',          color: '#F9FAFB', border: true },
  { id: 'dark',       label: 'Standard Dark',    desc: 'Deep navy & charcoal',             color: '#0B1220' },
  { id: 'natural',    label: 'Natural Dark',     desc: 'Soft ocean & slate tones',         color: '#0F172A' },
  { id: 'warm',       label: 'Warm Dark',        desc: 'Midnight black & amber accent',    color: '#141414' },
];

function applyTheme(id: string) {
  localStorage.setItem('nova-theme', id);
  document.documentElement.setAttribute('data-theme', id);
  if (id === 'dark' || id === 'natural' || id === 'warm') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string>(
    () => localStorage.getItem('nova-theme') || 'blue'
  );
  const { showToast } = useToast();
  const { user } = useUser();
  
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Preferences updated successfully');
    }, 800);
  };

  const handleThemeChange = (id: string) => {
    applyTheme(id);
    setActiveTheme(id);
    showToast(`${THEMES.find(t => t.id === id)?.label} theme applied`);
  };


  const tabs = [
    { id: 'profile', label: 'Identity', icon: User },
    { id: 'app', label: 'Interface', icon: Bell },
    { id: 'ai', label: 'Intelligence', icon: Sparkles },
    { id: 'security', label: 'Privacy', icon: Shield },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-['Playfair_Display'] font-bold text-[var(--accent2)]">System Preferences</h1>
        <p className="text-sm text-[var(--text3)]">Manage your account, AI behavior, and application experience.</p>
      </div>

      <div className="flex items-center gap-1 border-b border-[var(--border)] overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-4 text-[13px] font-bold transition-all relative flex items-center gap-2 shrink-0 ${
              activeTab === tab.id ? 'text-[var(--accent)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
            }`}
          >
            <tab.icon size={16} strokeWidth={2.5} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="settingsTab"
                className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[var(--accent)]" 
              />
            )}
          </button>
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-8"
          >
            {activeTab === 'profile' && (
              <div className="space-y-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="relative group">
                    {user?.imageUrl ? (
                      <img 
                        src={user.imageUrl} 
                        alt="" 
                        className="w-24 h-24 rounded-full border-4 border-[var(--surface)] shadow-[var(--shadow)] object-cover" 
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[var(--soft)] border-4 border-[var(--surface)] shadow-[var(--shadow)] flex items-center justify-center text-[var(--accent)] text-3xl font-bold font-['Playfair_Display']">
                        {user?.firstName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <button className="absolute bottom-0 right-0 bg-[var(--accent)] text-white p-2 rounded-full shadow-lg hover:bg-[var(--accent2)] transition-all">
                      <SettingsIcon size={14} strokeWidth={3} />
                    </button>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-[0.15em] font-['DM_Mono']">Full Name</label>
                      <input 
                        type="text" 
                        defaultValue={user?.fullName || ''}
                        className="w-full px-4 py-3 bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--r)] text-sm outline-none focus:border-[var(--accent)] transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-[0.15em] font-['DM_Mono']">Email Address</label>
                      <input 
                        type="email" 
                        value={user?.primaryEmailAddress?.emailAddress || ''}
                        readOnly
                        className="w-full px-4 py-3 bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--r)] text-sm opacity-60 cursor-not-allowed" 
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-[0.15em] font-['DM_Mono']">Biography & Role</label>
                      <textarea 
                        placeholder="Specify your role and focus areas..." 
                        className="w-full px-4 py-3 bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--r)] text-sm outline-none focus:border-[var(--accent)] transition-all h-28 resize-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-[var(--border)] flex justify-end gap-3">
                   <button 
                     onClick={handleSave}
                     disabled={isSaving}
                     className="px-8 py-3 bg-[var(--accent)] text-white rounded-full text-[13px] font-bold hover:bg-[var(--accent2)] transition-all shadow-lg shadow-[var(--accent)]/20 flex items-center gap-2 disabled:opacity-50"
                   >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      {isSaving ? 'Synchronizing...' : 'Save Registry'}
                   </button>
                </div>
              </div>
            )}

            {activeTab === 'app' && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.15em] font-['DM_Mono']">Interface Theme</label>
                        <p className="text-xs text-[var(--muted)] mb-4">Choose the visual aesthetic for your workspace.</p>
                        
                         <div className="grid grid-cols-1 gap-3">
                           {THEMES.map((t) => (
                             <button
                               key={t.id}
                               onClick={() => handleThemeChange(t.id)}
                               className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                                 activeTheme === t.id 
                                   ? 'border-[var(--primary)] bg-[var(--soft)]' 
                                   : 'border-[var(--border)] hover:border-[var(--muted)] hover:bg-[var(--soft)]'
                               }`}
                             >
                               <div className="flex items-center gap-4">
                                  <div 
                                    className={`w-5 h-5 rounded-full ${t.id === 'light' ? 'border border-[var(--border)]' : ''}`} 
                                    style={{ background: t.color }} 
                                  />
                                  <div>
                                     <p className="text-[13px] font-bold text-[var(--text)]">{t.label}</p>
                                     <p className="text-[11px] text-[var(--muted)]">{t.desc}</p>
                                  </div>
                               </div>
                               {activeTheme === t.id && (
                                 <Check size={16} className="text-[var(--primary)] shrink-0" />
                               )}
                             </button>
                           ))}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.15em] font-['DM_Mono']">Display Density</label>
                         <p className="text-xs text-[var(--muted)] mb-4">Control the visual spacing of information.</p>
                         <div className="flex gap-2">
                            {['Compact', 'Balanced', 'Spacious'].map(v => (
                              <button key={v} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${v === 'Balanced' ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-[var(--border)] text-[var(--muted)]'}`}>
                                {v}
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t border-[var(--border)] flex justify-end gap-3">
                   <button 
                     onClick={handleSave}
                     className="px-8 py-3 bg-[var(--primary)] text-white rounded-lg text-[13px] font-bold shadow-lg shadow-[var(--primary)]/20"
                   >
                      Save Preferences
                   </button>
                </div>
              </div>
            )}

            {activeTab !== 'profile' && activeTab !== 'app' && (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                 <div className="w-16 h-16 bg-[var(--soft)] rounded-full flex items-center justify-center text-[var(--primary)]">
                    <SettingsIcon size={28} />
                 </div>
                 <div>
                    <p className="text-lg font-['Playfair_Display'] font-bold text-[var(--text)]">Module in Calibration</p>
                    <p className="text-sm text-[var(--muted)] max-w-sm">This interface section is currently being refined for the new intelligence system.</p>
                 </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
