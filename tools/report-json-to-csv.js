// tools/report-json-to-csv.js
import fs from 'fs';
import path from 'path';
// ---------- Check report.json ----------

const input = path.resolve(process.cwd(), 'playwright-report', 'report.json');
if (!fs.existsSync(input)) {
  console.error('❌ report.json not found at', input);
  process.exit(1);
}

const raw = fs.readFileSync(input, 'utf8');
const data = JSON.parse(raw);
const rows = [];

function addRow(row) { rows.push(row); }

function traverseSuite(suite, parents = []) {
  const name = suite.title || '';
  const newParents = name ? parents.concat(name) : parents;

  if (suite.specs) {
    suite.specs.forEach(spec => {
      const file = spec.file || 'unknown file';
      const results = spec.results || [];
      results.forEach(r => {
        addRow({
          file,
          title: newParents.concat(spec.title || '').join(' > '),
          status: r.status || 'unknown',
          duration_ms: r.duration || '',
          error: (r.error && r.error.message) || '',
          attachments: (r.attachments || []).map(a => a.name || '').join('; ')
        });
      });
    });
  }

  if (suite.suites) suite.suites.forEach(s => traverseSuite(s, newParents));
}

// top-level suites
if (data.suites) data.suites.forEach(s => traverseSuite(s));

const header = ['file','title','status','duration_ms','error','attachments'];
const csvLines = [header.join(',')];

rows.forEach(r => {
  csvLines.push(
    header.map(h => `"${String(r[h] || '').replace(/"/g,'""')}"`).join(',')
  );
});

const outPath = path.resolve(process.cwd(), 'playwright-report.csv');
fs.writeFileSync(outPath, csvLines.join('\n'), 'utf8');
console.log(`✅ CSV created: ${outPath} (rows: ${rows.length})`);
