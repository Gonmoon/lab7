import React, { useEffect, ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    closeOnOverlayClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    closeOnOverlayClick = true,
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnOverlayClick) {
            onClose();
        }
    };

    return (
        <div className={styles.modal__overlay} onClick={handleOverlayClick}>
            <div className={styles.modal__content}>
                <div className={styles.modal__header}>
                    {title && <h2 className={styles.modal__title}>{title}</h2>}
                    <button className={styles.modal__closebtn} onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className={styles.modal__body}>{children}</div>
            </div>
        </div>
    );
};

export default Modal;
