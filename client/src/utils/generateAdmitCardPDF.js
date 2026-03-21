import jsPDF from 'jspdf';

export async function generateAdmitCardPDF(data) {
  const {
    studentName, email, phone, batch, stream, rollNumber,
    examTitle, examDate, examTime, centerName, centerAddress, syllabus,
  } = data;

  // Calculate reporting time (30 min before exam)
  const [h, m] = examTime.split(':').map(Number);
  const reportH = String(h - (m >= 30 ? 0 : 1)).padStart(2,'0');
  const reportM = String((m - 30 + 60) % 60).padStart(2,'0');
  const reportTime = `${reportH}:${reportM}`;
  const gateH = String(h - (m >= 10 ? 0 : 1)).padStart(2,'0');
  const gateM = String((m - 10 + 60) % 60).padStart(2,'0');
  const gateClose = `${gateH}:${gateM}`;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const margin = 15;
  const col = W - margin * 2;

  // ── Helper functions ──────────────────────────────
  const box = (x, y, w, h, fill = null, stroke = '#1A2E1A') => {
    if (fill) { doc.setFillColor(fill); doc.rect(x, y, w, h, 'F'); }
    if (stroke) { doc.setDrawColor(stroke); doc.rect(x, y, w, h, 'S'); }
  };

  const text = (t, x, y, opts = {}) => {
    const { bold = false, size = 10, color = '#2C2C2C', align = 'left' } = opts;
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color);
    doc.text(t, x, y, { align });
  };

  const fieldRow = (label, value, x, y, boxW = 180) => {
    box(x, y, boxW / 2 - 2, 8, '#F0EBE0');
    text(label, x + 2, y + 5.5, { size: 8, bold: true, color: '#1A2E1A' });
    box(x + boxW / 2 + 2, y, boxW / 2 - 2, 8, null, '#C8A96E');
    text(value || '—', x + boxW / 2 + 5, y + 5.5, { size: 9 });
    return y + 9;
  };

  // ══════════════════ PAGE 1 ══════════════════
  // Header bar
  box(0, 0, W, 30, '#1A2E1A', null);
  text('ADMIT CARD', W / 2, 12, { bold: true, size: 18, color: '#C8A96E', align: 'center' });
  text('CETPortal Test Series', W / 2, 22, { size: 10, color: '#A8C5A0', align: 'center' });

  // Exam Title
  box(margin, 35, col, 14, '#F5F0E8', '#1A2E1A');
  text(examTitle, W / 2, 44, { bold: true, size: 13, color: '#1A2E1A', align: 'center' });

  // Roll Number highlight
  box(margin, 53, col, 16, '#1A2E1A', null);
  text(`ROLL NO: ${rollNumber}`, W / 2, 63, { bold: true, size: 14, color: '#C8A96E', align: 'center' });

  // Photo placeholder
  const photoX = W - margin - 35, photoY = 73;
  box(photoX, photoY, 35, 42, '#F0EBE0', '#1A2E1A');
  text('Paste', photoX + 17.5, photoY + 18, { size: 8, color: '#999', align: 'center' });
  text('Photo', photoX + 17.5, photoY + 24, { size: 8, color: '#999', align: 'center' });
  text('Here', photoX + 17.5, photoY + 30, { size: 8, color: '#999', align: 'center' });

  // Student Details section
  let y = 73;
  text('CANDIDATE DETAILS', margin, y - 2, { bold: true, size: 9, color: '#1A2E1A' });
  doc.setDrawColor('#C8A96E'); doc.setLineWidth(0.5);
  doc.line(margin, y, photoX - 5, y);

  const dWidth = photoX - margin - 5;
  y += 3;
  const rows = [
    ['Student Name', studentName],
    ['Email', email],
    ['Phone', phone],
    ['Batch', batch],
    ['Stream', stream],
  ];
  rows.forEach(([label, value]) => {
    box(margin, y, dWidth / 2 - 2, 8, '#F0EBE0', '#ddd');
    text(label, margin + 2, y + 5.5, { size: 8, bold: true, color: '#1A2E1A' });
    box(margin + dWidth / 2 + 2, y, dWidth / 2 - 2, 8, null, '#C8A96E');
    text(value || '—', margin + dWidth / 2 + 5, y + 5.5, { size: 9 });
    y += 9;
  });

  y = Math.max(y, photoY + 47);

  // Exam Details
  text('EXAMINATION DETAILS', margin, y + 6, { bold: true, size: 9, color: '#1A2E1A' });
  doc.line(margin, y + 8, W - margin, y + 8);
  y += 11;

  const examRows = [
    ['Exam Title', examTitle],
    ['Date of Examination', examDate],
    ['Exam Time', examTime],
    ['Reporting Time', reportTime + ' (30 min before)'],
    ['Gate Closing Time', gateClose],
    ['Exam Centre', centerName],
    ['Centre Address', centerAddress],
  ];
  examRows.forEach(([label, value]) => {
    y = fieldRow(label, value, margin, y) + 1;
  });

  y += 5;

  // Signature spaces
  const sigY = H - 55;
  box(margin, sigY, 55, 18, null, '#1A2E1A');
  text("Candidate's Signature", margin + 27.5, sigY + 22, { size: 8, color: '#555', align: 'center' });

  box(W / 2 - 27, sigY, 55, 18, null, '#1A2E1A');
  text("Invigilator's Signature", W / 2, sigY + 22, { size: 8, color: '#555', align: 'center' });

  box(W - margin - 55, sigY, 55, 18, null, '#1A2E1A');
  text("Centre Superintendent", W - margin - 27.5, sigY + 22, { size: 8, color: '#555', align: 'center' });

  // Footer
  box(0, H - 20, W, 20, '#1A2E1A', null);
  text('This admit card is mandatory for entry. Keep it safe.', W / 2, H - 12, { size: 9, color: '#CCCCCC', align: 'center' });
  text('CETPortal.in | For queries: admin@cetportal.in', W / 2, H - 5, { size: 8, color: '#7A9B7A', align: 'center' });

  // ══════════════════ PAGE 2 ══════════════════
  doc.addPage();

  box(0, 0, W, 20, '#1A2E1A', null);
  text('IMPORTANT INSTRUCTIONS', W / 2, 13, { bold: true, size: 13, color: '#C8A96E', align: 'center' });

  // Postcard photo
  box(margin, 25, 55, 70, '#F5F0E8', '#1A2E1A');
  text('POSTCARD SIZE', margin + 27.5, 58, { size: 8, color: '#999', align: 'center' });
  text('PHOTOGRAPH', margin + 27.5, 64, { size: 8, color: '#999', align: 'center' });
  text('(Paste & Sign Across)', margin + 27.5, 70, { size: 7, color: '#bbb', align: 'center' });

  const instructions = [
    '1. Candidates must carry this Admit Card to the examination center.',
    '2. Valid Photo ID (Aadhar/PAN/Passport) is mandatory.',
    '3. Report to the exam center 30 minutes before the scheduled time.',
    '4. Entry is strictly prohibited after the gate closing time.',
    '5. Electronic devices, mobile phones, and calculators are NOT allowed.',
    '6. Blue/Black ballpoint pen only for signatures.',
    '7. Do not mark or write anything on the question paper.',
    '8. Answer all questions honestly. No negative marking.',
    '9. Tab switching during the online exam will be monitored and flagged.',
    '10. Results will be declared immediately after submission.',
    '11. In case of any malpractice, the result will be placed on HOLD.',
    '12. The exam consists of 2 sections. Section 1 locks automatically at 90 minutes.',
    '13. PCM: Section 2 = Mathematics (50 Qs × 2 marks). PCB: Section 2 = Biology (100 Qs × 1 mark).',
    '14. Candidates must not leave their seats during the examination.',
    '15. CETPortal management\'s decision on all exam matters is final.',
  ];

  let iy = 28;
  instructions.forEach(line => {
    text(line, margin + 60, iy, { size: 8, color: '#333' });
    iy += 7;
  });

  // Self-Declaration
  const decY = H - 85;
  box(margin, decY, col, 60, '#FFF9F0', '#C8A96E');
  text('SELF-DECLARATION / UNDERTAKING', margin + 4, decY + 8, { bold: true, size: 10, color: '#1A2E1A' });
  const declaration = `I, ${studentName}, hereby declare that all information provided during registration is true and correct. I will abide by all rules and regulations of CETPortal during the examination. I understand that any malpractice will disqualify my result.`;
  const lines = doc.splitTextToSize(declaration, col - 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#444');
  doc.text(lines, margin + 4, decY + 16);

  // Left thumb impression box
  box(margin + 4, decY + 38, 30, 16, null, '#1A2E1A');
  text('Left Thumb Impression', margin + 19, decY + 58, { size: 7, color: '#777', align: 'center' });

  box(W - margin - 55, decY + 38, 55, 16, null, '#1A2E1A');
  text("Candidate's Signature", W - margin - 27.5, decY + 57, { size: 8, color: '#777', align: 'center' });

  doc.save(`AdmitCard_${rollNumber || studentName}.pdf`);
}
