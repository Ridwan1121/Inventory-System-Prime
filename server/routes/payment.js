// ============================================================
// PAYMENT GATEWAY - Stripe + Zaad/Edahab
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');

// Stripe (optional)
let stripe;
try {
    if (process.env.STRIPE_SECRET_KEY) {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    }
} catch (e) {}

// ============================================
// CREATE PAYMENT INTENT (Stripe)
// ============================================
router.post('/create-intent', authenticateToken, requireTenant, async (req, res) => {
    const { plan, billing_cycle } = req.body;
    
    if (!stripe) {
        return res.status(400).json({ error: 'Stripe ma jiro. Isticmaal Zaad/Edahab.' });
    }
    
    const PLANS = {
        starter: 9.99,
        professional: 29.99,
        enterprise: 99.99,
        ultimate: 299.99
    };
    
    let amount = PLANS[plan] || 0;
    if (billing_cycle === 'yearly') amount = amount * 10;
    amount = Math.round(amount * 100); // cents
    
    try {
        const intent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            metadata: {
                tenant_id: req.user.id,
                plan,
                billing_cycle
            }
        });
        
        res.json({ clientSecret: intent.client_secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// CONFIRM PAYMENT
// ============================================
router.post('/confirm', authenticateToken, requireTenant, (req, res) => {
    const { plan, billing_cycle, payment_method, transaction_id } = req.body;
    
    if (!plan || !payment_method) {
        return res.status(400).json({ error: 'Fadlan buuxi dhammaan meelaha!' });
    }
    
    const PLANS = {
        free: 0, starter: 9.99, professional: 29.99, enterprise: 99.99, ultimate: 299.99
    };
    
    let amount = PLANS[plan] || 0;
    if (billing_cycle === 'yearly') amount = amount * 10;
    
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (billing_cycle === 'yearly' ? 12 : 1));
    
    // Create subscription
    db.run(`INSERT INTO subscriptions (tenant_id, plan, amount, billing_cycle, status, expires_at, payment_method, transaction_id) 
            VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`,
        [req.user.id, plan, amount, billing_cycle || 'monthly', expiresAt.toISOString(), payment_method, transaction_id || ''],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Update tenant
            db.run('UPDATE tenants SET plan = ?, plan_expires_at = ? WHERE id = ?',
                [plan, expiresAt.toISOString(), req.user.id]);
            
            // Create invoice
            const invNum = `INV-${Date.now()}`;
            db.run(`INSERT INTO invoices (tenant_id, subscription_id, invoice_number, amount, total, status, due_date) 
                    VALUES (?, ?, ?, ?, ?, 'paid', ?)`,
                [req.user.id, this.lastID, invNum, amount, amount, new Date().toISOString()]);
            
            res.json({
                message: '✅ Lacag-bixinta waa la aqbalay!',
                invoice_number: invNum,
                expires_at: expiresAt
            });
        });
});

// ============================================
// ZAAD PAYMENT
// ============================================
router.post('/zaad', authenticateToken, requireTenant, (req, res) => {
    const { amount, phone } = req.body;
    
    if (!amount || !phone) {
        return res.status(400).json({ error: 'Fadlan geli amount iyo phone!' });
    }
    
    // Zaad API integration (waa in la xidhiidhaa bangi)
    // Tusaale: waa in la isticmaalo Zaad API oo dhab ah
    
    res.json({
        message: '📱 Zaad payment initiated',
        instructions: `Fadlan u dir $${amount} lambarka 0634008040 (Zaad) kadibna xaqiiji.`,
        reference: `ZAAD-${Date.now()}`
    });
});

// ============================================
// EDahab PAYMENT
// ============================================
router.post('/edahab', authenticateToken, requireTenant, (req, res) => {
    const { amount, phone } = req.body;
    
    if (!amount || !phone) {
        return res.status(400).json({ error: 'Fadlan geli amount iyo phone!' });
    }
    
    res.json({
        message: '📱 Edahab payment initiated',
        instructions: `Fadlan u dir $${amount} lambarka 0654008040 (Edahab) kadibna xaqiiji.`,
        reference: `EDAHAB-${Date.now()}`
    });
});

// ============================================
// WEBHOOK (Stripe)
// ============================================
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    if (!stripe) return res.status(400).json({ error: 'Stripe ma jiro' });
    
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle event
    if (event.type === 'payment_intent.succeeded') {
        const intent = event.data.object;
        console.log('✅ Payment succeeded:', intent.id);
    }
    
    res.json({ received: true });
});

module.exports = router;
