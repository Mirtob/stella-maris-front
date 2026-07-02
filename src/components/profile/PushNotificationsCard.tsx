import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import {
  pushSupported, notificationPermission, isPushEnabled,
  enablePush, disablePush, sendTestPush, isIos, isStandalone,
} from '../../services/push';

interface Props {
  /** Parroquias/capillas para las que recibir avisos de "nuevo cantoral". */
  parishes: string[];
  /** Rol efectivo (el Coro recibe además el recordatorio de "publica el cantoral"). */
  role?: string;
}

/**
 * Tarjeta de Ajustes para activar/desactivar las notificaciones push del dispositivo
 * (celebraciones próximas + nuevo cantoral de tu parroquia). En iOS avisa que hay que
 * instalar la PWA en la pantalla de inicio.
 */
export function PushNotificationsCard({ parishes, role }: Props) {
  const supported = pushSupported();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [perm, setPerm] = useState(notificationPermission());

  const iosNeedsInstall = isIos() && !isStandalone();

  useEffect(() => {
    if (supported) isPushEnabled().then(setEnabled);
  }, [supported]);

  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    if (testing) return;
    setTesting(true);
    try {
      const r = await sendTestPush();
      if (r.ok) {
        toast.success('Notificación de prueba enviada', {
          description: 'Debería aparecer en tu teléfono en unos segundos.',
        });
      } else if (r.reason === 'no-subscription') {
        toast.error('No hay suscripción en este dispositivo', { description: 'Vuelve a activar las notificaciones.' });
      } else {
        toast.error('No se pudo enviar la prueba', { description: 'Revisa el permiso de notificaciones y reintenta.' });
      }
    } finally {
      setTesting(false);
    }
  };

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (enabled) {
        await disablePush();
        setEnabled(false);
        toast.success('Notificaciones desactivadas en este dispositivo');
      } else {
        const r = await enablePush(parishes, role);
        setPerm(notificationPermission());
        if (r.ok) {
          setEnabled(true);
          toast.success('¡Notificaciones activadas!', {
            description: 'Te enviamos una de prueba para confirmar.',
          });
        } else if (r.reason === 'denied') {
          toast.error('Permiso bloqueado', {
            description: 'Habilita las notificaciones para este sitio en los ajustes del navegador.',
          });
        } else if (r.reason === 'unsupported') {
          toast.error('Tu navegador no admite notificaciones push.');
        } else {
          toast.error('No se pudo activar', { description: 'Intenta de nuevo.' });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-200 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
          {enabled ? <Bell className="w-7 h-7 text-white" strokeWidth={2.5} /> : <BellOff className="w-7 h-7 text-white" strokeWidth={2.5} />}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notificaciones</h2>
          <p className="text-sm text-gray-600">Avisos al teléfono, aunque la app esté cerrada</p>
        </div>
      </div>

      <p className="text-base text-gray-700 mb-4">
        Recibe un aviso cuando se acerca una <strong>celebración</strong> y cuando se
        publica un <strong>nuevo cantoral</strong> de tu parroquia.
      </p>

      {!supported ? (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-sm text-gray-600">
          Este navegador no admite notificaciones push.
        </div>
      ) : iosNeedsInstall ? (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex gap-3">
          <Smartphone className="w-6 h-6 text-blue-600 flex-shrink-0" strokeWidth={2.5} />
          <p className="text-sm text-blue-900">
            En iPhone/iPad, primero <strong>instala la app</strong>: toca «Compartir» →
            «Agregar a inicio». Luego ábrela desde el ícono para activar las notificaciones.
          </p>
        </div>
      ) : (
        <button
          onClick={toggle}
          disabled={busy || perm === 'denied'}
          className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow font-bold text-white disabled:opacity-60 ${
            enabled ? 'bg-gradient-to-br from-gray-500 to-gray-700' : 'bg-gradient-to-br from-amber-500 to-orange-600'
          }`}
        >
          {busy ? <Loader className="w-5 h-5 animate-spin" /> : enabled ? <BellOff className="w-5 h-5" strokeWidth={2.5} /> : <Bell className="w-5 h-5" strokeWidth={2.5} />}
          {busy ? 'Un momento…' : enabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
        </button>
      )}

      {enabled && supported && !iosNeedsInstall && (
        <button
          onClick={handleTest}
          disabled={testing}
          className="w-full mt-2 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all font-bold text-amber-700 bg-amber-50 border-2 border-amber-200 disabled:opacity-60"
        >
          {testing ? <Loader className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" strokeWidth={2.5} />}
          {testing ? 'Enviando…' : 'Enviar notificación de prueba'}
        </button>
      )}

      {perm === 'denied' && supported && !iosNeedsInstall && (
        <p className="text-xs text-red-600 mt-2">
          Están bloqueadas en el navegador. Habilítalas para este sitio en los ajustes del navegador y recarga.
        </p>
      )}
    </div>
  );
}
