/* ==============================================
   أمين — Router & App Controller
   ============================================== */
const App = (function () {

    // ---- Initialize ----
    function start() {
        DB.initSeedData();
        window.addEventListener('hashchange', route);
        route();
    }

    // ---- Router ----
    function route() {
        const hash = window.location.hash || '#dashboard';
        const parts = hash.split('/');
        const page = parts[0].replace('#', '');
        const param = parts[1] || null;

        const appEl = document.getElementById('app');
        const titleEl = document.getElementById('page-title');
        const backBtn = document.getElementById('header-back-btn');

        // Hide back button by default
        backBtn.style.display = 'none';

        // Page titles
        const titles = {
            'dashboard': 'لوحة اليوم',
            'invoice': 'فاتورة بيع جديدة',
            'collection': 'تحصيل دين',
            'customers': 'الزبائن',
            'customer': 'تفاصيل الزبون',
            'products': 'الأصناف',
            'expenses': 'المصاريف',
            'invoice-detail': 'تفاصيل الفاتورة'
        };

        titleEl.textContent = titles[page] || 'أمين';

        // Render page content
        let html = '';
        switch (page) {
            case 'dashboard':
                html = DashboardPage.render();
                break;
            case 'invoice':
                html = InvoicePage.render();
                break;
            case 'collection':
                html = CollectionPage.render();
                break;
            case 'customers':
                html = CustomersPage.render();
                break;
            case 'customer':
                backBtn.style.display = 'flex';
                html = CustomersPage.renderDetail(Number(param));
                break;
            case 'products':
                html = ProductsPage.render();
                break;
            case 'expenses':
                html = ExpensesPage.render();
                break;
            case 'invoice-detail':
                backBtn.style.display = 'flex';
                html = renderInvoiceDetail(Number(param));
                break;
            default:
                html = DashboardPage.render();
        }

        // Animate page transition
        appEl.style.animation = 'none';
        appEl.offsetHeight; // trigger reflow
        appEl.style.animation = 'fadeIn 0.3s ease';
        appEl.innerHTML = html;

        // Init page event handlers
        switch (page) {
            case 'dashboard': DashboardPage.init(); break;
            case 'invoice': InvoicePage.init(); break;
            case 'collection': CollectionPage.init(); break;
            case 'customers': CustomersPage.init(); break;
            case 'customer': CustomersPage.initDetail(); break;
            case 'products': ProductsPage.init(); break;
            case 'expenses': ExpensesPage.init(); break;
        }

        // Update active nav
        updateActiveNav(page);
    }

    // ---- Navigation ----
    function updateActiveNav(page) {
        const navMap = {
            'dashboard': 'dashboard',
            'invoice': 'invoice',
            'collection': 'collection',
            'customers': 'customers',
            'customer': 'customers',
            'products': 'products',
            'expenses': 'expenses',
            'invoice-detail': 'dashboard'
        };

        const activePage = navMap[page] || 'dashboard';

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            }
        });
    }

    // ---- Invoice Detail ----
    function renderInvoiceDetail(id) {
        const inv = DB.getInvoice(id);
        if (!inv) return '<div class="empty-state"><div class="empty-state-text">الفاتورة غير موجودة</div></div>';

        function payBadge(type) {
            if (type === 'نقدي') return '<span class="badge badge-cash" style="font-size:0.85rem;padding:4px 14px;">نقدي</span>';
            if (type === 'دين') return '<span class="badge badge-credit" style="font-size:0.85rem;padding:4px 14px;">دين</span>';
            return '<span class="badge badge-mixed" style="font-size:0.85rem;padding:4px 14px;">مختلط</span>';
        }

        let profit = 0;
        const itemsHtml = inv.items.map(it => {
            const itemProfit = (it.unit_price - it.cost_price) * it.quantity;
            profit += itemProfit;
            return `
                <div class="list-item" style="cursor:default;">
                    <div class="list-item-content">
                        <div class="list-item-title">${it.product_name}</div>
                        <div class="list-item-subtitle">${it.quantity} × ${DB.formatNum(it.unit_price)}</div>
                    </div>
                    <div class="list-item-value">
                        <div class="list-item-amount">${DB.formatNum(it.line_total)}</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="card" style="border-right: 4px solid var(--color-primary);">
                <div class="d-flex justify-between align-center mb-md">
                    <div>
                        <div style="font-size:0.8rem;color:var(--color-text-secondary);">فاتورة رقم</div>
                        <div style="font-size:1.2rem;font-weight:800;">#${inv.id}</div>
                    </div>
                    <div>${payBadge(inv.payment_type)}</div>
                </div>
                <div class="d-flex justify-between align-center mb-sm">
                    <span class="text-secondary" style="font-size:0.85rem;">الزبون</span>
                    <span style="font-weight:700;">${inv.customer_name}</span>
                </div>
                <div class="d-flex justify-between align-center mb-sm">
                    <span class="text-secondary" style="font-size:0.85rem;">التاريخ</span>
                    <span style="font-weight:600;">${inv.date}</span>
                </div>
                ${inv.payment_type === 'مختلط' ? `
                    <div class="d-flex justify-between align-center mb-sm">
                        <span class="text-secondary" style="font-size:0.85rem;">نقدي</span>
                        <span class="text-success" style="font-weight:700;">${DB.formatNum(inv.cash_amount)}</span>
                    </div>
                    <div class="d-flex justify-between align-center mb-sm">
                        <span class="text-secondary" style="font-size:0.85rem;">آجل</span>
                        <span class="text-danger" style="font-weight:700;">${DB.formatNum(inv.credit_amount)}</span>
                    </div>
                ` : ''}
                ${inv.notes ? `
                    <div class="d-flex justify-between align-center mb-sm">
                        <span class="text-secondary" style="font-size:0.85rem;">ملاحظات</span>
                        <span style="font-size:0.85rem;">${inv.notes}</span>
                    </div>
                ` : ''}
            </div>

            <div class="section-divider"><span>الأصناف (${inv.items.length})</span></div>
            ${itemsHtml}

            <div class="invoice-total-bar">
                <span class="invoice-total-label">الإجمالي</span>
                <span class="invoice-total-value">${DB.formatNum(inv.total_amount)}</span>
            </div>

            <div class="card" style="background:var(--color-success-light);border:none;">
                <div class="d-flex justify-between align-center">
                    <span style="font-weight:600;color:var(--color-success);">الربح من الفاتورة</span>
                    <span style="font-weight:800;font-size:1.2rem;color:var(--color-success);">${DB.formatNum(profit)}</span>
                </div>
            </div>
        `;
    }

    function viewInvoice(id) {
        window.location.hash = `#invoice-detail/${id}`;
    }

    // ---- Modal ----
    function showModal(title, bodyHtml) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHtml;
        document.getElementById('modal-overlay').classList.add('show');

        document.getElementById('modal-close').onclick = closeModal;
        document.getElementById('modal-overlay').onclick = function (e) {
            if (e.target === this) closeModal();
        };
    }

    function closeModal() {
        document.getElementById('modal-overlay').classList.remove('show');
    }

    // ---- Add Customer Modal ----
    function showAddCustomerModal(callback) {
        showModal('إضافة زبون جديد', `
            <div class="form-group">
                <label class="form-label">اسم الزبون</label>
                <input type="text" class="form-input" id="new-cust-name" placeholder="اسم المحل أو الزبون">
            </div>
            <div class="form-group">
                <label class="form-label">رقم الهاتف (اختياري)</label>
                <input type="tel" class="form-input" id="new-cust-phone" placeholder="07XXXXXXXX" dir="ltr" style="text-align:right;">
            </div>
            <button type="button" class="btn btn-primary" id="save-new-customer">حفظ الزبون</button>
        `);

        document.getElementById('save-new-customer').addEventListener('click', () => {
            const name = document.getElementById('new-cust-name').value.trim();
            if (!name) {
                toast('الرجاء إدخال اسم الزبون', 'error');
                return;
            }

            const newCust = DB.addCustomer({
                name,
                phone: document.getElementById('new-cust-phone').value.trim() || '',
                balance: 0
            });

            closeModal();
            toast('تم إضافة الزبون بنجاح ✓', 'success');
            if (callback) callback(newCust);
        });
    }

    // ---- Toast Notifications ----
    function toast(message, type) {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
        el.textContent = message;
        container.appendChild(el);

        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 3000);
    }

    // ---- Boot ----
    document.addEventListener('DOMContentLoaded', start);

    return {
        toast,
        showModal,
        closeModal,
        showAddCustomerModal,
        viewInvoice
    };
})();
