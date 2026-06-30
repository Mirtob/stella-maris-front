import { ExternalLink, RefreshCw, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { Song } from '../../types';

interface AdminUploadSongProps {
  onSongUploaded?: (song: Song) => void;
}

/**
 * Admin Upload Song — panel informativo.
 *
 * El upload directo desde la app (YouTube Data API + Drive API) está deshabilitado
 * por seguridad: requería exponer el provider_token de Google OAuth en el cliente,
 * lo que permitía a un atacante con XSS tomar control de la cuenta de Google de la
 * app durante una hora.
 *
 * Flujo recomendado actual:
 *   1. Subir el video a YouTube Studio (cuenta stellamarismusicacatolica@gmail.com)
 *      con el bloque STELLA_MARIS_META en la descripción.
 *   2. Subir la partitura (si aplica) a la carpeta de Google Drive.
 *   3. En la app: Panel Admin → "Sincronizar YouTube" → "Sincronizar ahora".
 *
 * TODO post-demo: reactivar uploads desde la app usando un endpoint Vercel que
 * autentique con una Google service account (no con el OAuth del usuario).
 */
export function AdminUploadSong({ onSongUploaded }: AdminUploadSongProps) {
  void onSongUploaded; // prop reservada para el futuro refactor a backend

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border-4 border-amber-400 dark:border-amber-700">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 dark:text-amber-300" strokeWidth={2.5} />
        </div>
        <div className="flex-1 pt-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Subida directa deshabilitada
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1">
            Por seguridad, la app no maneja tokens de Google con permisos de
            subida. Usa el flujo manual de tres pasos.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        <Step
          number={1}
          title="Subir a YouTube Studio"
          description="Cuenta stellamarismusicacatolica@gmail.com. Incluir el bloque STELLA_MARIS_META en la descripción del video."
          action={{ label: 'Abrir YouTube Studio', href: 'https://studio.youtube.com' }}
        />
        <Step
          number={2}
          title="Subir partitura a Google Drive"
          description="(Opcional). Carpeta de partituras compartida con la app. La sincronización las matchea automáticamente por nombre."
          action={{ label: 'Abrir Google Drive', href: 'https://drive.google.com' }}
        />
        <Step
          number={3}
          title="Sincronizar el catálogo"
          description="En el panel admin: Sincronizar YouTube → Sincronizar ahora. La app detecta los videos nuevos y los inserta en Supabase."
          icon={<RefreshCw className="w-5 h-5" />}
        />
      </div>

      {/* Note */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-brand-border rounded-2xl p-4 flex gap-3">
        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-brand-ink-soft mb-1">
            ¿Por qué este cambio?
          </p>
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            Mover los uploads a un endpoint de backend con cuenta de servicio
            está agendado para después de la demo (vulnerabilidad S4 del audit
            de seguridad). Mientras tanto, este flujo no expone tokens.
          </p>
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  description: string;
  action?: { label: string; href: string };
  icon?: React.ReactNode;
}

function Step({ number, title, description, action, icon }: StepProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-brand to-brand-strong text-white rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-base sm:text-lg shadow-md border-2 border-brand-border">
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {description}
          </p>
          {action && (
            <a
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
            >
              {action.label}
              <ExternalLink className="w-4 h-4" />
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
