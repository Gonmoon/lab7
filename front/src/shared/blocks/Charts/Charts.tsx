import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useGetPublicationsQuery } from '../../../store/slices/apiSlice';
import styles from './Charts.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Charts: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('month');
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Получаем данные о публикациях
  const { data: publications = [], isLoading, isError } = useGetPublicationsQuery({});
  
  // Обработка данных для графиков
  const { lineChartData, barChartData, pieChartData, stats } = useMemo(() => {
    if (!publications || publications.length === 0) {
      return { 
        lineChartData: null, 
        barChartData: null, 
        pieChartData: null,
        stats: {
          total: 0,
          active: 0,
          categories: 0
        }
      };
    }

    // Агрегация по месяцам
    const monthlyData: Record<string, { count: number; total: number }> = {};
    
    publications.forEach((pub: any) => {
      const date = new Date(pub.createdAt || pub.date || Date.now());
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, total: 0 };
      }
      
      monthlyData[monthKey].count += 1;
      monthlyData[monthKey].total += pub.price || pub.cost || 0;
    });

    const months = Object.keys(monthlyData).sort().map(month => {
      const [year, monthNum] = month.split('-');
      return `${monthNum}/${year}`;
    });
    
    const counts = months.map((_, index) => {
      const monthKey = Object.keys(monthlyData).sort()[index];
      return monthlyData[monthKey].count;
    });
    
    const totals = months.map((_, index) => {
      const monthKey = Object.keys(monthlyData).sort()[index];
      return monthlyData[monthKey].total;
    });

    // Данные для линейного графика
    const lineChartData = {
      labels: months,
      datasets: [
        {
          label: 'Количество публикаций',
          data: counts,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Общая стоимость',
          data: totals,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          fill: true,
          tension: 0.4,
        },
      ],
    };

    // Данные для столбчатой диаграммы (топ категорий)
    const categoryData: Record<string, number> = {};
    publications.forEach((pub: any) => {
      const category = pub.category || pub.type || 'Без категории';
      categoryData[category] = (categoryData[category] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const barChartData = {
      labels: sortedCategories.map(([category]) => category),
      datasets: [
        {
          label: 'Количество по категориям',
          data: sortedCategories.map(([, count]) => count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)',
          ],
          borderWidth: 1,
        },
      ],
    };

    // Данные для круговой диаграммы (статусы публикаций)
    const statusData: Record<string, number> = {};
    publications.forEach((pub: any) => {
      const status = pub.status || pub.state || 'Неизвестно';
      statusData[status] = (statusData[status] || 0) + 1;
    });

    const statusEntries = Object.entries(statusData);
    const pieChartData = {
      labels: statusEntries.map(([status]) => status),
      datasets: [
        {
          label: 'Распределение по статусам',
          data: statusEntries.map(([, count]) => count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)',
            'rgb(255, 159, 64)',
          ],
          borderWidth: 1,
        },
      ],
    };

    // Статистика
    const stats = {
      total: publications.length,
      active: publications.filter((p: any) => p.status === 'active' || p.isActive).length,
      categories: new Set(publications.map((p: any) => p.category || p.type || 'Без категории')).size
    };

    return { lineChartData, barChartData, pieChartData, stats };
  }, [publications]);

  // Общие настройки для графиков
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(30, 30, 30)',
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const lineChartOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Динамика публикаций по месяцам',
        font: {
          size: 18,
          weight: 'bold',
        },
        color: 'rgb(30, 30, 30)',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Месяц',
          color: 'rgb(100, 100, 100)',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Количество / Стоимость',
          color: 'rgb(100, 100, 100)',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        beginAtZero: true,
      },
    },
  };

  const barChartOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Топ-5 категорий публикаций',
        font: {
          size: 18,
          weight: 'bold',
        },
        color: 'rgb(30, 30, 30)',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Категория',
          color: 'rgb(100, 100, 100)',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Количество',
          color: 'rgb(100, 100, 100)',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Распределение по статусам',
        font: {
          size: 18,
          weight: 'bold',
        },
        color: 'rgb(30, 30, 30)',
      },
    },
  };

  // Рендер скелетона загрузки
  const renderSkeleton = () => (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Аналитика публикаций</h1>
        <p className={styles.subtitle}>Визуализация данных о публикациях, категориях и статусах</p>
      </div>
      
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Период анализа</label>
          <div className={styles.skeletonSelect}></div>
        </div>
      </div>
      
      <div className={styles.grid}>
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonHeader}></div>
          <div className={styles.skeletonChart}></div>
        </div>
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonHeader}></div>
          <div className={styles.skeletonChart}></div>
        </div>
      </div>
    </div>
  );

  // Рендер ошибки
  const renderError = () => (
    <div className={styles.container}>
      <div className={styles.errorCard}>
        <h3>Ошибка загрузки</h3>
        <p>Не удалось загрузить данные для графиков. Пожалуйста, попробуйте позже.</p>
      </div>
    </div>
  );

  // Рендер пустого состояния
  const renderEmpty = () => (
    <div className={styles.container}>
      <div className={styles.emptyCard}>
        <h3>Нет данных</h3>
        <p>Для отображения графиков необходимы данные о публикациях.</p>
      </div>
    </div>
  );

  if (isLoading) return renderSkeleton();
  if (isError) return renderError();
  if (!lineChartData || !barChartData || !pieChartData) return renderEmpty();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Аналитика публикаций</h1>
        <p className={styles.subtitle}>
          Визуализация данных о публикациях, категориях и статусах
        </p>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Период анализа</label>
          <select 
            className={styles.select}
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="quarter">Квартал</option>
            <option value="year">Год</option>
          </select>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabsList}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Обзор
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'categories' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Категории
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'status' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('status')}
          >
            Статусы
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.grid}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Динамика публикаций</h3>
                  <p className={styles.cardDescription}>
                    Количество и стоимость публикаций по месяцам
                  </p>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.chartContainer}>
                    <Line options={lineChartOptions} data={lineChartData} />
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Топ категорий</h3>
                  <p className={styles.cardDescription}>
                    Самые популярные категории публикаций
                  </p>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.chartContainer}>
                    <Bar options={barChartOptions} data={barChartData} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className={styles.fullWidthCard}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Анализ категорий</h3>
                  <p className={styles.cardDescription}>
                    Подробное распределение публикаций по категориям
                  </p>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.largeChartContainer}>
                    <Bar 
                      options={{
                        ...barChartOptions,
                        plugins: {
                          ...barChartOptions.plugins,
                          title: {
                            ...barChartOptions.plugins.title,
                            text: 'Распределение по всем категориям',
                          },
                        },
                      }} 
                      data={barChartData} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className={styles.fullWidthCard}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Статусы публикаций</h3>
                  <p className={styles.cardDescription}>
                    Распределение публикаций по статусам в процентном соотношении
                  </p>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.largeChartContainer}>
                    <Pie options={pieChartOptions} data={pieChartData} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardBlue}`}>
          <p className={styles.statLabel}>Всего публикаций</p>
          <p className={styles.statValue}>{stats.total}</p>
        </div>

        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
          <p className={styles.statLabel}>Активных</p>
          <p className={styles.statValue}>{stats.active}</p>
        </div>

        <div className={`${styles.statCard} ${styles.statCardPurple}`}>
          <p className={styles.statLabel}>Уникальных категорий</p>
          <p className={styles.statValue}>{stats.categories}</p>
        </div>
      </div>
    </div>
  );
};

export default Charts;