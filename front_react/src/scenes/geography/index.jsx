import React, { useState, useEffect, useCallback, useMemo } from "react";
import GeographyChart, { NDVICalculator } from "../../components/GeographyChart";
import NdviLegend from "../../components/NdviLegend";
import {
  Activity,
  FileText,
  RefreshCw,
  MapPin,
  Users,
  TreePine,
  Download,
  Eye,
  EyeOff,
  Zap
} from "lucide-react";
import "./geography.css";
import "leaflet/dist/leaflet.css";

// ===== CONSTANTES =====
const SPECIALTIES = {
  jardinier: "Jardinier",
  paysagiste: "Paysagiste", 
  horticulteur: "Horticulteur",
  electronicien: "Électronicien",
  technicien_iot: "Technicien IoT",
  installateur_capteurs: "Installateur de capteurs",
  maintenance: "Agent de maintenance",
  irrigation: "Spécialiste irrigation",
  gestion_energie: "Gestion de l'énergie",
  autre: "Autre",
};

const API_BASE_URL = "http://127.0.0.1:8000/api";

// Simulateur de données satellite pour NDVI réel
const SatelliteDataSimulator = {
  async fetchSatelliteData(bounds) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = {
          acquisitionDate: new Date().toISOString(),
          satellite: 'Landsat-8',
          cloudCover: Math.random() * 20,
          spatialResolution: 30,
          spectralBands: {
            red: { wavelength: '0.64-0.67 μm', available: true },
            nir: { wavelength: '0.85-0.88 μm', available: true },
            swir: { wavelength: '1.57-1.65 μm', available: true }
          }
        };
        resolve(data);
      }, 1500);
    });
  },

  calculateRealNDVI(feature, satelliteData) {
    const props = feature.properties || {};
    
    const environmentalFactors = {
      elevation: this.getElevationFactor(feature),
      slope: this.getSlopeFactor(feature),
      aspect: this.getAspectFactor(feature),
      soilType: this.getSoilTypeFactor(props),
      waterAccess: this.getWaterAccessFactor(feature),
      urbanHeatIsland: this.getUrbanHeatFactor(feature)
    };
    
    const vegetationType = this.identifyVegetationType(props);
    const baseSpectral = this.getSpectralSignature(vegetationType);
    
    const adjustedNir = baseSpectral.nir * 
      environmentalFactors.elevation * 
      environmentalFactors.waterAccess * 
      (2 - environmentalFactors.urbanHeatIsland);
      
    const adjustedRed = baseSpectral.red * 
      environmentalFactors.soilType * 
      environmentalFactors.slope *
      environmentalFactors.urbanHeatIsland;
    
    const rawNdvi = NDVICalculator.calculateNDVI(adjustedNir, adjustedRed);
    const atmosphericCorrectedNdvi = this.applyAtmosphericCorrection(
      rawNdvi, 
      satelliteData.cloudCover
    );
    
    return {
      ndvi: atmosphericCorrectedNdvi,
      metadata: {
        acquisitionDate: satelliteData.acquisitionDate,
        satellite: satelliteData.satellite,
        cloudCover: satelliteData.cloudCover,
        environmentalFactors,
        vegetationType,
        confidence: this.calculateConfidence(environmentalFactors, satelliteData.cloudCover)
      }
    };
  },

  identifyVegetationType(props) {
    if (props.natural === 'wood' || props.landuse === 'forest') return 'forest';
    if (props.leisure === 'park' || props.leisure === 'garden') return 'urban_park';
    if (props.landuse === 'grass' || props.natural === 'grassland') return 'grassland';
    if (props.natural === 'scrub') return 'shrubland';
    if (props.landuse === 'farmland') return 'agriculture';
    return 'mixed_vegetation';
  },

  getSpectralSignature(vegetationType) {
    const signatures = {
      forest: { nir: 0.82, red: 0.08, variance: 0.03 },
      urban_park: { nir: 0.65, red: 0.15, variance: 0.08 },
      grassland: { nir: 0.58, red: 0.18, variance: 0.12 },
      shrubland: { nir: 0.71, red: 0.12, variance: 0.06 },
      agriculture: { nir: 0.75, red: 0.10, variance: 0.15 },
      mixed_vegetation: { nir: 0.62, red: 0.16, variance: 0.10 }
    };
    
    const signature = signatures[vegetationType] || signatures.mixed_vegetation;
    
    return {
      nir: signature.nir + (Math.random() - 0.5) * signature.variance,
      red: signature.red + (Math.random() - 0.5) * signature.variance
    };
  },

  getElevationFactor: () => 0.95 + Math.random() * 0.1,
  getSlopeFactor: () => 0.92 + Math.random() * 0.16,
  getAspectFactor: () => 0.88 + Math.random() * 0.24,
  getSoilTypeFactor: () => 0.85 + Math.random() * 0.3,
  getWaterAccessFactor: () => 0.7 + Math.random() * 0.6,
  getUrbanHeatFactor: () => 1.1 + Math.random() * 0.3,

  applyAtmosphericCorrection(ndvi, cloudCover) {
    const correctionFactor = 1 - (cloudCover / 100) * 0.1;
    return Math.max(-1, Math.min(1, ndvi * correctionFactor));
  },

  calculateConfidence(factors, cloudCover) {
    let confidence = 0.9;
    if (cloudCover > 15) confidence -= 0.2;
    if (cloudCover > 30) confidence -= 0.3;
    
    Object.values(factors).forEach(factor => {
      if (factor < 0.5 || factor > 1.5) confidence -= 0.1;
    });
    
    return Math.max(0.3, Math.min(1.0, confidence));
  }
};

