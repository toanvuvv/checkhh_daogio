const fs = require('fs');
const path = require('path');
const os = require('os');
const CryptoUtils = require('./crypto-utils');

class CookieManager {
    constructor() {
        this.cookiesDir = path.join(os.homedir(), '.shopee_cookies');
        this.cookiesFile = path.join(this.cookiesDir, 'cookies.dat');
        
        // Tạo thư mục cookies nếu chưa có
        if (!fs.existsSync(this.cookiesDir)) {
            fs.mkdirSync(this.cookiesDir, { recursive: true });
        }
        
        this.cookies = new Map();
        this.loadCookies();
    }
    
    /**
     * Lưu cookies cho một user
     * @param {string} username - Tên user
     * @param {string} cookies - Chuỗi cookies
     * @param {Object} metadata - Thông tin bổ sung (sessionId, lastUpdate, etc.)
     */
    saveCookies(username, cookies, metadata = {}) {
        try {
            const cookieData = {
                username,
                cookies,
                lastUpdate: new Date().toISOString(),
                isValid: true,
                ...metadata
            };
            
            this.cookies.set(username, cookieData);
            this.saveToFile();
            
            console.log(`✅ Cookies saved for user: ${username}`);
            return true;
        } catch (error) {
            console.error('❌ Error saving cookies:', error.message);
            return false;
        }
    }
    
    /**
     * Lấy cookies của user
     * @param {string} username - Tên user
     * @returns {Object|null} - Cookie data hoặc null
     */
    getCookies(username) {
        const cookieData = this.cookies.get(username);
        if (!cookieData) {
            return null;
        }
        
        // Kiểm tra cookies có còn hạn không (7 ngày)
        const lastUpdate = new Date(cookieData.lastUpdate);
        const now = new Date();
        const daysDiff = (now - lastUpdate) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 7) {
            console.log(`⚠️ Cookies for ${username} may be expired (${Math.round(daysDiff)} days old)`);
            cookieData.isValid = false;
            this.saveToFile();
        }
        
        return cookieData;
    }
    
    /**
     * Xóa cookies của user
     * @param {string} username - Tên user
     */
    deleteCookies(username) {
        try {
            this.cookies.delete(username);
            this.saveToFile();
            console.log(`🗑️ Cookies deleted for user: ${username}`);
            return true;
        } catch (error) {
            console.error('❌ Error deleting cookies:', error.message);
            return false;
        }
    }
    
    /**
     * Lấy danh sách tất cả users
     * @returns {Array} - Danh sách users
     */
    getAllUsers() {
        return Array.from(this.cookies.keys()).map(username => {
            const cookieData = this.cookies.get(username);
            return {
                username,
                lastUpdate: cookieData.lastUpdate,
                isValid: cookieData.isValid,
                sessionId: cookieData.sessionId
            };
        });
    }
    
    /**
     * Kiểm tra cookies có hợp lệ không
     * @param {string} username - Tên user
     * @returns {boolean} - True nếu cookies hợp lệ
     */
    isCookiesValid(username) {
        const cookieData = this.getCookies(username);
        return cookieData && cookieData.isValid && cookieData.cookies;
    }
    
    /**
     * Cập nhật trạng thái cookies
     * @param {string} username - Tên user
     * @param {boolean} isValid - Trạng thái hợp lệ
     */
    updateCookiesStatus(username, isValid) {
        const cookieData = this.cookies.get(username);
        if (cookieData) {
            cookieData.isValid = isValid;
            cookieData.lastUpdate = new Date().toISOString();
            this.saveToFile();
        }
    }
    
    /**
     * Lưu cookies vào file (encrypted)
     */
    saveToFile() {
        try {
            const data = {
                cookies: Object.fromEntries(this.cookies),
                version: '1.0.0',
                lastSave: new Date().toISOString()
            };
            
            const key = CryptoUtils.deriveKeyFromDeviceId('default_cookie_key');
            const encryptedData = CryptoUtils.encryptData(JSON.stringify(data), key);
            fs.writeFileSync(this.cookiesFile, encryptedData);
            
            console.log('💾 Cookies saved to file');
        } catch (error) {
            console.error('❌ Error saving cookies to file:', error.message);
        }
    }
    
    /**
     * Load cookies từ file (decrypted)
     */
    loadCookies() {
        try {
            if (!fs.existsSync(this.cookiesFile)) {
                console.log('📁 No cookies file found, starting fresh');
                return;
            }
            
            const encryptedData = fs.readFileSync(this.cookiesFile, 'utf8');
            const key = CryptoUtils.deriveKeyFromDeviceId('default_cookie_key');
            const decryptedData = CryptoUtils.decryptData(encryptedData, key);
            const data = JSON.parse(decryptedData);
            
            if (data.cookies) {
                this.cookies = new Map(Object.entries(data.cookies));
                console.log(`📂 Loaded ${this.cookies.size} cookie entries`);
            }
        } catch (error) {
            console.error('❌ Error loading cookies:', error.message);
            // Nếu file bị corrupt, tạo mới
            this.cookies = new Map();
        }
    }
    
    /**
     * Xóa tất cả cookies
     */
    clearAllCookies() {
        try {
            this.cookies.clear();
            if (fs.existsSync(this.cookiesFile)) {
                fs.unlinkSync(this.cookiesFile);
            }
            console.log('🧹 All cookies cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing cookies:', error.message);
            return false;
        }
    }
    
    /**
     * Export cookies (backup)
     * @param {string} filePath - Đường dẫn file export
     */
    exportCookies(filePath) {
        try {
            const data = {
                cookies: Object.fromEntries(this.cookies),
                version: '1.0.0',
                exportDate: new Date().toISOString()
            };
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`📤 Cookies exported to: ${filePath}`);
            return true;
        } catch (error) {
            console.error('❌ Error exporting cookies:', error.message);
            return false;
        }
    }
    
    /**
     * Import cookies (restore)
     * @param {string} filePath - Đường dẫn file import
     */
    importCookies(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error('File not found');
            }
            
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (data.cookies) {
                this.cookies = new Map(Object.entries(data.cookies));
                this.saveToFile();
                console.log(`📥 Cookies imported from: ${filePath}`);
                return true;
            } else {
                throw new Error('Invalid cookies file format');
            }
        } catch (error) {
            console.error('❌ Error importing cookies:', error.message);
            return false;
        }
    }
}

module.exports = CookieManager;
