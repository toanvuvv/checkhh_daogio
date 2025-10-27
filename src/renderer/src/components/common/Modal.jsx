import React, { useEffect } from 'react';
import './Modal.css';

const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'medium',
    showCloseButton = true,
    closeOnOverlayClick = true 
}) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && closeOnOverlayClick) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className={`modal modal-${size}`}>
                {title && (
                    <div className="modal-header">
                        <h3 className="modal-title">{title}</h3>
                        {showCloseButton && (
                            <button 
                                className="modal-close" 
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}
                <div className="modal-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
