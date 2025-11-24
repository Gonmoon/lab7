import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Интерфейсы
export interface Publication {
  index: string;
  type: string;
  title: string;
  monthly_cost: number;
  subscriptions?: Subscription[];
}

export interface Recipient {
  id?: number;
  full_name: string;
  street: string;
  house: string;
  apartment: string;
  subscriptions?: Subscription[];
}

export interface Subscription {
  id?: number;
  recipient_id: number;
  publication_index: string;
  duration_months: number;
  start_month: number;
  start_year: number;
  recipient?: Recipient;
  publication?: Publication;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  type?: string;
  minCost?: number;
  maxCost?: number;
  search?: string;
  recipient_id?: number;
  duration?: number;
  street?: string;
  start_month?: number;
  start_year?: number;
  publication_index?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

const API_BASE_URL = 'http://localhost:3000/api';

export class ApiClient {
  private axios: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.axios = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ===== Health =====
  async healthCheck(): Promise<AxiosResponse> {
    return this.axios.get('http://localhost:3000/health');
  }

  // ===== Publications =====
  async getPublications(params?: PaginationParams): Promise<AxiosResponse<PaginatedResponse<Publication>>> {
    const res = await this.axios.get('/publications', { params });
    return {
      ...res,
      data: res.data.publications,
    };
  }

  async getPublication(index: string): Promise<AxiosResponse<Publication>> {
    return this.axios.get(`/publications/${index}`);
  }

  async createPublication(data: Publication): Promise<AxiosResponse<Publication>> {
    return this.axios.post('/publications', data);
  }

  async updatePublication(index: string, data: Partial<Publication>): Promise<AxiosResponse<Publication>> {
    return this.axios.put(`/publications/${index}`, data);
  }

  async deletePublication(index: string): Promise<AxiosResponse> {
    return this.axios.delete(`/publications/${index}`);
  }

  // ===== Recipients =====
  async getRecipients(params?: PaginationParams): Promise<AxiosResponse<PaginatedResponse<Recipient>>> {
    const res = await this.axios.get('/recipients', { params });
    return {
      ...res,
      data: res.data.recipients ?? res.data,
    };
  }

  async getRecipient(id: number): Promise<AxiosResponse<Recipient>> {
    return this.axios.get(`/recipients/${id}`);
  }

  async createRecipient(data: Recipient): Promise<AxiosResponse<Recipient>> {
    return this.axios.post('/recipients', data);
  }

  async updateRecipient(id: number, data: Partial<Recipient>): Promise<AxiosResponse<Recipient>> {
    return this.axios.put(`/recipients/${id}`, data);
  }

  async deleteRecipient(id: number): Promise<AxiosResponse> {
    return this.axios.delete(`/recipients/${id}`);
  }

  // ===== Subscriptions =====
  async getSubscriptions(params?: PaginationParams): Promise<AxiosResponse<PaginatedResponse<Subscription>>> {
    const res = await this.axios.get('/subscriptions', { params });
    return {
      ...res,
      data: res.data.subscriptions ?? res.data,
    };
  }

  async getSubscription(id: number): Promise<AxiosResponse<Subscription>> {
    return this.axios.get(`/subscriptions/${id}`);
  }

  async createSubscription(data: Subscription): Promise<AxiosResponse<Subscription>> {
    return this.axios.post('/subscriptions', data);
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<AxiosResponse<Subscription>> {
    return this.axios.put(`/subscriptions/${id}`, data);
  }

  async deleteSubscription(id: number): Promise<AxiosResponse> {
    return this.axios.delete(`/subscriptions/${id}`);
  }
}

// Готовый экземпляр для использования
const apiClient = new ApiClient();
export default apiClient;
