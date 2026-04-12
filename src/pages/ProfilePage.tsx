/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award,
  Settings,
  Shield,
  FileText,
  Mic,
  ArrowRight,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { useUser } from '@clerk/clerk-react';
import { useMeetingHistory } from '../hooks/useMeetingHistory';

export const ProfilePage: React.FC = () => {
  const { user } = useUser();
  const { notes } = useMeetingHistory();

  const stats = [
    { label: 'Synthesized', value: notes.length, icon: FileText, color: 'text-[var(--accent)]' },
    { label: 'Air Time', value: '12.4h', icon: Clock, color: 'text-[var(--accent2)]' },
    { label: 'Intelligence', value: notes.length * 12, icon: TrendingUp, color: 'text-[var(--ok)]' },
    { label: 'Accuracy', value: '99.2%', icon: Award, color: 'text-[var(--accent3)]' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* Profile Header */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-[var(--shadow)] overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-[var(--accent)] to-[var(--accent3)] relative opacity-90">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="absolute -bottom-16 left-10">
            <div className="relative group">
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt={user.fullName || 'User'} 
                  className="w-32 h-32 rounded-3xl border-8 border-[var(--surface)] shadow-[var(--shadow2)] object-cover group-hover:scale-[1.02] transition-transform"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-32 h-32 bg-[var(--soft)] text-[var(--accent)] rounded-3xl border-8 border-[var(--surface)] shadow-[var(--shadow2)] flex items-center justify-center text-4xl font-black font-['Playfair_Display']">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-[var(--ok)] border-4 border-[var(--surface)] rounded-full shadow-sm" />
            </div>
          </div>
        </div>
        
        <div className="pt-20 pb-10 px-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-['Playfair_Display'] font-bold text-[var(--text)]">{user?.fullName || 'Anonymous Identity'}</h1>
            <div className="flex flex-wrap items-center gap-6 text-[12px] text-[var(--text3)] font-bold uppercase tracking-widest font-['DM_Mono']">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[var(--accent3)]" />
                {user?.primaryEmailAddress?.emailAddress}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[var(--accent3)]" />
                Registry Established {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Recently'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="px-6 py-3 bg-[var(--bg3)] border border-[var(--border)] text-[var(--text2)] rounded-full text-xs font-bold hover:bg-[var(--soft)] transition-all flex items-center gap-2 shadow-sm font-['DM_Sans']">
              <Settings size={16} />
              Identity Calibration
            </button>
            <button className="px-6 py-3 bg-[var(--accent)] text-white rounded-full text-xs font-bold hover:bg-[var(--accent2)] transition-all shadow-lg shadow-[var(--accent)]/20 font-['DM_Sans']">
              Initiate Pro Tier
            </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[var(--surface)] border border-[var(--border)] p-8 rounded-[var(--r2)] shadow-sm hover:shadow-[var(--shadow)] transition-all"
          >
            <stat.icon size={22} className={`${stat.color} mb-4`} />
            <p className="text-3xl font-bold text-[var(--text)] font-['DM_Mono'] tracking-tight">{stat.value}</p>
            <p className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-[0.2em] mt-1.5">{stat.label}</p>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-sm overflow-hidden">
            <div className="p-8 border-b border-[var(--border)] bg-[var(--bg3)]/30">
              <h3 className="font-['Playfair_Display'] text-xl font-bold text-[var(--text)] flex items-center gap-3">
                <Shield size={22} className="text-[var(--accent)]" />
                Security Protocols
              </h3>
            </div>
            <div className="p-8 space-y-6">
              {[
                { title: 'Biometric Integration', desc: 'Secure login via hardware-level keys.', active: true },
                { title: 'Intelligence Archive Access', desc: 'Manage devices with active sync keys.', active: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-[var(--bg3)] rounded-[var(--r)] border border-[var(--border)]/50">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[var(--text)]">{item.title}</p>
                    <p className="text-xs text-[var(--text3)]">{item.desc}</p>
                  </div>
                  <button className={`w-12 h-6 rounded-full p-1 transition-all ${item.active ? 'bg-[var(--accent)]' : 'bg-[var(--soft)]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all transform ${item.active ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-sm overflow-hidden">
            <div className="p-8 border-b border-[var(--border)] bg-[var(--bg3)]/30">
              <h3 className="font-['Playfair_Display'] text-xl font-bold text-[var(--text)] flex items-center gap-3">
                <Zap size={22} className="text-[var(--accent3)]" />
                Synthesis Parameters
              </h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono']">Audio Ingest Source</label>
                  <select className="w-full bg-[var(--bg3)] border border-[var(--border)] py-3 px-4 rounded-[var(--r)] text-sm outline-none focus:border-[var(--accent)] transition-all appearance-none cursor-pointer">
                    <option>Neural Engine Default</option>
                    <option>External Hi-Fi Array</option>
                    <option>Integrated Array</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono']">Namespace Pattern</label>
                  <input 
                    type="text" 
                    defaultValue="SYNC_{timestamp}"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] py-3 px-4 rounded-[var(--r)] text-sm outline-none focus:border-[var(--accent)] transition-all"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section className="bg-[var(--accent2)] text-white p-8 rounded-[var(--r2)] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
            <div className="space-y-3 relative z-10">
              <h3 className="font-['Playfair_Display'] text-xl font-bold">Neural Storage</h3>
              <p className="text-[11px] text-white/60 font-medium uppercase tracking-[0.15em]">Capacity: 24% utilized</p>
            </div>
            
            <div className="space-y-4 pt-8 relative z-10">
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '24%' }}
                  className="h-full bg-[var(--accent3)] shadow-[0_0_15px_rgba(212,130,74,0.4)]"
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest font-['DM_Mono'] text-white/80">
                <span>1.22 GB</span>
                <span>5.00 GB</span>
              </div>
            </div>
            
            <button className="w-full mt-8 py-3.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold transition-all border border-white/20 backdrop-blur-sm shadow-sm font-['DM_Sans']">
              Purge Sync Cache
            </button>
          </section>

          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-sm p-8 space-y-8">
            <h3 className="font-['Playfair_Display'] text-lg font-bold text-[var(--text)]">Recent Pulse</h3>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className="w-10 h-10 bg-[var(--soft2)] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[var(--soft)] transition-colors shadow-sm">
                    <FileText size={16} className="text-[var(--accent2)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">Session: Quarterly Pivot</p>
                    <p className="text-[10px] text-[var(--text3)] font-medium uppercase tracking-widest mt-0.5">2.4 hours prior</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full text-[10px] font-bold text-[var(--accent)] hover:text-[var(--accent2)] flex items-center justify-center gap-2 uppercase tracking-[0.2em] pt-2 transition-colors">
              Full Archive Intelligence <ArrowRight size={14} strokeWidth={3} />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
