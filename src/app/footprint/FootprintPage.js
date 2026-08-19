"use client";
// Square-metre footprint per fiscal year (1 Aug → 31 Jul).
//
// Reads the SQM number custom field that /api/projects pulls from Asana.
// Project Intake fills it in on creation; anything older is edited in Asana.

import React, { useMemo, useState } from "react";
import {
  summariseFiscalYear,
  availableFiscalYears,
  currentFiscalYear,
  fiscalYearLabel,
} from "../../lib/fiscal-year";

const C = {
  steel: "#8A8D8F", steelL: "#B8BBBE", steelD: "#5C5F61",
  oak: "#C4944A", surface: "#F5F4F1", surfaceD: "#ECEAE5",
  white: "#FFFFFF", black: "#1A1A1A", text: "#2C2C2C", textS: "#6B6B6B",
  go: "#4A7C5C", warn: "#D4A843", danger: "#C75B4A", success: "#5A8F6A",
};

const fmtSqm = (n) => `${Math.round(n || 0).toLocaleString("de-DE")} m²`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const Title = ({ children, sub }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ fontSize: 22, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{children}</h2>
    {sub && <p style={{ fontSize: 13, color: C.textS, margin: "4px 0 0" }}>{sub}</p>}
  </div>
);

const KPI = ({ label, value, sub, accent }) => (
  <div style={{ background: C.white, borderRadius: 8, padding: "20px 24px", border: `1px solid ${C.surfaceD}`, borderTop: accent ? `3px solid ${accent}` : `1px solid ${C.surfaceD}`, flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: C.textS, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 30, fontWeight: 300, color: C.text, fontFamily: "'Cormorant Garamond',serif", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.textS, marginTop: 6 }}>{sub}</div>}
  </div>
);

function Breakdown({ title, rows, total }) {
  if (!rows.length) return null;
  return (
    <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.surfaceD}`, padding: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>{title}</div>
      {rows.map((r) => {
        const pct = total > 0 ? (r.sqm / total) * 100 : 0;
        return (
          <div key={r.key} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{r.key}</span>
              <span style={{ fontSize: 12, color: C.textS }}>
                <strong style={{ color: C.text }}>{fmtSqm(r.sqm)}</strong> · {r.count} project{r.count === 1 ? "" : "s"}
              </span>
            </div>
            <div style={{ height: 6, background: C.surface, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: C.oak, borderRadius: 3 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FootprintPage({ projects = [] }) {
  const years = useMemo(() => availableFiscalYears(projects), [projects]);
  const [fy, setFy] = useState(() => currentFiscalYear());
  const s = useMemo(() => summariseFiscalYear(projects, fy), [projects, fy]);

  const noSqmAtAll = projects.every((p) => !p.sqm);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <Title sub={`Square metres built per fiscal year. FY runs 1 August → 31 July.`}>Footprint</Title>
        <select
          value={fy}
          onChange={(e) => setFy(Number(e.target.value))}
          style={{ padding: "9px 14px", borderRadius: 6, border: `1px solid ${C.surfaceD}`, fontSize: 13, background: C.white, color: C.text }}
        >
          {years.map((y) => <option key={y} value={y}>{fiscalYearLabel(y)}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 12, color: C.textS, marginBottom: 18, fontFamily: "'DM Mono',monospace" }}>
        {s.range.from} → {s.range.to}
      </div>

      {noSqmAtAll ? (
        <div style={{ background: C.white, border: `1px solid ${C.warn}55`, borderLeft: `3px solid ${C.warn}`, borderRadius: 8, padding: "18px 22px", marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 500, marginBottom: 6 }}>No square metres recorded yet</div>
          <div style={{ fontSize: 13, color: C.textS, lineHeight: 1.65 }}>
            Add a number custom field called <strong>SQM</strong> to the Asana project that Current reads from, then fill it in
            per project. New intakes populate it automatically from the Area &amp; Setup figures.
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <KPI label="Total" value={fmtSqm(s.totalSqm)} sub={`${s.projectCount} project${s.projectCount === 1 ? "" : "s"}`} accent={C.oak} />
        <KPI label="Delivered" value={fmtSqm(s.deliveredSqm)} sub={`${s.deliveredCount} completed`} accent={C.success} />
        <KPI label="Planned" value={fmtSqm(s.plannedSqm)} sub={`${s.plannedCount} in progress`} accent={C.steel} />
      </div>

      {s.missingSqmCount > 0 && (
        <div style={{ marginBottom: 24, padding: "12px 16px", background: "#FDF3E0", borderLeft: `3px solid ${C.warn}`, borderRadius: 4, fontSize: 13, color: C.text }}>
          {s.missingSqmCount} project{s.missingSqmCount === 1 ? " in this FY has" : "s in this FY have"} no SQM value, so the totals above understate the real footprint.
        </div>
      )}

      {s.projectCount > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Breakdown title="By region" rows={s.byRegion} total={s.totalSqm} />
          <Breakdown title="By type" rows={s.byType} total={s.totalSqm} />
        </div>
      )}

      <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.surfaceD}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.surface }}>
              {["Project", "Region", "Type", "Counted on", "Status", "m²"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: h === "m²" ? "right" : "left", fontWeight: 600, fontSize: 11, color: C.textS, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.surfaceD}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.rows.map((r) => (
              <tr key={r.gid} style={{ borderBottom: `1px solid ${C.surfaceD}` }}>
                <td style={{ padding: "10px 16px", fontWeight: 500 }}>{r.name}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, color: r.region ? C.text : C.textS }}>{r.region || "—"}</td>
                <td style={{ padding: "10px 16px", fontSize: 12 }}>{r.type}</td>
                <td style={{ padding: "10px 16px", fontSize: 12 }}>
                  {fmtDate(r.effectiveDate)}
                  <span style={{ color: C.textS, fontSize: 11 }}> · {r.completed ? "completed" : "due"}</span>
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: r.completed ? C.success : C.steel, background: (r.completed ? C.success : C.steel) + "1A", padding: "3px 8px", borderRadius: 4 }}>
                    {r.completed ? "Delivered" : "Planned"}
                  </span>
                </td>
                <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'DM Mono',monospace", color: r.sqmValue ? C.text : C.warn }}>
                  {r.sqmValue ? fmtSqm(r.sqmValue) : "missing"}
                </td>
              </tr>
            ))}
            {!s.rows.length && (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: C.textS, fontSize: 13 }}>No projects fall in {s.label}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
