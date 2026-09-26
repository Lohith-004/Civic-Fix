import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, PlusCircle, RefreshCw, 
  Layers, ChevronRight, ThumbsUp, Calendar 
} from 'lucide-react';
import { InteractiveMap } from '../components/InteractiveMap';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CivicIssue, Category } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface ExploreMapViewProps {
  onSelectIssue: (issue: CivicIssue) => void;
  onOpenReport: () => void;
}

export const ExploreMapView: React.FC<ExploreMapViewProps> = ({ onSelectIssue, onOpenReport }) => {
  const { showToast } = useAuth();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [activeIssueId, setActiveIssueId] = useState<string | undefined>();
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [selectedBengaluruZone, setSelectedBengaluruZone] = useState<string>('ALL');

  const bengaluruZones = [
    { id: 'ALL', name: 'All Bengaluru', coords: [12.9716, 77.5946] as [number, number], zoom: 12 },
    { id: 'MG_ROAD', name: 'MG Road / Central', coords: [12.9748, 77.6080] as [number, number], zoom: 14 },
    { id: 'KORAMANGALA', name: 'Koramangala', coords: [12.9352, 77.6245] as [number, number], zoom: 14 },
    { id: 'INDIRANAGAR', name: 'Indiranagar', coords: [12.9784, 77.6408] as [number, number], zoom: 14 },
    { id: 'WHITEFIELD', name: 'Whitefield', coords: [12.9698, 77.7499] as [number, number], zoom: 13 },
    { id: 'HSR_LAYOUT', name: 'HSR Layout', coords: [12.9121, 77.6446] as [number, number], zoom: 14 },
    { id: 'MALLESHWARAM', name: 'Malleshwaram', coords: [13.0031, 77.5643] as [number, number], zoom: 14 },
    { id: 'JAYANAGAR', name: 'Jayanagar', coords: [12.9308, 77.5838] as [number, number], zoom: 14 },
    { id: 'BELLANDUR', name: 'Bellandur / ORR', coords: [12.9260, 77.6762] as [number, number], zoom: 14 },
  ];

  const handleZoneSelect = (zone: typeof bengaluruZones[0]) => {
    setSelectedBengaluruZone(zone.id);
    setMapCenter(zone.coords);
    setMapZoom(zone.zoom);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getIssues({
        search,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        pageSize: 50,
      });
      setIssues(res.data);
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (err: any) {
      showToast(err.message || 'Failed to load issues', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedPriority, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              Bengaluru Civic Map & Issues Explorer
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              BBMP Wards
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geospatial tracking of potholes, water breaks, electrical faults, and municipal work orders across Bengaluru, Karnataka, India.
          </p>
        </div>

        <button
          onClick={onOpenReport}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-sky-600/30 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Problem</span>
        </button>
      </div>

      {/* Bengaluru Locality / Ward Quick Select Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Quick Focus Bengaluru Neighborhood:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {bengaluruZones.map((zone) => {
            const isSelected = selectedBengaluruZone === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => handleZoneSelect(zone)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <MapPin className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-sky-600'}`} />
                <span>{zone.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search address, ID (e.g. CF-2026-004812), title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          />
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="AWAITING_VERIFICATION">Awaiting Verification</option>
          <option value="VERIFIED_RESOLVED">Verified & Closed</option>
        </select>

        <button
          onClick={loadData}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Split View: Map + Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Map */}
        <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
          <InteractiveMap
            issues={issues}
            selectedIssueId={activeIssueId}
            onSelectIssue={(issue) => {
              setActiveIssueId(issue.id);
              onSelectIssue(issue);
            }}
            height="620px"
            initialCenter={[12.9716, 77.5946]}
            center={mapCenter}
            zoom={mapZoom}
          />
        </div>

        {/* Right: Issues List */}
        <div className="lg:col-span-5 space-y-3 max-h-[620px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-semibold">
            <span>Showing {issues.length} Issues</span>
            <span>Sorted by Recent</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 font-semibold animate-pulse">
              Loading map data points...
            </div>
          ) : issues.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700 dark:text-slate-300">No issues reported yet</div>
              <p className="max-w-xs mx-auto text-slate-500">
                Civic issues submitted by citizens will appear here with geographic pins and live resolution statuses.
              </p>
              <button
                onClick={onOpenReport}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report the First Issue</span>
              </button>
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => {
                  setActiveIssueId(issue.id);
                  onSelectIssue(issue);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all bg-white dark:bg-slate-900 hover:border-sky-500/50 hover:shadow-md space-y-2.5 ${
                  activeIssueId === issue.id
                    ? 'ring-2 ring-sky-500 border-transparent bg-sky-50/20 dark:bg-sky-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-slate-500">
                    {issue.publicId}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={issue.status} size="sm" />
                    <PriorityBadge priority={issue.priority} size="sm" />
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {issue.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {issue.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                    {issue.address}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-slate-400" />
                      {issue.upvotesCount}
                    </span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center">
                      Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
