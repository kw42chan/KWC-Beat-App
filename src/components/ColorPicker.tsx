import {ChangeEvent} from 'react';
import {useTheme} from '../context/ThemeContext';
import './ColorPicker.css';

interface ColorPickerProps {
  selectedColor?: string;
  onColorSelect: (color: string) => void;
}

const PRESET_COLORS = [
  {name: 'Red', value: 'rgba(255, 99, 132, 0.5)'},
  {name: 'Blue', value: 'rgba(54, 162, 235, 0.5)'},
  {name: 'Green', value: 'rgba(99, 255, 132, 0.5)'},
  {name: 'Yellow', value: 'rgba(255, 206, 86, 0.5)'},
  {name: 'Purple', value: 'rgba(153, 102, 255, 0.5)'},
  {name: 'Orange', value: 'rgba(255, 159, 64, 0.5)'},
  {name: 'Teal', value: 'rgba(75, 192, 192, 0.5)'},
  {name: 'Pink', value: 'rgba(255, 99, 255, 0.5)'},
  {name: 'Cyan', value: 'rgba(54, 162, 235, 0.5)'},
  {name: 'Lime', value: 'rgba(150, 255, 180, 0.5)'},
  {name: 'Indigo', value: 'rgba(83, 102, 255, 0.5)'},
  {name: 'Grey', value: 'rgba(199, 199, 199, 0.5)'},
];

const DARK_PRESET_COLORS = [
  {name: 'Red', value: 'rgba(255, 150, 180, 0.6)'},
  {name: 'Blue', value: 'rgba(100, 200, 255, 0.6)'},
  {name: 'Green', value: 'rgba(150, 255, 180, 0.6)'},
  {name: 'Yellow', value: 'rgba(255, 230, 150, 0.6)'},
  {name: 'Purple', value: 'rgba(200, 150, 255, 0.6)'},
  {name: 'Orange', value: 'rgba(255, 200, 120, 0.6)'},
  {name: 'Teal', value: 'rgba(120, 230, 230, 0.6)'},
  {name: 'Pink', value: 'rgba(255, 150, 255, 0.6)'},
  {name: 'Cyan', value: 'rgba(100, 200, 255, 0.6)'},
  {name: 'Lime', value: 'rgba(150, 255, 180, 0.6)'},
  {name: 'Indigo', value: 'rgba(150, 170, 255, 0.6)'},
  {name: 'Grey', value: 'rgba(230, 230, 230, 0.6)'},
];

export function ColorPicker({selectedColor, onColorSelect}: ColorPickerProps) {
  const {isDarkMode} = useTheme();
  const colors = isDarkMode ? DARK_PRESET_COLORS : PRESET_COLORS;

  // Check if selected color matches any preset
  const isPresetColor = colors.some(color => color.value === selectedColor);
  const isCustomColor = selectedColor && !isPresetColor;

  // Extract base color from rgba to show in color input
  const getBaseColor = (rgba: string | undefined): string => {
    if (!rgba) return '#007aff';
    
    // Extract RGB values from rgba string
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match && match.length >= 4) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      // Convert RGB to hex
      const toHex = (n: number) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    return '#007aff';
  };

  const handleCustomColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    // Convert hex to rgba
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const opacity = isDarkMode ? 0.6 : 0.5;
    onColorSelect(`rgba(${r}, ${g}, ${b}, ${opacity})`);
  };

  return (
    <div className="color-picker">
      <div className="color-picker-presets">
        {colors.map((color, index) => (
          <button
            key={index}
            className={`color-picker-swatch ${
              selectedColor === color.value ? 'selected' : ''
            } ${isDarkMode ? 'dark' : ''}`}
            style={{backgroundColor: color.value}}
            onClick={() => onColorSelect(color.value)}
            type="button"
            title={color.name}
            aria-label={`Select ${color.name} color`}
          />
        ))}
      </div>
      <div className="color-picker-custom">
        <label className={`color-picker-label ${isDarkMode ? 'dark' : ''}`}>
          Custom Color:
          <input
            type="color"
            className={`color-picker-input ${isCustomColor ? 'custom-selected' : ''} ${isDarkMode ? 'dark' : ''}`}
            value={getBaseColor(selectedColor)}
            onChange={handleCustomColorChange}
          />
          {isCustomColor && (
            <span className="color-picker-custom-indicator">✓</span>
          )}
        </label>
      </div>
    </div>
  );
}
