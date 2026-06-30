import { useState } from 'react';
import { X, KeyRound, Mail, Loader, Check } from 'lucide-react';
import { toast } from 'sonner';
import { requestPasswordReset, confirmPasswordReset } from '../../services/passwordRecovery';

interface ForgotPasswordProps {
  onClose: () => void;
}

export function ForgotPassword({ onClose }: ForgotPasswordProps) {
  const [step, setStep] = useState<'request' | 'code' | 'done'>('request');
  const [username, setUsername] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [maskedTo, setMaskedTo] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async () => {
    const u = username.trim().toLowerCase();
    if (!u) { toast.error('Escribe tu usuario'); return; }
    if (needsEmail && !email.trim()) { toast.error('Escribe un correo para enviarte el código'); return; }
    setSubmitting(true);
    const r = await requestPasswordReset(u, needsEmail ? email.trim() : undefined);
    setSubmitting(false);
    if (!r.ok) { toast.error('No se pudo enviar', { description: r.error }); return; }
    if (r.needsEmail) {
      setNeedsEmail(true);
      toast.info('No tienes correo de recuperación. Ingresa uno para enviarte el código.');
      return;
    }
    setMaskedTo(r.to || 'tu correo');
    setStep('code');
    toast.success(`Código enviado a ${r.to || 'tu correo'}`);
  };

  const handleConfirm = async () => {
    if (!/^\d{6}$/.test(code.trim())) { toast.error('El código son 6 dígitos'); return; }
    if (newPassword.length < 6) { toast.error('La clave debe tener al menos 6 caracteres'); return; }
    setSubmitting(true);
    const r = await confirmPasswordReset(username.trim().toLowerCase(), code.trim(), newPassword);
    setSubmitting(false);
    if (!r.ok) { toast.error('No se pudo cambiar', { description: r.error }); return; }
    setStep('done');
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-4 border-brand-border" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-brand to-brand-strong text-white p-5 flex items-center justify-between border-b-4 border-brand-border">
          <div className="flex items-center gap-3 min-w-0">
            <KeyRound className="w-7 h-7 flex-shrink-0" strokeWidth={2.5} />
            <h2 className="text-xl font-bold min-w-0">Recuperar clave</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0">
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6">
          {step === 'request' && (
            <>
              <p className="text-base text-gray-700 dark:text-gray-200 mb-4">
                Escribe tu usuario. Te enviaremos un código a tu correo de recuperación.
              </p>
              <label className="text-base text-gray-600 dark:text-gray-300 mb-1 block">Usuario</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" placeholder="usuario" className={`${inputCls} mb-3`} disabled={needsEmail} />
              {needsEmail && (
                <>
                  <label className="text-base text-gray-600 dark:text-gray-300 mb-1 block">Correo para enviarte el código</label>
                  <div className="relative mb-3">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoCapitalize="none" placeholder="tucorreo@ejemplo.com" className={`${inputCls} pl-10`} />
                  </div>
                </>
              )}
              <button onClick={handleRequest} disabled={submitting} className="w-full bg-gradient-to-br from-blue-700 to-blue-900 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all font-bold disabled:opacity-50">
                {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />}
                {submitting ? 'Enviando...' : 'Enviar código'}
              </button>
            </>
          )}

          {step === 'code' && (
            <>
              <p className="text-base text-gray-700 dark:text-gray-200 mb-4">
                Enviamos un código de 6 dígitos a <strong>{maskedTo}</strong>. Escríbelo y elige tu nueva clave.
              </p>
              <label className="text-base text-gray-600 dark:text-gray-300 mb-1 block">Código</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="123456" className={`${inputCls} mb-3 tracking-widest`} />
              <label className="text-base text-gray-600 dark:text-gray-300 mb-1 block">Nueva clave</label>
              <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Nueva clave" className={`${inputCls} mb-4`} />
              <button onClick={handleConfirm} disabled={submitting} className="w-full bg-gradient-to-br from-blue-700 to-blue-900 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all font-bold disabled:opacity-50">
                {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />}
                {submitting ? 'Cambiando...' : 'Cambiar clave'}
              </button>
              <button onClick={handleRequest} disabled={submitting} className="w-full mt-2 text-sm text-blue-700 dark:text-blue-300 hover:underline">
                Reenviar código
              </button>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-9 h-9 text-green-600" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">¡Clave cambiada!</h3>
              <p className="text-base text-gray-700 dark:text-gray-200 mb-4">Ya puedes entrar con tu usuario y tu nueva clave.</p>
              <button onClick={onClose} className="w-full bg-gradient-to-br from-blue-700 to-blue-900 text-white py-3 px-4 rounded-xl font-bold active:scale-95 transition-all">
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
