"use client";
// Shared UI primitives + reusable components for External Project Folders.
// Kept in one file so the page and the project-detail card can both consume
// the same building blocks without leaking styles into the rest of the app.

import React, { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

export const C = {
  steel: "#8A8D8F", steelL: "#B8BBBE", steelD: "#5C5F61",
  oak: "#C4944A", surface: "#F5F4F1", surfaceD: "#ECEAE5",
  white: "#FFFFFF", black: "#1A1A1A", text: "#2C2C2C", textS: "#6B6B6B",
  go: "#4A7C5C", warn: "#D4A843", nogo: "#C75B4A",
};

export const CATEGORIES = [
  { id: "01-brief",        label: "01 · Brief" },
  { id: "02-floorplans",   label: "02 · Floorplans" },
  { id: "03-quotation",    label: "03 · Quotation" },
  { id: "04-supplier",     label: "04 · Supplier" },
  { id: "05-installation", label: "05 · Installation" },
  { id: "06-photos",       label: "06 · Photos" },
  { id: "07-handover",     label: "07 · Handover" },
  { id: "08-archive",      label: "08 · Archive" },
];

export const STATUS_LABELS = {
  active: "Active",
  completed: "Completed",
  pending_deletion: "Pending deletion",
  deleted: "Deleted",
};

export function formatBytes(n) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

const DAY = 24 * 60 * 60 * 1000;
export function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / DAY);
}

