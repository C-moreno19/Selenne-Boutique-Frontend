import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { apiBase, setTokensFromAuthResponse, clearAuthTokens, getSavedRefreshToken } from '../../services/api';

// Limpia claves de versiones anteriores (localStorage y sessionStorage)
['accessToken', 'refreshToken', 'currentUser', '_selenne_user', '_selenne_rt'].forEach(k => localStorage.removeItem(k));

const USER_KEY = '_selenne_user';

export type UserRole = 'Administrador' | 'Empleado' | 'Cliente';

interface User {
  usuarioID: number;
  email: string;
  name?: string;
  role?: UserRole | string;
  telefono?: string;
  direccion?: string;
  documento?: string;
  ciudad?: string;
  permisos?: string[];
}

interface AuthContextType {
  user: User | null;
  loginAsync: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  refreshUser: () => Promise<void>;
  refreshPermisos: () => Promise<void>;
  hasPermission: (permiso: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [authLoading, setAuthLoading] = useState(true);

  const persistUser = (u: User | null) => {
    if (u) sessionStorage.setItem(USER_KEY, JSON.stringify(u));
    else sessionStorage.removeItem(USER_KEY);
    setUser(u);
  };

  // Al montar la app: restaurar sesión desde el refresh token guardado
  useEffect(() => {
    const restore = async () => {
      const rt = getSavedRefreshToken();
      if (!rt) { setAuthLoading(false); return; }
      try {
        const res = await fetch(`${apiBase}/api/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
          credentials: 'include',
        });
        if (!res.ok) { clearAuthTokens(); persistUser(null); setAuthLoading(false); return; }
        const data = await res.json();
        const newAccess = data?.accessToken || data?.data;
        if (!newAccess) { clearAuthTokens(); persistUser(null); setAuthLoading(false); return; }
        setTokensFromAuthResponse({ accessToken: newAccess, refreshToken: data?.refreshToken || rt });
        // Obtener perfil actualizado con el nuevo token
        try {
          const savedUser: User | null = (() => {
            try { const s = sessionStorage.getItem(USER_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
          })();
          if (savedUser?.usuarioID) {
            const perfil = await api.getJson(`/api/usuarios/${savedUser.usuarioID}`);
            const pd = perfil?.data || perfil;
            persistUser({
              ...savedUser,
              name: pd?.nombreCompleto || pd?.NombreCompleto || savedUser.name,
              telefono: pd?.telefono || pd?.Telefono || '',
              direccion: pd?.direccion || pd?.Direccion || '',
              documento: pd?.documento || pd?.Documento || '',
              ciudad: pd?.ciudad || pd?.Ciudad || '',
              permisos: pd?.permisos || pd?.Permisos || savedUser.permisos || [],
            });
          }
        } catch { /* usa el usuario guardado sin actualizar */ }
        window.dispatchEvent(new Event('auth:login'));
      } catch { clearAuthTokens(); persistUser(null); }
      finally { setAuthLoading(false); }
    };
    restore();
  }, []);

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
        ciudad: userObj?.Ciudad || userObj?.ciudad || '',
        permisos: userObj?.Permisos || userObj?.permisos || [],
      };

      persistUser(userData);
      window.dispatchEvent(new Event('auth:login'));

      if (userData.usuarioID) {
        try {
          const perfil = await api.getJson(`/api/usuarios/${userData.usuarioID}`);
          const perfilData = perfil?.data || perfil;
          const updatedUser: User = {
            ...userData,
            telefono: perfilData?.telefono || perfilData?.Telefono || '',
            direccion: perfilData?.direccion || perfilData?.Direccion || '',
            documento: perfilData?.documento || perfilData?.Documento || '',
            ciudad: perfilData?.ciudad || perfilData?.Ciudad || '',
          };
          persistUser(updatedUser);
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
        ciudad: perfilData?.ciudad || perfilData?.Ciudad || '',
      };
      setUser(updatedUser);
    } catch (e) {
      console.warn('refreshUser failed', e);
    }
  };

  const refreshPermisos = async () => {
    if (!user) return;
    try {
      const res = await api.getJson('/api/auth/permisos');
      const permisos: string[] = res?.data || res || [];
      const updatedUser = { ...user, permisos };
      setUser(updatedUser);
    } catch (e) {
      console.warn('refreshPermisos failed', e);
    }
  };

  const hasPermission = (permiso: string): boolean => {
    if (!user?.permisos) return false;
    return user.permisos.includes(permiso);
  };

  const logout = () => {
    const rt = getSavedRefreshToken();
    if (rt) api.postJson('/api/auth/logout', { refreshToken: rt }).catch(() => {});
    persistUser(null);
    clearAuthTokens();
    window.dispatchEvent(new Event('auth:logout'));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loginAsync,
      logout,
      isAuthenticated: !!user,
      authLoading,
      refreshUser,
      refreshPermisos,
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