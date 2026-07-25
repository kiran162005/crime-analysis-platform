/**
 * DistrictChoroplethMap.jsx
 * -----------------------------------------------------------------------
 * Karnataka district choropleth map (Leaflet + react-leaflet) for the
 * Crime Analytics platform. Colors each district by incident count and
 * fires `onDistrictSelect` when a district is clicked, so the rest of
 * the dashboard (KPI cards, trend charts, alerts) can filter to it.
 *
 * Install:
 *   npm install leaflet react-leaflet
 *
 * In your app entrypoint (once, globally) make sure Leaflet's CSS is
 * loaded, e.g. in index.html or App.jsx:
 *   import 'leaflet/dist/leaflet.css';
 * -----------------------------------------------------------------------
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HotspotLayer from './HotspotLayer';

// Default source for Karnataka district boundaries (public, MIT-style
// curated dataset). Swap this for your own hosted copy in production —
// don't depend on a third-party CDN for a live demo.
const DEFAULT_GEOJSON_URL =
  'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data/geojson/states/karnataka.geojson';

// Karnataka's rough center / bounding zoom for the initial view.
const KARNATAKA_CENTER = [15.317, 75.7139];
const DEFAULT_ZOOM = 7;

// Sequential "incident intensity" palette, low -> high.
const DEFAULT_COLORS = [
  '#FFF5EB', // no / near-zero data
  '#FEE2C8',
  '#FDBF8C',
  '#FD9856',
  '#F5701B',
  '#C3480B',
  '#7F2704', // highest concentration
];

/** Common property keys different GeoJSON sources use for district name. */
const NAME_KEY_CANDIDATES = [
  'district',
  'DISTRICT',
  'dt_name',
  'DT_NAME',
  'NAME_2',
  'district_name',
  'name',
  'NAME',
];

function detectNameKey(feature) {
  if (!feature?.properties) return null;
  return NAME_KEY_CANDIDATES.find((k) => feature.properties[k] != null) || null;
}

/** Normalize a district name so GeoJSON labels can be matched against
 *  incident-data labels even when casing/whitespace/"District" suffixes
 *  differ (e.g. "Bengaluru Urban" vs "BENGALURU URBAN DISTRICT"). */
function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\bdistrict\b/g, '')
    .replace(/[^a-z]/g, '')
    .trim();
}

/** Build a normalized-name -> count lookup from whichever shape the
 *  incidentData prop was passed in. Accepts either:
 *    { "Bengaluru Urban": 214, "Mysuru": 58, ... }
 *  or
 *    [{ district: "Bengaluru Urban", count: 214 }, ...]
 */
function buildCountLookup(incidentData) {
  const lookup = new Map();
  if (!incidentData) return lookup;

  if (Array.isArray(incidentData)) {
    incidentData.forEach((row) => {
      const name = row.district ?? row.name ?? row.DISTRICT;
      const count = Number(row.count ?? row.incidents ?? row.value ?? 0);
      if (name != null) lookup.set(normalizeName(name), count);
    });
  } else if (typeof incidentData === 'object') {
    Object.entries(incidentData).forEach(([name, count]) => {
      lookup.set(normalizeName(name), Number(count) || 0);
    });
  }
  return lookup;
}

/** Quantile-based breakpoints so the palette adapts to whatever the real
 *  incident distribution looks like, instead of a fixed linear scale
 *  that gets dominated by one or two outlier districts. */
function computeBreaks(counts, bucketCount) {
  const nonZero = counts.filter((c) => c > 0).sort((a, b) => a - b);
  if (nonZero.length === 0) return [0, 1, 2, 3, 4, 5];

  const breaks = [];
  for (let i = 1; i < bucketCount; i++) {
    const idx = Math.floor((i / bucketCount) * nonZero.length);
    breaks.push(nonZero[Math.min(idx, nonZero.length - 1)]);
  }
  return breaks;
}

function getColor(count, breaks, colors) {
  if (!count || count <= 0) return colors[0];
  for (let i = 0; i < breaks.length; i++) {
    if (count <= breaks[i]) return colors[i + 1] ?? colors[colors.length - 1];
  }
  return colors[colors.length - 1];
}

/** Small legend control rendered onto the Leaflet map itself. */
function Legend({ breaks, colors, unitLabel }) {
  const map = useMap();

  useEffect(() => {
    const legend = window.L.control({ position: 'bottomright' });

    legend.onAdd = () => {
      const div = window.L.DomUtil.create('div', 'district-legend');
      div.style.background = 'white';
      div.style.padding = '8px 10px';
      div.style.borderRadius = '6px';
      div.style.boxShadow = '0 1px 4px rgba(0,0,0,0.35)';
      div.style.fontSize = '12px';
      div.style.lineHeight = '18px';
      div.style.color = '#1f2937';

      const thresholds = [0, ...breaks];
      let rows = `<div style="font-weight:600;margin-bottom:4px;">${unitLabel}</div>`;
      thresholds.forEach((t, i) => {
        const color = colors[i];
        const label =
          i === thresholds.length - 1 ? `${t}+` : `${t}–${thresholds[i + 1]}`;
        rows += `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:14px;height:14px;background:${color};display:inline-block;border-radius:3px;border:1px solid rgba(0,0,0,0.15);"></span>
            <span>${label}</span>
          </div>`;
      });
      div.innerHTML = rows;
      return div;
    };

    legend.addTo(map);
    return () => legend.remove();
  }, [map, breaks, colors, unitLabel]);

  return null;
}

