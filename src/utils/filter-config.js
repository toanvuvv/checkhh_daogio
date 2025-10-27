const fs = require('fs');
const path = require('path');
const os = require('os');
const CryptoUtils = require('./crypto-utils');

class FilterConfig {
    constructor() {
        this.configDir = path.join(os.homedir(), '.shopee_filter_configs');
        this.configFile = path.join(this.configDir, 'filter_configs.dat');
        
        // Tạo thư mục config nếu chưa có
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
        
        this.configs = new Map();
        this.loadConfigs();
    }
    
    /**
     * Tạo config filter nhanh
     * @param {string} name - Tên config
     * @param {Object} options - Các tùy chọn filter
     * @returns {boolean} - True nếu tạo thành công
     */
    createQuickConfig(name, options = {}) {
        try {
            const config = {
                name,
                id: this.generateConfigId(),
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
                useCount: 0,
                ...options
            };
            
            this.configs.set(config.id, config);
            this.saveConfigs();
            
            console.log(`✅ Created quick config: ${name} (ID: ${config.id})`);
            return true;
        } catch (error) {
            console.error('❌ Error creating quick config:', error.message);
            return false;
        }
    }
    
    /**
     * Lưu config filter
     * @param {string} id - Config ID
     * @param {Object} config - Config data
     * @returns {boolean} - True nếu lưu thành công
     */
    saveConfig(id, config) {
        try {
            config.id = id;
            config.lastModified = new Date().toISOString();
            
            this.configs.set(id, config);
            this.saveConfigs();
            
            console.log(`✅ Saved config: ${config.name} (ID: ${id})`);
            return true;
        } catch (error) {
            console.error('❌ Error saving config:', error.message);
            return false;
        }
    }
    
    /**
     * Lấy config filter
     * @param {string} id - Config ID
     * @returns {Object|null} - Config data hoặc null
     */
    getConfig(id) {
        return this.configs.get(id) || null;
    }
    
    /**
     * Xóa config filter
     * @param {string} id - Config ID
     * @returns {boolean} - True nếu xóa thành công
     */
    deleteConfig(id) {
        try {
            const deleted = this.configs.delete(id);
            if (deleted) {
                this.saveConfigs();
                console.log(`🗑️ Deleted config: ${id}`);
            }
            return deleted;
        } catch (error) {
            console.error('❌ Error deleting config:', error.message);
            return false;
        }
    }
    
    /**
     * Lấy danh sách tất cả configs
     * @returns {Array} - Danh sách configs
     */
    getAllConfigs() {
        return Array.from(this.configs.values()).sort((a, b) => 
            new Date(b.lastUsed) - new Date(a.lastUsed)
        );
    }
    
    /**
     * Sử dụng config (tăng useCount và cập nhật lastUsed)
     * @param {string} id - Config ID
     * @returns {Object|null} - Config data hoặc null
     */
    useConfig(id) {
        const config = this.configs.get(id);
        if (config) {
            config.useCount = (config.useCount || 0) + 1;
            config.lastUsed = new Date().toISOString();
            this.saveConfigs();
        }
        return config;
    }
    
    /**
     * Tạo các config filter nhanh phổ biến
     */
    createDefaultConfigs() {
        const defaultConfigs = [
            {
                name: 'Chỉ sản phẩm hợp lệ',
                description: 'Hiển thị chỉ những sản phẩm hợp lệ',
                filters: {
                    status: 'valid',
                    issue: 'all'
                }
            },
            {
                name: 'Sản phẩm có vấn đề',
                description: 'Hiển thị những sản phẩm có vấn đề',
                filters: {
                    status: 'invalid',
                    issue: 'all'
                }
            },
            {
                name: 'Hoa hồng cao (10%+)',
                description: 'Hiển thị sản phẩm có hoa hồng từ 10% trở lên',
                filters: {
                    status: 'all',
                    issue: 'all',
                    commission: '10+'
                }
            },
            {
                name: 'Giá dưới 100k',
                description: 'Hiển thị sản phẩm có giá dưới 100k',
                filters: {
                    status: 'all',
                    issue: 'all',
                    price: '0-100000'
                }
            },
            {
                name: 'Tồn kho cao (100+)',
                description: 'Hiển thị sản phẩm có tồn kho trên 100',
                filters: {
                    status: 'all',
                    issue: 'all',
                    stock: '100+'
                }
            },
            {
                name: 'Sản phẩm hết hàng',
                description: 'Hiển thị những sản phẩm hết hàng',
                filters: {
                    status: 'all',
                    issue: 'out-of-stock'
                }
            },
            {
                name: 'Sản phẩm bị ẩn',
                description: 'Hiển thị những sản phẩm đã bị ẩn',
                filters: {
                    status: 'all',
                    issue: 'unlisted'
                }
            },
            {
                name: 'Tất cả sản phẩm',
                description: 'Hiển thị tất cả sản phẩm',
                filters: {
                    status: 'all',
                    issue: 'all'
                }
            }
        ];
        
        defaultConfigs.forEach(config => {
            this.createQuickConfig(config.name, {
                description: config.description,
                filters: config.filters,
                isDefault: true
            });
        });
        
        console.log(`✅ Created ${defaultConfigs.length} default configs`);
    }
    
