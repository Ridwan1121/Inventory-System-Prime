// ============================================================
// INVENTORY SYSTEM PRIME - MAIN SERVER
// ============================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 5001;

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// RATE LIMITING
// ============================================
const { apiLimiter, loginLimiter } = require('./middleware/rateLimit');

app.use('/api/', apiLimiter);
app.use('/api/tenant/login', loginLimiter);

// ============================================
// STATIC FILES
// ============================================
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, '..', 'client')));

// ============================================
// DATABASE
// ============================================
const db = require('./models/database');

// ============================================
// LOGGER
// ============================================
let logger;
try {
    logger = require('./utils/logger');
    console.log('✅ Logger loaded');
} catch (e) {
    console.log('⚠️ Logger not loaded:', e.message);
}

// ============================================
// ROUTES
// ============================================
try {
    app.use('/api/owner', require('./routes/owner'));
    app.use('/api/tenant', require('./routes/tenant'));
    app.use('/api/schedule', require('./routes/schedule'));
    app.use('/api/billing', require('./routes/billing'));
    app.use('/api/reports', require('./routes/reports'));
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/products', require('./routes/products'));
    app.use('/api/sales', require('./routes/sales'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/customer', require('./routes/customer'));
    app.use('/api/ai', require('./routes/ai'));
    app.use('/api/2fa', require('./routes/twofa'));
    app.use('/api/warehouse', require('./routes/warehouse'));
    app.use('/api/custom-reports', require('./routes/customReports'));
    app.use('/api/keys', require('./routes/apiKeys'));
    app.use('/api/payment', require('./routes/payment'));
    console.log('✅ All routes loaded successfully');
} catch (e) {
    console.error('❌ Route loading error:', e.message);
}

// ============================================
// PAGES
// ============================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '..', 'dashboard.html')));
app.get('/owner', (req, res) => res.sendFile(path.join(__dirname, '..', 'owner.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, '..', 'signup.html')));
app.get('/pricing', (req, res) => res.sendFile(path.join(__dirname, '..', 'pricing.html')));
app.get('/payment', (req, res) => res.sendFile(path.join(__dirname, '..', 'payment.html')));

// ============================================
// API INFO
// ============================================
app.get('/api', (req, res) => {
    res.json({
        name: '🏢 Inventory System Prime',
        version: '4.0.0',
        status: 'Running',
        features: [
            'Multi-Tenant Architecture',
            'Owner Full Control',
            'Auto-Connect Scheduling',
            'Billing & Subscriptions',
            'PDF/Excel Reports',
            'Multi-Language (SO/EN/AR)',
            'AI Assistant',
            'Password Reset',
            'Email Verification',
            '2FA',
            'Multi-Warehouse',
            'Custom Reports',
            'Third-Party API',
            'Payment Gateway',
            'PWA Support'
        ],
        endpoints: {
            owner: '/api/owner',
            tenant: '/api/tenant',
            schedule: '/api/schedule',
            billing: '/api/billing',
            reports: '/api/reports',
            auth: '/api/auth',
            products: '/api/products',
            sales: '/api/sales',
            admin: '/api/admin',
            customer: '/api/customer',
            ai: '/api/ai',
            '2fa': '/api/2fa',
            warehouse: '/api/warehouse',
            'custom-reports': '/api/custom-reports',
            keys: '/api/keys',
            payment: '/api/payment'
        }
    });
});

// ============================================
// SOCKET.IO
// ============================================
io.on('connection', (socket) => {
    socket.on('register_tenant', (data) => {
        socket.join(`tenant_${data.tenantId}`);
    });
    socket.on('register_owner', () => {
        socket.join('owner_room');
    });
    socket.on('disconnect', () => {});
});

// ============================================
// SCHEDULER
// ============================================
try {
    const { startScheduler } = require('./utils/scheduler');
    startScheduler(io);
    console.log('✅ Scheduler loaded');
} catch (e) {
    console.log('⚠️ Scheduler not loaded:', e.message);
}

// ============================================
// BACKUP
// ============================================
try {
    const { createBackup } = require('./utils/backup');
    console.log('✅ Backup scheduler loaded');
} catch (e) {
    console.log('⚠️ Backup not loaded:', e.message);
}

// ============================================
// CRON JOBS
// ============================================
cron.schedule('0 * * * *', () => {
    try { db.run('UPDATE sessions SET is_active=0 WHERE expires_at < CURRENT_TIMESTAMP'); } catch(e) {}
});

cron.schedule('0 9 * * *', () => {
    try {
        db.all('SELECT * FROM tenants WHERE plan_expires_at < CURRENT_TIMESTAMP AND status = "active"', (err, tenants) => {
            if (tenants?.length) {
                tenants.forEach(t => {
                    db.run('UPDATE tenants SET status = "expired" WHERE id = ?', [t.id]);
                });
            }
        });
    } catch(e) {}
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    if (logger) logger.error(err.message, { stack: err.stack });
    res.status(err.status || 500).json({ error: err.message || 'Server Error' });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ============================================
// START
// ============================================
server.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('🏢 INVENTORY SYSTEM PRIME v4.0');
    console.log('═══════════════════════════════════════════════');
    console.log(`🚀 Server:     http://localhost:${PORT}`);
    console.log(`🌐 Domain:     ${process.env.MAIN_DOMAIN || 'localhost'}`);
    console.log(`📊 API:        http://localhost:${PORT}/api`);
    console.log(`👑 Owner:      http://localhost:${PORT}/owner`);
    console.log(`📊 Dashboard:  http://localhost:${PORT}/dashboard`);
    console.log(`💰 Pricing:    http://localhost:${PORT}/pricing`);
    console.log('───────────────────────────────────────────────');
    console.log('👑 OWNER LOGIN:');
    console.log(`   📧 ${process.env.OWNER_EMAIL || 'akiidonly12@gmail.com'}`);
    console.log(`   🔑 ${process.env.OWNER_PASSWORD || 'Akiid12345'}`);
    console.log('───────────────────────────────────────────────');
    console.log('✨ Features:');
    console.log('   ✅ Multi-Tenant');
    console.log('   ✅ Auto-Connect Scheduling');
    console.log('   ✅ Billing & Subscriptions');
    console.log('   ✅ PDF/Excel Reports');
    console.log('   ✅ Multi-Language');
    console.log('   ✅ AI Assistant');
    console.log('   ✅ Password Reset');
    console.log('   ✅ Email Verification');
    console.log('   ✅ 2FA');
    console.log('   ✅ Multi-Warehouse');
    console.log('   ✅ Custom Reports');
    console.log('   ✅ Third-Party API');
    console.log('   ✅ Payment Gateway');
    console.log('   ✅ PWA Support');
    console.log('═══════════════════════════════════════════════');
    console.log('');
});
