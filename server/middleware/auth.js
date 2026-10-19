// ============================================================
// AUTH MIDDLEWARE - COMPLETE
// ============================================================

const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user) return res.status(403).json({ error: 'Access denied.' });
    if (req.user.userType === 'owner' || req.user.isAdmin) return next();
    return res.status(403).json({ error: 'Admin access required.' });
}

function requireOwner(req, res, next) {
    if (!req.user || req.user.userType !== 'owner') {
        return res.status(403).json({ error: 'Owner access required.' });
    }
    next();
}

function requireTenant(req, res, next) {
    if (!req.user || req.user.userType !== 'tenant') {
        return res.status(403).json({ error: 'Tenant access required.' });
    }
    next();
}

function requireMainOwner(req, res, next) {
    if (!req.user || !req.user.isMainOwner) {
        return res.status(403).json({ error: 'Main owner access required.' });
    }
    next();
}

function trackActivity(req, res, next) {
    try {
        const db = require('../models/database');
        if (req.user && req.user.id) {
            let table = 'tenants';
            if (req.user.userType === 'owner') table = 'owners';
            db.run(`UPDATE ${table} SET last_seen = CURRENT_TIMESTAMP WHERE id = ?`, [req.user.id], () => {});
        }
    } catch (e) {}
    next();
}

module.exports = {
    authenticateToken,
    requireAdmin,
    requireOwner,
    requireTenant,
    requireMainOwner,
    trackActivity
};
