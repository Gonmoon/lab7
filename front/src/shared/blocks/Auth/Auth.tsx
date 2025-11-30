import React, { useState } from 'react';
import axios from 'axios';
import styles from './Auth.module.css';

interface AuthData {
  onClick?: () => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  rememberMe: boolean;
  code: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'change-password';

const API_BASE_URL = 'http://localhost:3000/api/auth';

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const Auth: React.FC<AuthData> = ({ onClick }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    rememberMe: false,
    code: '',
  });
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Очищаем ошибку при изменении поля
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      switch (mode) {
        case 'login':
          await handleLogin();
          break;
        case 'register':
          await handleRegister();
          break;
        case 'forgot-password':
          await handleForgotPassword();
          break;
        case 'reset-password':
          await handleResetPassword();
          break;
        case 'change-password':
          await handleChangePassword();
          break;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    const response = await api.post<ApiResponse>('/login', {
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe,
    });

    if (response.data.success) {
      // Сохраняем токен в localStorage или cookies
      localStorage.setItem('authToken', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      alert('Вход выполнен успешно!');
      // Здесь можно добавить редирект или обновление состояния приложения
      if (onClick) onClick();
    } else {
      throw new Error(response.data.message);
    }
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      throw new Error('Пароли не совпадают!');
    }

    const response = await api.post<ApiResponse>('/register', {
      email: formData.email,
      password: formData.password,
    });

    if (response.data.success) {
      alert('Регистрация выполнена успешно! Проверьте email для подтверждения.');
      setMode('login');
      resetForm();
    } else {
      throw new Error(response.data.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      throw new Error('Введите email для восстановления пароля');
    }

    const response = await api.post<ApiResponse>('/forgot-password', {
      email: formData.email,
    });

    if (response.data.success) {
      setIsCodeSent(true);
      setMode('reset-password');
      alert(`Код восстановления отправлен на ${formData.email}`);
    } else {
      throw new Error(response.data.message);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.code) {
      throw new Error('Введите код подтверждения');
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      throw new Error('Новые пароли не совпадают!');
    }

    const response = await api.post<ApiResponse>('/reset-password', {
      email: formData.email,
      code: formData.code,
      newPassword: formData.newPassword,
    });

    if (response.data.success) {
      alert('Пароль успешно изменен!');
      setMode('login');
      resetForm();
    } else {
      throw new Error(response.data.message);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmNewPassword) {
      throw new Error('Новые пароли не совпадают!');
    }

    // Получаем токен из localStorage
    const token = localStorage.getItem('authToken');
    
    const response = await api.post<ApiResponse>('/change-password', 
      {
        currentPassword: formData.password,
        newPassword: formData.newPassword,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      alert('Пароль успешно изменен!');
      setMode('login');
      resetForm();
    } else {
      throw new Error(response.data.message);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      rememberMe: false,
      code: '',
    });
    setIsCodeSent(false);
  };

  const switchToRegister = () => {
    setMode('register');
    setFormData(prev => ({ ...prev, confirmPassword: '' }));
    setError('');
  };

  const switchToLogin = () => {
    setMode('login');
    resetForm();
    setError('');
  };

  const switchToForgotPassword = () => {
    setMode('forgot-password');
    setFormData(prev => ({ ...prev, password: '' }));
    setError('');
  };

  const switchToChangePassword = () => {
    // Проверяем, авторизован ли пользователь
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Для смены пароля необходимо войти в систему');
      return;
    }
    
    setMode('change-password');
    setFormData(prev => ({ 
      ...prev, 
      newPassword: '', 
      confirmNewPassword: '' 
    }));
    setError('');
  };

  const handleBack = () => {
    if (mode === 'reset-password') {
      setMode('forgot-password');
    } else {
      setMode('login');
    }
    setError('');
  };

  const resendCode = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post<ApiResponse>('/resend-code', {
        email: formData.email,
      });

      if (response.data.success) {
        alert('Код отправлен повторно!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отправке кода');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для выхода (дополнительно)
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    alert('Вы вышли из системы');
    setMode('login');
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h2 className={styles.title}>
          {mode === 'login' && 'Вход в аккаунт'}
          {mode === 'register' && 'Регистрация'}
          {mode === 'forgot-password' && 'Восстановление пароля'}
          {mode === 'reset-password' && 'Сброс пароля'}
          {mode === 'change-password' && 'Смена пароля'}
        </h2>

        {/* Отображение ошибок */}
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Email поле - показывается везде кроме смены пароля для авторизованных */}
          {(mode !== 'change-password') && (
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Введите ваш email"
                required={mode !== 'change-password'}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Поля для текущего пароля */}
          {(mode === 'login' || mode === 'register' || mode === 'change-password') && (
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                {mode === 'change-password' ? 'Текущий пароль' : 'Пароль'}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={styles.input}
                placeholder={
                  mode === 'change-password' 
                    ? 'Введите текущий пароль' 
                    : 'Введите пароль'
                }
                required
                disabled={isLoading}
              />
            </div>
          )}

          {/* Подтверждение пароля при регистрации */}
          {mode === 'register' && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Подтвердите пароль
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Повторите пароль"
                required
                disabled={isLoading}
              />
            </div>
          )}

          {/* Код подтверждения для сброса пароля */}
          {mode === 'reset-password' && (
            <div className={styles.inputGroup}>
              <label htmlFor="code" className={styles.label}>
                Код подтверждения
              </label>
              <div className={styles.codeContainer}>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Введите код из письма"
                  required
                  disabled={isLoading}
                />
                <button 
                  type="button" 
                  onClick={resendCode}
                  className={styles.resendButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Отправка...' : 'Отправить снова'}
                </button>
              </div>
              <div className={styles.codeHint}>
                Код отправлен на {formData.email}
              </div>
            </div>
          )}

          {/* Поля для нового пароля */}
          {(mode === 'reset-password' || mode === 'change-password') && (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                  Новый пароль
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Введите новый пароль"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmNewPassword" className={styles.label}>
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Повторите новый пароль"
                  required
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {/* Запомнить меня - только для входа */}
          {mode === 'login' && (
            <div className={styles.rememberMe}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                  disabled={isLoading}
                />
                Запомнить меня
              </label>
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
                Загрузка...
              </div>
            ) : (
              <>
                {mode === 'login' && 'Войти'}
                {mode === 'register' && 'Зарегистрироваться'}
                {mode === 'forgot-password' && 'Отправить код'}
                {mode === 'reset-password' && 'Сменить пароль'}
                {mode === 'change-password' && 'Изменить пароль'}
              </>
            )}
          </button>
        </form>

        <div className={styles.authLinks}>
          {mode === 'login' && (
            <>
              <button 
                type="button" 
                onClick={switchToForgotPassword}
                className={styles.linkButton}
                disabled={isLoading}
              >
                Забыли пароль?
              </button>
              <button 
                type="button" 
                onClick={switchToChangePassword}
                className={styles.linkButton}
                disabled={isLoading}
              >
                Сменить пароль
              </button>
              <div className={styles.switchText}>
                Нет аккаунта?{' '}
                <button 
                  type="button" 
                  onClick={switchToRegister}
                  className={styles.linkButton}
                  disabled={isLoading}
                >
                  Зарегистрируйтесь
                </button>
              </div>
            </>
          )}

          {mode === 'register' && (
            <div className={styles.switchText}>
              Уже есть аккаунт?{' '}
              <button 
                type="button" 
                onClick={switchToLogin}
                className={styles.linkButton}
                disabled={isLoading}
              >
                Войдите
              </button>
            </div>
          )}

          {(mode === 'forgot-password' || mode === 'reset-password' || mode === 'change-password') && (
            <button 
              type="button" 
              onClick={handleBack}
              className={styles.linkButton}
              disabled={isLoading}
            >
              ← Назад к входу
            </button>
          )}
        </div>

        {/* Кнопка выхода если пользователь авторизован */}
        {localStorage.getItem('authToken') && mode === 'login' && (
          <div className={styles.logoutSection}>
            <button 
              type="button" 
              onClick={handleLogout}
              className={styles.logoutButton}
            >
              Выйти из системы
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;