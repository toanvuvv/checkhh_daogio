// Simple Filter Management JavaScript
let filterConfigs = [];
let currentFilterConfig = null;

// ==================== SIMPLE FILTER FUNCTIONS ====================

async function loadFilterConfigs() {
    try {
        console.log('🔧 SimpleFilter: Loading filter configs...');
        filterConfigs = await window.electronAPI.getAllFilterConfigs() || [];
        console.log('🔧 SimpleFilter: Loaded configs:', filterConfigs);
        displayFilterConfigs();
        console.log('✅ Filter configs loaded successfully:', filterConfigs.length, 'configs');
    } catch (error) {
        console.error('Error loading filter configs:', error);
        showStatus('❌ Lỗi khi load filter configs', 'error');
    }
}

function displayFilterConfigs() {
    const container = document.getElementById('simple-filter-buttons');
    
    if (!container) {
        console.log('Simple filter buttons container not found');
        return;
    }
    
    if (filterConfigs.length === 0) {
        container.innerHTML = '<p style="color: #666; font-size: 12px;">Chưa có filter config nào. Tạo config mới bằng cách nhập điều kiện và click "Lưu Config".</p>';
        return;
    }
    
    container.innerHTML = filterConfigs.map(config => `
        <button class="config-btn" onclick="applyFilterConfig('${config.id}')" title="${config.description || ''}">
            ${config.name}
        </button>
    `).join('');
}

