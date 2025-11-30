import React from 'react';
import styles from './Info.module.css';

interface InfoProps {
    title: string;
    text: string;
    logo?: string;
}

const Info: React.FC<InfoProps> = ({ title, text, logo }) => {
    return (
        <section className={styles.info}>
            <h2 className={styles.title}>{title}</h2>
            <br />
            <p className={styles.text}>{text}</p>
            {logo && <img src={logo} alt="Logo" className={styles.infoImg} />}
        </section>
    );
};

export default Info;
