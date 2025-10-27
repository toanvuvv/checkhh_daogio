import React, { useState } from 'react';
import { useShopeeAPI } from '../../hooks/useShopeeAPI';
import Button from '../common/Button';
import StatusMessage from '../common/StatusMessage';
import ProgressBar from './ProgressBar';
import styles from '../../styles/components/Shopee.module.css';

const ProductAnalysis = () => {
    const { 
        users, 
        selectedUser, 
        setSelectedUser, 
        analyzeProducts, 
        clearResults,
        isAnalyzing,
        progress 
    } = useShopeeAPI();
    
    const [productLinks, setProductLinks] = useState('');
    const [status, setStatus] = useState({ message: '', type: '' });

    const handleAnalyze = async (e) => {
        e.preventDefault();
        
        if (!productLinks.trim()) {
            setStatus({ message: '❌ Vui lòng nhập ít nhất một link sản phẩm', type: 'error' });
            return;
        }
        
        if (!selectedUser) {
            setStatus({ message: '❌ Vui lòng chọn user để phân tích', type: 'error' });
            return;
        }

        setStatus({ message: 'Đang phân tích sản phẩm...', type: 'info' });

        try {
            const result = await analyzeProducts(productLinks, selectedUser);
            
            if (result.success) {
                setStatus({ 
                    message: `✅ Phân tích hoàn thành! Tìm thấy ${result.results?.length || 0} sản phẩm`, 
                    type: 'success' 
                });
            } else {
                setStatus({ message: '❌ ' + result.error, type: 'error' });
            }
        } catch (error) {
            setStatus({ message: '❌ Lỗi khi phân tích: ' + error.message, type: 'error' });
        }
    };

    const handleClearResults = () => {
        clearResults();
        setStatus({ message: '✅ Kết quả đã được xóa', type: 'success' });
    };

    const handleInputChange = (e) => {
        setProductLinks(e.target.value);
    };

    return (
        <div className={styles.managementSection}>
            <h2>🔍 Product Analysis</h2>
            
            <form onSubmit={handleAnalyze}>
                <div className="form-group">
                    <label htmlFor="product-links">Product Links (mỗi link một dòng):</label>
                    <textarea
                        id="product-links"
                        value={productLinks}
                        onChange={handleInputChange}
                        rows="6"
                        placeholder="https://shopee.vn/product/1506174776/27240240844&#10;https://shopee.vn/product/1506174776/27240240845&#10;..."
                        disabled={isAnalyzing}
                    />
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="selected-user">Chọn User:</label>
                        <select
                            id="selected-user"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            disabled={isAnalyzing}
                        >
                            <option value="">-- Chọn user --</option>
                            {users.map((user, index) => (
                                <option key={user.username || index} value={user.username}>
                                    {user.username} {user.isValid ? '(Valid)' : '(Invalid)'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <Button 
                            type="submit" 
                            variant="primary" 
                            disabled={isAnalyzing}
                        >
                            🔍 Phân tích sản phẩm
                        </Button>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={handleClearResults}
                            disabled={isAnalyzing}
                            style={{ marginLeft: '10px' }}
                        >
                            🗑️ Xóa kết quả
                        </Button>
                    </div>
                </div>
            </form>

            <ProgressBar 
                progress={progress} 
                isVisible={isAnalyzing} 
            />

            {status.message && (
                <StatusMessage 
                    message={status.message} 
                    type={status.type}
                    onClose={() => setStatus({ message: '', type: '' })}
                />
            )}
        </div>
    );
};

export default ProductAnalysis;
