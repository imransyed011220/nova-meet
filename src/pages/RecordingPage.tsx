/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mic, 
  Monitor, 
  Check, 
  AlertCircle,
  ArrowLeft,
  Video,
  Activity,
  Volume2,
  Users,
  Link as LinkIcon,
  Loader2,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioRecorder, RecordingMode } from '../hooks/useAudioRecorder';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { RecordingAnimation } from '../components/RecordingAnimation';
import { AnalysisProgress, AnalysisStep } from '../components/AnalysisProgress';
import { ProfessionalErrorCard } from '../components/ProfessionalErrorCard';
import { LiveTranscript } from '../components/LiveTranscript';
import { RecordingControls } from '../components/RecordingControls';
import { RenameMeetingModal } from '../components/RenameMeetingModal';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { useLoading } from '../hooks/useLoading';
import { useToast } from '../hooks/useToast';
import { geminiService } from '../services/geminiService';
import { AppErrorType, getErrorMessage } from '../utils/ErrorHandler';
import { MeetingNote } from '../types';

export const RecordingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNote } = useMeetingHistory();
  const { showToast } = useToast();
  const { 
    setIsRecording, setIsProcessing, setIsTranscribing, 
    setIsSummarizing, setIsExtracting, setGlobalProgress 
  } = useLoading();
  
  const [appError, setAppError] = useState<{ type: AppErrorType; message: string } | null>(null);
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('uploading');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [recordingMode, setRecordingMode] = useState<RecordingMode | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<{ blob: Blob; duration: number } | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState<{ timestamp: string; content: string }[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  
  const meetingLink = location.state?.link;

  useEffect(() => {
    if (meetingLink) {
      setRecordingMode('meeting');
    }
  }, [meetingLink]);

  const { 
    status, 
    setStatus, 
    recordingTime, 
    volume,
    isSpeaking,
    liveTranscript,
    startRecording, 
    stopRecording, 
    pauseRecording,
    resumeRecording,
    convertToWav,
    analyser 
  } = useAudioRecorder({
    onRecordingComplete: (blob, duration) => {
      setPendingAudio({ blob, duration });
      setIsRenameModalOpen(true);
    },
    onError: (type) => {
      setAppError({ type, message: getErrorMessage(type) });
      setIsRecording(false);
    }
  });

  useEffect(() => {
    setIsRecording(status === 'recording');
    if (status === 'recording' && !startTime) {
      setStartTime(new Date().toISOString());
      setUserNotes([]);
    }
    if (status === 'idle') {
      setStartTime(null);
    }
    if (status === 'processing') setIsProcessing(true);
    if (status === 'completed' || status === 'error') {
      setIsProcessing(false);
      setIsRecording(false);
    }
  }, [status, setIsRecording, setIsProcessing]);

  const handleSaveAndAnalyze = async (meetingName: string) => {
    if (!pendingAudio) return;
    
    setIsRenameModalOpen(false);
    setAppError(null);
    setStatus('processing');
    setAnalysisStep('uploading');
    setAnalysisProgress(10);
    setGlobalProgress(10);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      setTimeout(() => { 
        setAnalysisStep('processing'); 
        setAnalysisProgress(30);
        setGlobalProgress(30);
      }, 500);
      
      const wavBlob = await convertToWav(pendingAudio.blob);
      
      setIsTranscribing(true);
      setTimeout(() => { 
        setAnalysisStep('transcribing'); 
        setAnalysisProgress(50);
        setGlobalProgress(50);
      }, 1000);
      
      const data = await geminiService.processAudio(wavBlob, apiKey);
      setIsTranscribing(false);
      
      setIsSummarizing(true);
      setAnalysisStep('summarizing');
      setAnalysisProgress(75);
      setGlobalProgress(75);
      
      setTimeout(() => { 
        setIsSummarizing(false);
        setIsExtracting(true);
        setAnalysisStep('extracting'); 
        setAnalysisProgress(90);
        setGlobalProgress(90);
      }, 800);

      const newNote: MeetingNote = {
        id: Date.now().toString(),
        title: data.title || meetingName,
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
        duration: pendingAudio.duration,
        type: 'recording',
        startTime: startTime || undefined,
        endTime: new Date().toISOString(),
        userNotes: userNotes.length > 0 ? userNotes : undefined,
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
          showToast('Meeting recorded and analyzed successfully');
          navigate(`/meeting/${newNote.id}`);
        }, 500);
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setAppError({ 
        type: AppErrorType.NET_SERVER_ERROR, 
        message: err.message || getErrorMessage(AppErrorType.NET_SERVER_ERROR) 
      });
      setStatus('error');
      setIsProcessing(false);
      setIsTranscribing(false);
      setIsSummarizing(false);
      setIsExtracting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddNote = () => {
    if (currentNote.trim()) {
      setUserNotes(prev => [...prev, { 
        timestamp: formatTime(recordingTime), 
        content: currentNote.trim() 
      }]);
      setCurrentNote('');
    }
  };
   
  const handleNoteKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddNote();
  };

  const isIdle = status === 'idle' || status === 'completed' || status === 'error';

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full py-12 px-6 bg-[var(--bg)]">
      {/* Top Thin Progress Bar for Processing State */}
      {status === 'processing' && (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-[var(--border)] z-50">
          <div 
            className="h-full bg-[var(--accent)] transition-all duration-700 ease-in-out"
            style={{ width: `${analysisProgress}%` }}
          />
        </div>
      )}

      <div className="w-full max-w-[1000px] flex flex-col lg:flex-row gap-6 items-stretch justify-center">
        <div className={`w-full max-w-[620px] bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--r2)] shadow-[var(--shadow2)] relative overflow-hidden flex flex-col ${status === 'recording' || status === 'paused' ? 'lg:flex-1' : ''}`}>
          
          {/* DURING RECORDING BADGE */}
          <AnimatePresence>
            {(status === 'recording' || status === 'paused') && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full border border-[var(--border)] shadow-sm z-20"
              >
                <div className={`w-2.5 h-2.5 rounded-full bg-[var(--err)] ${status === 'recording' ? 'animate-pulse-slow' : ''}`} />
                <span className={`font-['DM_Mono'] text-[11px] font-bold tracking-widest ${status === 'recording' ? 'text-[var(--err)]' : 'text-[var(--warn)]'}`}>
                  {status === 'paused' ? 'PAUSED' : 'LIVE'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-10 flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {/* --- BEFORE RECORDING --- */}
              {isIdle && (
                <motion.div 
                  key="before-recording"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-['Playfair_Display'] font-semibold text-[var(--accent2)]">
                      {meetingLink ? 'Start Meeting Session' : 'Create New Session'}
                    </h2>
                    <p className="text-sm text-[var(--text3)]">
                      {meetingLink ? 'Join the call and Nova will handle the rest.' : 'Choose your recording environment below.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { mode: 'meeting' as RecordingMode, icon: Users, label: 'Meeting', desc: 'Smarter' },
                      { mode: 'microphone' as RecordingMode, icon: Mic, label: 'Voice', desc: 'Focused' },
                      { mode: 'system' as RecordingMode, icon: Monitor, label: 'System', desc: 'Native' },
                    ].map((opt) => {
                      const isSelected = recordingMode === opt.mode;
                      return (
                        <button
                          key={opt.mode}
                          onClick={() => setRecordingMode(opt.mode)}
                          className={`group h-[110px] flex flex-col items-center justify-center gap-2 rounded-[var(--r2)] transition-all duration-300 ${
                            isSelected 
                              ? 'border-2 border-[var(--accent)] bg-[var(--soft2)] shadow-inner' 
                              : 'border border-[var(--border)] bg-gradient-to-br from-[var(--bg3)] to-[var(--soft2)] hover:border-[var(--border2)]'
                          }`}
                        >
                          <opt.icon 
                            size={24} 
                            className={`transition-colors duration-300 ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text3)] group-hover:text-[var(--accent3)]'}`} 
                          />
                          <div className="text-center">
                            <span className={`block font-['DM_Sans'] text-[13px] font-bold ${isSelected ? 'text-[var(--text)]' : 'text-[var(--text2)]'}`}>{opt.label}</span>
                            <span className="block font-['DM_Mono'] text-[11px] text-[var(--text3)]">{opt.desc}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="pt-4">
                    <button
                      disabled={!recordingMode}
                      onClick={() => recordingMode && startRecording(recordingMode)}
                      className="w-full h-[52px] bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white rounded-[var(--r)] text-[14px] font-bold transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-[0_6_22px_rgba(184,85,47,.3)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Mic size={18} /> Start Recording
                    </button>
                  </div>
                </motion.div>
              )}

              {/* --- DURING RECORDING --- */}
              {(status === 'recording' || status === 'paused' || status === 'listening') && (
                <motion.div 
                  key="during-recording"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-6 space-y-12"
                >
                  {status === 'listening' ? (
                    <div className="flex flex-col items-center py-12 gap-5">
                      <div className="w-12 h-12 rounded-full border-4 border-[var(--soft)] border-t-[var(--accent)] animate-spin" />
                      <p className="font-['DM_Mono'] text-[12px] text-[var(--text3)] animate-pulse">Initializing Environment...</p>
                    </div>
                  ) : (
                    <>
                      <div className="font-['DM_Mono'] text-[48px] font-light tracking-[3px] text-[var(--text)] leading-none">
                        {formatTime(recordingTime)}
                      </div>
                      
                      <div className="w-full bg-[var(--soft2)]/50 rounded-2xl p-6 border border-[var(--border)]">
                         <WaveformVisualizer 
                            analyser={analyser} 
                            isRecording={status === 'recording'} 
                            barColor="var(--accent)"
                            barWidth={4}
                            borderRadius={10}
                          />
                      </div>
                      
                      <div className="flex items-center gap-4 w-full px-4">
                        <button
                          onClick={status === 'paused' ? resumeRecording : pauseRecording}
                          className="flex-1 h-[48px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-[var(--r)] text-[14px] font-bold flex items-center justify-center gap-2 transition-all hover:bg-[var(--bg2)] active:scale-[0.98]"
                        >
                          {status === 'paused' ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          onClick={stopRecording}
                          className="flex-1 h-[48px] bg-[var(--err)] text-white rounded-[var(--r)] text-[14px] font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md active:scale-[0.98]"
                        >
                          <Square size={16} className="fill-current" /> Stop Session
                        </button>
                      </div>

                    </>
                  )}
                </motion.div>
              )}

              {/* --- AFTER RECORDING (PROCESSING) --- */}
              {status === 'processing' && (
                <motion.div 
                  key="after-recording"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 flex flex-col items-center gap-10"
                >
                  <div className="text-center space-y-3">
                    <h3 className="text-2xl font-['Playfair_Display'] font-semibold text-[var(--accent2)]">Processing Engine</h3>
                    <p className="text-[13px] text-[var(--text3)]">Distilling your conversation into actionable data.</p>
                  </div>

                  <div className="w-full max-w-[360px] space-y-6">
                    {[
                      { id: 'uploading', label: 'Preparing Session' },
                      { id: 'transcribing', label: 'High-Fidelity Transcription' },
                      { id: 'summarizing', label: 'AI Synthesis & Summary' },
                      { id: 'extracting', label: 'Itemizing Action Items' },
                    ].map((step, idx) => {
                      const steps: AnalysisStep[] = ['uploading', 'processing', 'transcribing', 'summarizing', 'extracting', 'completed'];
                      const currentIdx = steps.indexOf(analysisStep);
                      const effectiveCurrentIdx = analysisStep === 'processing' ? steps.indexOf('transcribing') : currentIdx;
                      const stepIdx = ['uploading', 'transcribing', 'summarizing', 'extracting'].indexOf(step.id);
                      
                      const isCompleted = stepIdx < effectiveCurrentIdx;
                      const isActive = stepIdx === effectiveCurrentIdx;

                      return (
                        <div key={step.id} className="flex items-center gap-5">
                          <div className="w-6 flex justify-center shrink-0">
                            {isCompleted ? (
                              <Check size={18} className="text-[var(--ok)]" />
                            ) : isActive ? (
                              <div className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-[var(--border2)]" />
                            )}
                          </div>
                          <span className={`text-[14px] font-['DM_Mono'] ${isCompleted ? 'text-[var(--text)] font-medium' : isActive ? 'text-[var(--accent)] font-bold' : 'text-[var(--text3)]'}`}>
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* ERROR STATE */}
              {status === 'error' && appError && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full py-12 text-center space-y-8">
                  <div className="mx-auto w-20 h-20 bg-[var(--soft2)] rounded-full flex items-center justify-center shadow-sm">
                    <AlertCircle size={40} className="text-[var(--err)]" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-[var(--text)]">System Failure</h3>
                    <p className="text-sm text-[var(--text3)] max-w-[300px] mx-auto leading-relaxed">{appError.message}</p>
                  </div>
                  <button
                    onClick={() => { setStatus('idle'); setRecordingMode(null); }}
                    className="px-8 h-[48px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-[var(--r)] text-[14px] font-bold transition-all hover:bg-[var(--bg2)] active:scale-[0.98]"
                  >
                    Restart Engine
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- LIVE NOTES PANEL --- */}
        <AnimatePresence>
          {(status === 'recording' || status === 'paused') && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full lg:w-[360px] bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--r2)] shadow-[var(--shadow2)] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--border)] bg-[var(--bg3)]">
                <h3 className="text-lg font-bold text-[var(--text)] font-['Playfair_Display'] flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  Session Notes
                </h3>
                <p className="text-[11px] text-[var(--text3)] uppercase tracking-wider font-['DM_Mono'] mt-1">Live Intelligence Log</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[400px] custom-scrollbar">
                {userNotes.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4">
                    <div className="w-12 h-12 rounded-full border border-dashed border-[var(--text3)] flex items-center justify-center">
                       <Mic size={18} className="text-[var(--text3)]" />
                    </div>
                    <p className="text-[12px] text-[var(--text3)] font-medium">Capture insights as they happen.<br/>Your thoughts are timestamped.</p>
                  </div>
                ) : (
                  userNotes.map((note, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative bg-[var(--bg2)] border border-[var(--border)] p-3 rounded-xl hover:border-[var(--accent)] transition-all"
                    >
                      <span className="text-[10px] font-bold text-[var(--accent)] font-['DM_Mono'] mb-1 block">[{note.timestamp}]</span>
                      <p className="text-[13px] text-[var(--text)] leading-relaxed">{note.content}</p>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="p-6 bg-[var(--bg2)] border-t border-[var(--border)] space-y-3">
                <div className="relative">
                  <textarea
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    onKeyDown={handleNoteKey}
                    placeholder="Type a key observation..."
                    className="w-full h-[80px] p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm outline-none resize-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text3)]"
                  />
                </div>
                <button
                  onClick={handleAddNote}
                  disabled={!currentNote.trim()}
                  className="w-full h-[44px] bg-[var(--accent)] text-white rounded-xl text-[13px] font-bold transition-all hover:bg-[var(--accent2)] disabled:opacity-40 shadow-md shadow-[var(--accent)]/10"
                >
                  Save Note
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RenameMeetingModal
        isOpen={isRenameModalOpen}
        initialName={`Meeting - ${new Date().toLocaleString()}`}
        onSave={handleSaveAndAnalyze}
        onClose={() => {
          setIsRenameModalOpen(false);
          setStatus('idle');
          setRecordingMode(null);
        }}
      />
    </div>
  );
};

