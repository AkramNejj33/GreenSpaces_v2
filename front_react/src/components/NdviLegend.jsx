import React from 'react';


const NDVI_RANGES = [
  { 
    color: '#8B4513', 
    label: 'Sol nu', 
    range: '0.0-0.2',
    description: 'Absence de végétation ou sol exposé'
  },
  { 
    color: '#CD853F', 
    label: 'Végétation faible', 
    range: '0.2-0.4',
    description: 'Végétation clairsemée ou stress hydrique'
  },
  { 
    color: '#FFFF00', 
    label: 'Végétation modérée', 
    range: '0.4-0.6',
    description: 'Couverture végétale moyenne'
  },
  { 
    color: '#ADFF2F', 
    label: 'Végétation saine', 
    range: '0.6-0.8',
    description: 'Végétation en bonne santé'
  },
  { 
    color: '#006400', 
    label: 'Végétation dense', 
    range: '0.8-1.0',
    description: 'Végétation très dense et vigoureuse'
  }
];

const AGENT_SPECIALTIES = [
  { 
    key: 'jardinier', 
    label: 'Jardinier', 
    color: '#48bb78',
    icon: '🌱'
  },
  { 
    key: 'paysagiste', 
    label: 'Paysagiste', 
    color: '#68d391',
    icon: '🏞️'
  },
  { 
    key: 'horticulteur', 
    label: 'Horticulteur', 
    color: '#9ae6b4',
    icon: '🌺'
  },
  { 
    key: 'technicien_iot', 
    label: 'Technicien IoT', 
    color: '#4299e1',
    icon: '📡'
  },
  { 
    key: 'electronicien', 
    label: 'Électronicien', 
    color: '#63b3ed',
    icon: '⚡'
  },
  { 
    key: 'installateur_capteurs', 
    label: 'Installateur de capteurs', 
    color: '#7f9cf5',
    icon: '🔧'
  },
  { 
    key: 'maintenance', 
    label: 'Agent de maintenance', 
    color: '#667eea',
    icon: '🛠️'
  },
  { 
    key: 'irrigation', 
    label: 'Spécialiste irrigation', 
    color: '#76e4f7',
    icon: '💧'
  },
  { 
    key: 'gestion_energie', 
    label: 'Gestion de l\'énergie', 
    color: '#4fd1c5',
    icon: '🔋'
  },
  { 
    key: 'autre', 
    label: 'Autre', 
    color: '#cbd5e0',
    icon: '👤'
  }
];

/**
 * Composant pour afficher un élément de légende
 */
const LegendItem = ({ 
  color, 
  label, 
  range, 
  isCircular = false, 
  icon = null,
  description = null 
}) => (
  <div 
    className="legend-item"
    title={description} // Tooltip au survol
    style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: '8px',
      padding: '4px 0',
      cursor: description ? 'help' : 'default'
    }}
  >
    <div 
      className="legend-color" 
      style={{
        backgroundColor: color,
        width: '16px',
        height: '16px',
        marginRight: '10px',
        borderRadius: isCircular ? '50%' : '4px',
        border: '1px solid rgba(0,0,0,0.1)',
        flexShrink: 0
      }} 
    />
    {icon && (
      <span style={{ marginRight: '6px', fontSize: '14px' }}>
        {icon}
      </span>
    )}
    <span className="legend-label" style={{ fontSize: '0.875rem' }}>
      {label}
      {range && (
        <span style={{ 
          color: '#718096', 
          marginLeft: '6px',
          fontSize: '0.8rem'
        }}>
          ({range})
        </span>
      )}
    </span>
  </div>
);

/**
 * Section de légende avec titre
 */
const LegendSection = ({ title, icon, children, style = {} }) => (
  <div style={{ marginBottom: '20px', ...style }}>
    <h4 style={{ 
      marginBottom: '12px', 
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#2d3748',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      {icon && <span>{icon}</span>}
      {title}
    </h4>
    {children}
  </div>
);

/**
 * Composant principal de la légende NDVI
 * Affiche les seuils NDVI et les types d'agents
 */
const NdviLegend = ({ 
  showNdvi = true, 
  showAgents = true,
  className = "",
  style = {}
}) => {
  return (
    <div 
      className={`ndvi-legend ${className}`}
      style={{
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        minWidth: '250px',
        ...style
      }}
    >
      {/* Section NDVI */}
      {showNdvi && (
        <LegendSection 
          title="Indice NDVI" 
          icon="🎨"
        >
          {NDVI_RANGES.map((item, index) => (
            <LegendItem
              key={`ndvi-${index}`}
              color={item.color}
              label={item.label}
              range={item.range}
              description={item.description}
              isCircular={false}
            />
          ))}
        </LegendSection>
      )}
      
      {/* Séparateur si les deux sections sont affichées */}
      {showNdvi && showAgents && (
        <div style={{ 
          borderTop: '1px solid #e2e8f0', 
          margin: '16px 0' 
        }} />
      )}
      
      {/* Section Agents */}
      {showAgents && (
        <LegendSection 
          title="Types d'Agents" 
          icon="👥"
        >
          {AGENT_SPECIALTIES.map((specialty) => (
            <LegendItem
              key={`agent-${specialty.key}`}
              color={specialty.color}
              label={specialty.label}
              icon={specialty.icon}
              isCircular={true}
            />
          ))}
        </LegendSection>
      )}
    </div>
  );
};

// Export des constantes pour réutilisation dans d'autres composants
export { NDVI_RANGES, AGENT_SPECIALTIES };
export default NdviLegend;