import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
};

const scenariosSlice = createSlice({
  name: 'scenarios',
  initialState,
  reducers: {
    setScenariosList(state, action) {
      state.list = action.payload;
    },
    setSelectedScenario(state, action) {
      state.selected = action.payload;
    },
    setScenariosLoading(state, action) {
      state.loading = action.payload;
    },
    setScenariosError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setScenariosList, setSelectedScenario, setScenariosLoading, setScenariosError } = scenariosSlice.actions;
export default scenariosSlice.reducer;
