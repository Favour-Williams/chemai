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
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, ArrowRight, Trash2, Star, History, Save, RotateCcw } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

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

interface Reaction {
  id: string;
  reactants: Molecule[];
  products: Molecule[];
  isFavorite: boolean;
  timestamp: Date;
}

const commonElements: Element[] = [
  { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, category: 'Nonmetal' },
  { symbol: 'O', name: 'Oxygen', atomicNumber: 8, category: 'Nonmetal' },
  { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, category: 'Nonmetal' },
  { symbol: 'C', name: 'Carbon', atomicNumber: 6, category: 'Nonmetal' },
  { symbol: 'Na', name: 'Sodium', atomicNumber: 11, category: 'Alkali Metal' },
  { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, category: 'Halogen' },
  { symbol: 'Fe', name: 'Iron', atomicNumber: 26, category: 'Transition Metal' },
  { symbol: 'Cu', name: 'Copper', atomicNumber: 29, category: 'Transition Metal' },
];

const commonReactions: Reaction[] = [
  {
    id: '1',
    reactants: [
      { id: '1', formula: 'H2', coefficient: 2 },
      { id: '2', formula: 'O2', coefficient: 1 }
    ],
    products: [
      { id: '3', formula: 'H2O', coefficient: 2 }
    ],
    isFavorite: true,
    timestamp: new Date()
  },
  {
    id: '2',
    reactants: [
      { id: '1', formula: 'NaCl', coefficient: 1 },
      { id: '2', formula: 'AgNO3', coefficient: 1 }
    ],
    products: [
      { id: '3', formula: 'AgCl', coefficient: 1 },
      { id: '4', formula: 'NaNO3', coefficient: 1 }
    ],
    isFavorite: false,
    timestamp: new Date()
  }
];

const DraggableElement: React.FC<{ element: Element }> = ({ element }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: element.symbol,
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
        cursor-move select-none p-2 rounded-lg text-center
        ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'}
        shadow-md transition-colors
      `}
      style={style}
    >
      <div className="text-xl font-bold">{element.symbol}</div>
      <div className="text-sm opacity-70">{element.name}</div>
    </div>
  );
};

const SortableMolecule: React.FC<{
  molecule: Molecule;
  onRemove: () => void;
  onCoefficientChange: (value: number) => void;
}> = ({ molecule, onRemove, onCoefficientChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: molecule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDark = useThemeStore((state) => state.isDark);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-2 p-2 rounded-lg
        ${isDark ? 'bg-gray-700' : 'bg-white'}
        shadow-sm cursor-move
      `}
    >
      <input
        type="number"
        min="1"
        value={molecule.coefficient}
        onChange={(e) => onCoefficientChange(parseInt(e.target.value) || 1)}
        className={`
          w-16 px-2 py-1 rounded
          ${isDark ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-900'}
        `}
      />
      <span className="font-mono">{molecule.formula}</span>
      <button
        onClick={onRemove}
        className="p-1 rounded-full hover:bg-red-500 hover:text-white transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

