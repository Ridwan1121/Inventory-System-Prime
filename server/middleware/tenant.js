const db = require('../models/database');
function detectTenant(req, res, next) {
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    const mainDomain = process.env.MAIN_DOMAIN || '';
    if (host === mainDomain || host.includes('localhost') || subdomain === 'www') { req.tenant = null; return next(); }
    db.get('SELECT * FROM tenants WHERE subdomain = ? OR domain = ? AND status = "active"', [subdomain, host], (err, tenant) => {
        if (err) return res.status(500).json({ error: err.message });
        req.tenant = tenant || null; next();
    });
}
function requireActiveTenant(req, res, next) {
    if (!req.tenant) return res.status(404).json({ error: 'Tenant not found.' });
    if (req.tenant.status !== 'active') return res.status(403).json({ error: 'Tenant account not active.' });
    next();
}
module.exports = { detectTenant, requireActiveTenant };
