// ============================================================
// RATE LIMITING - Advanced
// ============================================================

const rateLimit = require('express-rate-limit');

// General API limit
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: '⚠️ Waxaad ka gudubtay xadka codsiga. Fadlan sug 15 daqiiqo.',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

// Login limit (stricter)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts, please try again later.' },
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        res.status(429).json({
            error: '⚠️ Waxaad ka gudubtay isku dayo. Fadlan sug 15 daqiiqo.',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

// Signup limit
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { error: 'Too many signup attempts.' }
});

// Payment limit
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10
});

module.exports = { apiLimiter, loginLimiter, signupLimiter, paymentLimiter };
