/* ==============================================
   الأصناف — Products Management
   ============================================== */
const ProductsPage = (function () {

    function stockLevel(stock) {
        if (stock <= 10) return 'low';
        if (stock <= 30) return 'medium';
        return 'high';
    }

    function render() {
        const products = DB.getProducts();

        let list = '';
        if (products.length === 0) {
            list = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <div class="empty-state-text">لا توجد أصناف</div>
                    <div class="empty-state-sub">أضف أصنافك للبدء</div>
                </div>`;
        } else {
            list = products.map(p => `
                <div class="card card-clickable product-edit-card" data-id="${p.id}">
                    <div class="product-card">
                        <div class="product-stock-indicator stock-${stockLevel(p.current_stock)}"></div>
                        <div class="product-info">
                            <div class="list-item-title">${p.name}</div>
                            <div class="product-prices">
                                <div class="product-price">شراء: <span>${DB.formatNum(p.purchase_price)}</span></div>
                                <div class="product-price">بيع: <span>${DB.formatNum(p.selling_price)}</span></div>
                            </div>
                        </div>
                        <div class="product-stock">
                            <div class="product-stock-value ${stockLevel(p.current_stock) === 'low' ? 'text-danger' : ''}">${p.current_stock}</div>
                            <div class="product-stock-unit">${p.unit}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        return `
            <div class="search-bar">
                <svg class="search-bar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input type="text" id="product-search-input" placeholder="ابحث عن صنف...">
            </div>
            <div id="products-list">${list}</div>
            <button class="fab" id="add-product-fab">+</button>
        `;
    }

    function init() {
        // Search
        const searchInput = document.getElementById('product-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                const products = DB.getProducts();
                const filtered = query ? products.filter(p => p.name.includes(query)) : products;
                const listEl = document.getElementById('products-list');

                if (filtered.length === 0) {
                    listEl.innerHTML = '<div class="empty-state" style="padding:var(--space-md);"><div class="empty-state-text">لا توجد نتائج</div></div>';
                } else {
                    listEl.innerHTML = filtered.map(p => `
                        <div class="card card-clickable product-edit-card" data-id="${p.id}">
                            <div class="product-card">
                                <div class="product-stock-indicator stock-${stockLevel(p.current_stock)}"></div>
                                <div class="product-info">
                                    <div class="list-item-title">${p.name}</div>
                                    <div class="product-prices">
                                        <div class="product-price">شراء: <span>${DB.formatNum(p.purchase_price)}</span></div>
                                        <div class="product-price">بيع: <span>${DB.formatNum(p.selling_price)}</span></div>
                                    </div>
                                </div>
                                <div class="product-stock">
                                    <div class="product-stock-value ${stockLevel(p.current_stock) === 'low' ? 'text-danger' : ''}">${p.current_stock}</div>
                                    <div class="product-stock-unit">${p.unit}</div>
                                </div>
                            </div>
                        </div>
                    `).join('');
                    bindEditCards();
                }
            });
        }

        // Add product FAB
        const fab = document.getElementById('add-product-fab');
        if (fab) {
            fab.addEventListener('click', showAddProductModal);
        }

        bindEditCards();
    }

    function bindEditCards() {
        document.querySelectorAll('.product-edit-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = Number(card.dataset.id);
                showEditProductModal(id);
            });
        });
    }

    function showAddProductModal() {
        App.showModal('إضافة صنف جديد', `
            <div class="form-group">
                <label class="form-label">اسم الصنف</label>
                <input type="text" class="form-input" id="prod-name" placeholder="مثال: زيت, أرز, سكر">
            </div>
            <div class="form-group">
                <label class="form-label">الوحدة</label>
                <input type="text" class="form-input" id="prod-unit" placeholder="مثال: كرتون, قطعة, كيلو, كيس">
            </div>
            <div class="form-group">
                <label class="form-label">سعر الشراء</label>
                <input type="number" class="form-input" id="prod-purchase" min="0" step="0.01" placeholder="0.00">
            </div>
            <div class="form-group">
                <label class="form-label">سعر البيع</label>
                <input type="number" class="form-input" id="prod-selling" min="0" step="0.01" placeholder="0.00">
            </div>
            <div class="form-group">
                <label class="form-label">المخزون الحالي</label>
                <input type="number" class="form-input" id="prod-stock" min="0" step="1" placeholder="0">
            </div>
            <button type="button" class="btn btn-primary" id="save-new-product">حفظ الصنف</button>
        `);

        document.getElementById('save-new-product').addEventListener('click', () => {
            const name = document.getElementById('prod-name').value.trim();
            if (!name) { App.toast('الرجاء إدخال اسم الصنف', 'error'); return; }

            DB.addProduct({
                name,
                unit: document.getElementById('prod-unit').value.trim() || 'قطعة',
                purchase_price: Number(document.getElementById('prod-purchase').value) || 0,
                selling_price: Number(document.getElementById('prod-selling').value) || 0,
                current_stock: Number(document.getElementById('prod-stock').value) || 0
            });

            App.closeModal();
            App.toast('تم إضافة الصنف بنجاح ✓', 'success');
            window.location.hash = '#products';
        });
    }

    function showEditProductModal(id) {
        const p = DB.getProduct(id);
        if (!p) return;

        App.showModal('تعديل الصنف', `
            <div class="form-group">
                <label class="form-label">اسم الصنف</label>
                <input type="text" class="form-input" id="edit-prod-name" value="${p.name}">
            </div>
            <div class="form-group">
                <label class="form-label">الوحدة</label>
                <input type="text" class="form-input" id="edit-prod-unit" value="${p.unit}">
            </div>
            <div class="form-group">
                <label class="form-label">سعر الشراء</label>
                <input type="number" class="form-input" id="edit-prod-purchase" min="0" step="0.01" value="${p.purchase_price}">
            </div>
            <div class="form-group">
                <label class="form-label">سعر البيع</label>
                <input type="number" class="form-input" id="edit-prod-selling" min="0" step="0.01" value="${p.selling_price}">
            </div>
            <div class="form-group">
                <label class="form-label">المخزون الحالي</label>
                <input type="number" class="form-input" id="edit-prod-stock" min="0" step="1" value="${p.current_stock}">
            </div>
            <button type="button" class="btn btn-primary" id="save-edit-product">حفظ التعديلات</button>
        `);

        document.getElementById('save-edit-product').addEventListener('click', () => {
            const name = document.getElementById('edit-prod-name').value.trim();
            if (!name) { App.toast('الرجاء إدخال اسم الصنف', 'error'); return; }

            DB.updateProduct(id, {
                name,
                unit: document.getElementById('edit-prod-unit').value.trim() || 'قطعة',
                purchase_price: Number(document.getElementById('edit-prod-purchase').value) || 0,
                selling_price: Number(document.getElementById('edit-prod-selling').value) || 0,
                current_stock: Number(document.getElementById('edit-prod-stock').value) || 0
            });

            App.closeModal();
            App.toast('تم تحديث الصنف بنجاح ✓', 'success');
            window.location.hash = '#products';
        });
    }

    return { render, init };
})();
