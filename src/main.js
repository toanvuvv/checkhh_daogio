const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const LicenseManager = require('./renderer/license');
const CookieManager = require('./utils/cookie-manager');
const SessionManager = require('./utils/session-manager');
const ShopeeParser = require('./utils/shopee-parser');
const ShopeeAPI = require('./utils/shopee-api');
const FilterConfig = require('./utils/filter-config');
const AdvancedFilter = require('./utils/advanced-filter');
const SimpleFilter = require('./utils/simple-filter');

// Fix Windows focus issues
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

// Security: Set up CSP and other security headers
app.whenReady().then(() => {
    // Set up security headers
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://127.0.0.1:8000;"],
                'X-Content-Type-Options': ['nosniff'],
                'X-Frame-Options': ['DENY'],
                'X-XSS-Protection': ['1; mode=block']
            }
        });
    });
});

// Khởi tạo các managers
const licenseManager = new LicenseManager({
    serverUrl: 'https://serverlisencemanager.up.railway.app', // Thay đổi URL server của bạn
    secretKey: 'EuxJskkn1pJM4KHNMKjqqLlcE8yltisBwsDLaPO0oN0' // Thay đổi secret key
});

const cookieManager = new CookieManager();
const sessionManager = new SessionManager();
const shopeeParser = new ShopeeParser();
const shopeeAPI = new ShopeeAPI();
const filterConfig = new FilterConfig();
const advancedFilter = new AdvancedFilter();
const simpleFilter = new SimpleFilter();

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // Ẩn window ban đầu để tránh flash
        focusable: true, // Đảm bảo window có thể focus
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'main', 'preload.js'),
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
            devTools: process.env.NODE_ENV === 'development', // Chỉ cho phép DevTools trong development
            backgroundThrottling: false // Tránh throttle khi không active
        }
    });

    // Load React app from Vite build output
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        // In development, load from Vite dev server
        mainWindow.loadURL('http://localhost:3000');
    } else {
        // In production, load from built files
        mainWindow.loadFile('dist/renderer/index.html');
    }
    
    // Hiển thị window sau khi load xong để tránh flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
    
    // Mở DevTools trong development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
    
    // Vô hiệu hóa menu bar trong production
    if (process.env.NODE_ENV !== 'development') {
        mainWindow.setMenuBarVisibility(false);
    }
}

// Kiểm tra license khi app khởi động - ưu tiên cache 1 ngày
async function checkLicenseOnStartup() {
    console.log('Checking license on startup (cache first)...');
    
    // Kiểm tra cache trước (1 ngày)
    const cacheValid = await licenseManager.validate(false); // Sử dụng cache trước
    
    if (cacheValid) {
        console.log('License valid from cache, starting application...');
        
        // Check server trong background để refresh cache nếu cần
        setTimeout(async () => {
            console.log('Background checking server for license status...');
            try {
                const serverValid = await licenseManager.validate(true);
                if (!serverValid) {
                    console.log('Server validation failed, but continuing with cache...');
                    // Không gửi license-invalid event, vì cache vẫn valid
                } else {
                    console.log('Server validation successful, cache updated');
                }
            } catch (error) {
                console.log('Background server check failed, using cache:', error.message);
                // Không làm gì, tiếp tục dùng cache
            }
        }, 3000); // Check sau 3 giây
    } else {
        console.log('License invalid or cache expired, showing form...');
        // Không hiển thị dialog, để renderer process xử lý
        mainWindow.webContents.send('show-license-form');
    }
}

// Hiển thị dialog nhập license
function showLicenseDialog() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'License Required',
        message: 'Please enter your license key to continue.',
        detail: `Device ID: ${licenseManager.getDeviceId()}\n\nSend this Device ID to your administrator to get a license key.`,
        buttons: ['Enter License Key', 'Exit'],
        defaultId: 0
    }).then((result) => {
        if (result.response === 0) {
            // Hiển thị form nhập license
            mainWindow.webContents.send('show-license-form');
        } else {
            app.quit();
        }
    });
}

// IPC handlers
ipcMain.handle('get-device-id', () => {
    return licenseManager.getDeviceId();
});

