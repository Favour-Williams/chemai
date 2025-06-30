import React, { useState } from 'react';
import { 
  DndContext, 
  DragEndEvent,
  DragOverlay,
 
  DragStartEvent,
  closestCenter
} from '@dnd-kit/core';
import { 
  arrayMove,
} from '@dnd-kit/sortable';

import { RotateCcw } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  category: string;
}

interface Molecule {
  id: string;
  formula: string;
  coefficient: number;
}

interface ReactionInputProps {
  initialElements?: string[];
}

const ReactionInput: React.FC<ReactionInputProps> = ({ initialElements = [] }) => {
  const [selectedElements, setSelectedElements] = useState<string[]>(initialElements);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const isDark = useThemeStore((state) => state.isDark);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    
    if (!over) return;

    if (active.id !== over.id) {
      setSelectedElements((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Chemical Reaction Builder
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedElements([])}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2
                ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'}
                transition-colors
              `}
            >
              <RotateCcw className="h-5 w-5" />
              Clear
            </button>
          </div>
        </div>

        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCenter}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Elements Panel */}
            <div className={`
              p-6 rounded-xl
              ${isDark ? 'bg-gray-800' : 'bg-white'}
              shadow-lg
            `}>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Elements
              </h2>
              <input
                type="text"
                placeholder="Search elements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`
                  w-full px-4 py-2 rounded-lg mb-4
                  ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}
                  border-none focus:ring-2 focus:ring-blue-500
                `}
              />
              <div className="grid grid-cols-2 gap-3">
                {/* Element cards will go here */}
              </div>
            </div>

            {/* Reaction Builder */}
            <div className="md:col-span-3 space-y-6">
              <div className={`
                p-6 rounded-xl
                ${isDark ? 'bg-gray-800' : 'bg-white'}
                shadow-lg
              `}>
                <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Reaction Equation
                </h2>

                <div className="flex items-center gap-4">
                  {/* Reactants and Products sections will go here */}
                </div>
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeId ? (
              <div className={`
                p-4 rounded-lg shadow-lg
                ${isDark ? 'bg-gray-700' : 'bg-white'}
              `}>
                {activeId}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default ReactionInput;