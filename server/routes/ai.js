const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');
const logger = require('../utils/logger');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

router.post('/chat', authenticateToken, requireTenant, async (req, res) => {
    const { message, language } = req.body;
    const requestedLanguage = language || req.user.language || 'so';
    const lang = requestedLanguage === 'so' ? 'so' : 'en';
    if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Fadlan geli farriin!' });
    }
    const userMessage = message.trim();
    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key') {
        try {
            const products = await new Promise((resolve, reject) => { db.all('SELECT name, quantity, price FROM products WHERE tenant_id = ? LIMIT 10', [req.user.id], (err, rows) => err ? reject(err) : resolve(rows || [])); });
            const sales = await new Promise((resolve, reject) => { db.all('SELECT SUM(total) as total FROM sales WHERE tenant_id = ?', [req.user.id], (err, rows) => err ? reject(err) : resolve(rows?.[0]?.total || 0)); });
            const systemPrompt = `You are an AI Assistant for Prime Inventory System. Business info: ${products.length} products, $${sales} sales. Respond in ${lang === 'so' ? 'Somali' : 'English'}.`;
            const response = await axios.post(OPENAI_URL, { model: 'gpt-3.5-turbo', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }], max_tokens: 500, temperature: 0.7 }, { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } });
            const aiResponse = response.data.choices[0].message.content;
            db.run('INSERT INTO ai_conversations (user_id, user_message, ai_response, language) VALUES (?, ?, ?, ?)', [req.user.id, message, aiResponse, lang]);
            return res.json({ message: aiResponse, language: lang, source: 'openai' });
        } catch (error) {
            logger.warn('OpenAI chat request failed; using rule-based response.', {
                status: error.response?.status,
                message: error.message
            });
        }
    }
    const responses = {
        so: { greeting: 'Salaan! Sidee ayaan ku caawin karaa maanta?', inventory: 'Alaabtaada waxaad ka arki kartaa "Stock Management".', sales: 'Iibka waxaad ka arki kartaa "Invoicing & GST".', help: 'Waxaan ku caawin karaa: 1) Alaabta, 2) Iibka, 3) Stats-ka.', whatsapp: 'WhatsApp: +252 63 400 8040', default: 'Waan ku fahmay. Waxaad i weydiin kartaa wax ku saabsan alaabta, iibka, ama stats-ka.' },
        en: { greeting: 'Hello! How can I help you today?', inventory: 'See your products in "Stock Management".', sales: 'See your sales in "Invoicing & GST".', help: 'I can help with: 1) Products, 2) Sales, 3) Stats.', whatsapp: 'WhatsApp: +252 63 400 8040', default: 'I understand. Ask me about products, sales, or stats.' }
    };
    const msg = userMessage.toLowerCase();
    const r = responses[lang] || responses.en;
    let response = r.default;
    if (msg.includes('salaan') || msg.includes('hello')) response = r.greeting;
    else if (msg.includes('alaab') || msg.includes('product')) response = r.inventory;
    else if (msg.includes('iib') || msg.includes('sale')) response = r.sales;
    else if (msg.includes('whatsapp') || msg.includes('xiriir')) response = r.whatsapp;
    else if (msg.includes('caawi') || msg.includes('help')) response = r.help;
    db.run('INSERT INTO ai_conversations (user_id, user_message, ai_response, language) VALUES (?, ?, ?, ?)', [req.user.id, userMessage, response, lang]);
    res.json({ message: response, language: lang, source: 'rule-based' });
});

router.get('/history', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id], (err, convos) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(convos || []);
    });
});

module.exports = router;
