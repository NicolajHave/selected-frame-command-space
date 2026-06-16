"use client";
import React, { useMemo, useState, useRef } from "react";
import {
  C, IntakeSection, Row, TextField, SelectField, RadioGroup, CheckboxGroup,
  Checkbox, ConditionalField, InfoBox, SoftShopNotice, AttachmentUploadGroup,
  AttachmentStatusBadge,
} from "./components";
import { buildPayload, buildFilecardSummary, deriveFlags, SOFT_SHOP_THRESHOLD_SQM } from "../../lib/project-intake/payload";

const Title = ({ children, sub }) => (
  <div style={{ marginBottom: 22 }}>
    <h2 style={{ fontSize: 22, fontWeight: 400, color: C.text, fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{children}</h2>
    {sub && <p style={{ fontSize: 13, color: C.textS, margin: "4px 0 0" }}>{sub}</p>}
  </div>
);

const REGIONS = ["North", "DACH", "France", "Benelux", "UK & Ireland", "Southern Europe", "Eastern Europe", "Other"];
const PROJECT_NATURES = ["New Shop In Shop Opening (>30 sqm)", "New Soft Shop Opening (<30 sqm)", "Shop Upshining", "Shop Expansion / Relocation", "Showroom Update"];
const DESIGNED_FOR = ["Womens Presentation", "Mens Presentation", "Unisex Presentation"];
const OBJECTIVES = ["Increase visibility", "Increase sell-through", "Upgrade brand presentation", "Secure / expand partner space", "Test new location", "Replace existing setup", "Other"];
const COLUMN_USAGE = ["Yes", "Yes — for branding only", "Yes — for inventory, etc.", "No — we are not allowed to use the column", "Other"];
const FITTING_STATE = ["Existing — nothing to be done", "Upshining — with Selected DNA", "Other"];
const UNLOADING = ["Ramp", "Lift", "No ramp or lift at site — lift needed on truck"];
const VEHICLE = ["Small Vehicle / Sprinter", "12m Truck", "17m Truck"];
const MOUNTING = ["Selected", "Partner", "Other"];

const ATTACHMENT_GROUPS = [
  { group: "dwgFloorplan", label: "DWG floorplan", accept: ".dwg,.dxf", multiple: false, helper: "Vector floorplan in DWG/DXF if available." },
  { group: "pdfFloorplan", label: "PDF floorplan", accept: ".pdf", multiple: false },
  { group: "photos", label: "Photos of the dedicated shop area", accept: "image/*", multiple: true, helper: "Multiple images allowed." },
  { group: "electricalPlan", label: "Electrical plan", accept: ".pdf,image/*,.dwg,.dxf", multiple: false },
  { group: "other", label: "Other documents", accept: ".pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip", multiple: true },
];

const INITIAL = {
  projectName: "", yourName: "", desiredOpeningDate: "", marketRegion: "",
  partnerName: "", projectNature: "", designedFor: "", streetAddress: "", postalCode: "", cityState: "", country: "", deliveryAddress: "",
  mainContact: "", role: "", email: "", phone: "", secondaryContact: "", internalStakeholders: "",
  lastYearRetailSales: "", estimatedAnnualRetailSales: "", currentSalesArea: "", newSalesArea: "",
  commercialObjectives: [], otherObjective: "", partnerContribution: false, partnerContributionDetails: "",
  existingSpace: "", additionalSpace: "", ceilingHeight: "", columns: "", columnUsage: "", columnUsageNotes: "",
  fittingRoom: "", fittingRoomState: "", fittingRoomNotes: "", flooring: "", areaRemarks: "",
  selectedHangerUsable: "", hangerPartlyNotes: "",
  deliveryTimeWindow: "", unloadingArea: "", maxHeightClearance: "", vehicleAccess: "", logisticsNotes: "",
  mountingPartner: "", installerDetails: "", workingHours: "", wasteDisposal: "", siteResponsible: "", installationNotes: "",
};

// Required fields → human label, for validation messages and the review block.
const REQUIRED = {
  projectName: "Project Name",
  yourName: "Your Name",
  desiredOpeningDate: "Desired Shop Opening Date",
  marketRegion: "Market / Region",
  partnerName: "Partner Name",
  projectNature: "Project Nature",
  designedFor: "Who the space is designed for",
  streetAddress: "Street Address",
  postalCode: "Postal Code",
  cityState: "City / State",
  country: "Country",
  mainContact: "Main Contact Person",
  email: "E-mail",
  phone: "Phone Number",
  currentSalesArea: "Current sales m² area",
  newSalesArea: "New sales m² area",
  existingSpace: "Existing Selected space (m²)",
  additionalSpace: "Additional space requested (m²)",
  columns: "Columns",
  fittingRoom: "Fitting Room",
  selectedHangerUsable: "Hanger system usability",
  unloadingArea: "Unloading Area",
  vehicleAccess: "Vehicle Access",
  mountingPartner: "Mounting Partner / Installer",
  workingHours: "Allowed Working Hours",
  wasteDisposal: "Waste / Material Disposal",
  siteResponsible: "Site Responsible During Installation",
};

export default function ProjectIntakePage() {
  const [form, setForm] = useState(INITIAL);
  const [attachments, setAttachments] = useState({}); // group -> [{originalName,url,path,size,type}]
  const [submitted, setSubmitted] = useState(null); // { payload, summary }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const sessionId = useRef(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).current;

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const flags = useMemo(() => deriveFlags(form), [form]);

  // Conditional required fields layered on top of the static REQUIRED map.
  const missing = useMemo(() => {
    const out = [];
    for (const [k, label] of Object.entries(REQUIRED)) {
      const v = form[k];
      if (v === "" || v === null || v === undefined) out.push({ key: k, label });
    }
    if (form.commercialObjectives.includes("Other") && !form.otherObjective) out.push({ key: "otherObjective", label: "Other commercial objective" });
    if (form.partnerContribution && !form.partnerContributionDetails) out.push({ key: "partnerContributionDetails", label: "Partner contribution details" });
    if (form.columns === "Yes" && !form.columnUsage) out.push({ key: "columnUsage", label: "Are we allowed to use the column?" });
    if (form.fittingRoom === "Yes" && !form.fittingRoomState) out.push({ key: "fittingRoomState", label: "Fitting room — existing or upshining?" });
    if (form.selectedHangerUsable === "Partly" && !form.hangerPartlyNotes) out.push({ key: "hangerPartlyNotes", label: "Hanger system explanation" });
    return out;
  }, [form]);

  const err = (k) => (showErrors && missing.some((m) => m.key === k) ? "Required" : null);

  const attachmentMeta = useMemo(() => {
    const meta = {};
    for (const g of ATTACHMENT_GROUPS) {
      const files = attachments[g.group] || [];
      meta[g.group] = { label: g.label, status: files.length ? "Uploaded" : "Missing", files };
    }
    return meta;
  }, [attachments]);

  const submit = async () => {
    if (missing.length) {
      setShowErrors(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true); setSubmitError(null);
    const payload = buildPayload(form, attachmentMeta);
    try {
      const r = await fetch("/api/project-intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Submit failed (${r.status})`);
      }
      const { summary, integrations } = await r.json();
      setSubmitted({ payload, summary: summary || buildFilecardSummary(payload), integrations });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setSubmitError(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <SuccessScreen submitted={submitted} onReset={() => { setForm(INITIAL); setAttachments({}); setSubmitted(null); setShowErrors(false); }} />;

  return (
    <div style={{ maxWidth: 920, position: "relative" }}>
      <Title sub="Start a new Selected Frame / Shop-In-Shop project.">Project Intake</Title>

      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, maxWidth: 740, marginBottom: 18 }}>
        Project Intake is the starting point for new Selected Frame and Shop-In-Shop projects. The purpose is to collect
        the right project information from the beginning, reduce back-and-forth communication and create a stronger
        foundation for briefing, quotation and execution.
      </div>

      <div style={{ fontSize: 11.5, color: C.textS, fontStyle: "italic", marginBottom: 24, lineHeight: 1.6 }}>
        This is the first native version of the Project Intake flow. More automation, filecard editing and Asana
        integration will be added in future versions.
      </div>

      {/* Compact status summary */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: C.surface, paddingTop: 4, paddingBottom: 10, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 8, padding: "10px 16px" }}>
          <div style={{ fontSize: 12, color: C.textS }}>
            {missing.length === 0
              ? <span style={{ color: C.go, fontWeight: 600 }}>All required fields complete</span>
              : <span>{missing.length} required field{missing.length === 1 ? "" : "s"} remaining</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {flags.isSoftShopLikely && <span style={{ fontSize: 10, fontWeight: 700, color: C.warn, background: "#FDF3E0", padding: "3px 9px", borderRadius: 4, textTransform: "uppercase", letterSpacing: ".4px" }}>Soft Shop</span>}
            <button onClick={submit} disabled={submitting} style={{ fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 6, border: "none", background: submitting ? C.steelL : C.black, color: C.white, cursor: submitting ? "wait" : "pointer" }}>
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {showErrors && missing.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <InfoBox tone="warn" title={`${missing.length} required field${missing.length === 1 ? "" : "s"} missing`}>
            {missing.map((m) => m.label).join(" · ")}
          </InfoBox>
        </div>
      )}

      {/* 1 — Project Basics */}
      <IntakeSection number={1} title="Project Basics">
        <Row>
          <TextField label="Project Name" required value={form.projectName} onChange={set("projectName")} error={err("projectName")} />
          <TextField label="Your Name" required value={form.yourName} onChange={set("yourName")} error={err("yourName")} />
        </Row>
        <Row>
          <TextField label="Desired Shop Opening Date" required type="date" value={form.desiredOpeningDate} onChange={set("desiredOpeningDate")} error={err("desiredOpeningDate")} helper="Please note that delivery date will be scheduled later based on the desired opening date." />
          <SelectField label="Market / Region" required value={form.marketRegion} onChange={set("marketRegion")} options={REGIONS} error={err("marketRegion")} />
        </Row>
      </IntakeSection>

      {/* 2 — Partner & Location */}
      <IntakeSection number={2} title="Partner & Location">
        <TextField label="Partner Name" required value={form.partnerName} onChange={set("partnerName")} error={err("partnerName")} helper="Name of the partner, store or showroom." />
        <SelectField label="Project Nature" required value={form.projectNature} onChange={set("projectNature")} options={PROJECT_NATURES} error={err("projectNature")} />
        <RadioGroup label="Who is the space designed for?" required value={form.designedFor} onChange={set("designedFor")} options={DESIGNED_FOR} error={err("designedFor")} inline />
        <Row>
          <TextField label="Street Address" required value={form.streetAddress} onChange={set("streetAddress")} error={err("streetAddress")} />
          <TextField label="Postal Code" required value={form.postalCode} onChange={set("postalCode")} error={err("postalCode")} />
        </Row>
        <Row>
          <TextField label="City / State" required value={form.cityState} onChange={set("cityState")} error={err("cityState")} />
          <TextField label="Country" required value={form.country} onChange={set("country")} error={err("country")} />
        </Row>
        <TextField label="Delivery Address" textarea value={form.deliveryAddress} onChange={set("deliveryAddress")} helper="If delivery goes somewhere else, note the correct address here. Leave blank if delivery address is the same as above." />
      </IntakeSection>

      {/* 3 — Contact */}
      <IntakeSection number={3} title="Contact">
        <Row>
          <TextField label="Main Contact Person" required value={form.mainContact} onChange={set("mainContact")} error={err("mainContact")} helper="Add full name for coordination." />
          <TextField label="Role / Function" value={form.role} onChange={set("role")} helper="E.g. Store Manager, VM, Agent." />
        </Row>
        <Row>
          <TextField label="E-mail" required type="email" value={form.email} onChange={set("email")} error={err("email")} />
          <TextField label="Phone Number" required value={form.phone} onChange={set("phone")} error={err("phone")} helper="Preferably mobile, including country code." />
        </Row>
        <TextField label="Secondary Contact" value={form.secondaryContact} onChange={set("secondaryContact")} helper="If there is an additional person involved, e.g. logistics or operations, include them here." />
        <TextField label="Internal Selected Stakeholders" textarea value={form.internalStakeholders} onChange={set("internalStakeholders")} helper="If other SELECTED team members should be referenced, add their names here." />
      </IntakeSection>

      {/* 4 — Commercial Case */}
      <IntakeSection number={4} title="Commercial Case">
        <Row>
          <TextField label="Actual Last Full Year Retail Sales" type="number" suffix="EUR" value={form.lastYearRetailSales} onChange={set("lastYearRetailSales")} helper="Latest full-year retail sales for SELECTED in this location. If this is a new shop or showroom request, type 0 or leave blank." />
          <TextField label="Estimated Annual Retail Sales after opening" type="number" suffix="EUR" value={form.estimatedAnnualRetailSales} onChange={set("estimatedAnnualRetailSales")} helper="Best estimate once the setup is fully operational." />
        </Row>
        <Row>
          <TextField label="Current sales m² area used for Selected" required type="number" suffix="m²" value={form.currentSalesArea} onChange={set("currentSalesArea")} error={err("currentSalesArea")} helper="Current square metres allocated to SELECTED. If no SIS is in place today, type 0." />
          <TextField label="New sales m² area used for Selected after opening" required type="number" suffix="m²" value={form.newSalesArea} onChange={set("newSalesArea")} error={err("newSalesArea")} />
        </Row>
        {flags.isSoftShopLikely && <SoftShopNotice />}
        <CheckboxGroup label="Commercial Objective" values={form.commercialObjectives} onChange={set("commercialObjectives")} options={OBJECTIVES} />
        <ConditionalField when={form.commercialObjectives.includes("Other")}>
          <TextField label="Other commercial objective" value={form.otherObjective} onChange={set("otherObjective")} error={err("otherObjective")} />
        </ConditionalField>
        <Checkbox label="Partner contribution applies" checked={form.partnerContribution} onChange={set("partnerContribution")} />
        <ConditionalField when={form.partnerContribution}>
          <TextField label="Partner contribution details" required textarea value={form.partnerContributionDetails} onChange={set("partnerContributionDetails")} error={err("partnerContributionDetails")} placeholder="Add % contribution, maximum amount, or maximum amount per sqm." />
        </ConditionalField>
      </IntakeSection>

      {/* 5 — Area & Setup */}
      <IntakeSection number={5} title="Area & Setup">
        <Row>
          <TextField label="Existing Selected space (m²)" required type="number" suffix="m²" value={form.existingSpace} onChange={set("existingSpace")} error={err("existingSpace")} helper="Current square metres allocated to SELECTED. If no SIS is in place today, type 0." />
          <TextField label="Additional space requested (m²)" required type="number" suffix="m²" value={form.additionalSpace} onChange={set("additionalSpace")} error={err("additionalSpace")} helper="New square metres requested within this SIS. If square metres are the same, type 0." />
        </Row>
        <TextField label="Ceiling Height" type="number" suffix="m" value={form.ceilingHeight} onChange={set("ceilingHeight")} helper="Measure from finished floor to ceiling." />
        <RadioGroup label="Columns" required value={form.columns} onChange={set("columns")} options={["Yes", "No"]} error={err("columns")} inline />
        <ConditionalField when={form.columns === "Yes"}>
          <RadioGroup label="Are we allowed to use the column?" required value={form.columnUsage} onChange={set("columnUsage")} options={COLUMN_USAGE} error={err("columnUsage")} />
          <ConditionalField when={form.columnUsage === "Other"}>
            <div style={{ marginTop: 14 }}>
              <TextField label="Column usage notes" textarea value={form.columnUsageNotes} onChange={set("columnUsageNotes")} />
            </div>
          </ConditionalField>
        </ConditionalField>
        <RadioGroup label="Fitting Room" required value={form.fittingRoom} onChange={set("fittingRoom")} options={["Yes", "No"]} error={err("fittingRoom")} inline />
        <ConditionalField when={form.fittingRoom === "Yes"}>
          <RadioGroup label="Is it existing or does it need upshining with Selected DNA?" required value={form.fittingRoomState} onChange={set("fittingRoomState")} options={FITTING_STATE} error={err("fittingRoomState")} />
          <ConditionalField when={form.fittingRoomState === "Other"}>
            <div style={{ marginTop: 14 }}>
              <TextField label="Fitting room notes" textarea value={form.fittingRoomNotes} onChange={set("fittingRoomNotes")} />
            </div>
          </ConditionalField>
        </ConditionalField>
        <TextField label="Flooring / Surface Material" textarea value={form.flooring} onChange={set("flooring")} helper="Note current flooring or surface type. Useful for material and furniture planning." />
        <TextField label="Other Remarks — Area & Setup" textarea value={form.areaRemarks} onChange={set("areaRemarks")} helper="Add any additional notes about the space that could affect design, installation or visual planning." />
      </IntakeSection>

      {/* 6 — Hanger System */}
      <IntakeSection number={6} title="Hanger System">
        <RadioGroup label="Can SELECTED-branded hanger system be used in the space?" required value={form.selectedHangerUsable} onChange={set("selectedHangerUsable")} options={["Yes", "No", "Partly"]} error={err("selectedHangerUsable")} inline />
        <ConditionalField when={form.selectedHangerUsable === "Partly"}>
          <TextField label="Please explain where SELECTED hangers can/cannot be used" required textarea value={form.hangerPartlyNotes} onChange={set("hangerPartlyNotes")} error={err("hangerPartlyNotes")} placeholder="Add relevant restrictions or category-specific limitations." />
        </ConditionalField>
      </IntakeSection>

      {/* 7 — Attachments */}
      <IntakeSection number={7} title="Attachments">
        <InfoBox tone="oak">
          Uploaded files will be reviewed by Brand Spaces. “Approved” means the file is usable for project start and
          drawing brief — not that the final layout is approved.
        </InfoBox>
        {ATTACHMENT_GROUPS.map((g) => (
          <AttachmentUploadGroup
            key={g.group}
            group={g.group}
            label={g.label}
            helper={g.helper}
            accept={g.accept}
            multiple={g.multiple}
            sessionId={sessionId}
            files={attachments[g.group] || []}
            onChange={(files) => setAttachments((a) => ({ ...a, [g.group]: files }))}
          />
        ))}
      </IntakeSection>

      {/* 8 — Logistics & Access */}
      <IntakeSection number={8} title="Logistics & Access">
        <TextField label="Delivery Time Window" value={form.deliveryTimeWindow} onChange={set("deliveryTimeWindow")} helper="If a delivery window is required on the day, specify the time window. Minimum 2-hour window. Leave blank if no time window is needed." />
        <RadioGroup label="Unloading Area" required value={form.unloadingArea} onChange={set("unloadingArea")} options={UNLOADING} error={err("unloadingArea")} />
        <TextField label="Max Height Clearance" value={form.maxHeightClearance} onChange={set("maxHeightClearance")} helper="State the maximum height clearance for trucks or delivery vans in metres." />
        <RadioGroup label="Vehicle Access" required value={form.vehicleAccess} onChange={set("vehicleAccess")} options={VEHICLE} error={err("vehicleAccess")} inline />
        <TextField label="Additional Notes — Logistics & Access" textarea value={form.logisticsNotes} onChange={set("logisticsNotes")} helper="Add any logistical details that might affect transport, delivery or setup." />
      </IntakeSection>

      {/* 9 — Installation & Execution */}
      <IntakeSection number={9} title="Installation & Execution">
        <RadioGroup label="Mounting Partner / Installer" required value={form.mountingPartner} onChange={set("mountingPartner")} options={MOUNTING} error={err("mountingPartner")} inline />
        <ConditionalField when={form.mountingPartner === "Other"}>
          <TextField label="Installer details" value={form.installerDetails} onChange={set("installerDetails")} />
        </ConditionalField>
        <TextField label="Allowed Working Hours" required value={form.workingHours} onChange={set("workingHours")} error={err("workingHours")} helper="When can setup and installation take place? E.g. 08:00–20:00 or after closing hours only." />
        <RadioGroup label="Waste / Material Disposal" required value={form.wasteDisposal} onChange={set("wasteDisposal")} options={["Yes", "No"]} error={err("wasteDisposal")} inline />
        <TextField label="Site Responsible During Installation" required textarea value={form.siteResponsible} onChange={set("siteResponsible")} error={err("siteResponsible")} helper="Who will be the local Selected responsible person during or after setup and merchandising? Add name, phone number and email." />
        <TextField label="Additional Notes — Installation & Execution" textarea value={form.installationNotes} onChange={set("installationNotes")} />
      </IntakeSection>

      {/* 10 — Review & Submit */}
      <IntakeSection number={10} title="Review & Submit">
        <ReviewBlock form={form} flags={flags} missing={missing} attachmentMeta={attachmentMeta} />
        {flags.isSoftShopLikely && <SoftShopNotice />}
        {submitError && <InfoBox tone="warn" title="Submission failed">{submitError}</InfoBox>}
        <button onClick={submit} disabled={submitting}
          style={{ alignSelf: "flex-start", fontSize: 14, fontWeight: 600, padding: "13px 26px", borderRadius: 8, border: "none", background: submitting ? C.steelL : C.black, color: C.white, cursor: submitting ? "wait" : "pointer" }}>
          {submitting ? "Submitting…" : "Submit Project Intake"}
        </button>
      </IntakeSection>
    </div>
  );
}

function ReviewBlock({ form, flags, missing, attachmentMeta }) {
  const summaryRows = [
    ["Project", form.projectName || "—"],
    ["Partner", form.partnerName || "—"],
    ["Nature", form.projectNature || "—"],
    ["Region", form.marketRegion || "—"],
    ["New sales area", form.newSalesArea !== "" ? `${form.newSalesArea} m²` : "—"],
    ["Desired opening", form.desiredOpeningDate || "—"],
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
        {summaryRows.map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 8 }}>Attachments</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.values(attachmentMeta).map((m) => (
            <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.text }}>
              <span>{m.label}</span><AttachmentStatusBadge status={m.status} />
            </div>
          ))}
        </div>
      </div>

      {missing.length > 0 ? (
        <InfoBox tone="warn" title={`${missing.length} required field${missing.length === 1 ? "" : "s"} still missing`}>
          {missing.map((m) => m.label).join(" · ")}
        </InfoBox>
      ) : (
        <InfoBox tone="go" title="Ready to submit">All required fields are complete.</InfoBox>
      )}
    </div>
  );
}

