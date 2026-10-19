// ============================================================
// SALES ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
    db.all('SELECT * FROM sales WHERE user_id=? ORDER BY created_at DESC', [req.user.id], (err, sales) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(sales);
    });
});

router.post('/', authenticateToken, (req, res) => {
    const { product_id, quantity, customer_name, customer_phone } = req.body;
    if (!product_id || !quantity) return res.status(400).json({ error: 'Fadlan geli product_id iyo quantity!' });

    db.get('SELECT * FROM products WHERE id=? AND user_id=?', [product_id, req.user.id], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ error: 'Alaabta lama helin!' });
        if (product.quantity < quantity) return res.status(400).json({ error: 'Tirada ku filan ma jirto!' });

        const total = product.price * quantity;
        db.run(`INSERT INTO sales (user_id, product_id, product_name, quantity, price, total, customer_name, customer_phone) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, product_id, product.name, quantity, product.price, total, customer_name || '', customer_phone || ''],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                db.run('UPDATE products SET quantity = quantity - ? WHERE id = ?', [quantity, product_id]);
                res.status(201).json({
                    message: '✅ Iibka waa la sameeyay!',
                    sale: { id: this.lastID, product_name: product.name, quantity, total }
                });
            });
    });
});

module.exports = router;
