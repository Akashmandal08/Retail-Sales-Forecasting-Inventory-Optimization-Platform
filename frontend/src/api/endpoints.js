import apiClient from './client';

export const api = {
  // Fetch system metadata (stores, categories, products, models)
  getMetadata: () => apiClient.get('/metadata'),

  // Fetch executive KPIs based on active filters
  getKPIs: (params = {}) => apiClient.get('/kpis', { params }),

  // Fetch revenue trend & category distribution
  getTrends: (params = {}) => apiClient.get('/analytics/trends', { params }),

  // Fetch seasonality analysis (day-of-week, promo impact)
  getSeasonality: (params = {}) => apiClient.get('/analytics/seasonality', { params }),

  // Fetch forecasting data (actual vs forecast with prediction intervals, leaderboard, feature importance)
  getForecasting: (params = {}) => apiClient.get('/forecasting', { params }),

  // Fetch inventory simulation (cost matrix, dynamic stock metrics per SKU)
  getInventory: (params = {}) => apiClient.get('/inventory', { params }),

  // Fetch single SKU & Store detailed drilldown
  getProductDetail: (params = {}) => apiClient.get('/product-detail', { params }),

  // Fetch automated recommendations & actionable insights
  getInsights: (params = {}) => apiClient.get('/insights', { params }),

  // Fetch data quality metrics, schema, and sample dataset
  getDataQuality: () => apiClient.get('/data-quality'),

  // Helper to get CSV download URL
  getInventoryCsvUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `/api/export/inventory-csv?${query}`;
  }
};

export default api;
