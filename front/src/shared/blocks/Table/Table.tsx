import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  FilterFn,
} from '@tanstack/react-table';
import styles from './Table.module.css';

// Тип данных для таблицы
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  sales: number;
  date: string;
  status: 'active' | 'out_of_stock' | 'discontinued';
}

// Простая функция фильтрации для поиска по тексту
const textFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);
  if (typeof value !== 'string') return true;
  if (!filterValue) return true;
  return value.toLowerCase().includes(filterValue.toLowerCase());
};

// Функция для фильтрации по диапазону чисел
const numberRangeFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId) as number;
  const [min, max] = filterValue;
  
  if (min === undefined && max === undefined) return true;
  if (min === undefined) return value <= max;
  if (max === undefined) return value >= min;
  return value >= min && value <= max;
};

// Генерация случайных данных
const generateProducts = (count: number): Product[] => {
  const categories = ['Электроника', 'Одежда', 'Книги', 'Продукты', 'Игрушки', 'Красота'];
  const statuses: Product['status'][] = ['active', 'out_of_stock', 'discontinued'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Товар ${i + 1}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    price: Math.floor(Math.random() * 10000) + 100,
    stock: Math.floor(Math.random() * 200),
    rating: Math.floor(Math.random() * 5) + 1,
    sales: Math.floor(Math.random() * 1000),
    date: `${Math.floor(Math.random() * 28) + 1}.${Math.floor(Math.random() * 12) + 1}.2024`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
  }));
};

