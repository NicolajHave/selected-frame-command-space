"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { generateFilename } from "../../lib/showroom-ops/filename";
import { exportToXlsx, parseRegistryWorkbook } from "./xlsx";

const C = {
  steel: "#8A8D8F", steelL: "#B8BBBE", steelD: "#5C5F61",
  oak: "#C4944A", surface: "#F5F4F1", surfaceD: "#ECEAE5",
  white: "#FFFFFF", black: "#1A1A1A", text: "#2C2C2C", textS: "#6B6B6B",
  go: "#4A7C5C", warn: "#D4A843", nogo: "#C75B4A", success: "#5A8F6A", blue: "#4186E0",
};

const SCOPES = ["LOCAL_SHOWROOMS", "BRANDE_SHOWROOM", "PERFECT_SHOWROOM", "CREATIVE_SHOWROOM", "DACH_SHOWROOM", "FOYER", "INSTORE"];
const SCOPE_LABEL = {
  LOCAL_SHOWROOMS: "Local Showrooms", BRANDE_SHOWROOM: "Brande Showroom", PERFECT_SHOWROOM: "Perfect Showroom",
  CREATIVE_SHOWROOM: "Creative Showroom", DACH_SHOWROOM: "DACH Showroom", FOYER: "Foyer", INSTORE: "Instore",
};
const GENDERS = ["MEN", "WOMEN", "UNISEX"];
const LINE_STATUSES = ["DRAFT", "BRIEFED", "IN_PROGRESS", "FINAL", "RELEASED", "ORDERED"];
const STATUS_COLOR = {
  DRAFT: C.steel, BRIEFED: C.blue, IN_PROGRESS: C.warn, FINAL: C.success, RELEASED: C.oak, ORDERED: C.black,
};
const DELIVERY_LABEL = {
  PHYSICAL_PACKAGE: "Physical package", PDF_FILES_ONLY: "PDF only",
  PHYSICAL_PLUS_PDF: "Physical + PDF", INTERNAL_DIRECT: "Internal direct",
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtPrice = (n) => (n == null || n === "") ? "—" : `${Number(n).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// ─── Shared primitives ──────────────────────────────────────────────────────
const Title = ({ children, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontSize: 22, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{children}</h2>
    {sub && <p style={{ fontSize: 13, color: C.textS, margin: "4px 0 0" }}>{sub}</p>}
  </div>
);
const Card = ({ children, style }) => <div style={{ background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 10, padding: 22, ...style }}>{children}</div>;
const Eyebrow = ({ children }) => <div style={{ fontSize: 9, fontWeight: 700, color: C.oak, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>{children}</div>;
const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.surfaceD}`, fontSize: 13, outline: "none", background: C.white, color: C.text, fontFamily: "inherit" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 };
const btnDark = { padding: "9px 16px", background: C.black, color: C.white, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 };
const btnLight = { padding: "9px 16px", background: C.white, color: C.text, border: `1px solid ${C.surfaceD}`, borderRadius: 6, cursor: "pointer", fontSize: 13 };

const Pill = ({ children, color }) => <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color, background: color + "1A", padding: "3px 8px", borderRadius: 4, letterSpacing: ".5px", textTransform: "uppercase", border: `1px solid ${color}33` }}>{children}</span>;

function SubNav({ tab, setTab }) {
  const tabs = [
    ["dashboard", "Season Dashboard"], ["graphics", "Graphics Queue"],
    ["purchasing", "Purchasing Export"], ["shipping", "Shipping List"], ["registry", "Registry Admin"],
  ];
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${C.surfaceD}`, flexWrap: "wrap" }}>
      {tabs.map(([k, l]) => (
        <div key={k} onClick={() => setTab(k)} style={{ padding: "10px 18px", cursor: "pointer", fontSize: 13, fontWeight: tab === k ? 600 : 400, color: tab === k ? C.text : C.textS, borderBottom: tab === k ? `2px solid ${C.oak}` : "2px solid transparent", marginBottom: -1 }}>{l}</div>
      ))}
    </div>
  );
}

// Notice shown when DB/schema isn't ready.
function ConfigNotice({ message }) {
  return (
    <Card style={{ borderColor: C.warn + "55", background: "#FDF8EE" }}>
      <Eyebrow>Setup required</Eyebrow>
      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{message}</div>
    </Card>
  );
}

// ─── Season selector (shared across season-scoped tabs) ──────────────────────
function SeasonSelector({ seasons, selectedId, onSelect }) {
  return (
    <select value={selectedId || ""} onChange={(e) => onSelect(e.target.value || null)} style={{ ...inputStyle, width: "auto", minWidth: 200, background: C.white }}>
      <option value="">— Select season —</option>
      {seasons.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.status}</option>)}
    </select>
  );
}

// ─── Season Dashboard ────────────────────────────────────────────────────────
function SeasonDashboard({ seasons, reloadSeasons, selectedId, setSelectedId, materials }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!selectedId) { setDetail(null); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/showroom-ops/seasons/${selectedId}`);
      if (r.ok) setDetail(await r.json());
    } finally { setLoading(false); }
  }, [selectedId]);
  useEffect(() => { loadDetail(); }, [loadDetail]);

  const linesByScope = useMemo(() => {
    const m = {};
    for (const sc of SCOPES) m[sc] = [];
    for (const l of (detail?.lines || [])) (m[l.scope] || (m[l.scope] = [])).push(l);
    return m;
  }, [detail]);

  const sprints = useMemo(() => {
    const set = new Set();
    for (const l of (detail?.lines || [])) if (l.sprint) set.add(l.sprint);
    return [...set].sort();
  }, [detail]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SeasonSelector seasons={seasons} selectedId={selectedId} onSelect={setSelectedId} />
          {selectedId && <button onClick={() => setShowDuplicate(true)} style={btnLight}>Duplicate season →</button>}
        </div>
        <button onClick={() => setShowCreate(true)} style={btnDark}>+ New season</button>
      </div>

      {showCreate && <SeasonForm onClose={() => setShowCreate(false)} onSaved={async (s) => { setShowCreate(false); await reloadSeasons(); setSelectedId(s.id); }} />}
      {showDuplicate && detail && <DuplicateForm source={detail.season} onClose={() => setShowDuplicate(false)} onSaved={async (s) => { setShowDuplicate(false); await reloadSeasons(); setSelectedId(s.id); }} />}

      {!selectedId ? (
        <Card><div style={{ fontSize: 13, color: C.textS }}>Select a season, or create one. A new season is best started by duplicating the previous one — lines copy across with status reset to DRAFT.</div></Card>
      ) : loading || !detail ? (
        <Card><div style={{ padding: 20, textAlign: "center", color: C.textS, fontSize: 13 }}>Loading…</div></Card>
      ) : (
        <div>
          <SeasonHeader season={detail.season} onChanged={loadDetail} />

          {/* Status board per sprint */}
          <Card style={{ marginTop: 18 }}>
            <Eyebrow>Status board</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 10, marginTop: 8 }}>
              {LINE_STATUSES.map((st) => {
                const count = (detail.lines || []).filter((l) => l.status === st).length;
                return <div key={st} style={{ padding: "12px 14px", background: C.surface, borderRadius: 8, borderTop: `3px solid ${STATUS_COLOR[st]}` }}>
                  <div style={{ fontSize: 24, fontWeight: 300, fontFamily: "'Cormorant Garamond',serif", color: C.text }}>{count}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px" }}>{st.replace("_", " ")}</div>
                </div>;
              })}
            </div>
            {sprints.length > 0 && <div style={{ marginTop: 12, fontSize: 12, color: C.textS }}>Sprints in play: {sprints.join(", ")}</div>}
          </Card>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0 12px" }}>
            <div style={{ fontSize: 16, fontWeight: 500, fontFamily: "'Cormorant Garamond',serif", color: C.text }}>Lines by scope</div>
            <button onClick={() => setShowAddLine(true)} style={btnDark}>+ Add line</button>
          </div>

          {showAddLine && <LineForm seasonId={selectedId} season={detail.season} materials={materials} onClose={() => setShowAddLine(false)} onSaved={async () => { setShowAddLine(false); await loadDetail(); }} />}

          {SCOPES.filter((sc) => linesByScope[sc]?.length).map((sc) => (
            <div key={sc} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{SCOPE_LABEL[sc]} <span style={{ color: C.textS }}>({linesByScope[sc].length})</span></div>
              <LinesTable lines={linesByScope[sc]} materials={materials} season={detail.season} onChanged={loadDetail} />
            </div>
          ))}
          {!(detail.lines || []).length && <Card><div style={{ fontSize: 13, color: C.textS }}>No lines yet. Add the first print/digital item for this season.</div></Card>}
        </div>
      )}
    </div>
  );
}

