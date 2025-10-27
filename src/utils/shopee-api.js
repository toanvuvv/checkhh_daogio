const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ShopeeAPI {
    constructor() {
        this.baseUrl = 'https://live.shopee.vn';
        this.timeout = 30000; // 30 seconds
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
    }
    
    /**
     * Tạo Product Set
     * @param {number} sessionId - Session ID
     * @param {Array} items - Mảng items [{itemId, shopId}]
     * @param {string} cookies - Cookies string
     * @param {string} purpose - Mục đích ('add_cart' hoặc 'validation')
     * @returns {Promise<number>} - Set ID
     */
    async createProductSet(sessionId, items, cookies, purpose = 'validation') {
        const url = `${this.baseUrl}/api/v1/session/${sessionId}/product_set/`;
        
        // Chuẩn bị payload với tối đa 100 items
        const batchItems = items.slice(0, 100).map(item => ({
            item_id: parseInt(item.itemId),
            shop_id: parseInt(item.shopId)
        }));
        
        const payload = {
            name: `${purpose}_${Date.now()}`,
            items: batchItems,
        };
        
        console.log(`🔧 createProductSet - POST ${url} (${purpose}, ${batchItems.length} items)`);
        console.log(`🍪 createProductSet - Cookies length: ${cookies.length}, first 100 chars: ${cookies.substring(0, 100)}...`);
        
        try {
            const response = await this._makeRequest('POST', url, payload, cookies);
            
            
            // Kiểm tra error field (Shopee API mới)
            if (response.data.error !== undefined && response.data.error !== 0) {
                console.error(`❌ createProductSet - Shopee API Error: ${response.data.error} - ${response.data.error_msg}`);
                
                // Handle specific error codes
                if (response.data.error === 10002) {
                    throw new Error(`Shopee API error 10002: Có thể do quá nhiều requests hoặc session hết hạn. Vui lòng thử lại sau ít phút.`);
                }
                
                throw new Error(`Shopee API error ${response.data.error}: ${response.data.error_msg || 'Unknown error'}`);
            }
            
            // Kiểm tra err_code field (Shopee API cũ)
            if (response.data.err_code !== undefined && response.data.err_code !== 0) {
                console.error(`❌ createProductSet - API Error: ${response.data.err_code} - ${response.data.err_msg}`);
                throw new Error(`API error: ${response.data.err_msg || 'Unknown error'}`);
            }
            
            // Kiểm tra data structure
            if (!response.data.data || !response.data.data.set_id) {
                console.error(`❌ createProductSet - Invalid response structure:`, response.data);
                throw new Error(`Invalid response: missing set_id in data`);
            }
            
            const setId = response.data.data.set_id;
            console.log(`✅ createProductSet - Created set_id=${setId} (${purpose})`);
            return setId;
            
        } catch (error) {
            console.error(`❌ createProductSet - Error:`, error.message);
            throw error;
        }
    }
    
    /**
     * Lấy thông tin Product Set
     * @param {number} sessionId - Session ID
     * @param {number} productSetId - Product Set ID
     * @param {string} cookies - Cookies string
     * @returns {Promise<Object>} - Product Set info
     */
    async getProductSetInfo(sessionId, productSetId, cookies) {
        const url = `${this.baseUrl}/webapi/v1/session/${sessionId}/product_set/${productSetId}`;
        
        console.log(`getProductSetInfo - GET ${url}`);
        
        try {
            const response = await this._makeRequest('GET', url, null, cookies, {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'priority': 'u=1, i',
                'referer': 'https://live.shopee.vn/pc/setup?is_from_login=true',
                'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
                'x-sz-sdk-version': '1.10.7'
            });
            
            if (response.data.err_code !== 0) {
                throw new Error(`API error: ${response.data.err_msg}`);
            }
            
            // Kiểm tra total = 0 để ngừng luồng swap smart
            if (response.data.data && response.data.data.total === 0) {
                console.log(`🛑 getProductSetInfo - Total = 0, ngừng luồng swap smart`);
                throw new Error(`Product set trống (total = 0) - ngừng luồng swap smart`);
            }
            
            
            return response.data.data;
            
        } catch (error) {
            console.error(`❌ getProductSetInfo - Error:`, error.message);
            throw error;
        }
    }
    
    /**
     * Gắn Product Set vào giỏ hàng
     * @param {number} sessionId - Session ID
     * @param {number} setId - Set ID
     * @param {string} cookies - Cookies string
     * @returns {Promise<void>}
     */
    async attachProductSet(sessionId, setId, cookies) {
        const url = `${this.baseUrl}/api/v1/session/${sessionId}/product_set/attach`;
        const payload = { set_id: [setId] };
        
        console.log(`attachProductSet - POST ${url} with set_id: ${setId}`);
        
        try {
            // Thử POST trước
            let response = await this._makeRequest('POST', url, payload, cookies);
            
            // Nếu POST bị 405, thử PUT
            if (response.status === 405) {
                console.log(`attachProductSet - POST returned 405, retrying with PUT`);
                response = await this._makeRequest('PUT', url, payload, cookies);
            }
            
            if (!response.ok) {
                console.warn(`attachProductSet - response not ok, status=${response.status}`);
                throw new Error('Không thể gắn product set vào giỏ hàng');
            }
            
            console.log(`✅ attachProductSet - Successfully attached set_id: ${setId}`);
            
        } catch (error) {
            console.error(`❌ attachProductSet - Error:`, error.message);
            throw error;
        }
    }
    
    /**
     * Xóa Product Set
     * @param {number} sessionId - Session ID
     * @param {number} productSetId - Product Set ID
     * @param {string} cookies - Cookies string
     * @returns {Promise<void>}
     */
    async deleteProductSet(sessionId, productSetId, cookies) {
        const url = `${this.baseUrl}/webapi/v1/session/${sessionId}/product_set/${productSetId}`;
        
        console.log(`deleteProductSet - DELETE ${url}`);
        
        try {
            const response = await this._makeRequest('DELETE', url, null, cookies, {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'priority': 'u=1, i',
                'referer': 'https://live.shopee.vn/pc/setup?is_from_login=true',
                'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
                'x-sz-sdk-version': '1.10.7'
            });
            
            if (!response.ok) {
                console.warn(`deleteProductSet - Failed: ${response.status}`);
            } else {
                console.log(`✅ deleteProductSet - Successfully deleted set_id: ${productSetId}`);
            }
            
        } catch (error) {
            console.error(`❌ deleteProductSet - Error:`, error.message);
            // Không throw error vì delete có thể fail mà không ảnh hưởng chức năng chính
        }
    }
    
    /**
     * Parse validation results từ Product Set info
     * @param {Array} items - Mảng items request
     * @param {Object} productInfo - Product Set info từ API
     * @returns {Array} - Kết quả validation
     */
    parseProductsBatchValidation(items, productInfo) {
        const results = [];
        const productItems = productInfo.items || [];
        
        // Tạo map để lookup nhanh theo item_id
        const itemMap = new Map();
        productItems.forEach((item) => {
            const itemId = item.item_id?.toString() || item.itemid?.toString();
            if (itemId) {
                itemMap.set(itemId, item);
            }
        });
        
        // Parse từng item trong batch
        for (const requestItem of items) {
            const productItem = itemMap.get(requestItem.itemId.toString());
            
            if (!productItem) {
                // Item không tìm thấy trong response
                results.push({
                    itemId: requestItem.itemId,
                    shopId: requestItem.shopId,
                    originalUrl: requestItem.originalUrl,
                    isValid: false,
                    issues: ['Item không tìm thấy trong product set'],
                    status: {
                        isDel: true,
                        isUnlisted: false,
                        isProhibited: false,
                        status: 0,
                        isOos: false,
                        stock: 0
                    },
                    // Thêm dữ liệu sản phẩm mặc định
                    itemData: {
                        name: 'Không có tên',
                        comm_rate: 0,
                        price: 0,
                        price_before_discount: 0,
                        discount: 0,
                        normal_stock: 0,
                        display_total_stock: 0,
                        sold: 0,
                        currency: 'VND',
                        image: '',
                        item_type: 0,
                        status: 0,
                        is_oos: false,
                        is_del: true,
                        is_unlisted: false,
                        is_prohibited: false
                    }
                });
                continue;
            }
            
            // Parse validation cho item này
            const issues = [];
            let isValid = true;
            
            const isDel = productItem.is_del === true;
            const isUnlisted = productItem.is_unlisted === true;
            const isProhibited = productItem.is_prohibited === true;
            const status = productItem.status || 0;
            const isOos = productItem.is_oos === true;
            const stock = productItem.normal_stock || 0;
            
            if (isDel) {
                issues.push('Sản phẩm đã bị xóa');
                isValid = false;
            }
            
            if (isUnlisted) {
                issues.push('Sản phẩm đã bị ẩn/không niêm yết');
                isValid = false;
            }
            
            if (isProhibited) {
                issues.push('Sản phẩm bị cấm');
                isValid = false;
            }
            
            if (status !== 1) {
                issues.push(`Trạng thái không hoạt động (status: ${status})`);
                isValid = false;
            }
            
            if (isOos) {
                issues.push('Sản phẩm hết hàng');
                isValid = false;
            }
            
            if (stock <= 0) {
                issues.push('Không còn tồn kho');
                isValid = false;
            }
            
            // Kiểm tra giá = 1000 (có thể là giá test/placeholder)
            const price = parseInt(productItem.price || 0);
            if (price === 1000) {
                issues.push('Giá có thể là giá test/placeholder (1000 VND)');
                isValid = false;
            }
            
            results.push({
                itemId: requestItem.itemId,
                shopId: requestItem.shopId,
                originalUrl: requestItem.originalUrl,
                isValid,
                issues,
                status: {
                    isDel,
                    isUnlisted,
                    isProhibited,
                    status,
                    isOos,
                    stock
                },
                // Thêm dữ liệu sản phẩm đầy đủ
                itemData: {
                    name: productItem.name || 'Không có tên',
                    comm_rate: productItem.comm_rate || 0,
                    price: productItem.price || productItem.price_min || 0,
                    price_before_discount: productItem.price_before_discount || 0,
                    discount: productItem.discount || 0,
                    normal_stock: productItem.normal_stock || 0,
                    display_total_stock: productItem.display_total_stock || 0,
                    sold: productItem.sold || 0,
                    currency: productItem.currency || 'VND',
                    image: productItem.image || '',
                    item_type: productItem.item_type || 0,
                    status: productItem.status || 1,
                    is_oos: productItem.is_oos || false,
                    is_del: productItem.is_del || false,
                    is_unlisted: productItem.is_unlisted || false,
                    is_prohibited: productItem.is_prohibited || false
                }
            });
        }
        
        return results;
    }
    
    /**
     * Validate products batch (luồng hoàn chỉnh)
     * @param {number} sessionId - Session ID
     * @param {Array} items - Mảng items để validate
     * @param {string} cookies - Cookies string
     * @param {Function} progressCallback - Callback để báo progress
     * @returns {Promise<Array>} - Kết quả validation
     */
    async validateProductsBatch(sessionId, items, cookies, progressCallback = null) {
        const batchSize = 100;
        const totalItems = items.length;
        const totalBatches = Math.ceil(totalItems / batchSize);
        const allResults = [];
        
        console.log(`🔄 validateProductsBatch - Processing ${totalItems} items in ${totalBatches} batches (batch size: ${batchSize})`);
        
        try {
            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                const startIndex = batchIndex * batchSize;
                const endIndex = Math.min(startIndex + batchSize, totalItems);
                const batchItems = items.slice(startIndex, endIndex);
                
                console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (items ${startIndex + 1}-${endIndex})`);
                
                // Call progress callback
                if (progressCallback && typeof progressCallback === 'function') {
                    progressCallback({
                        currentBatch: batchIndex + 1,
                        totalBatches,
                        currentItems: endIndex,
                        totalItems,
                        percentage: Math.round(((batchIndex + 1) / totalBatches) * 100),
                        status: `Đang xử lý batch ${batchIndex + 1}/${totalBatches} (${endIndex}/${totalItems} items)`
                    });
                }
                
                // Process this batch
                const batchResults = await this._validateSingleBatch(sessionId, batchItems, cookies);
                allResults.push(...batchResults);
                
                // Small delay between batches to avoid overwhelming the API
                if (batchIndex < totalBatches - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                }
            }
            
            console.log(`✅ validateProductsBatch - Completed processing ${allResults.length} items`);
            return allResults;
            
        } catch (error) {
            console.error(`❌ validateProductsBatch - Error:`, error.message);
            throw error;
        }
    }
    
    /**
     * Validate single batch (internal method)
     * @param {number} sessionId - Session ID
     * @param {Array} batchItems - Items trong batch này
     * @param {string} cookies - Cookies string
     * @returns {Promise<Array>} - Kết quả validation cho batch này
     */
    async _validateSingleBatch(sessionId, batchItems, cookies) {
        let productSetId = null;
        
        try {
            // Bước 1: Tạo product set
            const items = batchItems.map(item => ({ 
                itemId: parseInt(item.itemId), 
                shopId: parseInt(item.shopId) 
            }));
            productSetId = await this.createProductSet(sessionId, items, cookies, 'validation');
            
            // Bước 2: Lấy thông tin chi tiết
            const productInfo = await this.getProductSetInfo(sessionId, productSetId, cookies);
            
            // Bước 3: BẮT BUỘC XÓA product set
            await this.deleteProductSet(sessionId, productSetId, cookies);
            productSetId = null;
            
            // Bước 4: Parse kết quả
            const results = this.parseProductsBatchValidation(batchItems, productInfo);
            
            return results;
            
        } catch (error) {
            // BẮT BUỘC cleanup nếu có lỗi
            if (productSetId) {
                try {
                    await this.deleteProductSet(sessionId, productSetId, cookies);
                } catch (cleanupError) {
                    console.error('Cleanup failed:', cleanupError.message);
                }
            }
            throw error;
        }
    }
    
    /**
     * Add items to cart (luồng hoàn chỉnh)
     * @param {number} sessionId - Session ID
     * @param {Array} items - Mảng items để add
     * @param {string} cookies - Cookies string
     * @returns {Promise<void>}
     */
    async addItemsToCart(sessionId, items, cookies) {
        let productSetId = null;
        
        try {
            // Bước 1: Tạo product set
            const batchItems = items.map(item => ({ 
                itemId: parseInt(item.itemId), 
                shopId: parseInt(item.shopId) 
            }));
            productSetId = await this.createProductSet(sessionId, batchItems, cookies, 'add_cart');
            
            // Bước 2: Gắn vào giỏ hàng
            await this.attachProductSet(sessionId, productSetId, cookies);
            
            // Bước 3: Xóa product set
            await this.deleteProductSet(sessionId, productSetId, cookies);
            productSetId = null;
            
            console.log(`✅ addItemsToCart - Successfully added ${items.length} items to cart`);
            
        } catch (error) {
            // BẮT BUỘC cleanup nếu có lỗi
            if (productSetId) {
                try {
                    await this.deleteProductSet(sessionId, productSetId, cookies);
                } catch (cleanupError) {
                    console.error('Cleanup failed:', cleanupError.message);
                }
            }
            throw error;
        }
    }
    
    /**
     * Make HTTP request với retry logic
     * @param {string} method - HTTP method
     * @param {string} url - URL
     * @param {Object} data - Request data
     * @param {string} cookies - Cookies string
     * @param {Object} additionalHeaders - Headers bổ sung
     * @returns {Promise<Object>} - Response
     */
    async _makeRequest(method, url, data, cookies, additionalHeaders = {}) {
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'cookie': cookies,
            ...additionalHeaders
        };
        
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const config = {
                    method,
                    url,
                    headers,
                    timeout: this.timeout,
                    credentials: 'include'
                };
                
                if (data && (method === 'POST' || method === 'PUT')) {
                    config.data = data;
                }
                
                const response = await axios(config);
                
                console.log(`📡 ${method} ${url} - Response status: ${response.status}`);
                return response;
                
            } catch (error) {
                lastError = error;
                console.error(`❌ ${method} ${url} - Attempt ${attempt}/${this.maxRetries} failed:`, error.message);
                
                if (attempt < this.maxRetries) {
                    console.log(`⏳ Retrying in ${this.retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                    this.retryDelay *= 2; // Exponential backoff
                }
            }
        }
        
        throw lastError;
    }
    
}

module.exports = ShopeeAPI;
