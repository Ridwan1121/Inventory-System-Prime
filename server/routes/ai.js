// ============================================================
// AI CHATBOT - OpenAI Integration
// ============================================================

const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// ============================================
// CHAT WITH AI
// ============================================
router.post('/chat', authenticateToken, requireTenant, async (req, res) => {
    const { message, language } = req.body;
    const lang = language || req.user.language || 'so';
    
    if (!message) {
        return res.status(400).json({ error: 'Fadlan geli farriin!' });
    }
    
    // Haddii OpenAI key uu jiro, isticmaal AI
    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key') {
        try {
            // Get business context
            const tenantId = req.user.id;
            const products = await new Promise((resolve) => {
                db.all('SELECT name, quantity, price FROM products WHERE tenant_id = ? LIMIT 10', [tenantId], (err, rows) => {
                    resolve(rows || []);
                });
            });
            
            const sales = await new Promise((resolve) => {
                db.all('SELECT SUM(total) as total FROM sales WHERE tenant_id = ?', [tenantId], (err, rows) => {
                    resolve(rows?.[0]?.total || 0);
                });
            });
            
            const systemPrompt = lang === 'so' 
                ? `Waxaad tahay AI Assistant oo ka caawiya ganacsiga Prime Inventory System. 
                   Macluumaadka ganacsiga: 
                   - Alaabta: ${products.length} items
                   - Iibka: $${sales}
                   
                   Ku jawaab luqadda Soomaaliga.`
                : `You are an AI Assistant for Prime Inventory System business.
                   Business info:
                   - Products: ${products.length} items
                   - Sales: $${sales}
                   
                   Respond in English.`;
            
            const response = await axios.post(OPENAI_URL, {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                max_tokens: 500,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const aiResponse = response.data.choices[0].message.content;
            
            // Save conversation
            db.run(`INSERT INTO ai_conversations (user_id, user_message, ai_response, language) 
                    VALUES (?, ?, ?, ?)`,
                [tenantId, message, aiResponse, lang]);
            
            return res.json({
                message: aiResponse,
                language: lang,
                source: 'openai'
            });
        } catch (error) {
            console.error('OpenAI error:', error.message);
            // Fallback to rule-based
        }
    }
    
    // Rule-based fallback
    const responses = {
        so: {
            greeting: 'Salaan! Sidee ayaan ku caawin karaa maanta?',
            inventory: 'Alaabtaada waxaad ka arki kartaa qaybta "Stock Management".',
            sales: 'Iibka waxaad ka arki kartaa qaybta "Invoicing & GST".',
            help: 'Waxaan ku caawin karaa: 1) Alaabta, 2) Iibka, 3) Stats-ka, 4) WhatsApp.',
            whatsapp: 'Waxaad nagala soo xiriiri kartaa WhatsApp: +252 63 400 8040',
            default: 'Waan ku fahmay. Waxaad i weydiin kartaa wax ku saabsan alaabta, iibka, ama stats-ka.'
        },
        en: {
            greeting: 'Hello! How can I help you today?',
            inventory: 'You can see your products in the "Stock Management" section.',
            sales: 'You can see your sales in the "Invoicing & GST" section.',
            help: 'I can help with: 1) Products, 2) Sales, 3) Stats, 4) WhatsApp.',
            whatsapp: 'You can contact us on WhatsApp: +252 63 400 8040',
            default: 'I understand. You can ask me about products, sales, or stats.'
        }
    };
    
    const msg = message.toLowerCase();
    const r = responses[lang] || responses.en;
    let response = r.default;
    
    if (msg.includes('salaan') || msg.includes('hello') || msg.includes('hi')) response = r.greeting;
    else if (msg.includes('alaab') || msg.includes('product') || msg.includes('inventory')) response = r.inventory;
    else if (msg.includes('iib') || msg.includes('sale') || msg.includes('sell')) response = r.sales;
    else if (msg.includes('whatsapp') || msg.includes('xiriir')) response = r.whatsapp;
    else if (msg.includes('caawi') || msg.includes('help')) response = r.help;
    
    res.json({
        message: response,
        language: lang,
        source: 'rule-based'
    });
});

// ============================================
// GET CONVERSATION HISTORY
// ============================================
router.get('/history', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [req.user.id], (err, convos) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(convos || []);
        });
});

module.exports = router;
