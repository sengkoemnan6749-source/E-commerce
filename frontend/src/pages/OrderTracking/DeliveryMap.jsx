import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  MapPin,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  Home,
  Compass
} from 'lucide-react';

// Real GPS waypoints across Phnom Penh (Toul Kork Hub -> Russian Blvd -> Monivong Blvd -> St 310, BKK1)
const ROUTE_COORDINATES = [
  [11.5724, 104.8967], // 0%: TechTonic Toul Kork Central Logistics Hub (St 598)
  [11.5695, 104.9015], // 15%: Depot gate connecting onto Russian Federation Blvd
  [11.5662, 104.9082], // 32%: Russian Blvd near Techno / RUPP
  [11.5620, 104.9155], // 50%: Russian Blvd approaching Monivong Blvd flyover
  [11.5575, 104.9198], // 68%: Monivong Blvd Southbound (Olympic / 7 Makara)
  [11.5512, 104.9208], // 84%: Monivong turning east into BKK1 area
  [11.5485, 104.9215], // 93%: Street 310 entry
  [11.5475, 104.9228], // 100%: Building 24, St 310, BKK1 (Customer Destination)
];

export default function DeliveryMap({ orderStatus = 'out_for_delivery', shippingAddress }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const courierMarkerRef = useRef(null);
  const [mapMode, setMapMode] = useState('satellite'); // Default to satellite (Google Earth) as requested
  const [mapReady, setMapReady] = useState(false);

  // Status-based telemetry calculations
  const getStageTelemetry = () => {
    const s = (orderStatus || '').toLowerCase().replace(/\s+/g, '_');
    if (s.includes('deliver') && !s.includes('out')) {
      return {
        coord: ROUTE_COORDINATES[7],
        eta: 'Delivered',
        statusText: 'Successfully Delivered',
        subtext: 'Received and signed by customer',
      };
    }
    if (s.includes('out')) {
      return {
        coord: ROUTE_COORDINATES[6],
        eta: 'Arriving Shortly (~8 mins)',
        statusText: 'Courier on Final Route',
        subtext: 'Approaching BKK1 delivery destination',
      };
    }
    if (s.includes('ship')) {
      return {
        coord: ROUTE_COORDINATES[3],
        eta: 'In Transit (~35 mins)',
        statusText: 'In Transit across Phnom Penh',
        subtext: 'Dispatched via GrabExpress fleet',
      };
    }
    if (s.includes('process')) {
      return {
        coord: ROUTE_COORDINATES[1],
        eta: 'Today by 5:15 PM',
        statusText: 'Packaging & Quality Verified',
        subtext: 'Assembled and packed at Toul Kork Service Center',
      };
    }
    if (s.includes('confirm')) {
      return {
        coord: ROUTE_COORDINATES[0],
        eta: 'Today by 5:30 PM',
        statusText: 'Order Confirmed at Toul Kork Hub',
        subtext: 'Package queued for dispatch',
      };
    }
    return {
      coord: ROUTE_COORDINATES[5],
      eta: 'Arriving in 15 mins',
      statusText: 'In Transit to Destination',
      subtext: 'Delivery in progress across Phnom Penh',
    };
  };

  const telemetry = getStageTelemetry();

  // Initialize Clean, Real Interactive Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    try {
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [11.5605, 104.9100],
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
        });

        mapInstanceRef.current = map;

        // Initial Tile Layer: Google Earth Satellite Hybrid (Real Homes, Rooftops, Trees & Buildings)
        tileLayerRef.current = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          maxNativeZoom: 20,
          attribution: '&copy; Google Earth &bull; Maxar Imagery',
        }).addTo(map);

        // 1. Soft Glow Outer Polyline
        L.polyline(ROUTE_COORDINATES, {
          color: '#38bdf8',
          weight: 7,
          opacity: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        // 2. High-Contrast Route Polyline
        L.polyline(ROUTE_COORDINATES, {
          color: '#2563eb',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        // 3. Origin Marker: TechTonic Toul Kork Central Hub (Apple Maps Style)
        const originIcon = L.divIcon({
          className: 'custom-hub-icon',
          html: `
            <div style="display:flex; align-items:center; gap:6px; transform:translate(-50%, -50%); cursor:pointer;">
              <div style="width:34px; height:34px; border-radius:50%; background:#1e40af; border:2.5px solid #ffffff; box-shadow:0 3px 12px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; color:#ffffff;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
              <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.15); padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700; color:#0f172a; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.25);">
                Toul Kork Hub
              </div>
            </div>
          `,
          iconSize: [34, 34],
        });
        L.marker(ROUTE_COORDINATES[0], { icon: originIcon }).addTo(map);

        // 4. Destination Marker: Customer Destination
        const destName = shippingAddress?.fullName || 'Sara Meng';
        const destIcon = L.divIcon({
          className: 'custom-dest-icon',
          html: `
            <div style="display:flex; align-items:center; gap:6px; transform:translate(-50%, -50%); cursor:pointer;">
              <div style="width:34px; height:34px; border-radius:50%; background:#059669; border:2.5px solid #ffffff; box-shadow:0 3px 12px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; color:#ffffff;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.15); padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700; color:#0f172a; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.25);">
                ${destName} • BKK1
              </div>
            </div>
          `,
          iconSize: [34, 34],
        });
        L.marker(ROUTE_COORDINATES[ROUTE_COORDINATES.length - 1], { icon: destIcon }).addTo(map);

        // 5. Courier Motorbike Marker (Apple Maps / Grab Delivery Style)
        const courierIcon = L.divIcon({
          className: 'custom-courier-icon',
          html: `
            <div style="position:relative; transform:translate(-50%, -50%); cursor:pointer;">
              <span style="position:absolute; inset:-5px; border-radius:50%; background:#38bdf8; opacity:0.6; animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
              <div style="position:relative; width:38px; height:38px; border-radius:50%; background:#2563eb; border:2.5px solid #ffffff; box-shadow:0 4px 14px rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; color:#ffffff;">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v4"></path><circle cx="7" cy="17" r="3"></circle><circle cx="17" cy="17" r="3"></circle></svg>
              </div>
            </div>
          `,
          iconSize: [38, 38],
        });

        const courierMarker = L.marker(telemetry.coord, { icon: courierIcon, zIndexOffset: 1000 }).addTo(map);
        courierMarkerRef.current = courierMarker;

        // Fit map bounds cleanly
        map.fitBounds(L.latLngBounds(ROUTE_COORDINATES), {
          padding: [50, 50],
        });

        // Trigger Leaflet layout recalculation so tiles load immediately
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            setMapReady(true);
          }
        }, 150);
      }
    } catch (err) {
      console.warn('Map initialization notice:', err);
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (err) {
        console.warn('Map cleanup notice:', err);
      }
      if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id;
      }
    };
  }, []);

  // Dynamic Basemap Switcher (Google Earth Satellite Hybrid vs Street Map)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    if (mapMode === 'satellite') {
      // High-Resolution Google Earth Satellite Hybrid (Real Homes, Rooftops & Buildings)
      tileLayerRef.current = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        maxNativeZoom: 20,
        attribution: '&copy; Google Earth &bull; Maxar Imagery',
      }).addTo(mapInstanceRef.current);
    } else {
      // Standard Clean Street Map
      tileLayerRef.current = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        maxNativeZoom: 20,
        attribution: '&copy; Google Maps',
      }).addTo(mapInstanceRef.current);
    }
  }, [mapMode]);

  // Update Courier Position when Order Status changes
  useEffect(() => {
    if (!mapInstanceRef.current || !courierMarkerRef.current) return;

    courierMarkerRef.current.setLatLng(telemetry.coord);
    mapInstanceRef.current.panTo(telemetry.coord, { animate: true, duration: 0.8 });
  }, [orderStatus]);

  // Clean Navigation Controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.fitBounds(L.latLngBounds(ROUTE_COORDINATES), {
      padding: [50, 50],
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
      {/* Clean Header Bar */}
      <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Delivery Route
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {telemetry.statusText}
          </p>
        </div>

        {/* Clean Map Switcher: Satellite vs Map */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 text-xs">
          <button
            type="button"
            onClick={() => setMapMode('satellite')}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              mapMode === 'satellite'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapMode('streets')}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              mapMode === 'streets'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Real Interactive Map Canvas */}
      <div className="relative w-full h-[380px] sm:h-[440px] bg-slate-900 overflow-hidden select-none">
        {/* Leaflet Anchor */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Minimalist Floating Zoom & Recenter Controls (Bottom-Right) */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-[400] bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-1 text-white">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center text-white transition"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center text-white transition"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center text-white transition"
            title="Recenter Route"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
