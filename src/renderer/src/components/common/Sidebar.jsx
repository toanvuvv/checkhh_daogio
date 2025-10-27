import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLicense } from '../../hooks/useLicense';
import styles from '../../styles/components/Sidebar.module.css';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isValid } = useLicense();

    const navItems = [
        { id: 'welcome', label: '🏠 Welcome', path: '/' },
        { id: 'license', label: '🔐 License Management', path: '/license' },
        { id: 'shopee', label: '🛒 Shopee Management', path: '/shopee' },
        { id: 'hello', label: '👋 Hello World', path: '/hello' }
    ];

    const handleNavClick = (path) => {
        // Check license before allowing navigation (except for license page)
        if (!isValid && path !== '/license') {
            navigate('/license');
            return;
        }
        navigate(path);
    };

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className={`${styles.sidebar} ${!isValid ? styles.locked : ''}`}>
            <h2>Tool Check Shopee Nâng cao</h2>
            {navItems.map((item) => (
                <button
                    key={item.id}
                    className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                    onClick={() => handleNavClick(item.path)}
                    disabled={!isValid && item.path !== '/license'}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
};

export default Sidebar;
