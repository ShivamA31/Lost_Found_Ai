import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../api/client';
import LocationPicker from '../components/LocationPicker';

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api.get(`/items/${id}`), api.get('/meta/categories')]).then(([item, cats]) => {
      setForm({ ...item.data, category_id: item.data.category_id || '', location_id: item.data.location_id || '', given_to_department: Boolean(item.data.given_to_department) });
      setCategories(cats.data || []);
    }).catch(err => setError(err.response?.data?.error || 'Could not load this listing.'));
  }, [id]);
  const update = patch => setForm(current => ({ ...current, ...patch }));
  const submit = async event => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => { if (['user_name','category_name','location_name','id','user_id','created_at','updated_at','image_url','type'].includes(key)) return; body.append(key, value ?? ''); });
      if (image) body.append('image', image);
      await api.put(`/items/${id}`, body);
      navigate(`/item/${id}`);
    } catch (err) { setError(err.response?.data?.error || 'Could not save your listing.'); }
    finally { setBusy(false); }
  };
  if (!form) return <main className="min-h-screen bg-beige p-8 text-center">{error || 'Loading listing…'}</main>;
  return <main className="min-h-screen bg-[#f3f0e9] px-4 py-8 text-ink-black">
    <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm md:p-9">
      <Link to={`/item/${id}`} className="mb-5 inline-flex items-center gap-2 text-sm text-muted-text"><ArrowLeft size={17}/> Back to listing</Link>
      <h1 className="font-oswald text-3xl uppercase">Edit your listing</h1>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">Title<input required maxLength={255} value={form.title} onChange={e=>update({title:e.target.value})} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal"/></label>
        <label className="block text-sm font-semibold">Description<textarea required minLength={12} rows={4} value={form.description || ''} onChange={e=>update({description:e.target.value})} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal"/></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">Category<select value={form.category_id} onChange={e=>update({category_id:e.target.value})} className="mt-1 w-full rounded-xl border bg-white px-4 py-3 font-normal"><option value="">Choose category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="text-sm font-semibold">Date<input type="date" value={form.date_occurred ? String(form.date_occurred).slice(0,10) : ''} onChange={e=>update({date_occurred:e.target.value})} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal"/></label>
        </div>
        <LocationPicker value={{...form,type:form.type}} onChange={update}/>
        {form.type === 'FOUND' && <label className="block text-sm font-semibold">Private ownership hint <span className="font-normal text-muted-text">(optional)</span><input value={form.verification_hint || ''} onChange={e=>update({verification_hint:e.target.value})} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" placeholder="A detail only the owner knows"/></label>}
        <label className="block text-sm font-semibold">Listing status<select value={form.status} onChange={e=>update({status:e.target.value})} className="mt-1 w-full rounded-xl border bg-white px-4 py-3 font-normal">{['ACTIVE','MATCHED','CLAIMED','CLOSED'].map(s=><option key={s}>{s}</option>)}</select><span className="mt-1 block text-xs font-normal text-muted-text">Status changes update this listing immediately.</span></label>
        <label className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 text-sm"><input type="checkbox" checked={form.given_to_department} onChange={e=>update({given_to_department:e.target.checked})} className="accent-brand-red"/>Handed to campus Lost &amp; Found</label>
        <label className="block text-sm font-semibold">Replace photo (optional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setImage(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm font-normal"/></label>
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-red py-3 font-semibold text-white disabled:opacity-60"><Save size={17}/>{busy?'Saving…':'Save listing changes'}</button>
      </form>
    </div>
  </main>;
}
