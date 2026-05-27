// src/features/feedback/FeedbackPage.jsx
//
// Admin Feedback page — 2 tabs:
// 1. Kelola FAQ: CRUD FAQ items displayed on landing page
// 2. Pertanyaan Masuk: User questions from landing page, answer & promote to FAQ

import React, { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  MessageSquare,
  HelpCircle,
  Send,
  Star,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Inbox,
  Sparkles,
  Mail,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  subscribeFaqs,
  addFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
  seedFaqsFromStatic,
  subscribeUserQuestions,
  markQuestionRead,
  answerQuestion,
  promoteToFaq,
  deleteUserQuestion,
} from './services/feedbackFirestore';
import { faqItems as staticFaqItems } from '../landing/data/faq';

const swalDark = {
  color: '#F3F4F6',
  background: '#1A1F27',
  confirmButtonColor: '#FFD100',
};

const FeedbackPage = () => {
  const [activeTab, setActiveTab] = useState('faq');
  const [faqs, setFaqs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  // FAQ form state
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [savingFaq, setSavingFaq] = useState(false);

  // Answer form state
  const [answeringId, setAnsweringId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Subscribe to FAQs
  useEffect(() => {
    const unsub = subscribeFaqs((items) => {
      setFaqs(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Subscribe to user questions
  useEffect(() => {
    const unsub = subscribeUserQuestions((items) => {
      setQuestions(items);
      setQuestionsLoading(false);
    });
    return () => unsub();
  }, []);

  // Seed static FAQs on first load if Firestore is empty
  useEffect(() => {
    if (!loading && faqs.length === 0) {
      seedFaqsFromStatic(staticFaqItems).then((seeded) => {
        if (seeded) console.log('FAQ seeded from static data');
      });
    }
  }, [loading, faqs.length]);

  // Counts
  const newQuestionCount = useMemo(
    () => questions.filter((q) => q.status === 'new').length,
    [questions]
  );

  // ── FAQ handlers ──
  const openAddFaq = () => {
    setEditingFaq(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setShowFaqForm(true);
  };

  const openEditFaq = (faq) => {
    setEditingFaq(faq);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setShowFaqForm(true);
  };

  const handleSaveFaq = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    setSavingFaq(true);
    try {
      if (editingFaq) {
        await updateFaq(editingFaq.id, {
          question: faqQuestion.trim(),
          answer: faqAnswer.trim(),
        });
      } else {
        await addFaq({
          question: faqQuestion.trim(),
          answer: faqAnswer.trim(),
          order: faqs.length,
        });
      }
      setShowFaqForm(false);
      setEditingFaq(null);
      setFaqQuestion('');
      setFaqAnswer('');
    } catch (err) {
      console.error('Save FAQ error:', err);
      Swal.fire({ ...swalDark, icon: 'error', title: 'Gagal menyimpan FAQ' });
    } finally {
      setSavingFaq(false);
    }
  };

  const handleDeleteFaq = async (faq) => {
    const result = await Swal.fire({
      ...swalDark,
      icon: 'warning',
      title: 'Hapus FAQ?',
      text: `"${faq.question}"`,
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    });
    if (result.isConfirmed) {
      await deleteFaq(faq.id);
    }
  };

  const handleToggleFaq = async (faq) => {
    await updateFaq(faq.id, { isActive: !faq.isActive });
  };

  const handleMoveFaq = async (index, direction) => {
    const newFaqs = [...faqs];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newFaqs.length) return;
    [newFaqs[index], newFaqs[targetIndex]] = [
      newFaqs[targetIndex],
      newFaqs[index],
    ];
    await reorderFaqs(newFaqs.map((f) => f.id));
  };

  // ── Question handlers ──
  const openAnswerForm = (q) => {
    setAnsweringId(q.id);
    setAnswerText(q.answer || '');
    if (q.status === 'new') markQuestionRead(q.id);
  };

  const handleSaveAnswer = async () => {
    if (!answerText.trim()) return;
    setSavingAnswer(true);
    try {
      await answerQuestion(answeringId, answerText.trim());
      setAnsweringId(null);
      setAnswerText('');
    } catch (err) {
      console.error('Answer error:', err);
      Swal.fire({
        ...swalDark,
        icon: 'error',
        title: 'Gagal menyimpan jawaban',
      });
    } finally {
      setSavingAnswer(false);
    }
  };

  const handlePromoteToFaq = async (q) => {
    if (!q.answer) {
      Swal.fire({
        ...swalDark,
        icon: 'info',
        title: 'Jawab dulu pertanyaan ini sebelum dipromosikan ke FAQ',
      });
      return;
    }
    const result = await Swal.fire({
      ...swalDark,
      icon: 'question',
      title: 'Promosikan ke FAQ?',
      text: 'Pertanyaan dan jawaban ini akan ditambahkan ke FAQ landing page.',
      showCancelButton: true,
      confirmButtonText: 'Promosikan',
      cancelButtonText: 'Batal',
    });
    if (result.isConfirmed) {
      await promoteToFaq(q, faqs.length);
      Swal.fire({
        ...swalDark,
        icon: 'success',
        title: 'Berhasil dipromosikan ke FAQ!',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleDeleteQuestion = async (q) => {
    const result = await Swal.fire({
      ...swalDark,
      icon: 'warning',
      title: 'Hapus pertanyaan?',
      text: `Dari: ${q.name || 'Anonim'}`,
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    });
    if (result.isConfirmed) {
      await deleteUserQuestion(q.id);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusConfig = {
    new: {
      label: 'Baru',
      class: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
      icon: Mail,
    },
    read: {
      label: 'Dibaca',
      class: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
      icon: Eye,
    },
    answered: {
      label: 'Dijawab',
      class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      icon: CheckCircle2,
    },
  };

  // ════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#F3F4F6] mb-1">
            Feedback & FAQ
          </h1>
          <p className="text-[#7E8796] text-sm">
            Kelola FAQ landing page dan jawab pertanyaan dari customer.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A2F39] gap-1 mb-6">
          {[
            {
              key: 'faq',
              label: 'Kelola FAQ',
              icon: HelpCircle,
              count: faqs.length,
            },
            {
              key: 'questions',
              label: 'Pertanyaan Masuk',
              icon: Inbox,
              count: newQuestionCount,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 px-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${
                  active
                    ? 'text-[#FFD100] border-[#FFD100]'
                    : 'text-[#7E8796] border-transparent hover:text-[#C8CFDA]'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      tab.key === 'questions' && newQuestionCount > 0
                        ? 'bg-yellow-500 text-[#111317] animate-pulse'
                        : 'bg-[#2A2F39] text-[#C8CFDA]'
                    }`}
                  >
                    {tab.key === 'questions' && newQuestionCount > 0
                      ? newQuestionCount
                      : tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════
           Tab: Kelola FAQ
           ══════════════════════════════════════ */}
        {activeTab === 'faq' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={openAddFaq}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-[#FFD100] text-[#0D1117] hover:bg-[#FFD100]/90 transition-colors"
              >
                <Plus size={14} />
                Tambah FAQ
              </button>
            </div>

            {/* FAQ Form Modal */}
            {showFaqForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                <div className="bg-[#1A1F27] border border-[#2A2F39] rounded-xl w-full max-w-lg p-6">
                  <h3 className="text-base font-bold text-[#F3F4F6] mb-4">
                    {editingFaq ? 'Edit FAQ' : 'Tambah FAQ Baru'}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-[#7E8796] mb-1">
                        Pertanyaan
                      </label>
                      <input
                        type="text"
                        value={faqQuestion}
                        onChange={(e) => setFaqQuestion(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#111317] border border-[#2A2F39] text-sm text-[#C8CFDA] focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40"
                        placeholder="Bagaimana cara..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#7E8796] mb-1">
                        Jawaban
                      </label>
                      <textarea
                        value={faqAnswer}
                        onChange={(e) => setFaqAnswer(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg bg-[#111317] border border-[#2A2F39] text-sm text-[#C8CFDA] focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 resize-none"
                        placeholder="Jawabannya adalah..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => {
                        setShowFaqForm(false);
                        setEditingFaq(null);
                      }}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-[#2A2F39] text-[#C8CFDA] hover:bg-[#3A3F49] transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveFaq}
                      disabled={
                        savingFaq || !faqQuestion.trim() || !faqAnswer.trim()
                      }
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-[#FFD100] text-[#0D1117] hover:bg-[#FFD100]/90 transition-colors disabled:opacity-50"
                    >
                      {savingFaq ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        'Simpan'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ List */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-[#FFD100] w-6 h-6" />
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-16 bg-[#111317] border border-[#2A2F39] rounded-xl">
                <HelpCircle size={32} className="mx-auto text-[#7E8796] mb-3" />
                <p className="text-sm text-[#C8CFDA]">Belum ada FAQ</p>
                <p className="text-xs text-[#7E8796] mt-1">
                  Klik "Tambah FAQ" untuk memulai.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {faqs.map((faq, index) => (
                  <div
                    key={faq.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      faq.isActive
                        ? 'bg-[#111317] border-[#2A2F39]'
                        : 'bg-[#111317]/50 border-[#2A2F39]/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Reorder controls */}
                      <div className="flex flex-col items-center gap-0.5 pt-0.5">
                        <button
                          onClick={() => handleMoveFaq(index, -1)}
                          disabled={index === 0}
                          className="p-0.5 text-[#7E8796] hover:text-[#C8CFDA] disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <GripVertical size={14} className="text-[#4A5568]" />
                        <button
                          onClick={() => handleMoveFaq(index, 1)}
                          disabled={index === faqs.length - 1}
                          className="p-0.5 text-[#7E8796] hover:text-[#C8CFDA] disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-[#7E8796] bg-[#2A2F39] px-1.5 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          {!faq.isActive && (
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/25">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-[#F3F4F6] mb-1">
                          {faq.question}
                        </p>
                        <p className="text-xs text-[#7E8796] leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggleFaq(faq)}
                          className="p-1.5 rounded-md text-[#7E8796] hover:text-[#C8CFDA] hover:bg-[#2A2F39] transition-colors"
                          title={faq.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {faq.isActive ? (
                            <Eye size={14} />
                          ) : (
                            <EyeOff size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => openEditFaq(faq)}
                          className="p-1.5 rounded-md text-[#7E8796] hover:text-blue-400 hover:bg-blue-500/15 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(faq)}
                          className="p-1.5 rounded-md text-[#7E8796] hover:text-red-400 hover:bg-red-500/15 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
           Tab: Pertanyaan Masuk
           ══════════════════════════════════════ */}
        {activeTab === 'questions' && (
          <div>
            {questionsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-[#FFD100] w-6 h-6" />
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-16 bg-[#111317] border border-[#2A2F39] rounded-xl">
                <Inbox size={32} className="mx-auto text-[#7E8796] mb-3" />
                <p className="text-sm text-[#C8CFDA]">
                  Belum ada pertanyaan masuk
                </p>
                <p className="text-xs text-[#7E8796] mt-1">
                  Pertanyaan dari customer di halaman FAQ akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q) => {
                  const sc = statusConfig[q.status] || statusConfig.new;
                  const StatusIcon = sc.icon;
                  const isAnswering = answeringId === q.id;

                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-4 transition-colors ${
                        q.status === 'new'
                          ? 'bg-[#111317] border-yellow-500/30'
                          : 'bg-[#111317] border-[#2A2F39]'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.class}`}
                          >
                            <StatusIcon size={10} className="inline mr-1" />
                            {sc.label}
                          </span>
                          {q.promotedToFaq && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFD100]/15 text-[#FFD100] border border-[#FFD100]/25">
                              <Star size={10} className="inline mr-1" />
                              FAQ
                            </span>
                          )}
                          <span className="text-[10px] text-[#7E8796]">
                            <Clock size={10} className="inline mr-1" />
                            {formatDate(q.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {q.status === 'answered' && !q.promotedToFaq && (
                            <button
                              onClick={() => handlePromoteToFaq(q)}
                              className="p-1.5 rounded-md text-[#7E8796] hover:text-[#FFD100] hover:bg-[#FFD100]/15 transition-colors"
                              title="Promosikan ke FAQ"
                            >
                              <Sparkles size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteQuestion(q)}
                            className="p-1.5 rounded-md text-[#7E8796] hover:text-red-400 hover:bg-red-500/15 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Sender info */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-7 h-7 rounded-full bg-[#2A2F39] grid place-items-center text-xs font-bold text-[#C8CFDA] flex-shrink-0">
                          {(q.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F3F4F6] truncate">
                            {q.name || 'Anonim'}
                          </p>
                          <p className="text-[10px] text-[#7E8796] truncate">
                            {q.email || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Question */}
                      <div className="bg-[#1A1F27] rounded-lg p-3 mb-2">
                        <p className="text-sm text-[#C8CFDA] leading-relaxed">
                          {q.question}
                        </p>
                      </div>

                      {/* Existing answer */}
                      {q.answer && !isAnswering && (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 mb-2">
                          <p className="text-[10px] font-bold text-emerald-400 mb-1">
                            Jawaban Admin
                          </p>
                          <p className="text-xs text-[#C8CFDA] leading-relaxed">
                            {q.answer}
                          </p>
                        </div>
                      )}

                      {/* Answer form */}
                      {isAnswering ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-[#1A1F27] border border-[#2A2F39] text-sm text-[#C8CFDA] focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 resize-none"
                            placeholder="Tulis jawaban..."
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setAnsweringId(null);
                                setAnswerText('');
                              }}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#2A2F39] text-[#C8CFDA] hover:bg-[#3A3F49] transition-colors"
                            >
                              Batal
                            </button>
                            <button
                              onClick={handleSaveAnswer}
                              disabled={savingAnswer || !answerText.trim()}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {savingAnswer ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Send size={12} />
                              )}
                              Kirim Jawaban
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => openAnswerForm(q)}
                          className="mt-1 text-xs font-bold text-[#7E8796] hover:text-[#FFD100] transition-colors flex items-center gap-1"
                        >
                          <MessageSquare size={12} />
                          {q.answer ? 'Edit Jawaban' : 'Jawab'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
