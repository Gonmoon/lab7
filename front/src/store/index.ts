import { configureStore } from '@reduxjs/toolkit';
import todosReducer from './slices/todosSlice';
import filtersReducer from './slices/filtersSlice';
import { apiSlice } from './slices/apiSlice';

export const store = configureStore({
    reducer: {
        todos: todosReducer,
        filters: filtersReducer,
        [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST'],
            },
        }).concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
