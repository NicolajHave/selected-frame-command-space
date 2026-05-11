"use client";
import React, { useCallback, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

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
  success: "#5A8F6A",
  danger: "#C75B4A",
  warn: "#D4A843",
};

const Title = ({ children, sub }) => (
  <div style={{ marginBottom: 24 }}>
    <h2
      style={{
        fontSize: 22,
        fontWeight: 400,
        color: C.text,
        fontFamily: "'Cormorant Garamond',serif",
        margin: 0,
      }}
    >
      {children}
    </h2>
    {sub && <p style={{ fontSize: 13, color: C.textS, margin: "4px 0 0" }}>{sub}</p>}
  </div>
);

const OPTIONS = [
  {
    key: "replaceLogos",
    label: "Replace logos",
    desc: "Frame logo on every page · SELECTED logo on cover",
  },
  {
    key: "updateContact",
    label: "Update contact text",
    desc: "Rewrite cover-page enquiry line to SELECTEDSIS@bestseller.com",
  },
  {
    key: "appendZoning",
    label: "Append zoning template",
    desc: "Adds the standard zoning pages to the back of the document",
  },
];

const formatBytes = (n) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

function FileDropZone({ file, onFile, disabled }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handle = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are accepted");
      return;
    }
    onFile(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (disabled) return;
        handle(e.dataTransfer.files?.[0]);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      style={{
        border: `1.5px dashed ${drag ? C.oak : C.surfaceD}`,
        background: drag ? C.oak + "0A" : C.white,
        borderRadius: 10,
        padding: "44px 24px",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "border-color .15s, background .15s",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        style={{ display: "none" }}
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {file ? (
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{file.name}</div>
          <div style={{ fontSize: 12, color: C.textS, marginTop: 4 }}>
            {formatBytes(file.size)} · click to replace
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.oak,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Upload
          </div>
          <div style={{ fontSize: 14, color: C.text }}>Drop a PDF here or click to choose</div>
          <div style={{ fontSize: 12, color: C.textS, marginTop: 6 }}>
            Supplier draft · max 25 MB
          </div>
        </div>
      )}
    </div>
  );
}

function OptionRow({ option, value, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "16px 18px",
        background: C.white,
        border: `1px solid ${C.surfaceD}`,
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3, accentColor: C.oak }}
      />
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{option.label}</div>
        <div style={{ fontSize: 12, color: C.textS, marginTop: 3 }}>{option.desc}</div>
      </div>
    </label>
  );
}

