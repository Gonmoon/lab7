const { User, PasswordResetCode } = require('../models');
const { generateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Вход пользователя
const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);

    // Валидация
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны',
      });
    }

    // Поиск пользователя
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль',
      });
    }

    // Проверка пароля
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль',
      });
    }

    // Проверка верификации (опционально)
    // if (!user.isVerified) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Требуется подтверждение email',
    //   });
    // }

    // Обновление времени последнего входа
    await user.update({ lastLogin: new Date() });

    // Генерация токена
    const token = generateToken(user.id);
    console.log('Token generated for user:', user.email);

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      data: {
        token,
        user: user.toSafeObject(),
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при входе',
    });
  }
};

// Регистрация пользователя
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    console.log('=== REGISTRATION ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password length:', password ? password.length : 'null');

    // Валидация
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны',
      });
    }

    // Проверка существующего пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(409).json({
        success: false,
        message: 'Пользователь с таким email уже существует',
      });
    }

    // Создание пользователя
    console.log('Creating new user...');
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
    });

    console.log('✅ User created successfully:', user.id);

    res.status(201).json({
      success: true,
      message: 'Регистрация выполнена успешно',
      data: {
        user: user.toSafeObject(),
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Некорректные данные',
        errors: error.errors.map(err => err.message),
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при регистрации',
    });
  }
};

// Запрос восстановления пароля
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('=== FORGOT PASSWORD REQUEST ===');
    console.log('Email:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email обязателен',
      });
    }

    // Поиск пользователя
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found for password reset:', email);
      // Для безопасности не сообщаем, что пользователь не найден
      return res.json({
        success: true,
        message: 'Если email зарегистрирован, код восстановления будет отправлен',
      });
    }

    console.log('User found, generating reset code...');

    // Инвалидация старых кодов
    await PasswordResetCode.update(
      { isUsed: true },
      { where: { email, isUsed: false } }
    );

    // Генерация нового кода
    const resetCode = await PasswordResetCode.generateCode(email);

    // Здесь можно добавить отправку email с кодом
    console.log(`Reset code for ${email}: ${resetCode.code}`);

    res.json({
      success: true,
      message: 'Код восстановления отправлен на ваш email',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при восстановлении пароля',
    });
  }
};

// Сброс пароля с кодом
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    console.log('=== PASSWORD RESET ATTEMPT ===');
    console.log('Email:', email);
    console.log('Code:', code);
    console.log('New password length:', newPassword ? newPassword.length : 'null');

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны',
      });
    }

    // Поиск действительного кода
    const resetCode = await PasswordResetCode.validateCode(email, code);
    if (!resetCode) {
      console.log('Invalid or expired reset code');
      return res.status(400).json({
        success: false,
        message: 'Недействительный или просроченный код',
      });
    }

    console.log('Valid reset code found');

    // Поиск пользователя
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found during password reset:', email);
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    // Обновление пароля
    console.log('Updating user password...');
    await user.update({ password: newPassword });

    // Помечаем код как использованный
    await resetCode.update({ isUsed: true });
    console.log('Password reset successful');

    res.json({
      success: true,
      message: 'Пароль успешно изменен',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при сбросе пароля',
    });
  }
};

// Смена пароля (для авторизованных пользователей)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    console.log('=== PASSWORD CHANGE ATTEMPT ===');
    console.log('User:', user.email);
    console.log('Current password length:', currentPassword ? currentPassword.length : 'null');
    console.log('New password length:', newPassword ? newPassword.length : 'null');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Текущий и новый пароль обязательны',
      });
    }

    // Проверка текущего пароля
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      console.log('Current password validation failed');
      return res.status(401).json({
        success: false,
        message: 'Текущий пароль неверен',
      });
    }

    console.log('Current password validated');

    // Обновление пароля
    await user.update({ password: newPassword });
    console.log('Password updated successfully');

    res.json({
      success: true,
      message: 'Пароль успешно изменен',
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при смене пароля',
    });
  }
};

// Повторная отправка кода
const resendCode = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('=== RESEND CODE REQUEST ===');
    console.log('Email:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email обязателен',
      });
    }

    // Инвалидация старых кодов
    await PasswordResetCode.update(
      { isUsed: true },
      { where: { email, isUsed: false } }
    );

    // Генерация нового кода
    const resetCode = await PasswordResetCode.generateCode(email);

    // Здесь можно добавить отправку email
    console.log(`New reset code for ${email}: ${resetCode.code}`);

    res.json({
      success: true,
      message: 'Код отправлен повторно',
    });

  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при отправке кода',
    });
  }
};

// Получение профиля пользователя
const getProfile = async (req, res) => {
  try {
    console.log('=== GET PROFILE ===');
    console.log('User:', req.user.email);
    
    res.json({
      success: true,
      data: {
        user: req.user.toSafeObject(),
      },
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении профиля',
    });
  }
};

// Диагностическая функция для проверки пароля
const debugPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('=== PASSWORD DEBUG ===');
    console.log('Email:', email);
    console.log('Password to check:', password);

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    res.json({
      success: true,
      data: {
        email: user.email,
        passwordMatch: isValid,
        storedHash: user.password,
        inputPassword: password
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, message: 'Debug error' });
  }
};

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
  changePassword,
  resendCode,
  getProfile,
  debugPassword
};