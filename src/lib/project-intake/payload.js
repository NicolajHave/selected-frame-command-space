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
 * Human-readable filecard summary, grouped by section. Used on the
 * confirmation screen, in the email body and server logs.
 */
export function buildFilecardSummary(payload) {
  const p = payload;
  const lines = [];
  const section = (title) => lines.push("", `## ${title}`);
  const kv = (label, value) => {
    if (value === null || value === undefined || value === "") return;
    const v = Array.isArray(value) ? value.join(", ") : value;
    if (v === "" || (Array.isArray(value) && value.length === 0)) return;
    lines.push(`${label}: ${v}`);
  };

  lines.push(`# Selected Frame — Project Intake Filecard`);
  lines.push(`Submitted: ${new Date(p.submittedAt).toLocaleString("en-GB")}`);

  section("Project Basics");
  kv("Project name", p.projectBasics.projectName);
  kv("Submitted by", p.projectBasics.yourName);
  kv("Desired opening date", p.projectBasics.desiredOpeningDate);
  kv("Market / Region", p.projectBasics.marketRegion);

  section("Partner & Location");
  kv("Partner name", p.partnerLocation.partnerName);
  kv("Project nature", p.partnerLocation.projectNature);
  kv("Designed for", p.partnerLocation.designedFor);
  kv("Address", [p.partnerLocation.streetAddress, p.partnerLocation.postalCode, p.partnerLocation.cityState, p.partnerLocation.country].filter(Boolean).join(", "));
  kv("Delivery address", p.partnerLocation.deliveryAddress);

  section("Contact");
  kv("Main contact", p.contact.mainContact);
  kv("Role", p.contact.role);
  kv("Email", p.contact.email);
  kv("Phone", p.contact.phone);
  kv("Secondary contact", p.contact.secondaryContact);
  kv("Internal Selected stakeholders", p.contact.internalStakeholders);

  section("Commercial Case");
  kv("Last full-year retail sales (EUR)", p.commercialCase.lastYearRetailSales);
  kv("Estimated annual retail sales (EUR)", p.commercialCase.estimatedAnnualRetailSales);
  kv("Current sales area (m²)", p.commercialCase.currentSalesArea);
  kv("New sales area (m²)", p.commercialCase.newSalesArea);
  kv("Commercial objectives", p.commercialCase.commercialObjectives);
  kv("Other objective", p.commercialCase.otherObjective);
  kv("Partner contribution applies", p.commercialCase.partnerContribution ? "Yes" : "");
  kv("Partner contribution details", p.commercialCase.partnerContributionDetails);

  section("Area & Setup");
  kv("Existing Selected space (m²)", p.areaSetup.existingSpace);
  kv("Additional space requested (m²)", p.areaSetup.additionalSpace);
  kv("Ceiling height (m)", p.areaSetup.ceilingHeight);
  kv("Columns", p.areaSetup.columns);
  kv("Column usage", p.areaSetup.columnUsage);
  kv("Column usage notes", p.areaSetup.columnUsageNotes);
  kv("Fitting room", p.areaSetup.fittingRoom);
  kv("Fitting room state", p.areaSetup.fittingRoomState);
  kv("Fitting room notes", p.areaSetup.fittingRoomNotes);
  kv("Flooring / surface", p.areaSetup.flooring);
  kv("Area remarks", p.areaSetup.areaRemarks);

  section("Hanger System");
  kv("Selected hanger system usable", p.hangerSystem.selectedHangerUsable);
  kv("Notes", p.hangerSystem.hangerPartlyNotes);

  section("Attachments");
  for (const [group, meta] of Object.entries(p.attachments || {})) {
    const count = meta?.files?.length || 0;
    kv(group, `${meta?.status || "Missing"}${count ? ` (${count} file${count === 1 ? "" : "s"})` : ""}`);
  }

  section("Logistics & Access");
  kv("Delivery time window", p.logisticsAccess.deliveryTimeWindow);
  kv("Unloading area", p.logisticsAccess.unloadingArea);
  kv("Max height clearance", p.logisticsAccess.maxHeightClearance);
  kv("Vehicle access", p.logisticsAccess.vehicleAccess);
  kv("Logistics notes", p.logisticsAccess.logisticsNotes);

  section("Installation & Execution");
  kv("Mounting partner / installer", p.installationExecution.mountingPartner);
  kv("Installer details", p.installationExecution.installerDetails);
  kv("Allowed working hours", p.installationExecution.workingHours);
  kv("Waste / material disposal", p.installationExecution.wasteDisposal);
  kv("Site responsible during installation", p.installationExecution.siteResponsible);
  kv("Installation notes", p.installationExecution.installationNotes);

  if (p.derivedFlags.isSoftShopLikely) {
    section("Soft Shop note");
    lines.push(SOFT_SHOP_NOTE);
  }

  return lines.join("\n");
}
