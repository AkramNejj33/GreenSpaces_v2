import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ===== CONSTANTES ET CONFIGURATION =====
const NDVI_COLOR_MAP = [
  { min: 0.8, max: 1.0, color: '#006400', label: 'Végétation dense' },
  { min: 0.6, max: 0.8, color: '#ADFF2F', label: 'Végétation saine' },
  { min: 0.4, max: 0.6, color: '#FFFF00', label: 'Végétation modérée' },
  { min: 0.2, max: 0.4, color: '#CD853F', label: 'Végétation faible' },
  { min: 0.0, max: 0.2, color: '#8B4513', label: 'Sol nu' }
];

const USER_ICON_CONFIG = {
  jardinier: { color: '#2E7D32', size: [26, 26] },
  paysagiste: { color: '#1B5E20', size: [26, 26] },
  horticulteur: { color: '#43A047', size: [26, 26] },
  technicien_iot: { color: '#1976D2', size: [26, 26] },
  electronicien: { color: '#1565C0', size: [26, 26] },
  installateur_capteurs: { color: '#6A1B9A', size: [26, 26] },
  maintenance: { color: '#FB8C00', size: [26, 26] },
  irrigation: { color: '#0288D1', size: [26, 26] },
  gestion_energie: { color: '#FBC02D', size: [26, 26] },
  autre: { color: '#757575', size: [26, 26] }
};

const MAP_CONFIG = {
  center: [33.5731, -7.5898], // Casablanca, Morocco
  zoom: 11,
  maxZoom: 18,
  minZoom: 8,
  tileLayer: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  fitBoundsPadding: [15, 15]
};

// ===== NORMALISATION DES SPÉCIALITÉS =====
const normalize = (s = '') =>
  s.toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const SPECIALTY_LABEL_TO_KEY = {
  jardinier: 'jardinier',
  paysagiste: 'paysagiste',
  horticulteur: 'horticulteur',
  technicien_iot: 'technicien_iot',
  'technicien iot': 'technicien_iot',
  technicien: 'technicien_iot',
  electronicien: 'electronicien',
  'installateur_capteurs': 'installateur_capteurs',
  'installateur capteurs': 'installateur_capteurs',
  maintenance: 'maintenance',
  irrigation: 'irrigation',
  gestion_energie: 'gestion_energie',
  'gestion energie': 'gestion_energie',
  autre: 'autre'
};

const toSpecialtyKey = (value) => {
  if (!value) return 'autre';
  const raw = normalize(value);
  if (SPECIALTY_LABEL_TO_KEY[raw]) return SPECIALTY_LABEL_TO_KEY[raw];
  const compact = raw.replace(/_+/g, '_');
  if (SPECIALTY_LABEL_TO_KEY[compact]) return SPECIALTY_LABEL_TO_KEY[compact];
  return raw || 'autre';
};

// ===== NDVI UTILS =====
class NDVICalculator {
  static calculateNDVI(nirValue, redValue) {
    if ((nirValue + redValue) === 0) return 0;
    const ndvi = (nirValue - redValue) / (nirValue + redValue);
    return Math.max(-1, Math.min(1, ndvi));
  }

  static simulateSpectralBands(vegetationType = 'mixed') {
    const spectralProfiles = {
      dense_forest: { nirBase: 0.8, redBase: 0.1, variance: 0.05 },
      grassland: { nirBase: 0.6, redBase: 0.15, variance: 0.08 },
      sparse_vegetation: { nirBase: 0.4, redBase: 0.25, variance: 0.1 },
      urban_green: { nirBase: 0.5, redBase: 0.2, variance: 0.12 },
      water: { nirBase: 0.1, redBase: 0.05, variance: 0.02 },
      bare_soil: { nirBase: 0.3, redBase: 0.3, variance: 0.05 },
      mixed: { nirBase: 0.55, redBase: 0.18, variance: 0.15 }
    };
    const profile = spectralProfiles[vegetationType] || spectralProfiles.mixed;
    const nirNoise = (Math.random() - 0.5) * profile.variance;
    const redNoise = (Math.random() - 0.5) * profile.variance;
    const nir = Math.max(0, Math.min(1, profile.nirBase + nirNoise));
    const red = Math.max(0, Math.min(1, profile.redBase + redNoise));
    return { nir, red };
  }

