const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');
const { formatPhoneInternational, validateEmail } = require('../utils/helpers');

router.post('/signup', async (req, res) => {
    const { name, business_name, email, phone, phone_country, password, language, address, city, country, tax_id } = req.body;
    if (!name || !business_name || !email || !phone || !password) return res.status(400).json({ error: 'Fadlan buuxi dhammaan meelaha!' });
    if (password.length < 6) return res.status(400).json({ error: 'Password-ka waa inuu ka badan yahay 6 xaraf!' });
    const phoneIntl = formatPhoneInternational(phone, phone_country || '252');
    const lang = language || 'so';
    db.get('SELECT * FROM tenants WHERE email = ?', [email.toLowerCase()], async (err, tenant) => {
        if (tenant) return res.status(400).json({ error: 'Email-kan hore ayaa loo isticmaalay!' });
        const hash = await bcrypt.hash(password, 10);
        const subdomain = business_name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
        db.run(`INSERT INTO tenants (name, business_name, email, phone, phone_country, phone_international, password, language, address, city, country, tax_id, subdomain, plan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'free')`,
            [name, business_name, email.toLowerCase(), phone, phone_country || '252', phoneIntl, hash, lang, address || '', city || '', country || '', tax_id || '', subdomain],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                const token = jwt.sign({ id: this.lastID, email, name, business_name, userType: 'tenant', language: lang }, process.env.JWT_SECRET, { expiresIn: '7d' });
                res.status(201).json({ message: '✅ Account waa la sameeyay!', token, tenant: { id: this.lastID, name, business_name, email, phone: phoneIntl, subdomain, plan: 'free', language: lang } });
            });
    });
});

router.post('/login', (req, res) => {
    const { email, password, language } = req.body;
    const lang = language || 'so';
    if (!email || !password) return res.status(400).json({ error: 'Fadlan geli email iyo password!' });
    db.get('SELECT * FROM tenants WHERE email = ?', [email.toLowerCase()], async (err, tenant) => {
        if (!tenant) return res.status(400).json({ error: 'Email ama Password waa khalad!' });
        if (tenant.status !== 'active') return res.status(403).json({ error: 'Account-kaagu waa la joojiyay.' });
        const valid = await bcrypt.compare(password, tenant.password);
        if (!valid) return res.status(400).json({ error: 'Email ama Password waa khalad!' });
        const token = jwt.sign({ id: tenant.id, email: tenant.email, name: tenant.name, business_name: tenant.business_name, userType: 'tenant', language: tenant.language }, process.env.JWT_SECRET, { expiresIn: '7d' });
        db.run('UPDATE tenants SET last_seen = CURRENT_TIMESTAMP WHERE id = ?', [tenant.id]);
        res.json({ message: '✅ Soo galid waa guul!', token, tenant: { id: tenant.id, name: tenant.name, business_name: tenant.business_name, email: tenant.email, phone: tenant.phone_international, language: tenant.language, plan: tenant.plan, plan_expires_at: tenant.plan_expires_at, subdomain: tenant.subdomain } });
    });
});

router.get('/dashboard', authenticateToken, requireTenant, (req, res) => {
    const tid = req.user.id;
    const stats = {};
    db.get('SELECT COUNT(*) as total FROM products WHERE tenant_id = ?', [tid], (err, r1) => {
        stats.totalProducts = r1?.total || 0;
        db.get('SELECT COUNT(*) as total FROM sales WHERE tenant_id = ?', [tid], (err, r2) => {
            stats.totalSales = r2?.total || 0;
            db.get('SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE tenant_id = ?', [tid], (err, r3) => {
                stats.totalRevenue = r3?.total || 0;
                db.get('SELECT COUNT(*) as total FROM products WHERE tenant_id = ? AND quantity < min_stock', [tid], (err, r4) => {
                    stats.lowStock = r4?.total || 0;
                    db.get('SELECT COUNT(*) as total FROM schedules WHERE tenant_id = ? AND is_active = 1', [tid], (err, r5) => {
                        stats.activeSchedules = r5?.total || 0;
                        res.json(stats);
                    });
                });
            });
        });
    });
});

router.get('/profile', authenticateToken, requireTenant, (req, res) => {
    db.get('SELECT id, name, business_name, email, phone_international, language, address, city, country, tax_id, plan, plan_expires_at, subdomain, domain, created_at FROM tenants WHERE id = ?', [req.user.id], (err, tenant) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(tenant);
    });
});

module.exports = router;
