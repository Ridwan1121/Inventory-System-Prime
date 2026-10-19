// ============================================================
// AI ASSISTANT ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

// AI Chat
router.post('/chat', authenticateToken, (req, res) => {
    const { message, language } = req.body;
    const lang = language || req.user.language || 'so';

    if (!message) return res.status(400).json({ error: 'Fadlan geli farriin!' });

    // Simple rule-based AI (haddii aad rabto OpenAI, ku dar API key)
    const response = generateAIResponse(message, lang, req.user);

    db.run(`INSERT INTO ai_conversations (user_id, user_message, ai_response, language) VALUES (?, ?, ?, ?)`,
        [req.user.id, message, response, lang]);

    res.json({
        message: response,
        language: lang,
        timestamp: new Date().toISOString()
    });
});

// Get conversation history
router.get('/history', authenticateToken, (req, res) => {
    db.all('SELECT * FROM ai_conversations WHERE user_id=? ORDER BY created_at DESC LIMIT 50',
        [req.user.id], (err, convos) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(convos);
        });
});

// Simple AI Response Generator
function generateAIResponse(message, lang, user) {
    const msg = message.toLowerCase();
    
    const responses = {
        so: {
            greeting: `Salaan ${user.name}! Sidee ayaan ku caawin karaa maanta?`,
            inventory: 'Alaabtaada waxaad ka arki kartaa qaybta "Alaabta". Waxaad ku dari kartaa alaab cusub adigoo dhagsanaya "Ku Dar Alaab".',
            sales: 'Iibka waxaad ka arki kartaa qaybta "Iibka". Waxaad iibin kartaa alaabtaada adigoo dhagsanaya badhanka "Iibi".',
            help: 'Waxaan ku caawin karaa: 1) Alaabta, 2) Iibka, 3) Stats-ka, 4) WhatsApp. Maxaad rabtaa?',
            whatsapp: 'Waxaad nagala soo xiriiri kartaa WhatsApp: +252 63 400 8040',
            stats: 'Stats-kaaga waxaad ka arki kartaa dashboard-ka.',
            default: 'Waan ku fahmay. Waxaad i weydiin kartaa wax ku saabsan alaabta, iibka, ama stats-ka.'
        },
        en: {
            greeting: `Hello ${user.name}! How can I help you today?`,
            inventory: 'You can see your products in the "Products" section. You can add new products by clicking "Add Product".',
            sales: 'You can see your sales in the "Sales" section. You can sell products by clicking the "Sell" button.',
            help: 'I can help with: 1) Products, 2) Sales, 3) Stats, 4) WhatsApp. What do you need?',
            whatsapp: 'You can contact us on WhatsApp: +252 63 400 8040',
            stats: 'You can see your stats on the dashboard.',
            default: 'I understand. You can ask me about products, sales, or stats.'
        }
    };

    const r = responses[lang];
    
    if (msg.includes('salaan') || msg.includes('hello') || msg.includes('hi')) return r.greeting;
    if (msg.includes('alaab') || msg.includes('product') || msg.includes('inventory')) return r.inventory;
    if (msg.includes('iib') || msg.includes('sale') || msg.includes('sell')) return r.sales;
    if (msg.includes('whatsapp') || msg.includes('xiriir') || msg.includes('contact')) return r.whatsapp;
    if (msg.includes('stats') || msg.includes('statistics')) return r.stats;
    if (msg.includes('caawi') || msg.includes('help')) return r.help;
    
    return r.default;
}

module.exports = router;
