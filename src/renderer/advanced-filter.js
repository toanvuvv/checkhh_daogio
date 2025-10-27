// Advanced Filter Management JavaScript
let advancedFilters = [];
let currentAdvancedFilterId = null;

// ==================== ADVANCED FILTER FUNCTIONS ====================

async function loadAdvancedFilters() {
    try {
        advancedFilters = await window.electronAPI.getAllAdvancedFilters();
        displayAdvancedFilters();
        console.log('✅ Advanced filters loaded successfully:', advancedFilters.length, 'filters');
    } catch (error) {
        console.error('Error loading advanced filters:', error);
        showStatus('❌ Lỗi khi load advanced filters', 'error');
    }
}

function displayAdvancedFilters() {
    const container = document.getElementById('advanced-filter-buttons');
    
    if (!container) {
        console.log('Advanced filter buttons container not found');
        return;
    }
    
    if (advancedFilters.length === 0) {
        container.innerHTML = '<p style="color: #666; font-size: 12px;">Chưa có advanced filter nào. Click "Tạo Advanced Filter" để tạo.</p>';
        return;
    }
    
    container.innerHTML = advancedFilters.map(filter => `
        <button class="advanced-filter-btn" onclick="applyAdvancedFilter('${filter.id}')" title="${filter.description || ''}">
            ${filter.name}
        </button>
    `).join('');
}

