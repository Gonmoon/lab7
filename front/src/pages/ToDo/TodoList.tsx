import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@shared/components/Button';
import { Todo } from '../../store/slices/todosSlice';
import styles from './ToDo.module.css';

interface TodoListProps {
    todos: Todo[];
    onToggleSelect: (id: number) => void;
    onEdit: (todo: Todo) => void;
    onDelete: (id: number) => void;
    loading: boolean;
}

const TodoList: React.FC<TodoListProps> = ({
    todos,
    onToggleSelect,
    onEdit,
    onDelete,
    loading,
}) => {
    const { t } = useTranslation();

    if (todos.length === 0) {
        return <div className={styles.empty}>{t('todo.empty')}</div>;
    }

    return (
        <ul className={styles.todo_list}>
            {todos.map((todo) => (
                <li
                    key={todo.id}
                    className={`${styles.todo_item} ${todo.selected ? styles.selected : ''} ${
                        todo.completed ? styles.completed : ''
                    }`}
                    onClick={() => onToggleSelect(todo.id)}
                >
                    <div className={styles.wrapper_item}>
                        <span className={styles.todo_item_text}>{todo.text}</span>
                        <div className={styles.actions}>
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(todo);
                                }}
                                text={t('todo.edit')}
                                disabled={loading}
                            />
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(todo.id);
                                }}
                                text={t('todo.delete')}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default TodoList;
