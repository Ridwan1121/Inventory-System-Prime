const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { formatPhoneInternational, validateEmail } = require('../utils/helpers');

router.post('/signup', async (req, res) => {
    const { name, business_name, email, phone, phone_country, password, language, address, city, country, tax_id } = req.body;
    if (!name || !business_name || !email || !phone || !password) return res.status(400).json({ error: 'Fadlan buuxi dhammaan meelaha!' });
    if (password.length < 6) return res.status(400).json({ error: 'Password-ka waa inuu ka badan yahay 6 xaraf!' });
    if (!validateEmail(email)) return res.status(400).json({ error: 'Email-ka sax ma aha!' });
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

router.post('/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Fadlan geli email iyo password!' });
    db.get('SELECT * FROM owners WHERE email = ?', [email.toLowerCase()], async (err, admin) => {
        if (!admin) return res.status(400).json({ error: 'Email ama Password waa khalad!' });
        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) return res.status(400).json({ error: 'Email ama Password waa khalad!' });
        const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name, userType: 'owner', isAdmin: true, isMainOwner: admin.is_main_owner === 1 }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: '✅ Admin soo galid waa guul!', token, admin: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' } });
    });
});

const crypto = require('crypto');
const { sendEmail, passwordResetEmail } = require('../utils/email');
const resetTokens = new Map();

router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Fadlan geli email-kaaga!' });
    db.get('SELECT * FROM tenants WHERE email = ?', [email.toLowerCase()], (err, tenant) => {
        if (!tenant) return res.json({ message: 'Haddii email-ku jiro, waxaan ku soo dirnay link reset.' });
        const token = crypto.randomBytes(32).toString('hex');
        resetTokens.set(token, { tenantId: tenant.id, expires: Date.now() + 3600000 });
        const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
        sendEmail(tenant.email, '🔐 Password Reset - Prime Inventory', passwordResetEmail(tenant.name, resetLink));
        res.json({ message: '✅ Link reset waa la diray email-kaaga!' });
    });
});

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Fadlan geli token iyo password cusub!' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password-ka waa inuu ka badan yahay 6 xaraf!' });
    const reset = resetTokens.get(token);
    if (!reset || reset.expires < Date.now()) return res.status(400).json({ error: 'Token-ka waa khalad ama wuu dhacay!' });
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE tenants SET password = ? WHERE id = ?', [hash, reset.tenantId], (err) => {
        resetTokens.delete(token);
        res.json({ message: '✅ Password-ka waa la bedelay!' });
    });
});

module.exports = router;
