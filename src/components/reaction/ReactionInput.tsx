import React, { useState } from 'react';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RotateCcw, Search, ArrowRight } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

// The 'Element' interface is now used by ELEMENTS_DATA and the DraggableElement component.
interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  category: string;
}

// The 'Molecule' interface was unused. It's commented out to fix the error.
// You can uncomment and use it when you build out molecule-specific features.
// interface Molecule {
//   id: string;
//   formula: string;
//   coefficient: number;
// }

// Sample data to make the component functional.
const ELEMENTS_DATA: Element[] = [
    { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, category: 'nonmetal' },
    { symbol: 'O', name: 'Oxygen', atomicNumber: 8, category: 'nonmetal' },
    { symbol: 'Na', name: 'Sodium', atomicNumber: 11, category: 'alkali-metal' },
    { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, category: 'halogen' },
    { symbol: 'C', name: 'Carbon', atomicNumber: 6, category: 'nonmetal' },
    { symbol: 'Fe', name: 'Iron', atomicNumber: 26, category: 'transition-metal' },
    { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, category: 'nonmetal' },
    { symbol: 'Ca', name: 'Calcium', atomicNumber: 20, category: 'alkaline-earth' },
];

// Component for elements in the source panel
const DraggableElement: React.FC<{ element: Element }> = ({ element }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: element.symbol,
    data: { type: 'element', element },
  });
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-2 rounded-md text-center cursor-move select-none border transition-opacity ${
        isDragging ? 'opacity-30' : 'opacity-100'
      } ${isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-100'}`}
    >
      <div className="font-bold">{element.symbol}</div>
      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{element.name}</div>
    </div>
  );
};

// Component for elements placed in the reaction zones
const SortableElement: React.FC<{ symbol: string }> = ({ symbol }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: symbol });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto' };
    const isDark = useThemeStore((state) => state.isDark);
    const element = ELEMENTS_DATA.find(el => el.symbol === symbol);

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}
            className={`p-3 rounded-lg flex items-center gap-2 cursor-grab shadow-sm ${
                isDragging ? 'opacity-50' : ''
            } ${isDark ? 'bg-gray-600' : 'bg-gray-500'}`}
        >
            <span className="font-bold text-lg">{element?.symbol}</span>
            <span className="text-sm">{element?.name}</span>
        </div>
    );
};

interface ReactionInputProps {
  initialElements?: string[];
}

const ReactionInput: React.FC<ReactionInputProps> = ({ initialElements = [] }) => {
  // The 'selectedElements' state is now used to render reactants and products.
  const [reactants, setReactants] = useState<string[]>(initialElements);
  const [products, setProducts] = useState<string[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeElement, setActiveElement] = useState<Element | null>(null);
  const isDark = useThemeStore((state) => state.isDark);

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    if (event.active.data.current?.type === 'element') {
        setActiveElement(event.active.data.current.element);
    } else {
        setActiveElement(ELEMENTS_DATA.find(el => el.symbol === id) || null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveElement(null);
    const { active, over } = event;
    
    if (!over) return;
    
    const activeIdStr = active.id as string;
    const overContainer = over.data.current?.container;
    
    // Drop new element from panel into a zone
    if (active.data.current?.type === 'element' && over.data.current?.isDropZone) {
      if (overContainer === 'reactants') {
        if (!reactants.includes(activeIdStr)) setReactants(prev => [...prev, activeIdStr]);
      } else if (overContainer === 'products') {
        if (!products.includes(activeIdStr)) setProducts(prev => [...prev, activeIdStr]);
      }
      return;
    }
    
    // Reorder within reactants
    if (reactants.includes(activeIdStr) && overContainer === 'reactants') {
        if (active.id !== over.id) {
            setReactants((items) => arrayMove(items, items.indexOf(activeIdStr), items.indexOf(over.id as string)));
        }
    }
    // Reorder within products
    else if (products.includes(activeIdStr) && overContainer === 'products') {
        if (active.id !== over.id) {
            setProducts((items) => arrayMove(items, items.indexOf(activeIdStr), items.indexOf(over.id as string)));
        }
    }
  };

  const filteredElements = ELEMENTS_DATA.filter(element =>
    element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Reusable component for drop zones
  const DroppableZone: React.FC<{ id: string; title: string; items: string[] }> = ({ id, title, items }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `${id}-zone`, data: { isDropZone: true, container: id } });
    return (
      <div className='flex-1'>
        <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div ref={setNodeRef}
            className={`min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-colors flex flex-col gap-2 ${
              isOver ? 'border-blue-500 bg-blue-500/10' : (isDark ? 'border-gray-600' : 'border-gray-300')
            }`}>
            {items.map(symbol => <SortableElement key={symbol} symbol={symbol} />)}
            {items.length === 0 && (
                <div className='m-auto text-center text-gray-500'>Drag elements here</div>
            )}
          </div>
        </SortableContext>
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Chemical Reaction Builder
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => { setReactants([]); setProducts([]); }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 border transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>
              <RotateCcw className="h-5 w-5" />
              Clear
            </button>
          </div>
        </div>

        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Elements</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border-none ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} focus:ring-2 focus:ring-blue-500`}/>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                {filteredElements.map(el => <DraggableElement key={el.symbol} element={el} />)}
              </div>
            </div>

            <div className="md:col-span-3 space-y-6">
              <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Reaction Equation</h2>
                <div className="flex items-center gap-4">
                  <DroppableZone id="reactants" title="Reactants" items={reactants} />
                  <div className="flex-shrink-0 text-gray-400"><ArrowRight size={32} /></div>
                  <DroppableZone id="products" title="Products" items={products} />
                </div>
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeId && activeElement ? (
              <div className={`p-3 rounded-lg shadow-lg flex items-center gap-2 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                 <span className="font-bold text-lg">{activeElement.symbol}</span>
                 <span className="text-sm">{activeElement.name}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default ReactionInput;