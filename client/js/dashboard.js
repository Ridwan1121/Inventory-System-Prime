// ============================================================
// PRIME INVENTORY SYSTEM - DASHBOARD JS
// ============================================================

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    initTheme();
    initSparklines();
    console.log('📊 Prime Inventory Dashboard loaded!');
});

// ============================================================
// THEME TOGGLE
// ============================================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    showToast(`${next === 'dark' ? '🌙 Dark' : '☀️ Light'} mode activated`);
}

// ============================================================
// SIDEBAR TOGGLE
// ============================================================
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ============================================================
// AI PANEL
// ============================================================
function toggleAI() {
    const panel = document.getElementById('aiPanel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
        document.getElementById('aiInput').focus();
    }
}

function askAI(question) {
    const panel = document.getElementById('aiPanel');
    if (!panel.classList.contains('open')) panel.classList.add('open');
    document.getElementById('aiInput').value = question;
    sendAI();
}

function sendAI() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    if (!message) return;

    const messages = document.getElementById('aiMessages');
    
    // Add user message
    messages.innerHTML += `
        <div class="ai-message ai-message-user">
            <div class="ai-message-avatar"><i class="fas fa-user"></i></div>
            <div class="ai-message-content"><p>${message}</p></div>
        </div>
    `;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    // Simulate AI response
    setTimeout(() => {
        const response = generateAIResponse(message);
        messages.innerHTML += `
            <div class="ai-message ai-message-bot">
                <div class="ai-message-avatar"><i class="fas fa-robot"></i></div>
                <div class="ai-message-content"><p>${response}</p></div>
            </div>
        `;
        messages.scrollTop = messages.scrollHeight;
    }, 800);
}

function generateAIResponse(message) {
    const msg = message.toLowerCase();
    const responses = {
        'stock': '📦 Based on your sales data, I predict a <strong>25% increase</strong> in demand for Lubaan products next month. I recommend ordering 200 more units of the Half Carton (36 Pcs) SKU.',
        'cash': '💰 Your cash flow is <strong>positive</strong> with $48,250 in revenue this month. Your receivables are $4,280 overdue. Would you like me to send payment reminders?',
        'low': '⚠️ 3 products are underperforming: Herbal products (15% slower than last quarter), USB Hub (0 in stock), and Monitor Arm (6 in stock). Should I create a reorder?',
        'forecast': '📈 Based on historical data, next month\'s revenue is projected at <strong>$54,000</strong> — a 12% increase. Your top-performing product is Lubaan Dawada Ilkaha.',
        'gst': '📋 Your GSTR-3B is filed and compliant. 245 e-invoices generated this quarter. No pending returns.',
        'invoice': '🧾 You have 3 overdue invoices totaling $4,280. I can send payment reminders to all customers with one click.',
        'default': '🤖 I can help you with: stock forecasting, cash flow analysis, GST compliance, invoice management, and data migration. What would you like to know?'
    };
    
    for (const [key, response] of Object.entries(responses)) {
        if (msg.includes(key)) return response;
    }
    return responses.default;
}

// ============================================================
// CHARTS
// ============================================================
function initCharts() {
    initMainChart();
}

function initMainChart() {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.3)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.01)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            datasets: [
                {
                    label: 'Revenue ($)',
                    data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 42000, 48250],
                    borderColor: '#2563eb',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'Stock Value ($)',
                    data: [8000, 12000, 10000, 15000, 14000, 18000, 17000, 22000, 26000, 30000],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', size: 12 } }
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    padding: 12,
                    titleFont: { family: 'Inter', size: 13 },
                    bodyFont: { family: 'Inter', size: 12 },
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { font: { family: 'Inter', size: 11 }, callback: v => '$' + v.toLocaleString() }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 11 } }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

function updateChart() {
    showToast('📊 Chart updated');
}

// ============================================================
// SPARKLINES
// ============================================================
function initSparklines() {
    const revenueCtx = document.getElementById('revenueSparkline');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 12}, (_, i) => i),
                datasets: [{
                    data: [12, 19, 15, 25, 22, 30, 28, 35, 42, 48, 45, 52],
                    borderColor: '#2563eb',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    const ordersCtx = document.getElementById('ordersSparkline');
    if (ordersCtx) {
        new Chart(ordersCtx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 8}, (_, i) => i),
                datasets: [{
                    data: [5, 8, 6, 12, 10, 15, 13, 18],
                    backgroundColor: '#4338ca',
                    borderRadius: 3,
                    barThickness: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }
}

// ============================================================
// MIGRATION
// ============================================================
function showMigrationModal() {
    document.getElementById('migrationModal').classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

function dismissMigration() {
    document.getElementById('migrationBanner').style.display = 'none';
}

function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        showToast(`📁 ${files.length} file(s) selected`);
    }
}

function startMigration() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files.length) {
        showToast('⚠️ Please select a file first');
        return;
    }
    showToast('🚀 Migration started! Processing your data...');
    setTimeout(() => {
        closeModal('migrationModal');
        showToast('✅ Data migration completed successfully!');
    }, 2000);
}

// ============================================================
// QUICK ACTIONS
// ============================================================
function quickAction(action) {
    const actions = {
        invoice: '🧾 Creating new invoice...',
        stock: '📦 Opening stock item form...',
        eway: '🚚 Generating e-Way Bill...',
        import: '📥 Opening data import...'
    };
    showToast(actions[action] || 'Action triggered');
    if (action === 'import') showMigrationModal();
}

function viewAllTransactions() {
    showToast('📋 Opening all transactions...');
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('globalSearch')?.focus();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        toggleAI();
    }
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
        document.getElementById('aiPanel').classList.remove('open');
    }
});

console.log('✅ Dashboard JS loaded');
