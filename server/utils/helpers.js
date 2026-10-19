// ============================================================
// HELPERS - Utility Functions
// ============================================================

const crypto = require('crypto');

function formatPhoneInternational(phone, countryCode = '252') {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (!cleaned.startsWith(countryCode)) cleaned = countryCode + cleaned;
    return '+' + cleaned;
}

function formatPhoneDisplay(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('252')) {
        return `+252 ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
    }
    return phone;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
}

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           'Unknown';
}

function logAudit(db, userId, userType, tenantId, action, details, ip) {
    db.run('INSERT INTO audit_logs (user_id, user_type, tenant_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, userType, tenantId, action, details, ip]);
}

function getLang(req) {
    const lang = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
    const supported = (process.env.SUPPORTED_LANGUAGES || 'so,en').split(',');
    return supported.includes(lang) ? lang : (process.env.DEFAULT_LANGUAGE || 'so');
}

// Calculate next run for schedule
function calculateNextRun(schedule) {
    const now = new Date();
    const [hours, minutes] = (schedule.time_of_day || '09:00').split(':').map(Number);
    
    if (schedule.frequency === 'daily') {
        const next = new Date(now);
        next.setHours(hours, minutes, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        return next;
    }
    
    if (schedule.frequency === 'weekly') {
        const days = (schedule.days_of_week || '1').split(',').map(Number);
        const next = new Date(now);
        next.setHours(hours, minutes, 0, 0);
        for (let i = 1; i <= 7; i++) {
            next.setDate(next.getDate() + 1);
            if (days.includes(next.getDay())) return next;
        }
    }
    
    if (schedule.frequency === 'custom' && schedule.custom_interval) {
        return new Date(now.getTime() + schedule.custom_interval * 60 * 60 * 1000);
    }
    
    return null;
}

module.exports = {
    formatPhoneInternational,
    formatPhoneDisplay,
    validateEmail,
    generateToken,
    generateInvoiceNumber,
    getClientIP,
    logAudit,
    getLang,
    calculateNextRun
};
