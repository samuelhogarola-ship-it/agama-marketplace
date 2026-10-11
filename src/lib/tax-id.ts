type DatabaseError = {
  code?: string | null;
  message?: string | null;
};

export function normalizeTaxId(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, "").toUpperCase();
  return normalized || null;
}

export function taxIdSaveError(error: DatabaseError): string {
  if (
    error.code === "23505" &&
    error.message?.includes("mkt_companies_rfc_uidx")
  ) {
    return "Este RFC/CIF ya está registrado por otra empresa.";
  }

  return "No se pudo guardar la ficha. Revisa los datos e inténtalo de nuevo.";
}

// SAT: personas morales use 3 name characters, YYMMDD and a 3-character homoclave.
export function companyRfcInput(value: string): string {
  return value.toUpperCase().replace(/[^A-ZÑ&0-9]/g, "").slice(0, 12);
}

export function companyRfcError(value: string): string | null {
  const rfc = normalizeTaxId(value);
  if (!rfc) return null; // Still optional until publishing an advertisement.
  if (!/^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/.test(rfc)) {
    return "El RFC de una empresa mexicana debe tener 12 caracteres: 3 letras, 6 números de fecha y 3 caracteres de homoclave.";
  }
  const year = 2000 + Number(rfc.slice(3, 5));
  const month = Number(rfc.slice(5, 7));
  const day = Number(rfc.slice(7, 9));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return "Revisa la fecha del RFC: debe tener el formato AAMMDD y ser una fecha válida.";
  }
  return null;
}
