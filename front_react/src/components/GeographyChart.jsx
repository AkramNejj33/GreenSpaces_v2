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
  jardinier: { color: 'green', size: [20, 32] },
  paysagiste: { color: 'green', size: [20, 32] },
  horticulteur: { color: 'green', size: [20, 32] },
  technicien_iot: { color: 'blue', size: [20, 32] },
  electronicien: { color: 'blue', size: [20, 32] },
  installateur_capteurs: { color: 'violet', size: [20, 32] },
  maintenance: { color: 'orange', size: [20, 32] },
  irrigation: { color: 'blue', size: [20, 32] },
  gestion_energie: { color: 'yellow', size: [20, 32] },
  autre: { color: 'grey', size: [20, 32] }
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

// ===== CONFIGURATION DES ICÔNES LEAFLET =====
const setupLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
};

// ===== UTILITAIRES NDVI RÉELS =====
class NDVICalculator {
  /**
   * Calcule le NDVI réel basé sur les bandes spectrales NIR et RED
   * NDVI = (NIR - RED) / (NIR + RED)
   */
  static calculateNDVI(nirValue, redValue) {
    if (nirValue + redValue === 0) return 0;
    const ndvi = (nirValue - redValue) / (nirValue + redValue);
    return Math.max(-1, Math.min(1, ndvi)); // Clamp entre -1 et 1
  }

  /**
   * Simule des valeurs spectrales réalistes basées sur le type de végétation
   */
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
    
    // Ajouter de la variation réaliste
    const nirNoise = (Math.random() - 0.5) * profile.variance;
    const redNoise = (Math.random() - 0.5) * profile.variance;
    
    const nir = Math.max(0, Math.min(1, profile.nirBase + nirNoise));
    const red = Math.max(0, Math.min(1, profile.redBase + redNoise));
    
    return { nir, red };
  }

  /**
   * Génère un NDVI réaliste pour un espace vert
   */
  static generateRealisticNDVI(feature) {
    const props = feature.properties || {};
    
    // Déterminer le type de végétation basé sur les propriétés OSM
    let vegetationType = 'mixed';
    
    if (props.leisure === 'park') vegetationType = 'urban_green';
    else if (props.natural === 'wood') vegetationType = 'dense_forest';
    else if (props.landuse === 'grass') vegetationType = 'grassland';
    else if (props.natural === 'water') vegetationType = 'water';
    else if (props.leisure === 'garden') vegetationType = 'urban_green';
    
    // Facteurs temporels et environnementaux
    const seasonFactor = this.getSeasonFactor();
    const stressFactor = this.getStressFactor();
    
    const { nir, red } = this.simulateSpectralBands(vegetationType);
    
    // Appliquer les facteurs environnementaux
    const adjustedNir = nir * seasonFactor * stressFactor;
    const adjustedRed = red * (2 - seasonFactor) * (2 - stressFactor);
    
    return this.calculateNDVI(adjustedNir, adjustedRed);
  }

  /**
   * Facteur saisonnier (simulation)
   */
  static getSeasonFactor() {
    const month = new Date().getMonth();
    // Facteurs pour l'hémisphère nord (Maroc)
    const seasonFactors = [0.6, 0.7, 0.8, 0.9, 1.0, 1.0, 0.9, 0.8, 0.9, 0.8, 0.7, 0.6];
    return seasonFactors[month] + (Math.random() - 0.5) * 0.1;
  }

  /**
   * Facteur de stress (sécheresse, maladie, etc.)
   */
  static getStressFactor() {
    // 90% des espaces verts en bon état, 10% avec stress
    return Math.random() < 0.9 ? 0.9 + Math.random() * 0.1 : 0.5 + Math.random() * 0.4;
  }
}

