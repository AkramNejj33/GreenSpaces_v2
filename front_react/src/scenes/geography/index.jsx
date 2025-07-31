import React, { useState, useEffect } from "react";
import GeographyChart from "../../components/GeographyChart";
import NdviLegend from "../../components/NdviLegend";
import {
  Box,
  Typography,
  Button,
  Alert,
} from "@mui/material";
import { Upload, Activity, FileText, RefreshCw, MapPin } from "lucide-react";
import './geography.css';
import 'leaflet/dist/leaflet.css';


const FileUpload = ({ onFileSelect, accept, icon: Icon, label, loading }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <div className="control-group">
      <label htmlFor={`file-input-${label.replace(/\s+/g, "-")}`}>
        <Icon size={16} style={{ marginRight: '8px' }} />
        {label}
      </label>
      <div className="file-input">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          id={`file-input-${label.replace(/\s+/g, "-")}`}
          disabled={loading}
        />
        <label htmlFor={`file-input-${label.replace(/\s+/g, "-")}`} className="file-input-label">
          <Upload size={16} style={{ marginRight: '8px' }} />
          {loading ? "Chargement..." : "Sélectionner un fichier"}
        </label>
      </div>
    </div>
  );
};

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
    <span>Traitement en cours...</span>
  </div>
);

const Geography = () => {
  const [parksData, setParksData] = useState([]);
  const [stats, setStats] = useState({
    totalParks: 0,
    avgNDVI: "--",
    healthyParks: 0,
    alertParks: 0,
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [lastUpdate, setLastUpdate] = useState("--");
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const updateStats = (data) => {
    const totalParks = data.length;
    const avgNDVI =
      data.length > 0
        ? data.reduce((sum, f) => sum + (f.properties?.ndvi || 0), 0) /
          totalParks
        : 0;
    const healthyParks = data.filter(
      (f) => (f.properties?.ndvi || 0) > 0.6
    ).length;
    const alertParks = data.filter(
      (f) => (f.properties?.ndvi || 0) < 0.4
    ).length;

    setStats({
      totalParks,
      avgNDVI: avgNDVI ? avgNDVI.toFixed(3) : "--",
      healthyParks,
      alertParks,
    });
  };

  const loadGeoJSON = async (file) => {
    setLoading(true);
    showMessage("Chargement du fichier GeoJSON...", "info");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const geojsonData = JSON.parse(e.target.result);
        const features = geojsonData.features || [];

        const processedFeatures = features.map((feature, index) => {
          const simulatedNDVI = Math.random() * 0.6 + 0.2;
          return {
            ...feature,
            properties: {
              ...feature.properties,
              ndvi: simulatedNDVI,
              healthStatus: getHealthStatus(simulatedNDVI),
              lastMaintenance: new Date(
                Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
              ).toLocaleDateString(),
              name:
                feature.properties?.name ||
                feature.properties?.nom ||
                `Espace vert #${index + 1}`,
              surface: (Math.random() * 5000 + 1000).toFixed(0),
            },
          };
        });

        setTimeout(() => {
          setParksData(processedFeatures);
          updateStats(processedFeatures);
          setLoading(false);
          showMessage("Fichier GeoJSON chargé avec succès!", "success");
          if (map && processedFeatures.length > 0 && window.L) {
            const bounds = [];
            processedFeatures.forEach((feature) => {
              if (feature.geometry.type === "Point") {
                bounds.push([
                  feature.geometry.coordinates[1],
                  feature.geometry.coordinates[0],
                ]);
              } else if (feature.geometry.type === "Polygon") {
                feature.geometry.coordinates[0].forEach((coord) => {
                  bounds.push([coord[1], coord[0]]);
                });
              }
            });

            if (bounds.length > 0) {
              const leafletBounds = window.L.latLngBounds(bounds);
              map.fitBounds(leafletBounds, { padding: [20, 20] });
            }
          }
        }, 1500);
      } catch (error) {
        setLoading(false);
        showMessage(
          "Erreur lors du chargement du fichier GeoJSON: " + error.message,
          "error"
        );
      }
    };
    reader.readAsText(file);
  };

  const loadNDVIData = async (file) => {
    setLoading(true);
    showMessage("Chargement des données NDVI...", "info");
    setTimeout(() => {
      setLoading(false);
      showMessage("Données NDVI chargées avec succès!", "success");
    }, 2000);
  };

  const simulateNDVI = () => {
    if (parksData.length === 0) {
      showMessage("Veuillez d'abord charger un fichier GeoJSON.", "error");
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
      updateStats(updated);
      setLastUpdate(new Date().toLocaleString());
      setLoading(false);
      showMessage("Données NDVI simulées avec succès!", "success");
    }, 2000);
  };

  const generateReport = () => {
    if (parksData.length === 0) {
      showMessage("Aucune donnée disponible pour générer un rapport.", "error");
      return;
    }

    const report = {
      date: new Date().toISOString(),
      totalParks: parksData.length,
      avgNDVI: stats.avgNDVI,
      parks: parksData.map((f) => ({
        name: f.properties?.name || "Espace vert",
        ndvi: f.properties?.ndvi,
        healthStatus: f.properties?.healthStatus,
        lastMaintenance: f.properties?.lastMaintenance,
        surface: f.properties?.surface,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport_espaces_verts_${new Date()
      .toISOString()
      .split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showMessage("Rapport généré et téléchargé avec succès!", "success");
  };

  return (
    <div className="main-content">
      <div className="header">
        <h2>
          <MapPin size={28} style={{ marginRight: '12px' }} />
          Cartographie des Espaces Verts
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span id="last-update">Dernière mise à jour: {lastUpdate}</span>
          <RefreshCw
            size={20}
            style={{ cursor: 'pointer' }}
            className={loading ? 'animate-spin' : ''}
            onClick={simulateNDVI}
            title="Actualiser"
          />
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="map-section">
          <GeographyChart parksData={parksData} onMapReady={setMap} />
          <NdviLegend />
          {loading && <LoadingSpinner />}
        </div>

        <div className="sidebar">
          <div className="dashboard-controls">
            <div className="controls">
              <FileUpload
                onFileSelect={loadGeoJSON}
                accept=".geojson,.json"
                icon={MapPin}
                label="Charger fichier GeoJSON"
                loading={loading}
              />
              <FileUpload
                onFileSelect={loadNDVIData}
                accept=".tif,.tiff,.geojson,.json"
                icon={Activity}
                label="Charger données NDVI"
                loading={loading}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={simulateNDVI}
                disabled={loading || parksData.length === 0}
                className="btn"
                style={{ marginTop: '10px' }}
              >
                <Activity size={16} style={{ marginRight: '8px' }} />
                {loading ? "Simulation..." : "Simuler données NDVI"}
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={generateReport}
                disabled={parksData.length === 0}
                className="btn"
                style={{ marginTop: '10px' }}
              >
                <FileText size={16} style={{ marginRight: '8px' }} />
                Générer rapport
              </Button>
            </div>
            <div className="stats">
              <StatCard number={stats.totalParks} label="Parcs totaux" />
              <StatCard number={stats.avgNDVI} label="NDVI moyen" />
              <StatCard number={stats.healthyParks} label="Parcs sains" />
              <StatCard
                number={stats.alertParks}
                label="Alertes"
                color="#f56565"
              />
            </div>
            {message.text && (
              <div
                className={`alert ${
                  message.type === 'success' ? 'success' : ''
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
