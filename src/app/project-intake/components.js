"use client";
// Reusable form primitives for Project Intake. Visual language matches the
// rest of Command Space (oak accents, surface fills, Cormorant headings).

import React, { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

export const C = {
  steel: "#8A8D8F", steelL: "#B8BBBE", steelD: "#5C5F61",
  oak: "#C4944A", surface: "#F5F4F1", surfaceD: "#ECEAE5",
  white: "#FFFFFF", black: "#1A1A1A", text: "#2C2C2C", textS: "#6B6B6B",
  go: "#4A7C5C", warn: "#D4A843", nogo: "#C75B4A",
};

const inputBase = {
  width: "100%", padding: "9px 12px", border: `1px solid ${C.surfaceD}`,
  borderRadius: 6, fontSize: 13, color: C.text, background: C.white,
  outline: "none", fontFamily: "inherit",
};

function Label({ children, required, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>
      {children}
      {required && <span style={{ color: C.oak, marginLeft: 4 }}>*</span>}
    </label>
  );
}

function Helper({ children }) {
  if (!children) return null;
  return <div style={{ fontSize: 11, color: C.textS, marginTop: 5, lineHeight: 1.5 }}>{children}</div>;
}

function ErrorText({ children }) {
  if (!children) return null;
  return <div style={{ fontSize: 11, color: C.nogo, marginTop: 5 }}>{children}</div>;
}

export function IntakeSection({ number, title, children }) {
  return (
    <section style={{ background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 10, padding: 26, marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${C.surfaceD}` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.oak, fontFamily: "'DM Mono',monospace" }}>{String(number).padStart(2, "0")}</span>
        <h3 style={{ fontSize: 18, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
    </section>
  );
}

export function Row({ children, cols = 2 }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>{children}</div>;
}

export function TextField({ label, required, value, onChange, helper, error, type = "text", suffix, placeholder, textarea, rows = 3 }) {
  const [focus, setFocus] = useState(false);
  const border = error ? C.nogo : focus ? C.oak : C.surfaceD;
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {textarea ? (
          <textarea
            value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            style={{ ...inputBase, border: `1px solid ${border}`, resize: "vertical", lineHeight: 1.5 }}
          />
        ) : (
          <input
            type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            style={{ ...inputBase, border: `1px solid ${border}`, paddingRight: suffix ? 48 : 12 }}
          />
        )}
        {suffix && <span style={{ position: "absolute", right: 12, fontSize: 12, color: C.textS, pointerEvents: "none" }}>{suffix}</span>}
      </div>
      <Helper>{helper}</Helper>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

export function SelectField({ label, required, value, onChange, options, helper, error, placeholder = "Select…" }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputBase, border: `1px solid ${error ? C.nogo : C.surfaceD}`, appearance: "auto", color: value ? C.text : C.steel }}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <Helper>{helper}</Helper>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

export function RadioGroup({ label, required, value, onChange, options, helper, error, inline }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div style={{ display: "flex", flexDirection: inline ? "row" : "column", flexWrap: "wrap", gap: inline ? 16 : 8, marginTop: 2 }}>
        {options.map((o) => {
          const active = value === o;
          return (
            <label key={o} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: C.text, cursor: "pointer", padding: inline ? 0 : "2px 0" }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${active ? C.oak : C.steelL}`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.oak }} />}
              </span>
              <input type="radio" checked={active} onChange={() => onChange(o)} style={{ display: "none" }} />
              {o}
            </label>
          );
        })}
      </div>
      <Helper>{helper}</Helper>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

export function CheckboxGroup({ label, required, values = [], onChange, options, helper, error }) {
  const toggle = (o) => {
    if (values.includes(o)) onChange(values.filter((x) => x !== o));
    else onChange([...values, o]);
  };
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 2 }}>
        {options.map((o) => {
          const active = values.includes(o);
          return (
            <label key={o} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: C.text, cursor: "pointer" }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${active ? C.oak : C.steelL}`, background: active ? C.oak : C.white, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.white, fontSize: 11, fontWeight: 700 }}>
                {active && "✓"}
              </span>
              <input type="checkbox" checked={active} onChange={() => toggle(o)} style={{ display: "none" }} />
              {o}
            </label>
          );
        })}
      </div>
      <Helper>{helper}</Helper>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

export function Checkbox({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.text, cursor: "pointer" }}>
      <span style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${checked ? C.oak : C.steelL}`, background: checked ? C.oak : C.white, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.white, fontSize: 12, fontWeight: 700 }}>
        {checked && "✓"}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ display: "none" }} />
      {label}
    </label>
  );
}

