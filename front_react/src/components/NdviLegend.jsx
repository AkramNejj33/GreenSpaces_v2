import React from 'react';

const NdviLegend = () => (
  <div className="ndvi-legend">
    <h4>
      <i className="fas fa-palette"></i> Légende NDVI
    </h4>
    {[
      { color: '#8B4513', label: 'Sol nu (0.0-0.2)' },
      { color: '#CD853F', label: 'Végétation faible (0.2-0.4)' },
      { color: '#FFFF00', label: 'Végétation modérée (0.4-0.6)' },
      { color: '#ADFF2F', label: 'Végétation saine (0.6-0.8)' },
      { color: '#006400', label: 'Végétation dense (0.8-1.0)' }
    ].map((item, i) => (
      <div key={i} className="legend-item">
        <div className="legend-color" style={{ backgroundColor: item.color }} />
        <span className="legend-label">{item.label}</span>
      </div>
    ))}
  </div>
);

export default NdviLegend;