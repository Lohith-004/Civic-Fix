import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Appointment } from '../src/types';

dotenv.config();

export const SUPABASE_PROJECT_ID = 'rfsbpzoybjclruxfvtun';
export const SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_IOuJyAMi_AL2ATUNif3NNQ_yovhzrIY';

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const SUPABASE_SETUP_SQL = `-- CivicFix Appointments Table Schema for Supabase (Project: ${SUPABASE_PROJECT_ID})
-- Run this in your Supabase Dashboard SQL Editor if the table does not exist:

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

export async function checkServerSupabaseHealth(): Promise<{
  connected: boolean;
  tableExists: boolean;
  projectId: string;
  url: string;
  error?: string;
  errorMessage?: string;
}> {
  try {
    const { data, error, status } = await supabaseServer
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
          errorMessage: "Supabase connection is valid, but 'public.appointments' table has not been created yet.",
        };
      }
      return {
        connected: false,
        tableExists: false,
        projectId: SUPABASE_PROJECT_ID,
        url: SUPABASE_URL,
        error: error.code,
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
      error: 'NETWORK_ERROR',
      errorMessage: err?.message || 'Could not connect to Supabase server',
    };
  }
}

export async function syncAppointmentToSupabase(appointment: Appointment): Promise<{
  synced: boolean;
  data?: any;
  error?: string;
  isTableMissing?: boolean;
}> {
  try {
    const payload = {
      public_id: appointment.publicId,
      name: appointment.name,
      email: appointment.email,
      phone: appointment.phone || '',
      department: appointment.department,
      service_type: appointment.serviceType,
      appointment_date: appointment.appointmentDate,
      appointment_time: appointment.appointmentTime,
      location: appointment.location || '',
      notes: appointment.notes || '',
      status: appointment.status,
      issue_id: appointment.issueId || null,
      created_at: appointment.createdAt,
    };

    const { data, error, status } = await supabaseServer
      .from('appointments')
      .insert([payload])
      .select()
      .single();

    if (error) {
      const isMissing = error.code === 'PGRST205' || error.message?.includes('not find the table') || status === 404;
      return {
        synced: false,
        error: error.message,
        isTableMissing: isMissing,
      };
    }

    return {
      synced: true,
      data,
    };
  } catch (err: any) {
    return {
      synced: false,
      error: err?.message || 'Error executing Supabase insert',
    };
  }
}

export async function fetchServerSupabaseAppointments(): Promise<Appointment[]> {
  try {
    const { data, error } = await supabaseServer
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row: any) => ({
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
  } catch {
    return [];
  }
}
