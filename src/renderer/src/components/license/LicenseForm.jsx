import React, { useState, useEffect } from 'react';
import { useLicense } from '../../hooks/useLicense';
import Button from '../common/Button';
import StatusMessage from '../common/StatusMessage';
import styles from '../../styles/components/License.module.css';

const LicenseForm = ({ isStandalone = false }) => {
    const { activateLicense, getDeviceId, isLoading } = useLicense();
    const [licenseKey, setLicenseKey] = useState('');
    const [deviceId, setDeviceId] = useState('');
    const [status, setStatus] = useState({ message: '', type: '' });

    useEffect(() => {
        const loadDeviceId = async () => {
            try {
                const id = await getDeviceId();
                setDeviceId(id || '');
            } catch (error) {
                console.error('Error loading device ID:', error);
            }
        };
        loadDeviceId();
    }, [getDeviceId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!licenseKey.trim()) {
            setStatus({ message: 'Please enter a license key', type: 'error' });
            return;
        }

        setStatus({ message: 'Activating license...', type: 'info' });

        try {
            const result = await activateLicense(licenseKey.trim());
            
            if (result.success) {
                setStatus({ message: 'License activated successfully!', type: 'success' });
                setLicenseKey('');
            } else {
                setStatus({ 
                    message: result.error || 'License activation failed. Please check your license key.', 
                    type: 'error' 
                });
            }
        } catch (error) {
            setStatus({ 
                message: 'Error activating license: ' + error.message, 
                type: 'error' 
            });
        }
    };

    const debugDeviceId = async () => {
        try {
            const id = await getDeviceId();
            setDeviceId(id || '');
            setStatus({ message: 'Device ID refreshed', type: 'info' });
        } catch (error) {
            setStatus({ message: 'Error getting device ID: ' + error.message, type: 'error' });
        }
    };

    return (
        <div className={`${styles.licenseForm} ${isStandalone ? styles.standalone : ''} ${isStandalone ? styles.show : ''}`}>
            <h3>🔐 License Activation</h3>
            <p>Please enter your license key to continue:</p>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="license-key">License Key:</label>
                    <input
                        type="text"
                        id="license-key"
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value)}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        disabled={isLoading}
                    />
                </div>
                
                <div className="button-group">
                    <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Activating...' : 'Activate License'}
                    </Button>
                    
                    <Button 
                        type="button" 
                        variant="warning" 
                        onClick={debugDeviceId}
                        disabled={isLoading}
                    >
                        🔍 Debug Device ID
                    </Button>
                </div>
            </form>

            {deviceId && (
                <div className="device-info">
                    <strong>Device ID:</strong>
                    <span>{deviceId}</span>
                </div>
            )}

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

export default LicenseForm;