async function applyAdvancedFilter(filterId) {
    if (!filterId) {
        showStatus('❌ Filter ID không hợp lệ', 'error');
        return;
    }
    
    if (!currentResults || currentResults.length === 0) {
        showStatus('❌ Không có dữ liệu để áp dụng filter. Vui lòng phân tích sản phẩm trước', 'error');
        return;
    }
    
    const filter = advancedFilters.find(f => f.id === filterId);
    if (!filter) {
        showStatus('❌ Không tìm thấy filter', 'error');
        return;
    }
    
    try {
        const filteredResults = await window.electronAPI.applyAdvancedFilter(currentResults, filterId);
        displayResults(filteredResults);
        
        // Update active button
        document.querySelectorAll('.advanced-filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        currentAdvancedFilterId = filterId;
        showStatus(`✅ Đã áp dụng advanced filter: ${filter.name}`, 'success');
        
    } catch (error) {
        console.error('Error applying advanced filter:', error);
        showStatus('❌ Lỗi khi áp dụng advanced filter: ' + error.message, 'error');
    }
}

function showAdvancedFilterBuilder() {
    // Tạo modal để tạo advanced filter
    const modal = document.createElement('div');
    modal.className = 'advanced-filter-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🔧 Advanced Filter Builder</h3>
                <button class="close-btn" onclick="closeAdvancedFilterModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="filter-form">
                    <div class="form-group">
                        <label for="filter-name">Tên Filter:</label>
                        <input type="text" id="filter-name" placeholder="Nhập tên filter..." maxlength="50">
                    </div>
                    
                    <div class="form-group">
                        <label for="filter-description">Mô tả:</label>
                        <textarea id="filter-description" placeholder="Mô tả filter..." maxlength="200"></textarea>
                    </div>
                    
                    <!-- Commission Filter -->
                    <div class="filter-section">
                        <h4>💰 Hoa Hồng (%)</h4>
                        <div class="filter-options">
                            <label><input type="radio" name="commission-type" value="range" checked> Khoảng</label>
                            <label><input type="radio" name="commission-type" value="exact"> Chính xác</label>
                            <label><input type="radio" name="commission-type" value="custom"> Tùy chỉnh</label>
                        </div>
                        
                        <div id="commission-range" class="range-inputs">
                            <input type="number" id="commission-min" placeholder="Từ (%)" min="0" max="100" step="0.1">
                            <span>-</span>
                            <input type="number" id="commission-max" placeholder="Đến (%)" min="0" max="100" step="0.1">
                        </div>
                        
                        <div id="commission-exact" class="exact-input" style="display: none;">
                            <input type="number" id="commission-exact-value" placeholder="Giá trị chính xác (%)" min="0" max="100" step="0.1">
                        </div>
                        
                        <div id="commission-custom" class="custom-ranges" style="display: none;">
                            <div class="custom-range-item">
                                <input type="number" placeholder="Từ" min="0" max="100" step="0.1">
                                <span>-</span>
                                <input type="number" placeholder="Đến" min="0" max="100" step="0.1">
                                <input type="text" placeholder="Nhãn" maxlength="20">
                                <button type="button" onclick="removeCustomRange(this)">Xóa</button>
                            </div>
                            <button type="button" onclick="addCustomRange('commission')">+ Thêm khoảng</button>
                        </div>
                    </div>
                    
                    <!-- Price Filter -->
                    <div class="filter-section">
                        <h4>💵 Giá (VND)</h4>
                        <div class="filter-options">
                            <label><input type="radio" name="price-type" value="range" checked> Khoảng</label>
                            <label><input type="radio" name="price-type" value="exact"> Chính xác</label>
                            <label><input type="radio" name="price-type" value="custom"> Tùy chỉnh</label>
                        </div>
                        
                        <div id="price-range" class="range-inputs">
                            <input type="number" id="price-min" placeholder="Từ (VND)" min="0" step="1000">
                            <span>-</span>
                            <input type="number" id="price-max" placeholder="Đến (VND)" min="0" step="1000">
                        </div>
                        
                        <div id="price-exact" class="exact-input" style="display: none;">
                            <input type="number" id="price-exact-value" placeholder="Giá chính xác (VND)" min="0" step="1000">
                        </div>
                        
                        <div id="price-custom" class="custom-ranges" style="display: none;">
                            <div class="custom-range-item">
                                <input type="number" placeholder="Từ" min="0" step="1000">
                                <span>-</span>
                                <input type="number" placeholder="Đến" min="0" step="1000">
                                <input type="text" placeholder="Nhãn" maxlength="20">
                                <button type="button" onclick="removeCustomRange(this)">Xóa</button>
                            </div>
                            <button type="button" onclick="addCustomRange('price')">+ Thêm khoảng</button>
                        </div>
                    </div>
                    
                    <!-- Stock Filter -->
                    <div class="filter-section">
                        <h4>📦 Tồn Kho</h4>
                        <div class="filter-options">
                            <label><input type="radio" name="stock-type" value="range" checked> Khoảng</label>
                            <label><input type="radio" name="stock-type" value="exact"> Chính xác</label>
                            <label><input type="radio" name="stock-type" value="custom"> Tùy chỉnh</label>
                        </div>
                        
                        <div id="stock-range" class="range-inputs">
                            <input type="number" id="stock-min" placeholder="Từ" min="0">
                            <span>-</span>
                            <input type="number" id="stock-max" placeholder="Đến" min="0">
                        </div>
                        
                        <div id="stock-exact" class="exact-input" style="display: none;">
                            <input type="number" id="stock-exact-value" placeholder="Số lượng chính xác" min="0">
                        </div>
                        
                        <div id="stock-custom" class="custom-ranges" style="display: none;">
                            <div class="custom-range-item">
                                <input type="number" placeholder="Từ" min="0">
                                <span>-</span>
                                <input type="number" placeholder="Đến" min="0">
                                <input type="text" placeholder="Nhãn" maxlength="20">
                                <button type="button" onclick="removeCustomRange(this)">Xóa</button>
                            </div>
                            <button type="button" onclick="addCustomRange('stock')">+ Thêm khoảng</button>
                        </div>
                    </div>
                    
                    <!-- Status Filter -->
                    <div class="filter-section">
                        <h4>📊 Trạng Thái</h4>
                        <div class="status-options">
                            <label><input type="checkbox" id="status-valid"> Chỉ sản phẩm hợp lệ</label>
                            <label><input type="checkbox" id="status-invalid"> Chỉ sản phẩm không hợp lệ</label>
                        </div>
                        
                        <div class="issue-options">
                            <h5>Vấn đề:</h5>
                            <label><input type="checkbox" id="issue-deleted"> Đã xóa</label>
                            <label><input type="checkbox" id="issue-unlisted"> Đã ẩn</label>
                            <label><input type="checkbox" id="issue-prohibited"> Bị cấm</label>
                            <label><input type="checkbox" id="issue-out-of-stock"> Hết hàng</label>
                            <label><input type="checkbox" id="issue-inactive"> Không hoạt động</label>
                        </div>
                    </div>
                    
                    <!-- Custom Fields -->
                    <div class="filter-section">
                        <h4>🎯 Trường Tùy Chỉnh</h4>
                        <div id="custom-fields">
                            <div class="custom-field-item">
                                <select>
                                    <option value="price">Giá</option>
                                    <option value="commission">Hoa hồng</option>
                                    <option value="stock">Tồn kho</option>
                                    <option value="sold">Đã bán</option>
                                    <option value="discount">Giảm giá</option>
                                </select>
                                <select>
                                    <option value="between">Trong khoảng</option>
                                    <option value="greater">Lớn hơn</option>
                                    <option value="less">Nhỏ hơn</option>
                                    <option value="equal">Bằng</option>
                                </select>
                                <input type="number" placeholder="Giá trị" min="0">
                                <input type="number" placeholder="Giá trị 2 (nếu cần)" min="0">
                                <button type="button" onclick="removeCustomField(this)">Xóa</button>
                            </div>
                        </div>
                        <button type="button" onclick="addCustomField()">+ Thêm trường</button>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="createAdvancedFilter()">✅ Tạo Filter</button>
                    <button class="btn btn-secondary" onclick="previewAdvancedFilter()">👁️ Xem trước</button>
                    <button class="btn btn-danger" onclick="closeAdvancedFilterModal()">❌ Hủy</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .advanced-filter-modal {
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
        .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        .modal-header h3 {
            margin: 0;
            color: #667eea;
        }
        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .modal-body {
            padding: 20px;
        }
        .filter-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .form-group label {
            font-weight: bold;
            color: #333;
        }
        .form-group input, .form-group textarea {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        .filter-section {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            background: #f8f9fa;
        }
        .filter-section h4 {
            margin: 0 0 15px 0;
            color: #667eea;
        }
        .filter-options {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
        }
        .filter-options label {
            display: flex;
            align-items: center;
            gap: 5px;
            font-weight: normal;
        }
        .range-inputs {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .range-inputs input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .exact-input input {
            width: 200px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .custom-ranges {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .custom-range-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: white;
            border-radius: 5px;
            border: 1px solid #ddd;
        }
        .custom-range-item input {
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 3px;
        }
        .custom-range-item button {
            padding: 5px 10px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        .status-options, .issue-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .status-options label, .issue-options label {
            display: flex;
            align-items: center;
            gap: 5px;
            font-weight: normal;
        }
        .custom-field-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: white;
            border-radius: 5px;
            border: 1px solid #ddd;
            margin-bottom: 10px;
        }
        .custom-field-item select, .custom-field-item input {
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 3px;
        }
        .custom-field-item button {
            padding: 5px 10px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        .modal-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            justify-content: flex-end;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Add event listeners for radio buttons
    addFilterTypeListeners();
}

function addFilterTypeListeners() {
    // Commission type listeners
    document.querySelectorAll('input[name="commission-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('commission-range').style.display = this.value === 'range' ? 'flex' : 'none';
            document.getElementById('commission-exact').style.display = this.value === 'exact' ? 'block' : 'none';
            document.getElementById('commission-custom').style.display = this.value === 'custom' ? 'block' : 'none';
        });
    });
    
    // Price type listeners
    document.querySelectorAll('input[name="price-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('price-range').style.display = this.value === 'range' ? 'flex' : 'none';
            document.getElementById('price-exact').style.display = this.value === 'exact' ? 'block' : 'none';
            document.getElementById('price-custom').style.display = this.value === 'custom' ? 'block' : 'none';
        });
    });
    
    // Stock type listeners
    document.querySelectorAll('input[name="stock-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('stock-range').style.display = this.value === 'range' ? 'flex' : 'none';
            document.getElementById('stock-exact').style.display = this.value === 'exact' ? 'block' : 'none';
            document.getElementById('stock-custom').style.display = this.value === 'custom' ? 'block' : 'none';
        });
    });
}

