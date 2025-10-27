const fs = require('fs');
const path = require('path');
const os = require('os');
const CryptoUtils = require('./crypto-utils');

class AdvancedFilter {
    constructor() {
        this.configDir = path.join(os.homedir(), '.shopee_advanced_filters');
        this.configFile = path.join(this.configDir, 'advanced_filters.dat');
        
        // Tạo thư mục config nếu chưa có
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
        
        this.filters = new Map();
        this.loadFilters();
    }
    
    /**
     * Tạo filter nâng cao với điều kiện tùy chỉnh
     * @param {string} name - Tên filter
     * @param {Object} conditions - Điều kiện lọc
     * @returns {boolean} - True nếu tạo thành công
     */
    createAdvancedFilter(name, conditions = {}) {
        try {
            const filter = {
                name,
                id: this.generateFilterId(),
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
                useCount: 0,
                conditions: this.validateConditions(conditions),
                ...conditions
            };
            
            this.filters.set(filter.id, filter);
            this.saveFilters();
            
            console.log(`✅ Created advanced filter: ${name} (ID: ${filter.id})`);
            return true;
        } catch (error) {
            console.error('❌ Error creating advanced filter:', error.message);
            return false;
        }
    }
    
    /**
     * Validate điều kiện filter
     * @param {Object} conditions - Điều kiện
     * @returns {Object} - Điều kiện đã validate
     */
    validateConditions(conditions) {
        const validated = {};
        
        // Commission filters
        if (conditions.commission) {
            validated.commission = this.validateCommissionFilter(conditions.commission);
        }
        
        // Price filters
        if (conditions.price) {
            validated.price = this.validatePriceFilter(conditions.price);
        }
        
        // Stock filters
        if (conditions.stock) {
            validated.stock = this.validateStockFilter(conditions.stock);
        }
        
        // Status filters
        if (conditions.status) {
            validated.status = this.validateStatusFilter(conditions.status);
        }
        
        // Date filters
        if (conditions.date) {
            validated.date = this.validateDateFilter(conditions.date);
        }
        
        // Custom range filters
        if (conditions.customRanges) {
            validated.customRanges = this.validateCustomRanges(conditions.customRanges);
        }
        
        return validated;
    }
    
    /**
     * Validate commission filter
     * @param {Object} commissionFilter - Commission filter
     * @returns {Object} - Validated commission filter
     */
    validateCommissionFilter(commissionFilter) {
        const validated = {};
        
        if (commissionFilter.min !== undefined) {
            validated.min = Math.max(0, parseFloat(commissionFilter.min) || 0);
        }
        
        if (commissionFilter.max !== undefined) {
            validated.max = Math.min(100, parseFloat(commissionFilter.max) || 100);
        }
        
        if (commissionFilter.exact !== undefined) {
            validated.exact = parseFloat(commissionFilter.exact) || 0;
        }
        
        if (commissionFilter.ranges) {
            validated.ranges = commissionFilter.ranges.map(range => ({
                min: Math.max(0, parseFloat(range.min) || 0),
                max: Math.min(100, parseFloat(range.max) || 100),
                label: range.label || `${range.min}% - ${range.max}%`
            }));
        }
        
        return validated;
    }
    
    /**
     * Validate price filter
     * @param {Object} priceFilter - Price filter
     * @returns {Object} - Validated price filter
     */
    validatePriceFilter(priceFilter) {
        const validated = {};
        
        if (priceFilter.min !== undefined) {
            validated.min = Math.max(0, parseInt(priceFilter.min) || 0);
        }
        
        if (priceFilter.max !== undefined) {
            validated.max = Math.max(0, parseInt(priceFilter.max) || 999999999);
        }
        
        if (priceFilter.exact !== undefined) {
            validated.exact = parseInt(priceFilter.exact) || 0;
        }
        
        if (priceFilter.ranges) {
            validated.ranges = priceFilter.ranges.map(range => ({
                min: Math.max(0, parseInt(range.min) || 0),
                max: Math.max(0, parseInt(range.max) || 999999999),
                label: range.label || `${this.formatPrice(range.min)} - ${this.formatPrice(range.max)}`
            }));
        }
        
        return validated;
    }
    