  static generateRealisticNDVI(feature) {
    const props = feature?.properties || {};
    let vegetationType = 'mixed';
    if (props.leisure === 'park') vegetationType = 'urban_green';
    else if (props.natural === 'wood') vegetationType = 'dense_forest';
    else if (props.landuse === 'grass') vegetationType = 'grassland';
    else if (props.natural === 'water') vegetationType = 'water';
    else if (props.leisure === 'garden') vegetationType = 'urban_green';

    const seasonFactor = this.getSeasonFactor();
    const stressFactor = this.getStressFactor();
    const { nir, red } = this.simulateSpectralBands(vegetationType);

    // Clamp après facteurs
    const adjustedNir = Math.max(0, Math.min(1, nir * seasonFactor * stressFactor));
    const adjustedRed = Math.max(0, Math.min(1, red * (2 - seasonFactor) * (2 - stressFactor)));

    return this.calculateNDVI(adjustedNir, adjustedRed);
  }

  static getSeasonFactor() {
    const month = new Date().getMonth();
    const seasonFactors = [0.6, 0.7, 0.8, 0.9, 1.0, 1.0, 0.9, 0.8, 0.9, 0.8, 0.7, 0.6];
    return seasonFactors[month] + (Math.random() - 0.5) * 0.1;
  }

  static getStressFactor() {
    return Math.random() < 0.9 ? 0.9 + Math.random() * 0.1 : 0.5 + Math.random() * 0.4;
  }
}

// ===== UTILITAIRES GÉOGRAPHIQUES =====
const MapUtils = {
  getNDVIColor: (ndvi) => {
    const v = Math.max(0, Math.min(1, ndvi));
    for (const range of NDVI_COLOR_MAP) {
      if (v >= range.min && v < range.max) return range.color;
    }
    return NDVI_COLOR_MAP[NDVI_COLOR_MAP.length - 1].color;
  },

  // DivIcon local (pas d’images distantes)
  createUserIcon: (specialtyKey = 'autre') => {
    const cfg = USER_ICON_CONFIG[specialtyKey] || USER_ICON_CONFIG.autre;
    const letter = (specialtyKey || 'A').charAt(0).toUpperCase();
    const html = `
      <div style="
        width: ${cfg.size?.[0] || 26}px; height: ${cfg.size?.[1] || 26}px; border-radius: 50%;
        background: ${cfg.color || '#757575'};
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 800; font-size: 12px;
        box-shadow: 0 0 0 2px rgba(255,255,255,0.9), 0 1px 6px rgba(0,0,0,0.35);
      ">
        ${letter}
      </div>
    `;
    return L.divIcon({
      className: 'leaflet-div-icon agent-divicon',
      html,
      iconSize: cfg.size || [26, 26],
      iconAnchor: [(cfg.size?.[0] || 26) / 2, (cfg.size?.[1] || 26)],
      popupAnchor: [0, -(cfg.size?.[1] || 26) + 4]
    });
  },

  validateCoordinates: (coords) => {
    if (!Array.isArray(coords) || coords.length !== 2) return false;
    const [lng, lat] = coords;
    return !isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  },

  coordsToLatLng: (coords) => {
    if (!MapUtils.validateCoordinates(coords)) return null;
    // GeoJSON est [lng, lat], Leaflet attend [lat, lng]
    return [coords[1], coords[0]];
  },

  getHealthStatus: (ndvi) => {
    if (ndvi >= 0.8) return { status: 'Excellent', color: '#006400', icon: '🟢' };
    if (ndvi >= 0.6) return { status: 'Bon', color: '#ADFF2F', icon: '🟡' };
    if (ndvi >= 0.4) return { status: 'Moyen', color: '#FFFF00', icon: '🟠' };
    if (ndvi >= 0.2) return { status: 'Faible', color: '#CD853F', icon: '🔴' };
    return { status: 'Critique', color: '#8B4513', icon: '⚫' };
  },

  bucketNdviRange: (v) => {
    const x = Math.max(0, Math.min(1, v || 0));
    if (x >= 0.8) return '0.8-1.0';
    if (x >= 0.6) return '0.6-0.8';
    if (x >= 0.4) return '0.4-0.6';
    if (x >= 0.2) return '0.2-0.4';
    return '0.0-0.2';
  }
};

