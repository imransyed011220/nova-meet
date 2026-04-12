/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mic, 
  Upload, 
  History, 
  Sparkles, 
  ArrowRight,
  Clock,
  FileText,
  Video,
  Loader2,
  Bell,
  CheckCircle2,
  TrendingUp,
  LayoutGrid,
  List,
  ArrowUpDown,
  Users,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { AudioDropzone } from '../components/AudioDropzone';
import { MeetingLinkInput } from '../components/MeetingLinkInput';
import { geminiService } from '../services/geminiService';
import { AppErrorType } from '../utils/ErrorHandler';
import { MeetingNote } from '../types';
import { AnalysisProgress, AnalysisStep } from '../components/AnalysisProgress';
import { ProfessionalErrorCard } from '../components/ProfessionalErrorCard';
import { useLoading } from '../hooks/useLoading';
import { useToast } from '../hooks/useToast';
import { EmptyState } from '../components/EmptyState';
import { useUser } from '@clerk/clerk-react';
import { InlineRename } from '../components/InlineRename';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { notes, addNote, updateNote } = useMeetingHistory();
  const { user, isLoaded } = useUser();
  const { showToast } = useToast();
  
  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-corporate-accent" />
      </div>
    );
  }

  const { 
    setIsUploading, setIsProcessing, setIsTranscribing, 
    setIsSummarizing, setIsExtracting, setGlobalProgress 
  } = useLoading();
  
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('uploading');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState<{ type: AppErrorType; message: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'duration'>('date');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileUpload = async (file: File) => {
    setIsProcessingLocal(true);
    setIsUploading(true);
    setError(null);
    setAnalysisStep('uploading');
    setAnalysisProgress(10);
    setGlobalProgress(10);
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      setIsUploading(false);
      setIsProcessing(true);
      setTimeout(() => { 
        setAnalysisStep('processing'); 
        setAnalysisProgress(30);
        setGlobalProgress(30);
      }, 500);

      const data = await geminiService.processAudio(file, apiKey);
      
      const getDuration = (): Promise<string> => {
        return new Promise((resolve) => {
          const audio = new Audio();
          audio.src = URL.createObjectURL(file);
          audio.onloadedmetadata = () => {
            const mins = Math.floor(audio.duration / 60);
            const secs = Math.floor(audio.duration % 60);
            URL.revokeObjectURL(audio.src);
            resolve(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
          };
          audio.onerror = () => resolve("00:00");
        });
      };

      const actualDuration = await getDuration();

      setIsTranscribing(true);
      setAnalysisStep('transcribing');
      setAnalysisProgress(50);
      setGlobalProgress(50);
      
      setTimeout(() => { 
        setIsTranscribing(false);
        setIsSummarizing(true);
        setAnalysisStep('summarizing'); 
        setAnalysisProgress(75);
        setGlobalProgress(75);
      }, 800);
      
      setTimeout(() => { 
        setIsSummarizing(false);
        setIsExtracting(true);
        setAnalysisStep('extracting'); 
        setAnalysisProgress(90);
        setGlobalProgress(90);
      }, 1500);

      const newNote: MeetingNote = {
        id: Date.now().toString(),
        title: data.title || `Upload: ${file.name}`,
        timestamp: new Date().toLocaleString(),
        transcript: data.transcript,
        summary: data.summary,
        keyPoints: data.keyPoints || data.importantPoints || [],
        actionItems: (data.actionItems || []).map((item: any, idx: number) => ({
          ...item,
          id: `ai-item-${Date.now()}-${idx}`,
          completed: false
        })),
        keywords: data.themes || data.keywords || [],
        studyCards: (data.studyCards || []).map((card: any, idx: number) => ({
          ...card,
          id: `card-${Date.now()}-${idx}`
        })),
        speakerDetection: data.speakerDetection,
        speakerBreakdown: data.speakerBreakdown,
        analysis: data.analysis,
        duration: actualDuration,
        type: 'upload',
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        extractedQuestions: (data.extractedQuestions || []).map((q: string, i: number) => ({
          question: q,
          answer: data.answers?.[i] || ''
        })),
        keyDecisions: data.keyDecisions,
        themes: data.themes,
        importantPoints: data.importantPoints,
        health_score: data.health_score,
        detected_language: data.detected_language,
        talk_time: data.talk_time,
        riskAnalysis: data.riskAnalysis,
        unansweredQuestions: data.unansweredQuestions,
        responsibilityGaps: data.responsibilityGaps,
        conflicts: data.conflicts,
        meetingEfficiency: data.meetingEfficiency
      };

      setTimeout(() => { 
        setIsExtracting(false);
        setAnalysisStep('completed'); 
        setAnalysisProgress(100);
        setGlobalProgress(100);
        setTimeout(() => {
          addNote(newNote);
          showToast('Meeting analyzed successfully');
          navigate(`/meeting/${newNote.id}`);
        }, 500);
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError({ 
        type: AppErrorType.NET_SERVER_ERROR, 
        message: err.message || "Failed to process audio" 
      });
      setIsUploading(false);
      setIsProcessing(false);
      setIsTranscribing(false);
      setIsSummarizing(false);
      setIsExtracting(false);
    }
  };

  const recentNotes = [...notes].sort((a, b) => {
    if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
    if (sortBy === 'duration') {
      const getSeconds = (d: number | string) => {
        if (!d) return 0;
        if (typeof d === 'number') return d;
        if (typeof d === 'string' && d.includes(':')) {
           const [m, s] = d.split(':');
           return parseInt(m) * 60 + parseInt(s);
        }
        return parseFloat(d as string) || 0;
      };
      return getSeconds(b.duration) - getSeconds(a.duration);
    }
    return 0; // date = default order
  }).slice(0, 8);

  const quickActions = [
    { label: 'Record', desc: 'Start live recording', icon: Mic, onClick: () => navigate('/record'), gradient: 'from-red-500 to-rose-600' },
    { label: 'Upload', desc: 'Upload audio file', icon: Upload, onClick: () => fileInputRef.current?.click(), gradient: 'from-corporate-accent to-indigo-600' },
    { label: 'History', desc: 'View past meetings', icon: History, onClick: () => navigate('/history'), gradient: 'from-violet-500 to-purple-600' },
    { label: 'Tasks', desc: 'Manage action items', icon: Bell, onClick: () => navigate('/tasks'), gradient: 'from-amber-500 to-orange-600' },
  ];

  const stats = [
    { label: 'Total Meetings', value: notes.length, icon: Calendar, color: 'text-corporate-accent' },
    { label: 'Recordings', value: notes.filter(n => n.type === 'recording').length, icon: Mic, color: 'text-red-500' },
    { label: 'Uploads', value: notes.filter(n => n.type === 'upload').length, icon: Upload, color: 'text-emerald-500' },
    { label: 'Action Items', value: notes.reduce((sum, n) => sum + (n.actionItems?.length || 0), 0), icon: CheckCircle2, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-6 pb-8">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="audio/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />

      {/* Welcome Header */}
      <section className="hero-banner p-8 shadow-lg">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full font-['DM_Mono'] text-[10px] uppercase tracking-widest"
            >
              <Sparkles size={11} />
              Intelligence Suite
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="hero-title text-2xl lg:text-3xl font-['Playfair_Display'] font-bold tracking-tight"
            >
              Welcome back, {user?.firstName || 'User'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hero-subtitle text-sm max-w-md"
            >
              Nova has analyzed your recent sessions. Your weekly productivity is up by 14%.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hero-user-card flex items-center gap-3 px-4 py-3"
          >
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={user.fullName || 'User'} className="w-10 h-10 rounded-full border-2 border-white/50 object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 bg-white/25 rounded-full flex items-center justify-center text-base font-bold text-white border-2 border-white/40">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{user?.fullName}</p>
              <p className="hero-user-email text-[11px]">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-[var(--r)] shadow-sm hover:border-[var(--border2)] hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex flex-col gap-1">
              <p className="font-['DM_Mono'] text-[10px] text-[var(--text3)] uppercase tracking-[0.12em]">{stat.label}</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-[var(--text)]">{stat.value}</p>
                <stat.icon size={18} className="text-[var(--accent)] opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, idx) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={action.onClick}
            className="bg-gradient-to-br from-[var(--bg3)] to-[var(--soft2)] border border-[var(--border)] p-6 rounded-[var(--r2)] hover:border-[var(--accent3)] hover:-translate-y-0.5 hover:shadow-[var(--shadow)] transition-all text-left flex flex-col group"
          >
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform"
              style={{ background: 'linear-gradient(155deg, var(--accent), var(--accent2))' }}
            >
              <action.icon size={20} />
            </div>
            <h3 className="text-sm font-bold text-[var(--text)]">{action.label}</h3>
            <p className="text-[12px] text-[var(--text3)] mt-1">{action.desc}</p>
          </motion.button>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Join Link */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
                <Video size={20} />
              </div>
              <div>
                <h3 className="text-sm font-heading font-semibold text-[var(--ink)]">Join via Link</h3>
                <p className="text-[11px] text-[var(--ink-muted)]">Paste a Zoom, Google Meet, or Teams link</p>
              </div>
            </div>
            <MeetingLinkInput onStart={(link) => navigate('/record', { state: { link } })} />
          </div>

          {/* Upload / Progress */}
          <AnimatePresence mode="wait">
            {isProcessingLocal && (
              <motion.div key="progress" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 rounded-xl">
                <AnalysisProgress currentStep={analysisStep} progress={analysisProgress} />
              </motion.div>
            )}
            {error && (
              <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 rounded-xl">
                <ProfessionalErrorCard type={error.type} message={error.message} onRetry={() => { setError(null); setIsProcessingLocal(false); }} />
              </motion.div>
            )}
            {!isProcessingLocal && !error && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 rounded-xl">
                <AudioDropzone onFileAccepted={handleFileUpload} isProcessing={isProcessingLocal} error={null} />
              </div>
            )}
          </AnimatePresence>

          {/* Recent Meetings */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <History size={18} className="text-corporate-accent" />
                <h3 className="text-sm font-heading font-semibold text-[var(--ink)]">Recent Sessions</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center bg-[var(--border-light)] rounded-lg p-0.5">
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-[var(--bg-surface)] shadow-sm text-[var(--ink)]' : 'text-[var(--ink-muted)]'}`}>
                    <List size={14} />
                  </button>
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[var(--bg-surface)] shadow-sm text-[var(--ink)]' : 'text-[var(--ink-muted)]'}`}>
                    <LayoutGrid size={14} />
                  </button>
                </div>
                {/* Sort */}
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-[11px] font-medium text-[var(--ink-muted)] bg-[var(--border-light)] border-none rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                >
                  <option value="date">Latest</option>
                  <option value="name">Name</option>
                  <option value="duration">Duration</option>
                </select>
                <Link to="/history" className="text-[11px] font-semibold text-corporate-accent hover:underline flex items-center gap-1">
                  View All <ArrowRight size={11} />
                </Link>
              </div>
            </div>

            {recentNotes.length === 0 ? (
              <EmptyState 
                icon={History}
                title="No recent sessions"
                description="Your analyzed meetings will appear here."
                action={{ label: "Start Recording", onClick: () => navigate('/record') }}
              />
            ) : viewMode === 'list' ? (
              <div className="divide-y divide-[var(--border)]">
                {recentNotes.map(note => (
                  <Link 
                    key={note.id} 
                    to={`/meeting/${note.id}`}
                    className="flex items-center justify-between p-4 hover:bg-[var(--border-light)] transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[var(--border-light)] rounded-xl flex items-center justify-center text-[var(--ink-muted)] group-hover:text-corporate-accent group-hover:bg-corporate-accent/10 transition-all">
                        <FileText size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <InlineRename 
                          value={note.title || 'Untitled Session'} 
                          onSave={(newName) => { updateNote(note.id, { title: newName }); showToast('Renamed'); }}
                          textClassName="text-[13px] font-medium text-[var(--ink)] truncate group-hover:text-corporate-accent transition-colors block"
                        />
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[var(--ink-muted)]">{note.timestamp?.split(',')[0]}</span>
                          <span className="w-1 h-1 bg-[var(--border)] rounded-full" />
                          <span className="text-[10px] text-[var(--ink-muted)]">{note.duration}</span>
                          {note.speakerDetection && note.speakerDetection.length > 0 && (
                            <>
                              <span className="w-1 h-1 bg-[var(--border)] rounded-full" />
                              <span className="flex items-center gap-1 text-[10px] text-[var(--ink-muted)]">
                                <Users size={10} /> {new Set(note.speakerDetection.map(s => s.speaker)).size} speakers
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        note.type === 'recording' ? 'bg-red-500/10 text-red-500' : 'bg-corporate-accent/10 text-corporate-accent'
                      }`}>
                        {note.type}
                      </span>
                      <ArrowRight size={14} className="text-[var(--border)] group-hover:text-corporate-accent group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 grid grid-cols-2 gap-3">
                {recentNotes.map(note => (
                  <Link
                    key={note.id}
                    to={`/meeting/${note.id}`}
                    className="bg-[var(--border-light)] hover:bg-corporate-accent/5 border border-transparent hover:border-corporate-accent/20 p-4 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={14} className="text-corporate-accent" />
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        note.type === 'recording' ? 'bg-red-500/10 text-red-500' : 'bg-corporate-accent/10 text-corporate-accent'
                      }`}>{note.type}</span>
                    </div>
                    <InlineRename 
                      value={note.title || 'Untitled Session'} 
                      onSave={(newName) => { updateNote(note.id, { title: newName }); showToast('Renamed'); }}
                      textClassName="text-[13px] font-medium text-[var(--ink)] truncate group-hover:text-corporate-accent transition-colors block"
                    />
                    <p className="text-[10px] text-[var(--ink-muted)] mt-1 line-clamp-2">{note.summary || 'No summary'}</p>
                    <div className="flex items-center gap-2 mt-2 text-[9px] text-[var(--ink-muted)]">
                      <Clock size={10} /> {note.duration}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-amber-500" />
                <h3 className="text-sm font-heading font-semibold text-[var(--ink)]">Intelligence Reminders</h3>
              </div>
              <Link to="/tasks" className="text-[10px] font-semibold text-[var(--accent)] hover:underline uppercase tracking-wider">Manage</Link>
            </div>
            <div className="p-3 space-y-2">
              {(() => {
                try {
                  const pendingNotes = notes.filter(n => n.actionItems?.some(i => !i.completed)).slice(0, 3);
                  if (pendingNotes.length > 0) {
                    return pendingNotes.map(note => (
                      <div key={note.id} className="flex items-start gap-3 p-3 bg-[var(--soft)]/30 border border-[var(--border)] rounded-xl group hover:border-[var(--accent)] transition-all">
                        <CheckCircle2 size={15} className="text-[var(--accent)] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium text-[var(--text)] truncate">{note.actionItems?.find(i => !i.completed)?.text}</p>
                          <p className="text-[10px] text-[var(--text3)] truncate italic">From "{note.title}"</p>
                        </div>
                      </div>
                    ));
                  }
                } catch (e) {
                  console.error("Reminders failed", e);
                }
                return (
                  <div className="p-6 text-center text-[var(--text3)] space-y-2">
                    <Sparkles size={16} className="mx-auto opacity-40" />
                    <p className="text-[11px] font-medium leading-relaxed">No pending actions from your recent sessions. You're all caught up!</p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* System Status */}
          <div className="p-5 rounded-xl space-y-4 text-white" style={{ background: 'linear-gradient(135deg, var(--accent2), var(--accent))' }}>
            <h3 className="text-sm font-heading font-semibold">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">AI Engine</span>
                <span className="text-emerald-400 font-semibold">Online</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Storage</span>
                <span className="text-white font-semibold">1.2 / 5 GB</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="w-[24%] h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent3))' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
