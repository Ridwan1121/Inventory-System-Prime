// ============================================================
// ADMIN ROUTES - Mulkiilaha Nidaamka
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ============================================
// ADMIN LOGIN
// ============================================
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Fadlan geli email iyo password!' });
    }

    db.get('SELECT * FROM owners WHERE email = ?', [email.toLowerCase()], async (err, admin) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!admin) {
            return res.status(400).json({ error: 'Email ama Password waa khalad!' });
        }

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) {
            return res.status(400).json({ error: 'Email ama Password waa khalad!' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email, name: admin.name, userType: 'owner', isAdmin: true, isMainOwner: admin.is_main_owner === 1 },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: '✅ Admin soo galid waa guul!',
            token,
            admin: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' }
        });
    });
});

// ============================================
// GET ALL USERS (TENANTS)
// ============================================
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT id, name, business_name as business, email, phone_international as phone, language, plan, status, last_seen, created_at FROM tenants ORDER BY created_at DESC',
        [], (err, users) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(users || []);
        });
});

// ============================================
// GET ALL PRODUCTS
// ============================================
router.get('/products', authenticateToken, requireAdmin, (req, res) => {
    db.all(`SELECT p.*, t.name as user_name, t.business_name as user_business 
            FROM products p LEFT JOIN tenants t ON p.tenant_id = t.id 
            ORDER BY p.created_at DESC`, [], (err, products) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(products || []);
        });
});

// ============================================
// GET ALL SALES
// ============================================
router.get('/sales', authenticateToken, requireAdmin, (req, res) => {
    db.all(`SELECT s.*, t.name as user_name, t.business_name as user_business 
            FROM sales s LEFT JOIN tenants t ON s.tenant_id = t.id 
            ORDER BY s.created_at DESC`, [], (err, sales) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(sales || []);
        });
});

// ============================================
// GET STATS
// ============================================
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
    const stats = {};
    
    db.get('SELECT COUNT(*) as total FROM tenants', [], (err, r1) => {
        stats.totalUsers = r1?.total || 0;
        
        db.get('SELECT COUNT(*) as total FROM products', [], (err, r2) => {
            stats.totalProducts = r2?.total || 0;
            
            db.get('SELECT COUNT(*) as total FROM sales', [], (err, r3) => {
                stats.totalSales = r3?.total || 0;
                
                db.get('SELECT COALESCE(SUM(total), 0) as total FROM sales', [], (err, r4) => {
                    stats.totalRevenue = r4?.total || 0;
                    
                    db.get('SELECT COUNT(*) as total FROM messages WHERE is_read = 0', [], (err, r5) => {
                        stats.unreadMessages = r5?.total || 0;
                        res.json(stats);
                    });
                });
            });
        });
    });
});

// ============================================
// GET MESSAGES
// ============================================
router.get('/messages', authenticateToken, requireAdmin, (req, res) => {
    db.all(`SELECT m.*, t.name as user_name, t.email as user_email, t.business_name as user_business 
            FROM messages m 
            LEFT JOIN tenants t ON (m.sender_type='user' AND m.sender_id=t.id)
            ORDER BY m.created_at DESC LIMIT 100`,
        [], (err, messages) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(messages || []);
        });
});

// ============================================
// GET AUDIT LOGS
// ============================================
router.get('/audit-logs', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200', [], (err, logs) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(logs || []);
    });
});

module.exports = router;
