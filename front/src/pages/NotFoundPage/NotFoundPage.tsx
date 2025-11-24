import React from 'react';
import Info from '@shared/blocks/Info';

const NotFoundPage: React.FC = () => {
    const titleInfo = '404';
    const textInfo = 'Такой страницы не существует';

    return <Info title={titleInfo} text={textInfo} />;
};

export default NotFoundPage;
