export const getCategoryColors = (category: string) => {
  const colorMap: Record<string, {
    gradient: string;
    bg: string;
    bgLight: string;
    border: string;
    text: string;
  }> = {
    'Entrada': {
      gradient: 'bg-gradient-to-r from-amber-800 to-orange-900',
      bg: 'bg-amber-800',
      bgLight: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-800',
    },
    'Kyrie': {
      gradient: 'bg-gradient-to-r from-blue-900 to-blue-950',
      bg: 'bg-blue-900',
      bgLight: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-900',
    },
    'Gloria': {
      gradient: 'bg-gradient-to-r from-yellow-700 to-amber-700',
      bg: 'bg-yellow-700',
      bgLight: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-700',
    },
    'Santo': {
      gradient: 'bg-gradient-to-r from-orange-800 to-red-900',
      bg: 'bg-orange-800',
      bgLight: 'bg-orange-50',
      border: 'border-orange-300',
      text: 'text-orange-800',
    },
    'Cordero de Dios': {
      gradient: 'bg-gradient-to-r from-amber-900 to-yellow-800',
      bg: 'bg-amber-900',
      bgLight: 'bg-amber-50',
      border: 'border-amber-400',
      text: 'text-amber-900',
    },
    'Credo': {
      gradient: 'bg-gradient-to-r from-blue-800 to-indigo-900',
      bg: 'bg-blue-800',
      bgLight: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-800',
    },
    'Padre Nuestro': {
      gradient: 'bg-gradient-to-r from-cyan-900 to-blue-900',
      bg: 'bg-cyan-900',
      bgLight: 'bg-cyan-50',
      border: 'border-cyan-300',
      text: 'text-cyan-900',
    },
    'Salmo': {
      gradient: 'bg-gradient-to-r from-slate-700 to-blue-800',
      bg: 'bg-slate-700',
      bgLight: 'bg-slate-50',
      border: 'border-slate-300',
      text: 'text-slate-700',
    },
    'Aleluya': {
      gradient: 'bg-gradient-to-r from-teal-700 to-emerald-800',
      bg: 'bg-teal-700',
      bgLight: 'bg-teal-50',
      border: 'border-teal-300',
      text: 'text-teal-700',
    },
    'Post Evangelio': {
      gradient: 'bg-gradient-to-r from-rose-800 to-red-900',
      bg: 'bg-rose-800',
      bgLight: 'bg-rose-50',
      border: 'border-rose-300',
      text: 'text-rose-800',
    },
    'Ofertorio': {
      gradient: 'bg-gradient-to-r from-indigo-800 to-blue-900',
      bg: 'bg-indigo-800',
      bgLight: 'bg-indigo-50',
      border: 'border-indigo-300',
      text: 'text-indigo-800',
    },
    'Comunión': {
      gradient: 'bg-gradient-to-r from-amber-700 to-orange-800',
      bg: 'bg-amber-700',
      bgLight: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-700',
    },
    'Salida': {
      gradient: 'bg-gradient-to-r from-blue-700 to-blue-900',
      bg: 'bg-blue-700',
      bgLight: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-700',
    },
  };

  return colorMap[category] || colorMap['Entrada'];
};

export const getCategoryHeaderGradient = (category: string) => {
  const gradients: Record<string, string> = {
    'Entrada': 'bg-gradient-to-br from-amber-800 to-orange-900',
    'Kyrie': 'bg-gradient-to-br from-blue-900 to-blue-950',
    'Gloria': 'bg-gradient-to-br from-yellow-700 to-amber-700',
    'Santo': 'bg-gradient-to-br from-orange-800 to-red-900',
    'Cordero de Dios': 'bg-gradient-to-br from-amber-900 to-yellow-800',
    'Credo': 'bg-gradient-to-br from-blue-800 to-indigo-900',
    'Padre Nuestro': 'bg-gradient-to-br from-cyan-900 to-blue-900',
    'Salmo': 'bg-gradient-to-br from-slate-700 to-blue-800',
    'Aleluya': 'bg-gradient-to-br from-teal-700 to-emerald-800',
    'Post Evangelio': 'bg-gradient-to-br from-rose-800 to-red-900',
    'Ofertorio': 'bg-gradient-to-br from-indigo-800 to-blue-900',
    'Comunión': 'bg-gradient-to-br from-amber-700 to-orange-800',
    'Salida': 'bg-gradient-to-br from-blue-700 to-blue-900',
  };

  return gradients[category] || gradients['Entrada'];
};