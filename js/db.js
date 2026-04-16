/* ==============================================
   أمين — Data Layer (localStorage)
   ============================================== */
const DB = (function () {
    const KEYS = {
        products: 'ameen_products',
        customers: 'ameen_customers',
        invoices: 'ameen_invoices',
        collections: 'ameen_collections',
        expenses: 'ameen_expenses',
        initialized: 'ameen_initialized'
    };

    // ---- Helpers ----
    function getData(key) {
        try {
            const d = localStorage.getItem(key);
            return d ? JSON.parse(d) : [];
        } catch (e) { return []; }
    }

    function setData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function nextId(items) {
        if (!items.length) return 1;
        return Math.max(...items.map(i => i.id || 0)) + 1;
    }

    function getToday() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function isToday(dateStr) {
        return dateStr === getToday();
    }

    function formatNum(n) {
        return Number(n || 0).toLocaleString('en', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // ---- Products ----
    function getProducts() { return getData(KEYS.products); }
    function getProduct(id) { return getProducts().find(p => p.id === Number(id)); }

    function addProduct(p) {
        const all = getProducts();
        p.id = nextId(all);
        p.current_stock = Number(p.current_stock) || 0;
        p.purchase_price = Number(p.purchase_price) || 0;
        p.selling_price = Number(p.selling_price) || 0;
        all.push(p);
        setData(KEYS.products, all);
        return p;
    }

    function updateProduct(id, updates) {
        const all = getProducts();
        const idx = all.findIndex(p => p.id === Number(id));
        if (idx === -1) return null;
        if (updates.purchase_price !== undefined) updates.purchase_price = Number(updates.purchase_price);
        if (updates.selling_price !== undefined) updates.selling_price = Number(updates.selling_price);
        if (updates.current_stock !== undefined) updates.current_stock = Number(updates.current_stock);
        all[idx] = { ...all[idx], ...updates };
        setData(KEYS.products, all);
        return all[idx];
    }

    // ---- Customers ----
    function getCustomers() { return getData(KEYS.customers); }
    function getCustomer(id) { return getCustomers().find(c => c.id === Number(id)); }

    function addCustomer(c) {
        const all = getCustomers();
        c.id = nextId(all);
        c.balance = Number(c.balance) || 0;
        all.push(c);
        setData(KEYS.customers, all);
        return c;
    }

    function updateCustomer(id, updates) {
        const all = getCustomers();
        const idx = all.findIndex(c => c.id === Number(id));
        if (idx === -1) return null;
        all[idx] = { ...all[idx], ...updates };
        setData(KEYS.customers, all);
        return all[idx];
    }

    // ---- Invoices ----
    function getInvoices() { return getData(KEYS.invoices); }
    function getInvoice(id) { return getInvoices().find(i => i.id === Number(id)); }
    function getTodayInvoices() { return getInvoices().filter(i => isToday(i.date)); }
    function getCustomerInvoices(cid) { return getInvoices().filter(i => i.customer_id === Number(cid)); }

    function addInvoice(inv) {
        const all = getInvoices();
        inv.id = nextId(all);
        inv.date = inv.date || getToday();

        // Calculate totals
        inv.total_amount = inv.items.reduce((s, it) => s + (it.line_total || 0), 0);

        // Payment logic
        if (inv.payment_type === 'نقدي') {
            inv.cash_amount = inv.total_amount;
            inv.credit_amount = 0;
        } else if (inv.payment_type === 'دين') {
            inv.cash_amount = 0;
            inv.credit_amount = inv.total_amount;
        }
        // For مختلط the values are already set by the form

        inv.cash_amount = Number(inv.cash_amount) || 0;
        inv.credit_amount = Number(inv.credit_amount) || 0;

        all.push(inv);
        setData(KEYS.invoices, all);

        // Reduce stock
        const products = getProducts();
        inv.items.forEach(item => {
            const pidx = products.findIndex(p => p.id === item.product_id);
            if (pidx !== -1) {
                products[pidx].current_stock = Math.max(0, products[pidx].current_stock - item.quantity);
            }
        });
        setData(KEYS.products, products);

        // Add credit to customer balance
        if (inv.credit_amount > 0) {
            const cust = getCustomer(inv.customer_id);
            if (cust) {
                updateCustomer(cust.id, { balance: (cust.balance || 0) + inv.credit_amount });
            }
        }

        return inv;
    }

    // ---- Debt Collections ----
    function getCollections() { return getData(KEYS.collections); }
    function getTodayCollections() { return getCollections().filter(c => isToday(c.date)); }
    function getCustomerCollections(cid) { return getCollections().filter(c => c.customer_id === Number(cid)); }

    function addCollection(col) {
        const all = getCollections();
        col.id = nextId(all);
        col.date = col.date || getToday();
        col.amount = Number(col.amount) || 0;
        all.push(col);
        setData(KEYS.collections, all);

        // Reduce customer balance
        const cust = getCustomer(col.customer_id);
        if (cust) {
            const newBal = Math.max(0, (cust.balance || 0) - col.amount);
            updateCustomer(cust.id, { balance: newBal });
        }

        return col;
    }

    // ---- Expenses ----
    function getExpenses() { return getData(KEYS.expenses); }
    function getTodayExpenses() { return getExpenses().filter(e => isToday(e.date)); }

    function addExpense(exp) {
        const all = getExpenses();
        exp.id = nextId(all);
        exp.date = exp.date || getToday();
        exp.amount = Number(exp.amount) || 0;
        all.push(exp);
        setData(KEYS.expenses, all);
        return exp;
    }

    function deleteExpense(id) {
        let all = getExpenses();
        all = all.filter(e => e.id !== Number(id));
        setData(KEYS.expenses, all);
    }

    // ---- Daily Dashboard Stats ----
    function getDailyStats() {
        const inv = getTodayInvoices();
        const col = getTodayCollections();
        const exp = getTodayExpenses();

        const totalSales = inv.reduce((s, i) => s + i.total_amount, 0);
        const totalCash = inv.reduce((s, i) => s + i.cash_amount, 0);
        const totalCredit = inv.reduce((s, i) => s + i.credit_amount, 0);
        const totalCollections = col.reduce((s, c) => s + c.amount, 0);
        const totalExpenses = exp.reduce((s, e) => s + e.amount, 0);

        let totalProfit = 0;
        inv.forEach(i => {
            (i.items || []).forEach(it => {
                totalProfit += ((it.unit_price || 0) - (it.cost_price || 0)) * (it.quantity || 0);
            });
        });

        return {
            totalSales,
            totalCash,
            cashReceived: totalCash + totalCollections,
            totalCredit,
            totalCollections,
            totalExpenses,
            netCash: totalCash + totalCollections - totalExpenses,
            totalProfit,
            invoiceCount: inv.length,
            todayInvoices: inv,
            todayExpenses: exp,
            todayCollections: col
        };
    }

    // ---- Seed Data ----
    function initSeedData() {
        if (localStorage.getItem(KEYS.initialized)) return;

        const today = getToday();

        const products = [
            { id: 1, name: 'زيت عباد الشمس 1 لتر', purchase_price: 2.5, selling_price: 3.5, unit: 'قطعة', current_stock: 95 },
            { id: 2, name: 'أرز بسمتي 5 كغ', purchase_price: 12, selling_price: 15, unit: 'كيس', current_stock: 48 },
            { id: 3, name: 'سكر أبيض 1 كغ', purchase_price: 3, selling_price: 4, unit: 'كيس', current_stock: 73 },
            { id: 4, name: 'طحين 2 كغ', purchase_price: 4, selling_price: 5.5, unit: 'كيس', current_stock: 58 },
            { id: 5, name: 'شاي أحمر 100 كيس', purchase_price: 5, selling_price: 7, unit: 'علبة', current_stock: 38 },
            { id: 6, name: 'حليب بودرة 400غ', purchase_price: 8, selling_price: 10.5, unit: 'علبة', current_stock: 35 },
            { id: 7, name: 'معجون طماطم 400غ', purchase_price: 2, selling_price: 3, unit: 'علبة', current_stock: 67 },
            { id: 8, name: 'صابون غسيل', purchase_price: 3, selling_price: 4.5, unit: 'قطعة', current_stock: 45 },
            { id: 9, name: 'معكرونة 500غ', purchase_price: 1.5, selling_price: 2.5, unit: 'كيس', current_stock: 86 },
            { id: 10, name: 'زيت زيتون 1 لتر', purchase_price: 15, selling_price: 19, unit: 'قطعة', current_stock: 23 }
        ];

        const customers = [
            { id: 1, name: 'سوبرماركت الأمانة', phone: '0791234567', balance: 150 },
            { id: 2, name: 'بقالة النور', phone: '0797654321', balance: 138 },
            { id: 3, name: 'ميني ماركت الصفا', phone: '0781112233', balance: 19 },
            { id: 4, name: 'سوبرماركت الفرح', phone: '0799887766', balance: 150 },
            { id: 5, name: 'بقالة الشام', phone: '0785556677', balance: 0 }
        ];

        const invoices = [
            {
                id: 1, date: today, customer_id: 1, customer_name: 'سوبرماركت الأمانة',
                payment_type: 'نقدي', cash_amount: 45.5, credit_amount: 0, total_amount: 45.5,
                items: [
                    { product_id: 1, product_name: 'زيت عباد الشمس 1 لتر', quantity: 5, unit_price: 3.5, cost_price: 2.5, line_total: 17.5 },
                    { product_id: 3, product_name: 'سكر أبيض 1 كغ', quantity: 7, unit_price: 4, cost_price: 3, line_total: 28 }
                ], notes: ''
            },
            {
                id: 2, date: today, customer_id: 2, customer_name: 'بقالة النور',
                payment_type: 'دين', cash_amount: 0, credit_amount: 63, total_amount: 63,
                items: [
                    { product_id: 2, product_name: 'أرز بسمتي 5 كغ', quantity: 2, unit_price: 15, cost_price: 12, line_total: 30 },
                    { product_id: 5, product_name: 'شاي أحمر 100 كيس', quantity: 2, unit_price: 7, cost_price: 5, line_total: 14 },
                    { product_id: 9, product_name: 'معكرونة 500غ', quantity: 4, unit_price: 2.5, cost_price: 1.5, line_total: 10 },
                    { product_id: 7, product_name: 'معجون طماطم 400غ', quantity: 3, unit_price: 3, cost_price: 2, line_total: 9 }
                ], notes: ''
            },
            {
                id: 3, date: today, customer_id: 3, customer_name: 'ميني ماركت الصفا',
                payment_type: 'مختلط', cash_amount: 30, credit_amount: 19, total_amount: 49,
                items: [
                    { product_id: 10, product_name: 'زيت زيتون 1 لتر', quantity: 2, unit_price: 19, cost_price: 15, line_total: 38 },
                    { product_id: 4, product_name: 'طحين 2 كغ', quantity: 2, unit_price: 5.5, cost_price: 4, line_total: 11 }
                ], notes: ''
            }
        ];

        const collections = [
            { id: 1, date: today, customer_id: 4, customer_name: 'سوبرماركت الفرح', amount: 50, notes: 'دفعة جزئية' }
        ];

        const expenses = [
            { id: 1, date: today, category: 'ديزل', amount: 25, notes: 'تعبئة الصباح' },
            { id: 2, date: today, category: 'أكل', amount: 8, notes: 'غداء' }
        ];

        setData(KEYS.products, products);
        setData(KEYS.customers, customers);
        setData(KEYS.invoices, invoices);
        setData(KEYS.collections, collections);
        setData(KEYS.expenses, expenses);
        localStorage.setItem(KEYS.initialized, 'true');
    }

    // ---- Public API ----
    return {
        initSeedData,
        getProducts, getProduct, addProduct, updateProduct,
        getCustomers, getCustomer, addCustomer, updateCustomer,
        getInvoices, getInvoice, getTodayInvoices, getCustomerInvoices, addInvoice,
        getCollections, getTodayCollections, getCustomerCollections, addCollection,
        getExpenses, getTodayExpenses, addExpense, deleteExpense,
        getDailyStats, getToday, formatNum
    };
})();
