"use client";
// The front-page assistant. Ask it where something is or what the concept
// says; it answers from Standards, Toolbox and News and links to the page.
//
// Links arrive from the model as [[page-id|Label]] and become buttons that
// navigate — that is what makes this a way to *find* things rather than a
// chat window. Unknown ids render as plain text rather than a dead button.

import React, { useEffect, useRef, useState } from "react";

const C = {
  steel: "#8A8D8F", steelL: "#B8BBBE", steelD: "#5C5F61",
  oak: "#C4944A", surface: "#F5F4F1", surfaceD: "#ECEAE5",
  white: "#FFFFFF", black: "#1A1A1A", text: "#2C2C2C", textS: "#6B6B6B",
  danger: "#C75B4A",
};

const PAGE_IDS = new Set([
  "overview", "intake", "projects", "flow", "footprint", "roi", "draft", "quotation",
  "opening-report", "concept-requests", "toolbox", "showroom-ops", "standards",
  "external-folders", "admin",
]);

const STARTERS = [
  "How do I start a new project?",
  "What colour are the walls painted in the concept?",
  "Which hangers are approved?",
  "What do we send the partner before installation?",
];

/** Splits "text [[id|Label]] text" into text and link parts. */
function parts(text) {
  const out = [];
  const re = /\[\[([a-z-]+)\|([^\]]+)\]\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: "text", v: text.slice(last, m.index) });
    out.push(PAGE_IDS.has(m[1]) ? { t: "link", id: m[1], v: m[2] } : { t: "text", v: m[2] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}

function Bubble({ role, text, streaming, setPage }) {
  const mine = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <div style={{
        maxWidth: "85%", padding: "10px 14px", borderRadius: 10, fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap",
        background: mine ? C.black : C.surface, color: mine ? C.white : C.text,
        borderBottomRightRadius: mine ? 3 : 10, borderBottomLeftRadius: mine ? 10 : 3,
      }}>
        {parts(text).map((p, i) => p.t === "link" ? (
          <button key={i} onClick={() => setPage(p.id)}
            style={{ display: "inline-block", margin: "2px 2px 2px 0", padding: "3px 10px", borderRadius: 14, border: `1px solid ${C.oak}`, background: C.white, color: C.oak, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", verticalAlign: "middle" }}>
            {p.v} →
          </button>
        ) : <span key={i}>{p.v}</span>)}
        {streaming && !text && <span style={{ color: C.steel }}>…</span>}
      </div>
    </div>
  );
}

export default function AssistantCard({ setPage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const ask = async (question) => {
    const q = String(question || "").trim();
    if (!q || busy) return;
    setError(null);
    setInput("");
    const history = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `The assistant is unavailable (${r.status})`);
      }
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        const snapshot = answer;
        setMessages([...history, { role: "assistant", content: snapshot }]);
      }
    } catch (e) {
      setError(e.message);
      setMessages(history);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.surfaceD}`, padding: 20, marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond',serif" }}>Ask the Command Space</div>
          <div style={{ fontSize: 12, color: C.textS, marginTop: 2 }}>Finds what the concept says, what to send a partner and where things are. Answers from Standards, Toolbox and News only.</div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setError(null); }} style={{ background: "none", border: "none", color: C.textS, fontSize: 12, cursor: "pointer" }}>Clear</button>
        )}
      </div>

      {messages.length === 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {STARTERS.map((s) => (
            <button key={s} onClick={() => ask(s)} disabled={busy}
              style={{ padding: "7px 12px", borderRadius: 16, border: `1px solid ${C.surfaceD}`, background: C.surface, color: C.text, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              {s}
            </button>
          ))}
        </div>
      ) : (
        <div ref={scrollRef} style={{ maxHeight: 360, overflowY: "auto", padding: "4px 2px", marginBottom: 12 }}>
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.content} streaming={busy && i === messages.length - 1} setPage={setPage} />
          ))}
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8 }}>{error}</div>}

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          placeholder="Ask about the concept, a fixture, a template, a page…"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 6, border: `1px solid ${C.surfaceD}`, fontSize: 13, color: C.text, background: C.white, fontFamily: "inherit" }}
        />
        <button type="submit" disabled={busy || !input.trim()}
          style={{ padding: "10px 18px", borderRadius: 6, border: "none", background: busy || !input.trim() ? C.steelL : C.black, color: C.white, fontSize: 13, fontWeight: 500, cursor: busy || !input.trim() ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {busy ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
