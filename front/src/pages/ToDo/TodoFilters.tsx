import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store/store';
import {
    setSortBy,
    setFilterBy,
    setSearchText,
    resetFilters,
} from '../../store/slices/filtersSlice';
import styles from './ToDo.module.css';

const TodoFilters: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { sortBy, filterBy, searchText } = useSelector((state: RootState) => state.filters);

    return (
        <div className={styles.filters}>
            <div className={styles.filterGroup}>
                <label>{t('filters.search')}:</label>
                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => dispatch(setSearchText(e.target.value))}
                    placeholder={t('filters.searchPlaceholder')}
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.filterGroup}>
                <label>{t('filters.filterBy')}:</label>
                <select
                    value={filterBy}
                    onChange={(e) => dispatch(setFilterBy(e.target.value as any))}
                    className={styles.select}
                >
                    <option value="all">{t('filters.all')}</option>
                    <option value="selected">{t('filters.selected')}</option>
                </select>
            </div>

            <div className={styles.filterGroup}>
                <label>{t('filters.sortBy')}:</label>
                <select
                    value={sortBy}
                    onChange={(e) => dispatch(setSortBy(e.target.value as any))}
                    className={styles.select}
                >
                    <option value="none">{t('filters.none')}</option>
                    <option value="text-asc">{t('filters.textAsc')}</option>
                    <option value="text-desc">{t('filters.textDesc')}</option>
                </select>
            </div>

            <button onClick={() => dispatch(resetFilters())} className={styles.resetButton}>
                {t('filters.reset')}
            </button>
        </div>
    );
};

export default TodoFilters;
