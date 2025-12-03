import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Todo {
    id: number;
    text: string;
    completed: boolean;
    selected: boolean;
}

interface TodosState {
    items: Todo[];
    loading: boolean;
    error: string | null;
}

const initialState: TodosState = {
    items: [],
    loading: false,
    error: null,
};

const API_URL = 'http://localhost:3001/todos';

export const fetchTodos = createAsyncThunk('todos/fetchTodos', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data || 'Failed to fetch todos');
    }
});

export const addTodo = createAsyncThunk(
    'todos/addTodo',
    async (text: string, { rejectWithValue }) => {
        try {
            if (!text.trim()) {
                throw new Error('Todo text cannot be empty');
            }
            const todo: Omit<Todo, 'id'> = {
                text,
                completed: false,
                selected: false,
            };
            const response = await axios.post(API_URL, todo);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to add todo');
        }
    },
);

export const deleteTodo = createAsyncThunk(
    'todos/deleteTodo',
    async (id: number, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to delete todo');
        }
    },
);

export const updateTodo = createAsyncThunk(
    'todos/updateTodo',
    async ({ id, text }: { id: number; text: string }, { rejectWithValue }) => {
        try {
            if (!text.trim()) {
                throw new Error('Todo text cannot be empty');
            }
            const response = await axios.put(`${API_URL}/${id}`, { text });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to update todo');
        }
    },
);

export const deleteSelectedTodos = createAsyncThunk(
    'todos/deleteSelected',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { todos: TodosState };
            const selectedIds = state.todos.items
                .filter((todo) => todo.selected)
                .map((todo) => todo.id);

            await Promise.all(selectedIds.map((id) => axios.delete(`${API_URL}/${id}`)));
            return selectedIds;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to delete selected todos');
        }
    },
);

const todosSlice = createSlice({
    name: 'todos',
    initialState,
    reducers: {
        toggleSelect: (state, action: PayloadAction<number>) => {
            const todo = state.items.find((item) => item.id === action.payload);
            if (todo) {
                todo.selected = !todo.selected;
            }
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTodos.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTodos.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchTodos.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(addTodo.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addTodo.fulfilled, (state, action) => {
                state.loading = false;
                state.items.push(action.payload);
            })
            .addCase(addTodo.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteTodo.fulfilled, (state, action) => {
                state.items = state.items.filter((todo) => todo.id !== action.payload);
            })
            .addCase(deleteTodo.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            .addCase(updateTodo.fulfilled, (state, action) => {
                const index = state.items.findIndex((todo) => todo.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(updateTodo.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            .addCase(deleteSelectedTodos.fulfilled, (state, action) => {
                state.items = state.items.filter((todo) => !action.payload.includes(todo.id));
            })
            .addCase(deleteSelectedTodos.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { toggleSelect, clearError } = todosSlice.actions;
export default todosSlice.reducer;
