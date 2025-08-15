import React, { useState, useEffect, useCallback  } from "react";
import GeographyChart from "../../components/GeographyChart";
import NdviLegend from "../../components/NdviLegend";
import {
  Activity,
  FileText,
  RefreshCw,
  MapPin,
  Users,
  TreePine,
} from "lucide-react";
import "./geography.css";
import "leaflet/dist/leaflet.css";

const SPECIALTIES = {
  jardinier: "Jardinier",
  paysagiste: "Paysagiste",
  horticulteur: "Horticulteur",
  electronicien: "Électronicien",
  technicien_iot: "Technicien IoT",
  installateur_capteurs: "Installateur de capteurs",
  maintenance: "Agent de maintenance",
  irrigation: "Spécialiste irrigation",
  gestion_energie: "Gestion de l’énergie",
  autre: "Autre",
};

const API_BASE_URL = "http://127.0.0.1:8000/api";

const Chip = ({ label, variant, color, onClick, style }) => (
  <div
    onClick={onClick}
    style={{
      padding: "8px 16px",
      borderRadius: "16px",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: "500",
      border:
        variant === "outlined" ? "1px solid rgba(255,255,255,0.3)" : "none",
      backgroundColor:
        variant === "filled"
          ? color === "success"
            ? "#48bb78"
            : color === "primary"
            ? "#4299e1"
            : "#68d391"
          : "rgba(255,255,255,0.1)",
      color: variant === "filled" ? "white" : "#e2e8f0",
      transition: "all 0.2s ease",
      userSelect: "none",
      ...style,
    }}
  >
    {label}
  </div>
);

const StatCard = ({ number, label, color = "#68d391" }) => (
  <div className="stat-card">
    <div className="stat-number" style={{ color }}>
      {number}
    </div>
    <div className="stat-label">{label}</div>
  </div>
);

const LoadingSpinner = () => (
  <div className="loading">
    <div className="spinner"></div>
    <span>Chargement des données...</span>
  </div>
);

