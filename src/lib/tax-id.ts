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
