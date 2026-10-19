// ============================================================
// REPORTS ROUTES - PDF & Excel Export
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');
const { generateInvoicePDF, generateExcelReport } = require('../utils/reports');

// Sales Report (Excel)
router.get('/sales/excel', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT * FROM sales WHERE tenant_id = ? ORDER BY created_at DESC', [req.user.id], async (err, sales) => {
        if (err) return res.status(500).json({ error: err.message });
        await generateExcelReport(sales, 'sales', res);
    });
});

// Products Report (Excel)
router.get('/products/excel', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT * FROM products WHERE tenant_id = ? ORDER BY created_at DESC', [req.user.id], async (err, products) => {
        if (err) return res.status(500).json({ error: err.message });
        await generateExcelReport(products, 'products', res);
    });
});

// Sales Report (PDF)
router.get('/sales/pdf', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT * FROM sales WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 100', [req.user.id], (err, sales) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const total = sales.reduce((sum, s) => sum + s.total, 0);
        generateInvoicePDF({
            invoice_number: 'SALES-' + Date.now(),
            business_name: req.user.business_name,
            customer_name: 'Sales Report',
            items: sales.map(s => ({ name: s.product_name, quantity: s.quantity, price: s.price, total: s.total })),
            total
        }, res);
    });
});

module.exports = router;
