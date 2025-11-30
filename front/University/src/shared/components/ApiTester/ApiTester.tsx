import React, { useState, useEffect } from 'react';
import axios, { AxiosResponse, AxiosError } from 'axios';
import styles from './ApiTester.module.css';

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface TestEndpoint {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  requiresAuth: boolean;
  requiresAdmin?: boolean;
  requiresVerified?: boolean;
}

interface RequestState {
  response: ApiResponse | null;
  status: number | null;
  loading: boolean;
  error: string | null;
}

const ApiTester: React.FC = () => {
  const [token, setToken] = useState<string>(localStorage.getItem('authToken') || '');
  const [email, setEmail] = useState<string>('admin@example.com');
  const [password, setPassword] = useState<string>('Password123!');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/protected/profile');
  const [requestState, setRequestState] = useState<RequestState>({
    response: null,
    status: null,
    loading: false,
    error: null
  });

  const API_BASE_URL = 'http://localhost:3000';

  // Предопределенные endpoints для тестирования
  const testEndpoints: TestEndpoint[] = [
    {
      name: 'Профиль пользователя',
      endpoint: '/api/protected/profile',
      method: 'GET',
      description: 'Доступен всем авторизованным пользователям',
      requiresAuth: true
    },
    {
      name: 'Верифицированные данные',
      endpoint: '/api/protected/verified-data',
      method: 'GET',
      description: 'Только для верифицированных пользователей',
      requiresAuth: true,
      requiresVerified: true
    },
    {
      name: 'Админ статистика',
      endpoint: '/api/protected/admin-stats',
      method: 'GET',
      description: 'Только для администраторов',
      requiresAuth: true,
      requiresAdmin: true
    },
    {
      name: 'Список пользователей',
      endpoint: '/api/protected/users',
      method: 'GET',
      description: 'Только для администраторов - список всех пользователей',
      requiresAuth: true,
      requiresAdmin: true
    },
    {
      name: 'Health Check',
      endpoint: '/health',
      method: 'GET',
      description: 'Публичный endpoint для проверки работы сервера',
      requiresAuth: false
    }
  ];

  // Создаем экземпляр axios
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  // Интерцептор для добавления токена
  api.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Выполнение запроса
  const executeRequest = async (endpoint: string, method: string = 'GET') => {
    setRequestState({ response: null, status: null, loading: true, error: null });

    try {
      let response: AxiosResponse<ApiResponse>;

      switch (method) {
        case 'GET':
          response = await api.get<ApiResponse>(endpoint);
          break;
        case 'POST':
          response = await api.post<ApiResponse>(endpoint);
          break;
        default:
          throw new Error(`Метод ${method} не поддерживается`);
      }

      setRequestState({
        response: response.data,
        status: response.status,
        loading: false,
        error: null
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      setRequestState({
        response: axiosError.response?.data || null,
        status: axiosError.response?.status || null,
        loading: false,
        error: axiosError.message
      });
    }
  };

  // Вход в систему
  const handleLogin = async () => {
    setRequestState({ response: null, status: null, loading: true, error: null });

    try {
      const response = await api.post<ApiResponse>('/api/auth/login', {
        email,
        password,
        rememberMe: false
      });

      if (response.data.success) {
        const newToken = response.data.data.token;
        setToken(newToken);
        localStorage.setItem('authToken', newToken);
        setRequestState({
          response: response.data,
          status: response.status,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      setRequestState({
        response: axiosError.response?.data || null,
        status: axiosError.response?.status || null,
        loading: false,
        error: axiosError.message
      });
    }
  };

  // Выход из системы
  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('authToken');
    setRequestState({ response: null, status: null, loading: false, error: null });
  };

  // Регистрация нового пользователя
  const handleRegister = async () => {
    setRequestState({ response: null, status: null, loading: true, error: null });

    try {
      const response = await api.post<ApiResponse>('/api/auth/register', {
        email: `test${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'Тестовый',
        lastName: 'Пользователь'
      });

      setRequestState({
        response: response.data,
        status: response.status,
        loading: false,
        error: null
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      setRequestState({
        response: axiosError.response?.data || null,
        status: axiosError.response?.status || null,
        loading: false,
        error: axiosError.message
      });
    }
  };

  // Быстрый тест всех endpoints
  const runAllTests = async () => {
    const results = [];

    for (const endpoint of testEndpoints) {
      if (endpoint.requiresAuth && !token) continue;

      setRequestState({ response: null, status: null, loading: true, error: null });
      
      try {
        let response: AxiosResponse<ApiResponse>;
        
        switch (endpoint.method) {
          case 'GET':
            response = await api.get<ApiResponse>(endpoint.endpoint);
            break;
          case 'POST':
            response = await api.post<ApiResponse>(endpoint.endpoint);
            break;
          default:
            continue;
        }

        results.push({
          endpoint: endpoint.name,
          success: true,
          status: response.status,
          data: response.data
        });
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        results.push({
          endpoint: endpoint.name,
          success: false,
          status: axiosError.response?.status,
          error: axiosError.message
        });
      }
    }

    setRequestState({
      response: { success: true, message: 'Тесты завершены', data: results },
      status: 200,
      loading: false,
      error: null
    });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🔧 Тестер API запросов</h2>

      {/* Секция аутентификации */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Аутентификация</h3>
        <div className={styles.authForm}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="Введите email"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Пароль:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Введите пароль"
            />
          </div>
          <div className={styles.buttonGroup}>
            <button 
              onClick={handleLogin} 
              disabled={requestState.loading}
              className={styles.button}
            >
              Войти
            </button>
            <button 
              onClick={handleRegister} 
              disabled={requestState.loading}
              className={styles.buttonSecondary}
            >
              Зарегистрировать тестового пользователя
            </button>
            {token && (
              <button 
                onClick={handleLogout} 
                className={styles.buttonDanger}
              >
                Выйти
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Статус аутентификации */}
      {token && (
        <div className={styles.tokenSection}>
          <div className={styles.tokenStatus}>
            <span className={styles.statusIndicator}>🟢</span>
            <span>Авторизован</span>
          </div>
          <div className={styles.tokenPreview}>
            Токен: {token.substring(0, 20)}...
          </div>
        </div>
      )}

      {/* Секция тестирования endpoints */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Тестирование Endpoints</h3>
        
        <div className={styles.endpointsGrid}>
          {testEndpoints.map((endpoint) => (
            <div key={endpoint.endpoint} className={styles.endpointCard}>
              <div className={styles.endpointHeader}>
                <span className={styles.endpointName}>{endpoint.name}</span>
                <span className={styles.endpointMethod}>{endpoint.method}</span>
              </div>
              <div className={styles.endpointDescription}>{endpoint.description}</div>
              <div className={styles.endpointRequirements}>
                {endpoint.requiresAuth && <span className={styles.requirement}>🔐 Auth</span>}
                {endpoint.requiresAdmin && <span className={styles.requirementAdmin}>👑 Admin</span>}
                {endpoint.requiresVerified && <span className={styles.requirementVerified}>✓ Verified</span>}
              </div>
              <button
                onClick={() => executeRequest(endpoint.endpoint, endpoint.method)}
                disabled={requestState.loading || (endpoint.requiresAuth && !token)}
                className={styles.testButton}
              >
                Тестировать
              </button>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button
            onClick={runAllTests}
            disabled={requestState.loading}
            className={styles.runAllButton}
          >
            Запустить все тесты
          </button>
        </div>
      </div>

      {/* Результаты запроса */}
      {requestState.loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Выполняется запрос...</span>
        </div>
      )}

      {requestState.response && (
        <div className={styles.responseSection}>
          <h3 className={styles.sectionTitle}>Результат запроса</h3>
          <div className={styles.response}>
            <div className={styles.responseStatus}>
              Статус: <span className={requestState.status === 200 ? styles.statusSuccess : styles.statusError}>
                {requestState.status}
              </span>
            </div>
            <pre className={styles.responseData}>
              {JSON.stringify(requestState.response, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {requestState.error && (
        <div className={styles.errorSection}>
          <h3 className={styles.sectionTitle}>Ошибка</h3>
          <div className={styles.error}>
            {requestState.error}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTester;