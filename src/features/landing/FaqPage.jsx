import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Send,
  Loader2,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { loadActiveFaqs } from '../feedback/services/feedbackFirestore';
import { submitUserQuestion } from '../feedback/services/feedbackFirestore';
import { faqItems as staticFaqItems } from './data/faq';
import PageShell from './components/PageShell';

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '6285121309829';

/* ── Input shared styles ─────────────────────────────── */
const inputCls =
  'w-full px-3.5 py-2.5 rounded-[10px] bg-bg-secondary border border-border-default text-[13.5px] text-text-secondary placeholder-text-faint focus:outline-none focus:ring-2 focus:ring-accent-yellow/30 focus:border-accent-yellow/40 transition-colors';

/* ── Accordion Item ──────────────────────────────────── */
const AccordionItem = ({ item, isOpen, onClick }) => (
  <div
    className={`rounded-[14px] border overflow-hidden transition-colors duration-200 ${
      isOpen
        ? 'border-accent-yellow/20 bg-bg-secondary'
        : 'border-border-default bg-bg-secondary hover:border-border-subtle'
    }`}
  >
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-5 py-[18px] text-left bg-transparent border-none cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {item.category && (
          <span className="flex-shrink-0 bg-accent-purple/10 text-accent-purple-light text-[9px] font-extrabold px-2 py-[3px] rounded-[5px] tracking-wide uppercase">
            {item.category}
          </span>
        )}
        <span className="text-[14px] font-bold text-text-secondary">
          {item.question}
        </span>
      </div>
      <ChevronDown
        className={`w-4 h-4 text-text-dim flex-shrink-0 transition-transform duration-250 ${
          isOpen ? 'rotate-180' : ''
        }`}
      />
    </button>
    <div
      className={`grid transition-all duration-300 ease-in-out ${
        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      }`}
    >
      <div className="overflow-hidden">
        <p className="px-5 pb-[18px] text-[13.5px] text-text-tertiary leading-[1.7]">
          {item.answer}
        </p>
      </div>
    </div>
  </div>
);

/* ── Question Form ───────────────────────────────────── */
const QuestionForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    'Halo admin MyGameON, saya punya pertanyaan.'
  )}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !question.trim()) return;
    setSending(true);
    try {
      await submitUserQuestion({
        name: name.trim(),
        email: email.trim(),
        question: question.trim(),
      });
      setSent(true);
      setName('');
      setEmail('');
      setQuestion('');
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      console.error('Submit question error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-10 rounded-2xl border border-border-default bg-bg-secondary p-6">
      <h2 className="text-[18px] font-extrabold text-text-primary mb-1">
        Punya pertanyaan lain?
      </h2>
      <p className="text-[12.5px] text-text-faint mb-5">
        Kirim pertanyaanmu dan kami akan jawab secepatnya.
      </p>

      {sent ? (
        <div className="flex items-center gap-2.5 py-5 justify-center">
          <CheckCircle2 className="w-[18px] h-[18px] text-accent-emerald" />
          <span className="text-[13px] font-bold text-accent-emerald">
            Pertanyaan terkirim! Kami akan segera meninjau.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu *"
              required
              className={inputCls}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (opsional)"
              type="email"
              className={inputCls}
            />
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Tulis pertanyaanmu di sini... *"
            required
            rows={3}
            className={`${inputCls} resize-none`}
          />
          <div className="flex items-center justify-between">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-text-ghost flex items-center gap-1.5 transition-colors hover:text-accent-green"
            >
              <MessageCircle className="w-3 h-3" />
              Atau chat via WhatsApp
            </a>
            <button
              type="submit"
              disabled={sending || !name.trim() || !question.trim()}
              className="btn-yellow flex items-center gap-1.5 px-5 py-2.5 bg-accent-yellow text-bg-primary rounded-[10px] text-[12.5px] font-extrabold border-none cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Kirim
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

/* ── FAQ Page ────────────────────────────────────────── */
const FaqPage = () => {
  const [faqItems, setFaqItems] = useState([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [openIdx, setOpenIdx] = useState(null);
  const [activeCat, setActiveCat] = useState('Semua');
  const [searchQ, setSearchQ] = useState('');

  // Load FAQs from Firestore, fallback to static
  useEffect(() => {
    loadActiveFaqs()
      .then((items) => {
        setFaqItems(items.length > 0 ? items : staticFaqItems);
      })
      .catch(() => {
        setFaqItems(staticFaqItems);
      })
      .finally(() => setFaqLoading(false));
  }, []);

  // Derive categories from data (only shown if FAQs have category field)
  const categories = useMemo(() => {
    const cats = faqItems.map((f) => f.category).filter(Boolean);
    const unique = [...new Set(cats)];
    return unique.length > 0 ? ['Semua', ...unique] : [];
  }, [faqItems]);

  // Filter by category + search
  const filtered = useMemo(() => {
    return faqItems.filter((f) => {
      const catMatch = activeCat === 'Semua' || f.category === activeCat;
      const q = searchQ.toLowerCase();
      const searchMatch =
        !q ||
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [faqItems, activeCat, searchQ]);

  return (
    <PageShell title="FAQ" maxWidth={680}>
      {/* Header */}
      <div className="slide-stagger-1 mb-7">
        <h1 className="text-[clamp(28px,3.5vw,40px)] font-black tracking-[-1.2px] leading-[1.08] mb-2.5">
          Pertanyaan <span className="text-accent-yellow">Umum</span>
        </h1>
        <p className="text-text-dim text-[14px] leading-relaxed">
          Temukan jawaban untuk pertanyaan yang sering ditanyakan tentang
          layanan MyGameON.
        </p>
      </div>

      {/* Search */}
      <div className="slide-stagger-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-text-faint pointer-events-none" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Cari pertanyaan..."
            className={`${inputCls} !pl-10`}
          />
        </div>
      </div>

      {/* Category pills — only show if data has categories */}
      {categories.length > 0 && (
        <div className="slide-stagger-2 flex gap-1.5 flex-wrap mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCat(cat);
                setOpenIdx(null);
              }}
              className={`px-3.5 py-[7px] rounded-lg text-[12px] font-semibold cursor-pointer border transition-all duration-150 ${
                activeCat === cat
                  ? 'bg-accent-yellow text-bg-primary border-accent-yellow'
                  : 'bg-bg-secondary text-text-dim border-border-default hover:border-border-subtle'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* FAQ list */}
      <div className="slide-stagger-3">
        {faqLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-accent-yellow" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filtered.map((item, i) => (
              <AccordionItem
                key={item.id || i}
                item={item}
                isOpen={openIdx === i}
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-text-ghost text-[13px]">
              {searchQ
                ? 'Tidak ada FAQ yang cocok dengan pencarian.'
                : 'Belum ada FAQ tersedia.'}
            </p>
          </div>
        )}
      </div>

      {/* Question form */}
      <div className="slide-stagger-4">
        <QuestionForm />
      </div>
    </PageShell>
  );
};

export default FaqPage;