function SeasonHeader({ season, onChanged }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(season);
  useEffect(() => setForm(season), [season]);
  const save = async () => {
    await fetch(`/api/showroom-ops/seasons/${season.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setEdit(false); await onChanged();
  };
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <Eyebrow>Season</Eyebrow>
          <div style={{ fontSize: 24, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond',serif" }}>{season.name}</div>
          <div style={{ fontSize: 12, color: C.textS, marginTop: 2, fontFamily: "'DM Mono',monospace" }}>{season.code}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Pill color={STATUS_COLOR[season.status] || C.steel}>{season.status}</Pill>
          <button onClick={() => setEdit((v) => !v)} style={btnLight}>{edit ? "Cancel" : "Edit"}</button>
        </div>
      </div>
      {edit ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {[["name", "Name"], ["code", "Code"]].map(([k, l]) => <div key={k}><label style={labelStyle}>{l}</label><input value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} style={inputStyle} /></div>)}
          <div><label style={labelStyle}>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>{["PLANNING", "IN_PRODUCTION", "SHIPPED", "CLOSED"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label style={labelStyle}>Order date (files ready)</label><input type="date" value={form.orderDate || ""} onChange={(e) => setForm({ ...form, orderDate: e.target.value || null })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Delivery date</label><input type="date" value={form.deliveryDate || ""} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value || null })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Invoicing</label><input value={form.invoicing || ""} onChange={(e) => setForm({ ...form, invoicing: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Costcenter MEN</label><input value={form.costcenterMen || ""} onChange={(e) => setForm({ ...form, costcenterMen: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Costcenter WOMEN</label><input value={form.costcenterWomen || ""} onChange={(e) => setForm({ ...form, costcenterWomen: e.target.value })} style={inputStyle} /></div>
          <div style={{ gridColumn: "1 / -1" }}><button onClick={save} style={btnDark}>Save season</button></div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, fontSize: 13 }}>
          {[["Order date", fmtDate(season.orderDate)], ["Delivery", fmtDate(season.deliveryDate)], ["Invoicing", season.invoicing || "—"], ["Costcenter MEN", season.costcenterMen || "—"], ["Costcenter WOMEN", season.costcenterWomen || "—"]].map(([l, v]) => (
            <div key={l}><div style={{ fontSize: 10, fontWeight: 600, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>{l}</div><div style={{ color: C.text }}>{v}</div></div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,26,26,.4)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px", zIndex: 100, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.white, borderRadius: 12, padding: 28, width: "100%", maxWidth: 640, boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 500, fontFamily: "'Cormorant Garamond',serif", color: C.text }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.textS }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SeasonForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", code: "", orderDate: "", deliveryDate: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const save = async () => {
    if (!form.name || !form.code) { setError("Name and code are required"); return; }
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/showroom-ops/seasons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      onSaved((await r.json()).season);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal title="New season" onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div><label style={labelStyle}>Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="SPRING 27" style={inputStyle} /></div>
        <div><label style={labelStyle}>Code *</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SPRING27" style={inputStyle} /></div>
        <div><label style={labelStyle}>Order date</label><input type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} style={inputStyle} /></div>
        <div><label style={labelStyle}>Delivery date</label><input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} style={inputStyle} /></div>
      </div>
      {error && <div style={{ marginTop: 12, fontSize: 12, color: C.nogo }}>{error}</div>}
      <div style={{ marginTop: 18, display: "flex", gap: 10 }}><button onClick={save} disabled={busy} style={btnDark}>{busy ? "Creating…" : "Create season"}</button><button onClick={onClose} style={btnLight}>Cancel</button></div>
    </Modal>
  );
}

function DuplicateForm({ source, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", code: "", orderDate: "", deliveryDate: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const save = async () => {
    if (!form.name || !form.code) { setError("Name and code are required"); return; }
    setBusy(true); setError(null);
    try {
      const r = await fetch(`/api/showroom-ops/seasons/${source.id}/duplicate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      onSaved((await r.json()).season);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal title={`Duplicate "${source.name}"`} onClose={onClose}>
      <div style={{ fontSize: 12, color: C.textS, marginBottom: 14, lineHeight: 1.6 }}>Copies participating showrooms and all lines into a new season. Every line's status resets to <strong>DRAFT</strong>. Header costcenters and invoicing carry over.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div><label style={labelStyle}>New name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AUTUMN 27" style={inputStyle} /></div>
        <div><label style={labelStyle}>New code *</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="AUTUMN27" style={inputStyle} /></div>
        <div><label style={labelStyle}>Order date</label><input type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} style={inputStyle} /></div>
        <div><label style={labelStyle}>Delivery date</label><input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} style={inputStyle} /></div>
      </div>
      {error && <div style={{ marginTop: 12, fontSize: 12, color: C.nogo }}>{error}</div>}
      <div style={{ marginTop: 18, display: "flex", gap: 10 }}><button onClick={save} disabled={busy} style={btnDark}>{busy ? "Duplicating…" : "Duplicate"}</button><button onClick={onClose} style={btnLight}>Cancel</button></div>
    </Modal>
  );
}

