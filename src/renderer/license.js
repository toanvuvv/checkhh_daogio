const axios = require('axios');
const path = require('path');
const os = require('os');
const DeviceInfo = require('../utils/device-info');
const CryptoUtils = require('../utils/crypto-utils');

class LicenseManager {
    constructor(options = {}) {
        this.serverUrl = options.serverUrl?.replace(/\/$/, '') || '';
        this.secretKey = options.secretKey || '';
        this.cacheDir = options.cacheDir || path.join(os.homedir(), '.license_cache');
        this.cacheFile = path.join(this.cacheDir, 'license_cache.dat');
        
        // Tạo cache directory nếu chưa có
        if (!require('fs').existsSync(this.cacheDir)) {
            require('fs').mkdirSync(this.cacheDir, { recursive: true });
        }
        
        // Tạo device ID
        this.deviceId = DeviceInfo.generateDeviceId(this.secretKey);
        
        // License data
        this.licenseData = null;
        this.activationToken = null;
        this.isActivated = false;
        
        // Load cached license data
        this._loadCachedLicense();
    }
    
    /**
     * Lấy device ID để gửi cho admin
     */
    getDeviceId() {
        return this.deviceId;
    }
    
    /**
     * Lấy thông tin thiết bị
     */
    getDeviceInfo() {
        return DeviceInfo.getDeviceInfo();
    }
    
    /**
     * Kích hoạt license với license key
     */
    async activate(licenseKey) {
        try {
            // Input validation
            if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.trim().length === 0) {
                throw new Error('Invalid license key format');
            }
            
            // Rate limiting check
            if (!CryptoUtils.checkRateLimit(this.deviceId)) {
                throw new Error('Too many activation attempts. Please try again later.');
            }
            
            // Chuẩn bị activation request
            const deviceInfo = this.getDeviceInfo();
            
            const payload = {
                license_key: licenseKey.trim(),
                device_id: this.deviceId,
                device_info: deviceInfo
            };
            
            console.log('Activation payload:', JSON.stringify(payload, null, 2));
            console.log('Server URL:', this.serverUrl);
            
            // Gửi activation request với timeout
            const response = await axios.post(`${this.serverUrl}/api/activate`, payload, {
                timeout: 30000, // 30 seconds timeout
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ElectronLicenseApp/1.0.0'
                }
            });
            
            console.log('Activation response:', response.data);
            
