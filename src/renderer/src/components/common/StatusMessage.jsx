import React, { useState, useEffect } from 'react';
import './StatusMessage.css';

const StatusMessage = ({ message, type = 'info', duration = 5000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            
            if (duration > 0) {
                const timer = setTimeout(() => {
                    setIsVisible(false);
                    if (onClose) onClose();
                }, duration);
                
                return () => clearTimeout(timer);
            }
        } else {
            setIsVisible(false);
        }
    }, [message, duration, onClose]);

    if (!isVisible || !message) {
        return null;
    }

    return (
        <div className={`status status-${type}`}>
            <span className="status-message">{message}</span>
            {onClose && (
                <button 
                    className="status-close" 
                    onClick={() => {
                        setIsVisible(false);
                        onClose();
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

export default StatusMessage;
