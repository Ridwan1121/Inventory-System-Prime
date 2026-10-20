const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');

const PLANS = { free: 0, starter: 9.99, professional: 29.99, enterprise: 99.99, ultimate: 299.99 };

router.post('/confirm', authenticateToken, requireTenant, (req, res) => {
    const { plan, billing_cycle, payment_method, transaction_id } = req.body;
    if (!plan || !payment_method) return res.status(400).json({ error: 'Fadlan buuxi dhammaan meelaha!' });
    let amount = PLANS[plan] || 0;
    if (billing_cycle === 'yearly') amount = amount * 10;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (billing_cycle === 'yearly' ? 12 : 1));
    db.run('INSERT INTO subscriptions (tenant_id, plan, amount, billing_cycle, status, expires_at, payment_method, transaction_id) VALUES (?, ?, ?, ?, "active", ?, ?, ?)',
        [req.user.id, plan, amount, billing_cycle || 'monthly', expiresAt.toISOString(), payment_method, transaction_id || ''],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.run('UPDATE tenants SET plan = ?, plan_expires_at = ? WHERE id = ?', [plan, expiresAt.toISOString(), req.user.id]);
            const invNum = `INV-${Date.now()}`;
            db.run('INSERT INTO invoices (tenant_id, subscription_id, invoice_number, amount, total, status, due_date) VALUES (?, ?, ?, ?, ?, "paid", ?)', [req.user.id, this.lastID, invNum, amount, amount, new Date().toISOString()]);
            res.json({ message: '✅ Lacag-bixinta waa la aqbalay!', invoice_number: invNum, expires_at: expiresAt });
        });
});

router.post('/zaad', authenticateToken, requireTenant, (req, res) => {
    const { amount, phone } = req.body;
    if (!amount || !phone) return res.status(400).json({ error: 'Fadlan geli amount iyo phone!' });
    res.json({ message: '📱 Zaad payment initiated', instructions: `Fadlan u dir $${amount} lambarka 0634008040 (Zaad).`, reference: `ZAAD-${Date.now()}` });
});

router.post('/edahab', authenticateToken, requireTenant, (req, res) => {
    const { amount, phone } = req.body;
    if (!amount || !phone) return res.status(400).json({ error: 'Fadlan geli amount iyo phone!' });
    res.json({ message: '📱 Edahab payment initiated', instructions: `Fadlan u dir $${amount} lambarka 0654008040 (Edahab).`, reference: `EDAHAB-${Date.now()}` });
});

module.exports = router;
