// ============================================================
// ENTERPRISE SaaS PLATFORM - MAIN SERVER
// ============================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

// Static
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, '..', 'client')));

// Database
const db = require('./models/database');

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
    console.log('✅ All routes loaded successfully');
} catch (e) {
    console.error('❌ Route loading error:', e.message);
    console.error(e.stack);
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
        name: '🏢 Enterprise SaaS Platform',
        version: '3.0.0',
        status: 'Running',
        features: [
            'Multi-Tenant Architecture',
            'Owner Full Control',
            'Auto-Connect Scheduling',
            'Billing & Subscriptions',
            'PDF/Excel Reports',
            'Multi-Language (SO/EN/AR)',
            '24/7 Auto Connection',
            'AI Assistant',
            'Audit Logs',
            'Custom Domains'
        ],
        endpoints: {
            owner: '/api/owner',
            tenant: '/api/tenant',
            schedule: '/api/schedule',
            billing: '/api/billing',
            reports: '/api/reports'
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
} catch (e) {
    console.log('⚠️ Scheduler not loaded:', e.message);
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
    res.status(err.status || 500).json({ error: err.message || 'Server Error' });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ============================================
// START
// ============================================
server.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('🏢 ENTERPRISE SaaS PLATFORM v3.0');
    console.log('═══════════════════════════════════════════════');
    console.log(`🚀 Server:     http://localhost:${PORT}`);
    console.log(`🌐 Domain:     ${process.env.MAIN_DOMAIN || 'localhost'}`);
    console.log(`📊 API:        http://localhost:${PORT}/api`);
    console.log(`👑 Owner:      http://localhost:${PORT}/owner`);
    console.log(`📊 Dashboard:  http://localhost:${PORT}/dashboard`);
    console.log(`💰 Pricing:    http://localhost:${PORT}/pricing`);
    console.log('───────────────────────────────────────────────');
    console.log('👑 OWNER LOGIN:');
    console.log(`   📧 ${process.env.OWNER_EMAIL}`);
    console.log(`   🔑 ${process.env.OWNER_PASSWORD}`);
    console.log('───────────────────────────────────────────────');
    console.log('✨ Features:');
    console.log('   ✅ Multi-Tenant');
    console.log('   ✅ Auto-Connect Scheduling');
    console.log('   ✅ Billing & Subscriptions');
    console.log('   ✅ PDF/Excel Reports');
    console.log('   ✅ Multi-Language');
    console.log('   ✅ AI Assistant');
    console.log('═══════════════════════════════════════════════');
    console.log('');
});
