import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Send, ArrowLeft, Loader2, User, ChevronDown,
  FileText, Package, CheckCircle2, Clock, AlertCircle, Sparkles,
  Calendar, Store, Tag, ShieldCheck
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import ErrorBoundary from '../components/ErrorBoundary';
import API from '../api/axios';

// ─── Summary card for structured extraction results ──────────────────────────
function SummaryCard({ summary }) {
  if (!summary) return null;
  const fields = [
    { icon: Package, label: 'Product', val: summary.productName },
    { icon: Tag, label: 'Brand', val: summary.brand },
    { icon: Calendar, label: 'Purchased', val: summary.purchaseDate },
    { icon: ShieldCheck, label: 'Warranty', val: summary.warrantyExpiry },
    { icon: Store, label: 'Store', val: summary.storeName },
  ].filter(f => f.val && f.val !== 'N/A');

  if (fields.length === 0 && summary.note) {
    return (
      <div className="text-xs text-textMuted italic px-1">{summary.note}</div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {fields.map(({ icon: Icon, label, val }) => (
        <div key={label} className="flex items-start gap-2 bg-bgBase rounded-xl p-3 border border-borderBase">
          <Icon size={14} className="text-primary mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-textMuted uppercase tracking-wide font-medium">{label}</p>
            <p className="text-xs text-textPrimary font-medium truncate">{val}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── OCR status badge ─────────────────────────────────────────────────────────
function OcrBadge({ status }) {
  const map = {
    done: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Documents analysed' },
    pending: { icon: Loader2, color: 'text-warn', bg: 'bg-warn/10', label: 'Analysing documents…' },
    failed: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10', label: 'Analysis failed' },
    none: { icon: FileText, color: 'text-textMuted', bg: 'bg-bgBase', label: 'No documents uploaded' },
  };
  const { icon: Icon, color, bg, label } = map[status] || map.none;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${color}`}>
      <Icon size={12} className={status === 'pending' ? 'animate-spin' : ''} />
      {label}
    </span>
  );
}

export default function AnalyzePage() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('productId');
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(preselectedId || '');
  const [aiStatus, setAiStatus] = useState(null);   // { ocrStatus, extractedSummary, chatHistory, productName, hasDocuments }
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [messages, setMessages] = useState([
    { id: 'init', role: 'ai', text: 'Hi! Select a product above and ask me anything about its warranty, documents, or purchase details.' }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const messagesEndRef = useRef(null);

  // ── Load products list ───────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    API.get('/products')
      .then(r => {
        if (isMounted) setProducts(r.data.products || []);
      })
      .catch(console.error);

    return () => { isMounted = false; };
  }, []);

  // ── Load AI status when product selected ────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    if (!selectedId) { setAiStatus(null); return; }

    setLoadingStatus(true);
    API.get(`/ai/status/${selectedId}`)
      .then(r => {
        if (!isMounted) return;
        setAiStatus(r.data);
        // Restore previous chat history as messages
        const history = r.data.chatHistory || [];
        const restored = history.flatMap((h, i) => [
          { id: `h-u-${i}`, role: 'user', text: h.question },
          { id: `h-a-${i}`, role: 'ai', text: h.answer },
        ]);
        setMessages([
          { id: 'init', role: 'ai', text: `I'm ready to help with your **${r.data.productName}**. Ask me anything!` },
          ...restored,
        ]);
      })
      .catch(() => { if (isMounted) setAiStatus(null); })
      .finally(() => { if (isMounted) setLoadingStatus(false); });

    return () => { isMounted = false; };
  }, [selectedId]);

  // ── Poll OCR status while pending ────────────────────────────────────────────
  useEffect(() => {
    if (aiStatus?.ocrStatus !== 'pending') return;
    const timer = setInterval(async () => {
      try {
        const r = await API.get(`/ai/status/${selectedId}`);
        setAiStatus(r.data);
        if (r.data.ocrStatus !== 'pending') clearInterval(timer);
      } catch { clearInterval(timer); }
    }, 4000);
    return () => clearInterval(timer);
  }, [aiStatus?.ocrStatus, selectedId]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || !selectedId || sending) return;

    const userMsg = { id: Date.now(), role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const r = await API.post(`/ai/ask`, { productId: selectedId, question: q });
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: r.data.answer }]);
    } catch (err) {
      const msg = err.response?.data?.message || 'AI service not responding. Please check your connection and try again.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: `⚠️ ${msg}`, isError: true }]);
    } finally {
      setSending(false);
    }
  };

  const selectedProduct = products.find(p => p._id === selectedId);

  return (
    <AppLayout>
      <ErrorBoundary>
        <div className="max-w-3xl mx-auto flex flex-col gap-4 pb-6">

          {/* ── Page header ── */}
          <div className="flex items-center gap-3 pt-2">
            {preselectedId && (
              <button onClick={() => navigate(-1)} className="p-2 text-textSecondary hover:text-textPrimary rounded-xl hover:bg-bgElevated transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h1 className="font-display font-bold text-textPrimary text-xl">Warranty AI</h1>
              <p className="text-xs text-textMuted">Ask anything about your products & documents</p>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Online
              </span>
            </div>
          </div>

          {/* ── Product selector ── */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Package size={16} className="text-textMuted" />
            </div>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full bg-bgSurface border border-borderBase rounded-xl pl-9 pr-10 py-3 text-sm text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="">— Select a product —</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.productName}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <ChevronDown size={16} className="text-textMuted" />
            </div>
          </div>

          {/* ── AI status + summary panel ── */}
          <AnimatePresence>
            {selectedId && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-bgSurface border border-borderBase rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setShowSummary(s => !s)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-bgElevated transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-sm font-medium text-textPrimary">Document Intelligence</span>
                    {loadingStatus && <Loader2 size={13} className="animate-spin text-textMuted" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {aiStatus && <OcrBadge status={aiStatus.ocrStatus} />}
                    <ChevronDown size={16} className={`text-textMuted transition-transform ${showSummary ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {showSummary && aiStatus && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        {aiStatus.ocrStatus === 'done' && aiStatus.extractedSummary ? (
                          <SummaryCard summary={aiStatus.extractedSummary} />
                        ) : aiStatus.ocrStatus === 'pending' ? (
                          <div className="flex items-center gap-2 text-sm text-warn py-2">
                            <Loader2 size={14} className="animate-spin" />
                            Analysing your documents — this may take a moment…
                          </div>
                        ) : aiStatus.ocrStatus === 'failed' ? (
                          <p className="text-sm text-danger py-2">⚠️ Could not extract text. Please upload a clearer image.</p>
                        ) : (
                          <p className="text-sm text-textMuted py-2">
                            {aiStatus.hasDocuments
                              ? 'Documents found but not yet analysed.'
                              : 'No documents uploaded for this product. Upload receipts or warranty cards to unlock AI analysis.'}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Chat window ── */}
          <div className="bg-bgSurface border border-borderBase rounded-2xl overflow-hidden flex flex-col" style={{ height: '55vh' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                      ? 'bg-bgElevated border border-borderBase text-textSecondary'
                      : 'bg-primary text-white'
                    }`}>
                    {msg.role === 'user' ? <User size={14} /> : <BrainCircuit size={14} />}
                  </div>
                  {/* Bubble */}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : msg.isError
                        ? 'bg-danger/10 border border-danger/20 text-danger rounded-bl-sm'
                        : 'bg-bgElevated border border-borderBase text-textPrimary rounded-bl-sm shadow-sm'
                    }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {/* Sending indicator */}
              {sending && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                    <BrainCircuit size={14} />
                  </div>
                  <div className="bg-bgElevated border border-borderBase px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-2 h-2 rounded-full bg-textMuted animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-bgElevated border-t border-borderBase">
              {!selectedId && (
                <p className="text-center text-xs text-textMuted mb-2">Select a product above to start chatting</p>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={selectedId ? 'Ask about warranty, purchase date, store details…' : 'Select a product first'}
                  disabled={!selectedId || sending}
                  className="flex-1 bg-bgSurface border border-borderBase rounded-xl px-4 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || !selectedId || sending}
                  className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primaryHover disabled:opacity-40 transition-all flex-shrink-0"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
              <p className="text-center text-[10px] text-textMuted mt-1.5">
                AI may make mistakes — always verify critical warranty information.
              </p>
            </div>
          </div>

        </div>
      </ErrorBoundary>
    </AppLayout>
  );
}
