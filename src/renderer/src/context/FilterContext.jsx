import React, { createContext, useContext, useState, useEffect } from 'react';

const FilterContext = createContext();

export const useFilter = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilter must be used within a FilterProvider');
    }
    return context;
};

export const FilterProvider = ({ children }) => {
    const [filterConfigs, setFilterConfigs] = useState([]);
    const [currentFilter, setCurrentFilter] = useState(null);
    const [filteredResults, setFilteredResults] = useState([]);
    const [filterConditions, setFilterConditions] = useState({
        commission: { min: '', max: '' },
        price: { min: '', max: '' },
        stock: { min: '', max: '' }
    });

    // Load filter configs on mount
    useEffect(() => {
        loadFilterConfigs();
    }, []);

    const loadFilterConfigs = async () => {
        try {
            if (window.electronAPI) {
                const configs = await window.electronAPI.getAllFilterConfigs();
                setFilterConfigs(configs || []);
            }
        } catch (error) {
            console.error('Error loading filter configs:', error);
        }
    };

    const createFilterConfig = async (name, conditions, description = '') => {
        try {
            const config = await window.electronAPI.createFilterConfig(name, {
                conditions,
                description,
                createdAt: new Date().toISOString()
            });
            
            if (config) {
                await loadFilterConfigs(); // Refresh configs
                return { success: true, config };
            } else {
                return { success: false, error: 'Không thể tạo filter config' };
            }
        } catch (error) {
            console.error('Error creating filter config:', error);
            return { success: false, error: error.message };
        }
    };

    const applyFilterConfig = async (configId) => {
        try {
            const config = filterConfigs.find(c => c.id === configId);
            if (!config) {
                return { success: false, error: 'Không tìm thấy filter config' };
            }

            setCurrentFilter(config);
            setFilterConditions(config.conditions);
            
            return { success: true, config };
        } catch (error) {
            console.error('Error applying filter config:', error);
            return { success: false, error: error.message };
        }
    };

    const deleteFilterConfig = async (configId) => {
        try {
            const success = await window.electronAPI.deleteFilterConfig(configId);
            
            if (success) {
                await loadFilterConfigs(); // Refresh configs
                if (currentFilter && currentFilter.id === configId) {
                    setCurrentFilter(null);
                    setFilterConditions({
                        commission: { min: '', max: '' },
                        price: { min: '', max: '' },
                        stock: { min: '', max: '' }
                    });
                }
                return { success: true };
            } else {
                return { success: false, error: 'Không thể xóa filter config' };
            }
        } catch (error) {
            console.error('Error deleting filter config:', error);
            return { success: false, error: error.message };
        }
    };

    const applySimpleFilter = (results, conditions) => {
        if (!results || results.length === 0) return [];

        return results.filter(product => {
            const itemData = product.itemData || {};
            
            // Commission filter (convert from basis points to percentage, comm_rate 1000 = 1%)
            if (conditions.commission) {
                const commission = parseFloat(itemData.comm_rate || product.comm_rate || 0) / 1000;
                if (conditions.commission.min !== undefined && conditions.commission.min !== '' && commission < parseFloat(conditions.commission.min)) return false;
                if (conditions.commission.max !== undefined && conditions.commission.max !== '' && commission > parseFloat(conditions.commission.max)) return false;
            }
            
            // Price filter (Shopee format: already in VND)
            if (conditions.price) {
                const price = parseInt(itemData.price || product.price || 0);
                if (conditions.price.min !== undefined && conditions.price.min !== '' && price < parseInt(conditions.price.min)) return false;
                if (conditions.price.max !== undefined && conditions.price.max !== '' && price > parseInt(conditions.price.max)) return false;
            }
            
            // Stock filter
            if (conditions.stock) {
                const stock = parseInt(itemData.normal_stock || product.status?.stock || 0);
                if (conditions.stock.min !== undefined && conditions.stock.min !== '' && stock < parseInt(conditions.stock.min)) return false;
                if (conditions.stock.max !== undefined && conditions.stock.max !== '' && stock > parseInt(conditions.stock.max)) return false;
            }
            
            return true;
        });
    };

    const applyCurrentFilter = (results) => {
        const filtered = applySimpleFilter(results, filterConditions);
        setFilteredResults(filtered);
        return filtered;
    };

    const clearFilter = () => {
        setFilterConditions({
            commission: { min: '', max: '' },
            price: { min: '', max: '' },
            stock: { min: '', max: '' }
        });
        setCurrentFilter(null);
        setFilteredResults([]);
    };

    const updateFilterCondition = (field, subField, value) => {
        setFilterConditions(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [subField]: value
            }
        }));
    };

    const getFilterSummary = (results = filteredResults) => {
        if (!results || results.length === 0) {
            return {
                total: 0,
                valid: 0,
                invalid: 0,
                totalCommission: 0,
                avgCommission: 0,
                totalValue: 0
            };
        }

        const valid = results.filter(r => r.isValid);
        const invalid = results.filter(r => !r.isValid);
        
        const totalCommission = results.reduce((sum, r) => {
            const itemData = r.itemData || {};
            const commission = parseFloat(itemData.comm_rate || r.comm_rate || 0) / 1000; // comm_rate 1000 = 1%
            return sum + commission;
        }, 0);

        const totalValue = results.reduce((sum, r) => {
            const itemData = r.itemData || {};
            const price = parseInt(itemData.price || r.price || 0); // Already in VND
            return sum + price;
        }, 0);

        return {
            total: results.length,
            valid: valid.length,
            invalid: invalid.length,
            totalCommission,
            avgCommission: results.length > 0 ? totalCommission / results.length : 0,
            totalValue
        };
    };

    const exportFilterConfigs = async () => {
        try {
            const data = await window.electronAPI.exportFilterConfigs();
            return { success: true, data };
        } catch (error) {
            console.error('Error exporting filter configs:', error);
            return { success: false, error: error.message };
        }
    };

    const importFilterConfigs = async (data) => {
        try {
            const result = await window.electronAPI.importFilterConfigs(data);
            if (result) {
                await loadFilterConfigs(); // Refresh configs
                return { success: true };
            } else {
                return { success: false, error: 'Không thể import filter configs' };
            }
        } catch (error) {
            console.error('Error importing filter configs:', error);
            return { success: false, error: error.message };
        }
    };

    const clearAllFilterConfigs = async () => {
        try {
            const success = await window.electronAPI.clearAllFilterConfigs();
            if (success) {
                await loadFilterConfigs(); // Refresh configs
                setCurrentFilter(null);
                setFilterConditions({
                    commission: { min: '', max: '' },
                    price: { min: '', max: '' },
                    stock: { min: '', max: '' }
                });
                setFilteredResults([]);
                return { success: true };
            } else {
                return { success: false, error: 'Không thể xóa tất cả filter configs' };
            }
        } catch (error) {
            console.error('Error clearing all filter configs:', error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        filterConfigs,
        currentFilter,
        filteredResults,
        filterConditions,
        setFilterConditions,
        loadFilterConfigs,
        createFilterConfig,
        applyFilterConfig,
        deleteFilterConfig,
        applySimpleFilter,
        applyCurrentFilter,
        clearFilter,
        updateFilterCondition,
        getFilterSummary,
        exportFilterConfigs,
        importFilterConfigs,
        clearAllFilterConfigs
    };

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};
