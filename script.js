// ============================================================
// INVENTORY MANAGEMENT SYSTEM - JAVASCRIPT
// ============================================================

// ============================================================
// DATA: Users & Products
// ============================================================
let users = JSON.parse(localStorage.getItem('imsUsers') || '[]');
let products = JSON.parse(localStorage.getItem('imsProducts') || '[]');
let sales = JSON.parse(localStorage.getItem('imsSales') || '[]');
let currentUser = null;

// ============================================================
// SAVE FUNCTIONS
// ============================================================
function saveUsers() { localStorage.setItem('imsUsers', JSON.stringify(users)); }
function saveProducts() { localStorage.setItem('imsProducts', JSON.stringify(products)); }
function saveSales() { localStorage.setItem('imsSales', JSON.stringify(sales)); }

// ============================================================
// AUTH - Switch between Login and Signup
// ============================================================
function switchAuth(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }
}

// ============================================================
// SIGNUP
// ============================================================
function signup() {
    const name = document.getElementById('signupName').value.trim();
    const business = document.getElementById('signupBusiness').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const password2 = document.getElementById('signupPassword2').value;
    const error = document.getElementById('signupError');

    // Validation
    if (!name || !business || !email || !password) {
        error.textContent = '⚠️ Fadlan buuxi dhammaan meelaha loo baahan yahay!';
        return;
    }
    if (password.length < 6) {
        error.textContent = '⚠️ Password-ka waa inuu ka badan yahay 6 xaraf!';
        return;
    }
    if (password !== password2) {
        error.textContent = '⚠️ Password-ka labada jeer isku mid ma aha!';
        return;
    }
    if (users.some(u => u.email === email)) {
        error.textContent = '⚠️ Email-kan hore ayaa loo isticmaalay!';
        return;
    }

    // Create user
    const user = {
        id: Date.now(),
        name: name,
        business: business,
        email: email,
        phone: phone,
        password: btoa(password), // Simple encoding (frontend only)
        createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers();

    error.style.color = '#065f46';
    error.textContent = '✅ Account waa la sameeyay! Hadda soo gal.';
    
    setTimeout(() => {
        switchAuth('login');
        document.getElementById('loginEmail').value = email;
        error.textContent = '';
        error.style.color = '';
    }, 1500);
}

// ============================================================
// LOGIN
// ============================================================
function login() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const error = document.getElementById('loginError');

    if (!email || !password) {
        error.textContent = '⚠️ Fadlan geli email iyo password!';
        return;
    }

    const user = users.find(u => u.email === email && u.password === btoa(password));
    if (!user) {
        error.textContent = '⚠️ Email ama Password waa khalad!';
        return;
    }

    currentUser = user;
    sessionStorage.setItem('imsCurrentUser', JSON.stringify(user));
    showDashboard();
}

// ============================================================
// LOGOUT
// ============================================================
function logout() {
    currentUser = null;
    sessionStorage.removeItem('imsCurrentUser');
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').textContent = '';
}

// ============================================================
// SHOW DASHBOARD
// ============================================================
function showDashboard() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userBusiness').textContent = currentUser.business;
    
    renderInventory();
    renderSales();
    updateStats();
}

// ============================================================
// DASHBOARD TABS
// ============================================================
function switchDash(tab) {
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dash-view').forEach(v => v.classList.remove('active'));
    
    const tabs = document.querySelectorAll('.dash-tab');
    if (tab === 'inventory') {
        tabs[0].classList.add('active');
        document.getElementById('inventoryView').classList.add('active');
    } else if (tab === 'sales') {
        tabs[1].classList.add('active');
        document.getElementById('salesView').classList.add('active');
    } else if (tab === 'add') {
        tabs[2].classList.add('active');
        document.getElementById('addView').classList.add('active');
    }
}

// ============================================================
// ADD PRODUCT
// ============================================================
function addProduct() {
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const sku = document.getElementById('productSku').value.trim();
    const error = document.getElementById('productError');

    if (!name || !price || !quantity) {
        error.textContent = '⚠️ Fadlan buuxi magaca, qiimaha, iyo tirada!';
        return;
    }

    const product = {
        id: Date.now(),
        userId: currentUser.id,
        name: name,
        category: category,
        price: price,
        quantity: quantity,
        sku: sku || 'SKU-' + Date.now(),
        createdAt: new Date().toISOString()
    };

    products.push(product);
    saveProducts();
    renderInventory();
    updateStats();

    // Clear form
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productQuantity').value = '';
    document.getElementById('productSku').value = '';
    error.style.color = '#065f46';
    error.textContent = '✅ Alaabta waa la ku daray!';
    setTimeout(() => { error.textContent = ''; error.style.color = ''; }, 2000);
}

