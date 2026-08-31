"use client";
// Concept Requests — additions, changes, feedback and cost input on the
// Selected Frame concept.
//
// Two halves: a form anyone inside Command Space can submit, and a register
// where the concept and inventory owners triage what came in. The mail is the
// notification; the register is what you act from.

import React, { useEffect, useMemo, useState } from "react";
import { upload } from "@vercel/blob/client";
import { FIXTURES as SF_FIXTURES } from "../standards-content";

const C = {
  steel: "#8A8D8F", steelL: "#B8BBBE", steelD: "#5C5F61",
  oak: "#C4944A", surface: "#F5F4F1", surfaceD: "#ECEAE5",
  white: "#FFFFFF", black: "#1A1A1A", text: "#2C2C2C", textS: "#6B6B6B",
  go: "#4A7C5C", warn: "#D4A843", danger: "#C75B4A", success: "#5A8F6A",
};

const REGIONS = ["BENELUX & ROW", "DACH", "NORTHWEST", "SOUTH"];

const TYPES = [
  { id: "ADDITION", label: "Addition", hint: "A new element we do not have today" },
  { id: "CHANGE", label: "Change", hint: "An existing element that should work differently" },
  { id: "FEEDBACK", label: "Feedback / problem", hint: "Something that does not work in practice" },
];

// COST is retired as a choice — cost optimisation is ours to work out, not
// something to invite input on. Kept in the label map so any request already
// submitted under it still reads properly in the register.
const TYPE_LABELS = { ...Object.fromEntries(TYPES.map((t) => [t.id, t.label])), COST: "Cost optimisation" };

const URGENCIES = [
  { id: "NICE_TO_HAVE", label: "Nice to have" },
  { id: "UPCOMING_PROJECT", label: "Needed for an upcoming project" },
  { id: "BLOCKING", label: "Blocking now" },
];

const STATUSES = [
  { id: "NEW", label: "New", colour: C.steelD },
  { id: "UNDER_REVIEW", label: "Under review", colour: C.warn },
  { id: "ACCEPTED", label: "Accepted", colour: C.go },
  { id: "DECLINED", label: "Declined", colour: C.danger },
  { id: "PARKED", label: "Parked", colour: C.steel },
  { id: "IMPLEMENTED", label: "Implemented", colour: C.success },
];

const labelOf = (list, id) => list.find((x) => x.id === id)?.label || id;
const statusColour = (id) => STATUSES.find((s) => s.id === id)?.colour || C.steel;

/** Every element in the Standards catalogue, flattened for the dropdown. */
const ELEMENTS = SF_FIXTURES.categories.flatMap((cat) =>
  cat.items.map((it) => ({ code: it.code, name: it.name, category: cat.name })),
);

/**
 * Rows written before attachments could be PDFs carry no contentType, so fall
 * back to the extension rather than rendering a document as a broken image.
 */
const isImage = (p) =>
  p.contentType ? p.contentType.startsWith("image/") : !/\.pdf$/i.test(p.name || p.url || "");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const Title = ({ children, sub }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ fontSize: 22, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{children}</h2>
    {sub && <p style={{ fontSize: 13, color: C.textS, margin: "4px 0 0" }}>{sub}</p>}
  </div>
);

const Label = ({ children, required }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: C.textS, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>
    {children}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
  </div>
);

const inputStyle = {
  width: "100%", padding: "10px 12px", fontSize: 13, color: C.text, background: C.white,
  border: `1px solid ${C.surfaceD}`, borderRadius: 6, fontFamily: "inherit", boxSizing: "border-box",
};

const Field = ({ label, required, hint, children }) => (
  <div style={{ marginBottom: 18 }}>
    <Label required={required}>{label}</Label>
    {children}
    {hint && <div style={{ fontSize: 11, color: C.textS, marginTop: 5 }}>{hint}</div>}
  </div>
);

const Button = ({ children, onClick, disabled, kind = "primary", small }) => {
  const base = {
    padding: small ? "6px 12px" : "11px 22px", fontSize: small ? 12 : 13, fontWeight: 500,
    borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
    opacity: disabled ? 0.5 : 1, border: `1px solid ${C.surfaceD}`,
  };
  const kinds = {
    primary: { background: C.black, color: C.white, border: `1px solid ${C.black}` },
    ghost: { background: C.white, color: C.text },
    danger: { background: C.white, color: C.danger, border: `1px solid ${C.danger}44` },
  };
  return <button style={{ ...base, ...kinds[kind] }} onClick={onClick} disabled={disabled}>{children}</button>;
};

