// index.ts
// Реэкспортируем default экземпляр
export { default as apiClient } from './api';

// Реэкспортируем класс
export { ApiClient } from './api';

// Реэкспортируем интерфейсы и типы
export type { Publication, Recipient, Subscription, PaginationParams } from './api';
