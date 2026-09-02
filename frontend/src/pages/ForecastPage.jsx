import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import api from '../api/endpoints';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import { ChartSkeleton } from '../components/ui/Skeleton';
import ForecastChart from '../components/charts/ForecastChart';
import FeatureImportanceChart from '../components/charts/FeatureImportanceChart';
import {
  TrendingUp,
  Cpu,
  Sparkles,
  BarChart3,
  Award,
  Layers,
  Info
} from 'lucide-react';

export const ForecastPage = () => {
  const { filterParams, model, setModel, metadata } = useFilters();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const res = await api.getForecasting({
          ...filterParams,
          product: selectedProduct || undefined,
        });
        if (isMounted) {
          setForecastData(res);
          if (!selectedProduct && res.selected_product) {
            setSelectedProduct(res.selected_product);
          }
        }
      } catch (err) {
        console.error('Failed to load forecast data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchForecast();
    return () => { isMounted = false; };
  }, [filterParams, selectedProduct]);

  // Columns for Model Leaderboard Table
  const leaderboardColumns = [
    {
      header: 'Model Architecture',
      key: 'model_name',
      render: (val, row) => (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-white light:text-slate-900">{val}</span>
          {row.is_best && (
            <Badge variant="emerald" size="sm">
              <Award className="w-3 h-3 mr-1" /> Top Performer
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'R² Score',
      key: 'r2_score',
      render: (val) => (
        <span className={`font-mono font-bold ${val >= 0.90 ? 'text-emerald-400' : 'text-slate-300'}`}>
          {val}
        </span>
      ),
    },
    {
      header: 'Variance Explained',
      key: 'variance_explained_pct',
      render: (val) => (
        <span className="font-mono text-slate-300">
          {val}%
        </span>
      ),
    },
    {
      header: 'MAE',
      key: 'mae',
      render: (val) => <span className="font-mono text-slate-300">{val}</span>,
    },
    {
      header: 'RMSE',
      key: 'rmse',
      render: (val) => <span className="font-mono text-slate-300">{val}</span>,
    },
    {
      header: 'MAPE (%)',
      key: 'mape_pct',
      render: (val) => <span className="font-mono text-slate-300">{val}%</span>,
    },
    {
      header: 'WAPE',
      key: 'wape',
      render: (val) => <span className="font-mono text-slate-300">{val}</span>,
    },
    {
      header: 'Action',
      key: 'model_name',
      sortable: false,
      render: (val) => (
        <button
          onClick={() => setModel(val)}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
            model === val
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
          }`}
        >
          {model === val ? 'Selected' : 'Use Model'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Product Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2">
            Time-Series Forecasting Engine
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Machine learning demand prediction with 90% confidence prediction intervals
          </p>
        </div>

        {/* Product Filter Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 font-medium">Select Product:</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-brand-500 max-w-xs truncate"
          >
            {forecastData?.available_products?.map((prod) => (
              <option key={prod} value={prod}>
                {prod}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Forecast Chart Card */}
      <Card
        title={`Actual vs ${model} Forecast for ${selectedProduct || 'Selected Product'}`}
        subtitle="Chronological out-of-sample test evaluation with 90% Prediction Interval confidence envelope"
        action={
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Active Model:</span>
            <Badge variant="brand">{model}</Badge>
          </div>
        }
      >
        {loading || !forecastData ? (
          <ChartSkeleton height={380} />
        ) : (
          <ForecastChart
            data={forecastData.chart_data}
            height={380}
            modelName={model}
          />
        )}
      </Card>

      {/* Model Benchmark Leaderboard & Feature Importance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Leaderboard */}
        <div className="lg:col-span-2">
          <Card
            title="Model Performance Comparison Benchmark"
            subtitle="Evaluating ML architectures against Naive & Seasonal baselines via TimeSeriesSplit CV"
          >
            {loading || !forecastData ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-10 bg-slate-700/40 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <DataTable
                columns={leaderboardColumns}
                data={forecastData.leaderboard || []}
                searchable={false}
                pagination={false}
              />
            )}
          </Card>
        </div>

        {/* Feature Importance */}
        <div className="lg:col-span-1">
          <Card
            title="Model Explainability"
            subtitle="Top 10 Feature Importance ranking (XGBoost)"
          >
            {loading || !forecastData ? (
              <ChartSkeleton height={300} />
            ) : (
              <FeatureImportanceChart
                data={forecastData.feature_importance || []}
                height={300}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForecastPage;
