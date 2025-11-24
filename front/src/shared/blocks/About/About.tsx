import React from 'react';
import { IArticle } from '@types/types';
import styles from './About.module.css';

interface AboutProps {
    articles: IArticle[];
}

const About: React.FC<AboutProps> = ({ articles = [] }) => {
    return (
        <section className={styles.about}>
            <ul className={styles.articleList}>
                {articles.map((item) => (
                    <li className={styles.article} key={item.id}>
                        <div className={styles.articleImgContainer}>
                            <img src={item.href} alt="Статья" className={styles.articleImg} />
                        </div>
                        <div className={styles.articleInfo}>
                            <h2 className={styles.articleTitle}>{item.title}</h2>
                            <p className={styles.articleText}>{item.info}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default About;