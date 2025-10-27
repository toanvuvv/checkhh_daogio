const fs = require('fs');
const path = require('path');
const os = require('os');
const CryptoUtils = require('./crypto-utils');

class SimpleFilter {
    constructor() {
        this.configDir = path.join(os.homedir(), '.shopee_simple_filters');
        this.configFile = path.join(this.configDir, 'simple_filters.dat');
        
        // Tạo thư mục config nếu chưa có
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
        
        this.filters = new Map();
        this.loadFilters();
    }
    
    /**
     * Tạo filter config đơn giản
     * @param {string} name - Tên filter
     * @param {Object} options - Tùy chọn filter
     * @returns {boolean} - True nếu tạo thành công
     */
    createFilterConfig(name, options = {}) {
        try {
            const filter = {
                name,
                id: this.generateFilterId(),
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
                useCount: 0,
                description: options.description || '',
                conditions: this.validateConditions(options.conditions || {}),
                ...options
            };
            
            this.filters.set(filter.id, filter);
            this.saveFilters();
            
            console.log(`✅ Created simple filter config: ${name} (ID: ${filter.id})`);
            return true;
        } catch (error) {
            console.error('❌ Error creating simple filter config:', error.message);
            return false;
        }
    }
    
    /**
     * Validate điều kiện filter đơn giản
     * @param {Object} conditions - Điều kiện lọc
     * @returns {Object} - Điều kiện đã validate
     */
    validateConditions(conditions) {
        const validated = {};
        
        // Commission conditions
        if (conditions.commission) {
            validated.commission = {};
            if (conditions.commission.min !== undefined) {
                validated.commission.min = Math.max(0, Math.min(100, parseFloat(conditions.commission.min) || 0));
            }
            if (conditions.commission.max !== undefined) {
                validated.commission.max = Math.max(0, Math.min(100, parseFloat(conditions.commission.max) || 100));
            }
        }
        
        // Price conditions
        if (conditions.price) {
            validated.price = {};
            if (conditions.price.min !== undefined) {
                validated.price.min = Math.max(0, parseInt(conditions.price.min) || 0);
            }
            if (conditions.price.max !== undefined) {
                validated.price.max = Math.max(0, parseInt(conditions.price.max) || 10000000);
            }
        }
        
        // Stock conditions
        if (conditions.stock) {
            validated.stock = {};
            if (conditions.stock.min !== undefined) {
                validated.stock.min = Math.max(0, parseInt(conditions.stock.min) || 0);
            }
            if (conditions.stock.max !== undefined) {
                validated.stock.max = Math.max(0, parseInt(conditions.stock.max) || 10000);
            }
        }
        
        return validated;
    }
    
    /**
     * Áp dụng filter đơn giản
     * @param {Array} results - Dữ liệu sản phẩm
     * @param {Object} conditions - Điều kiện lọc
     * @returns {Array} - Kết quả đã lọc
     */
    applySimpleFilter(results, conditions) {
        if (!Array.isArray(results) || results.length === 0) {
            return [];
        }
        
        return results.filter(product => {
            // Commission filter
            if (conditions.commission) {
                const commission = parseFloat(product.commissionRate || product.comm_rate || 0) / 1000; // Convert from basis points to percentage
                if (conditions.commission.min !== undefined && commission < conditions.commission.min) return false;
                if (conditions.commission.max !== undefined && commission > conditions.commission.max) return false;
            }
            
            // Price filter
            if (conditions.price) {
                const price = parseInt(product.price || product.price_min || 0);
                if (conditions.price.min !== undefined && price < conditions.price.min) return false;
                if (conditions.price.max !== undefined && price > conditions.price.max) return false;
            }
            
            // Stock filter
            if (conditions.stock) {
                const stock = parseInt(product.stock || product.status?.stock || 0);
                if (conditions.stock.min !== undefined && stock < conditions.stock.min) return false;
                if (conditions.stock.max !== undefined && stock > conditions.stock.max) return false;
            }
            
            return true;
        });
    }
    
    /**
     * Áp dụng filter config
     * @param {Array} results - Dữ liệu sản phẩm
     * @param {string} configId - ID của config
     * @returns {Array} - Kết quả đã lọc
     */
    applyFilterConfig(results, configId) {
        const config = this.filters.get(configId);
        if (!config) {
            throw new Error(`Filter config not found: ${configId}`);
        }
        
        // Update usage stats
        config.useCount = (config.useCount || 0) + 1;
        config.lastUsed = new Date().toISOString();
        this.saveFilters();
        
        return this.applySimpleFilter(results, config.conditions);
    }
    
