// Project Intake — shared payload helpers.
//
// Pure functions used by BOTH the client (confirmation screen) and the server
// (/api/project-intake/submit). Keep this dependency-free so it can be
// imported from either runtime.

export const SOFT_SHOP_THRESHOLD_SQM = 30;

export const SOFT_SHOP_NOTE =
  "Based on the entered sales area, this project is expected to be handled as a Soft Shop Solution. As a starting point, shopfitting is not included and must be handled locally by the market/partner. If shopfitting support is requested, the cost must be covered by the market/partner.";

function num(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Derive the boolean/derived flags from raw form values. Single source of
 * truth so the UI and the stored payload never disagree.
 */
export function deriveFlags(form) {
  const newArea = num(form.newSalesArea);
  const isSoftShopLikely = newArea !== null && newArea < SOFT_SHOP_THRESHOLD_SQM;
  return {
    isSoftShopLikely,
    partnerContributionApplies: Boolean(form.partnerContribution),
    columnsRequireFollowUp:
      form.columns === "Yes" &&
      (!form.columnUsage || form.columnUsage === "Other"),
    fittingRoomRequiresUpshining:
      form.fittingRoom === "Yes" && form.fittingRoomState === "Upshining — with Selected DNA",
  };
}

/**
 * Build the structured submission payload from flat form state + attachment
 * metadata. Grouped by section, with derivedFlags and submittedAt.
 */
export function buildPayload(form, attachments) {
  return {
    projectBasics: {
      projectName: form.projectName || "",
      yourName: form.yourName || "",
      desiredOpeningDate: form.desiredOpeningDate || "",
      marketRegion: form.marketRegion || "",
    },
    partnerLocation: {
      partnerName: form.partnerName || "",
      projectNature: form.projectNature || "",
      designedFor: form.designedFor || "",
      streetAddress: form.streetAddress || "",
      postalCode: form.postalCode || "",
      cityState: form.cityState || "",
      country: form.country || "",
      deliveryAddress: form.deliveryAddress || "",
    },
    contact: {
      mainContact: form.mainContact || "",
      role: form.role || "",
      email: form.email || "",
      phone: form.phone || "",
      secondaryContact: form.secondaryContact || "",
      internalStakeholders: form.internalStakeholders || "",
    },
    commercialCase: {
      lastYearRetailSales: num(form.lastYearRetailSales),
      estimatedAnnualRetailSales: num(form.estimatedAnnualRetailSales),
      currentSalesArea: num(form.currentSalesArea),
      newSalesArea: num(form.newSalesArea),
      commercialObjectives: form.commercialObjectives || [],
      otherObjective: form.otherObjective || "",
      partnerContribution: Boolean(form.partnerContribution),
      partnerContributionDetails: form.partnerContributionDetails || "",
    },
    areaSetup: {
      existingSpace: num(form.existingSpace),
      additionalSpace: num(form.additionalSpace),
      ceilingHeight: form.ceilingHeight || "",
      columns: form.columns || "",
      columnUsage: form.columnUsage || "",
      columnUsageNotes: form.columnUsageNotes || "",
      fittingRoom: form.fittingRoom || "",
      fittingRoomState: form.fittingRoomState || "",
      fittingRoomNotes: form.fittingRoomNotes || "",
      flooring: form.flooring || "",
      areaRemarks: form.areaRemarks || "",
    },
    hangerSystem: {
      selectedHangerUsable: form.selectedHangerUsable || "",
      hangerPartlyNotes: form.hangerPartlyNotes || "",
    },
    attachments: attachments || {},
    logisticsAccess: {
      deliveryTimeWindow: form.deliveryTimeWindow || "",
      unloadingArea: form.unloadingArea || "",
      maxHeightClearance: form.maxHeightClearance || "",
      vehicleAccess: form.vehicleAccess || "",
      logisticsNotes: form.logisticsNotes || "",
    },
    installationExecution: {
      mountingPartner: form.mountingPartner || "",
      installerDetails: form.installerDetails || "",
      workingHours: form.workingHours || "",
      wasteDisposal: form.wasteDisposal || "",
      siteResponsible: form.siteResponsible || "",
      installationNotes: form.installationNotes || "",
    },
    derivedFlags: deriveFlags(form),
    submittedAt: new Date().toISOString(),
  };
}

/**
 * Structured filecard sections — single source of truth for both the
 * plain-text summary and the PDF. Each section is { title, rows } where rows
 * is an array of [label, value] with empties already filtered out, OR
 * { title, text } for a free paragraph (the Soft Shop note).
 */
export function buildFilecardSections(payload) {
  const p = payload;
  const sections = [];
  const sec = (title, rows) => {
    const filtered = rows
      .filter(([, v]) => {
        if (v === null || v === undefined || v === "") return false;
        if (Array.isArray(v) && v.length === 0) return false;
        return true;
      })
      .map(([label, v]) => [label, Array.isArray(v) ? v.join(", ") : String(v)]);
    sections.push({ title, rows: filtered });
  };

  sec("Project Basics", [
    ["Project name", p.projectBasics.projectName],
    ["Submitted by", p.projectBasics.yourName],
    ["Desired opening date", p.projectBasics.desiredOpeningDate],
    ["Market / Region", p.projectBasics.marketRegion],
  ]);

  sec("Partner & Location", [
    ["Partner name", p.partnerLocation.partnerName],
    ["Project nature", p.partnerLocation.projectNature],
    ["Designed for", p.partnerLocation.designedFor],
    ["Address", [p.partnerLocation.streetAddress, p.partnerLocation.postalCode, p.partnerLocation.cityState, p.partnerLocation.country].filter(Boolean).join(", ")],
    ["Delivery address", p.partnerLocation.deliveryAddress],
  ]);

  sec("Contact", [
    ["Main contact", p.contact.mainContact],
    ["Role", p.contact.role],
    ["Email", p.contact.email],
    ["Phone", p.contact.phone],
    ["Secondary contact", p.contact.secondaryContact],
    ["Internal Selected stakeholders", p.contact.internalStakeholders],
  ]);

  sec("Commercial Case", [
    ["Last full-year retail sales (EUR)", p.commercialCase.lastYearRetailSales],
    ["Estimated annual retail sales (EUR)", p.commercialCase.estimatedAnnualRetailSales],
    ["Current sales area (m²)", p.commercialCase.currentSalesArea],
    ["New sales area (m²)", p.commercialCase.newSalesArea],
    ["Commercial objectives", p.commercialCase.commercialObjectives],
    ["Other objective", p.commercialCase.otherObjective],
    ["Partner contribution applies", p.commercialCase.partnerContribution ? "Yes" : ""],
    ["Partner contribution details", p.commercialCase.partnerContributionDetails],
  ]);

  sec("Area & Setup", [
    ["Existing Selected space (m²)", p.areaSetup.existingSpace],
    ["Additional space requested (m²)", p.areaSetup.additionalSpace],
    ["Ceiling height (m)", p.areaSetup.ceilingHeight],
    ["Columns", p.areaSetup.columns],
    ["Column usage", p.areaSetup.columnUsage],
    ["Column usage notes", p.areaSetup.columnUsageNotes],
    ["Fitting room", p.areaSetup.fittingRoom],
    ["Fitting room state", p.areaSetup.fittingRoomState],
    ["Fitting room notes", p.areaSetup.fittingRoomNotes],
    ["Flooring / surface", p.areaSetup.flooring],
    ["Area remarks", p.areaSetup.areaRemarks],
  ]);

  sec("Hanger System", [
    ["Selected hanger system usable", p.hangerSystem.selectedHangerUsable],
    ["Notes", p.hangerSystem.hangerPartlyNotes],
  ]);

  const attachmentRows = [];
  for (const [group, meta] of Object.entries(p.attachments || {})) {
    const count = meta?.files?.length || 0;
    attachmentRows.push([group, `${meta?.status || "Missing"}${count ? ` (${count} file${count === 1 ? "" : "s"})` : ""}`]);
  }
  sec("Attachments", attachmentRows);

  sec("Logistics & Access", [
    ["Delivery time window", p.logisticsAccess.deliveryTimeWindow],
    ["Unloading area", p.logisticsAccess.unloadingArea],
    ["Max height clearance", p.logisticsAccess.maxHeightClearance],
    ["Vehicle access", p.logisticsAccess.vehicleAccess],
    ["Logistics notes", p.logisticsAccess.logisticsNotes],
  ]);

  sec("Installation & Execution", [
    ["Mounting partner / installer", p.installationExecution.mountingPartner],
    ["Installer details", p.installationExecution.installerDetails],
    ["Allowed working hours", p.installationExecution.workingHours],
    ["Waste / material disposal", p.installationExecution.wasteDisposal],
    ["Site responsible during installation", p.installationExecution.siteResponsible],
    ["Installation notes", p.installationExecution.installationNotes],
  ]);

  if (p.derivedFlags.isSoftShopLikely) {
    sections.push({ title: "Soft Shop note", text: SOFT_SHOP_NOTE });
  }

  return sections;
}

/**
 * Human-readable filecard summary, grouped by section. Used on the
 * confirmation screen, in the email body and server logs. Rendered from
 * buildFilecardSections so the PDF and the text never disagree.
 */
export function buildFilecardSummary(payload) {
  const p = payload;
  const lines = [
    `# Selected Frame — Project Intake Filecard`,
    `Submitted: ${new Date(p.submittedAt).toLocaleString("en-GB")}`,
  ];
  for (const s of buildFilecardSections(payload)) {
    lines.push("", `## ${s.title}`);
    if (s.text) lines.push(s.text);
    else for (const [label, value] of s.rows) lines.push(`${label}: ${value}`);
  }
  return lines.join("\n");
}