    /**
     * Validate stock filter
     * @param {Object} stockFilter - Stock filter
     * @returns {Object} - Validated stock filter
     */
    validateStockFilter(stockFilter) {
        const validated = {};
        
        if (stockFilter.min !== undefined) {
            validated.min = Math.max(0, parseInt(stockFilter.min) || 0);
        }
        
        if (stockFilter.max !== undefined) {
            validated.max = Math.max(0, parseInt(stockFilter.max) || 999999999);
        }
        
        if (stockFilter.exact !== undefined) {
            validated.exact = parseInt(stockFilter.exact) || 0;
        }
        
        if (stockFilter.ranges) {
            validated.ranges = stockFilter.ranges.map(range => ({
                min: Math.max(0, parseInt(range.min) || 0),
                max: Math.max(0, parseInt(range.max) || 999999999),
                label: range.label || `${range.min} - ${range.max}`
            }));
        }
        
        return validated;
    }
    
    /**
     * Validate status filter
     * @param {Object} statusFilter - Status filter
     * @returns {Object} - Validated status filter
     */
    validateStatusFilter(statusFilter) {
        const validated = {};
        
        if (statusFilter.valid !== undefined) {
            validated.valid = Boolean(statusFilter.valid);
        }
        
        if (statusFilter.issues) {
            validated.issues = Array.isArray(statusFilter.issues) ? statusFilter.issues : [];
        }
        
        if (statusFilter.statuses) {
            validated.statuses = Array.isArray(statusFilter.statuses) ? statusFilter.statuses : [];
        }
        
        return validated;
    }
    
    /**
     * Validate date filter
     * @param {Object} dateFilter - Date filter
     * @returns {Object} - Validated date filter
     */
    validateDateFilter(dateFilter) {
        const validated = {};
        
        if (dateFilter.from) {
            validated.from = new Date(dateFilter.from);
        }
        
        if (dateFilter.to) {
            validated.to = new Date(dateFilter.to);
        }
        
        if (dateFilter.period) {
            validated.period = dateFilter.period; // 'today', 'week', 'month', 'year'
        }
        
        return validated;
    }
    
    /**
     * Validate custom ranges
     * @param {Array} customRanges - Custom ranges
     * @returns {Array} - Validated custom ranges
     */
    validateCustomRanges(customRanges) {
        if (!Array.isArray(customRanges)) {
            return [];
        }
        
        return customRanges.map(range => ({
            field: range.field || 'price',
            min: parseFloat(range.min) || 0,
            max: parseFloat(range.max) || 999999999,
            label: range.label || `${range.field}: ${range.min} - ${range.max}`,
            operator: range.operator || 'between' // 'between', 'greater', 'less', 'equal'
        }));
    }
    
    /**
     * Áp dụng filter nâng cao lên kết quả
     * @param {Array} results - Mảng kết quả
     * @param {string} filterId - Filter ID
     * @returns {Array} - Kết quả đã được filter
     */
    applyAdvancedFilter(results, filterId) {
        const filter = this.useFilter(filterId);
        if (!filter || !filter.conditions) {
            return results;
        }
        
        let filteredResults = [...results];
        const conditions = filter.conditions;
        
        // Apply commission filter
        if (conditions.commission) {
            filteredResults = this.applyCommissionFilter(filteredResults, conditions.commission);
        }
        
        // Apply price filter
        if (conditions.price) {
            filteredResults = this.applyPriceFilter(filteredResults, conditions.price);
        }
        
        // Apply stock filter
        if (conditions.stock) {
            filteredResults = this.applyStockFilter(filteredResults, conditions.stock);
        }
        
        // Apply status filter
        if (conditions.status) {
            filteredResults = this.applyStatusFilter(filteredResults, conditions.status);
        }
        
        // Apply date filter
        if (conditions.date) {
            filteredResults = this.applyDateFilter(filteredResults, conditions.date);
        }
        
        // Apply custom ranges
        if (conditions.customRanges) {
            filteredResults = this.applyCustomRanges(filteredResults, conditions.customRanges);
        }
        
        return filteredResults;
    }
    
