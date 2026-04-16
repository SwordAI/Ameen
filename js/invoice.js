/* ==============================================
   فاتورة بيع جديدة — New Invoice
   ============================================== */
const InvoicePage = (function () {

    let items = [];
    let selectedCustomerId = null;
    let paymentType = 'نقدي';

    function resetState() {
        items = [{ product_id: null, product_name: '', quantity: 1, unit_price: 0, cost_price: 0, line_total: 0 }];
        selectedCustomerId = null;
        paymentType = 'نقدي';
    }

    function calcTotal() {
        return items.reduce((s, it) => s + (it.line_total || 0), 0);
    }

    function render() {
        resetState();
        const customers = DB.getCustomers();
        const products = DB.getProducts();

        return `
            <!-- Customer Selection -->
            <div class="form-group">
                <label class="form-label">الزبون</label>
                <div class="search-dropdown" id="customer-dropdown">
                    <input type="text" class="search-dropdown-input" id="customer-search"
                           placeholder="ابحث عن زبون..." autocomplete="off">
                    <div class="search-dropdown-list" id="customer-list">
                        ${customers.map(c => `
                            <div class="search-dropdown-item" data-id="${c.id}" data-name="${c.name}">
                                <span>${c.name}</span>
                                ${c.balance > 0 ? `<span class="item-balance">دين: ${DB.formatNum(c.balance)}</span>` : ''}
                            </div>
                        `).join('')}
                        <div class="search-dropdown-add" id="add-customer-quick">
                            <span>+</span>
                            <span>إضافة زبون جديد</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Invoice Items -->
            <div class="section-divider"><span>الأصناف</span></div>
            <div id="invoice-items-container"></div>

            <button type="button" class="add-item-btn" id="add-item-btn">
                <span>+</span>
                <span>إضافة صنف</span>
            </button>

            <!-- Total -->
            <div class="invoice-total-bar">
                <span class="invoice-total-label">الإجمالي</span>
                <span class="invoice-total-value" id="invoice-total">0.00</span>
            </div>

            <!-- Payment Type -->
            <div class="form-group">
                <label class="form-label">طريقة الدفع</label>
                <div class="payment-type-group">
                    <button type="button" class="payment-type-btn active" data-type="نقدي">نقدي</button>
                    <button type="button" class="payment-type-btn" data-type="دين">دين</button>
                    <button type="button" class="payment-type-btn" data-type="مختلط">مختلط</button>
                </div>
            </div>

            <!-- Mixed Payment Fields -->
            <div class="mixed-fields" id="mixed-fields" style="display:none;">
                <div class="form-group" style="margin-bottom:0;">
                    <label class="form-label">المبلغ النقدي</label>
                    <input type="number" class="form-input" id="cash-amount" min="0" step="0.01" value="0">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label class="form-label">المبلغ آجل</label>
                    <input type="number" class="form-input" id="credit-amount" min="0" step="0.01" value="0">
                </div>
            </div>

            <!-- Notes -->
            <div class="form-group">
                <label class="form-label">ملاحظات (اختياري)</label>
                <textarea class="form-textarea" id="invoice-notes" placeholder="ملاحظات..." rows="2"></textarea>
            </div>

            <!-- Save Button -->
            <button type="button" class="btn btn-primary" id="save-invoice-btn" style="margin-bottom:var(--space-lg);">
                💾 حفظ الفاتورة
            </button>
        `;
    }

    function renderItems() {
        const products = DB.getProducts();
        const container = document.getElementById('invoice-items-container');
        if (!container) return;

        container.innerHTML = items.map((item, idx) => `
            <div class="invoice-item-card" data-idx="${idx}">
                <div class="invoice-item-header">
                    <select class="form-select" data-action="product-select" data-idx="${idx}" style="flex:1;min-height:42px;font-size:0.85rem;">
                        <option value="">اختر صنف...</option>
                        ${products.map(p => `
                            <option value="${p.id}" ${item.product_id === p.id ? 'selected' : ''}>
                                ${p.name} — ${DB.formatNum(p.selling_price)} (${p.current_stock} ${p.unit})
                            </option>
                        `).join('')}
                    </select>
                    ${items.length > 1 ? `
                        <button type="button" class="invoice-item-remove" data-action="remove-item" data-idx="${idx}">&times;</button>
                    ` : ''}
                </div>
                <div class="invoice-item-row">
                    <div>
                        <label>الكمية</label>
                        <input type="number" class="form-input" data-action="quantity-input" data-idx="${idx}"
                               value="${item.quantity}" min="0.5" step="0.5">
                    </div>
                    <div>
                        <label>السعر</label>
                        <input type="number" class="form-input" data-action="price-input" data-idx="${idx}"
                               value="${item.unit_price}" min="0" step="0.01">
                    </div>
                    <div>
                        <label>المجموع</label>
                        <input type="text" class="form-input" value="${DB.formatNum(item.line_total)}" readonly
                               style="background:var(--color-primary-surface);font-weight:700;color:var(--color-primary);">
                    </div>
                </div>
            </div>
        `).join('');

        updateTotal();
    }

    function updateTotal() {
        const total = calcTotal();
        const el = document.getElementById('invoice-total');
        if (el) el.textContent = DB.formatNum(total);
    }

    function init() {
        renderItems();

        // Customer search
        const searchInput = document.getElementById('customer-search');
        const custList = document.getElementById('customer-list');

        if (searchInput) {
            searchInput.addEventListener('focus', () => {
                custList.classList.add('show');
                filterCustomers('');
            });

            searchInput.addEventListener('input', (e) => {
                filterCustomers(e.target.value);
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('#customer-dropdown')) {
                    custList.classList.remove('show');
                }
            });
        }

        // Customer list item clicks
        if (custList) {
            custList.addEventListener('click', (e) => {
                const item = e.target.closest('.search-dropdown-item');
                if (item) {
                    selectedCustomerId = Number(item.dataset.id);
                    searchInput.value = item.dataset.name;
                    custList.classList.remove('show');
                    return;
                }
                if (e.target.closest('#add-customer-quick')) {
                    custList.classList.remove('show');
                    App.showAddCustomerModal((newCust) => {
                        selectedCustomerId = newCust.id;
                        searchInput.value = newCust.name;
                        // Refresh dropdown
                        refreshCustomerList();
                    });
                }
            });
        }

        // Invoice items container (delegated events)
        const itemsContainer = document.getElementById('invoice-items-container');
        if (itemsContainer) {
            itemsContainer.addEventListener('change', (e) => {
                const idx = Number(e.target.dataset.idx);
                const action = e.target.dataset.action;

                if (action === 'product-select') {
                    const pid = Number(e.target.value);
                    const product = DB.getProduct(pid);
                    if (product) {
                        items[idx].product_id = product.id;
                        items[idx].product_name = product.name;
                        items[idx].unit_price = product.selling_price;
                        items[idx].cost_price = product.purchase_price;
                        items[idx].line_total = items[idx].quantity * product.selling_price;
                    } else {
                        items[idx].product_id = null;
                        items[idx].unit_price = 0;
                        items[idx].cost_price = 0;
                        items[idx].line_total = 0;
                    }
                    renderItems();
                }
            });

            itemsContainer.addEventListener('input', (e) => {
                const idx = Number(e.target.dataset.idx);
                const action = e.target.dataset.action;

                if (action === 'quantity-input') {
                    items[idx].quantity = Number(e.target.value) || 0;
                    items[idx].line_total = items[idx].quantity * items[idx].unit_price;
                    renderItems();
                }
                if (action === 'price-input') {
                    items[idx].unit_price = Number(e.target.value) || 0;
                    items[idx].line_total = items[idx].quantity * items[idx].unit_price;
                    renderItems();
                }
            });

            itemsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action="remove-item"]');
                if (btn) {
                    const idx = Number(btn.dataset.idx);
                    items.splice(idx, 1);
                    renderItems();
                }
            });
        }

        // Add item button
        const addBtn = document.getElementById('add-item-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                items.push({ product_id: null, product_name: '', quantity: 1, unit_price: 0, cost_price: 0, line_total: 0 });
                renderItems();
            });
        }

        // Payment type buttons
        document.querySelectorAll('.payment-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.payment-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                paymentType = btn.dataset.type;

                const mixedFields = document.getElementById('mixed-fields');
                if (paymentType === 'مختلط') {
                    mixedFields.style.display = 'grid';
                } else {
                    mixedFields.style.display = 'none';
                }
            });
        });

        // Save invoice
        const saveBtn = document.getElementById('save-invoice-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveInvoice);
        }
    }

    function filterCustomers(query) {
        const customers = DB.getCustomers();
        const list = document.getElementById('customer-list');
        const filtered = query ? customers.filter(c => c.name.includes(query)) : customers;

        let html = filtered.map(c => `
            <div class="search-dropdown-item" data-id="${c.id}" data-name="${c.name}">
                <span>${c.name}</span>
                ${c.balance > 0 ? `<span class="item-balance">دين: ${DB.formatNum(c.balance)}</span>` : ''}
            </div>
        `).join('');

        html += `
            <div class="search-dropdown-add" id="add-customer-quick">
                <span>+</span>
                <span>إضافة زبون جديد</span>
            </div>
        `;

        list.innerHTML = html;
    }

    function refreshCustomerList() {
        filterCustomers('');
    }

    function saveInvoice() {
        // Validation
        if (!selectedCustomerId) {
            App.toast('الرجاء اختيار الزبون', 'error');
            return;
        }

        const validItems = items.filter(it => it.product_id && it.quantity > 0);
        if (validItems.length === 0) {
            App.toast('الرجاء إضافة صنف واحد على الأقل', 'error');
            return;
        }

        // Check for duplicate products
        const productIds = validItems.map(it => it.product_id);
        if (new Set(productIds).size !== productIds.length) {
            App.toast('لا يمكن إضافة نفس الصنف مرتين', 'error');
            return;
        }

        const total = validItems.reduce((s, it) => s + it.line_total, 0);

        let cashAmount = 0;
        let creditAmount = 0;

        if (paymentType === 'مختلط') {
            cashAmount = Number(document.getElementById('cash-amount').value) || 0;
            creditAmount = Number(document.getElementById('credit-amount').value) || 0;

            if (Math.abs((cashAmount + creditAmount) - total) > 0.01) {
                App.toast('مجموع النقدي والآجل يجب أن يساوي الإجمالي', 'error');
                return;
            }
        }

        const customer = DB.getCustomer(selectedCustomerId);

        const invoice = {
            customer_id: selectedCustomerId,
            customer_name: customer ? customer.name : '',
            payment_type: paymentType,
            cash_amount: cashAmount,
            credit_amount: creditAmount,
            items: validItems,
            notes: document.getElementById('invoice-notes').value || ''
        };

        DB.addInvoice(invoice);
        App.toast('تم حفظ الفاتورة بنجاح ✓', 'success');
        window.location.hash = '#dashboard';
    }

    return { render, init };
})();
