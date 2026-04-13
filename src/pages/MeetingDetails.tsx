/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Clock, 
  Calendar, 
  FileText, 
  Sparkles, 
  ListChecks,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Share2,
  Copy,
  ChevronRight,
  Edit2,
  Check,
  MoreVertical,
  FileJson,
  Type as TypeIcon,
  Plus,
  User,
  Circle,
  CheckCircle2,
  X,
  Zap,
  Users,
  Search,
  BookOpen,
  TrendingUp,
  Loader2,
  AlertTriangle,
  HelpCircle,
  Scale,
  Gauge,
  ShieldAlert,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { useToast } from '../hooks/useToast';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { InlineRename } from '../components/InlineRename';
import { ActionItem } from '../types';
import { geminiService } from '../services/geminiService';

export const MeetingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notes, updateNote, deleteNote } = useMeetingHistory();
  const { showToast } = useToast();
  const note = notes.find(n => n.id === id);
  
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');
  const [copied, setCopied] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(note?.title || '');
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const [isAddingActionItem, setIsAddingActionItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newItemAssignee, setNewItemAssignee] = useState('');
  const [newItemDueDate, setNewItemDueDate] = useState('');

  const [isAddingStudyCard, setIsAddingStudyCard] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [newCardQuestion, setNewCardQuestion] = useState('');
  const [newCardAnswer, setNewCardAnswer] = useState('');

  const [editingSpeakerIndex, setEditingSpeakerIndex] = useState<number | null>(null);
  const [newSpeakerName, setNewSpeakerName] = useState('');

  const [isExtractingQuestions, setIsExtractingQuestions] = useState(false);
  const [questions, setQuestions] = useState<{ question: string; answer?: string }[]>(note?.extractedQuestions || []);

  const [editingActionItemIndex, setEditingActionItemIndex] = useState<number | null>(null);
  const [isEditingActionItem, setIsEditingActionItem] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Data Mapping Reconciliation
  const actionItems = note?.actionItems || (note as any)?.action_items || (note as any)?.tasks || [];
  const keyPoints = note?.keyPoints || (note as any)?.key_points || (note as any)?.key_decisions || (note as any)?.keyTakeaways || (note as any)?.takeaways || (note as any)?.highlights || [];
  const studyCards = note?.studyCards || (note as any)?.study_cards || (note as any)?.flashcards || (note as any)?.learning_cards || [];
  const talkTime = note?.talk_time || (note as any)?.speakerBreakdown || (note as any)?.speakers || (note as any)?.speaker_analysis || [];
  const keyMoments = note?.key_moments || (note as any)?.timeline || (note as any)?.important_moments || [];
  const analysis = note?.analysis || (note as any)?.meta_analysis || { sentiment: '', productivity: '', decisions: [], risks: [] };
  const sentiment = note?.sentiment || (analysis as any)?.sentiment || (note as any)?.overall_sentiment;
  const themes = note?.themes || (note as any)?.keywords || [];
  const keyDecisions = note?.keyDecisions || (analysis as any)?.decisions || [];
  const importantPoints = note?.importantPoints || note?.keyPoints || [];

  // Advanced Intelligence Data
  const riskAnalysis = note?.riskAnalysis || [];
  const unansweredQuestions = note?.unansweredQuestions || [];
  const responsibilityGaps = note?.responsibilityGaps || [];
  const conflicts = note?.conflicts || [];
  const meetingEfficiency = note?.meetingEfficiency;

  const getSentimentText = () => {
    if (typeof sentiment === 'string') return sentiment;
    if (sentiment?.overall) return sentiment.overall;
    return 'Neutral';
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="py-6 px-4 text-center text-[13px] text-[var(--text3)] font-['DM_Mono'] italic">
      {message}
    </div>
  );

  if (!note) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <FileText size={32} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Session not found</h2>
          <p className="text-sm text-slate-500">The meeting intelligence you're looking for doesn't exist or has been deleted.</p>
        </div>
        <button 
          onClick={() => navigate('/history')} 
          className="px-6 py-2 bg-corporate-primary text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
        >
          Back to History
        </button>
      </div>
    );
  }

  const handleSaveTitle = () => {
    if (note && newTitle.trim()) {
      updateNote(note.id, { title: newTitle.trim() });
      setIsEditingTitle(false);
      showToast('Title updated successfully');
    }
  };

  const handleFeedback = (feedback: 'positive' | 'negative') => {
    if (note) {
      updateNote(note.id, { feedback: note.feedback === feedback ? undefined : feedback });
      showToast(`Feedback ${note.feedback === feedback ? 'removed' : 'submitted'}`);
    }
  };

  const handleDelete = () => {
    if (note) {
      try {
        deleteNote(note.id);
        showToast('Meeting deleted successfully');
        navigate('/history');
      } catch (error) {
        showToast('Failed to delete meeting', 'error');
      }
    }
  };

  const handleAddActionItem = () => {
    if (note && newItemText.trim()) {
      const newItem: ActionItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        completed: false,
        assignee: newItemAssignee.trim() || undefined,
        dueDate: newItemDueDate || undefined
      };
      const updatedItems = [...(note.actionItems || []), newItem];
      updateNote(note.id, { actionItems: updatedItems });
      setNewItemText('');
      setNewItemAssignee('');
      setNewItemDueDate('');
      setIsAddingActionItem(false);
      showToast('Action item added');
    }
  };

  const toggleActionItem = (itemId: string) => {
    if (note && note.actionItems) {
      const updatedItems = note.actionItems.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      updateNote(note.id, { actionItems: updatedItems });
    }
  };

  const deleteActionItem = (itemId: string) => {
    if (note && note.actionItems) {
      const updatedItems = note.actionItems.filter(item => item.id !== itemId);
      updateNote(note.id, { actionItems: updatedItems });
      showToast('Action item removed');
    }
  };

  const handleAddStudyCard = () => {
    if (note && newCardQuestion.trim() && newCardAnswer.trim()) {
      const newCard = { 
        id: `card-${Date.now()}`,
        question: newCardQuestion.trim(), 
        answer: newCardAnswer.trim() 
      };
      const updatedCards = [...(note.studyCards || []), newCard];
      updateNote(note.id, { studyCards: updatedCards });
      setNewCardQuestion('');
      setNewCardAnswer('');
      setIsAddingStudyCard(false);
      showToast('Study card added');
    }
  };

  const handleUpdateStudyCard = (index: number) => {
    if (note && note.studyCards && newCardQuestion.trim() && newCardAnswer.trim()) {
      const updatedCards = [...note.studyCards];
      updatedCards[index] = { ...updatedCards[index], question: newCardQuestion.trim(), answer: newCardAnswer.trim() };
      updateNote(note.id, { studyCards: updatedCards });
      setEditingCardIndex(null);
      setNewCardQuestion('');
      setNewCardAnswer('');
      showToast('Study card updated');
    }
  };

  const handleDeleteStudyCard = (index: number) => {
    if (note && note.studyCards) {
      const updatedCards = note.studyCards.filter((_, i) => i !== index);
      updateNote(note.id, { studyCards: updatedCards });
      showToast('Study card removed');
    }
  };

  const handleExtractQuestions = () => {
    if (note?.extractedQuestions && note.extractedQuestions.length > 0) {
      setQuestions(note.extractedQuestions);
      showToast('Questions loaded from analysis');
    } else {
      showToast('No unaddressed questions were detected during the analysis.', 'error');
    }
  };

  const handleSpeakerFeedback = (index: number, feedback: 'correct' | 'incorrect' | string) => {
    if (note && note.speakerDetection) {
      const updatedDetection = [...note.speakerDetection];
      updatedDetection[index] = { ...updatedDetection[index], feedback };
      updateNote(note.id, { speakerDetection: updatedDetection });
      showToast('Speaker feedback saved');
    }
  };

  const exportFormats = [
    { id: 'md', label: 'Markdown', icon: FileText, action: () => downloadMarkdown() },
    { id: 'txt', label: 'Plain Text', icon: TypeIcon, action: () => downloadTxt() },
    { id: 'pdf', label: 'PDF Document', icon: FileText, action: () => downloadPdf() },
    { id: 'json', label: 'JSON Object', icon: FileJson, action: () => downloadJson() },
  ];

  const downloadMarkdown = () => {
    const content = `
# ${note.title || 'Meeting Note'}
Date: ${note.timestamp}
Duration: ${note.duration}

## Summary
${note.summary}

## Key Points
${note.keyPoints.map(p => `- ${p}`).join('\n')}

${note.actionItems && note.actionItems.length > 0 ? `## Action Items
${note.actionItems.map(item => `- [${item.completed ? 'x' : ' '}] ${item.text}${item.assignee ? ` (@${item.assignee})` : ''}${item.dueDate ? ` (Due: ${item.dueDate})` : ''}`).join('\n')}` : ''}

${note.analysis ? `## In-depth Analysis
- Sentiment: ${note.analysis.sentiment}
- Productivity: ${note.analysis.productivity}
- Decisions: ${note.analysis.decisions.join(', ')}
- Risks: ${note.analysis.risks.join(', ')}` : ''}

${note.keywords && note.keywords.length > 0 ? `## Keywords
${note.keywords.join(', ')}` : ''}

## Transcript
${note.transcript}
    `.trim();

    const blob = new Blob([content], { type: 'text/markdown' });
    saveBlob(blob, `${note.title || 'meeting'}-${note.id}.md`);
  };

  const downloadTxt = () => {
    const content = `
MEETING: ${note.title || 'Untitled'}
DATE: ${note.timestamp}
DURATION: ${note.duration}

SUMMARY:
${note.summary}

KEY POINTS:
${note.keyPoints.map(p => `• ${p}`).join('\n')}

${note.actionItems && note.actionItems.length > 0 ? `ACTION ITEMS:
${note.actionItems.map(item => `[${item.completed ? 'DONE' : 'TODO'}] ${item.text}${item.assignee ? ` - ${item.assignee}` : ''}${item.dueDate ? ` (Due: ${item.dueDate})` : ''}`).join('\n')}` : ''}

${note.analysis ? `ANALYSIS:
- Sentiment: ${note.analysis.sentiment}
- Productivity: ${note.analysis.productivity}
- Decisions: ${note.analysis.decisions.join(', ')}
- Risks: ${note.analysis.risks.join(', ')}` : ''}

TRANSCRIPT:
${note.transcript}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    saveBlob(blob, `${note.title || 'meeting'}-${note.id}.txt`);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(note, null, 2)], { type: 'application/json' });
    saveBlob(blob, `${note.title || 'meeting'}-${note.id}.json`);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    const title = note.title || 'Meeting Note';
    
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${note.timestamp} | Duration: ${note.duration}`, 14, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Summary', 14, 45);
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(note.summary, 180);
    doc.text(splitSummary, 14, 52);
    
    let currentY = 52 + (splitSummary.length * 5) + 10;
    
    doc.setFontSize(14);
    doc.text('Key Takeaways', 14, currentY);
    doc.setFontSize(10);
    currentY += 7;
    note.keyPoints.forEach(point => {
      const splitPoint = doc.splitTextToSize(`• ${point}`, 170);
      doc.text(splitPoint, 14, currentY);
      currentY += (splitPoint.length * 5) + 2;
    });

    if (note.actionItems && note.actionItems.length > 0) {
      currentY += 5;
      doc.setFontSize(14);
      doc.text('Action Items', 14, currentY);
      doc.setFontSize(10);
      currentY += 7;
      note.actionItems.forEach(item => {
        const status = item.completed ? '[DONE] ' : '[TODO] ';
        const text = `${status}${item.text}${item.assignee ? ` (@${item.assignee})` : ''}`;
        const splitItem = doc.splitTextToSize(text, 170);
        doc.text(splitItem, 14, currentY);
        currentY += (splitItem.length * 5) + 2;
      });
    }

    if (note.analysis) {
      currentY += 5;
      doc.setFontSize(14);
      doc.text('In-depth Analysis', 14, currentY);
      doc.setFontSize(10);
      currentY += 7;
      doc.text(`Sentiment: ${note.analysis.sentiment}`, 14, currentY);
      currentY += 7;
      doc.text(`Productivity: ${note.analysis.productivity}`, 14, currentY);
      currentY += 7;
      
      doc.text('Decisions:', 14, currentY);
      currentY += 5;
      note.analysis.decisions.forEach(d => {
        doc.text(`• ${d}`, 18, currentY);
        currentY += 5;
      });
      
      doc.text('Risks:', 14, currentY);
      currentY += 5;
      note.analysis.risks.forEach(r => {
        doc.text(`• ${r}`, 18, currentY);
        currentY += 5;
      });
    }
    
    doc.save(`${note.title || 'meeting'}-${note.id}.pdf`);
    showToast('PDF exported successfully');
  };

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${filename.split('.').pop()?.toUpperCase()} exported successfully`);
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(note.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDuration = (seconds: number | string) => {
    if (!seconds || seconds === 0 || seconds === '0') return '00:00';
    if (typeof seconds === 'string' && seconds.includes(':')) return seconds;
    const numSeconds = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
    const mins = Math.floor(numSeconds / 60);
    const secs = Math.floor(numSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/history')}
            className="text-[11px] font-bold text-[var(--accent2)] uppercase tracking-widest hover:translate-x-[-4px] transition-transform flex items-center gap-2 mb-3"
          >
            <ArrowLeft size={14} strokeWidth={3} /> Intelligence Archive
          </button>
          
          <div className="flex items-center gap-4 group">
            <h1 className="text-3xl font-['Playfair_Display'] font-bold text-[var(--text)] tracking-tight">
              {note.title || 'Untitled Intelligence'}
            </h1>
            <button 
              onClick={() => setIsEditingTitle(true)}
              className="p-1.5 text-[var(--text3)] hover:text-[var(--accent)] transition-colors opacity-0 group-hover:opacity-100"
            >
              <Edit2 size={16} />
            </button>
          </div>
          
          <AnimatePresence>
            {isEditingTitle && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-[var(--bg3)] p-8 rounded-2xl shadow-2xl border border-[var(--border)] w-full max-w-md"
                >
                  <h3 className="text-lg font-bold mb-4 font-['Playfair_Display']">Rename Session</h3>
                  <input 
                    type="text" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl mb-6 outline-none focus:border-[var(--accent)]"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setIsEditingTitle(false)} className="flex-1 py-3 text-sm font-bold text-[var(--text3)] hover:bg-[var(--soft2)] rounded-xl transition-all">Cancel</button>
                    <button onClick={handleSaveTitle} className="flex-1 py-3 bg-[var(--accent)] text-white text-sm font-bold rounded-xl shadow-lg shadow-[var(--accent)]/20">Save Rename</button>
                  </div>
                </motion.div>
              </div>
            )}

            {(isAddingActionItem || isEditingActionItem) && (
               <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--bg3)] p-8 rounded-2xl shadow-2xl border border-[var(--border)] w-full max-w-md space-y-4">
                  <h3 className="text-lg font-bold font-['Playfair_Display']">{isEditingActionItem ? 'Edit Task' : 'Add New Task'}</h3>
                  <div className="space-y-4">
                    <input type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="What needs to be done?" className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)]" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={newItemAssignee} onChange={(e) => setNewItemAssignee(e.target.value)} placeholder="Assignee (@name)" className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs" />
                      <input type="date" value={newItemDueDate} onChange={(e) => setNewItemDueDate(e.target.value)} className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setIsAddingActionItem(false); setIsEditingActionItem(false); setNewItemText(''); setNewItemAssignee(''); setNewItemDueDate(''); }} className="flex-1 py-3 text-sm font-bold text-[var(--text3)]">Cancel</button>
                    <button onClick={() => {
                      if (isEditingActionItem && editingActionItemIndex && note) {
                        const updated = note.actionItems?.map(item => item.id === editingActionItemIndex ? { ...item, text: newItemText, assignee: newItemAssignee || undefined, dueDate: newItemDueDate || undefined } : item);
                        updateNote(note.id, { actionItems: updated });
                        setIsEditingActionItem(false);
                      } else {
                        handleAddActionItem();
                      }
                    }} className="flex-1 py-3 bg-[var(--accent)] text-white text-sm font-bold rounded-xl">{isEditingActionItem ? 'Update Task' : 'Add Task'}</button>
                  </div>
                </motion.div>
              </div>
            )}

            {isAddingStudyCard && (
               <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--bg3)] p-8 rounded-2xl shadow-2xl border border-[var(--border)] w-full max-w-md space-y-4">
                  <h3 className="text-lg font-bold font-['Playfair_Display']">{editingCardId ? 'Edit Card' : 'Add Study Card'}</h3>
                  <div className="space-y-4">
                    <textarea value={newCardQuestion} onChange={(e) => setNewCardQuestion(e.target.value)} placeholder="Front: The Question" className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] h-24 text-sm" />
                    <textarea value={newCardAnswer} onChange={(e) => setNewCardAnswer(e.target.value)} placeholder="Back: The Answer" className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] h-24 text-sm" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setIsAddingStudyCard(false); setEditingCardId(null); setNewCardQuestion(''); setNewCardAnswer(''); }} className="flex-1 py-3 text-sm font-bold text-[var(--text3)]">Cancel</button>
                    <button onClick={() => {
                      if (editingCardId && note && note.studyCards) {
                        const updated = note.studyCards.map(c => c.id === editingCardId ? { ...c, question: newCardQuestion, answer: newCardAnswer } : c);
                        updateNote(note.id, { studyCards: updated });
                        setEditingCardId(null);
                        setIsAddingStudyCard(false);
                      } else {
                        handleAddStudyCard();
                      }
                    }} className="flex-1 py-3 bg-[var(--accent)] text-white text-sm font-bold rounded-xl">{editingCardId ? 'Save Changes' : 'Create Card'}</button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[11px] text-[var(--text3)] font-['DM_Mono'] uppercase tracking-widest">
            <span className="flex items-center gap-1.5 text-[var(--accent2)] font-bold"><Calendar size={13} /> {note.timestamp}</span>
            <span className="w-1 h-1 bg-[var(--border)] rounded-full" />
            
            {note.startTime && (
              <>
                <span className="flex items-center gap-1.5"><Clock size={13} /> {new Date(note.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {note.endTime ? new Date(note.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}</span>
                <span className="w-1 h-1 bg-[var(--border)] rounded-full" />
              </>
            )}

            <span className="flex items-center gap-1.5"><Clock size={13} /> {formatDuration(note.duration)}</span>
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
              note.type === 'recording' ? 'bg-[var(--soft)] text-[var(--accent)]' : 'bg-[var(--ok)]/10 text-[var(--ok)]'
            }`}>
              {note.type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="px-5 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-full text-[13px] font-bold text-[var(--text2)] flex items-center gap-2 hover:border-[var(--border2)] shadow-sm"
            >
              <Download size={16} /> Export
            </button>
            
            <AnimatePresence>
              {isExportOpen && (
                <div key="export-menu">
                  <div className="fixed inset-0 z-40" onClick={() => setIsExportOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r)] shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-2 space-y-1">
                      {exportFormats.map(format => (
                        <button
                          key={format.id}
                          onClick={() => { format.action(); setIsExportOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[var(--text2)] hover:bg-[var(--bg3)] rounded-lg transition-all"
                        >
                          <format.icon size={16} className="text-[var(--accent)]" />
                          {format.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-full text-[var(--text3)] hover:text-[var(--err)] hover:bg-[var(--err)]/5 transition-all shadow-sm"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-sm overflow-hidden">
            <div className="flex border-b border-[var(--border)] bg-[var(--bg3)]/30">
              {['summary', 'transcript'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-8 py-5 text-[13px] font-bold uppercase tracking-[0.15em] transition-all relative ${
                    activeTab === tab ? 'text-[var(--accent)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
                  }`}
                >
                  {tab === 'summary' ? 'Intelligence' : 'Dialogue'}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="meetingTab"
                      className="absolute bottom-[-1px] left-0 right-0 h-[2.5px] bg-[var(--accent)]" 
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="p-8 md:p-10">
              {activeTab === 'summary' ? (
                <div className="space-y-12">
                  <div id="meeting-summary" className="bg-gradient-to-br from-[var(--soft2)] to-[var(--bg3)] p-8 rounded-[var(--r2)] border border-[var(--border)] shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]" />
                    <h3 className="text-xl font-['Playfair_Display'] font-bold text-[var(--text)] flex items-center gap-3 mb-6">
                      <Sparkles size={22} className="text-[var(--accent)]" />
                      Executive Summary
                    </h3>
                    {note.summary ? (
                      <p className="text-[15px] text-[var(--text2)] leading-relaxed italic mb-8 font-serif">
                        "{note.summary}"
                      </p>
                    ) : (
                      <EmptyState message="Nova is synthesizing the executive overview..." />
                    )}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--border)]/50">
                      <span className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest mr-4 font-['DM_Mono']">Calibration feedback?</span>
                      <button 
                        onClick={() => handleFeedback('positive')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-bold transition-all shadow-sm ${
                          note.feedback === 'positive' 
                            ? 'bg-[var(--ok)] text-white' 
                            : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--ok)] hover:text-[var(--ok)]'
                        }`}
                      >
                        <ThumbsUp size={14} /> Helpful
                      </button>
                      <button 
                        onClick={() => handleFeedback('negative')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-bold transition-all shadow-sm ${
                          note.feedback === 'negative' 
                            ? 'bg-[var(--err)] text-white' 
                            : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--err)] hover:text-[var(--err)]'
                        }`}
                      >
                        <ThumbsDown size={14} /> Not Useful
                      </button>
                    </div>
                  </div>

                  {/* AI Suggestion Chips */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider font-['DM_Mono'] mr-2">Intelligence Boost:</span>
                    <button 
                      onClick={() => {
                        if (questions.length > 0) {
                          document.getElementById('meeting-questions')?.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          handleExtractQuestions();
                        }
                      }}
                      disabled={isExtractingQuestions}
                      className={`px-4 py-2 border rounded-full text-[11px] font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 ${
                        questions.length > 0 ? 'bg-[var(--soft2)] border-[var(--border)] text-[var(--text2)]' : 'bg-[var(--soft)] border-[var(--accent)] text-[var(--accent2)]'
                      }`}
                    >
                      {isExtractingQuestions ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search size={14} />}
                      Extract Questions
                    </button>
                    <button 
                      onClick={() => {
                        if (questions.length > 0) {
                          document.getElementById('meeting-questions')?.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          handleExtractQuestions();
                        }
                      }}
                      disabled={isExtractingQuestions}
                      className={`px-4 py-2 border rounded-full text-[11px] font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 ${
                        questions.length > 0 ? 'bg-[var(--soft2)] border-[var(--border)] text-[var(--text2)]' : 'bg-[var(--soft)] border-[var(--accent)] text-[var(--accent2)]'
                      }`}
                    >
                      <Zap size={14} /> Generate Answers
                    </button>
                    <button 
                      onClick={() => document.getElementById('meeting-action-items')?.scrollIntoView({ behavior: 'smooth' })}
                      className="px-4 py-2 bg-[var(--soft2)] border border-[var(--border)] rounded-full text-[11px] font-medium text-[var(--text2)] flex items-center gap-2 hover:border-[var(--accent)] transition-all shadow-sm"
                    >
                      <ListChecks size={14} /> Action Items
                    </button>
                    <button 
                      onClick={() => document.getElementById('meeting-summary')?.scrollIntoView({ behavior: 'smooth' })}
                      className="px-4 py-2 bg-[var(--soft2)] border border-[var(--border)] rounded-full text-[11px] font-medium text-[var(--text2)] flex items-center gap-2 hover:border-[var(--accent)] transition-all shadow-sm"
                    >
                      <Sparkles size={14} /> Summary
                    </button>
                  </div>

                  {/* Recorded Session Notes */}
                  {note.userNotes && note.userNotes.length > 0 && (
                    <div className="space-y-6">
                      <h3 className="text-[18px] font-bold text-[var(--text)] flex items-center gap-[10px] font-['Playfair_Display']">
                        <FileText size={22} className="text-[var(--accent)]" />
                        Session Annotations
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {note.userNotes.map((un, idx) => (
                          <div key={idx} className="bg-[var(--soft2)] border border-[var(--border)] p-5 rounded-xl space-y-2 group hover:border-[var(--accent)] transition-all">
                             <span className="text-[10px] font-bold text-[var(--accent)] font-['DM_Mono'] uppercase tracking-widest">[{un.timestamp}]</span>
                             <p className="text-[13.5px] text-[var(--text2)] leading-relaxed">{un.content}</p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-[var(--border)] my-6" />
                    </div>
                  )}

                  {/* Extracted Questions Section */}
                  {questions.length > 0 && (
                    <div id="meeting-questions" className="space-y-6">
                       <h3 className="text-[18px] font-bold text-[var(--text)] flex items-center gap-[10px] font-['Playfair_Display']">
                        <Search size={22} className="text-[var(--accent)]" />
                        Extracted Questions
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {questions.map((q, idx) => (
                           <div key={idx} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm hover:border-[var(--accent)] transition-all">
                              <div className="p-5 space-y-4">
                                 <div className="space-y-1.5">
                                    <p className="font-['DM_Mono'] text-[9px] text-[var(--text3)] uppercase tracking-widest">Question Detected</p>
                                    <h4 className="text-[14px] font-bold text-[var(--text)]">{q.question}</h4>
                                 </div>
                                 {q.answer && (
                                   <div className="pt-4 border-t border-[var(--border)]/20">
                                      <p className="font-['DM_Mono'] text-[9px] text-[var(--ok)] font-bold uppercase tracking-widest mb-1">AI Verified Answer</p>
                                      <p className="text-[13px] text-[var(--text2)] leading-relaxed bg-[var(--ok)]/5 p-3 rounded-lg border border-[var(--ok)]/10">{q.answer}</p>
                                   </div>
                                 )}
                              </div>
                           </div>
                        ))}
                      </div>
                      <div className="border-t border-[var(--border)] my-6" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h3 className="text-[18px] font-bold text-[var(--text)] flex items-center gap-[10px] font-['Playfair_Display']">
                        <ListChecks size={22} className="text-[var(--accent)]" />
                        Key Takeaways
                      </h3>
                      <div className="space-y-3">
                        {keyPoints.length > 0 ? keyPoints.map((point: string, i: number) => (
                          <div key={i} className="flex items-start gap-[10px] bg-[var(--bg2)] border border-[var(--border)] rounded-[10px] padding-[10px_14px] p-4 text-[13.5px] text-[var(--text)] hover:border-[var(--border2)] transition-all">
                            <div className="mt-[6px] w-[8px] h-[8px] bg-[var(--accent)] rounded-full shrink-0 shadow-sm" />
                            {point}
                          </div>
                        )) : (
                          <EmptyState message="Not detected in this recording" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-[18px] font-bold text-[var(--text)] flex items-center gap-[10px] font-['Playfair_Display']">
                        <Clock size={22} className="text-[var(--accent)]" />
                        Key Moments
                      </h3>
                      <div className="relative pl-3 space-y-6 border-l border-[var(--border)] ml-1.5">
                        {keyMoments.length > 0 ? keyMoments.map((moment: any, i: number) => (
                          <div key={i} className="flex gap-4 relative z-10 group">
                            <div className="absolute left-[-23px] w-[9px] h-[9px] rounded-full bg-[var(--accent)] mt-1.5 shrink-0 shadow-sm group-hover:scale-150 transition-transform" />
                            <div className="flex flex-col gap-1">
                              <span className="font-['DM_Mono'] text-[10px] text-[var(--accent)] font-bold uppercase tracking-widest">{moment.timestamp}</span>
                              <span className="text-[13px] text-[var(--text2)] font-medium">{moment.description}</span>
                            </div>
                          </div>
                        )) : (
                          <EmptyState message="No timeline markers identified" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] my-6" />

                  <div className="space-y-6">
                    <div id="meeting-action-items" className="flex items-center justify-between">
                      <h3 className="text-[18px] font-bold text-[var(--text)] flex items-center gap-[10px] font-['Playfair_Display']">
                        <CheckCircle2 size={22} className="text-[var(--accent)]" />
                        Action Items
                      </h3>
                      <button 
                        onClick={() => setIsAddingActionItem(true)}
                        className="bg-[var(--soft)] border border-[rgba(184,85,47,.3)] color-[var(--accent2)] rounded-[99px] text-[12px] padding-[5px_14px] px-4 py-1.5 font-[700] hover:bg-[var(--soft2)] hover:border-[var(--accent)] transition-all shadow-sm flex items-center gap-1.5 text-[var(--accent2)]"
                      >
                        <Plus size={14} strokeWidth={3} /> Add Task
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {actionItems.length > 0 ? actionItems.map((item: any) => (
                        <div key={item.id} className="group flex items-start gap-[10px] bg-[var(--bg2)] border border-[var(--border)] rounded-[10px] padding-[10px_14px] p-4 text-[13.5px] text-[var(--text)] hover:border-[var(--border2)] transition-all">
                          <button 
                            onClick={() => toggleActionItem(item.id)}
                            className={`mt-[4px] w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                              item.completed ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border2)] hover:border-[var(--accent)]'
                            }`}
                          >
                            {item.completed && <Check size={12} strokeWidth={4} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${item.completed ? 'text-[var(--text3)] line-through' : 'text-[var(--text)]'}`}>
                              {item.text}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--text3)] font-['DM_Mono'] uppercase">
                              {item.priority && (
                                <span className={`font-bold ${item.priority === 'high' ? 'text-[var(--err)]' : item.priority === 'medium' ? 'text-[var(--warn)]' : 'text-[var(--ok)]'}`}>
                                  {item.priority}
                                </span>
                              )}
                              {item.assignee && (
                                <span className="bg-[var(--soft)] text-[var(--accent2)] px-2 py-0.5 rounded-full font-bold">
                                   @{item.assignee}
                                </span>
                              )}
                              {item.dueDate && (
                                <span className="flex items-center gap-1.5 font-bold text-[var(--accent)]">
                                   <Calendar size={10} /> {item.dueDate}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => {
                                setEditingActionItemIndex(item.id);
                                setNewItemText(item.text);
                                setNewItemAssignee(item.assignee || '');
                                setNewItemDueDate(item.dueDate || '');
                                setIsEditingActionItem(true);
                              }}
                              className="p-1.5 text-[var(--text3)] hover:text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all"
                            >
                               <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => deleteActionItem(item.id)}
                              className="p-1.5 text-[var(--text3)] hover:text-[var(--err)] opacity-0 group-hover:opacity-100 transition-all"
                            >
                               <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <EmptyState message="No tasks derived from this session" />
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] my-6" />

                  {/* Study Cards Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[18px] font-bold text-[var(--text)] flex items-center gap-[10px] font-['Playfair_Display']">
                        <Zap size={22} className="text-[var(--accent)]" />
                        Study Cards
                      </h3>
                      <button 
                        onClick={() => setIsAddingStudyCard(true)}
                        className="bg-[var(--soft)] border border-[rgba(184,85,47,.3)] color-[var(--accent2)] rounded-[99px] text-[12px] padding-[5px_14px] px-4 py-1.5 font-[700] hover:bg-[var(--soft2)] hover:border-[var(--accent)] transition-all shadow-sm flex items-center gap-1.5 text-[var(--accent2)]"
                      >
                        <Plus size={14} strokeWidth={3} /> Add Card
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studyCards.length > 0 ? studyCards.map((card: any, idx: number) => (
                        <div key={card.id || idx} className="bg-[var(--soft2)] border border-[var(--border)] rounded-[var(--r)] p-6 space-y-4 hover:shadow-[var(--shadow)] transition-all">
                          <div className="space-y-1">
                            <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[var(--text3)]">Question</p>
                            <p className="text-[14px] font-bold text-[var(--text)]">{card.question}</p>
                          </div>
                          <div className="pt-4 border-t border-[var(--border)]/30 flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[var(--text3)]">Answer</p>
                              <p className="text-[13px] text-[var(--text2)] leading-relaxed italic">{card.answer}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                               <button 
                                 onClick={() => {
                                   setEditingCardId(card.id);
                                   setNewCardQuestion(card.question);
                                   setNewCardAnswer(card.answer);
                                   setIsAddingStudyCard(true);
                                 }}
                                 className="p-1.5 text-[var(--text3)] hover:text-[var(--accent)] transition-all"
                               >
                                 <Edit2 size={14} />
                               </button>
                               <button 
                                 onClick={() => handleDeleteStudyCard(idx)}
                                 className="p-1.5 text-[var(--text3)] hover:text-[var(--err)] transition-all"
                               >
                                 <Trash2 size={14} />
                               </button>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="md:col-span-2">
                          <EmptyState message="No study cards generated yet" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] my-6" />

                  {/* Speaker Detection Section */}
                  <div className="space-y-6">
                    <h3 className="text-[18px] font-bold text-[var(--text)] flex items-center gap-[10px] font-['Playfair_Display']">
                      <Users size={22} className="text-[var(--accent)]" />
                      Speaker Detection
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {talkTime.length > 0 ? talkTime.map((tt: any, i: number) => (
                        <div key={i} className="bg-gradient-to-br from-[var(--bg3)] to-[var(--soft2)] border border-[var(--border)] rounded-[var(--r)] p-[14px] space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em] text-[var(--accent)] font-bold">{tt.speaker}</span>
                            <span className="text-[10px] font-bold text-[var(--text3)]">{tt.percentage}% airtime</span>
                          </div>
                          {tt.topics && (
                            <div className="pt-2 flex flex-wrap gap-2 border-t border-[var(--border)]/20">
                              {tt.topics.slice(0, 3).map((topic: string, tid: number) => (
                                <span key={tid} className="text-[9px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text3)] px-2 py-0.5 rounded-full">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )) : (
                        <div className="md:col-span-2">
                          <EmptyState message="Dialogue patterns being evaluated..." />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] my-6" />

                  {/* In-depth Analysis Section */}
                  <div className="space-y-8 pb-4">
                    <h3 className="text-[18px] font-bold text-[var(--text)] flex items-center gap-[10px] font-['Playfair_Display']">
                      <TrendingUp size={22} className="text-[var(--accent)]" />
                      In-depth Analysis
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Sentiment */}
                      <div className="bg-[var(--soft2)] border border-[var(--border)] rounded-[var(--r)] p-[16px] space-y-3">
                        <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[var(--text3)]">Sentiment Profile</p>
                        <div className="flex items-center justify-between">
                          <p className="text-[15px] font-bold text-[var(--text)]">{getSentimentText()}</p>
                          {sentiment?.positive !== undefined && (
                            <div className="flex gap-2">
                              <span className="text-[10px] font-bold text-[var(--ok)]">+{sentiment.positive}%</span>
                              <span className="text-[10px] font-bold text-[var(--err)]">-{sentiment.negative}%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Session Themes */}
                      <div className="bg-[var(--soft2)] border border-[var(--border)] rounded-[var(--r)] p-[16px] space-y-3">
                         <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[var(--text3)]">Strategic Themes</p>
                         <div className="flex flex-wrap gap-2">
                            {(themes && themes.length > 0) ? themes.map((t: string, i: number) => (
                              <span key={i} className="text-[11px] font-bold text-[var(--accent)] bg-[var(--soft)] px-3 py-1 rounded-full border border-[var(--accent)]/20">{t}</span>
                            )) : (
                              <p className="text-[13px] text-[var(--text3)] italic">Evaluating focus areas...</p>
                            )}
                         </div>
                      </div>

                      {/* Productivity */}
                      <div className="bg-[var(--soft2)] border border-[var(--border)] rounded-[var(--r)] p-[16px] space-y-3">
                        <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[var(--text3)]">Session Efficiency</p>
                        <p className="text-[15px] font-bold text-[var(--text)]">{analysis.productivity || ((note as any).status === 'completed' ? 'Optimized' : 'Normal')}</p>
                      </div>

                      {/* Key Decisions */}
                      <div className="md:col-span-2 bg-[var(--ok)]/10 border border-[var(--ok)]/25 rounded-[var(--r)] p-[16px] space-y-3">
                        <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[var(--ok)] font-bold">Consensus & Decisions</p>
                        {((keyDecisions && keyDecisions.length > 0) || (analysis.decisions && analysis.decisions.length > 0)) ? (
                          <ul className="space-y-2">
                             {(keyDecisions || analysis.decisions || []).map((d: string, i: number) => (
                               <li key={i} className="text-[13.5px] text-[var(--ok)] flex gap-2 items-start font-medium regular">
                                 <div className="mt-1.5 w-1.5 h-1.5 bg-[var(--ok)] rounded-full shrink-0" />
                                 {d}
                               </li>
                             ))}
                          </ul>
                        ) : (
                          <p className="text-[13px] text-[var(--ok)]/60 italic font-['DM_Mono']">No binding decisions recorded</p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="relative">
                  <div className="font-serif text-[15px] leading-loose text-[var(--text2)] space-y-8 max-h-[800px] overflow-y-auto pr-6 custom-scrollbar">
                    {note.transcript.split('\n\n').map((para, i) => (
                      <p key={i} className="border-l-[3px] border-[var(--soft)] pl-8 hover:border-[var(--accent)] transition-colors">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              )}
           </div>
          </div>

          {/* ================================================================
              ADVANCED AI INTELLIGENCE SECTIONS
              ================================================================ */}

          {/* Meeting Efficiency Score */}
          {meetingEfficiency && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-sm overflow-hidden"
            >
              <div className="p-8 md:p-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                    <Gauge size={20} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="font-['Playfair_Display'] text-lg font-bold text-[var(--text)]">Meeting Efficiency</h3>
                    <p className="text-[11px] text-[var(--text3)] font-['DM_Mono'] uppercase tracking-widest">Productivity Intelligence</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Score Circle */}
                  <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="48" cy="48" r="42" fill="none" stroke="var(--soft2)" strokeWidth="6" />
                        <motion.circle
                          cx="48" cy="48" r="42" fill="none"
                          stroke={meetingEfficiency.score >= 70 ? 'var(--ok)' : meetingEfficiency.score >= 40 ? 'var(--warn)' : 'var(--err)'}
                          strokeWidth="6" strokeLinecap="round"
                          initial={{ strokeDasharray: "0 264" }}
                          animate={{ strokeDasharray: `${(meetingEfficiency.score / 100) * 264} 264` }}
                          transition={{ duration: 1.5 }}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-bold text-[var(--text)]">{meetingEfficiency.score}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--text3)]">Score</span>
                      </div>
                    </div>
                    <span className={`mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      meetingEfficiency.productivityLevel === 'High' ? 'bg-[var(--ok)]/10 text-[var(--ok)]' :
                      meetingEfficiency.productivityLevel === 'Medium' ? 'bg-[var(--warn)]/10 text-[var(--warn)]' :
                      'bg-[var(--err)]/10 text-[var(--err)]'
                    }`}>
                      {meetingEfficiency.productivityLevel}
                    </span>
                  </div>

                  {/* Metric Cards */}
                  {[
                    { label: 'Decisions Made', value: meetingEfficiency.decisionsCount, icon: CheckCircle2, color: 'var(--ok)' },
                    { label: 'Action Items', value: meetingEfficiency.actionItemsCount, icon: ListChecks, color: 'var(--accent)' },
                    { label: 'Unclear Points', value: meetingEfficiency.unclearPoints, icon: HelpCircle, color: 'var(--warn)' },
                  ].map(metric => (
                    <div key={metric.label} className="bg-[var(--soft2)] border border-[var(--border)] rounded-[var(--r)] p-4 flex flex-col items-center justify-center text-center space-y-2">
                      <metric.icon size={20} style={{ color: metric.color }} />
                      <span className="text-2xl font-bold text-[var(--text)]">{metric.value}</span>
                      <span className="text-[10px] font-['DM_Mono'] uppercase tracking-widest text-[var(--text3)]">{metric.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Risk Analysis */}
          {riskAnalysis.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-sm overflow-hidden"
            >
              <div className="p-8 md:p-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--err)]/10 rounded-lg">
                    <ShieldAlert size={20} className="text-[var(--err)]" />
                  </div>
                  <div>
                    <h3 className="font-['Playfair_Display'] text-lg font-bold text-[var(--text)]">Risk Analysis</h3>
                    <p className="text-[11px] text-[var(--text3)] font-['DM_Mono'] uppercase tracking-widest">Decision Risk Detection</p>
                  </div>
                  <span className="ml-auto px-3 py-1 bg-[var(--err)]/10 text-[var(--err)] rounded-full text-[10px] font-bold">{riskAnalysis.length} Found</span>
                </div>

                <div className="space-y-3">
                  {riskAnalysis.map((risk, i) => (
                    <div key={i} className={`p-4 rounded-[var(--r)] border space-y-2 ${
                      risk.severity === 'high' ? 'bg-[var(--err)]/5 border-[var(--err)]/20' :
                      risk.severity === 'medium' ? 'bg-[var(--warn)]/5 border-[var(--warn)]/20' :
                      'bg-[var(--soft2)] border-[var(--border)]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className={
                          risk.severity === 'high' ? 'text-[var(--err)]' :
                          risk.severity === 'medium' ? 'text-[var(--warn)]' :
                          'text-[var(--text3)]'
                        } />
                        <span className="text-[13px] font-bold text-[var(--text)]">{risk.text}</span>
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          risk.severity === 'high' ? 'bg-[var(--err)]/15 text-[var(--err)]' :
                          risk.severity === 'medium' ? 'bg-[var(--warn)]/15 text-[var(--warn)]' :
                          'bg-[var(--soft)] text-[var(--text3)]'
                        }`}>{risk.severity}</span>
                      </div>
                      <p className="text-[12px] text-[var(--text3)] pl-[22px]">{risk.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Unanswered Questions */}
          {unansweredQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-sm overflow-hidden"
            >
              <div className="p-8 md:p-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--warn)]/10 rounded-lg">
                    <HelpCircle size={20} className="text-[var(--warn)]" />
                  </div>
                  <div>
                    <h3 className="font-['Playfair_Display'] text-lg font-bold text-[var(--text)]">Unanswered Questions</h3>
                    <p className="text-[11px] text-[var(--text3)] font-['DM_Mono'] uppercase tracking-widest">Open Items Requiring Follow-Up</p>
                  </div>
                  <span className="ml-auto px-3 py-1 bg-[var(--warn)]/10 text-[var(--warn)] rounded-full text-[10px] font-bold">{unansweredQuestions.length} Open</span>
                </div>

                <div className="space-y-3">
                  {unansweredQuestions.map((uq, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-[var(--warn)]/5 border border-[var(--warn)]/15 rounded-[var(--r)]">
                      <div className="mt-0.5 w-6 h-6 bg-[var(--warn)]/15 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[var(--warn)]">?</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[13px] font-medium text-[var(--text)]">{uq.question}</p>
                        {uq.context && <p className="text-[11px] text-[var(--text3)]">{uq.context}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Responsibility Gaps */}
          {responsibilityGaps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-sm overflow-hidden"
            >
              <div className="p-8 md:p-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                    <Target size={20} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="font-['Playfair_Display'] text-lg font-bold text-[var(--text)]">Responsibility Gaps</h3>
                    <p className="text-[11px] text-[var(--text3)] font-['DM_Mono'] uppercase tracking-widest">Tasks Without Assigned Owner</p>
                  </div>
                  <span className="ml-auto px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-[10px] font-bold">{responsibilityGaps.length} Gaps</span>
                </div>

                <div className="space-y-3">
                  {responsibilityGaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-[var(--soft2)] border border-[var(--border)] rounded-[var(--r)]">
                      <div className="mt-0.5 w-6 h-6 bg-[var(--accent)]/15 rounded-full flex items-center justify-center shrink-0">
                        <User size={12} className="text-[var(--accent)]" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-[13px] font-medium text-[var(--text)]">{gap.task}</p>
                        <p className="text-[11px] text-[var(--text3)] font-['DM_Mono']">{gap.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Conflict Detection */}
          {conflicts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r2)] shadow-sm overflow-hidden"
            >
              <div className="p-8 md:p-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--err)]/10 rounded-lg">
                    <Scale size={20} className="text-[var(--err)]" />
                  </div>
                  <div>
                    <h3 className="font-['Playfair_Display'] text-lg font-bold text-[var(--text)]">Conflicts Detected</h3>
                    <p className="text-[11px] text-[var(--text3)] font-['DM_Mono'] uppercase tracking-widest">Contradictions Within Meeting</p>
                  </div>
                  <span className="ml-auto px-3 py-1 bg-[var(--err)]/10 text-[var(--err)] rounded-full text-[10px] font-bold">{conflicts.length} Conflicts</span>
                </div>

                <div className="space-y-4">
                  {conflicts.map((conflict, i) => (
                    <div key={i} className="p-4 bg-[var(--err)]/5 border border-[var(--err)]/15 rounded-[var(--r)] space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text3)] font-['DM_Mono']">Earlier Statement</span>
                          <p className="text-[13px] text-[var(--text)] mt-1 font-medium">"{conflict.earlier}"</p>
                        </div>
                        <div className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text3)] font-['DM_Mono']">Later Statement</span>
                          <p className="text-[13px] text-[var(--text)] mt-1 font-medium">"{conflict.later}"</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 pt-1">
                        <AlertTriangle size={13} className="text-[var(--err)] mt-0.5 shrink-0" />
                        <p className="text-[12px] text-[var(--err)]">{conflict.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-[var(--surface)] border border-[var(--border)] p-8 rounded-[var(--r2)] shadow-sm space-y-8">
            <h3 className="font-['Playfair_Display'] text-lg font-bold text-[var(--text)] border-b border-[var(--border)] pb-4">Focus Analysis</h3>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-36 h-36 flex items-center justify-center text-[var(--accent)]">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="72" cy="72" r="66" fill="none" stroke="var(--soft2)" strokeWidth="8" />
                    <motion.circle 
                      cx="72" cy="72" r="66" fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
                      initial={{ strokeDasharray: "0 415" }}
                      animate={{ strokeDasharray: `${(note.health_score?.score || 85) / 100 * 415} 415` }}
                      transition={{ duration: 1.5 }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold text-[var(--text)]">{note.health_score?.score || 85}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text3)]">Health</span>
                  </div>
                </div>
                <span className="px-5 py-1.5 bg-[var(--soft)] text-[var(--accent)] rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                   {note.health_score?.label || 'Strategic Focus'}
                </span>
              </div>

              <div className="space-y-4 pt-6 border-t border-[var(--border)]/50">
                 <p className="font-['DM_Mono'] text-[10px] text-[var(--text3)] uppercase tracking-widest">Metadata Registry</p>
                 <div className="grid grid-cols-1 gap-4">
                    {[
                      { label: 'Language', value: note.detected_language || 'English', icon: TypeIcon },
                      { label: 'Intensity', value: 'High Density', icon: Zap },
                      { label: 'Speakers', value: '3 Active', icon: Users },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between text-[11px]">
                         <span className="text-[var(--text3)] flex items-center gap-2">
                           <item.icon size={12} className="text-[var(--accent3)]" /> {item.label}
                         </span>
                         <span className="font-bold text-[var(--text2)]">{item.value}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] p-8 rounded-[var(--r2)] shadow-sm space-y-6">
             <h3 className="font-['Playfair_Display'] text-lg font-bold text-[var(--text)]">Dialogue Share</h3>
             <div className="space-y-6">
                {note.talk_time?.map((tt, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                       <span className="text-[11px] font-bold text-[var(--text2)] uppercase tracking-wide">{tt.speaker}</span>
                       <span className="text-[11px] font-['DM_Mono'] font-bold text-[var(--accent)]">{tt.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--soft2)] rounded-full overflow-hidden shadow-inner">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${tt.percentage}%` }}
                         className="h-full bg-[var(--accent)]"
                       />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Destroy Intelligence"
        message="This will permanently purge this session's analytical data. This operation is irreversible. Proceed with caution."
        confirmLabel="Destroy Session"
      />
    </div>
  );
};
