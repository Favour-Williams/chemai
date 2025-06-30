import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
  closestCenter
} from '@dnd-kit/core';
import { 
  Search, 
  ArrowRight, 
  Save,  
  History, 
  Beaker,
  Zap,
  AlertTriangle,
  Download,
  Share2,
  RotateCcw,
  Filter,
  X
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { chatService } from '../services/chatService';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';

interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  category: string;
  color: string;
  atomicMass: number;
}

interface ReactionElement {
  id: string;
  symbol: string;
  name: string;
  coefficient: number;
  subscript: number;
  position: 'front' | 'back';
}

interface ReactionEquation {
  reactants: ReactionElement[];
  products: ReactionElement[];
}

interface SavedReaction {
  id: string;
  name: string;
  equation: string;
  reactants: string[];
  products: string[];
  result?: string;
  energyChange?: number;
  reactionType?: string;
  safetyWarnings?: string[];
  createdAt: string;
}

const ELEMENTS_DATA: Element[] = [
  { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, category: 'nonmetal', color: '#ffffff', atomicMass: 1.008 },
  { symbol: 'He', name: 'Helium', atomicNumber: 2, category: 'noble-gas', color: '#d9ffff', atomicMass: 4.003 },
  { symbol: 'Li', name: 'Lithium', atomicNumber: 3, category: 'alkali-metal', color: '#cc80ff', atomicMass: 6.94 },
  { symbol: 'Be', name: 'Beryllium', atomicNumber: 4, category: 'alkaline-earth', color: '#c2ff00', atomicMass: 9.012 },
  { symbol: 'B', name: 'Boron', atomicNumber: 5, category: 'metalloid', color: '#ffb5b5', atomicMass: 10.81 },
  { symbol: 'C', name: 'Carbon', atomicNumber: 6, category: 'nonmetal', color: '#909090', atomicMass: 12.011 },
  { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, category: 'nonmetal', color: '#3050f8', atomicMass: 14.007 },
  { symbol: 'O', name: 'Oxygen', atomicNumber: 8, category: 'nonmetal', color: '#ff0d0d', atomicMass: 15.999 },
  { symbol: 'F', name: 'Fluorine', atomicNumber: 9, category: 'halogen', color: '#90e050', atomicMass: 18.998 },
  { symbol: 'Ne', name: 'Neon', atomicNumber: 10, category: 'noble-gas', color: '#b3e3f5', atomicMass: 20.180 },
  { symbol: 'Na', name: 'Sodium', atomicNumber: 11, category: 'alkali-metal', color: '#ab5cf2', atomicMass: 22.990 },
  { symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, category: 'alkaline-earth', color: '#8aff00', atomicMass: 24.305 },
  { symbol: 'Al', name: 'Aluminum', atomicNumber: 13, category: 'post-transition', color: '#bfa6a6', atomicMass: 26.982 },
  { symbol: 'Si', name: 'Silicon', atomicNumber: 14, category: 'metalloid', color: '#f0c8a0', atomicMass: 28.085 },
  { symbol: 'P', name: 'Phosphorus', atomicNumber: 15, category: 'nonmetal', color: '#ff8000', atomicMass: 30.974 },
  { symbol: 'S', name: 'Sulfur', atomicNumber: 16, category: 'nonmetal', color: '#ffff30', atomicMass: 32.06 },
  { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, category: 'halogen', color: '#1ff01f', atomicMass: 35.45 },
  { symbol: 'Ar', name: 'Argon', atomicNumber: 18, category: 'noble-gas', color: '#80d1e3', atomicMass: 39.948 },
  { symbol: 'K', name: 'Potassium', atomicNumber: 19, category: 'alkali-metal', color: '#8f40d4', atomicMass: 39.098 },
  { symbol: 'Ca', name: 'Calcium', atomicNumber: 20, category: 'alkaline-earth', color: '#3dff00', atomicMass: 40.078 },
  { symbol: 'Sc', name: 'Scandium', atomicNumber: 21, category: 'transition-metal', color: '#e06633', atomicMass: 44.956 },
  { symbol: 'Ti', name: 'Titanium', atomicNumber: 22, category: 'transition-metal', color: '#e06633', atomicMass: 47.867 },
  { symbol: 'V', name: 'Vanadium', atomicNumber: 23, category: 'transition-metal', color: '#e06633', atomicMass: 50.942 },
  { symbol: 'Cr', name: 'Chromium', atomicNumber: 24, category: 'transition-metal', color: '#e06633', atomicMass: 51.996 },
  { symbol: 'Mn', name: 'Manganese', atomicNumber: 25, category: 'transition-metal', color: '#e06633', atomicMass: 54.938 },
  { symbol: 'Fe', name: 'Iron', atomicNumber: 26, category: 'transition-metal', color: '#e06633', atomicMass: 55.845 },
  { symbol: 'Co', name: 'Cobalt', atomicNumber: 27, category: 'transition-metal', color: '#e06633', atomicMass: 58.933 },
  { symbol: 'Ni', name: 'Nickel', atomicNumber: 28, category: 'transition-metal', color: '#e06633', atomicMass: 58.693 },
  { symbol: 'Cu', name: 'Copper', atomicNumber: 29, category: 'transition-metal', color: '#c88033', atomicMass: 63.546 },
  { symbol: 'Zn', name: 'Zinc', atomicNumber: 30, category: 'transition-metal', color: '#7d80b0', atomicMass: 65.38 },
  { symbol: 'Ga', name: 'Gallium', atomicNumber: 31, category: 'post-transition', color: '#bfa6a6', atomicMass: 69.723 },
  { symbol: 'Ge', name: 'Germanium', atomicNumber: 32, category: 'metalloid', color: '#ffb5b5', atomicMass: 72.630 },
  { symbol: 'As', name: 'Arsenic', atomicNumber: 33, category: 'metalloid', color: '#ffb5b5', atomicMass: 74.922 },
  { symbol: 'Se', name: 'Selenium', atomicNumber: 34, category: 'nonmetal', color: '#909090', atomicMass: 78.971 },
  { symbol: 'Br', name: 'Bromine', atomicNumber: 35, category: 'halogen', color: '#1ff01f', atomicMass: 79.904 },
  { symbol: 'Kr', name: 'Krypton', atomicNumber: 36, category: 'noble-gas', color: '#b3e3f5', atomicMass: 83.798 },
  { symbol: 'Rb', name: 'Rubidium', atomicNumber: 37, category: 'alkali-metal', color: '#ab5cf2', atomicMass: 85.468 },
  { symbol: 'Sr', name: 'Strontium', atomicNumber: 38, category: 'alkaline-earth', color: '#8aff00', atomicMass: 87.62 },
  { symbol: 'Y', name: 'Yttrium', atomicNumber: 39, category: 'transition-metal', color: '#e06633', atomicMass: 88.906 },
  { symbol: 'Zr', name: 'Zirconium', atomicNumber: 40, category: 'transition-metal', color: '#e06633', atomicMass: 91.224 },
  { symbol: 'Nb', name: 'Niobium', atomicNumber: 41, category: 'transition-metal', color: '#e06633', atomicMass: 92.906 },
  { symbol: 'Mo', name: 'Molybdenum', atomicNumber: 42, category: 'transition-metal', color: '#e06633', atomicMass: 95.95 },
  { symbol: 'Tc', name: 'Technetium', atomicNumber: 43, category: 'transition-metal', color: '#e06633', atomicMass: 98 },
  { symbol: 'Ru', name: 'Ruthenium', atomicNumber: 44, category: 'transition-metal', color: '#e06633', atomicMass: 101.07 },
  { symbol: 'Rh', name: 'Rhodium', atomicNumber: 45, category: 'transition-metal', color: '#e06633', atomicMass: 102.91 },
  { symbol: 'Pd', name: 'Palladium', atomicNumber: 46, category: 'transition-metal', color: '#e06633', atomicMass: 106.42 },
  { symbol: 'Ag', name: 'Silver', atomicNumber: 47, category: 'transition-metal', color: '#c0c0c0', atomicMass: 107.868 },
  { symbol: 'Cd', name: 'Cadmium', atomicNumber: 48, category: 'transition-metal', color: '#e06633', atomicMass: 112.41 },
  { symbol: 'In', name: 'Indium', atomicNumber: 49, category: 'post-transition', color: '#bfa6a6', atomicMass: 114.82 },
  { symbol: 'Sn', name: 'Tin', atomicNumber: 50, category: 'post-transition', color: '#bfa6a6', atomicMass: 118.71 },
  { symbol: 'Sb', name: 'Antimony', atomicNumber: 51, category: 'metalloid', color: '#ffb5b5', atomicMass: 121.76 },
  { symbol: 'Te', name: 'Tellurium', atomicNumber: 52, category: 'metalloid', color: '#ffb5b5', atomicMass: 127.60 },
  { symbol: 'I', name: 'Iodine', atomicNumber: 53, category: 'halogen', color: '#1ff01f', atomicMass: 126.90 },
  { symbol: 'Xe', name: 'Xenon', atomicNumber: 54, category: 'noble-gas', color: '#b3e3f5', atomicMass: 131.29 },
  { symbol: 'Cs', name: 'Cesium', atomicNumber: 55, category: 'alkali-metal', color: '#ab5cf2', atomicMass: 132.91 },
  { symbol: 'Ba', name: 'Barium', atomicNumber: 56, category: 'alkaline-earth', color: '#8aff00', atomicMass: 137.33 },
  { symbol: 'La', name: 'Lanthanum', atomicNumber: 57, category: 'lanthanide', color: '#ffbfff', atomicMass: 138.91 },
  { symbol: 'Ce', name: 'Cerium', atomicNumber: 58, category: 'lanthanide', color: '#ffbfff', atomicMass: 140.12 },
  { symbol: 'Pr', name: 'Praseodymium', atomicNumber: 59, category: 'lanthanide', color: '#ffbfff', atomicMass: 140.91 },
  { symbol: 'Nd', name: 'Neodymium', atomicNumber: 60, category: 'lanthanide', color: '#ffbfff', atomicMass: 144.24 },
  { symbol: 'Pm', name: 'Promethium', atomicNumber: 61, category: 'lanthanide', color: '#ffbfff', atomicMass: 145 },
  { symbol: 'Sm', name: 'Samarium', atomicNumber: 62, category: 'lanthanide', color: '#ffbfff', atomicMass: 150.36 },
  { symbol: 'Eu', name: 'Europium', atomicNumber: 63, category: 'lanthanide', color: '#ffbfff', atomicMass: 151.96 },
  { symbol: 'Gd', name: 'Gadolinium', atomicNumber: 64, category: 'lanthanide', color: '#ffbfff', atomicMass: 157.25 },
  { symbol: 'Tb', name: 'Terbium', atomicNumber: 65, category: 'lanthanide', color: '#ffbfff', atomicMass: 158.93 },
  { symbol: 'Dy', name: 'Dysprosium', atomicNumber: 66, category: 'lanthanide', color: '#ffbfff', atomicMass: 162.50 },
  { symbol: 'Ho', name: 'Holmium', atomicNumber: 67, category: 'lanthanide', color: '#ffbfff', atomicMass: 164.93 },
  { symbol: 'Er', name: 'Erbium', atomicNumber: 68, category: 'lanthanide', color: '#ffbfff', atomicMass: 167.26 },
  { symbol: 'Tm', name: 'Thulium', atomicNumber: 69, category: 'lanthanide', color: '#ffbfff', atomicMass: 168.93 },
  { symbol: 'Yb', name: 'Ytterbium', atomicNumber: 70, category: 'lanthanide', color: '#ffbfff', atomicMass: 173.05 },
  { symbol: 'Lu', name: 'Lutetium', atomicNumber: 71, category: 'lanthanide', color: '#ffbfff', atomicMass: 174.97 },
  { symbol: 'Hf', name: 'Hafnium', atomicNumber: 72, category: 'transition-metal', color: '#e06633', atomicMass: 178.49 },
  { symbol: 'Ta', name: 'Tantalum', atomicNumber: 73, category: 'transition-metal', color: '#e06633', atomicMass: 180.95 },
  { symbol: 'W', name: 'Tungsten', atomicNumber: 74, category: 'transition-metal', color: '#e06633', atomicMass: 183.84 },
  { symbol: 'Re', name: 'Rhenium', atomicNumber: 75, category: 'transition-metal', color: '#e06633', atomicMass: 186.21 },
  { symbol: 'Os', name: 'Osmium', atomicNumber: 76, category: 'transition-metal', color: '#e06633', atomicMass: 190.23 },
  { symbol: 'Ir', name: 'Iridium', atomicNumber: 77, category: 'transition-metal', color: '#e06633', atomicMass: 192.22 },
  { symbol: 'Pt', name: 'Platinum', atomicNumber: 78, category: 'transition-metal', color: '#e06633', atomicMass: 195.08 },
  { symbol: 'Au', name: 'Gold', atomicNumber: 79, category: 'transition-metal', color: '#ffd700', atomicMass: 196.967 },
  { symbol: 'Hg', name: 'Mercury', atomicNumber: 80, category: 'transition-metal', color: '#e06633', atomicMass: 200.59 },
  { symbol: 'Tl', name: 'Thallium', atomicNumber: 81, category: 'post-transition', color: '#bfa6a6', atomicMass: 204.38 },
  { symbol: 'Pb', name: 'Lead', atomicNumber: 82, category: 'post-transition', color: '#bfa6a6', atomicMass: 207.2 },
  { symbol: 'Bi', name: 'Bismuth', atomicNumber: 83, category: 'post-transition', color: '#bfa6a6', atomicMass: 208.98 },
  { symbol: 'Po', name: 'Polonium', atomicNumber: 84, category: 'post-transition', color: '#bfa6a6', atomicMass: 209 },
  { symbol: 'At', name: 'Astatine', atomicNumber: 85, category: 'halogen', color: '#1ff01f', atomicMass: 210 },
  { symbol: 'Rn', name: 'Radon', atomicNumber: 86, category: 'noble-gas', color: '#b3e3f5', atomicMass: 222 },
  { symbol: 'Fr', name: 'Francium', atomicNumber: 87, category: 'alkali-metal', color: '#ab5cf2', atomicMass: 223 },
  { symbol: 'Ra', name: 'Radium', atomicNumber: 88, category: 'alkaline-earth', color: '#8aff00', atomicMass: 226 },
  { symbol: 'Ac', name: 'Actinium', atomicNumber: 89, category: 'actinide', color: '#ff99cc', atomicMass: 227 },
  { symbol: 'Th', name: 'Thorium', atomicNumber: 90, category: 'actinide', color: '#ff99cc', atomicMass: 232.04 },
  { symbol: 'Pa', name: 'Protactinium', atomicNumber: 91, category: 'actinide', color: '#ff99cc', atomicMass: 231.04 },
  { symbol: 'U', name: 'Uranium', atomicNumber: 92, category: 'actinide', color: '#ff99cc', atomicMass: 238.03 },
  { symbol: 'Np', name: 'Neptunium', atomicNumber: 93, category: 'actinide', color: '#ff99cc', atomicMass: 237 },
  { symbol: 'Pu', name: 'Plutonium', atomicNumber: 94, category: 'actinide', color: '#ff99cc', atomicMass: 244 },
  { symbol: 'Am', name: 'Americium', atomicNumber: 95, category: 'actinide', color: '#ff99cc', atomicMass: 243 },
  { symbol: 'Cm', name: 'Curium', atomicNumber: 96, category: 'actinide', color: '#ff99cc', atomicMass: 247 },
  { symbol: 'Bk', name: 'Berkelium', atomicNumber: 97, category: 'actinide', color: '#ff99cc', atomicMass: 247 },
  { symbol: 'Cf', name: 'Californium', atomicNumber: 98, category: 'actinide', color: '#ff99cc', atomicMass: 251 },
  { symbol: 'Es', name: 'Einsteinium', atomicNumber: 99, category: 'actinide', color: '#ff99cc', atomicMass: 252 },
  { symbol: 'Fm', name: 'Fermium', atomicNumber: 100, category: 'actinide', color: '#ff99cc', atomicMass: 257 },
  { symbol: 'Md', name: 'Mendelevium', atomicNumber: 101, category: 'actinide', color: '#ff99cc', atomicMass: 258 },
  { symbol: 'No', name: 'Nobelium', atomicNumber: 102, category: 'actinide', color: '#ff99cc', atomicMass: 259 },
  { symbol: 'Lr', name: 'Lawrencium', atomicNumber: 103, category: 'actinide', color: '#ff99cc', atomicMass: 262 },
  { symbol: 'Rf', name: 'Rutherfordium', atomicNumber: 104, category: 'transition-metal', color: '#e06633', atomicMass: 267 },
  { symbol: 'Db', name: 'Dubnium', atomicNumber: 105, category: 'transition-metal', color: '#e06633', atomicMass: 268 },
  { symbol: 'Sg', name: 'Seaborgium', atomicNumber: 106, category: 'transition-metal', color: '#e06633', atomicMass: 269 },
  { symbol: 'Bh', name: 'Bohrium', atomicNumber: 107, category: 'transition-metal', color: '#e06633', atomicMass: 270 },
  { symbol: 'Hs', name: 'Hassium', atomicNumber: 108, category: 'transition-metal', color: '#e06633', atomicMass: 269 },
  { symbol: 'Mt', name: 'Meitnerium', atomicNumber: 109, category: 'transition-metal', color: '#e06633', atomicMass: 278 },
  { symbol: 'Ds', name: 'Darmstadtium', atomicNumber: 110, category: 'transition-metal', color: '#e06633', atomicMass: 281 },
  { symbol: 'Rg', name: 'Roentgenium', atomicNumber: 111, category: 'transition-metal', color: '#e06633', atomicMass: 281 },
  { symbol: 'Cn', name: 'Copernicium', atomicNumber: 112, category: 'transition-metal', color: '#e06633', atomicMass: 285 },
  { symbol: 'Nh', name: 'Nihonium', atomicNumber: 113, category: 'post-transition', color: '#bfa6a6', atomicMass: 286 },
  { symbol: 'Fl', name: 'Flerovium', atomicNumber: 114, category: 'post-transition', color: '#bfa6a6', atomicMass: 289 },
  { symbol: 'Mc', name: 'Moscovium', atomicNumber: 115, category: 'post-transition', color: '#bfa6a6', atomicMass: 289 },
  { symbol: 'Lv', name: 'Livermorium', atomicNumber: 116, category: 'post-transition', color: '#bfa6a6', atomicMass: 293 },
  { symbol: 'Ts', name: 'Tennessine', atomicNumber: 117, category: 'halogen', color: '#1ff01f', atomicMass: 294 },
  { symbol: 'Og', name: 'Oganesson', atomicNumber: 118, category: 'noble-gas', color: '#b3e3f5', atomicMass: 294 }
];

