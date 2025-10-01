import fs from 'fs';
import path from 'path';

/**
 * Backup existing file to backup folder with timestamp
 * @param {string} filePath - full path of file to backup
 * @param {string} subFolder - 'excel' or 'csv'
 * @returns {string} backup path
 */
export function backupFile(filePath, subFolder = '') {
  if (!fs.existsSync(filePath)) return null;

  const reportDir = path.dirname(filePath);
  const backupDir = path.join(reportDir, 'backup', subFolder);
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const ext = path.extname(filePath); // .xlsx or .csv
  const base = path.basename(filePath, ext);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `${base}.${timestamp}.bak${ext}`);

  fs.copyFileSync(filePath, backupPath);
  console.log(`📦 Backup created: ${backupPath}`);
  return backupPath;
}
