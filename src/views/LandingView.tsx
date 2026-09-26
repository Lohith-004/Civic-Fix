import React, { useState, useEffect } from 'react';
import { 
  Building2, PlusCircle, MapPin, Sparkles, ShieldCheck, 
  ArrowRight, Clock, CheckCircle2, AlertTriangle, Users, 
  Search, Shield, ChevronRight, BarChart3, Wrench, RefreshCw, FileText, Calendar, Database 
} from 'lucide-react';
import { api } from '../lib/api';

interface LandingViewProps {
  onNavigate: (tab: string) => void;
  onOpenReport: () => void;
  onOpenLogin?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ 
  onNavigate, 
  onOpenReport,
  onOpenLogin,
}) => {
  const [stats, setStats] = useState({
    totalIssues: 0,
    resolvedCount: 0,
    complianceRate: 100,
    avgResolutionHours: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    api.getSLAMetrics()
      .then((m) => {
        setStats({
          totalIssues: m.totalIssues || 0,
          resolvedCount: m.resolvedCount || 0,
          complianceRate: m.totalIssues > 0 ? m.complianceRate : 100,
          avgResolutionHours: m.resolvedCount > 0 ? m.avgResolutionHours : 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Decorative ambient gradient */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[600px] h-[350px] bg-gradient-to-tr from-sky-400/20 via-indigo-500/15 to-emerald-400/20 blur-3xl rounded-full" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation AI Civic Infrastructure Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Civic<span className="text-sky-600 dark:text-sky-400">Fix</span>
        </h1>
        <p className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300 mt-3">
          Report it. Track it. Fix it.
        </p>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-4 max-w-2xl mx-auto leading-relaxed">
          Empowering citizens and municipal agencies to identify, dispatch, resolve, and independently verify civic infrastructure issues with artificial intelligence and transparent workflows.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <button
            onClick={onOpenReport}
            className="px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-xl shadow-sky-600/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Report a Problem</span>
          </button>
          <button
            onClick={() => onNavigate('appointments')}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Calendar className="w-5 h-5" />
            <span>Book Civic Appointment</span>
          </button>
          <button
            onClick={() => onNavigate('map')}
            className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 transition-all"
          >
            <MapPin className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Explore Civic Map</span>
          </button>
        </div>

        {/* Live Metrics Strip: Clean initial state with actual backend values */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Reports</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalIssues}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              {stats.totalIssues === 0 ? 'No civic issues reported yet' : 'Verified across city'}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Resolved Cases</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.resolvedCount}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              {stats.resolvedCount === 0 ? 'No resolved cases yet' : 'With citizen sign-off'}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">SLA Target</div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.totalIssues === 0 ? '100%' : `${stats.complianceRate}%`}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Deadline compliance</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Avg Resolution</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.avgResolutionHours > 0 ? `${stats.avgResolutionHours}h` : '—'}
            </div>
            <div className="text-[11px] text-sky-600 font-medium mt-0.5">
              {stats.resolvedCount === 0 ? 'Pending first resolution' : 'From submission to fix'}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
            Lifecycle Workflow
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            How CivicFix Resolves Neighborhood Issues
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            A continuous loop from citizen snapshot to automated AI routing, field crew assignment, and citizen confirmation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Snap & Report',
              desc: 'Citizen captures a photo, adds a brief note, and drops a pin on the map. Browser GPS automatically identifies street address.',
              icon: PlusCircle,
            },
            {
              step: '02',
              title: 'AI Triage & Routing',
              desc: 'Intelligent triage classifies category, estimates hazard severity, flags potential duplicates, and routes to responsible department.',
              icon: Sparkles,
            },
            {
              step: '03',
              title: 'Field Investigation',
              desc: 'Dispatched officers receive mobile work orders, navigate directly to coordinates, perform repairs, and upload timestamped after photos.',
              icon: Wrench,
            },
            {
              step: '04',
              title: 'Citizen Verification',
              desc: 'Before an issue can be closed, reporting citizens independently inspect the fix. If unsatisfied, the issue auto-escalates.',
              icon: ShieldCheck,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300 dark:text-slate-700">
                    {item.step}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Features Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shadow-2xl border border-slate-800">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Built-in Intelligence Engine</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Real AI Features. Zero Gimmicks.
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
              CivicFix uses advanced automated intelligence to relieve municipal overhead, draft structured complaints from unstructured text, prevent duplicate ticket spam, and equip field officers with safety checklists.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[
              {
                title: 'AI Vision Analysis',
                desc: 'Analyzes road crater depth, fallen limbs, and exposed wiring to assign realistic initial severity.',
              },
              {
                title: 'Description Assistant',
                desc: 'Converts unstructured notes into an actionable, formal municipal defect complaint.',
              },
              {
                title: 'Duplicate Detection',
                desc: 'Detects existing reports within 250m and allows citizens to consolidate support instead of duplicate dispatch.',
              },
              {
                title: 'Officer Copilot',
                desc: 'Provides field response crews with safety protocol checklists and personalized citizen status updates.',
              },
            ].map((f, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-xs font-bold text-sky-400">{f.title}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Appointment Booking Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-sky-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Municipal Consultation & Inspection Booking</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Citizen Appointments & On-Site Inspections
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Book face-to-face consultations with ward engineers, request on-site grievance inspections, and schedule hearings with civic authorities directly online with instant confirmation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('appointments')}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment Now</span>
            </button>
          </div>
        </div>
      </section>

      {/* Government Roles & Security */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
            Multi-Tier Role Governance
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Built for Real Municipal Operations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Field Officer Mobility
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mobile-optimized dispatch queue. Crews accept work orders, get GPS directions, log materials, and submit verified completion evidence directly from mobile browsers.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Supervisors & Workload Triage
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Real-time monitoring of crew workload balances, automated SLA deadline timers, priority overrides, and multi-tier department escalations.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Executive Analytics & Hotspots
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Department Managers inspect resolution compliance, geographic cluster maps, recurring problem zones, and export comprehensive CSV audits.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Spot a problem in your neighborhood?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Take a minute to submit a report with photos and location. Our city teams will dispatch and keep you updated every step of the way.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenReport}
              className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/30 inline-flex items-center gap-2 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Civic Report</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-12 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700 dark:text-slate-300 mb-2">
          <Building2 className="w-4 h-4 text-sky-600" />
          <span>CivicFix Platform — Open Civic Infrastructure</span>
        </div>
        <p>© 2026 CivicFix Municipal Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
};
