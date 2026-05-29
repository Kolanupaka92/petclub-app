import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api.js";

/**
 * In-app chat between customer and professional for a specific booking.
 * Props:
 *   booking    — booking object (needs id, service_name, service_type)
 *   currentUserId — logged-in user's id
 *   onClose    — called when modal is dismissed
 */
export default function ChatModal({ booking, currentUserId, onClose }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState("");
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const pollRef    = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const r = await api.getMessages(booking.id);
      setMessages(r.messages || []);
    } catch { /* silently retry on next poll */ }
  }, [booking.id]);

  // Initial load + 3-second poll while open
  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 3000);
    inputRef.current?.focus();
    return () => clearInterval(pollRef.current);
  }, [loadMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      const r = await api.sendMessage(booking.id, text);
      setInput("");
      setMessages(prev => [...prev, r.message]);
    } catch (e) {
      setError(e.message || "Failed to send — try again");
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const svcLabel = booking.service_name || booking.service_type || "Service";
  const fmtTime  = (iso) => {
    try {
      const d = new Date(iso);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      return isToday
        ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " " +
          d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl shadow-2xl flex flex-col"
           style={{ height: "min(600px, 100dvh)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-xl shrink-0">
            {({ Groomer:"✂️", Trainer:"🐕‍🦺", Vet:"🏥", Walker:"🦮", Boarding:"🏠" })[booking.service_type] || "🐾"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-sm text-gray-900 truncate">{svcLabel}</p>
            <p className="text-[10px] text-gray-400">Chat · messages are private to this booking</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition text-lg">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="text-4xl mb-3">💬</div>
              <p className="font-bold text-sm text-gray-700">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Start the conversation — ask about timing, directions, or anything related to this booking.</p>
            </div>
          ) : messages.map((m) => {
            const isMe = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                  isMe
                    ? "bg-orange-500 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  {!isMe && (
                    <p className={`text-[10px] font-bold mb-0.5 ${isMe ? "text-orange-100" : "text-orange-500"}`}>
                      {m.sender_name || (m.sender_role === "professional" ? "Provider" : "Customer")}
                    </p>
                  )}
                  <p className="text-sm leading-snug break-words">{m.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? "text-orange-100" : "text-gray-400"}`}>
                    {fmtTime(m.created_at)}
                    {isMe && m.read_at && <span className="ml-1">✓✓</span>}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 text-center px-4 pb-1 shrink-0">{error}</p>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-100 flex items-end gap-2 shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition max-h-28 overflow-y-auto"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl flex items-center justify-center transition active:scale-95 shrink-0">
            {sending
              ? <span className="text-xs">…</span>
              : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
