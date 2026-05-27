import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import {
  ChevronDown,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { loadActiveFaqs } from '../feedback/services/feedbackFirestore';
import { submitUserQuestion } from '../feedback/services/feedbackFirestore';
import { faqItems as staticFaqItems } from './data/faq';

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '6285121309829';

const FaqPage = () => {
  const [faqItems, setFaqItems] = useState(staticFaqItems);
  const [faqLoading, setFaqLoading] = useState(true);

  // Question form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Load FAQs from Firestore, fallback to static
  useEffect(() => {
    loadActiveFaqs()
      .then((items) => {
        if (items.length > 0) setFaqItems(items);
      })
      .catch(() => {})
      .finally(() => setFaqLoading(false));
  }, []);

  const handleSubmitQuestion = async (e) => {
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

  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo admin MyGameON, saya punya pertanyaan.')}`;

  return (
    <div className="min-h-screen bg-[#111317] text-[#F3F4F6]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#2A2F39] bg-[#111317]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <div className="h-4 w-px bg-[#2A2F39]" />
          <span className="text-sm font-semibold text-[#F3F4F6]">FAQ</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Pertanyaan Umum
          </h1>
          <p className="mt-3 text-[#9CA3AF] text-lg">
            Temukan jawaban untuk pertanyaan yang sering ditanyakan tentang
            layanan MyGameON.
          </p>
        </div>

        {/* FAQ List */}
        {faqLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#FFD100] w-6 h-6" />
          </div>
        ) : (
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <Disclosure key={item.id || index}>
                {({ open }) => (
                  <div
                    className={`rounded-xl border transition-colors ${
                      open
                        ? 'border-[#FFD100]/30 bg-[#1A1F27]'
                        : 'border-[#2A2F39] bg-[#1A1F27]/60 hover:bg-[#1A1F27]'
                    }`}
                  >
                    <DisclosureButton className="flex w-full items-center justify-between px-6 py-5 text-left">
                      <span className="font-semibold text-[#F3F4F6] pr-4 text-base">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-[#9CA3AF] flex-shrink-0 transition-transform duration-200 ${
                          open ? 'rotate-180' : ''
                        }`}
                      />
                    </DisclosureButton>
                    <DisclosurePanel className="px-6 pb-5 text-[15px] text-[#C8CFDA] leading-relaxed">
                      {item.answer}
                    </DisclosurePanel>
                  </div>
                )}
              </Disclosure>
            ))}
          </div>
        )}

        {/* Question Form */}
        <div className="mt-12 rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-6 md:p-8">
          <h2 className="text-lg font-bold text-[#F3F4F6] mb-1">
            Punya pertanyaan lain?
          </h2>
          <p className="text-sm text-[#9CA3AF] mb-5">
            Kirim pertanyaanmu dan tim kami akan menjawab secepatnya.
          </p>

          {sent ? (
            <div className="flex items-center gap-3 py-6 justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <p className="text-sm text-emerald-400 font-semibold">
                Pertanyaan terkirim! Kami akan segera meninjau.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitQuestion} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#7E8796] mb-1">
                    Nama <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-[#111317] border border-[#2A2F39] text-sm text-[#F3F4F6] placeholder-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-colors"
                    placeholder="Nama kamu"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#7E8796] mb-1">
                    Email <span className="text-[#7E8796]">(opsional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#111317] border border-[#2A2F39] text-sm text-[#F3F4F6] placeholder-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-colors"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#7E8796] mb-1">
                  Pertanyaan <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#111317] border border-[#2A2F39] text-sm text-[#F3F4F6] placeholder-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-colors resize-none"
                  placeholder="Tulis pertanyaanmu di sini..."
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#9CA3AF] hover:text-green-400 transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle size={14} />
                  Atau chat via WhatsApp
                </a>
                <button
                  type="submit"
                  disabled={sending || !name.trim() || !question.trim()}
                  className="px-5 py-2.5 rounded-lg bg-[#FFD100] text-[#111317] text-sm font-bold hover:bg-[#FFD100]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {sending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Kirim Pertanyaan
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default FaqPage;
