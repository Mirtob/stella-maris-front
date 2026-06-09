import { getSupabaseClient } from './supabaseClient';

export interface ParishActivity {
  parishName: string;
  userCount: number;
  publishedCount: number;
}

/**
 * Devuelve las parroquias con actividad real en la app, agregando:
 *   - cuántos usuarios la tienen como parish_name en user_profiles
 *   - cuántos cantorales publicados existen para esa parroquia
 *
 * Para Admin solamente — la combinación de tablas no expone datos sensibles
 * (solo nombres de parroquia + contadores agregados).
 */
export async function listActiveParishes(): Promise<ParishActivity[]> {
  try {
    const sb = getSupabaseClient();

    const [profilesResp, cantoralsResp] = await Promise.all([
      sb.from('user_profiles').select('parish_name'),
      sb.from('published_cantorals').select('parish_name'),
    ]);

    const counts = new Map<string, ParishActivity>();

    const bump = (name: string | null | undefined, field: 'userCount' | 'publishedCount') => {
      if (!name) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const existing = counts.get(trimmed) ?? { parishName: trimmed, userCount: 0, publishedCount: 0 };
      existing[field] += 1;
      counts.set(trimmed, existing);
    };

    for (const row of (profilesResp.data ?? []) as { parish_name: string | null }[]) {
      bump(row.parish_name, 'userCount');
    }
    for (const row of (cantoralsResp.data ?? []) as { parish_name: string | null }[]) {
      bump(row.parish_name, 'publishedCount');
    }

    return Array.from(counts.values()).sort((a, b) =>
      (b.userCount + b.publishedCount) - (a.userCount + a.publishedCount)
    );
  } catch (err: any) {
    console.error('Error listando parroquias activas:', err?.message);
    return [];
  }
}