function SuccessScreen({ submitted, onReset }) {
  const ig = submitted.integrations || {};
  const hasLinks = ig.pdf?.ok || ig.asana?.ok || ig.folder?.ok;
  return (
    <div style={{ maxWidth: 760 }}>
      <Title sub="Start a new Selected Frame / Shop-In-Shop project.">Project Intake</Title>
      <div style={{ background: C.white, border: `1px solid ${C.surfaceD}`, borderTop: `3px solid ${C.go}`, borderRadius: 10, padding: 28, marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.go, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>Submitted</div>
        <div style={{ fontSize: 20, fontWeight: 400, fontFamily: "'Cormorant Garamond',serif", color: C.text, marginBottom: 8 }}>Thank you. The project intake has been submitted to Brand Spaces.</div>
        <div style={{ fontSize: 13, color: C.textS, lineHeight: 1.65 }}>
          A filecard PDF has been generated and the project has been created in Asana. It appears in Current within ~15 minutes.
        </div>
        <div style={{ fontSize: 12, color: C.textS, fontStyle: "italic", lineHeight: 1.6, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.surfaceD}` }}>
          In a later version, this confirmation will include site readiness guidance and required preparation before installation.
        </div>
      </div>

      {hasLinks && (
        <div style={{ background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 10, padding: 24, marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>What was created</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ig.pdf?.ok && (
              <a href={ig.pdf.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: C.surface, borderRadius: 8, textDecoration: "none", color: C.text }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Filecard PDF</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.oak }}>Open PDF →</span>
              </a>
            )}
            {ig.asana?.ok && (
              <a href={ig.asana.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: C.surface, borderRadius: 8, textDecoration: "none", color: C.text }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Asana task created</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.oak }}>Open in Asana →</span>
              </a>
            )}
            {ig.folder?.ok && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: C.surface, borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>External Project Folder</span>
                <span style={{ fontSize: 12, color: C.textS }}>{ig.filesCopied ? `${ig.filesCopied} file${ig.filesCopied === 1 ? "" : "s"} + PDF copied in` : "Created · PDF copied in"}</span>
              </div>
            )}
          </div>
          {(ig.asana && !ig.asana.ok) && (
            <div style={{ marginTop: 12, fontSize: 11, color: C.textS, fontStyle: "italic" }}>
              Asana task not created ({ig.asana.reason}). The filecard summary below is still saved.
            </div>
          )}
        </div>
      )}

      <div style={{ background: C.white, border: `1px solid ${C.surfaceD}`, borderRadius: 10, padding: 24, marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textS, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Filecard summary</div>
        <pre style={{ fontSize: 12, color: C.text, lineHeight: 1.65, whiteSpace: "pre-wrap", fontFamily: "'DM Mono',monospace", margin: 0 }}>{submitted.summary}</pre>
      </div>

      <button onClick={onReset} style={{ fontSize: 13, fontWeight: 500, padding: "11px 22px", borderRadius: 8, border: `1px solid ${C.surfaceD}`, background: C.white, color: C.text, cursor: "pointer" }}>
        Submit another project
      </button>
    </div>
  );
}
