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
const reportJsonPath = path.join(process.cwd(), 'playwright-report', 'report.json');
const outputPdfPath = path.join(process.cwd(), 'playwright-report', 'playwright-report.pdf');

// ---------- Screenshots Folder ----------
const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  console.log('📂 screenshots folder not found. Creating one…');
  fs.mkdirSync(screenshotsDir);
}

// ---------- Check report.json ----------
if (!fs.existsSync(reportJsonPath)) {
  console.error('❌ report.json not found. Run tests first!');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportJsonPath, 'utf8'));

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
    doc.fontSize(10).text(`Started: ${new Date(startTime).toLocaleString()}`);
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
      attachments.forEach(att => {
        if (att.name === 'screenshot' && att.path && fs.existsSync(att.path)) {
          doc.fontSize(10).fillColor('#000').text(`Screenshot:`);
          try {
            doc.image(att.path, { fit: [400, 300], align: 'center' });
          } catch {
            doc.fontSize(10).fillColor('red').text(`(Could not embed image: ${att.path})`);
          }
        } else if (att.name === 'video') {
          doc.fontSize(10).fillColor('#000').text(`Video: ${att.path}`);
        } else if (att.name === 'trace') {
          doc.fontSize(10).fillColor('#000').text(`Trace: ${att.path}`);
        }
      });
    }
    doc.moveDown(1);
  }

  // ---------- Loop Tests ----------
  report.suites?.forEach(suite => {
    suite.suites?.forEach(innerSuite => {
      innerSuite.specs?.forEach(spec => {
        spec.tests?.forEach(testItem => {
          testItem.results?.forEach(result => {
            addTestDetails(spec, result);
          });
        });
      });
    });
  });

  doc.end();
  console.log(`✅ PDF generated at: ${outputPdfPath}`);
}

generateReport();
