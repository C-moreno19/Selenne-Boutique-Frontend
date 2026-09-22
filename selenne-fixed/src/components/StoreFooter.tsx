import { useState } from "react";
import { Mail } from "lucide-react";
import { Separator } from "./ui/separator";
import { LegalDialog, type LegalDoc } from "./LegalDialog";
import { postJson } from "../services/api";
import { toast } from "@/lib/toast";

const PLAYFAIR = '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';

interface StoreFooterProps {
  telefonoContacto: string;
  onCategoriaChange: (categoria: "mujer" | "accesorios" | "sale") => void;
}

export function StoreFooter({ telefonoContacto, onCategoriaChange }: StoreFooterProps) {
  const [legalAbierto, setLegalAbierto] = useState<LegalDoc>(null);
  const [emailNewsletter, setEmailNewsletter] = useState('');
  const [enviandoNewsletter, setEnviandoNewsletter] = useState(false);

  const suscribirse = async () => {
    const email = emailNewsletter.trim();
    if (!email || !email.includes('@')) { toast.error('Ingresa un correo válido'); return; }
    setEnviandoNewsletter(true);
    try {
      const res: any = await postJson('/api/suscriptores', { Email: email });
      toast.success(res?.message || res?.data?.message || '¡Gracias por suscribirte!');
      setEmailNewsletter('');
    } catch (e: any) {
      toast.error(e?.data?.message || 'No se pudo completar la suscripción');
    } finally {
      setEnviandoNewsletter(false);
    }
  };

  return (
    <footer className="text-white mt-20" style={{ background: 'linear-gradient(90deg, #2a2029 0%, #241B22 30%, #7a3350 68%, #A3395C 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Newsletter */}
        <div className="mb-14 pb-14 border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p style={{ fontFamily: PLAYFAIR }} className="text-2xl text-white mb-1.5 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#EFD9DF]" /> Únete a nuestro boletín
            </p>
            <p className="text-gray-300 text-sm">Entérate primero de nuevas colecciones y descuentos exclusivos.</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              value={emailNewsletter}
              onChange={e => setEmailNewsletter(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') suscribirse(); }}
              placeholder="tu@email.com"
              className="flex-1 md:w-64 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#EFD9DF] transition-colors"
            />
            <button
              onClick={suscribirse}
              disabled={enviandoNewsletter}
              className="px-5 py-2.5 bg-white text-[#241B22] text-sm font-semibold rounded-lg hover:bg-[#EFD9DF] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {enviandoNewsletter ? '...' : 'Suscribirme'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10" style={{ fontFamily: PLAYFAIR }}>
          <div>
            <p style={{ fontFamily: PLAYFAIR, color: '#ffffff' }} className="text-3xl mb-4">
              Selenne Boutique
            </p>
            <p className="text-gray-300 text-base">
              Elegancia y estilo en cada prenda
            </p>
          </div>
          <div>
            <p className="mb-5 text-lg font-semibold uppercase tracking-wide text-[#EFD9DF]">Compra</p>
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
            <p className="mb-5 text-lg font-semibold uppercase tracking-wide text-[#EFD9DF]">Ayuda</p>
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
              <li>
                <button onClick={() => setLegalAbierto("terminos")} className="hover:text-[#EFD9DF] transition-colors">
                  Términos y condiciones
                </button>
              </li>
              <li>
                <button onClick={() => setLegalAbierto("devoluciones")} className="hover:text-[#EFD9DF] transition-colors">
                  Cambios y devoluciones
                </button>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-5 text-lg font-semibold uppercase tracking-wide text-[#EFD9DF]">Síguenos</p>
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
          <p>© {new Date().getFullYear()} Selenne Boutique. Todos los derechos reservados.</p>
        </div>
      </div>
      <LegalDialog doc={legalAbierto} onClose={() => setLegalAbierto(null)} />
    </footer>
  );
}
