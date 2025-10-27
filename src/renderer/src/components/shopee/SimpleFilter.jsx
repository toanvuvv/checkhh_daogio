import React, { useState, useEffect } from 'react';
import { useFilter } from '../../hooks/useFilter';
import Button from '../common/Button';
import StatusMessage from '../common/StatusMessage';
import Modal from '../common/Modal';
import styles from '../../styles/components/Shopee.module.css';

const SimpleFilter = ({ results = [], onFilteredResults }) => {
    const { 
        filterConfigs, 
        currentFilter,
        filterConditions,
        updateFilterCondition,
        applyCurrentFilter,
        clearFilter,
        createFilterConfig,
        applyFilterConfig,
        deleteFilterConfig,
        loadFilterConfigs
    } = useFilter();
    
    const [status, setStatus] = useState({ message: '', type: '' });
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [configName, setConfigName] = useState('');
    const [editingConfig, setEditingConfig] = useState(null);

    useEffect(() => {
        loadFilterConfigs();
    }, [loadFilterConfigs]);

    const handleFilterChange = (field, subField, value) => {
        updateFilterCondition(field, subField, value);
    };

    const handleApplyFilter = () => {
        const filtered = applyCurrentFilter(results);
        if (onFilteredResults) {
            onFilteredResults(filtered);
        }
        setStatus({ 
            message: `✅ Đã áp dụng filter: ${filtered.length}/${results.length} sản phẩm`, 
            type: 'success' 
        });
    };

    const handleClearFilter = () => {
        clearFilter();
        if (onFilteredResults) {
            onFilteredResults(results);
        }
        setStatus({ message: '✅ Filter đã được xóa', type: 'success' });
    };

    const handleSaveConfig = async () => {
        if (!configName.trim()) {
            setStatus({ message: '❌ Vui lòng nhập tên config', type: 'error' });
            return;
        }

        try {
            const result = await createFilterConfig(configName.trim(), filterConditions);
            
            if (result.success) {
                setStatus({ message: `✅ Config "${configName}" đã được lưu`, type: 'success' });
                setConfigName('');
                setShowSaveModal(false);
            } else {
                setStatus({ message: '❌ ' + result.error, type: 'error' });
            }
        } catch (error) {
            setStatus({ message: '❌ Lỗi khi lưu config: ' + error.message, type: 'error' });
        }
    };

    const handleApplyConfig = async (configId) => {
        try {
            const result = await applyFilterConfig(configId);
            
            if (result.success) {
                // Auto-apply filter after loading config
                const filtered = applyCurrentFilter(results);
                if (onFilteredResults) {
                    onFilteredResults(filtered);
                }
                setStatus({ 
                    message: `✅ Đã áp dụng config: ${result.config.name} (${filtered.length} sản phẩm)`, 
                    type: 'success' 
                });
            } else {
                setStatus({ message: '❌ ' + result.error, type: 'error' });
            }
        } catch (error) {
            setStatus({ message: '❌ Lỗi khi áp dụng config: ' + error.message, type: 'error' });
        }
    };

    const handleDeleteConfig = async (configId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa config này?')) {
            try {
                const result = await deleteFilterConfig(configId);
                
                if (result.success) {
                    setStatus({ message: '✅ Config đã được xóa', type: 'success' });
                } else {
                    setStatus({ message: '❌ ' + result.error, type: 'error' });
                }
            } catch (error) {
                setStatus({ message: '❌ Lỗi khi xóa config: ' + error.message, type: 'error' });
            }
        }
    };

    return (
        <div className={styles.filterControls}>
            <h3>🔍 Filter đơn giản</h3>
            
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="commission-min">💰 Hoa hồng từ (%):</label>
                    <input
                        type="number"
                        id="commission-min"
                        value={filterConditions.commission.min}
                        onChange={(e) => handleFilterChange('commission', 'min', e.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="commission-max">💰 Hoa hồng đến (%):</label>
                    <input
                        type="number"
                        id="commission-max"
                        value={filterConditions.commission.max}
                        onChange={(e) => handleFilterChange('commission', 'max', e.target.value)}
                        placeholder="100"
                        min="0"
                        max="100"
                        step="0.1"
                    />
                </div>
            </div>
            
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="price-min">💵 Giá từ (VND):</label>
                    <input
                        type="number"
                        id="price-min"
                        value={filterConditions.price.min}
                        onChange={(e) => handleFilterChange('price', 'min', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1000"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="price-max">💵 Giá đến (VND):</label>
                    <input
                        type="number"
                        id="price-max"
                        value={filterConditions.price.max}
                        onChange={(e) => handleFilterChange('price', 'max', e.target.value)}
                        placeholder="10000000"
                        min="0"
                        step="1000"
                    />
                </div>
            </div>
            
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="stock-min">📦 Tồn kho từ:</label>
                    <input
                        type="number"
                        id="stock-min"
                        value={filterConditions.stock.min}
                        onChange={(e) => handleFilterChange('stock', 'min', e.target.value)}
                        placeholder="0"
                        min="0"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="stock-max">📦 Tồn kho đến:</label>
                    <input
                        type="number"
                        id="stock-max"
                        value={filterConditions.stock.max}
                        onChange={(e) => handleFilterChange('stock', 'max', e.target.value)}
                        placeholder="10000"
                        min="0"
                    />
                </div>
            </div>
            
            <div className="form-row">
                <div className="form-group">
                    <Button variant="primary" onClick={handleApplyFilter}>
                        🔍 Áp dụng lọc
                    </Button>
                    <Button variant="warning" onClick={handleClearFilter}>
                        🧹 Xóa lọc
                    </Button>
                </div>
            </div>

            {/* Saved Filter Configs */}
            <div className={styles.savedConfigs}>
                <h4>💾 Filter đã lưu:</h4>
                <div className={styles.configButtons}>
                    {filterConfigs.length === 0 ? (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>
                            Chưa có filter config nào. Tạo config mới bằng cách nhập điều kiện và click "Lưu Config".
                        </p>
                    ) : (
                        filterConfigs.map(config => (
                            <button
                                key={config.id}
                                className={`${styles.configBtn} ${currentFilter?.id === config.id ? styles.active : ''}`}
                                onClick={() => handleApplyConfig(config.id)}
                                title={config.description || ''}
                            >
                                {config.name}
                            </button>
                        ))
                    )}
                </div>
                <div className={styles.configActions}>
                    <Button 
                        variant="primary" 
                        size="small"
                        onClick={() => setShowSaveModal(true)}
                    >
                        💾 Lưu config hiện tại
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="small"
                        onClick={() => setShowManageModal(true)}
                    >
                        ⚙️ Quản lý configs
                    </Button>
                </div>
            </div>

            {/* Save Config Modal */}
            <Modal
                isOpen={showSaveModal}
                onClose={() => {
                    setShowSaveModal(false);
                    setConfigName('');
                }}
                title="💾 Lưu Filter Config"
                size="small"
            >
                <div className="form-group">
                    <label>Tên config:</label>
                    <input
                        type="text"
                        value={configName}
                        onChange={(e) => setConfigName(e.target.value)}
                        placeholder="Nhập tên config..."
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSaveConfig();
                            }
                        }}
                    />
                </div>
                <div className="form-group">
                    <label>Điều kiện hiện tại:</label>
                    <div style={{ 
                        background: '#f8f9fa', 
                        padding: '10px', 
                        borderRadius: '5px',
                        fontSize: '13px'
                    }}>
                        <div><strong>Hoa hồng:</strong> {filterConditions.commission.min || '0'}% - {filterConditions.commission.max || '100'}%</div>
                        <div><strong>Giá:</strong> {filterConditions.price.min || '0'} - {filterConditions.price.max || '10000000'} VND</div>
                        <div><strong>Tồn kho:</strong> {filterConditions.stock.min || '0'} - {filterConditions.stock.max || '10000'}</div>
                    </div>
                </div>
                <div className="button-group">
                    <Button variant="primary" onClick={handleSaveConfig} disabled={!configName.trim()}>
                        💾 Lưu
                    </Button>
                    <Button variant="secondary" onClick={() => {
                        setShowSaveModal(false);
                        setConfigName('');
                    }}>
                        Hủy
                    </Button>
                </div>
            </Modal>

            {/* Manage Configs Modal */}
            <Modal
                isOpen={showManageModal}
                onClose={() => setShowManageModal(false)}
                title="⚙️ Quản lý Filter Configs"
                size="medium"
            >
                <div className={styles.configsList}>
                    {filterConfigs.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                            Chưa có config nào được lưu
                        </p>
                    ) : (
                        filterConfigs.map(config => (
                            <div key={config.id} className={styles.configItem}>
                                <div className={styles.configInfo}>
                                    <strong>{config.name}</strong>
                                    {config.description && (
                                        <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
                                            {config.description}
                                        </p>
                                    )}
                                    <div style={{ 
                                        fontSize: '12px', 
                                        color: '#999', 
                                        marginTop: '5px',
                                        display: 'flex',
                                        gap: '15px'
                                    }}>
                                        <span>📅 Tạo: {new Date(config.createdAt).toLocaleDateString('vi-VN')}</span>
                                        {config.lastUsed && (
                                            <span>🕐 Dùng: {new Date(config.lastUsed).toLocaleDateString('vi-VN')}</span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.configActions}>
                                    <Button 
                                        variant="primary" 
                                        size="small"
                                        onClick={() => {
                                            handleApplyConfig(config.id);
                                            setShowManageModal(false);
                                        }}
                                    >
                                        Áp dụng
                                    </Button>
                                    <Button 
                                        variant="warning" 
                                        size="small"
                                        onClick={() => setEditingConfig(config)}
                                    >
                                        ✏️ Sửa
                                    </Button>
                                    <Button 
                                        variant="danger" 
                                        size="small"
                                        onClick={() => handleDeleteConfig(config.id)}
                                    >
                                        🗑️ Xóa
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Modal>

            {/* Edit Config Modal */}
            <Modal
                isOpen={!!editingConfig}
                onClose={() => setEditingConfig(null)}
                title={`✏️ Sửa Config: ${editingConfig?.name}`}
                size="small"
            >
                {editingConfig && (
                    <>
                        <div className="form-group">
                            <label>Tên config:</label>
                            <input
                                type="text"
                                value={editingConfig.name}
                                onChange={(e) => setEditingConfig({...editingConfig, name: e.target.value})}
                                placeholder="Nhập tên config..."
                            />
                        </div>
                        <div style={{ 
                            background: '#f8f9fa', 
                            padding: '15px', 
                            borderRadius: '5px',
                            fontSize: '13px',
                            marginBottom: '15px'
                        }}>
                            <strong>Điều kiện:</strong>
                            <div style={{ marginTop: '8px' }}>
                                <div><strong>Hoa hồng:</strong> {editingConfig.conditions.commission.min || '0'}% - {editingConfig.conditions.commission.max || '100'}%</div>
                                <div><strong>Giá:</strong> {editingConfig.conditions.price.min || '0'} - {editingConfig.conditions.price.max || '10000000'} VND</div>
                                <div><strong>Tồn kho:</strong> {editingConfig.conditions.stock.min || '0'} - {editingConfig.conditions.stock.max || '10000'}</div>
                            </div>
                        </div>
                        <div className="button-group">
                            <Button 
                                variant="primary" 
                                onClick={async () => {
                                    // Save with new name
                                    if (!editingConfig.name.trim()) {
                                        setStatus({ message: '❌ Vui lòng nhập tên config', type: 'error' });
                                        return;
                                    }
                                    
                                    const result = await createFilterConfig(
                                        editingConfig.name, 
                                        editingConfig.conditions, 
                                        editingConfig.description
                                    );
                                    
                                    if (result.success) {
                                        // Delete old config
                                        await deleteFilterConfig(editingConfig.id);
                                        setStatus({ message: '✅ Config đã được cập nhật', type: 'success' });
                                        setEditingConfig(null);
                                    } else {
                                        setStatus({ message: '❌ ' + result.error, type: 'error' });
                                    }
                                }}
                            >
                                💾 Lưu thay đổi
                            </Button>
                            <Button 
                                variant="secondary" 
                                onClick={() => setEditingConfig(null)}
                            >
                                Hủy
                            </Button>
                        </div>
                    </>
                )}
            </Modal>

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

export default SimpleFilter;