    /**
     * Apply commission filter
     * @param {Array} results - Results
     * @param {Object} commissionFilter - Commission filter
     * @returns {Array} - Filtered results
     */
    applyCommissionFilter(results, commissionFilter) {
        return results.filter(result => {
            const commission = result.commissionRate || result.comm_rate || 0;
            const commissionPercent = commission / 100;
            
            // Exact match
            if (commissionFilter.exact !== undefined) {
                return Math.abs(commissionPercent - commissionFilter.exact) < 0.1;
            }
            
            // Range match
            if (commissionFilter.ranges && commissionFilter.ranges.length > 0) {
                return commissionFilter.ranges.some(range => 
                    commissionPercent >= range.min && commissionPercent <= range.max
                );
            }
            
            // Min/Max match
            let matches = true;
            if (commissionFilter.min !== undefined) {
                matches = matches && commissionPercent >= commissionFilter.min;
            }
            if (commissionFilter.max !== undefined) {
                matches = matches && commissionPercent <= commissionFilter.max;
            }
            
            return matches;
        });
    }
    
    /**
     * Apply price filter
     * @param {Array} results - Results
     * @param {Object} priceFilter - Price filter
     * @returns {Array} - Filtered results
     */
    applyPriceFilter(results, priceFilter) {
        return results.filter(result => {
            const price = parseInt(result.price || result.price_min || 0);
            
            // Exact match
            if (priceFilter.exact !== undefined) {
                return price === priceFilter.exact;
            }
            
            // Range match
            if (priceFilter.ranges && priceFilter.ranges.length > 0) {
                return priceFilter.ranges.some(range => 
                    price >= range.min && price <= range.max
                );
            }
            
            // Min/Max match
            let matches = true;
            if (priceFilter.min !== undefined) {
                matches = matches && price >= priceFilter.min;
            }
            if (priceFilter.max !== undefined) {
                matches = matches && price <= priceFilter.max;
            }
            
            return matches;
        });
    }
    
    /**
     * Apply stock filter
     * @param {Array} results - Results
     * @param {Object} stockFilter - Stock filter
     * @returns {Array} - Filtered results
     */
    applyStockFilter(results, stockFilter) {
        return results.filter(result => {
            const stock = result.stock || result.status?.stock || 0;
            
            // Exact match
            if (stockFilter.exact !== undefined) {
                return stock === stockFilter.exact;
            }
            
            // Range match
            if (stockFilter.ranges && stockFilter.ranges.length > 0) {
                return stockFilter.ranges.some(range => 
                    stock >= range.min && stock <= range.max
                );
            }
            
            // Min/Max match
            let matches = true;
            if (stockFilter.min !== undefined) {
                matches = matches && stock >= stockFilter.min;
            }
            if (stockFilter.max !== undefined) {
                matches = matches && stock <= stockFilter.max;
            }
            
            return matches;
        });
    }
    
