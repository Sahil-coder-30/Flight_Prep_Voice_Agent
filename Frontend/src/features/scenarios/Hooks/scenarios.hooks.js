import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchScenariosAPI, fetchScenarioByIdAPI } from '../service/scenarios.api';
import { setScenariosList, setSelectedScenario, setScenariosLoading, setScenariosError } from '../slice/scenarios.slice';

export const useScenarios = () => {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.scenarios);
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadScenarios = useCallback(async () => {
    try {
      dispatch(setScenariosLoading(true));
      const res = await fetchScenariosAPI();
      const scenariosData = res?.data?.scenarios || res?.scenarios || res || [];
      dispatch(setScenariosList(scenariosData));
    } catch (err) {
      dispatch(setScenariosError(err.message || 'Failed to fetch scenarios'));
    } finally {
      dispatch(setScenariosLoading(false));
    }
  }, [dispatch]);

  const selectScenarioById = useCallback(async (id) => {
    try {
      dispatch(setScenariosLoading(true));
      const res = await fetchScenarioByIdAPI(id);
      const scenario = res?.data?.scenario || res?.scenario || res;
      dispatch(setSelectedScenario(scenario));
      return scenario;
    } catch (err) {
      dispatch(setScenariosError(err.message || 'Failed to load scenario details'));
      return null;
    } finally {
      dispatch(setScenariosLoading(false));
    }
  }, [dispatch]);

  const filteredScenarios = (state.list || []).filter((sc) => {
    const matchesDifficulty =
      filterDifficulty === 'ALL' ||
      (sc.difficulty || '').toUpperCase() === filterDifficulty.toUpperCase();

    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      (sc.name || '').toLowerCase().includes(q) ||
      (sc.title || '').toLowerCase().includes(q) ||
      (sc.airport || '').toLowerCase().includes(q) ||
      (sc.icao || '').toLowerCase().includes(q);

    return matchesDifficulty && matchesQuery;
  });

  return {
    ...state,
    filteredScenarios,
    filterDifficulty,
    setFilterDifficulty,
    searchQuery,
    setSearchQuery,
    loadScenarios,
    selectScenarioById,
  };
};
