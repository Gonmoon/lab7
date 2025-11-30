import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Publication, Recipient, Subscription } from './api';

const BASE_URL = 'http://localhost:3000/api';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ['Publication', 'Recipient', 'Subscription'],
  endpoints: (builder) => ({
    // ===== Publications =====
    getPublications: builder.query<Publication[], Record<string, any>>({
      query: (params) => ({ url: '/publications', params }),
      transformResponse: (response: any) => response.publications ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ index }) => ({ type: 'Publication' as const, id: index })),
              { type: 'Publication', id: 'LIST' },
            ]
          : [{ type: 'Publication', id: 'LIST' }],
    }),
    getPublication: builder.query<Publication, string>({
      query: (index) => `/publications/${index}`,
      providesTags: (result, error, id) => [{ type: 'Publication', id }],
    }),
    createPublication: builder.mutation<Publication, Partial<Publication>>({
      query: (body) => ({ url: '/publications', method: 'POST', body }),
      invalidatesTags: [{ type: 'Publication', id: 'LIST' }],
    }),
    updatePublication: builder.mutation<Publication, { index: string; body: Partial<Publication> }>({
      query: ({ index, body }) => ({ url: `/publications/${index}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { index }) => [{ type: 'Publication', id: index }],
    }),
    deletePublication: builder.mutation<{ success: boolean }, string>({
      query: (index) => ({ url: `/publications/${index}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Publication', id: 'LIST' }],
    }),

    // ===== Recipients =====
    getRecipients: builder.query<Recipient[], Record<string, any>>({
      query: (params) => ({ url: '/recipients', params }),
      transformResponse: (response: any) => response.recipients ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Recipient' as const, id })),
              { type: 'Recipient', id: 'LIST' },
            ]
          : [{ type: 'Recipient', id: 'LIST' }],
    }),
    createRecipient: builder.mutation<Recipient, Partial<Recipient>>({
      query: (body) => ({ url: '/recipients', method: 'POST', body }),
      invalidatesTags: [{ type: 'Recipient', id: 'LIST' }],
    }),
    updateRecipient: builder.mutation<Recipient, { id: number; body: Partial<Recipient> }>({
      query: ({ id, body }) => ({ url: `/recipients/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Recipient', id },
        { type: 'Recipient', id: 'LIST' },
      ],
    }),
    deleteRecipient: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/recipients/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Recipient', id: 'LIST' }],
    }),

    // ===== Subscriptions =====
    getSubscriptions: builder.query<Subscription[], Record<string, any>>({
      query: (params) => ({ url: '/subscriptions', params }),
      transformResponse: (response: any) => response.subscriptions ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Subscription' as const, id })),
              { type: 'Subscription', id: 'LIST' },
            ]
          : [{ type: 'Subscription', id: 'LIST' }],
    }),
    createSubscription: builder.mutation<Subscription, Partial<Subscription>>({
      query: (body) => ({ url: '/subscriptions', method: 'POST', body }),
      invalidatesTags: [{ type: 'Subscription', id: 'LIST' }],
    }),
    updateSubscription: builder.mutation<Subscription, { id: number; body: Partial<Subscription> }>({
      query: ({ id, body }) => ({ url: `/subscriptions/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Subscription', id },
        { type: 'Subscription', id: 'LIST' },
      ],
    }),
    deleteSubscription: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/subscriptions/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Subscription', id: 'LIST' }],
    }),
  }),
});

export const {
  // Publications
  useGetPublicationsQuery,
  useGetPublicationQuery,
  useCreatePublicationMutation,
  useUpdatePublicationMutation,
  useDeletePublicationMutation,

  // Recipients
  useGetRecipientsQuery,
  useCreateRecipientMutation,
  useUpdateRecipientMutation,
  useDeleteRecipientMutation,

  // Subscriptions
  useGetSubscriptionsQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
} = apiSlice;
