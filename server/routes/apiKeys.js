const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');

router.post('/keys', authenticateToken, requireTenant, (req, res) => {
    const { name, permissions } = req.body;
    if (!name) return res.status(400).json({ error: 'Fadlan geli magaca API key!' });
    const apiKey = 'pik_' + crypto.randomBytes(32).toString('hex');
    const apiSecret = crypto.randomBytes(64).toString('hex');
    db.run('INSERT INTO api_keys (tenant_id, name, api_key, api_secret, permissions, status) VALUES (?, ?, ?, ?, ?, "active")',
        [req.user.id, name, apiKey, apiSecret, JSON.stringify(permissions || ['read'])],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: '✅ API key waa la abuuray!', api_key: apiKey, api_secret: apiSecret, warning: '⚠️ Kaydi api_secret hadda!' });
        });
});

router.get('/keys', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT id, name, api_key, permissions, status, last_used, created_at FROM api_keys WHERE tenant_id = ?', [req.user.id], (err, keys) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(keys);
    });
});

module.exports = router;
