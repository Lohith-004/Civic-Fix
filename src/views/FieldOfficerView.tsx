import React, { useState, useEffect } from 'react';
import { 
  Wrench, Navigation, CheckCircle2, Clock, 
  Camera, AlertTriangle, Sparkles, MapPin, 
  Check, Play, Pause, ChevronRight, RefreshCw 
} from 'lucide-react';
import { CivicIssue } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface FieldOfficerViewProps {
  onSelectIssue: (issue: CivicIssue) => void;
}

export const FieldOfficerView: React.FC<FieldOfficerViewProps> = ({ onSelectIssue }) => {
  const { user, showToast } = useAuth();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [filter, setFilter] = useState<'MY_ASSIGNMENTS' | 'DUE_TODAY' | 'HIGH_PRIORITY' | 'OVERDUE' | 'COMPLETED'>('MY_ASSIGNMENTS');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getIssues({ pageSize: 50 });
      setIssues(res.data);
    } catch (e: any) {
      showToast(e.message || 'Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const now = new Date().getTime();

  // Filter issues
  const myAssigned = issues.filter(
    (i) => i.assignedOfficerId === user?.id || (user?.role === 'FIELD_OFFICER' && !i.assignedOfficerId)
  );

  const dueToday = myAssigned.filter((i) => {
    const d = new Date(i.slaDeadline).getTime();
    return d - now > 0 && d - now < 24 * 3600000;
  });

  const highPriority = myAssigned.filter((i) => i.priority === 'CRITICAL' || i.priority === 'HIGH');

  const overdue = myAssigned.filter((i) => {
    const d = new Date(i.slaDeadline).getTime();
    return now > d && !['RESOLVED', 'AWAITING_VERIFICATION', 'VERIFIED_RESOLVED', 'CLOSED'].includes(i.status);
  });

  const completed = myAssigned.filter((i) =>
    ['RESOLVED', 'AWAITING_VERIFICATION', 'VERIFIED_RESOLVED', 'CLOSED'].includes(i.status)
  );

  const getFilteredList = () => {
    switch (filter) {
      case 'DUE_TODAY':
        return dueToday;
      case 'HIGH_PRIORITY':
        return highPriority;
      case 'OVERDUE':
        return overdue;
      case 'COMPLETED':
        return completed;
      default:
        return myAssigned;
    }
  };

  const handleStartWork = async (e: React.MouseEvent, issue: CivicIssue) => {
    e.stopPropagation();
    try {
      await api.updateStatus(issue.id, 'IN_PROGRESS', 'Officer commenced on-site repair operations.');
      showToast(`Work started on ${issue.publicId}`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const handlePauseWork = async (e: React.MouseEvent, issue: CivicIssue) => {
    e.stopPropagation();
    try {
      await api.updateStatus(issue.id, 'ON_HOLD', 'Work paused for specialized equipment deployment.');
      showToast(`Work paused on ${issue.publicId}`, 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const handleMarkResolved = async (e: React.MouseEvent, issue: CivicIssue) => {
    e.stopPropagation();
    try {
      await api.updateStatus(issue.id, 'AWAITING_VERIFICATION', 'Field crew completed fix. Awaiting citizen verification.');
      showToast(`Marked ${issue.publicId} as resolved! Awaiting citizen verification.`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const displayList = getFilteredList();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Officer Header Card */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <Wrench className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {user?.badgeNumber || 'RPW-CREW-1'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.departmentName || 'Roads & Public Works'} • Field Dispatch Console
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors self-end sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* KPI Ticker Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-[11px] font-bold uppercase text-slate-400">Active Workload</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {myAssigned.filter(i => !['RESOLVED', 'VERIFIED_RESOLVED', 'CLOSED'].includes(i.status)).length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-[11px] font-bold uppercase text-slate-400">Due Today</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {dueToday.length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-[11px] font-bold uppercase text-slate-400">Overdue SLA</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {overdue.length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-[11px] font-bold uppercase text-slate-400">Completed</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {completed.length}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-bold border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'MY_ASSIGNMENTS', label: `My Assignments (${myAssigned.length})` },
          { id: 'DUE_TODAY', label: `Due Today (${dueToday.length})` },
          { id: 'HIGH_PRIORITY', label: `High Priority (${highPriority.length})` },
          { id: 'OVERDUE', label: `Overdue (${overdue.length})` },
          { id: 'COMPLETED', label: `Completed (${completed.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={`px-3 py-2 rounded-xl transition-all ${
              filter === t.id
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Issues Queue Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400 font-semibold animate-pulse">
            Loading field dispatch work orders...
          </div>
        ) : displayList.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Clear Queue!
            </h4>
            <p className="text-xs text-slate-400">
              No tasks currently pending in this queue view.
            </p>
          </div>
        ) : (
          displayList.map((issue) => {
            const isDueSoon = new Date(issue.slaDeadline).getTime() - now < 4 * 3600000;
            const isPastDeadline = now > new Date(issue.slaDeadline).getTime() && !['RESOLVED', 'VERIFIED_RESOLVED', 'CLOSED'].includes(issue.status);

            return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:shadow-lg transition-all cursor-pointer space-y-3.5"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                      {issue.publicId}
                    </span>
                    <PriorityBadge priority={issue.priority} size="sm" />
                    <StatusBadge status={issue.status} size="sm" />
                  </div>
                  <div className="text-xs font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {isPastDeadline ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">Overdue</span>
                    ) : (
                      <span className={isDueSoon ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500'}>
                        Deadline: {new Date(issue.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {issue.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                {/* Address & Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    {issue.address}
                  </span>

                  {/* Field Actions */}
                  <div className="flex items-center gap-2">
                    {/* Navigation Link */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${issue.latitude},${issue.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5 text-sky-600" />
                      <span>Directions</span>
                    </a>

                    {/* Status Toggle Buttons */}
                    {issue.status !== 'IN_PROGRESS' && issue.status !== 'RESOLVED' && issue.status !== 'AWAITING_VERIFICATION' && issue.status !== 'VERIFIED_RESOLVED' && (
                      <button
                        onClick={(e) => handleStartWork(e, issue)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Start Work</span>
                      </button>
                    )}

                    {issue.status === 'IN_PROGRESS' && (
                      <>
                        <button
                          onClick={(e) => handlePauseWork(e, issue)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Pause className="w-3 h-3 fill-white" />
                          <span>Pause</span>
                        </button>
                        <button
                          onClick={(e) => handleMarkResolved(e, issue)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark Resolved</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
