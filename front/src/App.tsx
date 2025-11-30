import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Header from '@widgets/Header';
import Footer from '@widgets/Footer';
import HomePage from '@pages/HomePage';
// import ToDo from '@pages/ToDo';
// import Material from '@pages/Material';
import Packages from '@pages/Packages';
import Entrance from '@pages/Entrance';
import Article from '@pages/Article';
import NotFoundPage from '@pages/NotFoundPage';

import { INavItem } from '@types/types';
import logo from '@assets/Logo.png';

import { store } from './store';
import './i18n';
import './App.css';

function App() {
    const navItems: INavItem[] = [
        { id: '1', label: 'Home', href: '/' },
        { id: '2', label: 'Packages', href: '/packages' },
        { id: '3', label: 'Entrance', href: '/entrance' },
        { id: '4', label: 'Article', href: '/article' },
    ];

    return (
        <Provider store={store}>
            <BrowserRouter>
                <Header logo={logo} navItems={navItems} />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    {/*<Route path="/todo" element={<ToDo />} />*/}
                    {/*<Route path="/material" element={<Material />} />*/}
                    <Route path="/packages" element={<Packages />} />
                    <Route path="/entrance" element={<Entrance />} />
                    <Route path="/article" element={<Article />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
                <Footer text="©Made In China" />
            </BrowserRouter>
        </Provider>
    );
}

export default App;