/**
 * DistrictChoroplethMap
 *
 * Props
 * ------
 * geojsonUrl      string   URL to fetch a Karnataka districts FeatureCollection
 *                          from, if `geojsonData` isn't supplied directly.
 * geojsonData      object  A GeoJSON FeatureCollection, if you already have
 *                          it loaded (skips the fetch).
 * incidentData     object|array  Incident counts per district. Either
 *                          { "District Name": count, ... } or
 *                          [{ district, count }, ...].
 * onDistrictSelect function(districtInfo) Fired on click with:
 *                          { name, count, properties, layer }
 * selectedDistrict string  Currently-selected district name (controlled;
 *                          draws a highlighted outline). Optional.
 * colors           string[] Palette, low -> high. Defaults to a 7-step
 *                          sequential orange scale.
 * height           string  CSS height of the map container. Default '600px'.
 */
export default function DistrictChoroplethMap({
  geojsonUrl = DEFAULT_GEOJSON_URL,
  geojsonData = null,
  incidentData = {},
  onDistrictSelect = () => {},
  selectedDistrict = null,
  colors = DEFAULT_COLORS,
  height = '600px',
  hotspots = [],
  showHotspots = true,
  onHotspotSelect = () => {},
}) {
  const [geojson, setGeojson] = useState(geojsonData);
  const [loadError, setLoadError] = useState(null);
  const geoJsonLayerRef = useRef(null);

  // Fetch boundaries if not passed in directly.
  useEffect(() => {
    if (geojsonData) {
      setGeojson(geojsonData);
      return;
    }
    let cancelled = false;
    setLoadError(null);
    fetch(geojsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load district boundaries (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setGeojson(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [geojsonUrl, geojsonData]);

  const nameKey = useMemo(() => {
    const firstFeature = geojson?.features?.[0];
    return detectNameKey(firstFeature) || 'district';
  }, [geojson]);

  const countLookup = useMemo(() => buildCountLookup(incidentData), [incidentData]);

  const allCounts = useMemo(() => {
    if (!geojson?.features) return [];
    return geojson.features.map(
      (f) => countLookup.get(normalizeName(f.properties[nameKey])) || 0
    );
  }, [geojson, countLookup, nameKey]);

  const breaks = useMemo(() => computeBreaks(allCounts, colors.length - 1), [
    allCounts,
    colors.length,
  ]);

  function styleFeature(feature) {
    const districtName = feature.properties[nameKey];
    const count = countLookup.get(normalizeName(districtName)) || 0;
    const isSelected =
      selectedDistrict && normalizeName(districtName) === normalizeName(selectedDistrict);

    return {
      fillColor: getColor(count, breaks, colors),
      fillOpacity: 0.75,
      weight: isSelected ? 3 : 1,
      color: isSelected ? '#1d4ed8' : '#4b5563',
      dashArray: isSelected ? '' : '1',
    };
  }

  function onEachFeature(feature, layer) {
    const districtName = feature.properties[nameKey] || 'Unknown district';
    const count = countLookup.get(normalizeName(districtName)) || 0;

    layer.bindTooltip(`<strong>${districtName}</strong><br/>Incidents: ${count}`, {
      sticky: true,
    });

    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ weight: 3, color: '#1d4ed8', fillOpacity: 0.9 });
        e.target.bringToFront();
      },
      mouseout: (e) => {
        geoJsonLayerRef.current?.resetStyle(e.target);
      },
      click: () => {
        onDistrictSelect({
          name: districtName,
          count,
          properties: feature.properties,
          feature,
        });
      },
    });
  }

  if (loadError) {
    return (
      <div style={{ padding: 16, color: '#b91c1c' }}>
        Couldn't load district boundaries: {loadError}. Pass a local
        <code> geojsonData</code> prop as a fallback for offline demos.
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <MapContainer
        center={KARNATAKA_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%', borderRadius: 8 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geojson && (
          <GeoJSON
            // key forces a clean re-render when the underlying data
            // (not just counts) changes, since react-leaflet's GeoJSON
            // layer doesn't diff geometry updates on its own.
            key={JSON.stringify(geojson.features?.length) + nameKey}
            data={geojson}
            style={styleFeature}
            onEachFeature={onEachFeature}
            ref={geoJsonLayerRef}
          />
        )}
        {geojson && <Legend breaks={breaks} colors={colors} unitLabel="Incidents" />}
        {showHotspots && hotspots.length > 0 && (
          <HotspotLayer hotspots={hotspots} onHotspotSelect={onHotspotSelect} />
        )}
      </MapContainer>
    </div>
  );
}
