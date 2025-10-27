/**
 * Optimized App.js for Electron License App
 * Uses modern component architecture and performance optimizations
 */

// Global app instance
let app = null;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for dependencies to load
        await waitForDependencies();
        
        app = new OptimizedApp();
        await app.initialize();
        console.log('Optimized app initialized successfully');
    } catch (error) {
        console.error('App initialization failed:', error);
        
        // Fallback to basic functionality
        console.log('Falling back to basic functionality...');
        initializeBasicApp();
        
        if (window.errorHandler) {
            window.errorHandler.handleError(error);
        } else {
            console.error('Error handler not available:', error);
        }
    }
});

// Basic app initialization fallback
function initializeBasicApp() {
    console.log('Initializing basic app fallback...');
    
    // Setup basic navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) {
                showPage(page);
            }
        });
    });
    
    // Setup basic forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(this);
        });
    });
    
    // Auto-load license info if on license page
    setTimeout(() => {
        if (document.getElementById('license-page') && 
            document.getElementById('license-page').style.display !== 'none') {
            console.log('Auto-loading license info in fallback mode...');
            if (window.showLicenseInfo) {
                window.showLicenseInfo();
            }
        }
    }, 1000);
    
    console.log('Basic app fallback initialized');
}

// Basic showPage function
function showPage(pageId) {
    console.log('Basic showPage called for:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.content-page').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[data-page="${pageId}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
    
    // Auto-load license info if switching to license page
    if (pageId === 'license-management' || pageId === 'license') {
        setTimeout(() => {
            console.log('Auto-loading license info for page:', pageId);
            if (window.showLicenseInfo) {
                window.showLicenseInfo();
            }
        }, 500);
    }
}

// Basic form handling
function handleFormSubmit(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    console.log('Form submitted:', data);
    
    // Basic validation
    if (form.id === 'license-form') {
        handleLicenseForm(data);
    } else if (form.id === 'login-form') {
        handleLoginForm(data);
    }
}

function handleLicenseForm(data) {
    const licenseKey = data.licenseKey;
    
    if (!licenseKey || licenseKey.length < 10) {
        showError('License key must be at least 10 characters');
        return;
    }
    
    // Simulate license validation
    showSuccess('License validated successfully!');
    
    // Show main app
    setTimeout(() => {
        showMainApp();
    }, 1000);
}

function handleLoginForm(data) {
    const email = data.email;
    const password = data.password;
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Simulate login
    showSuccess('Login successful!');
}

function showMainApp() {
    const licensePage = document.getElementById('license-page');
    const mainApp = document.getElementById('main-app');
    
    if (licensePage) {
        licensePage.style.display = 'none';
    }
    
    if (mainApp) {
        mainApp.style.display = 'block';
    }
}

function showSuccess(message) {
    showStatus('success', message);
}

function showError(message) {
    showStatus('error', message);
}

function showStatus(type, message) {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
    
    // Remove existing status messages
    const existingStatus = document.querySelector('.status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    document.body.insertBefore(statusDiv, document.body.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (statusDiv.parentNode) {
            statusDiv.remove();
        }
    }, 5000);
}

// Export basic functions globally
window.showPage = showPage;
window.showSuccess = showSuccess;
window.showError = showError;
window.showStatus = showStatus;