    /**
     * Áp dụng config filter lên kết quả
     * @param {Array} results - Mảng kết quả
     * @param {string} configId - Config ID
     * @returns {Array} - Kết quả đã được filter
     */
    applyConfig(results, configId) {
        const config = this.useConfig(configId);
        if (!config || !config.filters) {
            return results;
        }
        
        let filteredResults = [...results];
        const filters = config.filters;
        
        // Filter by status
        if (filters.status && filters.status !== 'all') {
            if (filters.status === 'valid') {
                filteredResults = filteredResults.filter(r => r.isValid);
            } else if (filters.status === 'invalid') {
                filteredResults = filteredResults.filter(r => !r.isValid);
            }
        }
        
        // Filter by issue
        if (filters.issue && filters.issue !== 'all') {
            filteredResults = filteredResults.filter(r => {
                switch (filters.issue) {
                    case 'deleted':
                        return r.isDel || r.status?.isDel;
                    case 'unlisted':
                        return r.isUnlisted || r.status?.isUnlisted;
                    case 'prohibited':
                        return r.isProhibited || r.status?.isProhibited;
                    case 'out-of-stock':
                        return r.isOos || r.status?.isOos || (r.stock || r.status?.stock || 0) <= 0;
                    case 'inactive':
                        return (r.status || 1) !== 1;
                    default:
                        return true;
                }
            });
        }
        
        // Filter by commission rate
        if (filters.commission && filters.commission !== 'all') {
            filteredResults = filteredResults.filter(r => {
                const commission = r.commissionRate || r.comm_rate || 0;
                const commissionPercent = commission / 100;
                
                switch (filters.commission) {
                    case '0-5':
                        return commissionPercent >= 0 && commissionPercent < 5;
                    case '5-10':
                        return commissionPercent >= 5 && commissionPercent < 10;
                    case '10-15':
                        return commissionPercent >= 10 && commissionPercent < 15;
                    case '10+':
                        return commissionPercent >= 10;
                    case '15+':
                        return commissionPercent >= 15;
                    default:
                        return true;
                }
            });
        }
        
        // Filter by price
        if (filters.price && filters.price !== 'all') {
            filteredResults = filteredResults.filter(r => {
                const price = parseInt(r.price || r.price_min || 0);
                
                switch (filters.price) {
                    case '0-50000':
                        return price > 0 && price < 50000;
                    case '50000-100000':
                        return price >= 50000 && price < 100000;
                    case '0-100000':
                        return price > 0 && price < 100000;
                    case '100000-500000':
                        return price >= 100000 && price < 500000;
                    case '500000+':
                        return price >= 500000;
                    default:
                        return true;
                }
            });
        }
        
        // Filter by stock
        if (filters.stock && filters.stock !== 'all') {
            filteredResults = filteredResults.filter(r => {
                const stock = r.stock || r.status?.stock || 0;
                
                switch (filters.stock) {
                    case '0':
                        return stock === 0;
                    case '1-10':
                        return stock >= 1 && stock <= 10;
                    case '10-100':
                        return stock > 10 && stock <= 100;
                    case '100+':
                        return stock > 100;
                    default:
                        return true;
                }
            });
        }
        
        // Filter by stock range (legacy support)
        if (filters.minStock !== undefined) {
            filteredResults = filteredResults.filter(r => (r.stock || r.status?.stock || 0) >= filters.minStock);
        }
        
        if (filters.maxStock !== undefined) {
            filteredResults = filteredResults.filter(r => (r.stock || r.status?.stock || 0) <= filters.maxStock);
        }
        
        // Filter by item ID range (legacy support)
        if (filters.minItemId !== undefined) {
            filteredResults = filteredResults.filter(r => parseInt(r.itemId) >= filters.minItemId);
        }
        
        if (filters.maxItemId !== undefined) {
            filteredResults = filteredResults.filter(r => parseInt(r.itemId) <= filters.maxItemId);
        }
        
        return filteredResults;
    }
    
