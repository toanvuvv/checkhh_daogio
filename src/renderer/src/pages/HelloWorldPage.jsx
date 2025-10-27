import React from 'react';
import styles from '../styles/pages/Welcome.module.css';

const HelloWorldPage = () => {
    return (
        <div className={styles.welcomePage}>
            <h1>👋 Hello World!</h1>
            <p>This is your basic application page.</p>
            <p>You can develop your features here.</p>
            
            <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                    <h3>🚀 Ready to Code</h3>
                    <p>Start building your amazing features</p>
                </div>
                <div className={styles.featureCard}>
                    <h3>📱 Responsive Design</h3>
                    <p>Beautiful UI that works on all devices</p>
                </div>
                <div className={styles.featureCard}>
                    <h3>🔧 Easy to Extend</h3>
                    <p>Modular architecture for easy development</p>
                </div>
            </div>
        </div>
    );
};

export default HelloWorldPage;
