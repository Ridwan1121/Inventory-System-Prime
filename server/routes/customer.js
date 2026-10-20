const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, requireTenant, (req, res) => {
    const stats = {};
    db.get('SELECT COUNT(*) as total FROM products WHERE tenant_id=?', [req.user.id], (err, r1) => {
        stats.totalProducts = r1?.total || 0;
        db.get('SELECT COUNT(*) as total FROM sales WHERE tenant_id=?', [req.user.id], (err, r2) => {
            stats.totalSales = r2?.total || 0;
            res.json(stats);
        });
    });
});

router.get('/whatsapp', authenticateToken, (req, res) => {
    res.json({ whatsapp_url: `https://wa.me/${process.env.WHATSAPP_NUMBER || '252634008040'}`, whatsapp_number: process.env.WHATSAPP_NUMBER });
});

module.exports = router;