async function applyFilterConfig(configId) {
    if (!configId) {
        showStatus('❌ Config ID không hợp lệ', 'error');
        return;
    }
    
    if (!currentResults || currentResults.length === 0) {
        showStatus('❌ Không có dữ liệu để áp dụng filter. Vui lòng phân tích sản phẩm trước', 'error');
        return;
    }
    
    const config = filterConfigs.find(c => c.id === configId);
    if (!config) {
        showStatus('❌ Không tìm thấy filter config', 'error');
        return;
    }
    
    try {
        // Apply filter conditions to current results
        const filteredResults = applySimpleFilter(currentResults, config.conditions);
        displayResults(filteredResults);
        
        // Update active button
        document.querySelectorAll('.config-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        currentFilterConfig = configId;
        showStatus(`✅ Đã áp dụng filter: ${config.name} (${filteredResults.length}/${currentResults.length} sản phẩm)`, 'success');
        
        // Update form with config values
        loadConfigToForm(config.conditions);
        
    } catch (error) {
        console.error('Error applying filter config:', error);
        showStatus('❌ Lỗi khi áp dụng filter: ' + error.message, 'error');
    }
}

function applySimpleFilter(results, conditions) {
    return results.filter(product => {
        // Commission filter
        if (conditions.commission) {
            const commission = parseFloat(product.commissionRate || product.comm_rate || 0) / 1000; // Convert from basis points to percentage
            if (conditions.commission.min !== undefined && commission < conditions.commission.min) return false;
            if (conditions.commission.max !== undefined && commission > conditions.commission.max) return false;
        }
        
        // Price filter
        if (conditions.price) {
            const price = parseInt(product.price || product.price_min || 0);
            if (conditions.price.min !== undefined && price < conditions.price.min) return false;
            if (conditions.price.max !== undefined && price > conditions.price.max) return false;
        }
        
        // Stock filter
        if (conditions.stock) {
            const stock = parseInt(product.stock || product.status?.stock || 0);
            if (conditions.stock.min !== undefined && stock < conditions.stock.min) return false;
            if (conditions.stock.max !== undefined && stock > conditions.stock.max) return false;
        }
        
        return true;
    });
}

function loadConfigToForm(conditions) {
    // Load commission values
    if (conditions.commission) {
        document.getElementById('commission-min').value = conditions.commission.min || '';
        document.getElementById('commission-max').value = conditions.commission.max || '';
    }
    
    // Load price values
    if (conditions.price) {
        document.getElementById('price-min').value = conditions.price.min || '';
        document.getElementById('price-max').value = conditions.price.max || '';
    }
    
    // Load stock values
    if (conditions.stock) {
        document.getElementById('stock-min').value = conditions.stock.min || '';
        document.getElementById('stock-max').value = conditions.stock.max || '';
    }
}

function showSimpleFilterBuilder() {
    console.log('🔧 showSimpleFilterBuilder called');
    
    // Kiểm tra xem có modal nào đã tồn tại không
    const existingModal = document.querySelector('.simple-filter-modal');
    if (existingModal) {
        console.log('🔧 Modal already exists, removing it');
        existingModal.remove();
    }
    
    // Tạo modal để tạo filter config
    const modal = document.createElement('div');
    modal.className = 'simple-filter-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>💾 Lưu Filter Config</h3>
                <button class="close-btn" onclick="closeSimpleFilterModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="filter-form">
                    <div class="form-group">
                        <label for="config-name">Tên Config:</label>
                        <input type="text" id="config-name" placeholder="Nhập tên config..." maxlength="30">
                    </div>
                    
                    <div class="form-group">
                        <label for="config-description">Mô tả (tùy chọn):</label>
                        <input type="text" id="config-description" placeholder="Mô tả ngắn gọn..." maxlength="100">
                    </div>
                    
                    <div class="current-conditions">
                        <h4>Điều kiện hiện tại:</h4>
                        <div id="current-conditions-display"></div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="saveFilterConfig()">✅ Lưu Config</button>
                    <button class="btn btn-secondary" onclick="closeSimpleFilterModal()">❌ Hủy</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .simple-filter-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }
        .simple-filter-modal .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }
        .simple-filter-modal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        .simple-filter-modal .modal-header h3 {
            margin: 0;
            color: #667eea;
        }
        .simple-filter-modal .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .simple-filter-modal .modal-body {
            padding: 20px;
        }
        .simple-filter-modal .filter-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .simple-filter-modal .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .simple-filter-modal .form-group label {
            font-weight: bold;
            color: #333;
        }
        .simple-filter-modal .form-group input {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        .simple-filter-modal .current-conditions {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
        }
        .simple-filter-modal .current-conditions h4 {
            margin: 0 0 10px 0;
            color: #667eea;
        }
        .simple-filter-modal .condition-item {
            padding: 5px 0;
            color: #666;
            font-size: 14px;
        }
        .simple-filter-modal .modal-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            justify-content: flex-end;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    console.log('🔧 Modal created and added to DOM');
    
    // Display current conditions
    displayCurrentConditions();
    
    // Focus on name input
    setTimeout(() => {
        const nameInput = document.getElementById('config-name');
        if (nameInput) {
            nameInput.focus();
        }
    }, 100);
}

