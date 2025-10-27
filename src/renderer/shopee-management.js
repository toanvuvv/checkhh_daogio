// Shopee Management JavaScript
let currentResults = [];
let allUsers = [];
let allConfigs = [];
let currentConfigId = null;

// Khởi tạo khi trang được load
document.addEventListener('DOMContentLoaded', () => {
    // Chỉ load khi electronAPI sẵn sàng
    if (window.electronAPI) {
        loadUserList();
        updateUserSelect();
    } else {
        console.log('electronAPI not ready, will retry...');
        setTimeout(() => {
            if (window.electronAPI) {
                loadUserList();
                updateUserSelect();
            }
        }, 1000);
    }
});

// ==================== USER MANAGEMENT ====================

async function saveUserData() {
    const username = document.getElementById('username').value.trim();
    const sessionId = document.getElementById('session-id').value.trim();
    const cookies = document.getElementById('cookies').value.trim();
    
    // Validation username
    if (!username) {
        showStatus('❌ Vui lòng nhập username', 'error');
        return;
    }
    
    if (username.length < 3) {
        showStatus('❌ Username phải có ít nhất 3 ký tự', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showStatus('❌ Username chỉ được chứa chữ cái, số và dấu gạch dưới', 'error');
        return;
    }
    
    // Validation session ID
    if (!sessionId) {
        showStatus('❌ Vui lòng nhập session ID', 'error');
        return;
    }
    
    if (!/^\d+$/.test(sessionId)) {
        showStatus('❌ Session ID phải là số nguyên dương', 'error');
        return;
    }
    
    if (parseInt(sessionId) <= 0) {
        showStatus('❌ Session ID phải lớn hơn 0', 'error');
        return;
    }
    
    // Validation cookies
    if (!cookies) {
        showStatus('❌ Vui lòng nhập cookies', 'error');
        return;
    }
    
    if (cookies.length < 50) {
        showStatus('❌ Cookies quá ngắn, vui lòng kiểm tra lại', 'error');
        return;
    }
    
    if (!cookies.includes('=') || !cookies.includes(';')) {
        showStatus('❌ Định dạng cookies không đúng. Vui lòng copy đầy đủ cookies từ browser', 'error');
        return;
    }
    
    try {
        showStatus('Đang lưu user data...', 'info');
        
        // Validate session ID
        const isValidSessionId = await window.electronAPI.validateSessionId(sessionId);
        if (!isValidSessionId) {
            showStatus('Session ID không hợp lệ. Vui lòng kiểm tra lại.', 'error');
            return;
        }
        
        // Save cookies
        const cookiesSaved = await window.electronAPI.saveCookies(username, cookies, {
            sessionId: parseInt(sessionId),
            lastUpdate: new Date().toISOString()
        });
        
        // Save session
        const sessionSaved = await window.electronAPI.saveSession(username, sessionId, {
            lastUpdate: new Date().toISOString()
        });
        
        if (cookiesSaved && sessionSaved) {
            showStatus(`✅ Đã lưu user data cho ${username}`, 'success');
            clearForm();
            loadUserList();
            updateUserSelect();
        } else {
            showStatus('❌ Có lỗi khi lưu user data', 'error');
        }
        
    } catch (error) {
        console.error('Error saving user data:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function loadUserData() {
    const username = document.getElementById('username').value.trim();
    
    if (!username) {
        showStatus('❌ Vui lòng nhập username để load', 'error');
        return;
    }
    
    if (username.length < 3) {
        showStatus('❌ Username phải có ít nhất 3 ký tự', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showStatus('❌ Username chỉ được chứa chữ cái, số và dấu gạch dưới', 'error');
        return;
    }
    
    try {
        showStatus('Đang load user data...', 'info');
        
        const cookieData = await window.electronAPI.getCookies(username);
        const sessionData = await window.electronAPI.getSession(username);
        
        if (cookieData) {
            document.getElementById('cookies').value = cookieData.cookies;
            if (cookieData.sessionId) {
                document.getElementById('session-id').value = cookieData.sessionId;
            }
            showStatus(`✅ Đã load user data cho ${username}`, 'success');
        } else {
            showStatus(`❌ Không tìm thấy user data cho ${username}`, 'error');
        }
        
        if (sessionData) {
            document.getElementById('session-id').value = sessionData.sessionId;
        }
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function clearUserData() {
    const username = document.getElementById('username').value.trim();
    
    if (!username) {
        showStatus('❌ Vui lòng nhập username để xóa', 'error');
        return;
    }
    
    if (username.length < 3) {
        showStatus('❌ Username phải có ít nhất 3 ký tự', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showStatus('❌ Username chỉ được chứa chữ cái, số và dấu gạch dưới', 'error');
        return;
    }
    
    if (!confirm(`Bạn có chắc chắn muốn xóa user data của ${username}?`)) {
        return;
    }
    
    try {
        showStatus('Đang xóa user data...', 'info');
        
        const cookiesDeleted = await window.electronAPI.deleteCookies(username);
        const sessionDeleted = await window.electronAPI.deleteSession(username);
        
        if (cookiesDeleted && sessionDeleted) {
            showStatus(`✅ Đã xóa user data của ${username}`, 'success');
            clearForm();
            loadUserList();
            updateUserSelect();
        } else {
            showStatus('❌ Có lỗi khi xóa user data', 'error');
        }
        
    } catch (error) {
        console.error('Error clearing user data:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function loadUserList() {
    try {
        allUsers = await window.electronAPI.getAllUsers();
        displayUserList();
    } catch (error) {
        console.error('Error loading user list:', error);
        showStatus('❌ Lỗi khi load danh sách users', 'error');
    }
}

function displayUserList() {
    const container = document.getElementById('user-list-content');
    
    if (allUsers.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Chưa có user nào được lưu</p>';
        return;
    }
    
    container.innerHTML = allUsers.map(user => `
        <div class="user-card">
            <div class="user-info">
                <div class="user-name">${user.username}</div>
                <div class="user-details">
                    Session ID: ${user.sessionId || 'N/A'} | 
                    Cập nhật: ${new Date(user.lastUpdate).toLocaleString()}
                </div>
            </div>
            <div class="user-status ${user.isValid ? 'valid' : 'invalid'}">
                ${user.isValid ? 'Hợp lệ' : 'Không hợp lệ'}
            </div>
            <div class="user-actions">
                <button class="btn btn-primary btn-small" onclick="loadUserToForm('${user.username}')">Load</button>
                <button class="btn btn-danger btn-small" onclick="deleteUser('${user.username}')">Xóa</button>
            </div>
        </div>
    `).join('');
}

async function loadUserToForm(username) {
    document.getElementById('username').value = username;
    await loadUserData();
}

async function deleteUser(username) {
    if (!username) {
        showStatus('❌ Username không hợp lệ', 'error');
        return;
    }
    
    if (username.length < 3) {
        showStatus('❌ Username phải có ít nhất 3 ký tự', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showStatus('❌ Username chỉ được chứa chữ cái, số và dấu gạch dưới', 'error');
        return;
    }
    
    if (!confirm(`Bạn có chắc chắn muốn xóa user ${username}?`)) {
        return;
    }
    
    try {
        const cookiesDeleted = await window.electronAPI.deleteCookies(username);
        const sessionDeleted = await window.electronAPI.deleteSession(username);
        
        if (cookiesDeleted && sessionDeleted) {
            showStatus(`✅ Đã xóa user ${username}`, 'success');
            loadUserList();
            updateUserSelect();
        } else {
            showStatus('❌ Có lỗi khi xóa user', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

function updateUserSelect() {
    const select = document.getElementById('selected-user');
    select.innerHTML = '<option value="">-- Chọn user --</option>';
    
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.username;
        option.textContent = `${user.username} (${user.isValid ? 'Hợp lệ' : 'Không hợp lệ'})`;
        select.appendChild(option);
    });
}

function clearForm() {
    document.getElementById('username').value = '';
    document.getElementById('session-id').value = '';
    document.getElementById('cookies').value = '';
}

// ==================== PRODUCT ANALYSIS ====================

// Clear bảng kết quả
function clearResultsTable() {
    const tbody = document.getElementById('results-tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">Đang phân tích...</td></tr>';
    }
    
    // Clear summary stats
    const summaryStats = document.getElementById('summary-stats');
    if (summaryStats) {
        summaryStats.innerHTML = '';
    }
    
    // Clear current results
    currentResults = [];
    
    console.log('Cleared results table');
}

// Clear results manually (for user)
function clearResults() {
    if (confirm('Bạn có chắc muốn xóa tất cả kết quả hiện tại?')) {
        clearResultsTable();
        showStatus('Đã xóa kết quả', 'info');
    }
}

async function analyzeProducts() {
    const linksText = document.getElementById('product-links').value.trim();
    const selectedUser = document.getElementById('selected-user').value;
    
    // Validation product links
    if (!linksText) {
        showStatus('❌ Vui lòng nhập product links', 'error');
        return;
    }
    
    // Kiểm tra định dạng links
    const links = linksText.split('\n').filter(link => link.trim());
    if (links.length === 0) {
        showStatus('❌ Không có link nào hợp lệ', 'error');
        return;
    }
    
    // Kiểm tra định dạng Shopee links
    const invalidLinks = links.filter(link => {
        const trimmedLink = link.trim();
        return !trimmedLink.includes('shopee.vn') || 
               !trimmedLink.includes('/product/') ||
               trimmedLink.length < 20;
    });
    
    if (invalidLinks.length > 0) {
        showStatus(`❌ Có ${invalidLinks.length} link không đúng định dạng Shopee. Vui lòng kiểm tra lại`, 'error');
        return;
    }
    
    // Không còn giới hạn 100 links, sẽ xử lý batch processing
    if (links.length > 2000) {
        showStatus('❌ Không thể phân tích quá 2000 links cùng lúc. Vui lòng giảm số lượng', 'error');
        return;
    }
    
    // Validation user selection
    if (!selectedUser) {
        showStatus('❌ Vui lòng chọn user để phân tích', 'error');
        return;
    }
    
    try {
        // Clear bảng kết quả cũ ngay khi bắt đầu phân tích
        clearResultsTable();
        
        // Parse links và check duplicates
        const links = linksText.split('\n').filter(link => link.trim());
        const duplicateResult = await window.electronAPI.cleanInputUrlsWithDuplicates(links);
        const cleanLinks = duplicateResult.cleanUrls;
        
        if (cleanLinks.length === 0) {
            showStatus('Không có link Shopee hợp lệ nào', 'error');
            return;
        }
        
        // Hiển thị thông tin về duplicates
        if (duplicateResult.duplicateCount > 0) {
            const duplicateInfo = `⚠️ Phát hiện ${duplicateResult.duplicateCount} link trùng lặp. Chỉ xử lý ${cleanLinks.length} link duy nhất.`;
            showStatus(duplicateInfo, 'warning');
            console.log('🔄 Duplicate links detected:', duplicateResult.duplicates);
        }
        
        const totalLinks = cleanLinks.length;
        const totalBatches = Math.ceil(totalLinks / 100);
        showStatus(`Đang phân tích ${totalLinks} links (${totalBatches} batches x 100 items)...`, 'info');
        showProgress(true);
        
        // Parse links to get itemId and shopId
        const parseResults = await window.electronAPI.parseMultipleLinks(cleanLinks);
        const validItems = parseResults.filter(result => result.isValid);
        
        if (validItems.length === 0) {
            showStatus('Không có item nào hợp lệ để phân tích', 'error');
            showProgress(false);
            return;
        }
        
        // Get user data
        const cookieData = await window.electronAPI.getCookies(selectedUser);
        const sessionData = await window.electronAPI.getSession(selectedUser);
        
        if (!cookieData || !sessionData) {
            showStatus('Không tìm thấy user data', 'error');
            showProgress(false);
            return;
        }
        
        // Prepare items for validation
        const items = validItems.map(item => ({
            itemId: item.itemId,
            shopId: item.shopId
        }));
        
        // Validate products với batch processing
        updateProgress(10, `Đang validate ${items.length} sản phẩm...`);
        
        // Setup progress event listener
        const progressHandler = (progressData) => {
            const { currentBatch, totalBatches, currentItems, totalItems, percentage, status } = progressData;
            updateProgress(10 + (percentage * 0.8), status);
            showBatchInfo(totalItems, currentBatch, totalBatches, currentItems);
            console.log(`📊 Batch Progress: ${currentBatch}/${totalBatches} batches, ${currentItems}/${totalItems} items (${percentage}%)`);
        };
        
        // Listen for progress events
        window.electronAPI.onValidationProgress(progressHandler);
        
        let validationResults;
        try {
            validationResults = await window.electronAPI.validateProductsBatch(
                sessionData.sessionId, 
                items, 
                cookieData.cookies
            );
        } catch (error) {
            console.error('❌ Error in validateProductsBatch:', error);
            showStatus('❌ Lỗi khi validate sản phẩm: ' + error.message, 'error');
            showProgress(false);
            return;
        } finally {
            // Cleanup progress listener
            window.electronAPI.removeValidationProgressListener(progressHandler);
        }
        
        // Process results - merge với dữ liệu từ API response
        
        if (!validationResults || validationResults.length === 0) {
            showStatus('❌ Không có dữ liệu validation results', 'error');
            showProgress(false);
            return;
        }
        
        currentResults = validationResults.map((result, index) => {
            const itemData = result.itemData || {};
            return {
                ...result,
                originalUrl: validItems[index].originalUrl,
                shopId: validItems[index].shopId,
                // Thêm dữ liệu từ API response
                productName: itemData.name || 'Không có tên',
                commissionRate: itemData.comm_rate || 0,
                price: itemData.price || itemData.price_min || 0,
                priceBeforeDiscount: itemData.price_before_discount || 0,
                discount: itemData.discount || 0,
                stock: itemData.normal_stock || itemData.display_total_stock || 0,
                sold: itemData.sold || 0,
                currency: itemData.currency || 'VND',
                image: itemData.image || '',
                itemType: itemData.item_type || 0,
                status: itemData.status || 1,
                isOos: itemData.is_oos || false,
                isDel: itemData.is_del || false,
                isUnlisted: itemData.is_unlisted || false,
                isProhibited: itemData.is_prohibited || false
            };
        });
        
        
        updateProgress(100, 'Hoàn thành!');
        
        // Display results
        displayResults(currentResults);
        updateSummaryStats(currentResults);
        
        const totalProcessed = currentResults.length;
        const batchesProcessed = Math.ceil(totalProcessed / 100);
        showStatus(`✅ Đã phân tích ${totalProcessed} sản phẩm (${batchesProcessed} batches)`, 'success');
        
        setTimeout(() => {
            showProgress(false);
        }, 1000);
        
    } catch (error) {
        console.error('Error analyzing products:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
        showProgress(false);
        
        // Clear bảng khi có lỗi
        clearResultsTable();
    }
}

function displayResults(results) {
    
    const tbody = document.getElementById('results-tbody');
    
    if (!tbody) {
        console.error('❌ results-tbody element not found');
        return;
    }
    
    if (!results || results.length === 0) {
        console.log('🔍 No results to display');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">Không có kết quả nào</td></tr>';
        updateSummaryStats(results);
        return;
    }
    
    tbody.innerHTML = results.map((result, index) => {
        
        // Lấy thông tin từ itemData (dữ liệu từ API response)
        const itemData = result.itemData || {};
        const productName = itemData.name || 'Không có tên';
        const commissionRate = itemData.comm_rate || 0;
        const price = itemData.price || itemData.price_min || 0;
        const stock = itemData.normal_stock || itemData.display_total_stock || 0;
        
        // Fallback: Nếu itemData rỗng, thử lấy từ result trực tiếp
        const finalProductName = productName === 'Không có tên' ? (result.productName || result.name || 'Không có tên') : productName;
        const finalCommissionRate = commissionRate === 0 ? (result.commissionRate || result.comm_rate || 0) : commissionRate;
        const finalPrice = price === 0 ? (result.price || result.price_min || 0) : price;
        const finalStock = stock === 0 ? (result.status?.stock || result.stock || 0) : stock;
        
        
        // Format giá
        const formattedPrice = finalPrice ? new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(parseInt(finalPrice)) : 'N/A';
        
        // Format % hoa hồng
        const formattedCommission = finalCommissionRate ? `${(finalCommissionRate / 1000).toFixed(1)}%` : '0%';
        
        return `
            <tr>
                <td title="${finalProductName}">${finalProductName.length > 50 ? finalProductName.substring(0, 50) + '...' : finalProductName}</td>
                <td style="text-align: center; font-weight: bold; color: #28a745;">${formattedCommission}</td>
                <td style="text-align: right; font-weight: bold;">${formattedPrice}</td>
                <td>
                    <span class="status-badge ${result.isValid ? 'status-valid' : 'status-invalid'}">
                        ${result.isValid ? 'Hợp lệ' : 'Không hợp lệ'}
                    </span>
                </td>
                <td>
                    <div class="issues-list">
                        ${result.issues ? result.issues.map(issue => `<div class="issue-item">${issue}</div>`).join('') : ''}
                    </div>
                </td>
                <td style="text-align: center; font-weight: bold;">${finalStock}</td>
                <td style="text-align: center;">
                    <a href="${result.originalUrl || '#'}" target="_blank" style="color: #007bff; text-decoration: none; margin-right: 10px;">
                        🔗 Xem
                    </a>
                    <button onclick="copySingleLink('${result.originalUrl || `https://shopee.vn/product/${result.shopId}/${result.itemId}`}')" 
                            class="copy-btn" title="Copy link sản phẩm">
                        📋 Copy
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update summary stats
    updateSummaryStats(results);
}

function updateSummaryStats(results) {
    const total = results.length;
    const valid = results.filter(r => r.isValid).length;
    const invalid = total - valid;
    
    const deleted = results.filter(r => r.status?.isDel).length;
    const unlisted = results.filter(r => r.status?.isUnlisted).length;
    const prohibited = results.filter(r => r.status?.isProhibited).length;
    const outOfStock = results.filter(r => r.status?.isOos || (r.status?.stock || 0) <= 0).length;
    const inactive = results.filter(r => (r.status?.status || 1) !== 1).length;
    
    const summaryHtml = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${total}</div>
                <div class="stat-label">Tổng sản phẩm</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #28a745;">${valid}</div>
                <div class="stat-label">Hợp lệ</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #dc3545;">${invalid}</div>
                <div class="stat-label">Không hợp lệ</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #dc3545;">${deleted}</div>
                <div class="stat-label">Đã xóa</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #ffc107;">${unlisted}</div>
                <div class="stat-label">Đã ẩn</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #dc3545;">${prohibited}</div>
                <div class="stat-label">Bị cấm</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #ffc107;">${outOfStock}</div>
                <div class="stat-label">Hết hàng</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #6c757d;">${inactive}</div>
                <div class="stat-label">Không hoạt động</div>
            </div>
        </div>
    `;
    
    document.getElementById('summary-stats').innerHTML = summaryHtml;
}

// ==================== FILTER FUNCTIONS ====================

function applyFilters() {
    // This function is now handled by simple filter
    // Redirect to applyCurrentFilter from simple-filter.js
    if (typeof applyCurrentFilter === 'function') {
        applyCurrentFilter();
    } else {
        showStatus('❌ Simple filter chưa được load', 'error');
    }
}

function clearFilters() {
    // This function is now handled by simple filter
    // Redirect to clearCurrentFilter from simple-filter.js
    if (typeof clearCurrentFilter === 'function') {
        clearCurrentFilter();
    } else {
        showStatus('❌ Simple filter chưa được load', 'error');
    }
}

// ==================== FILTER CONFIG FUNCTIONS ====================

async function loadFilterConfigs() {
    try {
        console.log('🔧 Loading filter configs...');
        allConfigs = await window.electronAPI.getAllFilterConfigs();
        console.log('🔧 Loaded configs:', allConfigs);
        displayQuickConfigs();
        console.log('✅ Filter configs loaded successfully:', allConfigs.length, 'configs');
    } catch (error) {
        console.error('Error loading filter configs:', error);
        // Chỉ hiển thị lỗi nếu không phải là lỗi "chưa có configs"
        if (!error.message.includes('No configs file found')) {
            showStatus('❌ Lỗi khi load filter configs', 'error');
        } else {
            console.log('ℹ️ No configs found, will create default configs when needed');
        }
    }
}

function displayQuickConfigs() {
    const container = document.getElementById('simple-filter-buttons');
    
    if (!container) {
        console.log('Simple filter buttons container not found');
        return;
    }
    
    if (allConfigs.length === 0) {
        container.innerHTML = '<p style="color: #666; font-size: 12px;">Chưa có config nào. Click "Tạo configs mặc định" để tạo.</p>';
        return;
    }
    
    container.innerHTML = allConfigs.map(config => `
        <button class="config-btn" onclick="applyQuickConfig('${config.id}')" title="${config.description || ''}">
            ${config.name}
        </button>
    `).join('');
}

async function applyQuickConfig(configId) {
    if (!configId) {
        showStatus('❌ Config ID không hợp lệ', 'error');
        return;
    }
    
    if (!currentResults || currentResults.length === 0) {
        showStatus('❌ Không có dữ liệu để áp dụng config. Vui lòng phân tích sản phẩm trước', 'error');
        return;
    }
    
    const config = allConfigs.find(c => c.id === configId);
    if (!config) {
        showStatus('❌ Không tìm thấy config', 'error');
        return;
    }
    
    try {
        const filteredResults = await window.electronAPI.applyFilterConfig(currentResults, configId);
        displayResults(filteredResults);
        
        // Update active button
        document.querySelectorAll('.config-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        currentConfigId = configId;
        showStatus(`✅ Đã áp dụng config: ${config.name}`, 'success');
        
    } catch (error) {
        console.error('Error applying quick config:', error);
        showStatus('❌ Lỗi khi áp dụng config: ' + error.message, 'error');
    }
}

async function createConfigFromCurrent() {
    const name = prompt('Nhập tên cho config mới:');
    if (!name) {
        showStatus('❌ Tên config không được để trống', 'error');
        return;
    }
    
    if (name.length < 3) {
        showStatus('❌ Tên config phải có ít nhất 3 ký tự', 'error');
        return;
    }
    
    if (name.length > 50) {
        showStatus('❌ Tên config không được quá 50 ký tự', 'error');
        return;
    }
    
    const currentFilters = {
        status: document.getElementById('filter-status').value,
        issue: document.getElementById('filter-issue').value,
        commission: document.getElementById('filter-commission').value,
        price: document.getElementById('filter-price').value,
        stock: document.getElementById('filter-stock').value,
        search: document.getElementById('product-search').value
    };
    
    try {
        const success = await window.electronAPI.createFilterConfig(name, {
            description: `Config được tạo từ filter hiện tại`,
            conditions: currentFilters
        });
        if (success) {
            showStatus(`✅ Đã tạo config: ${name}`, 'success');
            loadFilterConfigs();
        } else {
            showStatus('❌ Có lỗi khi tạo config', 'error');
        }
    } catch (error) {
        console.error('Error creating config:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

function manageConfigs() {
    // Tạo modal để quản lý configs
    const modal = document.createElement('div');
    modal.className = 'config-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>⚙️ Quản lý Filter Configs</h3>
                <button class="close-btn" onclick="closeConfigModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="config-list" id="config-list">
                    <!-- Config list will be populated here -->
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="createDefaultConfigs()">🔄 Tạo configs mặc định</button>
                    <button class="btn btn-secondary" onclick="exportConfigs()">📤 Export</button>
                    <button class="btn btn-warning" onclick="importConfigs()">📥 Import</button>
                    <button class="btn btn-danger" onclick="clearAllConfigs()">🗑️ Xóa tất cả</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .config-modal {
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
            max-width: 600px;
            max-height: 80vh;
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
        .config-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin: 10px 0;
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
        .modal-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    displayConfigList();
}

function displayConfigList() {
    const container = document.getElementById('config-list');
    
    if (allConfigs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Chưa có config nào</p>';
        return;
    }
    
    container.innerHTML = allConfigs.map(config => `
        <div class="config-item">
            <div class="config-info">
                <h4>${config.name}</h4>
                <p>${config.description || 'Không có mô tả'} | Sử dụng: ${config.useCount || 0} lần</p>
            </div>
            <div class="config-actions">
                <button class="btn btn-primary btn-small" onclick="useConfig('${config.id}')">Sử dụng</button>
                <button class="btn btn-danger btn-small" onclick="deleteConfig('${config.id}')">Xóa</button>
            </div>
        </div>
    `).join('');
}

function closeConfigModal() {
    const modal = document.querySelector('.config-modal');
    if (modal) {
        modal.remove();
    }
}

async function useConfig(configId) {
    await applyQuickConfig(configId);
    closeConfigModal();
}

async function deleteConfig(configId) {
    if (!configId) {
        showStatus('❌ Config ID không hợp lệ', 'error');
        return;
    }
    
    const config = allConfigs.find(c => c.id === configId);
    if (!config) {
        showStatus('❌ Không tìm thấy config', 'error');
        return;
    }
    
    if (!confirm(`Bạn có chắc chắn muốn xóa config "${config.name}"?`)) {
        return;
    }
    
    try {
        const success = await window.electronAPI.deleteFilterConfig(configId);
        if (success) {
            showStatus(`✅ Đã xóa config: ${config.name}`, 'success');
            loadFilterConfigs();
            displayConfigList();
        } else {
            showStatus('❌ Có lỗi khi xóa config', 'error');
        }
    } catch (error) {
        console.error('Error deleting config:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function createDefaultConfigs() {
    try {
        // Tạo các config mặc định cho SimpleFilter
        const defaultConfigs = [
            {
                name: 'Chỉ sản phẩm hợp lệ',
                description: 'Hiển thị chỉ những sản phẩm hợp lệ',
                conditions: {
                    status: 'valid'
                }
            },
            {
                name: 'Hoa hồng cao (10%+)',
                description: 'Hiển thị sản phẩm có hoa hồng từ 10% trở lên',
                conditions: {
                    commission: { min: 10 }
                }
            },
            {
                name: 'Giá dưới 100k',
                description: 'Hiển thị sản phẩm có giá dưới 100k',
                conditions: {
                    price: { max: 100000 }
                }
            }
        ];
        
        for (const config of defaultConfigs) {
            await window.electronAPI.createFilterConfig(config.name, {
                description: config.description,
                conditions: config.conditions
            });
        }
        
        showStatus('✅ Đã tạo configs mặc định', 'success');
        loadFilterConfigs();
        displayConfigList();
    } catch (error) {
        console.error('Error creating default configs:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function exportConfigs() {
    try {
        const success = await window.electronAPI.exportFilterConfigs();
        if (success) {
            showStatus('✅ Đã export filter configs thành công', 'success');
        } else {
            showStatus('❌ Có lỗi khi export filter configs', 'error');
        }
    } catch (error) {
        console.error('Error exporting configs:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function importConfigs() {
    try {
        const success = await window.electronAPI.importFilterConfigs();
        if (success) {
            showStatus('✅ Đã import filter configs thành công', 'success');
            loadFilterConfigs();
            displayConfigList();
        } else {
            showStatus('❌ Có lỗi khi import filter configs', 'error');
        }
    } catch (error) {
        console.error('Error importing configs:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

async function clearAllConfigs() {
    if (!confirm('Bạn có chắc chắn muốn xóa TẤT CẢ configs? Hành động này không thể hoàn tác!')) {
        return;
    }
    
    try {
        const success = await window.electronAPI.clearAllFilterConfigs();
        if (success) {
            showStatus('✅ Đã xóa tất cả configs', 'success');
            loadFilterConfigs();
            displayConfigList();
        } else {
            showStatus('❌ Có lỗi khi xóa configs', 'error');
        }
    } catch (error) {
        console.error('Error clearing configs:', error);
        showStatus('❌ Lỗi: ' + error.message, 'error');
    }
}

// ==================== EXPORT FUNCTIONS ====================

function exportToExcel() {
    if (!currentResults || currentResults.length === 0) {
        showStatus('❌ Không có dữ liệu để xuất. Vui lòng phân tích sản phẩm trước', 'error');
        return;
    }
    
    try {
        // Tạo dữ liệu CSV
        const headers = ['Tên sản phẩm', '% Hoa hồng', 'Giá', 'Trạng thái', 'Vấn đề', 'Tồn kho', 'Link'];
        const csvData = [headers.join(',')];
        
        currentResults.forEach(result => {
            const productName = (result.productName || result.name || 'Không có tên').replace(/,/g, ';');
            const commission = result.commissionRate || result.comm_rate || 0;
            const commissionPercent = (commission / 100).toFixed(1) + '%';
            const price = result.price || result.price_min || 0;
            const formattedPrice = price ? new Intl.NumberFormat('vi-VN').format(parseInt(price)) + ' VND' : 'N/A';
            const status = result.isValid ? 'Hợp lệ' : 'Không hợp lệ';
            const issues = result.issues ? result.issues.join('; ') : '';
            const stock = result.stock || result.status?.stock || 0;
            const link = result.originalUrl || `https://shopee.vn/product/${result.shopId}/${result.itemId}`;
            
            csvData.push([
                `"${productName}"`,
                commissionPercent,
                `"${formattedPrice}"`,
                status,
                `"${issues}"`,
                stock,
                link
            ].join(','));
        });
        
        // Tạo và tải file
        const csvContent = csvData.join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `shopee_products_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showStatus('✅ Đã xuất file Excel thành công', 'success');
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showStatus('❌ Lỗi khi xuất Excel: ' + error.message, 'error');
    }
}

// Export Excel cho kết quả đã lọc
function exportFilteredToExcel() {
    const tbody = document.getElementById('results-tbody');
    if (!tbody) {
        showStatus('❌ Không tìm thấy bảng kết quả', 'error');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0) {
        showStatus('❌ Không có dữ liệu để xuất. Vui lòng phân tích sản phẩm trước', 'error');
        return;
    }
    
    try {
        // Tạo dữ liệu CSV từ bảng hiện tại
        const headers = ['Tên sản phẩm', '% Hoa hồng', 'Giá', 'Trạng thái', 'Vấn đề', 'Tồn kho', 'Link'];
        const csvData = [headers.join(',')];
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 7) {
                const productName = cells[0].textContent.trim().replace(/,/g, ';');
                const commission = cells[1].textContent.trim();
                const price = cells[2].textContent.trim();
                const status = cells[3].textContent.trim();
                const issues = cells[4].textContent.trim().replace(/,/g, ';');
                const stock = cells[5].textContent.trim();
                const linkCell = cells[6].querySelector('a');
                const link = linkCell ? linkCell.href : '';
                
                csvData.push([
                    `"${productName}"`,
                    commission,
                    `"${price}"`,
                    status,
                    `"${issues}"`,
                    stock,
                    link
                ].join(','));
            }
        });
        
        // Tạo và tải file
        const csvContent = csvData.join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `shopee_filtered_products_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showStatus(`✅ Đã xuất ${rows.length} sản phẩm đã lọc thành file Excel`, 'success');
        
    } catch (error) {
        console.error('Error exporting filtered results to Excel:', error);
        showStatus('❌ Lỗi khi xuất Excel đã lọc: ' + error.message, 'error');
    }
}

function copyAllLinks() {
    if (!currentResults || currentResults.length === 0) {
        showStatus('❌ Không có dữ liệu để copy. Vui lòng phân tích sản phẩm trước', 'error');
        return;
    }
    
    try {
        const links = currentResults.map(result => {
            return result.originalUrl || `https://shopee.vn/product/${result.shopId}/${result.itemId}`;
        });
        
        const linksText = links.join('\n');
        
        // Copy to clipboard
        navigator.clipboard.writeText(linksText).then(() => {
            showStatus(`✅ Đã copy ${links.length} links vào clipboard`, 'success');
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
            // Fallback: hiển thị trong alert
            alert('Links:\n' + linksText);
            showStatus('✅ Đã hiển thị links trong popup', 'success');
        });
        
    } catch (error) {
        console.error('Error copying links:', error);
        showStatus('❌ Lỗi khi copy links: ' + error.message, 'error');
    }
}

// Copy links cho kết quả đã lọc
function copyFilteredLinks() {
    const tbody = document.getElementById('results-tbody');
    if (!tbody) {
        showStatus('❌ Không tìm thấy bảng kết quả', 'error');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0) {
        showStatus('❌ Không có dữ liệu để copy. Vui lòng phân tích sản phẩm trước', 'error');
        return;
    }
    
    try {
        const links = [];
        rows.forEach(row => {
            const linkCell = row.querySelector('td:last-child a');
            if (linkCell && linkCell.href) {
                links.push(linkCell.href);
            }
        });
        
        if (links.length === 0) {
            showStatus('❌ Không tìm thấy link nào trong kết quả hiện tại', 'error');
            return;
        }
        
        const linksText = links.join('\n');
        
        // Copy to clipboard
        navigator.clipboard.writeText(linksText).then(() => {
            showStatus(`✅ Đã copy ${links.length} links đã lọc vào clipboard`, 'success');
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
            // Fallback: hiển thị trong alert
            alert('Links đã lọc:\n' + linksText);
            showStatus('✅ Đã hiển thị links trong popup', 'success');
        });
        
    } catch (error) {
        console.error('Error copying filtered links:', error);
        showStatus('❌ Lỗi khi copy links đã lọc: ' + error.message, 'error');
    }
}

// Copy link của một sản phẩm cụ thể
function copySingleLink(link) {
    if (!link) {
        showStatus('❌ Link không hợp lệ', 'error');
        return;
    }
    
    try {
        navigator.clipboard.writeText(link).then(() => {
            showStatus('✅ Đã copy link sản phẩm', 'success');
        }).catch(err => {
            console.error('Error copying single link:', err);
            // Fallback: hiển thị trong alert
            alert('Link sản phẩm:\n' + link);
            showStatus('✅ Đã hiển thị link trong popup', 'success');
        });
    } catch (error) {
        console.error('Error copying single link:', error);
        showStatus('❌ Lỗi khi copy link: ' + error.message, 'error');
    }
}

// ==================== UTILITY FUNCTIONS ====================

function showProgress(show) {
    const container = document.getElementById('progress-container');
    container.style.display = show ? 'block' : 'none';
    
    if (!show) {
        document.getElementById('progress-fill').style.width = '0%';
        document.getElementById('progress-text').textContent = 'Đang xử lý...';
        // Ẩn batch info khi hoàn thành
        const batchInfo = document.getElementById('batch-info');
        if (batchInfo) {
            batchInfo.innerHTML = '';
        }
    }
}

function updateProgress(percentage, text) {
    document.getElementById('progress-fill').style.width = percentage + '%';
    document.getElementById('progress-text').textContent = text;
    
    console.log(`🔄 Progress: ${percentage}% - ${text}`);
}

// Hiển thị thông tin batch processing
function showBatchInfo(totalItems, currentBatch, totalBatches, currentItems) {
    const batchInfo = document.getElementById('batch-info');
    if (batchInfo) {
        batchInfo.innerHTML = `
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 14px;">
                <strong>📊 Batch Processing Info:</strong><br>
                • Tổng items: <strong>${totalItems}</strong><br>
                • Đang xử lý batch: <strong>${currentBatch}/${totalBatches}</strong><br>
                • Items đã xử lý: <strong>${currentItems}/${totalItems}</strong><br>
                • Progress: <strong>${Math.round((currentItems / totalItems) * 100)}%</strong>
            </div>
        `;
    }
}

function viewProductDetails(itemId, shopId) {
    const link = `https://shopee.vn/product/${shopId}/${itemId}`;
    window.open(link, '_blank');
}

// ==================== EVENT LISTENERS ====================

// Auto-refresh user list when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        loadUserList();
        updateUserSelect();
    }
});

// Real-time search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });
    }
});

// Handle page navigation
function onShopeeManagementPageShow() {
    console.log('🔧 onShopeeManagementPageShow called');
    if (window.electronAPI) {
        loadUserList();
        updateUserSelect();
        // Chỉ load filter configs nếu chưa có
        if (allConfigs.length === 0) {
            console.log('🔧 Loading filter configs (allConfigs.length === 0)');
            loadFilterConfigs();
        }
        // Load simple filter configs instead of advanced filters
        if (typeof loadFilterConfigs === 'function') {
            console.log('🔧 Calling loadFilterConfigs from simple-filter.js');
            loadFilterConfigs();
        } else {
            console.log('🔧 loadFilterConfigs function not found');
        }
    } else {
        console.log('electronAPI not ready in onShopeeManagementPageShow');
    }
}
