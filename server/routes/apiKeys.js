// ============================================================
// API FOR THIRD-PARTY - API Keys Management
// ============================================================

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');

// ============================================
// GENERATE API KEY
// ============================================
router.post('/keys', authenticateToken, requireTenant, (req, res) => {
    const { name, permissions } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Fadlan geli magaca API key!' });
    
    const apiKey = 'pik_' + crypto.randomBytes(32).toString('hex');
    const apiSecret = crypto.randomBytes(64).toString('hex');
    
    db.run(`INSERT INTO api_keys (tenant_id, name, api_key, api_secret, permissions, status) 
            VALUES (?, ?, ?, ?, ?, 'active')`,
        [req.user.id, name, apiKey, apiSecret, JSON.stringify(permissions || ['read'])],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: '✅ API key waa la abuuray!',
                api_key: apiKey,
                api_secret: apiSecret,
                warning: '⚠️ Kaydi api_secret hadda! Ma arki doontid mar kale.'
            });
        });
});

// ============================================
// GET ALL API KEYS
// ============================================
router.get('/keys', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT id, name, api_key, permissions, status, last_used, created_at FROM api_keys WHERE tenant_id = ?',
        [req.user.id], (err, keys) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(keys || []);
        });
});

// ============================================
// REVOKE API KEY
// ============================================
router.delete('/keys/:id', authenticateToken, requireTenant, (req, res) => {
    db.run('UPDATE api_keys SET status = "revoked" WHERE id = ? AND tenant_id = ?',
        [req.params.id, req.user.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'API key lama helin!' });
            res.json({ message: '✅ API key waa la damiyay!' });
        });
});

// ============================================
// API AUTH MIDDLEWARE
// ============================================
function apiKeyAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API key waa loo baahan yahay!' });
    }
    
    db.get('SELECT * FROM api_keys WHERE api_key = ? AND status = "active"', [apiKey], (err, key) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!key) return res.status(401).json({ error: 'API key waa khalad ama waa la damiyay!' });
        
        // Update last used
        db.run('UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = ?', [key.id]);
        
        req.apiKey = key;
        req.tenantId = key.tenant_id;
        next();
    });
}

// ============================================
// PUBLIC API ENDPOINTS (with API key)
// ============================================
router.get('/v1/products', apiKeyAuth, (req, res) => {
    db.all('SELECT id, name, category, price, quantity, sku FROM products WHERE tenant_id = ?',
        [req.tenantId], (err, products) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: products || [], count: products?.length || 0 });
        });
});

router.get('/v1/sales', apiKeyAuth, (req, res) => {
    db.all('SELECT id, product_name, quantity, total, created_at FROM sales WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 100',
        [req.tenantId], (err, sales) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: sales || [], count: sales?.length || 0 });
        });
});

module.exports = router;
module.exports.apiKeyAuth = apiKeyAuth;
