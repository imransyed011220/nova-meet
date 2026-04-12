import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  History as HistoryIcon,
  Search,
  Plus,
  ArrowRight,
  Filter,
  MoreVertical,
  Calendar,
  Clock,
  Trash2,
  Edit2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { useToast } from '../hooks/useToast';
import { EmptyState } from '../components/EmptyState';
import { InlineRename } from '../components/InlineRename';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { notes, deleteNote, updateNote, isLoading } = useMeetingHistory();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'recording' | 'upload'>('all');
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (note.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || note.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteNote(deleteId);
      showToast('Session deleted successfully');
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-['Playfair_Display'] font-bold text-[var(--accent2)]">Intelligence Archive</h1>
          <p className="text-sm text-[var(--text3)]">Access and review your analyzed meeting knowledge base.</p>
        </div>

        <div className="flex items-center gap-1 border-b border-[var(--border)] w-fit">
          {[
            { id: 'all', label: 'All Sessions' },
            { id: 'recording', label: 'Recordings' },
            { id: 'upload', label: 'Uploads' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-5 py-2.5 text-[13px] font-medium transition-all relative ${
                filterType === tab.id ? 'text-[var(--accent)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
              }`}
            >
              {tab.label}
              {filterType === tab.id && (
                <motion.div 
                   layoutId="activeTab"
                   className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[var(--accent)]" 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredNotes.map((note, idx) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.03 }}
            >
              <div 
                className="group block bg-gradient-to-br from-[var(--surface)] to-[var(--bg2)] border border-[var(--border)] rounded-[var(--r)] p-5 hover:border-[var(--accent3)] hover:-translate-y-1 hover:shadow-[var(--shadow)] transition-all duration-300 relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--soft)] flex items-center justify-center text-[var(--accent2)] font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                    {note.title?.charAt(0) || 'U'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-full font-['DM_Mono'] text-[9px] font-bold uppercase tracking-wider ${
                      note.type === 'recording' 
                        ? 'bg-[var(--warn)]/10 text-[var(--warn)] border border-[var(--warn)]/25' 
                        : 'bg-[var(--ok)]/10 text-[var(--ok)] border border-[var(--ok)]/25'
                    }`}>
                      {note.type}
                    </div>
                    <button 
                      onClick={(e) => { e.preventDefault(); setDeleteId(note.id); }}
                      className="p-1.5 text-[var(--text3)] hover:text-[var(--err)] hover:bg-[var(--err)]/5 rounded-md transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mb-1">
                  <InlineRename 
                    value={note.title || 'Untitled Session'} 
                    onSave={(newName) => updateNote(note.id, { title: newName })}
                    textClassName="text-sm font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors line-clamp-1"
                  />
                </div>
                
                <div className="flex items-center gap-3 text-[11px] text-[var(--text3)] font-['DM_Mono']">
                   <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {note.timestamp?.split(',')[0] || 'Unknown date'}
                   </div>
                   <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {note.duration || '0:00'}
                   </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                   <div className="flex -space-x-2">
                      {[1, 2].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-[var(--surface)] bg-[var(--soft2)]" />
                      ))}
                   </div>
                   <Link 
                     to={`/meeting/${note.id}`}
                     className="text-[11px] font-bold text-[var(--accent2)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                   >
                      View Session <ArrowRight size={12} />
                   </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredNotes.length === 0 && !isLoading && (
          <div className="col-span-full py-24 text-center space-y-4 bg-[var(--bg3)] rounded-[var(--r2)] border border-dashed border-[var(--border)]">
             <div className="w-16 h-16 bg-[var(--soft)] rounded-full flex items-center justify-center mx-auto text-[var(--accent2)]">
                <HistoryIcon size={28} />
             </div>
             <div>
                <p className="text-base font-['Playfair_Display'] font-bold text-[var(--text)]">No sessions found</p>
                <p className="text-[13px] text-[var(--text3)]">Try adjusting your filters or record a new session.</p>
             </div>
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Intelligence Session?"
        message="This action will permanently remove this session from your archive. This cannot be undone."
        confirmLabel="Delete Session"
        cancelLabel="Keep Session"
        variant="danger"
      />
    </div>
  );
};
