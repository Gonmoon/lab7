const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, requireVerified } = require('../middleware/auth');

// Пример защищенного маршрута - доступен всем авторизованным пользователям
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Доступ к защищенному маршруту разрешен',
    data: {
      user: req.user,
      accessedAt: new Date().toISOString()
    }
  });
});

// Пример маршрута только для верифицированных пользователей
router.get('/verified-data', authenticateToken, requireVerified, (req, res) => {
  res.json({
    success: true,
    message: 'Доступ к данным для верифицированных пользователей',
    data: {
      secretData: 'Это конфиденциальные данные для верифицированных пользователей',
      user: req.user.email,
      accessedAt: new Date().toISOString()
    }
  });
});

// Пример маршрута только для администраторов
router.get('/admin-stats', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Административная статистика',
    data: {
      totalUsers: 150,
      activeSessions: 45,
      serverStatus: 'optimal',
      admin: req.user.email,
      accessedAt: new Date().toISOString()
    }
  });
});

// Пример POST маршрута с валидацией
router.post('/update-profile', authenticateToken, (req, res) => {
  const { firstName, lastName } = req.body;
  
  // Здесь будет логика обновления профиля
  res.json({
    success: true,
    message: 'Профиль обновлен',
    data: {
      updatedFields: { firstName, lastName },
      user: req.user.email,
      updatedAt: new Date().toISOString()
    }
  });
});

// Пример маршрута для управления пользователями (только админы)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { User } = require('../models');
    const users = await User.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isVerified', 'lastLogin'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users,
        total: users.length,
        requestedBy: req.user.email
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении списка пользователей'
    });
  }
});

module.exports = router;