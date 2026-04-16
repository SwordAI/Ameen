/* ==============================================
   تحصيل دين — Record Debt Collection
   ============================================== */
const CollectionPage = (function () {

    let selectedCustomerId = null;

    function render() {
        selectedCustomerId = null;
        const customers = DB.getCustomers().filter(c => c.balance > 0);

        let customerOptions = '';
        if (customers.length === 0) {
            customerOptions = '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">لا يوجد زبائن عليهم ديون</div></div>';
        } else {
            customerOptions = customers.map(c => `
                <div class="list-item card-clickable customer-select-item" data-id="${c.id}" data-name="${c.name}" data-balance="${c.balance}">
                    <div class="list-item-icon" style="background:var(--color-danger-light);color:var(--color-danger);">💳</div>
                    <div class="list-item-content">
                        <div class="list-item-title">${c.name}</div>
                        <div class="list-item-subtitle">${c.phone || ''}</div>
                    </div>
                    <div class="list-item-value">
                        <div class="list-item-amount text-danger">${DB.formatNum(c.balance)}</div>
                    </div>
                </div>
            `).join('');
        }

        return `
            <div class="form-group">
                <label class="form-label">اختر الزبون</label>
                <div id="collection-customer-list">${customerOptions}</div>
            </div>

            <!-- Selected customer card (hidden initially) -->
            <div id="selected-customer-card" style="display:none;">
                <div class="customer-header-card" style="padding:var(--space-md);">
                    <div class="d-flex justify-between align-center">
                        <div>
                            <div class="customer-name" id="col-cust-name" style="font-size:1rem;"></div>
                            <div style="opacity:0.8;font-size:0.8rem;">الرصيد الحالي</div>
                        </div>
                        <div class="customer-balance-value" id="col-cust-balance" style="font-size:1.5rem;"></div>
                    </div>
                </div>

                <div class="form-group mt-md">
                    <label class="form-label">المبلغ المحصّل</label>
                    <input type="number" class="form-input" id="collection-amount" min="0.01" step="0.01"
                           placeholder="أدخل المبلغ" style="font-size:1.3rem;font-weight:700;text-align:center;">
                </div>

                <div class="form-group">
                    <label class="form-label">ملاحظات (اختياري)</label>
                    <textarea class="form-textarea" id="collection-notes" placeholder="ملاحظات..." rows="2"></textarea>
                </div>

                <button type="button" class="btn btn-primary" id="save-collection-btn">
                    💰 تسجيل التحصيل
                </button>

                <button type="button" class="btn btn-secondary mt-sm" id="change-customer-btn">
                    تغيير الزبون
                </button>
            </div>
        `;
    }

    function init() {
        const list = document.getElementById('collection-customer-list');
        if (list) {
            list.addEventListener('click', (e) => {
                const item = e.target.closest('.customer-select-item');
                if (!item) return;

                selectedCustomerId = Number(item.dataset.id);
                const name = item.dataset.name;
                const balance = Number(item.dataset.balance);

                document.getElementById('col-cust-name').textContent = name;
                document.getElementById('col-cust-balance').textContent = DB.formatNum(balance);
                document.getElementById('collection-amount').max = balance;

                list.style.display = 'none';
                document.querySelector('.form-label').style.display = 'none';
                document.getElementById('selected-customer-card').style.display = 'block';
                document.getElementById('collection-amount').focus();
            });
        }

        const changeBtn = document.getElementById('change-customer-btn');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => {
                selectedCustomerId = null;
                document.getElementById('selected-customer-card').style.display = 'none';
                list.style.display = 'block';
                document.querySelector('.form-label').style.display = 'block';
            });
        }

        const saveBtn = document.getElementById('save-collection-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (!selectedCustomerId) {
                    App.toast('الرجاء اختيار الزبون', 'error');
                    return;
                }

                const amount = Number(document.getElementById('collection-amount').value);
                if (!amount || amount <= 0) {
                    App.toast('الرجاء إدخال مبلغ صحيح', 'error');
                    return;
                }

                const customer = DB.getCustomer(selectedCustomerId);
                if (amount > customer.balance) {
                    App.toast('المبلغ أكبر من رصيد الدين', 'error');
                    return;
                }

                DB.addCollection({
                    customer_id: selectedCustomerId,
                    customer_name: customer.name,
                    amount: amount,
                    notes: document.getElementById('collection-notes').value || ''
                });

                App.toast('تم تسجيل التحصيل بنجاح ✓', 'success');
                window.location.hash = '#dashboard';
            });
        }
    }

    return { render, init };
})();
