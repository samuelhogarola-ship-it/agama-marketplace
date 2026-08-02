import { CATEGORIES } from "@/lib/categories";
import { CONTACT_METHODS } from "@/lib/listing-policy";
import { SALE_UNITS } from "@/lib/listing-options";

export const LISTING_MODEL_FIELDS = [
  "Empresa verificada",
  "Titulo concreto del producto",
  "Categoria del catalogo",
  "Descripcion tecnica y comercial",
  "Precio MXN",
  "Como se vende",
  "Compra minima",
  "Ubicacion",
  "Forma de contacto",
  "Web propia del anunciante",
  "Fotos claras del producto",
];

export const LISTING_MODEL_RULES = [
  "Sin pigmentos, masterbatch, aditivos ni colorantes.",
  "Sin telefonos, emails ni WhatsApp en titulo, descripcion o fotos.",
  "El enlace externo debe pertenecer al dominio propio de la empresa.",
  "La compra minima siempre es un numero entero positivo.",
  "Las imagenes deben mostrar el producto real sin publicidad invasiva.",
  "No existe marcar como vendido: los fabricantes pausan o reactivan la disponibilidad.",
];

export const AGAMA_SAMPLE_COMPANY = {
  name: "AGAMA Envases Industriales",
  slug: "agama-envases-industriales",
  location: "Ciudad de Mexico",
  website: "https://agama-envases.com",
  email: "ventas@agama-envases.com",
  phone: "+52 55 4100 2200",
  whatsapp: "+52 55 4100 2200",
};

export const AGAMA_SAMPLE_LISTING = {
  title: "Tazas de plastico reutilizables 350 ml para eventos",
  description:
    "Tazas de plastico reutilizables de 350 ml para eventos, comedores industriales y promociones corporativas. Fabricadas en material rigido, apilables y disponibles en color blanco o transparente. Venta por volumen para empresas.",
  type: "product",
  category: "envases-y-botellas",
  price_mxn: "8.50",
  unit: "unidad",
  min_purchase_qty: "500",
  location: "Ciudad de Mexico",
  contact_method: "email",
  contact_value: "ventas@agama-envases.com",
  external_url: "https://agama-envases.com/tazas-plastico-reutilizables-350ml",
};

export function listingModelSummary() {
  return {
    categories: CATEGORIES.map((category) => category.name),
    saleUnits: SALE_UNITS.map((unit) => unit.label),
    contactMethods: CONTACT_METHODS.map((method) => method.label),
    fields: LISTING_MODEL_FIELDS,
    rules: LISTING_MODEL_RULES,
    sample: AGAMA_SAMPLE_LISTING,
  };
}
