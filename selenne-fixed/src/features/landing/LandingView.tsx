import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User, LogIn } from "lucide-react";
import { Button } from "../../components/ui/button";
import { StoreFooter } from "../../components/StoreFooter";
import { CuponBanner } from "../../components/CuponBanner";
import { TiendaHeader } from "../../components/TiendaHeader";
import { TiendaCatalogo } from "../../components/TiendaCatalogo";
import { useAuth } from "../../shared/contexts/AuthContext";
import type { Categoria } from "../../shared/hooks/useCatalogoFiltrado";

const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const GRADIENT = 'linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)';

interface LandingViewProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToCheckout?: () => void;
  onNavigateToLoginForCheckout?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToCheckout,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categoria: categoriaUrl } = useParams<{ categoria?: string }>();
  // La categoria y la vista viven en la URL (/, /tienda/:categoria), no en
  // estado local: asi son compartibles y el back/forward del navegador funciona.
  const categoriaActiva: Categoria = categoriaUrl === "accesorios" || categoriaUrl === "sale" ? categoriaUrl : "mujer";
  const vista: "home" | "tienda" = categoriaUrl ? "tienda" : "home";

  const irATienda = (categoria: Categoria) => {
    navigate(`/tienda/${categoria}`);
    window.scrollTo({ top: 0 });
  };

  const [carritoAbierto, setCarritoAbierto] = useState(false);

  const accountSlot = user ? (
    <button
      onClick={() => navigate('/dashboard')}
      className="p-1.5 sm:p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full transition-colors"
      aria-label="Mi cuenta"
      title={`Mi cuenta (${user.name || user.email})`}
    >
      <User className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#241B22] dark:text-[#F5EDE9]" />
    </button>
  ) : (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onNavigateToLogin}
        className="hidden md:flex items-center gap-1 text-[#241B22] dark:text-[#F5EDE9] hover:text-[#A3395C] hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530]"
        style={{ fontFamily: FONT_SANS }}
      >
        <LogIn className="w-4 h-4" />
        Iniciar Sesión
      </Button>
      <Button
        size="sm"
        onClick={onNavigateToRegister}
        className="hidden md:flex text-white border-0 transition-transform hover:scale-105"
        style={{ fontFamily: FONT_SANS, background: GRADIENT }}
      >
        Registrarse
      </Button>
      <button
        onClick={() => onNavigateToLogin()}
        className="md:hidden p-1.5 sm:p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full transition-colors"
        aria-label="Iniciar sesión"
        title="Iniciar sesión"
      >
        <User className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#241B22] dark:text-[#F5EDE9]" />
      </button>
    </>
  );

  const mobileAuthSlot = user ? (
    <Button
      variant="default"
      className="w-full text-white border-0"
      style={{ background: GRADIENT }}
      onClick={() => navigate('/dashboard')}
    >
      <User className="w-4 h-4 mr-2" />
      Mi cuenta
    </Button>
  ) : (
    <>
      <Button
        variant="default"
        className="w-full text-white border-0"
        style={{ background: GRADIENT }}
        onClick={onNavigateToLogin}
      >
        <LogIn className="w-4 h-4 mr-2" />
        Iniciar Sesión
      </Button>
      <Button
        variant="outline"
        className="w-full border-[#A3395C] text-[#A3395C] hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530]"
        onClick={onNavigateToRegister}
      >
        Registrarse
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#2a2029] flex flex-col">
      <TiendaHeader
        categoriaActiva={categoriaActiva}
        tiendaNavActiva={vista === 'tienda'}
        onIrATienda={irATienda}
        onLogoClick={() => { navigate('/'); window.scrollTo({ top: 0 }); }}
        onCheckout={() => onNavigateToCheckout?.()}
        carritoAbierto={carritoAbierto}
        onCarritoOpenChange={setCarritoAbierto}
        accountSlot={accountSlot}
        mobileAuthSlot={mobileAuthSlot}
      />

      <CuponBanner />

      <main className="flex-1 flex flex-col">
        <TiendaCatalogo
          vista={vista}
          categoriaActiva={categoriaActiva}
          heroTitle="Selenne Boutique"
          onIrATienda={irATienda}
          onAbrirCarrito={() => setCarritoAbierto(true)}
        />
      </main>

      <StoreFooter onCategoriaChange={irATienda} />
    </div>
  );
};
