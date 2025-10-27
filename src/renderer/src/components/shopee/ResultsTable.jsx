import React, { useState } from 'react';
import Button from '../common/Button';
import styles from '../../styles/components/Shopee.module.css';

const ResultsTable = ({ results = [], onExport, onCopyLinks }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredResults = results.filter(product => {
        const itemData = product.itemData || {};
        const name = itemData.name || product.name || product.title || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const formatCurrency = (amount) => {
        if (!amount || amount === 0) return '0 ₫';
        // Shopee format: price is already in VND (no need to divide by 1000)
        // The amount from API is already correct
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(parseInt(amount));
    };

    const formatCommission = (rate) => {
        if (!rate) return '0%';
        // Convert from basis points to percentage (comm_rate = 1000 = 1%)
        const percentage = parseFloat(rate) / 1000;
        return `${percentage.toFixed(2)}%`;
    };

    const copyToClipboard = (text) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    };

    const copyProductLink = (product) => {
        // Try to get original URL from the product or construct from itemId/shopId
        let link = product.originalUrl;
        if (!link && product.itemId && product.shopId) {
            link = `https://shopee.vn/product/${product.shopId}/${product.itemId}`;
        }
        if (link) {
            copyToClipboard(link);
        }
    };

    const getStatusBadge = (product) => {
        const isValid = product.isValid;
        return (
            <span className={`${styles.statusBadge} ${isValid ? styles.statusValid : styles.statusInvalid}`}>
                {isValid ? 'Valid' : 'Invalid'}
            </span>
        );
    };

    const getIssuesList = (product) => {
        const issues = product.issues || [];
        if (!issues || issues.length === 0) return null;
        
        return (
            <div className={styles.issuesList}>
                {issues.map((issue, index) => (
                    <div key={index} className={styles.issueItem}>
                        {issue}
                    </div>
                ))}
            </div>
        );
    };

    if (results.length === 0) {
        return (
            <div className={styles.managementSection}>
                <h2>📊 Kết quả phân tích</h2>
                <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>
                    Chưa có kết quả nào. Hãy phân tích sản phẩm trước!
                </p>
            </div>
        );
    }

    return (
        <div className={styles.managementSection}>
            <h2>📊 Kết quả phân tích ({filteredResults.length}/{results.length})</h2>
            
            {/* Search Box */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="product-search">🔍 Tìm kiếm theo tên sản phẩm:</label>
                <input
                    type="text"
                    id="product-search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nhập tên sản phẩm để tìm kiếm..."
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #e1e5e9', borderRadius: '8px', fontSize: '16px' }}
                />
            </div>

            {/* Action Buttons */}
            <div className="button-group" style={{ marginBottom: '20px' }}>
                <Button variant="success" onClick={() => onExport && onExport(results)}>
                    📊 Xuất Excel (Tất cả)
                </Button>
                <Button variant="secondary" onClick={() => onCopyLinks && onCopyLinks(results)}>
                    📋 Copy Links (Tất cả)
                </Button>
                <Button variant="info" onClick={() => onExport && onExport(filteredResults)}>
                    📊 Xuất Excel (Đã lọc)
                </Button>
                <Button variant="primary" onClick={() => onCopyLinks && onCopyLinks(filteredResults)}>
                    📋 Copy Links (Đã lọc)
                </Button>
            </div>

            {/* Results Table */}
            <div className={styles.tableContainer}>
                <table className={styles.resultsTable}>
                    <thead>
                        <tr>
                            <th>Tên sản phẩm</th>
                            <th>% Hoa hồng</th>
                            <th>Giá</th>
                            <th>Trạng thái</th>
                            <th>Vấn đề</th>
                            <th>Tồn kho</th>
                            <th>Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredResults.map((product, index) => {
                            const itemData = product.itemData || {};
                            return (
                                <tr key={product.itemId || index}>
                                    <td>
                                        <strong>{itemData.name || product.name || 'N/A'}</strong>
                                    </td>
                                    <td>
                                        {formatCommission(itemData.comm_rate || product.comm_rate)}
                                    </td>
                                    <td>
                                        {formatCurrency(itemData.price || product.price || 0)}
                                    </td>
                                    <td>
                                        {getStatusBadge(product)}
                                    </td>
                                    <td>
                                        {getIssuesList(product)}
                                    </td>
                                    <td>
                                        {itemData.normal_stock || product.status?.stock || 'N/A'}
                                    </td>
                                    <td>
                                        <Button 
                                            variant="success" 
                                            size="small"
                                            onClick={() => copyProductLink(product)}
                                        >
                                            Copy
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResultsTable;
