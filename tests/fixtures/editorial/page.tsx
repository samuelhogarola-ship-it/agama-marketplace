import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/types';

export default function EditorialFixture() {
  if (process.env.COMPONENT_FIXTURES !== '1') notFound();
  const product = {id:123456,slug:'fixture-editorial',title:'Tarima de prueba',category:'tarimas-y-contenedores',price_mxn:null,photos:[]} as unknown as Product;
  return <main><ProductCard product={product}/></main>;
}
