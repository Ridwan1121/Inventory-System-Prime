const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
function createBackup() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.sqlite`);
        fs.copyFileSync(DB_PATH, backupPath);
        console.log('✅ Backup created:', backupPath);
        const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup-')).sort().reverse();
        if (backups.length > 7) backups.slice(7).forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f)));
        return { success: true, path: backupPath };
    } catch (error) { return { success: false, error: error.message }; }
}
cron.schedule('0 2 * * *', () => { console.log('⏰ Daily backup...'); createBackup(); });
module.exports = { createBackup };