const Note = ({ kind = "info", children }) => {
  const colours = { info: C.steelD, warn: C.warn, error: C.danger, success: C.success };
  return (
    <div style={{ padding: "12px 14px", background: C.white, borderRadius: 6, border: `1px solid ${C.surfaceD}`, borderLeft: `3px solid ${colours[kind]}`, fontSize: 13, color: C.text, marginBottom: 16, whiteSpace: "pre-wrap" }}>
      {children}
    </div>
  );
};

const Pill = ({ children, colour }) => (
  <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", background: `${colour}18`, color: colour, border: `1px solid ${colour}44` }}>
    {children}
  </span>
);

// ─── Form ────────────────────────────────────────────────────────────────────

const EMPTY = {
  submitterName: "", submitterEmail: "", region: "", partner: "",
  type: "ADDITION", elementCode: "", title: "", description: "", problem: "",
  urgency: "NICE_TO_HAVE", projectRef: "",
};

function RequestForm({ onSubmitted }) {
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    if (!form.submitterName.trim()) return setError("Please add your name.");
    if (!form.title.trim()) return setError("Please add a short title.");

    setBusy(true);
    try {
      // Photos go up first, so the request is created — and the mail sent —
      // once, with the links already attached.
      const photos = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
        // Blob rejects a content type it was not told to allow, so never guess
        // "image/jpeg" for a file the browser did not type — a PDF dragged in
        // from Explorer sometimes arrives with an empty type.
        const contentType = file.type || (/\.pdf$/i.test(file.name) ? "application/pdf" : "image/jpeg");
        const result = await upload(`concept-requests/${Date.now()}-${safeName}`, file, {
          access: "public",
          handleUploadUrl: "/api/concept-requests/upload-url",
          contentType,
        });
        photos.push({ url: result.url, pathname: result.pathname, name: file.name, size: file.size, contentType });
      }

      const element = ELEMENTS.find((e) => e.code === form.elementCode);
      const r = await fetch("/api/concept-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, elementName: element?.name || "", photos }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not submit the request");

      setDone(j);
      setForm({ ...EMPTY, submitterName: form.submitterName, submitterEmail: form.submitterEmail, region: form.region });
      setFiles([]);
      onSubmitted?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div style={{ maxWidth: 640 }}>
        <Note kind="success">
          <strong>Thank you — the request is registered.</strong>
          {"\n"}It is in the register below and, if the mail flow is connected, on its way to the concept and inventory owners.
        </Note>
        {done.mail && !done.mail.sent && (
          <Note kind="warn">
            The request was saved, but no mail went out ({done.mail.reason}). Nothing is lost — it is in the register.
          </Note>
        )}
        <Button onClick={() => setDone(null)}>Submit another</Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      {error && <Note kind="error">{error}</Note>}

      <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.surfaceD}`, padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>Who is asking</div>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: 1 }}><Field label="Your name" required><input style={inputStyle} value={form.submitterName} onChange={(e) => set("submitterName", e.target.value)} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Your email"><input style={inputStyle} type="email" value={form.submitterEmail} onChange={(e) => set("submitterEmail", e.target.value)} /></Field></div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <Field label="Region">
              <select style={inputStyle} value={form.region} onChange={(e) => set("region", e.target.value)}>
                <option value="">—</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ flex: 1 }}><Field label="Partner / store" hint="Where the input comes from, if relevant"><input style={inputStyle} value={form.partner} onChange={(e) => set("partner", e.target.value)} /></Field></div>
        </div>
      </div>

      <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.surfaceD}`, padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>What it is about</div>

        <Field label="Type" required>
          <div style={{ display: "grid", gap: 8 }}>
            {TYPES.map((t) => (
              <div key={t.id} onClick={() => set("type", t.id)}
                style={{ padding: "11px 13px", borderRadius: 6, cursor: "pointer", fontSize: 13,
                  border: `1px solid ${form.type === t.id ? C.oak : C.surfaceD}`,
                  background: form.type === t.id ? `${C.oak}12` : C.white }}>
                <div style={{ fontWeight: form.type === t.id ? 600 : 400, color: C.text }}>{t.label}</div>
                <div style={{ fontSize: 11, color: C.textS, marginTop: 2 }}>{t.hint}</div>
              </div>
            ))}
          </div>
        </Field>

        <Field label="Element" hint="Pick the fixture this concerns, so everything about the same item can be found together.">
          <select style={inputStyle} value={form.elementCode} onChange={(e) => set("elementCode", e.target.value)}>
            <option value="">Not element-specific</option>
            {SF_FIXTURES.categories.map((cat) => (
              <optgroup key={cat.name} label={cat.name}>
                {cat.items.map((it) => <option key={it.code} value={it.code}>{it.code} — {it.name}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>

        <Field label="Title" required hint="One line, the way you would say it out loud.">
          <input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Field>

        <Field label="What are you asking for">
          <textarea style={{ ...inputStyle, minHeight: 96, resize: "vertical" }} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>

        <Field label="What problem does it solve" hint="The most useful field on this form — without it a request is hard to weigh against the others.">
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.problem} onChange={(e) => set("problem", e.target.value)} />
        </Field>

        <Field label="Urgency">
          <select style={inputStyle} value={form.urgency} onChange={(e) => set("urgency", e.target.value)}>
            {URGENCIES.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </Field>

        {form.urgency === "UPCOMING_PROJECT" && (
          <Field label="Which project" hint="Partner and city is enough.">
            <input style={inputStyle} value={form.projectRef} onChange={(e) => set("projectRef", e.target.value)} />
          </Field>
        )}

        <Field label="Photos or documents" hint="A picture of the problem is worth three paragraphs. JPG, PNG, WebP, HEIC or PDF, up to 25 MB each.">
          <input type="file" accept="image/*,application/pdf,.pdf" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} style={{ fontSize: 13, color: C.text }} />
          {files.length > 0 && (
            <div style={{ fontSize: 12, color: C.textS, marginTop: 8 }}>
              {files.length} file{files.length === 1 ? "" : "s"} selected: {files.map((f) => f.name).join(", ")}
            </div>
          )}
        </Field>
      </div>

      <Button onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit request"}</Button>
    </div>
  );
}

// ─── Register ────────────────────────────────────────────────────────────────

function RequestCard({ req, onChanged }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(req.decisionNote);
  const [by, setBy] = useState(req.decidedBy);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const patch = async (body) => {
    setBusy(true); setError(null);
    try {
      const r = await fetch(`/api/concept-requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not update");
      onChanged();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${req.title}"? This cannot be undone.`)) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch(`/api/concept-requests/${req.id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not delete");
      onChanged();
    } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.surfaceD}`, borderLeft: `3px solid ${statusColour(req.status)}`, padding: "16px 20px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, cursor: "pointer" }} onClick={() => setOpen((o) => !o)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <Pill colour={statusColour(req.status)}>{labelOf(STATUSES, req.status)}</Pill>
            <Pill colour={C.steelD}>{TYPE_LABELS[req.type] || req.type}</Pill>
            {req.urgency === "BLOCKING" && <Pill colour={C.danger}>Blocking</Pill>}
            {req.urgency === "UPCOMING_PROJECT" && <Pill colour={C.warn}>Upcoming project</Pill>}
          </div>
          <div style={{ fontSize: 15, color: C.text, fontWeight: 500 }}>{req.title}</div>
          <div style={{ fontSize: 12, color: C.textS, marginTop: 4 }}>
            {[req.submitterName, req.region, req.partner].filter(Boolean).join(" · ")} · {fmtDate(req.createdAt)}
            {req.elementCode && <> · <span style={{ fontFamily: "'DM Mono',monospace" }}>{req.elementCode}</span> {req.elementName}</>}
          </div>
        </div>
        <div style={{ fontSize: 18, color: C.steel }}>{open ? "−" : "+"}</div>
      </div>

      {open && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.surfaceD}` }}>
          {error && <Note kind="error">{error}</Note>}

          {req.description && <><Label>What is being asked for</Label><div style={{ fontSize: 13, color: C.text, whiteSpace: "pre-wrap", marginBottom: 14 }}>{req.description}</div></>}
          {req.problem && <><Label>Problem it solves</Label><div style={{ fontSize: 13, color: C.text, whiteSpace: "pre-wrap", marginBottom: 14 }}>{req.problem}</div></>}
          {req.projectRef && <><Label>Project</Label><div style={{ fontSize: 13, color: C.text, marginBottom: 14 }}>{req.projectRef}</div></>}
          {req.submitterEmail && <><Label>Contact</Label><div style={{ fontSize: 13, color: C.text, marginBottom: 14 }}>{req.submitterEmail}</div></>}

          {req.photos?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Label>Attachments</Label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {req.photos.map((p) => (isImage(p) ? (
                  <a key={p.url} href={p.url} target="_blank" rel="noreferrer">
                    <img src={p.url} alt={p.name || ""} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.surfaceD}` }} />
                  </a>
                ) : (
                  <a key={p.url} href={p.url} target="_blank" rel="noreferrer"
                    style={{ width: 120, height: 120, borderRadius: 6, border: `1px solid ${C.surfaceD}`, background: C.surface, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", padding: 8, boxSizing: "border-box" }}>
                    <span style={{ fontSize: 26, color: C.steel }}>▤</span>
                    <span style={{ fontSize: 10, color: C.text, textAlign: "center", wordBreak: "break-word", lineHeight: 1.3 }}>{p.name || "Document"}</span>
                  </a>
                )))}
              </div>
            </div>
          )}

          <Label>Status</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {STATUSES.map((s) => (
              <button key={s.id} disabled={busy} onClick={() => patch({ status: s.id, decidedBy: by })}
                style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit",
                  border: `1px solid ${req.status === s.id ? s.colour : C.surfaceD}`,
                  background: req.status === s.id ? `${s.colour}18` : C.white,
                  color: req.status === s.id ? s.colour : C.text,
                  fontWeight: req.status === s.id ? 600 : 400 }}>
                {s.label}
              </button>
            ))}
          </div>

          <Field label="Decision note" hint="Why it was accepted, declined or parked — this is what makes the register worth keeping.">
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}><Field label="Decided by"><input style={inputStyle} value={by} onChange={(e) => setBy(e.target.value)} /></Field></div>
            <div style={{ marginBottom: 18 }}><Button small onClick={() => patch({ decisionNote: note, decidedBy: by })} disabled={busy}>Save note</Button></div>
          </div>

          {req.decidedAt && (
            <div style={{ fontSize: 12, color: C.textS, marginBottom: 12 }}>
              Last decided {fmtDate(req.decidedAt)}{req.decidedBy ? ` by ${req.decidedBy}` : ""}
            </div>
          )}

          <Button small kind="danger" onClick={remove} disabled={busy}>Delete request</Button>
        </div>
      )}
    </div>
  );
}