/** Conditional wrapper — renders children only when `when` is truthy. */
export function ConditionalField({ when, children }) {
  if (!when) return null;
  return (
    <div style={{ borderLeft: `2px solid ${C.oak}55`, paddingLeft: 16, marginLeft: 2 }}>
      {children}
    </div>
  );
}

export function InfoBox({ tone = "oak", title, children }) {
  const color = tone === "warn" ? C.warn : tone === "go" ? C.go : C.oak;
  const bg = tone === "warn" ? "#FDF3E0" : tone === "go" ? "#F0F7F2" : "#FBF5EC";
  return (
    <div style={{ background: bg, borderLeft: `3px solid ${color}`, borderRadius: 6, padding: "14px 16px" }}>
      {title && <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{title}</div>}
      <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export function SoftShopNotice() {
  return (
    <InfoBox tone="warn" title="Soft Shop Solution likely">
      Based on the entered sales area, this project is expected to be handled as a Soft Shop Solution. As a starting
      point, shopfitting is not included and must be handled locally by the market/partner. If shopfitting support is
      requested, the cost must be covered by the market/partner.
    </InfoBox>
  );
}

// ─── Attachment upload group ────────────────────────────────────────────────
const ATTACHMENT_STATUSES = ["Missing", "Uploaded", "Pending Brand Spaces review", "Approved", "Needs clarification"];

export function AttachmentStatusBadge({ status }) {
  const map = {
    "Missing": { c: C.steel, bg: C.surfaceD },
    "Uploaded": { c: C.go, bg: "#E8F2EA" },
    "Pending Brand Spaces review": { c: C.warn, bg: "#FDF3E0" },
    "Approved": { c: C.go, bg: "#E8F2EA" },
    "Needs clarification": { c: C.nogo, bg: "#FBF0EE" },
  };
  const s = map[status] || map.Missing;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: s.c, background: s.bg, padding: "3px 9px", borderRadius: 4, letterSpacing: ".4px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

/**
 * AttachmentUploadGroup uploads directly to Vercel Blob under
 * project-intake/<sessionId>/<group>/. Files are optional; status moves
 * Missing → Uploaded once at least one file lands.
 */
export function AttachmentUploadGroup({ group, label, helper, accept, multiple, sessionId, files, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const status = files.length ? "Uploaded" : "Missing";

  const handle = async (fileList) => {
    if (!fileList?.length) return;
    setBusy(true); setError(null);
    const toUpload = multiple ? Array.from(fileList) : [fileList[0]];
    const added = [];
    for (const f of toUpload) {
      try {
        const safe = f.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const pathname = `project-intake/${sessionId}/${group}/${Date.now()}-${safe}`;
        const res = await upload(pathname, f, {
          access: "public",
          handleUploadUrl: "/api/project-intake/upload-url",
          contentType: f.type || "application/octet-stream",
        });
        added.push({ originalName: f.name, url: res.url, path: res.pathname, size: f.size, type: f.type });
      } catch (e) {
        setError(e.message || "Upload failed");
      }
    }
    onChange(multiple ? [...files, ...added] : added);
    setBusy(false);
  };

  return (
    <div style={{ border: `1px solid ${C.surfaceD}`, borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: helper ? 4 : 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{label}</div>
        <AttachmentStatusBadge status={status} />
      </div>
      {helper && <Helper>{helper}</Helper>}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "10px 0" }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 12, color: C.text, background: C.surface, borderRadius: 5, padding: "6px 10px" }}>
              <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: C.text, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.originalName}</a>
              <button onClick={() => onChange(files.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.nogo, cursor: "pointer", fontSize: 11, flexShrink: 0 }}>Remove</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} style={{ display: "none" }} onChange={(e) => handle(e.target.files)} />
        <button onClick={() => inputRef.current?.click()} disabled={busy}
          style={{ fontSize: 12, fontWeight: 500, padding: "7px 14px", borderRadius: 6, border: `1px solid ${C.surfaceD}`, background: C.white, color: busy ? C.steel : C.text, cursor: busy ? "wait" : "pointer" }}>
          {busy ? "Uploading…" : multiple ? "Add files" : files.length ? "Replace file" : "Upload file"}
        </button>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

export { ATTACHMENT_STATUSES };
