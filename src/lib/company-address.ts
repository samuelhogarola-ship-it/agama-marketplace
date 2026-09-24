export type CompanyAddress = {
  postalCode: string;
  state: string;
  municipality: string;
  colony: string;
  street: string;
  exterior: string;
  interior: string;
};
export type PostalZone = { state: string; municipality: string; colonies: string[] };
export const EMPTY_ADDRESS: CompanyAddress = { postalCode: '', state: '', municipality: '', colony: '', street: '', exterior: '', interior: '' };
export function postalInput(value: string) { return value.replace(/[^0-9]/g, '').slice(0, 5); }
export function addressError(value: CompanyAddress): string | null {
  if (!value.postalCode) return 'Introduce el código postal de tu empresa.';
  if (!/^[0-9]{5}$/.test(value.postalCode)) return 'El código postal de México debe tener 5 cifras.';
  for (const [field, label] of [['state', 'estado'], ['municipality', 'municipio o alcaldía'], ['colony', 'colonia'], ['street', 'calle'], ['exterior', 'número exterior (o S/N)']] as const) {
    if (!value[field].trim()) return `Completa ${label} de la dirección.`;
  }
  if (Object.values(value).some(text => text.length > 200)) return 'Cada campo de dirección admite un máximo de 200 caracteres.';
  return null;
}
export function addressValues(value: CompanyAddress) {
  const address = Object.fromEntries(Object.entries(value).map(([key, text]) => [key, text.trim()])) as CompanyAddress;
  return { address, location: `${address.municipality}, ${address.state}` };
}
