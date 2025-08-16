import React, { memo } from 'react';

// ===== CONSTANTES OPTIMISÉES =====
const NDVI_RANGES = [
  { 
    color: '#006400', 
    label: 'Végétation dense', 
    range: '0.8-1.0',
    description: 'Végétation très dense et vigoureuse - Forêts matures, zones très vertes',
    icon: '🌲'
  },
  { 
    color: '#ADFF2F', 
    label: 'Végétation saine', 
    range: '0.6-0.8',
    description: 'Végétation en bonne santé - Parcs urbains bien entretenus',
    icon: '🌳'
  },
  { 
    color: '#FFFF00', 
    label: 'Végétation modérée', 
    range: '0.4-0.6',
    description: 'Couverture végétale moyenne - Espaces verts standards',
    icon: '🌿'
  },
  { 
    color: '#CD853F', 
    label: 'Végétation faible', 
    range: '0.2-0.4',
    description: 'Végétation clairsemée ou stress hydrique - Nécessite attention',
    icon: '🍂'
  },
  { 
    color: '#8B4513', 
    label: 'Sol nu/critique', 
    range: '0.0-0.2',
    description: 'Absence de végétation ou sol exposé - Intervention requise',
    icon: '🏜️'
  }
];

const AGENT_SPECIALTIES = [
  { 
    key: 'jardinier', 
    label: 'Jardinier', 
    color: '#48bb78',
    icon: '🌱',
    description: 'Entretien général des espaces verts'
  },
  { 
    key: 'paysagiste', 
    label: 'Paysagiste', 
    color: '#68d391',
    icon: '🏞️',
    description: 'Conception et aménagement paysager'
  },
  { 
    key: 'horticulteur', 
    label: 'Horticulteur', 
    color: '#9ae6b4',
    icon: '🌺',
    description: 'Culture et soin des plantes spécialisées'
  },
  { 
    key: 'technicien_iot', 
    label: 'Technicien IoT', 
    color: '#4299e1',
    icon: '📡',
    description: 'Maintenance des capteurs connectés'
  },
  { 
    key: 'electronicien', 
    label: 'Électronicien', 
    color: '#63b3ed',
    icon: '⚡',
    description: 'Systèmes électriques et électroniques'
  },
  { 
    key: 'installateur_capteurs', 
    label: 'Installateur capteurs', 
    color: '#7f9cf5',
    icon: '🔧',
    description: 'Installation et configuration des capteurs'
  },
  { 
    key: 'maintenance', 
    label: 'Maintenance', 
    color: '#667eea',
    icon: '🛠️',
    description: 'Maintenance générale des équipements'
  },
  { 
    key: 'irrigation', 
    label: 'Irrigation', 
    color: '#76e4f7',
    icon: '💧',
    description: 'Systèmes d\'arrosage et gestion de l\'eau'
  },
  { 
    key: 'gestion_energie', 
    label: 'Gestion énergie', 
    color: '#4fd1c5',
    icon: '🔋',
    description: 'Optimisation énergétique des installations'
  },
  { 
    key: 'autre', 
    label: 'Autre', 
    color: '#cbd5e0',
    icon: '👤',
    description: 'Autres spécialités non listées'
  }
];

// ===== COMPOSANTS OPTIMISÉS =====

/**
 * Élément de légende avec tooltip et accessibilité améliorée
 */
const LegendItem = memo(({ 
  color, 
  label, 
  range, 
  isCircular = false, 
  icon = null,
  description = null,
  onClick = null,
  isActive = false
}) => (
  <div 
    className={`legend-item ${onClick ? 'clickable' : ''} ${isActive ? 'active' : ''}`}
    title={description}
    onClick={onClick}
    role={onClick ? 'button' : 'listitem'}
    tabIndex={onClick ? 0 : -1}
    onKeyDown={onClick ? (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    } : undefined}
    style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: '8px',
      padding: '6px 4px',
      cursor: onClick ? 'pointer' : 'default',
      borderRadius: '4px',
      transition: 'all 0.2s ease',
      backgroundColor: isActive ? 'rgba(66, 153, 225, 0.1)' : 'transparent',
      border: isActive ? '1px solid rgba(66, 153, 225, 0.3)' : '1px solid transparent'
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
      }
    }}
    onMouseLeave={(e) => {
      if (onClick && !isActive) {
        e.currentTarget.style.backgroundColor = 'transparent';
      }
    }}
  >
    <div 
      className="legend-color" 
      style={{
        backgroundColor: color,
        width: '18px',
        height: '18px',
        marginRight: '10px',
        borderRadius: isCircular ? '50%' : '3px',
        border: '1px solid rgba(0, 0, 0, 0.15)',
        flexShrink: 0,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
      }} 
    />
    {icon && (
      <span style={{ 
        marginRight: '8px', 
        fontSize: '16px',
        filter: isActive ? 'brightness(1.2)' : 'none'
      }}>
        {icon}
      </span>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <span 
        className="legend-label" 
        style={{ 
          fontSize: '0.875rem',
          fontWeight: isActive ? '600' : '500',
          color: isActive ? '#2d3748' : '#4a5568',
          display: 'block',
          lineHeight: '1.2'
        }}
      >
        {label}
      </span>
      {range && (
        <span style={{ 
          color: '#718096', 
          fontSize: '0.75rem',
          display: 'block',
          marginTop: '2px',
          fontFamily: 'monospace'
        }}>
          NDVI: {range}
        </span>
      )}
    </div>
  </div>
));

