import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X, Send, Loader2, MessageSquare, Zap, ListChecks, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';

interface AIAssistantPanelProps {
  onClose?: () => void;
  isMobile?: boolean;
}

const SUGGESTIONS = [
  { icon: FileText, label: 'Summarize meeting', query: 'Summarize the current meeting' },
  { icon: ListChecks, label: 'Action items', query: 'What are the action items from this meeting?' },
  { icon: Zap, label: 'Key decisions', query: 'What decisions were made in this meeting?' },
];

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ onClose, isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<string>('');
  const location = useLocation();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const updateContext = () => {
      if (location.pathname.startsWith('/meeting/')) {
        const meetingId = location.pathname.split('/').pop();
        if (meetingId) {
          const notes = storageService.getNotes();
          const currentNote = notes.find(n => n.id === meetingId);
          if (currentNote) {
            setContext(JSON.stringify({
              title: currentNote.title,
              date: currentNote.timestamp,
              duration: currentNote.duration,
              summary: currentNote.summary,
              keyPoints: currentNote.keyPoints,
              actionItems: currentNote.actionItems,
              transcript: currentNote.transcript,
              analysis: currentNote.analysis
            }));
          }
        }
      } else {
        const notes = storageService.getNotes().slice(0, 3);
        setContext(notes.length > 0 
          ? `Recent meetings summary: ${notes.map(n => n.title).join(', ')}`
          : "No meeting history available yet."
        );
      }
    };
    updateContext();
  }, [location.pathname]);

  const getNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSend = async (text?: string) => {
    const msg = (text || query).trim();
    if (!msg || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: msg, time: getNow() }]);
    setQuery('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const response = await geminiService.askAssistant(context, msg, apiKey);
      setMessages(prev => [...prev, { role: 'assistant', text: response, time: getNow() }]);
    } catch (err: any) {
      const errorMessage = err?.status === 429 || err?.status === 503
        ? "Nova's brain is a bit busy right now. Please wait a moment and try again."
        : "I'm sorry, I encountered an error processing your request.";
      setMessages(prev => [...prev, { role: 'assistant', text: errorMessage, time: getNow() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== MOBILE: Floating FAB =====
  if (isMobile) {
    return (
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[340px] h-[480px] bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border)] flex flex-col overflow-hidden"
            >
              <PanelContent
                messages={messages}
                isLoading={isLoading}
                query={query}
                setQuery={setQuery}
                handleSend={handleSend}
                chatEndRef={chatEndRef}
                onClose={() => setIsOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all z-[101] ${
            isOpen ? 'bg-[var(--surface)] text-[var(--text)]' : 'text-white'
          }`}
          style={!isOpen ? { background: 'linear-gradient(155deg, var(--accent), var(--accent2))' } : undefined}
        >
          {isOpen ? <X size={22} /> : <Sparkles size={22} />}
        </motion.button>
      </div>
    );
  }

  // ===== DESKTOP: Docked Panel =====
  return (
    <div className="h-full flex flex-col bg-[var(--bg-surface)]">
      <PanelContent
        messages={messages}
        isLoading={isLoading}
        query={query}
        setQuery={setQuery}
        handleSend={handleSend}
        chatEndRef={chatEndRef}
        onClose={onClose}
        showSuggestions={messages.length === 0}
      />
    </div>
  );
};

// ===== Shared Panel Content =====
interface PanelContentProps {
  messages: { role: 'user' | 'assistant'; text: string; time: string }[];
  isLoading: boolean;
  query: string;
  setQuery: (v: string) => void;
  handleSend: (text?: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onClose?: () => void;
  showSuggestions?: boolean;
}

const PanelContent: React.FC<PanelContentProps> = ({
  messages, isLoading, query, setQuery, handleSend, chatEndRef, onClose, showSuggestions = true
}) => (
  <div className="flex flex-col h-full bg-[var(--bg2)]">
    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
      {messages.length === 0 && showSuggestions && (
        <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-6">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(155deg, var(--accent), var(--accent2))' }}
          >
            <Sparkles size={24} className="text-white" />
          </div>
          <div className="space-y-1.5">
            <p className="font-['Playfair_Display'] text-base font-semibold text-[var(--accent2)]">How can Nova help?</p>
            <p className="text-[13px] text-[var(--text3)] leading-relaxed">I'm your intelligent meeting partner. Ask me anything about your sessions.</p>
          </div>
          <div className="w-full space-y-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSend(s.query)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--soft2)] hover:bg-[var(--soft)] border border-[var(--border)] hover:border-[var(--accent3)] rounded-full text-left transition-all group shadow-sm"
              >
                <s.icon size={16} className="text-[var(--accent2)] shrink-0" />
                <span className="text-[12px] font-medium text-[var(--accent2)]">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[88%] space-y-1`}>
            <div className={`px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[var(--soft)] border border-[var(--accent)]/20 text-[var(--text)] rounded-[var(--r)] italic' 
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text2)] rounded-[var(--r)]'
            }`}>
              {msg.text}
            </div>
            <p className={`text-[9px] font-['DM_Mono'] text-[var(--text3)] px-2 ${msg.role === 'user' ? 'text-right' : ''}`}>{msg.time}</p>
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-[var(--surface)] border border-[var(--border)] px-4 py-3 rounded-[var(--r)] shadow-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>

    {/* Input */}
    <div className="p-4 border-t border-[var(--border)] shrink-0 bg-[var(--bg2)]">
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center gap-2">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Message Nova..."
          className="flex-1 pl-4 pr-12 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] rounded-[var(--r)] text-[13px] outline-none transition-all placeholder:text-[var(--text3)] shadow-sm"
        />
        <button 
          type="submit"
          disabled={!query.trim() || isLoading}
          className="w-9 h-9 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 shrink-0 rounded-[var(--r)]"
          style={{ background: 'linear-gradient(155deg, var(--accent), var(--accent2))' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  </div>
);
