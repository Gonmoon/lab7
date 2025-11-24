import React from 'react';
import Button from '@shared/components/Button';
import styles from './ToDo.module.css';

interface TodoModalProps {
    editingText: string;
    setEditingText: (text: string) => void;
    onSave: () => void;
    onCancel: () => void;
    t: (key: string) => string;
}

const TodoModal: React.FC<TodoModalProps> = ({
    editingText,
    setEditingText,
    onSave,
    onCancel,
    t,
}) => {
    return (
        <div className={styles.modal_overlay}>
            <div className={styles.modal}>
                <h2>{t('todo.editTodo')}</h2>
                <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className={styles.modal_input}
                    onKeyPress={(e) => e.key === 'Enter' && onSave()}
                />
                <div className={styles.modal_buttons}>
                    <Button text={t('todo.save')} onClick={onSave} disabled={!editingText.trim()} />
                    <Button text={t('todo.cancel')} onClick={onCancel} />
                </div>
            </div>
        </div>
    );
};

export default TodoModal;
