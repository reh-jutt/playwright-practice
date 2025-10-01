// tools/report-json-to-excel.js
// Run: node tools/report-json-to-excel.js

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import ExcelJS from 'exceljs';
import sharp from 'sharp';   // for image compression

const reportPath = path.resolve('playwright-report', 'report.json');
const backupDir = path.resolve('playwright-report', 'backup', 'excel');

if (!fs.existsSync(reportPath)) {
  console.error(`❌ Report JSON not found at: ${reportPath}`);
  process.exit(1);
}

// ---------- helpers ----------
const ask = (question) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve((ans||'').trim()); }));
};

const timestamp = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

const backupFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupName = path.join(backupDir, `${path.basename(filePath).replace(/\.[^/.]+$/, '')}.${timestamp()}.bak.xlsx`);
  fs.copyFileSync(filePath, backupName);
  console.log(`\nExisting Excel backed up to: ${backupName}`);
};

// ---------- traverse JSON ----------
const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
const rows = [];

function collectTests(suite) {
  (suite.specs || []).forEach(spec => {
    spec.tests.forEach(t => {
      const result = t.results[0] || {};
      const attachments = (result.attachments || []).map(a => ({
        name: a.name,
        path: a.path,
        type: a.contentType
      }));
      rows.push({
        file: spec.file,
        title: `${suite.title} > ${spec.title}`,
        status: result.status || '',
        duration_ms: result.duration || 0,
        error: (result.errors && result.errors.length) ? JSON.stringify(result.errors) : '',
        screenshots: attachments
          .filter(a => a.type.includes('png'))
          .map(a => a.path),
        // traces: attachments
        //   .filter(a => a.type.includes('zip'))
        //   .map(a => a.path)
      });
    });
  });
  (suite.suites || []).forEach(collectTests);
}
(report.suites || []).forEach(collectTests);

console.log(`\nLoaded ${rows.length} rows from ${reportPath}\n`);

// ---------- main ----------
(async () => {
  // Prompt for filter
  const choice = (await ask('Export filter: [A] All  [P] Passed only  [F] Failed only\nChoice [A]: ')) || 'A';
  const filter = choice.trim().toUpperCase();

  let filtered = rows;
  if (filter === 'P') filtered = rows.filter(r => r.status === 'passed');
  else if (filter === 'F') filtered = rows.filter(r => r.status !== 'passed');

  const excelPath = path.resolve('playwright-report', 'report.xlsx');
  backupFile(excelPath);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Test Report');

  sheet.columns = [
    { header: 'File', key: 'file', width: 35 },
    { header: 'Title', key: 'title', width: 60 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Duration (ms)', key: 'duration_ms', width: 15 },
    { header: 'Error', key: 'error', width: 40 },
    { header: 'Screenshot', key: 'screenshot', width: 25 },
    // { header: 'Trace (Path)', key: 'trace', width: 60 },
  ];

  const tempDir = path.resolve('playwright-report', 'temp-images');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  let rowIndex = 2;

  for (const r of filtered) {
    const scPath = (r.screenshots && r.screenshots[0]) || '';
    // const trPath = (r.traces && r.traces[0]) || '';

    // Add normal row data
    sheet.addRow({
      file: r.file,
      title: r.title,
      status: r.status,
      duration_ms: r.duration_ms,
      error: r.error,
      screenshot: scPath ? 'Embedded below' : '',
      // trace: trPath
    });

    // Compress & embed screenshot if exists
    if (scPath && fs.existsSync(scPath)) {
      const compressed = path.join(tempDir, `img_${rowIndex}.png`);
      await sharp(scPath).resize({ width: 250 }).png({ quality: 70 }).toFile(compressed);

      const imageId = workbook.addImage({
        filename: compressed,
        extension: 'png'
      });

      sheet.addImage(imageId, {
        tl: { col: 5, row: rowIndex - 1 },
        ext: { width: 150, height: 100 }
      });
    }

    rowIndex++;
  }

  await workbook.xlsx.writeFile(excelPath);
  console.log(`\n✅ Excel created with embedded screenshots: ${excelPath}`);
  console.log(`📦 Rows exported: ${filtered.length}`);
  console.log(`🖼️  Images compressed & embedded (width=250px, quality=70%)`);
})();