/**
 * Section de légende avec titre et compteur
 */
const LegendSection = memo(({ 
  title, 
  icon, 
  children, 
  style = {},
  count = null,
  isCollapsible = false,
  isCollapsed = false,
  onToggle = null
}) => (
  <div style={{ marginBottom: '20px', ...style }}>
    <div
      className={`legend-section-header ${isCollapsible ? 'collapsible' : ''}`}
      onClick={isCollapsible ? onToggle : undefined}
      role={isCollapsible ? 'button' : 'heading'}
      aria-expanded={isCollapsible ? !isCollapsed : undefined}
      tabIndex={isCollapsible ? 0 : -1}
      onKeyDown={isCollapsible ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle?.();
        }
      } : undefined}
      style={{ 
        marginBottom: isCollapsed ? '0' : '12px',
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#2d3748',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        cursor: isCollapsible ? 'pointer' : 'default',
        padding: isCollapsible ? '4px' : '0',
        borderRadius: '4px',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (isCollapsible) {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (isCollapsible) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon && <span style={{ fontSize: '18px' }}>{icon}</span>}
        <span>{title}</span>
        {count !== null && (
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#718096',
            backgroundColor: 'rgba(113, 128, 150, 0.1)',
            padding: '2px 6px',
            borderRadius: '10px',
            fontWeight: '500'
          }}>
            {count}
          </span>
        )}
      </div>
      {isCollapsible && (
        <span style={{ 
          fontSize: '12px', 
          color: '#a0aec0',
          transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      )}
    </div>
    {!isCollapsed && (
      <div 
        className="legend-section-content"
        style={{
          animation: isCollapsible ? 'fadeIn 0.3s ease' : 'none'
        }}
      >
        {children}
      </div>
    )}
  </div>
));

/**
 * Indicateur de qualité des données
 */
