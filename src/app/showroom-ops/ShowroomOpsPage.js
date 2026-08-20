"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { generateFilename } from "../../lib/showroom-ops/filename";
import { exportToXlsx, parseRegistryWorkbook, readSalesListSheets, parseSalesListSheet } from "./xlsx";

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

// Mirrors derivedLineQuantity() in lib/showroom-ops/store.js: local-showroom
// material scales with the collection sets held at each ticked location, so
// Oslo with three sets needs three. Collection-meeting scopes are one venue and
// keep an editorial amount.
const derivedQty = (line, seasonShowrooms) => {
  if (!line || line.scope !== "LOCAL_SHOWROOMS") return null;
  let total = 0;
  for (const ss of seasonShowrooms || []) {
    const men = ss.menPackage ? (ss.menSets ?? 1) : 0;
    const women = ss.womenPackage ? (ss.womenSets ?? 1) : 0;
    if (line.gender === "MEN") total += men;
    else if (line.gender === "WOMEN") total += women;
    else total += Math.max(men, women);
  }
  return total;
};

function SubNav({ tab, setTab }) {
  const tabs = [
    ["dashboard", "Season Dashboard"], ["saleslist", "Sales List"], ["graphics", "Graphics Queue"],
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
          <SeasonHeader season={detail.season} sprints={detail.sprints} onChanged={loadDetail} />

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

          {showAddLine && <LineForm seasonId={selectedId} season={detail.season} materials={materials} sprints={detail.sprints} seasonShowrooms={detail.seasonShowrooms} onClose={() => setShowAddLine(false)} onSaved={async () => { setShowAddLine(false); await loadDetail(); }} />}

          {SCOPES.filter((sc) => linesByScope[sc]?.length).map((sc) => (
            <div key={sc} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{SCOPE_LABEL[sc]} <span style={{ color: C.textS }}>({linesByScope[sc].length})</span></div>
              <LinesTable lines={linesByScope[sc]} materials={materials} season={detail.season} sprints={detail.sprints} seasonShowrooms={detail.seasonShowrooms} onChanged={loadDetail} />
            </div>
          ))}
          {!(detail.lines || []).length && <Card><div style={{ fontSize: 13, color: C.textS }}>No lines yet. Add the first print/digital item for this season.</div></Card>}
        </div>
      )}
    </div>
  );
}

// A season orders in waves; each sprint carries its own "files ready" and
// delivery date, mirroring the SPRINT 1 / SPRINT 2 blocks in the workbook.
function SeasonSprints({ seasonId, sprints, onChanged }) {
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    try {
      await fetch(`/api/showroom-ops/seasons/${seasonId}/sprints`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Sprint ${(sprints?.length || 0) + 1}` }),
      });
      await onChanged();
    } finally { setBusy(false); }
  };
  const patch = async (id, field, value) => {
    await fetch(`/api/showroom-ops/sprints/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value || null }),
    });
    await onChanged();
  };
  const remove = async (sp) => {
    if (!confirm(`Remove ${sp.name}?`)) return;
    await fetch(`/api/showroom-ops/sprints/${sp.id}`, { method: "DELETE" });
    await onChanged();
  };

  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.surfaceD}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Sprints</div>
      {(sprints || []).map((sp) => (
        <div key={sp.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
          <input defaultValue={sp.name} onBlur={(e) => patch(sp.id, "name", e.target.value)}
            style={{ ...inputStyle, width: 120 }} />
          <label style={{ fontSize: 11, color: C.textS }}>Order (files ready)</label>
          <input type="date" defaultValue={sp.orderDate || ""} onChange={(e) => patch(sp.id, "orderDate", e.target.value)}
            style={{ ...inputStyle, width: 150 }} />
          <label style={{ fontSize: 11, color: C.textS }}>Delivery</label>
          <input type="date" defaultValue={sp.deliveryDate || ""} onChange={(e) => patch(sp.id, "deliveryDate", e.target.value)}
            style={{ ...inputStyle, width: 150 }} />
          <button onClick={() => remove(sp)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      ))}
      {!(sprints || []).length && <div style={{ fontSize: 12, color: C.textS, marginBottom: 8 }}>No sprints yet — add one per ordering wave.</div>}
      <button onClick={add} disabled={busy} style={{ ...btnLight, fontSize: 12, padding: "7px 12px" }}>+ Add sprint</button>
    </div>
  );
}

