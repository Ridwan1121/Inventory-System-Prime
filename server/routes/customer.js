// ============================================================
// CUSTOMER PORTAL - 24/7 Auto Connection + WhatsApp
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { generateToken, getClientIP, logAudit } = require('../utils/helpers');

// GET CUSTOMER DASHBOARD
router.get('/dashboard', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const stats = {};
    
    db.get('SELECT COUNT(*) as total FROM products WHERE user_id=?', [userId], (err, r1) => {
        stats.totalProducts = r1?.total || 0;
        db.get('SELECT COUNT(*) as total FROM sales WHERE user_id=?', [userId], (err, r2) => {
            stats.totalSales = r2?.total || 0;
            db.get('SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE user_id=?', [userId], (err, r3) => {
                stats.totalRevenue = r3?.total || 0;
                db.get('SELECT COUNT(*) as total FROM products WHERE user_id=? AND quantity < min_stock', [userId], (err, r4) => {
                    stats.lowStock = r4?.total || 0;
                    res.json(stats);
                });
            });
        });
    });
});

// 24/7 AUTO CONNECTION - Start session
router.post('/auto-connect', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'];
    const token = generateToken(48);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Deactivate old sessions
    db.run('UPDATE sessions SET is_active=0 WHERE user_id=?', [userId]);

    // Create new session
    db.run(`INSERT INTO sessions (user_id, session_token, ip_address, user_agent, language, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, token, ip, userAgent, req.user.language || 'so', expiresAt],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            logAudit(db, userId, 'AUTO_CONNECT', `Session started from ${ip}`, ip);
            res.json({
                message: '✅ 24/7 Auto Connection active!',
                session_token: token,
                expires_at: expiresAt,
                user_id: userId,
                language: req.user.language || 'so'
            });
        });
});

// Keep-alive heartbeat
router.post('/heartbeat', authenticateToken, (req, res) => {
    db.run('UPDATE sessions SET last_activity=CURRENT_TIMESTAMP WHERE user_id=? AND is_active=1',
        [req.user.id]);
    db.run('UPDATE users SET last_seen=CURRENT_TIMESTAMP WHERE id=?', [req.user.id]);
    res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Get active session
router.get('/session', authenticateToken, (req, res) => {
    db.get('SELECT * FROM sessions WHERE user_id=? AND is_active=1 ORDER BY created_at DESC LIMIT 1',
        [req.user.id], (err, session) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(session || { active: false });
        });
});

// Send message to admin
router.post('/message', authenticateToken, (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Fadlan geli farriin!' });

    db.run(`INSERT INTO messages (sender_id, sender_type, message) VALUES (?, ?, ?)`,
        [req.user.id, 'user', message],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: '✅ Farriinta waa la diray!', id: this.lastID });
        });
});

// Get messages from admin
router.get('/messages', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM messages WHERE (sender_id=? AND sender_type='user') OR (receiver_id=? AND receiver_type='user') ORDER BY created_at DESC LIMIT 50`,
        [req.user.id, req.user.id], (err, messages) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(messages);
        });
});

// Get WhatsApp link
router.get('/whatsapp', authenticateToken, (req, res) => {
    const whatsappNumber = process.env.WHATSAPP_NUMBER || '252634008040';
    const message = encodeURIComponent(`Salaan, waxaan ahay ${req.user.name} (${req.user.business}). Waxaan u baahanahay caawimaad.`);
    res.json({
        whatsapp_url: `https://wa.me/${whatsappNumber}?text=${message}`,
        whatsapp_number: whatsappNumber,
        display: '+252 63 400 8040'
    });
});

module.exports = router;