const Table: React.FC = () => {
  const [data, setData] = useState<Product[]>(() => generateProducts(100));
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [editingCell, setEditingCell] = useState<{ rowId: number; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Состояния для фильтров по числам
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState({ min: '', max: '' });
  const [salesFilter, setSalesFilter] = useState({ min: '', max: '' });

  // Определение колонок
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            title="Выбрать все"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            title="Выбрать строку"
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: info => info.getValue(),
        enableColumnFilter: false,
        size: 80,
      },
      {
        accessorKey: 'name',
        header: 'Название товара',
        cell: info => {
          const rowId = info.row.original.id;
          const columnId = info.column.id;
          const isEditing = editingCell?.rowId === rowId && editingCell?.columnId === columnId;
          
          if (isEditing) {
            return (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => {
                  setData(prev => prev.map(item => 
                    item.id === rowId ? { ...item, name: editValue } : item
                  ));
                  setEditingCell(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setData(prev => prev.map(item => 
                      item.id === rowId ? { ...item, name: editValue } : item
                    ));
                    setEditingCell(null);
                  }
                  if (e.key === 'Escape') {
                    setEditingCell(null);
                  }
                }}
                autoFocus
                className={styles.editInput}
              />
            );
          }
          
          return (
            <span
              onClick={() => {
                setEditingCell({ rowId, columnId });
                setEditValue(info.getValue() as string);
              }}
              className={styles.editableCell}
              title="Кликните для редактирования"
            >
              {info.getValue() as string}
            </span>
          );
        },
        size: 200,
        filterFn: textFilter,
      },
      {
        accessorKey: 'category',
        header: 'Категория',
        cell: info => info.getValue(),
        size: 150,
        filterFn: textFilter,
      },
      {
        accessorKey: 'price',
        header: 'Цена (₽)',
        cell: info => `${(info.getValue() as number).toLocaleString('ru-RU')} ₽`,
        size: 120,
        filterFn: numberRangeFilter,
      },
      {
        accessorKey: 'stock',
        header: 'На складе',
        cell: info => {
          const value = info.getValue() as number;
          const getStatus = (stock: number) => {
            if (stock === 0) return styles.outOfStock;
            if (stock < 10) return styles.lowStock;
            return '';
          };
          return <span className={`${styles.stockCell} ${getStatus(value)}`}>{value}</span>;
        },
        size: 120,
        filterFn: numberRangeFilter,
      },
      {
        accessorKey: 'rating',
        header: 'Рейтинг',
        cell: info => {
          const rating = info.getValue() as number;
          return (
            <div className={styles.rating}>
              {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
              <span className={styles.ratingNumber}>({rating})</span>
            </div>
          );
        },
        size: 150,
        filterFn: numberRangeFilter,
      },
      {
        accessorKey: 'sales',
        header: 'Продажи',
        cell: info => (info.getValue() as number).toLocaleString('ru-RU'),
        size: 120,
        filterFn: numberRangeFilter,
      },
      {
        accessorKey: 'date',
        header: 'Дата добавления',
        cell: info => info.getValue(),
        size: 150,
        filterFn: textFilter,
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        cell: info => {
          const status = info.getValue() as string;
          const getStatusClass = (status: string) => {
            switch (status) {
              case 'active': return styles.statusActive;
              case 'out_of_stock': return styles.statusOutOfStock;
              case 'discontinued': return styles.statusDiscontinued;
              default: return '';
            }
          };
          const getStatusText = (status: string) => {
            switch (status) {
              case 'active': return 'В продаже';
              case 'out_of_stock': return 'Нет в наличии';
              case 'discontinued': return 'Снят с продажи';
              default: return status;
            }
          };
          return (
            <span className={`${styles.status} ${getStatusClass(status)}`}>
              {getStatusText(status)}
            </span>
          );
        },
        size: 150,
        filterFn: textFilter,
      },
      {
        id: 'actions',
        header: 'Действия',
        cell: ({ row }) => (
          <button
            onClick={() => {
              if (window.confirm('Удалить товар?')) {
                setData(prev => prev.filter(item => item.id !== row.original.id));
              }
            }}
            className={styles.deleteButton}
            title="Удалить товар"
          >
            Удалить
          </button>
        ),
        enableSorting: false,
        enableColumnFilter: false,
        size: 120,
      },
    ],
    [editingCell, editValue]
  );

  // Создание таблицы
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    filterFns: {
      textFilter,
      numberRangeFilter,
    },
    // Простой глобальный фильтр
    globalFilterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      
      const searchValue = filterValue.toLowerCase();
      return Object.values(row.original).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchValue);
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchValue);
        }
        return false;
      });
    },
  });

  // Сброс редактирования при клике вне таблицы
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingCell && !(e.target as Element).closest(`.${styles.editInput}`)) {
        setEditingCell(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [editingCell]);

  // Применение фильтров для числовых колонок
  useEffect(() => {
    const applyNumberFilter = (columnId: string, min: string, max: string) => {
      const column = table.getColumn(columnId);
      if (!column) return;
      
      if (min === '' && max === '') {
        column.setFilterValue(undefined);
      } else {
        const minNum = min ? parseInt(min) : undefined;
        const maxNum = max ? parseInt(max) : undefined;
        column.setFilterValue([minNum, maxNum]);
      }
    };
    
    applyNumberFilter('price', priceFilter.min, priceFilter.max);
    applyNumberFilter('stock', stockFilter.min, stockFilter.max);
    applyNumberFilter('sales', salesFilter.min, salesFilter.max);
  }, [priceFilter, stockFilter, salesFilter, table]);

  // Выбранные строки
  const selectedRows = table.getSelectedRowModel().rows;
  const totalPrice = selectedRows.reduce((sum, row) => sum + row.original.price, 0);

  // Добавление нового товара
  const addNewProduct = () => {
    const newId = data.length > 0 ? Math.max(...data.map(p => p.id)) + 1 : 1;
    const categories = ['Электроника', 'Одежда', 'Книги', 'Продукты'];
    const newProduct: Product = {
      id: newId,
      name: 'Новый товар',
      category: categories[Math.floor(Math.random() * categories.length)],
      price: Math.floor(Math.random() * 5000) + 100,
      stock: Math.floor(Math.random() * 100),
      rating: Math.floor(Math.random() * 5) + 1,
      sales: 0,
      date: new Date().toLocaleDateString('ru-RU'),
      status: 'active',
    };
    setData(prev => [newProduct, ...prev]);
  };

  // Экспорт выбранных данных
  const exportSelected = () => {
    if (selectedRows.length === 0) {
      alert('Выберите хотя бы один товар для экспорта');
      return;
    }
    
    const exportData = selectedRows.map(row => row.original);
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Сброс всех фильтров и сортировки
  const resetTable = () => {
    setSorting([]);
    setColumnFilters([]);
    setGlobalFilter('');
    setRowSelection({});
    setEditingCell(null);
    setPriceFilter({ min: '', max: '' });
    setStockFilter({ min: '', max: '' });
    setSalesFilter({ min: '', max: '' });
  };

  // Фильтр по статусу
  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'active', label: 'В продаже' },
    { value: 'out_of_stock', label: 'Нет в наличии' },
    { value: 'discontinued', label: 'Снят с продажи' },
  ];

  // Категории для фильтра
  const categoryOptions = Array.from(new Set(data.map(item => item.category)));

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Таблица товаров</h1>
      <p className={styles.subtitle}>Сортировка, фильтрация, пагинация и редактирование in-place</p>

      {/* Панель управления */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск по всей таблице..."
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.buttons}>
          <button onClick={addNewProduct} className={styles.addButton}>
            + Добавить товар
          </button>
          <button 
            onClick={exportSelected} 
            className={styles.exportButton}
            disabled={selectedRows.length === 0}
          >
            📥 Экспорт выбранных ({selectedRows.length})
          </button>
          <button onClick={resetTable} className={styles.resetButton}>
            ⟳ Сбросить всё
          </button>
        </div>
      </div>

      {/* Информация о выбранных */}
      {selectedRows.length > 0 && (
        <div className={styles.selectionInfo}>
          <span>Выбрано товаров: <strong>{selectedRows.length}</strong></span>
          <span>Общая стоимость: <strong>{totalPrice.toLocaleString('ru-RU')} ₽</strong></span>
          <button 
            onClick={() => setRowSelection({})} 
            className={styles.clearSelection}
          >
            Снять выделение
          </button>
        </div>
      )}

      {/* Фильтры по колонкам */}
      <div className={styles.columnFilters}>
        {/* Фильтр по названию */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Название</label>
          <input
            type="text"
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={e => table.getColumn('name')?.setFilterValue(e.target.value)}
            placeholder="Поиск по названию..."
            className={styles.filterInput}
          />
        </div>

        {/* Фильтр по категории */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Категория</label>
          <select
            value={(table.getColumn('category')?.getFilterValue() as string) ?? ''}
            onChange={e => table.getColumn('category')?.setFilterValue(e.target.value || undefined)}
            className={styles.filterSelect}
          >
            <option value="">Все категории</option>
            {categoryOptions.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Фильтр по цене */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Цена (₽)</label>
          <div className={styles.rangeFilter}>
            <input
              type="number"
              placeholder="От"
              value={priceFilter.min}
              onChange={e => setPriceFilter({ ...priceFilter, min: e.target.value })}
              className={styles.rangeInput}
            />
            <span>-</span>
            <input
              type="number"
              placeholder="До"
              value={priceFilter.max}
              onChange={e => setPriceFilter({ ...priceFilter, max: e.target.value })}
              className={styles.rangeInput}
            />
          </div>
        </div>

        {/* Фильтр по статусу */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Статус</label>
          <select
            value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
            onChange={e => table.getColumn('status')?.setFilterValue(e.target.value || undefined)}
            className={styles.filterSelect}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Фильтр по дате */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Дата</label>
          <input
            type="text"
            value={(table.getColumn('date')?.getFilterValue() as string) ?? ''}
            onChange={e => table.getColumn('date')?.setFilterValue(e.target.value)}
            placeholder="ДД.ММ.ГГГГ"
            className={styles.filterInput}
          />
        </div>
      </div>

      {/* Таблица */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={styles.th}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`${styles.headerCell} ${
                          header.column.getCanSort() ? styles.sortable : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr 
                key={row.id} 
                className={`${styles.tr} ${row.getIsSelected() ? styles.selectedRow : ''}`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className={styles.td}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Сообщение если нет данных */}
        {table.getRowModel().rows.length === 0 && (
          <div className={styles.noData}>
            <p>Нет данных, соответствующих фильтрам</p>
            <button onClick={resetTable}>
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>

      {/* Пагинация */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          Страница {table.getState().pagination.pageIndex + 1} из{' '}
          {table.getPageCount()}
          {' | '}
          Показано {table.getRowModel().rows.length} из {data.length} записей
        </div>
        
        <div className={styles.paginationControls}>
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className={styles.pageButton}
          >
            ⏮️ Первая
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={styles.pageButton}
          >
            ◀️ Назад
          </button>
          
          <div className={styles.pageNumbers}>
            {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
              const pageIndex = Math.max(
                0,
                Math.min(
                  table.getPageCount() - 5,
                  table.getState().pagination.pageIndex - 2
                )
              ) + i;
              if (pageIndex >= table.getPageCount()) return null;
              
              return (
                <button
                  key={pageIndex}
                  onClick={() => table.setPageIndex(pageIndex)}
                  className={`${styles.pageNumber} ${
                    table.getState().pagination.pageIndex === pageIndex
                      ? styles.activePage
                      : ''
                  }`}
                >
                  {pageIndex + 1}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={styles.pageButton}
          >
            Вперед ▶️
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className={styles.pageButton}
          >
            Последняя ⏭️
          </button>
        </div>
        
        <div className={styles.pageSize}>
          <label>Записей на странице:</label>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value));
            }}
            className={styles.pageSizeSelect}
          >
            {[10, 20, 30, 50, 100].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Table;