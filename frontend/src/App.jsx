import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FilterProvider } from './context/FilterContext';
import AppShell from './components/layout/AppShell';

// Pages
import DashboardPage from './pages/DashboardPage';
import ForecastPage from './pages/ForecastPage';
import InventoryPage from './pages/InventoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SeasonalityPage from './pages/SeasonalityPage';
import DataQualityPage from './pages/DataQualityPage';
import InsightsPage from './pages/InsightsPage';

export const App = () => {
  return (
    <FilterProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/product-detail" element={<ProductDetailPage />} />
            <Route path="/seasonality" element={<SeasonalityPage />} />
            <Route path="/data-quality" element={<DataQualityPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FilterProvider>
  );
};

export default App;