            if (response.data.status === 'success') {
                // Lưu activation data
                this.activationToken = response.data.activation_token;
                this.licenseData = response.data.license_info;
                this.isActivated = true;
                
                // Clear rate limit on success
                CryptoUtils.clearRateLimit(this.deviceId);
                
                // Lưu vào cache
                this._saveLicenseCache();
                
                return true;
            } else {
                console.error('Activation failed:', response.data.message || 'Unknown error');
                return false;
            }
        } catch (error) {
            console.error('Activation error:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            
            // Handle specific error types
            if (error.code === 'ECONNABORTED') {
                throw new Error('Connection timeout. Please check your internet connection.');
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                throw new Error('Cannot connect to license server. Please check your internet connection.');
            } else if (error.message.includes('Too many activation attempts')) {
                throw error; // Re-throw rate limiting errors
            }
            
            return false;
        }
    }
    
    /**
     * Validate license (heartbeat check) với rate limiting và cache 1 ngày
     */
    async validate(forceOnline = false) {
        try {
            // Kiểm tra cache trước (ưu tiên cache trong 1 ngày)
            if (!forceOnline && this.licenseData) {
                const cacheValid = CryptoUtils.isCacheValid(this.licenseData, 1); // Cache 1 ngày
                if (cacheValid) {
                    // Kiểm tra license có hết hạn local không
                    if (!CryptoUtils.isLicenseExpired(this.licenseData)) {
                        console.log('Using cached license data (valid for 1 day)');
                        
                        // Tự động refresh cache nếu cần
                        await this._autoRefreshCache();
                        
                        return true;
                    } else {
                        console.log('License has expired');
                        return false;
                    }
                } else {
                    console.log('Cache expired (>1 day), need to check server');
                }
            }
            
            // Rate limiting check (chỉ khi cần check server)
            if (!CryptoUtils.checkRateLimit(this.deviceId)) {
                console.log('Rate limited: Too many validation attempts');
                // Fallback to cache if available (ngay cả khi cache cũ)
                if (this.licenseData && CryptoUtils.isCacheValid(this.licenseData, 3)) {
                    console.log('Using expired cache due to rate limiting');
                    return true;
                }
                return false;
            }
            
            // Cần validation online - nhưng nếu không có token thì dùng cache
            if (!this.isActivated || !this.activationToken) {
                console.log('No activation token available, using cache only');
                // Nếu có cache và cache vẫn trong grace period, dùng cache
                if (this.licenseData && CryptoUtils.isCacheValid(this.licenseData, 3)) {
                    console.log('Using cache due to no activation token');
                    return true;
                }
                return false;
            }
            
            // Gửi validation request
            const payload = {
                device_id: this.deviceId,
                app_version: '1.0.0' // Có thể customize
            };
            
            const headers = {
                'Authorization': `Bearer ${this.activationToken}`
            };
            
            const response = await axios.post(`${this.serverUrl}/api/validate`, payload, { headers });
            
            if (response.data.status === 'valid') {
                // Cập nhật license data
                this.licenseData = {
                    ...this.licenseData,
                    expire_date: response.data.expire_date,
                    last_validation: new Date().toISOString()
                };
                
                // Lưu updated cache
                this._saveLicenseCache();
                return true;
            } else {
                console.log(`License validation failed: ${response.data.message || 'Unknown error'}`);
                // Clear license data nếu server báo invalid
                this._clearLicenseData();
                // Emit event để main process xử lý
                if (typeof window !== 'undefined' && window.require) {
                    const { ipcRenderer } = window.require('electron');
                    ipcRenderer.send('license-revoked');
                }
                return false;
            }
        } catch (error) {
            console.error('Network error during validation:', error.message);
            // Nếu offline và cache valid, cho phép sử dụng
            if (this.licenseData && CryptoUtils.isCacheValid(this.licenseData, 3)) {
                console.log('Using cached license data (offline mode)');
                return true;
            }
            return false;
        }
    }
    
    /**
     * Kiểm tra license có valid không (convenience method)
     */
    async isValid() {
        return await this.validate();
    }
    
    /**
     * Lấy thông tin license
     */
    getLicenseInfo() {
        if (!this.isActivated) {
            return null;
        }
        
        // Tính toán cache status
        let cacheStatus = 'Unknown';
        let cacheAge = 0;
        
        if (this.licenseData && this.licenseData.last_validation) {
            const lastValidation = new Date(this.licenseData.last_validation);
            const now = new Date();
            cacheAge = Math.floor((now - lastValidation) / (1000 * 60 * 60)); // hours
            
            if (CryptoUtils.isCacheValid(this.licenseData, 1)) {
                cacheStatus = 'Valid (1 day cache)';
            } else if (CryptoUtils.isCacheValid(this.licenseData, 3)) {
                cacheStatus = 'Expired but usable (3 day grace)';
            } else {
                cacheStatus = 'Expired';
            }
        }
        
        return {
            license_key: this.licenseData?.license_key,
            expire_date: this.licenseData?.expire_date,
            max_devices: this.licenseData?.max_devices || 1,
            type: this.licenseData?.type || 'unknown',
            last_validation: this.licenseData?.last_validation,
            device_id: this.deviceId,
            cache_status: cacheStatus,
            cache_age_hours: cacheAge
        };
    }
    
    /**
     * Deactivate license trên thiết bị này
     */
    async deactivate() {
        try {
            if (!this.isActivated) {
                return true; // Đã deactivate rồi
            }
            
            const response = await axios.post(`${this.serverUrl}/api/deactivate`, {
                device_id: this.deviceId
            });
            
            if (response.data.status === 'success') {
                // Clear local data
                this._clearLicenseData();
                return true;
            } else {
                console.error('Deactivation failed:', response.data.message || 'Unknown error');
                return false;
            }
        } catch (error) {
            console.error('Deactivation error:', error.message);
            return false;
        }
    }
    
    /**
     * Load cached license data
     */
    _loadCachedLicense() {
        try {
            const cachedData = CryptoUtils.loadEncryptedCache(this.deviceId, this.cacheFile);
            if (cachedData && CryptoUtils.isCacheValid(cachedData)) {
                this.licenseData = cachedData;
                this.isActivated = true;
                // Note: activation_token không được cache vì lý do bảo mật
            }
        } catch (error) {
            // Ignore cache loading errors
        }
    }
    
    /**
     * Lưu license data vào encrypted cache
     */
    _saveLicenseCache() {
        if (this.licenseData) {
            CryptoUtils.saveEncryptedCache(this.licenseData, this.deviceId, this.cacheFile);
        }
    }
    
    /**
     * Clear tất cả license data
     */
    _clearLicenseData() {
        this.licenseData = null;
        this.activationToken = null;
        this.isActivated = false;
        
        // Xóa cache file
        try {
            if (require('fs').existsSync(this.cacheFile)) {
                require('fs').unlinkSync(this.cacheFile);
            }
        } catch (error) {
            // Ignore file removal errors
        }
    }
    
    /**
     * Force validation - luôn kiểm tra server
     */
    async forceValidation() {
        console.log('Force validation - checking server...');
        return await this.validate(true);
    }
    
    /**
     * Clear cache và force re-validation
     */
    async clearCacheAndValidate() {
        console.log('Clearing cache and re-validating...');
        this._clearLicenseData();
        return await this.validate(true);
    }
    
    /**
     * Check server trong background (không block UI)
     */
    async _checkServerInBackground() {
        try {
            // Nếu không có activation token, không check server
            if (!this.isActivated || !this.activationToken) {
                console.log('No activation token available for background check - using cache only');
                return;
            }
            
            const payload = {
                device_id: this.deviceId,
                app_version: '1.0.0'
            };
            
            const headers = {
                'Authorization': `Bearer ${this.activationToken}`
            };
            
            const response = await axios.post(`${this.serverUrl}/api/validate`, payload, { headers });
            
            if (response.data.status === 'valid') {
                // Cập nhật cache với thông tin mới
                this.licenseData = {
                    ...this.licenseData,
                    expire_date: response.data.expire_date,
                    last_validation: new Date().toISOString()
                };
                this._saveLicenseCache();
                console.log('Background validation successful - cache refreshed');
            } else {
                console.log('Background validation failed - license may be revoked');
                // Clear license data và thông báo user
                this._clearLicenseData();
                // Emit event để main process xử lý
                if (typeof window !== 'undefined' && window.require) {
                    const { ipcRenderer } = window.require('electron');
                    ipcRenderer.send('license-revoked');
                }
            }
        } catch (error) {
            console.log('Background validation error:', error.message);
            // Không làm gì khi offline hoặc lỗi
        }
    }
    
    /**
     * Tự động refresh cache khi hết hạn
     */
    async _autoRefreshCache() {
        try {
            if (!this.licenseData) {
                return false;
            }
            
            // Nếu không có activation token, không thể refresh
            if (!this.activationToken) {
                console.log('No activation token available for auto-refresh');
                return false;
            }
            
            const lastValidation = new Date(this.licenseData.last_validation || 0);
            const now = new Date();
            const hoursSinceValidation = (now - lastValidation) / (1000 * 60 * 60);
            
            // Nếu cache cũ hơn 20 giờ, tự động refresh
            if (hoursSinceValidation > 20) {
                console.log('Cache is old (>20h), auto-refreshing...');
                await this._checkServerInBackground();
                return true;
            }
            
            return false;
        } catch (error) {
            console.log('Auto refresh cache error:', error.message);
            return false;
        }
    }
}

module.exports = LicenseManager;

