import React, {useState, useEffect, useRef, useCallback} from 'react';
import {GoogleMap, Polygon, Marker, useJsApiLoader, DrawingManager} from '@react-google-maps/api';
import {Zone} from '../types/zone';
import {useTheme} from '../context/ThemeContext';
import {generateZoneColor, getAllZonesBounds, createZoneFromPolygon} from '../utils/zoneUtils';
import {SearchBar} from './SearchBar';
import {ZoomControls} from './ZoomControls';
import {ZoneDetailsModal} from './ZoneDetailsModal';
import {LoadingSpinner} from './LoadingSpinner';
import {ErrorView} from './ErrorView';
import {DrawingControls} from './DrawingControls';
import {ImportModal} from './ImportModal';
import {UndoRedoControls} from './UndoRedoControls';
import {ZoneList} from './ZoneList';
import {ProfileSelector} from './ProfileSelector';
import {createHistoryState, addToHistory, undo, redo, canUndo, canRedo, HistoryState} from '../utils/zoneHistory';
import {saveZonesToDB, loadZonesFromDB, exportZonesToFile, getCurrentProfileId} from '../utils/zoneStorage';
import './MapScreen.css';

const KOWLOON_CENTER = {
  lat: 22.362718,
  lng: 114.128100,
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Google Maps libraries - must be a const outside component to avoid reload warnings
const GOOGLE_MAPS_LIBRARIES: ('drawing')[] = ['drawing'];

export function MapScreen() {
  const {isDarkMode} = useTheme();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [filteredZones, setFilteredZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(KOWLOON_CENTER);
  const [mapZoom] = useState(15);
  const [mapStyle, setMapStyle] = useState<'light' | 'dark'>('light');
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [historyState, setHistoryState] = useState<HistoryState | null>(null);
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{x: number; y: number} | null>(null);
  const [originalZoneCoordinates, setOriginalZoneCoordinates] = useState<Map<number, Array<{lat: number; lng: number}>>>(new Map());
  const [currentProfileId, setCurrentProfileId] = useState<string>(getCurrentProfileId());
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonRefs = useRef<Map<number, google.maps.Polygon>>(new Map());
  const isInitialLoadRef = useRef<boolean>(true);
  const hasLoadedZonesRef = useRef<boolean>(false);

  const {isLoaded, loadError} = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const loadZonesForProfile = async (profileId: string) => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      isInitialLoadRef.current = true;
      const loadedZones = await loadZonesFromDB(profileId);
      
      if (loadedZones && loadedZones.length > 0) {
        // Ensure zones have default values for new fields
        const normalizedZones = loadedZones.map(zone => ({
          ...zone,
          visible: zone.visible !== undefined ? zone.visible : true,
          locked: zone.locked !== undefined ? zone.locked : false,
        }));
        setZones(normalizedZones);
        setFilteredZones(normalizedZones);
        setHistoryState(createHistoryState(normalizedZones));
        hasLoadedZonesRef.current = true;

        // Calculate initial center and zoom
        if (normalizedZones.length > 0) {
          const bounds = getAllZonesBounds(normalizedZones);
          const centerLat = (bounds.minLat + bounds.maxLat) / 2;
          const centerLng = (bounds.minLng + bounds.maxLng) / 2;
          setMapCenter({lat: centerLat, lng: centerLng});
        }
        
        // Update profile zone count (don't block on this)
        const {updateProfile} = await import('../utils/zoneStorage');
        updateProfile(profileId, {zoneCount: normalizedZones.length}).catch(err => {
          console.warn('Failed to update profile zone count:', err);
        });
      } else {
        setZones([]);
        setFilteredZones([]);
        setHistoryState(createHistoryState([]));
        hasLoadedZonesRef.current = true;
        
        // Update profile zone count to 0 (don't block on this)
        const {updateProfile} = await import('../utils/zoneStorage');
        updateProfile(profileId, {zoneCount: 0}).catch(err => {
          console.warn('Failed to update profile zone count:', err);
        });
      }
      setIsLoading(false);
      // Mark initial load as complete after a short delay to allow state to settle
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    } catch (err) {
      console.error('Error loading zones:', err);
      // Don't show error for empty zones - just start with empty state
      setZones([]);
      setFilteredZones([]);
      setHistoryState(createHistoryState([]));
      hasLoadedZonesRef.current = true;
      setIsLoading(false);
      // Mark initial load as complete
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
      // Only set error for critical failures
      if (err instanceof Error && !err.message.includes('API')) {
        setError('Failed to load zone data. Starting with empty map.');
      }
    }
  };

  useEffect(() => {
    // Load zones for current profile
    loadZonesForProfile(currentProfileId);

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Loading timeout - forcing app to show');
        setIsLoading(false);
        setZones([]);
        setFilteredZones([]);
        setHistoryState(createHistoryState([]));
      }
    }, 10000); // 10 second timeout

    // Check network connectivity
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Keyboard shortcuts will be set up after handleUndo/handleRedo are defined

    return () => {
      clearTimeout(loadingTimeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentProfileId]);


  // Save zones to IndexedDB whenever zones change (persists across browsers on same origin)
  // BUT: Don't save during initial load to avoid overwriting backend data with empty array
  useEffect(() => {
    // Skip saving if we're still in initial load phase
    if (isInitialLoadRef.current || !hasLoadedZonesRef.current) {
      return;
    }
    
    // Only save if zones actually changed (not just initial empty state)
    if (zones.length === 0) {
      // Don't save empty array - let backend keep its data
      // Only clear local storage fallback
      localStorage.removeItem(`kwc-beat-zones-${currentProfileId}`);
      return;
    }
    
    // Save to backend/IndexedDB (with localStorage fallback)
    saveZonesToDB(zones, currentProfileId).catch(err => {
      console.error('Failed to save zones:', err);
    });
  }, [zones, currentProfileId]);

  const handleProfileChange = (profileId: string) => {
    setCurrentProfileId(profileId);
    hasLoadedZonesRef.current = false; // Reset flag for new profile
    // Zones will be reloaded via useEffect dependency on currentProfileId
  };

  // Helper function to update zones and history
  const updateZones = useCallback((newZones: Zone[]) => {
    setZones(newZones);
    setFilteredZones(newZones);
    setHistoryState(prevState => {
      if (!prevState) {
        return createHistoryState(newZones);
      }
      return addToHistory(prevState, newZones);
    });
  }, []);

  const handleZoomToZone = useCallback((zone: Zone) => {
    if (!mapRef.current) return;

    const bounds = new google.maps.LatLngBounds();
    zone.coordinates.forEach(coord => {
      bounds.extend(coord);
    });

    mapRef.current.fitBounds(bounds);
  }, []);

  const handleCancelBoundaryEdit = useCallback((zoneId: number) => {
    const polygon = polygonRefs.current.get(zoneId);
    const originalCoords = originalZoneCoordinates.get(zoneId);
    
    if (polygon && originalCoords) {
      // Restore original coordinates
      const path = polygon.getPath();
      path.clear();
      originalCoords.forEach(coord => {
        path.push(new google.maps.LatLng(coord.lat, coord.lng));
      });
      
      // Stop editing
      polygon.setEditable(false);
      setEditingZoneId(null);
      setOriginalZoneCoordinates(new Map());
    } else {
      // Just stop editing if no original coordinates
      if (polygon) {
        polygon.setEditable(false);
      }
      setEditingZoneId(null);
      setOriginalZoneCoordinates(new Map());
    }
  }, []);

  useEffect(() => {
    // Filter zones based on search query
    if (!searchQuery.trim()) {
      setFilteredZones(zones);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = zones.filter(
      zone =>
        zone.id.toString().includes(query) ||
        zone.name.toLowerCase().includes(query),
    );
    setFilteredZones(filtered);

    // If search returns a single zone, zoom to it
    if (filtered.length === 1) {
      handleZoomToZone(filtered[0]);
    }
  }, [searchQuery, zones, handleZoomToZone]);

  const handleZoneClick = (zone: Zone) => {
    setSelectedZone(zone);
    setIsModalVisible(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleFitAllZones = useCallback(() => {
    if (zones.length === 0 || !mapRef.current) {
      // If no zones, center on Kowloon
      mapRef.current?.setCenter(KOWLOON_CENTER);
      mapRef.current?.setZoom(15);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    zones.forEach(zone => {
      zone.coordinates.forEach(coord => {
        bounds.extend(coord);
      });
    });

    mapRef.current.fitBounds(bounds);
  }, [zones]);


  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    try {
      const savedZones = localStorage.getItem('kwc-beat-zones');
      if (savedZones) {
        const loadedZones = JSON.parse(savedZones) as Zone[];
        setZones(loadedZones);
        setFilteredZones(loadedZones);
      }
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load zone data');
      setIsLoading(false);
    }
  };

  const handleStartDrawing = () => {
    // Stop editing if currently editing a zone (cancel changes)
    if (editingZoneId !== null) {
      handleCancelBoundaryEdit(editingZoneId);
    }
    setIsDrawing(true);
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
    // Also stop editing if active (cancel changes)
    if (editingZoneId !== null) {
      handleCancelBoundaryEdit(editingZoneId);
    }
  };

  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const coordinates: Array<{lat: number; lng: number}> = [];
    
    path.forEach((latLng) => {
      coordinates.push({
        lat: latLng.lat(),
        lng: latLng.lng(),
      });
    });

    // Create new zone
    const newZoneId = zones.length > 0 ? Math.max(...zones.map(z => z.id)) + 1 : 1;
    const newZone = createZoneFromPolygon(
      newZoneId,
      `Zone ${newZoneId}`,
      coordinates,
    );
    newZone.visible = true;
    newZone.locked = false;
    newZone.createdAt = new Date().toISOString();
    newZone.updatedAt = new Date().toISOString();

    // Add to zones
    const updatedZones = [...zones, newZone];
    updateZones(updatedZones);

    // Remove the polygon from map (we'll render it ourselves)
    polygon.setMap(null);

    // Stop drawing mode
    setIsDrawing(false);
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all zones? This cannot be undone.')) {
      updateZones([]);
    }
  };

  const handleExport = async () => {
    // Get current profile name for export
    const {getAllProfiles} = await import('../utils/zoneStorage');
    const profiles = await getAllProfiles();
    const currentProfile = profiles.find(p => p.id === currentProfileId);
    exportZonesToFile(zones, currentProfile?.name);
  };

  const handleDeleteZone = (zoneId: number) => {
    const zone = zones.find(z => z.id === zoneId);
    if (zone?.locked) {
      alert('Cannot delete a locked zone. Unlock it first.');
      return;
    }
    const updatedZones = zones.filter(z => z.id !== zoneId);
    updateZones(updatedZones);
    setIsModalVisible(false);
    // Remove polygon ref if exists
    const polygon = polygonRefs.current.get(zoneId);
    if (polygon) {
      polygon.setMap(null);
      polygonRefs.current.delete(zoneId);
    }
  };

  const handleUpdateZone = (updatedZone: Zone) => {
    const zone = zones.find(z => z.id === updatedZone.id);
    if (zone?.locked) {
      alert('Cannot edit a locked zone. Unlock it first.');
      return;
    }
    const updatedZones = zones.map(z => (z.id === updatedZone.id ? updatedZone : z));
    updateZones(updatedZones);
    setIsModalVisible(false);
  };

  const handleDuplicateZone = (zoneId: number) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    const newZoneId = zones.length > 0 ? Math.max(...zones.map(z => z.id)) + 1 : 1;
    const duplicatedZone: Zone = {
      ...zone,
      id: newZoneId,
      name: `${zone.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedZones = [...zones, duplicatedZone];
    updateZones(updatedZones);
  };

  const handleToggleVisibility = (zoneId: number) => {
    const updatedZones = zones.map(z =>
      z.id === zoneId ? {...z, visible: z.visible === false ? true : false} : z
    );
    updateZones(updatedZones);
  };

  const handleImport = async (importedZones: Zone[]) => {
    if (importedZones.length === 0) return;
    updateZones(importedZones);
    
    // Update profile zone count after import
    const {updateProfile} = await import('../utils/zoneStorage');
    await updateProfile(currentProfileId, {zoneCount: importedZones.length});
    
    setIsImportModalVisible(false);
  };

  const handleUndo = useCallback(() => {
    setHistoryState(prevState => {
      if (!prevState || !canUndo(prevState)) return prevState;
      const newState = undo(prevState);
      setZones(newState.present);
      setFilteredZones(newState.present);
      return newState;
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistoryState(prevState => {
      if (!prevState || !canRedo(prevState)) return prevState;
      const newState = redo(prevState);
      setZones(newState.present);
      setFilteredZones(newState.present);
      return newState;
    });
  }, []);

  const handleEditBoundary = (zoneId: number) => {
    setEditingZoneId(zoneId);
    setIsDrawing(false);
    
    // Find the zone and store original coordinates for potential cancel
    const zone = zones.find(z => z.id === zoneId);
    if (zone) {
      setOriginalZoneCoordinates(new Map([[zoneId, [...zone.coordinates]]]));
      
      // Use setTimeout to ensure polygon is rendered and ref is set
      setTimeout(() => {
        const polygon = polygonRefs.current.get(zoneId);
        if (polygon) {
          // Force editable state - the useEffect should handle this, but ensure it's set
          polygon.setEditable(true);
          polygon.setDraggable(false);
          
          // Ensure the polygon is clickable for editing vertices
          polygon.setOptions({
            clickable: false, // Disable polygon click when editing
            editable: true,
            draggable: false,
          });
        }
      }, 100);
    }
  };

  const handleSaveBoundary = (zoneId: number) => {
    const polygon = polygonRefs.current.get(zoneId);
    const zone = zones.find(z => z.id === zoneId);
    
    if (!polygon || !zone) return;
    
    const path = polygon.getPath();
    const coordinates: Array<{lat: number; lng: number}> = [];
    
    path.forEach((latLng) => {
      coordinates.push({
        lat: latLng.lat(),
        lng: latLng.lng(),
      });
    });

    // Update zone with new coordinates
    const updatedZone = createZoneFromPolygon(zone.id, zone.name, coordinates);
    // Preserve custom properties
    updatedZone.color = zone.color;
    updatedZone.description = zone.description;
    updatedZone.visible = zone.visible !== undefined ? zone.visible : true;
    updatedZone.locked = zone.locked;
    updatedZone.createdAt = zone.createdAt;
    updatedZone.updatedAt = new Date().toISOString();
    
    const updatedZones = zones.map(z => (z.id === zoneId ? updatedZone : z));
    updateZones(updatedZones);
    
    // Stop editing
    polygon.setEditable(false);
    setEditingZoneId(null);
    setOriginalZoneCoordinates(new Map());
  };

  // Set up keyboard shortcuts after handlers are defined
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key: Cancel drawing or editing
      if (e.key === 'Escape') {
        if (isDrawing) {
          e.preventDefault();
          handleCancelDrawing();
        } else if (editingZoneId !== null) {
          e.preventDefault();
          handleCancelBoundaryEdit(editingZoneId);
        }
        return;
      }
      
      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo, isDrawing, editingZoneId, handleCancelBoundaryEdit]);

  // Effect to handle editing state changes
  useEffect(() => {
    // Update editable state for all polygons based on editingZoneId
    polygonRefs.current.forEach((polygon, zoneId) => {
      const shouldBeEditable = editingZoneId === zoneId;
      polygon.setEditable(shouldBeEditable);
      polygon.setDraggable(false);
      
      if (!shouldBeEditable) {
        // Clean up edit listeners when not editing
        const editListeners = (polygon as any)._editListeners;
        if (editListeners) {
          editListeners.forEach((listener: google.maps.MapsEventListener) => {
            google.maps.event.removeListener(listener);
          });
          delete (polygon as any)._editListeners;
        }
        // Clean up hover listeners
        const hoverListeners = (polygon as any)._hoverListeners;
        if (hoverListeners) {
          hoverListeners.forEach((listener: google.maps.MapsEventListener) => {
            google.maps.event.removeListener(listener);
          });
          delete (polygon as any)._hoverListeners;
        }
      }
    });
    
    // Clear original coordinates when editing stops
    if (editingZoneId === null) {
      setOriginalZoneCoordinates(new Map());
    }
  }, [editingZoneId]);

  // Effect to update polygon colors when zone colors change
  useEffect(() => {
    zones.forEach(zone => {
      const polygon = polygonRefs.current.get(zone.id);
      if (polygon) {
        const isCurrentlyEditing = editingZoneId === zone.id;
        if (!isCurrentlyEditing) {
          const color = generateZoneColor(zone, isDarkMode);
          const strokeColor = color.replace(/,\s*[\d.]+\)$/, ', 1.0)');
          polygon.setOptions({
            fillColor: color,
            strokeColor: strokeColor,
          });
        }
      }
    });
  }, [zones, isDarkMode, editingZoneId]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Always fit bounds when map loads (will center on Kowloon if no zones)
    setTimeout(() => {
      handleFitAllZones();
    }, 500);
  }, [handleFitAllZones]);

  // Update map style when mapStyle changes (must be before conditional returns)
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      mapRef.current.setOptions({
        styles: mapStyle === 'dark'
          ? [
              {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
              {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
              {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{color: '#17263c'}],
              },
            ]
          : undefined,
      });
    }
  }, [mapStyle, isLoaded]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <ErrorView
        message="Google Maps API key is missing. Please create a .env file with VITE_GOOGLE_MAPS_API_KEY=your_key"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loadError) {
    return (
      <ErrorView
        message="Failed to load Google Maps. Please check your API key and ensure Maps JavaScript API is enabled."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!isLoaded || isLoading) {
    return <LoadingSpinner message="Loading map..." />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={handleRetry} />;
  }

  // No error if zones.length === 0 - user can draw zones

  return (
    <div className="map-screen">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={mapZoom}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: false,
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          styles: mapStyle === 'dark'
            ? [
                {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
                {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
                {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
                {
                  featureType: 'water',
                  elementType: 'geometry',
                  stylers: [{color: '#17263c'}],
                },
              ]
            : undefined,
        }}>
        {isDrawing && (
          <DrawingManager
            onLoad={(drawingManager) => {
              drawingManagerRef.current = drawingManager;
              drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
            }}
            onPolygonComplete={handlePolygonComplete}
            options={{
              drawingControl: false,
              polygonOptions: {
                fillColor: '#007aff',
                fillOpacity: 0.3,
                strokeColor: '#007aff',
                strokeWeight: 2,
                clickable: false,
                editable: false,
                zIndex: 1,
              },
            }}
          />
        )}

        {filteredZones
          .filter(zone => zone.visible !== false)
          .map(zone => {
            const color = generateZoneColor(zone, isDarkMode);
            const isHighlighted = searchQuery.trim() && filteredZones.includes(zone);
            const isEditing = editingZoneId === zone.id;
            const fillOpacity = isHighlighted ? 0.5 : isEditing ? 0.4 : 0.3;
            const strokeOpacity = zone.visible === false ? 0.3 : 1.0;
            
            // Extract base color for stroke (remove opacity)
            const strokeColor = color.replace(/,\s*[\d.]+\)$/, ', 1.0)');

          return (
            <React.Fragment key={zone.id}>
              <Polygon
                key={`zone-${zone.id}-${zone.color || 'auto'}-${isDarkMode}-${isEditing ? 'editing' : 'normal'}`}
                paths={zone.coordinates}
                options={{
                  fillColor: color,
                  fillOpacity: hoveredZone?.id === zone.id ? Math.min(fillOpacity + 0.2, 0.7) : fillOpacity,
                  strokeColor: strokeColor,
                  strokeOpacity,
                  strokeWeight: hoveredZone?.id === zone.id ? (isEditing ? 4 : 3) : (isEditing ? 3 : 2),
                  clickable: !isEditing, // Disable polygon click when editing, but vertices are still editable
                  editable: isEditing, // This enables vertex editing
                  draggable: false, // Don't drag the whole polygon
                  zIndex: isEditing ? 2000 : hoveredZone?.id === zone.id ? 1500 : isHighlighted ? 1000 : 1,
                }}
                onClick={() => {
                  if (!isEditing) {
                    handleZoneClick(zone);
                  }
                }}
                onLoad={(polygon) => {
                  polygonRefs.current.set(zone.id, polygon);
                  
                  // Ensure editable state matches current editing state
                  if (isEditing) {
                    polygon.setEditable(true);
                    polygon.setDraggable(false);
                    polygon.setOptions({
                      clickable: false,
                      editable: true,
                      draggable: false,
                    });
                  }
                  
                  // Add hover event listeners using Google Maps API
                  if (!isEditing) {
                    const mouseOverListener = google.maps.event.addListener(polygon, 'mouseover', (e: google.maps.MapMouseEvent) => {
                      setHoveredZone(zone);
                      if (e.latLng && mapRef.current) {
                        const projection = mapRef.current.getProjection();
                        if (projection) {
                          const bounds = mapRef.current.getBounds();
                          if (bounds) {
                            const ne = bounds.getNorthEast();
                            const sw = bounds.getSouthWest();
                            const nePoint = projection.fromLatLngToPoint(ne);
                            const swPoint = projection.fromLatLngToPoint(sw);
                            const point = projection.fromLatLngToPoint(e.latLng);
                            const mapDiv = mapRef.current.getDiv();
                            if (mapDiv && nePoint && swPoint && point) {
                              const rect = mapDiv.getBoundingClientRect();
                              const x = ((point.x - swPoint.x) / (nePoint.x - swPoint.x)) * rect.width;
                              const y = ((point.y - swPoint.y) / (nePoint.y - swPoint.y)) * rect.height;
                              setTooltipPosition({
                                x: rect.left + x,
                                y: rect.top + y - 10,
                              });
                            }
                          }
                        }
                      }
                    });
                    
                    const mouseMoveListener = google.maps.event.addListener(polygon, 'mousemove', (e: google.maps.MapMouseEvent) => {
                      if (hoveredZone?.id === zone.id && e.latLng && mapRef.current) {
                        const projection = mapRef.current.getProjection();
                        if (projection) {
                          const bounds = mapRef.current.getBounds();
                          if (bounds) {
                            const ne = bounds.getNorthEast();
                            const sw = bounds.getSouthWest();
                            const nePoint = projection.fromLatLngToPoint(ne);
                            const swPoint = projection.fromLatLngToPoint(sw);
                            const point = projection.fromLatLngToPoint(e.latLng);
                            const mapDiv = mapRef.current.getDiv();
                            if (mapDiv && nePoint && swPoint && point) {
                              const rect = mapDiv.getBoundingClientRect();
                              const x = ((point.x - swPoint.x) / (nePoint.x - swPoint.x)) * rect.width;
                              const y = ((point.y - swPoint.y) / (nePoint.y - swPoint.y)) * rect.height;
                              setTooltipPosition({
                                x: rect.left + x,
                                y: rect.top + y - 10,
                              });
                            }
                          }
                        }
                      }
                    });
                    
                    const mouseOutListener = google.maps.event.addListener(polygon, 'mouseout', () => {
                      setHoveredZone(null);
                      setTooltipPosition(null);
                    });
                    
                    // Store listeners for cleanup
                    (polygon as any)._hoverListeners = [mouseOverListener, mouseMoveListener, mouseOutListener];
                  }
                }}
              />
              {!isEditing && (
                <Marker
                  position={{lat: zone.centerLat, lng: zone.centerLng}}
                  onClick={() => handleZoneClick(zone)}
                  onMouseOver={() => {
                    setHoveredZone(zone);
                    // Position tooltip near marker center
                    if (mapRef.current) {
                      const projection = mapRef.current.getProjection();
                      if (projection) {
                        const bounds = mapRef.current.getBounds();
                        if (bounds) {
                          const ne = bounds.getNorthEast();
                          const sw = bounds.getSouthWest();
                          const nePoint = projection.fromLatLngToPoint(ne);
                          const swPoint = projection.fromLatLngToPoint(sw);
                          const point = projection.fromLatLngToPoint({lat: zone.centerLat, lng: zone.centerLng});
                          const mapDiv = mapRef.current.getDiv();
                          if (mapDiv && nePoint && swPoint && point && nePoint.x !== swPoint.x && nePoint.y !== swPoint.y) {
                            const rect = mapDiv.getBoundingClientRect();
                            const x = ((point.x - swPoint.x) / (nePoint.x - swPoint.x)) * rect.width;
                            const y = ((point.y - swPoint.y) / (nePoint.y - swPoint.y)) * rect.height;
                            setTooltipPosition({
                              x: rect.left + x,
                              y: rect.top + y - 50,
                            });
                          }
                        }
                      }
                    }
                  }}
                  onMouseOut={() => {
                    // Only clear if not hovering over polygon
                    if (hoveredZone?.id === zone.id) {
                      setHoveredZone(null);
                      setTooltipPosition(null);
                    }
                  }}
                  label={{
                    text: zone.id.toString(),
                    color: hoveredZone?.id === zone.id ? '#FFFFFF' : (isDarkMode ? '#0A84FF' : '#007AFF'),
                    fontSize: hoveredZone?.id === zone.id ? '22px' : '18px',
                    fontWeight: 'bold',
                  }}
                  options={{
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: hoveredZone?.id === zone.id ? 10 : 8,
                      fillColor: hoveredZone?.id === zone.id ? '#007AFF' : '#FFFFFF',
                      fillOpacity: hoveredZone?.id === zone.id ? 1.0 : 0.8,
                      strokeColor: isDarkMode ? '#0A84FF' : '#007AFF',
                      strokeWeight: hoveredZone?.id === zone.id ? 4 : 3,
                    },
                  }}
                />
              )}
              {isEditing && (
                <div className="editing-indicator">
                  <div className={`editing-badge ${isDarkMode ? 'dark' : ''}`}>
                    <span>Editing Zone {zone.id}</span>
                    <div className="editing-actions">
                      <button
                        className={`editing-save-button ${isDarkMode ? 'dark' : ''}`}
                        onClick={() => handleSaveBoundary(zone.id)}
                        type="button"
                        title="Save changes">
                        ✓ Save
                      </button>
                      <button
                        className={`editing-cancel-button ${isDarkMode ? 'dark' : ''}`}
                        onClick={() => handleCancelBoundaryEdit(zone.id)}
                        type="button"
                        title="Cancel editing">
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </GoogleMap>

      <ProfileSelector onProfileChange={handleProfileChange} />

      <SearchBar
        onSearch={handleSearch}
        onClear={handleClearSearch}
        placeholder="Search zones by ID or name..."
      />

      <DrawingControls
        isDrawing={isDrawing}
        onStartDrawing={handleStartDrawing}
        onCancelDrawing={handleCancelDrawing}
        onClearAll={handleClearAll}
        onExport={handleExport}
        onImport={() => setIsImportModalVisible(true)}
      />

      {historyState && (
        <UndoRedoControls
          canUndo={canUndo(historyState)}
          canRedo={canRedo(historyState)}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      )}

      <ImportModal
        visible={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onImport={handleImport}
        existingZoneCount={zones.length}
      />

      <ZoomControls onFitAll={handleFitAllZones} />

      <ZoneList
        zones={zones}
        onZoneClick={handleZoneClick}
        onZoomToZone={handleZoomToZone}
        onToggleVisibility={handleToggleVisibility}
      />

      <div className="map-style-toggle">
        <button
          className={`map-style-button ${mapStyle === 'light' ? 'active' : ''} ${isDarkMode ? 'dark' : ''}`}
          onClick={() => setMapStyle('light')}
          type="button"
          title="Light Map"
          aria-label="Switch to light map">
          ☀️
        </button>
        <button
          className={`map-style-button ${mapStyle === 'dark' ? 'active' : ''} ${isDarkMode ? 'dark' : ''}`}
          onClick={() => setMapStyle('dark')}
          type="button"
          title="Dark Map"
          aria-label="Switch to dark map">
          🌙
        </button>
      </div>

      {hoveredZone && tooltipPosition && (
        <div
          className={`zone-tooltip ${isDarkMode ? 'dark' : ''}`}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}>
          <div className="zone-tooltip-content">
            <div className="zone-tooltip-name">{hoveredZone.name}</div>
            {hoveredZone.description && (
              <div className="zone-tooltip-description">{hoveredZone.description}</div>
            )}
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="offline-banner">
          <span>No Internet Connection</span>
        </div>
      )}

      <ZoneDetailsModal
        visible={isModalVisible}
        zone={selectedZone}
        onClose={() => {
          setIsModalVisible(false);
          // Stop editing if modal is closed
          if (editingZoneId !== null) {
            setEditingZoneId(null);
          }
        }}
        onDelete={handleDeleteZone}
        onUpdate={handleUpdateZone}
        onEditBoundary={handleEditBoundary}
        onDuplicate={handleDuplicateZone}
        onToggleVisibility={handleToggleVisibility}
      />
    </div>
  );
}
