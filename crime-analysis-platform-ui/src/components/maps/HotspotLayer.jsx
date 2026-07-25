/**
 * HotspotLayer.jsx
 * Pulsing red-zone markers for high-risk hotspots (per brief item 2:
 * "Hotspot + red-zone layer"). Meant to be rendered *inside* the same
 * <MapContainer> as the choropleth (see DistrictChoroplethMap.jsx),
 * not as a separate map.
 *
 * Runs on mock data for now — swap `mockHotspotData.js` for a real
 * fetch to the ML Engineer's hotspot-detection endpoint once it's
 * ready; keep the same { id, lat, lng, label, spikeRatio } shape so
 * this component doesn't need to change.
 */
import React, { useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Inject the pulse animation CSS once, globally, the first time this
// module is used — avoids needing a separate .css file import.
let stylesInjected = false;
function ensurePulseStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.innerHTML = `
    .hotspot-pulse-wrapper { position: relative; width: 20px; height: 20px; }
    .hotspot-pulse-core {
      position: absolute; top: 50%; left: 50%; width: 12px; height: 12px;
      margin: -6px 0 0 -6px; border-radius: 50%; z-index: 2;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
    }
    .hotspot-pulse-ring {
      position: absolute; top: 50%; left: 50%; width: 12px; height: 12px;
      margin: -6px 0 0 -6px; border-radius: 50%; z-index: 1;
      animation: hotspot-pulse 1.8s ease-out infinite;
    }
    @keyframes hotspot-pulse {
      0%   { transform: scale(1);   opacity: 0.7; }
      100% { transform: scale(3.2); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

/** Severity color bands based on spike ratio (how far above baseline). */
function severityColor(spikeRatio) {
  if (spikeRatio >= 2.5) return '#b91c1c'; // red — severe spike
  if (spikeRatio >= 1.7) return '#f97316'; // orange — moderate spike
  return '#eab308'; // amber — mild spike
}

function buildPulseIcon(color) {
  ensurePulseStyles();
  return L.divIcon({
    className: '', // prevent Leaflet's default marker styling
    html: `
      <div class="hotspot-pulse-wrapper">
        <div class="hotspot-pulse-ring" style="background:${color};"></div>
        <div class="hotspot-pulse-core" style="background:${color};"></div>
      </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export default function HotspotLayer({ hotspots = [], onHotspotSelect = () => {} }) {
  const map = useMap();

  // Nudge Leaflet to recalc size in case this layer mounts after the
  // container's size settled (common with flex/grid layouts).
  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  return (
    <>
      {hotspots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={buildPulseIcon(severityColor(spot.spikeRatio))}
          eventHandlers={{
            click: () => onHotspotSelect(spot),
          }}
        >
          <Popup>
            <strong>{spot.label}</strong>
            <br />
            Spike ratio: {spot.spikeRatio.toFixed(1)}x baseline
            <br />
            {spot.note}
          </Popup>
        </Marker>
      ))}
    </>
  );
}