function addCustomRange(type) {
    const container = document.getElementById(`${type}-custom`);
    const rangeItem = document.createElement('div');
    rangeItem.className = 'custom-range-item';
    rangeItem.innerHTML = `
        <input type="number" placeholder="Từ" min="0" ${type === 'commission' ? 'step="0.1"' : type === 'price' ? 'step="1000"' : ''}>
        <span>-</span>
        <input type="number" placeholder="Đến" min="0" ${type === 'commission' ? 'step="0.1"' : type === 'price' ? 'step="1000"' : ''}>
        <input type="text" placeholder="Nhãn" maxlength="20">
        <button type="button" onclick="removeCustomRange(this)">Xóa</button>
    `;
    container.appendChild(rangeItem);
}

function removeCustomRange(button) {
    button.parentElement.remove();
}

function addCustomField() {
    const container = document.getElementById('custom-fields');
    const fieldItem = document.createElement('div');
    fieldItem.className = 'custom-field-item';
    fieldItem.innerHTML = `
        <select>
            <option value="price">Giá</option>
            <option value="commission">Hoa hồng</option>
            <option value="stock">Tồn kho</option>
            <option value="sold">Đã bán</option>
            <option value="discount">Giảm giá</option>
        </select>
        <select>
            <option value="between">Trong khoảng</option>
            <option value="greater">Lớn hơn</option>
            <option value="less">Nhỏ hơn</option>
            <option value="equal">Bằng</option>
        </select>
        <input type="number" placeholder="Giá trị" min="0">
        <input type="number" placeholder="Giá trị 2 (nếu cần)" min="0">
        <button type="button" onclick="removeCustomField(this)">Xóa</button>
    `;
    container.appendChild(fieldItem);
}

