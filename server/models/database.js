// ============================================================
// DATABASE - PostgreSQL (Production)
// ============================================================

// Haddii DATABASE_URL uu jiro, isticmaal PostgreSQL
// Haddii kale, isticmaal SQLite (development)

const path = require('path');

let db;
let isPostgres = false;

if (process.env.DATABASE_URL) {
    // PostgreSQL
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    db = {
        run: (sql, params, cb) => {
            pool.query(sql, params, (err, result) => {
                if (cb) cb(err, result);
            });
        },
        get: (sql, params, cb) => {
            pool.query(sql, params, (err, result) => {
                if (cb) cb(err, result.rows[0]);
            });
        },
        all: (sql, params, cb) => {
            pool.query(sql, params, (err, result) => {
                if (cb) cb(err, result.rows);
            });
        },
        serialize: (fn) => fn()
    };
    
    isPostgres = true;
    console.log('✅ PostgreSQL connected');
} else {
    // SQLite (fallback)
    const sqlite3 = require('sqlite3').verbose();
    const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');
    
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) console.error('❌ Database error:', err.message);
        else console.log('✅ SQLite connected:', DB_PATH);
    });
    
    isPostgres = false;
}

const bcrypt = require('bcryptjs');

// ============================================
// INIT DATABASE
// ============================================
async function initDatabase() {
    try {
        // For PostgreSQL, use SERIAL instead of AUTOINCREMENT
        const idType = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
        const timestampType = isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
        
        // Users table
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS tenants (
                id ${idType},
                owner_id INTEGER,
                name TEXT NOT NULL,
                business_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT NOT NULL,
                phone_country TEXT,
                phone_international TEXT,
                password TEXT NOT NULL,
                language TEXT DEFAULT 'so',
                country TEXT,
                city TEXT,
                address TEXT,
                tax_id TEXT,
                domain TEXT UNIQUE,
                subdomain TEXT UNIQUE,
                plan TEXT DEFAULT 'free',
                plan_expires_at ${timestampType},
                status TEXT DEFAULT 'active',
                is_verified INTEGER DEFAULT 0,
                last_seen ${timestampType},
                created_at ${timestampType}
            )`, [], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Products table
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id ${idType},
                tenant_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                category TEXT,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                sku TEXT,
                min_stock INTEGER DEFAULT 10,
                created_at ${timestampType}
            )`, [], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        
        // ============================================
        // NEW TABLES (Qaybta 4)
        // ============================================
        
        // Warehouses
        db.run(`CREATE TABLE IF NOT EXISTS warehouses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tenant_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            address TEXT,
            city TEXT,
            country TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Warehouse Stock
        db.run(`CREATE TABLE IF NOT EXISTS warehouse_stock (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            warehouse_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 0,
            UNIQUE(product_id, warehouse_id)
        )`);
        
        // Custom Reports
        db.run(`CREATE TABLE IF NOT EXISTS custom_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tenant_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            filters TEXT,
            columns TEXT,
            date_range TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // API Keys
        db.run(`CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tenant_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            api_key TEXT UNIQUE NOT NULL,
            api_secret TEXT NOT NULL,
            permissions TEXT,
            status TEXT DEFAULT 'active',
            last_used DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Add 2FA columns to tenants
        
        
        // Add currency column to tenants
        
        console.log('✅ Database tables ready');
        
        // Create default owner
        const ownerEmail = process.env.OWNER_EMAIL || 'akiidonly12@gmail.com';
        const ownerPassword = process.env.OWNER_PASSWORD || 'Akiid12345';
        
        db.get('SELECT * FROM owners WHERE email = ?', [ownerEmail], async (err, owner) => {
            if (err) {
                console.error('❌ Owner check error:', err.message);
                return;
            }
            
            if (!owner) {
                const hash = await bcrypt.hash(ownerPassword, 10);
                db.run(`INSERT INTO owners (name, email, password, phone, country, is_main_owner) 
                        VALUES (?, ?, ?, ?, ?, 1)`,
                    ['System Owner', ownerEmail, hash, '+252634008040', 'Somaliland'],
                    (err) => {
                        if (!err) {
                            console.log('👑 Main owner created:', ownerEmail);
                        }
                    });
            }
        });
        
    } catch (error) {
        console.error('❌ Database init error:', error.message);
    }
}

initDatabase();

module.exports = db;
module.exports.isPostgres = isPostgres;