const ReactionInput: React.FC = () => {
  const [reactions, setReactions] = useState<Reaction[]>(commonReactions);
  const [currentReaction, setCurrentReaction] = useState<Reaction>({
    id: Date.now().toString(),
    reactants: [],
    products: [],
    isFavorite: false,
    timestamp: new Date()
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const isDark = useThemeStore((state) => state.isDark);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;
    if (!over) return;

    if (active.id === over.id) return;

    if (over.id === 'reactants' || over.id === 'products') {
      const element = commonElements.find(e => e.symbol === active.id);
      if (!element) return;

      const newMolecule: Molecule = {
        id: Date.now().toString(),
        formula: element.symbol,
        coefficient: 1
      };

      setCurrentReaction(prev => ({
        ...prev,
        [over.id]: [...prev[over.id as 'reactants' | 'products'], newMolecule]
      }));
    }
  };

  const validateReaction = () => {
    // Basic validation - ensure there are reactants and products
    return currentReaction.reactants.length > 0 && currentReaction.products.length > 0;
  };

  const saveReaction = () => {
    if (!validateReaction()) return;

    setReactions(prev => [
      {
        ...currentReaction,
        id: Date.now().toString(),
        timestamp: new Date()
      },
      ...prev
    ]);

    // Reset current reaction
    setCurrentReaction({
      id: Date.now().toString(),
      reactants: [],
      products: [],
      isFavorite: false,
      timestamp: new Date()
    });
  };

  const loadReaction = (reaction: Reaction) => {
    setCurrentReaction(reaction);
    setShowHistory(false);
  };

  const toggleFavorite = (reactionId: string) => {
    setReactions(prev =>
      prev.map(reaction =>
        reaction.id === reactionId
          ? { ...reaction, isFavorite: !reaction.isFavorite }
          : reaction
      )
    );
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
              onClick={() => setShowHistory(!showHistory)}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2
                ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'}
                transition-colors
              `}
            >
              <History className="h-5 w-5" />
              History
            </button>
            <button
              onClick={() => setCurrentReaction({
                id: Date.now().toString(),
                reactants: [],
                products: [],
                isFavorite: false,
                timestamp: new Date()
              })}
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
              <div className="grid grid-cols-2 gap-3">
                {commonElements.map(element => (
                  <DraggableElement key={element.symbol} element={element} />
                ))}
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
                  {/* Reactants */}
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Reactants
                    </h3>
                    <div
                      className={`
                        min-h-32 p-4 rounded-lg border-2 border-dashed
                        ${isDark ? 'border-gray-600' : 'border-gray-200'}
                      `}
                    >
                      <SortableContext
                        items={currentReaction.reactants}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {currentReaction.reactants.map((molecule) => (
                            <SortableMolecule
                              key={molecule.id}
                              molecule={molecule}
                              onRemove={() => {
                                setCurrentReaction(prev => ({
                                  ...prev,
                                  reactants: prev.reactants.filter(m => m.id !== molecule.id)
                                }));
                              }}
                              onCoefficientChange={(value) => {
                                setCurrentReaction(prev => ({
                                  ...prev,
                                  reactants: prev.reactants.map(m =>
                                    m.id === molecule.id ? { ...m, coefficient: value } : m
                                  )
                                }));
                              }}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </div>
                  </div>

                  <ArrowRight className={`h-8 w-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />

                  {/* Products */}
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Products
                    </h3>
                    <div
                      className={`
                        min-h-32 p-4 rounded-lg border-2 border-dashed
                        ${isDark ? 'border-gray-600' : 'border-gray-200'}
                      `}
                    >
                      <SortableContext
                        items={currentReaction.products}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {currentReaction.products.map((molecule) => (
                            <SortableMolecule
                              key={molecule.id}
                              molecule={molecule}
                              onRemove={() => {
                                setCurrentReaction(prev => ({
                                  ...prev,
                                  products: prev.products.filter(m => m.id !== molecule.id)
                                }));
                              }}
                              onCoefficientChange={(value) => {
                                setCurrentReaction(prev => ({
                                  ...prev,
                                  products: prev.products.map(m =>
                                    m.id === molecule.id ? { ...m, coefficient: value } : m
                                  )
                                }));
                              }}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveReaction}
                    disabled={!validateReaction()}
                    className={`
                      px-6 py-2 rounded-lg flex items-center gap-2
                      ${validateReaction()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-400 cursor-not-allowed text-gray-200'
                      }
                      transition-colors
                    `}
                  >
                    <Save className="h-5 w-5" />
                    Save Reaction
                  </button>
                </div>
              </div>

              {/* History Panel */}
              {showHistory && (
                <div className={`
                  p-6 rounded-xl
                  ${isDark ? 'bg-gray-800' : 'bg-white'}
                  shadow-lg
                `}>
                  <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Reaction History
                  </h2>
                  <div className="space-y-4">
                    {reactions.map(reaction => (
                      <div
                        key={reaction.id}
                        className={`
                          p-4 rounded-lg flex items-center justify-between
                          ${isDark ? 'bg-gray-700' : 'bg-gray-50'}
                        `}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            {reaction.reactants.map((r, i) => (
                              <span key={i} className="font-mono">
                                {r.coefficient > 1 && r.coefficient}{r.formula}
                              </span>
                            ))}
                            <ArrowRight className="h-4 w-4" />
                            {reaction.products.map((p, i) => (
                              <span key={i} className="font-mono">
                                {p.coefficient > 1 && p.coefficient}{p.formula}
                              </span>
                            ))}
                          </div>
                          <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(reaction.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleFavorite(reaction.id)}
                            className={`
                              p-2 rounded-full
                              ${reaction.isFavorite
                                ? 'text-yellow-500'
                                : isDark ? 'text-gray-400' : 'text-gray-500'
                              }
                              hover:bg-gray-600/50
                              transition-colors
                            `}
                          >
                            <Star className="h-5 w-5" fill={reaction.isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => loadReaction(reaction)}
                            className={`
                              px-4 py-2 rounded-lg
                              ${isDark ? 'bg-blue-600' : 'bg-blue-500'}
                              text-white
                              hover:bg-blue-700
                              transition-colors
                            `}
                          >
                            Load
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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