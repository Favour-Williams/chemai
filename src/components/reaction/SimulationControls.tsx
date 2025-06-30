import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Maximize2, 
  Minimize2,
  ThermometerSun,
  Gauge,
  
  RotateCcw
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface SimulationControlsProps {
  onPlayPause: () => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
  onTemperatureChange: (temp: number) => void;
  onPressureChange: (pressure: number) => void;
  onViewModeChange: (mode: '2D' | '3D' | 'realistic') => void;
  onToggleFullscreen: () => void;
  isPlaying: boolean;
  isFullscreen: boolean;
  progress: number;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  onPlayPause,
  onStop,
  onSpeedChange,
  onTemperatureChange,
  onPressureChange,
  onViewModeChange,
  onToggleFullscreen,
  isPlaying,
  isFullscreen,
  progress
}) => {
  const isDark = useThemeStore((state) => state.isDark);
  const [speed, setSpeed] = useState(1);
  const [temperature, setTemperature] = useState(298); // Kelvin
  const [pressure, setPressure] = useState(1); // atm
  const [viewMode, setViewMode] = useState<'2D' | '3D' | 'realistic'>('3D');

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value);
    setSpeed(newSpeed);
    onSpeedChange(newSpeed);
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTemp = parseFloat(e.target.value);
    setTemperature(newTemp);
    onTemperatureChange(newTemp);
  };

  const handlePressureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPressure = parseFloat(e.target.value);
    setPressure(newPressure);
    onPressureChange(newPressure);
  };

  const handleViewModeChange = (mode: '2D' | '3D' | 'realistic') => {
    setViewMode(mode);
    onViewModeChange(mode);
  };

  return (
    <div className={`
      p-4 rounded-lg shadow-lg
      ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
    `}>
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={onPlayPause}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            `}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
          <button
            onClick={onStop}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            `}
          >
            <Square className="h-6 w-6" />
          </button>
          <button
            onClick={() => onToggleFullscreen()}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            `}
          >
            {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          {(['2D', '3D', 'realistic'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode)}
              className={`
                px-3 py-1 rounded-lg transition-colors
                ${viewMode === mode 
                  ? 'bg-blue-500 text-white' 
                  : isDark 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-100'
                }
              `}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {/* Speed Control */}
        <div className="flex items-center space-x-4">
          <RotateCcw className="h-5 w-5 text-gray-400" />
          <div className="flex-1">
            <label className="block text-sm mb-1">Speed ({speed}x)</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={speed}
              onChange={handleSpeedChange}
              className="w-full"
            />
          </div>
        </div>

        {/* Temperature Control */}
        <div className="flex items-center space-x-4">
          <ThermometerSun className="h-5 w-5 text-gray-400" />
          <div className="flex-1">
            <label className="block text-sm mb-1">Temperature ({temperature}K)</label>
            <input
              type="range"
              min="273"
              max="1000"
              value={temperature}
              onChange={handleTemperatureChange}
              className="w-full"
            />
          </div>
        </div>

        {/* Pressure Control */}
        <div className="flex items-center space-x-4">
          <Gauge className="h-5 w-5 text-gray-400" />
          <div className="flex-1">
            <label className="block text-sm mb-1">Pressure ({pressure} atm)</label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={pressure}
              onChange={handlePressureChange}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationControls;