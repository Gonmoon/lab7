import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './DnD.module.css';

// Тип для элемента
interface Item {
  id: string;
  title: string;
  content: string;
}

// Начальные данные
const initialItems: Item[] = [
  { id: '1', title: 'Первая задача', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
  { id: '2', title: 'Вторая задача', content: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
  { id: '3', title: 'Третья задача', content: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.' },
  { id: '4', title: 'Четвертая задача', content: 'Duis aute irure dolor in reprehenderit in voluptate velit.' },
  { id: '5', title: 'Пятая задача', content: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa.' },
  { id: '6', title: 'Шестая задача', content: 'Qui officia deserunt mollit anim id est laborum.' },
  { id: '7', title: 'Седьмая задача', content: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem.' },
  { id: '8', title: 'Восьмая задача', content: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit.' },
];

// Компонент сортируемого элемента
const SortableItem: React.FC<{ item: Item }> = ({ item }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className={styles.dragHandle}>
        ⋮⋮
      </div>
      <div className={styles.cardContent}>
        <h3>{item.title}</h3>
        <p>{item.content}</p>
        <div className={styles.cardId}>ID: {item.id}</div>
      </div>
    </div>
  );
};

const DnD: React.FC = () => {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Настройка сенсоров
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Обработка начала перетаскивания
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Обработка окончания перетаскивания
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Добавить новый элемент
  const addItem = () => {
    const newId = `item-${Date.now()}`;
    const newItem: Item = {
      id: newId,
      title: `Новая задача ${items.length + 1}`,
      content: 'Это новая задача, добавленная через кнопку.',
    };
    setItems([...items, newItem]);
  };

  // Удалить элемент
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Сбросить к начальному состоянию
  const resetItems = () => {
    setItems(initialItems);
  };

  // Активный элемент для информации
  const activeItem = activeId ? items.find(item => item.id === activeId) : null;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Drag & Drop Пример</h1>
      <p className={styles.subtitle}>Перетаскивайте карточки для изменения порядка</p>

      {/* Информация о перетаскивании */}
      {activeItem && (
        <div className={styles.activeInfo}>
          Перетаскивается: <strong>{activeItem.title}</strong>
        </div>
      )}

      {/* Управление */}
      <div className={styles.controls}>
        <button onClick={addItem} className={styles.addButton}>
          + Добавить карточку
        </button>
        <button onClick={resetItems} className={styles.resetButton}>
          ⟳ Сбросить порядок
        </button>
        <div className={styles.counter}>
          Карточек: <span className={styles.count}>{items.length}</span>
        </div>
      </div>

      {/* Основная область DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.dndArea}>
          <SortableContext
            items={items.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <div key={item.id} className={styles.itemContainer}>
                <SortableItem item={item} />
                <button
                  onClick={() => removeItem(item.id)}
                  className={styles.deleteButton}
                  title="Удалить карточку"
                >
                  ×
                </button>
              </div>
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* Инструкция */}
      <div className={styles.instructions}>
        <h3>Инструкция:</h3>
        <ul>
          <li>Зажмите и перетащите карточку для изменения порядка</li>
          <li>Используйте клавиши со стрелками для навигации при перетаскивании</li>
          <li>Нажмите "×" для удаления карточки</li>
        </ul>
      </div>

      {/* Информация о библиотеке */}
      <div className={styles.libraryInfo}>
        <p>Используется библиотека: <strong>@dnd-kit</strong></p>
        <p>Поддерживает: мышь, тач, клавиатуру</p>
      </div>
    </div>
  );
};

export default DnD;