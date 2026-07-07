import { getSupabaseClient } from './supabaseClient';

export interface ChoirContact {
  choirName: string;
  parish: string;
  email: string;
  phone: string;
  notes: string;
}

export const EMPTY_CHOIR_CONTACT: ChoirContact = { choirName: '', parish: '', email: '', phone: '', notes: '' };

/** Ficha de contacto del coro (propia). */
export async function getMyChoirContact(userId: string): Promise<ChoirContact | null> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('choir_contacts')
      .select('choir_name, parish, email, phone, notes')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      choirName: data.choir_name || '',
      parish: data.parish || '',
      email: data.email || '',
      phone: data.phone || '',
      notes: data.notes || '',
    };
  } catch {
    return null;
  }
}

export async function saveChoirContact(userId: string, c: ChoirContact): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from('choir_contacts').upsert({
      user_id: userId,
      choir_name: c.choirName.trim() || null,
      parish: c.parish.trim() || null,
      email: c.email.trim() || null,
      phone: c.phone.trim() || null,
      notes: c.notes.trim() || null,
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo guardar el contacto' };
  }
}

/** Directorio: contactos de todos los coros (para intercambiar datos/partituras). */
export async function listChoirContacts(): Promise<(ChoirContact & { userId: string })[]> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('choir_contacts')
      .select('user_id, choir_name, parish, email, phone, notes')
      .order('choir_name', { ascending: true });
    if (error || !data) return [];
    return data.map((d: any) => ({
      userId: d.user_id,
      choirName: d.choir_name || '',
      parish: d.parish || '',
      email: d.email || '',
      phone: d.phone || '',
      notes: d.notes || '',
    }));
  } catch {
    return [];
  }
}