// ============================================================
// RENDER INVENTORY
// ============================================================
function renderInventory() {
    const grid = document.getElementById('inventoryGrid');
    if (!grid || !currentUser) return;

    const search = (document.getElementById('searchProduct')?.value || '').toLowerCase();
    const userProducts = products.filter(p => p.userId === currentUser.id);
    const filtered = userProducts.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.sku.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
    );

    grid.innerHTML = '';

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center; padding:40px 0; color:#64748b; grid-column:1/-1;">Ma jirto alaab. Ku dar alaab cusub.</p>';
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        if (product.quantity === 0) card.classList.add('out-of-stock');
        else if (product.quantity < 10) card.classList.add('low-stock');

        card.innerHTML = `
            <h4>${product.name}</h4>
            <div class="product-info">
                <span><i class="fas fa-tag"></i> ${product.category}</span>
                <span><i class="fas fa-dollar-sign"></i> $${product.price.toFixed(2)}</span>
                <span><i class="fas fa-cubes"></i> Tirada: ${product.quantity}</span>
                <span><i class="fas fa-barcode"></i> ${product.sku}</span>
            </div>
            <div class="product-actions">
                <button class="sell-btn" onclick="sellProduct(${product.id})">
                    <i class="fas fa-shopping-cart"></i> Iibi
                </button>
                <button class="delete-product-btn" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i> Tirtir
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ============================================================
// SELL PRODUCT
// ============================================================
function sellProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const quantity = prompt(`Iibi "${product.name}"\nTirada la iibinayo:`, '1');
    if (!quantity) return;
    
    const qty = parseInt(quantity);
    if (qty <= 0 || qty > product.quantity) {
        alert('⚠️ Tirada sax ma aha!');
        return;
    }

    // Update product
    product.quantity -= qty;
    
    // Add sale
    const sale = {
        id: Date.now(),
        userId: currentUser.id,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        price: product.price,
        total: product.price * qty,
        date: new Date().toISOString()
    };
    sales.push(sale);
    saveProducts();
    saveSales();
    
    renderInventory();
    renderSales();
    updateStats();
    
    alert(`✅ ${qty} x ${product.name} waa la iibiyay! Wadarta: $${(product.price * qty).toFixed(2)}`);
}

// ============================================================
// DELETE PRODUCT
// ============================================================
function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    if (confirm(`Ma hubtaa inaad tirtirto "${product.name}"?`)) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderInventory();
        updateStats();
    }
}

// ============================================================
// RENDER SALES
// ============================================================
function renderSales() {
    const list = document.getElementById('salesList');
    if (!list || !currentUser) return;

    const userSales = sales.filter(s => s.userId === currentUser.id).reverse();
    list.innerHTML = '';

    if (userSales.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:40px 0; color:#64748b;">Ma jirto iib. Iibi alaabtaada.</p>';
        return;
    }

    userSales.forEach(sale => {
        const item = document.createElement('div');
        item.className = 'sale-item';
        item.innerHTML = `
            <div>
                <strong>${sale.productName}</strong>
                <small>${sale.quantity} x $${sale.price.toFixed(2)} · ${new Date(sale.date).toLocaleDateString()}</small>
            </div>
            <div class="sale-amount">$${sale.total.toFixed(2)}</div>
        `;
        list.appendChild(item);
    });
}

// ============================================================
// UPDATE STATS
// ============================================================
function updateStats() {
    if (!currentUser) return;
    
    const userProducts = products.filter(p => p.userId === currentUser.id);
    const userSales = sales.filter(s => s.userId === currentUser.id);
    
    document.getElementById('totalProducts').textContent = userProducts.length;
    document.getElementById('totalValue').textContent = '$' + userProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2);
    document.getElementById('lowStock').textContent = userProducts.filter(p => p.quantity < 10).length;
    document.getElementById('totalSales').textContent = userSales.length;
}

// ============================================================
// CONSENT BANNER
// ============================================================
function acceptConsent() {
    localStorage.setItem('consentGiven', 'true');
    document.getElementById('consent-banner').style.display = 'none';
}
function denyConsent() {
    localStorage.setItem('consentGiven', 'false');
    document.getElementById('consent-banner').style.display = 'none';
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Show consent banner if not given
    if (!localStorage.getItem('consentGiven')) {
        document.getElementById('consent-banner').style.display = 'flex';
    }
    
    // Check if user is already logged in
    const savedUser = sessionStorage.getItem('imsCurrentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
});

console.log('📦 Inventory Management System loaded successfully!');
