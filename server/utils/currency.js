const CURRENCIES = {
    USD: { symbol: '$', rate: 1, name: 'US Dollar' }, EUR: { symbol: '€', rate: 0.92, name: 'Euro' },
    GBP: { symbol: '£', rate: 0.79, name: 'British Pound' }, SOS: { symbol: 'S', rate: 571, name: 'Somali Shilling' },
    KES: { symbol: 'KSh', rate: 129, name: 'Kenyan Shilling' }, AED: { symbol: 'د.إ', rate: 3.67, name: 'UAE Dirham' },
    SAR: { symbol: '﷼', rate: 3.75, name: 'Saudi Riyal' }, CNY: { symbol: '¥', rate: 7.24, name: 'Chinese Yuan' },
    JPY: { symbol: '¥', rate: 149, name: 'Japanese Yen' }
};
function convertCurrency(amount, from, to) {
    if (from === to) return amount;
    return (amount / CURRENCIES[from].rate) * CURRENCIES[to].rate;
}
function formatCurrency(amount, currency = 'USD') {
    const c = CURRENCIES[currency] || CURRENCIES.USD;
    return `${c.symbol}${amount.toFixed(2)} ${currency}`;
}
module.exports = { CURRENCIES, convertCurrency, formatCurrency };
