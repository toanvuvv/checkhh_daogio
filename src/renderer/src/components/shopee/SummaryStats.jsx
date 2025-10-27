import React from 'react';
import { useFilter } from '../../hooks/useFilter';
import styles from '../../styles/components/Shopee.module.css';

const SummaryStats = ({ results = [] }) => {
    const { getFilterSummary } = useFilter();
    const summary = getFilterSummary(results);

    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const formatCurrency = (num) => {
        // Shopee format: already in VND (no need to divide by 1000)
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(parseFloat(num));
    };

    return (
        <div className={styles.summarySection}>
            <h3>📈 Tổng kết</h3>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>{summary.total}</div>
                    <div className={styles.statLabel}>Tổng sản phẩm</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statNumber} style={{ color: '#28a745' }}>
                        {summary.valid}
                    </div>
                    <div className={styles.statLabel}>Hợp lệ</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statNumber} style={{ color: '#dc3545' }}>
                        {summary.invalid}
                    </div>
                    <div className={styles.statLabel}>Không hợp lệ</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>
                        {summary.avgCommission.toFixed(2)}%
                    </div>
                    <div className={styles.statLabel}>Hoa hồng TB</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>
                        {formatCurrency(summary.totalValue)}
                    </div>
                    <div className={styles.statLabel}>Tổng giá trị</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statNumber}>
                        {summary.totalCommission.toFixed(2)}%
                    </div>
                    <div className={styles.statLabel}>Tổng hoa hồng</div>
                </div>
            </div>
        </div>
    );
};

export default SummaryStats;
