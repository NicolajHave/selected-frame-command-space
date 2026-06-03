"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  C, CATEGORIES, STATUS_LABELS, fmtDate, formatBytes,
  ExternalFolderGate, ExternalFolderUpload, ExternalFolderFileList,
  RetentionBadge, RecentlyOpenedFolders,
} from "./ui";

function StatusPill({ children, color }) {
  return <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color, background: color + "1A", padding: "3px 8px", borderRadius: 4, letterSpacing: ".5px", textTransform: "uppercase", border: `1px solid ${color}33` }}>{children}</span>;
}

function statusColor(status) {
  switch (status) {
    case "active": return C.go;
    case "completed": return C.oak;
    case "pending_deletion": return C.warn;
    case "deleted": return C.nogo;
    default: return C.steel;
  }
}

function FolderListItem({ folder, onOpen }) {
  return (
    <button onClick={() => onOpen(folder)} style={{ textAlign: "left", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 90px 110px 120px 110px", gap: 16, alignItems: "center", padding: "14px 18px", background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 8, cursor: "pointer" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{folder.projectName}</div>
        <div style={{ fontSize: 11, color: C.textS, marginTop: 2 }}>{folder.projectType || "—"}</div>
      </div>
      <div style={{ fontSize: 12, color: C.textS }}>{folder.region || "—"}</div>
      <div style={{ fontSize: 12, color: C.text }}>{fmtDate(folder.dueDate)}</div>
      <StatusPill color={statusColor(folder.status)}>{STATUS_LABELS[folder.status] || folder.status}</StatusPill>
      <div style={{ fontSize: 12, color: C.text, fontFamily: "'DM Mono',monospace" }}>{folder.fileCount ?? 0} file{folder.fileCount === 1 ? "" : "s"}</div>
      <div style={{ fontSize: 11, color: C.textS }}>{folder.lastOpenedAt ? fmtDate(folder.lastOpenedAt) : "Never opened"}</div>
      <div><RetentionBadge folder={folder} /></div>
    </button>
  );
}

function FolderListHeader() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 90px 110px 120px 110px", gap: 16, padding: "8px 18px", fontSize: 9, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px" }}>
      <div>Project</div><div>Region</div><div>Due</div><div>Status</div><div>Files</div><div>Last opened</div><div>Retention</div>
    </div>
  );
}

