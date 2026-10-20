// ============================================================
// LANGUAGE SYSTEM - Translation + RTL Support
// ============================================================

let currentLanguage = localStorage.getItem('language') || 'so';
let translations = {};
let isRTL = false;

async function loadLanguage(lang) {
    try {
        const response = await fetch(`/client/lang/${lang}.json`);
        translations = await response.json();
        currentLanguage = lang;
        localStorage.setItem('language', lang);
        
        isRTL = lang === 'ar';
        document.documentElement.lang = lang;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        
        applyTranslations();
        updateLanguageSelector(lang);
        applyRTL(isRTL);
        
        console.log(`✅ Language loaded: ${lang}`);
        return true;
    } catch (error) {
        console.error('❌ Language load error:', error);
        return false;
    }
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const value = getNestedValue(translations, key);
        if (value) el.textContent = value;
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const value = getNestedValue(translations, key);
        if (value) el.placeholder = value;
    });
    
    if (translations.app && translations.app.name) {
        document.title = `${translations.app.name} - ${translations.app.subtitle || ''}`;
    }
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
    }, obj);
}

function updateLanguageSelector(lang) {
    const selector = document.getElementById('langSelector');
    if (selector) selector.value = lang;
    
    const currentLang = document.getElementById('currentLang');
    if (currentLang) {
        const flags = { en: '🇬🇧', so: '🇸🇴', ar: '🇸🇦' };
        const names = { en: 'English', so: 'Soomaali', ar: 'العربية' };
        currentLang.textContent = `${flags[lang] || ''} ${names[lang] || lang}`;
    }
}

function applyRTL(rtl) {
    document.body.classList.toggle('rtl', rtl);
}

async function switchLanguage(lang) {
    const success = await loadLanguage(lang);
    if (success) {
        showLanguageToast(lang);
        closeLangDropdown();
    }
}

function showLanguageToast(lang) {
    const flags = { en: '🇬🇧', so: '🇸🇴', ar: '🇸🇦' };
    const names = { en: 'English', so: 'Soomaali', ar: 'العربية' };
    
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0f172a;color:white;padding:12px 24px;border-radius:12px;font-family:Inter,sans-serif;font-size:0.9rem;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:9999;display:flex;align-items:center;gap:8px;';
    toast.innerHTML = `${flags[lang]} ${names[lang]} ✅`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function toggleLangDropdown() {
    const dropdown = document.getElementById('langDropdown');
    if (dropdown) dropdown.classList.toggle('open');
}

function closeLangDropdown() {
    const dropdown = document.getElementById('langDropdown');
    if (dropdown) dropdown.classList.remove('open');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-switcher')) {
        closeLangDropdown();
    }
});

function t(key) {
    return getNestedValue(translations, key) || key;
}

document.addEventListener('DOMContentLoaded', () => {
    loadLanguage(currentLanguage);
});

window.i18n = {
    t,
    switchLanguage,
    loadLanguage,
    toggleLangDropdown,
    getCurrentLanguage: () => currentLanguage,
    isRTL: () => isRTL
};

console.log('✅ i18n system loaded');
