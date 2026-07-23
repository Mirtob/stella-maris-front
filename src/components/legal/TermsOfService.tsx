import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

/**
 * Términos de Uso de Stella Maris.
 * Última revisión: 10 de junio de 2026.
 *
 * Redactado conforme a la Ley 19.628 sobre Protección de Datos de Carácter
 * Personal de Chile. Contempla que la app gestiona datos sensibles
 * (orientación religiosa / participación en parroquias) bajo el art. 10.
 */
export function TermsOfService({ onBack }: TermsOfServiceProps) {
  return (
    <div className="w-full max-w-md md:max-w-3xl mx-auto min-h-screen p-4 sm:p-6 pb-24 bg-gradient-to-br from-amber-50 via-amber-50 to-orange-50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950 transition-colors">
      <div className="pt-12 sm:pt-16">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-blue-900 dark:text-blue-200 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Volver</span>
        </button>

        <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-5 sm:p-8 border-2 border-amber-200 dark:border-amber-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink mb-2">
            Términos de Uso
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            Versión 1.0 — última revisión: 10 de junio de 2026
          </p>

          <section className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">1. Quiénes somos</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Stella Maris (la <strong>"Aplicación"</strong>) es una plataforma web progresiva (PWA) que asiste a coros parroquiales católicos en la preparación, publicación y difusión de cantorales litúrgicos. La Aplicación es operada por <strong>Stella Maris Música Católica</strong> (en adelante, <strong>"nosotros"</strong>).
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">2. Aceptación de los términos</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Al iniciar sesión y completar tu perfil, declarás haber leído, comprendido y aceptado estos Términos de Uso y nuestra Política de Privacidad. Si no estás de acuerdo, te pedimos no usar la Aplicación.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">3. Uso permitido</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">La Aplicación se ofrece para:</p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-200 leading-relaxed">
              <li>Coros: armar, publicar y compartir cantorales para la celebración de la Santa Misa.</li>
              <li>Pueblo fiel: visualizar cantorales publicados por la parroquia a la que pertenezcan o asistan.</li>
              <li>Administradores: gestionar el catálogo de cantos, usuarios y parroquias.</li>
            </ul>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed mt-3">Te comprometés a:</p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-200 leading-relaxed">
              <li>Usar la Aplicación con respeto a la liturgia y a otros usuarios.</li>
              <li>No publicar contenido ofensivo, ilegal o que infrinja derechos de terceros.</li>
              <li>No intentar acceder a cantorales o datos de parroquias a las que no perteneces.</li>
              <li>No realizar ingeniería inversa, scraping masivo, ataques de denegación de servicio ni intentar burlar las medidas de seguridad.</li>
            </ul>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">4. Cuentas y autenticación</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              La Aplicación utiliza autenticación OAuth 2.0 con Google. Eres responsable de mantener la seguridad de tu cuenta de Google. No nos hacemos responsables por accesos no autorizados que resulten del compromiso de tu cuenta de Google.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">5. Contenido</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Los videos del catálogo de cantos son embebidos desde el canal oficial de YouTube. Las letras y partituras pueden ser de dominio público, propias o utilizadas bajo licencia. Si consideras que algún canto infringe tus derechos de autor, escríbenos para retirarlo.
            </p>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Los cantorales que publicas como parte de un coro siguen siendo tuyos. Al publicarlos, nos concedes una licencia limitada y revocable para mostrarlos en la Aplicación a los miembros del pueblo fiel de tu parroquia.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">6. Datos personales y sensibles</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              La Aplicación recolecta datos personales (email, nombre, parroquia de pertenencia) que incluyen información sobre tu afiliación religiosa. Conforme a la Ley 19.628, estos datos son considerados <strong>datos sensibles</strong> y requieren tu consentimiento expreso.
            </p>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Tu aceptación de estos Términos al registrarte constituye dicho consentimiento. Puedes conocer en detalle qué datos recolectamos, para qué los usamos y cómo ejercer tus derechos ARCO (acceso, rectificación, cancelación, oposición) en nuestra Política de Privacidad.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">7. Disponibilidad del servicio</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Hacemos lo posible por mantener la Aplicación disponible 24/7, pero no garantizamos un nivel de servicio (SLA). Pueden ocurrir interrupciones por mantenimiento, fallas técnicas o de terceros (Supabase, Vercel, Google). En tal caso, no nos hacemos responsables de pérdidas indirectas.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">8. Modificaciones</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Podemos modificar estos Términos. Te notificaremos en la Aplicación cuando ocurra. El uso continuado tras la notificación implica aceptación.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">9. Terminación</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Puedes cerrar tu cuenta en cualquier momento desde "Configuración" o cerrando sesión y solicitando la eliminación de tu perfil. Podemos suspender o cerrar cuentas que infrinjan estos Términos.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">10. Limitación de responsabilidad</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              La Aplicación se ofrece "como está". No nos hacemos responsables por:
            </p>
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-200 leading-relaxed">
              <li>Pérdida de cantorales por fallas técnicas o del usuario.</li>
              <li>Errores en partituras, letras o asignación litúrgica.</li>
              <li>Decisiones de los párrocos o coros respecto a los cantos a usar en la Misa.</li>
              <li>Interrupciones del servicio o pérdida de acceso por causas ajenas (Google, ISP, etc.).</li>
            </ul>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">11. Ley aplicable y jurisdicción</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Estos Términos se rigen por las leyes de la República de Chile. Cualquier controversia será sometida a los tribunales ordinarios de justicia con asiento en Santiago de Chile.
            </p>

            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3">12. Contacto</h2>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Por cualquier consulta sobre estos Términos, puedes escribirnos a <a href="mailto:stellamarismusicacatolica@gmail.com" className="text-blue-700 dark:text-blue-300 underline">stellamarismusicacatolica@gmail.com</a>.
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
