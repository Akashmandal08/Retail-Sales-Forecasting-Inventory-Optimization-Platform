import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import api from '../api/endpoints';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Slider from '../components/ui/Slider';
import DataTable from '../components/ui/DataTable';
import { ChartSkeleton } from '../components/ui/Skeleton';
import {
  Boxes,
  Clock,
  Percent,
  Download,
  ShieldCheck,
  TrendingDown,
  DollarSign,
  Layers,
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const InventoryPage = () => {
  const {
    filterParams,
    leadTime,
    setLeadTime,
    serviceLevel,
    setServiceLevel,
    store,
    category
  } = useFilters();

  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await api.getInventory(filterParams);
        if (isMounted) {
          setInventoryData(res);
        }
      } catch (err) {
        console.error('Failed to load inventory data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInventory();
    return () => { isMounted = false; };
  }, [filterParams]);

  const handleDownloadCSV = () => {
    const csvUrl = api.getInventoryCsvUrl(filterParams);
    window.open(csvUrl, '_blank');
  };

  // Cost Matrix Table Columns
  const costMatrixColumns = [
    {
      header: 'Supply Chain Metric',
      key: 'Metric',
      render: (val) => <span className="font-semibold text-white light:text-slate-900">{val}</span>,
    },
    {
      header: 'Traditional Static Policy',
      key: 'Static Policy',
      render: (val) => <span className="text-slate-300 font-mono">{val}</span>,
    },
    {
      header: 'AI Dynamic Forecast Policy',
      key: 'AI Dynamic Policy',
      render: (val) => <span className="text-brand-400 font-mono font-semibold">{val}</span>,
    },
    {
      header: 'Net Improvement / Savings',
      key: 'Improvement',
      render: (val) => (
        <Badge variant={val.includes('Reduction') || val.includes('Savings') ? 'emerald' : 'brand'}>
          {val}
        </Badge>
      ),
    },
  ];

  // Dynamic Stock Level Table Columns
  const inventoryItemsColumns = [
    {
      header: 'Store Location',
      key: 'store_name',
      render: (val) => <span className="font-medium text-slate-300">{val}</span>,
    },
    {
      header: 'Product Name',
      key: 'product_name',
      render: (val, row) => (
        <div>
          <div className="font-semibold text-white light:text-slate-900">{val}</div>
          <div className="text-[10px] text-slate-400">{row.category} • ${row.unit_price}</div>
        </div>
      ),
    },
    {
      header: 'Avg Daily Demand',
      key: 'avg_daily_demand',
      render: (val) => <span className="font-mono">{val} units/d</span>,
    },
    {
      header: 'Current Stock',
      key: 'current_stock',
      render: (val) => <span className="font-mono font-semibold">{val}</span>,
    },
    {
      header: 'Safety Stock (SS)',
      key: 'safety_stock',
      render: (val) => <span className="font-mono text-brand-400 font-semibold">{val}</span>,
    },
    {
      header: 'Reorder Point (ROP)',
      key: 'reorder_point',
      render: (val) => <span className="font-mono text-amber-400 font-bold">{val}</span>,
    },
    {
      header: 'EOQ Batch Qty',
      key: 'eoq',
      render: (val) => <span className="font-mono text-emerald-400 font-semibold">{val}</span>,
    },
    {
      header: 'Health Status',
      key: 'status',
      render: (val) => <Badge variant={val}>{val}</Badge>,
    },
  ];

  const summary = inventoryData?.summary;

  return (
    <div className="space-y-6">
      {/* Page Title & CSV Download */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2">
            Dynamic Inventory Policy Simulator
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Optimize Safety Stock (SS), Reorder Points (ROP), and Economic Order Quantities (EOQ) dynamically
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Download Restock Schedule CSV</span>
        </button>
      </div>

      {/* Simulator Interactive Parameter Control Panel */}
      <Card
        title="Interactive Policy Simulation Settings"
        subtitle="Adjust vendor lead times and target service levels to observe real-time cost impact"
        className="border-brand-500/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
          <div>
            <Slider
              label="Supplier Lead Time"
              value={leadTime}
              min={1}
              max={14}
              unit="days"
              helpText="Delivery window from vendor order trigger"
              icon={Clock}
              onChange={setLeadTime}
            />
          </div>

          <div>
            <Slider
              label="Target Service Level (Z-Score)"
              value={serviceLevel}
              min={80}
              max={99}
              unit="%"
              helpText="Probability of fulfilling demand without stockout"
              icon={Percent}
              onChange={setServiceLevel}
            />
          </div>
        </div>
      </Card>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Stockout Reduction</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {summary ? `${summary.overall_stockout_reduction_pct}%` : '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            AI: {summary?.total_stockout_units_ai || 0} vs Static: {summary?.total_stockout_units_static || 0} units
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Holding Cost Savings</span>
            <DollarSign className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-brand-400">
            {summary ? `$${summary.total_holding_cost_savings.toLocaleString()}` : '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Optimized EOQ batch inventory sizes
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Cost Reduction</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {summary ? `${summary.total_cost_reduction_pct}%` : '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total supply chain expenditure saved
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Net Financial Savings</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {summary ? `$${summary.net_supply_chain_cost_savings.toLocaleString()}` : '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Holding + Ordering + Lost Sales savings
          </p>
        </div>
      </div>

      {/* Genuine Supply Chain Business Cost Comparison Matrix */}
      <Card
        title="Supply Chain Business Cost Comparison Matrix"
        subtitle="Empirical cost comparison: Traditional Static Fixed ROP vs AI Dynamic Policy"
      >
        {loading || !inventoryData ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-slate-700/40 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={costMatrixColumns}
            data={inventoryData.cost_matrix || []}
            searchable={false}
            pagination={false}
          />
        )}
      </Card>

      {/* Recommended Dynamic Stock Levels per SKU Table */}
      <Card
        title="Recommended Dynamic Stock Levels & Replenishment Parameters per SKU"
        subtitle="Item-level Safety Stock, Reorder Points, and Economic Order Quantities"
      >
        {loading || !inventoryData ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-12 bg-slate-700/40 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={inventoryItemsColumns}
            data={inventoryData.inventory_items || []}
            searchPlaceholder="Search store, product, category..."
            searchKey="product_name"
            pagination={true}
            pageSize={8}
          />
        )}
      </Card>
    </div>
  );
};

export default InventoryPage;
