import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Building2, User, Mail, Phone, MapPin, 
  FileText, CheckCircle2, AlertCircle, Database, Copy, Check, 
  RefreshCw, ArrowRight, ShieldCheck, Sparkles, ExternalLink, Filter 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { 
  checkSupabaseHealth, 
  saveAppointmentToSupabase,
  fetchAppointmentsFromSupabase, 
  SupabaseHealthResult 
} from '../lib/supabase';
import { Appointment } from '../types';

interface AppointmentBookingViewProps {
  onBackToHome?: () => void;
  preselectedIssueId?: string;
  preselectedDepartment?: string;
}

const DEPARTMENTS = [
  { id: 'dept-roads', name: 'Roads & Public Works', icon: '🛣️', code: 'RPW' },
  { id: 'dept-water', name: 'Water Resources & Sewage', icon: '💧', code: 'WRS' },
  { id: 'dept-electric', name: 'Street Lighting & Energy', icon: '⚡', code: 'SLE' },
  { id: 'dept-sanitation', name: 'Waste Management & Sanitation', icon: '♻️', code: 'WMS' },
  { id: 'dept-parks', name: 'Parks, Trees & Urban Forest', icon: '🌳', code: 'PUF' },
  { id: 'dept-general', name: 'Civic Grievance & General Inquiries', icon: '🏛️', code: 'CGA' },
];

const SERVICE_TYPES = [
  'In-Person Departmental Consultation',
  'On-Site Infrastructure Inspection',
  'Civic Grievance / Formal Hearing',
  'Work Verification & Resolution Review',
  'Permit & Civic Access Evaluation',
];

const TIME_SLOTS = [
  '09:00 AM - 09:45 AM',
  '10:00 AM - 10:45 AM',
  '11:15 AM - 12:00 PM',
  '02:00 PM - 02:45 PM',
  '03:00 PM - 03:45 PM',
  '04:15 PM - 05:00 PM',
];

