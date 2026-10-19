// ============================================================
// PRODUCTS ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

// GET ALL
router.get('/', authenticateToken, (req, res) => {
    db.all('SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id], (err, products) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(products);
        });
});

// ADD
router.post('/', authenticateToken, (req, res) => {
    const { name, category, price, quantity, sku, min_stock, description } = req.body;
    if (!name || !price || quantity === undefined) {
        return res.status(400).json({ error: 'Fadlan buuxi magaca, qiimaha, iyo tirada!' });
    }
    db.run(`INSERT INTO products (user_id, name, category, price, quantity, sku, min_stock, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, name, category || 'Other', price, quantity, sku || '', min_stock || 10, description || ''],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: '✅ Alaabta waa la ku daray!', id: this.lastID });
        });
});

// UPDATE
router.put('/:id', authenticateToken, (req, res) => {
    const { name, category, price, quantity, sku, min_stock, description } = req.body;
    db.run(`UPDATE products SET name=?, category=?, price=?, quantity=?, sku=?, min_stock=?, description=? 
            WHERE id=? AND user_id=?`,
        [name, category, price, quantity, sku, min_stock, description, req.params.id, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Alaabta lama helin!' });
            res.json({ message: '✅ Alaabta waa la cusboonaysiiyay!' });
        });
});

// DELETE
router.delete('/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM products WHERE id=? AND user_id=?', [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Alaabta lama helin!' });
        res.json({ message: '✅ Alaabta waa la tirtiray!' });
    });
});

module.exports = router;
