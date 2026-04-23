export const dynamic = 'force-dynamic';

// The core challenge: &elements PDFs have Euro amounts with random spaces
// Examples from real PDFs:
//   "€ 3 7.225"  → 37225    (spaces inside digits, dot is thousand separator)
//   "€ 1 .237"   → 1237     (space before dot-thousand-separator)
//   "€ 8 8"      → 88       (space inside two-digit number)
//   "€ 2 .942"   → 2942
//   "€ 1 ,38"    → 1.38     (comma is decimal, for unit prices like hangers)
//   "€ -"        → 0
//   "€ 1 .370"   → 1370
//   "€ 4 8.509"  → 48509

function parseEuro(raw) {
  if (!raw) return 0;
  let s = raw.replace(/€/g, '').trim();
  if (s === '-' || s === '') return 0;
  
  // Step 1: Remove ALL spaces - they are PDF extraction artifacts
  s = s.replace(/\s+/g, '');
  
  // Step 2: Handle comma as decimal separator (e.g., "1,38" → "1.38")
  // Only if comma exists and is followed by 1-2 digits at end
  if (/,\d{1,2}$/.test(s) && !s.includes('.')) {
    s = s.replace(',', '.');
    return parseFloat(s) || 0;
  }
  
  // Step 3: Handle dot as thousand separator (e.g., "37.225" "1.237" "2.942")
  // In European format, dots separate thousands. Since these are prices in whole euros,
  // a dot followed by exactly 3 digits = thousand separator, not decimal
  s = s.replace(/\.(\d{3})/g, '$1');
  
  // Step 4: Remove any remaining dots or commas
  s = s.replace(/[.,]/g, '');
  
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

// Extract all € amounts from a line using a regex that captures the messy format
function extractEuros(line) {
  // Match € followed by digits, spaces, dots, commas, and dashes
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
    
    // Parse header
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

    // Parse into categories
    const categories = [];
    let currentCat = null;
    const catHeaders = ['INVENTORY', 'SELECTED DELIVERIES', 'SPECIFIC PROJECT COST', 'SPECIAL ELEMENTS', 'FITTING ROOMS', 'FLOOR', 'AV & HIFI', 'CONSTRUCTION'];
    const summaryData = {};
    let inSummary = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Detect "Project cost overview" section
      if (trimmed.includes('Project cost overview')) { inSummary = true; continue; }
      if (trimmed.startsWith('Conditions:')) { inSummary = false; break; }
      
      // Parse summary lines (after "Project cost overview")
      if (inSummary && trimmed.includes('€')) {
        const euros = extractEuros(trimmed);
        const upper = trimmed.toUpperCase();
        if (upper.includes('TOTAL EXCL')) {
          summaryData.totalExclVat = euros[0] || 0;
          summaryData.sqmPrice = euros[1] || 0;
        } else if (upper.includes('INVENTORY')) {
          summaryData.inventory = euros[0] || 0;
        } else if (upper.includes('SELECTED DEL')) {
          summaryData.selectedDeliveries = euros[0] || 0;
        } else if (upper.includes('SPECIFIC')) {
          summaryData.specificProjectCost = euros[0] || 0;
        } else if (upper.includes('SPECIAL')) {
          summaryData.specialElements = euros[0] || 0;
        } else if (upper.includes('FITTING')) {
          summaryData.fittingRooms = euros[0] || 0;
        } else if (upper.includes('FLOOR')) {
          summaryData.floor = euros[0] || 0;
        } else if (upper.includes('AV')) {
          summaryData.avHifi = euros[0] || 0;
        } else if (upper.includes('CONSTRUCTION')) {
          summaryData.construction = euros[0] || 0;
        }
        continue;
      }
      if (inSummary) continue;
      
      // Detect category headers
      const upperTrimmed = trimmed.toUpperCase();
      const matchedCat = catHeaders.find(h => upperTrimmed === h || upperTrimmed.startsWith(h));
      if (matchedCat && !trimmed.includes('€')) {
        currentCat = { name: matchedCat, items: [], total: 0 };
        categories.push(currentCat);
        continue;
      }
      
      // Skip column headers
      if (trimmed.includes('Product Name') || trimmed.includes('item no.')) continue;
      if (trimmed.includes('Headers') && trimmed.includes('Sales price')) continue;
      
      if (!currentCat) continue;
      
      // Total row
      if (/^Total\b/.test(trimmed)) {
        const euros = extractEuros(trimmed);
        if (euros.length > 0) currentCat.total = euros[euros.length - 1];
        continue;
      }
      
      // Transportation & Accomodation cost (sub-header, skip)
      if (trimmed.startsWith('Transportation & Accomodation')) continue;
      if (trimmed.startsWith('Freight & Logistic')) continue;
      
      // Regular item line with € amounts
      if (trimmed.includes('€')) {
        const euros = extractEuros(trimmed);
        const unitPrice = euros.length >= 2 ? euros[euros.length - 2] : 0;
        const totalPrice = euros.length >= 1 ? euros[euros.length - 1] : 0;
        
        // Extract quantity
        const qtyMatch = trimmed.match(/(\d+)\s*(pcs|Hours|hours|pack|Pack|km)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;
        
        // Extract product name: text before qty pattern or before first €
        let name = '';
        if (qtyMatch) {
          name = trimmed.substring(0, trimmed.indexOf(qtyMatch[0])).trim();
        } else {
          name = trimmed.split('€')[0].trim();
        }
        // Remove leading item number (pattern: digits, dots, dashes, underscores)
        name = name.replace(/^[\d._-]+[A-Za-z]?\s+/, '').trim();
        // Also remove trailing technical specs
        if (!name) name = trimmed.split('€')[0].replace(/^[\d._-]+[A-Za-z]?\s+/, '').trim();
        
        if (name && name.length > 1) {
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
      avHifi: summaryData.avHifi || categories.find(c => c.name === 'AV & HIFI')?.total || 0,
      construction: summaryData.construction || categories.find(c => c.name === 'CONSTRUCTION')?.total || 0,
      totalExclVat: summaryData.totalExclVat || 0,
      sqmPrice: summaryData.sqmPrice || 0,
    };

    if (!summary.totalExclVat) {
      summary.totalExclVat = Object.values(summary).reduce((a, b) => a + b, 0) - summary.sqmPrice;
    }
    if (!summary.sqmPrice && header.salesArea > 0 && summary.totalExclVat > 0) {
      summary.sqmPrice = Math.round(summary.totalExclVat / header.salesArea);
    }

    return Response.json({ ...header, categories, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
