import {useState, useRef, ChangeEvent} from 'react';
import {Zone} from '../types/zone';
import {useTheme} from '../context/ThemeContext';
import {loadZonesFromFile} from '../utils/zoneStorage';
import './ImportModal.css';

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (zones: Zone[]) => void;
  existingZoneCount: number;
}

export function ImportModal({visible, onClose, onImport, existingZoneCount}: ImportModalProps) {
  const {isDarkMode} = useTheme();
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Zone[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!visible) {
    return null;
  }

  const validateZone = (zone: any): zone is Zone => {
    return (
      typeof zone.id === 'number' &&
      typeof zone.name === 'string' &&
      Array.isArray(zone.coordinates) &&
      zone.coordinates.length >= 3 &&
      typeof zone.minLat === 'number' &&
      typeof zone.maxLat === 'number' &&
      typeof zone.minLng === 'number' &&
      typeof zone.maxLng === 'number' &&
      typeof zone.centerLat === 'number' &&
      typeof zone.centerLng === 'number'
    );
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);

    try {
      const zones = await loadZonesFromFile(file);

      if (zones.length === 0) {
        setError('Invalid file format: No zones found in file');
        return;
      }

      // Validate all zones
      const invalidZones = zones.filter((zone) => !validateZone(zone));
      if (invalidZones.length > 0) {
        setError(`Invalid zone data found at ${invalidZones.length} position(s)`);
        return;
      }

      setPreview(zones);
    } catch (err) {
      setError(`Failed to load file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleImport = () => {
    if (!preview) return;

    if (importMode === 'replace') {
      onImport(preview);
    } else {
      // Merge mode: append with adjusted IDs
      const maxId = Math.max(...preview.map(z => z.id), existingZoneCount);
      const mergedZones = preview.map((zone, index) => ({
        ...zone,
        id: maxId + index + 1,
      }));
      onImport(mergedZones);
    }

    handleClose();
  };

  const handleClose = () => {
    setError(null);
    setPreview(null);
    setImportMode('merge');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className={`import-modal-container ${isDarkMode ? 'dark' : ''}`}
        onClick={e => e.stopPropagation()}>
        <div className="import-modal-header">
          <h2 className={`import-modal-title ${isDarkMode ? 'dark' : ''}`}>Import Zones</h2>
          <button onClick={handleClose} className="modal-close-button" type="button">
            <span className={`modal-close-text ${isDarkMode ? 'dark' : ''}`}>✕</span>
          </button>
        </div>

        <div className="import-modal-content">
          <div className="import-modal-section">
            <label className={`import-modal-label ${isDarkMode ? 'dark' : ''}`}>
              Select JSON file:
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="import-file-input"
            />
          </div>

          {error && (
            <div className="import-error">
              <span className="import-error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {preview && (
            <div className="import-preview">
              <div className="import-preview-header">
                <span className={`import-modal-label ${isDarkMode ? 'dark' : ''}`}>
                  Preview ({preview.length} zones)
                </span>
              </div>
              <div className="import-preview-list">
                {preview.slice(0, 5).map(zone => (
                  <div key={zone.id} className={`import-preview-item ${isDarkMode ? 'dark' : ''}`}>
                    <span className="import-preview-name">{zone.name}</span>
                    <span className="import-preview-coords">
                      {zone.coordinates.length} vertices
                    </span>
                  </div>
                ))}
                {preview.length > 5 && (
                  <div className={`import-preview-more ${isDarkMode ? 'dark' : ''}`}>
                    ... and {preview.length - 5} more zones
                  </div>
                )}
              </div>

              <div className="import-mode-selection">
                <label className={`import-mode-label ${isDarkMode ? 'dark' : ''}`}>
                  <input
                    type="radio"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                  />
                  <span>Merge with existing zones ({existingZoneCount} zones)</span>
                </label>
                <label className={`import-mode-label ${isDarkMode ? 'dark' : ''}`}>
                  <input
                    type="radio"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                  />
                  <span>Replace all zones</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="import-modal-actions">
          <button
            className={`import-cancel-button ${isDarkMode ? 'dark' : ''}`}
            onClick={handleClose}
            type="button">
            Cancel
          </button>
          {preview && (
            <button
              className={`import-confirm-button ${isDarkMode ? 'dark' : ''}`}
              onClick={handleImport}
              type="button">
              {importMode === 'merge' ? 'Merge' : 'Replace'} Zones
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
