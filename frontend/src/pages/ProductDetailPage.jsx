import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import api from '../api/endpoints';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { ChartSkeleton } from '../components/ui/Skeleton';
import ForecastChart from '../components/charts/ForecastChart';
import {
  Layers,
  Store,
  Tag,
  DollarSign,
  Package,
  Activity,
  Shield,
  RotateCcw,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const ProductDetailPage = () => {
  const { metadata, model, leadTime, serviceLevel } = useFilters();
  const [selectedStore, setSelectedStore] = useState('Downtown Flagship');
  const [selectedProduct, setSelectedProduct] = useState('Wireless Noise-Canceling Headphones');
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.getProductDetail({
          store: selectedStore,
          product: selectedProduct,
          model,
          lead_time: leadTime,
          service_level: serviceLevel,
        });
        if (isMounted) {
          setDetailData(res);
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => { isMounted = false; };
  }, [selectedStore, selectedProduct, model, leadTime, serviceLevel]);

  return (
    <div className="space-y-6">
      {/* Title & SKU Selectors */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2">
            Product & Store Drill-Down
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Single SKU granular time-series demand trajectory and targeted inventory parameters
          </p>
        </div>

        {/* Store & Product Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Store className="w-3.5 h-3.5 text-brand-400" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent border-none text-xs font-medium cursor-pointer text-slate-200 focus:outline-none"
            >
              {metadata.stores.filter((s) => s.id !== 'All Stores').map((s) => (
                <option key={s.id} value={s.name} className="bg-slate-800 text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Tag className="w-3.5 h-3.5 text-brand-400" />
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="bg-transparent border-none text-xs font-medium cursor-pointer text-slate-200 focus:outline-none max-w-xs truncate"
            >
              {metadata.products.map((p) => (
                <option key={p.product_id} value={p.product_name} className="bg-slate-800 text-white">
                  {p.product_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SKU Header & Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-card">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Selling Price</div>
          <div className="text-xl font-bold text-white">
            {detailData ? `$${detailData.selling_price}` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Base: ${detailData?.base_price}</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-card">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Current Stock</div>
          <div className="text-xl font-bold text-white">
            {detailData ? `${detailData.current_stock}` : '—'}
          </div>
          <div className="mt-1">
            {detailData && <Badge variant={detailData.status}>{detailData.status}</Badge>}
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-card">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Daily Demand</div>
          <div className="text-xl font-bold text-brand-400">
            {detailData ? `${detailData.avg_daily_demand}` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Std Dev: σ = {detailData?.demand_std}</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-card">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Safety Stock (SS)</div>
          <div className="text-xl font-bold text-brand-400">
            {detailData ? `${detailData.safety_stock} units` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">SL = {serviceLevel}%</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-card">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Reorder Point</div>
          <div className="text-xl font-bold text-amber-400">
            {detailData ? `${detailData.reorder_point} units` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Lead Time = {leadTime}d</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-card">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Batch EOQ</div>
          <div className="text-xl font-bold text-emerald-400">
            {detailData ? `${detailData.eoq} units` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Annual Optimal</div>
        </div>
      </div>

      {/* Main Single SKU Forecast Chart */}
      <Card
        title={`Forecast & Demand Envelope for ${selectedProduct} at ${selectedStore}`}
        subtitle={`Chronological demand trajectory compared with ${model} predictions and 90% prediction intervals`}
      >
        {loading || !detailData ? (
          <ChartSkeleton height={360} />
        ) : (
          <ForecastChart
            data={detailData.chart_series || []}
            height={360}
            modelName={model}
          />
        )}
      </Card>

      {/* Targeted Action Recommendation Card */}
      {detailData && !loading && (
        <Card title="Automated Replenishment Directive" subtitle="Prescriptive inventory decision logic">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">{selectedProduct}</span>
                <Badge variant={detailData.status}>{detailData.status}</Badge>
              </div>
              <p className="text-slate-300">
                {detailData.current_stock <= detailData.reorder_point
                  ? `Trigger order immediately. On-hand inventory (${detailData.current_stock} units) has crossed below Reorder Point (${detailData.reorder_point} units).`
                  : `Current stock of ${detailData.current_stock} units is sufficient above Reorder Point (${detailData.reorder_point} units). No immediate order required.`}
              </p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 flex-shrink-0 text-right">
              <span className="text-slate-400 block text-[10px]">Recommended Purchase Batch</span>
              <span className="text-lg font-bold text-emerald-400">
                {detailData.current_stock <= detailData.reorder_point ? `${detailData.eoq} units` : '0 units'}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProductDetailPage;
