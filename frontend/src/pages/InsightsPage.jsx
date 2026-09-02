import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import api from '../api/endpoints';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import {
  Lightbulb,
  AlertOctagon,
  AlertTriangle,
  Info,
  ArrowDownToLine,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const InsightsPage = () => {
  const { filterParams, store, category } = useFilters();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const res = await api.getInsights(filterParams);
        if (isMounted) {
          setInsights(res.insights || []);
        }
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInsights();
    return () => { isMounted = false; };
  }, [filterParams]);

  const handleDownloadCSV = () => {
    const csvUrl = api.getInventoryCsvUrl(filterParams);
    window.open(csvUrl, '_blank');
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <AlertOctagon className="w-5 h-5 text-rose-400" />;
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <Info className="w-5 h-5 text-brand-400" />;
    }
  };

  const getPriorityBorder = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'border-l-4 border-l-rose-500 hover:border-rose-500/80';
      case 'HIGH':
        return 'border-l-4 border-l-amber-500 hover:border-amber-500/80';
      default:
        return 'border-l-4 border-l-brand-500 hover:border-brand-500/80';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & CSV Export */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2">
            Automated Actionable Business Insights
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Prescriptive replenishment and supply chain optimizations generated from empirical model outputs
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Export Restock Schedule CSV</span>
        </button>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-800/80 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <Card>
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <span className="font-semibold text-slate-300">All inventory policies are currently running optimally.</span>
              <span>No critical interventions required for the selected store/category filters.</span>
            </div>
          </Card>
        ) : (
          insights.map((item, idx) => (
            <div
              key={idx}
              className={`bg-slate-800/90 light:bg-white border border-slate-700/60 light:border-slate-200 rounded-xl p-5 shadow-card transition-all ${getPriorityBorder(
                item.priority
              )}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-900/60 rounded-lg">
                    {getPriorityIcon(item.priority)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white light:text-slate-900">
                        {item.product}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        [{item.category}]
                      </span>
                    </div>
                  </div>
                </div>

                <Badge variant={item.priority}>{item.priority}</Badge>
              </div>

              <div className="space-y-2 pl-12 text-xs">
                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-0.5">
                    Empirical Insight
                  </span>
                  <p className="text-slate-200 light:text-slate-700 leading-relaxed">
                    {item.insight}
                  </p>
                </div>

                <div className="p-3 bg-brand-500/10 light:bg-brand-50 border border-brand-500/20 rounded-lg flex items-start space-x-2">
                  <ArrowRight className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-brand-400 light:text-brand-700 block text-[11px]">
                      Recommended Action:
                    </span>
                    <span className="text-slate-300 light:text-slate-700 text-xs">
                      {item.action}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InsightsPage;
