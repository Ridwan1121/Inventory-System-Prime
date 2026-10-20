const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: { error: 'Too many requests' }, standardHeaders: true, legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Too many login attempts' }, skipSuccessfulRequests: true });
const signupLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 3 });
const paymentLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });
module.exports = { apiLimiter, loginLimiter, signupLimiter, paymentLimiter };
