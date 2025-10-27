import React, { createContext, useContext, useState, useEffect } from 'react';

const LicenseContext = createContext();

export const useLicense = () => {
    const context = useContext(LicenseContext);
    if (!context) {
        throw new Error('useLicense must be used within a LicenseProvider');
    }
    return context;
};

export const LicenseProvider = ({ children }) => {
    const [isValid, setIsValid] = useState(false);
    const [licenseInfo, setLicenseInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isShowingLicenseForm, setIsShowingLicenseForm] = useState(false);

    // Initialize license check
    useEffect(() => {
        const initializeLicense = async () => {
            try {
                if (window.electronAPI) {
                    const deviceId = await window.electronAPI.getDeviceId();
                    const isValid = await window.electronAPI.validateLicense();
                    
                    setIsValid(isValid);
                    
                    if (isValid) {
                        const info = await window.electronAPI.getLicenseInfo();
                        setLicenseInfo(info);
                    } else {
                        setIsShowingLicenseForm(true);
                    }
                }
            } catch (error) {
                console.error('Error initializing license:', error);
                setIsShowingLicenseForm(true);
            } finally {
                setIsLoading(false);
            }
        };

        initializeLicense();
    }, []);

    const activateLicense = async (licenseKey) => {
        try {
            setIsLoading(true);
            const success = await window.electronAPI.activateLicense(licenseKey);
            
            if (success) {
                setIsValid(true);
                setIsShowingLicenseForm(false);
                const info = await window.electronAPI.getLicenseInfo();
                setLicenseInfo(info);
                return { success: true };
            } else {
                return { success: false, error: 'License activation failed' };
            }
        } catch (error) {
            console.error('Error activating license:', error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const validateLicense = async () => {
        try {
            const isValid = await window.electronAPI.validateLicense();
            setIsValid(isValid);
            
            if (isValid) {
                const info = await window.electronAPI.getLicenseInfo();
                setLicenseInfo(info);
            }
            
            return isValid;
        } catch (error) {
            console.error('Error validating license:', error);
            return false;
        }
    };

    const forceValidateLicense = async () => {
        try {
            setIsLoading(true);
            const isValid = await window.electronAPI.forceValidateLicense();
            setIsValid(isValid);
            
            if (isValid) {
                const info = await window.electronAPI.getLicenseInfo();
                setLicenseInfo(info);
            }
            
            return isValid;
        } catch (error) {
            console.error('Error force validating license:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const clearCacheAndValidate = async () => {
        try {
            setIsLoading(true);
            const isValid = await window.electronAPI.clearCacheAndValidate();
            setIsValid(isValid);
            
            if (isValid) {
                const info = await window.electronAPI.getLicenseInfo();
                setLicenseInfo(info);
            }
            
            return isValid;
        } catch (error) {
            console.error('Error clearing cache and validating:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const deactivateLicense = async () => {
        try {
            setIsLoading(true);
            const success = await window.electronAPI.deactivateLicense();
            
            if (success) {
                setIsValid(false);
                setLicenseInfo(null);
                setIsShowingLicenseForm(true);
            }
            
            return success;
        } catch (error) {
            console.error('Error deactivating license:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const showLicenseForm = () => {
        setIsShowingLicenseForm(true);
    };

    const hideLicenseForm = () => {
        setIsShowingLicenseForm(false);
    };

    const getDeviceId = async () => {
        try {
            return await window.electronAPI.getDeviceId();
        } catch (error) {
            console.error('Error getting device ID:', error);
            return null;
        }
    };

    const value = {
        isValid,
        licenseInfo,
        isLoading,
        isShowingLicenseForm,
        activateLicense,
        validateLicense,
        forceValidateLicense,
        clearCacheAndValidate,
        deactivateLicense,
        showLicenseForm,
        hideLicenseForm,
        getDeviceId
    };

    return (
        <LicenseContext.Provider value={value}>
            {children}
        </LicenseContext.Provider>
    );
};