function Register({ requests, loading, error, reload }) {
  const [status, setStatus] = useState("OPEN");
  const [type, setType] = useState("ALL");

  const shown = useMemo(() => requests.filter((r) => {
    if (status === "OPEN" && !["NEW", "UNDER_REVIEW"].includes(r.status)) return false;
    if (status !== "OPEN" && status !== "ALL" && r.status !== status) return false;
    if (type !== "ALL" && r.type !== type) return false;
    return true;
  }), [requests, status, type]);

  const openCount = requests.filter((r) => ["NEW", "UNDER_REVIEW"].includes(r.status)).length;

  if (loading) return <div style={{ fontSize: 13, color: C.textS }}>Loading…</div>;
  if (error) return <><Note kind="error">{error}</Note><Button onClick={reload}>Try again</Button></>;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <select style={{ ...inputStyle, width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="OPEN">Open ({openCount})</option>
          <option value="ALL">All ({requests.length})</option>
          {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "auto" }} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="ALL">All types</option>
          {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <Button small kind="ghost" onClick={reload}>Refresh</Button>
      </div>

      {shown.length === 0
        ? <div style={{ fontSize: 13, color: C.textS, padding: "28px 0" }}>Nothing here yet.</div>
        : shown.map((r) => <RequestCard key={r.id} req={r} onChanged={reload} />)}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ConceptRequestsPage() {
  const [tab, setTab] = useState("new");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/concept-requests");
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || "Could not load requests");
      setRequests(j.requests || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCount = requests.filter((r) => ["NEW", "UNDER_REVIEW"].includes(r.status)).length;

  return (
    <div>
      <Title sub="Additions, changes, feedback and cost input on the Selected Frame concept. Every request is registered here and mailed to the concept and inventory owners.">
        Concept Requests
      </Title>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.surfaceD}` }}>
        {[{ id: "new", label: "New request" }, { id: "register", label: `Register${openCount ? ` (${openCount})` : ""}` }].map((t) => (
          <div key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "10px 18px", cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? C.text : C.textS,
              borderBottom: tab === t.id ? `2px solid ${C.oak}` : "2px solid transparent", marginBottom: -1 }}>
            {t.label}
          </div>
        ))}
      </div>

      {tab === "new"
        ? <RequestForm onSubmitted={load} />
        : <Register requests={requests} loading={loading} error={error} reload={load} />}
    </div>
  );
}