const CATEGORIES = [
  'all',
  'alkali-metal',
  'alkaline-earth',
  'transition-metal',
  'post-transition',
  'metalloid',
  'nonmetal',
  'halogen',
  'noble-gas'
];

const DraggableElement: React.FC<{ element: Element }> = ({ element }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element.symbol,
    data: element,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isDark = useThemeStore((state) => state.isDark);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        cursor-move select-none p-3 rounded-lg text-center transition-all duration-200 border-2
        ${isDragging ? 'opacity-50 scale-110 z-50' : 'hover:scale-105'}
        ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}
        shadow-md hover:shadow-lg
      `}
      style={{ 
        ...style,
        backgroundColor: isDragging ? element.color : undefined,
        borderColor: element.color,
      }}
    >
      <div className="text-lg font-bold">{element.symbol}</div>
      <div className="text-xs opacity-70">{element.atomicNumber}</div>
      <div className="text-xs font-medium truncate">{element.name}</div>
      <div className="text-xs opacity-60">{element.atomicMass}</div>
    </div>
  );
};

const ReactionElementComponent: React.FC<{
  element: ReactionElement;
  onUpdate: (updates: Partial<ReactionElement>) => void;
  onRemove: () => void;
}> = ({ element, onUpdate, onRemove }) => {
  const isDark = useThemeStore((state) => state.isDark);
  const [showControls, setShowControls] = useState(false);

  return (
    <div 
      className={`
        relative p-3 rounded-lg border-2 transition-all duration-200 group
        ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
        hover:shadow-md
      `}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Element Display */}
      <div className="flex items-center space-x-2">
        {/* Coefficient Input */}
        <div className="flex items-center">
          <input
            type="number"
            min="1"
            max="99"
            value={element.coefficient}
            onChange={(e) => onUpdate({ coefficient: parseInt(e.target.value) || 1 })}
            className={`
              w-12 h-8 text-center rounded border
              ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
            `}
          />
        </div>

        {/* Element Symbol */}
        <div className="text-xl font-bold text-blue-500">{element.symbol}</div>

        {/* Subscript Input */}
        <div className="flex items-center">
          <input
            type="number"
            min="1"
            max="99"
            value={element.subscript}
            onChange={(e) => onUpdate({ subscript: parseInt(e.target.value) || 1 })}
            className={`
              w-12 h-6 text-center text-sm rounded border
              ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
            `}
          />
        </div>

        {/* Position Toggle */}
        <button
          onClick={() => onUpdate({ position: element.position === 'front' ? 'back' : 'front' })}
          className={`
            px-2 py-1 text-xs rounded transition-colors
            ${element.position === 'front' 
              ? 'bg-blue-500 text-white' 
              : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
            }
          `}
          title={`Number position: ${element.position}`}
        >
          {element.position === 'front' ? 'Pre' : 'Sub'}
        </button>
      </div>

      {/* Element Name */}
      <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {element.name}
      </div>

      {/* Formula Preview */}
      <div className={`text-sm mt-1 font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {element.position === 'front' 
          ? `${element.coefficient > 1 ? element.coefficient : ''}${element.symbol}${element.subscript > 1 ? element.subscript : ''}`
          : `${element.coefficient > 1 ? element.coefficient : ''}${element.symbol}${element.subscript > 1 ? `₂` : ''}`
        }
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute -top-2 -right-2 flex space-x-1">
          <button
            onClick={onRemove}
            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Remove element"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