ipcMain.handle('activate-license', async (event, licenseKey) => {
    const success = await licenseManager.activate(licenseKey);
    return success;
});

ipcMain.handle('validate-license', async () => {
    const isValid = await licenseManager.validate();
    return isValid;
});

ipcMain.handle('get-license-info', () => {
    return licenseManager.getLicenseInfo();
});

ipcMain.handle('deactivate-license', async () => {
    const success = await licenseManager.deactivate();
    return success;
});

ipcMain.handle('force-validate-license', async () => {
    const isValid = await licenseManager.forceValidation();
    return isValid;
});

ipcMain.handle('clear-cache-and-validate', async () => {
    const isValid = await licenseManager.clearCacheAndValidate();
    return isValid;
});

// App event handlers
app.whenReady().then(() => {
    createWindow();
    
    // Kiểm tra license sau khi window được tạo
    setTimeout(checkLicenseOnStartup, 1000);
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Kiểm tra license định kỳ (mỗi 6 giờ) - ưu tiên cache
setInterval(async () => {
    try {
        console.log('Periodic license check (every 6 hours)...');
        const isValid = await licenseManager.validate(false); // Sử dụng cache trước
        if (!isValid) {
            console.log('License invalid in periodic check, showing form...');
            mainWindow.webContents.send('license-invalid');
        } else {
            console.log('License valid in periodic check');
        }
    } catch (error) {
        console.log('Periodic license check error:', error.message);
    }
}, 6 * 60 * 60 * 1000); // 6 giờ

// Kiểm tra license nhẹ (mỗi 1 giờ) - chỉ check cache
setInterval(async () => {
    try {
        const isValid = await licenseManager.validate(false); // Chỉ check cache
        if (!isValid) {
            console.log('Cache expired, need to re-validate...');
            // Không force online ngay, để user tự nhập license
        }
    } catch (error) {
        // Ignore errors
    }
}, 60 * 60 * 1000); // 1 giờ

// Xử lý khi license bị revoke
ipcMain.on('license-revoked', () => {
    console.log('License has been revoked, closing application...');
    dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'License Revoked',
        message: 'Your license has been revoked by the administrator.',
        detail: 'The application will now close.',
        buttons: ['OK']
    }).then(() => {
        app.quit();
    });
});

// Xử lý exit app
ipcMain.on('exit-app', () => {
    app.quit();
});

// ==================== COOKIE MANAGEMENT IPC HANDLERS ====================

ipcMain.handle('save-cookies', async (event, username, cookies, metadata) => {
    return cookieManager.saveCookies(username, cookies, metadata);
});

ipcMain.handle('get-cookies', async (event, username) => {
    return cookieManager.getCookies(username);
});

ipcMain.handle('delete-cookies', async (event, username) => {
    return cookieManager.deleteCookies(username);
});

ipcMain.handle('get-all-users', async () => {
    return cookieManager.getAllUsers();
});

ipcMain.handle('is-cookies-valid', async (event, username) => {
    return cookieManager.isCookiesValid(username);
});

ipcMain.handle('update-cookies-status', async (event, username, isValid) => {
    return cookieManager.updateCookiesStatus(username, isValid);
});

ipcMain.handle('clear-all-cookies', async () => {
    return cookieManager.clearAllCookies();
});

ipcMain.handle('export-cookies', async (event, filePath) => {
    return cookieManager.exportCookies(filePath);
});

ipcMain.handle('import-cookies', async (event, filePath) => {
    return cookieManager.importCookies(filePath);
});

// ==================== SESSION MANAGEMENT IPC HANDLERS ====================

ipcMain.handle('save-session', async (event, username, sessionId, metadata) => {
    return sessionManager.saveSession(username, sessionId, metadata);
});

ipcMain.handle('get-session', async (event, username) => {
    return sessionManager.getSession(username);
});

ipcMain.handle('delete-session', async (event, username) => {
    return sessionManager.deleteSession(username);
});

ipcMain.handle('get-all-sessions', async () => {
    return sessionManager.getAllSessions();
});

ipcMain.handle('is-session-valid', async (event, username) => {
    return sessionManager.isSessionValid(username);
});

