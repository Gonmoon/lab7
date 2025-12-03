import React, { useState } from 'react';
import * as ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, HeadingLevel, AlignmentType, TextRun, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { useGetPublicationsQuery, useGetRecipientsQuery, useGetSubscriptionsQuery } from '../../../store/slices/apiSlice';
import styles from './Export.module.css';

interface ExportData {
  publications: any[];
  recipients: any[];
  subscriptions: any[];
  summary: {
    totalPublications: number;
    totalRecipients: number;
    totalSubscriptions: number;
    totalMonthlyRevenue: number;
    avgSubscriptionDuration: number;
    publicationsByType: { [key: string]: number };
    mostPopularPublication: string;
  };
}

const Export: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'word'>('excel');
  
  const { data: publications = [] } = useGetPublicationsQuery({});
  const { data: recipients = [] } = useGetRecipientsQuery({});
  const { data: subscriptions = [] } = useGetSubscriptionsQuery({});

  const prepareExportData = (): ExportData => {
    // Расчет итоговых сумм и статистики
    const totalMonthlyRevenue = subscriptions.reduce((sum, sub) => {
      const publication = publications.find(p => p.publication_index === sub.publication_index);
      return sum + (publication?.monthly_cost || 0) * sub.duration_months;
    }, 0);

    const avgSubscriptionDuration = subscriptions.length > 0 
      ? subscriptions.reduce((sum, sub) => sum + sub.duration_months, 0) / subscriptions.length 
      : 0;

    // Статистика по типам изданий
    const publicationsByType = publications.reduce((acc, pub) => {
      const type = pub.publication_type || 'не указан';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Самое популярное издание
    const publicationCounts = subscriptions.reduce((acc, sub) => {
      acc[sub.publication_index] = (acc[sub.publication_index] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const mostPopularPublicationId = Object.keys(publicationCounts).reduce((a, b) => 
      publicationCounts[a] > publicationCounts[b] ? a : b, ''
    );

    const mostPopularPublication = publications.find(p => p.publication_index === mostPopularPublicationId)?.publication_title || 'не определено';

    return {
      publications,
      recipients,
      subscriptions: subscriptions.map(sub => {
        const publication = publications.find(p => p.publication_index === sub.publication_index);
        const recipient = recipients.find(r => r.id === sub.recipient_id);
        return {
          ...sub,
          publication_title: publication?.publication_title,
          publication_type: publication?.publication_type,
          monthly_cost: publication?.monthly_cost,
          recipient_name: recipient?.full_name,
          total_cost: (publication?.monthly_cost || 0) * sub.duration_months,
          address: recipient ? `${recipient.street} ${recipient.house}${recipient.apartment ? `, кв. ${recipient.apartment}` : ''}` : 'не указан',
          start_date: `${sub.start_month || '01'}.${sub.start_year || '2024'}`
        };
      }),
      summary: {
        totalPublications: publications.length,
        totalRecipients: recipients.length,
        totalSubscriptions: subscriptions.length,
        totalMonthlyRevenue,
        avgSubscriptionDuration: Number(avgSubscriptionDuration.toFixed(1)),
        publicationsByType,
        mostPopularPublication
      }
    };
  };

  const exportToExcel = async () => {
    setLoading(true);
    try {
      const exportData = prepareExportData();
      
      const workbook = new ExcelJS.Workbook();
      
      // ===== Лист "Общий отчет" =====
      const mainSheet = workbook.addWorksheet('Общий отчет');
      
      // Заголовок отчета
      mainSheet.mergeCells('A1:H1');
      mainSheet.getCell('A1').value = 'ОТЧЕТ ПО ПОДПИСКАМ НА ИЗДАНИЯ';
      mainSheet.getCell('A1').font = { bold: true, size: 16 };
      mainSheet.getCell('A1').alignment = { horizontal: 'center' };

      mainSheet.mergeCells('A2:H2');
      mainSheet.getCell('A2').value = `Сформирован: ${new Date().toLocaleDateString('ru-RU')}`;
      mainSheet.getCell('A2').alignment = { horizontal: 'center' };
      mainSheet.getCell('A2').font = { italic: true };

      mainSheet.addRow([]);

      // Блок статистики
      mainSheet.addRow(['ОБЩАЯ СТАТИСТИКА:']);
      mainSheet.getCell('A4').font = { bold: true, size: 12 };
      
      const statsData = [
        ['Всего изданий:', exportData.summary.totalPublications],
        ['Всего получателей:', exportData.summary.totalRecipients],
        ['Всего подписок:', exportData.summary.totalSubscriptions],
        ['Общий доход:', `${exportData.summary.totalMonthlyRevenue} ₽`],
        ['Средняя продолжительность подписки:', `${exportData.summary.avgSubscriptionDuration} мес.`],
        ['Самое популярное издание:', exportData.summary.mostPopularPublication]
      ];

      statsData.forEach(([label, value]) => {
        const row = mainSheet.addRow([label, value]);
        row.getCell(1).font = { bold: true };
      });

      mainSheet.addRow([]);

      // Статистика по типам изданий
      mainSheet.addRow(['РАСПРЕДЕЛЕНИЕ ПО ТИПАМ ИЗДАНИЙ:']);
      mainSheet.getCell('A11').font = { bold: true, size: 12 };
      
      mainSheet.addRow(['Тип издания', 'Количество']);
      const typeHeaderRow = mainSheet.lastRow!;
      typeHeaderRow.eachCell((cell) => {
        cell.font = { bold: true };
      });

      Object.entries(exportData.summary.publicationsByType).forEach(([type, count]) => {
        mainSheet.addRow([type, count]);
      });

      mainSheet.addRow([]);
      mainSheet.addRow([]);

      // Таблица подписок
      mainSheet.addRow(['ДЕТАЛИЗИРОВАННЫЙ СПИСОК ПОДПИСОК:']);
      mainSheet.getCell('A16').font = { bold: true, size: 12 };

      const subscriptionHeaders = ['№', 'Получатель', 'Адрес', 'Издание', 'Тип', 'Период (мес.)', 'Стоимость за месяц', 'Общая стоимость'];
      mainSheet.addRow(subscriptionHeaders);

      // Стили для заголовков таблицы
      const headerRow = mainSheet.lastRow!;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2E86AB' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center' };
      });

      // Данные подписок
      exportData.subscriptions.forEach((sub, index) => {
        const row = mainSheet.addRow([
          index + 1,
          sub.recipient_name,
          sub.address,
          sub.publication_title,
          sub.publication_type,
          sub.duration_months,
          sub.monthly_cost,
          sub.total_cost
        ]);

        // Стили для строк данных
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        // Выделение общей стоимости
        row.getCell(8).font = { bold: true, color: { argb: 'FF228B22' } };
      });

      // Итоговая строка
      if (exportData.subscriptions.length > 0) {
        const totalRow = mainSheet.addRow([
          'ИТОГО:', '', '', '', '', '',
          exportData.subscriptions.reduce((sum, sub) => sum + (sub.monthly_cost || 0), 0),
          exportData.summary.totalMonthlyRevenue
        ]);
        
        totalRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFD700' }
          };
        });
      }

      // Настройка ширины колонок
      mainSheet.columns = [
        { width: 8 },  // №
        { width: 25 }, // Получатель
        { width: 30 }, // Адрес
        { width: 25 }, // Издание
        { width: 12 }, // Тип
        { width: 15 }, // Период
        { width: 18 }, // Стоимость/мес
        { width: 18 }  // Общая стоимость
      ];

      // ===== Лист "Издания" =====
      const publicationsSheet = workbook.addWorksheet('Издания');
      
      publicationsSheet.addRow(['СПРАВОЧНИК ИЗДАНИЙ']);
      publicationsSheet.getCell('A1').font = { bold: true, size: 14 };
      publicationsSheet.mergeCells('A1:D1');
      publicationsSheet.getCell('A1').alignment = { horizontal: 'center' };
      
      publicationsSheet.addRow(['Индекс', 'Название', 'Тип', 'Стоимость за месяц']);
      
      // Стили для заголовков изданий
      const pubHeaderRow = publicationsSheet.lastRow!;
      pubHeaderRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6FA' }
        };
      });

      exportData.publications.forEach(pub => {
        publicationsSheet.addRow([
          pub.publication_index,
          pub.publication_title,
          pub.publication_type,
          pub.monthly_cost
        ]);
      });

      // Настройка ширины колонок для изданий
      publicationsSheet.columns = [
        { width: 15 },
        { width: 35 },
        { width: 15 },
        { width: 18 }
      ];

      // Генерация файла
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Скачивание
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `отчет_подписки_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Ошибка экспорта в Excel:', error);
      alert('Ошибка при экспорте в Excel');
    } finally {
      setLoading(false);
    }
  };

  const exportToWord = async () => {
  setLoading(true);
  try {
    const exportData = prepareExportData();

    // Создание документа Word
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Заголовок документа
          new Paragraph({
            text: "ОТЧЕТ ПО ПОДПИСКАМ НА ИЗДАНИЯ",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),

          // Дата формирования
          new Paragraph({
            text: `Сформирован: ${new Date().toLocaleDateString('ru-RU')}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 }
          }),

          // Раздел статистики
          new Paragraph({
            text: "ОБЩАЯ СТАТИСТИКА",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 }
          }),

          // Статистика в виде таблицы
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Показатель", style: "Heading5" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Значение", style: "Heading5" })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Всего изданий" })] }),
                  new TableCell({ children: [new Paragraph({ text: exportData.summary.totalPublications.toString() })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Всего получателей" })] }),
                  new TableCell({ children: [new Paragraph({ text: exportData.summary.totalRecipients.toString() })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Всего подписок" })] }),
                  new TableCell({ children: [new Paragraph({ text: exportData.summary.totalSubscriptions.toString() })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Общий доход" })] }),
                  new TableCell({ children: [new Paragraph({ text: `${exportData.summary.totalMonthlyRevenue} ₽` })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Средняя продолжительность подписки" })] }),
                  new TableCell({ children: [new Paragraph({ text: `${exportData.summary.avgSubscriptionDuration} мес.` })] })
                ]
              })
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // Распределение по типам изданий
          new Paragraph({
            text: "РАСПРЕДЕЛЕНИЕ ПО ТИПАМ ИЗДАНИЙ",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 }
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Тип издания", style: "Heading5" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Количество", style: "Heading5" })] })
                ]
              }),
              ...Object.entries(exportData.summary.publicationsByType).map(([type, count]) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: type })] }),
                    new TableCell({ children: [new Paragraph({ text: count.toString() })] })
                  ]
                })
              )
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // Детализированный список подписок
          new Paragraph({
            text: "ДЕТАЛИЗИРОВАННЫЙ СПИСОК ПОДПИСОК",
            heading: HeadingLevel.HEADING_2,
            pageBreakBefore: true,
            spacing: { after: 200 }
          }),

          // Таблица подписок (ограничим 20 записями для читаемости)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [2000, 3000, 3000, 2000, 1500, 2000],
            rows: [
              // Заголовки таблицы
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "№", style: "Heading5" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Получатель", style: "Heading5" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Издание", style: "Heading5" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Тип", style: "Heading5" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Месяцев", style: "Heading5" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Стоимость", style: "Heading5" })] })
                ]
              }),
              // Данные подписок
              ...exportData.subscriptions.slice(0, 20).map((sub, index) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: (index + 1).toString() })] }),
                    new TableCell({ children: [new Paragraph({ text: sub.recipient_name || "Не указан" })] }),
                    new TableCell({ children: [new Paragraph({ text: sub.publication_title || "Не указано" })] }),
                    new TableCell({ children: [new Paragraph({ text: sub.publication_type || "Не указан" })] }),
                    new TableCell({ children: [new Paragraph({ text: sub.duration_months.toString() })] }),
                    new TableCell({ children: [new Paragraph({ 
                      children: [
                        new TextRun({ 
                          text: `${sub.total_cost} ₽`, 
                          bold: true 
                        })
                      ]
                    })] })
                  ]
                })
              )
            ]
          }),

          // Итоговая строка
          new Paragraph({
            text: `Всего подписок: ${exportData.subscriptions.length}`,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 100 }
          }),

          new Paragraph({
            text: `Общий доход: ${exportData.summary.totalMonthlyRevenue} ₽`,
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 }
          }),

          // Примечание если данных много
          ...(exportData.subscriptions.length > 20 ? [
            new Paragraph({
              text: `Примечание: в отчете показаны первые 20 записей из ${exportData.subscriptions.length}`,
              style: "Footnote",
              italics: true
            })
          ] : [])
        ]
      }]
    });

    // Генерация и скачивание документа - ИСПРАВЛЕННАЯ ЧАСТЬ
    const blob = await Packer.toBlob(doc);
    
    // Создаем ссылку для скачивания
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `отчет_подписки_${new Date().toISOString().split('T')[0]}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Ошибка экспорта в Word:', error);
    alert('Ошибка при экспорте в Word');
  } finally {
    setLoading(false);
  }
};

  const handleExport = () => {
    if (exportType === 'excel') {
      exportToExcel();
    } else {
      exportToWord();
    }
  };

  const exportData = prepareExportData();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📊 Экспорт данных</h2>
      
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{exportData.summary.totalPublications}</div>
          <div className={styles.statLabel}>Изданий</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{exportData.summary.totalRecipients}</div>
          <div className={styles.statLabel}>Получателей</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{exportData.summary.totalSubscriptions}</div>
          <div className={styles.statLabel}>Подписок</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{exportData.summary.totalMonthlyRevenue} ₽</div>
          <div className={styles.statLabel}>Общий доход</div>
        </div>
      </div>

      {/* Статистика по типам изданий */}
      <div className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>Статистика по типам изданий</h3>
        <div className={styles.typeStats}>
          {Object.entries(exportData.summary.publicationsByType).map(([type, count]) => (
            <div key={type} className={styles.typeStat}>
              <span className={styles.typeName}>{type}</span>
              <span className={styles.typeCount}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.exportSection}>
        <h3 className={styles.sectionTitle}>Экспорт отчета</h3>
        
        <div className={styles.exportOptions}>
          <div className={styles.optionGroup}>
            <label className={styles.optionLabel}>
              <input
                type="radio"
                value="excel"
                checked={exportType === 'excel'}
                onChange={(e) => setExportType(e.target.value as 'excel' | 'word')}
                className={styles.radioInput}
              />
              <span className={styles.radioCustom}></span>
              Excel (.xlsx) - с детализацией и формулами
            </label>
            <label className={styles.optionLabel}>
              <input
                type="radio"
                value="word"
                checked={exportType === 'word'}
                onChange={(e) => setExportType(e.target.value as 'excel' | 'word')}
                className={styles.radioInput}
              />
              <span className={styles.radioCustom}></span>
              Word (.docx) - для печати и презентаций
            </label>
          </div>

          <button
            onClick={handleExport}
            disabled={loading || exportData.subscriptions.length === 0}
            className={styles.exportButton}
          >
            {loading ? (
              <>
                <div className={styles.spinner}></div>
                Формирование {exportType === 'excel' ? 'Excel' : 'Word'}...
              </>
            ) : (
              `📥 Скачать ${exportType === 'excel' ? 'Excel' : 'Word'} отчет`
            )}
          </button>
        </div>

        <div className={styles.exportInfo}>
          <div className={styles.formatComparison}>
            <div className={styles.formatCard}>
              <h4>📊 Excel формат</h4>
              <ul>
                <li>Несколько листов с данными</li>
                <li>Формулы и вычисления</li>
                <li>Цветовое оформление</li>
                <li>Фильтрация и сортировка</li>
                <li>Идеально для анализа данных</li>
              </ul>
            </div>
            <div className={styles.formatCard}>
              <h4>📝 Word формат</h4>
              <ul>
                <li>Профессиональное оформление</li>
                <li>Структурированные таблицы</li>
                <li>Готово для печати</li>
                <li>Легко редактировать</li>
                <li>Идеально для отчетов и презентаций</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Предпросмотр данных */}
      <div className={styles.previewSection}>
        <h3 className={styles.sectionTitle}>Предпросмотр данных</h3>
        
        <div className={styles.previewTables}>
          <div className={styles.previewTable}>
            <h4>Подписки (первые 5 записей)</h4>
            <div className={styles.tableContainer}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th>Получатель</th>
                    <th>Издание</th>
                    <th>Тип</th>
                    <th>Месяцев</th>
                    <th>Стоимость</th>
                  </tr>
                </thead>
                <tbody>
                  {exportData.subscriptions.slice(0, 5).map((sub, index) => (
                    <tr key={index}>
                      <td>{sub.recipient_name}</td>
                      <td>{sub.publication_title}</td>
                      <td>{sub.publication_type}</td>
                      <td>{sub.duration_months}</td>
                      <td className={styles.costCell}>{sub.total_cost} ₽</td>
                    </tr>
                  ))}
                </tbody>
                {exportData.subscriptions.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={4} className={styles.totalLabel}>Общий итог:</td>
                      <td className={styles.totalCost}>{exportData.summary.totalMonthlyRevenue} ₽</td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {exportData.subscriptions.length > 5 && (
                <div className={styles.moreData}>
                  ... и еще {exportData.subscriptions.length - 5} записей
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Export;