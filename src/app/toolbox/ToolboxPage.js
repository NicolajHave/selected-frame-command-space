"use client";
import React, { useMemo, useState } from "react";
import { TEMPLATES, CATEGORIES, LANGUAGES } from "../../data/toolboxTemplates";

const C = {
  steel: "#8A8D8F",
  steelL: "#B8BBBE",
  steelD: "#5C5F61",
  oak: "#C4944A",
  surface: "#F5F4F1",
  surfaceD: "#ECEAE5",
  white: "#FFFFFF",
  black: "#1A1A1A",
  text: "#2C2C2C",
  textS: "#6B6B6B",
  go: "#4A7C5C",
};

const Title = ({ children, sub }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ fontSize: 22, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>
      {children}
    </h2>
    {sub && <p style={{ fontSize: 13, color: C.textS, margin: "4px 0 0" }}>{sub}</p>}
  </div>
);

// Highlight [PLACEHOLDERS] inside copy so they read as fill-in fields.
function renderWithPlaceholders(text) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((p, i) =>
    /^\[[^\]]+\]$/.test(p) ? (
      <span
        key={i}
        style={{
          background: C.oak + "1F",
          color: C.oak,
          borderRadius: 3,
          padding: "0 3px",
          fontWeight: 600,
        }}
      >
        {p}
      </span>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    ),
  );
}

function CopyButton({ label, getText, variant = "ghost" }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (e.g. insecure context) — no-op, button stays idle.
    }
  };
  const base = {
    fontSize: 12,
    fontWeight: 500,
    padding: "7px 14px",
    borderRadius: 6,
    cursor: "pointer",
    transition: "background .15s, border-color .15s",
  };
  const styles =
    variant === "solid"
      ? { ...base, border: "none", background: copied ? C.go : C.black, color: C.white }
      : { ...base, border: `1px solid ${copied ? C.go : C.surfaceD}`, background: C.white, color: copied ? C.go : C.text };
  return (
    <button onClick={onClick} style={styles}>
      {copied ? "Copied" : label}
    </button>
  );
}

