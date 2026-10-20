const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, requireTenant, requireOwner } = require('../middleware/auth');
const { generateInvoiceNumber } = require('../utils/helpers');

const PLANS = {
    free: { name: 'Free', price: 0, features: ['1 User', '50 Products'], max_products: 50, max_users: 1 },
    starter: { name: 'Starter', price: 9.99, features: ['3 Users', '500 Products'], max_products: 500, max_users: 3 },
    professional: { name: 'Professional', price: 29.99, features: ['10 Users', '5000 Products'], max_products: 5000, max_users: 10 },
    enterprise: { name: 'Enterprise', price: 99.99, features: ['50 Users', 'Unlimited'], max_products: -1, max_users: 50 },
    ultimate: { name: 'Ultimate', price: 299.99, features: ['Unlimited', 'White Label'], max_products: -1, max_users: -1 }
};

router.get('/plans', (req, res) => { res.json(Object.keys(PLANS).map(key => ({ id: key, ...PLANS[key] }))); });

router.get('/subscription', authenticateToken, requireTenant, (req, res) => {
    db.get('SELECT * FROM subscriptions WHERE tenant_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1', [req.user.id], (err, sub) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(sub || { plan: 'free', status: 'active' });
    });
});

router.post('/upgrade', authenticateToken, requireTenant, (req, res) => {
    const { plan, billing_cycle } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Plan sax ma aha!' });
    const price = billing_cycle === 'yearly' ? PLANS[plan].price * 10 : PLANS[plan].price;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (billing_cycle === 'yearly' ? 12 : 1));
    db.run('INSERT INTO subscriptions (tenant_id, plan, amount, billing_cycle, status, expires_at) VALUES (?, ?, ?, ?, "active", ?)', [req.user.id, plan, price, billing_cycle || 'monthly', expiresAt.toISOString()],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.run('UPDATE tenants SET plan = ?, plan_expires_at = ? WHERE id = ?', [plan, expiresAt.toISOString(), req.user.id]);
            const invNum = generateInvoiceNumber();
            db.run('INSERT INTO invoices (tenant_id, subscription_id, invoice_number, amount, total, status, due_date) VALUES (?, ?, ?, ?, ?, "pending", ?)', [req.user.id, this.lastID, invNum, price, price, expiresAt.toISOString()]);
            res.json({ message: '✅ Plan waa la cusboonaysiiyay!', plan, expires_at: expiresAt, invoice_number: invNum });
        });
});

router.get('/invoices', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT * FROM invoices WHERE tenant_id = ? ORDER BY created_at DESC', [req.user.id], (err, invoices) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(invoices);
    });
});

module.exports = router;