function ResultPanel({ result, onReset }) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.surfaceD}`,
        borderTop: `3px solid ${C.success}`,
        borderRadius: 10,
        padding: 28,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.success,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Ready
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 400,
          fontFamily: "'Cormorant Garamond',serif",
          color: C.text,
          marginBottom: 4,
        }}
      >
        Updated PDF generated
      </div>
      <div style={{ fontSize: 13, color: C.textS, marginBottom: 20 }}>
        {result.filename} · {formatBytes(result.size)}
        {result.report?.pageCount ? ` · ${result.report.pageCount} pages` : ""}
        {result.report?.appendedPages
          ? ` · +${result.report.appendedPages} appended`
          : ""}
      </div>

      {result.report?.operations?.length ? (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.textS,
              letterSpacing: ".5px",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Applied
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {result.report.operations.map((op) => (
              <span
                key={op}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.text,
                  background: C.surface,
                  border: `1px solid ${C.surfaceD}`,
                  padding: "3px 10px",
                  borderRadius: 4,
                }}
              >
                {op}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {result.report?.warnings?.length ? (
        <div
          style={{
            marginBottom: 20,
            padding: "10px 14px",
            background: "#FDF3E0",
            borderLeft: `3px solid ${C.warn}`,
            borderRadius: 4,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.warn,
              letterSpacing: ".5px",
              marginBottom: 4,
            }}
          >
            WARNINGS
          </div>
          {result.report.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
              · {w}
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 12 }}>
        <a
          href={result.url}
          download={result.filename}
          style={{
            display: "inline-block",
            background: C.black,
            color: C.white,
            padding: "12px 22px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Download PDF
        </a>
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: `1px solid ${C.surfaceD}`,
            color: C.text,
            padding: "12px 22px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Process another
        </button>
      </div>
    </div>
  );
}

export default function DraftStudioPage() {
  const [file, setFile] = useState(null);
  const [opts, setOpts] = useState({
    replaceLogos: true,
    updateContact: true,
    appendZoning: false,
  });
  const [busy, setBusy] = useState(false);
  const [busyStage, setBusyStage] = useState(null); // "uploading" | "processing"
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const reset = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setError(null);
    setResult(null);
  }, [result]);

  const submit = async () => {
    if (!file) {
      setError("Choose a PDF first");
      return;
    }
    const anyOp = opts.replaceLogos || opts.updateContact || opts.appendZoning;
    if (!anyOp) {
      setError("Select at least one operation");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // 1. Upload PDF directly to Vercel Blob (bypasses 4.5 MB function limit).
      setBusyStage("uploading");
      const blob = await upload(`pdf-studio/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/pdf-studio/upload",
        contentType: "application/pdf",
      });

      // 2. Ask the server to process the blob and stream the result back.
      setBusyStage("processing");
      const res = await fetch("/api/pdf-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blob.url,
          filename: file.name,
          replaceLogos: opts.replaceLogos,
          updateContact: opts.updateContact,
          appendZoning: opts.appendZoning,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }

      let report = null;
      const reportHeader = res.headers.get("X-PDF-Studio-Report");
      if (reportHeader) {
        try {
          report = JSON.parse(decodeURIComponent(reportHeader));
        } catch {}
      }

      const outBlob = await res.blob();
      const url = URL.createObjectURL(outBlob);
      const filename = (file.name || "document.pdf").replace(
        /\.pdf$/i,
        "__selected-frame.pdf",
      );
      setResult({ url, filename, size: outBlob.size, report });
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setBusy(false);
      setBusyStage(null);
    }
  };

  const canSubmit =
    !!file && !busy && (opts.replaceLogos || opts.updateContact || opts.appendZoning);

  return (
    <div style={{ maxWidth: 760 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: C.oak,
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Draft Studio
      </div>
      <Title sub="Condition supplier drafts to the Selected Frame standard">
        PDF Studio
      </Title>

      {result ? (
        <ResultPanel result={result} onReset={reset} />
      ) : (
        <>
          <div style={{ marginBottom: 24 }}>
            <FileDropZone file={file} onFile={setFile} disabled={busy} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.textS,
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Operations
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {OPTIONS.map((o) => (
                <OptionRow
                  key={o.key}
                  option={o}
                  value={opts[o.key]}
                  onChange={(v) => setOpts((p) => ({ ...p, [o.key]: v }))}
                />
              ))}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#FDEAE6",
                borderLeft: `3px solid ${C.danger}`,
                borderRadius: 4,
                marginBottom: 20,
                fontSize: 13,
                color: C.text,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={submit}
              disabled={!canSubmit}
              style={{
                background: canSubmit ? C.black : C.steelL,
                color: C.white,
                padding: "12px 24px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              {busy
                ? busyStage === "uploading"
                  ? "Uploading…"
                  : "Generating…"
                : "Generate Updated PDF"}
            </button>
            {file && !busy && (
              <button
                onClick={() => setFile(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: C.textS,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}

      <div
        style={{
          marginTop: 32,
          padding: "16px 18px",
          background: C.white,
          border: `1px solid ${C.surfaceD}`,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: C.textS,
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          How it works
        </div>
        <div style={{ fontSize: 12, color: C.textS, lineHeight: 1.6 }}>
          The Frame logo is replaced in the bottom-right corner of every page. On the
          cover page, the large SELECTED logo and contact line are rewritten. The
          zoning template, if appended, is added unchanged at the back of the file.
          Originals are never modified — a new PDF is generated for download.
        </div>
      </div>
    </div>
  );
}