// Wait for dependencies to load
async function waitForDependencies() {
    const maxWait = 5000; // 5 seconds
    const startTime = Date.now();
    
    console.log('Waiting for dependencies to load...');
    
    while (Date.now() - startTime < maxWait) {
        const loaded = {
            BaseComponent: !!window.BaseComponent,
            appState: !!window.appState,
            errorHandler: !!window.errorHandler
        };
        
        console.log('Dependencies status:', loaded);
        
        if (loaded.BaseComponent && loaded.appState && loaded.errorHandler) {
            console.log('All dependencies loaded successfully');
            return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.warn('Dependencies not loaded within timeout, using fallback mode');
    throw new Error('Dependencies not loaded within timeout');
}

/**
 * Optimized App Class
 */
class OptimizedApp extends BaseComponent {
    constructor() {
        super(document.body, { autoRender: false });
        
        this.licenseManager = null;
        this.isLicenseValid = false;
        this.isShowingLicenseForm = false;
        this.currentPage = 'license';
        
        // Initialize state management
        this.state = window.appState ? window.appState.getState() : {};
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    /**
     * Initialize app
     */
    async initialize() {
        try {
            this.showLoading();
            
            // Check if electronAPI is available
            if (!window.electronAPI) {
                console.warn('electronAPI not available, using fallback mode');
                await this.initializeFallback();
                return;
            }
            
            // Initialize license manager
            await this.initializeLicenseManager();
            
            // Initialize UI
            await this.initializeUI();
            
            // Initialize performance monitoring
            this.initializePerformanceMonitoring();
            
            // Initialize bundle optimization
            if (window.bundleOptimizer) {
                await window.bundleOptimizer.initialize();
            }
            
            this.hideLoading();
            console.log('App initialized successfully');
            
        } catch (error) {
            this.hideLoading();
            if (window.errorHandler) {
                window.errorHandler.handleError(error);
            } else {
                console.error('Error during app initialization:', error);
            }
            await this.initializeFallback();
        }
    }
    
    /**
     * Initialize license manager
     */
    async initializeLicenseManager() {
        try {
            this.licenseManager = new LicenseManager();
            await this.licenseManager.initialize();
            
            // Check license status
            this.isLicenseValid = await this.licenseManager.checkLicense();
            
            if (this.isLicenseValid) {
                this.showMainApp();
            } else {
                this.showLicenseForm();
            }
            
        } catch (error) {
            console.error('License manager initialization failed:', error);
            this.showLicenseForm();
        }
    }
    
    /**
     * Initialize UI
     */
    async initializeUI() {
        // Setup navigation
        this.setupNavigation();
        
        // Setup forms
        this.setupForms();
        
        // Setup tables
        this.setupTables();
        
        // Setup responsive design
        this.setupResponsiveDesign();
    }
    
    /**
     * Setup navigation
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateToPage(page);
            });
        });
    }
    
    /**
     * Navigate to page
     */
    navigateToPage(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-page="${page}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
        
        // Show page
        document.querySelectorAll('.content-page').forEach(pageEl => {
            pageEl.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update state
        this.currentPage = page;
        if (window.appState) {
            window.appState.updateState('ui.currentPage', page);
        }
    }
    
    /**
     * Setup forms
     */
    setupForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const formComponent = new FormComponent(form, {
                autoRender: false
            });
            
            // Add validation rules
            this.setupFormValidation(formComponent);
            
            // Setup form event listeners
            this.setupFormEventListeners(formComponent);
        });
    }
    
    /**
     * Setup form validation
     */
    setupFormValidation(formComponent) {
        // License key validation
        formComponent.addValidationRule('licenseKey', (value) => {
            if (!value || value.length < 10) {
                return 'License key must be at least 10 characters';
            }
            return true;
        });
        
        // Email validation
        formComponent.addValidationRule('email', (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Please enter a valid email address';
            }
            return true;
        });
    }
    
    /**
     * Setup form event listeners
     */
    setupFormEventListeners(formComponent) {
        formComponent.addEventListener('submit', (data) => {
            this.handleFormSubmit(data);
        });
        
        formComponent.addEventListener('input', (data) => {
            this.handleFormInput(data);
        });
    }
    
    /**
     * Setup tables
     */
    setupTables() {
        const tables = document.querySelectorAll('.results-table');
        tables.forEach(table => {
            const tableComponent = new TableComponent(table, {
                autoRender: false
            });
            
            // Setup table event listeners
            this.setupTableEventListeners(tableComponent);
        });
    }
    
    /**
     * Setup table event listeners
     */
    setupTableEventListeners(tableComponent) {
        // Handle row selection
        tableComponent.addEventListener('rowSelect', (data) => {
            this.handleRowSelect(data);
        });
        
        // Handle sorting
        tableComponent.addEventListener('sort', (data) => {
            this.handleTableSort(data);
        });
    }
    
    /**
     * Setup responsive design
     */
    setupResponsiveDesign() {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        
        const handleResponsiveChange = (e) => {
            if (e.matches) {
                this.enableMobileMode();
            } else {
                this.disableMobileMode();
            }
        };
        
        mediaQuery.addListener(handleResponsiveChange);
        handleResponsiveChange(mediaQuery);
    }
    
    /**
     * Enable mobile mode
     */
    enableMobileMode() {
        document.body.classList.add('mobile-mode');
        this.setupMobileNavigation();
    }
    
    /**
     * Disable mobile mode
     */
    disableMobileMode() {
        document.body.classList.remove('mobile-mode');
    }
    
    /**
     * Setup mobile navigation
     */
    setupMobileNavigation() {
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.querySelector('.sidebar-toggle');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }
    }
    
    /**
     * Initialize performance monitoring
     */
    initializePerformanceMonitoring() {
        if (window.PerformanceUtils) {
            const metrics = PerformanceUtils.createPerformanceMonitor();
            
            // Monitor FPS
            setInterval(() => {
                if (metrics.fps < 30) {
                    console.warn('Low FPS detected:', metrics.fps);
                }
            }, 5000);
            
            // Monitor memory usage
            setInterval(() => {
                if (metrics.memory > 100) {
                    console.warn('High memory usage detected:', metrics.memory + 'MB');
                }
            }, 10000);
        }
    }
    
    /**
     * Show main app
     */
    showMainApp() {
        const licensePage = document.getElementById('license-page');
        const mainApp = document.getElementById('main-app');
        
        if (licensePage) {
            licensePage.style.display = 'none';
        }
        
        if (mainApp) {
            mainApp.style.display = 'block';
        }
        
        this.isShowingLicenseForm = false;
    }
    
    /**
     * Show license form
     */
    showLicenseForm() {
        const licensePage = document.getElementById('license-page');
        const mainApp = document.getElementById('main-app');
        
        if (licensePage) {
            licensePage.style.display = 'block';
        }
        
        if (mainApp) {
            mainApp.style.display = 'none';
        }
        
        this.isShowingLicenseForm = true;
    }
    
    /**
     * Initialize fallback mode
     */
    async initializeFallback() {
        console.log('Initializing fallback mode');
        this.showLicenseForm();
    }
    
    /**
     * Handle form submit
     */
    async handleFormSubmit(data) {
        try {
            this.showLoading();
            
            if (data.licenseKey) {
                await this.handleLicenseSubmit(data);
            } else if (data.email && data.password) {
                await this.handleLoginSubmit(data);
            }
            
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            errorHandler.handleError(error);
        }
    }
    
    /**
     * Handle license submit
     */
    async handleLicenseSubmit(data) {
        try {
            const result = await window.electronAPI.validateLicense(data.licenseKey);
            
            if (result.valid) {
                this.showSuccess('License validated successfully!');
                this.showMainApp();
            } else {
                this.showError('Invalid license key');
            }
        } catch (error) {
            this.showError('License validation failed');
            throw error;
        }
    }
    
    /**
     * Handle login submit
     */
    async handleLoginSubmit(data) {
        try {
            // Implement login logic
            console.log('Login attempt:', data.email);
            this.showSuccess('Login successful!');
        } catch (error) {
            this.showError('Login failed');
            throw error;
        }
    }
    
    /**
     * Handle form input
     */
    handleFormInput(data) {
        // Real-time validation feedback
        if (data.errors && data.errors.length > 0) {
            console.log(`Validation error in ${data.fieldName}:`, data.errors[0]);
        }
    }
    
    /**
     * Handle row select
     */
    handleRowSelect(data) {
        console.log('Row selected:', data);
    }
    
    /**
     * Handle table sort
     */
    handleTableSort(data) {
        console.log('Table sorted by:', data.column, data.direction);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Global error handling
        window.addEventListener('error', (event) => {
            if (window.errorHandler) {
                window.errorHandler.handleError(event.error);
            } else {
                console.error('Global error:', event.error);
            }
        });
        
        // Global unhandled promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            if (window.errorHandler) {
                window.errorHandler.handleError(event.reason);
            } else {
                console.error('Unhandled promise rejection:', event.reason);
            }
        });
        
        // State change listeners
        if (window.appState) {
            window.appState.subscribe((prevState, newState) => {
                this.handleStateChange(prevState, newState);
            });
        }
    }
    
    /**
     * Handle state change
     */
    handleStateChange(prevState, newState) {
        // Update UI based on state changes
        if (newState.ui.currentPage !== prevState.ui.currentPage) {
            this.navigateToPage(newState.ui.currentPage);
        }
        
        if (newState.ui && newState.ui.isLoading !== prevState.ui.isLoading) {
            if (newState.ui.isLoading) {
                this.showLoading();
            } else {
                this.hideLoading();
            }
        }
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        document.body.classList.add('loading');
        if (window.appState) {
            window.appState.updateState('ui.isLoading', true);
        }
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        document.body.classList.remove('loading');
        if (window.appState) {
            window.appState.updateState('ui.isLoading', false);
        }
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        this.showStatus('success', message);
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.showStatus('error', message);
    }
    
    /**
     * Show status message
     */
    showStatus(type, message) {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status ${type}`;
        statusDiv.textContent = message;
        
        // Remove existing status messages
        const existingStatus = document.querySelector('.status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        document.body.insertBefore(statusDiv, document.body.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }
}

/**
 * License Manager Class
 */
class LicenseManager {
    constructor() {
        this.licenseKey = '';
        this.deviceId = '';
        this.isValid = false;
    }
    
    /**
     * Initialize license manager
     */
    async initialize() {
        try {
            this.deviceId = await window.electronAPI.getDeviceId();
            console.log('Device ID:', this.deviceId);
        } catch (error) {
            console.error('Failed to get device ID:', error);
            throw error;
        }
    }
    
    /**
     * Check license validity
     */
    async checkLicense() {
        try {
            // Check if electronAPI has checkLicense method
            if (window.electronAPI && typeof window.electronAPI.checkLicense === 'function') {
                const result = await window.electronAPI.checkLicense();
                this.isValid = result.valid;
                return this.isValid;
            } else {
                console.warn('checkLicense method not available in electronAPI');
                return false;
            }
        } catch (error) {
            console.error('License check failed:', error);
            return false;
        }
    }
    
    /**
     * Validate license key
     */
    async validateLicense(licenseKey) {
        try {
            if (window.electronAPI && typeof window.electronAPI.validateLicense === 'function') {
                const result = await window.electronAPI.validateLicense(licenseKey);
                this.isValid = result.valid;
                this.licenseKey = licenseKey;
                return result;
            } else {
                console.warn('validateLicense method not available in electronAPI');
                return { valid: false, message: 'API not available' };
            }
        } catch (error) {
            console.error('License validation failed:', error);
            throw error;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OptimizedApp, LicenseManager };
} else {
    window.OptimizedApp = OptimizedApp;
    window.LicenseManager = LicenseManager;
}
