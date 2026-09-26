import { createClient } from '@supabase/supabase-js';
import { Appointment } from '../types';

export const SUPABASE_PROJECT_ID = 'rfsbpzoybjclruxfvtun';
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_IOuJyAMi_AL2ATUNif3NNQ_yovhzrIY';

// Initialize the Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const SUPABASE_SETUP_SQL = `-- CivicFix Appointments Table for Supabase (Project: ${SUPABASE_PROJECT_ID})
-- Run this script in your Supabase SQL Editor if the table does not exist yet:

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT NOT NULL,
  service_type TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  appointment_time TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'CONFIRMED',
  issue_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous insert and select so forms work immediately
CREATE POLICY "Allow public insert" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON public.appointments FOR UPDATE USING (true);
`;

export interface SupabaseHealthResult {
  connected: boolean;
  tableExists: boolean;
  projectId: string;
  url: string;
  error?: string;
  errorMessage?: string;
}

/**
 * Checks connection health to Supabase and verifies if the appointments table is ready.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  try {
    const { data, error, status } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('not find the table') || status === 404) {
        return {
          connected: true,
          tableExists: false,
          projectId: SUPABASE_PROJECT_ID,
          url: SUPABASE_URL,
          error: error.code || 'TABLE_NOT_FOUND',
          errorMessage: "Supabase connected successfully, but 'public.appointments' table has not been created yet in the SQL Editor.",
        };
      }
      return {
        connected: false,
        tableExists: false,
        projectId: SUPABASE_PROJECT_ID,
        url: SUPABASE_URL,
        error: error.code || 'UNKNOWN_ERROR',
        errorMessage: error.message,
      };
    }

    return {
      connected: true,
      tableExists: true,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      error: 'CONNECTION_ERROR',
      errorMessage: err?.message || 'Could not reach Supabase endpoint',
    };
  }
}

/**
 * Saves an appointment record directly into Supabase database
 */
export async function saveAppointmentToSupabase(appointment: Partial<Appointment>): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  isTableMissing?: boolean;
}> {
  const payload = {
    public_id: appointment.publicId || `APT-${Date.now().toString(36).toUpperCase()}`,
    name: appointment.name,
    email: appointment.email,
    phone: appointment.phone || '',
    department: appointment.department,
    service_type: appointment.serviceType,
    appointment_date: appointment.appointmentDate,
    appointment_time: appointment.appointmentTime,
    location: appointment.location || '',
    notes: appointment.notes || '',
    status: appointment.status || 'CONFIRMED',
    issue_id: appointment.issueId || null,
    created_at: appointment.createdAt || new Date().toISOString(),
  };

  try {
    const { data, error, status } = await supabase
      .from('appointments')
      .insert([payload])
      .select()
      .single();

    if (error) {
      const isMissing = error.code === 'PGRST205' || error.message?.includes('not find the table') || status === 404;
      return {
        success: false,
        error: error.message,
        isTableMissing: isMissing,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error saving to Supabase',
    };
  }
}

/**
 * Fetches appointments from Supabase
 */
export async function fetchAppointmentsFromSupabase(): Promise<{
  data: Appointment[];
  error?: string;
  isTableMissing?: boolean;
}> {
  try {
    const { data, error, status } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: [],
        error: error.message,
        isTableMissing: error.code === 'PGRST205' || status === 404,
      };
    }

    const appointments: Appointment[] = (data || []).map((row: any) => ({
      id: row.id,
      publicId: row.public_id || `APT-${row.id.slice(0, 8).toUpperCase()}`,
      name: row.name,
      email: row.email,
      phone: row.phone || '',
      department: row.department,
      serviceType: row.service_type,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      location: row.location || '',
      notes: row.notes || '',
      status: row.status || 'CONFIRMED',
      issueId: row.issue_id || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      syncedToSupabase: true,
    }));

    return { data: appointments };
  } catch (err: any) {
    return {
      data: [],
      error: err?.message || 'Failed to fetch appointments from Supabase',
    };
  }
}
