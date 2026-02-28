import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, CheckCircle, Circle, Clock, MoreVertical, 
  Trash2, ArrowRight, ArrowLeft, Zap, Calendar, Loader2, AlertTriangle, Briefcase, 
  Coffee, Sun, Moon, Sunrise, Sunset
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, writeBatch, serverTimestamp, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import Swal from 'sweetalert2';
import TaskFormModal from './components/TaskFormModal';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  // Fetch Tasks
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
      setLoading(false);
    }, (err) => console.error(err));
    return () => unsubscribe();
  }, []);

  // --- STATISTIK & DATA ---
  const { stats, greeting } = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'Done').length;
    const todo = tasks.filter(t => t.status === 'Todo').length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);

    const hour = new Date().getHours();
    let greet = { text: 'Selamat Pagi', icon: Sunrise, color: 'text-orange-500' };
    if (hour >= 11 && hour < 15) greet = { text: 'Selamat Siang', icon: Sun, color: 'text-yellow-500' };
    else if (hour >= 15 && hour < 19) greet = { text: 'Selamat Sore', icon: Sunset, color: 'text-orange-400' };
    else if (hour >= 19 || hour < 4) greet = { text: 'Selamat Malam', icon: Moon, color: 'text-indigo-400' };

    return { stats: { total, done, todo, progress }, greeting: greet };
  }, [tasks]);

  // --- LOGIC: PINDAH STATUS ---
  const handleMoveTask = async (task, newStatus) => {
    try {
        const taskRef = doc(db, 'tasks', task.id);
        
        // AUTOMATION CHECK
        if (newStatus === 'Done' && task.isAutomation && task.automationTargetId) {
            const result = await Swal.fire({
                title: 'Selesaikan & Update Game?',
                html: `Task ini akan mengubah versi game <b>${task.automationTargetTitle}</b> menjadi <b>${task.automationPayload?.newVersion || '?'}</b>.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#8b5cf6', // Violet
                confirmButtonText: 'Ya, Update!',
                cancelButtonText: 'Batal'
            });

            if (!result.isConfirmed) return;

            const batch = writeBatch(db);
            batch.update(taskRef, { status: newStatus, updatedAt: serverTimestamp() });
            
            const gameRef = doc(db, 'games', task.automationTargetId);
            batch.update(gameRef, { 
                version: task.automationPayload.newVersion,
                lastVersionDate: Timestamp.now(),
                updatedAt: serverTimestamp()
            });

            await batch.commit();
            
            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            Toast.fire({ icon: 'success', title: `Game ${task.automationTargetTitle} berhasil diupdate!` });

        } else {
            // Update Biasa
            await updateDoc(taskRef, { status: newStatus, updatedAt: serverTimestamp() });
        }
    } catch (error) {
        console.error("Error moving task:", error);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({ 
        title: 'Hapus Task?', 
        text: 'Tidak bisa dikembalikan.',
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: '#d33',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        width: 300
    });
    if (result.isConfirmed) {
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
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        setQuickAddTitle('');
        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        Toast.fire({ icon: 'success', title: 'Tersimpan ke To-Do' });
    } catch (error) {
        console.error("Error adding task:", error);
    }
  };

  // --- UI COMPONENTS ---
  
  const SmartDate = ({ timestamp }) => {
      if (!timestamp) return null;
      const date = new Date(timestamp.seconds * 1000);
      let text = format(date, 'd MMM', { locale: localeId });
      let colorClass = 'text-slate-400';

      if (isToday(date)) { text = 'Hari Ini'; colorClass = 'text-green-600 font-bold'; }
      else if (isTomorrow(date)) { text = 'Besok'; colorClass = 'text-blue-500 font-medium'; }
      else if (isPast(date)) { colorClass = 'text-red-500 font-bold'; }

      return <span className={`flex items-center text-[10px] ${colorClass}`}><Calendar size={10} className="mr-1"/> {text}</span>;
  };

  const TaskCard = ({ task }) => (
    <div className={`bg-white p-4 rounded-xl border-l-[3px] shadow-sm mb-3 hover:shadow-md transition-all group relative animate-in fade-in slide-in-from-bottom-2
        ${task.priority === 'Urgent' ? 'border-l-red-500' : 
          task.priority === 'High' ? 'border-l-orange-500' : 
          task.priority === 'Low' ? 'border-l-green-500' : 'border-l-blue-400'
        }
    `}>
        {/* Hover Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-white pl-2">
            <button onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="text-slate-400 hover:text-blue-600"><MoreVertical size={16}/></button>
            <button onClick={() => handleDelete(task.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
        </div>

        {/* Category Pill */}
        <div className="flex flex-wrap gap-1 mb-2">
            <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-100 font-medium tracking-wide uppercase">
                {task.category}
            </span>
            {task.isAutomation && (
                <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full border border-purple-100 font-bold flex items-center">
                    <Zap size={10} className="mr-1"/> Auto
                </span>
            )}
        </div>

        {/* Title & Desc */}
        <h4 className="text-sm font-bold text-slate-800 mb-1 leading-snug cursor-pointer hover:text-blue-600 transition-colors" onClick={() => { setEditingTask(task); setIsModalOpen(true); }}>
            {task.title}
        </h4>
        {task.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>}

        {/* Automation Target */}
        {task.isAutomation && task.status !== 'Done' && (
             <div className="text-[10px] text-purple-600 bg-purple-50 px-2 py-1.5 rounded-lg mb-3 flex items-center border border-purple-100">
                <AlertTriangle size={10} className="mr-1.5"/>
                Target Update: <b className="ml-1">{task.automationPayload?.newVersion}</b>
             </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
            <SmartDate timestamp={task.dueDate} />
            
            {/* Navigation Arrows */}
            <div className="flex gap-1">
                {task.status !== 'Todo' && (
                    <button onClick={() => handleMoveTask(task, task.status === 'Done' ? 'In Progress' : 'Todo')} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Mundur">
                        <ArrowLeft size={14}/>
                    </button>
                )}
                {task.status !== 'Done' && (
                    <button onClick={() => handleMoveTask(task, task.status === 'Todo' ? 'In Progress' : 'Done')} className="p-1.5 rounded-md hover:bg-green-50 text-green-600 font-bold hover:scale-110 transition-transform" title={task.isAutomation ? "Selesaikan & Update Game" : "Selesai"}>
                        <ArrowRight size={14}/>
                    </button>
                )}
            </div>
        </div>
    </div>
  );

  const Column = ({ title, status, icon: Icon, color, emptyMsg }) => {
     const columnTasks = tasks.filter(t => t.status === status);
     return (
        <div className="flex-1 min-w-[320px] max-w-[400px] flex flex-col h-full bg-slate-100/50 rounded-2xl p-2 border border-slate-200/50">
            {/* Column Header */}
            <div className={`flex items-center justify-between px-3 py-3 mb-2`}>
                <div className="flex items-center gap-2 font-bold text-slate-700">
                    <div className={`p-1.5 rounded-lg ${color} bg-opacity-20`}>
                        <Icon size={16} className={color.replace('bg-', 'text-').replace('/20', '')} />
                    </div>
                    {title}
                </div>
                <span className="bg-white text-slate-400 text-xs px-2 py-1 rounded-md font-bold shadow-sm border border-slate-100">
                    {columnTasks.length}
                </span>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-1 pb-10 custom-scrollbar space-y-1">
                {columnTasks.map(task => <TaskCard key={task.id} task={task} />)}
                
                {columnTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                            <Coffee size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">{emptyMsg}</p>
                    </div>
                )}
            </div>
        </div>
     );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 flex flex-col font-sans">
      <div className="max-w-[1400px] mx-auto px-6 py-8 w-full flex-1 flex flex-col">
        
        {/* --- HEADER: GREETING & PROGRESS --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6 animate-in slide-in-from-top-4">
            <div>
                {/* PERBAIKAN: Akses properti greeting langsung, bukan greeting.greeting */}
                <div className="flex items-center gap-2 mb-1">
                    <greeting.icon size={20} className={greeting.color || 'text-slate-600'} />
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{greeting.text}, Admin</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                    Fokus apa kita hari ini?
                </h1>
            </div>

            {/* Daily Progress Stats */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6 w-full lg:w-auto">
                <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Produktivitas</p>
                    <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-2xl font-black text-slate-800">{stats.done}</span>
                        <span className="text-sm text-slate-400 font-medium">/ {stats.total} Selesai</span>
                    </div>
                </div>
                <div className="h-10 w-[1px] bg-slate-100"></div>
                <div className="w-32">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{stats.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${stats.progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- BRAIN DUMP (QUICK INPUT) --- */}
        <div className="mb-8 relative z-20 group">
            <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl transition-opacity opacity-50 group-hover:opacity-100"></div>
            <form onSubmit={handleQuickAdd} className="relative bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-1 flex items-center transition-all focus-within:ring-4 ring-blue-500/10 ring-offset-2">
                <div className="pl-4 pr-2 text-slate-300">
                    <Briefcase size={20} />
                </div>
                <input 
                    type="text" 
                    placeholder="Brain dump: Tulis ide, tugas, atau ingatan sekilas di sini..." 
                    className="w-full py-4 px-2 text-slate-700 font-medium placeholder:text-slate-400 outline-none text-base bg-transparent"
                    value={quickAddTitle}
                    onChange={e => setQuickAddTitle(e.target.value)}
                />
                <button 
                    type="submit" 
                    className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex-shrink-0 mr-1"
                >
                    <Plus size={20} />
                </button>
            </form>
            <p className="text-xs text-slate-400 mt-2 ml-4 flex items-center gap-1">
                <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500">ENTER</span> untuk simpan cepat
            </p>
        </div>

        {/* --- KANBAN BOARD --- */}
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
        ) : (
            <div className="flex gap-6 overflow-x-auto pb-4 h-full items-start">
                <Column 
                    title="To Do / Brain Dump" 
                    status="Todo" 
                    icon={Circle} 
                    color="bg-blue-500" 
                    emptyMsg="Kosong? Wah, saatnya santai sejenak! ☕" 
                />
                <Column 
                    title="Sedang Dikerjakan" 
                    status="In Progress" 
                    icon={Clock} 
                    color="bg-orange-500" 
                    emptyMsg="Belum ada yang dikerjakan. Pilih satu dari To-Do!" 
                />
                <Column 
                    title="Selesai" 
                    status="Done" 
                    icon={CheckCircle} 
                    color="bg-emerald-500" 
                    emptyMsg="Belum ada yang selesai hari ini. Semangat! 💪" 
                />
            </div>
        )}

      </div>

      {/* MOBILE FAB */}
      <button 
        onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
        className="fixed bottom-6 right-6 md:hidden bg-slate-900 text-white p-4 rounded-full shadow-xl hover:bg-slate-800 active:scale-95 transition-all z-40"
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