import React, { useState } from 'react';
import { useShopeeAPI } from '../../hooks/useShopeeAPI';
import Button from '../common/Button';
import StatusMessage from '../common/StatusMessage';
import styles from '../../styles/components/Shopee.module.css';

const UserManagement = () => {
    const { 
        users, 
        saveUserData, 
        deleteUser, 
        clearAllUsers, 
        loadUsers 
    } = useShopeeAPI();
    
    const [formData, setFormData] = useState({
        username: '',
        sessionId: '',
        cookies: ''
    });
    const [status, setStatus] = useState({ message: '', type: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        
        const { username, sessionId, cookies } = formData;
        
        // Validation
        if (!username.trim()) {
            setStatus({ message: '❌ Vui lòng nhập username', type: 'error' });
            return;
        }
        
        if (username.length < 3) {
            setStatus({ message: '❌ Username phải có ít nhất 3 ký tự', type: 'error' });
            return;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setStatus({ message: '❌ Username chỉ được chứa chữ cái, số và dấu gạch dưới', type: 'error' });
            return;
        }
        
        if (!sessionId.trim()) {
            setStatus({ message: '❌ Vui lòng nhập session ID', type: 'error' });
            return;
        }
        
        if (!/^\d+$/.test(sessionId)) {
            setStatus({ message: '❌ Session ID phải là số nguyên dương', type: 'error' });
            return;
        }
        
        if (parseInt(sessionId) <= 0) {
            setStatus({ message: '❌ Session ID phải lớn hơn 0', type: 'error' });
            return;
        }
        
        if (!cookies.trim()) {
            setStatus({ message: '❌ Vui lòng nhập cookies', type: 'error' });
            return;
        }
        
        if (cookies.length < 50) {
            setStatus({ message: '❌ Cookies quá ngắn, vui lòng kiểm tra lại', type: 'error' });
            return;
        }
        
        if (!cookies.includes('=') || !cookies.includes(';')) {
            setStatus({ message: '❌ Định dạng cookies không đúng. Vui lòng copy đầy đủ cookies từ browser', type: 'error' });
            return;
        }

        setStatus({ message: 'Đang lưu user data...', type: 'info' });

        try {
            const result = await saveUserData(username.trim(), sessionId.trim(), cookies.trim());
            
            if (result.success) {
                setStatus({ message: '✅ User data đã được lưu thành công!', type: 'success' });
                setFormData({ username: '', sessionId: '', cookies: '' });
            } else {
                setStatus({ message: '❌ ' + result.error, type: 'error' });
            }
        } catch (error) {
            setStatus({ message: '❌ Lỗi khi lưu user data: ' + error.message, type: 'error' });
        }
    };

    const handleDeleteUser = async (username) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa user "${username}"?`)) {
            try {
                const result = await deleteUser(username);
                
                if (result.success) {
                    setStatus({ message: `✅ User "${username}" đã được xóa`, type: 'success' });
                } else {
                    setStatus({ message: '❌ ' + result.error, type: 'error' });
                }
            } catch (error) {
                setStatus({ message: '❌ Lỗi khi xóa user: ' + error.message, type: 'error' });
            }
        }
    };

    const handleClearAllUsers = async () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa TẤT CẢ users? Hành động này không thể hoàn tác!')) {
            try {
                const result = await clearAllUsers();
                
                if (result.success) {
                    setStatus({ message: '✅ Tất cả users đã được xóa', type: 'success' });
                } else {
                    setStatus({ message: '❌ ' + result.error, type: 'error' });
                }
            } catch (error) {
                setStatus({ message: '❌ Lỗi khi xóa tất cả users: ' + error.message, type: 'error' });
            }
        }
    };

    const handleLoadUsers = async () => {
        try {
            await loadUsers();
            setStatus({ message: '✅ Danh sách users đã được cập nhật', type: 'success' });
        } catch (error) {
            setStatus({ message: '❌ Lỗi khi load users: ' + error.message, type: 'error' });
        }
    };

    return (
        <div className={styles.managementSection}>
            <h2>🍪 Cookie & Session Management</h2>
            
            <form onSubmit={handleSaveUser}>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="Nhập username"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="sessionId">Session ID:</label>
                        <input
                            type="text"
                            id="sessionId"
                            name="sessionId"
                            value={formData.sessionId}
                            onChange={handleInputChange}
                            placeholder="Nhập session ID"
                        />
                    </div>
                </div>
                
                <div className="form-group">
                    <label htmlFor="cookies">Cookies:</label>
                    <textarea
                        id="cookies"
                        name="cookies"
                        value={formData.cookies}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Nhập cookies string..."
                    />
                </div>
                
                <div className="button-group">
                    <Button type="submit" variant="primary">
                        💾 Lưu User Data
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleLoadUsers}>
                        📂 Load User Data
                    </Button>
                    <Button type="button" variant="warning" onClick={handleClearAllUsers}>
                        🗑️ Clear User Data
                    </Button>
                </div>
            </form>

            <div className={styles.userList}>
                <h3>👥 Danh sách Users ({users.length})</h3>
                {users.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                        Chưa có user nào. Hãy thêm user đầu tiên!
                    </p>
                ) : (
                    users.map((user, index) => (
                        <div key={user.username || index} className={styles.userCard}>
                            <div className={styles.userInfo}>
                                <div className={styles.userName}>{user.username}</div>
                                <div className={styles.userDetails}>
                                    Session ID: {user.sessionId || 'N/A'} | 
                                    Last Update: {user.lastUpdate ? new Date(user.lastUpdate).toLocaleString() : 'N/A'}
                                </div>
                            </div>
                            <div className={styles.userStatus + ' ' + (user.isValid ? styles.valid : styles.invalid)}>
                                {user.isValid ? 'Valid' : 'Invalid'}
                            </div>
                            <div className={styles.userActions}>
                                <Button 
                                    variant="danger" 
                                    size="small"
                                    onClick={() => handleDeleteUser(user.username)}
                                >
                                    Xóa
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

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

export default UserManagement;
