export const dynamic = 'force-dynamic';

function parseEuro(str) {
  if (!str || str.includes('€ -') || str.trim() === '-') return 0;
  let clean = str.replace(/€/g, '').trim().replace(/\s+/g, '');
  if (clean.includes(',') && !clean.includes('.')) {
    clean = clean.replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  }
  const dotMatch = clean.match(/^(\d+)\.(\d{3})$/);
  if (dotMatch) clean = dotMatch[1] + dotMatch[2];
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { lines } = body;
    
    if (!lines || !Array.isArray(lines)) {
      return Response.json({ error: 'No lines provided. Send { lines: [...] }' }, { status: 400 });
    }

    const fullText = lines.join('\n');
    
    // Parse header
    const get = (pattern) => { const m = fullText.match(pattern); return m ? m[1].trim() : null; };
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

    // Parse line items by finding € amounts on each line
    const categories = [];
    let currentCat = null;
    const catHeaders = ['INVENTORY', 'SELECTED DELIVERIES', 'SPECIFIC PROJECT COST', 'SPECIAL ELEMENTS', 'FITTING ROOMS', 'FLOOR', 'AV & HiFi', 'CONSTRUCTION'];
    const summaryData = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check category header
      const isCatHeader = catHeaders.find(h => trimmed.toUpperCase() === h || trimmed.toUpperCase().startsWith(h + '\n'));
      if (isCatHeader) {
        currentCat = { name: isCatHeader, items: [], total: 0 };
        categories.push(currentCat);
        continue;
      }

      // Skip column headers
      if (trimmed.includes('Product Name') || trimmed.includes('item no.')) continue;
      if (trimmed.startsWith('Project cost overview')) continue;
      if (trimmed.startsWith('Conditions:') || trimmed.startsWith('Payment terms')) break;

      // Summary rows (e.g., "INVENTORY € 37.948 € 632")
      const summaryMatch = trimmed.match(/^(INVENTORY|SELECTED DELIVERIES|SPECIFIC PROJECT COST|SPECIAL ELEMENTS|FITTING ROOMS|FLOOR|AV & HiFi|CONSTRUCTION|Total excl\. VAT)\s+€\s*([\d\s.,]+)/i);
      if (summaryMatch) {
        const label = summaryMatch[1].trim().toUpperCase();
        const value = parseEuro('€' + summaryMatch[2]);
        if (label.includes('TOTAL')) summaryData.totalExclVat = value;
        else if (label.includes('INVENTORY')) summaryData.inventory = value;
        else if (label.includes('SELECTED DEL')) summaryData.selectedDeliveries = value;
        else if (label.includes('SPECIFIC')) summaryData.specificProjectCost = value;
        else if (label.includes('SPECIAL')) summaryData.specialElements = value;
        else if (label.includes('FITTING')) summaryData.fittingRooms = value;
        else if (label.includes('FLOOR')) summaryData.floor = value;
        else if (label.includes('AV')) summaryData.avHifi = value;
        else if (label.includes('CONSTRUCTION')) summaryData.construction = value;
        continue;
      }

      // Total row for current category
      if (trimmed.match(/^Total\s/) && currentCat) {
        const euroMatch = trimmed.match(/€\s*([\d\s.,]+)/);
        if (euroMatch) currentCat.total = parseEuro('€' + euroMatch[1]);
        continue;
      }

      // Regular item line - look for € signs
      if (currentCat && trimmed.includes('€')) {
        const euros = [...trimmed.matchAll(/€\s*([\d\s.,]+)/g)].map(m => parseEuro('€' + m[1]));
        const unitPrice = euros.length >= 2 ? euros[euros.length - 2] : 0;
        const totalPrice = euros.length >= 1 ? euros[euros.length - 1] : 0;

        // Extract qty (number before "pcs" or "Hours" or "pack" or "km")
        const qtyMatch = trimmed.match(/(\d+)\s*(pcs|Hours|hours|pack|km|Pack)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;

        // Product name is everything before the quantity or first €
        let name = trimmed.split(/\d+\s*(pcs|Hours|pack|km)/)[0].trim();
        // Remove item number prefix
        name = name.replace(/^[\d\w-]+\s+/, '').trim();
        // Clean up
        if (name.length < 2) name = trimmed.split('€')[0].trim().replace(/^[\d\w.-]+\s+/, '');

        if (totalPrice > 0 || qty > 0) {
          currentCat.items.push({ name, qty, unitPrice, totalPrice });
        }
      }
    }

    // Build summary
    const summary = {
      inventory: summaryData.inventory || categories.find(c => c.name === 'INVENTORY')?.total || 0,
      selectedDeliveries: summaryData.selectedDeliveries || categories.find(c => c.name === 'SELECTED DELIVERIES')?.total || 0,
      specificProjectCost: summaryData.specificProjectCost || categories.find(c => c.name === 'SPECIFIC PROJECT COST')?.total || 0,
      specialElements: summaryData.specialElements || categories.find(c => c.name === 'SPECIAL ELEMENTS')?.total || 0,
      fittingRooms: summaryData.fittingRooms || categories.find(c => c.name === 'FITTING ROOMS')?.total || 0,
      floor: summaryData.floor || categories.find(c => c.name === 'FLOOR')?.total || 0,
      avHifi: summaryData.avHifi || categories.find(c => c.name === 'AV & HiFi')?.total || 0,
      construction: summaryData.construction || categories.find(c => c.name === 'CONSTRUCTION')?.total || 0,
      totalExclVat: summaryData.totalExclVat || 0,
      sqmPrice: 0,
    };

    if (!summary.totalExclVat) {
      summary.totalExclVat = summary.inventory + summary.selectedDeliveries + summary.specificProjectCost + summary.specialElements + summary.fittingRooms + summary.floor + summary.avHifi + summary.construction;
    }
    if (header.salesArea > 0 && summary.totalExclVat > 0) {
      summary.sqmPrice = Math.round(summary.totalExclVat / header.salesArea);
    }

    return Response.json({ ...header, categories, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
