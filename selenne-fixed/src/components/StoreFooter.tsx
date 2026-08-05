import { Separator } from "./ui/separator";

const PLAYFAIR = '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';

interface StoreFooterProps {
  telefonoContacto: string;
  onCategoriaChange: (categoria: "mujer" | "accesorios" | "sale") => void;
}

export function StoreFooter({ telefonoContacto, onCategoriaChange }: StoreFooterProps) {
  return (
    <footer className="text-white mt-20" style={{ background: 'linear-gradient(90deg, #1c151a 0%, #241B22 30%, #7a3350 68%, #A3395C 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10" style={{ fontFamily: PLAYFAIR }}>
          <div>
            <h3 style={{ fontFamily: PLAYFAIR, color: '#ffffff' }} className="text-3xl mb-4">
              Selenne Boutique
            </h3>
            <p className="text-gray-300 text-base">
              Elegancia y estilo en cada prenda
            </p>
          </div>
          <div>
            <h4 className="mb-5 text-lg font-semibold uppercase tracking-wide text-[#EFD9DF]">Compra</h4>
            <ul className="space-y-3 text-base text-gray-300">
              <li>
                <button onClick={() => onCategoriaChange("mujer")} className="hover:text-[#EFD9DF] transition-colors">
                  Mujer
                </button>
              </li>
              <li>
                <button onClick={() => onCategoriaChange("accesorios")} className="hover:text-[#EFD9DF] transition-colors">
                  Accesorios
                </button>
              </li>
              <li>
                <button onClick={() => onCategoriaChange("sale")} className="hover:text-[#EFD9DF] transition-colors">
                  Sale
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-lg font-semibold uppercase tracking-wide text-[#EFD9DF]">Ayuda</h4>
            <ul className="space-y-3 text-base text-gray-300">
              <li>
                <a
                  href={`https://wa.me/${telefonoContacto.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#EFD9DF] transition-colors"
                >
                  Contacto
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-lg font-semibold uppercase tracking-wide text-[#EFD9DF]">Síguenos</h4>
            <ul className="space-y-3 text-base text-gray-300">
              <li>
                <a href="https://www.instagram.com/selenne_boutique_?igsh=MWJtaXR0Zm85MW13ZQ==" target="_blank" rel="noopener noreferrer" className="hover:text-[#EFD9DF] transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
        <Separator className="my-8 bg-white/15" />
        <div className="text-center text-sm text-gray-300" style={{ fontFamily: PLAYFAIR }}>
          <p>© 2024 Selenne Boutique. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
