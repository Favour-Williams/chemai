import React, { useState, useMemo } from 'react';
import { X, Beaker, Search } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { Link } from 'react-router-dom';

// FIX 1: Define the single source of truth for colors and categories.
const categoryColors = {
  'alkali-metal': 'bg-red-400',
  'alkaline-earth': 'bg-orange-400',
  'transition-metal': 'bg-yellow-400',
  'post-transition': 'bg-green-400',
  'metalloid': 'bg-teal-400',
  'nonmetal': 'bg-blue-400',
  'halogen': 'bg-purple-400',
  'noble-gas': 'bg-pink-400',
  'lanthanide': 'bg-indigo-400',
  'actinide': 'bg-rose-400',
};

// FIX 2: Create a specific type from the keys of the `categoryColors` object.
type ElementCategory = keyof typeof categoryColors;

interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  // FIX 3: Use the specific `ElementCategory` type instead of a generic `string`.
  category: ElementCategory;
  group?: number;
  period: number;
}

const allElements: Element[] = [
  // This data now benefits from type-checking. If you misspelled a category,
  // TypeScript would give you an error here!
  { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, category: 'nonmetal', group: 1, period: 1 },
  { symbol: 'He', name: 'Helium', atomicNumber: 2, category: 'noble-gas', group: 18, period: 1 },
  // ... (the rest of your elements)
];

// FIX 4: Update the function to accept the specific type.
const getCategoryColor = (category: ElementCategory) => {
  // The error is now gone because TypeScript knows `category` will always be a valid key.
  return categoryColors[category] || 'bg-gray-400';
};

const FloatingReactionButton: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const isDark = useThemeStore((state) => state.isDark);

  const filteredElements = useMemo(() => {
    if (!searchTerm) return allElements;
    return allElements.filter(element => 
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.atomicNumber.toString().includes(searchTerm)
    );
  }, [searchTerm]);

  const toggleElement = (symbol: string) => {
    setSelectedElements(prev => 
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const getElementPosition = (element: Element) => {
    if (element.category === 'lanthanide') {
      return { row: 8, col: element.atomicNumber - 54 };
    }
    if (element.category === 'actinide') {
      return { row: 9, col: element.atomicNumber - 86 };
    }
    return { row: element.period, col: element.group || 1 };
  };

  const renderPeriodicTable = () => {
    const tableElements: (Element | null)[][] = Array.from({ length: 10 }, () => Array(18).fill(null));
    
    // We use allElements to position everything, so they don't disappear on search
    allElements.forEach(element => {
      const { row, col } = getElementPosition(element);
      if (row <= 9 && col <= 18) {
        tableElements[row - 1][col - 1] = element;
      }
    });

    return (
      <div className="grid grid-cols-18 gap-1 text-xs" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}>
        {tableElements.flat().map((element, index) => {
          if (!element) {
            return <div key={`empty-${index}`} className="w-8 h-8" />;
          }
          
          const isSelected = selectedElements.includes(element.symbol);
          const isFilteredOut = searchTerm && !filteredElements.includes(element);
          
          return (
            <button
              key={element.symbol}
              onClick={() => toggleElement(element.symbol)}
              className={`
                w-8 h-8 rounded text-center transition-all duration-200 border
                ${isSelected 
                  ? 'ring-2 ring-blue-500 scale-110' 
                  : 'hover:scale-105'
                }
                ${isFilteredOut ? 'opacity-30' : 'opacity-100'}
                ${getCategoryColor(element.category)}
                text-black font-bold text-xs
                flex flex-col items-center justify-center
              `}
              title={`${element.name} (${element.atomicNumber})`}
            >
              <div className="text-xs leading-none">{element.atomicNumber}</div>
              <div className="text-sm font-bold leading-none">{element.symbol}</div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded && (
        <div 
          className={`
            absolute bottom-20 right-0 p-4 rounded-lg shadow-xl w-[350px]
            ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
            transition-all duration-300 ease-in-out transform origin-bottom-right
            ${isExpanded ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}
          `}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">
              Select Elements
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className={`p-1 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search elements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 rounded-lg border
                ${isDark 
                  ? 'bg-gray-700 border-gray-600 placeholder-gray-400' 
                  : 'bg-white border-gray-300 placeholder-gray-500'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
            />
          </div>

          <div className="overflow-x-auto pb-2">
            {renderPeriodicTable()}
          </div>
          
          {selectedElements.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-1 mb-2 text-left">
                {selectedElements.map(symbol => (
                  <span
                    key={symbol}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold"
                  >
                    {symbol}
                  </span>
                ))}
              </div>
              <Link
                to={`/reaction-builder?elements=${selectedElements.join(',')}`}
                onClick={() => setIsExpanded(false)}
                className="w-full mt-2 py-2 px-4 bg-green-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
              >
                <Beaker className="h-4 w-4" />
                Build Reaction ({selectedElements.length})
              </Link>
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? "Close" : "Open Periodic Table"}
        className={`
          p-4 rounded-full shadow-lg flex items-center justify-center
          ${isDark ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}
          text-white transition-all duration-300 relative
        `}
      >
        <span className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
          {isExpanded ? <X className="h-6 w-6" /> : <Beaker className="h-6 w-6" />}
        </span>
        {selectedElements.length > 0 && !isExpanded && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
            {selectedElements.length}
          </div>
        )}
      </button>
    </div>
  );
};

export default FloatingReactionButton;