// ============================================================
// SIDEBAR MIDAYSAN - Dynamic Loading + Role-Based
// ============================================================

(function() {
    'use strict';

    // ============================================
    // SIDEBAR HTML TEMPLATE
    // ============================================
    const sidebarHTML = `
        <button class="sidebar-toggle" id="sidebarToggle" onclick="toggleSidebar()" aria-label="Toggle menu">
            <i class="fas fa-bars"></i>
        </button>
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
        <aside class="sidebar" id="saasSidebar">
            <div class="sidebar-brand">
                <div class="sidebar-brand-icon"><i class="fas fa-chart-line"></i></div>
                <div class="sidebar-brand-text">
                    <span>Prime Inventory</span>
                    <span>SaaS Enterprise v3.0</span>
                </div>
            </div>

            <nav class="sidebar-nav">
                <!-- Main -->
                <a href="/dashboard" class="sidebar-link" data-page="dashboard">
                    <i class="fas fa-gauge"></i>
                    <span>Dashboard</span>
                </a>
                <a href="/pricing" class="sidebar-link" data-page="pricing">
                    <i class="fas fa-tags"></i>
                    <span>Qorshayaasha (Pricing)</span>
                </a>
                <a href="/payment" class="sidebar-link" data-page="payment">
                    <i class="fas fa-credit-card"></i>
                    <span>Payment</span>
                </a>
                <a href="/signup" class="sidebar-link" data-page="signup">
                    <i class="fas fa-user-plus"></i>
                    <span>Signup</span>
                </a>
                <a href="/login" class="sidebar-link" data-page="login">
                    <i class="fas fa-sign-in-alt"></i>
                    <span>Login</span>
                </a>

                <!-- Features -->
                <div class="sidebar-section-title">Features</div>
                <a href="/dashboard#invoicing" class="sidebar-link" data-page="invoicing">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <span>Invoicing & GST</span>
                </a>
                <a href="/dashboard#stock" class="sidebar-link" data-page="stock">
                    <i class="fas fa-boxes"></i>
                    <span>Stock Management</span>
                </a>
                <a href="/dashboard#ai" class="sidebar-link" data-page="ai">
                    <i class="fas fa-robot"></i>
                    <span>AI Assistant</span>
                    <span class="nav-badge new">NEW</span>
                </a>
                <a href="/dashboard#migration" class="sidebar-link" data-page="migration">
                    <i class="fas fa-database"></i>
                    <span>Data Migration</span>
                </a>
                <a href="/dashboard#reports" class="sidebar-link" data-page="reports">
                    <i class="fas fa-chart-bar"></i>
                    <span>Reports</span>
                </a>
                <a href="/dashboard#customers" class="sidebar-link" data-page="customers">
                    <i class="fas fa-users"></i>
                    <span>Customers</span>
                </a>
                <a href="/dashboard#accounting" class="sidebar-link" data-page="accounting">
                    <i class="fas fa-calculator"></i>
                    <span>Accounting</span>
                </a>

                <!-- Admin/Owner Section (Hidden by default) -->
                <div class="sidebar-admin-section" id="sidebarAdminSection">
                    <div class="sidebar-divider"></div>
                    <div class="sidebar-section-title">Admin / Owner</div>
                    <a href="/owner" class="sidebar-link" data-page="owner">
                        <i class="fas fa-user-shield"></i>
                        <span>Qaybta Owner-ka</span>
                    </a>
                    <a href="/api" class="sidebar-link" data-page="api" target="_blank">
                        <i class="fas fa-code"></i>
                        <span>API Docs</span>
                    </a>
                    <a href="/dashboard#company" class="sidebar-link" data-page="company">
                        <i class="fas fa-building"></i>
                        <span>Company Account</span>
                    </a>
                </div>
            </nav>

            <div class="sidebar-footer">
                <div class="sidebar-user" id="sidebarUser">
                    <img src="https://ui-avatars.com/api/?name=Guest&background=64748b&color=fff" alt="User" id="sidebarUserAvatar" />
                    <div class="sidebar-user-info">
                        <span id="sidebarUserName">Guest</span>
                        <span id="sidebarUserRole">Not logged in</span>
                    </div>
                    <button class="sidebar-logout" onclick="sidebarLogout()" title="Logout" id="sidebarLogoutBtn" style="display:none;">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </aside>
    `;

    // ============================================
    // INJECT SIDEBAR
    // ============================================
    function injectSidebar() {
        // Hubi haddii sidebar hore uu jiro
        if (document.getElementById('saasSidebar')) return;

        // Ku dar HTML-ka sidebar-ka
        const container = document.createElement('div');
        container.innerHTML = sidebarHTML;
        document.body.insertBefore(container, document.body.firstChild);

        // Ku dar class body
        document.body.classList.add('has-sidebar');

        // Highlight current page
        highlightCurrentPage();

        // Update user info (role-based)
        updateUserInfo();

        // Hubi role-ka admin/owner
        checkAdminRole();

        // Ku dar CSS haddii aan la darin
        ensureSidebarCSS();
    }

    // ============================================
    // HIGHLIGHT CURRENT PAGE
    // ============================================
    function highlightCurrentPage() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        
        let pageKey = '';
        if (path === '/' || path === '/index.html') pageKey = 'home';
        else if (path.includes('dashboard')) pageKey = 'dashboard';
        else if (path.includes('pricing')) pageKey = 'pricing';
        else if (path.includes('payment')) pageKey = 'payment';
        else if (path.includes('signup')) pageKey = 'signup';
        else if (path.includes('login')) pageKey = 'login';
        else if (path.includes('owner')) pageKey = 'owner';
        
        // Haddii hash uu jiro (dashboard#invoicing)
        if (hash) {
            const hashPage = hash.replace('#', '');
            pageKey = hashPage;
        }

        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            const linkPage = link.getAttribute('data-page');
            if (linkPage === pageKey) {
                link.classList.add('active');
            }
        });
    }

    // ============================================
    // UPDATE USER INFO
    // ============================================
    function updateUserInfo() {
        const token = localStorage.getItem('token');
        const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
        const owner = JSON.parse(localStorage.getItem('owner') || 'null');
        
        const nameEl = document.getElementById('sidebarUserName');
        const roleEl = document.getElementById('sidebarUserRole');
        const avatarEl = document.getElementById('sidebarUserAvatar');
        const logoutBtn = document.getElementById('sidebarLogoutBtn');

        if (owner) {
            // Owner logged in
            nameEl.textContent = owner.name || 'Owner';
            roleEl.textContent = '👑 Main Owner';
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(owner.name || 'Owner')}&background=f59e0b&color=fff`;
            logoutBtn.style.display = 'block';
        } else if (tenant) {
            // Tenant logged in
            nameEl.textContent = tenant.name || 'User';
            roleEl.textContent = tenant.business_name || 'Business';
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tenant.name || 'User')}&background=2563eb&color=fff`;
            logoutBtn.style.display = 'block';
        } else {
            // Guest
            nameEl.textContent = 'Guest';
            roleEl.textContent = 'Not logged in';
            avatarEl.src = 'https://ui-avatars.com/api/?name=Guest&background=64748b&color=fff';
            logoutBtn.style.display = 'none';
        }
    }

    // ============================================
    // CHECK ADMIN ROLE
    // ============================================
    function checkAdminRole() {
        const owner = JSON.parse(localStorage.getItem('owner') || 'null');
        const token = localStorage.getItem('token');
        const adminSection = document.getElementById('sidebarAdminSection');
        
        if (!adminSection) return;

        // Haddii owner uu jiro, muuji admin section
        if (owner) {
            adminSection.classList.add('visible');
        } else if (token) {
            // Hubi JWT payload haddii uu admin yahay
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.userType === 'owner' || payload.isAdmin) {
                    adminSection.classList.add('visible');
                }
            } catch (e) {
                // Token khaldan
            }
        }
    }

    // ============================================
    // TOGGLE SIDEBAR (Mobile)
    // ============================================
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('saasSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('open');
    };

    // ============================================
    // LOGOUT
    // ============================================
    window.sidebarLogout = function() {
        if (!confirm('Ma hubtaa inaad ka baxdo?')) return;
        localStorage.removeItem('token');
        localStorage.removeItem('tenant');
        localStorage.removeItem('owner');
        sessionStorage.clear();
        window.location.href = '/login';
    };

    // ============================================
    // ENSURE CSS LOADED
    // ============================================
    function ensureSidebarCSS() {
        // Hubi haddii CSS hore loo darin
        const existingLink = document.querySelector('link[href*="sidebar.css"]');
        if (existingLink) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/client/css/sidebar.css';
        document.head.appendChild(link);
    }

    // ============================================
    // INIT ON DOM READY
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSidebar);
    } else {
        injectSidebar();
    }

    // ============================================
    // LISTEN FOR STORAGE CHANGES (Login/Logout)
    // ============================================
    window.addEventListener('storage', function(e) {
        if (e.key === 'owner' || e.key === 'tenant' || e.key === 'token') {
            updateUserInfo();
            checkAdminRole();
        }
    });

})();
