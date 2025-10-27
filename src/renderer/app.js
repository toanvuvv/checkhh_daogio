// Sử dụng electronAPI từ preload script thay vì require trực tiếp
let licenseManager = null;
let isLicenseValid = false;
let isShowingLicenseForm = false;

// Debug function để kiểm tra device ID
async function debugDeviceId() {
    try {
        console.log('🔍 Debugging device ID...');
        const deviceId = await window.electronAPI.getDeviceId();
        console.log('Device ID from API:', deviceId);
        
        const deviceIdElement = document.getElementById('device-id');
        console.log('Device ID element found:', !!deviceIdElement);
        if (deviceIdElement) {
            console.log('Current element content:', deviceIdElement.textContent);
            deviceIdElement.textContent = deviceId;
            console.log('Device ID set successfully');
        }
    } catch (error) {
        console.error('Error in debugDeviceId:', error);
    }
}

// Khởi tạo app
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Kiểm tra electronAPI có sẵn sàng không
        if (!window.electronAPI) {
            console.error('electronAPI not available, waiting...');
            // Thử lại sau 1 giây
            setTimeout(() => {
                if (window.electronAPI) {
                    initializeApp();
                } else {
                    console.error('electronAPI still not available after timeout');
                    showLicenseFormOnly();
                }
            }, 1000);
            return;
        }
        
        await initializeApp();
    } catch (error) {
        console.error('Error during app initialization:', error);
        // Fallback: show license form anyway
        showLicenseFormOnly();
    }
});

async function initializeApp() {
    try {
        // Lấy device ID
        const deviceId = await window.electronAPI.getDeviceId();
        console.log('Device ID received:', deviceId);
        
        const deviceIdElement = document.getElementById('device-id');
        if (deviceIdElement) {
            deviceIdElement.textContent = deviceId;
            console.log('Device ID set in DOM:', deviceId);
        } else {
            console.error('Device ID element not found!');
        }
        
        // Kiểm tra license (sử dụng cache)
        const isValid = await window.electronAPI.validateLicense();
        isLicenseValid = isValid;
        
        if (!isValid) {
            console.log('License invalid, showing license form only');
            // Chỉ hiển thị form license, ẩn tất cả thứ khác
            showLicenseFormOnly();
            
            // Debug device ID sau khi hiển thị form
            setTimeout(debugDeviceId, 200);
        } else {
            console.log('License valid, showing app content');
            showAppContent();
            updateLicenseInfo();
        }
    } catch (error) {
        console.error('Error in initializeApp:', error);
        showLicenseFormOnly();
    }
}

// Chỉ hiển thị form license, ẩn tất cả thứ khác
function showLicenseFormOnly() {
    console.log('showLicenseFormOnly called');
    
    // Ẩn sidebar hoàn toàn
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.style.display = 'none';
        console.log('Sidebar hidden');
    }
    
    // Ẩn tất cả content pages
    const pages = document.querySelectorAll('.content-page');
    pages.forEach(page => page.classList.remove('active'));
    console.log('Content pages hidden');
    
    // Hiển thị main content area nhưng chỉ để chứa form license
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.style.padding = '0';
        mainContent.style.margin = '0';
        console.log('Main content shown');
    }
    
    // Chỉ hiển thị form license với style standalone
    const licenseForm = document.getElementById('license-form');
    if (licenseForm) {
        licenseForm.classList.add('show', 'standalone');
        console.log('License form shown');
        
        // Đảm bảo device ID được hiển thị
        setTimeout(() => {
            const deviceIdElement = document.getElementById('device-id');
            if (deviceIdElement) {
                // Nếu device ID chưa được set, lấy lại
                if (!deviceIdElement.textContent || deviceIdElement.textContent.trim() === '') {
                    window.electronAPI.getDeviceId().then(deviceId => {
                        deviceIdElement.textContent = deviceId;
                        console.log('Device ID set in showLicenseFormOnly:', deviceId);
                    }).catch(error => {
                        console.error('Error getting device ID:', error);
                        deviceIdElement.textContent = 'Error loading device ID';
                    });
                } else {
                    console.log('Device ID already set:', deviceIdElement.textContent);
                }
            } else {
                console.error('Device ID element not found!');
            }
        }, 100);
    } else {
        console.error('License form not found!');
    }
}

