import React, { createContext, useContext, useState, useEffect } from 'react';

const ShopeeContext = createContext();

export const useShopee = () => {
    const context = useContext(ShopeeContext);
    if (!context) {
        throw new Error('useShopee must be used within a ShopeeProvider');
    }
    return context;
};

export const ShopeeProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [currentResults, setCurrentResults] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, text: '' });
    const [selectedUser, setSelectedUser] = useState('');

    // Load users on mount
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            if (window.electronAPI) {
                const allUsers = await window.electronAPI.getAllUsers();
                setUsers(allUsers || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const saveUserData = async (username, sessionId, cookies) => {
        try {
            // Validate session ID
            const isValidSessionId = await window.electronAPI.validateSessionId(sessionId);
            if (!isValidSessionId) {
                return { success: false, error: 'Session ID không hợp lệ' };
            }
            
            // Save cookies
            const cookiesSaved = await window.electronAPI.saveCookies(username, cookies, {
                sessionId: parseInt(sessionId),
                lastUpdate: new Date().toISOString()
            });
            
            // Save session
            const sessionSaved = await window.electronAPI.saveSession(username, sessionId, {
                lastUpdate: new Date().toISOString()
            });
            
            if (cookiesSaved && sessionSaved) {
                await loadUsers(); // Refresh user list
                return { success: true };
            } else {
                return { success: false, error: 'Lỗi khi lưu user data' };
            }
        } catch (error) {
            console.error('Error saving user data:', error);
            return { success: false, error: error.message };
        }
    };

    const deleteUser = async (username) => {
        try {
            const cookiesDeleted = await window.electronAPI.deleteCookies(username);
            const sessionDeleted = await window.electronAPI.deleteSession(username);
            
            if (cookiesDeleted && sessionDeleted) {
                await loadUsers(); // Refresh user list
                return { success: true };
            } else {
                return { success: false, error: 'Lỗi khi xóa user' };
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            return { success: false, error: error.message };
        }
    };

    const clearAllUsers = async () => {
        try {
            const cookiesCleared = await window.electronAPI.clearAllCookies();
            const sessionsCleared = await window.electronAPI.clearAllSessions();
            
            if (cookiesCleared && sessionsCleared) {
                await loadUsers(); // Refresh user list
                return { success: true };
            } else {
                return { success: false, error: 'Lỗi khi xóa tất cả users' };
            }
        } catch (error) {
            console.error('Error clearing all users:', error);
            return { success: false, error: error.message };
        }
    };

    const analyzeProducts = async (productLinks, username) => {
        try {
            setIsAnalyzing(true);
            setProgress({ current: 0, total: 0, text: 'Đang chuẩn bị...' });

            // Get user data
            const userData = users.find(u => u.username === username);
            if (!userData) {
                throw new Error('User không tồn tại');
            }

            const cookieData = await window.electronAPI.getCookies(username);
            const session = await window.electronAPI.getSession(username);

            if (!cookieData || !session) {
                throw new Error('Không tìm thấy cookies hoặc session cho user này');
            }

            const cookies = cookieData.cookies; // Lấy string cookies từ object

            // Clean and validate links
            let cleanLinks;
            if (typeof productLinks === 'string') {
                // Split by newlines nếu là string
                const lines = productLinks.split('\n').filter(line => line.trim().length > 0);
                cleanLinks = await window.electronAPI.cleanInputUrls(lines);
            } else {
                cleanLinks = await window.electronAPI.cleanInputUrls(productLinks);
            }

            if (cleanLinks.length === 0) {
                throw new Error('Không có link hợp lệ nào');
            }

            // Parse links để lấy itemId và shopId
            const parsedLinks = await window.electronAPI.parseMultipleLinks(cleanLinks);
            const validParsedLinks = parsedLinks.filter(p => p.isValid);

            if (validParsedLinks.length === 0) {
                throw new Error('Không có link hợp lệ nào');
            }

            setProgress({ current: 0, total: validParsedLinks.length, text: `Đang phân tích ${validParsedLinks.length} sản phẩm...` });

            // Prepare items for validation
            const items = validParsedLinks.map(p => ({
                itemId: p.itemId,
                shopId: p.shopId,
                originalUrl: p.originalUrl
            }));

            // Listen for progress events
            const progressListener = (progressData) => {
                setProgress({
                    current: progressData.currentItems || progressData.current || 0,
                    total: progressData.totalItems || progressData.total || validParsedLinks.length,
                    text: progressData.status || `Đang xử lý...`
                });
            };
            window.electronAPI.onValidationProgress(progressListener);

            // Call validation API để lấy thông tin chi tiết sản phẩm
            const results = await window.electronAPI.validateProductsBatch(
                parseInt(session.sessionId),
                items,
                cookies
            );

            setCurrentResults(results);
            setProgress({ current: validParsedLinks.length, total: validParsedLinks.length, text: 'Hoàn thành!' });
            
            // Remove progress listener
            window.electronAPI.removeValidationProgressListener(progressListener);

            return { success: true, results };
        } catch (error) {
            console.error('Error analyzing products:', error);
            return { success: false, error: error.message };
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearResults = () => {
        setCurrentResults([]);
        setProgress({ current: 0, total: 0, text: '' });
    };

    const exportToExcel = async (results = currentResults) => {
        try {
            // Prepare data for export
            const exportData = results.map(result => {
                const itemData = result.itemData || {};
                return {
                    'Tên sản phẩm': itemData.name || 'N/A',
                    'Hoa hồng (%)': ((itemData.comm_rate || 0) / 1000).toFixed(2),
                    'Giá (VND)': itemData.price || 0,
                    'Tồn kho': itemData.normal_stock || 0,
                    'Link': result.originalUrl || `https://shopee.vn/product/${result.shopId}/${result.itemId}`,
                    'Hợp lệ': result.isValid ? 'Có' : 'Không',
                    'Vấn đề': (result.issues || []).join('; ')
                };
            });

            // Call electron API to save file
            const filePath = await window.electronAPI.exportToExcel(exportData);
            
            return { success: true, filePath };
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            return { success: false, error: error.message };
        }
    };

    const copyLinks = (results = currentResults) => {
        try {
            // Generate links from results
            const links = results.map(result => {
                if (result.originalUrl) {
                    return result.originalUrl;
                } else if (result.itemId && result.shopId) {
                    return `https://shopee.vn/product/${result.shopId}/${result.itemId}`;
                }
                return null;
            }).filter(Boolean);

            const linkText = links.join('\n');
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(linkText);
                return { success: true, count: links.length };
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = linkText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return { success: true, count: links.length };
            }
        } catch (error) {
            console.error('Error copying links:', error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        users,
        currentResults,
        isAnalyzing,
        progress,
        selectedUser,
        setSelectedUser,
        loadUsers,
        saveUserData,
        deleteUser,
        clearAllUsers,
        analyzeProducts,
        clearResults,
        exportToExcel,
        copyLinks
    };

    return (
        <ShopeeContext.Provider value={value}>
            {children}
        </ShopeeContext.Provider>
    );
};
