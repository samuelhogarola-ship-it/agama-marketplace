"use client";
import { useState } from 'react';
import CompanyContactFields from '@/components/CompanyContactFields';
import { contactError, contactValues, type ContactDraft, type ContactSelection } from '@/lib/company-phone';
export default function Check() {
 const [enabled,setEnabled]=useState<ContactSelection>({phone:false,email:false,whatsapp:false});
 const [value,setValue]=useState<ContactDraft>({phone:{country:'',national:''},whatsapp:{country:'',national:''},email:''});
 const [result,setResult]=useState('');
 return <form className="mx-auto max-w-xl p-6" onSubmit={e=>{e.preventDefault();setResult(contactError(enabled,value)??JSON.stringify(contactValues(enabled,value)));}}>
 <CompanyContactFields enabled={enabled} value={value} onToggle={setEnabled} onChange={setValue}/>
 <button className="mt-4 rounded-full bg-blue-800 p-3 text-white" type="submit">Comprobar</button><output className="block">{result}</output></form>;
}
