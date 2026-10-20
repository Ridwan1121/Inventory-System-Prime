const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');

router.post('/build', authenticateToken, requireTenant, (req, res) => {
    const { name, type, filters, columns, date_range } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Fadlan geli magaca iyo nooca report-ka!' });
    db.run('INSERT INTO custom_reports (tenant_id, name, type, filters, columns, date_range) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, name, type, JSON.stringify(filters || {}), JSON.stringify(columns || []), date_range || ''],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: '✅ Report template waa la kaydiyay!', id: this.lastID });
        });
});

router.get('/', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT * FROM custom_reports WHERE tenant_id = ? ORDER BY created_at DESC', [req.user.id], (err, reports) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(reports);
    });
});

module.exports = router;
