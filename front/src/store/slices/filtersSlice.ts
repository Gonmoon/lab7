import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SortOption = 'none' | 'text-asc' | 'text-desc' | 'completed';
export type FilterOption = 'all' | 'completed' | 'active' | 'selected';

interface FiltersState {
    sortBy: SortOption;
    filterBy: FilterOption;
    searchText: string;
}

const initialState: FiltersState = {
    sortBy: 'none',
    filterBy: 'all',
    searchText: '',
};

const filtersSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        setSortBy: (state, action: PayloadAction<SortOption>) => {
            state.sortBy = action.payload;
        },
        setFilterBy: (state, action: PayloadAction<FilterOption>) => {
            state.filterBy = action.payload;
        },
        setSearchText: (state, action: PayloadAction<string>) => {
            state.searchText = action.payload;
        },
        resetFilters: (state) => {
            state.sortBy = 'none';
            state.filterBy = 'all';
            state.searchText = '';
        },
    },
});

export const { setSortBy, setFilterBy, setSearchText, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
