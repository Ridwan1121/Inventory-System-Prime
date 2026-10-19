// ============================================================
// AUTH ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { formatPhoneInternational, validateEmail, getClientIP } = require('../utils/helpers');

// SIGNUP
router.post('/signup', async (req, res) => {
    const { name, business, email, phone, phone_country, password, language, address, city, country, tax_id } = req.body;

    if (!name || !business || !email || !phone || !password) {
        return res.status(400).json({ 
            error: language === 'so' 
                ? 'Fadlan buuxi dhammaan meelaha loo baahan yahay!' 
                : 'Please fill all required fields!' 
        });
    }
    if (password.length < 6) {
        return res.status(400).json({ 
            error: language === 'so' 
                ? 'Password-ka waa inuu ka badan yahay 6 xaraf!' 
                : 'Password must be at least 6 characters!' 
        });
    }
    if (!validateEmail(email)) {
        return res.status(400).json({ 
            error: language === 'so' ? 'Email-ka sax ma aha!' : 'Invalid email!' 
        });
    }

    const phoneIntl = formatPhoneInternational(phone, phone_country || '252');

    db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (user) return res.status(400).json({ 
            error: language === 'so' ? 'Email-kan hore ayaa loo isticmaalay!' : 'Email already used!' 
        });

        const hash = await bcrypt.hash(password, 10);
        const lang = language || 'so';

        db.run(`INSERT INTO users (name, business, email, phone, phone_country, phone_international, password, language, address, city, country, tax_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, business, email.toLowerCase(), phone, phone_country || '252', phoneIntl, hash, lang, address || '', city || '', country || '', tax_id || ''],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });

                const token = jwt.sign(
                    { id: this.lastID, email, name, business, language: lang },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.status(201).json({
                    message: lang === 'so' ? '✅ Account waa la sameeyay!' : '✅ Account created!',
                    token,
                    user: { id: this.lastID, name, business, email, phone: phoneIntl, language: lang }
                });
            });
    });
});

// LOGIN
router.post('/login', (req, res) => {
    const { email, password, language } = req.body;
    const lang = language || 'so';

    if (!email || !password) {
        return res.status(400).json({ 
            error: lang === 'so' ? 'Fadlan geli email iyo password!' : 'Please enter email and password!' 
        });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ 
            error: lang === 'so' ? 'Email ama Password waa khalad!' : 'Invalid email or password!' 
        });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ 
            error: lang === 'so' ? 'Email ama Password waa khalad!' : 'Invalid email or password!' 
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, business: user.business, language: user.language },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        db.run('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        res.json({
            message: lang === 'so' ? '✅ Soo galid waa guul!' : '✅ Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                business: user.business,
                email: user.email,
                phone: user.phone_international,
                language: user.language,
                plan: user.plan,
                status: user.status
            }
        });
    });
});

// ADMIN LOGIN
router.post('/admin/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Fadlan geli email iyo password!' });

    db.get('SELECT * FROM admins WHERE email = ?', [email], async (err, admin) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!admin) return res.status(400).json({ error: 'Email ama Password waa khalad!' });

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) return res.status(400).json({ error: 'Email ama Password waa khalad!' });

        const token = jwt.sign(
            { id: admin.id, email: admin.email, name: admin.name, role: 'admin', isAdmin: true },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: '✅ Admin soo galid waa guul!',
            token,
            admin: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' }
        });
    });
});


// ============================================
// PASSWORD RESET
// ============================================
const crypto = require('crypto');
const { sendEmail, passwordResetEmail } = require('../utils/email');

// Store reset tokens (in production, use database table)
const resetTokens = new Map();

router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Fadlan geli email-kaaga!' });
    }
    
    db.get('SELECT * FROM tenants WHERE email = ?', [email.toLowerCase()], (err, tenant) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!tenant) {
            return res.json({ message: 'Haddii email-ku jiro, waxaan ku soo dirnay link reset.' });
        }
        
        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 3600000; // 1 hour
        
        resetTokens.set(token, { tenantId: tenant.id, expires });
        
        // Send email
        const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
        sendEmail(tenant.email, '🔐 Password Reset - Prime Inventory', passwordResetEmail(tenant.name, resetLink));
        
        res.json({ message: '✅ Link reset waa la diray email-kaaga!' });
    });
});

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Fadlan geli token iyo password cusub!' });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password-ka waa inuu ka badan yahay 6 xaraf!' });
    }
    
    const reset = resetTokens.get(token);
    if (!reset || reset.expires < Date.now()) {
        return res.status(400).json({ error: 'Token-ka waa khalad ama wuu dhacay!' });
    }
    
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(newPassword, 10);
    
    db.run('UPDATE tenants SET password = ? WHERE id = ?', [hash, reset.tenantId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        resetTokens.delete(token);
        res.json({ message: '✅ Password-ka waa la bedelay! Hadda soo gal.' });
    });
});

// ============================================
// EMAIL VERIFICATION
// ============================================
const verifyTokens = new Map();

router.post('/verify-email', (req, res) => {
    const { token } = req.body;
    
    if (!token) return res.status(400).json({ error: 'Token waa loo baahan yahay!' });
    
    const verify = verifyTokens.get(token);
    if (!verify || verify.expires < Date.now()) {
        return res.status(400).json({ error: 'Token-ka waa khalad ama wuu dhacay!' });
    }
    
    db.run('UPDATE tenants SET is_verified = 1 WHERE id = ?', [verify.tenantId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        verifyTokens.delete(token);
        res.json({ message: '✅ Email-kaaga waa la xaqiijiyay!' });
    });
});

router.post('/resend-verification', (req, res) => {
    const { email } = req.body;
    
    db.get('SELECT * FROM tenants WHERE email = ?', [email.toLowerCase()], (err, tenant) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!tenant) return res.status(404).json({ error: 'Tenant lama helin!' });
        if (tenant.is_verified) return res.json({ message: 'Email-kaaga hore ayaa loo xaqiijiyay!' });
        
        const token = crypto.randomBytes(32).toString('hex');
        verifyTokens.set(token, { tenantId: tenant.id, expires: Date.now() + 86400000 });
        
        const verifyLink = `${req.protocol}://${req.get('host')}/verify-email?token=${token}`;
        const { verificationEmail } = require('../utils/email');
        sendEmail(tenant.email, '✅ Xaqiiji Email-kaaga - Prime Inventory', verificationEmail(tenant.name, verifyLink));
        
        res.json({ message: '✅ Email xaqiijin waa la diray!' });
    });
});

module.exports = router;

