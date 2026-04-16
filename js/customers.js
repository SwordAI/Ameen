/* ==============================================
   الزبائن — Customers List & Detail
   ============================================== */
const CustomersPage = (function () {

    function render() {
        const customers = DB.getCustomers();

        let list = '';
        if (customers.length === 0) {
            list = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-text">لا يوجد زبائن</div>
                    <div class="empty-state-sub">أضف زبائنك للبدء</div>
                </div>`;
        } else {
            list = customers.map(c => `
                <a href="#customer/${c.id}" class="list-item card-clickable">
                    <div class="list-item-icon" style="background:${c.balance > 0 ? 'var(--color-danger-light)' : 'var(--color-success-light)'};color:${c.balance > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">
                        ${c.name.charAt(0)}
                    </div>
                    <div class="list-item-content">
                        <div class="list-item-title">${c.name}</div>
                        <div class="list-item-subtitle">${c.phone || 'بدون رقم'}</div>
                    </div>
                    <div class="list-item-value">
                        ${c.balance > 0
                            ? `<div class="list-item-amount text-danger">${DB.formatNum(c.balance)}</div><div class="list-item-tag"><span class="badge badge-credit">مدين</span></div>`
                            : `<div class="list-item-amount text-success">0.00</div><div class="list-item-tag"><span class="badge badge-cash">بلا دين</span></div>`
                        }
                    </div>
                </a>
            `).join('');
        }

        return `
            <div class="search-bar">
                <svg class="search-bar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input type="text" id="customer-search-input" placeholder="ابحث عن زبون...">
            </div>
            <div id="customers-list">${list}</div>
            <button class="fab" id="add-customer-fab">+</button>
        `;
    }

    function renderDetail(customerId) {
        const customer = DB.getCustomer(customerId);
        if (!customer) return '<div class="empty-state"><div class="empty-state-text">الزبون غير موجود</div></div>';

        const invoices = DB.getCustomerInvoices(customerId).sort((a, b) => b.id - a.id);
        const collections = DB.getCustomerCollections(customerId).sort((a, b) => b.id - a.id);

        function payBadge(type) {
            if (type === 'نقدي') return '<span class="badge badge-cash">نقدي</span>';
            if (type === 'دين') return '<span class="badge badge-credit">دين</span>';
            return '<span class="badge badge-mixed">مختلط</span>';
        }

        const invoicesList = invoices.length === 0
            ? '<div class="empty-state" style="padding:var(--space-md);"><div class="empty-state-text" style="font-size:0.85rem;">لا توجد فواتير</div></div>'
            : invoices.map(inv => `
                <div class="list-item" onclick="App.viewInvoice(${inv.id})">
                    <div class="list-item-content">
                        <div class="list-item-title">${inv.date}</div>
                        <div class="list-item-subtitle">${inv.items.length} أصناف</div>
                    </div>
                    <div class="list-item-value">
                        <div class="list-item-amount">${DB.formatNum(inv.total_amount)}</div>
                        <div class="list-item-tag">${payBadge(inv.payment_type)}</div>
                    </div>
                </div>
            `).join('');

        const collectionsList = collections.length === 0
            ? '<div class="empty-state" style="padding:var(--space-md);"><div class="empty-state-text" style="font-size:0.85rem;">لا توجد تحصيلات</div></div>'
            : collections.map(col => `
                <div class="list-item">
                    <div class="list-item-content">
                        <div class="list-item-title">${col.date}</div>
                        <div class="list-item-subtitle">${col.notes || 'تحصيل دين'}</div>
                    </div>
                    <div class="list-item-value">
                        <div class="list-item-amount text-success">${DB.formatNum(col.amount)}</div>
                    </div>
                </div>
            `).join('');

        return `
            <div class="customer-header-card">
                <div class="customer-name">${customer.name}</div>
                <div class="customer-phone">${customer.phone || 'بدون رقم'}</div>
                <div class="customer-balance-label">رصيد الدين</div>
                <div class="customer-balance-value">${DB.formatNum(customer.balance)}</div>
            </div>

            <div class="detail-tabs">
                <button class="detail-tab active" data-tab="invoices">الفواتير (${invoices.length})</button>
                <button class="detail-tab" data-tab="collections">التحصيلات (${collections.length})</button>
            </div>

            <div id="tab-invoices">${invoicesList}</div>
            <div id="tab-collections" style="display:none;">${collectionsList}</div>
        `;
    }

    function init() {
        // Search filter
        const searchInput = document.getElementById('customer-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                const customers = DB.getCustomers();
                const filtered = query ? customers.filter(c => c.name.includes(query)) : customers;
                const listEl = document.getElementById('customers-list');

                if (filtered.length === 0) {
                    listEl.innerHTML = '<div class="empty-state" style="padding:var(--space-md);"><div class="empty-state-text">لا توجد نتائج</div></div>';
                } else {
                    listEl.innerHTML = filtered.map(c => `
                        <a href="#customer/${c.id}" class="list-item card-clickable">
                            <div class="list-item-icon" style="background:${c.balance > 0 ? 'var(--color-danger-light)' : 'var(--color-success-light)'};color:${c.balance > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">
                                ${c.name.charAt(0)}
                            </div>
                            <div class="list-item-content">
                                <div class="list-item-title">${c.name}</div>
                                <div class="list-item-subtitle">${c.phone || 'بدون رقم'}</div>
                            </div>
                            <div class="list-item-value">
                                ${c.balance > 0
                                    ? `<div class="list-item-amount text-danger">${DB.formatNum(c.balance)}</div><div class="list-item-tag"><span class="badge badge-credit">مدين</span></div>`
                                    : `<div class="list-item-amount text-success">0.00</div><div class="list-item-tag"><span class="badge badge-cash">بلا دين</span></div>`
                                }
                            </div>
                        </a>
                    `).join('');
                }
            });
        }

        // Add customer FAB
        const fab = document.getElementById('add-customer-fab');
        if (fab) {
            fab.addEventListener('click', () => {
                App.showAddCustomerModal(() => {
                    // Refresh the list
                    window.location.hash = '#customers';
                });
            });
        }
    }

    function initDetail() {
        // Tab switching
        document.querySelectorAll('.detail-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const target = tab.dataset.tab;
                document.getElementById('tab-invoices').style.display = target === 'invoices' ? 'block' : 'none';
                document.getElementById('tab-collections').style.display = target === 'collections' ? 'block' : 'none';
            });
        });
    }

    return { render, renderDetail, init, initDetail };
})();
