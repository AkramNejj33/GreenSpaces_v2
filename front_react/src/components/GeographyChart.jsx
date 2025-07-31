import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


const GeographyChart = ({ parksData, onMapReady }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const parksLayerRef = useRef(null);

  const getNDVIColor = (ndvi) => {
    if (ndvi < 0.2) return '#8B4513';
    if (ndvi < 0.4) return '#CD853F';
    if (ndvi < 0.6) return '#FFFF00';
    if (ndvi < 0.8) return '#ADFF2F';
    return '#006400';
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([33.5731, -7.5898], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const parksLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    parksLayerRef.current = parksLayer;

    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      parksLayerRef.current = null;
    };
  }, [onMapReady]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const parksLayer = parksLayerRef.current;
    if (!map || !parksLayer || !parksData || parksData.length === 0) return;

    parksLayer.clearLayers();

    const bounds = L.latLngBounds();

    parksData.forEach((feature, index) => {
      const coordinates = feature.geometry.coordinates;
      let layer;

      if (feature.geometry.type === 'Point') {
        layer = L.marker([coordinates[1], coordinates[0]]);
      } else if (feature.geometry.type === 'Polygon') {
        const latLngs = coordinates[0].map(coord => [coord[1], coord[0]]);
        const ndvi = feature.properties?.ndvi || 0;
        layer = L.polygon(latLngs, {
          color: getNDVIColor(ndvi),
          fillColor: getNDVIColor(ndvi),
          fillOpacity: 0.7,
          weight: 2
        });
      } else if (feature.geometry.type === 'MultiPolygon') {
        const latLngs = coordinates.map(polygon =>
          polygon[0].map(coord => [coord[1], coord[0]])
        );
        const ndvi = feature.properties?.ndvi || 0;
        layer = L.polygon(latLngs, {
          color: getNDVIColor(ndvi),
          fillColor: getNDVIColor(ndvi),
          fillOpacity: 0.7,
          weight: 2
        });
      }

      if (layer) {
        const popupContent = `
          <div class="popup-content">
            <div class="popup-title">
              <i class="fas fa-tree"></i>
              ${feature.properties?.name || `Espace vert #${index + 1}`}
            </div>
            <div class="popup-info">
              <div class="popup-stat">
                <div class="popup-stat-value">${(feature.properties?.ndvi || 0).toFixed(3)}</div>
                <div class="popup-stat-label">NDVI</div>
              </div>
              <div class="popup-stat">
                <div class="popup-stat-value">${feature.properties?.healthStatus || 'N/A'}</div>
                <div class="popup-stat-label">État</div>
              </div>
              <div class="popup-stat">
                <div class="popup-stat-value">${feature.properties?.lastMaintenance || 'N/A'}</div>
                <div class="popup-stat-label">Dernière maintenance</div>
              </div>
              <div class="popup-stat">
                <div class="popup-stat-value">${feature.properties?.surface || 'N/A'} m²</div>
                <div class="popup-stat-label">Surface</div>
              </div>
            </div>
          </div>
        `;

        layer.bindPopup(popupContent);
        layer.addTo(parksLayer);

        if (layer.getBounds) {
          bounds.extend(layer.getBounds());
        } else if (layer.getLatLng) {
          bounds.extend(layer.getLatLng());
        }
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [parksData]);

  return (
    <div className="map-container">
      <div id="map" ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
};

export default GeographyChart;
