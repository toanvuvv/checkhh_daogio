import React from 'react';
import { useLicense } from '../../hooks/useLicense';
import Button from '../common/Button';
import styles from '../../styles/components/License.module.css';

const LicenseLockOverlay = () => {
    const { showLicenseForm } = useLicense();

    const handleActivateLicense = () => {
        showLicenseForm();
    };

    const handleExitApp = () => {
        if (window.electronAPI && window.electronAPI.exitApp) {
            window.electronAPI.exitApp();
        }
    };

    return (
        <div className={styles.licenseLockOverlay}>
            <div className={styles.lockContent}>
                <div className={styles.lockIcon}>🔒</div>
                <div className={styles.lockTitle}>License Required</div>
                <div className={styles.lockMessage}>
                    This application requires a valid license to continue.<br />
                    Please activate your license to access all features.
                </div>
                <div className={styles.lockActions}>
                    <Button 
                        className={styles.btnActivate}
                        onClick={handleActivateLicense}
                    >
                        Activate License
                    </Button>
                    <Button 
                        className={styles.btnExit}
                        onClick={handleExitApp}
                    >
                        Exit Application
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LicenseLockOverlay;
