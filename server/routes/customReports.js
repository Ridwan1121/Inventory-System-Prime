// ============================================================
// CUSTOM REPORTS BUILDER
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');

// ============================================
// CREATE CUSTOM REPORT
// ============================================
router.post('/build', authenticateToken, requireTenant, (req, res) => {
    const { name, type, filters, columns, date_range } = req.body;
    
    if (!name || !type) {
        return res.status(400).json({ error: 'Fadlan geli magaca iyo nooca report-ka!' });
    }
    
    // Save report template
    db.run(`INSERT INTO custom_reports (tenant_id, name, type, filters, columns, date_range) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [req.user.id, name, type, JSON.stringify(filters || {}), JSON.stringify(columns || []), date_range || ''],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: '✅ Report template waa la kaydiyay!', id: this.lastID });
        });
});

// ============================================
// GET ALL CUSTOM REPORTS
// ============================================
router.get('/', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT * FROM custom_reports WHERE tenant_id = ? ORDER BY created_at DESC',
        [req.user.id], (err, reports) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(reports || []);
        });
});

// ============================================
// RUN CUSTOM REPORT
// ============================================
router.post('/:id/run', authenticateToken, requireTenant, (req, res) => {
    db.get('SELECT * FROM custom_reports WHERE id = ? AND tenant_id = ?',
        [req.params.id, req.user.id], (err, report) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!report) return res.status(404).json({ error: 'Report lama helin!' });
            
            // Build query based on type
            let query = '';
            const params = [req.user.id];
            
            switch (report.type) {
                case 'sales':
                    query = 'SELECT * FROM sales WHERE tenant_id = ?';
                    break;
                case 'products':
                    query = 'SELECT * FROM products WHERE tenant_id = ?';
                    break;
                case 'customers':
                    query = 'SELECT * FROM customers WHERE tenant_id = ?';
                    break;
                default:
                    return res.status(400).json({ error: 'Nooca report-ka sax ma aha!' });
            }
            
            // Apply date range
            if (report.date_range) {
                const range = JSON.parse(report.date_range);
                if (range.start && range.end) {
                    query += ' AND created_at BETWEEN ? AND ?';
                    params.push(range.start, range.end);
                }
            }
            
            db.all(query, params, (err, data) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                    report: report.name,
                    type: report.type,
                    data: data || [],
                    count: data?.length || 0
                });
            });
        });
});

// ============================================
// DELETE CUSTOM REPORT
// ============================================
router.delete('/:id', authenticateToken, requireTenant, (req, res) => {
    db.run('DELETE FROM custom_reports WHERE id = ? AND tenant_id = ?',
        [req.params.id, req.user.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Report lama helin!' });
            res.json({ message: '✅ Report waa la tirtiray!' });
        });
});

module.exports = router;
