import React from 'react';
import { useLicense } from '../../hooks/useLicense';
import Button from '../common/Button';
import StatusMessage from '../common/StatusMessage';
import styles from '../../styles/components/License.module.css';

const LicenseCard = () => {
    const { 
        licenseInfo, 
        forceValidateLicense, 
        clearCacheAndValidate, 
        deactivateLicense,
        isLoading 
    } = useLicense();
    const [status, setStatus] = React.useState({ message: '', type: '' });

    const handleForceValidate = async () => {
        setStatus({ message: 'Force validating license...', type: 'info' });
        
        try {
            const isValid = await forceValidateLicense();
            
            if (isValid) {
                setStatus({ message: 'License is valid', type: 'success' });
            } else {
                setStatus({ message: 'License is invalid - please reactivate', type: 'error' });
            }
        } catch (error) {
            setStatus({ message: 'Error validating license: ' + error.message, type: 'error' });
        }
    };

    const handleClearCacheAndValidate = async () => {
        if (window.confirm('Are you sure you want to clear cache and re-validate license?')) {
            setStatus({ message: 'Clearing cache and validating...', type: 'info' });
            
            try {
                const isValid = await clearCacheAndValidate();
                
                if (isValid) {
                    setStatus({ message: 'License is valid after cache clear', type: 'success' });
                } else {
                    setStatus({ message: 'License is invalid - please reactivate', type: 'error' });
                }
            } catch (error) {
                setStatus({ message: 'Error clearing cache and validating: ' + error.message, type: 'error' });
            }
        }
    };

    const handleDeactivate = async () => {
        if (window.confirm('Are you sure you want to deactivate the license on this device?')) {
            try {
                const success = await deactivateLicense();
                
                if (success) {
                    setStatus({ message: 'License deactivated successfully', type: 'success' });
                } else {
                    setStatus({ message: 'Failed to deactivate license', type: 'error' });
                }
            } catch (error) {
                setStatus({ message: 'Error deactivating license: ' + error.message, type: 'error' });
            }
        }
    };

    if (!licenseInfo) {
        return (
            <div className={styles.licenseCard}>
                <h3>📋 License Information</h3>
                <p>No license information available.</p>
            </div>
        );
    }

    return (
        <div className={styles.licenseCard}>
            <h3>📋 License Information</h3>
            
            <div className={styles.licenseDetails}>
                <div className={styles.licenseDetail}>
                    <strong>License Key:</strong>
                    <span>{licenseInfo.license_key}</span>
                </div>
                <div className={styles.licenseDetail}>
                    <strong>Type:</strong>
                    <span>{licenseInfo.type}</span>
                </div>
                <div className={styles.licenseDetail}>
                    <strong>Max Devices:</strong>
                    <span>{licenseInfo.max_devices}</span>
                </div>
                <div className={styles.licenseDetail}>
                    <strong>Expire Date:</strong>
                    <span>{licenseInfo.expire_date || 'Never'}</span>
                </div>
                <div className={styles.licenseDetail}>
                    <strong>Last Validation:</strong>
                    <span>{licenseInfo.last_validation || 'Never'}</span>
                </div>
                <div className={styles.licenseDetail}>
                    <strong>Cache Status:</strong>
                    <span style={{ 
                        color: licenseInfo.cache_status?.includes('Valid') ? 'green' : 
                               licenseInfo.cache_status?.includes('Expired but usable') ? 'orange' : 'red' 
                    }}>
                        {licenseInfo.cache_status}
                    </span>
                </div>
                <div className={styles.licenseDetail}>
                    <strong>Cache Age:</strong>
                    <span>{licenseInfo.cache_age_hours} hours</span>
                </div>
                <div className={styles.licenseDetail}>
                    <strong>Device ID:</strong>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {licenseInfo.device_id}
                    </span>
                </div>
            </div>

            <div className="button-group">
                <Button 
                    variant="primary" 
                    onClick={() => window.location.reload()}
                    disabled={isLoading}
                >
                    Refresh License Info
                </Button>
                <Button 
                    variant="warning" 
                    onClick={handleForceValidate}
                    disabled={isLoading}
                >
                    Force Validate
                </Button>
                <Button 
                    variant="warning" 
                    onClick={handleClearCacheAndValidate}
                    disabled={isLoading}
                >
                    Clear Cache & Validate
                </Button>
                <Button 
                    variant="danger" 
                    onClick={handleDeactivate}
                    disabled={isLoading}
                >
                    Deactivate License
                </Button>
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

export default LicenseCard;
