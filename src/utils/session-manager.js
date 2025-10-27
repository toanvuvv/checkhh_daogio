const fs = require('fs');
const path = require('path');
const os = require('os');
const CryptoUtils = require('./crypto-utils');

class SessionManager {
    constructor() {
        this.sessionsDir = path.join(os.homedir(), '.shopee_sessions');
        this.sessionsFile = path.join(this.sessionsDir, 'sessions.dat');
        
        // Tạo thư mục sessions nếu chưa có
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
        
        this.sessions = new Map();
        this.loadSessions();
    }
    
    /**
     * Lưu session ID cho một user
     * @param {string} username - Tên user
     * @param {number} sessionId - Session ID
     * @param {Object} metadata - Thông tin bổ sung
     */
    saveSession(username, sessionId, metadata = {}) {
        try {
            const sessionData = {
                username,
                sessionId: parseInt(sessionId),
                lastUpdate: new Date().toISOString(),
                isActive: true,
                ...metadata
            };
            
            this.sessions.set(username, sessionData);
            this.saveToFile();
            
            console.log(`✅ Session saved for user: ${username} (ID: ${sessionId})`);
            return true;
        } catch (error) {
            console.error('❌ Error saving session:', error.message);
            return false;
        }
    }
    
    /**
     * Lấy session ID của user
     * @param {string} username - Tên user
     * @returns {Object|null} - Session data hoặc null
     */
    getSession(username) {
        const sessionData = this.sessions.get(username);
        if (!sessionData) {
            return null;
        }
        
        // Kiểm tra session có còn active không (24 giờ)
        const lastUpdate = new Date(sessionData.lastUpdate);
        const now = new Date();
        const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            console.log(`⚠️ Session for ${username} may be expired (${Math.round(hoursDiff)} hours old)`);
            sessionData.isActive = false;
            this.saveToFile();
        }
        
        return sessionData;
    }
    
    /**
     * Xóa session của user
     * @param {string} username - Tên user
     */
    deleteSession(username) {
        try {
            this.sessions.delete(username);
            this.saveToFile();
            console.log(`🗑️ Session deleted for user: ${username}`);
            return true;
        } catch (error) {
            console.error('❌ Error deleting session:', error.message);
            return false;
        }
    }
    
    /**
     * Lấy danh sách tất cả sessions
     * @returns {Array} - Danh sách sessions
     */
    getAllSessions() {
        return Array.from(this.sessions.keys()).map(username => {
            const sessionData = this.sessions.get(username);
            return {
                username,
                sessionId: sessionData.sessionId,
                lastUpdate: sessionData.lastUpdate,
                isActive: sessionData.isActive
            };
        });
    }
    
    /**
     * Kiểm tra session có hợp lệ không
     * @param {string} username - Tên user
     * @returns {boolean} - True nếu session hợp lệ
     */
    isSessionValid(username) {
        const sessionData = this.getSession(username);
        return sessionData && sessionData.isActive && sessionData.sessionId;
    }
    
    /**
     * Cập nhật trạng thái session
     * @param {string} username - Tên user
     * @param {boolean} isActive - Trạng thái active
     */
    updateSessionStatus(username, isActive) {
        const sessionData = this.sessions.get(username);
        if (sessionData) {
            sessionData.isActive = isActive;
            sessionData.lastUpdate = new Date().toISOString();
            this.saveToFile();
        }
    }
    
    /**
     * Validate session ID format
     * @param {string|number} sessionId - Session ID để validate
     * @returns {boolean} - True nếu format hợp lệ
     */
    validateSessionId(sessionId) {
        const id = parseInt(sessionId);
        return !isNaN(id) && id > 0 && id.toString().length >= 6;
    }
    
    /**
     * Lưu sessions vào file (encrypted)
     */
    saveToFile() {
        try {
            const data = {
                sessions: Object.fromEntries(this.sessions),
                version: '1.0.0',
                lastSave: new Date().toISOString()
            };
            
            const key = CryptoUtils.deriveKeyFromDeviceId('default_session_key');
            const encryptedData = CryptoUtils.encryptData(JSON.stringify(data), key);
            fs.writeFileSync(this.sessionsFile, encryptedData);
            
            console.log('💾 Sessions saved to file');
        } catch (error) {
            console.error('❌ Error saving sessions to file:', error.message);
        }
    }
    
    /**
     * Load sessions từ file (decrypted)
     */
    loadSessions() {
        try {
            if (!fs.existsSync(this.sessionsFile)) {
                console.log('📁 No sessions file found, starting fresh');
                return;
            }
            
            const encryptedData = fs.readFileSync(this.sessionsFile, 'utf8');
            const key = CryptoUtils.deriveKeyFromDeviceId('default_session_key');
            const decryptedData = CryptoUtils.decryptData(encryptedData, key);
            const data = JSON.parse(decryptedData);
            
            if (data.sessions) {
                this.sessions = new Map(Object.entries(data.sessions));
                console.log(`📂 Loaded ${this.sessions.size} session entries`);
            }
        } catch (error) {
            console.error('❌ Error loading sessions:', error.message);
            // Nếu file bị corrupt, tạo mới
            this.sessions = new Map();
        }
    }
    
    /**
     * Xóa tất cả sessions
     */
    clearAllSessions() {
        try {
            this.sessions.clear();
            if (fs.existsSync(this.sessionsFile)) {
                fs.unlinkSync(this.sessionsFile);
            }
            console.log('🧹 All sessions cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing sessions:', error.message);
            return false;
        }
    }
    
    /**
     * Export sessions (backup)
     * @param {string} filePath - Đường dẫn file export
     */
    exportSessions(filePath) {
        try {
            const data = {
                sessions: Object.fromEntries(this.sessions),
                version: '1.0.0',
                exportDate: new Date().toISOString()
            };
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`📤 Sessions exported to: ${filePath}`);
            return true;
        } catch (error) {
            console.error('❌ Error exporting sessions:', error.message);
            return false;
        }
    }
    
    /**
     * Import sessions (restore)
     * @param {string} filePath - Đường dẫn file import
     */
    importSessions(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error('File not found');
            }
            
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (data.sessions) {
                this.sessions = new Map(Object.entries(data.sessions));
                this.saveToFile();
                console.log(`📥 Sessions imported from: ${filePath}`);
                return true;
            } else {
                throw new Error('Invalid sessions file format');
            }
        } catch (error) {
            console.error('❌ Error importing sessions:', error.message);
            return false;
        }
    }
}

module.exports = SessionManager;
