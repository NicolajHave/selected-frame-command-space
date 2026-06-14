"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { CHECKPOINTS, PHOTO_SLOTS, isCheckpointApplicable } from "../../lib/opening-reports/checkpoints";
import { openOpeningReportPdf } from "./pdf";

const C = {
  steel: "#8A8D8F", steelL: "#B8BBBE", steelD: "#5C5F61",
  oak: "#C4944A", surface: "#F5F4F1", surfaceD: "#ECEAE5",
  white: "#FFFFFF", black: "#1A1A1A", text: "#2C2C2C", textS: "#6B6B6B",
  go: "#4A7C5C", warn: "#D4A843", nogo: "#C75B4A", success: "#5A8F6A",
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const todayISO = () => new Date().toISOString().split("T")[0];

const Title = ({ children, sub }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ fontSize: 22, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{children}</h2>
    {sub && <p style={{ fontSize: 13, color: C.textS, margin: "4px 0 0" }}>{sub}</p>}
  </div>
);

const Eyebrow = ({ children }) => (
  <div style={{ fontSize: 9, fontWeight: 700, color: C.oak, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>{children}</div>
);

const StatusPill = ({ status }) => {
  const map = {
    submitted: { c: C.warn, label: "Submitted" },
    approved: { c: C.success, label: "Approved" },
  };
  const s = map[status] || { c: C.steel, label: status };
  return <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: s.c, background: s.c + "1A", padding: "3px 9px", borderRadius: 4, letterSpacing: ".5px", textTransform: "uppercase", border: `1px solid ${s.c}33` }}>{s.label}</span>;
};

const FormLabel = ({ children, required }) => (
  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>
    {children}{required && <span style={{ color: C.nogo, marginLeft: 4 }}>*</span>}
  </label>
);

const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.surfaceD}`, fontSize: 13, outline: "none", background: C.white, color: C.text, fontFamily: "inherit" };

function Card({ children, style }) {
  return <div style={{ background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 10, padding: 22, ...style }}>{children}</div>;
}

function SectionHeader({ n, title, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.oak, letterSpacing: "1.5px", fontFamily: "'DM Mono',monospace" }}>0{n}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: C.text, fontFamily: "'Cormorant Garamond',serif" }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: C.textS, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────
function ReportsListView({ reports, onCreate, onOpen, loading }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
        <Title sub="Compliance proof and operational handover from shop-in-shop openings">Opening Reports</Title>
        <button onClick={onCreate} style={{ padding: "10px 18px", background: C.black, color: C.white, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          + New Opening Report
        </button>
      </div>

      {loading ? (
        <Card><div style={{ padding: 20, textAlign: "center", color: C.textS, fontSize: 13 }}>Loading…</div></Card>
      ) : !reports.length ? (
        <Card>
          <Eyebrow>No reports yet</Eyebrow>
          <div style={{ fontSize: 14, color: C.text, fontFamily: "'Cormorant Garamond',serif", marginBottom: 6 }}>Document a Selected Frame opening</div>
          <div style={{ fontSize: 13, color: C.textS, lineHeight: 1.6 }}>
            Start a new report on opening day. Capture compliance, photos, and handover responsibility — Brand Spaces reviews and approves.
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 110px 110px 110px 100px", gap: 16, padding: "8px 18px", fontSize: 9, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px" }}>
            <div>Partner</div><div>Location</div><div>Opening</div><div>Submitted</div><div>Submitted by</div><div>Status</div>
          </div>
          {reports.map((r) => (
            <button key={r.id} onClick={() => onOpen(r)} style={{ textAlign: "left", display: "grid", gridTemplateColumns: "2fr 1fr 110px 110px 110px 100px", gap: 16, alignItems: "center", padding: "14px 18px", background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{r.partnerName}</div>
                <div style={{ fontSize: 11, color: C.textS, marginTop: 2, fontFamily: "'DM Mono',monospace" }}>{r.reportUrlSlug}</div>
              </div>
              <div style={{ fontSize: 12, color: C.text }}>{r.location}</div>
              <div style={{ fontSize: 12, color: C.text }}>{fmtDate(r.openingDate)}</div>
              <div style={{ fontSize: 12, color: C.textS }}>{fmtDate(r.submittedAt)}</div>
              <div style={{ fontSize: 12, color: C.text }}>{r.completedByName}</div>
              <div><StatusPill status={r.status} /></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────
function CreateReportView({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    partnerName: "", location: "", sqm: "", openingDate: todayISO(), completedByName: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = form.partnerName.trim() && form.location.trim() && form.completedByName.trim();

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/opening-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerName: form.partnerName.trim(),
          location: form.location.trim(),
          sqm: form.sqm ? Number(form.sqm) : null,
          openingDate: form.openingDate || null,
          completedByName: form.completedByName.trim(),
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Create failed (${r.status})`);
      }
      const { report } = await r.json();
      onCreated(report);
    } catch (e) {
      setError(e.message || "Could not create report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button onClick={onCancel} style={{ background: "none", border: "none", color: C.oak, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 18, fontWeight: 500 }}>← All Opening Reports</button>
      <Title sub="Create the report shell. The compliance checklist, photos and confirmation are filled in next.">New Opening Report</Title>

      <Card>
        <SectionHeader n="1" title="Identification" sub="Where, when, and who is filling this in" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div>
            <FormLabel required>Partner name</FormLabel>
            <input value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} placeholder="e.g. Magasin" style={inputStyle} />
          </div>
          <div>
            <FormLabel required>Location</FormLabel>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Lyngby" style={inputStyle} />
          </div>
          <div>
            <FormLabel>Sqm</FormLabel>
            <input type="number" min="0" value={form.sqm} onChange={(e) => setForm({ ...form, sqm: e.target.value })} placeholder="m²" style={inputStyle} />
          </div>
          <div>
            <FormLabel>Opening date</FormLabel>
            <input type="date" value={form.openingDate} onChange={(e) => setForm({ ...form, openingDate: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <FormLabel required>Completed by (your name)</FormLabel>
            <input value={form.completedByName} onChange={(e) => setForm({ ...form, completedByName: e.target.value })} placeholder="Full name" style={inputStyle} />
          </div>
        </div>
        {error && <div style={{ marginTop: 14, padding: "10px 14px", background: "#FBE5E1", borderLeft: `3px solid ${C.nogo}`, borderRadius: 4, fontSize: 12, color: C.nogo }}>{error}</div>}
        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button onClick={submit} disabled={!canSubmit || busy} style={{ padding: "10px 18px", background: !canSubmit || busy ? C.steelL : C.black, color: C.white, border: "none", borderRadius: 6, cursor: !canSubmit || busy ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500 }}>
            {busy ? "Creating…" : "Create report"}
          </button>
          <button onClick={onCancel} style={{ padding: "10px 18px", background: C.white, color: C.text, border: `1px solid ${C.surfaceD}`, borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
            Cancel
          </button>
        </div>
      </Card>
    </div>
  );
}

// ─── Photo slot ───────────────────────────────────────────────────────────────
function PhotoSlot({ report, slot, photos, onChanged }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const slotPhotos = photos.filter((p) => p.slot === slot.id);

  const uploadFile = async (file, { replace }) => {
    setBusy(true); setError(null);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const pathname = `${report.blobPrefix}${slot.id}/${Date.now()}-${safeName}`;
      const result = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: `/api/opening-reports/${report.reportUrlSlug}/photos/upload-url`,
        contentType: file.type || "image/jpeg",
      });
      const r = await fetch(`/api/opening-reports/${report.reportUrlSlug}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot: slot.id,
          slotOrder: slotPhotos.length,
          originalName: file.name,
          blobUrl: result.url,
          blobPath: result.pathname,
          replace,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Save failed (${r.status})`);
      }
      await onChanged();
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const onSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file, { replace: !slot.multiple });
    e.target.value = "";
  };

  const onDelete = async (photo) => {
    if (!confirm(`Remove ${slot.label}?`)) return;
    const r = await fetch(`/api/opening-reports/${report.reportUrlSlug}/photos/${photo.id}`, { method: "DELETE" });
    if (r.ok) await onChanged();
  };

  return (
    <div style={{ border: `1px solid ${C.surfaceD}`, borderRadius: 8, padding: 14, background: C.white }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{slot.label}{slot.required && <span style={{ color: C.nogo, marginLeft: 4 }}>*</span>}</div>
          <div style={{ fontSize: 11, color: C.textS, marginTop: 2 }}>{slot.multiple ? "Optional · multiple allowed" : "One photo · replacing re-uploads"}</div>
        </div>
        {slotPhotos.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: C.go, background: C.go + "1A", padding: "3px 8px", borderRadius: 4, letterSpacing: ".5px", textTransform: "uppercase" }}>{slotPhotos.length} uploaded</span>}
      </div>

      {slotPhotos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginBottom: 10 }}>
          {slotPhotos.map((p) => (
            <div key={p.id} style={{ position: "relative", borderRadius: 6, overflow: "hidden", aspectRatio: "4 / 3", border: `1px solid ${C.surfaceD}` }}>
              <img src={p.blobUrl} alt={slot.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <button onClick={() => onDelete(p)} style={{ position: "absolute", top: 6, right: 6, fontSize: 10, fontWeight: 600, padding: "3px 8px", background: "rgba(26,26,26,.7)", color: C.white, border: "none", borderRadius: 4, cursor: "pointer" }}>Remove</button>
            </div>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onSelect} />
      <button onClick={() => inputRef.current?.click()} disabled={busy} style={{ width: "100%", padding: "10px 14px", background: busy ? C.surface : C.surface, color: busy ? C.textS : C.text, border: `1.5px dashed ${C.surfaceD}`, borderRadius: 6, cursor: busy ? "wait" : "pointer", fontSize: 12, fontWeight: 500 }}>
        {busy ? "Uploading…" : slotPhotos.length === 0 ? `Upload ${slot.label.toLowerCase()}` : slot.multiple ? "Add another" : "Replace photo"}
      </button>
      {error && <div style={{ marginTop: 8, padding: "8px 12px", background: "#FBE5E1", borderLeft: `3px solid ${C.nogo}`, borderRadius: 4, fontSize: 11, color: C.nogo }}>{error}</div>}
    </div>
  );
}

// ─── Editor (rep) ─────────────────────────────────────────────────────────────
function ReportEditorView({ slug, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [error, setError] = useState(null);
  const saveTimer = useRef(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/opening-reports/${slug}`);
      if (!r.ok) throw new Error(`Load failed (${r.status})`);
      const d = await r.json();
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { refresh(); }, [refresh]);

  // Debounced autosave for fields + checkpoints.
  const queueSave = useCallback((patch) => {
    clearTimeout(saveTimer.current);
    setSaveStatus("dirty");
    saveTimer.current = setTimeout(async () => {
      setSaving(true); setSaveStatus("saving");
      try {
        const r = await fetch(`/api/opening-reports/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!r.ok) throw new Error(`Save failed (${r.status})`);
        const d = await r.json();
        setData(d);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus((s) => s === "saved" ? null : s), 1500);
      } catch (e) {
        setSaveStatus("error");
        setError(e.message);
      } finally {
        setSaving(false);
      }
    }, 600);
  }, [slug]);

  const updateField = (field, value) => {
    setData((prev) => prev ? { ...prev, report: { ...prev.report, [field]: value } } : prev);
    queueSave({ [field]: value });
  };

  const updateCheckpoint = (cpId, patch) => {
    setData((prev) => prev ? {
      ...prev,
      checkpoints: prev.checkpoints.map((c) => c.id === cpId ? { ...c, ...patch } : c),
    } : prev);
    queueSave({ checkpoints: [{ id: cpId, ...patch }] });
  };

  if (loading) return <Card><div style={{ padding: 20, textAlign: "center", color: C.textS, fontSize: 13 }}>Loading…</div></Card>;
  if (!data) return <Card><div style={{ padding: 20, color: C.nogo, fontSize: 13 }}>{error || "Report not found"}</div></Card>;

  const { report, checkpoints, photos } = data;
  const isApproved = report.status === "approved";
  const visibleCheckpoints = checkpoints.filter((cp) => isCheckpointApplicable(cp.checkpointNo, report.sqm));
  const tier1 = visibleCheckpoints.filter((c) => c.tier === 1);
  const tier2 = visibleCheckpoints.filter((c) => c.tier === 2);
  const deviationCount = visibleCheckpoints.filter((c) => c.result === "deviation").length;
  const tier1Complete = tier1.every((c) => c.result);
  const requiredPhotosPresent = PHOTO_SLOTS.filter((s) => s.required).every((s) => photos.some((p) => p.slot === s.id));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.oak, fontSize: 13, cursor: "pointer", padding: 0, fontWeight: 500 }}>← All Opening Reports</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saveStatus && (
            <span style={{ fontSize: 11, color: saveStatus === "error" ? C.nogo : C.textS }}>
              {saveStatus === "dirty" ? "Unsaved changes…" : saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save error" : ""}
            </span>
          )}
          <StatusPill status={report.status} />
          <button onClick={() => openOpeningReportPdf(data)} style={{ padding: "8px 14px", background: C.white, color: C.text, border: `1px solid ${C.surfaceD}`, borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
            Export PDF
          </button>
        </div>
      </div>

      <Title sub={`${report.partnerName} · ${report.location}${report.sqm ? ` · ${report.sqm} m²` : ""}`}>{report.partnerName}</Title>

      {/* Section 1 — Identification */}
      <Card style={{ marginBottom: 18, opacity: isApproved ? 0.7 : 1 }}>
        <SectionHeader n="1" title="Identification" sub="Where, when, and who" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
          <div>
            <FormLabel required>Partner</FormLabel>
            <input disabled={isApproved} value={report.partnerName || ""} onChange={(e) => updateField("partnerName", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <FormLabel required>Location</FormLabel>
            <input disabled={isApproved} value={report.location || ""} onChange={(e) => updateField("location", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <FormLabel>Sqm</FormLabel>
            <input disabled={isApproved} type="number" min="0" value={report.sqm ?? ""} onChange={(e) => updateField("sqm", e.target.value ? Number(e.target.value) : null)} style={inputStyle} />
          </div>
          <div>
            <FormLabel>Opening date</FormLabel>
            <input disabled={isApproved} type="date" value={report.openingDate || ""} onChange={(e) => updateField("openingDate", e.target.value || null)} style={inputStyle} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <FormLabel required>Completed by</FormLabel>
            <input disabled={isApproved} value={report.completedByName || ""} onChange={(e) => updateField("completedByName", e.target.value)} style={inputStyle} />
          </div>
        </div>
      </Card>

      {/* Section 2 — Responsibility */}
      <Card style={{ marginBottom: 18, opacity: isApproved ? 0.7 : 1 }}>
        <SectionHeader n="2" title="Responsibility on shopfloor" sub="Who at the partner is in control of the SIS" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
          <div>
            <FormLabel>Shopfloor responsible</FormLabel>
            <input disabled={isApproved} value={report.shopfloorResponsible || ""} onChange={(e) => updateField("shopfloorResponsible", e.target.value)} placeholder="Name + role" style={inputStyle} />
          </div>
          <div>
            <FormLabel>Contact</FormLabel>
            <input disabled={isApproved} value={report.responsibleContact || ""} onChange={(e) => updateField("responsibleContact", e.target.value)} placeholder="Email or phone" style={inputStyle} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <FormLabel>Responsibility takes effect</FormLabel>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { id: "at_opening", label: "At opening" },
                { id: "at_first_visit", label: "At first visit" },
              ].map((opt) => (
                <button key={opt.id} disabled={isApproved} onClick={() => updateField("responsibilityWhen", report.responsibilityWhen === opt.id ? null : opt.id)} style={{ padding: "8px 14px", borderRadius: 6, border: `1px solid ${report.responsibilityWhen === opt.id ? C.oak : C.surfaceD}`, background: report.responsibilityWhen === opt.id ? C.oak + "15" : C.white, color: report.responsibilityWhen === opt.id ? C.text : C.textS, fontSize: 12, fontWeight: 500, cursor: isApproved ? "not-allowed" : "pointer" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Section 3 — Compliance */}
      <Card style={{ marginBottom: 18, opacity: isApproved ? 0.85 : 1 }}>
        <SectionHeader n="3" title="Compliance checklist" sub={`Tier 1 (must verify) + Tier 2 (note if visible). ${tier1Complete ? "Tier 1 complete." : `${tier1.filter((c) => !c.result).length} Tier 1 not yet answered.`}`} />

        <CheckpointGroup title="Tier 1 — Must verify on site" checkpoints={tier1} disabled={isApproved} onChange={updateCheckpoint} />
        <CheckpointGroup title="Tier 2 — Note if visible" checkpoints={tier2} disabled={isApproved} onChange={updateCheckpoint} muted />
        {report.sqm != null && report.sqm < 50 && (
          <div style={{ marginTop: 10, fontSize: 11, color: C.textS, fontStyle: "italic" }}>
            Checkpoint #15 (Category Zoning) is hidden because sqm is below 50.
          </div>
        )}
      </Card>

      {/* Section 4 — Photos */}
      <Card style={{ marginBottom: 18, opacity: isApproved ? 0.85 : 1 }}>
        <SectionHeader n="4" title="Photos" sub="Fixed slots in display order, plus additional extras" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
          {PHOTO_SLOTS.map((s) => (
            <PhotoSlot key={s.id} report={report} slot={s} photos={photos} onChanged={refresh} />
          ))}
        </div>
        {!requiredPhotosPresent && (
          <div style={{ marginTop: 12, fontSize: 12, color: C.warn }}>Required photos missing — Brand Spaces will see this in the review.</div>
        )}
      </Card>

      {/* Section 5 — Deviations + Follow-up */}
      <Card style={{ marginBottom: 18, opacity: isApproved ? 0.7 : 1 }}>
        <SectionHeader n="5" title="Deviations & follow-up" sub="Auto-collected from the checklist. Mark if follow-up is needed." />
        <div style={{ marginTop: 10, padding: "12px 16px", background: deviationCount > 0 ? "#FBE5E1" : "#E8F2EA", borderLeft: `3px solid ${deviationCount > 0 ? C.nogo : C.go}`, borderRadius: 4, fontSize: 12, color: deviationCount > 0 ? C.nogo : C.go }}>
          {deviationCount === 0 ? "No deviations flagged." : `${deviationCount} deviation${deviationCount === 1 ? "" : "s"} flagged. Deviations do not block submission — Brand Spaces decides.`}
        </div>
        {deviationCount > 0 && (
          <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 12, color: C.text, lineHeight: 1.7 }}>
            {visibleCheckpoints.filter((c) => c.result === "deviation").map((c) => (
              <li key={c.id}><strong>#{c.checkpointNo}.</strong> {c.title}{c.comment && <em style={{ color: C.textS }}> — {c.comment}</em>}</li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <input id="followup" type="checkbox" disabled={isApproved} checked={!!report.followUpNeeded} onChange={(e) => updateField("followUpNeeded", e.target.checked)} />
          <label htmlFor="followup" style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>Follow-up needed</label>
        </div>
        {report.followUpNeeded && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
            <div>
              <FormLabel>Owner</FormLabel>
              <input disabled={isApproved} value={report.followUpOwner || ""} onChange={(e) => updateField("followUpOwner", e.target.value)} placeholder="Who follows up" style={inputStyle} />
            </div>
            <div>
              <FormLabel>Deadline</FormLabel>
              <input disabled={isApproved} type="date" value={report.followUpDeadline || ""} onChange={(e) => updateField("followUpDeadline", e.target.value || null)} style={inputStyle} />
            </div>
          </div>
        )}
      </Card>

      {/* Section 6 — Confirmation / Approval */}
      <Card>
        <SectionHeader n="6" title="Confirmation" sub={isApproved ? "Reviewed and approved by Brand Spaces" : "Submitted by the sales rep — awaiting Brand Spaces review"} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12, fontSize: 13 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Submitted by</div>
            <div style={{ color: C.text }}>{report.completedByName}</div>
            <div style={{ fontSize: 11, color: C.textS, marginTop: 2 }}>{fmtDate(report.submittedAt)}</div>
          </div>
          {isApproved && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.success, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Approved by</div>
              <div style={{ color: C.text }}>{report.approvedByName}</div>
              <div style={{ fontSize: 11, color: C.textS, marginTop: 2 }}>{fmtDate(report.approvedAt)}</div>
              {report.approvalNote && <div style={{ fontSize: 12, color: C.textS, marginTop: 6, fontStyle: "italic" }}>"{report.approvalNote}"</div>}
            </div>
          )}
        </div>
        {!isApproved && <ApprovalControls slug={slug} onApproved={refresh} />}
      </Card>
    </div>
  );
}

function CheckpointGroup({ title, checkpoints, disabled, onChange, muted }) {
  if (!checkpoints.length) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: muted ? C.textS : C.text, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checkpoints.map((cp) => <CheckpointRow key={cp.id} cp={cp} disabled={disabled} onChange={onChange} />)}
      </div>
    </div>
  );
}

function CheckpointRow({ cp, disabled, onChange }) {
  const results = [
    { id: "ok", label: "OK", c: C.go },
    { id: "deviation", label: "Deviation", c: C.nogo },
    { id: "na", label: "N/A", c: C.steel },
  ];
  const isDeviation = cp.result === "deviation";
  return (
    <div style={{ padding: "12px 14px", border: `1px solid ${isDeviation ? C.nogo + "55" : C.surfaceD}`, borderRadius: 6, background: isDeviation ? "#FBE5E110" : C.white }}>
      <div style={{ display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, fontFamily: "'DM Mono',monospace" }}>{cp.checkpointNo}</div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{cp.title}</div>
        <div style={{ display: "flex", gap: 6 }}>
          {results.map((r) => {
            const active = cp.result === r.id;
            return (
              <button key={r.id} disabled={disabled} onClick={() => onChange(cp.id, { result: active ? null : r.id })} style={{ padding: "6px 12px", borderRadius: 4, border: `1px solid ${active ? r.c : C.surfaceD}`, background: active ? r.c + "1A" : C.white, color: active ? r.c : C.textS, fontSize: 11, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", cursor: disabled ? "not-allowed" : "pointer" }}>
                {r.label}
              </button>
            );
          })}
        </div>
      </div>
      {(cp.comment || isDeviation) && (
        <div style={{ marginTop: 10 }}>
          <input disabled={disabled} value={cp.comment || ""} onChange={(e) => onChange(cp.id, { comment: e.target.value })} placeholder={isDeviation ? "Describe the deviation" : "Optional comment"} style={{ ...inputStyle, fontSize: 12 }} />
        </div>
      )}
      {!cp.comment && !isDeviation && (
        <button disabled={disabled} onClick={() => onChange(cp.id, { comment: " " })} style={{ marginTop: 8, fontSize: 11, color: C.oak, background: "none", border: "none", padding: 0, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 500 }}>+ Add comment</button>
      )}
    </div>
  );
}

function ApprovalControls({ slug, onApproved }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const approve = async () => {
    if (!name.trim()) { setError("Your name is required"); return; }
    setBusy(true); setError(null);
    try {
      const r = await fetch(`/api/opening-reports/${slug}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedByName: name.trim(), approvalNote: note.trim() || null }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Approve failed (${r.status})`);
      }
      await onApproved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div style={{ marginTop: 18 }}>
        <button onClick={() => setOpen(true)} style={{ padding: "10px 18px", background: C.success, color: C.white, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          Brand Spaces approval →
        </button>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 18, padding: 16, background: C.surface, borderRadius: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Brand Spaces approval</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <FormLabel required>Your name</FormLabel>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FormLabel>Note (optional)</FormLabel>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Brief note for the record" style={inputStyle} />
        </div>
      </div>
      {error && <div style={{ marginTop: 10, fontSize: 12, color: C.nogo }}>{error}</div>}
      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        <button onClick={approve} disabled={busy} style={{ padding: "10px 18px", background: busy ? C.steelL : C.success, color: C.white, border: "none", borderRadius: 6, cursor: busy ? "wait" : "pointer", fontSize: 13, fontWeight: 500 }}>
          {busy ? "Approving…" : "Confirm approval"}
        </button>
        <button onClick={() => setOpen(false)} disabled={busy} style={{ padding: "10px 18px", background: C.white, color: C.text, border: `1px solid ${C.surfaceD}`, borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Outer page ───────────────────────────────────────────────────────────────
export default function OpeningReportsPage() {
  const [view, setView] = useState({ name: "list" });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/opening-reports");
      if (r.ok) {
        const d = await r.json();
        setReports(d.reports || []);
      }
    } catch (e) {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (view.name === "list") loadList(); }, [view, loadList]);

  if (view.name === "create") {
    return <CreateReportView onCancel={() => setView({ name: "list" })} onCreated={(r) => setView({ name: "editor", slug: r.reportUrlSlug })} />;
  }
  if (view.name === "editor") {
    return <ReportEditorView slug={view.slug} onBack={() => setView({ name: "list" })} />;
  }
  return <ReportsListView reports={reports} loading={loading} onCreate={() => setView({ name: "create" })} onOpen={(r) => setView({ name: "editor", slug: r.reportUrlSlug })} />;
}
