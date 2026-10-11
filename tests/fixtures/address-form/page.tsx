"use client";
import { useState } from 'react';
import CompanyAddressFields from '@/components/CompanyAddressFields';
import { EMPTY_ADDRESS, addressError, addressValues } from '@/lib/company-address';
export default function Check() {
  const [address, setAddress] = useState({ ...EMPTY_ADDRESS });
  const [result, setResult] = useState('');
  return <form className="mx-auto max-w-xl p-6" onSubmit={event => { event.preventDefault(); setResult(addressError(address) ?? JSON.stringify(addressValues(address))); }}>
    <CompanyAddressFields value={address} onChange={setAddress}/>
    <button type="submit">Comprobar dirección</button><output>{result}</output>
  </form>;
}
