const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');

router.get('/', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT * FROM warehouses WHERE tenant_id = ? ORDER BY created_at DESC', [req.user.id], (err, warehouses) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(warehouses);
    });
});

router.post('/', authenticateToken, requireTenant, (req, res) => {
    const { name, address, city, country } = req.body;
    if (!name) return res.status(400).json({ error: 'Fadlan geli magaca warehouse-ka!' });
    db.run('INSERT INTO warehouses (tenant_id, name, address, city, country) VALUES (?, ?, ?, ?, ?)', [req.user.id, name, address || '', city || '', country || ''],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: '✅ Warehouse waa la abuuray!', id: this.lastID });
        });
});

router.post('/transfer', authenticateToken, requireTenant, (req, res) => {
    const { product_id, from_warehouse, to_warehouse, quantity } = req.body;
    if (!product_id || !from_warehouse || !to_warehouse || !quantity) return res.status(400).json({ error: 'Fadlan buuxi dhammaan meelaha!' });
    db.run('UPDATE warehouse_stock SET quantity = quantity - ? WHERE product_id = ? AND warehouse_id = ?', [quantity, product_id, from_warehouse]);
    db.run('INSERT INTO warehouse_stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?) ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = quantity + ?', [product_id, to_warehouse, quantity, quantity]);
    res.json({ message: '✅ Stock waa la transfer-gareeyay!' });
});

module.exports = router;
