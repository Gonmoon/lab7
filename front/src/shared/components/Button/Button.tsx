import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
    text: string;
    href?: string;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({ text, href, onClick, type = 'button' }) => {
    if (href) {
        return (
            <div className={styles.buttonContainer}>
                <a href={href} className={styles.buttonText}>
                    {text}
                </a>
            </div>
        );
    }

    return (
        <div className={styles.buttonContainer}>
            <button type={type} onClick={onClick} className={styles.buttonText}>
                {text}
            </button>
        </div>
    );
};

export default Button;
