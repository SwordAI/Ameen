/* ==============================================
   المصاريف — Expenses
   ============================================== */
const ExpensesPage = (function () {

    const CATEGORIES = ['ديزل', 'أكل', 'تحميل', 'صيانة', 'أخرى'];
    const CAT_ICONS = { 'ديزل': '⛽', 'أكل': '🍔', 'تحميل': '📦', 'صيانة': '🔧', 'أخرى': '📋' };
    const CAT_COLORS = { 'ديزل': '#3B82F6', 'أكل': '#F59E0B', 'تحميل': '#8B5CF6', 'صيانة': '#EF4444', 'أخرى': '#6B7280' };

    let selectedCategory = 'ديزل';

    function render() {
        selectedCategory = 'ديزل';
        const todayExpenses = DB.getTodayExpenses();
        const totalToday = todayExpenses.reduce((s, e) => s + e.amount, 0);

        return `
            <!-- Add Expense Form -->
            <div class="card" style="border:2px solid var(--color-border);">
                <div class="form-group">
                    <label class="form-label">الفئة</label>
                    <div class="category-pills">
                        ${CATEGORIES.map(cat => `
                            <button type="button" class="category-pill ${cat === selectedCategory ? 'active' : ''}"
                                    data-cat="${cat}">
                                ${CAT_ICONS[cat]} ${cat}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">المبلغ</label>
                    <input type="number" class="form-input" id="expense-amount" min="0.01" step="0.01"
                           placeholder="أدخل المبلغ" style="font-size:1.2rem;font-weight:700;text-align:center;">
                </div>

                <div class="form-group">
                    <label class="form-label">ملاحظات (اختياري)</label>
                    <input type="text" class="form-input" id="expense-notes" placeholder="وصف المصروف...">
                </div>

                <button type="button" class="btn btn-accent" id="save-expense-btn">
                    💸 تسجيل المصروف
                </button>
            </div>

            <!-- Today's expenses -->
            <div class="section-divider">
                <span>مصاريف اليوم (${DB.formatNum(totalToday)})</span>
            </div>

            <div id="expenses-list">
                ${renderExpensesList(todayExpenses)}
            </div>
        `;
    }

    function renderExpensesList(expenses) {
        if (expenses.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">💸</div>
                    <div class="empty-state-text">لا توجد مصاريف اليوم</div>
                </div>`;
        }

        return expenses.map(e => `
            <div class="expense-item">
                <div class="expense-category-icon" style="color:${CAT_COLORS[e.category] || '#6B7280'};">
                    ${CAT_ICONS[e.category] || '📋'}
                </div>
                <div class="expense-info">
                    <div class="list-item-title" style="font-size:0.9rem;">${e.category}</div>
                    <div class="list-item-subtitle">${e.notes || 'بدون ملاحظات'}</div>
                </div>
                <div class="expense-amount">${DB.formatNum(e.amount)}</div>
                <button class="expense-delete" data-id="${e.id}" title="حذف">🗑</button>
            </div>
        `).join('');
    }

    function init() {
        // Category pills
        document.querySelectorAll('.category-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                selectedCategory = pill.dataset.cat;
            });
        });

        // Save expense
        const saveBtn = document.getElementById('save-expense-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const amount = Number(document.getElementById('expense-amount').value);
                if (!amount || amount <= 0) {
                    App.toast('الرجاء إدخال مبلغ صحيح', 'error');
                    return;
                }

                DB.addExpense({
                    category: selectedCategory,
                    amount,
                    notes: document.getElementById('expense-notes').value || ''
                });

                App.toast('تم تسجيل المصروف ✓', 'success');

                // Refresh expenses list
                const todayExpenses = DB.getTodayExpenses();
                const totalToday = todayExpenses.reduce((s, e) => s + e.amount, 0);
                document.getElementById('expenses-list').innerHTML = renderExpensesList(todayExpenses);

                // Update section title
                const divider = document.querySelector('.section-divider span');
                if (divider) divider.textContent = `مصاريف اليوم (${DB.formatNum(totalToday)})`;

                // Reset form
                document.getElementById('expense-amount').value = '';
                document.getElementById('expense-notes').value = '';

                bindDeleteButtons();
            });
        }

        bindDeleteButtons();
    }

    function bindDeleteButtons() {
        document.querySelectorAll('.expense-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number(btn.dataset.id);
                DB.deleteExpense(id);
                App.toast('تم حذف المصروف', 'success');

                const todayExpenses = DB.getTodayExpenses();
                const totalToday = todayExpenses.reduce((s, e) => s + e.amount, 0);
                document.getElementById('expenses-list').innerHTML = renderExpensesList(todayExpenses);

                const divider = document.querySelector('.section-divider span');
                if (divider) divider.textContent = `مصاريف اليوم (${DB.formatNum(totalToday)})`;

                bindDeleteButtons();
            });
        });
    }

    return { render, init };
})();
