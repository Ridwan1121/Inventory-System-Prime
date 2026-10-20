const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');

router.post('/setup', authenticateToken, requireTenant, async (req, res) => {
    const secret = speakeasy.generateSecret({ name: `Prime Inventory (${req.user.email})`, issuer: 'Prime Inventory System' });
    db.run('UPDATE tenants SET twofa_secret = ? WHERE id = ?', [secret.base32, req.user.id]);
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qrCode: qrCodeUrl, message: 'Isku day Google Authenticator' });
});

router.post('/verify', authenticateToken, requireTenant, (req, res) => {
    const { token } = req.body;
    db.get('SELECT twofa_secret FROM tenants WHERE id = ?', [req.user.id], (err, tenant) => {
        if (!tenant || !tenant.twofa_secret) return res.status(400).json({ error: '2FA ma jiro!' });
        const verified = speakeasy.totp.verify({ secret: tenant.twofa_secret, encoding: 'base32', token, window: 2 });
        if (verified) { db.run('UPDATE tenants SET twofa_enabled = 1 WHERE id = ?', [req.user.id]); res.json({ message: '✅ 2FA waa la hawlgeliyay!' }); }
        else res.status(400).json({ error: '2FA code waa khalad!' });
    });
});

module.exports = router;
