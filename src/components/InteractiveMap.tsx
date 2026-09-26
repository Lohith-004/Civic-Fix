import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CivicIssue } from '../types';
import { MapPin, Navigation } from 'lucide-react';

interface InteractiveMapProps {
  issues?: CivicIssue[];
  selectedIssueId?: string;
  onSelectIssue?: (issue: CivicIssue) => void;
  // Picker mode for reporting
  pickerMode?: boolean;
  pickerCoordinates?: { lat: number; lng: number };
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  height?: string;
  initialCenter?: [number, number];
  center?: [number, number];
  zoom?: number;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  issues = [],
  selectedIssueId,
  onSelectIssue,
  pickerMode = false,
  pickerCoordinates,
  onCoordinatesChange,
  height = '500px',
  initialCenter = [12.9716, 77.5946],
  center,
  zoom = 13,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Pan when center changes dynamically
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [center, zoom]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Handle picker mode clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (pickerMode && onCoordinatesChange) {
        onCoordinatesChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Issues Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    if (pickerMode) return;

    const getPinColor = (priority: string, status: string) => {
      if (status === 'VERIFIED_RESOLVED' || status === 'RESOLVED') return '#10b981'; // Green
      if (status === 'IN_PROGRESS') return '#06b6d4'; // Cyan
      if (priority === 'CRITICAL') return '#ef4444'; // Red
      if (priority === 'HIGH') return '#f59e0b'; // Amber
      if (priority === 'MEDIUM') return '#3b82f6'; // Blue
      return '#64748b'; // Gray
    };

    issues.forEach((issue) => {
      if (!issue.latitude || !issue.longitude) return;

      const pinColor = getPinColor(issue.priority, issue.status);
      const isSelected = issue.id === selectedIssueId;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div style="
            background-color: ${pinColor};
            width: ${isSelected ? '26px' : '20px'};
            height: ${isSelected ? '26px' : '20px'};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s;
            ${isSelected ? 'transform: scale(1.3); z-index: 1000;' : ''}
          ">
            <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans';
      popupContent.innerHTML = `
        <div style="min-width: 200px; font-family: system-ui, sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 700; font-size: 11px; color: #64748b;">${issue.publicId}</span>
            <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 999px; background: ${pinColor}20; color: ${pinColor}; border: 1px solid ${pinColor}40;">
              ${issue.priority}
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px; line-height: 1.2;">
            ${issue.title}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            📍 ${issue.address}
          </div>
          <button id="btn-view-${issue.id}" style="
            width: 100%;
            padding: 6px 12px;
            background: #0284c7;
            color: white;
            font-size: 12px;
            font-weight: 600;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          ">
            View Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-view-${issue.id}`);
        if (btn && onSelectIssue) {
          btn.onclick = () => onSelectIssue(issue);
        }
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [issues, selectedIssueId, pickerMode, onSelectIssue]);

  // Update Picker Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (pickerMode && pickerCoordinates) {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([pickerCoordinates.lat, pickerCoordinates.lng]);
      } else {
        const pickerIcon = L.divIcon({
          className: 'picker-leaflet-icon',
          html: `
            <div style="
              background-color: #ef4444;
              width: 28px;
              height: 28px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        pickerMarkerRef.current = L.marker([pickerCoordinates.lat, pickerCoordinates.lng], {
          icon: pickerIcon,
          draggable: true,
        }).addTo(mapInstanceRef.current);

        pickerMarkerRef.current.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          if (onCoordinatesChange) {
            onCoordinatesChange({ lat: latlng.lat, lng: latlng.lng });
          }
        });
      }

      mapInstanceRef.current.panTo([pickerCoordinates.lat, pickerCoordinates.lng]);
    } else if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [pickerCoordinates, pickerMode, onCoordinatesChange]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 16);
        }
        if (pickerMode && onCoordinatesChange) {
          onCoordinatesChange(coords);
        }
      },
      (err) => {
        console.warn('Geolocation failed:', err);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-400 flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          className="p-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold"
          title="Locate my position"
        >
          <Navigation className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="hidden sm:inline">My Location</span>
        </button>
      </div>

      {pickerMode && (
        <div className="absolute bottom-4 left-4 right-4 z-400 pointer-events-none">
          <div className="mx-auto max-w-sm bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-center flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Click or drag the red pin to mark exact issue location.</span>
          </div>
        </div>
      )}
    </div>
  );
};
