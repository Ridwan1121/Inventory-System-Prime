const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Fadlan geli email iyo password!' });
    db.get('SELECT * FROM owners WHERE email = ?', [email.toLowerCase()], async (err, admin) => {
        if (!admin) return res.status(400).json({ error: 'Email ama Password waa khalad!' });
        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) return res.status(400).json({ error: 'Email ama Password waa khalad!' });
        const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name, userType: 'owner', isAdmin: true, isMainOwner: admin.is_main_owner === 1 }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: '✅ Admin soo galid waa guul!', token, admin: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' } });
    });
});

router.get('/users', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT id, name, business_name as business, email, phone_international as phone, language, plan, status, last_seen, created_at FROM tenants ORDER BY created_at DESC', [], (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(users || []);
    });
});

router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
    const stats = {};
    db.get('SELECT COUNT(*) as total FROM tenants', (err, r1) => {
        stats.totalUsers = r1?.total || 0;
        db.get('SELECT COUNT(*) as total FROM products', (err, r2) => {
            stats.totalProducts = r2?.total || 0;
            db.get('SELECT COUNT(*) as total FROM sales', (err, r3) => {
                stats.totalSales = r3?.total || 0;
                db.get('SELECT COALESCE(SUM(total), 0) as total FROM sales', (err, r4) => {
                    stats.totalRevenue = r4?.total || 0;
                    res.json(stats);
                });
            });
        });
    });
});

module.exports = router;
