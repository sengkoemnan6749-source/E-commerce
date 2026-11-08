import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  MapPin,
  Bike,
  Phone,
  MessageSquare,
  ShieldCheck,
  Radio,
  RotateCcw,
  Plus,
  Minus,
  Layers,
  Clock,
  Warehouse,
  CheckCircle2,
  Compass,
  Moon,
  Sun,
  Star,
  Package,
  Home
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

  const [activeTheme, setActiveTheme] = useState('dark'); // 'dark' | 'light'
  const [activeDriverCall, setActiveDriverCall] = useState(false);

  // Status-based telemetry calculations
  const getStageTelemetry = () => {
    const s = orderStatus?.toLowerCase().replace(/\s+/g, '_');
    switch (s) {
      case 'confirmed':
        return {
          stepIdx: 0,
          coord: ROUTE_COORDINATES[0],
          eta: 'Today by 5:30 PM',
          distance: '4.8 km remaining',
          speed: '0 km/h',
          headline: 'Order Confirmed & Queued',
          subtext: 'GrabExpress courier assigned to Toul Kork Central Depot',
          badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        };
      case 'processing':
        return {
          stepIdx: 1,
          coord: ROUTE_COORDINATES[1],
          eta: 'Today by 5:15 PM',
          distance: '4.5 km remaining',
          speed: '0 km/h',
          headline: 'Packaging & Quality Scanned',
          subtext: 'Loading package into weatherproof GrabExpress bag',
          badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        };
      case 'shipped':
        return {
          stepIdx: 3,
          coord: ROUTE_COORDINATES[3],
          eta: '45 mins',
          distance: '3.2 km remaining',
          speed: '38 km/h',
          headline: 'In Transit — Russian Federation Blvd',
          subtext: 'Courier traveling down Russian Blvd towards Monivong',
          badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
        };
      case 'out_for_delivery':
        return {
          stepIdx: 6,
          coord: ROUTE_COORDINATES[6],
          eta: '8 mins away',
          distance: '0.8 km remaining',
          speed: '24 km/h',
          headline: 'Final Mile Delivery — BKK1 Area',
          subtext: 'Driver turning from Monivong onto Street 310',
          badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 animate-pulse',
        };
      case 'delivered':
        return {
          stepIdx: 7,
          coord: ROUTE_COORDINATES[7],
          eta: 'Delivered at 5:24 PM',
          distance: '0.0 km',
          speed: '0 km/h',
          headline: 'Successfully Delivered',
          subtext: 'Received and contactless signed by Sara Meng',
          badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        };
      default:
        return {
          stepIdx: 5,
          coord: ROUTE_COORDINATES[5],
          eta: '12 mins away',
          distance: '1.4 km remaining',
          speed: '30 km/h',
          headline: 'In Transit to BKK1',
          subtext: 'GrabExpress delivery in progress',
          badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        };
    }
  };

  const telemetry = getStageTelemetry();

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center map between Toul Kork Hub and BKK1
      const map = L.map(mapContainerRef.current, {
        center: [11.5605, 104.9100],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Add high-resolution OpenStreetMap tiles (100% free, authentic Khmer street names, 0 watermarks)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        subdomains: ['b', 'c'],
        maxZoom: 19,
      }).addTo(map);

      // 1. Route Background Aura Glow
      L.polyline(ROUTE_COORDINATES, {
        color: '#0284c7',
        weight: 10,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // 2. High-Tech Animated Route Polyline
      L.polyline(ROUTE_COORDINATES, {
        color: '#00d9ff',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '8, 8',
      }).addTo(map);

      // 3. Origin Marker: TechTonic Toul Kork Central Hub
      const originIcon = L.divIcon({
        className: 'custom-hub-icon',
        html: `
          <div style="display:flex; align-items:center; gap:6px; transform:translate(-50%, -50%); cursor:pointer;">
            <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #1e3a8a, #172554); border:3px solid #60a5fa; box-shadow:0 0 16px rgba(59,130,246,0.9); display:flex; align-items:center; justify-content:center; color:#ffffff;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
            <div style="background:rgba(10,18,36,0.94); border:1.5px solid #3b82f6; padding:3px 9px; border-radius:8px; font-size:11px; font-weight:800; color:#93c5fd; white-space:nowrap; box-shadow:0 4px 14px rgba(0,0,0,0.6); display:flex; align-items:center; gap:5px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              <span>Toul Kork Hub</span>
            </div>
          </div>
        `,
        iconSize: [36, 36],
      });
      L.marker(ROUTE_COORDINATES[0], { icon: originIcon }).addTo(map);

      // 4. Destination Marker: Sara Meng • Building 24, St 310, BKK1
      const destIcon = L.divIcon({
        className: 'custom-dest-icon',
        html: `
          <div style="display:flex; align-items:center; gap:6px; transform:translate(-50%, -50%); cursor:pointer;">
            <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #065f46, #022c22); border:3px solid #34d399; box-shadow:0 0 18px rgba(16,185,129,0.95); display:flex; align-items:center; justify-content:center; color:#ffffff;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <div style="background:rgba(10,18,36,0.94); border:1.5px solid #10b981; padding:3px 9px; border-radius:8px; font-size:11px; font-weight:800; color:#6ee7b7; white-space:nowrap; box-shadow:0 4px 14px rgba(0,0,0,0.6); display:flex; align-items:center; gap:5px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>Sara Meng • BKK1</span>
            </div>
          </div>
        `,
        iconSize: [36, 36],
      });
      L.marker(ROUTE_COORDINATES[ROUTE_COORDINATES.length - 1], { icon: destIcon }).addTo(map);

      // 5. Live Courier Motorbike Marker (Dynamic)
      const courierIcon = L.divIcon({
        className: 'custom-courier-icon',
        html: `
          <div style="position:relative; transform:translate(-50%, -50%); cursor:pointer;">
            <!-- Pulsing outer radar ring -->
            <div style="position:absolute; inset:-16px; border-radius:50%; border:2px solid #00d9ff; animation:ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; opacity:0.8; pointer-events:none;"></div>
            <!-- Motorbike badge -->
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #0284c7, #0f172a); border:3px solid #00d9ff; box-shadow:0 0 22px rgba(0,217,255,1); display:flex; align-items:center; justify-content:center; color:#ffffff; position:relative; z-index:10;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v4"></path><circle cx="7" cy="17" r="3"></circle><circle cx="17" cy="17" r="3"></circle></svg>
            </div>
            <!-- Live GrabExpress Callout -->
            <div style="position:absolute; top:-28px; left:50%; transform:translateX(-50%); background:#060b18; border:1.5px solid #00d9ff; padding:2px 8px; border-radius:6px; font-size:10px; font-family:monospace; font-weight:800; color:#00d9ff; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.8); display:flex; align-items:center; gap:4px;">
              <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#00d9ff; animation:pulse 1s infinite;"></span>
              GrabExpress PP
            </div>
          </div>
        `,
        iconSize: [44, 44],
      });

      const courierMarker = L.marker(telemetry.coord, { icon: courierIcon, zIndexOffset: 1000 }).addTo(map);
      courierMarkerRef.current = courierMarker;

      // Fit map bounds to show full route gracefully
      map.fitBounds(L.latLngBounds(ROUTE_COORDINATES), {
        padding: [70, 70],
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Courier Position when Order Status changes
  useEffect(() => {
    if (!mapInstanceRef.current || !courierMarkerRef.current) return;

    courierMarkerRef.current.setLatLng(telemetry.coord);
    mapInstanceRef.current.panTo(telemetry.coord, { animate: true, duration: 1 });
  }, [orderStatus]);

  // Controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.fitBounds(L.latLngBounds(ROUTE_COORDINATES), {
      padding: [70, 70],
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-6 transition-all">
      {/* Dynamic Tile Styling Rules */}
      <style>{`
        .dark-tiles .leaflet-tile {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(115%) saturate(80%);
        }
        .light-tiles .leaflet-tile {
          filter: saturate(110%) contrast(102%);
        }
      `}</style>

      {/* Header Bar */}
      <div className="p-4 px-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/90">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
            <Radio className="w-5 h-5 animate-pulse text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Live Courier Radar & GPS Tracking
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                5G GPS SATELLITE LOCK
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Phnom Penh Metropolitan Cartography • Real OpenStreetMap Logistics Fleet
            </p>
          </div>
        </div>

        {/* Map View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300">
            <button
              type="button"
              onClick={() => setActiveTheme('dark')}
              className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTheme === 'dark'
                  ? 'bg-slate-900 text-cyan-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTheme('light')}
              className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTheme === 'light'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light Map</span>
            </button>
          </div>

          <div className="text-[11px] font-mono font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
            ETA: {telemetry.eta}
          </div>
        </div>
      </div>

      {/* Real Interactive Leaflet Map Container */}
      <div className={`relative w-full h-[430px] sm:h-[480px] overflow-hidden select-none transition-colors duration-300 ${activeTheme === 'dark' ? 'bg-[#060b18]' : 'bg-[#e2e8f0]'}`}>
        
        {/* Leaflet DOM Anchor */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full z-0 transition-all duration-300 ${
            activeTheme === 'dark' ? 'dark-tiles' : 'light-tiles'
          }`}
        />

        {/* Floating Telemetry & Courier Card Overlay (Top-Left) */}
        <div className="absolute top-4 left-4 max-w-[290px] sm:max-w-xs w-full bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 shadow-2xl text-white z-[500]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md">
                <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-emerald-400 font-extrabold text-sm">
                  SK
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white">Sokha Kong</span>
                  <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>4.9</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">Honda Dream 125 • 1K-8899</span>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveDriverCall(true)}
                className="w-8 h-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 flex items-center justify-center transition-all shadow-sm"
                title="Call Courier"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => alert('Dispatch Message: "Driver is focusing on the road. Expected arrival shortly."')}
                className="w-8 h-8 rounded-xl bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 flex items-center justify-center transition-all shadow-sm"
                title="Message Courier"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Status Detail */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Live Status:</span>
              <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                {telemetry.headline}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Live Distance:</span>
              <span className="text-slate-200 font-semibold">{telemetry.distance} • {telemetry.speed}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">Destination: Building 24, St 310, BKK1</span>
            </div>
          </div>
        </div>

        {/* Map Legend Overlay (Bottom Left) */}
        <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2 text-[11px] text-slate-200 shadow-xl z-[500]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
            <span className="font-medium">Toul Kork Central Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 border-2 border-white animate-pulse shadow-sm" />
            <span className="font-medium">Live Courier</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            <span className="font-medium">BKK1 Destination</span>
          </div>
        </div>

        {/* Zoom & Recenter Controls (Bottom Right) */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-2xl z-[500]">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors text-sm font-bold shadow-sm"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors text-sm font-bold shadow-sm"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors text-sm shadow-sm"
            title="Recenter Full Route"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Driver Call Modal Simulation */}
      {activeDriverCall && (
        <div className="p-4 bg-emerald-950/95 border-t border-emerald-500/30 text-white flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white animate-bounce shadow-lg">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-400">CONNECTING SECURE CARRIER LINE...</p>
              <p className="text-sm font-extrabold text-white">Calling Sokha Kong (+855 12 889 900)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveDriverCall(false)}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors shadow-md"
          >
            End Call
          </button>
        </div>
      )}

      {/* Bottom Summary Bar */}
      <div className="p-3.5 px-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            <strong>Phnom Penh Express Guarantee:</strong> Temperature-controlled and shockproof transit for all electronics.
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Delivery Hub: St 598, Toul Kork &rarr; Destination: St 310, Building 24, BKK1
        </div>
      </div>
    </div>
  );
}
