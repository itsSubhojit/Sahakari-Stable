import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { api } from '../../services/api';
import { formatCurrency, formatDistance } from '../../utils/formatters';

// Fix Leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Category mapping helper
const CATEGORY_NAMES = {
  electrician: 'Electrical Pros',
  plumbing: 'Plumbing Experts',
  plumber: 'Plumbing Experts',
  'ac-repair': 'AC Specialists',
  appliance: 'Appliance Technicians',
  carpentry: 'Carpenters',
  carpenter: 'Carpenters',
  cleaning: 'Cleaning Team',
  painting: 'Painters',
  painter: 'Painters',
};

// Base mock coordinates generator around customer location if worker lacks exact lat/lng
const getWorkerCoordinates = (index, baseLat = 28.5672, baseLng = 77.1982) => {
  const offsets = [
    { lat: 0.0045, lng: 0.0035 },
    { lat: -0.0038, lng: 0.0052 },
    { lat: 0.0062, lng: -0.0041 },
    { lat: -0.0051, lng: -0.0039 },
    { lat: 0.0028, lng: -0.0068 },
    { lat: -0.0072, lng: 0.0029 },
  ];
  const offset = offsets[index % offsets.length];
  return {
    lat: baseLat + offset.lat,
    lng: baseLng + offset.lng,
  };
};

export const CategoryWorkersMap = ({
  category = 'electrician',
  customerLocation = { lat: 28.5672, lng: 77.1982, address: 'Safdarjung Enclave, New Delhi' },
  height = '380px',
  onSelectWorker = null,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Load category workers
  useEffect(() => {
    let isMounted = true;
    const fetchCategoryWorkers = async () => {
      setLoading(true);
      try {
        // Map category aliases if needed
        let catQuery = category;
        if (category === 'plumbing') catQuery = 'plumber';
        if (category === 'carpentry') catQuery = 'carpenter';
        if (category === 'painting') catQuery = 'painter';

        const workerList = await api.getWorkers({ category: catQuery });
        
        // Ensure worker objects have lat/lng coordinates for map
        const mappedWorkers = workerList.map((w, idx) => {
          const coords = w.lat && w.lng ? { lat: w.lat, lng: w.lng } : getWorkerCoordinates(idx, customerLocation.lat, customerLocation.lng);
          return {
            ...w,
            lat: coords.lat,
            lng: coords.lng,
          };
        });

        if (isMounted) {
          setWorkers(mappedWorkers);
          if (mappedWorkers.length > 0) setSelectedWorker(mappedWorkers[0]);
        }
      } catch (err) {
        console.error('Error fetching category workers for map', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategoryWorkers();
    return () => { isMounted = false; };
  }, [category, customerLocation.lat, customerLocation.lng]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [customerLocation.lat, customerLocation.lng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        attribution: '&copy; Google Maps',
      }).addTo(map);

      // Customer Location Marker
      const customerHtml = `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
          <div class="absolute -top-1 w-10 h-10 bg-indigo-500/30 rounded-full animate-ping pointer-events-none"></div>
          <div class="w-9 h-9 bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <span class="material-symbols-outlined text-[18px]">home</span>
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            Your Location
          </div>
        </div>
      `;

      const customerIcon = L.divIcon({
        html: customerHtml,
        className: 'customer-map-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 32],
      });

      L.marker([customerLocation.lat, customerLocation.lng], { icon: customerIcon, zIndexOffset: 900 })
        .addTo(map)
        .bindPopup(`<div class="text-xs p-1"><strong>Service Address:</strong><br/>${customerLocation.address || 'Your Address'}</div>`);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [customerLocation]);

  // Render Worker Markers when workers change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    const bounds = L.latLngBounds([[customerLocation.lat, customerLocation.lng]]);

    workers.forEach((worker) => {
      bounds.extend([worker.lat, worker.lng]);

      const isSelected = selectedWorker?.id === worker.id;
      const workerHtml = `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group">
          <div class="absolute w-9 h-9 bg-emerald-500/20 rounded-full animate-pulse"></div>
          <div class="relative w-10 h-10 rounded-full border-2 ${isSelected ? 'border-amber-400 ring-4 ring-amber-300/50 scale-110 z-30' : 'border-white ring-2 ring-emerald-600 z-10'} shadow-lg bg-white overflow-hidden transition-all duration-200">
            <img src="${worker.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=400'}" alt="${worker.name}" class="w-full h-full object-cover" />
          </div>
          <div class="absolute -bottom-5 bg-slate-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap border border-slate-700">
            ${worker.name.split(' ')[0]} • ${worker.rating}★
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: workerHtml,
        className: 'worker-map-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([worker.lat, worker.lng], { icon, zIndexOffset: isSelected ? 1000 : 500 });
      
      marker.on('click', () => {
        setSelectedWorker(worker);
        if (onSelectWorker) onSelectWorker(worker);
      });

      marker.addTo(markersGroup);
    });

    if (workers.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [workers, selectedWorker, customerLocation, onSelectWorker]);

  const catTitle = CATEGORY_NAMES[category] || 'Available Service Workers';

  return (
    <div className="bg-surface border border-outline-variant/80 rounded-2xl overflow-hidden shadow-md space-y-0">
      {/* Map Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 py-3 text-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-[20px] animate-pulse">
            travel_explore
          </span>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">
              Available {catTitle} Near You
            </h4>
            <p className="text-[10px] text-slate-300">
              Showing {workers.length} verified pros in your radius
            </p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
          ● Live Dispatch Map
        </span>
      </div>

      {/* Map Canvas Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-2">
            <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
            Locating nearby {category} professionals...
          </div>
        )}
        <div ref={mapContainerRef} className="w-full bg-slate-100" style={{ height }} />
      </div>

      {/* Worker Quick Preview Footer Bar */}
      {selectedWorker && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <img
              src={selectedWorker.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=400'}
              alt={selectedWorker.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5 mt-1">
                <strong className="text-slate-900 font-bold">{selectedWorker.name}</strong>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.2 rounded">
                  ★ {selectedWorker.rating || 4.8}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="font-mono text-indigo-700 font-bold text-sm">
              {formatCurrency(selectedWorker.startingPrice || 1500)}
            </span>
            {onSelectWorker && (
              <button
                type="button"
                onClick={() => onSelectWorker(selectedWorker)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Book This Pro
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
