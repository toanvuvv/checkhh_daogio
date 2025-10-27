import React, { useState } from 'react';
import { useShopeeAPI } from '../hooks/useShopeeAPI';
import { useFilter } from '../hooks/useFilter';
import UserManagement from '../components/shopee/UserManagement';
import ProductAnalysis from '../components/shopee/ProductAnalysis';
import SimpleFilter from '../components/shopee/SimpleFilter';
import ResultsTable from '../components/shopee/ResultsTable';
import SummaryStats from '../components/shopee/SummaryStats';
import StatusMessage from '../components/common/StatusMessage';
import styles from '../styles/components/Shopee.module.css';

const ShopeeManagementPage = () => {
    const { currentResults, exportToExcel, copyLinks } = useShopeeAPI();
    const { filteredResults, applyCurrentFilter } = useFilter();
    const [displayResults, setDisplayResults] = useState([]);
    const [statusMessage, setStatusMessage] = useState({ message: '', type: '' });

    // Update display results when currentResults or filteredResults change
    React.useEffect(() => {
        if (filteredResults.length > 0) {
            setDisplayResults(filteredResults);
        } else {
            setDisplayResults(currentResults);
        }
    }, [currentResults, filteredResults]);

    const handleFilteredResults = (results) => {
        setDisplayResults(results);
    };

    const handleExport = async (results) => {
        try {
            const result = await exportToExcel(results);
            if (result.success) {
                setStatusMessage({ 
                    message: `✅ Đã xuất ${results.length} sản phẩm ra file CSV thành công!`, 
                    type: 'success' 
                });
            } else {
                setStatusMessage({ 
                    message: `❌ Lỗi khi xuất file: ${result.error}`, 
                    type: 'error' 
                });
            }
        } catch (error) {
            setStatusMessage({ 
                message: `❌ Lỗi khi xuất file: ${error.message}`, 
                type: 'error' 
            });
        }
    };

    const handleCopyLinks = (results) => {
        try {
            const result = copyLinks(results);
            if (result.success) {
                setStatusMessage({ 
                    message: `✅ Đã copy ${result.count || results.length} links vào clipboard!`, 
                    type: 'success' 
                });
            } else {
                setStatusMessage({ 
                    message: `❌ Lỗi khi copy links: ${result.error}`, 
                    type: 'error' 
                });
            }
        } catch (error) {
            setStatusMessage({ 
                message: `❌ Lỗi khi copy links: ${error.message}`, 
                type: 'error' 
            });
        }
    };

    return (
        <div className={styles.shopeeContainer}>
            <h1>🛒 Shopee Management</h1>
            
            <UserManagement />
            <ProductAnalysis />
            
            {currentResults.length > 0 && (
                <>
                    <SimpleFilter 
                        results={currentResults} 
                        onFilteredResults={handleFilteredResults}
                    />
                    <SummaryStats results={displayResults} />
                    <ResultsTable 
                        results={displayResults}
                        onExport={handleExport}
                        onCopyLinks={handleCopyLinks}
                    />
                </>
            )}
            
            {statusMessage.message && (
                <StatusMessage 
                    message={statusMessage.message}
                    type={statusMessage.type}
                    onClose={() => setStatusMessage({ message: '', type: '' })}
                />
            )}
        </div>
    );
};

export default ShopeeManagementPage;
