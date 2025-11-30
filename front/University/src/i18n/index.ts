import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            todo: {
                title: 'Todo List',
                add: 'ADD',
                edit: 'Edit',
                delete: 'Delete',
                save: 'Save',
                cancel: 'Cancel',
                deleteSelected: 'Delete Selected',
                addPlaceholder: 'Add Todo',
                editTodo: 'Edit Todo',
                empty: 'No todos found',
            },
            filters: {
                search: 'Search',
                searchPlaceholder: 'Search todos...',
                filterBy: 'Filter by',
                sortBy: 'Sort by',
                all: 'All',
                completed: 'Completed',
                active: 'Active',
                selected: 'Selected',
                none: 'None',
                textAsc: 'Text A-Z',
                textDesc: 'Text Z-A',
                reset: 'Reset Filters',
            },
            loading: 'Loading...',
            error: 'Error',
        },
    },
    ru: {
        translation: {
            todo: {
                title: 'Список Задач',
                add: 'ДОБАВИТЬ',
                edit: 'Редактировать',
                delete: 'Удалить',
                save: 'Сохранить',
                cancel: 'Отмена',
                deleteSelected: 'Удалить Выбранные',
                addPlaceholder: 'Добавить задачу',
                editTodo: 'Редактировать задачу',
                empty: 'Задачи не найдены',
            },
            filters: {
                search: 'Поиск',
                searchPlaceholder: 'Поиск задач...',
                filterBy: 'Фильтр',
                sortBy: 'Сортировка',
                all: 'Все',
                completed: 'Выполненные',
                active: 'Активные',
                selected: 'Выбранные',
                none: 'Без сортировки',
                textAsc: 'Текст А-Я',
                textDesc: 'Текст Я-А',
                reset: 'Сбросить фильтры',
            },
            loading: 'Загрузка...',
            error: 'Ошибка',
        },
    },
};

i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
