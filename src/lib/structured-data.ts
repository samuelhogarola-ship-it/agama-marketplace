type ListingData = {title: string; description: string; type: string; price_mxn: number | null; company?: {name: string} | null};
export function listingStructuredData(listing: ListingData, images: string[], category?: string) {
  const isProduct = listing.type === 'product';
  return {
    '@context': 'https://schema.org',
    '@type': isProduct ? 'Product' : listing.type === 'service' ? 'Service' : 'CreativeWork',
    name: listing.title,
    description: listing.description,
    image: images,
    ...(isProduct && category ? {category} : {}),
    // Publishing a listing does not establish inventory availability.
    ...(isProduct && typeof listing.price_mxn === 'number' && Number.isFinite(listing.price_mxn) && listing.price_mxn >= 0 ? {
      offers: {
        '@type': 'Offer', price: listing.price_mxn, priceCurrency: 'MXN',
        ...(listing.company?.name ? {seller: {'@type': 'Organization', name: listing.company.name}} : {}),
      },
    } : {}),
  };
}
type CompanyData = {name: string; description?: string | null; location?: string | null; website?: string | null; phone?: string | null; email?: string | null; logo_url?: string | null};
export function companyStructuredData(company: CompanyData, url: string) {
  return {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: company.name, description: company.description ?? undefined,
    url, sameAs: company.website ? [company.website] : undefined,
    // The existing public location is free text, not a structured postal address.
    address: company.location || undefined,
    telephone: company.phone || undefined, email: company.email || undefined,
    logo: company.logo_url || undefined,
  };
}