    /**
     * Apply status filter
     * @param {Array} results - Results
     * @param {Object} statusFilter - Status filter
     * @returns {Array} - Filtered results
     */
    applyStatusFilter(results, statusFilter) {
        return results.filter(result => {
            // Valid/Invalid filter
            if (statusFilter.valid !== undefined) {
                if (statusFilter.valid !== result.isValid) {
                    return false;
                }
            }
            
            // Issues filter
            if (statusFilter.issues && statusFilter.issues.length > 0) {
                const hasMatchingIssue = statusFilter.issues.some(issue => {
                    switch (issue) {
                        case 'deleted':
                            return result.isDel || result.status?.isDel;
                        case 'unlisted':
                            return result.isUnlisted || result.status?.isUnlisted;
                        case 'prohibited':
                            return result.isProhibited || result.status?.isProhibited;
                        case 'out-of-stock':
                            return result.isOos || result.status?.isOos || (result.stock || result.status?.stock || 0) <= 0;
                        case 'inactive':
                            return (result.status || 1) !== 1;
                        default:
                            return false;
                    }
                });
                
                if (!hasMatchingIssue) {
                    return false;
                }
            }
            
            // Statuses filter
            if (statusFilter.statuses && statusFilter.statuses.length > 0) {
                const resultStatus = result.status || 1;
                if (!statusFilter.statuses.includes(resultStatus)) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    /**
     * Apply date filter
     * @param {Array} results - Results
     * @param {Object} dateFilter - Date filter
     * @returns {Array} - Filtered results
     */
    applyDateFilter(results, dateFilter) {
        return results.filter(result => {
            const resultDate = new Date(result.createdAt || result.lastUpdate || Date.now());
            
            // Period filter
            if (dateFilter.period) {
                const now = new Date();
                const periodStart = this.getPeriodStart(now, dateFilter.period);
                return resultDate >= periodStart;
            }
            
            // Date range filter
            let matches = true;
            if (dateFilter.from) {
                matches = matches && resultDate >= dateFilter.from;
            }
            if (dateFilter.to) {
                matches = matches && resultDate <= dateFilter.to;
            }
            
            return matches;
        });
    }
    
    /**
     * Apply custom ranges
     * @param {Array} results - Results
     * @param {Array} customRanges - Custom ranges
     * @returns {Array} - Filtered results
     */
    applyCustomRanges(results, customRanges) {
        return results.filter(result => {
            return customRanges.every(range => {
                const value = this.getFieldValue(result, range.field);
                
                switch (range.operator) {
                    case 'between':
                        return value >= range.min && value <= range.max;
                    case 'greater':
                        return value > range.min;
                    case 'less':
                        return value < range.max;
                    case 'equal':
                        return value === range.min;
                    default:
                        return true;
                }
            });
        });
    }
    
    /**
     * Get field value from result
     * @param {Object} result - Result object
     * @param {string} field - Field name
     * @returns {number} - Field value
     */
    getFieldValue(result, field) {
        switch (field) {
            case 'price':
                return parseInt(result.price || result.price_min || 0);
            case 'commission':
                return (result.commissionRate || result.comm_rate || 0) / 100;
            case 'stock':
                return result.stock || result.status?.stock || 0;
            case 'sold':
                return result.sold || 0;
            case 'discount':
                return result.discount || 0;
            default:
                return 0;
        }
    }
    
    /**
     * Get period start date
     * @param {Date} now - Current date
     * @param {string} period - Period type
     * @returns {Date} - Period start date
     */
    getPeriodStart(now, period) {
        const start = new Date(now);
        
        switch (period) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start.setDate(start.getDate() - 7);
                break;
            case 'month':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'year':
                start.setFullYear(start.getFullYear() - 1);
                break;
        }
        
        return start;
    }
    
    /**
     * Format price for display
     * @param {number} price - Price value
     * @returns {string} - Formatted price
     */
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(parseInt(price));
    }
    
    /**
     * Sử dụng filter (tăng useCount và cập nhật lastUsed)
     * @param {string} id - Filter ID
     * @returns {Object|null} - Filter data hoặc null
     */
    useFilter(id) {
        const filter = this.filters.get(id);
        if (filter) {
            filter.useCount = (filter.useCount || 0) + 1;
            filter.lastUsed = new Date().toISOString();
            this.saveFilters();
        }
        return filter;
    }
    
    /**
     * Lấy filter theo ID
     * @param {string} id - Filter ID
     * @returns {Object|null} - Filter data hoặc null
     */
    getFilter(id) {
        return this.filters.get(id) || null;
    }
    
    /**
     * Lấy danh sách tất cả filters
     * @returns {Array} - Danh sách filters
     */
    getAllFilters() {
        return Array.from(this.filters.values()).sort((a, b) => 
            new Date(b.lastUsed) - new Date(a.lastUsed)
        );
    }
    
    /**
     * Xóa filter
     * @param {string} id - Filter ID
     * @returns {boolean} - True nếu xóa thành công
     */
    deleteFilter(id) {
        try {
            const deleted = this.filters.delete(id);
            if (deleted) {
                this.saveFilters();
                console.log(`🗑️ Deleted filter: ${id}`);
            }
            return deleted;
        } catch (error) {
            console.error('❌ Error deleting filter:', error.message);
            return false;
        }
    }
    
    /**
     * Tạo filter ID duy nhất
     * @returns {string} - Filter ID
     */
    generateFilterId() {
        return 'adv_filter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Lưu filters vào file (encrypted)
     */
    saveFilters() {
        try {
            const data = {
                filters: Object.fromEntries(this.filters),
                version: '1.0.0',
                lastSave: new Date().toISOString()
            };
            
            const key = CryptoUtils.deriveKeyFromDeviceId('advanced_filter_key');
            const encryptedData = CryptoUtils.encryptData(JSON.stringify(data), key);
            fs.writeFileSync(this.configFile, encryptedData);
            
            console.log('💾 Advanced filters saved to file');
        } catch (error) {
            console.error('❌ Error saving advanced filters to file:', error.message);
        }
    }
    
    /**
     * Export filters
     * @param {string} filePath - Đường dẫn file export
     * @returns {boolean} - True nếu export thành công
     */
    exportFilters(filePath) {
        try {
            const data = {
                filters: Object.fromEntries(this.filters),
                version: '1.0.0',
                exportDate: new Date().toISOString()
            };
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`📤 Advanced filters exported to: ${filePath}`);
            return true;
        } catch (error) {
            console.error('❌ Error exporting advanced filters:', error.message);
            return false;
        }
    }
    
    /**
     * Import filters
     * @param {string} filePath - Đường dẫn file import
     * @returns {boolean} - True nếu import thành công
     */
    importFilters(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error('File not found');
            }
            
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (data.filters) {
                this.filters = new Map(Object.entries(data.filters));
                this.saveFilters();
                console.log(`📥 Advanced filters imported from: ${filePath}`);
                return true;
            } else {
                throw new Error('Invalid advanced filters file format');
            }
        } catch (error) {
            console.error('❌ Error importing advanced filters:', error.message);
            return false;
        }
    }
    
    /**
     * Xóa tất cả filters
     * @returns {boolean} - True nếu xóa thành công
     */
    clearAllFilters() {
        try {
            this.filters.clear();
            if (fs.existsSync(this.configFile)) {
                fs.unlinkSync(this.configFile);
            }
            console.log('🧹 All advanced filters cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing advanced filters:', error.message);
            return false;
        }
    }
    
    /**
     * Load filters từ file (decrypted)
     */
    loadFilters() {
        try {
            if (!fs.existsSync(this.configFile)) {
                console.log('📁 No advanced filters file found');
                return;
            }
            
            const encryptedData = fs.readFileSync(this.configFile, 'utf8');
            const key = CryptoUtils.deriveKeyFromDeviceId('advanced_filter_key');
            const decryptedData = CryptoUtils.decryptData(encryptedData, key);
            const data = JSON.parse(decryptedData);
            
            if (data.filters) {
                this.filters = new Map(Object.entries(data.filters));
                console.log(`📂 Loaded ${this.filters.size} advanced filter entries`);
            }
        } catch (error) {
            console.error('❌ Error loading advanced filters:', error.message);
        }
    }
}

module.exports = AdvancedFilter;
