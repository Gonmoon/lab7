import React from 'react';
import { Link } from 'react-router-dom';
import { INavItem } from '@types/types';
// import Button from '@shared/components/Button';
import styles from './Header.module.css';

interface HeaderProps {
    logo: string;
    navItems: INavItem[];
}

const Header: React.FC<HeaderProps> = ({ logo, navItems = [] }) => {
    return (
        <header className={styles.header}>
            <div className={styles.logoContainer}>
                <img src={logo} alt="Логотип" className={styles.logo} />
            </div>
            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {navItems.map((item) => (
                        <li key={item.id} className={styles.navPoint}>
                            <Link to={item.href} className={styles.navLink}>
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            {/*<Button text="LogIn" />*/}
        </header>
    );
};

export default Header;
