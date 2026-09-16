"use client";
// The assistant as a character: the Frame smiley sits bottom-right on every
// page, greets once per session with a speech bubble, and opens a chat panel
// when clicked. Answers come from Standards, Toolbox and News and link to the
// page they came from — [[page-id|Label]] from the model becomes a button.
//
// The avatar is /images/assistant-avatar.png. Until that file is in place an
// SVG of the same character is drawn instead, so the widget never shows a
// broken image.

import React, { useEffect, useRef, useState } from "react";

const C = {
  steel: "#8A8D8F", steelL: "#B8BBBE", steelD: "#5C5F61",
  oak: "#C4944A", surface: "#F5F4F1", surfaceD: "#ECEAE5",
  white: "#FFFFFF", black: "#1A1A1A", text: "#2C2C2C", textS: "#6B6B6B",
  danger: "#C75B4A",
};

const AVATAR_SRC = "/images/assistant-avatar.png";
const GREETED_KEY = "sf-assistant-greeted";
const GREETING = "Can I help you?";

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

// The Frame smiley in SVG — brushed-steel frame, oak inner edge, two steel
// dots and a smile. Stand-in until the PNG exists.
function FrameSmiley({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <linearGradient id="sfSteel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#DCDDDE" />
          <stop offset="0.45" stopColor="#A8AAAC" />
          <stop offset="1" stopColor="#CBCDCF" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="90" height="90" rx="3" fill="url(#sfSteel)" />
      <rect x="17" y="17" width="66" height="66" fill="#C9A26E" />
      <rect x="21" y="21" width="58" height="58" fill="#F8F7F4" />
      <circle cx="40" cy="45" r="4.6" fill="#9A9C9E" />
      <circle cx="60" cy="45" r="4.6" fill="#9A9C9E" />
      <path d="M38 59 Q50 69 62 59" stroke="#9A9C9E" strokeWidth="4.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Avatar({ size }) {
  const [ok, setOk] = useState(true);
  if (!ok) return <FrameSmiley size={size} />;
  return (
    <img
      src={AVATAR_SRC}
      alt=""
      width={size}
      height={size}
      onError={() => setOk(false)}
      style={{ display: "block", width: size, height: size, objectFit: "contain" }}
    />
  );
}

function Bubble({ role, text, streaming, setPage }) {
  const mine = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <div style={{
        maxWidth: "88%", padding: "9px 13px", borderRadius: 10, fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap",
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

export default function AssistantWidget({ setPage }) {
  const [open, setOpen] = useState(false);
  const [greet, setGreet] = useState(false);
  const [shown, setShown] = useState(false);       // pop-in on first paint
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Pop in, then greet — once per browser session, so it does not nag on
  // every page change.
  useEffect(() => {
    const t1 = setTimeout(() => setShown(true), 250);
    let greeted = false;
    try { greeted = sessionStorage.getItem(GREETED_KEY) === "1"; } catch {}
    const t2 = greeted ? null : setTimeout(() => setGreet(true), 1400);
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2); };
  }, []);

  const dismissGreeting = () => {
    setGreet(false);
    try { sessionStorage.setItem(GREETED_KEY, "1"); } catch {}
  };
  const openPanel = () => {
    dismissGreeting();
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

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

  const panelW = "min(380px, calc(100vw - 32px))";

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>

      {open && (
        <div style={{ width: panelW, height: "min(560px, calc(100vh - 130px))", background: C.white, borderRadius: 12, border: `1px solid ${C.surfaceD}`, boxShadow: "0 18px 50px rgba(0,0,0,.18)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: `1px solid ${C.surfaceD}`, background: C.surface }}>
            <Avatar size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, color: C.text, fontFamily: "'Cormorant Garamond',serif", lineHeight: 1.1 }}>Ask the Command Space</div>
              <div style={{ fontSize: 11, color: C.textS, marginTop: 2 }}>Standards · Toolbox · News</div>
            </div>
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setError(null); }} title="Clear" style={{ background: "none", border: "none", color: C.textS, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
            )}
            <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: C.textS, fontSize: 20, lineHeight: 1, cursor: "pointer", padding: "0 2px" }}>×</button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px" }}>
            {messages.length === 0 ? (
              <div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, marginBottom: 12 }}>
                  I know what the concept says, what to send a partner and where things are. Ask me, or start with one of these:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {STARTERS.map((s) => (
                    <button key={s} onClick={() => ask(s)} disabled={busy}
                      style={{ textAlign: "left", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.surfaceD}`, background: C.surface, color: C.text, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <Bubble key={i} role={m.role} text={m.content} streaming={busy && i === messages.length - 1} setPage={setPage} />
              ))
            )}
            {error && <div style={{ fontSize: 12, color: C.danger, marginTop: 6, lineHeight: 1.5 }}>{error}</div>}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ display: "flex", gap: 8, padding: "10px 12px 12px", borderTop: `1px solid ${C.surfaceD}` }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder="Ask about the concept, a fixture, a template, a page…"
              style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.surfaceD}`, fontSize: 13, color: C.text, background: C.white, fontFamily: "inherit" }}
            />
            <button type="submit" disabled={busy || !input.trim()}
              style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: busy || !input.trim() ? C.steelL : C.black, color: C.white, fontSize: 13, fontWeight: 500, cursor: busy || !input.trim() ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {busy ? "…" : "Ask"}
            </button>
          </form>
        </div>
      )}

      {!open && greet && (
        <div style={{ position: "relative", background: C.white, borderRadius: 12, border: `1px solid ${C.surfaceD}`, boxShadow: "0 10px 30px rgba(0,0,0,.14)", padding: "10px 12px 10px 16px", display: "flex", alignItems: "center", gap: 10, marginRight: 8 }}>
          <button onClick={openPanel} style={{ background: "none", border: "none", padding: 0, fontSize: 14, color: C.text, cursor: "pointer", fontFamily: "'Cormorant Garamond',serif" }}>
            {GREETING}
          </button>
          <button onClick={dismissGreeting} aria-label="Dismiss" style={{ background: "none", border: "none", color: C.steel, fontSize: 16, lineHeight: 1, cursor: "pointer", padding: 0 }}>×</button>
          {/* Speech-bubble tail, pointing down at the avatar. */}
          <div style={{ position: "absolute", right: 22, bottom: -7, width: 12, height: 12, background: C.white, borderRight: `1px solid ${C.surfaceD}`, borderBottom: `1px solid ${C.surfaceD}`, transform: "rotate(45deg)" }} />
        </div>
      )}

      <button
        onClick={open ? () => setOpen(false) : openPanel}
        aria-label={open ? "Close the assistant" : "Open the assistant"}
        title={open ? "Close" : GREETING}
        style={{
          width: 68, height: 68, padding: 0, border: "none", background: "transparent", cursor: "pointer",
          filter: "drop-shadow(0 10px 18px rgba(0,0,0,.22))",
          transform: shown ? "scale(1)" : "scale(.4)", opacity: shown ? 1 : 0,
          transition: "transform .45s cubic-bezier(.2,1.4,.4,1), opacity .3s ease",
        }}
      >
        <Avatar size={68} />
      </button>
    </div>
  );
}