ipcMain.handle('update-session-status', async (event, username, isActive) => {
    return sessionManager.updateSessionStatus(username, isActive);
});

ipcMain.handle('validate-session-id', async (event, sessionId) => {
    return sessionManager.validateSessionId(sessionId);
});

ipcMain.handle('clear-all-sessions', async () => {
    return sessionManager.clearAllSessions();
});

ipcMain.handle('export-sessions', async (event, filePath) => {
    return sessionManager.exportSessions(filePath);
});

ipcMain.handle('import-sessions', async (event, filePath) => {
    return sessionManager.importSessions(filePath);
});

// ==================== SHOPEE PARSER IPC HANDLERS ====================

ipcMain.handle('parse-product-link', async (event, url) => {
    return shopeeParser.parseProductLink(url);
});

ipcMain.handle('parse-multiple-links', async (event, urls) => {
    return shopeeParser.parseMultipleLinks(urls);
});

ipcMain.handle('get-valid-links', async (event, urls) => {
    return shopeeParser.getValidLinks(urls);
});

ipcMain.handle('get-invalid-links', async (event, urls) => {
    return shopeeParser.getInvalidLinks(urls);
});

ipcMain.handle('create-product-link', async (event, itemId, shopId) => {
    return shopeeParser.createProductLink(itemId, shopId);
});

ipcMain.handle('is-shopee-link', async (event, url) => {
    return shopeeParser.isShopeeLink(url);
});

ipcMain.handle('clean-input-urls', async (event, input) => {
    return shopeeParser.cleanInputUrls(input);
});

ipcMain.handle('clean-input-urls-with-duplicates', async (event, input) => {
    return shopeeParser.cleanInputUrlsWithDuplicates(input);
});

ipcMain.handle('parse-with-progress', async (event, urls) => {
    // Create progress callback that emits events to renderer
    const progressCallback = (progressData) => {
        event.sender.send('parse-progress', progressData);
    };
    
    return shopeeParser.parseWithProgress(urls, progressCallback);
});

// ==================== SHOPEE API IPC HANDLERS ====================

ipcMain.handle('create-product-set', async (event, sessionId, items, cookies, purpose) => {
    return shopeeAPI.createProductSet(sessionId, items, cookies, purpose);
});

ipcMain.handle('get-product-set-info', async (event, sessionId, productSetId, cookies) => {
    return shopeeAPI.getProductSetInfo(sessionId, productSetId, cookies);
});

ipcMain.handle('attach-product-set', async (event, sessionId, setId, cookies) => {
    return shopeeAPI.attachProductSet(sessionId, setId, cookies);
});

ipcMain.handle('delete-product-set', async (event, sessionId, productSetId, cookies) => {
    return shopeeAPI.deleteProductSet(sessionId, productSetId, cookies);
});

ipcMain.handle('validate-products-batch', async (event, sessionId, items, cookies) => {
    // Create progress callback that emits events to renderer
    const progressCallback = (progressData) => {
        event.sender.send('validation-progress', progressData);
    };
    
    return shopeeAPI.validateProductsBatch(sessionId, items, cookies, progressCallback);
});

ipcMain.handle('add-items-to-cart', async (event, sessionId, items, cookies) => {
    return shopeeAPI.addItemsToCart(sessionId, items, cookies);
});

// ==================== FILTER CONFIG IPC HANDLERS ====================

ipcMain.handle('create-quick-config', async (event, name, options) => {
    return filterConfig.createQuickConfig(name, options);
});

ipcMain.handle('save-config', async (event, id, config) => {
    return filterConfig.saveConfig(id, config);
});

ipcMain.handle('get-config', async (event, id) => {
    return filterConfig.getConfig(id);
});

ipcMain.handle('delete-config', async (event, id) => {
    return filterConfig.deleteConfig(id);
});

ipcMain.handle('get-all-configs', async () => {
    return filterConfig.getAllConfigs();
});

ipcMain.handle('use-config', async (event, id) => {
    return filterConfig.useConfig(id);
});

ipcMain.handle('apply-config', async (event, results, configId) => {
    return filterConfig.applyConfig(results, configId);
});

