import React from 'react';
import styles from '../styles/pages/Welcome.module.css';

const WelcomePage = () => {
    return (
        <div className={styles.welcomePage}>
            <h1>🎉 Welcome!</h1>
            <p>Your license is active and valid.</p>
            
            <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                    <h3>🔐 Secure License</h3>
                    <p>Your application is protected with advanced license management system</p>
                </div>
                <div className={styles.featureCard}>
                    <h3>⚡ Fast Performance</h3>
                    <p>Optimized for speed and efficiency</p>
                </div>
                <div className={styles.featureCard}>
                    <h3>🛡️ Device Protection</h3>
                    <p>Hardware-based device fingerprinting for security</p>
                </div>
            </div>
        </div>
    );
};

export default WelcomePage;
