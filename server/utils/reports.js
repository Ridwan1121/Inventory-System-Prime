// ============================================================
// REPORTS GENERATOR - PDF & Excel
// ============================================================

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Generate PDF Invoice
function generateInvoicePDF(data, res) {
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${data.invoice_number}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('INVOICE', { align: 'right' });
    doc.fontSize(10).text(`#${data.invoice_number}`, { align: 'right' });
    doc.moveDown();
    
    doc.fontSize(14).text(data.business_name || 'Business Name');
    doc.fontSize(10).text(data.address || '');
    doc.fontSize(10).text(data.phone || '');
    doc.moveDown();
    
    doc.fontSize(12).text('Bill To:');
    doc.fontSize(10).text(data.customer_name || 'Customer');
    doc.moveDown();
    
    // Table
    doc.fontSize(10).text('Description', 50, 250);
    doc.text('Qty', 300, 250);
    doc.text('Price', 350, 250);
    doc.text('Total', 450, 250);
    
    let y = 280;
    data.items.forEach(item => {
        doc.text(item.name, 50, y);
        doc.text(item.quantity.toString(), 300, y);
        doc.text(`$${item.price.toFixed(2)}`, 350, y);
        doc.text(`$${item.total.toFixed(2)}`, 450, y);
        y += 20;
    });
    
    doc.moveDown();
    doc.fontSize(12).text(`Total: $${data.total.toFixed(2)}`, { align: 'right' });
    
    doc.end();
}

// Generate Excel Report
async function generateExcelReport(data, type, res) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type || 'Report');
    
    if (type === 'sales') {
        worksheet.columns = [
            { header: 'Invoice #', key: 'invoice_number', width: 20 },
            { header: 'Customer', key: 'customer_name', width: 25 },
            { header: 'Product', key: 'product_name', width: 30 },
            { header: 'Quantity', key: 'quantity', width: 12 },
            { header: 'Price', key: 'price', width: 12 },
            { header: 'Total', key: 'total', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Date', key: 'created_at', width: 20 }
        ];
        worksheet.addRows(data);
    } else if (type === 'products') {
        worksheet.columns = [
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Price', key: 'price', width: 12 },
            { header: 'Quantity', key: 'quantity', width: 12 },
            { header: 'SKU', key: 'sku', width: 15 }
        ];
        worksheet.addRows(data);
    }
    
    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
}

module.exports = { generateInvoicePDF, generateExcelReport };