// License lock functions
function showLicenseLock() {
    document.getElementById('license-lock-overlay').classList.add('show');
    // Lock sidebar
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.add('locked');
    // Disable all navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.style.pointerEvents = 'none';
        item.style.opacity = '0.5';
    });
    // Hide all content pages
    const pages = document.querySelectorAll('.content-page');
    pages.forEach(page => page.classList.remove('active'));
}

function hideLicenseLock() {
    document.getElementById('license-lock-overlay').classList.remove('show');
    // Unlock sidebar
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.remove('locked');
    // Re-enable navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.style.pointerEvents = 'auto';
        item.style.opacity = '1';
    });
}

function exitApp() {
    window.electronAPI.exitApp();
}

// Navigation functions
function showPage(pageId) {
    // Check license before allowing navigation (except when showing license form)
    if (!isLicenseValid && !isShowingLicenseForm) {
        showLicenseLock();
        return;
    }
    
    // Hide all pages
    const pages = document.querySelectorAll('.content-page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Find and activate the clicked nav item
    const clickedNav = Array.from(navItems).find(item => 
        item.getAttribute('onclick').includes(pageId)
    );
    if (clickedNav) {
        clickedNav.classList.add('active');
    }
    
    // Special handling for license management page
    if (pageId === 'license-management') {
        updateLicenseInfo();
    }
    
    // Special handling for shopee management page
    if (pageId === 'shopee-management') {
        if (typeof onShopeeManagementPageShow === 'function') {
            onShopeeManagementPageShow();
        }
    }
}

// Hiển thị form license
function showLicenseForm() {
    // Set flag to allow license form access
    isShowingLicenseForm = true;
    // Hide license lock overlay first
    hideLicenseLock();
    // Show license form only
    showLicenseFormOnly();
    
    // Đảm bảo device ID được hiển thị
    setTimeout(() => {
        const deviceIdElement = document.getElementById('device-id');
        if (deviceIdElement) {
            if (!deviceIdElement.textContent || deviceIdElement.textContent.trim() === '') {
                window.electronAPI.getDeviceId().then(deviceId => {
                    deviceIdElement.textContent = deviceId;
                    console.log('Device ID set in showLicenseForm:', deviceId);
                }).catch(error => {
                    console.error('Error getting device ID:', error);
                    deviceIdElement.textContent = 'Error loading device ID';
                });
            }
        }
    }, 100);
}

// Ẩn form license
function hideLicenseForm() {
    document.getElementById('license-form').classList.remove('show');
    isShowingLicenseForm = false;
    // Show welcome page
    showPage('welcome');
}

// Kích hoạt license
async function activateLicense() {
    const licenseKey = document.getElementById('license-key').value.trim();
    
    if (!licenseKey) {
        showStatus('Please enter a license key', 'error');
        return;
    }
    
    showStatus('Activating license...', 'info');
    
    try {
        const success = await window.electronAPI.activateLicense(licenseKey);
        
        if (success) {
            showStatus('License activated successfully!', 'success');
            isLicenseValid = true;
            isShowingLicenseForm = false;
            hideLicenseForm();
            hideLicenseLock();
            showAppContent();
            updateLicenseInfo();
        } else {
            showStatus('License activation failed. Please check your license key.', 'error');
        }
    } catch (error) {
        showStatus('Error activating license: ' + error.message, 'error');
    }
}

// Hiển thị nội dung app
function showAppContent() {
    // Hide license form
    document.getElementById('license-form').classList.remove('show');
    
    // Hiển thị lại sidebar
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.display = 'block';
    
    // Hiển thị lại main content
    const mainContent = document.querySelector('.main-content');
    mainContent.style.display = 'block';
    
    // Show welcome page
    showPage('welcome');
}

// Cập nhật thông tin license
async function updateLicenseInfo() {
    try {
        const licenseInfo = await window.electronAPI.getLicenseInfo();
        
        if (licenseInfo) {
            const details = document.getElementById('license-details');
            details.innerHTML = `
                <div class="license-detail">
                    <strong>License Key:</strong>
                    <span>${licenseInfo.license_key}</span>
                </div>
                <div class="license-detail">
                    <strong>Type:</strong>
                    <span>${licenseInfo.type}</span>
                </div>
                <div class="license-detail">
                    <strong>Max Devices:</strong>
                    <span>${licenseInfo.max_devices}</span>
                </div>
                <div class="license-detail">
                    <strong>Expire Date:</strong>
                    <span>${licenseInfo.expire_date || 'Never'}</span>
                </div>
                <div class="license-detail">
                    <strong>Last Validation:</strong>
                    <span>${licenseInfo.last_validation || 'Never'}</span>
                </div>
                <div class="license-detail">
                    <strong>Cache Status:</strong>
                    <span style="color: ${licenseInfo.cache_status.includes('Valid') ? 'green' : licenseInfo.cache_status.includes('Expired but usable') ? 'orange' : 'red'}">${licenseInfo.cache_status}</span>
                </div>
                <div class="license-detail">
                    <strong>Cache Age:</strong>
                    <span>${licenseInfo.cache_age_hours} hours</span>
                </div>
                <div class="license-detail">
                    <strong>Device ID:</strong>
                    <span style="font-family: monospace; font-size: 12px;">${licenseInfo.device_id}</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error getting license info:', error);
    }
}

// Hiển thị thông tin license
async function showLicenseInfo() {
    await updateLicenseInfo();
    document.getElementById('license-info').style.display = 'block';
}

// Force validate license
async function forceValidateLicense() {
    showStatus('Force validating license...', 'info');
    
    try {
        const isValid = await window.electronAPI.forceValidateLicense();
        isLicenseValid = isValid;
        
        if (isValid) {
            showStatus('License is valid', 'success');
            updateLicenseInfo();
        } else {
            showStatus('License is invalid - please reactivate', 'error');
            showLicenseLock();
        }
    } catch (error) {
        showStatus('Error validating license: ' + error.message, 'error');
    }
}

// Clear cache and validate
async function clearCacheAndValidate() {
    if (confirm('Are you sure you want to clear cache and re-validate license?')) {
        showStatus('Clearing cache and validating...', 'info');
        
        try {
            const isValid = await window.electronAPI.clearCacheAndValidate();
            isLicenseValid = isValid;
            
            if (isValid) {
                showStatus('License is valid after cache clear', 'success');
                updateLicenseInfo();
            } else {
                showStatus('License is invalid - please reactivate', 'error');
                showLicenseLock();
            }
        } catch (error) {
            showStatus('Error clearing cache and validating: ' + error.message, 'error');
        }
    }
}

// Deactivate license
async function deactivateLicense() {
    if (confirm('Are you sure you want to deactivate the license on this device?')) {
        try {
            const success = await window.electronAPI.deactivateLicense();
            
            if (success) {
                showStatus('License deactivated successfully', 'success');
                isLicenseValid = false;
                showLicenseLock();
            } else {
                showStatus('Failed to deactivate license', 'error');
            }
        } catch (error) {
            showStatus('Error deactivating license: ' + error.message, 'error');
        }
    }
}

// Hiển thị status
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    // Auto hide sau 5 giây
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
    }, 5000);
}

// Lắng nghe events từ main process
window.electronAPI.onShowLicenseForm(() => {
    showLicenseForm();
});

window.electronAPI.onLicenseInvalid(() => {
    showStatus('License is no longer valid. Please reactivate.', 'error');
    isLicenseValid = false;
    isShowingLicenseForm = false;
    showLicenseLock();
});

window.electronAPI.onLicenseRevoked(() => {
    showStatus('License has been revoked by administrator.', 'error');
    isLicenseValid = false;
    isShowingLicenseForm = false;
    showLicenseLock();
});