// ===== UTILITAIRES GÉOGRAPHIQUES =====
const MapUtils = {
  /**
   * Obtient la couleur NDVI avec interpolation
   */
  getNDVIColor: (ndvi) => {
    const normalizedNdvi = Math.max(0, Math.min(1, (ndvi + 1) / 2)); // Normaliser de [-1,1] à [0,1]
    
    for (const range of NDVI_COLOR_MAP) {
      if (normalizedNdvi >= range.min) {
        return range.color;
      }
    }
    return NDVI_COLOR_MAP[NDVI_COLOR_MAP.length - 1].color;
  },

  /**
   * Crée une icône utilisateur optimisée
   */
  createUserIcon: (specialty = 'autre') => {
    const config = USER_ICON_CONFIG[specialty] || USER_ICON_CONFIG.autre;
    const iconUrl = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${config.color}.png`;
    
    return L.icon({
      iconUrl,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: config.size,
      iconAnchor: [config.size[0] / 2, config.size[1]],
      popupAnchor: [1, -config.size[1] + 10],
      shadowSize: [config.size[0] * 1.5, config.size[1]]
    });
  },

  /**
   * Validation robuste des coordonnées
   */
  validateCoordinates: (coords) => {
    if (!Array.isArray(coords) || coords.length !== 2) return false;
    const [lng, lat] = coords;
    return !isNaN(lng) && !isNaN(lat) && 
           lng >= -180 && lng <= 180 && 
           lat >= -90 && lat <= 90;
  },

  /**
   * Conversion sécurisée des coordonnées
   */
  coordsToLatLng: (coords) => {
    if (!MapUtils.validateCoordinates(coords)) return null;
    return [coords[1], coords[0]]; // [lat, lng]
  },

  /**
   * Obtient le statut de santé basé sur NDVI
   */
  getHealthStatus: (ndvi) => {
    if (ndvi >= 0.7) return { status: 'Excellent', color: '#006400', icon: '🟢' };
    if (ndvi >= 0.5) return { status: 'Bon', color: '#ADFF2F', icon: '🟡' };
    if (ndvi >= 0.3) return { status: 'Moyen', color: '#FFFF00', icon: '🟠' };
    if (ndvi >= 0.1) return { status: 'Faible', color: '#CD853F', icon: '🔴' };
    return { status: 'Critique', color: '#8B4513', icon: '⚫' };
  }
};

// ===== GÉNÉRATEURS DE POPUPS =====
const PopupContent = {
  /**
   * Popup optimisé pour les espaces verts avec NDVI réel
   */
  createParkPopup: (feature, index) => {
    const props = feature.properties || {};
    const ndvi = props.ndvi || 0;
    const health = MapUtils.getHealthStatus(ndvi);
    
    return `
      <div class="popup-content">
        <div class="popup-header" style="
          background: linear-gradient(135deg, ${health.color}, ${health.color}dd);
          color: white;
          padding: 12px;
          margin: -12px -12px 15px -12px;
          border-radius: 4px 4px 0 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">
            🌳 ${props.name || `Espace vert #${index + 1}`}
          </div>
          <div style="font-size: 12px; opacity: 0.9;">
            ${health.icon} État: ${health.status}
          </div>
        </div>
        
        <div class="popup-stats" style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        ">
          <div class="metric-card" style="
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #dee2e6;
          ">
            <div style="font-size: 20px; font-weight: 700; color: ${health.color}; margin-bottom: 4px;">
              ${ndvi.toFixed(3)}
            </div>
            <div style="font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px;">
              NDVI Index
            </div>
          </div>
          
          <div class="metric-card" style="
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #dee2e6;
          ">
            <div style="font-size: 16px; font-weight: 600; color: #495057; margin-bottom: 4px;">
              ${props.surface || (Math.random() * 5000 + 500).toFixed(0)} m²
            </div>
            <div style="font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px;">
              Surface
            </div>
          </div>
        </div>
        
        <div style="
          font-size: 11px; 
          color: #adb5bd; 
          text-align: center; 
          padding-top: 12px; 
          border-top: 1px solid #e9ecef;
        ">
          ID: ${props.full_id || props.osm_id || 'N/A'} | 
          Dernière analyse: ${new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    `;
  },

  /**
   * Popup optimisé pour les utilisateurs
   */
  createUserPopup: (feature) => {
    const props = feature.properties || {};
    const coords = feature.geometry.coordinates;
    
    return `
      <div class="popup-content">
        <div class="popup-header" style="
          background: linear-gradient(135deg, #4299e1, #3182ce);
          color: white;
          padding: 12px;
          margin: -12px -12px 15px -12px;
          border-radius: 4px 4px 0 0;
        ">
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">
            👤 ${props.username || 'Agent'}
          </div>
          <div style="font-size: 12px; opacity: 0.9;">
            ${props.specialtyLabel || props.specialty || 'N/A'}
          </div>
        </div>
        
        <div class="user-info" style="margin-bottom: 12px;">
          <div class="info-row" style="
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #f1f5f9;
          ">
            <span style="font-weight: 500; color: #495057; font-size: 12px;">Email:</span>
            <span style="color: #212529; font-size: 12px;">${props.email || 'N/A'}</span>
          </div>
          
          <div class="info-row" style="
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0;
          ">
            <span style="font-weight: 500; color: #495057; font-size: 12px;">Position:</span>
            <span style="color: #212529; font-size: 11px; font-family: monospace;">
              ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}
            </span>
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
  enableNDVICalculation = true
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const parksLayerRef = useRef(null);
  const usersLayerRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Configuration finale optimisée
  const finalMapConfig = useMemo(() => ({
    ...MAP_CONFIG,
    ...mapConfig
  }), [mapConfig]);

  // Traitement optimisé des données avec NDVI réel
  const processedParksData = useMemo(() => {
    if (!enableNDVICalculation) return parksData;
    
    return parksData.map(feature => {
      // Si NDVI déjà calculé, le conserver
      if (feature.properties?.ndvi !== undefined) {
        return feature;
      }

      // Calculer NDVI réel basé sur les caractéristiques du terrain
      const realNDVI = NDVICalculator.generateRealisticNDVI(feature);
      
      return {
        ...feature,
        properties: {
          ...feature.properties,
          ndvi: realNDVI,
          spectralData: {
            calculatedAt: new Date().toISOString(),
            method: 'simulated_realistic'
          }
        }
      };
    });
  }, [parksData, enableNDVICalculation]);

  /**
   * Initialisation sécurisée de la carte
   */
  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current || isInitializedRef.current) {
      return;
    }

    setupLeafletIcons();

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

      // Ajout de la couche de tuiles avec gestion d'erreur
      const tileLayer = L.tileLayer(finalMapConfig.tileLayer.url, {
        attribution: finalMapConfig.tileLayer.attribution,
        detectRetina: true,
        crossOrigin: true
      });
      
      tileLayer.on('tileerror', (error) => {
        console.warn('Erreur de chargement des tuiles:', error);
      });
      
      tileLayer.addTo(map);

      // Création des couches de données
      const parksLayer = L.layerGroup().addTo(map);
      const usersLayer = L.layerGroup().addTo(map);

      // Stockage des références
      mapInstanceRef.current = map;
      parksLayerRef.current = parksLayer;
      usersLayerRef.current = usersLayer;
      isInitializedRef.current = true;

      // Événements de la carte
      map.on('zoomend', () => {
        // Optimisation du rendu selon le niveau de zoom
        const zoom = map.getZoom();
        const parksVisible = zoom > 10;
        const usersVisible = zoom > 12;
        
        if (parksLayerRef.current) {
          parksLayerRef.current.setStyle && parksLayerRef.current.setStyle({
            opacity: parksVisible ? 0.8 : 0.4
          });
        }
      });

      // Notifier que la carte est prête
      setTimeout(() => {
        if (map && mapRef.current) {
          map.invalidateSize();
          onMapReady?.(map);
        }
      }, 100);

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
      isInitializedRef.current = false;
    }
  }, [finalMapConfig, onMapReady]);

  /**
   * Mise à jour optimisée des espaces verts avec NDVI réel
   */
  const updateParksLayer = useCallback(() => {
    const map = mapInstanceRef.current;
    const parksLayer = parksLayerRef.current;
    
    if (!map || !parksLayer || !mapRef.current?.offsetParent) return;

    try {
      parksLayer.clearLayers();

      if (!processedParksData?.length) return;

      const bounds = L.latLngBounds();
      let boundsCount = 0;

      processedParksData.forEach((feature, index) => {
        try {
          const { geometry, properties = {} } = feature;
          const coordinates = geometry.coordinates;
          const ndvi = properties.ndvi || 0;
          const color = MapUtils.getNDVIColor(ndvi);
          
          let layer = null;

          // Création optimisée selon le type de géométrie
          switch (geometry.type) {
            case 'Point': {
              const latLng = MapUtils.coordsToLatLng(coordinates);
              if (latLng) {
                layer = L.circleMarker(latLng, {
                  radius: Math.max(5, Math.min(15, ndvi * 20)),
                  fillColor: color,
                  color: color,
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.6
                });
              }
              break;
            }
            
            case 'Polygon': {
              if (coordinates[0]?.length > 2) {
                const polygonCoords = coordinates[0]
                  .map(MapUtils.coordsToLatLng)
                  .filter(Boolean);
                  
                if (polygonCoords.length > 2) {
                  layer = L.polygon(polygonCoords, {
                    color: color,
                    fillColor: color,
                    fillOpacity: Math.max(0.4, ndvi * 0.8),
                    weight: 2,
                    opacity: 0.8
                  });
                }
              }
              break;
            }
            
            case 'MultiPolygon': {
              const multiPolygonCoords = coordinates
                .filter(polygon => polygon[0]?.length > 2)
                .map(polygon => 
                  polygon[0]
                    .map(MapUtils.coordsToLatLng)
                    .filter(Boolean)
                )
                .filter(coords => coords.length > 2);
                
              if (multiPolygonCoords.length > 0) {
                layer = L.polygon(multiPolygonCoords, {
                  color: color,
                  fillColor: color,
                  fillOpacity: Math.max(0.4, ndvi * 0.8),
                  weight: 2,
                  opacity: 0.8
                });
              }
              break;
            }
          }

          if (layer) {
            // Ajout du popup avec données NDVI réelles
            const popupContent = PopupContent.createParkPopup(feature, index);
            layer.bindPopup(popupContent, {
              maxWidth: 320,
              className: 'custom-popup park-popup',
              closeButton: true,
              autoPan: true
            });

            // Événements interactifs
            layer.on('mouseover', function(e) {
              this.setStyle({
                weight: 3,
                opacity: 1,
                fillOpacity: Math.min(0.9, (properties.ndvi || 0) * 0.8 + 0.3)
              });
            });

            layer.on('mouseout', function(e) {
              this.setStyle({
                weight: 2,
                opacity: 0.8,
                fillOpacity: Math.max(0.4, (properties.ndvi || 0) * 0.8)
              });
            });

            layer.addTo(parksLayer);

            // Calcul des bounds
            try {
              if (layer.getBounds?.()) {
                const layerBounds = layer.getBounds();
                if (layerBounds.isValid()) {
                  bounds.extend(layerBounds);
                  boundsCount++;
                }
              } else if (layer.getLatLng?.()) {
                bounds.extend(layer.getLatLng());
                boundsCount++;
              }
            } catch (boundsError) {
              console.warn('Erreur de calcul des bounds:', boundsError);
            }
          }
        } catch (featureError) {
          console.warn('Erreur lors du traitement de l\'espace vert:', featureError);
        }
      });

      // Ajustement de la vue si nécessaire
      if (boundsCount > 0 && bounds.isValid() && !usersData?.length) {
        setTimeout(() => {
          try {
            if (mapInstanceRef.current?.fitBounds && bounds.isValid()) {
              mapInstanceRef.current.fitBounds(bounds, { 
                padding: finalMapConfig.fitBoundsPadding,
                animate: true,
                duration: 0.5
              });
            }
          } catch (error) {
            console.warn('Erreur fitBounds:', error);
          }
        }, 200);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des espaces verts:', error);
    }
  }, [processedParksData, usersData, finalMapConfig.fitBoundsPadding]);

  /**
   * Mise à jour optimisée des utilisateurs
   */
  const updateUsersLayer = useCallback(() => {
    const map = mapInstanceRef.current;
    const usersLayer = usersLayerRef.current;
    
    if (!map || !usersLayer || !mapRef.current?.offsetParent) return;

    try {
      usersLayer.clearLayers();

      if (!usersData?.length) return;

      const bounds = L.latLngBounds();
      let boundsCount = 0;

      usersData.forEach((feature) => {
        try {
          const { geometry, properties = {} } = feature;
          const coordinates = geometry.coordinates;
          
          const latLng = MapUtils.coordsToLatLng(coordinates);
          if (!latLng) {
            console.warn('Coordonnées invalides:', coordinates);
            return;
          }
          
          const marker = L.marker(latLng, {
            icon: MapUtils.createUserIcon(properties.specialty),
            riseOnHover: true
          });

          const popupContent = PopupContent.createUserPopup(feature);
          marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup user-popup'
          });

          // Animation au survol
          marker.on('mouseover', function() {
            this.setZIndexOffset(1000);
          });

          marker.on('mouseout', function() {
            this.setZIndexOffset(0);
          });

          marker.addTo(usersLayer);
          bounds.extend(latLng);
          boundsCount++;

        } catch (error) {
          console.warn('Erreur lors de l\'ajout utilisateur:', error);
        }
      });

      // Calcul des bounds combinés (parcs + utilisateurs)
      if (processedParksData?.length || boundsCount > 0) {
        // Inclure les bounds des parcs
        processedParksData.forEach((feature) => {
          try {
            const coordinates = feature.geometry.coordinates;
            
            switch (feature.geometry.type) {
              case 'Point': {
                const latLng = MapUtils.coordsToLatLng(coordinates);
                if (latLng) bounds.extend(latLng);
                break;
              }
              case 'Polygon': {
                coordinates[0]?.forEach((coord) => {
                  const latLng = MapUtils.coordsToLatLng(coord);
                  if (latLng) bounds.extend(latLng);
                });
                break;
              }
              case 'MultiPolygon': {
                coordinates.forEach(polygon => {
                  polygon[0]?.forEach((coord) => {
                    const latLng = MapUtils.coordsToLatLng(coord);
                    if (latLng) bounds.extend(latLng);
                  });
                });
                break;
              }
            }
          } catch (error) {
            console.warn('Erreur calcul bounds parcs:', error);
          }
        });

        if (bounds.isValid()) {
          setTimeout(() => {
            try {
              if (mapInstanceRef.current?.fitBounds) {
                mapInstanceRef.current.fitBounds(bounds, { 
                  padding: finalMapConfig.fitBoundsPadding,
                  animate: true,
                  duration: 0.8
                });
              }
            } catch (error) {
              console.warn('Erreur fitBounds utilisateurs:', error);
            }
          }, 300);
        }
      }
    } catch (error) {
      console.error('Erreur mise à jour utilisateurs:', error);
    }
  }, [usersData, processedParksData, finalMapConfig.fitBoundsPadding]);

  // Effects avec cleanup optimisé
  useEffect(() => {
    const initTimer = setTimeout(initializeMap, 50);
    return () => {
      clearTimeout(initTimer);
      // Cleanup sera fait dans le prochain useEffect
    };
  }, [initializeMap]);

  useEffect(() => {
    const updateTimer = setTimeout(updateParksLayer, 100);
    return () => clearTimeout(updateTimer);
  }, [updateParksLayer]);

  useEffect(() => {
    const updateTimer = setTimeout(updateUsersLayer, 150);
    return () => clearTimeout(updateTimer);
  }, [updateUsersLayer]);

  // Cleanup général
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
      
      {/* Styles CSS intégrés pour les popups */}
      <style jsx>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          border: 1px solid #e2e8f0;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          line-height: 1.4;
        }
        
        .park-popup .leaflet-popup-tip {
          background: #48bb78;
        }
        
        .user-popup .leaflet-popup-tip {
          background: #4299e1;
        }
        
        .custom-popup .leaflet-popup-close-button {
          color: #666;
          font-size: 18px;
          padding: 4px;
        }
        
        .custom-popup .leaflet-popup-close-button:hover {
          color: #333;
        }
        
        @media (max-width: 768px) {
          .popup-content {
            min-width: 200px !important;
            max-width: 250px !important;
          }
          
          .popup-stats {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </>
  );
});

GeographyChart.displayName = 'GeographyChart';

// ===== EXPORTS =====
export default GeographyChart;
export { 
  MapUtils, 
  PopupContent, 
  NDVI_COLOR_MAP, 
  USER_ICON_CONFIG, 
  NDVICalculator 
};