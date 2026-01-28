import {useState} from 'react';
import {Zone} from '../types/zone';
import {useTheme} from '../context/ThemeContext';
import './ZoneList.css';

interface ZoneListProps {
  zones: Zone[];
  onZoneClick: (zone: Zone) => void;
  onZoomToZone: (zone: Zone) => void;
  onToggleVisibility: (zoneId: number) => void;
}

export function ZoneList({
  zones,
  onZoneClick,
  onZoomToZone,
  onToggleVisibility,
}: ZoneListProps) {
  const {isDarkMode} = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterVisible, setFilterVisible] = useState<'all' | 'visible' | 'hidden'>('all');

  const visibleZones = zones.filter(z => z.visible !== false);
  const hiddenZones = zones.filter(z => z.visible === false);

  const filteredZones =
    filterVisible === 'all'
      ? zones
      : filterVisible === 'visible'
        ? visibleZones
        : hiddenZones;

  const sortedZones = [...filteredZones].sort((a, b) => a.id - b.id);

  return (
    <div className={`zone-list-container ${isDarkMode ? 'dark' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="zone-list-header">
        <button
          className={`zone-list-toggle ${isDarkMode ? 'dark' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          title={isExpanded ? 'Collapse Zone List' : 'Expand Zone List'}>
          <span className="zone-list-icon">{isExpanded ? '▼' : '▶'}</span>
          <span className="zone-list-title">
            Zones ({zones.length})
          </span>
        </button>
        {isExpanded && (
          <div className="zone-list-filters">
            <button
              className={`filter-button ${filterVisible === 'all' ? 'active' : ''} ${isDarkMode ? 'dark' : ''}`}
              onClick={() => setFilterVisible('all')}
              type="button">
              All
            </button>
            <button
              className={`filter-button ${filterVisible === 'visible' ? 'active' : ''} ${isDarkMode ? 'dark' : ''}`}
              onClick={() => setFilterVisible('visible')}
              type="button">
              Visible ({visibleZones.length})
            </button>
            <button
              className={`filter-button ${filterVisible === 'hidden' ? 'active' : ''} ${isDarkMode ? 'dark' : ''}`}
              onClick={() => setFilterVisible('hidden')}
              type="button">
              Hidden ({hiddenZones.length})
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="zone-list-content">
          {sortedZones.length === 0 ? (
            <div className={`zone-list-empty ${isDarkMode ? 'dark' : ''}`}>
              {filterVisible === 'all'
                ? 'No zones yet. Draw your first zone!'
                : filterVisible === 'visible'
                  ? 'No visible zones'
                  : 'No hidden zones'}
            </div>
          ) : (
            <div className="zone-list-items">
              {sortedZones.map(zone => (
                <div
                  key={zone.id}
                  className={`zone-list-item ${zone.visible === false ? 'hidden' : ''} ${zone.locked ? 'locked' : ''} ${isDarkMode ? 'dark' : ''}`}>
                  <div className="zone-list-item-main">
                    <div className="zone-list-item-info">
                      <div className="zone-list-item-name">
                        <span className="zone-id">#{zone.id}</span>
                        <span className="zone-name">{zone.name}</span>
                        {zone.locked && (
                          <span className="zone-lock-icon" title="Locked">🔒</span>
                        )}
                      </div>
                      {zone.description && (
                        <div className="zone-list-item-description">{zone.description}</div>
                      )}
                      {zone.createdAt && (
                        <div className="zone-list-item-date">
                          Created: {new Date(zone.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="zone-list-item-actions">
                      <button
                        className={`zone-action-button ${isDarkMode ? 'dark' : ''}`}
                        onClick={() => onToggleVisibility(zone.id)}
                        type="button"
                        title={zone.visible === false ? 'Show zone' : 'Hide zone'}>
                        {zone.visible === false ? '👁️‍🗨️' : '👁️'}
                      </button>
                      <button
                        className={`zone-action-button ${isDarkMode ? 'dark' : ''}`}
                        onClick={() => onZoomToZone(zone)}
                        type="button"
                        title="Zoom to zone">
                        🔍
                      </button>
                      <button
                        className={`zone-action-button ${isDarkMode ? 'dark' : ''}`}
                        onClick={() => onZoneClick(zone)}
                        type="button"
                        title="View details">
                        ℹ️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