function FolderDetailView({ folder: initialFolder, onBack, onChanged }) {
  const [folder, setFolder] = useState(initialFolder);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/external-folders/${initialFolder.id}`);
    if (r.ok) {
      const d = await r.json();
      setFolder({ ...d.folder, fileCount: d.files.length });
      setFiles(d.files);
    }
    setLoading(false);
  }, [initialFolder.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const onUploaded = (file) => {
    setFiles((prev) => [file, ...prev]);
    setFolder((f) => ({ ...f, fileCount: (f.fileCount || 0) + 1 }));
    onChanged?.();
  };
  const onDelete = async (file) => {
    if (!confirm(`Delete "${file.originalName}"?`)) return;
    const r = await fetch(`/api/external-folders/${folder.id}/files/${file.id}`, { method: "DELETE" });
    if (r.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      setFolder((f) => ({ ...f, fileCount: Math.max(0, (f.fileCount || 1) - 1) }));
      onChanged?.();
    }
  };

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.oak, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 18, fontWeight: 500 }}>← All External Folders</button>

      <div style={{ background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 10, padding: 26, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.oak, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>External Project Folder</div>
            <div style={{ fontSize: 24, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond',serif" }}>{folder.projectName}</div>
            <div style={{ fontSize: 12, color: C.textS, marginTop: 4 }}>{folder.projectType || "—"}{folder.region ? ` · ${folder.region}` : ""}</div>
          </div>
          <RetentionBadge folder={folder} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, fontSize: 12 }}>
          <Meta label="Status" value={STATUS_LABELS[folder.status] || folder.status} />
          <Meta label="Due" value={fmtDate(folder.dueDate)} />
          <Meta label="Created" value={fmtDate(folder.createdAt)} />
          <Meta label="Completed" value={fmtDate(folder.completedAt)} />
          <Meta label="Files" value={folder.fileCount ?? 0} />
        </div>
      </div>

      {folder.status !== "deleted" && (
        <div style={{ background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 10, padding: 22, marginBottom: 20 }}>
          <ExternalFolderUpload folder={folder} onUploaded={onUploaded} />
        </div>
      )}

      <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px" }}>
        Files {loading ? "· loading…" : `(${files.length})`}
      </div>
      <ExternalFolderFileList files={files} onDelete={onDelete} allowDelete />
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.textS, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function ExternalFoldersInner({ initialFolderId, onClearInitial }) {
  const [folders, setFolders] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ status: "all", region: "all", search: "" });
  const [detail, setDetail] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/external-folders");
      if (r.status === 503) {
        const j = await r.json();
        setError(j.message || "Database not configured");
        setFolders([]);
        return;
      }
      if (!r.ok) throw new Error(`Failed to load (${r.status})`);
      const d = await r.json();
      setFolders(d.folders || []);
      setError(null);
    } catch (e) {
      setError(e.message || "Failed to load folders");
    } finally {
      setLoading(false);
    }
    fetch("/api/external-folders/recent").then((r) => r.ok ? r.json() : { folders: [] }).then((d) => setRecent(d.folders || []));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Deep link from project detail
  useEffect(() => {
    if (!initialFolderId || !folders.length) return;
    const f = folders.find((x) => x.id === initialFolderId || x.folderUrlSlug === initialFolderId || x.asanaProjectId === initialFolderId);
    if (f) {
      setDetail(f);
      onClearInitial?.();
    }
  }, [initialFolderId, folders, onClearInitial]);

  if (detail) {
    return <FolderDetailView folder={detail} onBack={() => { setDetail(null); refresh(); }} onChanged={refresh} />;
  }

  const regions = Array.from(new Set(folders.map((f) => f.region).filter(Boolean))).sort();
  const filtered = folders.filter((f) => {
    if (filter.status !== "all" && f.status !== filter.status) return false;
    if (filter.region !== "all" && f.region !== filter.region) return false;
    if (filter.search && !f.projectName.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.oak, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>Workspace</div>
        <h2 style={{ fontSize: 22, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>External Project Folders</h2>
        <p style={{ fontSize: 13, color: C.textS, margin: "4px 0 0" }}>Per-project workspaces for brief, floorplans, quotation, supplier files and handover material.</p>
      </div>

      {error && (
        <div style={{ marginTop: 20, padding: "14px 18px", background: "#FDF3E0", borderLeft: `3px solid ${C.warn}`, borderRadius: 4, fontSize: 13, color: C.text }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, margin: "22px 0 16px", flexWrap: "wrap" }}>
        {[
          ["all", "All"],
          ["active", "Active"],
          ["completed", "Completed"],
          ["pending_deletion", "Pending deletion"],
          ["deleted", "Deleted"],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setFilter((p) => ({ ...p, status: k }))}
            style={{ fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 20, cursor: "pointer", border: `1px solid ${filter.status === k ? C.black : C.surfaceD}`, background: filter.status === k ? C.black : C.white, color: filter.status === k ? C.white : C.text }}>
            {l}
          </button>
        ))}
        {regions.length > 0 && (
          <select value={filter.region} onChange={(e) => setFilter((p) => ({ ...p, region: e.target.value }))} style={{ fontSize: 12, padding: "6px 10px", border: `1px solid ${C.surfaceD}`, borderRadius: 6, background: C.white, color: C.text }}>
            <option value="all">All regions</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
        <input
          type="search"
          placeholder="Search by project name"
          value={filter.search}
          onChange={(e) => setFilter((p) => ({ ...p, search: e.target.value }))}
          style={{ fontSize: 12, padding: "6px 12px", border: `1px solid ${C.surfaceD}`, borderRadius: 6, background: C.white, color: C.text, minWidth: 240 }}
        />
      </div>

      {!loading && !filtered.length ? (
        <div style={{ padding: 36, textAlign: "center", color: C.textS, fontSize: 13, border: `1px dashed ${C.surfaceD}`, borderRadius: 8 }}>
          No folders match the current filter.
        </div>
      ) : (
        <>
          <FolderListHeader />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((f) => <FolderListItem key={f.id} folder={f} onOpen={(folder) => setDetail(folder)} />)}
          </div>
        </>
      )}

      <RecentlyOpenedFolders folders={recent} onOpen={(f) => setDetail(f)} />
    </div>
  );
}

export default function ExternalFoldersPage({ initialFolderId, onClearInitial }) {
  return (
    <ExternalFolderGate>
      <ExternalFoldersInner initialFolderId={initialFolderId} onClearInitial={onClearInitial} />
    </ExternalFolderGate>
  );
}
