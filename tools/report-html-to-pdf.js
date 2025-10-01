import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import readline from 'readline';

// ---------- CLI Prompt ----------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askFilter() {
  return new Promise(resolve => {
    console.log('\nSelect which test cases to include in PDF:');
    console.log('[F] Failed only');
    console.log('[P] Passed only');
    console.log('[A] All tests');
    rl.question('\nYour choice (F / P / A): ', answer => {
      rl.close();
      resolve(answer.trim().toUpperCase());
    });
  });
}

// ---------- Paths ----------
const reportDir = path.join(process.cwd(), 'playwright-report');
const reportJsonPath = path.join(reportDir, 'report.json');
const outputPdfPath = path.join(reportDir, 'playwright-report.pdf');

// ---------- Backup folder ----------
const backupDir = path.join(reportDir, 'backup', 'pdf');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

// ---------- Screenshots Folder ----------
const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

// ---------- Check report.json ----------
if (!fs.existsSync(reportJsonPath)) {
  console.error('❌ report.json not found. Run tests first!');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportJsonPath, 'utf8'));

// ---------- Helper: Timestamp ----------
function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// ---------- Backup existing PDF ----------
if (fs.existsSync(outputPdfPath)) {
  const backupPath = path.join(backupDir, `playwright-report_${timestamp()}.bak.pdf`);
  fs.copyFileSync(outputPdfPath, backupPath);
  console.log(`Existing PDF backed up: ${backupPath}`);
}

// ---------- Main Function ----------
async function generateReport() {
  const choice = await askFilter();

  let filterStatus = null;
  if (choice === 'F') filterStatus = 'failed';
  else if (choice === 'P') filterStatus = 'passed';
  else if (choice !== 'A') {
    console.log('⚠ Invalid choice, defaulting to All.');
  }

  // ---------- Create PDF ----------
  const doc = new PDFDocument({ margin: 30 });
  doc.pipe(fs.createWriteStream(outputPdfPath));

  // Title
  doc.fontSize(22).text('Playwright Test Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown(2);

  // ---------- Add Test Details ----------
  function addTestDetails(test, result) {
    const { title, file } = test;
    const { status, duration, startTime, errors, attachments } = result;

    // Apply filter
    if (filterStatus && status !== filterStatus) return;

    doc.fontSize(16).fillColor('#000').text(`${title}`, { underline: true });
    doc.fontSize(10).fillColor('#555').text(`File: ${file}`);
    doc.fontSize(10).text(`Status: ${status.toUpperCase()}`);
    doc.fontSize(10).text(`Duration: ${duration} ms`);
    if (startTime) doc.fontSize(10).text(`Started: ${new Date(startTime).toLocaleString()}`);
    doc.moveDown(0.5);

    // Errors
    if (errors && errors.length > 0) {
      doc.fontSize(12).fillColor('red').text('❌ Errors:');
      errors.forEach(err => {
        doc.fontSize(10).fillColor('red').text(err.message || JSON.stringify(err), { indent: 20 });
      });
    }

    // Attachments
    if (attachments && attachments.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000').text('Attachments:');
      for (const att of attachments) {
        if (att.name === 'screenshot' && att.path && fs.existsSync(att.path)) {
          doc.fontSize(10).fillColor('#000').text(`Screenshot:`);
          try {
            doc.image(att.path, { fit: [400, 300], align: 'center' });
          } catch (err) {
            doc.fontSize(10).fillColor('red').text(`(Could not embed image: ${att.path})`);
          }
        }

        // Trace / Video commented for future use
        // else if (att.name === 'trace') {
        //   doc.fontSize(10).fillColor('#000').text(`Trace: ${att.path}`);
        // }
        // else if (att.name === 'video') {
        //   doc.fontSize(10).fillColor('#000').text(`Video: ${att.path}`);
        // }
      }
    }
    doc.moveDown(1);
  }

  // ---------- Loop Tests ----------
  for (const suite of report.suites || []) {
    for (const innerSuite of suite.suites || []) {
      for (const spec of innerSuite.specs || []) {
        for (const testItem of spec.tests || []) {
          for (const result of testItem.results || []) {
            addTestDetails(spec, result);
          }
        }
      }
    }
  }

  doc.end();
  console.log(`✅ PDF generated at: ${outputPdfPath}`);
}

generateReport();
// ---------- End ----------