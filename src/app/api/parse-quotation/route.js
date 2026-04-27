export const dynamic = 'force-dynamic';

function parseEuro(raw) {
  if (!raw) return 0;
  let s = raw.replace(/€/g, '').trim();
  if (s === '-' || s === '') return 0;
  s = s.replace(/\s+/g, '');
  if (/,\d{1,2}$/.test(s) && !s.includes('.')) { s = s.replace(',', '.'); return parseFloat(s) || 0; }
  s = s.replace(/\.(\d{3})/g, '$1');
  s = s.replace(/[.,]/g, '');
  return parseFloat(s) || 0;
}

// Extract ALL euro amounts from a line - handles BOTH formats:
// Format A (pdftotext): "€ 3 7.225" - € before number
// Format B (pdf.js):    "37.225€"   - € after number
function extractEuros(line) {
  const matches = [];
  const regexA = /€\s*([\d\s.,]+)/g;
  let m;
  while ((m = regexA.exec(line)) !== null) {
    const val = parseEuro(m[1]);
    if (val > 0) matches.push(val);
  }
  const regexB = /([\d.,]+)\s*€/g;
  while ((m = regexB.exec(line)) !== null) {
    const val = parseEuro(m[1]);
    if (val > 0 && !matches.includes(val)) matches.push(val);
  }
  return matches;
}