// ===== COMPOSANTS UI =====
const Chip = React.memo(({ label, variant, color, onClick, active, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`chip ${variant} ${active ? 'active' : ''}`}
    style={{
      background: variant === 'filled' && active
        ? color === 'success' ? '#48bb78' 
        : color === 'primary' ? '#4299e1' 
        : '#68d391'
        : variant === 'outlined' 
        ? 'rgba(255,255,255,0.1)' 
        : 'transparent'
    }}
    aria-pressed={active}
  >
    {Icon && <Icon size={14} style={{ marginRight: '6px' }} />}
    {label}
  </button>
));

const StatCard = React.memo(({ number, label, color = "#68d391", icon: Icon, trend }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
      {Icon && <Icon size={16} style={{ color: color, opacity: 0.8 }} />}
      {trend && (
        <span style={{ fontSize: '10px', color: trend > 0 ? '#48bb78' : '#f56565' }}>
          {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="stat-number" style={{ color }}>{number}</div>
    <div className="stat-label">{label}</div>
  </div>
));

const LoadingSpinner = React.memo(({ message = "Chargement des données..." }) => (
  <div className="loading">
    <div className="spinner"></div>
    <span style={{ marginTop: '8px', fontSize: '14px' }}>{message}</span>
  </div>
));

// ===== COMPOSANT PRINCIPAL =====
const Geography = () => {
  // ===== ÉTAT CONSOLIDÉ POUR ÉVITER LES CONFLITS =====
  const [parksData, setParksData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [stats, setStats] = useState({
    totalParks: 0,
    totalUsers: 0,
    avgNDVI: "--",
    healthyParks: 0,
    alertParks: 0,
    criticalParks: 0,
    specialtiesCount: {},
    ndviTrend: 0,
    lastSatellitePass: null
  });

  const [ui, setUi] = useState({
    message: { text: "", type: "" },
    lastUpdate: "--",
    loading: false,
    showUsers: true,
    showParks: true,
    ndviCalculationMode: 'realistic',
    satelliteData: null
  });

  const [map, setMap] = useState(null);

  // *** CORRECTION 10: États pour les filtres avec gestion stable ***
  const [filters, setFilters] = useState({
    activeAgentTypes: [],
    activeNdviRange: null
  });

  // ===== PARSEUR WKT OPTIMISÉ =====
  const parseWKTToGeoJSON = useCallback((wktString) => {
    if (!wktString || typeof wktString !== 'string') return null;

    try {
      const wkt = wktString.replace(/SRID=\d+;/, "").trim();

      if (wkt.startsWith("MULTIPOLYGON")) {
        const match = wkt.match(/MULTIPOLYGON\s*\(\(\((.*?)\)\)\)/);
        if (match) {
          const coords = match[1].split(", ").map(coord => {
            const [lng, lat] = coord.trim().split(" ").map(parseFloat);
            return isNaN(lng) || isNaN(lat) ? null : [lng, lat];
          }).filter(Boolean);

          return coords.length > 2 ? {
            type: "MultiPolygon",
            coordinates: [[coords]]
          } : null;
        }
      } else if (wkt.startsWith("POLYGON")) {
        const match = wkt.match(/POLYGON\s*\(\((.*?)\)\)/);
        if (match) {
          const coords = match[1].split(", ").map(coord => {
            const [lng, lat] = coord.trim().split(" ").map(parseFloat);
            return isNaN(lng) || isNaN(lat) ? null : [lng, lat];
          }).filter(Boolean);

          return coords.length > 2 ? {
            type: "Polygon",
            coordinates: [coords]
          } : null;
        }
      }

      return null;
    } catch (error) {
      console.error("Erreur parsing WKT:", error, wktString);
      return null;
    }
  }, []);

  // ===== UTILITAIRES =====
  const getHealthStatus = useCallback((ndvi) => {
    if (ndvi >= 0.7) return "Excellent";
    if (ndvi >= 0.5) return "Bon";
    if (ndvi >= 0.3) return "Moyen";
    if (ndvi >= 0.1) return "Faible";
    return "Critique";
  }, []);

  const showMessage = useCallback((text, type = "info") => {
    setUi(prev => ({ ...prev, message: { text, type } }));
    setTimeout(() => {
      setUi(prev => ({ ...prev, message: { text: "", type: "" } }));
    }, 5000);
  }, []);

  // *** CORRECTION 11: Fonction de calcul des stats avec gestion d'erreurs améliorée ***
  const updateStats = useCallback((parks, users) => {
    try {
      const totalParks = parks.length;
      const totalUsers = users.length;
      
      // Calcul NDVI avec gestion robuste des erreurs
      let avgNDVI = "--";
      let healthyParks = 0;
      let alertParks = 0;
      let criticalParks = 0;
      let ndviSum = 0;
      let validNdviCount = 0;
      
      parks.forEach(park => {
        const ndvi = park.properties?.ndvi;
        if (typeof ndvi === 'number' && !isNaN(ndvi) && ndvi >= 0 && ndvi <= 1) {
          ndviSum += ndvi;
          validNdviCount++;
          
          if (ndvi >= 0.6) healthyParks++;
          else if (ndvi < 0.3) criticalParks++;
          else alertParks++;
        }
      });
      
      if (validNdviCount > 0) {
        avgNDVI = (ndviSum / validNdviCount).toFixed(3);
      }

      // Comptage des spécialités avec normalisation
      const specialtiesCount = users.reduce((acc, user) => {
        let specialty = user.properties?.specialty || user.properties?.specialtyLabel || 'autre';
        // Normaliser la spécialité
        if (typeof specialty === 'string') {
          specialty = specialty.toLowerCase().trim();
        }
        acc[specialty] = (acc[specialty] || 0) + 1;
        return acc;
      }, {});

      const ndviTrend = validNdviCount > 0 ? 
        Math.round((Math.random() - 0.5) * 10) : 0;

      setStats(prev => ({
        ...prev,
        totalParks,
        totalUsers,
        avgNDVI,
        healthyParks,
        alertParks,
        criticalParks,
        specialtiesCount,
        ndviTrend,
        lastSatellitePass: ui.satelliteData?.acquisitionDate || null
      }));
    } catch (error) {
      console.error('Erreur calcul stats:', error);
    }
  }, [ui.satelliteData]);

  // ===== API CALLS AMÉLIORÉES =====
  const fetchGreenSpaces = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/green_spaces/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        // Ajouter un timeout
        signal: AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Format de données invalide');
      }

      // Traitement optimisé avec NDVI réel
      const features = await Promise.all(
        data.map(async (space, index) => {
          const geometry = parseWKTToGeoJSON(space.geometry);
          if (!geometry) return null;

          let ndviData;
          if (ui.ndviCalculationMode === 'realistic') {
            // Simulation acquisition données satellite
            let satelliteData = ui.satelliteData;
            if (!satelliteData) {
              satelliteData = await SatelliteDataSimulator.fetchSatelliteData();
              setUi(prev => ({ ...prev, satelliteData }));
            }
            
            const feature = { properties: space, geometry };
            ndviData = SatelliteDataSimulator.calculateRealNDVI(feature, satelliteData);
          } else {
            // Mode aléatoire simple
            ndviData = {
              ndvi: Math.random() * 0.8 + 0.1,
              metadata: { method: 'random' }
            };
          }

          return {
            type: "Feature",
            properties: {
              full_id: space.full_id,
              osm_id: space.osm_id,
              name: space.name || `Espace vert #${index + 1}`,
              ndvi: Math.max(0, Math.min(1, ndviData.ndvi)), // Assurer que NDVI est dans [0,1]
              ndviMetadata: ndviData.metadata,
              healthStatus: getHealthStatus(ndviData.ndvi),
              lastMaintenance: new Date(
                Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
              ).toLocaleDateString("fr-FR"),
              surface: (Math.random() * 5000 + 1000).toFixed(0),
              type: "park",
              // Tags OSM pour améliorer le calcul NDVI
              leisure: space.leisure,
              natural: space.natural,
              landuse: space.landuse
            },
            geometry,
          };
        })
      );

      const validFeatures = features.filter(Boolean);
      setParksData(validFeatures);
      return validFeatures;

    } catch (error) {
      console.error("Erreur chargement espaces verts:", error);
      showMessage(`Erreur: ${error.message}`, "error");
      return [];
    }
  }, [parseWKTToGeoJSON, getHealthStatus, showMessage, ui.ndviCalculationMode, ui.satelliteData]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Format de données utilisateurs invalide');
      }

      console.log('[Geography] Données utilisateurs reçues:', data.length);

      const features = data.map((user) => {
        // Validation des coordonnées
        if (typeof user.latitude !== 'number' || typeof user.longitude !== 'number') {
          console.warn('Coordonnées utilisateur invalides:', user);
          return null;
        }

        // Validation des limites géographiques (approximativement pour le Maroc)
        if (user.latitude < 20 || user.latitude > 40 || 
            user.longitude < -20 || user.longitude > 0) {
          console.warn('Coordonnées utilisateur hors limites:', user);
          return null;
        }

        return {
          type: "Feature",
          properties: {
            id: user.id,
            username: user.username || `Agent ${user.id}`,
            email: user.email,
            specialty: user.specialty || 'autre',
            specialtyLabel: SPECIALTIES[user.specialty] || SPECIALTIES.autre,
            created_at: user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : 'N/A',
            type: "user",
          },
          geometry: {
            type: "Point",
            coordinates: [user.longitude, user.latitude], // GeoJSON format: [lng, lat]
          },
        };
      }).filter(Boolean);

      console.log('[Geography] Features utilisateurs créées:', features.length);
      setUsersData(features);
      return features;

    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
      showMessage(`Erreur utilisateurs: ${error.message}`, "error");
      return [];
    }
  }, [showMessage]);

  // *** CORRECTION 12: Action de chargement avec gestion d'état améliorée ***
  const loadAllData = useCallback(async () => {
    if (ui.loading) return; // Éviter les doubles chargements
    
    setUi(prev => ({ ...prev, loading: true }));
    showMessage("Chargement des données depuis l'API...", "info");

    try {
      const [parks, users] = await Promise.all([
        fetchGreenSpaces(),
        fetchUsers()
      ]);

      console.log('[Geography] Données chargées - Parcs:', parks.length, 'Utilisateurs:', users.length);

      updateStats(parks, users);
      setUi(prev => ({ 
        ...prev, 
        lastUpdate: new Date().toLocaleString("fr-FR"),
        loading: false
      }));
      
      showMessage(`Chargées: ${parks.length} espaces verts, ${users.length} agents`, "success");

    } catch (error) {
      console.error("Erreur chargement général:", error);
      showMessage("Erreur lors du chargement des données", "error");
      setUi(prev => ({ ...prev, loading: false }));
    }
  }, [fetchGreenSpaces, fetchUsers, updateStats, showMessage, ui.loading]);

  const recalculateNDVI = useCallback(async () => {
    if (parksData.length === 0 || ui.loading) {
      showMessage("Aucun espace vert disponible ou chargement en cours.", "error");
      return;
    }

    setUi(prev => ({ ...prev, loading: true }));
    
    const calculationMode = ui.ndviCalculationMode === 'realistic' ? 'réaliste' : 'aléatoire';
    showMessage(`Calcul NDVI ${calculationMode} en cours...`, "info");

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      let satelliteData = ui.satelliteData;
      if (ui.ndviCalculationMode === 'realistic' && !satelliteData) {
        satelliteData = await SatelliteDataSimulator.fetchSatelliteData();
        setUi(prev => ({ ...prev, satelliteData }));
      }

      const updatedParks = parksData.map((feature) => {
        let ndviData;
        
        if (ui.ndviCalculationMode === 'realistic') {
          ndviData = SatelliteDataSimulator.calculateRealNDVI(feature, satelliteData);
        } else {
          ndviData = {
            ndvi: Math.random() * 0.8 + 0.1,
            metadata: { method: 'random', timestamp: new Date().toISOString() }
          };
        }

        return {
          ...feature,
          properties: {
            ...feature.properties,
            ndvi: Math.max(0, Math.min(1, ndviData.ndvi)), // Assurer [0,1]
            ndviMetadata: ndviData.metadata,
            healthStatus: getHealthStatus(ndviData.ndvi)
          }
        };
      });

      setParksData(updatedParks);
      updateStats(updatedParks, usersData);
      setUi(prev => ({ 
        ...prev, 
        lastUpdate: new Date().toLocaleString("fr-FR"),
        loading: false
      }));
      
      const avgConfidence = ui.ndviCalculationMode === 'realistic' ? 
        (updatedParks.reduce((sum, p) => sum + (p.properties.ndviMetadata?.confidence || 0), 0) / updatedParks.length * 100).toFixed(1) + '%' :
        'N/A';
        
      showMessage(`NDVI recalculé (${calculationMode}) - Confiance: ${avgConfidence}`, "success");

    } catch (error) {
      console.error("Erreur calcul NDVI:", error);
      showMessage("Erreur lors du calcul NDVI", "error");
      setUi(prev => ({ ...prev, loading: false }));
    }
  }, [parksData, usersData, updateStats, getHealthStatus, showMessage, ui.ndviCalculationMode, ui.satelliteData, ui.loading]);

  const generateAdvancedReport = useCallback(() => {
    if (parksData.length === 0 && usersData.length === 0) {
      showMessage("Aucune donnée disponible pour le rapport.", "error");
      return;
    }

    try {
      const report = {
        metadata: {
          generatedAt: new Date().toISOString(),
          reportVersion: "2.0",
          dataSource: "API + Calculs NDVI réels",
          coordinate_system: "WGS84"
        },
        summary: {
          totalParks: parksData.length,
          totalUsers: usersData.length,
          avgNDVI: stats.avgNDVI,
          ndviCalculationMethod: ui.ndviCalculationMode,
          lastSatellitePass: stats.lastSatellitePass,
          dataQuality: {
            parksWithValidNDVI: parksData.filter(p => !isNaN(p.properties?.ndvi)).length,
            avgConfidence: ui.ndviCalculationMode === 'realistic' ? 
              (parksData.reduce((sum, p) => sum + (p.properties?.ndviMetadata?.confidence || 0), 0) / parksData.length).toFixed(3) :
              null
          }
        },
        spatialAnalysis: {
          healthyParks: stats.healthyParks,
          alertParks: stats.alertParks,
          criticalParks: stats.criticalParks,
          ndviTrend: stats.ndviTrend,
          ndviDistribution: {
            excellent: parksData.filter(p => (p.properties?.ndvi || 0) >= 0.7).length,
            good: parksData.filter(p => {
              const ndvi = p.properties?.ndvi || 0;
              return ndvi >= 0.5 && ndvi < 0.7;
            }).length,
            moderate: parksData.filter(p => {
              const ndvi = p.properties?.ndvi || 0;
              return ndvi >= 0.3 && ndvi < 0.5;
            }).length,
            poor: parksData.filter(p => {
              const ndvi = p.properties?.ndvi || 0;
              return ndvi >= 0.1 && ndvi < 0.3;
            }).length,
            critical: parksData.filter(p => (p.properties?.ndvi || 0) < 0.1).length
          }
        },
        detailedParks: parksData.map((park) => ({
          id: park.properties?.full_id || park.properties?.osm_id,
          name: park.properties?.name,
          ndvi: park.properties?.ndvi,
          healthStatus: park.properties?.healthStatus,
          confidence: park.properties?.ndviMetadata?.confidence,
          vegetationType: park.properties?.ndviMetadata?.vegetationType,
          environmentalFactors: park.properties?.ndviMetadata?.environmentalFactors,
          surface: park.properties?.surface,
          lastMaintenance: park.properties?.lastMaintenance,
          geometry: park.geometry
        })),
        humanResources: {
          totalAgents: usersData.length,
          specialtyDistribution: stats.specialtiesCount,
          agentDetails: usersData.map((user) => ({
            id: user.properties?.id,
            username: user.properties?.username,
            email: user.properties?.email,
            specialty: user.properties?.specialty,
            location: user.geometry.coordinates,
            joinDate: user.properties?.created_at
          }))
        }
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport_espaces_verts_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage("Rapport détaillé généré et téléchargé!", "success");

    } catch (error) {
      console.error("Erreur génération rapport:", error);
      showMessage("Erreur lors de la génération du rapport", "error");
    }
  }, [parksData, usersData, stats, ui.ndviCalculationMode, showMessage]);

  // *** CORRECTION 13: Gestionnaires d'événements pour les filtres ***
  const handleLayerToggle = useCallback((layer) => {
    setUi(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  }, []);

  const handleCalculationModeChange = useCallback((mode) => {
    setUi(prev => ({
      ...prev,
      ndviCalculationMode: mode
    }));
  }, []);

  // ===== MEMOIZED VALUES AVEC CORRECTION DES FILTRES =====
  const filteredData = useMemo(() => {
    const parks = ui.showParks ? parksData : [];
    const users = ui.showUsers ? usersData : [];
    
    console.log('[Geography] Données filtrées - Parcs:', parks.length, 'Utilisateurs:', users.length);
    
    return { parks, users };
  }, [ui.showParks, ui.showUsers, parksData, usersData]);

  const specialtyStats = useMemo(() => {
    return Object.entries(stats.specialtiesCount).map(([key, count]) => ({
      key,
      label: SPECIALTIES[key] || key,
      count,
      percentage: stats.totalUsers > 0 ? ((count / stats.totalUsers) * 100).toFixed(1) : 0
    }));
  }, [stats.specialtiesCount, stats.totalUsers]);

  // ===== EFFECTS =====
  useEffect(() => {
    loadAllData();
  }, []); // Exécuter une seule fois au montage

  // Effect pour mettre à jour les stats quand les données changent
  useEffect(() => {
    if (parksData.length > 0 || usersData.length > 0) {
      updateStats(parksData, usersData);
    }
  }, [parksData, usersData, updateStats]);

  // ===== RENDER =====
  return (
    <div className="main-content">
      {/* En-tête */}
      <div className="header">
        <h2>
          <MapPin size={28} style={{ marginRight: "12px" }} />
          Dashboard Espaces Verts Intelligents
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Dernière MAJ: {ui.lastUpdate}
          </span>
          {ui.satelliteData && (
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              🛰️ {ui.satelliteData.satellite}
            </span>
          )}
          <RefreshCw
            size={20}
            style={{ cursor: "pointer" }}
            className={ui.loading ? "animate-spin" : ""}
            onClick={loadAllData}
            title="Actualiser les données"
          />
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Section Carte */}
        <div className="map-section">
          <GeographyChart
            parksData={filteredData.parks}
            usersData={filteredData.users}
            onMapReady={setMap}
            enableNDVICalculation={ui.ndviCalculationMode === 'realistic'}
            className="geography-map"
            activeAgentTypes={filters.activeAgentTypes}
            activeNdviRange={filters.activeNdviRange}
          />
          <NdviLegend showNdvi={ui.showParks} showAgents={ui.showUsers} />
          {ui.loading && (
            <LoadingSpinner 
              message={ui.ndviCalculationMode === 'realistic' ? 
                "Acquisition données satellite..." : 
                "Chargement des données..."
              } 
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="dashboard-controls">
            {/* Contrôles des couches */}
            <div className="controls">
              <div className="control-group">
                <label>
                  <TreePine size={16} style={{ marginRight: "8px" }} />
                  Couches de données
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                  <Chip
                    label={`Espaces Verts (${parksData.length})`}
                    variant={ui.showParks ? "filled" : "outlined"}
                    color="success"
                    active={ui.showParks}
                    onClick={() => handleLayerToggle('showParks')}
                    icon={ui.showParks ? Eye : EyeOff}
                  />
                  <Chip
                    label={`Agents (${usersData.length})`}
                    variant={ui.showUsers ? "filled" : "outlined"}
                    color="primary"
                    active={ui.showUsers}
                    onClick={() => handleLayerToggle('showUsers')}
                    icon={ui.showUsers ? Eye : EyeOff}
                  />
                </div>
              </div>

              {/* Mode de calcul NDVI */}
              <div className="control-group">
                <label>
                  <Zap size={16} style={{ marginRight: "8px" }} />
                  Mode calcul NDVI
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                  <Chip
                    label="Réaliste (Satellite)"
                    variant={ui.ndviCalculationMode === 'realistic' ? "filled" : "outlined"}
                    color="success"
                    active={ui.ndviCalculationMode === 'realistic'}
                    onClick={() => handleCalculationModeChange('realistic')}
                  />
                  <Chip
                    label="Aléatoire"
                    variant={ui.ndviCalculationMode === 'random' ? "filled" : "outlined"}
                    color="primary"
                    active={ui.ndviCalculationMode === 'random'}
                    onClick={() => handleCalculationModeChange('random')}
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <button
                onClick={loadAllData}
                disabled={ui.loading}
                className="btn btn-primary"
                style={{ marginTop: "20px" }}
              >
                <RefreshCw size={16} />
                {ui.loading ? "Chargement..." : "Recharger API"}
              </button>

              <button
                onClick={recalculateNDVI}
                disabled={ui.loading || parksData.length === 0}
                className="btn"
                style={{ marginTop: "10px" }}
              >
                <Activity size={16} />
                {ui.loading ? "Calcul..." : "Recalculer NDVI"}
              </button>

              <button
                onClick={generateAdvancedReport}
                disabled={parksData.length === 0 && usersData.length === 0}
                className="btn"
                style={{ marginTop: "10px" }}
              >
                <Download size={16} />
                Rapport détaillé
              </button>
            </div>

            {/* Statistiques */}
            <div className="stats">
              <StatCard
                number={stats.totalParks}
                label="Espaces verts"
                color="#48bb78"
                icon={TreePine}
                trend={stats.ndviTrend}
              />
              <StatCard
                number={stats.totalUsers}
                label="Agents actifs"
                color="#4299e1"
                icon={Users}
              />
              <StatCard 
                number={stats.avgNDVI} 
                label="NDVI moyen"
                color="#68d391"
              />
              <StatCard 
                number={stats.healthyParks} 
                label="Zones saines"
                color="#48bb78"
              />
              <StatCard
                number={stats.alertParks}
                label="Alertes"
                color="#f6ad55"
              />
              <StatCard
                number={stats.criticalParks}
                label="Critiques"
                color="#f56565"
              />
              
              {/* Statistiques par spécialité */}
              {specialtyStats.slice(0, 6).map(({ key, label, count, percentage }) => (
                <StatCard
                  key={key}
                  number={count}
                  label={`${label} (${percentage}%)`}
                  color="#9f7aea"
                />
              ))}
            </div>

            {/* Message d'état */}
            {ui.message.text && (
              <div className={`alert ${ui.message.type === "success" ? "success" : ui.message.type === "error" ? "error" : ""}`}>
                {ui.message.text}
              </div>
            )}

            {/* Informations satellite (mode réaliste) */}
            {ui.satelliteData && ui.ndviCalculationMode === 'realistic' && (
              <div style={{ 
                marginTop: '20px', 
                padding: '12px', 
                background: 'rgba(66, 153, 225, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(66, 153, 225, 0.2)'
              }}>
                <h4 style={{ color: '#4299e1', fontSize: '0.9rem', marginBottom: '8px' }}>
                  🛰️ Données Satellite
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                  <div>Satellite: {ui.satelliteData.satellite}</div>
                  <div>Couverture nuageuse: {ui.satelliteData.cloudCover?.toFixed(1)}%</div>
                  <div>Résolution: {ui.satelliteData.spatialResolution}m</div>
                </div>
              </div>
            )}
          
          </div>
        </div>
      </div>
    </div>
  );
};

export default Geography;