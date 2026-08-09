import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/slice/auth.slice';
import dashboardReducer from './features/dashboard/slice/dashboard.slice';
import simulatorReducer from './features/simulator/slice/simulator.slice';
import scenariosReducer from './features/scenarios/slice/scenarios.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    simulator: simulatorReducer,
    scenarios: scenariosReducer,
  },
});
