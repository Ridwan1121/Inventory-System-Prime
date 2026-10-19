// ============================================================
// 2FA - Two-Factor Authentication
// ============================================================

const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');

// ============================================
// GENERATE 2FA SECRET
// ============================================
router.post('/setup', authenticateToken, requireTenant, async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `Prime Inventory (${req.user.email})`,
            issuer: 'Prime Inventory System'
        });
        
        // Save secret temporarily (or to database)
        db.run('UPDATE tenants SET twofa_secret = ? WHERE id = ?', [secret.base32, req.user.id]);
        
        // Generate QR code
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
        
        res.json({
            secret: secret.base32,
            qrCode: qrCodeUrl,
            message: 'Isku day Google Authenticator ama Authy'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// VERIFY 2FA TOKEN
// ============================================
router.post('/verify', authenticateToken, requireTenant, (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ error: 'Fadlan geli 2FA code!' });
    }
    
    db.get('SELECT twofa_secret FROM tenants WHERE id = ?', [req.user.id], (err, tenant) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!tenant || !tenant.twofa_secret) {
            return res.status(400).json({ error: '2FA ma jiro. Marka hore setup-garee.' });
        }
        
        const verified = speakeasy.totp.verify({
            secret: tenant.twofa_secret,
            encoding: 'base32',
            token,
            window: 2
        });
        
        if (verified) {
            db.run('UPDATE tenants SET twofa_enabled = 1 WHERE id = ?', [req.user.id]);
            res.json({ message: '✅ 2FA waa la hawlgeliyay!' });
        } else {
            res.status(400).json({ error: '2FA code waa khalad!' });
        }
    });
});

// ============================================
// DISABLE 2FA
// ============================================
router.post('/disable', authenticateToken, requireTenant, (req, res) => {
    db.run('UPDATE tenants SET twofa_enabled = 0, twofa_secret = NULL WHERE id = ?', [req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ 2FA waa la damiyay!' });
    });
});

module.exports = router;
