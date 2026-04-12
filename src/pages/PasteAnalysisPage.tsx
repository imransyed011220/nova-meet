/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Loader2,
  AlertCircle,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMeetingHistory } from "../hooks/useMeetingHistory";
import { useToast } from "../hooks/useToast";
import { geminiService } from "../services/geminiService";
import { MeetingNote } from "../types";

export const PasteAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNote } = useMeetingHistory();
  const { showToast } = useToast();

  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      showToast("Please provide a session transcript", "error");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Intelligence frequency offline (API Key missing)");

      const data = await geminiService.processTranscript(transcript, apiKey);

      const newNote: MeetingNote = {
        id: Date.now().toString(),
        title: data.title || `Intelligence Sync: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        timestamp: new Date().toLocaleString(),
        transcript: transcript,
        summary: data.summary,
        keyPoints: data.keyPoints || data.importantPoints || [],
        actionItems: (data.actionItems || []).map((item: any, idx: number) => ({
          ...item,
          id: `ai-item-${Date.now()}-${idx}`,
          completed: false,
        })),
        keywords: data.themes || data.keywords || [],
        studyCards: (data.studyCards || []).map((card: any, idx: number) => ({
          ...card,
          id: `card-${Date.now()}-${idx}`,
        })),
        speakerBreakdown: data.speakerBreakdown,
        analysis: data.analysis,
        duration: "N/A",
        type: "upload",
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
        meetingEfficiency: data.meetingEfficiency,
      };

      addNote(newNote);
      showToast("Intelligence synthesis complete");
      navigate(`/meeting/${newNote.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Synthesis failed. Please verify frequency.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-['Playfair_Display'] font-bold text-[var(--text)] flex items-center gap-3">
            <Sparkles className="text-[var(--accent)]" size={28} strokeWidth={1.5} />
            Instant Synthesis
          </h1>
          <p className="text-[var(--text3)] text-base">
            Paste raw meeting dialogue for high-density AI intelligence.
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
        <div className="p-8 md:p-10 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-[var(--accent2)] uppercase tracking-[0.2em] flex items-center gap-2 font-['DM_Mono']">
              <FileText size={14} />
              Session Dialogue Registry
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste the raw transcript here... (e.g., Speaker 1: Insights shared...)"
              className="w-full h-[450px] p-8 bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--r)] text-[15px] leading-loose text-[var(--text2)] focus:border-[var(--accent)] outline-none resize-none custom-scrollbar transition-all font-serif italic"
            />
          </div>

          {error && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-5 bg-[var(--err)]/5 border border-[var(--err)]/20 rounded-[var(--r)] flex items-center gap-4 text-[var(--err)] text-sm font-medium"
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}

          <div className="flex justify-center pt-4">
            <button
              onClick={handleAnalyze}
              disabled={isProcessing || !transcript.trim()}
              className="w-full max-w-md bg-[var(--accent)] text-white py-4 rounded-full flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.2em] hover:bg-[var(--accent2)] transition-all shadow-xl shadow-[var(--accent)]/30 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none font-['DM_Sans']"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Synthesizing Intelligence...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Initiate Deep Sync
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Core Summary", desc: "Concise executive synthesis", icon: Sparkles },
          { title: "Task Registry", desc: "Actions, owners, and deadlines", icon: FileText },
          { title: "Health Scan", desc: "Sentiment and risk detection", icon: AlertCircle },
        ].map((item, i) => (
          <div
            key={i}
            className="p-6 bg-[var(--bg3)] border border-[var(--border)] rounded-[var(--r)] group hover:border-[var(--accent3)] transition-all"
          >
            <item.icon size={18} className="text-[var(--accent3)] mb-4" />
            <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-widest mb-1.5">
              {item.title}
            </h3>
            <p className="text-[11px] text-[var(--text3)] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
