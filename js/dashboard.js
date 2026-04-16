/* ==============================================
   لوحة اليوم — Daily Dashboard
   ============================================== */
const DashboardPage = (function () {

    function render() {
        const stats = DB.getDailyStats();

        // Expense category icons
        const catIcons = { 'ديزل': '⛽', 'أكل': '🍔', 'تحميل': '📦', 'صيانة': '🔧', 'أخرى': '📋' };

        // Payment type badge
        function payBadge(type) {
            if (type === 'نقدي') return '<span class="badge badge-cash">نقدي</span>';
            if (type === 'دين') return '<span class="badge badge-credit">دين</span>';
            return '<span class="badge badge-mixed">مختلط</span>';
        }

        let invoicesList = '';
        if (stats.todayInvoices.length === 0) {
            invoicesList = `
                <div class="empty-state">
                    <div class="empty-state-icon">🧾</div>
                    <div class="empty-state-text">لا توجد فواتير اليوم</div>
                    <div class="empty-state-sub">ابدأ بإنشاء فاتورة بيع جديدة</div>
                </div>`;
        } else {
            invoicesList = stats.todayInvoices.map(inv => `
                <div class="list-item" onclick="App.viewInvoice(${inv.id})">
                    <div class="list-item-icon" style="background:var(--color-primary-surface);color:var(--color-primary);">🧾</div>
                    <div class="list-item-content">
                        <div class="list-item-title">${inv.customer_name}</div>
                        <div class="list-item-subtitle">${inv.items.length} أصناف</div>
                    </div>
                    <div class="list-item-value">
                        <div class="list-item-amount">${DB.formatNum(inv.total_amount)}</div>
                        <div class="list-item-tag">${payBadge(inv.payment_type)}</div>
                    </div>
                </div>
            `).join('');
        }

        return `
            <div class="metrics-grid">
                <div class="metric-card sales">
                    <div class="metric-label">مجموع المبيعات</div>
                    <div class="metric-value">${DB.formatNum(stats.totalSales)}</div>
                    <div class="metric-sub">${stats.invoiceCount} فاتورة</div>
                </div>
                <div class="metric-card cash">
                    <div class="metric-label">النقدي المحصّل</div>
                    <div class="metric-value">${DB.formatNum(stats.cashReceived)}</div>
                    <div class="metric-sub">مبيعات + تحصيل</div>
                </div>
                <div class="metric-card debt">
                    <div class="metric-label">الدين الجديد</div>
                    <div class="metric-value">${DB.formatNum(stats.totalCredit)}</div>
                    <div class="metric-sub">آجل اليوم</div>
                </div>
                <div class="metric-card expense">
                    <div class="metric-label">المصاريف</div>
                    <div class="metric-value">${DB.formatNum(stats.totalExpenses)}</div>
                    <div class="metric-sub">${stats.todayExpenses.length} مصروف</div>
                </div>
                <div class="metric-card net-cash">
                    <div class="metric-label">الكاش الحالي</div>
                    <div class="metric-value">${DB.formatNum(stats.netCash)}</div>
                    <div class="metric-sub">نقدي - مصاريف</div>
                </div>
                <div class="metric-card profit">
                    <div class="metric-label">الربح التقريبي</div>
                    <div class="metric-value">${DB.formatNum(stats.totalProfit)}</div>
                    <div class="metric-sub">صافي الربح</div>
                </div>
            </div>

            <div class="section-divider"><span>فواتير اليوم</span></div>
            ${invoicesList}
        `;
    }

    function init() {
        // No special event binding needed for dashboard
    }

    return { render, init };
})();