function SeasonHeader({ season, sprints, onChanged }) {
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
      <SeasonSprints seasonId={season.id} sprints={sprints} onChanged={onChanged} />
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

function LineForm({ seasonId, season, materials, sprints, seasonShowrooms, onClose, onSaved, line }) {
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
        {editing && <div><label style={labelStyle}>Amount</label><input value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="1 stk." style={inputStyle} /></div>}
        <div><label style={labelStyle}>Sprint</label>
          {sprints?.length ? (
            <select value={form.sprint || ""} onChange={(e) => setForm({ ...form, sprint: e.target.value })} style={inputStyle}>
              <option value="">—</option>
              {sprints.map((sp) => <option key={sp.id} value={sp.name}>{sp.name}</option>)}
            </select>
          ) : (
            <input value={form.sprint || ""} onChange={(e) => setForm({ ...form, sprint: e.target.value })} placeholder="Add sprints on the season first" style={inputStyle} />
          )}
        </div>
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
      {!editing && form.scope === "LOCAL_SHOWROOMS" && (
        <div style={{ marginTop: 14, padding: "10px 14px", background: C.surface, borderRadius: 6, fontSize: 12, color: C.textS, lineHeight: 1.55 }}>
          Quantity is not entered here. It follows the showrooms ticked for this season —
          currently <strong style={{ color: C.text }}>{derivedQty({ scope: form.scope, gender: form.gender }, seasonShowrooms)}</strong> pieces,
          counting every collection set a location holds.
        </div>
      )}
      <div style={{ marginTop: 18, display: "flex", gap: 10 }}><button onClick={save} disabled={busy} style={btnDark}>{busy ? "Saving…" : editing ? "Save line" : "Add line"}</button><button onClick={onClose} style={btnLight}>Cancel</button></div>
    </Modal>
  );
}

