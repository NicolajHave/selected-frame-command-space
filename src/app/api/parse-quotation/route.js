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

function extractEuros(line) {
  const matches = [];
  const regex = /€\s*([\d\s.,]+|-)/g;
  let m;
  while ((m = regex.exec(line)) !== null) matches.push(parseEuro(m[1]));
  return matches;
}

export async function POST(request) {
  try {
    const { lines } = await request.json();
    if (!lines?.length) return Response.json({ error: 'No lines provided' }, { status: 400 });

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

    const categories = [];
    let currentCat = null;
    const catHeaders = ['INVENTORY', 'SELECTED DELIVERIES', 'SPECIFIC PROJECT COST', 'SPECIAL ELEMENTS', 'FITTING ROOMS', 'FLOOR', 'AV & HIFI', 'CONSTRUCTION'];
    let grandTotal = 0;
    let grandSqmPrice = 0;
    let inSummary = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Skip the Project cost overview section entirely - we get totals from category Total lines
      if (trimmed.includes('Project cost overview')) { inSummary = true; continue; }
      if (trimmed.startsWith('Conditions:')) break;

      // Only grab the grand total from summary
      if (inSummary) {
        if (trimmed.toUpperCase().includes('TOTAL EXCL')) {
          const euros = extractEuros(trimmed);
          grandTotal = euros[0] || 0;
          grandSqmPrice = euros[1] || 0;
        }
        continue;
      }

      // Category header
      const upperTrimmed = trimmed.toUpperCase();
      const matchedCat = catHeaders.find(h => upperTrimmed === h || (upperTrimmed.startsWith(h) && !trimmed.includes('€')));
      if (matchedCat && !trimmed.includes('€')) {
        currentCat = { name: matchedCat, items: [], total: 0 };
        categories.push(currentCat);
        continue;
      }

      if (trimmed.includes('Product Name') || trimmed.includes('item no.') || trimmed.includes('Headers')) continue;
      if (!currentCat) continue;

      // CRITICAL: Total row for current category - this is the source of truth
      if (/^Total\b/i.test(trimmed) && trimmed.includes('€')) {
        const euros = extractEuros(trimmed);
        if (euros.length > 0) {
          currentCat.total = euros[euros.length - 1]; // Last € amount is the total
        }
        continue;
      }

      if (trimmed.startsWith('Transportation & Accomodation') || trimmed.startsWith('Freight & Logistic')) continue;

      // Item line
      if (trimmed.includes('€')) {
        const euros = extractEuros(trimmed);
        const totalPrice = euros.length >= 1 ? euros[euros.length - 1] : 0;
        const unitPrice = euros.length >= 2 ? euros[euros.length - 2] : 0;
        const qtyMatch = trimmed.match(/(\d+)\s*(pcs|Hours|hours|pack|Pack|km)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;
        let name = qtyMatch ? trimmed.substring(0, trimmed.indexOf(qtyMatch[0])).trim() : trimmed.split('€')[0].trim();
        name = name.replace(/^[\d._-]+[A-Za-z]?\s+/, '').trim();
        if (!name) name = trimmed.split('€')[0].replace(/^[\d._-]+[A-Za-z]?\s+/, '').trim();
        if (name && name.length > 1) currentCat.items.push({ name, qty, unitPrice, totalPrice });
      }
    }

    // Build summary using category Total lines as source of truth
    const getCatTotal = (name) => categories.find(c => c.name === name)?.total || 0;
    const summary = {
      inventory: getCatTotal('INVENTORY'),
      selectedDeliveries: getCatTotal('SELECTED DELIVERIES'),
      specificProjectCost: getCatTotal('SPECIFIC PROJECT COST'),
      specialElements: getCatTotal('SPECIAL ELEMENTS'),
      fittingRooms: getCatTotal('FITTING ROOMS'),
      floor: getCatTotal('FLOOR'),
      avHifi: getCatTotal('AV & HIFI'),
      construction: getCatTotal('CONSTRUCTION'),
      totalExclVat: grandTotal || 0,
      sqmPrice: grandSqmPrice || 0,
    };

    // If grand total wasn't found in summary, calculate from categories
    if (!summary.totalExclVat) {
      summary.totalExclVat = summary.inventory + summary.selectedDeliveries + summary.specificProjectCost + summary.specialElements + summary.fittingRooms + summary.floor + summary.avHifi + summary.construction;
    }
    if (!summary.sqmPrice && header.salesArea > 0 && summary.totalExclVat > 0) {
      summary.sqmPrice = Math.round(summary.totalExclVat / header.salesArea);
    }

    return Response.json({ ...header, categories, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
