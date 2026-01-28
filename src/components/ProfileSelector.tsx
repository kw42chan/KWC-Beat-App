import React, {useState, useEffect, useRef} from 'react';
import {Profile} from '../types/profile';
import {useTheme} from '../context/ThemeContext';
import {
  getAllProfiles,
  createProfile,
  deleteProfile,
  updateProfile,
  setCurrentProfileId,
  getCurrentProfileId,
} from '../utils/zoneStorage';
import './ProfileSelector.css';

// Check if server storage is enabled
const isServerStorageEnabled = (): boolean => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  return apiUrl !== '';
};

interface ProfileSelectorProps {
  onProfileChange: (profileId: string) => void;
}

export function ProfileSelector({onProfileChange}: ProfileSelectorProps) {
  const {isDarkMode} = useTheme();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileIdState] = useState<string>('default');
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadProfiles();
    setCurrentProfileIdState(getCurrentProfileId());
  }, []);

  const loadProfiles = async () => {
    const loadedProfiles = await getAllProfiles();
    setProfiles(loadedProfiles);
    
    // Ensure current profile exists
    const currentId = getCurrentProfileId();
    if (!loadedProfiles.find(p => p.id === currentId)) {
      // If current profile doesn't exist, switch to first profile or default
      const firstProfile = loadedProfiles[0];
      if (firstProfile) {
        setCurrentProfileId(firstProfile.id);
        setCurrentProfileIdState(firstProfile.id);
        onProfileChange(firstProfile.id);
      }
    }
  };

  const handleProfileSelect = (profileId: string) => {
    setCurrentProfileId(profileId);
    setCurrentProfileIdState(profileId);
    setIsOpen(false);
    onProfileChange(profileId);
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;
    
    const profile = await createProfile(newProfileName.trim());
    await loadProfiles();
    setNewProfileName('');
    setIsCreating(false);
    handleProfileSelect(profile.id);
  };

  const handleStartEdit = (profile: Profile) => {
    setEditingProfileId(profile.id);
    setEditingName(profile.name);
  };

  const handleSaveEdit = async (profileId: string) => {
    if (!editingName.trim()) return;
    
    await updateProfile(profileId, {name: editingName.trim()});
    await loadProfiles();
    setEditingProfileId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingProfileId(null);
    setEditingName('');
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (profiles.length <= 1) {
      alert('Cannot delete the last profile. Create a new profile first.');
      return;
    }
    
    if (!window.confirm(`Delete profile "${profiles.find(p => p.id === profileId)?.name}"? All zones in this profile will be deleted.`)) {
      return;
    }
    
    await deleteProfile(profileId);
    await loadProfiles();
    
    // If deleted profile was current, switch to first available
    if (profileId === currentProfileId) {
      const remainingProfiles = profiles.filter(p => p.id !== profileId);
      if (remainingProfiles.length > 0) {
        handleProfileSelect(remainingProfiles[0].id);
      }
    }
  };

  const currentProfile = profiles.find(p => p.id === currentProfileId);

  const handleMouseEnter = () => {
    // Cancel any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Add a longer delay before closing to allow mouse movement
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const selector = document.querySelector('.profile-selector');
      if (selector && !selector.contains(target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const isServerMode = isServerStorageEnabled();

  return (
    <div
      className={`profile-selector ${isDarkMode ? 'dark' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      <button
        className={`profile-selector-button ${isDarkMode ? 'dark' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        title="Select Profile">
        <span className="profile-icon">📁</span>
        <span className="profile-name">
          {currentProfile?.name || 'Select Profile'}
        </span>
        <span className={`storage-indicator ${isServerMode ? 'server' : 'local'}`} title={isServerMode ? 'Using server storage (shared across browsers)' : 'Using local storage (browser-specific)'}>
          {isServerMode ? '🌐' : '💾'}
        </span>
        <span className="profile-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={`profile-dropdown ${isDarkMode ? 'dark' : ''}`}>
          <div className="profile-list">
            {profiles.map(profile => (
              <div
                key={profile.id}
                className={`profile-item ${profile.id === currentProfileId ? 'active' : ''} ${isDarkMode ? 'dark' : ''}`}>
                {editingProfileId === profile.id ? (
                  <div className="profile-edit">
                    <input
                      type="text"
                      className={`profile-edit-input ${isDarkMode ? 'dark' : ''}`}
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(profile.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      className={`profile-edit-save ${isDarkMode ? 'dark' : ''}`}
                      onClick={() => handleSaveEdit(profile.id)}
                      type="button">
                      ✓
                    </button>
                    <button
                      className={`profile-edit-cancel ${isDarkMode ? 'dark' : ''}`}
                      onClick={handleCancelEdit}
                      type="button">
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className="profile-item-content"
                      onClick={() => handleProfileSelect(profile.id)}>
                      <span className="profile-item-name">{profile.name}</span>
                      {profile.zoneCount !== undefined && (
                        <span className="profile-item-count">{profile.zoneCount} zones</span>
                      )}
                    </div>
                    <div className="profile-item-actions">
                      <button
                        className={`profile-action-button ${isDarkMode ? 'dark' : ''}`}
                        onClick={() => handleStartEdit(profile)}
                        type="button"
                        title="Rename">
                        ✏️
                      </button>
                      {profiles.length > 1 && (
                        <button
                          className={`profile-action-button danger ${isDarkMode ? 'dark' : ''}`}
                          onClick={() => handleDeleteProfile(profile.id)}
                          type="button"
                          title="Delete">
                          🗑️
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {isCreating ? (
            <div className="profile-create">
              <input
                type="text"
                className={`profile-create-input ${isDarkMode ? 'dark' : ''}`}
                placeholder="Profile name"
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleCreateProfile();
                  } else if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewProfileName('');
                  }
                }}
                autoFocus
              />
              <button
                className={`profile-create-save ${isDarkMode ? 'dark' : ''}`}
                onClick={handleCreateProfile}
                type="button">
                ✓
              </button>
              <button
                className={`profile-create-cancel ${isDarkMode ? 'dark' : ''}`}
                onClick={() => {
                  setIsCreating(false);
                  setNewProfileName('');
                }}
                type="button">
                ✕
              </button>
            </div>
          ) : (
            <button
              className={`profile-create-button ${isDarkMode ? 'dark' : ''}`}
              onClick={() => setIsCreating(true)}
              type="button">
              + New Profile
            </button>
          )}
        </div>
      )}
    </div>
  );
}
