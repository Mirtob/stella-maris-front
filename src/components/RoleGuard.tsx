import { ReactNode } from 'react';

interface RoleGuardProps {
  /** Whether the current user has access to the protected content. */
  allowed: boolean;
  children: ReactNode;
  /** Shown in the denial screen — explain who can access this area. */
  message: string;
  /** Bullet-point description of what the protected area does. */
  details: string;
  buttonLabel?: string;
  /** View to navigate to when the user taps the button. */
  backView?: string;
  navigate: (view: string) => void;
}

/**
 * RoleGuard — renders `children` when `allowed` is true,
 * otherwise shows an "Acceso Denegado" screen.
 *
 * Migration note: maps directly to React Router's <ProtectedRoute> pattern:
 *   <Route element={<RoleGuard allowed={role === 'Admin'} ...><AdminDashboard /></RoleGuard>} />
 */
export function RoleGuard({
  allowed,
  children,
  message,
  details,
  buttonLabel = 'Volver al Inicio',
  backView = 'main',
  navigate,
}: RoleGuardProps) {
  if (allowed) return <>{children}</>;

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-gradient-to-br from-red-100 via-red-50 to-orange-100 dark:from-slate-900 dark:via-red-950 dark:to-red-950 transition-colors flex items-center justify-center">
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-4 border-red-500 dark:border-red-600 shadow-2xl text-center">
        <div className="text-8xl mb-6">🔒</div>
        <h1 className="text-3xl font-bold text-red-900 dark:text-red-100 mb-4">
          Acceso Denegado
        </h1>
        <p className="text-xl text-red-800 dark:text-red-200 mb-6">{message}</p>
        <p className="text-lg text-red-700 dark:text-red-300 mb-8 whitespace-pre-line">{details}</p>
        <button
          onClick={() => navigate(backView)}
          className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-4 px-8 rounded-2xl text-xl font-bold hover:shadow-xl active:scale-95 transition-all border-2 border-blue-800"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
