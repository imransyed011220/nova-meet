import React, { useState, useEffect } from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { Sparkles, ShieldCheck, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full bg-[var(--bg)] relative flex items-center justify-center p-6 overflow-hidden">
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      
      {/* Soft Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-[var(--accent)]/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] bg-[var(--accent3)]/10 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="splash"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center justify-center space-y-8 relative z-10"
          >
            <div className="relative">
              <motion.div 
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 1, ease: "backOut" }}
                className="w-24 h-24 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shadow-[var(--shadow2)] relative z-10"
              >
                <Sparkles size={48} strokeWidth={1.5} />
              </motion.div>
              {/* Spinning glow behind logo */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-[var(--accent3)] rounded-3xl opacity-20 blur-xl -z-10" 
              />
            </div>
            
            <div className="text-center space-y-3">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-['Playfair_Display'] font-bold text-[var(--text)] tracking-tight"
              >
                Nova Meet
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[var(--text3)] text-sm font-['DM_Mono'] uppercase tracking-widest"
              >
                Initializing Core Protocols
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="w-48 h-1.5 bg-[var(--soft2)] rounded-full overflow-hidden shadow-inner mt-4"
            >
              <motion.div 
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.2, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent3)]"
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full max-w-md space-y-10 relative z-10"
          >
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] shadow-[var(--shadow2)]">
                <Sparkles size={40} strokeWidth={1.5} />
              </div>
              
              <div className="space-y-3">
                <h1 className="text-4xl font-['Playfair_Display'] font-bold text-[var(--text)] tracking-tight">
                  Nova Meet
                </h1>
                <p className="text-[var(--text3)] text-base font-medium leading-relaxed">
                  Transforming meeting dialogue into<br />distilled intelligence.
                </p>
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] p-10 shadow-[var(--shadow2)] relative overflow-hidden text-center group transition-shadow hover:shadow-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent3)]" />
              <div className="flex justify-center flex-col items-center space-y-8 relative z-10">
                 <div className="space-y-2">
                    <p className="text-xs font-bold text-[var(--text)] uppercase tracking-[0.2em] font-['DM_Mono']">Secure Authentication</p>
                    <p className="text-[12px] text-[var(--text3)]">Access your intelligence vault</p>
                 </div>
                 <SignInButton mode="modal">
                   <button className="w-full py-4 px-6 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white font-bold rounded-xl shadow-lg relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95 group">
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                      <span className="relative z-10 tracking-widest text-[13px] uppercase">
                        Authenticate Now
                      </span>
                   </button>
                 </SignInButton>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: ShieldCheck, label: 'Vault Security' },
                { icon: Zap, label: 'Swift Analysis' },
                { icon: Clock, label: 'Chronos Sync' },
              ].map((f, i) => (
                <div 
                  key={i} 
                  className="flex flex-col items-center gap-2 p-4 rounded-[var(--r)] bg-[var(--surface)]/50 border border-[var(--border)]/50 backdrop-blur-sm shadow-sm"
                >
                  <f.icon size={18} strokeWidth={2} className="text-[var(--accent)]" />
                  <span className="text-[9px] font-bold text-[var(--text2)] uppercase tracking-widest text-center">{f.label}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-[10px] text-[var(--text3)] leading-loose uppercase tracking-[0.1em]">
              End-to-End Encryption Standard<br />
              <span className="opacity-50">© 2026 Nova Collective</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