function LineForm({ seasonId, season, materials, onClose, onSaved, line }) {
  const editing = !!line;
  const [form, setForm] = useState(line || {
    scope: "LOCAL_SHOWROOMS", gender: "UNISEX", materialId: "", freeTextName: "", motifTitle: "",
    formatOverride: "", colourOverride: "", qualityOverride: "", motives: "", amount: "", sprint: "",
    responsible: "", copyBrief: "", remarks: "", filename: "", status: "DRAFT", price: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const isFreeText = !form.materialId;
  const material = materials.find((m) => m.id === form.materialId);

  const previewName = useMemo(() => {
    const slug = material?.filenameSlug || material?.name || form.freeTextName || "";
    const fmt = form.formatOverride || material?.defaultFormat || "";
    const isDigital = (material?.category || "").toUpperCase() === "DIGITAL";
    return generateFilename({ gender: form.gender, seasonCode: season.code, scope: form.scope, materialSlug: slug, format: fmt, isDigital });
  }, [material, form.freeTextName, form.formatOverride, form.gender, form.scope, season.code]);

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const payload = { ...form, materialId: form.materialId || null, motives: form.motives ? Number(form.motives) : null, price: form.price ? Number(form.price) : null };
      if (!editing && !payload.filename) payload.filename = previewName;
      const url = editing ? `/api/showroom-ops/lines/${line.id}` : `/api/showroom-ops/seasons/${seasonId}/lines`;
      const r = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      onSaved();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal title={editing ? "Edit line" : "Add line"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div><label style={labelStyle}>Scope</label><select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} style={inputStyle}>{SCOPES.map((s) => <option key={s} value={s}>{SCOPE_LABEL[s]}</option>)}</select></div>
        <div><label style={labelStyle}>Gender</label><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={inputStyle}>{GENDERS.map((g) => <option key={g}>{g}</option>)}</select></div>
        <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Material (catalog)</label><select value={form.materialId || ""} onChange={(e) => setForm({ ...form, materialId: e.target.value })} style={inputStyle}><option value="">— Free-text one-off —</option>{materials.map((m) => <option key={m.id} value={m.id}>{m.code ? `${m.code} · ` : ""}{m.name}</option>)}</select></div>
        {isFreeText && <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>One-off product name</label><input value={form.freeTextName || ""} onChange={(e) => setForm({ ...form, freeTextName: e.target.value })} placeholder="e.g. Kodak floor foil" style={inputStyle} /></div>}
        <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Motif title</label><input value={form.motifTitle || ""} onChange={(e) => setForm({ ...form, motifTitle: e.target.value })} placeholder="Elevated Jersey" style={inputStyle} /></div>
        <div><label style={labelStyle}>Format {material?.defaultFormat ? <span style={{ color: C.steel }}>(def. {material.defaultFormat})</span> : ""}</label><input value={form.formatOverride || ""} onChange={(e) => setForm({ ...form, formatOverride: e.target.value })} placeholder={material?.defaultFormat || "300 x 420 mm"} style={inputStyle} /></div>
        <div><label style={labelStyle}>Colour {material?.defaultColour ? <span style={{ color: C.steel }}>(def. {material.defaultColour})</span> : ""}</label><input value={form.colourOverride || ""} onChange={(e) => setForm({ ...form, colourOverride: e.target.value })} placeholder={material?.defaultColour || "4+4"} style={inputStyle} /></div>
        <div><label style={labelStyle}>Quality {material?.defaultQuality ? <span style={{ color: C.steel }}>(def.)</span> : ""}</label><input value={form.qualityOverride || ""} onChange={(e) => setForm({ ...form, qualityOverride: e.target.value })} placeholder={material?.defaultQuality || "3 mm skiltekarton"} style={inputStyle} /></div>
        <div><label style={labelStyle}>Motives</label><input type="number" value={form.motives ?? ""} onChange={(e) => setForm({ ...form, motives: e.target.value })} style={inputStyle} /></div>
        <div><label style={labelStyle}>Amount</label><input value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="37 stk." style={inputStyle} /></div>
        <div><label style={labelStyle}>Sprint</label><input value={form.sprint || ""} onChange={(e) => setForm({ ...form, sprint: e.target.value })} placeholder="Sprint 1" style={inputStyle} /></div>
        <div><label style={labelStyle}>Responsible</label><input value={form.responsible || ""} onChange={(e) => setForm({ ...form, responsible: e.target.value })} style={inputStyle} /></div>
        <div><label style={labelStyle}>Price</label><input type="number" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} /></div>
        <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Copy brief (short note only)</label><input value={form.copyBrief || ""} onChange={(e) => setForm({ ...form, copyBrief: e.target.value })} style={inputStyle} /></div>
        <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Remarks</label><input value={form.remarks || ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} style={inputStyle} /></div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Filename {editing ? "" : "(auto)"}</label>
          <input value={editing ? (form.filename || "") : previewName} onChange={(e) => setForm({ ...form, filename: e.target.value })} style={{ ...inputStyle, fontFamily: "'DM Mono',monospace", fontSize: 11 }} />
          {!editing && <div style={{ fontSize: 11, color: C.textS, marginTop: 4 }}>Generated from gender + season + scope + material + format. Editable after creation.</div>}
        </div>
      </div>
      {error && <div style={{ marginTop: 12, fontSize: 12, color: C.nogo }}>{error}</div>}
      <div style={{ marginTop: 18, display: "flex", gap: 10 }}><button onClick={save} disabled={busy} style={btnDark}>{busy ? "Saving…" : editing ? "Save line" : "Add line"}</button><button onClick={onClose} style={btnLight}>Cancel</button></div>
    </Modal>
  );
}

