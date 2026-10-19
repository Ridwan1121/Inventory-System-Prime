// ============================================================
// OWNER ROUTES - Mulkiilaha Nidaamka (Full Control)
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { authenticateToken, requireOwner, requireMainOwner } = require('../middleware/auth');
const { logAudit, getClientIP } = require('../utils/helpers');

// ============================================
// OWNER LOGIN
// ============================================
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Fadlan geli email iyo password!' });
    }

    db.get('SELECT * FROM owners WHERE email = ?', [email.toLowerCase()], async (err, owner) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!owner) return res.status(400).json({ error: 'Email ama Password waa khalad!' });

        const valid = await bcrypt.compare(password, owner.password);
        if (!valid) return res.status(400).json({ error: 'Email ama Password waa khalad!' });

        const token = jwt.sign(
            { id: owner.id, email: owner.email, name: owner.name, userType: 'owner', isMainOwner: owner.is_main_owner === 1 },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        logAudit(db, owner.id, 'owner', null, 'OWNER_LOGIN', `Owner logged in`, getClientIP(req));

        res.json({
            message: '✅ Owner soo galid waa guul!',
            token,
            owner: { id: owner.id, name: owner.name, email: owner.email, isMainOwner: owner.is_main_owner === 1 }
        });
    });
});

// ============================================
// GET DASHBOARD STATS
// ============================================
router.get('/dashboard', authenticateToken, requireOwner, (req, res) => {
    const stats = {};
    db.get('SELECT COUNT(*) as total FROM tenants', (err, r1) => {
        stats.totalTenants = r1?.total || 0;
        db.get('SELECT COUNT(*) as total FROM tenants WHERE status = "active"', (err, r2) => {
            stats.activeTenants = r2?.total || 0;
            db.get('SELECT COALESCE(SUM(amount), 0) as total FROM subscriptions WHERE status = "active"', (err, r3) => {
                stats.monthlyRevenue = r3?.total || 0;
                db.get('SELECT COUNT(*) as total FROM schedules WHERE is_active = 1', (err, r4) => {
                    stats.activeSchedules = r4?.total || 0;
                    res.json(stats);
                });
            });
        });
    });
});

// ============================================
// GET ALL TENANTS
// ============================================
router.get('/tenants', authenticateToken, requireOwner, (req, res) => {
    db.all(`SELECT id, name, business_name, email, phone_international, language, plan, 
            plan_expires_at, status, domain, subdomain, last_seen, created_at 
            FROM tenants ORDER BY created_at DESC`, [], (err, tenants) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(tenants);
    });
});

// ============================================
// GET TENANT DETAILS
// ============================================
router.get('/tenants/:id', authenticateToken, requireOwner, (req, res) => {
    db.get('SELECT * FROM tenants WHERE id = ?', [req.params.id], (err, tenant) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!tenant) return res.status(404).json({ error: 'Tenant lama helin!' });
        res.json(tenant);
    });
});

// ============================================
// UPDATE TENANT (Owner only)
// ============================================
router.put('/tenants/:id', authenticateToken, requireOwner, (req, res) => {
    const { name, business_name, email, phone, status, plan, language, domain, subdomain } = req.body;
    db.run(`UPDATE tenants SET name=?, business_name=?, email=?, phone=?, status=?, plan=?, 
            language=?, domain=?, subdomain=? WHERE id=?`,
        [name, business_name, email, phone, status, plan, language, domain, subdomain, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            logAudit(db, req.user.id, 'owner', null, 'UPDATE_TENANT', `Tenant ${req.params.id} updated`, getClientIP(req));
            res.json({ message: '✅ Tenant waa la cusboonaysiiyay!' });
        });
});

// ============================================
// SUSPEND/ACTIVATE TENANT
// ============================================
router.put('/tenants/:id/status', authenticateToken, requireOwner, (req, res) => {
    const { status } = req.body;
    db.run('UPDATE tenants SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        logAudit(db, req.user.id, 'owner', null, 'CHANGE_TENANT_STATUS', `Tenant ${req.params.id} -> ${status}`, getClientIP(req));
        res.json({ message: `✅ Tenant status: ${status}` });
    });
});

// ============================================
// DELETE TENANT (Main Owner only)
// ============================================
router.delete('/tenants/:id', authenticateToken, requireMainOwner, (req, res) => {
    db.run('DELETE FROM tenants WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        logAudit(db, req.user.id, 'owner', null, 'DELETE_TENANT', `Tenant ${req.params.id} deleted`, getClientIP(req));
        res.json({ message: '✅ Tenant waa la tirtiray!' });
    });
});

// ============================================
// GET ALL SUBSCRIPTIONS
// ============================================
router.get('/subscriptions', authenticateToken, requireOwner, (req, res) => {
    db.all(`SELECT s.*, t.business_name, t.email as tenant_email 
            FROM subscriptions s JOIN tenants t ON s.tenant_id = t.id 
            ORDER BY s.created_at DESC`, [], (err, subs) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(subs);
    });
});

// ============================================
// GET AUDIT LOGS
// ============================================
router.get('/audit-logs', authenticateToken, requireOwner, (req, res) => {
    db.all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500', [], (err, logs) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(logs);
    });
});

// ============================================
// SYSTEM SETTINGS
// ============================================
router.get('/settings', authenticateToken, requireOwner, (req, res) => {
    db.all('SELECT * FROM system_settings', [], (err, settings) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(settings);
    });
});

router.put('/settings', authenticateToken, requireMainOwner, (req, res) => {
    const { key, value } = req.body;
    db.run('UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [value, key], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ Setting updated' });
    });
});

module.exports = router;
