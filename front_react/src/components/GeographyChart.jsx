import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Configuration des couleurs NDVI
 * Synchronisée avec NdviLegend pour la cohérence
 */
const NDVI_COLOR_MAP = [
  { min: 0.8, color: '#006400' }, // Végétation dense
  { min: 0.6, color: '#ADFF2F' }, // Végétation saine
  { min: 0.4, color: '#FFFF00' }, // Végétation modérée
  { min: 0.2, color: '#CD853F' }, // Végétation faible
  { min: 0.0, color: '#8B4513' }  // Sol nu
];

/**
 * Configuration des icônes utilisateur par spécialité
 */
const USER_ICON_CONFIG = {
  jardinier: {
    color: 'green',
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
  },
  paysagiste: {
    color: 'green',
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
  },
  horticulteur: {
    color: 'green',
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
  },
  technicien_iot: {
    color: 'blue',
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
  },
  electronicien: {
    color: 'blue',
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
  },
  installateur_capteurs: {
    color: 'violet',
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png'
  },
  maintenance: {
    color: 'orange',
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png'
  },
  irrigation: {
    color: 'blue',
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
  },
  gestion_energie: {
    color: 'yellow',
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png'
  },
  autre: {
    color: 'grey',
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png'
  }
};

/**
 * Configuration par défaut de la carte
 */
const MAP_CONFIG = {
  center: [33.5731, -7.5898], // Casablanca, Morocco
  zoom: 11,
  tileLayer: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  fitBoundsPadding: [20, 20]
};

/**
 * Configuration des icônes Leaflet par défaut
 */
const setupLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

/**
 * Utilitaires pour les couleurs et icônes
 */
