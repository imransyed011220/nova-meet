import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Search,
  Clock,
  Trash2,
  Plus,
  Edit2,
  X,
  Calendar as CalendarIcon,
  Tag,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { useToast } from '../hooks/useToast';
import { ActionItem } from '../types';

const PRIORITY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: 'High', color: 'text-[var(--err)]', bg: 'bg-[var(--err)]/10' },
  medium: { label: 'Medium', color: 'text-[var(--warn)]', bg: 'bg-[var(--warn)]/10' },
  low: { label: 'Low', color: 'text-[var(--ok)]', bg: 'bg-[var(--ok)]/10' },
};

export const TasksPage: React.FC = () => {
  const { notes, updateNote } = useMeetingHistory();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{ meetingId: string, task: ActionItem } | null>(null);
  const [editingCard, setEditingCard] = useState<{ meetingId: string, index: number, card: { question: string, answer: string } } | null>(null);

  // Form states
  const [taskText, setTaskText] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskMeetingId, setTaskMeetingId] = useState('');
  
  const [cardQuestion, setCardQuestion] = useState('');
  const [cardAnswer, setCardAnswer] = useState('');
  const [cardMeetingId, setCardMeetingId] = useState('');

  const allTasks = notes.flatMap(note => 
    (note.actionItems || []).map(item => ({
      ...item,
      meetingId: note.id,
      meetingTitle: note.title,
      priority: item.priority || 'low'
    }))
  );

  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(search.toLowerCase()) || 
                         task.meetingTitle.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'pending' && !task.completed) || 
                         (filter === 'completed' && task.completed);
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesFilter && matchesPriority;
  });

  const toggleTask = (meetingId: string, taskId: string) => {
    const note = notes.find(n => n.id === meetingId);
    if (note && note.actionItems) {
      const updatedItems = note.actionItems.map(item => 
        item.id === taskId ? { ...item, completed: !item.completed } : item
      );
      updateNote(meetingId, { actionItems: updatedItems });
    }
  };

  const deleteTask = (meetingId: string, taskId: string) => {
    const note = notes.find(n => n.id === meetingId);
    if (note && note.actionItems) {
      const updatedItems = note.actionItems.filter(item => item.id !== taskId);
      updateNote(meetingId, { actionItems: updatedItems });
      showToast('Task removed');
    }
  };

  const handleSaveTask = () => {
    if (!taskText.trim() || !taskMeetingId) return;

    const note = notes.find(n => n.id === taskMeetingId);
    if (!note) return;

    if (editingTask) {
      const updatedItems = (note.actionItems || []).map(item => 
        item.id === editingTask.task.id 
          ? { ...item, text: taskText, priority: taskPriority, dueDate: taskDueDate } 
          : item
      );
      updateNote(taskMeetingId, { actionItems: updatedItems });
      showToast('Task updated');
    } else {
      const newTask: ActionItem = {
        id: `task-${Date.now()}`,
        text: taskText,
        completed: false,
        priority: taskPriority,
        dueDate: taskDueDate || undefined
      };
      updateNote(taskMeetingId, { actionItems: [...(note.actionItems || []), newTask] });
      showToast('Task added');
    }

    closeTaskModal();
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setTaskText('');
    setTaskPriority('medium');
    setTaskDueDate('');
    setTaskMeetingId('');
  };

  const openEditTask = (meetingId: string, task: ActionItem) => {
    setEditingTask({ meetingId, task });
    setTaskText(task.text);
    setTaskPriority(task.priority || 'medium');
    setTaskDueDate(task.dueDate || '');
    setTaskMeetingId(meetingId);
    setIsTaskModalOpen(true);
  };

  const handleSaveCard = () => {
    if (!cardQuestion.trim() || !cardAnswer.trim() || !cardMeetingId) return;

    const note = notes.find(n => n.id === cardMeetingId);
    if (!note) return;

    const updatedCards = [...(note.studyCards || [])];
    if (editingCard) {
      updatedCards[editingCard.index] = { ...updatedCards[editingCard.index], question: cardQuestion, answer: cardAnswer };
      updateNote(cardMeetingId, { studyCards: updatedCards });
      showToast('Study card updated');
    } else {
      updatedCards.push({ id: `card-${Date.now()}`, question: cardQuestion, answer: cardAnswer });
      updateNote(cardMeetingId, { studyCards: updatedCards });
      showToast('Study card added');
    }

    closeCardModal();
  };

  const closeCardModal = () => {
    setIsCardModalOpen(false);
    setEditingCard(null);
    setCardQuestion('');
    setCardAnswer('');
    setCardMeetingId('');
  };

  const completedCount = allTasks.filter(t => t.completed).length;
  const completionRate = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-['Playfair_Display'] font-bold text-[var(--accent2)]">Action Registry</h1>
          <p className="text-sm text-[var(--text3)]">Coordinate and track follow-ups distilled from your sessions.</p>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => setIsTaskModalOpen(true)}
             className="px-5 py-2.5 bg-[var(--accent)] text-white rounded-full text-[13px] font-bold flex items-center gap-2 hover:bg-[var(--accent2)] shadow-md transition-all"
           >
             <Plus size={16} strokeWidth={3} /> Add Task
           </button>
           <button 
             onClick={() => setIsCardModalOpen(true)}
             className="px-5 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text2)] rounded-full text-[13px] font-bold flex items-center gap-2 hover:border-[var(--border2)] shadow-sm transition-all"
           >
             <BookOpen size={16} /> Add Card
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[var(--surface)] border border-[var(--border)] px-6 py-5 rounded-[var(--r)] shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-[var(--soft)] flex items-center justify-center text-[var(--accent)]">
              <CheckCircle2 size={24} />
           </div>
           <div>
              <p className="font-['DM_Mono'] text-[9px] text-[var(--text3)] uppercase tracking-widest">Completion</p>
              <p className="text-xl font-bold text-[var(--text)]">{completionRate}%</p>
           </div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] px-6 py-5 rounded-[var(--r)] shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-[var(--err)]/10 flex items-center justify-center text-[var(--err)]">
              <Clock size={24} />
           </div>
           <div>
              <p className="font-['DM_Mono'] text-[9px] text-[var(--text3)] uppercase tracking-widest">Pending</p>
              <p className="text-xl font-bold text-[var(--text)]">{allTasks.filter(t => !t.completed).length}</p>
           </div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] px-6 py-5 rounded-[var(--r)] shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-[var(--ok)]/10 flex items-center justify-center text-[var(--ok)]">
              <BookOpen size={24} />
           </div>
           <div>
              <p className="font-['DM_Mono'] text-[9px] text-[var(--text3)] uppercase tracking-widest">Study Cards</p>
              <p className="text-xl font-bold text-[var(--text)]">{notes.reduce((sum, n) => sum + (n.studyCards?.length || 0), 0)}</p>
           </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text3)]" size={16} />
          <input 
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all shadow-sm"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-all shadow-sm"
          >
            <option value="all">All Priorities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-24 text-center space-y-4 bg-[var(--bg3)] rounded-[var(--r2)] border border-dashed border-[var(--border)]">
             <div className="w-16 h-16 bg-[var(--soft)] rounded-full flex items-center justify-center mx-auto text-[var(--accent2)]">
                <CheckCircle2 size={28} />
             </div>
             <div>
                <p className="text-base font-['Playfair_Display'] font-bold text-[var(--text)]">No tasks found</p>
                <p className="text-[13px] text-[var(--text3)]">
                  {search || filter !== 'all' || priorityFilter !== 'all' ? "Try adjusting your filters." : "Tasks will appear here from analyzed sessions."}
                </p>
             </div>
          </div>
        ) : (
          filteredTasks.map((task, idx) => {
            const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP.low;
            return (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="group flex items-center gap-4 bg-[var(--surface)] border border-[var(--border)] p-4 rounded-[var(--r)] hover:border-[var(--border2)] hover:shadow-[var(--shadow)] transition-all"
              >
                <button
                  onClick={() => toggleTask(task.meetingId, task.id)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                    task.completed 
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-white' 
                      : 'border-[var(--border2)] hover:border-[var(--accent)]'
                  }`}
                >
                  {task.completed && <CheckCircle2 size={14} strokeWidth={3} />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-[13.5px] font-medium transition-all ${
                    task.completed ? 'text-[var(--text3)] line-through' : 'text-[var(--text)]'
                  }`}>
                    {task.text}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--text3)] font-['DM_Mono']">
                    <Link 
                      to={`/meeting/${task.meetingId}`}
                      className="flex items-center gap-1 font-semibold text-[var(--accent2)] hover:underline"
                    >
                      {task.meetingTitle}
                    </Link>
                    {task.dueDate && (
                      <>
                        <span className="w-1 h-1 bg-[var(--border)] rounded-full" />
                        <span className="flex items-center gap-1 text-[var(--accent)] font-bold"><CalendarIcon size={10} /> {task.dueDate}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full font-['DM_Mono'] text-[9px] font-bold uppercase tracking-wider ${priority.bg} ${priority.color}`}>
                    {priority.label}
                  </span>
                  
                  <button 
                    onClick={() => openEditTask(task.meetingId, task)}
                    className="p-2 text-[var(--text3)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => deleteTask(task.meetingId, task.id)}
                    className="p-2 text-[var(--text3)] hover:text-[var(--err)] hover:bg-[var(--err)]/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* --- ADD/EDIT TASK MODAL --- */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeTaskModal} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[480px] bg-[var(--bg3)] rounded-[var(--r2)] shadow-2xl overflow-hidden border border-[var(--border)]"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-['Playfair_Display'] font-bold text-[var(--text)]">
                    {editingTask ? 'Refine Action Item' : 'New Action Item'}
                  </h3>
                  <button onClick={closeTaskModal} className="p-2 hover:bg-[var(--soft2)] rounded-full"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono'] px-1">Meeting Selection</label>
                    <select 
                      value={taskMeetingId}
                      onChange={(e) => setTaskMeetingId(e.target.value)}
                      disabled={!!editingTask}
                      className="w-full p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] outline-none disabled:opacity-50"
                    >
                      <option value="">Select a session...</option>
                      {notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono'] px-1">Task Description</label>
                    <textarea 
                      value={taskText}
                      onChange={(e) => setTaskText(e.target.value)}
                      placeholder="What needs to be done?"
                      className="w-full h-24 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono'] px-1">Priority</label>
                      <div className="flex bg-[var(--soft2)] p-1 rounded-xl gap-1">
                        {['low', 'medium', 'high'].map(p => (
                          <button
                            key={p}
                            onClick={() => setTaskPriority(p as any)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                              taskPriority === p ? 'bg-white shadow-sm text-[var(--accent)]' : 'text-[var(--text3)] hover:text-[var(--text2)]'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono'] px-1">Due Date</label>
                      <input 
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveTask}
                    disabled={!taskText.trim() || !taskMeetingId}
                    className="w-full py-4 bg-[var(--accent)] text-white rounded-xl text-sm font-bold shadow-lg shadow-[var(--accent)]/20 hover:bg-[var(--accent2)] transition-all disabled:opacity-40"
                  >
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD/EDIT STUDY CARD MODAL --- */}
      <AnimatePresence>
        {isCardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCardModal} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[480px] bg-[var(--bg3)] rounded-[var(--r2)] shadow-2xl overflow-hidden border border-[var(--border)]"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-['Playfair_Display'] font-bold text-[var(--text)]">
                    {editingCard ? 'Edit Study Card' : 'New Study Card'}
                  </h3>
                  <button onClick={closeCardModal} className="p-2 hover:bg-[var(--soft2)] rounded-full"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono'] px-1">Meeting Selection</label>
                    <select 
                      value={cardMeetingId}
                      onChange={(e) => setCardMeetingId(e.target.value)}
                      className="w-full p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] outline-none"
                    >
                      <option value="">Select a session...</option>
                      {notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono'] px-1">Question / Concept</label>
                    <textarea 
                      value={cardQuestion}
                      onChange={(e) => setCardQuestion(e.target.value)}
                      placeholder="What is the key takeaway or question?"
                      className="w-full h-20 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-widest font-['DM_Mono'] px-1">Answer / Definition</label>
                    <textarea 
                      value={cardAnswer}
                      onChange={(e) => setCardAnswer(e.target.value)}
                      placeholder="Explain the concept in detail..."
                      className="w-full h-32 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm focus:border-[var(--accent)] outline-none resize-none font-serif italic"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveCard}
                    disabled={!cardQuestion.trim() || !cardAnswer.trim() || !cardMeetingId}
                    className="w-full py-4 bg-[var(--ok)] text-white rounded-xl text-sm font-bold shadow-lg shadow-[var(--ok)]/20 hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    {editingCard ? 'Save card' : 'Add to Collection'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
