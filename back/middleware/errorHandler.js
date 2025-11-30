const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // JWT ошибки
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Недействительный токен'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Токен истек'
    });
  }

  // Sequelize ошибки
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации',
      errors: err.errors.map(e => e.message)
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Конфликт уникальности',
      errors: err.errors.map(e => e.message)
    });
  }

  // Общая ошибка сервера
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера'
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};