    /**
     * Tạo config từ filter hiện tại
     * @param {string} name - Tên config
     * @param {Object} currentFilters - Filter hiện tại
     * @returns {boolean} - True nếu tạo thành công
     */
    createConfigFromCurrent(name, currentFilters) {
        return this.createQuickConfig(name, {
            description: `Config được tạo từ filter hiện tại`,
            filters: { ...currentFilters },
            isCustom: true
        });
    }
    
    /**
     * Export configs
     * @param {string} filePath - Đường dẫn file export
     * @returns {boolean} - True nếu export thành công
     */
    exportConfigs(filePath) {
        try {
            const data = {
                configs: Object.fromEntries(this.configs),
                version: '1.0.0',
                exportDate: new Date().toISOString()
            };
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`📤 Configs exported to: ${filePath}`);
            return true;
        } catch (error) {
            console.error('❌ Error exporting configs:', error.message);
            return false;
        }
    }
    
    /**
     * Import configs
     * @param {string} filePath - Đường dẫn file import
     * @returns {boolean} - True nếu import thành công
     */
    importConfigs(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error('File not found');
            }
            
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (data.configs) {
                this.configs = new Map(Object.entries(data.configs));
                this.saveConfigs();
                console.log(`📥 Configs imported from: ${filePath}`);
                return true;
            } else {
                throw new Error('Invalid configs file format');
            }
        } catch (error) {
            console.error('❌ Error importing configs:', error.message);
            return false;
        }
    }
    
    /**
     * Xóa tất cả configs
     * @returns {boolean} - True nếu xóa thành công
     */
    clearAllConfigs() {
        try {
            this.configs.clear();
            if (fs.existsSync(this.configFile)) {
                fs.unlinkSync(this.configFile);
            }
            console.log('🧹 All configs cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing configs:', error.message);
            return false;
        }
    }
    
    /**
     * Tạo config ID duy nhất
     * @returns {string} - Config ID
     */
    generateConfigId() {
        return 'config_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Lưu configs vào file (encrypted)
     */
    saveConfigs() {
        try {
            const data = {
                configs: Object.fromEntries(this.configs),
                version: '1.0.0',
                lastSave: new Date().toISOString()
            };
            
            const key = CryptoUtils.deriveKeyFromDeviceId('default_config_key');
            const encryptedData = CryptoUtils.encryptData(JSON.stringify(data), key);
            fs.writeFileSync(this.configFile, encryptedData);
            
            console.log('💾 Configs saved to file');
        } catch (error) {
            console.error('❌ Error saving configs to file:', error.message);
        }
    }
    
    /**
     * Load configs từ file (decrypted)
     */
    loadConfigs() {
        try {
            if (!fs.existsSync(this.configFile)) {
                console.log('📁 No configs file found, creating default configs');
                this.createDefaultConfigs();
                return;
            }
            
            const encryptedData = fs.readFileSync(this.configFile, 'utf8');
            const key = CryptoUtils.deriveKeyFromDeviceId('default_config_key');
            const decryptedData = CryptoUtils.decryptData(encryptedData, key);
            const data = JSON.parse(decryptedData);
            
            if (data.configs) {
                this.configs = new Map(Object.entries(data.configs));
                console.log(`📂 Loaded ${this.configs.size} config entries`);
            }
        } catch (error) {
            console.error('❌ Error loading configs:', error.message);
            // Nếu file bị corrupt, tạo default configs
            this.createDefaultConfigs();
        }
    }
}

module.exports = FilterConfig;
