import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  showLogo?: boolean;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, showLogo = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-3 sm:px-4 text-center">
      {/* Logo opcional de Stella Maris */}
      {showLogo && (
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-8">
          <div className="absolute inset-0 rounded-full animate-pulse opacity-20 bg-gradient-to-br from-blue-400 via-yellow-400 to-blue-600 blur-2xl"></div>
          
          <div className="w-full h-full rounded-full overflow-hidden relative z-10">
            <img
              src={logoStellaMaris}
              alt="Logo Stella Maris"
              className="w-full h-full object-cover drop-shadow-2xl"
            />
          </div>
        </div>
      )}
      
      {/* Animated Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
        <div className="relative text-8xl sm:text-9xl animate-bounce" style={{ animationDuration: '3s' }}>
          {icon}
        </div>
      </div>
      
      {/* Content */}
      <h3 className="text-2xl sm:text-lg sm:text-2xl font-bold text-blue-950 dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-lg sm:text-xl text-blue-900 dark:text-blue-100 max-w-md mb-6">
        {description}
      </p>
      
      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-gradient-to-br from-blue-900 to-blue-950 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-lg hover:shadow-2xl active:scale-95 transition-all border-2 border-blue-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}