export async function POST(request) {
  try {
    const { lines } = await request.json();
    if (!lines?.length) return Response.json({ error: 'No lines' }, { status: 400 });

    // Collect warnings - non-blocking issues that user should review
    const warnings = [];
    const addWarn = (severity, message, context = null) => warnings.push({ severity, message, context });

    const fullText = lines.join('\n');
    const get = (p) => { const m = fullText.match(p); return m ? m[1].trim() : null; };
    const header = {
      project: get(/Project:\s*(.+)/),
      salesArea: parseInt(get(/Sales area,?\s*sqm:\s*(\d+)/) || '0'),
      gender: get(/Gender:\s*(\w+)/),
      updated: get(/Updated:\s*(.+)/),
      revision: get(/Revision:\s*(.+)/),
      deliveryDate: get(/Delivery date:\s*(.+)/) || 'TBC',
      openingDate: get(/Target opening date:\s*(.+)/) || 'TBC',
      supplier: '&elements ApS',
    };

    // Header warnings
    if (!header.project) addWarn('warn', 'Project name not found in PDF header');
    if (!header.salesArea) addWarn('warn', 'Sales area (sqm) not found - SQM price will be missing');
    if (!header.gender) addWarn('info', 'Gender not specified in PDF');

    const categories = [];
    let currentCat = null;
    const catNames = ['INVENTORY', 'SELECTED DELIVERIES', 'SPECIFIC PROJECT COST', 'SPECIAL ELEMENTS', 'FITTING ROOMS', 'FLOOR', 'AV & HIFI', 'CONSTRUCTION'];
    let grandTotal = 0, grandSqm = 0;
    let inSummary = false;

    // Track unmatched lines for warnings
    let unmatchedItemLines = 0;
    let droppedItems = 0;
    const seenCategoryHeaders = new Set();

    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      const upper = t.toUpperCase();

      // Summary section
      if (t.includes('Project cost overview') || upper.includes('HEADERS')) { inSummary = true; continue; }
      if (t.startsWith('Conditions:') || t.startsWith('Payment terms')) break;

      if (inSummary) {
        if (upper.includes('TOTAL EXCL') || upper.startsWith('TOTAL EXCL')) {
          const euros = extractEuros(t);
          if (euros.length >= 1) grandTotal = euros[0];
          if (euros.length >= 2) grandSqm = euros[1];
        }
        continue;
      }

      // Category header (line that is just the category name, no €)
      const matchedCat = catNames.find(c => upper === c || upper.startsWith(c));
      if (matchedCat && !t.includes('€')) {
        currentCat = { name: matchedCat, items: [], total: 0 };
        categories.push(currentCat);
        seenCategoryHeaders.add(matchedCat);
        continue;
      }

      // Detect potential category headers we might have missed
      // (uppercase line of 3+ chars, no euros, not a known label)
      if (!currentCat && !t.includes('€') && t.length >= 3 && t.length <= 40 &&
          t === upper && !/^[\d\s._-]+$/.test(t) &&
          !upper.includes('PRODUCT') && !upper.includes('ITEM') &&
          !upper.includes('PROJECT') && !upper.includes('SALES') &&
          !upper.includes('GENDER') && !upper.includes('UPDATED') &&
          !upper.includes('REVISION') && !upper.includes('DELIVERY') &&
          !upper.includes('TARGET') && !upper.includes('SUPPLIER')) {
        addWarn('warn', `Possible unrecognised category: "${t}"`, { line: t });
      }

      if (upper.includes('PRODUCT NAME') || upper.includes('ITEM NO.')) continue;
      if (!currentCat) continue;

      // Total line for category
      if (/^Total/i.test(t)) {
        const euros = extractEuros(t);
        if (euros.length > 0) currentCat.total = euros[euros.length - 1];
        else addWarn('warn', `Total line found in ${currentCat.name} but no amount detected`, { line: t });
        continue;
      }

      if (t.startsWith('Transportation & Accomodation') || t.startsWith('Freight & Logistic')) continue;

      // Item line - must contain €
      if (t.includes('€')) {
        const euros = extractEuros(t);
        const totalPrice = euros.length >= 1 ? euros[euros.length - 1] : 0;
        const unitPrice = euros.length >= 2 ? euros[euros.length - 2] : 0;
        const qtyMatch = t.match(/(\d+)\s*(pcs|Hours|hours|pack|Pack|km)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;
        let name = qtyMatch ? t.substring(0, t.indexOf(qtyMatch[0])).trim() : t.split('€')[0].split(/\d+[.,]\d+€/).at(0)?.trim() || '';
        name = name.replace(/^[\d._-]+[A-Za-z]?\s+/, '').trim();
        if (!name || name.length < 2) {
          const beforeNum = t.match(/^([\d._-]+[A-Za-z]?\s+)?(.+?)(?=\d+\s*(?:pcs|Hours|pack|km)|[\d.,]+\s*€)/);
          name = beforeNum ? beforeNum[2].trim() : t.substring(0, 40).trim();
        }
        if (name && name.length > 1 && (totalPrice > 0 || qty > 0)) {
          currentCat.items.push({ name, qty, unitPrice, totalPrice });
        } else {
          droppedItems++;
          unmatchedItemLines++;
          if (droppedItems <= 5) {
            addWarn('warn', `Item line could not be parsed in ${currentCat.name}`, { line: t.substring(0, 80) });
          }
        }
      }
    }

    if (droppedItems > 5) {
      addWarn('warn', `${droppedItems - 5} additional item lines could not be parsed (showing first 5 only)`);
    }

    // Validate: are there categories without totals?
    categories.forEach(cat => {
      if (cat.items.length > 0 && cat.total === 0) {
        addWarn('warn', `${cat.name} has ${cat.items.length} items but Total line missing or zero`);
      }
      if (cat.items.length === 0 && cat.total === 0) {
        addWarn('info', `${cat.name} category found but contained no parseable items`);
      }
    });

    // Build summary from category Total lines
    const getCat = (n) => categories.find(c => c.name === n)?.total || 0;
    const summary = {
      inventory: getCat('INVENTORY'),
      selectedDeliveries: getCat('SELECTED DELIVERIES'),
      specificProjectCost: getCat('SPECIFIC PROJECT COST'),
      specialElements: getCat('SPECIAL ELEMENTS'),
      fittingRooms: getCat('FITTING ROOMS'),
      floor: getCat('FLOOR'),
      avHifi: getCat('AV & HIFI'),
      construction: getCat('CONSTRUCTION'),
      totalExclVat: grandTotal || 0,
      sqmPrice: grandSqm || 0,
    };

    // Sanity check: do category totals add up to grand total?
    if (summary.totalExclVat > 0) {
      const sumOfCats = summary.inventory + summary.selectedDeliveries + summary.specificProjectCost +
                        summary.specialElements + summary.fittingRooms + summary.floor +
                        summary.avHifi + summary.construction;
      const diff = Math.abs(summary.totalExclVat - sumOfCats);
      const tolerance = Math.max(50, summary.totalExclVat * 0.02); // 2% or €50, whichever is larger
      if (sumOfCats > 0 && diff > tolerance) {
        addWarn('warn', `Category totals (€${sumOfCats.toLocaleString('de-DE')}) don't match grand total (€${summary.totalExclVat.toLocaleString('de-DE')}) - difference €${Math.round(diff).toLocaleString('de-DE')}`);
      }
    }

    if (!summary.totalExclVat) {
      summary.totalExclVat = Object.values(summary).reduce((a, b) => a + b, 0) - summary.sqmPrice;
      addWarn('info', 'Grand total not found in PDF - calculated from category sums');
    }
    if (!summary.sqmPrice && header.salesArea > 0 && summary.totalExclVat > 0) {
      summary.sqmPrice = Math.round(summary.totalExclVat / header.salesArea);
    }

    // No categories at all = parse failure
    if (categories.length === 0) {
      addWarn('error', 'No categories detected - PDF format may have changed or file is not a supplier quotation');
    }

    return Response.json({
      ...header,
      categories,
      summary,
      parseWarnings: warnings,
      parseStats: {
        totalLines: lines.length,
        categoriesFound: categories.length,
        itemsExtracted: categories.reduce((s, c) => s + c.items.length, 0),
        itemsDropped: droppedItems,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
