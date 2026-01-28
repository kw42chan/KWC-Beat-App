import {useState, useEffect} from 'react';
import {Zone} from '../types/zone';
import {useTheme} from '../context/ThemeContext';
import {ColorPicker} from './ColorPicker';
import './ZoneDetailsModal.css';

interface ZoneDetailsModalProps {
  visible: boolean;
  zone: Zone | null;
  onClose: () => void;
  onDelete?: (zoneId: number) => void;
  onUpdate?: (zone: Zone) => void;
  onEditBoundary?: (zoneId: number) => void;
  onDuplicate?: (zoneId: number) => void;
  onToggleVisibility?: (zoneId: number) => void;
}

export function ZoneDetailsModal({
  visible,
  zone,
  onClose,
  onDelete,
  onUpdate,
  onEditBoundary,
  onDuplicate,
  onToggleVisibility,
}: ZoneDetailsModalProps) {
  const {isDarkMode} = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(zone?.name || '');
  const [editedColor, setEditedColor] = useState(zone?.color);
  const [editedDescription, setEditedDescription] = useState(zone?.description || '');

  useEffect(() => {
    if (zone) {
      setEditedName(zone.name);
      setEditedColor(zone.color);
      setEditedDescription(zone.description || '');
      setIsEditing(false);
    }
  }, [zone]);

  if (!visible || !zone) {
    return null;
  }

  const handleSave = () => {
    if (onUpdate && editedName.trim()) {
      onUpdate({
        ...zone,
        name: editedName.trim(),
        color: editedColor || undefined, // Explicitly set to undefined if empty/null
        description: editedDescription.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedName(zone.name);
    setEditedColor(zone.color);
    setEditedDescription(zone.description || '');
    setIsEditing(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-container ${isDarkMode ? 'dark' : ''}`}
        onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className={`modal-title ${isDarkMode ? 'dark' : ''}`}>Zone {zone.id}</h2>
          <button onClick={onClose} className="modal-close-button" type="button">
            <span className={`modal-close-text ${isDarkMode ? 'dark' : ''}`}>✕</span>
          </button>
        </div>

        <div className="modal-content">
          <div className="modal-section">
            <div className="modal-section-header">
              <p className={`modal-label ${isDarkMode ? 'dark' : ''}`}>Name:</p>
              {!isEditing && (
                <button
                  className={`modal-edit-button ${isDarkMode ? 'dark' : ''}`}
                  onClick={() => setIsEditing(true)}
                  type="button"
                  title="Edit zone">
                  ✏️ Edit
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="modal-edit-controls">
                <input
                  type="text"
                  className={`modal-input ${isDarkMode ? 'dark' : ''}`}
                  value={editedName}
                  onChange={e => setEditedName(e.target.value)}
                  placeholder="Zone name"
                  autoFocus
                />
                <div className="modal-edit-actions">
                  <button
                    className={`modal-save-button ${isDarkMode ? 'dark' : ''}`}
                    onClick={handleSave}
                    type="button"
                    disabled={!editedName.trim()}>
                    ✓ Save
                  </button>
                  <button
                    className={`modal-cancel-button ${isDarkMode ? 'dark' : ''}`}
                    onClick={handleCancel}
                    type="button">
                    ✕ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className={`modal-value ${isDarkMode ? 'dark' : ''}`}>{zone.name}</p>
            )}
          </div>

          <div className="modal-section">
            <p className={`modal-label ${isDarkMode ? 'dark' : ''}`}>Color:</p>
            {isEditing ? (
              <ColorPicker
                selectedColor={editedColor}
                onColorSelect={setEditedColor}
              />
            ) : (
              <div className="modal-color-display">
                <div
                  className="modal-color-swatch"
                  style={{
                    backgroundColor: zone.color || 'rgba(0, 122, 255, 0.5)',
                  }}
                />
                <span className={`modal-value ${isDarkMode ? 'dark' : ''}`}>
                  {zone.color ? 'Custom' : 'Auto'}
                </span>
              </div>
            )}
          </div>

          <div className="modal-section">
            <p className={`modal-label ${isDarkMode ? 'dark' : ''}`}>Description:</p>
            {isEditing ? (
              <textarea
                className={`modal-textarea ${isDarkMode ? 'dark' : ''}`}
                value={editedDescription}
                onChange={e => setEditedDescription(e.target.value)}
                placeholder="Add notes or description..."
                rows={4}
                maxLength={500}
              />
            ) : (
              <p className={`modal-value ${isDarkMode ? 'dark' : ''}`}>
                {zone.description || <em className="modal-empty-text">No description</em>}
              </p>
            )}
          </div>

          <div className="modal-section">
            <p className={`modal-label ${isDarkMode ? 'dark' : ''}`}>
              Center Coordinates:
            </p>
            <p className={`modal-value ${isDarkMode ? 'dark' : ''}`}>
              {zone.centerLat.toFixed(6)}, {zone.centerLng.toFixed(6)}
            </p>
          </div>

          <div className="modal-section">
            <p className={`modal-label ${isDarkMode ? 'dark' : ''}`}>Bounding Box:</p>
            <p className={`modal-value ${isDarkMode ? 'dark' : ''}`}>
              Lat: {zone.minLat.toFixed(6)} to {zone.maxLat.toFixed(6)}
            </p>
            <p className={`modal-value ${isDarkMode ? 'dark' : ''}`}>
              Lng: {zone.minLng.toFixed(6)} to {zone.maxLng.toFixed(6)}
            </p>
          </div>

          <div className="modal-section">
            <p className={`modal-label ${isDarkMode ? 'dark' : ''}`}>Vertices:</p>
            <p className={`modal-value ${isDarkMode ? 'dark' : ''}`}>
              {zone.coordinates.length} points
            </p>
          </div>
        </div>

        <div className="modal-actions">
          {onToggleVisibility && !isEditing && (
            <button
              className={`modal-visibility-button ${isDarkMode ? 'dark' : ''}`}
              onClick={() => {
                onToggleVisibility(zone.id);
              }}
              type="button">
              <span className="modal-visibility-button-text">
                {zone.visible !== false ? '👁️ Hide Zone' : '👁️‍🗨️ Show Zone'}
              </span>
            </button>
          )}
          {onDuplicate && !isEditing && (
            <button
              className={`modal-duplicate-button ${isDarkMode ? 'dark' : ''}`}
              onClick={() => {
                onDuplicate(zone.id);
                onClose();
              }}
              type="button">
              <span className="modal-duplicate-button-text">📋 Duplicate Zone</span>
            </button>
          )}
          {onEditBoundary && !isEditing && (
            <button
              className={`modal-edit-boundary-button ${isDarkMode ? 'dark' : ''}`}
              onClick={() => {
                onEditBoundary(zone.id);
                onClose();
              }}
              type="button">
              <span className="modal-edit-boundary-button-text">✏️ Edit Boundary</span>
            </button>
          )}
          {onDelete && !isEditing && (
            <button
              className={`modal-delete-button ${isDarkMode ? 'dark' : ''}`}
              onClick={() => {
                if (window.confirm(`Delete ${zone.name}?`)) {
                  onDelete(zone.id);
                }
              }}
              type="button">
              <span className="modal-delete-button-text">Delete Zone</span>
            </button>
          )}
          {!isEditing && (
            <button
              className={`modal-close-button-large ${isDarkMode ? 'dark' : ''}`}
              onClick={onClose}
              type="button">
              <span className="modal-close-button-text">Close</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
