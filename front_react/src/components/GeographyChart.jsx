import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correction des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GeographyChart = ({ parksData, usersData, onMapReady }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const parksLayerRef = useRef(null);
  const usersLayerRef = useRef(null);

  const getNDVIColor = (ndvi) => {
    if (ndvi < 0.2) return '#8B4513';
    if (ndvi < 0.4) return '#CD853F';
    if (ndvi < 0.6) return '#FFFF00';
    if (ndvi < 0.8) return '#ADFF2F';
    return '#006400';
  };

  const getUserIcon = (specialty) => {
    const iconUrl = specialty === 'technicien_iot' 
      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
      : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
    
    return L.icon({
      iconUrl: iconUrl,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  // Initialiser la carte
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([33.5731, -7.5898], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const parksLayer = L.layerGroup().addTo(map);
    const usersLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    parksLayerRef.current = parksLayer;
    usersLayerRef.current = usersLayer;

    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
        parksLayerRef.current = null;
        usersLayerRef.current = null;
      }
    };
  }, [onMapReady]);

  // Mettre à jour les espaces verts
  useEffect(() => {
    const map = mapInstanceRef.current;
    const parksLayer = parksLayerRef.current;
    if (!map || !parksLayer) return;

    parksLayer.clearLayers();

    if (!parksData || parksData.length === 0) return;

    const bounds = L.latLngBounds();
    let boundsAdded = false;

    parksData.forEach((feature, index) => {
      const coordinates = feature.geometry.coordinates;
      let layer;

      try {
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
                🌳 ${feature.properties?.name || `Espace vert ${index + 1}`}
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
              <div style="margin-top: 8px; font-size: 0.8em; color: #666;">
                ID: ${feature.properties?.full_id || 'N/A'}
              </div>
            </div>
          `;

          layer.bindPopup(popupContent);
          layer.addTo(parksLayer);

          // Ajouter aux bounds
          if (layer.getBounds) {
            bounds.extend(layer.getBounds());
            boundsAdded = true;
          } else if (layer.getLatLng) {
            bounds.extend(layer.getLatLng());
            boundsAdded = true;
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'espace vert:', error, feature);
      }
    });

    // Ajuster la vue si on a des bounds pour les parcs seulement
    if (boundsAdded && bounds.isValid() && (!usersData || usersData.length === 0)) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [parksData, usersData]);

  // Mettre à jour les utilisateurs
  useEffect(() => {
    const map = mapInstanceRef.current;
    const usersLayer = usersLayerRef.current;
    if (!map || !usersLayer) return;

    usersLayer.clearLayers();

    if (!usersData || usersData.length === 0) return;

    const bounds = L.latLngBounds();
    let boundsAdded = false;

    usersData.forEach((feature) => {
      try {
        const coordinates = feature.geometry.coordinates;
        const props = feature.properties;
        
        // Vérifier que les coordonnées sont valides
        if (!coordinates || coordinates.length !== 2 || 
            isNaN(coordinates[0]) || isNaN(coordinates[1])) {
          console.warn('Coordonnées invalides pour l\'utilisateur:', props);
          return;
        }
        
        const marker = L.marker([coordinates[1], coordinates[0]], {
          icon: getUserIcon(props.specialty)
        });

        const popupContent = `
          <div class="popup-content">
            <div class="popup-title">
              👤 ${props.username || 'Utilisateur'}
            </div>
            <div class="popup-info">
              <div class="popup-stat">
                <div class="popup-stat-value">${props.specialtyLabel || props.specialty || 'N/A'}</div>
                <div class="popup-stat-label">Spécialité</div>
              </div>
              <div class="popup-stat">
                <div class="popup-stat-value">${props.email || 'N/A'}</div>
                <div class="popup-stat-label">Email</div>
              </div>
              <div class="popup-stat">
                <div class="popup-stat-value">${props.created_at || 'N/A'}</div>
                <div class="popup-stat-label">Créé le</div>
              </div>
              <div class="popup-stat">
                <div class="popup-stat-value">${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}</div>
                <div class="popup-stat-label">Coordonnées</div>
              </div>
            </div>
            <div style="margin-top: 8px; font-size: 0.8em; color: #666;">
              ID: ${props.id || 'N/A'}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(usersLayer);

        bounds.extend([coordinates[1], coordinates[0]]);
        boundsAdded = true;
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'utilisateur:', error, feature);
      }
    });

    // Ajuster la vue pour inclure tous les éléments
    if (boundsAdded || (parksData && parksData.length > 0)) {
      // Inclure les bounds des parcs aussi
      if (parksData && parksData.length > 0) {
        parksData.forEach((feature) => {
          try {
            const coordinates = feature.geometry.coordinates;
            if (feature.geometry.type === 'Point') {
              bounds.extend([coordinates[1], coordinates[0]]);
            } else if (feature.geometry.type === 'Polygon') {
              coordinates[0].forEach((coord) => {
                bounds.extend([coord[1], coord[0]]);
              });
            } else if (feature.geometry.type === 'MultiPolygon') {
              feature.geometry.coordinates.forEach(polygon => {
                polygon[0].forEach((coord) => {
                  bounds.extend([coord[1], coord[0]]);
                });
              });
            }
          } catch (error) {
            console.error('Erreur lors du calcul des bounds pour les parcs:', error);
          }
        });
      }

      if (bounds.isValid()) {
        setTimeout(() => {
          map.fitBounds(bounds, { padding: [20, 20] });
        }, 100);
      }
    }
  }, [usersData, parksData]);

  return (
    <div 
      ref={mapRef} 
      className="map-container"
      style={{ height: '100%', width: '100%', position: 'relative' }}
    />
  );
};

export default GeographyChart;