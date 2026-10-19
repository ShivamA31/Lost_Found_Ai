import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Sparkles } from 'lucide-react';
import api from '../api/client';
import LocationPicker from '../components/LocationPicker';

const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function ReportForm({ type }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: searchParams.get('title') || '', description: '', category_id: '', date_occurred: localToday(),
    location_id: '', location_note: '', latitude: 12.9345, longitude: 77.6065,
    verification_hint: '', identifying_details: '', given_to_department: false
  });

  useEffect(() => {
    api.get('/meta/categories').then(response => setCategories(response.data || [])).catch(() => setCategories([]));
  }, []);

  const update = (patch) => setForm(current => ({ ...current, ...patch }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Add a short item title first.');
    if (form.description.trim().length < 12) return setError('Add a few more details so AI can find a meaningful match.');
    setBusy(true);
    try {
      const body = new FormData();
      const description = [form.description.trim(), form.identifying_details.trim() && `Identifying details: ${form.identifying_details.trim()}`].filter(Boolean).join('\n');
      const payload = { ...form, description, type };
      delete payload.identifying_details;
      Object.entries(payload).forEach(([key, value]) => body.append(key, value ?? ''));
      if (image) body.append('image', image);
      const response = await api.post('/items', body);
      navigate(`/item/${response.data.id}?new=1`);
    } catch (err) {
      setError(err.response?.data?.error || (err.request
        ? 'The server could not save this report. Check that the backend and AI service are running, then try again.'
        : 'Could not submit this report. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const isLost = type === 'LOST';
  return (
    <div className="min-h-screen bg-[#f3f0e9] px-4 py-6 font-inter text-ink-black md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="rounded-full bg-white p-2.5 shadow-sm"><ArrowLeft size={18} /></button>
          <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-brand-red">CampusFind · New report</p><h1 className="font-oswald text-3xl uppercase">{isLost ? 'I lost something' : 'I found something'}</h1></div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
          <aside className={`h-fit rounded-[2rem] p-7 text-white shadow-lg ${isLost ? 'bg-brand-red' : 'bg-[#171717]'}`}>
            <Sparkles size={25} />
            <h2 className="mt-5 font-oswald text-4xl uppercase">Let AI look<br />both ways.</h2>
            <p className="mt-4 text-sm leading-6 text-white/80">{isLost
              ? 'We will compare your lost item with things other students have found.'
              : 'We will compare your found item with lost reports from students looking for it.'}</p>
            <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-white/85">Add a useful description: item type, brand, colour, unique marks, and where or when it was last seen.</div>
            <p className="mt-5 text-xs text-white/70">After you submit, you will see possible matches, their scores, and which details lined up.</p>
          </aside>

          <form onSubmit={submit} className="rounded-[2rem] bg-white p-5 shadow-sm md:p-8">
            {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold md:col-span-2">What is the item?
                <input required maxLength={255} value={form.title} onChange={event => update({ title: event.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-brand-red" placeholder={isLost ? 'e.g. Black wireless earbuds' : 'e.g. Black earbuds in a blue case'} />
              </label>
              <label className="text-sm font-semibold">Category
                <select required value={form.category_id} onChange={event => update({ category_id: event.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal">
                  <option value="">Choose a category</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">{isLost ? 'Date last seen' : 'Date found'}
                <input required type="date" max={localToday()} value={form.date_occurred} onChange={event => update({ date_occurred: event.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal" />
              </label>
            </div>

            <label className="mt-4 block text-sm font-semibold">Describe the item
              <textarea required minLength={12} rows={4} value={form.description} onChange={event => update({ description: event.target.value })} className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-brand-red" placeholder="What does it look like? Include brand, colour, material, contents, and any unique marks." />
            </label>
            <label className="mt-4 block text-sm font-semibold">More details that could help identify it <span className="font-normal text-muted-text">(optional)</span>
              <input value={form.identifying_details} onChange={event => update({ identifying_details: event.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-brand-red" placeholder="For example: a keychain, sticker, engraving or what was inside" />
            </label>

            <div className="mt-5"><LocationPicker value={{ ...form, type }} onChange={update} /></div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f7f5f1] p-4 text-sm">
              <input type="checkbox" checked={form.given_to_department} onChange={event => update({ given_to_department: event.target.checked })} className="mt-0.5 accent-brand-red" />
              <span><strong>Handed to campus Lost &amp; Found</strong><span className="mt-1 block text-xs leading-5 text-muted-text">Let students know this item is being kept by the department.</span></span>
            </label>

            {!isLost && <label className="mt-4 block text-sm font-semibold">Private ownership question <span className="font-normal text-muted-text">(optional)</span>
              <input value={form.verification_hint} onChange={event => update({ verification_hint: event.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-brand-red" placeholder="A detail only the real owner would know" />
              <span className="mt-1 block text-xs font-normal text-muted-text">This is hidden from public listings. You can leave it blank.</span>
            </label>}

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm hover:border-brand-red">
              <ImagePlus size={19} className="text-brand-red" />
              <span className="flex-1">{image ? image.name : 'Add a photo (optional, JPG/PNG/WebP up to 5 MB)'}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setImage(event.target.files?.[0] || null)} className="sr-only" />
            </label>
            {image && <img src={URL.createObjectURL(image)} alt="Selected item preview" className="mt-3 max-h-48 rounded-xl object-contain" />}

            <button type="submit" disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-red py-4 font-semibold text-white transition hover:bg-red-600 disabled:opacity-60">
              <Sparkles size={17} /> {busy ? 'Saving report and checking matches…' : 'Submit and find possible matches'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
