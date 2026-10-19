// ============================================================
// DATABASE BACKUP - Auto
// ============================================================

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function createBackup() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.sqlite`);
        
        fs.copyFileSync(DB_PATH, backupPath);
        console.log('✅ Database backup created:', backupPath);
        
        // Keep only last 7 backups
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('backup-'))
            .sort()
            .reverse();
        
        if (backups.length > 7) {
            backups.slice(7).forEach(f => {
                fs.unlinkSync(path.join(BACKUP_DIR, f));
                console.log('🗑️ Old backup deleted:', f);
            });
        }
        
        return { success: true, path: backupPath };
    } catch (error) {
        console.error('❌ Backup error:', error.message);
        return { success: false, error: error.message };
    }
}

// Schedule daily backup at 2 AM
cron.schedule('0 2 * * *', () => {
    console.log('⏰ Running scheduled backup...');
    createBackup();
});

module.exports = { createBackup };
