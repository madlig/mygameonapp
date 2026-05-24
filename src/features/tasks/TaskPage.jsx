// src/features/tasks/TaskPage.jsx
//
// Admin Task Board — Kanban (Todo → In Progress → Done)
// Dark+Colorful theme with Focus Timer, Subtasks, Notes
//
// Features:
//   - Kanban board 3 kolom dengan real-time Firestore
//   - Brain dump quick input
//   - Focus Timer (Pomodoro 25/5) — floating bar
//   - Subtask checklist (toggle langsung di card)
//   - Notes/log per task
//   - Automation: task "Done" → auto-update game version
//   - Time-based greeting
//   - Productivity stats

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  CheckCircle,
  Circle,
  Clock,
  Pencil,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Zap,
  Calendar,
  Loader2,
  AlertTriangle,
  Briefcase,
  Coffee,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Timer,
  MessageSquare,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  addDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import Swal from 'sweetalert2';
import TaskFormModal from './components/TaskFormModal';
import FocusTimerBar from './components/FocusTimerBar';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// ── Dark Swal preset ────────────────────────────────────────
const swalDark = {
  color: '#F3F4F6',
  background: '#1A1F27',
  confirmButtonColor: '#FFD100',
};

const swalToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1500,
  ...swalDark,
});

// ── Priority color map ──────────────────────────────────────
const priorityColors = {
  Urgent: {
    border: 'border-l-red-500',
    text: 'text-red-400',
    bg: 'bg-red-500/15',
  },
  High: {
    border: 'border-l-orange-500',
    text: 'text-orange-400',
    bg: 'bg-orange-500/15',
  },
  Medium: {
    border: 'border-l-sky-400',
    text: 'text-sky-400',
    bg: 'bg-sky-500/15',
  },
  Low: {
    border: 'border-l-emerald-500',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
  },
};

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  // ── Focus Timer state ──
  const [focusTask, setFocusTask] = useState(null);

  // ── Fetch Tasks (real-time) ──
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTasks(data);
        setLoading(false);
      },
      (err) => console.error(err)
    );
    return () => unsubscribe();
  }, []);

  // ── Stop focus if active task leaves "In Progress" ──
  useEffect(() => {
    if (focusTask) {
      const current = tasks.find((t) => t.id === focusTask.id);
      if (!current || current.status !== 'In Progress') {
        setFocusTask(null);
      }
    }
  }, [tasks, focusTask]);

  // ── Stats & Greeting ──
  const { stats, greeting } = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'Done').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'Done') return false;
      const d = new Date(t.dueDate.seconds * 1000);
      return isPast(d) && !isToday(d);
    }).length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);

    const hour = new Date().getHours();
    let greet = {
      text: 'Selamat Pagi',
      icon: Sunrise,
      color: 'text-orange-400',
    };
    if (hour >= 11 && hour < 15)
      greet = { text: 'Selamat Siang', icon: Sun, color: 'text-amber-400' };
    else if (hour >= 15 && hour < 19)
      greet = { text: 'Selamat Sore', icon: Sunset, color: 'text-orange-400' };
    else if (hour >= 19 || hour < 4)
      greet = { text: 'Selamat Malam', icon: Moon, color: 'text-indigo-400' };

    return {
      stats: { total, done, inProgress, overdue, progress },
      greeting: greet,
    };
  }, [tasks]);

  // ═════════════════════════════════════════════════════════════
  // HANDLERS
  // ═════════════════════════════════════════════════════════════

  const handleMoveTask = async (task, newStatus) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);

      // Stop focus if moving the focused task away from In Progress
      if (focusTask?.id === task.id && newStatus !== 'In Progress') {
        setFocusTask(null);
      }

      // AUTOMATION CHECK
      if (
        newStatus === 'Done' &&
        task.isAutomation &&
        task.automationTargetId
      ) {
        const result = await Swal.fire({
          ...swalDark,
          title: 'Selesaikan & Update Game?',
          html: `Task ini akan mengubah versi game <b style="color:#FFD100">${task.automationTargetTitle}</b> menjadi <b style="color:#a78bfa">${task.automationPayload?.newVersion || '?'}</b>.`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#8b5cf6',
          cancelButtonColor: '#2A2F39',
          confirmButtonText: 'Ya, Update!',
          cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;

        const batch = writeBatch(db);
        batch.update(taskRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
        const gameRef = doc(db, 'games', task.automationTargetId);
        batch.update(gameRef, {
          version: task.automationPayload.newVersion,
          lastVersionDate: Timestamp.now(),
          updatedAt: serverTimestamp(),
        });
        await batch.commit();

        swalToast.fire({
          icon: 'success',
          title: `Game ${task.automationTargetTitle} berhasil diupdate!`,
        });
      } else {
        await updateDoc(taskRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      ...swalDark,
      title: 'Hapus Task?',
      text: 'Tidak bisa dikembalikan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#2A2F39',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      width: 340,
    });
    if (result.isConfirmed) {
      if (focusTask?.id === id) setFocusTask(null);
      await deleteDoc(doc(db, 'tasks', id));
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        title: quickAddTitle,
        status: 'Todo',
        priority: 'Medium',
        category: 'General',
        isAutomation: false,
        subtasks: [],
        notes: [],
        totalFocusMinutes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setQuickAddTitle('');
      swalToast.fire({ icon: 'success', title: 'Tersimpan ke To-Do' });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // ── Focus Timer handlers ──
  const handleStartFocus = useCallback((task) => {
    setFocusTask(task);
  }, []);

  const handleFocusComplete = useCallback(async (task, durationMinutes) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        totalFocusMinutes: increment(durationMinutes),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error saving focus session:', err);
    }
  }, []);

  const handleFocusStop = useCallback(() => {
    setFocusTask(null);
  }, []);

  // ── Subtask toggle (directly in card) ──
  const handleToggleSubtask = useCallback(
    async (taskId, subtaskIndex) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task?.subtasks) return;
      const updated = task.subtasks.map((st, i) =>
        i === subtaskIndex ? { ...st, completed: !st.completed } : st
      );
      try {
        await updateDoc(doc(db, 'tasks', taskId), {
          subtasks: updated,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Error toggling subtask:', err);
      }
    },
    [tasks]
  );

  // ═════════════════════════════════════════════════════════════
  // SUB-COMPONENTS
  // ═════════════════════════════════════════════════════════════

  const SmartDate = ({ timestamp }) => {
    if (!timestamp) return null;
    const date = new Date(timestamp.seconds * 1000);
    let text = format(date, 'd MMM', { locale: localeId });
    let colorClass = 'text-[#7E8796]';

    if (isToday(date)) {
      text = 'Hari Ini';
      colorClass = 'text-emerald-400 font-bold';
    } else if (isTomorrow(date)) {
      text = 'Besok';
      colorClass = 'text-sky-400 font-medium';
    } else if (isPast(date)) {
      colorClass = 'text-red-400 font-bold';
    }

    return (
      <span className={`flex items-center text-[10px] ${colorClass}`}>
        <Calendar size={10} className="mr-1" /> {text}
      </span>
    );
  };

  const TaskCard = ({ task }) => {
    const pColor = priorityColors[task.priority] || priorityColors.Medium;
    const subtasks = task.subtasks || [];
    const completedSubs = subtasks.filter((s) => s.completed).length;
    const notesCount = (task.notes || []).length;
    const focusMinutes = task.totalFocusMinutes || 0;
    const isBeingFocused = focusTask?.id === task.id;

    return (
      <div
        className={`bg-[#1A1F27] p-4 rounded-xl border-l-[3px] mb-3 transition-all group relative ${pColor.border} ${
          isBeingFocused ? 'ring-1 ring-emerald-500/30' : ''
        }`}
      >
        {/* Hover Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
          <button
            onClick={() => {
              setEditingTask(task);
              setIsModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-[#7E8796] hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => handleDelete(task.id)}
            className="p-1.5 rounded-lg text-[#7E8796] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Category + Priority + Automation Pill */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="text-[10px] px-2 py-0.5 bg-[#111317] text-[#7E8796] rounded-full border border-[#2A2F39] font-medium tracking-wide uppercase">
            {task.category}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${pColor.bg} ${pColor.text}`}
          >
            {task.priority}
          </span>
          {task.isAutomation && (
            <span className="text-[10px] px-2 py-0.5 bg-violet-500/15 text-violet-400 rounded-full border border-violet-500/25 font-bold flex items-center">
              <Zap size={10} className="mr-1" /> Auto
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h4
          className="text-sm font-bold text-[#F3F4F6] mb-1 leading-snug cursor-pointer hover:text-[#FFD100] transition-colors pr-16"
          onClick={() => {
            setEditingTask(task);
            setIsModalOpen(true);
          }}
        >
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-[#7E8796] mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Automation Target */}
        {task.isAutomation && task.status !== 'Done' && (
          <div className="text-[10px] text-violet-400 bg-violet-500/10 px-2.5 py-1.5 rounded-lg mb-2 flex items-center border border-violet-500/20">
            <AlertTriangle size={10} className="mr-1.5 flex-shrink-0" />
            Target: <b className="ml-1">{task.automationPayload?.newVersion}</b>
          </div>
        )}

        {/* Subtask Checklist (max 3 visible) */}
        {subtasks.length > 0 && (
          <div className="mb-2 space-y-1" onClick={(e) => e.stopPropagation()}>
            {subtasks.slice(0, 3).map((st, i) => (
              <label
                key={st.id}
                className="flex items-center gap-2 text-xs cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={st.completed}
                  onChange={() => handleToggleSubtask(task.id, i)}
                  className="w-3.5 h-3.5 rounded border-[#2A2F39] bg-[#111317] text-emerald-400 focus:ring-emerald-500/30 cursor-pointer"
                />
                <span
                  className={`${
                    st.completed
                      ? 'line-through text-[#4A5568]'
                      : 'text-[#C8CFDA]'
                  } transition-colors`}
                >
                  {st.text}
                </span>
              </label>
            ))}
            {subtasks.length > 3 && (
              <span className="text-[10px] text-[#4A5568] ml-5">
                +{subtasks.length - 3} lagi
              </span>
            )}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-[#2A2F39] rounded-full h-1">
                <div
                  className="bg-emerald-400 h-1 rounded-full transition-all"
                  style={{
                    width: `${subtasks.length ? (completedSubs / subtasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-[#7E8796] tabular-nums">
                {completedSubs}/{subtasks.length}
              </span>
            </div>
          </div>
        )}

        {/* Footer: Date + Meta + Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2A2F39]/50 mt-1">
          <div className="flex items-center gap-3">
            <SmartDate timestamp={task.dueDate} />
            {focusMinutes > 0 && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Timer size={10} /> {focusMinutes}m
              </span>
            )}
            {notesCount > 0 && (
              <span className="text-[10px] text-[#7E8796] flex items-center gap-1">
                <MessageSquare size={10} /> {notesCount}
              </span>
            )}
          </div>

          {/* Navigation + Focus */}
          <div className="flex gap-1 items-center">
            {task.status === 'In Progress' && !isBeingFocused && (
              <button
                onClick={() => handleStartFocus(task)}
                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/15 transition-colors"
                title="Mulai Fokus (Pomodoro)"
              >
                <Timer size={14} />
              </button>
            )}
            {isBeingFocused && (
              <span className="text-[10px] text-emerald-400 font-bold px-1.5 animate-pulse">
                Fokus...
              </span>
            )}
            {task.status !== 'Todo' && (
              <button
                onClick={() =>
                  handleMoveTask(
                    task,
                    task.status === 'Done' ? 'In Progress' : 'Todo'
                  )
                }
                className="p-1.5 rounded-lg hover:bg-[#2A2F39] text-[#7E8796] hover:text-[#C8CFDA] transition-colors"
                title="Mundur"
              >
                <ArrowLeft size={14} />
              </button>
            )}
            {task.status !== 'Done' && (
              <button
                onClick={() =>
                  handleMoveTask(
                    task,
                    task.status === 'Todo' ? 'In Progress' : 'Done'
                  )
                }
                className="p-1.5 rounded-lg hover:bg-emerald-500/15 text-emerald-400 font-bold hover:scale-110 transition-all"
                title={
                  task.isAutomation ? 'Selesaikan & Update Game' : 'Majukan'
                }
              >
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Column = ({
    title,
    status,
    icon: Icon,
    iconColor,
    iconBg,
    emptyMsg,
  }) => {
    const columnTasks = tasks.filter((t) => t.status === status);
    return (
      <div className="flex-1 min-w-[320px] max-w-[400px] flex flex-col h-full bg-[#0D1117] rounded-2xl p-2 border border-[#2A2F39]">
        {/* Column Header */}
        <div className="flex items-center justify-between px-3 py-3 mb-2">
          <div className="flex items-center gap-2 font-bold text-[#F3F4F6]">
            <div className={`p-1.5 rounded-lg ${iconBg}`}>
              <Icon size={16} className={iconColor} />
            </div>
            {title}
          </div>
          <span className="bg-[#1A1F27] text-[#7E8796] text-xs px-2.5 py-1 rounded-lg font-bold border border-[#2A2F39]">
            {columnTasks.length}
          </span>
        </div>

        {/* Scrollable Card Area */}
        <div className="flex-1 overflow-y-auto px-1 pb-10 custom-scrollbar space-y-1">
          {columnTasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}

          {columnTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
              <div className="w-16 h-16 bg-[#1A1F27] rounded-full flex items-center justify-center mb-3 border border-[#2A2F39]">
                <Coffee size={24} className="text-[#4A5568]" />
              </div>
              <p className="text-sm font-medium text-[#7E8796]">{emptyMsg}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen pb-10 flex flex-col font-sans">
      <div className="max-w-[1400px] mx-auto px-6 py-8 w-full flex-1 flex flex-col">
        {/* ── HEADER: GREETING & STATS ── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <greeting.icon size={20} className={greeting.color} />
              <span className="text-sm font-bold text-[#7E8796] uppercase tracking-wider">
                {greeting.text}, Admin
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#F3F4F6] tracking-tight">
              Fokus apa kita hari ini?
            </h1>
          </div>

          {/* Stats Cards */}
          <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
            {/* Productivity */}
            <div className="bg-[#1A1F27] p-3 rounded-xl border border-[#2A2F39] flex items-center gap-4 flex-1 lg:flex-none min-w-[200px]">
              <div className="text-right">
                <p className="text-[10px] text-[#7E8796] font-bold uppercase mb-0.5">
                  Selesai
                </p>
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-2xl font-black text-[#FFD100]">
                    {stats.done}
                  </span>
                  <span className="text-sm text-[#7E8796] font-medium">
                    / {stats.total}
                  </span>
                </div>
              </div>
              <div className="h-8 w-px bg-[#2A2F39]"></div>
              <div className="w-24">
                <div className="flex justify-between text-[10px] font-bold text-[#7E8796] mb-1">
                  <span>Progress</span>
                  <span className="text-[#C8CFDA]">{stats.progress}%</span>
                </div>
                <div className="w-full bg-[#2A2F39] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#FFD100] to-amber-500 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${stats.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Overdue Counter */}
            {stats.overdue > 0 && (
              <div className="bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" />
                <div>
                  <p className="text-[10px] text-red-400 font-bold uppercase">
                    Overdue
                  </p>
                  <span className="text-lg font-black text-red-400">
                    {stats.overdue}
                  </span>
                </div>
              </div>
            )}

            {/* In Progress */}
            <div className="bg-amber-500/10 px-4 py-3 rounded-xl border border-amber-500/20 flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              <div>
                <p className="text-[10px] text-amber-400 font-bold uppercase">
                  Aktif
                </p>
                <span className="text-lg font-black text-amber-400">
                  {stats.inProgress}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOCUS TIMER BAR ── */}
        <FocusTimerBar
          task={focusTask}
          onSessionComplete={handleFocusComplete}
          onStop={handleFocusStop}
        />

        {/* ── BRAIN DUMP (QUICK INPUT) ── */}
        <div className="mb-8 relative z-20 group">
          <form
            onSubmit={handleQuickAdd}
            className="relative bg-[#1A1F27] rounded-2xl border border-[#2A2F39] p-1 flex items-center transition-all focus-within:ring-2 ring-[#FFD100]/20 ring-offset-2 ring-offset-[#0D1117]"
          >
            <div className="pl-4 pr-2 text-[#4A5568]">
              <Briefcase size={20} />
            </div>
            <input
              type="text"
              placeholder="Brain dump: Tulis ide, tugas, atau ingatan sekilas di sini..."
              className="w-full py-4 px-2 text-[#F3F4F6] font-medium placeholder:text-[#4A5568] outline-none text-base bg-transparent"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
            />
            <button
              type="submit"
              className="bg-[#FFD100] text-[#111317] p-3 rounded-xl hover:brightness-110 transition-all active:scale-95 flex-shrink-0 mr-1"
            >
              <Plus size={20} />
            </button>
          </form>
          <p className="text-xs text-[#4A5568] mt-2 ml-4 flex items-center gap-1">
            <span className="bg-[#2A2F39] px-1.5 py-0.5 rounded text-[10px] font-mono text-[#7E8796]">
              ENTER
            </span>{' '}
            untuk simpan cepat
          </p>
        </div>

        {/* ── KANBAN BOARD ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#FFD100] w-8 h-8" />
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 h-full items-start">
            <Column
              title="To Do / Brain Dump"
              status="Todo"
              icon={Circle}
              iconColor="text-sky-400"
              iconBg="bg-sky-500/15"
              emptyMsg="Kosong? Saatnya santai sejenak!"
            />
            <Column
              title="Sedang Dikerjakan"
              status="In Progress"
              icon={Clock}
              iconColor="text-amber-400"
              iconBg="bg-amber-500/15"
              emptyMsg="Belum ada yang dikerjakan. Pilih satu dari To-Do!"
            />
            <Column
              title="Selesai"
              status="Done"
              icon={CheckCircle}
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/15"
              emptyMsg="Belum ada yang selesai hari ini. Semangat!"
            />
          </div>
        )}
      </div>

      {/* MOBILE FAB */}
      <button
        onClick={() => {
          setEditingTask(null);
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6 md:hidden bg-[#FFD100] text-[#111317] p-4 rounded-full shadow-xl shadow-[#FFD100]/20 hover:brightness-110 active:scale-95 transition-all z-40"
      >
        <Plus size={24} />
      </button>

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingTask}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default TaskPage;