// ===== GÉNÉRATEURS DE POPUPS =====
const PopupContent = {
  createParkPopup: (feature, index) => {
    const props = feature.properties || {};
    const ndvi = props.ndvi ?? 0;
    const health = MapUtils.getHealthStatus(ndvi);
    return `
      <div class="popup-content">
        <div class="popup-header" style="
          background: linear-gradient(135deg, ${health.color}, ${health.color}dd);
          color: white; padding: 12px; margin: -12px -12px 15px -12px;
          border-radius: 4px 4px 0 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">
            🌳 ${props.name || `Espace vert #${index + 1}`}
          </div>
          <div style="font-size: 12px; opacity: 0.9;">
            ${health.icon} État: ${health.status}
          </div>
        </div>
        <div class="popup-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
          <div class="metric-card" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 12px; border-radius: 6px; text-align: center; border: 1px solid #dee2e6;">
            <div style="font-size: 20px; font-weight: 700; color: ${health.color}; margin-bottom: 4px;">${(+ndvi).toFixed(3)}</div>
            <div style="font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px;">NDVI Index</div>
          </div>
          <div class="metric-card" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 12px; border-radius: 6px; text-align: center; border: 1px solid #dee2e6;">
            <div style="font-size: 16px; font-weight: 600; color: #495057; margin-bottom: 4px;">${props.surface || (Math.random() * 5000 + 500).toFixed(0)} m²</div>
            <div style="font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px;">Surface</div>
          </div>
        </div>
        <div style="font-size: 11px; color: #adb5bd; text-align: center; padding-top: 12px; border-top: 1px solid #e9ecef;">
          ID: ${props.full_id || props.osm_id || 'N/A'} | Dernière analyse: ${new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    `;
  },

  createUserPopup: (feature) => {
    const props = feature.properties || {};
    const coords = feature.geometry.coordinates;
    const skey = toSpecialtyKey(props.specialty || props.specialtyLabel);
    const prettyLabel = props.specialtyLabel || props.specialty || skey.replace(/_/g, ' ');
    return `
      <div class="popup-content">
        <div class="popup-header" style="background: linear-gradient(135deg, #4299e1, #3182ce); color: white; padding: 12px; margin: -12px -12px 15px -12px; border-radius: 4px 4px 0 0;">
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">👤 ${props.username || 'Agent'}</div>
          <div style="font-size: 12px; opacity: 0.9;">${prettyLabel}</div>
        </div>
        <div class="user-info" style="margin-bottom: 12px;">
          <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="font-weight: 500; color: #495057; font-size: 12px;">Email:</span>
            <span style="color: #212529; font-size: 12px;">${props.email || 'N/A'}</span>
          </div>
          <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="font-weight: 500; color: #495057; font-size: 12px;">Position:</span>
            <span style="color: #212529; font-size: 11px; font-family: monospace;">${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}</span>
          </div>
        </div>
      </div>
    `;
  }
};

// ===== COMPOSANT PRINCIPAL =====
const GeographyChart = React.memo(({ 
  parksData = [], 
  usersData = [], 
  onMapReady,
  mapConfig = {},
  className = "",
  enableNDVICalculation = true,

  // filtres optionnels
  activeAgentTypes = [],
  activeNdviRange = null
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const parksLayerRef = useRef(null);
  const usersLayerRef = useRef(null);
  const isInitializedRef = useRef(false);

  const finalMapConfig = useMemo(() => ({ ...MAP_CONFIG, ...mapConfig }), [mapConfig]);

  const processedParksData = useMemo(() => {
    if (!enableNDVICalculation) return parksData;
    return parksData.map(feature => {
      if (feature?.properties?.ndvi !== undefined) return feature;
      const realNDVI = NDVICalculator.generateRealisticNDVI(feature); // [-1..1]
      return {
        ...feature,
        properties: {
          ...feature.properties,
          ndvi: Math.max(0, Math.min(1, (realNDVI + 1) / 2)) // → [0..1] pour couleurs
        }
      };
    });
  }, [parksData, enableNDVICalculation]);

  const wantedAgentKeys = useMemo(
    () => new Set((activeAgentTypes || []).map(toSpecialtyKey)),
    [activeAgentTypes]
  );
  const wantedNdviRange = useMemo(() => activeNdviRange || null, [activeNdviRange]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current || isInitializedRef.current) return;

    try {
      const map = L.map(mapRef.current, {
        center: finalMapConfig.center,
        zoom: finalMapConfig.zoom,
        maxZoom: finalMapConfig.maxZoom,
        minZoom: finalMapConfig.minZoom,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true,
        attributionControl: true
      });

      const tileLayer = L.tileLayer(finalMapConfig.tileLayer.url, {
        attribution: finalMapConfig.tileLayer.attribution,
        detectRetina: true,
        crossOrigin: true
      });
      tileLayer.on('tileerror', (error) => console.warn('Erreur tuiles:', error));
      tileLayer.addTo(map);

      const parksLayer = L.layerGroup().addTo(map);
      const usersLayer = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      parksLayerRef.current = parksLayer;
      usersLayerRef.current = usersLayer;
      isInitializedRef.current = true;

      setTimeout(() => {
        map.invalidateSize();
        onMapReady?.(map);
      }, 80);
    } catch (error) {
      console.error('Erreur init carte:', error);
      isInitializedRef.current = false;
    }
  }, [finalMapConfig, onMapReady]);

  const updateParksLayer = useCallback(() => {
    const map = mapInstanceRef.current;
    const parksLayer = parksLayerRef.current;
    if (!map || !parksLayer || !mapRef.current?.offsetParent) return;

    try {
      parksLayer.clearLayers();
      if (!processedParksData?.length) return;

      const bounds = L.latLngBounds();
      let boundsCount = 0;

      const data = wantedNdviRange
        ? processedParksData.filter(f => MapUtils.bucketNdviRange(f.properties?.ndvi) === wantedNdviRange)
        : processedParksData;

      data.forEach((feature, index) => {
        try {
          const { geometry, properties = {} } = feature;
          const coords = geometry.coordinates;
          const ndvi = properties.ndvi ?? 0;
          const color = MapUtils.getNDVIColor(ndvi);
          let layer = null;

          switch (geometry.type) {
            case 'Point': {
              const latLng = MapUtils.coordsToLatLng(coords);
              if (latLng) {
                layer = L.circleMarker(latLng, {
                  radius: Math.max(5, Math.min(15, ndvi * 20)),
                  fillColor: color,
                  color: color,
                  weight: 2,
                  opacity: 0.9,
                  fillOpacity: 0.2 + Math.min(0.6, ndvi * 0.6)
                });
              }
              break;
            }
            case 'Polygon': {
              if (coords[0]?.length > 2) {
                const polygonCoords = coords[0].map(MapUtils.coordsToLatLng).filter(Boolean);
                if (polygonCoords.length > 2) {
                  layer = L.polygon(polygonCoords, {
                    color, fillColor: color, weight: 2, opacity: 0.9,
                    fillOpacity: 0.2 + Math.min(0.6, ndvi * 0.6)
                  });
                }
              }
              break;
            }
            case 'MultiPolygon': {
              const multiPolygonCoords = coords
                .filter(p => p[0]?.length > 2)
                .map(p => p[0].map(MapUtils.coordsToLatLng).filter(Boolean))
                .filter(c => c.length > 2);
              if (multiPolygonCoords.length > 0) {
                layer = L.polygon(multiPolygonCoords, {
                  color, fillColor: color, weight: 2, opacity: 0.9,
                  fillOpacity: 0.2 + Math.min(0.6, ndvi * 0.6)
                });
              }
              break;
            }
            default: break;
          }

          if (layer) {
            const popupContent = PopupContent.createParkPopup(feature, index);
            layer.bindPopup(popupContent, { maxWidth: 320, className: 'custom-popup park-popup', closeButton: true, autoPan: true });

            layer.on('mouseover', function () {
              this.setStyle({ weight: 3, opacity: 1, fillOpacity: 0.3 + Math.min(0.6, ndvi * 0.6) });
            });
            layer.on('mouseout', function () {
              this.setStyle({ weight: 2, opacity: 0.9, fillOpacity: 0.2 + Math.min(0.6, ndvi * 0.6) });
            });

            layer.addTo(parksLayer);

            try {
              if (layer.getBounds?.()) {
                const layerBounds = layer.getBounds();
                if (layerBounds.isValid()) { bounds.extend(layerBounds); boundsCount++; }
              } else if (layer.getLatLng?.()) {
                bounds.extend(layer.getLatLng()); boundsCount++;
              }
            } catch (boundsError) {
              console.warn('Erreur bounds parc:', boundsError);
            }
          }
        } catch (featureError) {
          console.warn('Erreur traitement parc:', featureError);
        }
      });

      if (boundsCount > 0 && bounds.isValid()) {
        setTimeout(() => {
          try {
            map.fitBounds(bounds, { padding: finalMapConfig.fitBoundsPadding, animate: true, duration: 0.5 });
          } catch (error) {
            console.warn('Erreur fitBounds parcs:', error);
          }
        }, 160);
      }
    } catch (error) {
      console.error('Erreur maj parcs:', error);
    }
  }, [processedParksData, finalMapConfig.fitBoundsPadding, wantedNdviRange]);

  const updateUsersLayer = useCallback(() => {
    const map = mapInstanceRef.current;
    const usersLayer = usersLayerRef.current;
    if (!map || !usersLayer || !mapRef.current?.offsetParent) return;

    try {
      usersLayer.clearLayers();

      console.debug('[GeographyChart] usersData count =', usersData?.length);

      if (!usersData?.length) return;

      const bounds = L.latLngBounds();
      let boundsCount = 0;

      usersData.forEach((feature) => {
        try {
          const { geometry, properties = {} } = feature;

          const latLng = MapUtils.coordsToLatLng(geometry.coordinates); // [lng,lat] -> [lat,lng]
          if (!latLng) {
            console.warn('Coordonnées invalides (attendu GeoJSON [lng,lat]) =>', geometry.coordinates);
            return;
          }

          const skey = toSpecialtyKey(properties.specialty || properties.specialtyLabel);

          // filtre agent si actif
          if (wantedAgentKeys.size > 0 && !wantedAgentKeys.has(skey)) return;

          const marker = L.marker(latLng, {
            icon: MapUtils.createUserIcon(skey),
            riseOnHover: true,
            zIndexOffset: 1000
          });

          const popupContent = PopupContent.createUserPopup(feature);
          marker.bindPopup(popupContent, { maxWidth: 300, className: 'custom-popup user-popup' });

          marker.on('mouseover', function () { this.setZIndexOffset(1500); });
          marker.on('mouseout', function () { this.setZIndexOffset(1000); });

          marker.addTo(usersLayer);
          bounds.extend(latLng);
          boundsCount++;
        } catch (error) {
          console.warn('Erreur ajout utilisateur:', error);
        }
      });

      if (bounds.isValid() && boundsCount > 0) {
        setTimeout(() => {
          try {
            map.fitBounds(bounds, { padding: finalMapConfig.fitBoundsPadding, animate: true, duration: 0.6 });
          } catch (error) {
            console.warn('Erreur fitBounds utilisateurs:', error);
          }
        }, 220);
      }
    } catch (error) {
      console.error('Erreur maj utilisateurs:', error);
    }
  }, [usersData, finalMapConfig.fitBoundsPadding, wantedAgentKeys]);

  // ===== Effects =====
  useEffect(() => {
    const initTimer = setTimeout(initializeMap, 50);
    return () => clearTimeout(initTimer);
  }, [initializeMap]);

  useEffect(() => {
    const timer = setTimeout(updateParksLayer, 120);
    return () => clearTimeout(timer);
  }, [updateParksLayer]);

  useEffect(() => {
    const timer = setTimeout(updateUsersLayer, 150);
    return () => clearTimeout(timer);
  }, [updateUsersLayer]);

  useEffect(() => {
    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          parksLayerRef.current = null;
          usersLayerRef.current = null;
          isInitializedRef.current = false;
        }
      } catch (error) {
        console.warn('Erreur cleanup:', error);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={mapRef}
        className={`map-container ${className}`}
        style={{
          height: '100%',
          width: '100%',
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa'
        }}
        role="application"
        aria-label="Carte interactive des espaces verts et agents"
      />

      <style jsx>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); border: 1px solid #e2e8f0;
        }
        .custom-popup .leaflet-popup-content { margin: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.4; }
        .park-popup .leaflet-popup-tip { background: #48bb78; }
        .user-popup .leaflet-popup-tip { background: #4299e1; }
        .custom-popup .leaflet-popup-close-button { color: #666; font-size: 18px; padding: 4px; }
        .custom-popup .leaflet-popup-close-button:hover { color: #333; }

        /* important pour les DivIcons */
        .leaflet-div-icon.agent-divicon {
          background: transparent;
          border: none;
        }

        @media (max-width: 768px) {
          .popup-content { min-width: 200px !important; max-width: 250px !important; }
          .popup-stats { grid-template-columns: 1fr !important; gap: 8px !important; }
        }
      `}</style>
    </>
  );
});

GeographyChart.displayName = 'GeographyChart';

// ===== EXPORTS =====
export default GeographyChart;
export { MapUtils, PopupContent, NDVI_COLOR_MAP, USER_ICON_CONFIG, NDVICalculator, toSpecialtyKey };