function LinesTable({ lines, materials, season, sprints, seasonShowrooms, onChanged }) {
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
      {editLine && <LineForm seasonId={season.id} season={season} materials={materials} sprints={sprints} seasonShowrooms={seasonShowrooms} line={editLine} onClose={() => setEditLine(null)} onSaved={async () => { setEditLine(null); await onChanged(); }} />}
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
                <td style={{ padding: "8px 12px" }}>{(() => {
                  const d = derivedQty(l, seasonShowrooms);
                  if (d === null) return l.amount || "—";
                  return <span title="From the showrooms ticked for this season">{d} <span style={{ color: C.textS, fontSize: 10 }}>derived</span></span>;
                })()}</td>
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

// Seed a season's ticks from the sales rep's own workbook. Matching happens on
// customer number server-side; this panel only parses, previews and posts.
function SalesListImport({ seasonId, onImported }) {
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [sheet, setSheet] = useState("");
  const [gender, setGender] = useState("MEN");
  const [parsed, setParsed] = useState(null);
  const [createMissing, setCreateMissing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setParsed(null); setResult(null); setError(null); setSheet("");
    try {
      const names = await readSalesListSheets(f);
      setSheets(names);
      // The collection sheets are the ones worth offering first.
      const guess = names.find((n) => /^(SUM|SPR|AUT|WIN)/i.test(n));
      if (guess) setSheet(guess);
    } catch (err) { setError(err.message); }
    // Guess the gender from the filename so it is right by default.
    if (/women|femme/i.test(f.name)) setGender("WOMEN");
    else if (/men|homme/i.test(f.name)) setGender("MEN");
  };

  const preview = async () => {
    if (!file || !sheet) return;
    setBusy(true); setError(null); setResult(null);
    try {
      setParsed(await parseSalesListSheet(file, sheet));
    } catch (err) { setError(err.message); setParsed(null); } finally { setBusy(false); }
  };

  const run = async () => {
    if (!parsed?.rows?.length) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch(`/api/showroom-ops/seasons/${seasonId}/import-sales-list`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender, rows: parsed.rows, createMissing }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `Import failed (${r.status})`);
      setResult(j);
      await onImported();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Eyebrow>Import sales list</Eyebrow>
      <div style={{ fontSize: 12, color: C.textS, lineHeight: 1.6, marginBottom: 12 }}>
        Upload the sales rep&apos;s MEN or WOMEN workbook and pick the collection sheet. Showrooms are matched on
        customer number — the sales list says “Düsseldorf” where shipping says “Kaarst”, so names alone are not
        reliable. Existing showrooms keep their data; only blank fields are filled in.
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input type="file" accept=".xlsx,.xls" onChange={onFile} style={{ fontSize: 12 }} />
        {sheets.length > 0 && (
          <select value={sheet} onChange={(e) => { setSheet(e.target.value); setParsed(null); }} style={{ ...inputStyle, width: "auto", minWidth: 150 }}>
            <option value="">— Collection sheet —</option>
            {sheets.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
        {sheets.length > 0 && (
          <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ ...inputStyle, width: 110 }}>
            <option value="MEN">MEN</option><option value="WOMEN">WOMEN</option>
          </select>
        )}
        {sheet && <button onClick={preview} disabled={busy} style={btnLight}>{busy ? "Reading…" : "Preview"}</button>}
      </div>

      {error && <div style={{ marginTop: 12, padding: "10px 14px", background: "#FBE5E1", borderLeft: `3px solid ${C.nogo}`, borderRadius: 4, fontSize: 12, color: C.nogo }}>{error}</div>}

      {parsed && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.surfaceD}` }}>
          <div style={{ fontSize: 13, color: C.text, marginBottom: 10 }}>
            Found <strong>{parsed.rows.length}</strong> showrooms in “{sheet}”
            {parsed.rows.filter((r) => !r.customerNo).length > 0 && (
              <span style={{ color: C.warn }}>
                {" "}· {parsed.rows.filter((r) => !r.customerNo).length} without a customer number (matched by name)
              </span>
            )}
          </div>
          <div style={{ maxHeight: 160, overflow: "auto", border: `1px solid ${C.surfaceD}`, borderRadius: 6, marginBottom: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <tbody>
                {parsed.rows.slice(0, 60).map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.surfaceD}` }}>
                    <td style={{ padding: "4px 8px", fontWeight: 500 }}>{r.name}</td>
                    <td style={{ padding: "4px 8px", fontFamily: "'DM Mono',monospace", color: r.customerNo ? C.text : C.warn }}>{r.customerNo || "no cust#"}</td>
                    <td style={{ padding: "4px 8px", color: C.textS }}>{r.country}</td>
                    <td style={{ padding: "4px 8px", color: C.textS }}>{r.zip} {r.city}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.text, marginBottom: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={createMissing} onChange={(e) => setCreateMissing(e.target.checked)} style={{ width: 15, height: 15, accentColor: C.oak }} />
            Create showrooms that are not in the registry yet
          </label>
          <button onClick={run} disabled={busy} style={btnDark}>{busy ? "Importing…" : `Import & tick ${gender}`}</button>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 12, padding: "12px 16px", background: "#EEF4EF", border: `1px solid ${C.success}33`, borderRadius: 6, fontSize: 12, color: C.text, lineHeight: 1.6 }}>
          ✓ Ticked <strong>{result.ticked}</strong> showrooms for {gender}
          {result.created.length > 0 && <> · created <strong>{result.created.length}</strong> new</>}
          {result.matched.length > 0 && <> · matched <strong>{result.matched.length}</strong> existing</>}
          {result.unmatched.length > 0 && (
            <div style={{ marginTop: 6, color: C.warn }}>
              Not in the registry and not created: {result.unmatched.map((u) => u.name).join(", ")}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Sales List — tick which showrooms get a package this season ─────────────
// The working view: pick a season, tick MEN / WOMEN per showroom, and edit
// showroom details in place. Standing customisations are shown read-only so it
// is visible what rides along with a tick without anyone maintaining them here.
function SalesListView({ seasons, selectedId, setSelectedId, showrooms, reloadRegistry }) {
  const [ticks, setTicks] = useState({});          // showroomId -> {menPackage, womenPackage, extras, remarks}
  const [customs, setCustoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);      // showroomId currently saving
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);    // showroom being edited
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!selectedId) { setTicks({}); return; }
    setLoading(true); setError(null);
    try {
      const [dRes, cRes] = await Promise.all([
        fetch(`/api/showroom-ops/seasons/${selectedId}`),
        fetch(`/api/showroom-ops/showroom-materials`),
      ]);
      if (dRes.ok) {
        const d = await dRes.json();
        const m = {};
        for (const ss of d.seasonShowrooms || []) m[ss.showroomId] = ss;
        setTicks(m);
      }
      if (cRes.ok) setCustoms((await cRes.json()).materials || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [selectedId]);
  useEffect(() => { load(); }, [load]);

  const customsFor = (showroomId, gender) =>
    customs.filter((m) => m.active && m.showroomId === showroomId && (m.gender === "BOTH" || m.gender === gender));

  const toggle = async (showroom, gender) => {
    if (!selectedId) return;
    const cur = ticks[showroom.id] || { menPackage: false, womenPackage: false };
    const next = {
      showroomId: showroom.id,
      menPackage: gender === "MEN" ? !cur.menPackage : !!cur.menPackage,
      womenPackage: gender === "WOMEN" ? !cur.womenPackage : !!cur.womenPackage,
      menSets: cur.menSets ?? 1,
      womenSets: cur.womenSets ?? 1,
      extras: cur.extras || null,
      remarks: cur.remarks || null,
    };
    // Optimistic: the grid must feel like a spreadsheet.
    setTicks((p) => ({ ...p, [showroom.id]: { ...next } }));
    setSaving(showroom.id); setError(null);
    try {
      const r = await fetch(`/api/showroom-ops/seasons/${selectedId}/showrooms`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Save failed (${r.status})`);
    } catch (e) {
      setError(e.message);
      setTicks((p) => ({ ...p, [showroom.id]: cur }));  // roll back
    } finally { setSaving(null); }
  };


  const setSets = async (showroom, field, value) => {
    const cur = ticks[showroom.id] || {};
    const n = Math.max(1, parseInt(value, 10) || 1);
    const next = {
      showroomId: showroom.id,
      menPackage: !!cur.menPackage, womenPackage: !!cur.womenPackage,
      menSets: field === "menSets" ? n : (cur.menSets ?? 1),
      womenSets: field === "womenSets" ? n : (cur.womenSets ?? 1),
      extras: cur.extras || null, remarks: cur.remarks || null,
    };
    setTicks((p) => ({ ...p, [showroom.id]: { ...next } }));
    await fetch(`/api/showroom-ops/seasons/${selectedId}/showrooms`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next),
    });
  };

  const visible = showrooms.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [s.name, s.city, s.country, s.customerNoMen, s.customerNoWomen]
      .some((v) => String(v || "").toLowerCase().includes(q));
  });

  const menCount = Object.values(ticks).filter((t) => t.menPackage).length;
  const womenCount = Object.values(ticks).filter((t) => t.womenPackage).length;
  const menPieces = Object.values(ticks).reduce((n, t) => n + (t.menPackage ? (t.menSets ?? 1) : 0), 0);
  const womenPieces = Object.values(ticks).reduce((n, t) => n + (t.womenPackage ? (t.womenSets ?? 1) : 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <SeasonSelector seasons={seasons} selectedId={selectedId} onSelect={setSelectedId} />
          <input placeholder="Search showroom, city, customer no…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 260 }} />
        </div>
        {selectedId && (
          <div style={{ fontSize: 12, color: C.textS }}>
            <strong style={{ color: C.text }}>{menCount}</strong> MEN ({menPieces} sets) · <strong style={{ color: C.text }}>{womenCount}</strong> WOMEN ({womenPieces} sets)
          </div>
        )}
      </div>

      {error && <div style={{ marginBottom: 12, padding: "10px 14px", background: "#FBE5E1", borderLeft: `3px solid ${C.nogo}`, borderRadius: 4, fontSize: 12, color: C.nogo }}>{error}</div>}

      {editing && <ShowroomForm showroom={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await reloadRegistry(); }} />}

      {selectedId && <SalesListImport seasonId={selectedId} onImported={async () => { await reloadRegistry(); await load(); }} />}

      {!selectedId ? (
        <Card><div style={{ fontSize: 13, color: C.textS }}>Pick a season, then tick which showrooms receive a MEN or WOMEN package. The ticks drive the graphics sheet and the shipping list.</div></Card>
      ) : loading ? (
        <Card><div style={{ padding: 20, textAlign: "center", color: C.textS, fontSize: 13 }}>Loading…</div></Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {["Showroom", "City", "Country", "Cust# MEN", "Cust# WOMEN", "MEN", "Sets", "WOMEN", "Sets", "Always included", ""].map((h) => (
                  <th key={h + Math.random()} style={{ padding: "8px 10px", textAlign: ["MEN", "WOMEN", "Sets"].includes(h) ? "center" : "left", fontSize: 10, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.surfaceD}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => {
                const t = ticks[s.id] || {};
                const busy = saving === s.id;
                const cm = customsFor(s.id, "MEN");
                const cw = customsFor(s.id, "WOMEN");
                const allCustom = [...new Set([...cm, ...cw].map((m) => `${m.quantity > 1 ? `${m.quantity}× ` : ""}${m.name}${m.format ? ` (${m.format})` : ""}`))];
                return (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${C.surfaceD}`, opacity: busy ? 0.55 : 1 }}>
                    <td style={{ padding: "7px 10px", fontWeight: 500 }}>
                      {s.name}
                      {s.status === "VERIFY" && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: C.warn }}>VERIFY</span>}
                    </td>
                    <td style={{ padding: "7px 10px", color: C.textS }}>{s.city || "—"}</td>
                    <td style={{ padding: "7px 10px" }}>{s.country || "—"}</td>
                    <td style={{ padding: "7px 10px", fontFamily: "'DM Mono',monospace" }}>{s.customerNoMen || "—"}</td>
                    <td style={{ padding: "7px 10px", fontFamily: "'DM Mono',monospace" }}>{s.customerNoWomen || "—"}</td>
                    <td style={{ padding: "7px 10px", textAlign: "center" }}>
                      <input type="checkbox" checked={!!t.menPackage} disabled={busy} onChange={() => toggle(s, "MEN")} style={{ width: 16, height: 16, accentColor: C.oak, cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "7px 6px", textAlign: "center" }}>
                      {t.menPackage ? (
                        <input value={t.menSets ?? 1} onChange={(e) => setSets(s, "menSets", e.target.value)} title="Collection sets at this location"
                          style={{ width: 34, padding: "3px 4px", textAlign: "center", fontSize: 11, border: `1px solid ${(t.menSets ?? 1) > 1 ? C.oak : C.surfaceD}`, borderRadius: 4, outline: "none" }} />
                      ) : <span style={{ color: C.steelL }}>—</span>}
                    </td>
                    <td style={{ padding: "7px 10px", textAlign: "center" }}>
                      <input type="checkbox" checked={!!t.womenPackage} disabled={busy} onChange={() => toggle(s, "WOMEN")} style={{ width: 16, height: 16, accentColor: C.oak, cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "7px 6px", textAlign: "center" }}>
                      {t.womenPackage ? (
                        <input value={t.womenSets ?? 1} onChange={(e) => setSets(s, "womenSets", e.target.value)} title="Collection sets at this location"
                          style={{ width: 34, padding: "3px 4px", textAlign: "center", fontSize: 11, border: `1px solid ${(t.womenSets ?? 1) > 1 ? C.oak : C.surfaceD}`, borderRadius: 4, outline: "none" }} />
                      ) : <span style={{ color: C.steelL }}>—</span>}
                    </td>
                    <td style={{ padding: "7px 10px", fontSize: 11, color: allCustom.length ? C.oak : C.steelL }}>
                      {allCustom.length ? allCustom.join(" · ") : "—"}
                    </td>
                    <td style={{ padding: "7px 10px", textAlign: "right" }}>
                      <button onClick={() => setEditing(s)} style={{ ...btnLight, padding: "4px 8px", fontSize: 11 }}>Edit</button>
                    </td>
                  </tr>
                );
              })}
              {!visible.length && <tr><td colSpan={11} style={{ padding: 24, textAlign: "center", color: C.textS, fontSize: 13 }}>No showrooms match the search</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ─── Graphics Queue ──────────────────────────────────────────────────────────
function GraphicsQueue({ seasons, selectedId, setSelectedId, materials }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const matById = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);

  const [customs, setCustoms] = useState([]);

  const load = useCallback(async () => {
    if (!selectedId) { setDetail(null); setCustoms([]); return; }
    setLoading(true);
    try {
      const [dRes, cRes] = await Promise.all([
        fetch(`/api/showroom-ops/seasons/${selectedId}`),
        fetch(`/api/showroom-ops/seasons/${selectedId}/customisations`),
      ]);
      if (dRes.ok) setDetail(await dRes.json());
      if (cRes.ok) setCustoms((await cRes.json()).rows || []);
    } finally { setLoading(false); }
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

      {/* Customised material owed to individual showrooms. Not season lines —
          these come from the showrooms that were ticked, so graphics see them
          without anyone re-entering them each season. */}
      {selectedId && customs.length > 0 && (
        <Card style={{ marginBottom: 18, borderLeft: `3px solid ${C.oak}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <Eyebrow>Customised per showroom ({customs.length})</Eyebrow>
            <button
              onClick={() => exportToXlsx({
                filename: `${(seasons.find((x) => x.id === selectedId) || {}).code || "SEASON"}_CUSTOMISED.xlsx`,
                sheetName: "Customised",
                columns: [
                  { header: "Showroom", key: "showroom" }, { header: "Gender", key: "gender" },
                  { header: "Item", key: "name" }, { header: "Format", key: "format" },
                  { header: "Qty", key: "quantity" }, { header: "Remarks", key: "remarks" },
                ],
                rows: customs,
              })}
              style={{ ...btnLight, padding: "6px 12px", fontSize: 12 }}
            >Export Excel</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: C.surface }}>{["Showroom", "Gender", "Item", "Format", "Qty", "Remarks"].map((h) => (
              <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.surfaceD}` }}>{h}</th>
            ))}</tr></thead>
            <tbody>{customs.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.surfaceD}` }}>
                <td style={{ padding: "6px 10px", fontWeight: 500 }}>{r.showroom}</td>
                <td style={{ padding: "6px 10px" }}><Pill color={r.gender === "MEN" ? C.blue : C.oak}>{r.gender}</Pill></td>
                <td style={{ padding: "6px 10px" }}>{r.name}</td>
                <td style={{ padding: "6px 10px", color: C.textS }}>{r.format || "—"}</td>
                <td style={{ padding: "6px 10px" }}>{r.quantity}</td>
                <td style={{ padding: "6px 10px", color: C.textS }}>{r.remarks || "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}

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

  // Column names and order mirror the FORSENDELSESLISTE sheets the buyer works
  // in today, so the export drops straight into that workflow.
  const columns = [
    { header: "Navn:", key: "showroom" }, { header: "Adr.:", key: "address" },
    { header: "Postnr.:", key: "zip" }, { header: "By", key: "city" },
    { header: "Land:", key: "country" }, { header: "Customerno.:", key: "customerNo" },
    { header: "PACKAGE", key: "packageMark" }, { header: "REMARKS", key: "remarksOut" },
  ];
  const exportRows = rows.map((r) => ({
    ...r,
    city: r.city || r.showroom,
    packageMark: "X",
    // Extras carry the showroom's standing customisations, so they belong in
    // the remarks the buyer actually reads.
    remarksOut: [r.extras, r.remarks, r.specialHandling].filter(Boolean).join(" · "),
    deliveryTypeLabel: DELIVERY_LABEL[r.deliveryType] || r.deliveryType || "",
  }));

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
              <thead><tr style={{ background: C.surface }}>{["Showroom","Gender","Address","Zip","Country","Customer no.","Delivery","Always included / extras","Remarks"].map((c) => <th key={c} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.surfaceD}` }}>{c}</th>)}</tr></thead>
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
  ["name", "Name *", "text"], ["city", "City (as it reads on the shipping list)", "text"],
  ["country", "Country", "text"], ["lines", "Lines (MEN/WOMEN/MEN+WOMEN)", "text"],
  ["deliveryType", "Delivery type", "delivery"], ["companyName", "Company name", "text"], ["status", "Status", "status"],
  ["addressMen", "Address (MEN)", "text"], ["zipMen", "Zip (MEN)", "text"],
  ["addressWomen", "Address (WOMEN)", "text"], ["zipWomen", "Zip (WOMEN)", "text"],
  ["customerNoMen", "Customer no MEN", "text"], ["customerNoWomen", "Customer no WOMEN", "text"],
  ["contactMen", "Contact MEN", "text"], ["contactWomen", "Contact WOMEN", "text"],
  ["emailWomen", "Email WOMEN", "text"], ["phoneWomen", "Phone WOMEN", "text"],
  ["specialHandling", "Special handling", "text"], ["notes", "Notes", "text"],
];