function LinesTable({ lines, materials, season, onChanged }) {
  const [editLine, setEditLine] = useState(null);
  const matById = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);
  const advance = async (line) => {
    const idx = LINE_STATUSES.indexOf(line.status);
    if (idx < 0 || idx >= LINE_STATUSES.length - 1) return;
    await fetch(`/api/showroom-ops/lines/${line.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: LINE_STATUSES[idx + 1] }) });
    await onChanged();
  };
  const remove = async (line) => {
    if (!confirm("Delete this line?")) return;
    await fetch(`/api/showroom-ops/lines/${line.id}`, { method: "DELETE" });
    await onChanged();
  };
  return (
    <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.surfaceD}`, overflow: "hidden" }}>
      {editLine && <LineForm seasonId={season.id} season={season} materials={materials} line={editLine} onClose={() => setEditLine(null)} onSaved={async () => { setEditLine(null); await onChanged(); }} />}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr style={{ background: C.surface }}>{["Item", "Gender", "Motif", "Filename", "Amount", "Sprint", "Status", ""].map((h) => <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.surfaceD}` }}>{h}</th>)}</tr></thead>
        <tbody>
          {lines.map((l) => {
            const mat = l.materialId ? matById.get(l.materialId) : null;
            const product = mat?.name || l.freeTextName || "—";
            return (
              <tr key={l.id} style={{ borderBottom: `1px solid ${C.surfaceD}` }}>
                <td style={{ padding: "8px 12px" }}>
                  <div style={{ fontWeight: 500, color: C.text }}>{product}</div>
                  {!l.materialId && <span style={{ fontSize: 9, fontWeight: 700, color: C.oak, background: C.oak + "1A", padding: "1px 6px", borderRadius: 3, letterSpacing: ".5px" }}>ONE-OFF</span>}
                </td>
                <td style={{ padding: "8px 12px" }}>{l.gender}</td>
                <td style={{ padding: "8px 12px", color: C.textS }}>{l.motifTitle || "—"}</td>
                <td style={{ padding: "8px 12px", fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textS, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.filename}>{l.filename || "—"}</td>
                <td style={{ padding: "8px 12px" }}>{l.amount || "—"}</td>
                <td style={{ padding: "8px 12px" }}>{l.sprint || "—"}</td>
                <td style={{ padding: "8px 12px" }}><Pill color={STATUS_COLOR[l.status] || C.steel}>{l.status.replace("_", " ")}</Pill></td>
                <td style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                  {LINE_STATUSES.indexOf(l.status) < LINE_STATUSES.length - 1 && <button onClick={() => advance(l)} title="Advance status" style={{ ...btnLight, padding: "4px 8px", fontSize: 11, marginRight: 6 }}>→</button>}
                  <button onClick={() => setEditLine(l)} style={{ ...btnLight, padding: "4px 8px", fontSize: 11, marginRight: 6 }}>Edit</button>
                  <button onClick={() => remove(l)} style={{ padding: "4px 8px", fontSize: 11, color: C.nogo, background: "none", border: `1px solid ${C.surfaceD}`, borderRadius: 4, cursor: "pointer" }}>Del</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Graphics Queue ──────────────────────────────────────────────────────────
function GraphicsQueue({ seasons, selectedId, setSelectedId, materials }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const matById = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);

  const load = useCallback(async () => {
    if (!selectedId) { setDetail(null); return; }
    setLoading(true);
    try { const r = await fetch(`/api/showroom-ops/seasons/${selectedId}`); if (r.ok) setDetail(await r.json()); } finally { setLoading(false); }
  }, [selectedId]);
  useEffect(() => { load(); }, [load]);

  const queue = (detail?.lines || []).filter((l) => !["FINAL", "RELEASED", "ORDERED"].includes(l.status));
  const bySprint = useMemo(() => {
    const m = {};
    for (const l of queue) (m[l.sprint || "Unassigned"] || (m[l.sprint || "Unassigned"] = [])).push(l);
    return m;
  }, [detail]);

  const advance = async (line) => {
    const idx = LINE_STATUSES.indexOf(line.status);
    await fetch(`/api/showroom-ops/lines/${line.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: LINE_STATUSES[Math.min(idx + 1, LINE_STATUSES.length - 1)] }) });
    await load();
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}><SeasonSelector seasons={seasons} selectedId={selectedId} onSelect={setSelectedId} /></div>
      {!selectedId ? <Card><div style={{ fontSize: 13, color: C.textS }}>Select a season to see its graphics queue.</div></Card>
        : loading ? <Card><div style={{ padding: 20, textAlign: "center", color: C.textS, fontSize: 13 }}>Loading…</div></Card>
        : !queue.length ? <Card><div style={{ fontSize: 13, color: C.textS }}>Nothing in the queue — all lines are FINAL or beyond.</div></Card>
        : Object.entries(bySprint).sort().map(([sprint, lines]) => (
          <div key={sprint} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{sprint} <span style={{ color: C.textS }}>({lines.length})</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lines.map((l) => {
                const mat = l.materialId ? matById.get(l.materialId) : null;
                return (
                  <Card key={l.id} style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{mat?.name || l.freeTextName || "—"} {l.motifTitle && <span style={{ color: C.textS, fontWeight: 400 }}>· {l.motifTitle}</span>}</div>
                        <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: C.textS, marginTop: 4, wordBreak: "break-all" }}>{l.filename || "—"}</div>
                        <div style={{ fontSize: 12, color: C.textS, marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap" }}>
                          <span>Format: {l.formatOverride || mat?.defaultFormat || "—"}</span>
                          <span>Colour: {l.colourOverride || mat?.defaultColour || "—"}</span>
                          <span>Quality: {l.qualityOverride || mat?.defaultQuality || "—"}</span>
                          <span>{SCOPE_LABEL[l.scope]} · {l.gender}</span>
                        </div>
                        {l.copyBrief && <div style={{ fontSize: 12, color: C.text, marginTop: 6, fontStyle: "italic" }}>Copy: {l.copyBrief}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                        <Pill color={STATUS_COLOR[l.status]}>{l.status.replace("_", " ")}</Pill>
                        <button onClick={() => advance(l)} style={{ ...btnDark, padding: "6px 12px", fontSize: 12 }}>Advance →</button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── Purchasing Export ───────────────────────────────────────────────────────
function PurchasingExport({ seasons, selectedId, setSelectedId, materials }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const matById = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);

  const load = useCallback(async () => {
    if (!selectedId) { setDetail(null); return; }
    setLoading(true);
    try { const r = await fetch(`/api/showroom-ops/seasons/${selectedId}`); if (r.ok) setDetail(await r.json()); } finally { setLoading(false); }
  }, [selectedId]);
  useEffect(() => { load(); }, [load]);

  const rows = (detail?.lines || []).filter((l) => ["FINAL", "RELEASED", "ORDERED"].includes(l.status)).map((l) => {
    const mat = l.materialId ? matById.get(l.materialId) : null;
    return {
      product: mat?.name || l.freeTextName || "",
      format: l.formatOverride || mat?.defaultFormat || "",
      colour: l.colourOverride || mat?.defaultColour || "",
      quality: l.qualityOverride || mat?.defaultQuality || "",
      filename: l.filename || "",
      packing: mat?.defaultPacking || "",
      motives: l.motives ?? "",
      amount: l.amount || "",
      remarks: l.remarks || mat?.standardRemarks || "",
      price: l.price ?? "",
    };
  });

  const columns = [
    { header: "Product", key: "product" }, { header: "Format", key: "format" }, { header: "Colour", key: "colour" },
    { header: "Material/Quality", key: "quality" }, { header: "Filename", key: "filename" }, { header: "Packing", key: "packing" },
    { header: "Motives", key: "motives" }, { header: "Amount", key: "amount" }, { header: "Remarks", key: "remarks" }, { header: "Price", key: "price" },
  ];

  const doExport = async () => {
    await exportToXlsx({ filename: `${detail.season.code}_PURCHASING.xlsx`, sheetName: detail.season.code, columns, rows });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <SeasonSelector seasons={seasons} selectedId={selectedId} onSelect={setSelectedId} />
        {detail && <button onClick={doExport} disabled={!rows.length} style={{ ...btnDark, opacity: rows.length ? 1 : 0.5 }}>Export Excel ({rows.length})</button>}
      </div>
      {!selectedId ? <Card><div style={{ fontSize: 13, color: C.textS }}>Select a season to export FINAL / RELEASED lines for purchasing.</div></Card>
        : loading ? <Card><div style={{ padding: 20, textAlign: "center", color: C.textS, fontSize: 13 }}>Loading…</div></Card>
        : !rows.length ? <Card><div style={{ fontSize: 13, color: C.textS }}>No FINAL / RELEASED / ORDERED lines yet. Advance lines in the Graphics Queue first.</div></Card>
        : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: C.surface }}>{columns.map((c) => <th key={c.key} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.surfaceD}` }}>{c.header}</th>)}</tr></thead>
              <tbody>{rows.map((r, i) => <tr key={i} style={{ borderBottom: `1px solid ${C.surfaceD}` }}>{columns.map((c) => <td key={c.key} style={{ padding: "7px 10px", color: c.key === "filename" ? C.textS : C.text, fontFamily: c.key === "filename" ? "'DM Mono',monospace" : "inherit", fontSize: c.key === "filename" ? 10 : 12 }}>{c.key === "price" ? fmtPrice(r[c.key]) : (r[c.key] || "—")}</td>)}</tr>)}</tbody>
            </table>
          </Card>
        )}
    </div>
  );
}

// ─── Shipping List ───────────────────────────────────────────────────────────
function ShippingList({ seasons, selectedId, setSelectedId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState("ALL");

  const load = useCallback(async () => {
    if (!selectedId) { setData(null); return; }
    setLoading(true);
    try { const r = await fetch(`/api/showroom-ops/seasons/${selectedId}/shipping`); if (r.ok) setData(await r.json()); } finally { setLoading(false); }
  }, [selectedId]);
  useEffect(() => { load(); }, [load]);

  const rows = (data?.rows || []).filter((r) => gender === "ALL" || r.gender === gender);

  const columns = [
    { header: "Showroom", key: "showroom" }, { header: "Gender", key: "gender" }, { header: "Address", key: "address" },
    { header: "Zip", key: "zip" }, { header: "Country", key: "country" }, { header: "Customer No", key: "customerNo" },
    { header: "Delivery Type", key: "deliveryTypeLabel" }, { header: "Extras", key: "extras" }, { header: "Remarks", key: "remarks" },
    { header: "Special Handling", key: "specialHandling" },
  ];
  const exportRows = rows.map((r) => ({ ...r, deliveryTypeLabel: DELIVERY_LABEL[r.deliveryType] || r.deliveryType || "" }));

  const doExport = async () => {
    await exportToXlsx({ filename: `${data.season.code}_SHIPPING_${gender}.xlsx`, sheetName: `${data.season.code} ${gender}`, columns, rows: exportRows });
  };

  const rowTone = (r) => r.deliveryType === "PDF_FILES_ONLY" ? C.blue : r.deliveryType === "PHYSICAL_PLUS_PDF" ? C.oak : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <SeasonSelector seasons={seasons} selectedId={selectedId} onSelect={setSelectedId} />
          <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ ...inputStyle, width: "auto" }}>{["ALL", "MEN", "WOMEN"].map((g) => <option key={g} value={g}>{g === "ALL" ? "Both genders" : g}</option>)}</select>
        </div>
        {data && <button onClick={doExport} disabled={!rows.length} style={{ ...btnDark, opacity: rows.length ? 1 : 0.5 }}>Export Excel ({rows.length})</button>}
      </div>
      {!selectedId ? <Card><div style={{ fontSize: 13, color: C.textS }}>Select a season. The shipping list is generated automatically from participating showrooms — correct customer number per gender, no manual drift.</div></Card>
        : loading ? <Card><div style={{ padding: 20, textAlign: "center", color: C.textS, fontSize: 13 }}>Loading…</div></Card>
        : !rows.length ? <Card><div style={{ fontSize: 13, color: C.textS }}>No participating showrooms for this season/gender yet. Add showrooms to the season first (Registry Admin → assign to season is a v2 convenience; for now use the season_showrooms API).</div></Card>
        : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: C.surface }}>{columns.slice(0, 9).map((c) => <th key={c.key} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.surfaceD}` }}>{c.header}</th>)}</tr></thead>
              <tbody>{rows.map((r, i) => {
                const tone = rowTone(r);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.surfaceD}`, background: tone ? tone + "0D" : "transparent" }}>
                    <td style={{ padding: "7px 10px", fontWeight: 500 }}>{r.showroom}{r.status === "VERIFY" && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: C.warn }}>VERIFY</span>}</td>
                    <td style={{ padding: "7px 10px" }}>{r.gender}</td>
                    <td style={{ padding: "7px 10px", color: C.textS }}>{r.address || "—"}</td>
                    <td style={{ padding: "7px 10px" }}>{r.zip || "—"}</td>
                    <td style={{ padding: "7px 10px" }}>{r.country || "—"}</td>
                    <td style={{ padding: "7px 10px", fontFamily: "'DM Mono',monospace" }}>{r.customerNo || "—"}</td>
                    <td style={{ padding: "7px 10px" }}>{tone ? <Pill color={tone}>{DELIVERY_LABEL[r.deliveryType]}</Pill> : (DELIVERY_LABEL[r.deliveryType] || "—")}</td>
                    <td style={{ padding: "7px 10px", color: C.textS }}>{r.extras || "—"}</td>
                    <td style={{ padding: "7px 10px", color: C.textS }}>{r.remarks || r.specialHandling || "—"}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </Card>
        )}
    </div>
  );
}

// ─── Registry Admin ──────────────────────────────────────────────────────────
function RegistryAdmin({ showrooms, materials, reload }) {
  const [tab, setTab] = useState("showrooms");
  const verify = showrooms.filter((s) => s.status === "VERIFY");
  return (
    <div>
      {verify.length > 0 && (
        <Card style={{ marginBottom: 18, borderColor: C.warn + "55", background: "#FDF8EE" }}>
          <Eyebrow>Needs verification ({verify.length})</Eyebrow>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>These showrooms are flagged VERIFY in the registry until resolved: <strong>{verify.map((s) => s.name).join(", ")}</strong>. Confirm their data before shipping.</div>
        </Card>
      )}
      <div style={{ display: "flex", gap: 0, marginBottom: 18, borderBottom: `1px solid ${C.surfaceD}` }}>
        {[["showrooms", `Showrooms (${showrooms.length})`], ["materials", `Materials (${materials.length})`], ["import", "Import from Excel"]].map(([k, l]) => (
          <div key={k} onClick={() => setTab(k)} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: tab === k ? 600 : 400, color: tab === k ? C.text : C.textS, borderBottom: tab === k ? `2px solid ${C.oak}` : "2px solid transparent", marginBottom: -1 }}>{l}</div>
        ))}
      </div>
      {tab === "showrooms" && <ShowroomAdmin showrooms={showrooms} reload={reload} />}
      {tab === "materials" && <MaterialAdmin materials={materials} reload={reload} />}
      {tab === "import" && <ImportPanel reload={reload} hasData={showrooms.length > 0 || materials.length > 0} />}
    </div>
  );
}

function ShowroomAdmin({ showrooms, reload }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const remove = async (s) => {
    if (!confirm(`Delete showroom "${s.name}"? This is master data.`)) return;
    await fetch(`/api/showroom-ops/showrooms/${s.id}`, { method: "DELETE" });
    await reload();
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><button onClick={() => setCreating(true)} style={btnDark}>+ Add showroom</button></div>
      {(creating || editing) && <ShowroomForm showroom={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={async () => { setCreating(false); setEditing(null); await reload(); }} />}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: C.surface }}>{["Showroom", "Country", "Lines", "Delivery", "Cust# MEN", "Cust# WOMEN", "Status", ""].map((h) => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.surfaceD}` }}>{h}</th>)}</tr></thead>
          <tbody>{showrooms.map((s) => (
            <tr key={s.id} style={{ borderBottom: `1px solid ${C.surfaceD}` }}>
              <td style={{ padding: "7px 10px", fontWeight: 500 }}>{s.name}</td>
              <td style={{ padding: "7px 10px" }}>{s.country || "—"}</td>
              <td style={{ padding: "7px 10px" }}>{s.lines || "—"}</td>
              <td style={{ padding: "7px 10px", fontSize: 11 }}>{DELIVERY_LABEL[s.deliveryType] || s.deliveryType || "—"}</td>
              <td style={{ padding: "7px 10px", fontFamily: "'DM Mono',monospace" }}>{s.customerNoMen || "—"}</td>
              <td style={{ padding: "7px 10px", fontFamily: "'DM Mono',monospace" }}>{s.customerNoWomen || "—"}</td>
              <td style={{ padding: "7px 10px" }}>{s.status === "VERIFY" ? <Pill color={C.warn}>Verify</Pill> : <Pill color={C.go}>Active</Pill>}</td>
              <td style={{ padding: "7px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                <button onClick={() => setEditing(s)} style={{ ...btnLight, padding: "4px 8px", fontSize: 11, marginRight: 6 }}>Edit</button>
                <button onClick={() => remove(s)} style={{ padding: "4px 8px", fontSize: 11, color: C.nogo, background: "none", border: `1px solid ${C.surfaceD}`, borderRadius: 4, cursor: "pointer" }}>Del</button>
              </td>
            </tr>
          ))}{!showrooms.length && <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: C.textS, fontSize: 13 }}>No showrooms. Import the registry Excel or add manually.</td></tr>}</tbody>
        </table>
      </Card>
    </div>
  );
}

