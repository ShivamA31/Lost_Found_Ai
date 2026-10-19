import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix broken default icon paths in Vite (Vite doesn't use require())
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Sub-component to fly the map when center changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function LocationClick({ onLocationSelect }) {
  useMapEvents({
    click(event) {
      onLocationSelect?.({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    }
  });
  return null;
}

export default function MapView({ center, marker, onLocationSelect, className = '' }) {
  const defaultCenter = [12.9345, 77.6065]; // Campus center (CHRIST University area)
  const mapCenter = center || defaultCenter;

  return (
    <div className={`w-full h-full min-h-[160px] rounded-xl overflow-hidden ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={mapCenter} zoom={15} />
        {onLocationSelect && <LocationClick onLocationSelect={onLocationSelect} />}
        {marker && (
          <Marker position={marker}>
            <Popup>Reported here</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
