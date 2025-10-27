import React from 'react';
import styles from '../../styles/components/Shopee.module.css';

const ProgressBar = ({ progress, isVisible = true }) => {
    if (!isVisible || !progress) return null;

    const { current, total, text } = progress;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
                <div 
                    className={styles.progressFill}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className={styles.progressText}>
                {text || `${current}/${total} (${percentage}%)`}
            </div>
        </div>
    );
};

export default ProgressBar;
