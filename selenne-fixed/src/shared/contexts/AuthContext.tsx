import React, { createContext, useContext, useState, ReactNode } from 'react';
import api, { setTokensFromAuthResponse, clearAuthTokens } from '../../services/api';

export type UserRole = 'Administrador' | 'Empleado' | 'Cliente';

interface User {
  usuarioID: number;
  email: string;
  name?: string;
  role?: UserRole | string;
  telefono?: string;
  direccion?: string;
  documento?: string;
  permisos?: string[];
}

interface AuthContextType {
  user: User | null;
  loginAsync: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  hasPermission: (permiso: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });

  const loginAsync = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.postJson('/api/auth/login', { Email: email, Contrasena: password });
      const data = res?.data || res;
      const token = data?.accessToken || data?.access_token;
      const refresh = data?.refreshToken || data?.refresh_token;
      const userObj = data?.user || data?.usuario || { email };

      if (token) {
        setTokensFromAuthResponse({ accessToken: token, refreshToken: refresh });
      }

      const userData: User = {
        usuarioID: userObj?.UsuarioID || userObj?.usuarioID || 0,
        email: userObj?.Email || userObj?.email || email,
        name: userObj?.NombreCompleto || userObj?.nombreCompleto || userObj?.name || '',
        role: userObj?.Rol || userObj?.rol || userObj?.Role || userObj?.role || 'Cliente',
        telefono: userObj?.Telefono || userObj?.telefono || '',
        direccion: userObj?.Direccion || userObj?.direccion || '',
        documento: userObj?.Documento || userObj?.documento || '',
        permisos: userObj?.Permisos || userObj?.permisos || [],
      };

      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      window.dispatchEvent(new Event('auth:login'));

      // Cargar perfil completo en background
      if (userData.usuarioID) {
        try {
          const perfil = await api.getJson(`/api/usuarios/${userData.usuarioID}`);
          const perfilData = perfil?.data || perfil;
          const updatedUser: User = {
            ...userData,
            telefono: perfilData?.telefono || perfilData?.Telefono || '',
            direccion: perfilData?.direccion || perfilData?.Direccion || '',
            documento: perfilData?.documento || perfilData?.Documento || '',
          };
          setUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        } catch (e) {}
      }

      return true;
    } catch (e) {
      console.warn('loginAsync failed', e);
      return false;
    }
  };

  const refreshUser = async () => {
    if (!user?.usuarioID) return;
    try {
      const perfil = await api.getJson(`/api/usuarios/${user.usuarioID}`);
      const perfilData = perfil?.data || perfil;
      const updatedUser: User = {
        ...user,
        name: perfilData?.nombreCompleto || perfilData?.NombreCompleto || user.name,
        telefono: perfilData?.telefono || perfilData?.Telefono || '',
        direccion: perfilData?.direccion || perfilData?.Direccion || '',
        documento: perfilData?.documento || perfilData?.Documento || '',
      };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('refreshUser failed', e);
    }
  };

  const hasPermission = (permiso: string): boolean => {
    if (!user?.permisos) return false;
    return user.permisos.includes(permiso);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    clearAuthTokens();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loginAsync,
      logout,
      isAuthenticated: !!user,
      refreshUser,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};