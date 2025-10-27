const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // License management
    getDeviceId: () => ipcRenderer.invoke('get-device-id'),
    activateLicense: (licenseKey) => ipcRenderer.invoke('activate-license', licenseKey),
    validateLicense: () => ipcRenderer.invoke('validate-license'),
    getLicenseInfo: () => ipcRenderer.invoke('get-license-info'),
    deactivateLicense: () => ipcRenderer.invoke('deactivate-license'),
    forceValidateLicense: () => ipcRenderer.invoke('force-validate-license'),
    clearCacheAndValidate: () => ipcRenderer.invoke('clear-cache-and-validate'),
    
    // Event listeners
    onShowLicenseForm: (callback) => ipcRenderer.on('show-license-form', callback),
    onLicenseInvalid: (callback) => ipcRenderer.on('license-invalid', callback),
    onLicenseRevoked: (callback) => ipcRenderer.on('license-revoked', callback),
    
    // App control
    exitApp: () => ipcRenderer.send('exit-app'),
    
    // Cookie management
    saveCookies: (username, cookies, metadata) => ipcRenderer.invoke('save-cookies', username, cookies, metadata),
    getCookies: (username) => ipcRenderer.invoke('get-cookies', username),
    deleteCookies: (username) => ipcRenderer.invoke('delete-cookies', username),
    getAllUsers: () => ipcRenderer.invoke('get-all-users'),
    isCookiesValid: (username) => ipcRenderer.invoke('is-cookies-valid', username),
    updateCookiesStatus: (username, isValid) => ipcRenderer.invoke('update-cookies-status', username, isValid),
    clearAllCookies: () => ipcRenderer.invoke('clear-all-cookies'),
    exportCookies: (filePath) => ipcRenderer.invoke('export-cookies', filePath),
    importCookies: (filePath) => ipcRenderer.invoke('import-cookies', filePath),
    
    // Session management
    saveSession: (username, sessionId, metadata) => ipcRenderer.invoke('save-session', username, sessionId, metadata),
    getSession: (username) => ipcRenderer.invoke('get-session', username),
    deleteSession: (username) => ipcRenderer.invoke('delete-session', username),
    getAllSessions: () => ipcRenderer.invoke('get-all-sessions'),
    isSessionValid: (username) => ipcRenderer.invoke('is-session-valid', username),
    updateSessionStatus: (username, isActive) => ipcRenderer.invoke('update-session-status', username, isActive),
    validateSessionId: (sessionId) => ipcRenderer.invoke('validate-session-id', sessionId),
    clearAllSessions: () => ipcRenderer.invoke('clear-all-sessions'),
    exportSessions: (filePath) => ipcRenderer.invoke('export-sessions', filePath),
    importSessions: (filePath) => ipcRenderer.invoke('import-sessions', filePath),
    
    // Shopee parser
    parseProductLink: (url) => ipcRenderer.invoke('parse-product-link', url),
    parseMultipleLinks: (urls) => ipcRenderer.invoke('parse-multiple-links', urls),
    getValidLinks: (urls) => ipcRenderer.invoke('get-valid-links', urls),
    getInvalidLinks: (urls) => ipcRenderer.invoke('get-invalid-links', urls),
    createProductLink: (itemId, shopId) => ipcRenderer.invoke('create-product-link', itemId, shopId),
    isShopeeLink: (url) => ipcRenderer.invoke('is-shopee-link', url),
    cleanInputUrls: (input) => ipcRenderer.invoke('clean-input-urls', input),
    cleanInputUrlsWithDuplicates: (input) => ipcRenderer.invoke('clean-input-urls-with-duplicates', input),
    parseWithProgress: (urls) => ipcRenderer.invoke('parse-with-progress', urls),
    onParseProgress: (callback) => ipcRenderer.on('parse-progress', (event, data) => callback(data)),
    removeParseProgressListener: (callback) => ipcRenderer.removeListener('parse-progress', callback),
    
    // Shopee API
    createProductSet: (sessionId, items, cookies, purpose) => ipcRenderer.invoke('create-product-set', sessionId, items, cookies, purpose),
    getProductSetInfo: (sessionId, productSetId, cookies) => ipcRenderer.invoke('get-product-set-info', sessionId, productSetId, cookies),
    attachProductSet: (sessionId, setId, cookies) => ipcRenderer.invoke('attach-product-set', sessionId, setId, cookies),
    deleteProductSet: (sessionId, productSetId, cookies) => ipcRenderer.invoke('delete-product-set', sessionId, productSetId, cookies),
    validateProductsBatch: (sessionId, items, cookies) => ipcRenderer.invoke('validate-products-batch', sessionId, items, cookies),
    onValidationProgress: (callback) => ipcRenderer.on('validation-progress', (event, data) => callback(data)),
    removeValidationProgressListener: (callback) => ipcRenderer.removeListener('validation-progress', callback),
    addItemsToCart: (sessionId, items, cookies) => ipcRenderer.invoke('add-items-to-cart', sessionId, items, cookies),
    
    // Filter Config
    createQuickConfig: (name, options) => ipcRenderer.invoke('create-quick-config', name, options),
    saveConfig: (id, config) => ipcRenderer.invoke('save-config', id, config),
    getConfig: (id) => ipcRenderer.invoke('get-config', id),
    deleteConfig: (id) => ipcRenderer.invoke('delete-config', id),
    getAllConfigs: () => ipcRenderer.invoke('get-all-configs'),
    useConfig: (id) => ipcRenderer.invoke('use-config', id),
    applyConfig: (results, configId) => ipcRenderer.invoke('apply-config', results, configId),
    createConfigFromCurrent: (name, currentFilters) => ipcRenderer.invoke('create-config-from-current', name, currentFilters),
    exportConfigs: (filePath) => ipcRenderer.invoke('export-configs', filePath),
    importConfigs: (filePath) => ipcRenderer.invoke('import-configs', filePath),
    clearAllConfigs: () => ipcRenderer.invoke('clear-all-configs'),
    createDefaultConfigs: () => ipcRenderer.invoke('create-default-configs'),
    
    // Advanced Filter
    createAdvancedFilter: (name, options) => ipcRenderer.invoke('create-advanced-filter', name, options),
    getAdvancedFilter: (id) => ipcRenderer.invoke('get-advanced-filter', id),
    deleteAdvancedFilter: (id) => ipcRenderer.invoke('delete-advanced-filter', id),
    getAllAdvancedFilters: () => ipcRenderer.invoke('get-all-advanced-filters'),
    useAdvancedFilter: (id) => ipcRenderer.invoke('use-advanced-filter', id),
    applyAdvancedFilter: (results, filterId) => ipcRenderer.invoke('apply-advanced-filter', results, filterId),
    exportAdvancedFilters: (filePath) => ipcRenderer.invoke('export-advanced-filters', filePath),
    importAdvancedFilters: (filePath) => ipcRenderer.invoke('import-advanced-filters', filePath),
    clearAllAdvancedFilters: () => ipcRenderer.invoke('clear-all-advanced-filters'),
    
    // Simple Filter Config
    createFilterConfig: (name, options) => ipcRenderer.invoke('create-filter-config', name, options),
    getFilterConfig: (id) => ipcRenderer.invoke('get-filter-config', id),
    deleteFilterConfig: (id) => ipcRenderer.invoke('delete-filter-config', id),
    getAllFilterConfigs: () => ipcRenderer.invoke('get-all-filter-configs'),
    useFilterConfig: (id) => ipcRenderer.invoke('use-filter-config', id),
    applyFilterConfig: (results, configId) => ipcRenderer.invoke('apply-filter-config', results, configId),
    exportFilterConfigs: () => ipcRenderer.invoke('export-filter-configs'),
    importFilterConfigs: () => ipcRenderer.invoke('import-filter-configs'),
    clearAllFilterConfigs: () => ipcRenderer.invoke('clear-all-filter-configs'),
    
    // Export to Excel
    exportToExcel: (data) => ipcRenderer.invoke('export-to-excel', data),
    
    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Security: Prevent the renderer from accessing Node.js APIs
window.addEventListener('DOMContentLoaded', () => {
    // Remove any potential access to Node.js APIs
    delete window.require;
    delete window.exports;
    delete window.module;
});