function removeCustomField(button) {
    button.parentElement.remove();
}

async function createAdvancedFilter() {
    const name = document.getElementById('filter-name').value.trim();
    const description = document.getElementById('filter-description').value.trim();
    
    if (!name) {
        showStatus('❌ Tên filter không được để trống', 'error');
        return;
    }
    
    if (name.length < 3) {
        showStatus('❌ Tên filter phải có ít nhất 3 ký tự', 'error');
        return;
    }
    
    if (name.length > 50) {
        showStatus('❌ Tên filter không được quá 50 ký tự', 'error');
        return;
    }
    
    try {
        const conditions = collectFilterConditions();
        
        const success = await window.electronAPI.createAdvancedFilter(name, {
            description,
            conditions
        });
        
        if (success) {
            showStatus(`✅ Đã tạo advanced filter: ${name}`, 'success');
            closeAdvancedFilterModal();
            loadAdvancedFilters();
        } else {
            showStatus('❌ Có lỗi khi tạo advanced filter', 'error');
        }
    } catch (error) {
        console.error('Error creating advanced filter:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

function collectFilterConditions() {
    const conditions = {};
    
    // Commission conditions
    const commissionType = document.querySelector('input[name="commission-type"]:checked').value;
    if (commissionType === 'range') {
        const min = document.getElementById('commission-min').value;
        const max = document.getElementById('commission-max').value;
        if (min || max) {
            conditions.commission = {};
            if (min) conditions.commission.min = parseFloat(min);
            if (max) conditions.commission.max = parseFloat(max);
        }
    } else if (commissionType === 'exact') {
        const exact = document.getElementById('commission-exact-value').value;
        if (exact) {
            conditions.commission = { exact: parseFloat(exact) };
        }
    } else if (commissionType === 'custom') {
        const ranges = [];
        document.querySelectorAll('#commission-custom .custom-range-item').forEach(item => {
            const inputs = item.querySelectorAll('input');
            if (inputs[0].value && inputs[1].value) {
                ranges.push({
                    min: parseFloat(inputs[0].value),
                    max: parseFloat(inputs[1].value),
                    label: inputs[2].value || `${inputs[0].value}% - ${inputs[1].value}%`
                });
            }
        });
        if (ranges.length > 0) {
            conditions.commission = { ranges };
        }
    }
    
    // Price conditions
    const priceType = document.querySelector('input[name="price-type"]:checked').value;
    if (priceType === 'range') {
        const min = document.getElementById('price-min').value;
        const max = document.getElementById('price-max').value;
        if (min || max) {
            conditions.price = {};
            if (min) conditions.price.min = parseInt(min);
            if (max) conditions.price.max = parseInt(max);
        }
    } else if (priceType === 'exact') {
        const exact = document.getElementById('price-exact-value').value;
        if (exact) {
            conditions.price = { exact: parseInt(exact) };
        }
    } else if (priceType === 'custom') {
        const ranges = [];
        document.querySelectorAll('#price-custom .custom-range-item').forEach(item => {
            const inputs = item.querySelectorAll('input');
            if (inputs[0].value && inputs[1].value) {
                ranges.push({
                    min: parseInt(inputs[0].value),
                    max: parseInt(inputs[1].value),
                    label: inputs[2].value || `${inputs[0].value} - ${inputs[1].value}`
                });
            }
        });
        if (ranges.length > 0) {
            conditions.price = { ranges };
        }
    }
    
    // Stock conditions
    const stockType = document.querySelector('input[name="stock-type"]:checked').value;
    if (stockType === 'range') {
        const min = document.getElementById('stock-min').value;
        const max = document.getElementById('stock-max').value;
        if (min || max) {
            conditions.stock = {};
            if (min) conditions.stock.min = parseInt(min);
            if (max) conditions.stock.max = parseInt(max);
        }
    } else if (stockType === 'exact') {
        const exact = document.getElementById('stock-exact-value').value;
        if (exact) {
            conditions.stock = { exact: parseInt(exact) };
        }
    } else if (stockType === 'custom') {
        const ranges = [];
        document.querySelectorAll('#stock-custom .custom-range-item').forEach(item => {
            const inputs = item.querySelectorAll('input');
            if (inputs[0].value && inputs[1].value) {
                ranges.push({
                    min: parseInt(inputs[0].value),
                    max: parseInt(inputs[1].value),
                    label: inputs[2].value || `${inputs[0].value} - ${inputs[1].value}`
                });
            }
        });
        if (ranges.length > 0) {
            conditions.stock = { ranges };
        }
    }
    
    // Status conditions
    const statusValid = document.getElementById('status-valid').checked;
    const statusInvalid = document.getElementById('status-invalid').checked;
    if (statusValid || statusInvalid) {
        conditions.status = {};
        if (statusValid && !statusInvalid) {
            conditions.status.valid = true;
        } else if (!statusValid && statusInvalid) {
            conditions.status.valid = false;
        }
    }
    
    // Issue conditions
    const issues = [];
    if (document.getElementById('issue-deleted').checked) issues.push('deleted');
    if (document.getElementById('issue-unlisted').checked) issues.push('unlisted');
    if (document.getElementById('issue-prohibited').checked) issues.push('prohibited');
    if (document.getElementById('issue-out-of-stock').checked) issues.push('out-of-stock');
    if (document.getElementById('issue-inactive').checked) issues.push('inactive');
    
    if (issues.length > 0) {
        if (!conditions.status) conditions.status = {};
        conditions.status.issues = issues;
    }
    
    // Custom fields
    const customRanges = [];
    document.querySelectorAll('#custom-fields .custom-field-item').forEach(item => {
        const selects = item.querySelectorAll('select');
        const inputs = item.querySelectorAll('input[type="number"]');
        
        if (selects[0].value && inputs[0].value) {
            const customRange = {
                field: selects[0].value,
                operator: selects[1].value,
                min: parseFloat(inputs[0].value)
            };
            
            if (selects[1].value === 'between' && inputs[1].value) {
                customRange.max = parseFloat(inputs[1].value);
            }
            
            customRanges.push(customRange);
        }
    });
    
    if (customRanges.length > 0) {
        conditions.customRanges = customRanges;
    }
    
    return conditions;
}

async function previewAdvancedFilter() {
    if (!currentResults || currentResults.length === 0) {
        showStatus('❌ Không có dữ liệu để xem trước. Vui lòng phân tích sản phẩm trước', 'error');
        return;
    }
    
    try {
        const conditions = collectFilterConditions();
        
        // Tạo filter tạm thời để test
        const tempFilter = {
            id: 'temp_preview',
            conditions
        };
        
        const filteredResults = await window.electronAPI.applyAdvancedFilter(currentResults, tempFilter);
        
        // Hiển thị kết quả preview
        displayResults(filteredResults);
        showStatus(`👁️ Preview: ${filteredResults.length}/${currentResults.length} sản phẩm phù hợp`, 'info');
        
    } catch (error) {
        console.error('Error previewing advanced filter:', error);
        showStatus('❌ Lỗi khi xem trước filter: ' + error.message, 'error');
    }
}

function closeAdvancedFilterModal() {
    const modal = document.querySelector('.advanced-filter-modal');
    if (modal) {
        modal.remove();
    }
}

// ==================== ADVANCED FILTER MANAGEMENT ====================

function manageAdvancedFilters() {
    // Tạo modal để quản lý advanced filters
    const modal = document.createElement('div');
    modal.className = 'advanced-filter-management-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🔧 Quản lý Advanced Filters</h3>
                <button class="close-btn" onclick="closeAdvancedFilterManagementModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="filter-list" id="advanced-filter-list">
                    <!-- Filter list will be populated here -->
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="showAdvancedFilterBuilder()">➕ Tạo Filter Mới</button>
                    <button class="btn btn-secondary" onclick="exportAdvancedFilters()">📤 Export</button>
                    <button class="btn btn-warning" onclick="importAdvancedFilters()">📥 Import</button>
                    <button class="btn btn-danger" onclick="clearAllAdvancedFilters()">🗑️ Xóa tất cả</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .advanced-filter-management-modal {
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
        .filter-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin: 10px 0;
            background: #f8f9fa;
        }
        .filter-info h4 {
            margin: 0 0 5px 0;
            color: #333;
        }
        .filter-info p {
            margin: 0;
            font-size: 12px;
            color: #666;
        }
        .filter-actions {
            display: flex;
            gap: 5px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    displayAdvancedFilterList();
}

function displayAdvancedFilterList() {
    const container = document.getElementById('advanced-filter-list');
    
    if (advancedFilters.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Chưa có advanced filter nào</p>';
        return;
    }
    
    container.innerHTML = advancedFilters.map(filter => `
        <div class="filter-item">
            <div class="filter-info">
                <h4>${filter.name}</h4>
                <p>${filter.description || 'Không có mô tả'} | Sử dụng: ${filter.useCount || 0} lần</p>
            </div>
            <div class="filter-actions">
                <button class="btn btn-primary btn-small" onclick="useAdvancedFilter('${filter.id}')">Sử dụng</button>
                <button class="btn btn-danger btn-small" onclick="deleteAdvancedFilter('${filter.id}')">Xóa</button>
            </div>
        </div>
    `).join('');
}

function closeAdvancedFilterManagementModal() {
    const modal = document.querySelector('.advanced-filter-management-modal');
    if (modal) {
        modal.remove();
    }
}

async function useAdvancedFilter(filterId) {
    await applyAdvancedFilter(filterId);
    closeAdvancedFilterManagementModal();
}

async function deleteAdvancedFilter(filterId) {
    if (!filterId) {
        showStatus('❌ Filter ID không hợp lệ', 'error');
        return;
    }
    
    const filter = advancedFilters.find(f => f.id === filterId);
    if (!filter) {
        showStatus('❌ Không tìm thấy filter', 'error');
        return;
    }
    
    if (!confirm(`Bạn có chắc chắn muốn xóa advanced filter "${filter.name}"?`)) {
        return;
    }
    
    try {
        const success = await window.electronAPI.deleteAdvancedFilter(filterId);
        if (success) {
            showStatus(`✅ Đã xóa advanced filter: ${filter.name}`, 'success');
            loadAdvancedFilters();
            displayAdvancedFilterList();
        } else {
            showStatus('❌ Có lỗi khi xóa advanced filter', 'error');
        }
    } catch (error) {
        console.error('Error deleting advanced filter:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function exportAdvancedFilters() {
    const filePath = prompt('Nhập đường dẫn file để export (ví dụ: C:\\advanced_filters.json):');
    if (!filePath) {
        showStatus('❌ Đường dẫn file không được để trống', 'error');
        return;
    }
    
    if (!filePath.endsWith('.json')) {
        showStatus('❌ File phải có định dạng .json', 'error');
        return;
    }
    
    try {
        const success = await window.electronAPI.exportAdvancedFilters(filePath);
        if (success) {
            showStatus(`✅ Đã export advanced filters đến: ${filePath}`, 'success');
        } else {
            showStatus('❌ Có lỗi khi export advanced filters', 'error');
        }
    } catch (error) {
        console.error('Error exporting advanced filters:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function importAdvancedFilters() {
    const filePath = prompt('Nhập đường dẫn file để import (ví dụ: C:\\advanced_filters.json):');
    if (!filePath) {
        showStatus('❌ Đường dẫn file không được để trống', 'error');
        return;
    }
    
    if (!filePath.endsWith('.json')) {
        showStatus('❌ File phải có định dạng .json', 'error');
        return;
    }
    
    try {
        const success = await window.electronAPI.importAdvancedFilters(filePath);
        if (success) {
            showStatus(`✅ Đã import advanced filters từ: ${filePath}`, 'success');
            loadAdvancedFilters();
            displayAdvancedFilterList();
        } else {
            showStatus('❌ Có lỗi khi import advanced filters', 'error');
        }
    } catch (error) {
        console.error('Error importing advanced filters:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function clearAllAdvancedFilters() {
    if (!confirm('Bạn có chắc chắn muốn xóa TẤT CẢ advanced filters? Hành động này không thể hoàn tác!')) {
        return;
    }
    
    try {
        const success = await window.electronAPI.clearAllAdvancedFilters();
        if (success) {
            showStatus('✅ Đã xóa tất cả advanced filters', 'success');
            loadAdvancedFilters();
            displayAdvancedFilterList();
        } else {
            showStatus('❌ Có lỗi khi xóa advanced filters', 'error');
        }
    } catch (error) {
        console.error('Error clearing advanced filters:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

// ==================== INITIALIZATION ====================

// Load advanced filters when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        loadAdvancedFilters();
    }
});

// Handle page navigation
function onAdvancedFilterPageShow() {
    if (window.electronAPI) {
        loadAdvancedFilters();
    } else {
        console.log('electronAPI not ready in onAdvancedFilterPageShow');
    }
}
