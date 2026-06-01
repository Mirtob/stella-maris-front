import { Users, Search, Edit2, Trash2, Shield, Music, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { UserRole, InstrumentType } from '../types';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  instrument?: InstrumentType;
  parishName?: string;
}

export function ProfileManager() {
  const [users] = useState<User[]>([
    { id: '1', name: 'María García', email: 'maria@ejemplo.com', role: 'Coro', instrument: 'Guitarra', parishName: 'San José' },
    { id: '2', name: 'Juan Pérez', email: 'juan@ejemplo.com', role: 'Pueblo fiel', parishName: 'Santa María' },
    { id: '3', name: 'Pedro Martínez', email: 'pedro@ejemplo.com', role: 'Coro', instrument: 'Órgano', parishName: 'San José' },
    { id: '4', name: 'Ana López', email: 'ana@ejemplo.com', role: 'Admin' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'Todos'>('Todos');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'Todos' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return <Shield className="w-5 h-5" />;
      case 'Coro':
        return <Music className="w-5 h-5" />;
      case 'Pueblo fiel':
        return <UserCircle className="w-5 h-5" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'Coro':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Pueblo fiel':
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50">
      <div className="pt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-lg">
              <Users className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-purple-900 mb-2">Gestión de Usuarios</h1>
          <p className="text-xl text-purple-700">{users.length} usuarios registrados</p>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-4 text-lg border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Role Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['Todos', 'Admin', 'Coro', 'Pueblo fiel'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-5 py-3 rounded-xl text-base font-bold whitespace-nowrap transition-all ${
                  filterRole === role
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300'
                }`}
              >
                {role}
                {role !== 'Todos' && (
                  <span className="ml-2 bg-white/20 px-2 py-1 rounded-lg text-sm">
                    {users.filter(u => u.role === role).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-2xl shadow-lg p-5 border-2 border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{user.name}</h3>
                  <p className="text-base text-gray-600">{user.email}</p>
                </div>
                
                {/* Role Badge */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${getRoleBadgeColor(user.role)}`}>
                  {getRoleIcon(user.role)}
                  <span className="text-sm font-bold">{user.role}</span>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2 mb-4">
                {user.parishName && (
                  <div className="flex items-center gap-2 text-base text-gray-700">
                    <span className="text-lg">⛪</span>
                    <span><strong>Parroquia:</strong> {user.parishName}</span>
                  </div>
                )}
                {user.instrument && (
                  <div className="flex items-center gap-2 text-base text-gray-700">
                    <span className="text-lg">
                      {user.instrument === 'Guitarra' && '🎶'}
                      {user.instrument === 'Órgano' && '🎹'}
                      {user.instrument === 'Coro' && '👥'}
                    </span>
                    <span><strong>Instrumento:</strong> {user.instrument}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-98 transition-all">
                  <Edit2 className="w-5 h-5" />
                  <span className="text-base font-bold">Editar</span>
                </button>
                <button className="flex-1 bg-red-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 active:scale-98 transition-all">
                  <Trash2 className="w-5 h-5" />
                  <span className="text-base font-bold">Eliminar</span>
                </button>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl text-gray-600">No se encontraron usuarios</p>
            </div>
          )}
        </div>

        {/* Add User Button */}
        <button className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all">
          <span className="text-4xl">+</span>
        </button>
      </div>
    </div>
  );
}