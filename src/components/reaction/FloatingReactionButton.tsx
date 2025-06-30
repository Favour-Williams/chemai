import React, { useState, useMemo } from 'react';
import { Plus, X, Beaker, Search } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { Link } from 'react-router-dom';

interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  category: string;
  group?: number;
  period: number;
}

const allElements: Element[] = [
  { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, category: 'nonmetal', group: 1, period: 1 },
  { symbol: 'He', name: 'Helium', atomicNumber: 2, category: 'noble-gas', group: 18, period: 1 },
  // ... (all 118 elements)
];

const getCategoryColor = (category: string) => {
  const colors = {
    'alkali-metal': 'bg-red-400',
    'alkaline-earth': 'bg-orange-400',
    'transition-metal': 'bg-yellow-400',
    'post-transition': 'bg-green-400',
    'metalloid': 'bg-teal-400',
    'nonmetal': 'bg-blue-400',
    'halogen': 'bg-purple-400',
    'noble-gas': 'bg-pink-400',
    'lanthanide': 'bg-indigo-400',
    'actinide': 'bg-rose-400'
  };
  return colors[category] || 'bg-gray-400';
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
    const tableElements = Array.from({ length: 10 }, () => Array(18).fill(null));
    
    filteredElements.forEach(element => {
      const { row, col } = getElementPosition(element);
      if (row <= 9 && col <= 18) {
        tableElements[row - 1][col - 1] = element;
      }
    });

    return (
      <div className="grid grid-cols-18 gap-1 text-xs">
        {tableElements.map((row, rowIndex) =>
          row.map((element, colIndex) => {
            if (!element) {
              return <div key={`${rowIndex}-${colIndex}`} className="w-8 h-8" />;
            }
            
            const isSelected = selectedElements.includes(element.symbol);
            const isFiltered = searchTerm && !filteredElements.includes(element);
            
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
                  ${isFiltered ? 'opacity-30' : 'opacity-100'}
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
          })
        )}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded && (
        <div 
          className={`
            absolute bottom-16 right-0 p-4 rounded-lg shadow-lg w-96 max-h-96 overflow-y-auto
            ${isDark ? 'bg-gray-800' : 'bg-white'}
          `}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Periodic Table
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
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
            />
          </div>

          {renderPeriodicTable()}
          
          {selectedElements.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedElements.map(symbol => (
                  <span
                    key={symbol}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                  >
                    {symbol}
                  </span>
                ))}
              </div>
              <Link
                to={`/reaction/new?elements=${selectedElements.join(',')}`}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
              >
                <Beaker className="h-4 w-4" />
                Create Reaction
              </Link>
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          p-4 rounded-full shadow-lg flex items-center justify-center
          ${isDark ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}
          text-white transition-colors relative
        `}
      >
        {isExpanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        {selectedElements.length > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
            {selectedElements.length}
          </div>
        )}
      </button>
    </div>
  );
};

export default FloatingReactionButton;