// ─── Password gate ───────────────────────────────────────────────────────────
export function ExternalFolderGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | locked | open
  const [pw, setPw] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/external-folders/auth")
      .then((r) => r.json())
      .then((d) => setStatus(d.access ? "open" : "locked"))
      .catch(() => setStatus("locked"));
  }, []);

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/external-folders/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "Access denied");
      }
      setStatus("open");
    } catch (e) {
      setError(e.message || "Access denied");
    } finally {
      setBusy(false);
    }
  };

  if (status === "checking") {
    return <div style={{ padding: 40, color: C.textS, fontSize: 13 }}>Checking access…</div>;
  }
  if (status === "open") return children;

  return (
    <div style={{ maxWidth: 420 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.oak, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>
        Restricted
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 400, fontFamily: "'Cormorant Garamond',serif", color: C.text, margin: "0 0 6px" }}>
        External Project Folders
      </h2>
      <p style={{ fontSize: 13, color: C.textS, margin: "0 0 22px", lineHeight: 1.6 }}>
        Enter the shared internal password to access folders, uploads and retention information.
      </p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
          placeholder="Password"
          style={{ padding: "10px 14px", border: `1px solid ${C.surfaceD}`, borderRadius: 6, fontSize: 14, outline: "none", background: C.white, color: C.text }}
        />
        {error && (
          <div style={{ fontSize: 12, color: C.nogo, padding: "8px 12px", background: "#FBF0EE", borderLeft: `3px solid ${C.nogo}`, borderRadius: 4 }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={busy || !pw}
          style={{ padding: "10px 18px", background: busy || !pw ? C.steelL : C.black, color: C.white, border: "none", borderRadius: 6, cursor: busy || !pw ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500 }}
        >
          {busy ? "Unlocking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}

// ─── Retention badge ─────────────────────────────────────────────────────────
export function RetentionBadge({ folder }) {
  if (!folder) return null;
  const s = folder.status;
  if (s === "deleted") {
    return <Badge color={C.nogo}>Deleted by retention policy</Badge>;
  }
  if (s === "pending_deletion") {
    return <Badge color={C.nogo}>Pending deletion</Badge>;
  }
  if (s !== "completed" || !folder.deleteAt) {
    return <Badge color={C.textS}>Retention has not started</Badge>;
  }
  const days = daysUntil(folder.deleteAt);
  const tone = days <= 30 ? C.nogo : days <= 90 ? C.warn : C.oak;
  return <Badge color={tone}>{days <= 0 ? "Deletes today" : days === 1 ? "Deletes in 1 day" : `Deletes in ${days} days`}</Badge>;
}

function Badge({ children, color }) {
  return (
    <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color, background: color + "1A", padding: "3px 9px", borderRadius: 4, letterSpacing: ".5px", textTransform: "uppercase", border: `1px solid ${color}33` }}>
      {children}
    </span>
  );
}

// ─── File list ───────────────────────────────────────────────────────────────
function fileIcon(type) {
  if (!type) return "FILE";
  const t = type.toLowerCase();
  if (t.includes("pdf")) return "PDF";
  if (t.includes("image")) return "IMG";
  if (t.includes("zip")) return "ZIP";
  if (t.includes("dwg") || t.includes("dxf")) return "DWG";
  if (t.includes("sheet") || t.includes("excel")) return "XLS";
  if (t.includes("word") || t.includes("document")) return "DOC";
  if (t.includes("presentation") || t.includes("powerpoint")) return "PPT";
  return "FILE";
}

export function ExternalFolderFileList({ files, onDelete, allowDelete }) {
  if (!files.length) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: C.textS, fontSize: 13, border: `1px dashed ${C.surfaceD}`, borderRadius: 8 }}>
        No files yet.
      </div>
    );
  }
  return (
    <div style={{ border: `1px solid ${C.surfaceD}`, borderRadius: 8, overflow: "hidden", background: C.white }}>
      {files.map((f, i) => (
        <div key={f.id} style={{ display: "grid", gridTemplateColumns: "44px 1fr auto auto auto", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i ? `1px solid ${C.surfaceD}` : "none" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.oak, background: C.oak + "15", borderRadius: 4, padding: "4px 6px", textAlign: "center" }}>{fileIcon(f.fileType)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.originalName}</div>
            <div style={{ fontSize: 11, color: C.textS, fontFamily: "'DM Mono',monospace" }}>
              {f.category ? `${f.category} · ` : ""}{fmtDate(f.uploadedAt)} · {formatBytes(f.fileSize)}
            </div>
          </div>
          <div style={{ fontSize: 11, color: C.textS }}>{f.fileType || ""}</div>
          <a href={f.blobUrl} target="_blank" rel="noopener noreferrer" download={f.originalName} style={{ fontSize: 12, fontWeight: 500, color: C.oak, textDecoration: "none", padding: "6px 12px" }}>Download</a>
          {allowDelete ? (
            <button onClick={() => onDelete(f)} style={{ fontSize: 11, color: C.nogo, background: "none", border: `1px solid ${C.surfaceD}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}>Delete</button>
          ) : <span />}
        </div>
      ))}
    </div>
  );
}

// ─── Upload area ─────────────────────────────────────────────────────────────
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.dwg,.dxf,.zip";

export function ExternalFolderUpload({ folder, onUploaded }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [items, setItems] = useState([]); // { name, size, status, error?, fileObj }

  const enqueue = (filesList) => {
    const next = Array.from(filesList).map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      type: f.type,
      status: "waiting",
      fileObj: f,
    }));
    setItems((prev) => [...prev, ...next]);
    next.forEach(processOne);
  };

  async function processOne(item) {
    setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: "uploading" } : it));
    try {
      const safeName = item.fileObj.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const pathname = `${folder.blobPrefix}${category}/${Date.now()}-${safeName}`;
      const result = await upload(pathname, item.fileObj, {
        access: "public",
        handleUploadUrl: `/api/external-folders/${folder.id}/upload-url`,
        contentType: item.fileObj.type || "application/octet-stream",
      });
      const saveRes = await fetch(`/api/external-folders/${folder.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalName: item.fileObj.name,
          blobUrl: result.url,
          blobPath: result.pathname,
          fileType: item.fileObj.type,
          fileSize: item.fileObj.size,
          category,
        }),
      });
      if (!saveRes.ok) {
        const j = await saveRes.json().catch(() => ({}));
        throw new Error(j.error || `Save failed (${saveRes.status})`);
      }
      const { file } = await saveRes.json();
      setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: "uploaded" } : it));
      onUploaded?.(file);
    } catch (e) {
      setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: "failed", error: e.message || "Failed" } : it));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px" }}>Upload files</div>
        <label style={{ fontSize: 12, color: C.textS, display: "flex", alignItems: "center", gap: 8 }}>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ fontSize: 12, padding: "6px 8px", border: `1px solid ${C.surfaceD}`, borderRadius: 6, background: C.white, color: C.text }}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files?.length) enqueue(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{ border: `1.5px dashed ${drag ? C.oak : C.surfaceD}`, background: drag ? C.oak + "0A" : C.white, borderRadius: 10, padding: "28px 20px", textAlign: "center", cursor: "pointer" }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          style={{ display: "none" }}
          onChange={(e) => e.target.files && enqueue(e.target.files)}
        />
        <div style={{ fontSize: 14, color: C.text, marginBottom: 4 }}>Drop files here or click to choose</div>
        <div style={{ fontSize: 12, color: C.textS }}>PDF, images, Excel, Word, PowerPoint, DWG/DXF, ZIP · multiple files allowed</div>
      </div>

      {items.length > 0 && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it) => (
            <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center", padding: "8px 12px", background: C.surface, borderRadius: 6 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</div>
                {it.status === "failed" && <div style={{ fontSize: 11, color: C.nogo }}>{it.error}</div>}
              </div>
              <div style={{ fontSize: 11, color: C.textS, fontFamily: "'DM Mono',monospace" }}>{formatBytes(it.size)}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color:
                it.status === "uploaded" ? C.go : it.status === "failed" ? C.nogo : it.status === "uploading" ? C.oak : C.textS }}>{it.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── External folder summary card (used in Projects/Installed Base detail) ──
export function ExternalFolderCard({ folder, asanaProjectId, projectMeta, onCreated, onOpen, dbConfigured = true }) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  if (!dbConfigured) {
    return (
      <Card>
        <CardEyebrow>External Project Folder</CardEyebrow>
        <CardTitle>Setup required</CardTitle>
        <CardBody>
          Provision a Postgres database and set <code style={{ background: C.surfaceD, padding: "1px 6px", borderRadius: 3, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>POSTGRES_URL</code> in Vercel to enable external folders.
        </CardBody>
      </Card>
    );
  }

  const create = async () => {
    if (!asanaProjectId) { setError("Project is missing an Asana ID — folder cannot be created."); return; }
    setCreating(true); setError(null);
    try {
      const r = await fetch("/api/external-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asanaProjectId,
          projectName: projectMeta.name,
          projectType: projectMeta.type,
          region: projectMeta.region,
          dueDate: projectMeta.dueOn,
          completed: projectMeta.completed,
          completedAt: projectMeta.completedAt,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Create failed (${r.status})`);
      }
      const { folder } = await r.json();
      onCreated?.(folder);
    } catch (e) {
      setError(e.message || "Could not create folder");
    } finally {
      setCreating(false);
    }
  };

  if (!folder) {
    return (
      <Card>
        <CardEyebrow>External Project Folder</CardEyebrow>
        <CardTitle>No external folder created yet</CardTitle>
        <CardBody>
          Create a dedicated workspace for this project's brief, floorplans, quotation, photos and handover material.
        </CardBody>
        {error && <div style={{ fontSize: 12, color: C.nogo, marginTop: 10 }}>{error}</div>}
        <div style={{ marginTop: 14 }}>
          <button onClick={create} disabled={creating || !asanaProjectId}
            style={{ padding: "10px 18px", background: creating || !asanaProjectId ? C.steelL : C.black, color: C.white, border: "none", borderRadius: 6, cursor: creating ? "wait" : "pointer", fontSize: 13, fontWeight: 500 }}>
            {creating ? "Creating…" : "Create External Project Folder"}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <CardEyebrow>External Project Folder</CardEyebrow>
          <CardTitle>{STATUS_LABELS[folder.status] || folder.status}</CardTitle>
        </div>
        <RetentionBadge folder={folder} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 14, fontSize: 12 }}>
        <Meta label="Files" value={folder.fileCount ?? 0} />
        <Meta label="Created" value={fmtDate(folder.createdAt)} />
        <Meta label="Last opened" value={fmtDate(folder.lastOpenedAt)} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={() => onOpen?.(folder)} style={{ padding: "10px 18px", background: C.black, color: C.white, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          Open External Project Folder
        </button>
      </div>
    </Card>
  );
}

function Card({ children }) {
  return <div style={{ background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 10, padding: 22 }}>{children}</div>;
}
function CardEyebrow({ children }) {
  return <div style={{ fontSize: 9, fontWeight: 700, color: C.oak, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>{children}</div>;
}
function CardTitle({ children }) {
  return <div style={{ fontSize: 17, fontWeight: 500, color: C.text, fontFamily: "'Cormorant Garamond',serif", marginBottom: 6 }}>{children}</div>;
}
function CardBody({ children }) {
  return <div style={{ fontSize: 13, color: C.textS, lineHeight: 1.6 }}>{children}</div>;
}
function Meta({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.textS, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

// ─── Recently opened folders ────────────────────────────────────────────────
export function RecentlyOpenedFolders({ folders, onOpen }) {
  if (!folders?.length) return null;
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
        Recently Opened External Folders
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {folders.map((f) => (
          <button key={f.id} onClick={() => onOpen?.(f)}
            style={{ textAlign: "left", background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 8, padding: 14, cursor: "pointer" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 4 }}>{f.projectName}</div>
            <div style={{ fontSize: 11, color: C.textS, marginBottom: 6 }}>Opened {fmtDate(f.lastOpenedAt)} · Due {fmtDate(f.dueDate)}</div>
            <RetentionBadge folder={f} />
          </button>
        ))}
      </div>
    </div>
  );
}
