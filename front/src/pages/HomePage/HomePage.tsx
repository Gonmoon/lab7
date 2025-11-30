import { apiClient } from '@shared/api';

const publications = await apiClient.getPublications({ page: 1, limit: 5 });
console.log(publications.data);


import React from 'react';
import { IArticle } from '@types/types';

import Info from '@shared/blocks/Info';
import About from '@shared/blocks/About';
import ShortContact from '@shared/blocks/ShortContact';

import logo from '@assets/Logo.png';

const HomePage: React.FC = () => {
    const articles: IArticle[] = [
        {
            id: '123',
            href: 'article1.png',
            title: 'TEXT',
            info: 'sdfgasdag bfdgjsifdgi osfdjgiuosfjgiuoert jgutrihjguithgntu injvgt uiovnutwirgb nrwtu oibnrwtiuwoibntr',
        },
        {
            id: '1534',
            href: 'article2.png',
            title: 'TEXT',
            info: 'sdfgasdag bfdgjsifdgi osfdjgiuosfjgiuoert jgutrihjguithgntu injvgt uiovnutwirgb nrwtu oibnrwtiuwoibntr',
        },
        {
            id: '7653',
            href: 'article3.png',
            title: 'TEXT',
            info: 'sdfgasdag bfdgjsifdgi osfdjgiuosfjgiuoert jgutrihjguithgntu injvgt uiovnutwirgb nrwtu oibnrwtiuwoibntr',
        },
    ];

    const titleInfo = 'НАЗВАНИЕ';
    const textInfo = 'Потом придумаю текст, честно)';

    const infoShortContact = 'Ваша реклама';

    return (
        <>
            <Info title={titleInfo} text={textInfo} logo={logo} />
            <About articles={articles} />
            <ShortContact info={infoShortContact} href="#" text="Клик!" />
        </>
    );
};

export default HomePage;