const Geography = () => {
  const [parksData, setParksData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [stats, setStats] = useState({
    totalParks: 0,
    totalUsers: 0,
    avgNDVI: "--",
    healthyParks: 0,
    alertParks: 0,
    specialtiesCount: {},
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [lastUpdate, setLastUpdate] = useState("--");
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUsers, setShowUsers] = useState(true);
  const [showParks, setShowParks] = useState(true);

  // Parser pour convertir la géométrie WKT en GeoJSON
  const parseWKTToGeoJSON = (wktString) => {
    try {
      // Enlever SRID=4326; du début
      const wkt = wktString.replace(/SRID=\d+;/, "");

      if (wkt.startsWith("MULTIPOLYGON")) {
        // Parser plus robuste pour MULTIPOLYGON
        const coordsMatch = wkt.match(/MULTIPOLYGON \(\(\((.*)\)\)\)/);
        if (coordsMatch) {
          const coordsString = coordsMatch[1];
          const coords = coordsString.split(", ").map((coord) => {
            const parts = coord.trim().split(" ");
            return [parseFloat(parts[0]), parseFloat(parts[1])];
          });

          return {
            type: "MultiPolygon",
            coordinates: [[coords]],
          };
        }
      } else if (wkt.startsWith("POLYGON")) {
        const coordsMatch = wkt.match(/POLYGON \(\((.*)\)\)/);
        if (coordsMatch) {
          const coordsString = coordsMatch[1];
          const coords = coordsString.split(", ").map((coord) => {
            const parts = coord.trim().split(" ");
            return [parseFloat(parts[0]), parseFloat(parts[1])];
          });

          return {
            type: "Polygon",
            coordinates: [coords],
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Erreur lors du parsing WKT:", error);
      return null;
    }
  };

  const getHealthStatus = (ndvi) => {
    if (ndvi < 0.3) return "Critique";
    if (ndvi < 0.5) return "Attention";
    if (ndvi < 0.7) return "Bon";
    return "Excellent";
  };

  const showMessage = (text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const updateStats = useCallback((parks, users) => {
    const totalParks = parks.length;
    const totalUsers = users.length;
    const avgNDVI =
      totalParks > 0
        ? (
            parks.reduce((sum, f) => sum + (f.properties?.ndvi || 0), 0) /
            totalParks
          ).toFixed(3)
        : "--";

    const specialtiesCount = Object.keys(SPECIALTIES).reduce((acc, key) => {
      acc[key] = users.filter((u) => u.properties?.specialty === key).length;
      return acc;
    }, {});

    setStats({
      totalParks,
      totalUsers,
      avgNDVI,
      healthyParks: parks.filter((f) => (f.properties?.ndvi || 0) > 0.6).length,
      alertParks: parks.filter((f) => (f.properties?.ndvi || 0) < 0.4).length,
      specialtiesCount,
    });
  }, []);

  // Récupérer les espaces verts depuis l'API
  const fetchGreenSpaces = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/green_spaces/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Convertir les données API en format GeoJSON
      const features = data
        .map((space, index) => {
          const geometry = parseWKTToGeoJSON(space.geometry);
          if (!geometry) return null;

          // Simuler des données NDVI pour chaque espace vert
          const simulatedNDVI = Math.random() * 0.6 + 0.2;

          return {
            type: "Feature",
            properties: {
              full_id: space.full_id,
              osm_id: space.osm_id,
              name: space.name || `Espace vert #${index + 1}`,
              ndvi: simulatedNDVI,
              healthStatus: getHealthStatus(simulatedNDVI),
              lastMaintenance: new Date(
                Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
              ).toLocaleDateString("fr-FR"),
              surface: (Math.random() * 5000 + 1000).toFixed(0),
              type: "park",
            },
            geometry,
          };
        })
        .filter((feature) => feature !== null);

      setParksData(features);
      return features;
    } catch (error) {
      console.error("Erreur lors du chargement des espaces verts:", error);
      showMessage(
        "Erreur lors du chargement des espaces verts: " + error.message,
        "error"
      );
      return [];
    }
  };

  // Récupérer les utilisateurs depuis l'API
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Convertir les données utilisateurs en format GeoJSON
      const features = data.map((user) => ({
        type: "Feature",
        properties: {
          id: user.id,
          username: user.username,
          email: user.email,
          specialty: user.specialty,
          specialtyLabel:
            user.specialty === "technicien_iot"
              ? "Technicien IoT"
              : user.specialty === "jardinier"
              ? "Jardinier"
              : user.specialty,
          created_at: new Date(user.created_at).toLocaleDateString("fr-FR"),
          type: "user",
        },
        geometry: {
          type: "Point",
          coordinates: [user.longitude, user.latitude],
        },
      }));

      setUsersData(features);
      return features;
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      showMessage(
        "Erreur lors du chargement des utilisateurs: " + error.message,
        "error"
      );
      return [];
    }
  };

  // Charger toutes les données
  const loadAllData = async () => {
    setLoading(true);
    showMessage("Chargement des données depuis l'API...", "info");

    try {
      const [parks, users] = await Promise.all([
        fetchGreenSpaces(),
        fetchUsers(),
      ]);

      updateStats(parks, users);
      setLastUpdate(new Date().toLocaleString("fr-FR"));
      showMessage("Données chargées avec succès!", "success");

      // Ajuster la vue de la carte si des données sont disponibles
      if (map && (parks.length > 0 || users.length > 0)) {
        setTimeout(() => {
          const allFeatures = [...parks, ...users];
          const bounds = [];

          allFeatures.forEach((feature) => {
            if (feature.geometry.type === "Point") {
              bounds.push([
                feature.geometry.coordinates[1],
                feature.geometry.coordinates[0],
              ]);
            } else if (feature.geometry.type === "Polygon") {
              feature.geometry.coordinates[0].forEach((coord) => {
                bounds.push([coord[1], coord[0]]);
              });
            } else if (feature.geometry.type === "MultiPolygon") {
              feature.geometry.coordinates.forEach((polygon) => {
                polygon[0].forEach((coord) => {
                  bounds.push([coord[1], coord[0]]);
                });
              });
            }
          });

          if (bounds.length > 0 && window.L) {
            const leafletBounds = window.L.latLngBounds(bounds);
            map.fitBounds(leafletBounds, { padding: [20, 20] });
          }
        }, 500);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      showMessage("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  // Simuler de nouvelles données NDVI
  const simulateNDVI = async () => {
    if (parksData.length === 0) {
      showMessage("Aucune donnée d'espaces verts disponible.", "error");
      return;
    }

    setLoading(true);
    showMessage("Simulation des données NDVI en cours...", "info");

    setTimeout(() => {
      const updated = parksData.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          ndvi: Math.random() * 0.6 + 0.2,
        },
      }));
      updated.forEach(
        (f) => (f.properties.healthStatus = getHealthStatus(f.properties.ndvi))
      );
      setParksData(updated);
      updateStats(updated, usersData);
      setLastUpdate(new Date().toLocaleString("fr-FR"));
      setLoading(false);
      showMessage("Données NDVI simulées avec succès!", "success");
    }, 2000);
  };

  const generateReport = () => {
    if (parksData.length === 0 && usersData.length === 0) {
      showMessage("Aucune donnée disponible pour générer un rapport.", "error");
      return;
    }

    const report = {
      date: new Date().toISOString(),
      totalParks: parksData.length,
      totalUsers: usersData.length,
      avgNDVI: stats.avgNDVI,
      parks: parksData.map((f) => ({
        name: f.properties?.name || "Espace vert",
        full_id: f.properties?.full_id,
        osm_id: f.properties?.osm_id,
        ndvi: f.properties?.ndvi,
        healthStatus: f.properties?.healthStatus,
        lastMaintenance: f.properties?.lastMaintenance,
        surface: f.properties?.surface,
      })),
      users: usersData.map((u) => ({
        id: u.properties?.id,
        username: u.properties?.username,
        email: u.properties?.email,
        specialty: u.properties?.specialty,
        coordinates: u.geometry.coordinates,
        created_at: u.properties?.created_at,
      })),
      statistics: {
        healthyParks: stats.healthyParks,
        alertParks: stats.alertParks,
        technicienIot: stats.technicienIot,
        jardiniers: stats.jardiniers,
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport_espaces_verts_${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);

    showMessage("Rapport généré et téléchargé avec succès!", "success");
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div className="main-content">
      <div className="header">
        <h2>
          <MapPin size={28} style={{ marginRight: "12px" }} />
          Cartographie des Espaces Verts & Agents
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span id="last-update">Dernière mise à jour: {lastUpdate}</span>
          <RefreshCw
            size={20}
            style={{ cursor: "pointer" }}
            className={loading ? "animate-spin" : ""}
            onClick={loadAllData}
            title="Actualiser les données"
          />
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="map-section">
          <GeographyChart
            parksData={showParks ? parksData : []}
            usersData={showUsers ? usersData : []}
            onMapReady={setMap}
          />
          <NdviLegend />
          {loading && <LoadingSpinner />}
        </div>

        <div className="sidebar">
          <div className="dashboard-controls">
            <div className="controls">
              <div className="control-group">
                <label>
                  <TreePine size={16} style={{ marginRight: "8px" }} />
                  Couches de données
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    label="Espaces Verts"
                    variant={showParks ? "filled" : "outlined"}
                    color={showParks ? "success" : "default"}
                    onClick={() => setShowParks(!showParks)}
                  />
                  <Chip
                    label="Agents"
                    variant={showUsers ? "filled" : "outlined"}
                    color={showUsers ? "primary" : "default"}
                    onClick={() => setShowUsers(!showUsers)}
                  />
                </div>
              </div>

              <button
                onClick={loadAllData}
                disabled={loading}
                className="btn"
                style={{
                  marginTop: "20px",
                  background: loading
                    ? "#718096"
                    : "linear-gradient(135deg, #4299e1, #3182ce)",
                }}
              >
                <RefreshCw size={16} style={{ marginRight: "8px" }} />
                {loading ? "Chargement..." : "Recharger données API"}
              </button>

              <button
                onClick={simulateNDVI}
                disabled={loading || parksData.length === 0}
                className="btn"
                style={{ marginTop: "10px" }}
              >
                <Activity size={16} style={{ marginRight: "8px" }} />
                {loading ? "Simulation..." : "Simuler données NDVI"}
              </button>

              <button
                onClick={generateReport}
                disabled={parksData.length === 0 && usersData.length === 0}
                className="btn"
                style={{ marginTop: "10px" }}
              >
                <FileText size={16} style={{ marginRight: "8px" }} />
                Générer rapport
              </button>
            </div>

            <div className="stats">
              <StatCard
                number={stats.totalParks}
                label="Espaces verts"
                color="#48bb78"
              />
              <StatCard
                number={stats.totalUsers}
                label="Agents total"
                color="#4299e1"
              />
              <StatCard number={stats.avgNDVI} label="NDVI moyen" />
              <StatCard number={stats.healthyParks} label="Parcs sains" />
              <StatCard
                number={stats.alertParks}
                label="Alertes"
                color="#f56565"
              />
              {Object.entries(stats.specialtiesCount).map(([key, count]) => (
                <StatCard
                  key={key}
                  number={count}
                  label={SPECIALTIES[key]}
                  color="#9f7aea"
                />
              ))}
            </div>

            {message.text && (
              <div
                className={`alert ${
                  message.type === "success" ? "success" : ""
                }`}
                id="message-area"
              >
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Geography;
