import React from 'react';
import Button from '@shared/components/Button';
import styles from './ShortContact.module.css';

interface ShortContactProps {
    info: string;
    href: string;
    text: string;
}

const ShortContact: React.FC<ShortContactProps> = ({ info, href, text }) => {
    return (
        <section className={styles.contact}>
            <h3 className={styles.info}>{info}</h3>
            <Button href={href} text={text} />
        </section>
    );
};

export default ShortContact;
