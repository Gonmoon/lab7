const express = require('express');
const { Publication, Subscription } = require('../models');
const router = express.Router();
const { Op } = require('sequelize');

// 1) Создание новой записи
router.post('/', async (req, res, next) => {
  try {
    const publication = await Publication.create(req.body);
    res.status(201).json(publication);
  } catch (error) {
    next(error);
  }
});

// 2) Получение списка записей с пагинацией
// 3) С поддержкой сортировки
// 4) С поддержкой фильтрации
// 5) С поддержкой поиска
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'index',
      sortOrder = 'ASC',
      type,
      minCost,
      maxCost,
      search
    } = req.query;

    const where = {};
    const order = [[sortBy, sortOrder.toUpperCase()]];

    // Фильтрация
    if (type) {
      where.type = type;
    }
    if (minCost || maxCost) {
      where.monthly_cost = {};
      if (minCost) where.monthly_cost[Op.gte] = parseFloat(minCost);
      if (maxCost) where.monthly_cost[Op.lte] = parseFloat(maxCost);
    }

    // Поиск
    if (search) {
      where[Op.or] = [
        { index: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: publications } = await Publication.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: Subscription,
        as: 'subscriptions',
        attributes: ['id']
      }]
    });

    res.json({
      publications,
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
    const publication = await Publication.findByPk(req.params.id, {
      include: [{
        model: Subscription,
        as: 'subscriptions',
        include: ['recipient']
      }]
    });

    if (!publication) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Издание не найдено'
      });
    }

    res.json(publication);
  } catch (error) {
    next(error);
  }
});

// 8) Обновление записи
router.put('/:id', async (req, res, next) => {
  try {
    const publication = await Publication.findByPk(req.params.id);
    
    if (!publication) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Издание не найдено'
      });
    }

    await publication.update(req.body);
    res.json(publication);
  } catch (error) {
    next(error);
  }
});

// 9) Удаление записи
router.delete('/:id', async (req, res, next) => {
  try {
    const publication = await Publication.findByPk(req.params.id);
    
    if (!publication) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Издание не найдено'
      });
    }

    // Проверка на наличие подписок
    const subscriptionsCount = await Subscription.count({
      where: { publication_index: req.params.id }
    });

    if (subscriptionsCount > 0) {
      return res.status(400).json({
        error: 'Constraint Error',
        message: 'Нельзя удалить издание, на которое есть активные подписки'
      });
    }

    await publication.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// 10) Проверка существования записи
router.head('/:id', async (req, res, next) => {
  try {
    const publication = await Publication.findByPk(req.params.id);
    
    if (!publication) {
      return res.status(404).send();
    }
    
    res.status(200).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;