export const dynamic = 'force-dynamic';

function parseEuro(raw) {
  if (!raw) return 0;
  let s = raw.replace(/€/g, '').trim();
  if (s === '-' || s === '') return 0;
  s = s.replace(/\s+/g, '');
  if (/,\d{1,2}$/.test(s) && !s.includes('.')) {
    s = s.replace(',', '.');
    return parseFloat(s) || 0;
  }
  s = s.replace(/\.(\d{3})/g, '$1');
  s = s.replace(/[.,]/g, '');
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

function extractEuros(line) {
  const matches = [];
  const regex = /€\s*([\d\s.,]+|-)/g;
  let m;
  while ((m = regex.exec(line)) !== null) {
    matches.push(parseEuro(m[1]));
  }
  return matches;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { lines } = body;
    if (!lines || !Array.isArray(lines)) {
      return Response.json({ error: 'No lines provided' }, { status: 400 });
    }

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
    const summaryData = {};
    let inSummary = false;

    for (let li = 0; li < lines.length; li++) {
      const trimmed = lines[li].trim();
      if (!trimmed) continue;

      if (trimmed.includes('Project cost overview')) { inSummary = true; continue; }
      if (trimmed.startsWith('Conditions:')) { inSummary = false; break; }

      // Summary section: "INVENTORY € 3 7.225 € 620"
      // First € = total, second € = sqm price
      if (inSummary && trimmed.includes('€')) {
        const euros = extractEuros(trimmed);
        const upper = trimmed.toUpperCase();
        const total = euros.length >= 1 ? euros[0] : 0;
        const sqmP = euros.length >= 2 ? euros[1] : 0;
        if (upper.includes('TOTAL EXCL')) {
          summaryData.totalExclVat = total;
          summaryData.sqmPrice = sqmP;
        } else if (upper.includes('INVENTORY')) summaryData.inventory = total;
        else if (upper.includes('SELECTED DEL')) summaryData.selectedDeliveries = total;
        else if (upper.includes('SPECIFIC')) summaryData.specificProjectCost = total;
        else if (upper.includes('SPECIAL')) summaryData.specialElements = total;
        else if (upper.includes('FITTING')) summaryData.fittingRooms = total;
        else if (upper.includes('FLOOR')) summaryData.floor = total;
        else if (upper.includes('AV')) summaryData.avHifi = total;
        else if (upper.includes('CONSTRUCTION')) summaryData.construction = total;
        continue;
      }
      if (inSummary) continue;

      // Category header
      const upperTrimmed = trimmed.toUpperCase();
      const matchedCat = catHeaders.find(h => upperTrimmed === h || upperTrimmed.startsWith(h));
      if (matchedCat && !trimmed.includes('€')) {
        currentCat = { name: matchedCat, items: [], total: 0 };
        categories.push(currentCat);
        continue;
      }

      if (trimmed.includes('Product Name') || trimmed.includes('item no.') || trimmed.includes('Headers')) continue;
      if (!currentCat) continue;

      // Total row - match "Total" at start of line, with or without €
      if (/^Total\b/i.test(trimmed)) {
        const euros = extractEuros(trimmed);
        if (euros.length > 0) {
          // Last euro amount is the total
          currentCat.total = euros[euros.length - 1];
        }
        continue;
      }

      if (trimmed.startsWith('Transportation & Accomodation') || trimmed.startsWith('Freight & Logistic')) continue;

      // Item line
      if (trimmed.includes('€')) {
        const euros = extractEuros(trimmed);
        // For items: second-to-last = unit price, last = total price
        const totalPrice = euros.length >= 1 ? euros[euros.length - 1] : 0;
        const unitPrice = euros.length >= 2 ? euros[euros.length - 2] : 0;

        const qtyMatch = trimmed.match(/(\d+)\s*(pcs|Hours|hours|pack|Pack|km)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;

        let name = '';
        if (qtyMatch) {
          name = trimmed.substring(0, trimmed.indexOf(qtyMatch[0])).trim();
        } else {
          name = trimmed.split('€')[0].trim();
        }
        name = name.replace(/^[\d._-]+[A-Za-z]?\s+/, '').trim();
        if (!name) name = trimmed.split('€')[0].replace(/^[\d._-]+[A-Za-z]?\s+/, '').trim();

        if (name && name.length > 1) {
          currentCat.items.push({ name, qty, unitPrice, totalPrice });
        }
      }
    }

    // If category totals are 0, sum from items
    for (const cat of categories) {
      if (cat.total === 0 && cat.items.length > 0) {
        cat.total = cat.items.reduce((sum, item) => sum + item.totalPrice, 0);
      }
    }

    const summary = {
      inventory: summaryData.inventory || categories.find(c => c.name === 'INVENTORY')?.total || 0,
      selectedDeliveries: summaryData.selectedDeliveries || categories.find(c => c.name === 'SELECTED DELIVERIES')?.total || 0,
      specificProjectCost: summaryData.specificProjectCost || categories.find(c => c.name === 'SPECIFIC PROJECT COST')?.total || 0,
      specialElements: summaryData.specialElements || categories.find(c => c.name === 'SPECIAL ELEMENTS')?.total || 0,
      fittingRooms: summaryData.fittingRooms || categories.find(c => c.name === 'FITTING ROOMS')?.total || 0,
      floor: summaryData.floor || categories.find(c => c.name === 'FLOOR')?.total || 0,
      avHifi: summaryData.avHifi || categories.find(c => c.name === 'AV & HIFI')?.total || 0,
      construction: summaryData.construction || categories.find(c => c.name === 'CONSTRUCTION')?.total || 0,
      totalExclVat: summaryData.totalExclVat || 0,
      sqmPrice: summaryData.sqmPrice || 0,
    };

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