function TemplateCard({ template }) {
  const available = LANGUAGES.filter((l) => template.languages[l.code]);
  const [lang, setLang] = useState(available[0]?.code || "en");
  const variant = template.languages[lang];
  const categoryLabel = CATEGORIES.find((c) => c.id === template.category)?.label || template.category;
  const attachments = template.attachments || [];

  const fullText = `${variant.subject}\n\n${variant.body}`;
  const mailto = `mailto:?subject=${encodeURIComponent(variant.subject)}&body=${encodeURIComponent(variant.body)}`;

  // mailto: cannot carry attachments (RFC limitation). When attachments exist we
  // trigger their download in the same click so the user can drag them into the
  // composer that Open-in-email opens.
  const handleOpenInEmail = (e) => {
    if (attachments.length === 0) return;
    attachments.forEach((a) => {
      const link = document.createElement("a");
      link.href = a.url;
      link.download = a.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
    // Let the anchor's default action (window.location = mailto:) run.
  };

  return (
    <div style={{ background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${C.surfaceD}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.oak, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 8 }}>
              {categoryLabel}
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, color: C.text, fontFamily: "'Cormorant Garamond',serif", marginBottom: 6 }}>
              {template.title}
            </div>
            <div style={{ fontSize: 12, color: C.textS, lineHeight: 1.6, maxWidth: 620 }}>{template.description}</div>
          </div>
          {available.length > 1 && (
            <div style={{ display: "flex", gap: 0, border: `1px solid ${C.surfaceD}`, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
              {available.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  title={l.label}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "6px 10px",
                    border: "none",
                    cursor: "pointer",
                    background: lang === l.code ? C.black : C.white,
                    color: lang === l.code ? C.white : C.textS,
                    letterSpacing: ".5px",
                  }}
                >
                  {l.short || l.code.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px" }}>Subject</div>
            <CopyButton label="Copy subject" getText={() => variant.subject} />
          </div>
          <div style={{ fontSize: 13, color: C.text, background: C.surface, borderRadius: 6, padding: "10px 14px", lineHeight: 1.5 }}>
            {renderWithPlaceholders(variant.subject)}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px" }}>Email body</div>
            <CopyButton label="Copy body" getText={() => variant.body} />
          </div>
          <div
            style={{
              fontSize: 13,
              color: C.text,
              background: C.surface,
              borderRadius: 6,
              padding: "14px 16px",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              maxHeight: 320,
              overflow: "auto",
            }}
          >
            {renderWithPlaceholders(variant.body)}
          </div>
        </div>

        {attachments.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
              Attachment{attachments.length > 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {attachments.map((a) => (
                <a
                  key={a.url}
                  href={a.url}
                  download={a.filename}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: C.text,
                    background: C.white,
                    border: `1px solid ${C.surfaceD}`,
                    borderRadius: 6,
                    padding: "8px 12px",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.oak, letterSpacing: ".5px" }}>PDF</span>
                  <span style={{ fontWeight: 500 }}>{a.label}</span>
                  <span style={{ fontSize: 11, color: C.textS }}>Download</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}>
          <CopyButton label="Copy full email" getText={() => fullText} variant="solid" />
          <a
            href={mailto}
            onClick={handleOpenInEmail}
            style={{ fontSize: 12, fontWeight: 500, padding: "7px 14px", borderRadius: 6, border: `1px solid ${C.surfaceD}`, background: C.white, color: C.text, textDecoration: "none" }}
          >
            Open in email
          </a>
          {attachments.length > 0 && (
            <div style={{ fontSize: 11, color: C.textS, fontStyle: "italic" }}>
              Attachment{attachments.length > 1 ? "s" : ""} will download — drag into your email after it opens.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ToolboxPage() {
  const [active, setActive] = useState("partner-emails");

  const countByCategory = useMemo(() => {
    const m = {};
    for (const t of TEMPLATES) m[t.category] = (m[t.category] || 0) + 1;
    return m;
  }, []);

  const filtered = TEMPLATES.filter((t) => t.category === active);

  return (
    <div style={{ maxWidth: 920 }}>
      <Title sub="Templates and resources for smoother Shop-In-Shop briefing, sales support and project execution.">
        Toolbox
      </Title>

      <div style={{ background: C.white, border: `1px solid ${C.surfaceD}`, borderLeft: `3px solid ${C.oak}`, borderRadius: 8, padding: "18px 22px", marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.65 }}>
          A curated operational hub for partner communication, briefing material and internal support — built to
          standardise how we brief, sell and hand over Selected Frame projects across markets. This is not a document
          archive; every item is here because it helps a real step in the project flow.
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => {
          const count = countByCategory[cat.id] || 0;
          const isActive = active === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: "8px 16px",
                borderRadius: 20,
                cursor: "pointer",
                border: `1px solid ${isActive ? C.black : C.surfaceD}`,
                background: isActive ? C.black : C.white,
                color: isActive ? C.white : count ? C.text : C.steelL,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {cat.label}
              <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Template library */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 32 }}>
        {filtered.length > 0 ? (
          filtered.map((t) => <TemplateCard key={t.id} template={t} />)
        ) : (
          <div style={{ background: C.white, border: `1px dashed ${C.surfaceD}`, borderRadius: 10, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: C.text, marginBottom: 6 }}>Nothing here yet</div>
            <div style={{ fontSize: 12, color: C.textS }}>Templates for this category are on the way.</div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: C.textS, fontStyle: "italic", lineHeight: 1.6, borderTop: `1px solid ${C.surfaceD}`, paddingTop: 18 }}>
        This toolbox is work in progress. More templates, briefing tools and partner communication resources will be
        added continuously.
      </div>
    </div>
  );
}
