import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  selectedScenario: null,
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
      state.selectedScenario = action.payload;
    },
    setScenariosLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const { setScenariosList, setSelectedScenario, setScenariosLoading } = scenariosSlice.actions;
export default scenariosSlice.reducer;