const DroppableZone: React.FC<{
  id: string;
  title: string;
  elements: ReactionElement[];
  onUpdateElement: (elementId: string, updates: Partial<ReactionElement>) => void;
  onRemoveElement: (elementId: string) => void;
}> = ({ id, title, elements, onUpdateElement, onRemoveElement }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-32 p-4 rounded-lg border-2 border-dashed transition-all duration-200
        ${isOver 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : isDark 
            ? 'border-gray-600 bg-gray-800/50' 
            : 'border-gray-300 bg-gray-50'
        }
      `}
    >
      <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      
      {elements.length === 0 ? (
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Beaker className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Drag elements here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {elements.map((element) => (
            <ReactionElementComponent
              key={element.id}
              element={element}
              onUpdate={(updates) => onUpdateElement(element.id, updates)}
              onRemove={() => onRemoveElement(element.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PeriodicTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [reaction, setReaction] = useState<ReactionEquation>({ reactants: [], products: [] });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reactionResult, setReactionResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedReactions, setSavedReactions] = useState<SavedReaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [reactionName, setReactionName] = useState('');
  
  const isDark = useThemeStore((state) => state.isDark);
  const { user } = useAuthStore();
  const { success, error, info } = useToast();

  // Filter elements based on search and category
  const filteredElements = ELEMENTS_DATA.filter(element => {
    const matchesSearch = element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         element.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         element.atomicNumber.toString().includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || element.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Load saved reactions on component mount
  useEffect(() => {
    if (user) {
      loadSavedReactions();
    }
  }, [user]);

  const loadSavedReactions = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('reactions')
        .select('*')
        .eq('created_by', user?.id) // Use user ID instead of email
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedReactions: SavedReaction[] = (data || []).map(reaction => ({
        id: reaction.id,
        name: reaction.name,
        equation: reaction.equation,
        reactants: reaction.reactants,
        products: reaction.products,
        result: reaction.description,
        energyChange: reaction.energy_change,
        reactionType: reaction.reaction_type,
        safetyWarnings: reaction.safety_warnings,
        createdAt: reaction.created_at,
      }));

      setSavedReactions(formattedReactions);
    } catch (err) {
      console.error('Error loading saved reactions:', err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const element = ELEMENTS_DATA.find(el => el.symbol === active.id);
    if (!element) return;

    const newElement: ReactionElement = {
      id: `${element.symbol}-${Date.now()}`,
      symbol: element.symbol,
      name: element.name,
      coefficient: 1,
      subscript: 1,
      position: 'front',
    };

    if (over.id === 'reactants') {
      setReaction(prev => ({
        ...prev,
        reactants: [...prev.reactants, newElement]
      }));
    } else if (over.id === 'products') {
      setReaction(prev => ({
        ...prev,
        products: [...prev.products, newElement]
      }));
    }
  };

  const updateReactionElement = (
    type: 'reactants' | 'products',
    elementId: string,
    updates: Partial<ReactionElement>
  ) => {
    setReaction(prev => ({
      ...prev,
      [type]: prev[type].map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      )
    }));
  };

  const removeReactionElement = (type: 'reactants' | 'products', elementId: string) => {
    setReaction(prev => ({
      ...prev,
      [type]: prev[type].filter(el => el.id !== elementId)
    }));
  };

  const formatEquation = () => {
    const formatSide = (elements: ReactionElement[]) => {
      return elements.map(el => {
        const coeff = el.coefficient > 1 ? el.coefficient : '';
        const sub = el.subscript > 1 ? (el.position === 'back' ? `₂` : el.subscript) : '';
        return el.position === 'front' 
          ? `${coeff}${el.symbol}${sub}`
          : `${coeff}${el.symbol}${sub}`;
      }).join(' + ');
    };

    const reactantsStr = formatSide(reaction.reactants);
    const productsStr = formatSide(reaction.products);
    
    return reactantsStr && productsStr ? `${reactantsStr} → ${productsStr}` : '';
  };

  const analyzeReaction = async () => {
    if (reaction.reactants.length === 0 || reaction.products.length === 0) {
      error('Incomplete Reaction', 'Please add both reactants and products');
      return;
    }

    setIsAnalyzing(true);
    setReactionResult(null);

    try {
      const equation = formatEquation();
      const prompt = `Analyze this chemical reaction: ${equation}

Please provide:
1. Is this equation balanced? If not, provide the balanced equation.
2. What type of reaction is this? (synthesis, decomposition, single replacement, double replacement, combustion, etc.)
3. What is the approximate energy change (endothermic/exothermic)?
4. Any safety warnings or precautions?
5. Real-world applications or significance of this reaction.
6. Reaction mechanism (if applicable).

Format your response clearly with numbered sections.`;

      const result = await chatService.sendMessage(prompt, undefined, {
        topic: 'chemical reaction analysis',
        reaction: equation
      });

      setReactionResult(result.response);
      info('Analysis Complete', 'Reaction has been analyzed by AI');
    } catch (err) {
      console.error('Error analyzing reaction:', err);
      error('Analysis Failed', 'Could not analyze the reaction. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveReaction = async () => {
    if (!user) {
      error('Authentication Required', 'Please sign in to save reactions');
      return;
    }

    if (reaction.reactants.length === 0 || reaction.products.length === 0) {
      error('Incomplete Reaction', 'Please add both reactants and products');
      return;
    }

    const name = reactionName.trim() || formatEquation();
    
    try {
      const {error: saveError } = await supabase
        .from('reactions')
        .insert([{
          name,
          equation: formatEquation(),
          reactants: reaction.reactants.map(r => r.symbol),
          products: reaction.products.map(p => p.symbol),
          reaction_type: 'unknown', // This could be determined by AI analysis
          description: reactionResult,
          created_by: user.id, // Use user ID instead of email
          is_public: false,
          tags: ['user-created']
        }])
        .select()
        .single();

      if (saveError) throw saveError;

      success('Reaction Saved', 'Your reaction has been saved successfully');
      setReactionName('');
      await loadSavedReactions();
    } catch (err) {
      console.error('Error saving reaction:', err);
      error('Save Failed', 'Could not save the reaction. Please try again.');
    }
  };

  const loadReaction = (savedReaction: SavedReaction) => {
    // Convert saved reaction back to reaction elements
    const reactants: ReactionElement[] = savedReaction.reactants.map((symbol, index) => ({
      id: `${symbol}-reactant-${index}`,
      symbol,
      name: ELEMENTS_DATA.find(el => el.symbol === symbol)?.name || symbol,
      coefficient: 1,
      subscript: 1,
      position: 'front' as const,
    }));

    const products: ReactionElement[] = savedReaction.products.map((symbol, index) => ({
      id: `${symbol}-product-${index}`,
      symbol,
      name: ELEMENTS_DATA.find(el => el.symbol === symbol)?.name || symbol,
      coefficient: 1,
      subscript: 1,
      position: 'front' as const,
    }));

    setReaction({ reactants, products });
    setReactionResult(savedReaction.result || null);
    setReactionName(savedReaction.name);
    setShowHistory(false);
    success('Reaction Loaded', 'Previous reaction has been loaded');
  };

  const clearReaction = () => {
    setReaction({ reactants: [], products: [] });
    setReactionResult(null);
    setReactionName('');
  };

  const exportReaction = () => {
    const exportData = {
      name: reactionName || formatEquation(),
      equation: formatEquation(),
      reactants: reaction.reactants,
      products: reaction.products,
      analysis: reactionResult,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reaction-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Chemical Reactions Builder
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Drag elements to build reactions and get AI-powered analysis
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-900'
              } border border-gray-300 dark:border-gray-600`}
            >
              <History className="h-5 w-5" />
              <span>History</span>
            </button>
            <button
              onClick={clearReaction}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-900'
              } border border-gray-300 dark:border-gray-600`}
            >
              <RotateCcw className="h-5 w-5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCenter}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Elements Panel */}
            <div className={`lg:col-span-1 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Elements
              </h2>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search elements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Elements Grid */}
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {filteredElements.map(element => (
                  <DraggableElement key={element.symbol} element={element} />
                ))}
              </div>

              {filteredElements.length === 0 && (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No elements found</p>
                </div>
              )}
            </div>

            {/* Reaction Builder */}
            <div className="lg:col-span-3 space-y-6">
              {/* Reaction Name Input */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
                <div className="flex items-center space-x-4 mb-4">
                  <input
                    type="text"
                    placeholder="Reaction name (optional)"
                    value={reactionName}
                    onChange={(e) => setReactionName(e.target.value)}
                    className={`flex-1 px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  <button
                    onClick={saveReaction}
                    disabled={reaction.reactants.length === 0 || reaction.products.length === 0}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                      reaction.reactants.length > 0 && reaction.products.length > 0
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-400 cursor-not-allowed text-gray-200'
                    }`}
                  >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                </div>

                {/* Equation Display */}
                {formatEquation() && (
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`text-lg font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatEquation()}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={exportReaction}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
                          }`}
                          title="Export reaction"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(formatEquation())}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
                          }`}
                          title="Copy equation"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reaction Zones */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DroppableZone
                  id="reactants"
                  title="Reactants"
                  elements={reaction.reactants}
                  onUpdateElement={(id, updates) => updateReactionElement('reactants', id, updates)}
                  onRemoveElement={(id) => removeReactionElement('reactants', id)}
                />
                
                <div className="flex items-center justify-center">
                  <ArrowRight className={`h-8 w-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>

                <DroppableZone
                  id="products"
                  title="Products"
                  elements={reaction.products}
                  onUpdateElement={(id, updates) => updateReactionElement('products', id, updates)}
                  onRemoveElement={(id) => removeReactionElement('products', id)}
                />
              </div>

              {/* Analysis Section */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    AI Analysis
                  </h3>
                  <button
                    onClick={analyzeReaction}
                    disabled={reaction.reactants.length === 0 || reaction.products.length === 0 || isAnalyzing}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                      reaction.reactants.length > 0 && reaction.products.length > 0 && !isAnalyzing
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-400 cursor-not-allowed text-gray-200'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Analyze Reaction</span>
                      </>
                    )}
                  </button>
                </div>

                {reactionResult ? (
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {reactionResult}
                    </div>
                  </div>
                ) : (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Beaker className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Build a reaction and click "Analyze" to get AI insights</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeId ? (
              <div className={`p-3 rounded-lg shadow-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="text-lg font-bold">{activeId}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* History Panel */}
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowHistory(false)} />
            <div className={`relative w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-lg shadow-xl ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } p-6`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Saved Reactions
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {savedReactions.map((savedReaction) => (
                  <div
                    key={savedReaction.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => loadReaction(savedReaction)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {savedReaction.name}
                        </h3>
                        <p className={`text-sm font-mono mt-1 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                          {savedReaction.equation}
                        </p>
                        <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(savedReaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {savedReaction.safetyWarnings && savedReaction.safetyWarnings.length > 0 && (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" title="Has safety warnings" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {savedReactions.length === 0 && (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No saved reactions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeriodicTable;