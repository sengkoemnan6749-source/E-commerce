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
  const courierMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Status-based telemetry calculations
  const getStageTelemetry = () => {
    const s = (orderStatus || '').toLowerCase().replace(/\s+/g, '_');
    switch (s) {
      case 'confirmed':
        return {
          coord: ROUTE_COORDINATES[0],
          eta: 'Today by 5:30 PM',
          statusText: 'Order Confirmed at Toul Kork Hub',
          subtext: 'Package queued for dispatch',
        };
      case 'processing':
        return {
          coord: ROUTE_COORDINATES[1],
          eta: 'Today by 5:15 PM',
          statusText: 'Packaging & Quality Verified',
          subtext: 'Assembled and packed at Toul Kork Service Center',
        };
      case 'shipped':
        return {
          coord: ROUTE_COORDINATES[3],
          eta: 'In Transit (~35 mins)',
          statusText: 'In Transit across Phnom Penh',
          subtext: 'Dispatched via GrabExpress fleet',
        };
      case 'out_for_delivery':
        return {
          coord: ROUTE_COORDINATES[6],
          eta: 'Arriving Shortly (~8 mins)',
          statusText: 'Courier on Final Route',
          subtext: 'Approaching BKK1 delivery destination',
        };
      case 'delivered':
        return {
          coord: ROUTE_COORDINATES[7],
          eta: 'Delivered',
          statusText: 'Successfully Delivered',
          subtext: 'Received and signed by customer',
        };
      default:
        return {
          coord: ROUTE_COORDINATES[5],
          eta: 'Arriving in 15 mins',
          statusText: 'In Transit to Destination',
          subtext: 'Delivery in progress across Phnom Penh',
        };
    }
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

        // Clean, High-Reliability CARTO Voyager Map Tiles (Real Phnom Penh Roads & Buildings)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          subdomains: ['a', 'b', 'c', 'd'],
          maxZoom: 19,
        }).addTo(map);

        // 1. Soft Shadow Outer Polyline
        L.polyline(ROUTE_COORDINATES, {
          color: '#3b82f6',
          weight: 7,
          opacity: 0.25,
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
              <div style="width:32px; height:32px; border-radius:50%; background:#1e40af; border:2.5px solid #ffffff; box-shadow:0 3px 10px rgba(0,0,0,0.25); display:flex; align-items:center; justify-content:center; color:#ffffff;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
              <div style="background:#ffffff; border:1px solid #e2e8f0; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700; color:#0f172a; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.12);">
                Toul Kork Hub
              </div>
            </div>
          `,
          iconSize: [32, 32],
        });
        L.marker(ROUTE_COORDINATES[0], { icon: originIcon }).addTo(map);

        // 4. Destination Marker: Customer Destination
        const destName = shippingAddress?.fullName || 'Sara Meng';
        const destIcon = L.divIcon({
          className: 'custom-dest-icon',
          html: `
            <div style="display:flex; align-items:center; gap:6px; transform:translate(-50%, -50%); cursor:pointer;">
              <div style="width:32px; height:32px; border-radius:50%; background:#059669; border:2.5px solid #ffffff; box-shadow:0 3px 10px rgba(0,0,0,0.25); display:flex; align-items:center; justify-content:center; color:#ffffff;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div style="background:#ffffff; border:1px solid #e2e8f0; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700; color:#0f172a; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.12);">
                ${destName} • BKK1
              </div>
            </div>
          `,
          iconSize: [32, 32],
        });
        L.marker(ROUTE_COORDINATES[ROUTE_COORDINATES.length - 1], { icon: destIcon }).addTo(map);

        // 5. Courier Motorbike Marker
        const courierIcon = L.divIcon({
          className: 'custom-courier-icon',
          html: `
            <div style="position:relative; transform:translate(-50%, -50%); cursor:pointer;">
              <div style="width:36px; height:36px; border-radius:50%; background:#2563eb; border:2.5px solid #ffffff; box-shadow:0 4px 12px rgba(37,99,235,0.45); display:flex; align-items:center; justify-content:center; color:#ffffff;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v4"></path><circle cx="7" cy="17" r="3"></circle><circle cx="17" cy="17" r="3"></circle></svg>
              </div>
            </div>
          `,
          iconSize: [36, 36],
        });

        const courierMarker = L.marker(telemetry.coord, { icon: courierIcon, zIndexOffset: 1000 }).addTo(map);
        courierMarkerRef.current = courierMarker;

        // Fit map bounds cleanly
        map.fitBounds(L.latLngBounds(ROUTE_COORDINATES), {
          padding: [50, 50],
        });

        // Trigger Leaflet layout recalculation so tiles load immediately
        setTimeout(() => {
          map.invalidateSize();
          setMapReady(true);
        }, 120);
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
      {/* Header Bar */}
      <div className="p-4 px-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Delivery Route & Courier Progress
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {telemetry.statusText} • {telemetry.subtext}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            ETA: {telemetry.eta}
          </span>
        </div>
      </div>

      {/* Real Interactive Map Canvas */}
      <div className="relative w-full h-[360px] sm:h-[400px] bg-slate-100 overflow-hidden select-none">
        {/* Leaflet Anchor */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Minimalist Zoom & Recenter Controls (Bottom-Right) */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-[400] bg-white rounded-xl shadow-md border border-slate-200/80 p-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition"
            title="Recenter Route"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clean Bottom Route Legend (Apple Maps Style) */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl px-3.5 py-2 shadow-sm flex items-center gap-4 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-700 ring-2 ring-blue-100" />
            <span>Toul Kork Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100" />
            <span>Courier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
            <span>Destination</span>
          </div>
        </div>
      </div>
    </div>
  );
}
