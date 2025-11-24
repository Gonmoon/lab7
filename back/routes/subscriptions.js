const express = require('express');
const { Subscription, Recipient, Publication } = require('../models');
const router = express.Router();
const { Op } = require('sequelize');

// 1) Создание новой записи
router.post('/', async (req, res, next) => {
  try {
    const subscription = await Subscription.create(req.body);
    
    // Загружаем связанные данные для ответа
    const fullSubscription = await Subscription.findByPk(subscription.id, {
      include: ['recipient', 'publication']
    });
    
    res.status(201).json(fullSubscription);
  } catch (error) {
    next(error);
  }
});

// 2-5) Получение списка с пагинацией, сортировкой, фильтрацией и поиском
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'ASC',
      recipient_id,
      publication_index,
      duration,
      start_year,
      start_month,
      search
    } = req.query;

    const where = {};
    const order = [[sortBy, sortOrder.toUpperCase()]];

    // Фильтрация
    if (recipient_id) where.recipient_id = recipient_id;
    if (publication_index) where.publication_index = publication_index;
    if (duration) where.duration_months = duration;
    if (start_year) where.start_year = start_year;
    if (start_month) where.start_month = start_month;

    // Поиск по связанным таблицам
    let include = [{
      model: Recipient,
      as: 'recipient',
      attributes: ['id', 'full_name']
    }, {
      model: Publication,
      as: 'publication',
      attributes: ['index', 'title', 'type']
    }];

    const offset = (page - 1) * limit;

    const { count, rows: subscriptions } = await Subscription.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include
    });

    res.json({
      subscriptions,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCount: count
    });
  } catch (error) {
    next(error);
  }
});

// 6) Получение детальной информации по ID
router.get('/:id', async (req, res, next) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id, {
      include: ['recipient', 'publication']
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Подписка не найдена'
      });
    }

    res.json(subscription);
  } catch (error) {
    next(error);
  }
});

// 8) Обновление записи
router.put('/:id', async (req, res, next) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Подписка не найдена'
      });
    }

    await subscription.update(req.body);
    
    // Загружаем обновленные данные со связями
    const updatedSubscription = await Subscription.findByPk(subscription.id, {
      include: ['recipient', 'publication']
    });
    
    res.json(updatedSubscription);
  } catch (error) {
    next(error);
  }
});

// 9) Удаление записи
router.delete('/:id', async (req, res, next) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Подписка не найдена'
      });
    }

    await subscription.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// 10) Проверка существования записи
router.head('/:id', async (req, res, next) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    
    if (!subscription) {
      return res.status(404).send();
    }
    
    res.status(200).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;