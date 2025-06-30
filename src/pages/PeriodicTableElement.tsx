import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useThemeStore } from '../store/themeStore'; // Remove or comment out this line
import { useSettingsStore } from '../store/settingsStore'; // Import useSettingsStore
import { Search, X, Play, Mic, MicOff, VolumeX, Headphones } from 'lucide-react';
import MoleculeViewer from '../components/MoleculeViewer';
import { elevenLabsService } from '../services/elevenLabsService';

interface Element {
  number: number;
  symbol: string;
  name: string;
  category: string;
  group?: number;
  period: number;
  atomicMass: number;
  electronConfiguration: string;
  meltingPoint: number;
  boilingPoint: number;
  density: number;
  uses: string[];
  discoveredBy: string;
  discoveryYear: number;
  safetyLevel: 'safe' | 'caution' | 'dangerous';
  description: string;
  commonCompounds: string[];
}

const PeriodicTableElement: React.FC = () => {
  // const [isDark, setIsDark] = useState(true); // Remove this line
  const { theme: appTheme } = useSettingsStore(); // Get theme from settings store

  // Derive isDark based on appTheme mode and system preference
  const isDark = appTheme.mode === 'dark' || (appTheme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceConversation, setVoiceConversation] = useState<{
    messages: Array<{
      id: string;
      text: string;
      sender: 'user' | 'ai';
      timestamp: Date;
    }>;
  }>({
    messages: []
  });
  
  const tooltipRef = useRef<HTMLDivElement>(null);
  const microphoneRef = useRef<HTMLButtonElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Complete periodic table data (118 elements)
  const elements: Element[] = [
  // Period 1
  { number: 1, symbol: 'H', name: 'Hydrogen', category: 'nonmetal', group: 1, period: 1, atomicMass: 1.008, electronConfiguration: '1s¹', meltingPoint: -259.16, boilingPoint: -252.87, density: 0.08988, uses: ['Fuel cells', 'Ammonia production', 'Hydrogenation'], discoveredBy: 'Henry Cavendish', discoveryYear: 1766, safetyLevel: 'caution', description: 'The lightest and most abundant element in the universe', commonCompounds: ['H₂O', 'NH₃', 'HCl'] },
  { number: 2, symbol: 'He', name: 'Helium', category: 'noble-gas', group: 18, period: 1, atomicMass: 4.003, electronConfiguration: '1s²', meltingPoint: -272.2, boilingPoint: -268.93, density: 0.1786, uses: ['Balloons', 'Cryogenics', 'Breathing gas'], discoveredBy: 'Pierre Janssen', discoveryYear: 1868, safetyLevel: 'safe', description: 'Second most abundant element in the universe', commonCompounds: ['He (monatomic)'] },
  
  // Period 2
  { number: 3, symbol: 'Li', name: 'Lithium', category: 'alkali-metal', group: 1, period: 2, atomicMass: 6.94, electronConfiguration: '[He] 2s¹', meltingPoint: 180.5, boilingPoint: 1342, density: 0.534, uses: ['Batteries', 'Ceramics', 'Medicine'], discoveredBy: 'Johan August Arfwedson', discoveryYear: 1817, safetyLevel: 'caution', description: 'Lightest metal and solid element', commonCompounds: ['LiOH', 'Li₂CO₃', 'LiCl'] },
  { number: 4, symbol: 'Be', name: 'Beryllium', category: 'alkaline-earth', group: 2, period: 2, atomicMass: 9.012, electronConfiguration: '[He] 2s²', meltingPoint: 1287, boilingPoint: 2471, density: 1.85, uses: ['Aerospace', 'X-ray windows', 'Springs'], discoveredBy: 'Louis-Nicolas Vauquelin', discoveryYear: 1798, safetyLevel: 'dangerous', description: 'Light, strong, but toxic metal', commonCompounds: ['BeO', 'BeCl₂', 'BeF₂'] },
  { number: 5, symbol: 'B', name: 'Boron', category: 'metalloid', group: 13, period: 2, atomicMass: 10.81, electronConfiguration: '[He] 2s² 2p¹', meltingPoint: 2075, boilingPoint: 4000, density: 2.34, uses: ['Glass', 'Semiconductors', 'Agriculture'], discoveredBy: 'Joseph Louis Gay-Lussac', discoveryYear: 1808, safetyLevel: 'caution', description: 'Essential micronutrient and semiconductor', commonCompounds: ['B₂O₃', 'H₃BO₃', 'BF₃'] },
  { number: 6, symbol: 'C', name: 'Carbon', category: 'nonmetal', group: 14, period: 2, atomicMass: 12.01, electronConfiguration: '[He] 2s² 2p²', meltingPoint: 3500, boilingPoint: 4027, density: 2.267, uses: ['Organic compounds', 'Steel', 'Diamond'], discoveredBy: 'Ancient', discoveryYear: -3750, safetyLevel: 'safe', description: 'Basis of all organic chemistry', commonCompounds: ['CO₂', 'CH₄', 'C₆H₁₂O₆'] },
  { number: 7, symbol: 'N', name: 'Nitrogen', category: 'nonmetal', group: 15, period: 2, atomicMass: 14.01, electronConfiguration: '[He] 2s² 2p³', meltingPoint: -210.0, boilingPoint: -195.79, density: 1.251, uses: ['Fertilizers', 'Explosives', 'Inert atmosphere'], discoveredBy: 'Daniel Rutherford', discoveryYear: 1772, safetyLevel: 'caution', description: 'Makes up 78% of Earth\'s atmosphere', commonCompounds: ['NH₃', 'HNO₃', 'N₂O'] },
  { number: 8, symbol: 'O', name: 'Oxygen', category: 'nonmetal', group: 16, period: 2, atomicMass: 15.999, electronConfiguration: '[He] 2s² 2p⁴', meltingPoint: -218.79, boilingPoint: -182.95, density: 1.429, uses: ['Respiration', 'Combustion', 'Steel production'], discoveredBy: 'Joseph Priestley', discoveryYear: 1774, safetyLevel: 'caution', description: 'Essential for life and combustion', commonCompounds: ['H₂O', 'CO₂', 'O₃'] },
  { number: 9, symbol: 'F', name: 'Fluorine', category: 'nonmetal', group: 17, period: 2, atomicMass: 18.998, electronConfiguration: '[He] 2s² 2p⁵', meltingPoint: -219.67, boilingPoint: -188.11, density: 1.696, uses: ['Toothpaste', 'Teflon', 'Refrigerants'], discoveredBy: 'Henri Moissan', discoveryYear: 1886, safetyLevel: 'dangerous', description: 'Most electronegative element', commonCompounds: ['HF', 'NaF', 'CaF₂'] },
  { number: 10, symbol: 'Ne', name: 'Neon', category: 'noble-gas', group: 18, period: 2, atomicMass: 20.18, electronConfiguration: '[He] 2s² 2p⁶', meltingPoint: -248.59, boilingPoint: -246.053, density: 0.9002, uses: ['Neon lights', 'Lasers', 'Cryogenics'], discoveredBy: 'William Ramsay', discoveryYear: 1898, safetyLevel: 'safe', description: 'Inert gas used in lighting', commonCompounds: ['Ne (monatomic)'] },

  // Period 3
  { number: 11, symbol: 'Na', name: 'Sodium', category: 'alkali-metal', group: 1, period: 3, atomicMass: 22.99, electronConfiguration: '[Ne] 3s¹', meltingPoint: 97.79, boilingPoint: 883, density: 0.971, uses: ['Salt', 'Soap', 'Street lights'], discoveredBy: 'Humphry Davy', discoveryYear: 1807, safetyLevel: 'dangerous', description: 'Highly reactive alkali metal', commonCompounds: ['NaCl', 'NaOH', 'Na₂CO₃'] },
  { number: 12, symbol: 'Mg', name: 'Magnesium', category: 'alkaline-earth', group: 2, period: 3, atomicMass: 24.31, electronConfiguration: '[Ne] 3s²', meltingPoint: 650, boilingPoint: 1090, density: 1.738, uses: ['Alloys', 'Fireworks', 'Medicine'], discoveredBy: 'Joseph Black', discoveryYear: 1755, safetyLevel: 'caution', description: 'Light structural metal', commonCompounds: ['MgO', 'MgCl₂', 'Mg(OH)₂'] },
  { number: 13, symbol: 'Al', name: 'Aluminum', category: 'post-transition', group: 13, period: 3, atomicMass: 26.98, electronConfiguration: '[Ne] 3s² 3p¹', meltingPoint: 660.32, boilingPoint: 2519, density: 2.70, uses: ['Cans', 'Aircraft', 'Foil'], discoveredBy: 'Hans Christian Ørsted', discoveryYear: 1825, safetyLevel: 'safe', description: 'Most abundant metal in Earth\'s crust', commonCompounds: ['Al₂O₃', 'AlCl₃', 'Al₂(SO₄)₃'] },
  { number: 14, symbol: 'Si', name: 'Silicon', category: 'metalloid', group: 14, period: 3, atomicMass: 28.09, electronConfiguration: '[Ne] 3s² 3p²', meltingPoint: 1414, boilingPoint: 3265, density: 2.3296, uses: ['Computer chips', 'Glass', 'Solar panels'], discoveredBy: 'Jöns Jacob Berzelius', discoveryYear: 1824, safetyLevel: 'safe', description: 'Second most abundant element in Earth\'s crust', commonCompounds: ['SiO₂', 'SiC', 'Si₃N₄'] },
  { number: 15, symbol: 'P', name: 'Phosphorus', category: 'nonmetal', group: 15, period: 3, atomicMass: 30.97, electronConfiguration: '[Ne] 3s² 3p³', meltingPoint: 44.15, boilingPoint: 280.5, density: 1.823, uses: ['Fertilizers', 'Matches', 'DNA'], discoveredBy: 'Hennig Brand', discoveryYear: 1669, safetyLevel: 'dangerous', description: 'Essential for life, found in DNA and ATP', commonCompounds: ['H₃PO₄', 'Ca₃(PO₄)₂', 'P₄O₁₀'] },
  { number: 16, symbol: 'S', name: 'Sulfur', category: 'nonmetal', group: 16, period: 3, atomicMass: 32.07, electronConfiguration: '[Ne] 3s² 3p⁴', meltingPoint: 115.21, boilingPoint: 444.61, density: 2.067, uses: ['Sulfuric acid', 'Vulcanization', 'Fertilizers'], discoveredBy: 'Ancient', discoveryYear: -2000, safetyLevel: 'caution', description: 'Essential element found in proteins', commonCompounds: ['H₂SO₄', 'SO₂', 'H₂S'] },
  { number: 17, symbol: 'Cl', name: 'Chlorine', category: 'nonmetal', group: 17, period: 3, atomicMass: 35.45, electronConfiguration: '[Ne] 3s² 3p⁵', meltingPoint: -101.5, boilingPoint: -34.04, density: 3.214, uses: ['Disinfectant', 'PVC', 'Salt'], discoveredBy: 'Carl Wilhelm Scheele', discoveryYear: 1774, safetyLevel: 'dangerous', description: 'Powerful disinfectant and bleaching agent', commonCompounds: ['NaCl', 'HCl', 'ClO₂'] },
  { number: 18, symbol: 'Ar', name: 'Argon', category: 'noble-gas', group: 18, period: 3, atomicMass: 39.948, electronConfiguration: '[Ne] 3s² 3p⁶', meltingPoint: -189.35, boilingPoint: -185.85, density: 1.784, uses: ['Welding', 'Light bulbs', 'Preservation'], discoveredBy: 'Lord Rayleigh', discoveryYear: 1894, safetyLevel: 'safe', description: 'Third most abundant gas in Earth\'s atmosphere', commonCompounds: ['Ar (monatomic)'] },

  // Period 4
  { number: 19, symbol: 'K', name: 'Potassium', category: 'alkali-metal', group: 1, period: 4, atomicMass: 39.10, electronConfiguration: '[Ar] 4s¹', meltingPoint: 63.38, boilingPoint: 759, density: 0.89, uses: ['Fertilizers', 'Glass', 'Gunpowder'], discoveredBy: 'Humphry Davy', discoveryYear: 1807, safetyLevel: 'dangerous', description: 'Essential for plant and animal life', commonCompounds: ['KCl', 'KOH', 'KNO₃'] },
  { number: 20, symbol: 'Ca', name: 'Calcium', category: 'alkaline-earth', group: 2, period: 4, atomicMass: 40.08, electronConfiguration: '[Ar] 4s²', meltingPoint: 842, boilingPoint: 1484, density: 1.54, uses: ['Bones', 'Concrete', 'Steel'], discoveredBy: 'Humphry Davy', discoveryYear: 1808, safetyLevel: 'caution', description: 'Most abundant metal in the human body', commonCompounds: ['CaCO₃', 'CaO', 'Ca(OH)₂'] },
  { number: 21, symbol: 'Sc', name: 'Scandium', category: 'transition-metal', group: 3, period: 4, atomicMass: 44.956, electronConfiguration: '[Ar] 3d¹ 4s²', meltingPoint: 1541, boilingPoint: 2836, density: 2.989, uses: ['Aerospace alloys', 'Lighting', 'Sports equipment'], discoveredBy: 'Lars Fredrik Nilson', discoveryYear: 1879, safetyLevel: 'caution', description: 'Rare earth element with specialized applications', commonCompounds: ['Sc₂O₃', 'ScCl₃', 'ScF₃'] },
  { number: 22, symbol: 'Ti', name: 'Titanium', category: 'transition-metal', group: 4, period: 4, atomicMass: 47.867, electronConfiguration: '[Ar] 3d² 4s²', meltingPoint: 1668, boilingPoint: 3287, density: 4.506, uses: ['Aerospace', 'Medical implants', 'Paint'], discoveredBy: 'William Gregor', discoveryYear: 1791, safetyLevel: 'safe', description: 'Strong, lightweight, corrosion-resistant metal', commonCompounds: ['TiO₂', 'TiCl₄', 'Ti₂O₃'] },
  { number: 23, symbol: 'V', name: 'Vanadium', category: 'transition-metal', group: 5, period: 4, atomicMass: 50.942, electronConfiguration: '[Ar] 3d³ 4s²', meltingPoint: 1910, boilingPoint: 3407, density: 6.11, uses: ['Steel alloys', 'Catalysts', 'Springs'], discoveredBy: 'Andrés Manuel del Río', discoveryYear: 1801, safetyLevel: 'caution', description: 'Hard metal used to strengthen steel', commonCompounds: ['V₂O₅', 'VCl₃', 'VO₂'] },
  { number: 24, symbol: 'Cr', name: 'Chromium', category: 'transition-metal', group: 6, period: 4, atomicMass: 51.996, electronConfiguration: '[Ar] 3d⁵ 4s¹', meltingPoint: 1907, boilingPoint: 2671, density: 7.15, uses: ['Stainless steel', 'Chrome plating', 'Pigments'], discoveredBy: 'Louis-Nicolas Vauquelin', discoveryYear: 1797, safetyLevel: 'dangerous', description: 'Hard, corrosion-resistant metal', commonCompounds: ['Cr₂O₃', 'CrO₃', 'K₂Cr₂O₇'] },
  { number: 25, symbol: 'Mn', name: 'Manganese', category: 'transition-metal', group: 7, period: 4, atomicMass: 54.938, electronConfiguration: '[Ar] 3d⁵ 4s²', meltingPoint: 1246, boilingPoint: 2061, density: 7.44, uses: ['Steel production', 'Batteries', 'Fertilizers'], discoveredBy: 'Johan Gottlieb Gahn', discoveryYear: 1774, safetyLevel: 'caution', description: 'Essential for steel production and biology', commonCompounds: ['MnO₂', 'KMnO₄', 'MnSO₄'] },
  { number: 26, symbol: 'Fe', name: 'Iron', category: 'transition-metal', group: 8, period: 4, atomicMass: 55.845, electronConfiguration: '[Ar] 3d⁶ 4s²', meltingPoint: 1538, boilingPoint: 2862, density: 7.874, uses: ['Steel', 'Magnets', 'Blood'], discoveredBy: 'Ancient', discoveryYear: -5000, safetyLevel: 'safe', description: 'Most used metal in the world', commonCompounds: ['Fe₂O₃', 'FeCl₃', 'FeS'] },
  { number: 27, symbol: 'Co', name: 'Cobalt', category: 'transition-metal', group: 9, period: 4, atomicMass: 58.933, electronConfiguration: '[Ar] 3d⁷ 4s²', meltingPoint: 1495, boilingPoint: 2927, density: 8.86, uses: ['Magnets', 'Batteries', 'Blue pigments'], discoveredBy: 'Georg Brandt', discoveryYear: 1735, safetyLevel: 'caution', description: 'Magnetic metal used in superalloys', commonCompounds: ['CoO', 'CoCl₂', 'CoSO₄'] },
  { number: 28, symbol: 'Ni', name: 'Nickel', category: 'transition-metal', group: 10, period: 4, atomicMass: 58.693, electronConfiguration: '[Ar] 3d⁸ 4s²', meltingPoint: 1455, boilingPoint: 2913, density: 8.912, uses: ['Stainless steel', 'Coins', 'Catalysts'], discoveredBy: 'Axel Fredrik Cronstedt', discoveryYear: 1751, safetyLevel: 'caution', description: 'Corrosion-resistant magnetic metal', commonCompounds: ['NiO', 'NiCl₂', 'NiSO₄'] },
  { number: 29, symbol: 'Cu', name: 'Copper', category: 'transition-metal', group: 11, period: 4, atomicMass: 63.546, electronConfiguration: '[Ar] 3d¹⁰ 4s¹', meltingPoint: 1084.62, boilingPoint: 2562, density: 8.96, uses: ['Wires', 'Plumbing', 'Coins'], discoveredBy: 'Ancient', discoveryYear: -9000, safetyLevel: 'safe', description: 'Excellent conductor of electricity', commonCompounds: ['CuSO₄', 'CuO', 'CuCl₂'] },
  { number: 30, symbol: 'Zn', name: 'Zinc', category: 'transition-metal', group: 12, period: 4, atomicMass: 65.38, electronConfiguration: '[Ar] 3d¹⁰ 4s²', meltingPoint: 419.53, boilingPoint: 907, density: 7.134, uses: ['Galvanizing', 'Batteries', 'Supplements'], discoveredBy: 'Ancient', discoveryYear: -1000, safetyLevel: 'safe', description: 'Essential trace element for humans', commonCompounds: ['ZnO', 'ZnCl₂', 'ZnS'] },
  { number: 31, symbol: 'Ga', name: 'Gallium', category: 'post-transition', group: 13, period: 4, atomicMass: 69.723, electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p¹', meltingPoint: 29.76, boilingPoint: 2204, density: 5.907, uses: ['Semiconductors', 'LEDs', 'Solar cells'], discoveredBy: 'Paul-Émile Lecoq de Boisbaudran', discoveryYear: 1875, safetyLevel: 'caution', description: 'Metal that melts near room temperature', commonCompounds: ['Ga₂O₃', 'GaCl₃', 'GaAs'] },
  { number: 32, symbol: 'Ge', name: 'Germanium', category: 'metalloid', group: 14, period: 4, atomicMass: 72.630, electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p²', meltingPoint: 938.25, boilingPoint: 2833, density: 5.323, uses: ['Semiconductors', 'Fiber optics', 'Infrared optics'], discoveredBy: 'Clemens Winkler', discoveryYear: 1886, safetyLevel: 'caution', description: 'Important semiconductor material', commonCompounds: ['GeO₂', 'GeCl₄', 'GeH₄'] },
  { number: 33, symbol: 'As', name: 'Arsenic', category: 'metalloid', group: 15, period: 4, atomicMass: 74.922, electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p³', meltingPoint: 817, boilingPoint: 614, density: 5.776, uses: ['Semiconductors', 'Wood preservatives', 'Pesticides'], discoveredBy: 'Albertus Magnus', discoveryYear: 1250, safetyLevel: 'dangerous', description: 'Toxic metalloid with industrial uses', commonCompounds: ['As₂O₃', 'AsH₃', 'GaAs'] },
  { number: 34, symbol: 'Se', name: 'Selenium', category: 'nonmetal', group: 16, period: 4, atomicMass: 78.971, electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p⁴', meltingPoint: 221, boilingPoint: 685, density: 4.809, uses: ['Electronics', 'Glass', 'Supplements'], discoveredBy: 'Jöns Jacob Berzelius', discoveryYear: 1817, safetyLevel: 'caution', description: 'Essential trace element and semiconductor', commonCompounds: ['SeO₂', 'H₂Se', 'Na₂SeO₃'] },
  { number: 35, symbol: 'Br', name: 'Bromine', category: 'nonmetal', group: 17, period: 4, atomicMass: 79.904, electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p⁵', meltingPoint: -7.2, boilingPoint: 58.8, density: 3.122, uses: ['Flame retardants', 'Photography', 'Medicine'], discoveredBy: 'Antoine Jérôme Balard', discoveryYear: 1826, safetyLevel: 'dangerous', description: 'Only nonmetal that is liquid at room temperature', commonCompounds: ['HBr', 'NaBr', 'AgBr'] },
  { number: 36, symbol: 'Kr', name: 'Krypton', category: 'noble-gas', group: 18, period: 4, atomicMass: 83.798, electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p⁶', meltingPoint: -157.36, boilingPoint: -153.22, density: 3.733, uses: ['Fluorescent lamps', 'Flash photography', 'Lasers'], discoveredBy: 'William Ramsay', discoveryYear: 1898, safetyLevel: 'safe', description: 'Noble gas used in specialized lighting', commonCompounds: ['Kr (monatomic)', 'KrF₂'] },

  // Period 5
  { number: 37, symbol: 'Rb', name: 'Rubidium', category: 'alkali-metal', group: 1, period: 5, atomicMass: 85.468, electronConfiguration: '[Kr] 5s¹', meltingPoint: 39.31, boilingPoint: 688, density: 1.532, uses: ['Research', 'Electronics', 'Medical imaging'], discoveredBy: 'Robert Bunsen', discoveryYear: 1861, safetyLevel: 'dangerous', description: 'Highly reactive alkali metal', commonCompounds: ['RbCl', 'RbOH', 'Rb₂O'] },
  { number: 38, symbol: 'Sr', name: 'Strontium', category: 'alkaline-earth', group: 2, period: 5, atomicMass: 87.62, electronConfiguration: '[Kr] 5s²', meltingPoint: 777, boilingPoint: 1382, density: 2.64, uses: ['Fireworks', 'Magnets', 'Medical applications'], discoveredBy: 'Adair Crawford', discoveryYear: 1790, safetyLevel: 'caution', description: 'Alkaline earth metal with red flame color', commonCompounds: ['SrO', 'SrCl₂', 'SrSO₄'] },
  { number: 39, symbol: 'Y', name: 'Yttrium', category: 'transition-metal', group: 3, period: 5, atomicMass: 88.906, electronConfiguration: '[Kr] 4d¹ 5s²', meltingPoint: 1526, boilingPoint: 3345, density: 4.469, uses: ['Superconductors', 'Lasers', 'Cancer treatment'], discoveredBy: 'Johan Gadolin', discoveryYear: 1794, safetyLevel: 'caution', description: 'Rare earth element with high-tech applications', commonCompounds: ['Y₂O₃', 'YCl₃', 'YF₃'] },
  { number: 40, symbol: 'Zr', name: 'Zirconium', category: 'transition-metal', group: 4, period: 5, atomicMass: 91.224, electronConfiguration: '[Kr] 4d² 5s²', meltingPoint: 1855, boilingPoint: 4409, density: 6.506, uses: ['Nuclear reactors', 'Ceramics', 'Jewelry'], discoveredBy: 'Martin Heinrich Klaproth', discoveryYear: 1789, safetyLevel: 'safe', description: 'Corrosion-resistant metal used in nuclear applications', commonCompounds: ['ZrO₂', 'ZrCl₄', 'ZrSiO₄'] },
  { number: 41, symbol: 'Nb', name: 'Niobium', category: 'transition-metal', group: 5, period: 5, atomicMass: 92.906, electronConfiguration: '[Kr] 4d⁴ 5s¹', meltingPoint: 2477, boilingPoint: 4744, density: 8.57, uses: ['Superconductors', 'Steel alloys', 'Jewelry'], discoveredBy: 'Charles Hatchett', discoveryYear: 1801, safetyLevel: 'safe', description: 'Superconducting transition metal', commonCompounds: ['Nb₂O₅', 'NbCl₅', 'NbC'] },
  { number: 42, symbol: 'Mo', name: 'Molybdenum', category: 'transition-metal', group: 6, period: 5, atomicMass: 95.95, electronConfiguration: '[Kr] 4d⁵ 5s¹', meltingPoint: 2623, boilingPoint: 4639, density: 10.22, uses: ['Steel alloys', 'Catalysts', 'Lubricants'], discoveredBy: 'Carl Wilhelm Scheele', discoveryYear: 1778, safetyLevel: 'caution', description: 'High melting point metal essential for steel', commonCompounds: ['MoO₃', 'MoS₂', 'Na₂MoO₄'] },
  { number: 43, symbol: 'Tc', name: 'Technetium', category: 'transition-metal', group: 7, period: 5, atomicMass: 98, electronConfiguration: '[Kr] 4d⁵ 5s²', meltingPoint: 2157, boilingPoint: 4265, density: 11.5, uses: ['Medical imaging', 'Nuclear medicine', 'Research'], discoveredBy: 'Emilio Segrè', discoveryYear: 1937, safetyLevel: 'dangerous', description: 'First artificially produced element', commonCompounds: ['TcO₄⁻', 'Tc₂O₇', 'TcCl₄'] },
  { number: 44, symbol: 'Ru', name: 'Ruthenium', category: 'transition-metal', group: 8, period: 5, atomicMass: 101.07, electronConfiguration: '[Kr] 4d⁷ 5s¹', meltingPoint: 2334, boilingPoint: 4150, density: 12.37, uses: ['Electronics', 'Catalysts', 'Jewelry'], discoveredBy: 'Karl Ernst Claus', discoveryYear: 1844, safetyLevel: 'caution', description: 'Rare platinum group metal', commonCompounds: ['RuO₂', 'RuCl₃', 'RuO₄'] },
    // Period 5 (continued)
  { number: 45, symbol: 'Rh', name: 'Rhodium', category: 'transition-metal', group: 9, period: 5, atomicMass: 102.91, electronConfiguration: '[Kr] 4d⁸ 5s¹', meltingPoint: 1964, boilingPoint: 3695, density: 12.41, uses: ['Catalytic converters', 'Jewelry', 'Electrical contacts'], discoveredBy: 'William Hyde Wollaston', discoveryYear: 1803, safetyLevel: 'safe', description: 'Rare, corrosion-resistant platinum group metal', commonCompounds: ['RhCl₃', 'Rh₂O₃', 'Rh(CO)₁₂'] },
  { number: 46, symbol: 'Pd', name: 'Palladium', category: 'transition-metal', group: 10, period: 5, atomicMass: 106.42, electronConfiguration: '[Kr] 4d¹⁰', meltingPoint: 1554.9, boilingPoint: 2963, density: 12.02, uses: ['Catalytic converters', 'Jewelry', 'Electronics'], discoveredBy: 'William Hyde Wollaston', discoveryYear: 1803, safetyLevel: 'safe', description: 'Rare platinum group metal used in catalysis', commonCompounds: ['PdCl₂', 'PdO', 'K₂PdCl₄'] },
  { number: 47, symbol: 'Ag', name: 'Silver', category: 'transition-metal', group: 11, period: 5, atomicMass: 107.8682, electronConfiguration: '[Kr] 4d¹⁰ 5s¹', meltingPoint: 961.78, boilingPoint: 2162, density: 10.501, uses: ['Jewelry', 'Electronics', 'Photography'], discoveredBy: 'Ancient', discoveryYear: -3000, safetyLevel: 'safe', description: 'Best conductor of electricity', commonCompounds: ['AgNO₃', 'AgCl', 'Ag₂S'] },
  { number: 48, symbol: 'Cd', name: 'Cadmium', category: 'transition-metal', group: 12, period: 5, atomicMass: 112.414, electronConfiguration: '[Kr] 4d¹⁰ 5s²', meltingPoint: 321.07, boilingPoint: 767, density: 8.69, uses: ['Batteries', 'Pigments', 'Coatings'], discoveredBy: 'Karl Samuel Leberecht Hermann', discoveryYear: 1817, safetyLevel: 'dangerous', description: 'Toxic metal used in nickel-cadmium batteries', commonCompounds: ['CdO', 'CdS', 'CdCl₂'] },
  { number: 49, symbol: 'In', name: 'Indium', category: 'post-transition', group: 13, period: 5, atomicMass: 114.818, electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p¹', meltingPoint: 156.6, boilingPoint: 2072, density: 7.31, uses: ['Touch screens', 'Solders', 'Semiconductors'], discoveredBy: 'Ferdinand Reich', discoveryYear: 1863, safetyLevel: 'caution', description: 'Soft metal used in LCD displays', commonCompounds: ['In₂O₃', 'InAs', 'InCl₃'] },
  { number: 50, symbol: 'Sn', name: 'Tin', category: 'post-transition', group: 14, period: 5, atomicMass: 118.710, electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p²', meltingPoint: 231.93, boilingPoint: 2602, density: 7.287, uses: ['Solders', 'Tin cans', 'Bronze'], discoveredBy: 'Ancient', discoveryYear: -3000, safetyLevel: 'safe', description: 'Essential component of bronze alloys', commonCompounds: ['SnO₂', 'SnCl₄', 'SnF₂'] },
  { number: 51, symbol: 'Sb', name: 'Antimony', category: 'metalloid', group: 15, period: 5, atomicMass: 121.760, electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p³', meltingPoint: 630.63, boilingPoint: 1587, density: 6.685, uses: ['Flame retardants', 'Alloys', 'Electronics'], discoveredBy: 'Ancient', discoveryYear: -3000, safetyLevel: 'dangerous', description: 'Brittle metalloid with flame-retardant properties', commonCompounds: ['Sb₂O₃', 'SbCl₃', 'Sb₂S₃'] },
  { number: 52, symbol: 'Te', name: 'Tellurium', category: 'metalloid', group: 16, period: 5, atomicMass: 127.60, electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p⁴', meltingPoint: 449.51, boilingPoint: 988, density: 6.232, uses: ['Solar panels', 'Thermoelectrics', 'Alloys'], discoveredBy: 'Franz-Joseph Müller von Reichenstein', discoveryYear: 1782, safetyLevel: 'dangerous', description: 'Rare metalloid with semiconductor properties', commonCompounds: ['TeO₂', 'H₂Te', 'Na₂TeO₃'] },
  { number: 53, symbol: 'I', name: 'Iodine', category: 'nonmetal', group: 17, period: 5, atomicMass: 126.90447, electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p⁵', meltingPoint: 113.7, boilingPoint: 184.3, density: 4.93, uses: ['Disinfectants', 'Thyroid treatment', 'X-ray contrast'], discoveredBy: 'Bernard Courtois', discoveryYear: 1811, safetyLevel: 'caution', description: 'Essential trace element for thyroid function', commonCompounds: ['KI', 'I₂', 'NaI'] },
  { number: 54, symbol: 'Xe', name: 'Xenon', category: 'noble-gas', group: 18, period: 5, atomicMass: 131.293, electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p⁶', meltingPoint: -111.75, boilingPoint: -108.12, density: 5.894, uses: ['Lighting', 'Anesthesia', 'Space propulsion'], discoveredBy: 'William Ramsay', discoveryYear: 1898, safetyLevel: 'safe', description: 'Heavy noble gas used in specialized lighting', commonCompounds: ['XeF₂', 'XeO₃', 'XePtF₆'] },

  // Period 6
  { number: 55, symbol: 'Cs', name: 'Cesium', category: 'alkali-metal', group: 1, period: 6, atomicMass: 132.905, electronConfiguration: '[Xe] 6s¹', meltingPoint: 28.44, boilingPoint: 671, density: 1.93, uses: ['Atomic clocks', 'Drilling fluids', 'Photocells'], discoveredBy: 'Robert Bunsen', discoveryYear: 1860, safetyLevel: 'dangerous', description: 'Most reactive metal and liquid at room temperature', commonCompounds: ['CsCl', 'Cs₂O', 'CsF'] },
  { number: 56, symbol: 'Ba', name: 'Barium', category: 'alkaline-earth', group: 2, period: 6, atomicMass: 137.327, electronConfiguration: '[Xe] 6s²', meltingPoint: 727, boilingPoint: 1870, density: 3.51, uses: ['Medical imaging', 'Fireworks', 'Glass'], discoveredBy: 'Carl Wilhelm Scheele', discoveryYear: 1772, safetyLevel: 'dangerous', description: 'Heavy alkaline earth metal used in X-ray imaging', commonCompounds: ['BaSO₄', 'BaO', 'BaCl₂'] },
  { number: 57, symbol: 'La', name: 'Lanthanum', category: 'lanthanide', group: 3, period: 6, atomicMass: 138.905, electronConfiguration: '[Xe] 5d¹ 6s²', meltingPoint: 920, boilingPoint: 3464, density: 6.162, uses: ['Camera lenses', 'Batteries', 'Catalysts'], discoveredBy: 'Carl Gustaf Mosander', discoveryYear: 1839, safetyLevel: 'caution', description: 'First element in the lanthanide series', commonCompounds: ['La₂O₃', 'LaCl₃', 'LaNi₅'] },
  { number: 58, symbol: 'Ce', name: 'Cerium', category: 'lanthanide', group: 3, period: 6, atomicMass: 140.116, electronConfiguration: '[Xe] 4f¹ 5d¹ 6s²', meltingPoint: 795, boilingPoint: 3443, density: 6.770, uses: ['Catalytic converters', 'Polishing compounds', 'Flints'], discoveredBy: 'Martin Heinrich Klaproth', discoveryYear: 1803, safetyLevel: 'caution', description: 'Most abundant rare earth element', commonCompounds: ['CeO₂', 'CeCl₃', 'Ce₂(SO₄)₃'] },
  { number: 59, symbol: 'Pr', name: 'Praseodymium', category: 'lanthanide', group: 3, period: 6, atomicMass: 140.908, electronConfiguration: '[Xe] 4f³ 6s²', meltingPoint: 935, boilingPoint: 3520, density: 6.77, uses: ['Aircraft engines', 'Glass coloring', 'Magnets'], discoveredBy: 'Carl Auer von Welsbach', discoveryYear: 1885, safetyLevel: 'caution', description: 'Rare earth metal used in strong magnets', commonCompounds: ['Pr₂O₃', 'PrCl₃', 'PrF₃'] },
  { number: 60, symbol: 'Nd', name: 'Neodymium', category: 'lanthanide', group: 3, period: 6, atomicMass: 144.242, electronConfiguration: '[Xe] 4f⁴ 6s²', meltingPoint: 1024, boilingPoint: 3074, density: 7.01, uses: ['Powerful magnets', 'Lasers', 'Glass coloring'], discoveredBy: 'Carl Auer von Welsbach', discoveryYear: 1885, safetyLevel: 'caution', description: 'Key component of neodymium magnets', commonCompounds: ['Nd₂O₃', 'NdCl₃', 'NdFeB'] },
  { number: 61, symbol: 'Pm', name: 'Promethium', category: 'lanthanide', group: 3, period: 6, atomicMass: 145, electronConfiguration: '[Xe] 4f⁵ 6s²', meltingPoint: 1042, boilingPoint: 3000, density: 7.26, uses: ['Nuclear batteries', 'Luminescent paint', 'Research'], discoveredBy: 'Jacob A. Marinsky', discoveryYear: 1945, safetyLevel: 'dangerous', description: 'Radioactive rare earth element', commonCompounds: ['PmCl₃', 'Pm₂O₃', 'Pm(NO₃)₃'] },
  { number: 62, symbol: 'Sm', name: 'Samarium', category: 'lanthanide', group: 3, period: 6, atomicMass: 150.36, electronConfiguration: '[Xe] 4f⁶ 6s²', meltingPoint: 1072, boilingPoint: 1900, density: 7.52, uses: ['Magnets', 'Cancer treatment', 'Nuclear reactors'], discoveredBy: 'Paul-Émile Lecoq de Boisbaudran', discoveryYear: 1879, safetyLevel: 'caution', description: 'Magnetic rare earth element', commonCompounds: ['Sm₂O₃', 'SmCl₃', 'SmCo₅'] },
  { number: 63, symbol: 'Eu', name: 'Europium', category: 'lanthanide', group: 3, period: 6, atomicMass: 151.964, electronConfiguration: '[Xe] 4f⁷ 6s²', meltingPoint: 822, boilingPoint: 1597, density: 5.244, uses: ['Euro banknotes', 'TV screens', 'Lasers'], discoveredBy: 'Eugène-Anatole Demarçay', discoveryYear: 1901, safetyLevel: 'caution', description: 'Most reactive rare earth element', commonCompounds: ['Eu₂O₃', 'EuCl₃', 'EuF₃'] },
  { number: 64, symbol: 'Gd', name: 'Gadolinium', category: 'lanthanide', group: 3, period: 6, atomicMass: 157.25, electronConfiguration: '[Xe] 4f⁷ 5d¹ 6s²', meltingPoint: 1312, boilingPoint: 3273, density: 7.90, uses: ['MRI contrast', 'Nuclear reactors', 'Data storage'], discoveredBy: 'Jean Charles Galissard de Marignac', discoveryYear: 1880, safetyLevel: 'caution', description: 'Highest neutron absorption cross-section', commonCompounds: ['Gd₂O₃', 'GdCl₃', 'Gd-DTPA'] },
  { number: 65, symbol: 'Tb', name: 'Terbium', category: 'lanthanide', group: 3, period: 6, atomicMass: 158.925, electronConfiguration: '[Xe] 4f⁹ 6s²', meltingPoint: 1356, boilingPoint: 3230, density: 8.23, uses: ['Solid-state devices', 'Fuel cells', 'Sonar systems'], discoveredBy: 'Carl Gustaf Mosander', discoveryYear: 1843, safetyLevel: 'caution', description: 'Rare earth metal used in green phosphors', commonCompounds: ['Tb₂O₃', 'TbCl₃', 'TbF₃'] },
  { number: 66, symbol: 'Dy', name: 'Dysprosium', category: 'lanthanide', group: 3, period: 6, atomicMass: 162.500, electronConfiguration: '[Xe] 4f¹⁰ 6s²', meltingPoint: 1407, boilingPoint: 2567, density: 8.55, uses: ['Neodymium magnets', 'Nuclear reactors', 'Data storage'], discoveredBy: 'Paul-Émile Lecoq de Boisbaudran', discoveryYear: 1886, safetyLevel: 'caution', description: 'Essential for high-temperature magnets', commonCompounds: ['Dy₂O₃', 'DyCl₃', 'DyF₃'] },
  { number: 67, symbol: 'Ho', name: 'Holmium', category: 'lanthanide', group: 3, period: 6, atomicMass: 164.930, electronConfiguration: '[Xe] 4f¹¹ 6s²', meltingPoint: 1461, boilingPoint: 2720, density: 8.80, uses: ['Nuclear control rods', 'Lasers', 'Magnets'], discoveredBy: 'Marc Delafontaine', discoveryYear: 1878, safetyLevel: 'caution', description: 'Highest magnetic strength of any element', commonCompounds: ['Ho₂O₃', 'HoCl₃', 'HoF₃'] },
  { number: 68, symbol: 'Er', name: 'Erbium', category: 'lanthanide', group: 3, period: 6, atomicMass: 167.259, electronConfiguration: '[Xe] 4f¹² 6s²', meltingPoint: 1529, boilingPoint: 2868, density: 9.07, uses: ['Fiber optics', 'Lasers', 'Nuclear technology'], discoveredBy: 'Carl Gustaf Mosander', discoveryYear: 1843, safetyLevel: 'caution', description: 'Key element in fiber optic amplification', commonCompounds: ['Er₂O₃', 'ErCl₃', 'ErF₃'] },
  { number: 69, symbol: 'Tm', name: 'Thulium', category: 'lanthanide', group: 3, period: 6, atomicMass: 168.934, electronConfiguration: '[Xe] 4f¹³ 6s²', meltingPoint: 1545, boilingPoint: 1950, density: 9.32, uses: ['Portable X-rays', 'Lasers', 'Euro banknotes'], discoveredBy: 'Per Teodor Cleve', discoveryYear: 1879, safetyLevel: 'caution', description: 'Rarest naturally occurring rare earth', commonCompounds: ['Tm₂O₃', 'TmCl₃', 'TmF₃'] },
  { number: 70, symbol: 'Yb', name: 'Ytterbium', category: 'lanthanide', group: 3, period: 6, atomicMass: 173.045, electronConfiguration: '[Xe] 4f¹⁴ 6s²', meltingPoint: 819, boilingPoint: 1196, density: 6.90, uses: ['Atomic clocks', 'Stress gauges', 'Lasers'], discoveredBy: 'Jean Charles Galissard de Marignac', discoveryYear: 1878, safetyLevel: 'caution', description: 'Stable divalent rare earth metal', commonCompounds: ['Yb₂O₃', 'YbCl₃', 'YbF₃'] },
  { number: 71, symbol: 'Lu', name: 'Lutetium', category: 'lanthanide', group: 3, period: 6, atomicMass: 174.967, electronConfiguration: '[Xe] 4f¹⁴ 5d¹ 6s²', meltingPoint: 1663, boilingPoint: 3402, density: 9.84, uses: ['PET scans', 'Catalysts', 'LEDs'], discoveredBy: 'Georges Urbain', discoveryYear: 1907, safetyLevel: 'caution', description: 'Hardest and densest rare earth element', commonCompounds: ['Lu₂O₃', 'LuCl₃', 'LuF₃'] },
  { number: 72, symbol: 'Hf', name: 'Hafnium', category: 'transition-metal', group: 4, period: 6, atomicMass: 178.49, electronConfiguration: '[Xe] 4f¹⁴ 5d² 6s²', meltingPoint: 2233, boilingPoint: 4603, density: 13.31, uses: ['Nuclear reactors', 'Microprocessors', 'Plasma cutting'], discoveredBy: 'Dirk Coster', discoveryYear: 1923, safetyLevel: 'caution', description: 'High neutron absorption capacity', commonCompounds: ['HfO₂', 'HfCl₄', 'HfC'] },
  { number: 73, symbol: 'Ta', name: 'Tantalum', category: 'transition-metal', group: 5, period: 6, atomicMass: 180.948, electronConfiguration: '[Xe] 4f¹⁴ 5d³ 6s²', meltingPoint: 3017, boilingPoint: 5458, density: 16.69, uses: ['Electronics', 'Surgical implants', 'Superalloys'], discoveredBy: 'Anders Gustaf Ekeberg', discoveryYear: 1802, safetyLevel: 'safe', description: 'Highly corrosion-resistant metal', commonCompounds: ['Ta₂O₅', 'TaC', 'K₂TaF₇'] },
  { number: 74, symbol: 'W', name: 'Tungsten', category: 'transition-metal', group: 6, period: 6, atomicMass: 183.84, electronConfiguration: '[Xe] 4f¹⁴ 5d⁴ 6s²', meltingPoint: 3422, boilingPoint: 5930, density: 19.25, uses: ['Filaments', 'Armor piercing', 'Alloys'], discoveredBy: 'Fausto Elhuyar', discoveryYear: 1783, safetyLevel: 'caution', description: 'Highest melting point of all elements', commonCompounds: ['WO₃', 'WC', 'WF₆'] },
  { number: 75, symbol: 'Re', name: 'Rhenium', category: 'transition-metal', group: 7, period: 6, atomicMass: 186.207, electronConfiguration: '[Xe] 4f¹⁴ 5d⁵ 6s²', meltingPoint: 3186, boilingPoint: 5596, density: 21.02, uses: ['Jet engines', 'Catalysts', 'Thermocouples'], discoveredBy: 'Masataka Ogawa', discoveryYear: 1908, safetyLevel: 'safe', description: 'Last naturally occurring element discovered', commonCompounds: ['Re₂O₇', 'ReCl₃', 'KReO₄'] },
  { number: 76, symbol: 'Os', name: 'Osmium', category: 'transition-metal', group: 8, period: 6, atomicMass: 190.23, electronConfiguration: '[Xe] 4f¹⁴ 5d⁶ 6s²', meltingPoint: 3033, boilingPoint: 5012, density: 22.59, uses: ['Electrical contacts', 'Fountain pen tips', 'Alloys'], discoveredBy: 'Smithson Tennant', discoveryYear: 1803, safetyLevel: 'dangerous', description: 'Densest naturally occurring element', commonCompounds: ['OsO₄', 'OsCl₃', 'OsS₂'] },
  { number: 77, symbol: 'Ir', name: 'Iridium', category: 'transition-metal', group: 9, period: 6, atomicMass: 192.217, electronConfiguration: '[Xe] 4f¹⁴ 5d⁷ 6s²', meltingPoint: 2466, boilingPoint: 4428, density: 22.56, uses: ['Spark plugs', 'Crucibles', 'Pen tips'], discoveredBy: 'Smithson Tennant', discoveryYear: 1803, safetyLevel: 'safe', description: 'Most corrosion-resistant metal', commonCompounds: ['IrO₂', 'IrCl₃', 'K₂IrCl₆'] },
  { number: 78, symbol: 'Pt', name: 'Platinum', category: 'transition-metal', group: 10, period: 6, atomicMass: 195.084, electronConfiguration: '[Xe] 4f¹⁴ 5d⁹ 6s¹', meltingPoint: 1768.3, boilingPoint: 3825, density: 21.46, uses: ['Catalytic converters', 'Jewelry', 'Lab equipment'], discoveredBy: 'Antonio de Ulloa', discoveryYear: 1735, safetyLevel: 'safe', description: 'Precious metal with catalytic properties', commonCompounds: ['PtO₂', 'H₂PtCl₆', 'PtCl₂'] },
  { number: 79, symbol: 'Au', name: 'Gold', category: 'transition-metal', group: 11, period: 6, atomicMass: 196.967, electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', meltingPoint: 1064.18, boilingPoint: 2856, density: 19.282, uses: ['Jewelry', 'Electronics', 'Currency'], discoveredBy: 'Ancient', discoveryYear: -2600, safetyLevel: 'safe', description: 'Noble metal, resistant to corrosion', commonCompounds: ['AuCl₃', 'Au₂O₃', 'HAuCl₄'] },
  { number: 80, symbol: 'Hg', name: 'Mercury', category: 'post-transition', group: 12, period: 6, atomicMass: 200.592, electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', meltingPoint: -38.83, boilingPoint: 356.73, density: 13.5336, uses: ['Thermometers', 'Fluorescent lights', 'Dental amalgams'], discoveredBy: 'Ancient', discoveryYear: -1500, safetyLevel: 'dangerous', description: 'Only metal liquid at room temperature', commonCompounds: ['HgO', 'HgCl₂', 'HgS'] },
  { number: 81, symbol: 'Tl', name: 'Thallium', category: 'post-transition', group: 13, period: 6, atomicMass: 204.38, electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', meltingPoint: 304, boilingPoint: 1473, density: 11.85, uses: ['Electronics', 'Infrared optics', 'Rodenticides'], discoveredBy: 'William Crookes', discoveryYear: 1861, safetyLevel: 'dangerous', description: 'Highly toxic metal with specialized applications', commonCompounds: ['Tl₂O', 'TlCl', 'Tl₂SO₄'] },
  { number: 82, symbol: 'Pb', name: 'Lead', category: 'post-transition', group: 14, period: 6, atomicMass: 207.2, electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', meltingPoint: 327.46, boilingPoint: 1749, density: 11.342, uses: ['Batteries', 'Radiation shielding', 'Paint (historical)'], discoveredBy: 'Ancient', discoveryYear: -7000, safetyLevel: 'dangerous', description: 'Heavy, toxic metal', commonCompounds: ['PbO', 'PbSO₄', 'PbS'] },
  { number: 83, symbol: 'Bi', name: 'Bismuth', category: 'post-transition', group: 15, period: 6, atomicMass: 208.980, electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', meltingPoint: 271.5, boilingPoint: 1564, density: 9.78, uses: ['Pharmaceuticals', 'Cosmetics', 'Fire sprinklers'], discoveredBy: 'Claude François Geoffroy', discoveryYear: 1753, safetyLevel: 'safe', description: 'Least toxic heavy metal', commonCompounds: ['Bi₂O₃', 'BiCl₃', 'BiONO₃'] },
  { number: 84, symbol: 'Po', name: 'Polonium', category: 'post-transition', group: 16, period: 6, atomicMass: 209, electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', meltingPoint: 254, boilingPoint: 962, density: 9.32, uses: ['Nuclear batteries', 'Static eliminators', 'Research'], discoveredBy: 'Marie Curie', discoveryYear: 1898, safetyLevel: 'dangerous', description: 'Highly radioactive element', commonCompounds: ['PoO₂', 'PoCl₂', 'PoH₂'] },
  { number: 85, symbol: 'At', name: 'Astatine', category: 'metalloid', group: 17, period: 6, atomicMass: 210, electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', meltingPoint: 302, boilingPoint: 337, density: 7, uses: ['Cancer treatment', 'Research', 'Isotope tracers'], discoveredBy: 'Dale R. Corson', discoveryYear: 1940, safetyLevel: 'dangerous', description: 'Rarest naturally occurring element', commonCompounds: ['At₂', 'NaAt', 'HAt'] },
  { number: 86, symbol: 'Rn', name: 'Radon', category: 'noble-gas', group: 18, period: 6, atomicMass: 222, electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', meltingPoint: -71, boilingPoint: -61.7, density: 9.73, uses: ['Cancer treatment', 'Earthquake prediction', 'Radiotherapy'], discoveredBy: 'Friedrich Ernst Dorn', discoveryYear: 1900, safetyLevel: 'dangerous', description: 'Radioactive gas and health hazard', commonCompounds: ['RnF₂', 'RnO₃', 'RnPtF₆'] },

  // Period 7
  { number: 87, symbol: 'Fr', name: 'Francium', category: 'alkali-metal', group: 1, period: 7, atomicMass: 223, electronConfiguration: '[Rn] 7s¹', meltingPoint: 27, boilingPoint: 677, density: 1.87, uses: ['Research', 'Atomic structure studies', 'Radiography'], discoveredBy: 'Marguerite Perey', discoveryYear: 1939, safetyLevel: 'dangerous', description: 'Second rarest naturally occurring element', commonCompounds: ['FrCl', 'Fr₂O', 'FrF'] },
  { number: 88, symbol: 'Ra', name: 'Radium', category: 'alkaline-earth', group: 2, period: 7, atomicMass: 226, electronConfiguration: '[Rn] 7s²', meltingPoint: 700, boilingPoint: 1737, density: 5.5, uses: ['Luminescent paint', 'Cancer treatment', 'Industrial radiography'], discoveredBy: 'Marie Curie', discoveryYear: 1898, safetyLevel: 'dangerous', description: 'Highly radioactive alkaline earth metal', commonCompounds: ['RaCl₂', 'RaSO₄', 'Ra(OH)₂'] },
  { number: 89, symbol: 'Ac', name: 'Actinium', category: 'actinide', group: 3, period: 7, atomicMass: 227, electronConfiguration: '[Rn] 6d¹ 7s²', meltingPoint: 1050, boilingPoint: 3200, density: 10.07, uses: ['Neutron sources', 'Cancer treatment', 'Thermoelectric generators'], discoveredBy: 'André-Louis Debierne', discoveryYear: 1899, safetyLevel: 'dangerous', description: 'First element in the actinide series', commonCompounds: ['Ac₂O₃', 'AcF₃', 'AcCl₃'] },
  { number: 90, symbol: 'Th', name: 'Thorium', category: 'actinide', group: 3, period: 7, atomicMass: 232.038, electronConfiguration: '[Rn] 6d² 7s²', meltingPoint: 1750, boilingPoint: 4788, density: 11.7, uses: ['Nuclear fuel', 'Gas mantles', 'Alloys'], discoveredBy: 'Jöns Jakob Berzelius', discoveryYear: 1829, safetyLevel: 'dangerous', description: 'Radioactive actinide with potential as nuclear fuel', commonCompounds: ['ThO₂', 'ThCl₄', 'ThF₄'] },
  { number: 91, symbol: 'Pa', name: 'Protactinium', category: 'actinide', group: 3, period: 7, atomicMass: 231.036, electronConfiguration: '[Rn] 5f² 6d¹ 7s²', meltingPoint: 1568, boilingPoint: 4027, density: 15.37, uses: ['Scientific research', 'Radiometric dating', 'Nuclear physics'], discoveredBy: 'William Crookes', discoveryYear: 1913, safetyLevel: 'dangerous', description: 'Rare and highly radioactive actinide', commonCompounds: ['Pa₂O₅', 'PaCl₅', 'PaF₄'] },
  { number: 92, symbol: 'U', name: 'Uranium', category: 'actinide', group: 3, period: 7, atomicMass: 238.029, electronConfiguration: '[Rn] 5f³ 6d¹ 7s²', meltingPoint: 1135, boilingPoint: 4131, density: 18.95, uses: ['Nuclear fuel', 'Nuclear weapons', 'Dating'], discoveredBy: 'Martin Heinrich Klaproth', discoveryYear: 1789, safetyLevel: 'dangerous', description: 'Radioactive actinide element', commonCompounds: ['UO₂', 'UF₆', 'U₃O₈'] },
  { number: 93, symbol: 'Np', name: 'Neptunium', category: 'actinide', group: 3, period: 7, atomicMass: 237, electronConfiguration: '[Rn] 5f⁴ 6d¹ 7s²', meltingPoint: 637, boilingPoint: 4000, density: 20.45, uses: ['Neutron detection', 'Research', 'Nuclear physics'], discoveredBy: 'Edwin McMillan', discoveryYear: 1940, safetyLevel: 'dangerous', description: 'First transuranic element discovered', commonCompounds: ['NpO₂', 'NpF₃', 'NpCl₃'] },
  { number: 94, symbol: 'Pu', name: 'Plutonium', category: 'actinide', group: 3, period: 7, atomicMass: 244, electronConfiguration: '[Rn] 5f⁶ 7s²', meltingPoint: 639.4, boilingPoint: 3228, density: 19.84, uses: ['Nuclear weapons', 'Spacecraft power', 'Research reactors'], discoveredBy: 'Glenn T. Seaborg', discoveryYear: 1940, safetyLevel: 'dangerous', description: 'Key element in nuclear weapons technology', commonCompounds: ['PuO₂', 'PuF₄', 'PuCl₃'] },
  { number: 95, symbol: 'Am', name: 'Americium', category: 'actinide', group: 3, period: 7, atomicMass: 243, electronConfiguration: '[Rn] 5f⁷ 7s²', meltingPoint: 1176, boilingPoint: 2607, density: 12, uses: ['Smoke detectors', 'Neutron sources', 'Industrial gauges'], discoveredBy: 'Glenn T. Seaborg', discoveryYear: 1944, safetyLevel: 'dangerous', description: 'Synthetic element used in household smoke detectors', commonCompounds: ['AmO₂', 'AmF₃', 'AmCl₃'] },
  { number: 96, symbol: 'Cm', name: 'Curium', category: 'actinide', group: 3, period: 7, atomicMass: 247, electronConfiguration: '[Rn] 5f⁷ 6d¹ 7s²', meltingPoint: 1340, boilingPoint: 3110, density: 13.51, uses: ['Spacecraft power', 'Research', 'X-ray spectrometers'], discoveredBy: 'Glenn T. Seaborg', discoveryYear: 1944, safetyLevel: 'dangerous', description: 'Highly radioactive actinide element', commonCompounds: ['Cm₂O₃', 'CmF₃', 'CmCl₃'] },
  { number: 97, symbol: 'Bk', name: 'Berkelium', category: 'actinide', group: 3, period: 7, atomicMass: 247, electronConfiguration: '[Rn] 5f⁹ 7s²', meltingPoint: 986, boilingPoint: 2627, density: 14.78, uses: ['Scientific research', 'Synthesis of heavier elements', 'Nuclear physics'], discoveredBy: 'Glenn T. Seaborg', discoveryYear: 1949, safetyLevel: 'dangerous', description: 'Synthetic element named after Berkeley', commonCompounds: ['Bk₂O₃', 'BkF₃', 'BkCl₃'] },
  { number: 98, symbol: 'Cf', name: 'Californium', category: 'actinide', group: 3, period: 7, atomicMass: 251, electronConfiguration: '[Rn] 5f¹⁰ 7s²', meltingPoint: 900, boilingPoint: 1470, density: 15.1, uses: ['Neutron sources', 'Cancer treatment', 'Material analysis'], discoveredBy: 'Glenn T. Seaborg', discoveryYear: 1950, safetyLevel: 'dangerous', description: 'Powerful neutron emitter', commonCompounds: ['Cf₂O₃', 'CfF₃', 'CfCl₃'] },
  { number: 99, symbol: 'Es', name: 'Einsteinium', category: 'actinide', group: 3, period: 7, atomicMass: 252, electronConfiguration: '[Rn] 5f¹¹ 7s²', meltingPoint: 860, boilingPoint: 996, density: 8.84, uses: ['Scientific research', 'Synthesis of heavier elements', 'Nuclear studies'], discoveredBy: 'Lawrence Berkeley Laboratory', discoveryYear: 1952, safetyLevel: 'dangerous', description: 'Synthetic element discovered in nuclear fallout', commonCompounds: ['Es₂O₃', 'EsCl₃', 'EsF₃'] },
  { number: 100, symbol: 'Fm', name: 'Fermium', category: 'actinide', group: 3, period: 7, atomicMass: 257, electronConfiguration: '[Rn] 5f¹² 7s²', meltingPoint: 1527, boilingPoint: 1950, density: 9.7, uses: ['Scientific research', 'Nuclear physics', 'Element synthesis'], discoveredBy: 'Lawrence Berkeley Laboratory', discoveryYear: 1952, safetyLevel: 'dangerous', description: 'Synthetic element with no practical applications', commonCompounds: ['Fm₂O₃', 'FmF₃', 'FmCl₃'] },
  { number: 101, symbol: 'Md', name: 'Mendelevium', category: 'actinide', group: 3, period: 7, atomicMass: 258, electronConfiguration: '[Rn] 5f¹³ 7s²', meltingPoint: 827, boilingPoint: 1527, density: 10.3, uses: ['Scientific research', 'Nuclear studies', 'Element synthesis'], discoveredBy: 'Lawrence Berkeley Laboratory', discoveryYear: 1955, safetyLevel: 'dangerous', description: 'First element synthesized one atom at a time', commonCompounds: ['MdCl₂', 'MdF₃', 'MdO'] },
  { number: 102, symbol: 'No', name: 'Nobelium', category: 'actinide', group: 3, period: 7, atomicMass: 259, electronConfiguration: '[Rn] 5f¹⁴ 7s²', meltingPoint: 827, boilingPoint: 1527, density: 9.9, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Joint Institute for Nuclear Research', discoveryYear: 1966, safetyLevel: 'dangerous', description: 'Synthetic element with no stable isotopes', commonCompounds: ['NoCl₂', 'NoF₃', 'NoO'] },
  { number: 103, symbol: 'Lr', name: 'Lawrencium', category: 'actinide', group: 3, period: 7, atomicMass: 266, electronConfiguration: '[Rn] 5f¹⁴ 7s² 7p¹', meltingPoint: 1627, boilingPoint: 1527, density: 14.4, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Lawrence Berkeley Laboratory', discoveryYear: 1961, safetyLevel: 'dangerous', description: 'Last element in the actinide series', commonCompounds: ['LrCl₃', 'LrF₃', 'Lr₂O₃'] },
  { number: 104, symbol: 'Rf', name: 'Rutherfordium', category: 'transition-metal', group: 4, period: 7, atomicMass: 267, electronConfiguration: '[Rn] 5f¹⁴ 6d² 7s²', meltingPoint: 2100, boilingPoint: 5500, density: 23.2, uses: ['Scientific research', 'Nuclear studies', 'Element synthesis'], discoveredBy: 'Joint Institute for Nuclear Research', discoveryYear: 1964, safetyLevel: 'dangerous', description: 'First transactinide element', commonCompounds: ['RfCl₄', 'RfO₂', 'RfBr₄'] },
  { number: 105, symbol: 'Db', name: 'Dubnium', category: 'transition-metal', group: 5, period: 7, atomicMass: 268, electronConfiguration: '[Rn] 5f¹⁴ 6d³ 7s²', meltingPoint: 2900, boilingPoint: 6200, density: 29.3, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Joint Institute for Nuclear Research', discoveryYear: 1968, safetyLevel: 'dangerous', description: 'Highly radioactive synthetic element', commonCompounds: ['DbCl₅', 'Db₂O₅', 'DbBr₅'] },
  { number: 106, symbol: 'Sg', name: 'Seaborgium', category: 'transition-metal', group: 6, period: 7, atomicMass: 269, electronConfiguration: '[Rn] 5f¹⁴ 6d⁴ 7s²', meltingPoint: 2900, boilingPoint: 6200, density: 35.0, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Lawrence Berkeley Laboratory', discoveryYear: 1974, safetyLevel: 'dangerous', description: 'Synthetic element named after Glenn T. Seaborg', commonCompounds: ['SgO₃', 'SgCl₆', 'SgO₂Cl₂'] },
  { number: 107, symbol: 'Bh', name: 'Bohrium', category: 'transition-metal', group: 7, period: 7, atomicMass: 270, electronConfiguration: '[Rn] 5f¹⁴ 6d⁵ 7s²', meltingPoint: 2900, boilingPoint: 6200, density: 37.1, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Gesellschaft für Schwerionenforschung', discoveryYear: 1981, safetyLevel: 'dangerous', description: 'Synthetic element named after Niels Bohr', commonCompounds: ['Bh₂O₇', 'BhO₃', 'BhCl₇'] },
  { number: 108, symbol: 'Hs', name: 'Hassium', category: 'transition-metal', group: 8, period: 7, atomicMass: 269, electronConfiguration: '[Rn] 5f¹⁴ 6d⁶ 7s²', meltingPoint: 2900, boilingPoint: 6200, density: 40.7, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Gesellschaft für Schwerionenforschung', discoveryYear: 1984, safetyLevel: 'dangerous', description: 'Synthetic element with extremely short half-life', commonCompounds: ['HsO₄', 'HsCl₄', 'HsF₆'] },
  { number: 109, symbol: 'Mt', name: 'Meitnerium', category: 'transition-metal', group: 9, period: 7, atomicMass: 278, electronConfiguration: '[Rn] 5f¹⁴ 6d⁷ 7s²', meltingPoint: 2900, boilingPoint: 6200, density: 37.4, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Gesellschaft für Schwerionenforschung', discoveryYear: 1982, safetyLevel: 'dangerous', description: 'Synthetic element named after Lise Meitner', commonCompounds: ['MtO₃', 'MtCl₆', 'MtF₆'] },
  { number: 110, symbol: 'Ds', name: 'Darmstadtium', category: 'transition-metal', group: 10, period: 7, atomicMass: 281, electronConfiguration: '[Rn] 5f¹⁴ 6d⁹ 7s¹', meltingPoint: 2900, boilingPoint: 6200, density: 34.8, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Gesellschaft für Schwerionenforschung', discoveryYear: 1994, safetyLevel: 'dangerous', description: 'Synthetic element first created in Darmstadt', commonCompounds: ['DsO', 'DsCl₂', 'DsF₄'] },
  { number: 111, symbol: 'Rg', name: 'Roentgenium', category: 'transition-metal', group: 11, period: 7, atomicMass: 282, electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s¹', meltingPoint: 2900, boilingPoint: 6200, density: 28.7, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Gesellschaft für Schwerionenforschung', discoveryYear: 1994, safetyLevel: 'dangerous', description: 'Synthetic element named after Wilhelm Röntgen', commonCompounds: ['RgCl', 'RgF', 'Rg₂O'] },
  { number: 112, symbol: 'Cn', name: 'Copernicium', category: 'transition-metal', group: 12, period: 7, atomicMass: 285, electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s²', meltingPoint: 2900, boilingPoint: 6200, density: 23.7, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Gesellschaft für Schwerionenforschung', discoveryYear: 1996, safetyLevel: 'dangerous', description: 'Synthetic element named after Nicolaus Copernicus', commonCompounds: ['CnCl₂', 'CnO', 'CnF₂'] },
  { number: 113, symbol: 'Nh', name: 'Nihonium', category: 'post-transition', group: 13, period: 7, atomicMass: 286, electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', meltingPoint: 700, boilingPoint: 1400, density: 16, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Joint Institute for Nuclear Research', discoveryYear: 2003, safetyLevel: 'dangerous', description: 'First element discovered in Asia (Japan)', commonCompounds: ['NhCl', 'NhF', 'Nh₂O'] },
  { number: 114, symbol: 'Fl', name: 'Flerovium', category: 'post-transition', group: 14, period: 7, atomicMass: 289, electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', meltingPoint: 200, boilingPoint: 380, density: 14, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Joint Institute for Nuclear Research', discoveryYear: 1998, safetyLevel: 'dangerous', description: 'Superheavy element with potential unusual properties', commonCompounds: ['FlCl₂', 'FlO', 'FlF₂'] },
  { number: 115, symbol: 'Mc', name: 'Moscovium', category: 'post-transition', group: 15, period: 7, atomicMass: 290, electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³', meltingPoint: 700, boilingPoint: 1400, density: 13.5, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Joint Institute for Nuclear Research', discoveryYear: 2003, safetyLevel: 'dangerous', description: 'Synthetic element named after Moscow region', commonCompounds: ['McCl₃', 'McF₃', 'Mc₂O₃'] },
  { number: 116, symbol: 'Lv', name: 'Livermorium', category: 'post-transition', group: 16, period: 7, atomicMass: 293, electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', meltingPoint: 700, boilingPoint: 1100, density: 12.9, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Joint Institute for Nuclear Research', discoveryYear: 2000, safetyLevel: 'dangerous', description: 'Superheavy element with very short half-life', commonCompounds: ['LvO₂', 'LvCl₂', 'LvF₂'] },
  { number: 117, symbol: 'Ts', name: 'Tennessine', category: 'metalloid', group: 17, period: 7, atomicMass: 294, electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', meltingPoint: 723, boilingPoint: 883, density: 7.2, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Joint Institute for Nuclear Research', discoveryYear: 2010, safetyLevel: 'dangerous', description: 'Second-heaviest known element', commonCompounds: ['TsCl', 'TsF', 'TsAt'] },
  { number: 118, symbol: 'Og', name: 'Oganesson', category: 'noble-gas', group: 18, period: 7, atomicMass: 294, electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶', meltingPoint: 325, boilingPoint: 450, density: 7, uses: ['Scientific research', 'Nuclear physics', 'Element studies'], discoveredBy: 'Joint Institute for Nuclear Research', discoveryYear: 2002, safetyLevel: 'dangerous', description: 'Heaviest known element and last of period 7', commonCompounds: ['OgF₂', 'OgF₄', 'OgO'] }

];
  const getCategoryColor = (category: string): string => {
    const colors = {
      'alkali-metal': 'bg-red-500 hover:bg-red-400',
      'alkaline-earth': 'bg-orange-500 hover:bg-orange-400',
      'transition-metal': 'bg-yellow-500 hover:bg-yellow-400',
      'post-transition': 'bg-green-500 hover:bg-green-400',
      'metalloid': 'bg-teal-500 hover:bg-teal-400',
      'nonmetal': 'bg-blue-500 hover:bg-blue-400',
      'noble-gas': 'bg-purple-500 hover:bg-purple-400',
      'lanthanide': 'bg-pink-500 hover:bg-pink-400',
      'actinide': 'bg-rose-500 hover:bg-rose-400'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500 hover:bg-gray-400';
  };

  const getSafetyIcon = (level: string) => {
    switch (level) {
      case 'safe': return '🟢';
      case 'caution': return '🟡';
      case 'dangerous': return '🔴';
      default: return '⚪';
    }
  };
  const getSafetyText = (level: string) => {
    switch (level) {
      case 'safe': return 'Safe to handle';
      case 'caution': return 'Caution required';
      case 'dangerous': return 'Dangerous - Expert only';
      default: return 'Unknown';
    }
  };

  const filteredElements = elements.filter(element => {
    const matchesSearch = element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         element.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         element.number.toString().includes(searchTerm);
    const matchesCategory = filterCategory === 'all' || element.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(elements.map(e => e.category)))];
  const handleMouseEnter = (element: Element, event: React.MouseEvent) => {
    setHoveredElement(element);
    
    // Calculate tooltip position
    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    
    let x = rect.left + rect.width / 2 - tooltipWidth / 2;
    let y = rect.top - tooltipHeight - 10;
    
    // Adjust for screen edges
    if (x < 10) x = 10;
    if (x + tooltipWidth > window.innerWidth - 10) x = window.innerWidth - tooltipWidth - 10;
    if (y < 10) y = rect.bottom + 10;
    
    setTooltipPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setHoveredElement(null);
  };

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) { // Only stop if it's currently listening
      recognitionRef.current.stop(); 
      console.log('Speech recognition stopped manually.');
    }
    // The onend event handler will handle final cleanup and state update.
  }, [isListening]); // Only re-create if isListening changes

  const handleUserVoiceInput = useCallback(async (transcript: string) => {
    if (!selectedElement) return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: transcript,
      sender: 'user' as const,
      timestamp: new Date()
    };
    
    setVoiceConversation(prev => ({
      messages: [...prev.messages, userMessage]
    }));
    
    if (transcript.trim().length < 3) {
      console.warn('Empty or very short transcript, not sending to AI.');
      const retryMessage = "I didn't quite catch that. Could you please rephrase or speak a bit clearer?";
      setVoiceConversation(prev => ({
        messages: [...prev.messages, {
          id: (Date.now() + 1).toString(),
          text: retryMessage,
          sender: 'ai' as const,
          timestamp: new Date()
        }]
      }));
      setIsSpeaking(true);
      elevenLabsService.streamTextToSpeech(retryMessage, {
          onComplete: () => {
            setIsSpeaking(false);
          },
          onError: (error) => {
            console.error('Error speaking retry message:', error);
            setIsSpeaking(false);
          }
      });
      return;
    }

    if (!elevenLabsService.isAvailable()) {
        console.error('ElevenLabs API not available. Cannot generate AI response.');
        setVoiceConversation(prev => ({
            messages: [...prev.messages, {
                id: (Date.now() + 1).toString(),
                text: "(AI service is not configured. Please check API key.)",
                sender: 'ai' as const,
                timestamp: new Date()
            }]
        }));
        return;
    }

    setIsSpeaking(true); // Indicate AI is thinking/speaking
    
    try {
      // Step 1: Generate the text response using the LLM via ElevenLabsService
      // This call will now use the LLMService internally in elevenLabsService
      const textResponse = await elevenLabsService.generateElementConversation(
        selectedElement.symbol,
        selectedElement.name,
        // transcript
      );
      
      // Add AI text response to conversation
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: textResponse, // Use the text generated by the LLM
        sender: 'ai' as const,
        timestamp: new Date()
      };
      
      setVoiceConversation(prev => ({
        messages: [...prev.messages, aiMessage]
      }));
      
      // Step 2: Speak the generated text response using ElevenLabs TTS
      await elevenLabsService.streamTextToSpeech(textResponse, {
        onComplete: () => {
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('Speech synthesis error:', error);
          setIsSpeaking(false);
          setVoiceConversation(prev => ({
            messages: [...prev.messages, {
              id: (Date.now() + 2).toString(),
              text: "(Error speaking response. Please check ElevenLabs API or network.)",
              sender: 'ai' as const,
              timestamp: new Date()
            }]
          }));
        }
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      setIsSpeaking(false);
      setVoiceConversation(prev => ({
        messages: [...prev.messages, {
          id: (Date.now() + 1).toString(),
          text: "(Sorry, I encountered an error trying to generate a response.)",
          sender: 'ai' as const,
          timestamp: new Date()
        }]
      }));
    }
  }, [selectedElement]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      if (!recognitionRef.current) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
    }
      
      const currentRecognition = recognitionRef.current; // Capture current ref

      const handleRecognitionResult = (event: any) => {
        setIsListening(false); 
        const transcript = event.results[0][0].transcript;
        console.log('Speech Recognition Result:', transcript);
        // Use the memoized callback here
        handleUserVoiceInput(transcript); 
      };

      const handleRecognitionError = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceConversation(prev => ({
          messages: [...prev.messages, {
            id: Date.now().toString(),
            text: `(Error: Could not understand. Please try again. Error: ${event.error})`,
            sender: 'ai' as const,
            timestamp: new Date()
          }]
        }));
      };

      const handleRecognitionEnd = () => {
        console.log('Speech recognition ended.');
        setIsListening(false); 
        // Cleanup microphone stream and animation loop after recognition session ends
        if (microphoneStreamRef.current) {
          microphoneStreamRef.current.getTracks().forEach(track => track.stop());
          microphoneStreamRef.current = null; 
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setAudioLevel(0); 
      };

      // Assign the event handlers
      if (currentRecognition) {
      currentRecognition.onresult = handleRecognitionResult;
      currentRecognition.onerror = handleRecognitionError;
      currentRecognition.onend = handleRecognitionEnd;
    }
      // Cleanup function for useEffect
      return () => {
        if (currentRecognition) {
          currentRecognition.abort(); 
          // Crucial: remove event listeners to prevent memory leaks and unexpected behavior
          currentRecognition.onresult = null;
          currentRecognition.onerror = null;
          currentRecognition.onend = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (microphoneStreamRef.current) {
          microphoneStreamRef.current.getTracks().forEach(track => track.stop());
          microphoneStreamRef.current = null;
        }
      };

    } else {
      console.warn('Web Speech API (webkitSpeechRecognition) is not supported in this browser.');
    }
  }, [handleUserVoiceInput]); // Dependency on handleUserVoiceInput due to useCallback


  // Manage AudioContext for visualization
  useEffect(() => {
    // Only initialize if not already done and if window has AudioContext
    if (!audioContextRef.current && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256; 
        analyserRef.current.smoothingTimeConstant = 0.3; 
        console.log('AudioContext for visualization initialized.');
      } catch (error) {
        console.error('Failed to initialize AudioContext for visualization:', error);
        audioContextRef.current = null; 
        analyserRef.current = null;
      }
    }
    // No specific cleanup needed here to close context, as it's intended to persist.
    // The browser might automatically suspend/close it when not in use.
  }, []); 

  const startListening = async () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not supported or not initialized.');
      setVoiceConversation(prev => ({
        messages: [...prev.messages, {
          id: Date.now().toString(),
          text: `(Speech recognition not available in your browser or could not be initialized.)`,
          sender: 'ai' as const,
          timestamp: new Date()
        }]
      }));
      return;
    }
    
    if (isListening) {
      stopListening();
      return;
    }

    // Abort any previous recognition session before starting a new one
    try {
      recognitionRef.current.abort();
    } catch (e) {
      console.warn("Could not abort previous recognition session:", e);
    }
    
    setIsListening(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;
      
      if (audioContextRef.current && analyserRef.current) {
        // Ensure AudioContext is running/resumed
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume().catch(e => console.error("Error resuming AudioContext:", e));
        }

        // Create a new MediaStreamSource each time, as source nodes can only be connected once
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        
        const updateAudioLevel = () => {
          if (!isListening || !analyserRef.current) { // Stop if not listening anymore or analyser is null
            animationFrameRef.current = null; // Clear pending animation frame
            return; 
          }
          
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 128); 
          
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        };
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      }

      recognitionRef.current.start();
      console.log('Speech recognition session started...');

    } catch (error: any) { 
      console.error('Error starting speech recognition or accessing microphone:', error);
      setIsListening(false);
      if (microphoneStreamRef.current) { // Ensure stream is stopped on error
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setAudioLevel(0); // Reset audio level visual on error
      
      setVoiceConversation(prev => ({
        messages: [...prev.messages, {
          id: Date.now().toString(),
          text: `(Microphone access denied or error: ${error.message}). Please ensure microphone access is granted and try again.`,
          sender: 'ai' as const,
          timestamp: new Date()
        }]
      }));
    }
  };


  const startVoiceChat = () => {
    if (!selectedElement) return;
    
    setShowVoiceChat(true);
    
    // Add initial AI greeting
    const initialGreeting = `Hi there! I'm your chemistry AI assistant. I'd be happy to tell you all about ${selectedElement.name}. What would you like to know about this element?`;
    
    const aiMessage = {
      id: Date.now().toString(),
      text: initialGreeting,
      sender: 'ai' as const,
      timestamp: new Date()
    };
    
    setVoiceConversation({
      messages: [aiMessage]
    });
    
    // Speak the greeting
    setIsSpeaking(true);
    elevenLabsService.streamTextToSpeech(initialGreeting, {
      onComplete: () => {
        setIsSpeaking(false);
        // After greeting, automatically start listening for user's first question
        startListening(); 
      },
      onError: (error) => {
        console.error('Speech synthesis error for greeting:', error);
        setIsSpeaking(false);
        setVoiceConversation(prev => ({
          messages: [...prev.messages, {
            id: (Date.now() + 1).toString(),
            text: "(Error speaking greeting. Please check ElevenLabs API key and network.)",
            sender: 'ai' as const,
            timestamp: new Date()
          }]
        }));
      }
    });
  };

  const stopVoiceChat = () => {
    setShowVoiceChat(false);
    setIsSpeaking(false);
    
    // Stop any ongoing speech from ElevenLabs
    elevenLabsService.stopAudio();
    
    // Stop local listening (this will trigger onend, which handles stream/animation cleanup)
    stopListening(); 
    
    // Clear conversation history
    setVoiceConversation({
      messages: []
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Interactive Periodic Table
              </h1>
              <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Click on any element to explore its properties, hover for quick info
              </p>
            </div>
            {/* Removed the local theme toggle button, as theme is now managed by Settings */}
            {/* <button
              onClick={() => setIsDark(!isDark)}
              className={`p-3 rounded-lg transition-colors ${
                isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
              } shadow-lg`}
            >
              {isDark ? '☀️' : '🌙'}
            </button> */}
          </div>

        {/* Search and Filter Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search elements by name, symbol, or atomic number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDark 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Periodic Table Grid */}
        <div className="mb-8 overflow-x-auto">
            <div className="min-w-[1200px] relative">
              <div className="grid grid-cols-18 gap-1 p-4">
                {filteredElements.map((element) => (
                  <div
                    key={element.number}
                    className={`relative aspect-square p-2 rounded-lg cursor-pointer transition-all duration-200 transform ${getCategoryColor(element.category)} 
                      ${searchTerm && (element.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        element.symbol.toLowerCase().includes(searchTerm.toLowerCase())) 
                        ? 'ring-4 ring-yellow-400 ring-opacity-75 scale-105' : ''}
                      hover:scale-110 hover:shadow-xl hover:z-10`}
                    style={{
                      gridColumn: element.group || 'auto',
                      gridRow: element.period
                    }}
                    onClick={() => setSelectedElement(element)}
                    onMouseEnter={(e) => handleMouseEnter(element, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="text-xs text-white opacity-80 font-medium">{element.number}</div>
                    <div className="text-xl font-bold text-white text-center leading-none">{element.symbol}</div>
                    <div className="text-xs text-white truncate text-center mt-1">{element.name}</div>
                    <div className="absolute top-1 right-1 text-xs">
                      {getSafetyIcon(element.safetyLevel)}
                    </div>
                    <div className="absolute bottom-1 left-1 text-xs text-white opacity-60">
                      {element.atomicMass.toFixed(element.atomicMass < 10 ? 3 : 1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        {/* Hover Tooltip */}
        {hoveredElement && (
            <div
              ref={tooltipRef}
              className={`fixed z-50 p-4 rounded-xl shadow-2xl border pointer-events-none transition-all duration-200 ${
                isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-200'
              }`}
              style={{ 
                left: tooltipPosition.x, 
                top: tooltipPosition.y,
                maxWidth: '320px',
                minWidth: '280px'
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-12 h-12 rounded-lg ${getCategoryColor(hoveredElement.category).split(' ')[0]} flex items-center justify-center`}>
                  <span className="text-lg font-bold text-white">{hoveredElement.symbol}</span>
                </div>
                <div>
                  <div className="text-lg font-bold">{hoveredElement.name}</div>
                  <div className="text-sm opacity-75">Atomic Number: {hoveredElement.number}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="font-medium opacity-75">Atomic Mass:</div>
                  <div>{hoveredElement.atomicMass} u</div>
                </div>
                <div>
                  <div className="font-medium opacity-75">Category:</div>
                  <div className="capitalize">{hoveredElement.category.replace('-', ' ')}</div>
                </div>
                <div>
                  <div className="font-medium opacity-75">Melting Point:</div>
                  <div>{hoveredElement.meltingPoint}°C</div>
                </div>
                <div>
                  <div className="font-medium opacity-75">Boiling Point:</div>
                  <div>{hoveredElement.boilingPoint}°C</div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-opacity-20 border-gray-400">
                <div className="text-sm">
                  <div className="font-medium opacity-75 mb-1">Electron Configuration:</div>
                  <div className="font-mono text-xs bg-opacity-20 bg-gray-500 px-2 py-1 rounded">
                    {hoveredElement.electronConfiguration}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-opacity-20 border-gray-400">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <span className="mr-2">Safety:</span>
                    <span>{getSafetyIcon(hoveredElement.safetyLevel)}</span>
                  </span>
                  <span className="text-right">
                    {getSafetyText(hoveredElement.safetyLevel)}
                  </span>
                </div>
              </div>
            </div>
          )}

        {/* Detailed Element Modal */}
        {selectedElement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } shadow-2xl`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-lg ${getCategoryColor(selectedElement.category).split(' ')[0]} flex items-center justify-center`}>
                      <span className="text-2xl font-bold text-white">{selectedElement.symbol}</span>
                    </div>
                    <div>
                      <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedElement.name}
                      </h2>
                      <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Atomic Number {selectedElement.number} • {selectedElement.category.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedElement(null)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <X className={`h-6 w-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Properties */}
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Physical Properties
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Atomic Mass:</span>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedElement.atomicMass} u</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Melting Point:</span>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedElement.meltingPoint}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Boiling Point:</span>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedElement.boilingPoint}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Density:</span>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedElement.density} g/cm³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Electron Config:</span>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedElement.electronConfiguration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Period/Group:</span>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedElement.period}/{selectedElement.group}</span>
                      </div>
                    </div>
                  </div>

                  {/* Safety & Discovery */}
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Safety & Discovery
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Safety Level:</span>
                        <span className="flex items-center space-x-2">
                          <span>{getSafetyIcon(selectedElement.safetyLevel)}</span>
                          <span>{getSafetyText(selectedElement.safetyLevel)}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Discovered By:</span>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedElement.discoveredBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Discovery Year:</span>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedElement.discoveryYear}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className={`p-4 rounded-lg col-span-full ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Description
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedElement.description}
                    </p>
                  </div>

                  {/* Uses */}
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Common Uses
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {selectedElement.uses.map((use, index) => (
                        <li key={index} className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                          {use}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Common Compounds */}
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Common Compounds
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedElement.commonCompounds.map((compound, index) => (
                        <span 
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm ${
                            isDark 
                              ? 'bg-gray-600 text-gray-200' 
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {compound}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center space-x-4">
                  <button
                    onClick={() => setShow3DViewer(true)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg ${
                      isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                    } text-white transition-colors`}
                  >
                    <Play className="h-4 w-4" />
                    <span>View 3D Atomic Structure</span>
                  </button>
                  
                  <button
                    onClick={startVoiceChat}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg ${
                      isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
                    } text-white transition-colors`}
                  >
                    <Headphones className="h-4 w-4" />
                    <span>Talk with AI</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 3D Viewer Modal */}
        {show3DViewer && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100]">
            <div className={`max-w-5xl w-full max-h-[90vh] rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } shadow-2xl overflow-hidden`}>
              <div className="flex justify-between items-center p-4 border-b border-gray-600">
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  3D Atomic Structure - {selectedElement?.name}
                </h3>
                <button
                  onClick={() => setShow3DViewer(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className={`h-6 w-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                </button>
              </div>
              <div className="w-full h-96">
                <MoleculeViewer selectedElement={selectedElement} />
              </div>
              <div className="p-4 border-t border-gray-600">
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Interactive 3D model showing the atomic structure. Use mouse to rotate, zoom, and explore.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Voice Chat Modal */}
        {showVoiceChat && selectedElement && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100]">
            <div className={`max-w-2xl w-full max-h-[90vh] rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } shadow-2xl overflow-hidden flex flex-col`}>
              <div className="flex justify-between items-center p-4 border-b border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${getCategoryColor(selectedElement.category).split(' ')[0]} flex items-center justify-center`}>
                    <span className="text-lg font-bold text-white">{selectedElement.symbol}</span>
                  </div>
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Talking about {selectedElement.name}
                  </h3>
                </div>
                <button
                  onClick={stopVoiceChat}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className={`h-6 w-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                </button>
              </div>
              
              {/* Conversation Area */}
              <div className={`flex-1 overflow-y-auto p-4 ${
                isDark ? 'bg-gray-900' : 'bg-gray-50'
              }`}>
                <div className="space-y-4">
                  {voiceConversation.messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.sender === 'user'
                          ? isDark
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : isDark
                          ? 'bg-gray-700 text-white'
                          : 'bg-white text-gray-900 shadow-sm border'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        <div className="mt-1 text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Voice Controls */}
              <div className={`p-4 border-t ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {isListening 
                      ? 'Listening...' 
                      : isSpeaking 
                        ? 'AI is speaking...' 
                        : 'Press the microphone button and ask a question'}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {isSpeaking && (
                      <button
                        onClick={() => {
                          elevenLabsService.stopAudio();
                          setIsSpeaking(false);
                        }}
                        className={`p-3 rounded-full ${
                          isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                        } text-white`}
                        title="Stop speaking"
                      >
                        <VolumeX className="h-5 w-5" />
                      </button>
                    )}
                    
                    <button
                      ref={microphoneRef}
                      onClick={isListening ? stopListening : startListening}
                      disabled={isSpeaking}
                      className={`p-4 rounded-full relative ${
                        isListening
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : isSpeaking
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : isDark
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                      title={isListening ? 'Stop listening' : 'Start listening'}
                    >
                      {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                      
                      {/* Audio level visualization */}
                      {isListening && (
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-white transition-all duration-100"
                            style={{ 
                              height: `${audioLevel * 100}%`, 
                              opacity: 0.3 
                            }}
                          />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className={`mt-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isListening 
                    ? 'Speak clearly into your microphone...' 
                    : isSpeaking 
                      ? 'AI is responding to your question...'
                      : 'Ask about properties, uses, history, or anything about this element'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>  
  );
};
 
export default PeriodicTableElement;