const SHOWROOM_FORM_FIELDS = [
  ["name", "Name *", "text"], ["country", "Country", "text"], ["lines", "Lines (MEN/WOMEN/MEN+WOMEN)", "text"],
  ["deliveryType", "Delivery type", "delivery"], ["companyName", "Company name", "text"], ["status", "Status", "status"],
  ["addressMen", "Address (MEN)", "text"], ["zipMen", "Zip (MEN)", "text"],
  ["addressWomen", "Address (WOMEN)", "text"], ["zipWomen", "Zip (WOMEN)", "text"],
  ["customerNoMen", "Customer no MEN", "text"], ["customerNoWomen", "Customer no WOMEN", "text"],
  ["contactMen", "Contact MEN", "text"], ["contactWomen", "Contact WOMEN", "text"],
  ["emailWomen", "Email WOMEN", "text"], ["phoneWomen", "Phone WOMEN", "text"],
  ["specialHandling", "Special handling", "text"], ["notes", "Notes", "text"],
];

function ShowroomForm({ showroom, onClose, onSaved }) {
  const [form, setForm] = useState(showroom || { name: "", status: "ACTIVE" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const save = async () => {
    if (!form.name) { setError("Name is required"); return; }
    setBusy(true); setError(null);
    try {
      const url = showroom ? `/api/showroom-ops/showrooms/${showroom.id}` : "/api/showroom-ops/showrooms";
      const r = await fetch(url, { method: showroom ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      onSaved();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal title={showroom ? `Edit ${showroom.name}` : "Add showroom"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {SHOWROOM_FORM_FIELDS.map(([k, l, t]) => (
          <div key={k} style={{ gridColumn: ["specialHandling", "notes", "name"].includes(k) ? "1 / -1" : "auto" }}>
            <label style={labelStyle}>{l}</label>
            {t === "delivery" ? (
              <select value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} style={inputStyle}><option value="">—</option>{Object.keys(DELIVERY_LABEL).map((d) => <option key={d} value={d}>{DELIVERY_LABEL[d]}</option>)}</select>
            ) : t === "status" ? (
              <select value={form[k] || "ACTIVE"} onChange={(e) => setForm({ ...form, [k]: e.target.value })} style={inputStyle}>{["ACTIVE", "VERIFY"].map((s) => <option key={s}>{s}</option>)}</select>
            ) : (
              <input value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} style={inputStyle} />
            )}
          </div>
        ))}
      </div>
      {error && <div style={{ marginTop: 12, fontSize: 12, color: C.nogo }}>{error}</div>}
      <div style={{ marginTop: 18, display: "flex", gap: 10 }}><button onClick={save} disabled={busy} style={btnDark}>{busy ? "Saving…" : "Save"}</button><button onClick={onClose} style={btnLight}>Cancel</button></div>
    </Modal>
  );
}

function MaterialAdmin({ materials, reload }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const remove = async (m) => {
    if (!confirm(`Delete material "${m.name}"?`)) return;
    await fetch(`/api/showroom-ops/materials/${m.id}`, { method: "DELETE" });
    await reload();
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><button onClick={() => setCreating(true)} style={btnDark}>+ Add material</button></div>
      {(creating || editing) && <MaterialForm material={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={async () => { setCreating(false); setEditing(null); await reload(); }} />}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: C.surface }}>{["Code", "Name", "Category", "Format", "Colour", "Slug", ""].map((h) => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.surfaceD}` }}>{h}</th>)}</tr></thead>
          <tbody>{materials.map((m) => (
            <tr key={m.id} style={{ borderBottom: `1px solid ${C.surfaceD}` }}>
              <td style={{ padding: "7px 10px", fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{m.code || "—"}</td>
              <td style={{ padding: "7px 10px", fontWeight: 500 }}>{m.name}</td>
              <td style={{ padding: "7px 10px" }}>{m.category || "—"}</td>
              <td style={{ padding: "7px 10px" }}>{m.defaultFormat || "—"}</td>
              <td style={{ padding: "7px 10px" }}>{m.defaultColour || "—"}</td>
              <td style={{ padding: "7px 10px", fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textS }}>{m.filenameSlug || "—"}</td>
              <td style={{ padding: "7px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                <button onClick={() => setEditing(m)} style={{ ...btnLight, padding: "4px 8px", fontSize: 11, marginRight: 6 }}>Edit</button>
                <button onClick={() => remove(m)} style={{ padding: "4px 8px", fontSize: 11, color: C.nogo, background: "none", border: `1px solid ${C.surfaceD}`, borderRadius: 4, cursor: "pointer" }}>Del</button>
              </td>
            </tr>
          ))}{!materials.length && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: C.textS, fontSize: 13 }}>No materials. Import the registry Excel or add manually.</td></tr>}</tbody>
        </table>
      </Card>
    </div>
  );
}

const MATERIAL_FORM_FIELDS = [
  ["code", "Code"], ["name", "Name *"], ["category", "Category"], ["defaultFormat", "Default format"],
  ["defaultColour", "Default colour"], ["defaultQuality", "Default quality"], ["defaultPacking", "Default packing"],
  ["standardRemarks", "Standard remarks"], ["filenameSlug", "Filename slug"],
];

function MaterialForm({ material, onClose, onSaved }) {
  const [form, setForm] = useState(material || { name: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const save = async () => {
    if (!form.name) { setError("Name is required"); return; }
    setBusy(true); setError(null);
    try {
      const url = material ? `/api/showroom-ops/materials/${material.id}` : "/api/showroom-ops/materials";
      const r = await fetch(url, { method: material ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      onSaved();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal title={material ? `Edit ${material.name}` : "Add material"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {MATERIAL_FORM_FIELDS.map(([k, l]) => (
          <div key={k} style={{ gridColumn: ["standardRemarks", "name"].includes(k) ? "1 / -1" : "auto" }}>
            <label style={labelStyle}>{l}</label>
            <input value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} style={k === "filenameSlug" ? { ...inputStyle, fontFamily: "'DM Mono',monospace" } : inputStyle} />
          </div>
        ))}
      </div>
      {error && <div style={{ marginTop: 12, fontSize: 12, color: C.nogo }}>{error}</div>}
      <div style={{ marginTop: 18, display: "flex", gap: 10 }}><button onClick={save} disabled={busy} style={btnDark}>{busy ? "Saving…" : "Save"}</button><button onClick={onClose} style={btnLight}>Cancel</button></div>
    </Modal>
  );
}

function ImportPanel({ reload, hasData }) {
  const [parsed, setParsed] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [importing, setImporting] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true); setError(null); setParsed(null); setResult(null);
    try {
      const data = await parseRegistryWorkbook(file);
      setParsed(data);
    } catch (err) { setError(err.message); } finally { setParsing(false); }
  };

  const doImport = async (force) => {
    setImporting(true); setError(null);
    try {
      const r = await fetch("/api/showroom-ops/seed", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showrooms: parsed.showrooms, materials: parsed.materials, force }),
      });
      const j = await r.json();
      if (!r.ok) {
        if (j.code === "NOT_EMPTY") { setError(j.error + " Use 'Import anyway' to append."); }
        else throw new Error(j.error || "Import failed");
      } else {
        setResult(j);
        await reload();
      }
    } catch (err) { setError(err.message); } finally { setImporting(false); }
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Eyebrow>Import SELECTED_SHOWROOM_MASTER_REGISTRY.xlsx</Eyebrow>
        <div style={{ fontSize: 13, color: C.textS, lineHeight: 1.6, marginBottom: 14 }}>
          The file is parsed in your browser. Headers are matched best-effort — review the preview before committing. Sheet 1 → showrooms, Sheet 3 → materials. The “VERIFY WITH PURCHASING” sheet is shown as a checklist, not imported.
        </div>
        <input type="file" accept=".xlsx,.xls" onChange={onFile} style={{ fontSize: 13 }} />
        {parsing && <div style={{ marginTop: 12, fontSize: 13, color: C.oak }}>Parsing…</div>}
        {error && <div style={{ marginTop: 12, padding: "10px 14px", background: "#FBE5E1", borderLeft: `3px solid ${C.nogo}`, borderRadius: 4, fontSize: 12, color: C.nogo }}>{error}</div>}
        {result && <div style={{ marginTop: 12, padding: "10px 14px", background: "#E8F2EA", borderLeft: `3px solid ${C.go}`, borderRadius: 4, fontSize: 12, color: C.go }}>Imported {result.showroomsInserted || 0} showrooms and {result.materialsInserted || 0} materials.</div>}
      </Card>

      {parsed && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 13, color: C.text }}>Parsed <strong>{parsed.showrooms.length}</strong> showrooms · <strong>{parsed.materials.length}</strong> materials · sheets: {parsed.sheetNames.join(", ")}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => doImport(false)} disabled={importing} style={btnDark}>{importing ? "Importing…" : "Import"}</button>
              {hasData && <button onClick={() => doImport(true)} disabled={importing} style={btnLight}>Import anyway (append)</button>}
            </div>
          </div>
          {parsed.verifyChecklist.length > 0 && (
            <div style={{ marginBottom: 14, padding: "12px 16px", background: "#FDF8EE", borderRadius: 8, border: `1px solid ${C.warn}55` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.warn, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Verify with purchasing (checklist — not imported)</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.text, lineHeight: 1.7 }}>{parsed.verifyChecklist.slice(0, 40).map((v, i) => <li key={i}>{v}</li>)}</ul>
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Showroom preview (first 10)</div>
          <div style={{ overflowX: "auto", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ background: C.surface }}>{["Name", "Country", "Lines", "Delivery", "Cust# MEN", "Cust# WOMEN", "Status"].map((h) => <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 9, fontWeight: 700, color: C.textS, textTransform: "uppercase", borderBottom: `1px solid ${C.surfaceD}` }}>{h}</th>)}</tr></thead>
              <tbody>{parsed.showrooms.slice(0, 10).map((s, i) => <tr key={i} style={{ borderBottom: `1px solid ${C.surfaceD}` }}><td style={{ padding: "6px 8px", fontWeight: 500 }}>{s.name}</td><td style={{ padding: "6px 8px" }}>{s.country || "—"}</td><td style={{ padding: "6px 8px" }}>{s.lines || "—"}</td><td style={{ padding: "6px 8px" }}>{s.deliveryType || "—"}</td><td style={{ padding: "6px 8px", fontFamily: "'DM Mono',monospace" }}>{s.customerNoMen || "—"}</td><td style={{ padding: "6px 8px", fontFamily: "'DM Mono',monospace" }}>{s.customerNoWomen || "—"}</td><td style={{ padding: "6px 8px" }}>{s.status}</td></tr>)}</tbody>
            </table>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Material preview (first 10)</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ background: C.surface }}>{["Code", "Name", "Category", "Format", "Slug"].map((h) => <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 9, fontWeight: 700, color: C.textS, textTransform: "uppercase", borderBottom: `1px solid ${C.surfaceD}` }}>{h}</th>)}</tr></thead>
              <tbody>{parsed.materials.slice(0, 10).map((m, i) => <tr key={i} style={{ borderBottom: `1px solid ${C.surfaceD}` }}><td style={{ padding: "6px 8px", fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{m.code || "—"}</td><td style={{ padding: "6px 8px", fontWeight: 500 }}>{m.name}</td><td style={{ padding: "6px 8px" }}>{m.category || "—"}</td><td style={{ padding: "6px 8px" }}>{m.defaultFormat || "—"}</td><td style={{ padding: "6px 8px", fontFamily: "'DM Mono',monospace", color: C.textS }}>{m.filenameSlug || "—"}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Outer page ──────────────────────────────────────────────────────────────
export default function ShowroomOpsPage() {
  const [tab, setTab] = useState("dashboard");
  const [seasons, setSeasons] = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const reloadSeasons = useCallback(async () => {
    const r = await fetch("/api/showroom-ops/seasons");
    if (r.status === 503) { const j = await r.json().catch(() => ({})); setConfigError(j.message || "Supabase is not configured."); return; }
    if (r.ok) {
      const d = await r.json();
      setSeasons(d.seasons || []);
      setConfigError(null);
      if (!selectedSeasonId && d.seasons?.length) setSelectedSeasonId(d.seasons[0].id);
    } else {
      const j = await r.json().catch(() => ({}));
      setConfigError(j.error || "Could not load Showroom Ops data.");
    }
  }, [selectedSeasonId]);

  const reloadRegistry = useCallback(async () => {
    const [rs, rm] = await Promise.all([fetch("/api/showroom-ops/showrooms"), fetch("/api/showroom-ops/materials")]);
    if (rs.ok) setShowrooms((await rs.json()).showrooms || []);
    if (rm.ok) setMaterials((await rm.json()).materials || []);
  }, []);

  useEffect(() => {
    (async () => { await reloadSeasons(); await reloadRegistry(); setLoaded(true); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Title sub="Local showroom materials and Collection Meeting overview — one data model, role-specific views.">Showroom Ops</Title>
      {configError && <div style={{ marginBottom: 18 }}><ConfigNotice message={configError} /></div>}
      <SubNav tab={tab} setTab={setTab} />
      {!loaded ? <Card><div style={{ padding: 20, textAlign: "center", color: C.textS, fontSize: 13 }}>Loading…</div></Card> : (
        <>
          {tab === "dashboard" && <SeasonDashboard seasons={seasons} reloadSeasons={reloadSeasons} selectedId={selectedSeasonId} setSelectedId={setSelectedSeasonId} materials={materials} />}
          {tab === "graphics" && <GraphicsQueue seasons={seasons} selectedId={selectedSeasonId} setSelectedId={setSelectedSeasonId} materials={materials} />}
          {tab === "purchasing" && <PurchasingExport seasons={seasons} selectedId={selectedSeasonId} setSelectedId={setSelectedSeasonId} materials={materials} />}
          {tab === "shipping" && <ShippingList seasons={seasons} selectedId={selectedSeasonId} setSelectedId={setSelectedSeasonId} />}
          {tab === "registry" && <RegistryAdmin showrooms={showrooms} materials={materials} reload={reloadRegistry} />}
        </>
      )}
    </div>
  );
}
