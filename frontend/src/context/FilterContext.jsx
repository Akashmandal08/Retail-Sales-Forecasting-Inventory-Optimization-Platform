import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/endpoints';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  // Global filter state
  const [store, setStore] = useState('All Stores');
  const [category, setCategory] = useState('All Categories');
  const [model, setModel] = useState('XGBoost');
  const [leadTime, setLeadTime] = useState(3);
  const [serviceLevel, setServiceLevel] = useState(95);
  
  // Theme state
  const [isDark, setIsDark] = useState(true);

  // Metadata state
  const [metadata, setMetadata] = useState({
    stores: [{ id: 'All Stores', name: 'All Stores' }],
    categories: ['All Categories'],
    products: [],
    models: ['Naive', 'Seasonal Naive', 'Ridge', 'RandomForest', 'XGBoost', 'Ensemble'],
    best_model: 'XGBoost',
    default_lead_time: 3,
    default_service_level: 95
  });
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [error, setError] = useState(null);

  // Toggle Theme
  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    // Initial theme setup
    document.documentElement.classList.add('dark');

    // Fetch metadata
    const fetchMeta = async () => {
      try {
        setLoadingMetadata(true);
        const data = await api.getMetadata();
        setMetadata(data);
        if (data.best_model) {
          setModel(data.best_model);
        }
        if (data.default_lead_time) {
          setLeadTime(data.default_lead_time);
        }
        if (data.default_service_level) {
          setServiceLevel(data.default_service_level);
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
        setError('Could not connect to backend server. Make sure the API is running on port 5000.');
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMeta();
  }, []);

  const filterParams = {
    store,
    category,
    model,
    lead_time: leadTime,
    service_level: serviceLevel
  };

  return (
    <FilterContext.Provider value={{
      store,
      setStore,
      category,
      setCategory,
      model,
      setModel,
      leadTime,
      setLeadTime,
      serviceLevel,
      setServiceLevel,
      isDark,
      toggleTheme,
      metadata,
      loadingMetadata,
      error,
      filterParams
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => useContext(FilterContext);
