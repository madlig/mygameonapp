// src/features/tasks/components/TaskFormModal.jsx
//
// Modal form untuk create/edit task.
// Dark theme + Subtask checklist + Notes/log management.
//
// Props:
//   isOpen, onClose, initialData (edit mode), prefillData (from GamesPage), onSuccess

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  X, Loader2, Calendar, Flag, Tag, Zap, AlertCircle,
  Plus, Trash2, ListChecks, MessageSquare,
} from 'lucide-react';
import {
  collection, addDoc, updateDoc, doc, serverTimestamp,
  getDocs, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const swalDark = {
  color: '#F3F4F6',
  background: '#1A1F27',
  confirmButtonColor: '#FFD100',
};

// Simple unique ID generator
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const TaskFormModal = ({ isOpen, onClose, initialData, prefillData, onSuccess }) => {
  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      title: '', description: '', priority: 'Medium',
      category: 'General', dueDate: '', isAutomation: false,
      automationTargetId: '', newVersion: '',
    },
  });

  const [gamesList, setGamesList] = useState([]);
  const [isGamesLoading, setIsGamesLoading] = useState(false);

  // ── Subtask state ──
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // ── Notes state ──
  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');

  const categoryWatch = watch('category');
  const isAutomationWatch = watch('isAutomation');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // MODE EDIT
        setValue('title', initialData.title);
        setValue('description', initialData.description || '');
        setValue('priority', initialData.priority || 'Medium');
        setValue('category', initialData.category || 'General');
        if (initialData.dueDate?.seconds) {
          const date = new Date(initialData.dueDate.seconds * 1000);
          setValue('dueDate', date.toISOString().split('T')[0]);
        }
        setValue('isAutomation', initialData.isAutomation || false);
        setValue('automationTargetId', initialData.automationTargetId || '');
        setValue('newVersion', initialData.automationPayload?.newVersion || '');
        setSubtasks(initialData.subtasks || []);
        setNotes(initialData.notes || []);
      } else if (prefillData) {
        // MODE CREATE VIA GAME TABLE
        reset({
          title: `Update ${prefillData.gameTitle}`,
          description: `Update versi game dari ${prefillData.currentVersion || '?'} ke versi terbaru.`,
          priority: 'High',
          category: 'Game Update',
          isAutomation: true,
          automationTargetId: prefillData.gameId,
          newVersion: '',
          dueDate: new Date().toISOString().split('T')[0],
        });
        setSubtasks([]);
        setNotes([]);
      } else {
        // MODE CREATE BIASA
        reset({
          title: '', description: '', priority: 'Medium',
          category: 'General', dueDate: '', isAutomation: false,
          automationTargetId: '', newVersion: '',
        });
        setSubtasks([]);
        setNotes([]);
      }
      setNewSubtaskText('');
      setNewNoteText('');

      // Fetch Games List
      const fetchGames = async () => {
        setIsGamesLoading(true);
        try {
          const q = query(collection(db, 'games'), orderBy('title'));
          const snap = await getDocs(q);
          setGamesList(snap.docs.map((d) => ({ id: d.id, title: d.data().title })));
        } catch (e) {
          console.error('Error fetching games', e);
        } finally {
          setIsGamesLoading(false);
        }
      };
      fetchGames();
    }
  }, [isOpen, initialData, prefillData, setValue, reset]);

  // ── Subtask handlers ──
  const handleAddSubtask = (e) => {
    e.preventDefault();
    const text = newSubtaskText.trim();
    if (!text) return;
    setSubtasks((prev) => [...prev, { id: uid(), text, completed: false }]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleSubtask = (id) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  // ── Notes handlers ──
  const handleAddNote = (e) => {
    e.preventDefault();
    const text = newNoteText.trim();
    if (!text) return;
    setNotes((prev) => [...prev, { id: uid(), text, createdAt: Date.now() }]);
    setNewNoteText('');
  };

  const handleRemoveNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // ── Submit ──
  const onSubmit = async (data) => {
    try {
      const taskData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
        status: initialData?.status || 'Todo',
        updatedAt: serverTimestamp(),
        isAutomation: data.isAutomation,
        subtasks,
        notes,
      };

      if (!initialData) {
        taskData.createdAt = serverTimestamp();
        taskData.totalFocusMinutes = 0;
      }

      if (data.isAutomation && data.automationTargetId) {
        const selectedGame = gamesList.find((g) => g.id === data.automationTargetId);
        const targetTitle = selectedGame?.title || prefillData?.gameTitle || 'Unknown Game';
        taskData.automationTargetId = data.automationTargetId;
        taskData.automationTargetTitle = targetTitle;
        taskData.automationPayload = {
          newVersion: data.newVersion,
          targetField: 'version',
        };
      }

      if (initialData) {
        await updateDoc(doc(db, 'tasks', initialData.id), taskData);
        Swal.fire({ ...swalDark, icon: 'success', title: 'Task Diupdate', timer: 1000, showConfirmButton: false });
      } else {
        await addDoc(collection(db, 'tasks'), taskData);
        Swal.fire({ ...swalDark, icon: 'success', title: 'Task Dibuat', timer: 1000, showConfirmButton: false });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire({ ...swalDark, title: 'Error', text: 'Gagal menyimpan task', icon: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#1A1F27] rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] border border-[#2A2F39]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2A2F39] flex justify-between items-center bg-[#111317] rounded-t-xl">
          <h3 className="font-bold text-[#F3F4F6] text-lg">
            {initialData ? 'Edit Task' : 'Task Baru'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#2A2F39] transition-colors">
            <X size={20} className="text-[#7E8796]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
          {/* Title & Description */}
          <div>
            <input
              {...register('title', { required: true })}
              placeholder="Apa yang perlu dikerjakan?"
              className="w-full text-lg font-bold placeholder:text-[#4A5568] border-none focus:ring-0 px-0 py-2 text-[#F3F4F6] bg-transparent outline-none"
              autoFocus
            />
            <textarea
              {...register('description')}
              placeholder="Tambahkan detail..."
              className="w-full text-sm text-[#C8CFDA] placeholder:text-[#4A5568] border-none focus:ring-0 px-0 resize-none h-20 bg-transparent outline-none"
            />
          </div>

          <div className="border-t border-[#2A2F39] my-2"></div>

          {/* Category, Priority, Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#7E8796] mb-1 flex items-center">
                <Tag size={12} className="mr-1" /> Kategori
              </label>
              <select
                {...register('category')}
                className="w-full text-sm border border-[#2A2F39] rounded-lg bg-[#111317] text-[#C8CFDA] focus:ring-[#FFD100]/30 focus:border-[#FFD100]/30 py-2 px-3"
              >
                <option value="General">General / Brain Dump</option>
                <option value="Shopee">Shopee Store</option>
                <option value="Game Update">Game Update</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#7E8796] mb-1 flex items-center">
                <Flag size={12} className="mr-1" /> Prioritas
              </label>
              <select
                {...register('priority')}
                className="w-full text-sm border border-[#2A2F39] rounded-lg bg-[#111317] text-[#C8CFDA] focus:ring-[#FFD100]/30 focus:border-[#FFD100]/30 py-2 px-3"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#7E8796] mb-1 flex items-center">
                <Calendar size={12} className="mr-1" /> Deadline
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full text-sm border border-[#2A2F39] rounded-lg bg-[#111317] text-[#C8CFDA] focus:ring-[#FFD100]/30 focus:border-[#FFD100]/30 py-2 px-3"
              />
            </div>
          </div>

          {/* ── SUBTASKS SECTION ── */}
          <div className="bg-[#111317] rounded-xl border border-[#2A2F39] p-4">
            <label className="text-xs font-bold text-[#7E8796] mb-2 flex items-center gap-1">
              <ListChecks size={12} /> Subtask / Checklist
              {subtasks.length > 0 && (
                <span className="ml-auto text-emerald-400 text-[10px]">
                  {subtasks.filter((s) => s.completed).length}/{subtasks.length}
                </span>
              )}
            </label>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 group/st">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(st.id)}
                      className="w-3.5 h-3.5 rounded border-[#2A2F39] bg-[#1A1F27] text-emerald-400 focus:ring-emerald-500/30 cursor-pointer flex-shrink-0"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        st.completed ? 'line-through text-[#4A5568]' : 'text-[#C8CFDA]'
                      }`}
                    >
                      {st.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="p-1 rounded opacity-0 group-hover/st:opacity-100 text-[#7E8796] hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah subtask..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                className="flex-1 text-sm border border-[#2A2F39] rounded-lg bg-[#1A1F27] text-[#C8CFDA] placeholder:text-[#4A5568] focus:ring-emerald-500/30 focus:border-emerald-500/30 py-1.5 px-3"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors flex-shrink-0"
              >
                <Plus size={16} />
              </button>
            </form>
          </div>

          {/* ── NOTES / LOG SECTION ── */}
          <div className="bg-[#111317] rounded-xl border border-[#2A2F39] p-4">
            <label className="text-xs font-bold text-[#7E8796] mb-2 flex items-center gap-1">
              <MessageSquare size={12} /> Catatan / Log
              {notes.length > 0 && (
                <span className="ml-auto text-[#4A5568] text-[10px]">{notes.length}</span>
              )}
            </label>

            {notes.length > 0 && (
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-[#1A1F27] border border-[#2A2F39] rounded-lg p-3 group/note"
                  >
                    <p className="text-xs text-[#C8CFDA] whitespace-pre-wrap">{note.text}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-[#4A5568]">
                        {note.createdAt
                          ? format(new Date(note.createdAt), 'd MMM, HH:mm', { locale: localeId })
                          : '-'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNote(note.id)}
                        className="p-0.5 rounded opacity-0 group-hover/note:opacity-100 text-[#7E8796] hover:text-red-400 transition-all"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah catatan..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 text-sm border border-[#2A2F39] rounded-lg bg-[#1A1F27] text-[#C8CFDA] placeholder:text-[#4A5568] focus:ring-sky-500/30 focus:border-sky-500/30 py-1.5 px-3"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 transition-colors flex-shrink-0"
              >
                <Plus size={16} />
              </button>
            </form>
          </div>

          {/* ── AUTOMATION SECTION ── */}
          {categoryWatch === 'Game Update' && (
            <div className="bg-violet-500/10 p-4 rounded-xl border border-violet-500/20 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-violet-400 flex items-center">
                  <Zap size={16} className="mr-2" /> Otomatisasi Game
                </h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isAutomation')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#2A2F39] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-transparent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#7E8796] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white"></div>
                </label>
              </div>

              {isAutomationWatch && (
                <div className="space-y-3">
                  <div className="text-xs text-violet-400 mb-2">
                    <AlertCircle size={12} className="inline mr-1" />
                    Saat task ini <b>&quot;Done&quot;</b>, game otomatis terupdate.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-violet-400 mb-1">
                      Pilih Game
                    </label>
                    {isGamesLoading ? (
                      <Loader2 className="animate-spin h-4 w-4 text-violet-400" />
                    ) : (
                      <select
                        {...register('automationTargetId')}
                        className="w-full text-sm border border-violet-500/25 rounded-lg bg-[#111317] text-[#C8CFDA] focus:ring-violet-500/30 py-2 px-3"
                      >
                        <option value="">-- Pilih Game --</option>
                        {gamesList.map((g) => (
                          <option key={g.id} value={g.id}>{g.title}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-violet-400 mb-1">
                      Versi Baru (Target)
                    </label>
                    <input
                      {...register('newVersion')}
                      placeholder="Contoh: v1.6.8"
                      className="w-full text-sm border border-violet-500/25 rounded-lg bg-[#111317] text-[#C8CFDA] placeholder:text-[#4A5568] focus:ring-violet-500/30 py-2 px-3"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-[#2A2F39]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#C8CFDA] hover:bg-[#2A2F39] rounded-lg font-medium text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#FFD100] text-[#111317] rounded-lg font-bold text-sm hover:brightness-110 flex items-center transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                'Simpan Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
