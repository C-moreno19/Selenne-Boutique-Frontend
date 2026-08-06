import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

const PLAYFAIR = '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';

export type LegalDoc = "terminos" | "devoluciones" | null;

interface LegalDialogProps {
  doc: LegalDoc;
  onClose: () => void;
}

// Contenido base para una boutique colombiana con pago solo por transferencia.
// El derecho de retracto de 5 dias habiles es el minimo legal (Ley 1480 de 2011,
// arts. 47 y 51) — no es un numero inventado. Las condiciones de "prenda sin usar
// / con etiqueta" son el estandar de la industria, pero conviene que el dueño del
// negocio confirme plazos de envio, zonas de cobertura y a quien se le escribe.
const CONTENIDO: Record<Exclude<LegalDoc, null>, { titulo: string; secciones: { h: string; p: string[] }[] }> = {
  terminos: {
    titulo: "Términos y Condiciones",
    secciones: [
      {
        h: "1. Sobre estos términos",
        p: [
          "Al comprar en Selenne Boutique aceptás las condiciones descritas acá. Si tenés dudas antes de confirmar tu pedido, escribinos por WhatsApp desde el botón de Contacto.",
        ],
      },
      {
        h: "2. Precios y disponibilidad",
        p: [
          "Los precios se muestran en pesos colombianos (COP) e incluyen IVA. El stock se actualiza en tiempo real, pero en casos excepcionales una prenda puede agotarse entre que la agregás al carrito y confirmás el pedido — si eso pasa, te contactamos antes de cobrar.",
        ],
      },
      {
        h: "3. Medio de pago",
        p: [
          "Por ahora el único medio de pago es transferencia bancaria, usando el código QR que se muestra en el checkout. El pedido se procesa una vez que confirmamos el pago.",
        ],
      },
      {
        h: "4. Envíos",
        p: [
          "Los tiempos y costos de envío se confirman por WhatsApp al procesar tu pedido, según tu ciudad.",
        ],
      },
    ],
  },
  devoluciones: {
    titulo: "Política de Cambios y Devoluciones",
    secciones: [
      {
        h: "1. Derecho de retracto",
        p: [
          "Como consumidor tenés derecho a retractarte de tu compra dentro de los 5 días hábiles siguientes a que recibís el pedido, sin necesidad de justificar el motivo (Ley 1480 de 2011, artículos 47 y 51). La prenda debe devolverse sin usar, con etiquetas originales y en su empaque.",
        ],
      },
      {
        h: "2. Cambios por talla",
        p: [
          "Si la talla no te queda, escribinos por WhatsApp dentro de los 5 días hábiles de recibido el pedido para coordinar el cambio, sujeto a disponibilidad de stock en la talla solicitada.",
        ],
      },
      {
        h: "3. Prendas en Sale",
        p: [
          "Las prendas compradas en la sección Sale con descuento no tienen cambio por talla, salvo defecto de fábrica.",
        ],
      },
      {
        h: "4. Costos de envío en cambios/devoluciones",
        p: [
          "El costo de envío de vuelta corre por cuenta del cliente, salvo que el cambio se deba a un error nuestro (talla o color equivocado, prenda defectuosa).",
        ],
      },
    ],
  },
};

export function LegalDialog({ doc, onClose }: LegalDialogProps) {
  if (!doc) return null;
  const { titulo, secciones } = CONTENIDO[doc];

  return (
    <Dialog open={!!doc} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: PLAYFAIR }} className="text-2xl text-[#241B22]">
            {titulo}
          </DialogTitle>
          <DialogDescription className="sr-only">{titulo}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
          {secciones.map((s) => (
            <div key={s.h}>
              <h3 className="text-sm font-bold tracking-wide text-[#A3395C] mb-2">{s.h}</h3>
              {s.p.map((linea, i) => (
                <p key={i} className="text-sm text-gray-600 leading-relaxed">{linea}</p>
              ))}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
