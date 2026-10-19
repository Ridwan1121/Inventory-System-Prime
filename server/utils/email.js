// ============================================================
// EMAIL UTILITY - Nodemailer
// ============================================================

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'akiidonly12@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

async function sendEmail(to, subject, html) {
    try {
        const info = await transporter.sendMail({
            from: `"Prime Inventory System" <${process.env.EMAIL_USER || 'akiidonly12@gmail.com'}>`,
            to,
            subject,
            html
        });
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email error:', error.message);
        return { success: false, error: error.message };
    }
}

// Email templates
function passwordResetEmail(name, resetLink) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #0f172a;">Salaan ${name},</h2>
                <p style="color: #64748b;">Waxaan helnay codsigaaga password reset-ka. Riix badhanka hoose si aad u beddesho password-kaaga:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Bedel Password</a>
                </div>
                <p style="color: #64748b; font-size: 14px;">Link-kan wuxuu shaqeynayaa 1 saac. Haddii aadan codsan, iska indhatir email-kan.</p>
                <p style="color: #94a3b8; font-size: 12px;">© 2026 Prime Inventory System</p>
            </div>
        </div>
    `;
}

function verificationEmail(name, verifyLink) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">✅ Xaqiiji Email-kaaga</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #0f172a;">Salaan ${name},</h2>
                <p style="color: #64748b;">Waad ku mahadsan tahay isdiiwaangelinta Prime Inventory System. Fadlan xaqiiji email-kaaga:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verifyLink}" style="background: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Xaqiiji Email</a>
                </div>
                <p style="color: #94a3b8; font-size: 12px;">© 2026 Prime Inventory System</p>
            </div>
        </div>
    `;
}

module.exports = { sendEmail, passwordResetEmail, verificationEmail };
