import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { Link } from 'react-router-dom';

interface SelectedElementsSidebarProps {
  elements: string[];
  onRemoveElement: (symbol: string) => void;
}

const SelectedElementsSidebar: React.FC<SelectedElementsSidebarProps> = ({
  elements,
  onRemoveElement
}) => {
  const isDark = useThemeStore((state) => state.isDark);

  if (elements.length === 0) return null;

  return (
    <div className={`
      fixed right-0 top-1/2 transform -translate-y-1/2 p-4 rounded-l-lg shadow-lg z-40
      ${isDark ? 'bg-gray-800' : 'bg-white'}
    `}>
      <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        Selected Elements
      </h3>

      <div className="space-y-2 mb-4">
        {elements.map(symbol => (
          <div
            key={symbol}
            className={`
              flex items-center justify-between gap-2 p-2 rounded
              ${isDark ? 'bg-gray-700' : 'bg-gray-100'}
            `}
          >
            <span className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {symbol}
            </span>
            <button
              onClick={() => onRemoveElement(symbol)}
              className="p-1 rounded-full hover:bg-gray-600/50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <Link
        to={`/reaction/new?elements=${elements.join(',')}`}
        className={`
          w-full py-2 px-4 rounded flex items-center justify-center gap-2
          ${isDark 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : 'bg-blue-600 hover:bg-blue-700'
          }
          text-white transition-colors
        `}
      >
        <span>Create</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

export default SelectedElementsSidebar;