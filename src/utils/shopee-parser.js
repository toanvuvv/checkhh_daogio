class ShopeeParser {
    constructor() {
        // Regex patterns để parse link Shopee
        this.patterns = {
            // https://shopee.vn/product/1506174776/27240240844
            productLink: /https?:\/\/(?:www\.)?shopee\.vn\/product\/(\d+)\/(\d+)(?:\?.*)?$/,
            // https://shopee.vn/product/1506174776/27240240844?sp_atk=...
            productLinkWithParams: /https?:\/\/(?:www\.)?shopee\.vn\/product\/(\d+)\/(\d+)\?.*$/,
            // https://shopee.vn/shop/1506174776
            shopLink: /https?:\/\/(?:www\.)?shopee\.vn\/shop\/(\d+)(?:\?.*)?$/,
            // https://shopee.vn/.../i.1506174776.27240240844
            itemIdPattern: /i\.(\d+)\.(\d+)/,
            // Direct item ID và shop ID
            directIds: /^(\d+)\/(\d+)$/
        };
    }
    
    /**
     * Parse link Shopee để lấy itemId và shopId
     * @param {string} url - Link Shopee
     * @returns {Object|null} - {itemId, shopId} hoặc null nếu không parse được
     */
    parseProductLink(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }
        
        // Loại bỏ khoảng trắng và chuyển về lowercase
        url = url.trim().toLowerCase();
        
        // Thử parse với các patterns
        for (const [patternName, pattern] of Object.entries(this.patterns)) {
            const match = url.match(pattern);
            if (match) {
                let itemId, shopId;
                
                switch (patternName) {
                    case 'productLink':
                    case 'productLinkWithParams':
                        shopId = parseInt(match[1]);
                        itemId = parseInt(match[2]);
                        break;
                        
                    case 'shopLink':
                        // Chỉ có shop ID, không có item ID
                        return {
                            shopId: parseInt(match[1]),
                            itemId: null,
                            isValid: false,
                            error: 'Link chỉ chứa shop ID, thiếu item ID'
                        };
                        
                    case 'itemIdPattern':
                        shopId = parseInt(match[1]);
                        itemId = parseInt(match[2]);
                        break;
                        
                    case 'directIds':
                        shopId = parseInt(match[1]);
                        itemId = parseInt(match[2]);
                        break;
                        
                    default:
                        continue;
                }
                
                // Validate kết quả
                if (this.validateIds(itemId, shopId)) {
                    return {
                        itemId,
                        shopId,
                        isValid: true,
                        originalUrl: url,
                        pattern: patternName
                    };
                }
            }
        }
        
        return {
            itemId: null,
            shopId: null,
            isValid: false,
            error: 'Không thể parse link Shopee. Vui lòng kiểm tra format link.',
            originalUrl: url
        };
    }
    
    /**
     * Validate itemId và shopId
     * @param {number} itemId - Item ID
     * @param {number} shopId - Shop ID
     * @returns {boolean} - True nếu hợp lệ
     */
    validateIds(itemId, shopId) {
        // Kiểm tra itemId
        if (!itemId || isNaN(itemId) || itemId <= 0) {
            return false;
        }
        
        // Kiểm tra shopId
        if (!shopId || isNaN(shopId) || shopId <= 0) {
            return false;
        }
        
        // Kiểm tra độ dài (Shopee IDs thường có ít nhất 6 chữ số)
        if (itemId.toString().length < 6 || shopId.toString().length < 6) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Parse nhiều links cùng lúc
     * @param {Array<string>} urls - Mảng các link Shopee
     * @returns {Array<Object>} - Mảng kết quả parse
     */
    parseMultipleLinks(urls) {
        if (!Array.isArray(urls)) {
            return [];
        }
        
        return urls.map((url, index) => {
            const result = this.parseProductLink(url);
            return {
                index,
                ...result
            };
        });
    }
    
    /**
     * Lọc ra các links hợp lệ
     * @param {Array<string>} urls - Mảng các link Shopee
     * @returns {Array<Object>} - Mảng các links hợp lệ
     */
    getValidLinks(urls) {
        const results = this.parseMultipleLinks(urls);
        return results.filter(result => result.isValid);
    }
    
    /**
     * Lọc ra các links không hợp lệ
     * @param {Array<string>} urls - Mảng các link Shopee
     * @returns {Array<Object>} - Mảng các links không hợp lệ
     */
    getInvalidLinks(urls) {
        const results = this.parseMultipleLinks(urls);
        return results.filter(result => !result.isValid);
    }
    
    /**
     * Tạo link Shopee từ itemId và shopId
     * @param {number} itemId - Item ID
     * @param {number} shopId - Shop ID
     * @returns {string} - Link Shopee
     */
    createProductLink(itemId, shopId) {
        if (!this.validateIds(itemId, shopId)) {
            throw new Error('Invalid itemId or shopId');
        }
        
        return `https://shopee.vn/product/${shopId}/${itemId}`;
    }
    
    /**
     * Kiểm tra xem string có phải là link Shopee không
     * @param {string} url - URL để kiểm tra
     * @returns {boolean} - True nếu là link Shopee
     */
    isShopeeLink(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }
        
        return url.toLowerCase().includes('shopee.vn');
    }
    
    /**
     * Extract domain từ URL
     * @param {string} url - URL
     * @returns {string|null} - Domain hoặc null
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Normalize URL (loại bỏ params không cần thiết)
     * @param {string} url - URL gốc
     * @returns {string} - URL đã normalize
     */
    normalizeUrl(url) {
        if (!url) {
            return '';
        }
        
        try {
            const urlObj = new URL(url);
            // Chỉ giữ lại pathname, loại bỏ search params
            return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
        } catch (error) {
            return url;
        }
    }
    
    /**
     * Batch parse với progress callback
     * @param {Array<string>} urls - Mảng URLs
     * @param {Function} progressCallback - Callback để báo progress
     * @returns {Promise<Array<Object>>} - Kết quả parse
     */
    async parseWithProgress(urls, progressCallback) {
        const results = [];
        const total = urls.length;
        
        for (let i = 0; i < urls.length; i++) {
            const result = this.parseProductLink(urls[i]);
            results.push({
                index: i,
                ...result
            });
            
            // Gọi progress callback
            if (progressCallback && typeof progressCallback === 'function') {
                progressCallback({
                    current: i + 1,
                    total,
                    percentage: Math.round(((i + 1) / total) * 100),
                    result
                });
            }
            
            // Thêm delay nhỏ để không block UI
            if (i < urls.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        return results;
    }
    
    /**
     * Remove duplicate links và normalize URLs
     * @param {Array<string>} urls - Mảng URLs
     * @returns {Object} - {uniqueUrls, duplicates, duplicateCount}
     */
    removeDuplicateLinks(urls) {
        if (!Array.isArray(urls)) {
            return {
                uniqueUrls: [],
                duplicates: [],
                duplicateCount: 0
            };
        }
        
        const seen = new Set();
        const uniqueUrls = [];
        const duplicates = [];
        
        urls.forEach((url, index) => {
            if (!url || typeof url !== 'string') {
                return;
            }
            
            // Normalize URL để so sánh
            const normalizedUrl = this.normalizeUrl(url.trim().toLowerCase());
            
            if (seen.has(normalizedUrl)) {
                duplicates.push({
                    originalUrl: url.trim(),
                    normalizedUrl,
                    index,
                    duplicateOf: Array.from(seen).indexOf(normalizedUrl)
                });
            } else {
                seen.add(normalizedUrl);
                uniqueUrls.push(url.trim());
            }
        });
        
        return {
            uniqueUrls,
            duplicates,
            duplicateCount: duplicates.length
        };
    }
    
    /**
     * Validate và clean input URLs (simple version, không tracking duplicates)
     * @param {string|Array<string>} input - Input URLs
     * @returns {Array<string>} - Array of clean URLs
     */
    cleanInputUrls(input) {
        if (!input) {
            return [];
        }
        
        let urls = Array.isArray(input) ? input : [input];
        
        // Split by newline nếu là string
        if (typeof input === 'string') {
            urls = input.split('\n');
        }
        
        // Filter valid URLs
        const validUrls = urls
            .filter(url => url && typeof url === 'string')
            .map(url => url.trim())
            .filter(url => url.length > 0)
            .filter(url => this.isShopeeLink(url));
        
        return validUrls;
    }
    
    /**
     * Validate và clean input URLs với duplicate removal
     * @param {string|Array<string>} input - Input URLs
     * @returns {Object} - {cleanUrls, duplicates, duplicateCount}
     */
    cleanInputUrlsWithDuplicates(input) {
        if (!input) {
            return {
                cleanUrls: [],
                duplicates: [],
                duplicateCount: 0
            };
        }
        
        let urls = Array.isArray(input) ? input : [input];
        
        // Filter valid URLs first
        const validUrls = urls
            .filter(url => url && typeof url === 'string')
            .map(url => url.trim())
            .filter(url => url.length > 0)
            .filter(url => this.isShopeeLink(url));
        
        // Remove duplicates
        const duplicateResult = this.removeDuplicateLinks(validUrls);
        
        return {
            cleanUrls: duplicateResult.uniqueUrls,
            duplicates: duplicateResult.duplicates,
            duplicateCount: duplicateResult.duplicateCount
        };
    }
}

module.exports = ShopeeParser;
