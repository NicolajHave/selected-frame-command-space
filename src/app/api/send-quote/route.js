export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const runtime = 'nodejs';

import { Resend } from 'resend';

const FROM_EMAIL = 'Selected Frame <selectedsis@selectedframe.com>';
const REPLY_TO = 'selectedsis@bestseller.com';
const BCC_EMAIL = 'selectedsis@selectedframe.com';

// Format helpers
const fmtEur = (n) => typeof n === 'number' && n > 0
  ? `€${n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  : '—';

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

// Lazy logo loading - only at request time, only on server
async function loadLogoBuffer() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const candidates = [
      path.join(process.cwd(), 'public', 'images', 'logo-black.png'),
      path.join(process.cwd(), 'public', 'logo-black.png'),
    ];
    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) return fs.readFileSync(p);
      } catch {}
    }
  } catch (e) {
    console.error('Logo load error:', e.message);
  }
  return null;
}

async function generatePdfBuffer(data) {
  // Dynamically import pdfkit so it stays out of the client bundle
  const PDFDocument = (await import('pdfkit')).default;
  const logoBuffer = await loadLogoBuffer();

  const {
    project, salesArea, gender, quotationDate, validUntil,
    inv, del, proj, supTotal,
    addOnItems, addOnTotal,
    customItems, customTotal,
    grand, sqmPrice
  } = data;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;
      const M = 50;
      const CW = W - M * 2;

      // --- HEADER ---
      let y = M;
      const logoMaxH = 36;
      const logoMaxW = 200;
      let logoBottomY = y + logoMaxH;

      if (logoBuffer) {
        try {
          doc.image(logoBuffer, M, y, { fit: [logoMaxW, logoMaxH], align: 'left' });
        } catch (e) {
          doc.font('Helvetica-Bold').fontSize(20).fillColor('#1A1A1A')
             .text('Selected Frame', M, y);
          logoBottomY = y + 26;
        }
      } else {
        doc.font('Helvetica-Bold').fontSize(20).fillColor('#1A1A1A')
           .text('Selected Frame', M, y);
        logoBottomY = y + 26;
      }

      doc.font('Helvetica').fontSize(7).fillColor('#8A8D8F')
         .text('[ A FRAME FOR THE BUSINESS WE SHARE ]', M, logoBottomY + 6, { characterSpacing: 1.5 });

      // Right meta block
      const metaX = M + CW * 0.55;
      const metaW = CW * 0.45;
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#1A1A1A')
         .text('Quotation', metaX, y, { width: metaW, align: 'right' });
      doc.font('Helvetica').fontSize(10).fillColor('#2C2C2C')
         .text(project || '—', metaX, y + 18, { width: metaW, align: 'right' });

      let metaY = y + 36;
      const metaRow = (label, value) => {
        doc.font('Helvetica').fontSize(8).fillColor('#8A8D8F')
           .text(label.toUpperCase(), metaX, metaY, { width: metaW - 90, align: 'right', characterSpacing: 0.5 });
        doc.font('Helvetica').fontSize(9).fillColor('#2C2C2C')
           .text(value, metaX + metaW - 90, metaY, { width: 90, align: 'right' });
        metaY += 13;
      };
      metaRow('Date', fmtDate(quotationDate));
      metaRow('Valid until', fmtDate(validUntil));
      if (salesArea) metaRow('Sales area', `${salesArea} sqm`);
      if (gender) metaRow('Gender', gender);

      y = Math.max(logoBottomY + 24, metaY + 8);
      doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#1A1A1A').lineWidth(2).stroke();
      y += 28;

      // --- COST BREAKDOWN ---
      doc.font('Times-Roman').fontSize(16).fillColor('#1A1A1A')
         .text('Project Cost incl. construction, shopfitting and logistics', M, y);
      y += 28;

      doc.rect(M, y, CW, 22).fillColor('#F5F4F1').fill();
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#6B6B6B')
         .text('CATEGORY', M + 10, y + 7, { characterSpacing: 0.5 });
      doc.text('AMOUNT', M, y + 7, { width: CW - 10, align: 'right', characterSpacing: 0.5 });
      y += 22;

      const row = (label, amount, bold = false) => {
        doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#ECEAE5').lineWidth(0.5).stroke();
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).fillColor('#2C2C2C')
           .text(label, M + 10, y + 8);
        doc.text(fmtEur(amount), M, y + 8, { width: CW - 10, align: 'right' });
        y += 26;
      };

      row('Inventory', inv);
      row('Selected Deliveries', del);
      row('Specific Project Cost', proj);
      doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#ECEAE5').lineWidth(0.5).stroke();
      row('Total', supTotal, true);
      y += 8;

      // --- ADD-ONS ---
      if (addOnItems && addOnItems.length > 0) {
        doc.font('Times-Roman').fontSize(14).fillColor('#1A1A1A').text('Add-ons', M, y);
        y += 22;
        doc.rect(M, y, CW, 20).fillColor('#F5F4F1').fill();
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#6B6B6B').text('ITEM', M + 10, y + 6);
        doc.text('QTY', M, y + 6, { width: CW - 100, align: 'right' });
        doc.text('TOTAL', M, y + 6, { width: CW - 10, align: 'right' });
        y += 20;
        addOnItems.forEach(it => {
          doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#ECEAE5').lineWidth(0.5).stroke();
          doc.font('Helvetica').fontSize(9).fillColor('#2C2C2C')
             .text(it.name, M + 10, y + 7, { width: CW - 160 });
          doc.text(String(it.qty), M, y + 7, { width: CW - 100, align: 'right' });
          doc.text(fmtEur(it.total), M, y + 7, { width: CW - 10, align: 'right' });
          y += 22;
        });
        doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#ECEAE5').lineWidth(0.5).stroke();
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#2C2C2C')
           .text('Add-ons Total', M + 10, y + 8);
        doc.text(fmtEur(addOnTotal), M, y + 8, { width: CW - 10, align: 'right' });
        y += 30;
      }

      // --- CUSTOM ITEMS ---
      if (customItems && customItems.length > 0) {
        doc.font('Times-Roman').fontSize(14).fillColor('#1A1A1A').text('Additional Items', M, y);
        y += 22;
        doc.rect(M, y, CW, 20).fillColor('#F5F4F1').fill();
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#6B6B6B').text('ITEM', M + 10, y + 6);
        doc.text('QTY', M, y + 6, { width: CW - 100, align: 'right' });
        doc.text('TOTAL', M, y + 6, { width: CW - 10, align: 'right' });
        y += 20;
        customItems.forEach(it => {
          doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#ECEAE5').lineWidth(0.5).stroke();
          doc.font('Helvetica').fontSize(9).fillColor('#2C2C2C')
             .text(it.name, M + 10, y + 7, { width: CW - 160 });
          doc.text(String(it.qty), M, y + 7, { width: CW - 100, align: 'right' });
          doc.text(fmtEur(it.total), M, y + 7, { width: CW - 10, align: 'right' });
          y += 22;
        });
        doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#ECEAE5').lineWidth(0.5).stroke();
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#2C2C2C')
           .text('Total', M + 10, y + 8);
        doc.text(fmtEur(customTotal), M, y + 8, { width: CW - 10, align: 'right' });
        y += 30;
      }

      // --- DARK TOTAL BOX ---
      y += 8;
      const totBoxH = 70;
      doc.roundedRect(M, y, CW, totBoxH, 8).fillColor('#1A1A1A').fill();
      doc.font('Helvetica').fontSize(12).fillColor('#B8BBBE')
         .text('Total excl. VAT', M + 22, y + 28);
      doc.font('Times-Roman').fontSize(26).fillColor('#FFFFFF')
         .text(fmtEur(grand), M, y + 22, { width: CW - 22, align: 'right' });
      y += totBoxH + 4;

      if (sqmPrice && sqmPrice > 0) {
        doc.font('Helvetica').fontSize(9).fillColor('#8A8D8F')
           .text(`${fmtEur(sqmPrice)} / sqm`, M, y, { width: CW, align: 'right' });
        y += 16;
      }

      // --- VALIDITY ---
      y += 12;
      const valBoxH = 44;
      doc.rect(M, y, CW, valBoxH).fillColor('#F5F4F1').fill();
      doc.rect(M, y, 3, valBoxH).fillColor('#C4944A').fill();
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#6B6B6B')
         .text('VALIDITY', M + 14, y + 10, { characterSpacing: 0.5 });
      doc.font('Helvetica').fontSize(10).fillColor('#2C2C2C')
         .text(`This quotation is valid until ${fmtDate(validUntil)} (14 days from quotation date).`, M + 14, y + 23);
      y += valBoxH + 24;

      // --- FOOTER ---
      const footerY = doc.page.height - M - 14;
      doc.moveTo(M, footerY - 8).lineTo(W - M, footerY - 8).strokeColor('#ECEAE5').lineWidth(0.5).stroke();
      doc.font('Helvetica').fontSize(8).fillColor('#8A8D8F')
         .text('Selected Frame · Brand Spaces', M, footerY);
      doc.text('Confidential', M, footerY, { width: CW, align: 'right' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

export async function POST(request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return Response.json({ error: 'Email service not configured (RESEND_API_KEY missing)' }, { status: 500 });
    }

    const body = await request.json();
    const {
      to, project, salesArea, gender, quotationDate, validUntil,
      inv, del, proj, supTotal,
      addOnItems, addOnTotal,
      customItems, customTotal,
      grand, sqmPrice
    } = body;

    if (!isValidEmail(to)) {
      return Response.json({ error: 'Invalid recipient email address' }, { status: 400 });
    }
    if (!project || !grand || grand <= 0) {
      return Response.json({ error: 'Quotation incomplete - project name and total are required' }, { status: 400 });
    }

    const pdfBuffer = await generatePdfBuffer({
      project, salesArea, gender, quotationDate, validUntil,
      inv: parseFloat(inv) || 0,
      del: parseFloat(del) || 0,
      proj: parseFloat(proj) || 0,
      supTotal: parseFloat(supTotal) || 0,
      addOnItems: addOnItems || [],
      addOnTotal: parseFloat(addOnTotal) || 0,
      customItems: customItems || [],
      customTotal: parseFloat(customTotal) || 0,
      grand: parseFloat(grand) || 0,
      sqmPrice: parseFloat(sqmPrice) || 0,
    });

    const sqmLine = sqmPrice && sqmPrice > 0 ? ` (${fmtEur(sqmPrice)} / sqm)` : '';
    const textBody = `Dear partner,

Please find attached the Selected Frame quotation for ${project}.

PROJECT
${project}
${salesArea ? `Sales area: ${salesArea} sqm` : ''}
${gender ? `Gender: ${gender}` : ''}

QUOTATION
Date: ${fmtDate(quotationDate)}
Valid until: ${fmtDate(validUntil)} (14 days from quotation date)

INVESTMENT
Total excl. VAT: ${fmtEur(grand)}${sqmLine}

The full breakdown is included in the attached PDF.

Best regards,
Selected Frame · Brand Spaces
Bestseller A/S`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const filename = `Selected_Frame_Quotation_${(project || 'project').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      bcc: [BCC_EMAIL],
      replyTo: REPLY_TO,
      subject: `Selected Frame Quotation – ${project}`,
      text: textBody,
      attachments: [{ filename, content: pdfBuffer }],
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error: error.message || 'Email send failed', details: error }, { status: 500 });
    }

    return Response.json({
      success: true,
      messageId: data?.id,
      to,
      bcc: BCC_EMAIL,
      filename
    });
  } catch (error) {
    console.error('send-quote error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
