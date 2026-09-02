import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import api from '../api/endpoints';
import KPICard from '../components/ui/KPICard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { ChartSkeleton } from '../components/ui/Skeleton';
import RevenueTrendChart from '../components/charts/RevenueTrendChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import {
  DollarSign,
  Package,
  Cpu,
  Percent,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { filterParams, model, store, category } = useFilters();
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [kpiRes, trendRes, invRes] = await Promise.all([
          api.getKPIs(filterParams),
          api.getTrends(filterParams),
          api.getInventory(filterParams),
        ]);
        if (isMounted) {
          setKpis(kpiRes);
          setTrends(trendRes);
          setInventory(invRes);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [filterParams]);

  // Critical stockout items
  const criticalItems = inventory?.inventory_items?.filter(
    (item) => item.status === 'Low Stock'
  ) || [];

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2">
            Executive Performance Overview
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Multi-store sales forecasting, demand intelligence, and dynamic replenishment metrics
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Viewing:</span>
          <span className="font-semibold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-500/20">
            {store} • {category}
          </span>
        </div>
      </div>

      {/* Model Summary Highlight Banner */}
      {kpis && !loading && (
        <div className="bg-gradient-to-r from-brand-950/80 via-slate-900/90 to-brand-950/80 border border-brand-500/30 rounded-xl p-4 shadow-subtle flex items-start space-x-3">
          <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-brand-300">Model Evaluation Benchmark:</span>
              <Badge variant="brand">{kpis.selected_model} Active</Badge>
              <Badge variant="emerald">{kpis.variance_explained_pct}% Variance Explained</Badge>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {kpis.summary_text}
            </p>
          </div>
        </div>
      )}

      {/* 5 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Historical Revenue"
          value={kpis ? `$${kpis.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
          subtitle="Cumulative sales in filter window"
          icon={DollarSign}
          loading={loading}
          trend="+5.2% YoY"
          trendType="positive"
        />
        <KPICard
          title="Total Units Sold"
          value={kpis ? `${kpis.total_units.toLocaleString()}` : '—'}
          subtitle="Total product demand fulfillment"
          icon={Package}
          loading={loading}
          trend="Poisson regularized"
          trendType="neutral"
        />
        <KPICard
          title={`R² Score (${model})`}
          value={kpis ? `${kpis.r2_score}` : '—'}
          subtitle={`${kpis?.variance_explained_pct || 0}% variance explained`}
          icon={Cpu}
          loading={loading}
          badgeText="Target ≥ 0.90"
          badgeVariant="success"
        />
        <KPICard
          title="Stockout Reduction"
          value={kpis ? `${kpis.stockout_reduction_pct}%` : '—'}
          subtitle={`AI: ${kpis?.total_stockout_units_ai || 0} vs Static: ${kpis?.total_stockout_units_static || 0} units`}
          icon={Percent}
          loading={loading}
          badgeText="Target ≥ 15%"
          badgeVariant="success"
        />
        <KPICard
          title="Supply Chain Savings"
          value={kpis ? `$${kpis.net_cost_savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
          subtitle={`${kpis?.total_cost_reduction_pct || 0}% total cost reduction`}
          icon={TrendingUp}
          loading={loading}
          trend="vs Static Policy"
          trendType="positive"
        />
      </div>

      {/* Revenue Trend & Category Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="Daily Sales Revenue Trend"
            subtitle="Historical sales volume and aggregated demand over time"
            action={
              <Link to="/forecast" className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1 font-medium">
                <span>View ML Forecast</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {loading || !trends ? (
              <ChartSkeleton height={320} />
            ) : (
              <RevenueTrendChart
                dailyData={trends.daily_trends}
                monthlyData={trends.monthly_trends}
                height={320}
              />
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card
            title="Sales by Category"
            subtitle="Revenue contribution by product group"
          >
            {loading || !trends ? (
              <ChartSkeleton height={320} />
            ) : (
              <CategoryPieChart
                data={trends.category_breakdown}
                height={320}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Critical Restock Alerts & Supply Chain Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Stock Alerts */}
        <div className="lg:col-span-2">
          <Card
            title="Active Reorder & Stockout Risk Watchlist"
            subtitle="SKUs currently below safety stock buffers requiring dynamic replenishment"
            action={
              <Link to="/inventory" className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1 font-medium">
                <span>Open Inventory Optimizer</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-700/40 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : criticalItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <span>All SKUs currently operate within healthy safety stock thresholds.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {criticalItems.slice(0, 4).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 bg-slate-900/60 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 rounded-lg hover:border-rose-500/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-200 light:text-slate-800">
                          {item.product_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.store_name} • {item.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs">
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Stock / Safety</span>
                        <span className="font-bold text-rose-400">
                          {item.current_stock} / {item.safety_stock} units
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Reorder Qty (EOQ)</span>
                        <span className="font-bold text-brand-400">
                          {item.eoq} units
                        </span>
                      </div>
                      <Badge variant="rose">Low Stock</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Simulator Snapshot */}
        <div className="lg:col-span-1">
          <Card
            title="Policy Simulation Snapshot"
            subtitle="AI Dynamic vs Static Replenishment"
          >
            {loading || !inventory ? (
              <div className="space-y-3 py-4">
                <div className="h-10 bg-slate-700/40 rounded animate-pulse" />
                <div className="h-10 bg-slate-700/40 rounded animate-pulse" />
                <div className="h-10 bg-slate-700/40 rounded animate-pulse" />
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 flex justify-between items-center">
                  <span className="text-slate-400">Holding Cost Savings:</span>
                  <span className="font-bold text-emerald-400">
                    ${inventory.summary.total_holding_cost_savings.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 flex justify-between items-center">
                  <span className="text-slate-400">Stockout Unit Reduction:</span>
                  <span className="font-bold text-brand-400">
                    {inventory.summary.overall_stockout_reduction_pct}%
                  </span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 flex justify-between items-center">
                  <span className="text-slate-400">Net Cost Savings:</span>
                  <span className="font-bold text-emerald-400">
                    ${inventory.summary.net_supply_chain_cost_savings.toLocaleString()}
                  </span>
                </div>

                <Link
                  to="/inventory"
                  className="w-full mt-2 py-2 px-3 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 font-semibold rounded-lg text-center block border border-brand-500/40 transition-colors"
                >
                  Tune Lead Time & Service Level →
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
