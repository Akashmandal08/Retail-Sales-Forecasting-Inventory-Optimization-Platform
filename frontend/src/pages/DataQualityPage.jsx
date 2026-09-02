import React, { useState, useEffect } from 'react';
import api from '../api/endpoints';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import { Skeleton } from '../components/ui/Skeleton';
import {
  ShieldCheck,
  CheckCircle2,
  Database,
  Calendar,
  Layers,
  Store,
  Tag,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export const DataQualityPage = () => {
  const [dataQuality, setDataQuality] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDataQuality = async () => {
      try {
        setLoading(true);
        const res = await api.getDataQuality();
        if (isMounted) {
          setDataQuality(res);
        }
      } catch (err) {
        console.error('Failed to load data quality:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDataQuality();
    return () => { isMounted = false; };
  }, []);

  const summary = dataQuality?.summary;
  const stationarity = summary?.stationarity_test;

  const schemaColumns = [
    {
      header: 'Feature Column Name',
      key: 'column',
      render: (val) => <span className="font-mono font-semibold text-white">{val}</span>,
    },
    {
      header: 'Data Type',
      key: 'dtype',
      render: (val) => <span className="font-mono text-brand-400">{val}</span>,
    },
    {
      header: 'Sample Value',
      key: 'sample',
      render: (val) => <span className="font-mono text-slate-300">{val}</span>,
    },
  ];

  // Dynamic sample data columns
  const sampleDataColumns = dataQuality?.schema?.map((col) => ({
    header: col.column,
    key: col.column,
    render: (val) => <span className="font-mono text-[11px]">{String(val)}</span>,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2">
          Data Quality & Preprocessing Transparency Report
        </h1>
        <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
          Audited data integrity metrics, null checks, outlier capping parameters, and stationarity tests
        </p>
      </div>

      {/* 8 Data Quality Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Rows</span>
          <span className="text-lg font-bold text-white">
            {summary ? summary.total_rows.toLocaleString() : '—'}
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Features</span>
          <span className="text-lg font-bold text-white">
            {summary ? summary.total_columns : '—'}
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Null Values</span>
          <span className="text-lg font-bold text-emerald-400">
            {summary ? summary.missing_values : '—'}
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Duplicates</span>
          <span className="text-lg font-bold text-emerald-400">
            {summary ? summary.duplicate_rows : '—'}
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Negative Capped</span>
          <span className="text-lg font-bold text-emerald-400">
            {summary ? summary.negative_sales_capped : '—'}
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Categories</span>
          <span className="text-lg font-bold text-brand-400">
            {summary ? summary.product_categories : '—'}
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Stores</span>
          <span className="text-lg font-bold text-brand-400">
            {summary ? summary.store_locations : '—'}
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Unique SKUs</span>
          <span className="text-lg font-bold text-brand-400">
            {summary ? summary.unique_products : '—'}
          </span>
        </div>
      </div>

      {/* Stationarity & Preprocessing Callout */}
      {stationarity && (
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">Augmented Dickey-Fuller (ADF) Stationarity Audit</span>
                <Badge variant={stationarity.is_stationary ? 'emerald' : 'amber'}>
                  {stationarity.is_stationary ? 'Stationary Series (p < 0.05)' : 'Non-Stationary'}
                </Badge>
              </div>
              <p className="text-slate-300 mt-1">
                ADF Test Statistic: <span className="font-mono text-brand-400">{stationarity.adf_stat.toFixed(4)}</span> • p-value: <span className="font-mono text-emerald-400">{stationarity.p_value.toFixed(4)}</span>.
                Time-series satisfies stationarity requirements for reliable autoregressive and tree-based forecasting.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 text-slate-400">
            <span>Date Range: </span>
            <span className="font-mono text-slate-200">{summary?.date_range}</span>
          </div>
        </div>
      )}

      {/* Schema & Sample Dataset Tabs/Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card
            title="Feature Schema & Data Types"
            subtitle="Pipeline feature definitions and encoded representations"
          >
            {loading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-slate-700/40 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <DataTable
                columns={schemaColumns}
                data={dataQuality?.schema || []}
                searchable={false}
                pagination={false}
              />
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card
            title="Sample Preprocessed Records"
            subtitle="Preview of raw records after IQR outlier winsorization and null imputation"
          >
            {loading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-10 bg-slate-700/40 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <DataTable
                columns={sampleDataColumns}
                data={dataQuality?.sample_data || []}
                searchable={true}
                searchPlaceholder="Search sample data..."
                pagination={true}
                pageSize={6}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataQualityPage;