const DataQualityIndicator = memo(({ 
  satelliteData, 
  ndviMode = 'realistic',
  totalParks = 0,
  validNdviCount = 0 
}) => {
  if (ndviMode !== 'realistic' || !satelliteData) return null;

  const qualityScore = satelliteData.cloudCover < 10 ? 'Excellente' : 
                      satelliteData.cloudCover < 25 ? 'Bonne' : 
                      satelliteData.cloudCover < 50 ? 'Moyenne' : 'Faible';

  const completeness = totalParks > 0 ? ((validNdviCount / totalParks) * 100).toFixed(1) : 0;

  return (
    <div style={{
      marginTop: '15px',
      padding: '12px',
      backgroundColor: 'rgba(66, 153, 225, 0.05)',
      borderRadius: '6px',
      border: '1px solid rgba(66, 153, 225, 0.15)'
    }}>
      <div style={{ 
        fontSize: '0.85rem', 
        fontWeight: '600', 
        color: '#2d3748',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span>🛰️</span>
        <span>Qualité des données</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#4a5568', lineHeight: '1.4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Satellite:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>
            {satelliteData.satellite}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Couverture nuageuse:</span>
          <span style={{ 
            fontFamily: 'monospace', 
            fontWeight: '500',
            color: satelliteData.cloudCover > 30 ? '#f56565' : '#48bb78'
          }}>
            {satelliteData.cloudCover?.toFixed(1)}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Qualité:</span>
          <span style={{ fontWeight: '500' }}>{qualityScore}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Complétude:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>
            {completeness}%
          </span>
        </div>
      </div>
    </div>
  );
});

/**
 * Composant principal de la légende NDVI optimisé
 */
const NdviLegend = memo(({ 
  showNdvi = true, 
  showAgents = true,
  className = "",
  style = {},
  onNdviRangeClick = null,
  onAgentTypeClick = null,
  activeNdviRange = null,
  activeAgentTypes = [],
  satelliteData = null,
  ndviCalculationMode = 'realistic',
  statistics = null,
  isCompact = false
}) => {
  const [ndviSectionCollapsed, setNdviSectionCollapsed] = React.useState(false);
  const [agentsSectionCollapsed, setAgentsSectionCollapsed] = React.useState(false);

  // Calcul des statistiques pour chaque catégorie
  const ndviRangesWithStats = React.useMemo(() => {
    if (!statistics?.ndviDistribution) return NDVI_RANGES;
    
    return NDVI_RANGES.map(range => ({
      ...range,
      count: statistics.ndviDistribution[
        range.range === '0.8-1.0' ? 'excellent' :
        range.range === '0.6-0.8' ? 'good' :
        range.range === '0.4-0.6' ? 'moderate' :
        range.range === '0.2-0.4' ? 'poor' : 'critical'
      ] || 0
    }));
  }, [statistics]);

  const agentSpecialtiesWithStats = React.useMemo(() => {
    if (!statistics?.specialtiesCount) return AGENT_SPECIALTIES;
    
    return AGENT_SPECIALTIES.map(specialty => ({
      ...specialty,
      count: statistics.specialtiesCount[specialty.key] || 0
    }));
  }, [statistics]);

  return (
    <>
      <div 
        className={`ndvi-legend ${className}`}
        style={{
          backgroundColor: 'white',
          padding: isCompact ? '12px' : '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e2e8f0',
          minWidth: isCompact ? '200px' : '260px',
          maxWidth: isCompact ? '240px' : '320px',
          maxHeight: '85vh',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
          ...style
        }}
      >
        {/* En-tête de la légende */}
        <div style={{
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid #e2e8f0'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: '700',
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🗺️</span>
            <span>Légende Interactive</span>
          </h3>
          {ndviCalculationMode === 'realistic' && (
            <div style={{
              fontSize: '0.75rem',
              color: '#718096',
              marginTop: '4px'
            }}>
              Mode satellite activé
            </div>
          )}
        </div>
        
        {/* Section NDVI */}
        {showNdvi && (
          <LegendSection 
            title="Indice NDVI" 
            icon="🎨"
            count={statistics?.totalParks}
            isCollapsible={true}
            isCollapsed={ndviSectionCollapsed}
            onToggle={() => setNdviSectionCollapsed(!ndviSectionCollapsed)}
          >
            <div role="list" aria-label="Gammes d'indices NDVI">
              {ndviRangesWithStats.map((item, index) => (
                <LegendItem
                  key={`ndvi-${index}`}
                  color={item.color}
                  label={`${item.label}${item.count !== undefined ? ` (${item.count})` : ''}`}
                  range={item.range}
                  description={item.description}
                  icon={item.icon}
                  isCircular={false}
                  onClick={onNdviRangeClick ? () => onNdviRangeClick(item) : null}
                  isActive={activeNdviRange === item.range}
                />
              ))}
            </div>
          </LegendSection>
        )}
        
        {/* Séparateur */}
        {showNdvi && showAgents && (
          <div style={{ 
            borderTop: '1px solid #e2e8f0', 
            margin: '20px 0' 
          }} />
        )}
        
        {/* Section Agents */}
        {showAgents && (
          <LegendSection 
            title="Types d'Agents" 
            icon="👥"
            count={statistics?.totalUsers}
            isCollapsible={true}
            isCollapsed={agentsSectionCollapsed}
            onToggle={() => setAgentsSectionCollapsed(!agentsSectionCollapsed)}
          >
            <div role="list" aria-label="Types d'agents spécialisés">
              {agentSpecialtiesWithStats.map((specialty) => (
                <LegendItem
                  key={`agent-${specialty.key}`}
                  color={specialty.color}
                  label={`${specialty.label}${specialty.count !== undefined ? ` (${specialty.count})` : ''}`}
                  icon={specialty.icon}
                  description={specialty.description}
                  isCircular={true}
                  onClick={onAgentTypeClick ? () => onAgentTypeClick(specialty) : null}
                  isActive={activeAgentTypes.includes(specialty.key)}
                />
              ))}
            </div>
          </LegendSection>
        )}

        {/* Indicateur de qualité des données */}
        <DataQualityIndicator
          satelliteData={satelliteData}
          ndviMode={ndviCalculationMode}
          totalParks={statistics?.totalParks}
          validNdviCount={statistics?.validNdviCount}
        />
      </div>

      {/* Styles CSS intégrés */}
      <style jsx>{`
        .ndvi-legend::-webkit-scrollbar {
          width: 6px;
        }
        
        .ndvi-legend::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 3px;
        }
        
        .ndvi-legend::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        .ndvi-legend::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        
        .legend-item.clickable:focus {
          outline: 2px solid #4299e1;
          outline-offset: 1px;
        }
        
        .legend-section-header.collapsible:focus {
          outline: 2px solid #4299e1;
          outline-offset: 1px;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .ndvi-legend {
            min-width: 180px !important;
            max-width: 220px !important;
            padding: 12px !important;
          }
          
          .legend-item {
            margin-bottom: 6px !important;
          }
          
          .legend-color {
            width: 14px !important;
            height: 14px !important;
            margin-right: 8px !important;
          }
          
          .legend-label {
            font-size: 0.8rem !important;
          }
        }
      `}</style>
    </>
  );
});

NdviLegend.displayName = 'NdviLegend';

// Export des constantes pour réutilisation dans d'autres composants
export { NDVI_RANGES, AGENT_SPECIALTIES };
export default NdviLegend;