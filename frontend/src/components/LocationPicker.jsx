import React, { useEffect, useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import api from '../api/client';
import MapView from './MapView';

export default function LocationPicker({ value, onChange }) {
  const [mode, setMode] = useState('current');
  const [locations, setLocations] = useState([]);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/meta/locations').then(response => setLocations(response.data || [])).catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setMode('manual'); setMessage('Location is unavailable in this browser. Enter your campus area manually.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude, location_id: '' });
      setMessage('Current location added. Select manual entry below if you would rather choose a campus area.');
      setLocating(false);
    }, () => {
      setMode('manual');
      setMessage('We could not access your current location. Select a campus area or pin it manually.');
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('This browser does not support location. Choose a campus area or pin it on the map.');
      return;
    }
    setLocating(true);
    setMessage('');
    navigator.geolocation.getCurrentPosition(position => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      onChange({ latitude, longitude, location_id: '' });
      setMode('current');
      setMessage('Using your current location. You can switch to manual entry at any time.');
      setLocating(false);
    }, error => {
      setMessage(error.code === error.PERMISSION_DENIED
        ? 'Location permission was denied. Choose a campus area or enter the location manually.'
        : 'We could not get your location. Choose a campus area or enter it manually.');
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  };

  const selectCampusArea = (event) => {
    const location = locations.find(item => String(item.id) === event.target.value);
    onChange({
      location_id: event.target.value,
      ...(location?.latitude != null && location?.longitude != null
        ? { latitude: Number(location.latitude), longitude: Number(location.longitude) }
        : {})
    });
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 font-semibold"><MapPin size={17} className="text-brand-red" /> Where was it {value.type === 'LOST' ? 'lost' : 'found'}?</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={useCurrentLocation} disabled={locating}
          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${mode === 'current' ? 'border-brand-red bg-red-50 text-brand-red' : 'border-gray-200 hover:border-gray-400'}`}>
          <LocateFixed size={16} /> {locating ? 'Finding you…' : 'Use my current location'}
        </button>
        <button type="button" onClick={() => { setMode('manual'); setMessage('Select a campus area or click the map to place a pin.'); }}
          className={`rounded-xl border px-3 py-2.5 text-sm ${mode === 'manual' ? 'border-brand-red bg-red-50 text-brand-red' : 'border-gray-200 hover:border-gray-400'}`}>
          Enter the location manually
        </button>
      </div>
      {mode === 'current' && <button type="button" onClick={() => { setMode('manual'); setMessage('Select a campus area or click the map to place a pin.'); }} className="mt-3 text-xs font-semibold text-brand-red">I want to enter the location manually</button>}

      {mode === 'manual' && <>
        <label className="mt-3 block text-xs font-semibold text-muted-text">Campus area</label>
        <select value={value.location_id || ''} onChange={selectCampusArea} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm">
          <option value="">Choose an area or pin the map</option>
          {locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}
        </select>
      </>}

      <div className="mt-3 h-56 overflow-hidden rounded-xl border border-gray-100">
        <MapView
          center={[Number(value.latitude) || 12.9345, Number(value.longitude) || 77.6065]}
          marker={[Number(value.latitude) || 12.9345, Number(value.longitude) || 77.6065]}
          onLocationSelect={mode === 'manual' ? ({ latitude, longitude }) => onChange({ latitude, longitude }) : undefined}
        />
      </div>
      {message && <p role="status" className="mt-2 text-xs text-muted-text">{message}</p>}
      <label className="mt-3 block text-xs font-semibold text-muted-text">More precise directions (optional)</label>
      <input value={value.location_note || ''} onChange={event => onChange({ location_note: event.target.value })}
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-red"
        placeholder="For example: second floor, near the east entrance" />
    </section>
  );
}
