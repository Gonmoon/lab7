const express = require('express');
const { Recipient, Subscription, Publication } = require('../models');
const router = express.Router();
const { Op } = require('sequelize');

// 1) Создание новой записи
router.post('/', async (req, res, next) => {
  try {
    const recipient = await Recipient.create(req.body);
    res.status(201).json(recipient);
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
      street,
      search
    } = req.query;

    const where = {};
    const order = [[sortBy, sortOrder.toUpperCase()]];

    // Фильтрация
    if (street) {
      where.street = { [Op.iLike]: `%${street}%` };
    }

    // Поиск
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { street: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: recipients } = await Recipient.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: Subscription,
        as: 'subscriptions',
        include: ['publication']
      }]
    });

    res.json({
      recipients,
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
    const recipient = await Recipient.findByPk(req.params.id, {
      include: [{
        model: Subscription,
        as: 'subscriptions',
        include: ['publication']
      }]
    });

    if (!recipient) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Получатель не найден'
      });
    }

    res.json(recipient);
  } catch (error) {
    next(error);
  }
});

// 8) Обновление записи
router.put('/:id', async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    
    if (!recipient) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Получатель не найден'
      });
    }

    await recipient.update(req.body);
    res.json(recipient);
  } catch (error) {
    next(error);
  }
});

// 9) Удаление записи
router.delete('/:id', async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    
    if (!recipient) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Получатель не найден'
      });
    }

    // Проверка на наличие подписок
    const subscriptionsCount = await Subscription.count({
      where: { recipient_id: req.params.id }
    });

    if (subscriptionsCount > 0) {
      return res.status(400).json({
        error: 'Constraint Error',
        message: 'Нельзя удалить получателя с активными подписками'
      });
    }

    await recipient.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// 10) Проверка существования записи
router.head('/:id', async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    
    if (!recipient) {
      return res.status(404).send();
    }
    
    res.status(200).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;