export const AppointmentBookingView: React.FC<AppointmentBookingViewProps> = ({
  onBackToHome,
  preselectedIssueId,
  preselectedDepartment,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'book' | 'list'>('book');

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: preselectedDepartment || DEPARTMENTS[0].name,
    serviceType: SERVICE_TYPES[0],
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    appointmentTime: TIME_SLOTS[1],
    location: 'Municipal Civic Center (Main Desk)',
    notes: '',
    issueId: preselectedIssueId || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Supabase Status State
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthResult | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Booked Appointments State
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-fill user info if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name,
        email: prev.email || user.email,
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Check Supabase health on mount
  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const health = await checkSupabaseHealth();
      setSupabaseHealth(health);
    } catch {
      // fallback
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Load appointments list
  const loadAppointments = async () => {
    setLoadingList(true);
    try {
      // Try direct Supabase client first
      const sbResult = await fetchAppointmentsFromSupabase();
      if (sbResult.data && sbResult.data.length > 0) {
        setAppointmentsList(sbResult.data);
      } else {
        // Fallback to server route (which checks both Supabase and local store)
        const serverData = await api.getAppointments();
        setAppointmentsList(serverData);
      }
    } catch {
      try {
        const serverData = await api.getAppointments();
        setAppointmentsList(serverData);
      } catch (e: any) {
        console.error('Failed to load appointments', e);
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      loadAppointments();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    const publicId = `APT-${Date.now().toString(36).toUpperCase()}`;
    const newAppointment: Partial<Appointment> = {
      publicId,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      department: formData.department,
      serviceType: formData.serviceType,
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      location: formData.location.trim(),
      notes: formData.notes.trim(),
      status: 'CONFIRMED',
      issueId: formData.issueId.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Direct client-side insert into Supabase
      const directResult = await saveAppointmentToSupabase(newAppointment);

      // 2. Also record through server endpoint for database resilience and local caching
      const serverResult = await api.bookAppointment({
        ...newAppointment,
        syncedToSupabase: directResult.success,
      });

      const confirmedAppointment = serverResult.appointment || {
        ...newAppointment,
        id: directResult.data?.id || `apt-${Date.now()}`,
        syncedToSupabase: directResult.success,
      } as Appointment;

      setBookingSuccess(confirmedAppointment);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Refresh health check in background
      checkHealth();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while booking your appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setBookingSuccess(null);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: DEPARTMENTS[0].name,
      serviceType: SERVICE_TYPES[0],
      appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      appointmentTime: TIME_SLOTS[1],
      location: 'Municipal Civic Center (Main Desk)',
      notes: '',
      issueId: '',
    });
  };

  const filteredAppointments = appointmentsList.filter(apt => {
    const q = searchQuery.toLowerCase();
    return (
      apt.name.toLowerCase().includes(q) ||
      apt.department.toLowerCase().includes(q) ||
      (apt.publicId && apt.publicId.toLowerCase().includes(q)) ||
      apt.serviceType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner: Service Status Notice */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-sky-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Official Municipal Service
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active & Accepting Bookings
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              Direct departmental calendar reservation for citizen consultations and site investigations.
            </div>
          </div>
        </div>

        <button
          onClick={loadAppointments}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
          <span>Sync Schedule</span>
        </button>
      </div>

      {/* Main Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-sky-600 dark:text-sky-400" />
            <span>Civic Appointment Booking</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Book departmental consultations, on-site inspections, or official case hearings with instant automated confirmation.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'book'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Book Appointment
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Bookings ({appointmentsList.length})
          </button>
        </div>
      </div>

      {/* TAB 1: BOOKING FORM */}
      {activeTab === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: The Interactive Form */}
          <div className="lg:col-span-2">
            {bookingSuccess ? (
              /* Success Confirmation Card */
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Appointment Confirmed & Scheduled
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    Appointment Confirmed!
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Your municipal appointment has been scheduled and the official booking record has been registered.
                  </p>
                </div>

                {/* Booking Summary Box */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 font-semibold uppercase">Booking Reference</span>
                    <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {bookingSuccess.publicId || bookingSuccess.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Department</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{bookingSuccess.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Service Type</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{bookingSuccess.serviceType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Date & Time</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{bookingSuccess.appointmentDate} at {bookingSuccess.appointmentTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Location</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{bookingSuccess.location || 'Municipal Center'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Citizen</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{bookingSuccess.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Email</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{bookingSuccess.email}</span>
                    </div>
                  </div>

                  {bookingSuccess.notes && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-slate-400 block font-medium">Meeting Purpose / Notes</span>
                      <p className="text-slate-700 dark:text-slate-300 italic mt-0.5">"{bookingSuccess.notes}"</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleResetForm}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all"
                  >
                    Book Another Appointment
                  </button>
                  <button
                    onClick={() => setActiveTab('list')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all"
                  >
                    View All Bookings
                  </button>
                </div>
              </div>
            ) : (
              /* The Appointment Booking Form */
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Section 1: Citizen Contact */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-sky-600" />
                    <span>1. Citizen Contact Information</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Jane Doe"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. citizen@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +1 (555) 234-5678"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Related Civic Issue ID <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.issueId}
                        onChange={e => setFormData({ ...formData, issueId: e.target.value })}
                        placeholder="e.g. CF-2026-0001"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Department & Service Type */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span>2. Department & Service Type</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Municipal Department <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        {DEPARTMENTS.map(d => (
                          <option key={d.id} value={d.name}>
                            {d.icon} {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Service / Appointment Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.serviceType}
                        onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        {SERVICE_TYPES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Schedule Date & Time Slot */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>3. Date & Time Selection</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Appointment Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.appointmentDate}
                        onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Meeting Location / Office Desk <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Municipal Civic Center (Desk 4B)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Available Time Slots <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setFormData({ ...formData, appointmentTime: slot })}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                            formData.appointmentTime === slot
                              ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20'
                              : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 mx-auto mb-1 opacity-70" />
                          <span>{slot}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 4: Details & Purpose */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>4. Purpose of Meeting / Specific Requirements</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Agenda Notes & Inquiries
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Briefly describe what you would like to discuss with the department officers (e.g. pothole repair progress on Elm Street, drainage easement inspection, streetlight outage recurrence)..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Official departmental calendar slot reservation</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Scheduling Appointment...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Confirm & Schedule Appointment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Informational Sidebar */}
          <div className="space-y-6">
            {/* System Status Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Appointment System
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Live & Active
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Service Status:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online (Accepting Submissions)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Department Sync:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Real-time Automated</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500">Active Bookings:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{appointmentsList.length} Scheduled</span>
                </div>
              </div>
            </div>

            {/* Department Officer Assistance Note */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>What Happens After Booking?</span>
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-sky-600 shrink-0">1.</span>
                  <span>Your booking is immediately confirmed and registered with the respective municipal department.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-sky-600 shrink-0">2.</span>
                  <span>A calendar slot is reserved with the relevant municipal supervisor or field officer.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-sky-600 shrink-0">3.</span>
                  <span>Confirmation is assigned a unique reference code (<code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-800 px-1 rounded">APT-XXXX</code>) for instant check-in.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL BOOKINGS LIST */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by citizen, department, or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={loadAppointments}
                disabled={loadingList}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
                <span>Refresh Bookings</span>
              </button>
              <button
                onClick={() => setActiveTab('book')}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>+ New Appointment</span>
              </button>
            </div>
          </div>

          {loadingList ? (
            <div className="p-16 text-center">
              <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-500">Loading booked appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {searchQuery ? 'No appointments match your search' : 'No appointments scheduled yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Fill out the booking form to schedule an appointment. Your scheduled bookings will appear here.
              </p>
              <button
                onClick={() => setActiveTab('book')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700"
              >
                Book First Appointment
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map(apt => (
                <div
                  key={apt.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-sky-300 dark:hover:border-sky-800 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                        {apt.publicId || apt.id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {apt.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{apt.email}</span>
                        {apt.phone && (
                          <>
                            <span className="text-slate-300 mx-1">•</span>
                            <Phone className="w-3 h-3" />
                            <span>{apt.phone}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {apt.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Confirmed & Scheduled
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Department</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{apt.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Service Type</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{apt.serviceType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Date & Time</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{apt.appointmentDate} • {apt.appointmentTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Location</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{apt.location || 'Civic Center'}</span>
                    </div>
                  </div>

                  {apt.notes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-600 dark:text-slate-400 italic">
                      "{apt.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
