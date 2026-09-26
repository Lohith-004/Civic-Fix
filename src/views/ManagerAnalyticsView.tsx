import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, TrendingUp, CheckCircle2, 
  Clock, AlertTriangle, Building2, Calendar, 
  ChevronRight, RefreshCw, Flame 
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const ManagerAnalyticsView: React.FC = () => {
  const { showToast } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7D' | '30D' | '90D' | 'ALL'>('30D');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsDashboard();
      setData(res);
    } catch (e: any) {
      showToast(e.message || 'Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const handleExportCSV = async () => {
    try {
      showToast('Generating CivicFix CSV issue report...', 'info');
      const token = localStorage.getItem('civicfix_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/analytics/export', { headers });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `civicfix-issues-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('CSV export downloaded successfully!');
    } catch (e: any) {
      showToast(e.message || 'CSV download failed', 'error');
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400 font-semibold animate-pulse">
        Generating municipal analytics and performance data...
      </div>
    );
  }

  const { metrics, categoryCounts, deptBreakdown, officerWorkload, dailyTrends } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-600" />
            Executive Municipal Analytics & SLA Insights
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-department performance indicators, resolution timelines, and geographic trend analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
            {(['7D', '30D', '90D', 'ALL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dateRange === r
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Issues Tracked
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {metrics.totalIssues}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            {metrics.totalIssues === 0 ? 'No issues reported yet' : `${metrics.openCount} currently active`}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            SLA Compliance Rate
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {metrics.totalIssues === 0 ? '100%' : `${metrics.complianceRate}%`}
          </div>
          <div className="text-[11px] text-indigo-500 font-medium">
            Target threshold: &gt; 90%
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Average Resolution Time
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {metrics.resolvedCount > 0 ? `${metrics.avgResolutionHours}h` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {metrics.resolvedCount === 0 ? 'Pending first resolution' : 'From submission to sign-off'}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Overdue Tickets
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
            {metrics.overdueCount}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {metrics.overdueCount === 0 ? 'All within SLA target' : 'Requires supervisor intervention'}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: 7-day Activity Trends */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Intake vs Resolution Trends (Daily Volume)
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-sky-600">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Reported
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resolved
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-end justify-between gap-4 h-48 border-b border-slate-100 dark:border-slate-800 px-2">
            {dailyTrends.map((d: any) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-1.5 h-36">
                  {/* Reported bar */}
                  <div
                    className="w-1/2 bg-sky-500 rounded-t-md transition-all hover:bg-sky-600"
                    style={{ height: `${(d.reported / 25) * 100}%` }}
                    title={`Reported: ${d.reported}`}
                  />
                  {/* Resolved bar */}
                  <div
                    className="w-1/2 bg-emerald-500 rounded-t-md transition-all hover:bg-emerald-600"
                    style={{ height: `${(d.resolved / 25) * 100}%` }}
                    title={`Resolved: ${d.resolved}`}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Category Distribution */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Issues by Category Breakdown
          </h3>
          <div className="space-y-3 pt-1">
            {Object.entries(categoryCounts).map(([cat, count]: [string, any]) => {
              const pct = Math.round((count / (metrics.totalIssues || 1)) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {cat}
                    </span>
                    <span className="font-mono text-slate-500 font-bold">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-sky-600" />
          Departmental Efficiency & Resolution Performance
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Department</th>
                <th className="pb-3 text-center">Total Issues</th>
                <th className="pb-3 text-center">Open / In Progress</th>
                <th className="pb-3 text-center">Resolved</th>
                <th className="pb-3 text-right">Resolution Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {deptBreakdown.map((dept: any) => (
                <tr key={dept.departmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                    {dept.name}
                  </td>
                  <td className="py-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {dept.total}
                  </td>
                  <td className="py-3.5 text-center font-mono text-amber-600 dark:text-amber-400 font-bold">
                    {dept.open}
                  </td>
                  <td className="py-3.5 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {dept.resolved}
                  </td>
                  <td className="py-3.5 text-right">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {dept.resolutionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
