// tools/report-json-to-csv.js
import fs from 'fs';
import path from 'path';
import readline from 'readline';

/**
 * Interactive JSON -> CSV exporter with:
 * - fallback / manual JSON selection from playwright-report folder
 * - filter: A (all) / P (passed) / F (failed)
 * - CSV escaping and newline sanitization
 * - backup of existing CSV to backup/csv folder
 */

// ---------- helpers ----------
const ask = (question) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve((ans||'').trim()); }));
};

const escapeCSV = (v) => {
  const s = String(v ?? '').replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
  return `"${s}"`;
};

const timestamp = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

// ---------- backup helper ----------
const backupFile = (filePath, type='csv') => {
  if (!fs.existsSync(filePath)) return;
  const backupDir = path.resolve('playwright-report', 'backup', type);
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupName = path.join(backupDir, `${path.basename(filePath).replace(/\.[^/.]+$/, '')}.${timestamp()}.bak.${type}`);
  fs.copyFileSync(filePath, backupName);
  console.log(`\nExisting ${type.toUpperCase()} backed up to: ${backupName}`);
};

// ---------- locate report folder & files ----------
const reportDir = path.resolve(process.cwd(), 'playwright-report');
const defaultJson = path.join(reportDir, 'report.json');

function listJsonFiles(dir) {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith('.json'))
      .map(f => path.join(dir, f));
  } catch (e) {
    return [];
  }
}

// ---------- traverse JSON ----------
function extractRowsFromData(data) {
  const rows = [];
  function addRow(r) { rows.push(r); }

  function traverseSuite(suite, parents = []) {
    const suiteName = suite.title || '';
    const newParents = suiteName ? [...parents, suiteName] : parents;

    if (Array.isArray(suite.specs) && suite.specs.length) {
      suite.specs.forEach(spec => {
        const file = spec.file || '';
        const specTitle = spec.title || '';
        const fullTitle = [...newParents, specTitle].join(' > ');

        if (Array.isArray(spec.tests) && spec.tests.length) {
          spec.tests.forEach(test => {
            const results = Array.isArray(test.results) ? test.results : [];
            results.forEach(res => {
              addRow({
                file,
                title: fullTitle,
                status: res.status || res.outcome || 'unknown',
                duration_ms: res.duration ?? '',
                error: extractErrors(res),
                attachments: extractAttachments(res),
                // traces: extractTraces(res)
              });
            });
          });
        } else if (Array.isArray(spec.results) && spec.results.length) {
          spec.results.forEach(res => {
            addRow({
              file,
              title: fullTitle,
              status: res.status || res.outcome || 'unknown',
              duration_ms: res.duration ?? '',
              error: extractErrors(res),
              attachments: extractAttachments(res),
              // traces: extractTraces(res)
            });
          });
        }
      });
    }

    if (Array.isArray(suite.suites) && suite.suites.length) {
      suite.suites.forEach(s => traverseSuite(s, newParents));
    }
  }

  function extractErrors(res) {
    if (!res) return '';
    if (Array.isArray(res.errors) && res.errors.length) {
      return res.errors.map(e => (e && (e.message || e.value || String(e))) ).join('; ');
    }
    if (res.error) {
      if (typeof res.error === 'string') return res.error;
      if (res.error.message) return res.error.message;
    }
    return '';
  }

  function extractAttachments(res) {
    if (!res || !Array.isArray(res.attachments)) return '';
    return res.attachments.map(a => {
      const name = a.name || a.path || '';
      const p = a.path ? `:${a.path}` : '';
      return `${name}${p}`;
    }).join('; ');
  }

  // traces extractor (commented)
  // function extractTraces(res) {
  //   if (!res || !Array.isArray(res.attachments)) return '';
  //   return res.attachments.filter(a => a.contentType && a.contentType.includes('zip')).map(a => a.path).join('; ');
  // }

  if (Array.isArray(data.suites)) data.suites.forEach(s => traverseSuite(s));

  return rows;
}

// ---------- main ----------
(async () => {
  if (!fs.existsSync(reportDir)) {
    console.error(`❌ Directory not found: ${reportDir}`);
    process.exit(1);
  }

  const jsonFiles = listJsonFiles(reportDir);
  if (jsonFiles.length === 0) {
    console.error('❌ No JSON files found in', reportDir);
    process.exit(1);
  }

  let chosenPath = null;

  if (fs.existsSync(defaultJson)) {
    try {
      const raw = fs.readFileSync(defaultJson, 'utf8');
      const rows = extractRowsFromData(JSON.parse(raw));
      if (rows.length > 0) {
        const ans = (await ask('Use default report.json? (Y = yes, any other key to choose different file) [Y]: ')) || 'Y';
        if (ans.toUpperCase() === 'Y') chosenPath = defaultJson;
      }
    } catch {}
  }

  if (!chosenPath) {
    console.log('\nJSON files found:');
    jsonFiles.forEach((p, i) => {
      const marker = (path.resolve(p) === path.resolve(defaultJson)) ? '(default)' : '';
      console.log(`  [${i}] ${path.basename(p)} ${marker}`);
    });

    const choice = (await ask('Your choice (index / path / Enter): ')).trim();
    if (choice === '') chosenPath = fs.existsSync(defaultJson) ? defaultJson : jsonFiles[0];
    else if (/^\d+$/.test(choice)) {
      const idx = Number(choice);
      if (idx >= 0 && idx < jsonFiles.length) chosenPath = jsonFiles[idx];
      else { console.error('Invalid index. Exiting.'); process.exit(1); }
    } else {
      const maybe = path.resolve(choice);
      if (fs.existsSync(maybe)) chosenPath = maybe;
      else { console.error('Path not found:', maybe); process.exit(1); }
    }
  }

  let jsonData;
  try { jsonData = JSON.parse(fs.readFileSync(chosenPath, 'utf8')); } 
  catch (e) { console.error('❌ Failed to parse JSON:', e.message); process.exit(1); }

  const rows = extractRowsFromData(jsonData);
  if (rows.length === 0) { console.warn('⚠️ No test results found. Exiting.'); process.exit(0); }

  // filter
  console.log('\nChoose which results to export: [A] All, [P] Passed only, [F] Failed only');
  const filterAns = (await ask('Enter choice (A/P/F) [A]: ')) || 'A';
  const filter = filterAns.trim().toUpperCase();
  let filtered = rows;
  if (filter === 'P') filtered = rows.filter(r => String(r.status).toLowerCase() === 'passed');
  else if (filter === 'F') filtered = rows.filter(r => String(r.status).toLowerCase() !== 'passed');

  // prepare CSV
  const header = ['file','title','status','duration_ms','error','attachments'];
  const csvLines = [header.join(',')];
  filtered.forEach(r => csvLines.push(header.map(h => escapeCSV(r[h])).join(',')));

  // backup CSV before writing
  const outPath = path.resolve(reportDir, 'report.csv');
  backupFile(outPath, 'csv');

  fs.writeFileSync(outPath, csvLines.join('\n'), 'utf8');
  console.log(`\n✅ CSV created: ${outPath}`);
  console.log(`📦 Rows exported: ${filtered.length}`);
})();