ipcMain.handle('create-config-from-current', async (event, name, currentFilters) => {
    return filterConfig.createConfigFromCurrent(name, currentFilters);
});

ipcMain.handle('export-configs', async (event, filePath) => {
    return filterConfig.exportConfigs(filePath);
});

ipcMain.handle('import-configs', async (event, filePath) => {
    return filterConfig.importConfigs(filePath);
});

ipcMain.handle('clear-all-configs', async () => {
    return filterConfig.clearAllConfigs();
});

ipcMain.handle('create-default-configs', async () => {
    return filterConfig.createDefaultConfigs();
});

// ==================== ADVANCED FILTER IPC HANDLERS ====================

ipcMain.handle('create-advanced-filter', async (event, name, options) => {
    return advancedFilter.createAdvancedFilter(name, options);
});

ipcMain.handle('get-advanced-filter', async (event, id) => {
    return advancedFilter.getFilter(id);
});

ipcMain.handle('delete-advanced-filter', async (event, id) => {
    return advancedFilter.deleteFilter(id);
});

ipcMain.handle('get-all-advanced-filters', async () => {
    return advancedFilter.getAllFilters();
});

ipcMain.handle('use-advanced-filter', async (event, id) => {
    return advancedFilter.useFilter(id);
});

ipcMain.handle('apply-advanced-filter', async (event, results, filterId) => {
    return advancedFilter.applyAdvancedFilter(results, filterId);
});

ipcMain.handle('export-advanced-filters', async (event, filePath) => {
    return advancedFilter.exportFilters(filePath);
});

ipcMain.handle('import-advanced-filters', async (event, filePath) => {
    return advancedFilter.importFilters(filePath);
});

ipcMain.handle('clear-all-advanced-filters', async () => {
    return advancedFilter.clearAllFilters();
});

// ==================== SIMPLE FILTER IPC HANDLERS ====================

ipcMain.handle('create-filter-config', async (event, name, options) => {
    return simpleFilter.createFilterConfig(name, options);
});

ipcMain.handle('get-filter-config', async (event, id) => {
    return simpleFilter.getFilterConfig(id);
});

ipcMain.handle('delete-filter-config', async (event, id) => {
    return simpleFilter.deleteFilterConfig(id);
});

ipcMain.handle('get-all-filter-configs', async () => {
    return simpleFilter.getAllFilterConfigs();
});

ipcMain.handle('use-filter-config', async (event, id) => {
    return simpleFilter.useFilterConfig(id);
});

ipcMain.handle('apply-filter-config', async (event, results, configId) => {
    return simpleFilter.applyFilterConfig(results, configId);
});

ipcMain.handle('export-filter-configs', async () => {
    return simpleFilter.exportFilterConfigs();
});

ipcMain.handle('import-filter-configs', async () => {
    return simpleFilter.importFilterConfigs();
});

ipcMain.handle('clear-all-filter-configs', async () => {
    return simpleFilter.clearAllFilterConfigs();
});

// ==================== EXPORT TO EXCEL IPC HANDLER ====================

ipcMain.handle('export-to-excel', async (event, data) => {
    const fs = require('fs');
    const path = require('path');
    const { dialog } = require('electron');
    
    try {
        // Show save dialog
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Lưu file Excel',
            defaultPath: `shopee_products_${Date.now()}.csv`,
            filters: [
                { name: 'CSV Files', extensions: ['csv'] }
            ]
        });

        if (result.canceled) {
            return { success: false, error: 'User cancelled' };
        }

        const filePath = result.filePath;
        
        // Convert data to CSV
        if (data.length === 0) {
            return { success: false, error: 'No data to export' };
        }

        // Get headers from first row
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        // Convert each row to CSV
        const csvRows = data.map(row => 
            headers.map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes if contains comma or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return '"' + value.replace(/"/g, '""') + '"';
                }
                return value;
            }).join(',')
        );

        const csvContent = [csvHeaders, ...csvRows].join('\n');
        
        // Write file
        fs.writeFileSync(filePath, csvContent, 'utf8');
        
        return { success: true, filePath };
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        return { success: false, error: error.message };
    }
});