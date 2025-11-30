import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useTranslation } from 'react-i18next';
import {
    fetchTodos,
    addTodo,
    deleteTodo,
    updateTodo,
    deleteSelectedTodos,
    toggleSelect,
    clearError,
} from '../../store/slices/todosSlice';
import {
    setSortBy,
    setFilterBy,
    setSearchText,
    resetFilters,
} from '../../store/slices/filtersSlice';
import Button from '@shared/components/Button';
import TodoFilters from './TodoFilters';
import TodoList from './TodoList';
import TodoModal from './TodoModal';
import LanguageSwitcher from '../../i18n/LanguageSwitcher';
import styles from './ToDo.module.css';

const ToDo: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { items: todos, loading, error } = useAppSelector((state) => state.todos);
    const filters = useAppSelector((state) => state.filters);

    const [newTodo, setNewTodo] = useState('');
    const [editingTodo, setEditingTodo] = useState<any>(null);
    const [editingText, setEditingText] = useState('');

    useEffect(() => {
        dispatch(fetchTodos());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                dispatch(clearError());
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, dispatch]);

    const handleAddTodo = () => {
        if (!newTodo.trim()) return;
        dispatch(addTodo(newTodo))
            .unwrap()
            .then(() => {
                setNewTodo('');
            })
            .catch((err) => {
                console.error('Failed to add todo:', err);
            });
    };

    const handleDeleteTodo = (id: number) => {
        dispatch(deleteTodo(id));
    };

    const handleDeleteSelected = () => {
        dispatch(deleteSelectedTodos());
    };

    const handleToggleSelect = (id: number) => {
        dispatch(toggleSelect(id));
    };

    const startEditing = (todo: any) => {
        setEditingTodo(todo);
        setEditingText(todo.text);
    };

    const saveEditing = () => {
        if (!editingTodo) return;
        dispatch(updateTodo({ id: editingTodo.id, text: editingText }))
            .unwrap()
            .then(() => {
                setEditingTodo(null);
                setEditingText('');
            })
            .catch((err) => {
                console.error('Failed to update todo:', err);
            });
    };

    const cancelEditing = () => {
        setEditingTodo(null);
        setEditingText('');
    };

    const filteredAndSortedTodos = React.useMemo(() => {
        let filtered = [...todos];

        if (filters.filterBy === 'completed') {
            filtered = filtered.filter((todo) => todo.completed);
        } else if (filters.filterBy === 'active') {
            filtered = filtered.filter((todo) => !todo.completed);
        } else if (filters.filterBy === 'selected') {
            filtered = filtered.filter((todo) => todo.selected);
        }

        if (filters.searchText) {
            filtered = filtered.filter((todo) =>
                todo.text.toLowerCase().includes(filters.searchText.toLowerCase()),
            );
        }

        if (filters.sortBy === 'text-asc') {
            filtered.sort((a, b) => a.text.localeCompare(b.text));
        } else if (filters.sortBy === 'text-desc') {
            filtered.sort((a, b) => b.text.localeCompare(a.text));
        } else if (filters.sortBy === 'completed') {
            filtered.sort((a, b) => Number(b.completed) - Number(a.completed));
        }

        return filtered;
    }, [todos, filters]);

    if (loading && todos.length === 0) {
        return (
            <>
                <LanguageSwitcher />
                <div className={styles.loading}>{t('loading')}</div>
            </>
        );
    }

    return (
        <>
            {/* Просто вставляем кнопку переключения языка */}
            <LanguageSwitcher />

            <section className={styles.wrapper}>
                <h1 className={styles.title}>{t('todo.title')}</h1>

                {error && (
                    <div className={styles.error}>
                        {t('error')}: {error}
                        <button
                            onClick={() => dispatch(clearError())}
                            className={styles.closeError}
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className={styles.input_wrapper}>
                    <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        placeholder={t('todo.addPlaceholder')}
                        className={styles.input}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                    />
                    <Button text={t('todo.add')} onClick={handleAddTodo} disabled={loading} />
                    <Button
                        text={t('todo.deleteSelected')}
                        onClick={handleDeleteSelected}
                        disabled={!todos.some((todo) => todo.selected)}
                    />
                </div>

                <TodoFilters />

                <TodoList
                    todos={filteredAndSortedTodos}
                    onToggleSelect={handleToggleSelect}
                    onEdit={startEditing}
                    onDelete={handleDeleteTodo}
                    loading={loading}
                />

                {editingTodo && (
                    <TodoModal
                        editingText={editingText}
                        setEditingText={setEditingText}
                        onSave={saveEditing}
                        onCancel={cancelEditing}
                        t={t}
                    />
                )}
            </section>
        </>
    );
};

export default ToDo;