// Standing customisations for one showroom. Maintained once here; they follow
// the showroom into every season it is ticked for, so nobody has to remember
// that Helsinki takes a lightposter.
function ShowroomMaterials({ showroom }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ name: "", format: "", gender: "BOTH", quantity: "1", remarks: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/showroom-ops/showroom-materials?showroomId=${showroom.id}`);
      if (r.ok) setItems((await r.json()).materials || []);
    } finally { setLoading(false); }
  }, [showroom.id]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!draft.name.trim()) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/showroom-ops/showroom-materials", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, showroomId: showroom.id, quantity: parseInt(draft.quantity) || 1 }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      setDraft({ name: "", format: "", gender: "BOTH", quantity: "1", remarks: "" });
      await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const remove = async (m) => {
    if (!confirm(`Remove "${m.name}" from ${showroom.name}?`)) return;
    await fetch(`/api/showroom-ops/showroom-materials/${m.id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.surfaceD}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.oak, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Always included</div>
      <div style={{ fontSize: 11, color: C.textS, marginBottom: 12, lineHeight: 1.5 }}>
        Customised material this showroom always needs. It follows every season the showroom is ticked for — no one has to re-enter it.
      </div>
      {loading ? <div style={{ fontSize: 12, color: C.textS }}>Loading…</div> : (
        <>
          {items.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: C.surface, borderRadius: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.oak, background: C.oak + "1A", padding: "2px 6px", borderRadius: 3, minWidth: 44, textAlign: "center" }}>{m.gender}</span>
              <span style={{ flex: 1, fontSize: 12, color: C.text }}>
                {m.quantity > 1 ? `${m.quantity}× ` : ""}{m.name}{m.format ? <span style={{ color: C.textS }}> · {m.format}</span> : null}
                {m.remarks ? <span style={{ color: C.textS, fontStyle: "italic" }}> — {m.remarks}</span> : null}
              </span>
              <button onClick={() => remove(m)} style={{ background: "none", border: "none", color: C.nogo, cursor: "pointer", fontSize: 15, lineHeight: 1 }}>×</button>
            </div>
          ))}
          {!items.length && <div style={{ fontSize: 12, color: C.textS, marginBottom: 8 }}>Nothing yet.</div>}
        </>
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Lightposter" style={{ ...inputStyle, flex: 2, minWidth: 140 }} />
        <input value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value })} placeholder="850 x 2000 mm" style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
        <select value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })} style={{ ...inputStyle, width: 90 }}>
          {["BOTH", "MEN", "WOMEN"].map((g) => <option key={g}>{g}</option>)}
        </select>
        <input value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} type="text" inputMode="numeric" style={{ ...inputStyle, width: 52, textAlign: "center" }} />
        <button onClick={add} disabled={busy || !draft.name.trim()} style={{ ...btnDark, padding: "8px 14px", opacity: busy || !draft.name.trim() ? 0.5 : 1 }}>Add</button>
      </div>
      {error && <div style={{ fontSize: 11, color: C.nogo, marginTop: 8 }}>{error}</div>}
    </div>
  );
}

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
      {showroom && <ShowroomMaterials showroom={showroom} />}
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
          {tab === "saleslist" && <SalesListView seasons={seasons} selectedId={selectedSeasonId} setSelectedId={setSelectedSeasonId} showrooms={showrooms} reloadRegistry={reloadRegistry} />}
          {tab === "graphics" && <GraphicsQueue seasons={seasons} selectedId={selectedSeasonId} setSelectedId={setSelectedSeasonId} materials={materials} />}
          {tab === "purchasing" && <PurchasingExport seasons={seasons} selectedId={selectedSeasonId} setSelectedId={setSelectedSeasonId} materials={materials} />}
          {tab === "shipping" && <ShippingList seasons={seasons} selectedId={selectedSeasonId} setSelectedId={setSelectedSeasonId} />}
          {tab === "registry" && <RegistryAdmin showrooms={showrooms} materials={materials} reload={reloadRegistry} />}
        </>
      )}
    </div>
  );
}