function displayCurrentConditions() {
    console.log('🔧 displayCurrentConditions called');
    const container = document.getElementById('current-conditions-display');
    const conditions = getCurrentFilterConditions();
    
    console.log('🔧 Current conditions:', conditions);
    
    if (Object.keys(conditions).length === 0) {
        container.innerHTML = '<p style="color: #999; font-style: italic;">Chưa có điều kiện nào được thiết lập</p>';
        return;
    }
    
    let html = '';
    
    if (conditions.commission) {
        const min = conditions.commission.min !== undefined ? conditions.commission.min + '%' : 'không giới hạn';
        const max = conditions.commission.max !== undefined ? conditions.commission.max + '%' : 'không giới hạn';
        html += `<div class="condition-item">💰 Hoa hồng: ${min} - ${max}</div>`;
    }
    
    if (conditions.price) {
        const min = conditions.price.min !== undefined ? formatPrice(conditions.price.min) : 'không giới hạn';
        const max = conditions.price.max !== undefined ? formatPrice(conditions.price.max) : 'không giới hạn';
        html += `<div class="condition-item">💵 Giá: ${min} - ${max}</div>`;
    }
    
    if (conditions.stock) {
        const min = conditions.stock.min !== undefined ? conditions.stock.min : 'không giới hạn';
        const max = conditions.stock.max !== undefined ? conditions.stock.max : 'không giới hạn';
        html += `<div class="condition-item">📦 Tồn kho: ${min} - ${max}</div>`;
    }
    
    container.innerHTML = html;
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function getCurrentFilterConditions() {
    console.log('🔧 getCurrentFilterConditions called');
    const conditions = {};
    
    // Commission conditions
    const commissionMin = document.getElementById('commission-min').value;
    const commissionMax = document.getElementById('commission-max').value;
    console.log('🔧 Commission values:', { commissionMin, commissionMax });
    if (commissionMin || commissionMax) {
        conditions.commission = {};
        if (commissionMin) conditions.commission.min = parseFloat(commissionMin);
        if (commissionMax) conditions.commission.max = parseFloat(commissionMax);
    }
    
    // Price conditions
    const priceMin = document.getElementById('price-min').value;
    const priceMax = document.getElementById('price-max').value;
    console.log('🔧 Price values:', { priceMin, priceMax });
    if (priceMin || priceMax) {
        conditions.price = {};
        if (priceMin) conditions.price.min = parseInt(priceMin);
        if (priceMax) conditions.price.max = parseInt(priceMax);
    }
    
    // Stock conditions
    const stockMin = document.getElementById('stock-min').value;
    const stockMax = document.getElementById('stock-max').value;
    console.log('🔧 Stock values:', { stockMin, stockMax });
    if (stockMin || stockMax) {
        conditions.stock = {};
        if (stockMin) conditions.stock.min = parseInt(stockMin);
        if (stockMax) conditions.stock.max = parseInt(stockMax);
    }
    
    console.log('🔧 Final conditions:', conditions);
    return conditions;
}

async function saveFilterConfig() {
    console.log('🔧 saveFilterConfig called');
    const name = document.getElementById('config-name').value.trim();
    const description = document.getElementById('config-description').value.trim();
    
    console.log('🔧 Config name:', name);
    console.log('🔧 Config description:', description);
    
    if (!name) {
        showStatus('❌ Tên config không được để trống', 'error');
        return;
    }
    
    if (name.length < 2) {
        showStatus('❌ Tên config phải có ít nhất 2 ký tự', 'error');
        return;
    }
    
    const conditions = getCurrentFilterConditions();
    
    if (Object.keys(conditions).length === 0) {
        showStatus('❌ Phải có ít nhất một điều kiện filter', 'error');
        return;
    }
    
    try {
        console.log('🔧 Calling createFilterConfig with:', { name, description, conditions });
        const success = await window.electronAPI.createFilterConfig(name, {
            description,
            conditions
        });
        
        console.log('🔧 createFilterConfig result:', success);
        
        if (success) {
            showStatus(`✅ Đã lưu filter config: ${name}`, 'success');
            closeSimpleFilterModal();
            loadFilterConfigs();
        } else {
            showStatus('❌ Có lỗi khi lưu filter config', 'error');
        }
    } catch (error) {
        console.error('Error saving filter config:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

function closeSimpleFilterModal() {
    const modal = document.querySelector('.simple-filter-modal');
    if (modal) {
        modal.remove();
    }
}

function applyCurrentFilter() {
    if (!currentResults || currentResults.length === 0) {
        showStatus('❌ Không có dữ liệu để áp dụng filter. Vui lòng phân tích sản phẩm trước', 'error');
        return;
    }
    
    const conditions = getCurrentFilterConditions();
    
    if (Object.keys(conditions).length === 0) {
        // No filter conditions, show all results
        displayResults(currentResults);
        showStatus(`✅ Hiển thị tất cả ${currentResults.length} sản phẩm`, 'info');
        return;
    }
    
    try {
        const filteredResults = applySimpleFilter(currentResults, conditions);
        displayResults(filteredResults);
        showStatus(`✅ Đã lọc: ${filteredResults.length}/${currentResults.length} sản phẩm phù hợp`, 'success');
        
        // Clear active config button
        document.querySelectorAll('.config-btn').forEach(btn => btn.classList.remove('active'));
        currentFilterConfig = null;
        
    } catch (error) {
        console.error('Error applying current filter:', error);
        showStatus('❌ Lỗi khi áp dụng filter: ' + error.message, 'error');
    }
}

function clearCurrentFilter() {
    // Clear all filter inputs
    document.getElementById('commission-min').value = '';
    document.getElementById('commission-max').value = '';
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('stock-min').value = '';
    document.getElementById('stock-max').value = '';
    
    // Clear active config button
    document.querySelectorAll('.config-btn').forEach(btn => btn.classList.remove('active'));
    currentFilterConfig = null;
    
    // Show all results
    if (currentResults && currentResults.length > 0) {
        displayResults(currentResults);
        showStatus(`✅ Đã xóa filter, hiển thị tất cả ${currentResults.length} sản phẩm`, 'info');
    }
}

// ==================== FILTER CONFIG MANAGEMENT ====================

function manageFilterConfigs() {
    // Tạo modal để quản lý filter configs
    const modal = document.createElement('div');
    modal.className = 'filter-config-management-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>⚙️ Quản lý Filter Configs</h3>
                <button class="close-btn" onclick="closeFilterConfigManagementModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="config-list" id="filter-config-list">
                    <!-- Config list will be populated here -->
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="showSimpleFilterBuilder()">➕ Tạo Config Mới</button>
                    <button class="btn btn-secondary" onclick="exportFilterConfigs()">📤 Export</button>
                    <button class="btn btn-warning" onclick="importFilterConfigs()">📥 Import</button>
                    <button class="btn btn-danger" onclick="clearAllFilterConfigs()">🗑️ Xóa tất cả</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .filter-config-management-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }
        .filter-config-management-modal .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
        }
        .filter-config-management-modal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        .filter-config-management-modal .modal-header h3 {
            margin: 0;
            color: #667eea;
        }
        .filter-config-management-modal .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .filter-config-management-modal .modal-body {
            padding: 20px;
        }
        .config-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin: 10px 0;
            background: #f8f9fa;
        }
        .config-info h4 {
            margin: 0 0 5px 0;
            color: #333;
        }
        .config-info p {
            margin: 0;
            font-size: 12px;
            color: #666;
        }
        .config-actions {
            display: flex;
            gap: 5px;
        }
        .filter-config-management-modal .modal-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    displayFilterConfigList();
}

function displayFilterConfigList() {
    const container = document.getElementById('filter-config-list');
    
    if (filterConfigs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Chưa có filter config nào</p>';
        return;
    }
    
    container.innerHTML = filterConfigs.map(config => {
        const conditionsText = getConditionsText(config.conditions);
        return `
            <div class="config-item">
                <div class="config-info">
                    <h4>${config.name}</h4>
                    <p>${config.description || 'Không có mô tả'}</p>
                    <p style="color: #667eea; font-weight: 500;">${conditionsText}</p>
                </div>
                <div class="config-actions">
                    <button class="btn btn-primary btn-small" onclick="useFilterConfig('${config.id}')">Sử dụng</button>
                    <button class="btn btn-danger btn-small" onclick="deleteFilterConfig('${config.id}')">Xóa</button>
                </div>
            </div>
        `;
    }).join('');
}

function getConditionsText(conditions) {
    const parts = [];
    
    if (conditions.commission) {
        const min = conditions.commission.min !== undefined ? conditions.commission.min + '%' : '';
        const max = conditions.commission.max !== undefined ? conditions.commission.max + '%' : '';
        if (min && max) parts.push(`Hoa hồng: ${min}-${max}`);
        else if (min) parts.push(`Hoa hồng: ≥${min}`);
        else if (max) parts.push(`Hoa hồng: ≤${max}`);
    }
    
    if (conditions.price) {
        const min = conditions.price.min !== undefined ? (conditions.price.min / 1000) + 'k' : '';
        const max = conditions.price.max !== undefined ? (conditions.price.max / 1000) + 'k' : '';
        if (min && max) parts.push(`Giá: ${min}-${max}`);
        else if (min) parts.push(`Giá: ≥${min}`);
        else if (max) parts.push(`Giá: ≤${max}`);
    }
    
    if (conditions.stock) {
        const min = conditions.stock.min !== undefined ? conditions.stock.min : '';
        const max = conditions.stock.max !== undefined ? conditions.stock.max : '';
        if (min && max) parts.push(`Tồn kho: ${min}-${max}`);
        else if (min) parts.push(`Tồn kho: ≥${min}`);
        else if (max) parts.push(`Tồn kho: ≤${max}`);
    }
    
    return parts.join(' | ') || 'Không có điều kiện';
}

function closeFilterConfigManagementModal() {
    const modal = document.querySelector('.filter-config-management-modal');
    if (modal) {
        modal.remove();
    }
}

async function useFilterConfig(configId) {
    await applyFilterConfig(configId);
    closeFilterConfigManagementModal();
}

async function deleteFilterConfig(configId) {
    if (!configId) {
        showStatus('❌ Config ID không hợp lệ', 'error');
        return;
    }
    
    const config = filterConfigs.find(c => c.id === configId);
    if (!config) {
        showStatus('❌ Không tìm thấy filter config', 'error');
        return;
    }
    
    if (!confirm(`Bạn có chắc chắn muốn xóa filter config "${config.name}"?`)) {
        return;
    }
    
    try {
        const success = await window.electronAPI.deleteFilterConfig(configId);
        if (success) {
            showStatus(`✅ Đã xóa filter config: ${config.name}`, 'success');
            loadFilterConfigs();
            displayFilterConfigList();
        } else {
            showStatus('❌ Có lỗi khi xóa filter config', 'error');
        }
    } catch (error) {
        console.error('Error deleting filter config:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function exportFilterConfigs() {
    try {
        const success = await window.electronAPI.exportFilterConfigs();
        if (success) {
            showStatus('✅ Đã export filter configs thành công', 'success');
        } else {
            showStatus('❌ Có lỗi khi export filter configs', 'error');
        }
    } catch (error) {
        console.error('Error exporting filter configs:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function importFilterConfigs() {
    try {
        const success = await window.electronAPI.importFilterConfigs();
        if (success) {
            showStatus('✅ Đã import filter configs thành công', 'success');
            loadFilterConfigs();
            displayFilterConfigList();
        } else {
            showStatus('❌ Có lỗi khi import filter configs', 'error');
        }
    } catch (error) {
        console.error('Error importing filter configs:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function clearAllFilterConfigs() {
    if (!confirm('Bạn có chắc chắn muốn xóa TẤT CẢ filter configs? Hành động này không thể hoàn tác!')) {
        return;
    }
    
    try {
        const success = await window.electronAPI.clearAllFilterConfigs();
        if (success) {
            showStatus('✅ Đã xóa tất cả filter configs', 'success');
            loadFilterConfigs();
            displayFilterConfigList();
        } else {
            showStatus('❌ Có lỗi khi xóa filter configs', 'error');
        }
    } catch (error) {
        console.error('Error clearing filter configs:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

// ==================== TEST FUNCTIONS ====================

function testShowSimpleFilterBuilder() {
    console.log('🧪 Test: showSimpleFilterBuilder function exists:', typeof showSimpleFilterBuilder);
    console.log('🧪 Test: Calling showSimpleFilterBuilder...');
    try {
        showSimpleFilterBuilder();
        console.log('🧪 Test: showSimpleFilterBuilder called successfully');
    } catch (error) {
        console.error('🧪 Test: Error calling showSimpleFilterBuilder:', error);
    }
}

// ==================== INITIALIZATION ====================

// Load filter configs when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        loadFilterConfigs();
    }
});

// Handle page navigation
function onSimpleFilterPageShow() {
    if (window.electronAPI) {
        loadFilterConfigs();
    } else {
        console.log('electronAPI not ready in onSimpleFilterPageShow');
    }
}
