/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  FileAudio,
  Download,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useLoading } from '../hooks/useLoading';
import { useToast } from '../hooks/useToast';
import { geminiService } from '../services/geminiService';
import { getErrorMessage } from '../utils/ErrorHandler';

export const TranscribePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setIsProcessing, setGlobalProgress } = useLoading();
  
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [appError, setAppError] = useState<string | null>(null);
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const { 
    convertToWav
  } = useAudioRecorder({
    onRecordingComplete: (blob) => handleTranscription(blob),
    onError: (type) => {
      setAppError(getErrorMessage(type));
      setStatus('error');
    }
  });

  const handleTranscription = async (audioBlob: Blob) => {
    setStatus('processing');
    setIsProcessing(true);
    setGlobalProgress(30);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Intelligence frequency offline (API Key missing)");

      setGlobalProgress(60);
      const wavBlob = await convertToWav(audioBlob);
      
      const transcript = await geminiService.transcribeOnly(wavBlob, apiKey);
      
      setFinalTranscript(transcript);
      setStatus('completed');
      showToast('Transcription synthesis complete');
    } catch (err: any) {
      console.error(err);
      setAppError(err.message || "Synthesis failed");
      setStatus('error');
    } finally {
      setIsProcessing(false);
      setGlobalProgress(100);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalTranscript);
    setCopied(true);
    showToast('Transcript copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-['Playfair_Display'] font-bold text-[var(--text)] flex items-center gap-3">
            <FileAudio className="text-[var(--accent)]" size={28} strokeWidth={1.5} />
            Dialogue Synthesis
          </h1>
          <p className="text-[var(--text3)] text-base">
            Convert existing audio registries into high-fidelity text.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-[11px] font-bold text-[var(--accent2)] uppercase tracking-widest hover:translate-x-[-4px] transition-transform flex items-center gap-2 mb-1"
        >
          <ArrowLeft size={14} strokeWidth={3} /> Return to Hub
        </button>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-[var(--shadow2)] overflow-hidden">
        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            
            {status === 'idle' && (
              <motion.div 
                key="idle-upload"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-10 flex flex-col items-center"
              >
                <div 
                   className="w-full h-[320px] border-2 border-dashed border-[var(--border2)] hover:border-[var(--accent)] rounded-[var(--r2)] bg-[var(--bg3)]/50 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group shadow-inner"
                   onClick={() => document.getElementById('audio-upload')?.click()}
                >
                   <div className="w-20 h-20 bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Mic size={32} strokeWidth={1.5} />
                   </div>
                   <div className="text-center space-y-2">
                      <p className="text-lg font-['Playfair_Display'] font-bold text-[var(--text)]">Deposit Audio Registry</p>
                      <p className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-[0.2em] font-['DM_Mono']">WAV, MP3, M4A — MAX 50MB</p>
                   </div>
                </div>

                <div className="w-full max-w-sm">
                   <input 
                     type="file" 
                     id="audio-upload" 
                     accept="audio/*" 
                     className="hidden" 
                     onChange={(e) => {
                       if (e.target.files && e.target.files.length > 0) {
                         handleTranscription(e.target.files[0]);
                       }
                     }} 
                   />
                   <button 
                     onClick={() => document.getElementById('audio-upload')?.click()}
                     className="w-full py-4 bg-[var(--accent)] text-white rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-[var(--accent2)] transition-all shadow-lg shadow-[var(--accent)]/30 font-['DM_Sans']"
                   >
                     Select from Local Storage
                   </button>
                </div>
              </motion.div>
            )}

            {status === 'processing' && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-20 flex flex-col items-center gap-8"
              >
                <div className="relative">
                   <div className="absolute inset-[-10px] rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                   <div className="w-24 h-24 bg-[var(--soft)] rounded-full flex items-center justify-center text-[var(--accent2)]">
                      <FileAudio size={40} />
                   </div>
                </div>
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-['Playfair_Display'] font-bold text-[var(--text)]">Synthesizing Dialogue...</h3>
                  <div className="w-64 h-1.5 bg-[var(--soft)] rounded-full overflow-hidden mx-auto shadow-inner">
                    <motion.div 
                      className="h-full bg-[var(--accent)]"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      style={{ width: "40%" }}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono']">Calibrating Neural Pathways</p>
                </div>
              </motion.div>
            )}

            {status === 'completed' && (
              <motion.div 
                key="completed"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-['Playfair_Display'] font-bold text-[var(--text)]">Final Synthesis</h3>
                    <p className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono']">Extracted Registry</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={copyToClipboard}
                      className="px-5 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text2)] rounded-full text-xs font-bold hover:bg-[var(--bg3)] transition-all flex items-center gap-2 shadow-sm"
                    >
                      {copied ? <Check size={14} className="text-[var(--ok)]" /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button 
                      onClick={() => {
                        const blob = new Blob([finalTranscript], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'transcript.txt';
                        a.click();
                      }}
                      className="px-5 py-2.5 bg-[var(--accent)] text-white rounded-full text-xs font-bold hover:bg-[var(--accent2)] transition-all flex items-center gap-2 shadow-lg shadow-[var(--accent)]/20"
                    >
                      <Download size={14} /> Download
                    </button>
                  </div>
                </div>
                
                <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--r2)] p-10 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar shadow-inner">
                  <p className="font-serif italic text-lg leading-loose text-[var(--text2)] opacity-90">
                    "{finalTranscript || "No dialogue markers detected."}"
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => { setStatus('idle'); setFinalTranscript(''); }}
                    className="px-8 py-3 bg-[var(--bg3)] border border-[var(--border)] text-[var(--text2)] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[var(--soft)] transition-all flex items-center gap-3 transition-all"
                  >
                    <RotateCcw size={16} /> New Transcription Cycle
                  </button>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-8">
                <div className="mx-auto w-24 h-24 bg-[var(--err)]/5 rounded-full flex items-center justify-center text-[var(--err)] border border-[var(--err)]/10">
                  <AlertCircle size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-['Playfair_Display'] font-bold text-[var(--text)]">Synthesis Compromised</h3>
                  <p className="text-sm text-[var(--text3)] font-medium">{appError}</p>
                </div>
                <button
                  onClick={() => setStatus('idle')}
                  className="px-10 py-3.5 bg-[var(--bg3)] border border-[var(--border)] text-[var(--text2)] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[var(--soft)] transition-all"
                >
                  Retry Synchronization
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
