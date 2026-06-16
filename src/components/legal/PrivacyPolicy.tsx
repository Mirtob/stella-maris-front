import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

/**
 * Política de Privacidad de Stella Maris.
 * Última revisión: 10 de junio de 2026.
 *
 * Cumple Ley 19.628 (Chile) - Protección de Datos de Carácter Personal.
 * Contempla datos sensibles religiosos según art. 10.
 */
export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="w-full max-w-md md:max-w-3xl mx-auto min-h-screen p-3 sm:p-6 pb-24 bg-gradient-to-br from-amber-50 via-amber-50 to-orange-50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950 transition-colors">
      <div className="pt-12 sm:pt-16">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-blue-900 dark:text-blue-200 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Volver</span>
        </button>

        <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-5 sm:p-8 border-2 border-amber-200 dark:border-amber-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-950 dark:text-white mb-2">
            Política de Privacidad
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            Versión 1.0 — última revisión: 10 de junio de 2026
          </p>

          <section className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">

            <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 dark:border-amber-600 p-4 mb-6 rounded-r-lg">
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm">
                <strong>Resumen rápido:</strong> recolectamos tu email, nombre y parroquia para que puedas armar o ver cantorales. No los compartimos con terceros con fines publicitarios. Puedes pedir borrar tu cuenta en cualquier momento.
              </p>
            </div>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">1. Quién es el responsable de tus datos</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              <strong>Stella Maris Música Católica</strong>, con sede en Santiago de Chile. Contacto: <a href="mailto:stellamarismusicacatolica@gmail.com" className="text-blue-700 dark:text-blue-300 underline">stellamarismusicacatolica@gmail.com</a>.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">2. Qué datos recolectamos</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">Al registrarte y usar la Aplicación recolectamos:</p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-200 leading-relaxed">
              <li><strong>Datos de tu cuenta de Google:</strong> email, nombre completo y foto de perfil (visible públicamente en tu cuenta).</li>
              <li><strong>Datos de tu perfil en la Aplicación:</strong> rol elegido (Coro / Pueblo fiel / Administrador), parroquia(s) seleccionada(s) e instrumento(s) (si eres parte de un coro).</li>
              <li><strong>Datos de actividad:</strong> cantorales que publicas (si eres coro), cantos que agregas, fecha de tu último acceso.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, modelo de dispositivo (solo para diagnosticar errores).</li>
            </ul>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">3. Datos sensibles</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Conforme a la <strong>Ley 19.628, art. 10</strong>, tu afiliación parroquial es considerada un <strong>dato sensible</strong> porque revela orientación religiosa. Para su tratamiento contamos con:
            </p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-200 leading-relaxed">
              <li><strong>Tu consentimiento expreso</strong>, otorgado al aceptar estos Términos al registrarte.</li>
              <li>Una finalidad específica: que puedas ver y compartir cantorales con tu comunidad parroquial.</li>
              <li>Medidas de seguridad reforzadas (cifrado en reposo y en tránsito).</li>
            </ul>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">4. Para qué usamos tus datos</h2>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-200 leading-relaxed">
              <li>Identificarte al iniciar sesión.</li>
              <li>Permitirte ver los cantorales de tu parroquia (o todos, si eres administrador).</li>
              <li>Permitirte armar y publicar cantorales (si eres coro).</li>
              <li>Notificarte cuando hay un cantoral nuevo de tu parroquia.</li>
              <li>Diagnosticar errores técnicos (sin asociar la información a tu identidad personal cuando es posible).</li>
            </ul>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed mt-3">
              <strong>NO usamos tus datos para:</strong> enviarte publicidad, perfilar tus creencias, venderlos a terceros, ni cederlos a corredores de datos.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">5. Con quién compartimos tus datos</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">Para que la Aplicación funcione, tus datos son procesados por:</p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-200 leading-relaxed">
              <li><strong>Supabase (servidor de base de datos):</strong> almacena tu perfil y los cantorales.</li>
              <li><strong>Vercel (hosting):</strong> sirve la aplicación.</li>
              <li><strong>Google (autenticación):</strong> verifica tu identidad al iniciar sesión.</li>
              <li><strong>YouTube (reproducción de videos):</strong> los cantos son embebidos desde el canal público de la app. YouTube puede recolectar datos de uso del reproductor según su propia política.</li>
              <li><strong>Sentry (monitoreo, solo errores anonimizados):</strong> nos avisa cuando algo falla en producción.</li>
            </ul>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed mt-3">
              No transferimos tus datos a terceros con fines comerciales ni los vendemos.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">6. Transferencias internacionales</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Algunos proveedores (Supabase, Vercel, Google) tienen servidores fuera de Chile (principalmente en Estados Unidos). Al usar la Aplicación, autorizás dicha transferencia. Estos proveedores tienen estándares de seguridad equivalentes o superiores a los chilenos.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">7. Tiempo de conservación</h2>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-200 leading-relaxed">
              <li><strong>Mientras tengas cuenta activa:</strong> conservamos tu perfil completo.</li>
              <li><strong>Cantorales publicados:</strong> conservados indefinidamente para uso histórico de la parroquia, salvo solicitud de eliminación.</li>
              <li><strong>Datos técnicos / logs:</strong> 90 días.</li>
              <li><strong>Backups:</strong> 7 días en Supabase (recuperación ante incidentes).</li>
              <li><strong>Tras eliminar tu cuenta:</strong> 30 días para recuperación, luego borrado definitivo.</li>
            </ul>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">8. Tus derechos (ARCO)</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">Conforme a la Ley 19.628, tienes derecho a:</p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-200 leading-relaxed">
              <li><strong>Acceso:</strong> saber qué datos tuyos guardamos.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
              <li><strong>Cancelación:</strong> pedir que borremos tus datos.</li>
              <li><strong>Oposición:</strong> oponerte al uso de tus datos para fines distintos de los originales.</li>
            </ul>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed mt-3">
              Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:stellamarismusicacatolica@gmail.com" className="text-blue-700 dark:text-blue-300 underline">stellamarismusicacatolica@gmail.com</a> desde el email asociado a tu cuenta. Respondemos en máximo 15 días hábiles.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">9. Cookies y almacenamiento local</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              La Aplicación usa <strong>localStorage del navegador</strong> para guardar tu sesión, preferencias (modo oscuro) y tu cantoral en progreso. No usamos cookies de seguimiento publicitario. YouTube puede usar sus propias cookies al reproducir un video.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">10. Menores de edad</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              La Aplicación no está dirigida a menores de 13 años. Si eres menor de 18, te recomendamos que un adulto responsable revise estos términos contigo.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">11. Seguridad</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Aplicamos medidas técnicas y organizativas: cifrado HTTPS, autenticación OAuth 2.0, Row Level Security en la base de datos, rate limiting, Content Security Policy y monitoreo de errores. Sin embargo, ningún sistema es 100% invulnerable. Si detectamos una violación de seguridad que pueda afectarte, te notificaremos dentro de las 72 horas.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">12. Cambios a esta política</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Podemos modificar esta Política para reflejar cambios en la Aplicación o en la legislación. Te notificaremos los cambios sustanciales con al menos 15 días de anticipación.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">13. Reclamos</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Si consideras que vulneramos tus derechos, puedes escribirnos primero a nosotros. Si no recibes respuesta satisfactoria, puedes presentar un reclamo ante el <strong>Consejo para la Transparencia</strong> (Chile) o iniciar acciones judiciales conforme a la Ley 19.628.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">14. Contacto</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Email del responsable de datos: <a href="mailto:stellamarismusicacatolica@gmail.com" className="text-blue-700 dark:text-blue-300 underline">stellamarismusicacatolica@gmail.com</a>.
            </p>
          </section>
        </article>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Documento legalmente vinculante. Imprimible y exportable a PDF desde el menú del navegador.
        </p>
      </div>
    </div>
  );
}