const MapUtils = {
  /**
   * Obtient la couleur correspondant à une valeur NDVI
   */
  getNDVIColor: (ndvi) => {
    const range = NDVI_COLOR_MAP.find(range => ndvi >= range.min);
    return range ? range.color : NDVI_COLOR_MAP[NDVI_COLOR_MAP.length - 1].color;
  },

  /**
   * Crée une icône personnalisée pour un utilisateur
   */
  getUserIcon: (specialty) => {
    const config = USER_ICON_CONFIG[specialty] || USER_ICON_CONFIG.autre;
    
    return L.icon({
      iconUrl: config.url,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  },

  /**
   * Valide les coordonnées
   */
  validateCoordinates: (coordinates) => {
    return coordinates && 
           coordinates.length === 2 && 
           !isNaN(coordinates[0]) && 
           !isNaN(coordinates[1]) &&
           coordinates[0] >= -180 && coordinates[0] <= 180 &&
           coordinates[1] >= -90 && coordinates[1] <= 90;
  },

  /**
   * Convertit les coordonnées GeoJSON en LatLng Leaflet
   */
  coordsToLatLng: (coords) => [coords[1], coords[0]],

  /**
   * Obtient le statut de santé basé sur NDVI
   */
  getHealthStatus: (ndvi) => {
    if (ndvi >= 0.8) return { status: 'Excellent', color: '#006400' };
    if (ndvi >= 0.6) return { status: 'Bon', color: '#ADFF2F' };
    if (ndvi >= 0.4) return { status: 'Modéré', color: '#FFFF00' };
    if (ndvi >= 0.2) return { status: 'Faible', color: '#CD853F' };
    return { status: 'Critique', color: '#8B4513' };
  }
};

/**
 * Générateurs de contenu pour les popups
 */
const PopupContent = {
  /**
   * Génère le contenu du popup pour un espace vert avec vraie valeur NDVI
   */
  createParkPopup: (feature, index) => {
    const props = feature.properties || {};
    // Utiliser la vraie valeur NDVI depuis les propriétés
    const ndvi = props.ndvi !== undefined ? props.ndvi : 0;
    const health = MapUtils.getHealthStatus(ndvi);
    
    return `
      <div class="popup-content" style="min-width: 250px;">
        <div class="popup-header" style="
          padding: 12px;
          background: linear-gradient(135deg, #48bb78, #38a169);
          color: white;
          margin: -10px -10px 12px -10px;
          border-radius: 4px 4px 0 0;
        ">
          <div style="font-weight: bold; font-size: 16px;">
            🌳 ${props.name || `Espace vert #${index + 1}`}
          </div>
        </div>
        
        <div class="popup-stats" style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        ">
          <div class="popup-stat" style="text-align: center; padding: 8px; background: #f7fafc; border-radius: 4px;">
            <div style="font-size: 18px; font-weight: bold; color: ${health.color};">
              ${ndvi.toFixed(3)}
            </div>
            <div style="font-size: 12px; color: #666;">NDVI</div>
          </div>
          
          <div class="popup-stat" style="text-align: center; padding: 8px; background: #f7fafc; border-radius: 4px;">
            <div style="font-size: 14px; font-weight: bold; color: ${health.color};">
              ${health.status}
            </div>
            <div style="font-size: 12px; color: #666;">État</div>
          </div>
          
          <div class="popup-stat" style="text-align: center; padding: 8px; background: #f7fafc; border-radius: 4px;">
            <div style="font-size: 14px; font-weight: bold; color: #2d3748;">
              ${props.surface || 'N/A'} m²
            </div>
            <div style="font-size: 12px; color: #666;">Surface</div>
          </div>
          
          <div class="popup-stat" style="text-align: center; padding: 8px; background: #f7fafc; border-radius: 4px;">
            <div style="font-size: 12px; font-weight: bold; color: #2d3748;">
              ${props.lastMaintenance || 'N/A'}
            </div>
            <div style="font-size: 12px; color: #666;">Dernière maintenance</div>
          </div>
        </div>
        
        <div style="font-size: 11px; color: #a0aec0; text-align: center; padding-top: 8px; border-top: 1px solid #e2e8f0;">
          ID: ${props.full_id || props.osm_id || 'N/A'}
        </div>
      </div>
    `;
  },

  /**
   * Génère le contenu du popup pour un utilisateur/agent (sans bouton d'assignation)
   */
  createUserPopup: (feature) => {
    const props = feature.properties || {};
    const coords = feature.geometry.coordinates;
    
    return `
      <div class="popup-content" style="min-width: 280px;">
        <div class="popup-header" style="
          padding: 12px;
          background: linear-gradient(135deg, #4299e1, #3182ce);
          color: white;
          margin: -10px -10px 12px -10px;
          border-radius: 4px 4px 0 0;
        ">
          <div style="font-weight: bold; font-size: 16px;">
            👤 ${props.username || 'Agent'}
          </div>
          <div style="font-size: 12px; opacity: 0.9;">
            ${props.specialtyLabel || props.specialty || 'N/A'}
          </div>
        </div>
        
        <div class="popup-info" style="margin-bottom: 15px;">
          <div class="info-row" style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="font-weight: 500; color: #4a5568;">Email:</span>
            <span style="color: #2d3748; font-size: 13px;">${props.email || 'N/A'}</span>
          </div>
          
          <div class="info-row" style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="font-weight: 500; color: #4a5568;">Inscrit le:</span>
            <span style="color: #2d3748; font-size: 13px;">${props.created_at || 'N/A'}</span>
          </div>
          
          <div class="info-row" style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="font-weight: 500; color: #4a5568;">Position:</span>
            <span style="color: #2d3748; font-size: 11px;">${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}</span>
          </div>
        </div>
        
        <div style="font-size: 11px; color: #a0aec0; text-align: center; padding-top: 12px; border-top: 1px solid #e2e8f0;">
          ID Agent: ${props.id || 'N/A'}
        </div>
      </div>
    `;
  }
};

/**
 * Composant principal de la carte géographique
 */
const GeographyChart = ({ 
  parksData = [], 
  usersData = [], 
  onMapReady,
  mapConfig = {},
  className = ""
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const parksLayerRef = useRef(null);
  const usersLayerRef = useRef(null);

  // Configuration finale de la carte
  const finalMapConfig = { ...MAP_CONFIG, ...mapConfig };

  /**
   * Initialise la carte Leaflet
   */
  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Configuration des icônes Leaflet
    setupLeafletIcons();

    try {
      // Création de la carte avec gestion d'erreur
      const map = L.map(mapRef.current, {
        center: finalMapConfig.center,
        zoom: finalMapConfig.zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true
      });

      // Ajout de la couche de tuiles
      L.tileLayer(finalMapConfig.tileLayer.url, {
        attribution: finalMapConfig.tileLayer.attribution
      }).addTo(map);

      // Création des couches pour les différents types de données
      const parksLayer = L.layerGroup().addTo(map);
      const usersLayer = L.layerGroup().addTo(map);

      // Stockage des références
      mapInstanceRef.current = map;
      parksLayerRef.current = parksLayer;
      usersLayerRef.current = usersLayer;

      // Attendre que la carte soit complètement initialisée
      setTimeout(() => {
        if (map && mapRef.current) {
          map.invalidateSize();
          
          // Callback pour notifier que la carte est prête
          if (onMapReady) {
            onMapReady(map);
          }
        }
      }, 100);

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          parksLayerRef.current = null;
          usersLayerRef.current = null;
        }
      } catch (error) {
        console.error('Erreur lors du nettoyage de la carte:', error);
      }
    };
  }, [finalMapConfig, onMapReady]);

  /**
   * Met à jour les espaces verts sur la carte avec vraies valeurs NDVI
   */
  const updateParksLayer = useCallback(() => {
    const map = mapInstanceRef.current;
    const parksLayer = parksLayerRef.current;
    
    if (!map || !parksLayer || !mapRef.current) return;

    // Vérifier que la carte est toujours montée
    if (!mapRef.current.offsetParent) return;

    try {
      parksLayer.clearLayers();

      if (!parksData?.length) return;

      const bounds = L.latLngBounds();
      let boundsAdded = false;

      parksData.forEach((feature, index) => {
        try {
          const coordinates = feature.geometry.coordinates;
          // Utiliser la vraie valeur NDVI depuis les propriétés du feature
          const ndvi = feature.properties?.ndvi !== undefined ? feature.properties.ndvi : 0;
          const color = MapUtils.getNDVIColor(ndvi);
          let layer;

          // Création du layer selon le type de géométrie
          switch (feature.geometry.type) {
            case 'Point':
              if (MapUtils.validateCoordinates(coordinates)) {
                layer = L.marker(MapUtils.coordsToLatLng(coordinates));
              }
              break;
              
            case 'Polygon':
              if (coordinates[0] && coordinates[0].length > 2) {
                const polygonCoords = coordinates[0]
                  .filter(coord => MapUtils.validateCoordinates(coord))
                  .map(MapUtils.coordsToLatLng);
                  
                if (polygonCoords.length > 2) {
                  layer = L.polygon(polygonCoords, {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    weight: 2,
                    opacity: 0.8
                  });
                }
              }
              break;
              
            case 'MultiPolygon':
              if (coordinates.length > 0) {
                const multiPolygonCoords = coordinates
                  .filter(polygon => polygon[0] && polygon[0].length > 2)
                  .map(polygon =>
                    polygon[0]
                      .filter(coord => MapUtils.validateCoordinates(coord))
                      .map(MapUtils.coordsToLatLng)
                  )
                  .filter(coords => coords.length > 2);
                  
                if (multiPolygonCoords.length > 0) {
                  layer = L.polygon(multiPolygonCoords, {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    weight: 2,
                    opacity: 0.8
                  });
                }
              }
              break;
              
            default:
              console.warn(`Type de géométrie non supporté: ${feature.geometry.type}`);
              return;
          }

          if (layer) {
            // Ajout du popup avec vraie valeur NDVI
            const popupContent = PopupContent.createParkPopup(feature, index);
            layer.bindPopup(popupContent, {
              maxWidth: 300,
              className: 'custom-popup'
            });

            layer.addTo(parksLayer);

            // Calcul des bounds
            if (layer.getBounds && typeof layer.getBounds === 'function') {
              const layerBounds = layer.getBounds();
              if (layerBounds.isValid()) {
                bounds.extend(layerBounds);
                boundsAdded = true;
              }
            } else if (layer.getLatLng && typeof layer.getLatLng === 'function') {
              bounds.extend(layer.getLatLng());
              boundsAdded = true;
            }
          }
        } catch (error) {
          console.error('Erreur lors de l\'ajout de l\'espace vert:', error, feature);
        }
      });

      // Ajustement de la vue si nécessaire
      if (boundsAdded && bounds.isValid() && !usersData?.length && map._container) {
        setTimeout(() => {
          try {
            if (mapInstanceRef.current && mapRef.current && bounds.isValid()) {
              mapInstanceRef.current.fitBounds(bounds, { 
                padding: finalMapConfig.fitBoundsPadding,
                animate: false
              });
            }
          } catch (error) {
            console.error('Erreur lors du fitBounds pour les parcs:', error);
          }
        }, 200);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des parcs:', error);
    }
  }, [parksData, usersData, finalMapConfig.fitBoundsPadding]);

  /**
   * Met à jour les utilisateurs sur la carte (sans bouton d'assignation)
   */
  const updateUsersLayer = useCallback(() => {
    const map = mapInstanceRef.current;
    const usersLayer = usersLayerRef.current;
    
    if (!map || !usersLayer || !mapRef.current) return;

    // Vérifier que la carte est toujours montée
    if (!mapRef.current.offsetParent) return;

    try {
      usersLayer.clearLayers();

      if (!usersData?.length) return;

      const bounds = L.latLngBounds();
      let boundsAdded = false;

      usersData.forEach((feature) => {
        try {
          const coordinates = feature.geometry.coordinates;
          const props = feature.properties || {};
          
          // Validation des coordonnées
          if (!MapUtils.validateCoordinates(coordinates)) {
            console.warn('Coordonnées invalides pour l\'utilisateur:', props);
            return;
          }
          
          // Création du marqueur
          const marker = L.marker(MapUtils.coordsToLatLng(coordinates), {
            icon: MapUtils.getUserIcon(props.specialty)
          });

          // Ajout du popup sans bouton d'attribution de tâche
          const popupContent = PopupContent.createUserPopup(feature);
          marker.bindPopup(popupContent, {
            maxWidth: 320,
            className: 'custom-popup user-popup'
          });

          marker.addTo(usersLayer);
          bounds.extend(MapUtils.coordsToLatLng(coordinates));
          boundsAdded = true;

        } catch (error) {
          console.error('Erreur lors de l\'ajout de l\'utilisateur:', error, feature);
        }
      });

      // Ajustement de la vue pour inclure tous les éléments
      if (boundsAdded || parksData?.length) {
        // Inclusion des bounds des parcs
        if (parksData?.length) {
          parksData.forEach((feature) => {
            try {
              const coordinates = feature.geometry.coordinates;
              
              switch (feature.geometry.type) {
                case 'Point':
                  if (MapUtils.validateCoordinates(coordinates)) {
                    bounds.extend(MapUtils.coordsToLatLng(coordinates));
                  }
                  break;
                  
                case 'Polygon':
                  if (coordinates[0]) {
                    coordinates[0].forEach((coord) => {
                      if (MapUtils.validateCoordinates(coord)) {
                        bounds.extend(MapUtils.coordsToLatLng(coord));
                      }
                    });
                  }
                  break;
                  
                case 'MultiPolygon':
                  coordinates.forEach(polygon => {
                    if (polygon[0]) {
                      polygon[0].forEach((coord) => {
                        if (MapUtils.validateCoordinates(coord)) {
                          bounds.extend(MapUtils.coordsToLatLng(coord));
                        }
                      });
                    }
                  });
                  break;
              }
            } catch (error) {
              console.error('Erreur lors du calcul des bounds pour les parcs:', error);
            }
          });
        }

        if (bounds.isValid() && map._container) {
          setTimeout(() => {
            try {
              if (mapInstanceRef.current && mapRef.current && bounds.isValid()) {
                mapInstanceRef.current.fitBounds(bounds, { 
                  padding: finalMapConfig.fitBoundsPadding,
                  animate: false
                });
              }
            } catch (error) {
              console.error('Erreur lors du fitBounds pour les utilisateurs:', error);
            }
          }, 300);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des utilisateurs:', error);
    }
  }, [usersData, parksData, finalMapConfig.fitBoundsPadding]);

  // Initialisation de la carte
  useEffect(() => {
    // Attendre que le DOM soit prêt
    const initTimer = setTimeout(() => {
      const cleanup = initializeMap();
      return cleanup;
    }, 50);

    return () => {
      clearTimeout(initTimer);
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          parksLayerRef.current = null;
          usersLayerRef.current = null;
        }
      } catch (error) {
        console.error('Erreur lors du nettoyage final:', error);
      }
    };
  }, []);

  // Mise à jour des espaces verts avec debounce
  useEffect(() => {
    const updateTimer = setTimeout(() => {
      updateParksLayer();
    }, 100);

    return () => clearTimeout(updateTimer);
  }, [parksData]);

  // Mise à jour des utilisateurs avec debounce
  useEffect(() => {
    const updateTimer = setTimeout(() => {
      updateUsersLayer();
    }, 150);

    return () => clearTimeout(updateTimer);
  }, [usersData]);

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
          overflow: 'hidden'
        }}
      />
      
      {/* Styles CSS pour les popups personnalisés */}
      <style jsx>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 10px;
        }
        
        .user-popup .leaflet-popup-tip {
          background: #4299e1;
        }
        
        @media (max-width: 768px) {
          .popup-content {
            min-width: 200px !important;
          }
          
          .popup-stats {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
};

export default GeographyChart;
export { MapUtils, PopupContent, NDVI_COLOR_MAP, USER_ICON_CONFIG };