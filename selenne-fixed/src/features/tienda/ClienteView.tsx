import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User } from "lucide-react";
import { StoreFooter } from "../../components/StoreFooter";
import { CuponBanner } from "../../components/CuponBanner";
import { TiendaHeader } from "../../components/TiendaHeader";
import { TiendaCatalogo } from "../../components/TiendaCatalogo";
import { useAuth } from "../../shared/contexts/AuthContext";
import { useNotificaciones } from "../../shared/hooks/useNotificaciones";
import type { Categoria } from "../../shared/hooks/useCatalogoFiltrado";
import { CheckoutView } from "./CheckoutView";
import { PerfilView } from "./PerfilView";
import { MensajesClienteView } from "./MensajesClienteView";

type Vista = "home" | "tienda" | "checkout" | "favoritos" | "perfil" | "mensajes";

interface ClienteViewProps {
  onLogout: () => void;
}

export const ClienteView: React.FC<ClienteViewProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const notifHook = useNotificaciones();

  // La categoria vive en la URL (/dashboard/tienda/:categoria), igual que en
  // LandingView; los paneles internos (checkout/perfil/mensajes) quedan como
  // overlay local, todavia no tienen ruta propia.
  const categoriaUrlMatch = location.pathname.match(/^\/dashboard\/tienda\/(hombre|mujer|accesorios|sale)$/);
  const categoriaUrl = categoriaUrlMatch ? (categoriaUrlMatch[1] as Categoria) : undefined;
  const categoriaActiva: Categoria = categoriaUrl ?? "mujer";
  const subInicial = new URLSearchParams(location.search).get("sub") || undefined;
  const [subVista, setSubVista] = useState<"checkout" | "perfil" | "mensajes" | null>(null);
  const vistaActual: Vista = subVista ?? (categoriaUrl ? "tienda" : "home");

  const irATienda = (categoria: Categoria, sub?: string) => {
    navigate(sub ? `/dashboard/tienda/${categoria}?sub=${sub}` : `/dashboard/tienda/${categoria}`);
    window.scrollTo({ top: 0 });
  };

  const [carritoAbierto, setCarritoAbierto] = useState(false);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const heroTitle = user?.name ? `Hola, ${user.name.split(' ')[0]}` : 'District Store';

  const accountSlot = (
    <button
      onClick={() => setSubVista("perfil")}
      className="p-1.5 sm:p-2 hover:bg-[#C9A8C3] dark:hover:bg-[#241935] rounded-full transition-colors"
      aria-label="Mi cuenta"
      title="Mi cuenta"
    >
      <User className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#0A0A0A] dark:text-[#F5F3FA]" />
    </button>
  );

  const mensajesSlot = vistaActual === 'perfil' ? (
    <button
      onClick={() => setSubVista("mensajes")}
      className="p-1.5 sm:p-2 hover:bg-[#C9A8C3] dark:hover:bg-[#241935] rounded-full transition-colors relative"
      title="Mensajes"
    >
      <svg className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#0A0A0A] dark:text-[#F5F3FA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      {notifHook.noLeidas > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#5C2A52] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {notifHook.noLeidas > 9 ? '9+' : notifHook.noLeidas}
        </span>
      )}
    </button>
  ) : undefined;

  return (
    <div className="min-h-screen bg-white dark:bg-[#17101f] flex flex-col">
      <TiendaHeader
        categoriaActiva={categoriaActiva}
        tiendaNavActiva={vistaActual === 'tienda'}
        onIrATienda={irATienda}
        onLogoClick={() => { setSubVista(null); navigate('/dashboard'); window.scrollTo({ top: 0 }); }}
        onCheckout={() => setSubVista('checkout')}
        carritoAbierto={carritoAbierto}
        onCarritoOpenChange={setCarritoAbierto}
        accountSlot={accountSlot}
        searchAreaOverride={mensajesSlot}
      />

      <CuponBanner />

      <main className="flex-1 flex flex-col">
        {vistaActual === "checkout" ? (
          <CheckoutView onBack={() => setSubVista(null)} />
        ) : vistaActual === "perfil" ? (
          <PerfilView onBack={() => setSubVista(null)} onLogout={handleLogout} />
        ) : vistaActual === "mensajes" ? (
          <MensajesClienteView onBack={() => setSubVista(null)} onVerPedidos={() => setSubVista("perfil")} notifHook={notifHook} />
        ) : (
          <TiendaCatalogo
            vista={vistaActual === 'home' ? 'home' : 'tienda'}
            categoriaActiva={categoriaActiva}
            subInicial={subInicial}
            heroTitle={heroTitle}
            onIrATienda={irATienda}
            onAbrirCarrito={() => setCarritoAbierto(true)}
          />
        )}
      </main>

      <StoreFooter onCategoriaChange={irATienda} />
    </div>
  );
};
