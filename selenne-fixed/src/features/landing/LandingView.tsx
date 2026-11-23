import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { User, LogIn } from "lucide-react";
import { Button } from "../../components/ui/button";
import { StoreFooter } from "../../components/StoreFooter";
import { CuponBanner } from "../../components/CuponBanner";
import { TiendaHeader } from "../../components/TiendaHeader";
import { TiendaCatalogo } from "../../components/TiendaCatalogo";
import { useAuth } from "../../shared/contexts/AuthContext";
import type { Categoria } from "../../shared/hooks/useCatalogoFiltrado";

const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const GRADIENT = 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)';

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
  const [searchParams] = useSearchParams();
  const subInicial = searchParams.get("sub") || undefined;
  // La categoria y la vista viven en la URL (/, /tienda/:categoria), no en
  // estado local: asi son compartibles y el back/forward del navegador funciona.
  const categoriaActiva: Categoria =
    categoriaUrl === "hombre" || categoriaUrl === "accesorios" || categoriaUrl === "sale" ? categoriaUrl : "mujer";
  const vista: "home" | "tienda" = categoriaUrl ? "tienda" : "home";

  const irATienda = (categoria: Categoria, sub?: string) => {
    navigate(sub ? `/tienda/${categoria}?sub=${sub}` : `/tienda/${categoria}`);
    window.scrollTo({ top: 0 });
  };

  const [carritoAbierto, setCarritoAbierto] = useState(false);

  const accountSlot = user ? (
    <button
      onClick={() => navigate('/dashboard')}
      className="p-1.5 sm:p-2 hover:bg-[#C9A8C3] dark:hover:bg-[#241935] rounded-full transition-colors"
      aria-label="Mi cuenta"
      title={`Mi cuenta (${user.name || user.email})`}
    >
      <User className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#0A0A0A] dark:text-[#F5F3FA]" />
    </button>
  ) : (
    <button
      onClick={() => onNavigateToLogin()}
      className="p-1.5 sm:p-2 hover:bg-[#C9A8C3] dark:hover:bg-[#241935] transition-colors"
      aria-label="Iniciar sesión"
      title="Iniciar sesión"
    >
      <User className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#0A0A0A] dark:text-[#F5F3FA]" />
    </button>
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
        className="w-full border-[#5C2A52] text-[#5C2A52] hover:bg-[#C9A8C3] dark:hover:bg-[#241935]"
        onClick={onNavigateToRegister}
      >
        Registrarse
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#17101f] flex flex-col">
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
          subInicial={subInicial}
          heroTitle="District Store"
          onIrATienda={irATienda}
          onAbrirCarrito={() => setCarritoAbierto(true)}
        />
      </main>

      <StoreFooter onCategoriaChange={irATienda} />
    </div>
  );
};