    /**
     * Lấy filter config theo ID
     * @param {string} id - ID của filter
     * @returns {Object|null} - Filter config hoặc null
     */
    getFilterConfig(id) {
        return this.filters.get(id) || null;
    }
    
    /**
     * Lấy tất cả filter configs
     * @returns {Array} - Danh sách filter configs
     */
    getAllFilterConfigs() {
        return Array.from(this.filters.values()).sort((a, b) => 
            new Date(b.lastUsed) - new Date(a.lastUsed)
        );
    }
    
    /**
     * Xóa filter config
     * @param {string} id - ID của filter
     * @returns {boolean} - True nếu xóa thành công
     */
    deleteFilterConfig(id) {
        if (!this.filters.has(id)) {
            return false;
        }
        
        this.filters.delete(id);
        this.saveFilters();
        console.log(`✅ Deleted simple filter config: ${id}`);
        return true;
    }
    
    /**
     * Sử dụng filter config (update stats)
     * @param {string} id - ID của filter
     * @returns {boolean} - True nếu thành công
     */
    useFilterConfig(id) {
        const config = this.filters.get(id);
        if (!config) {
            return false;
        }
        
        config.useCount = (config.useCount || 0) + 1;
        config.lastUsed = new Date().toISOString();
        this.saveFilters();
        
        return true;
    }
    
    /**
     * Export filter configs
     * @returns {boolean} - True nếu export thành công
     */
    exportFilterConfigs() {
        try {
            const data = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                filters: Array.from(this.filters.values())
            };
            
            const filePath = path.join(this.configDir, `simple_filters_export_${Date.now()}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            
            console.log(`✅ Exported simple filter configs to: ${filePath}`);
            return true;
        } catch (error) {
            console.error('❌ Error exporting simple filter configs:', error.message);
            return false;
        }
    }
    
    /**
     * Import filter configs
     * @returns {boolean} - True nếu import thành công
     */
    importFilterConfigs() {
        try {
            const files = fs.readdirSync(this.configDir).filter(file => 
                file.startsWith('simple_filters_export_') && file.endsWith('.json')
            );
            
            if (files.length === 0) {
                console.log('No export files found');
                return false;
            }
            
            // Lấy file export mới nhất
            const latestFile = files.sort().pop();
            const filePath = path.join(this.configDir, latestFile);
            
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (!data.filters || !Array.isArray(data.filters)) {
                throw new Error('Invalid export file format');
            }
            
            // Import filters
            let importedCount = 0;
            for (const filter of data.filters) {
                if (filter.id && filter.name) {
                    this.filters.set(filter.id, filter);
                    importedCount++;
                }
            }
            
            this.saveFilters();
            console.log(`✅ Imported ${importedCount} simple filter configs from: ${latestFile}`);
            return true;
        } catch (error) {
            console.error('❌ Error importing simple filter configs:', error.message);
            return false;
        }
    }
    
    /**
     * Xóa tất cả filter configs
     * @returns {boolean} - True nếu xóa thành công
     */
    clearAllFilterConfigs() {
        try {
            this.filters.clear();
            this.saveFilters();
            console.log('✅ Cleared all simple filter configs');
            return true;
        } catch (error) {
            console.error('❌ Error clearing simple filter configs:', error.message);
            return false;
        }
    }
    
    /**
     * Tạo ID duy nhất cho filter
     * @returns {string} - ID duy nhất
     */
    generateFilterId() {
        return 'simple_filter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Load filters từ file
     */
    loadFilters() {
        try {
            if (fs.existsSync(this.configFile)) {
                const encryptedData = fs.readFileSync(this.configFile);
                const decryptedData = CryptoUtils.decrypt(encryptedData);
                const data = JSON.parse(decryptedData);
                
                this.filters = new Map(data.filters || []);
                console.log(`✅ Loaded ${this.filters.size} simple filter configs`);
            }
        } catch (error) {
            console.error('❌ Error loading simple filter configs:', error.message);
            this.filters = new Map();
        }
    }
    
    /**
     * Save filters vào file
     */
    saveFilters() {
        try {
            const data = {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                filters: Array.from(this.filters.entries())
            };
            
            const jsonData = JSON.stringify(data);
            const encryptedData = CryptoUtils.encrypt(jsonData);
            
            fs.writeFileSync(this.configFile, encryptedData);
        } catch (error) {
            console.error('❌ Error saving simple filter configs:', error.message);
        }
    }
}

module.exports = SimpleFilter;
