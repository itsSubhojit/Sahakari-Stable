import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Fix for default Leaflet icon paths in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Map layer providers
const MAP_LAYERS = {
  googleRoad: {
    name: 'Google Streets',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  },
  googleSatellite: {
    name: 'Satellite View',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  },
  googleTerrain: {
    name: 'Google Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Terrain',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  },
  osmStandard: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
};

export const LiveGpsMap = ({
  workerPosition,
  customerLocation,
  workerInfo,
  traversedPath = [],
  remainingPath = [],
  fullPath = [],
  height = '500px',
  interactive = true,
  autoCenter = true,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const workerMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const startMarkerRef = useRef(null);
  const traversedPolylineRef = useRef(null);
  const remainingPolylineRef = useRef(null);
  const fullPolylineRef = useRef(null);

  const [activeLayerKey, setActiveLayerKey] = useState('googleRoad');
  const [followWorker, setFollowWorker] = useState(autoCenter);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = [
        workerPosition?.lat || customerLocation?.lat || 28.565,
        workerPosition?.lng || customerLocation?.lng || 77.198,
      ];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      // Add zoom control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Attribution at bottom right
      L.control
        .attribution({ position: 'bottomright', prefix: 'Google Maps GPS' })
        .addTo(map);

      // Initial tile layer
      const layerConfig = MAP_LAYERS[activeLayerKey];
      tileLayerRef.current = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom,
        subdomains: layerConfig.subdomains || ['a', 'b', 'c'],
      }).addTo(map);

      // Add full path casing/shadow line
      if (fullPath.length > 0) {
        fullPolylineRef.current = L.polyline(fullPath, {
          color: '#012d1d',
          weight: 7,
          opacity: 0.25,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      }

      // Add Traversed Path Polyline (Solid Vibrant Emerald)
      traversedPolylineRef.current = L.polyline(traversedPath, {
        color: '#6366f1',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Add Remaining Path Polyline (Dashed Cyan/Blue)
      remainingPolylineRef.current = L.polyline(remainingPath, {
        color: '#2563eb',
        weight: 5,
        dashArray: '8, 8',
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Customer Destination Marker (Glowing House Pin)
      if (customerLocation?.lat && customerLocation?.lng) {
        const customerHtml = `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
            <div class="absolute -top-1 w-12 h-12 bg-primary/20 rounded-full animate-ping pointer-events-none"></div>
            <div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white ring-2 ring-primary/40">
              <span class="material-symbols-outlined text-[20px]">home</span>
            </div>
            <div class="absolute -bottom-6 whitespace-nowrap bg-surface-container-highest/95 backdrop-blur-xs border border-outline-variant px-2 py-0.5 rounded-full text-[11px] font-bold text-primary shadow-sm flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
              ${customerLocation.label || 'Your Location'}
            </div>
          </div>
        `;

        const customerIcon = L.divIcon({
          html: customerHtml,
          className: 'custom-destination-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 35],
        });

        customerMarkerRef.current = L.marker(
          [customerLocation.lat, customerLocation.lng],
          { icon: customerIcon, zIndexOffset: 800 }
        )
          .addTo(map)
          .bindPopup(
            `<div class="p-1 text-xs"><strong>Destination:</strong><br/>${
              customerLocation.address || 'Your Service Location'
            }</div>`
          );
      }

      // Initial fit to show both points with padding
      if (
        workerPosition?.lat &&
        workerPosition?.lng &&
        customerLocation?.lat &&
        customerLocation?.lng
      ) {
        const bounds = L.latLngBounds([
          [workerPosition.lat, workerPosition.lng],
          [customerLocation.lat, customerLocation.lng],
        ]);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Layer when activeLayerKey changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const layerConfig = MAP_LAYERS[activeLayerKey] || MAP_LAYERS.googleRoad;
    tileLayerRef.current = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
      subdomains: layerConfig.subdomains || ['a', 'b', 'c'],
    }).addTo(mapInstanceRef.current);
  }, [activeLayerKey]);

  // Update Worker Marker position, heading angle, and speed badge
  useEffect(() => {
    if (!mapInstanceRef.current || !workerPosition?.lat || !workerPosition?.lng) return;

    const map = mapInstanceRef.current;
    const { lat, lng, heading = 0, speed = 0 } = workerPosition;
    const workerAvatar =
      workerInfo?.avatar ||
      'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=400';
    const workerName = workerInfo?.name || 'Rajesh';

    const workerHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <!-- Pulsing radar halo -->
        <div class="absolute w-14 h-14 bg-indigo-500/25 rounded-full animate-ping pointer-events-none"></div>
        <div class="absolute w-10 h-10 bg-indigo-500/35 rounded-full animate-pulse pointer-events-none"></div>

        <!-- Heading pointer arrow (rotates with GPS bearing) -->
        <div class="absolute w-12 h-12 flex items-center justify-center pointer-events-none transition-transform duration-300 ease-linear" style="transform: rotate(${heading}deg);">
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-indigo-600 -translate-y-6 drop-shadow-md"></div>
        </div>

        <!-- Worker vehicle / avatar circle -->
        <div class="relative w-11 h-11 rounded-full border-2 border-white shadow-xl bg-surface overflow-hidden ring-2 ring-indigo-500 z-10 flex items-center justify-center">
          <img src="${workerAvatar}" alt="${workerName}" class="w-full h-full object-cover" />
          <div class="absolute bottom-0 right-0 w-4 h-4 bg-indigo-600 rounded-full border border-white flex items-center justify-center text-white">
            <span class="material-symbols-outlined text-[10px]">two_wheeler</span>
          </div>
        </div>

        <!-- Live speed floating badge -->
        <div class="absolute -bottom-6 bg-indigo-900/90 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap border border-indigo-400/40">
          ${speed > 0 ? `${speed} km/h` : 'Stopped'}
        </div>
      </div>
    `;

    const workerIcon = L.divIcon({
      html: workerHtml,
      className: 'custom-worker-gps-icon',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!workerMarkerRef.current) {
      workerMarkerRef.current = L.marker([lat, lng], {
        icon: workerIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      workerMarkerRef.current.bindPopup(
        `<div class="p-1.5 text-xs">
          <strong>${workerInfo?.name || 'Service Provider'}</strong><br/>
          <span>${workerInfo?.title || 'Certified Specialist'}</span><br/>
          <span class="text-indigo-700 font-bold">Speed: ${speed} km/h</span>
        </div>`
      );
    } else {
      workerMarkerRef.current.setLatLng([lat, lng]);
      workerMarkerRef.current.setIcon(workerIcon);
    }

    // Auto-center on worker if enabled
    if (followWorker) {
      map.panTo([lat, lng], { animate: true, duration: 0.3 });
    }
  }, [workerPosition, workerInfo, followWorker]);

  // Update polylines
  useEffect(() => {
    if (traversedPolylineRef.current && traversedPath.length > 0) {
      traversedPolylineRef.current.setLatLngs(traversedPath);
    }
    if (remainingPolylineRef.current && remainingPath.length > 0) {
      remainingPolylineRef.current.setLatLngs(remainingPath);
    }
    if (fullPolylineRef.current && fullPath.length > 0) {
      fullPolylineRef.current.setLatLngs(fullPath);
    }
  }, [traversedPath, remainingPath, fullPath]);

  // Center Controls
  const handleRecenterWorker = () => {
    if (!mapInstanceRef.current || !workerPosition?.lat) return;
    setFollowWorker(true);
    mapInstanceRef.current.flyTo([workerPosition.lat, workerPosition.lng], 16, {
      duration: 0.8,
    });
  };

  const handleRecenterHome = () => {
    if (!mapInstanceRef.current || !customerLocation?.lat) return;
    setFollowWorker(false);
    mapInstanceRef.current.flyTo(
      [customerLocation.lat, customerLocation.lng],
      16,
      { duration: 0.8 }
    );
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current) return;
    setFollowWorker(false);
    if (
      workerPosition?.lat &&
      workerPosition?.lng &&
      customerLocation?.lat &&
      customerLocation?.lng
    ) {
      const bounds = L.latLngBounds([
        [workerPosition.lat, workerPosition.lng],
        [customerLocation.lat, customerLocation.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 16,
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
  };

  return (
    <div
      className={`relative isolate z-0 overflow-hidden rounded-2xl border border-outline-variant shadow-sm transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-[80] rounded-none h-screen w-screen' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full bg-surface-container" />

      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 bg-surface/90 backdrop-blur-md p-1.5 rounded-xl border border-outline-variant/80 shadow-md">
        {/* Map Indicator */}
        <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/50">
          <div className="px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 bg-primary text-on-primary shadow-xs">
            <span className="material-symbols-outlined text-[14px]">map</span>
            Map
          </div>
        </div>

        {/* Fullscreen button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
          </span>
        </button>
      </div>

      {/* Floating Action Controls (Bottom-Right / Side) */}
      <div className="absolute right-3 bottom-8 z-10 flex flex-col gap-2">
        {/* Recenter on Worker */}
        <button
          type="button"
          onClick={handleRecenterWorker}
          title="Center on Service Provider"
          className={`w-10 h-10 rounded-xl shadow-md border flex items-center justify-center transition-all ${
            followWorker
              ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-300/40'
              : 'bg-surface/90 backdrop-blur-md text-on-surface hover:bg-surface-container-high border-outline-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
        </button>

        {/* Recenter on Destination */}
        <button
          type="button"
          onClick={handleRecenterHome}
          title="Center on Your Location"
          className="w-10 h-10 rounded-xl bg-surface/90 backdrop-blur-md text-on-surface hover:bg-surface-container-high border border-outline-variant shadow-md flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[20px] text-primary">home</span>
        </button>

        {/* Fit Entire Route in view */}
        <button
          type="button"
          onClick={handleFitBounds}
          title="Fit Full Route"
          className="w-10 h-10 rounded-xl bg-surface/90 backdrop-blur-md text-on-surface hover:bg-surface-container-high border border-outline-variant shadow-md flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">route</span>
        </button>
      </div>

      {/* Live GPS Compass & Telemetry overlay (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-2">
        <div className="bg-surface/95 backdrop-blur-md border border-outline-variant/80 px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 text-[11px] font-medium text-on-surface">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
          <span className="font-bold text-indigo-700">GPS 5G LIVE</span>
          <span className="text-on-surface-variant font-mono">
            {workerPosition?.heading || 0}° N
          </span>
        </div>

        {workerPosition?.speed !== undefined && (
          <div className="bg-surface/95 backdrop-blur-md border border-outline-variant/80 px-2.5 py-1 rounded-full shadow-md text-[11px] font-bold text-primary">
            {workerPosition.speed} km/h
          </div>
        )}
      </div>
    </div>
  );
};

