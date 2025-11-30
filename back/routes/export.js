const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Экспорт в Excel
router.post('/excel', authenticateToken, async (req, res) => {
  try {
    const { publications, recipients, subscriptions, summary } = req.body;

    const workbook = new ExcelJS.Workbook();
    
    // Основной лист с подписками
    const worksheet = workbook.addWorksheet('Подписки');
    
    // Заголовок отчета
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'Отчет по подпискам на издания';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = `Сформирован: ${new Date().toLocaleDateString('ru-RU')}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    // Итоговая статистика
    const statsRow = [
      `Всего изданий: ${summary.totalPublications}`,
      `Всего получателей: ${summary.totalRecipients}`,
      `Всего подписок: ${summary.totalSubscriptions}`,
      `Общий доход: ${summary.totalMonthlyRevenue} ₽`,
      `Средняя продолжительность: ${summary.avgSubscriptionDuration} мес.`
    ];
    
    worksheet.addRow(statsRow);
    worksheet.addRow([]); // Пустая строка

    // Заголовки таблицы подписок
    const headers = ['Получатель', 'Издание', 'Тип', 'Месяцев', 'Стоимость за месяц', 'Общая стоимость'];
    worksheet.addRow(headers);
    
    // Стили для заголовков
    const headerRow = worksheet.lastRow;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Данные подписок
    subscriptions.forEach(sub => {
      worksheet.addRow([
        sub.recipient_name,
        sub.publication_title,
        sub.publication_type,
        sub.duration_months,
        sub.monthly_cost,
        sub.total_cost
      ]);
    });

    // Лист с изданиями
    const pubWorksheet = workbook.addWorksheet('Издания');
    pubWorksheet.addRow(['Индекс', 'Название', 'Тип', 'Стоимость за месяц']);
    publications.forEach(pub => {
      pubWorksheet.addRow([pub.publication_index, pub.publication_title, pub.publication_type, pub.monthly_cost]);
    });

    // Настройка колонок
    worksheet.columns = [
      { width: 25 }, { width: 30 }, { width: 15 }, 
      { width: 12 }, { width: 18 }, { width: 18 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=subscriptions_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ success: false, message: 'Ошибка при экспорте в Excel' });
  }
});

// Экспорт в PDF
router.post('/pdf', authenticateToken, async (req, res) => {
  try {
    const { publications, recipients, subscriptions, summary } = req.body;

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=subscriptions_report.pdf');

    doc.pipe(res);

    // Заголовок
    doc.fontSize(20).font('Helvetica-Bold').text('Отчет по подпискам на издания', 50, 50);
    doc.fontSize(12).font('Helvetica').text(`Сформирован: ${new Date().toLocaleDateString('ru-RU')}`, 50, 80);
    
    // Статистика
    doc.fontSize(14).font('Helvetica-Bold').text('Статистика:', 50, 120);
    doc.fontSize(10).font('Helvetica')
      .text(`• Всего изданий: ${summary.totalPublications}`, 70, 145)
      .text(`• Всего получателей: ${summary.totalRecipients}`, 70, 160)
      .text(`• Всего подписок: ${summary.totalSubscriptions}`, 70, 175)
      .text(`• Общий доход: ${summary.totalMonthlyRevenue} ₽`, 70, 190)
      .text(`• Средняя продолжительность: ${summary.avgSubscriptionDuration} мес.`, 70, 205);

    let yPosition = 240;

    // Таблица подписок
    doc.fontSize(12).font('Helvetica-Bold').text('Подписки:', 50, yPosition);
    yPosition += 30;

    // Заголовки таблицы
    const headers = ['Получатель', 'Издание', 'Месяцев', 'Стоимость'];
    let xPosition = 50;
    
    doc.fontSize(8).font('Helvetica-Bold');
    headers.forEach(header => {
      doc.text(header, xPosition, yPosition, { width: 120, align: 'left' });
      xPosition += 130;
    });

    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(570, yPosition).stroke();

    // Данные подписок
    doc.fontSize(8).font('Helvetica');
    subscriptions.forEach((sub, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      xPosition = 50;
      const rowData = [
        sub.recipient_name,
        sub.publication_title,
        sub.duration_months.toString(),
        `${sub.total_cost} ₽`
      ];

      rowData.forEach(cell => {
        doc.text(cell, xPosition, yPosition, { width: 120, align: 'left' });
        xPosition += 130;
      });

      yPosition += 20;
      
      // Разделитель
      if (index < subscriptions.length - 1) {
        doc.moveTo(50, yPosition).lineTo(570, yPosition).stroke();
        yPosition += 10;
      }
    });

    doc.end();

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ success: false, message: 'Ошибка при экспорте в PDF' });
  }
});

module.exports = router;