import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
// FIX: Corrected import paths for Three.js addon modules. Note the '.js' extension.
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';

type ViewMode = 'ball-and-stick' | 'space-filling' | 'wireframe' | 'transparent' | 'holographic';

// FIX: Defined a specific type for atom types for better type safety.
type AtomType = 'generic' | 'nucleus' | 'electron' | 'oxygen' | 'hydrogen';

interface AtomProps {
  position: [number, number, number];
  color: string;
  radius?: number;
  viewMode: ViewMode;
  atomType?: AtomType;
  glowIntensity?: number;
}

const Atom: React.FC<AtomProps> = ({ 
  position, 
  color, 
  radius = 1, 
  viewMode, 
  atomType = 'generic',
 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05;
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.003;
    }
    
    if (glowRef.current && viewMode === 'holographic') {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
    }
  });

  const getMaterial = () => {
    const baseColor = new THREE.Color(color);
    
    switch (viewMode) {
      case 'wireframe':
        return (
          <meshBasicMaterial 
            color={color} 
            wireframe 
            transparent
            opacity={0.8}
          />
        );
      case 'transparent':
        return (
          <meshPhysicalMaterial 
            color={baseColor}
            transparent 
            opacity={0.6}
            transmission={0.9}
            thickness={0.5}
            roughness={0.1}
            metalness={0.1}
            ior={1.5}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        );
      case 'holographic':
        return (
          <meshPhysicalMaterial 
            color={baseColor}
            transparent
            opacity={0.8}
            transmission={0.3}
            roughness={0.0}
            metalness={0.8}
            ior={2.4}
            clearcoat={1}
            iridescence={1}
            iridescenceIOR={2.4}
            iridescenceThicknessRange={[100, 800]}
          />
        );
      default:
        return (
          <meshPhysicalMaterial 
            color={baseColor}
            metalness={0.2}
            roughness={0.3}
            clearcoat={0.8}
            clearcoatRoughness={0.2}
            envMapIntensity={1.5}
            emissive={hovered ? baseColor.clone().multiplyScalar(0.1) : new THREE.Color(0x000000)}
          />
        );
    }
  };

  return (
    <group>
      <mesh 
        ref={meshRef} 
        position={position}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        scale={hovered ? [1.1, 1.1, 1.1] : [1, 1, 1]}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        {getMaterial()}
      </mesh>
      
      {viewMode === 'holographic' && (
        <mesh ref={glowRef} position={position}>
          <sphereGeometry args={[radius * 1.2, 32, 32]} />
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      
      {atomType === 'nucleus' && (
        <group>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                position[0] + (Math.random() - 0.5) * radius * 0.5,
                position[1] + (Math.random() - 0.5) * radius * 0.5,
                position[2] + (Math.random() - 0.5) * radius * 0.5
              ]}
            >
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#ffff00" transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

interface BondProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  viewMode: ViewMode;
  bondType?: 'single' | 'double' | 'triple';
}

const Bond: React.FC<BondProps> = ({ 
  start, 
  end, 
  color = '#ffffff', 
  viewMode,
  bondType = 'single' 
}) => {
  const bondRef = useRef<THREE.Group>(null);
  
  const bondData = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const direction = endVec.clone().sub(startVec);
    const length = direction.length();
    const midpoint = startVec.clone().add(endVec).multiplyScalar(0.5);
    
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    
    return { midpoint, length, quaternion, bondCount: bondType === 'triple' ? 3 : bondType === 'double' ? 2 : 1 };
  }, [start, end, bondType]);
  
  useFrame(() => {
    if (bondRef.current && viewMode === 'holographic') {
      bondRef.current.rotation.z += 0.01;
    }
  });

  const getMaterial = () => {
    const baseColor = new THREE.Color(color);
    
    switch (viewMode) {
      case 'wireframe':
        return (
          <meshBasicMaterial 
            color={color} 
            wireframe 
            transparent
            opacity={0.6}
          />
        );
      case 'transparent':
        return (
          <meshPhysicalMaterial 
            color={baseColor}
            transparent 
            opacity={0.4}
            transmission={0.8}
            roughness={0.1}
            metalness={0.1}
          />
        );
      case 'holographic':
        return (
          <meshPhysicalMaterial 
            color={baseColor}
            transparent
            opacity={0.7}
            metalness={0.9}
            roughness={0.1}
            iridescence={0.8}
            emissive={baseColor.clone().multiplyScalar(0.1)}
          />
        );
      default:
        return (
          <meshPhysicalMaterial 
            color={baseColor}
            metalness={0.1}
            roughness={0.4}
            clearcoat={0.5}
          />
        );
    }
  };

  return (
    <group ref={bondRef}>
      {Array.from({ length: bondData.bondCount }).map((_, index) => {
        const offset = bondData.bondCount > 1 ? (index - (bondData.bondCount - 1) / 2) * 0.2 : 0;
        return (
          <mesh
            key={index}
            position={[bondData.midpoint.x + offset, bondData.midpoint.y, bondData.midpoint.z]}
            quaternion={bondData.quaternion}
          >
            <cylinderGeometry args={[0.05, 0.05, bondData.length, 16]} />
            {getMaterial()}
          </mesh>
        );
      })}
    </group>
  );
};

interface ElectronOrbitalProps {
  radius: number;
  color: string;
  electronCount: number;
  viewMode: ViewMode;
}

const ElectronOrbital: React.FC<ElectronOrbitalProps> = ({ 
  radius, 
  color, 
  electronCount,
  viewMode 
}) => {
  const orbitalRef = useRef<THREE.Group>(null);
  const electrons = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    if (orbitalRef.current) {
      orbitalRef.current.rotation.y += 0.005;
      orbitalRef.current.rotation.x += 0.002;
      
      electrons.current.forEach((electron, index) => {
        if (electron) {
          const angle = (state.clock.elapsedTime * 0.5) + (index * (Math.PI * 2) / electronCount);
          electron.position.x = Math.cos(angle) * radius;
          electron.position.z = Math.sin(angle) * radius;
          electron.position.y = Math.sin(angle * 2) * 0.2;
        }
      });
    }
  });

  if (viewMode === 'space-filling') return null;

  return (
    <group ref={orbitalRef}>
      <mesh>
        <torusGeometry args={[radius, 0.01, 8, 32]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={viewMode === 'holographic' ? 0.4 : 0.2}
        />
      </mesh>
      
      {Array.from({ length: electronCount }).map((_, index) => (
        <mesh
          key={index}
          ref={(el) => {
            if (el) electrons.current[index] = el;
          }}
        >
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshPhysicalMaterial 
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
};

interface SceneProps {
  selectedElement?: any;
  viewMode: ViewMode;
  controlsRef: React.RefObject<any>;
  onSceneReady?: (scene: THREE.Scene) => void;
}

// FIX: Added explicit types for the data structures returned by getAtomicStructure
interface AtomData {
  position: [number, number, number];
  color: string;
  radius: number;
  atomType: AtomType;
}

interface BondData {
  start: [number, number, number];
  end: [number, number, number];
  bondType: 'single' | 'double' | 'triple';
}

interface OrbitalData {
  radius: number;
  color: string;
  electronCount: number;
}

interface StructureData {
  atoms: AtomData[];
  bonds: BondData[];
  orbitals: OrbitalData[];
}

const Scene: React.FC<SceneProps> = ({ selectedElement, viewMode, controlsRef, onSceneReady }) => {
  const { camera, scene } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 0, 12);
    if (onSceneReady) {
      onSceneReady(scene);
    }
  }, [camera, scene, onSceneReady]);

  // FIX: Added a return type annotation to the function for type safety.
  const getAtomicStructure = (element: any, viewMode: ViewMode): StructureData => {
    const isSpaceFilling = viewMode === 'space-filling';
    
    if (!element) {
      return {
        atoms: [
          { position: [0, 0, 0], color: '#ff4757', radius: isSpaceFilling ? 1.4 : 0.9, atomType: 'oxygen' },
          { position: [-1.2, 0.8, 0], color: '#ffffff', radius: isSpaceFilling ? 0.9 : 0.6, atomType: 'hydrogen' },
          { position: [1.2, 0.8, 0], color: '#ffffff', radius: isSpaceFilling ? 0.9 : 0.6, atomType: 'hydrogen' },
        ],
        bonds: isSpaceFilling ? [] : [
          { start: [0, 0, 0], end: [-1.2, 0.8, 0], bondType: 'single' },
          { start: [0, 0, 0], end: [1.2, 0.8, 0], bondType: 'single' },
        ],
        orbitals: []
      };
    }
    
    // FIX: Explicitly typed the arrays to prevent implicit 'any' types.
    const atoms: AtomData[] = [];
    const bonds: BondData[] = []; // Although unused for single atoms, it's good practice.
    const orbitals: OrbitalData[] = [];
    
    atoms.push({
      position: [0, 0, 0],
      color: '#ff6b6b',
      radius: isSpaceFilling ? 0.8 : 0.6,
      atomType: 'nucleus'
    });

    const electronShells = [
      { maxElectrons: 2, radius: 2.0, color: '#4ecdc4' },
      { maxElectrons: 8, radius: 3.5, color: '#45b7d1' },
      { maxElectrons: 18, radius: 5.0, color: '#96ceb4' },
      { maxElectrons: 32, radius: 6.5, color: '#ffeaa7' }
    ];
    
    let remainingElectrons = element.number;

    electronShells.forEach((shell) => {
      if (remainingElectrons <= 0) return;
      
      const electronsInShell = Math.min(remainingElectrons, shell.maxElectrons);
      
      if (!isSpaceFilling) {
        orbitals.push({
          radius: shell.radius,
          color: shell.color,
          electronCount: electronsInShell
        });
      } else {
        const angleStep = (2 * Math.PI) / electronsInShell;
        for (let i = 0; i < electronsInShell; i++) {
          const angle = i * angleStep;
          const tilt = (Math.random() - 0.5) * Math.PI * 0.3;
          const x = Math.cos(angle) * shell.radius * Math.cos(tilt);
          const y = Math.sin(angle) * shell.radius * Math.cos(tilt);
          const z = Math.sin(tilt) * shell.radius;
          
          atoms.push({
            position: [x, y, z],
            color: shell.color,
            radius: 0.25,
            atomType: 'electron'
          });
        }
      }
      
      remainingElectrons -= electronsInShell;
    });

    return { atoms, bonds, orbitals };
  };

  const structure = getAtomicStructure(selectedElement, viewMode);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#4ecdc4" />
      <spotLight 
        position={[0, 15, 0]} 
        angle={0.3} 
        penumbra={1} 
        intensity={1} 
        color="#ff6b6b"
        castShadow
      />
      
      <Environment preset="studio" />
      
      {structure.atoms.map((atom, index) => (
        <Atom
          key={index}
          position={atom.position}
          color={atom.color}
          radius={atom.radius}
          viewMode={viewMode}
          atomType={atom.atomType}
        />
      ))}
      
      {structure.bonds.map((bond, index) => (
        <Bond
          key={index}
          start={bond.start}
          end={bond.end}
          viewMode={viewMode}
          bondType={bond.bondType}
        />
      ))}
      
      {structure.orbitals?.map((orbital, index) => (
        <ElectronOrbital
          key={index}
          radius={orbital.radius}
          color={orbital.color}
          electronCount={orbital.electronCount}
          viewMode={viewMode}
        />
      ))}
      
      {viewMode === 'holographic' && (
        <group>
          {Array.from({ length: 50 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
              ]}
            >
              <sphereGeometry args={[0.01, 4, 4]} />
              <meshBasicMaterial 
                color="#4ecdc4" 
                transparent 
                opacity={0.3}
              />
            </mesh>
          ))}
        </group>
      )}
      
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={1}
        minDistance={3}
        maxDistance={20}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
};

interface MoleculeViewerProps {
  selectedElement?: any;
}

const MoleculeViewer: React.FC<MoleculeViewerProps> = ({ selectedElement }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('ball-and-stick');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const controlsRef = useRef<any>(null);
  const threeSceneRef = useRef<THREE.Scene | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleSceneReady = (scene: THREE.Scene) => {
    threeSceneRef.current = scene;
  };

  const exportScene = (format: 'gltf' | 'obj' | 'png') => {
    setShowExportMenu(false); 
    
    const canvas = document.querySelector('canvas');
    if (!threeSceneRef.current || !canvas) {
      console.error("Scene or canvas not ready for export.");
      return;
    }

    switch (format) {
      case 'gltf': {
        const exporter = new GLTFExporter();
        // FIX: Explicitly typed the `gltf` parameter in the callback.
        exporter.parse(
          threeSceneRef.current,
          (gltf: object) => { // gltf can be object or ArrayBuffer
            const output = JSON.stringify(gltf, null, 2);
            const blob = new Blob([output], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'molecule.gltf';
            link.click();
            URL.revokeObjectURL(url);
          },
          (error) => {
            console.error('An error happened during GLTF export:', error);
          },
          { binary: false }
        );
        break;
      }
      case 'obj': {
        const exporter = new OBJExporter();
        const result = exporter.parse(threeSceneRef.current);
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'molecule.obj';
        link.click();
        URL.revokeObjectURL(url);
        break;
      }
      case 'png': {
        const link = document.createElement('a');
        // Ensure the scene is rendered before capturing
        canvas.toBlob((blob) => {
          if (blob) {
            link.href = URL.createObjectURL(blob);
            link.download = 'molecule.png';
            link.click();
            URL.revokeObjectURL(link.href);
          }
        });
        break;
      }
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="absolute top-4 left-4 z-10 bg-black/30 backdrop-blur-md rounded-lg p-4 border border-white/20">
        <div className="flex flex-col gap-3">
          <h3 className="text-white font-semibold text-lg">3D Molecule Viewer</h3>
          
          <div className="flex flex-wrap gap-2">
            <button 
              className="px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-700/80 transition-all backdrop-blur-sm border border-blue-400/30"
              onClick={resetView}
            >
              🎯 Reset View
            </button>
            
            <select 
              className="px-4 py-2 bg-gray-800/80 text-white rounded-lg border border-gray-600/50 backdrop-blur-sm"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
            >
              <option value="ball-and-stick">⚛️ Ball-and-Stick</option>
              <option value="space-filling">🌐 Space-Filling</option>
              <option value="wireframe">📐 Wireframe</option>
              <option value="transparent">👻 Transparent</option>
              <option value="holographic">✨ Holographic</option>
            </select>
            
            <div className="relative" ref={exportMenuRef}>
              <button 
                className="px-4 py-2 bg-green-600/80 text-white rounded-lg hover:bg-green-700/80 transition-all backdrop-blur-sm border border-green-400/30"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                💾 Export
              </button>
              {showExportMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 p-2 shadow-lg">
                  <button
                    onClick={() => exportScene('gltf')}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 rounded transition-colors"
                  >
                    📦 Export as GLTF
                  </button>
                  <button
                    onClick={() => exportScene('obj')}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 rounded transition-colors"
                  >
                    🔷 Export as OBJ
                  </button>
                  <button
                    onClick={() => exportScene('png')}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 rounded transition-colors"
                  >
                    🖼️ Save as PNG
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-300">
            {selectedElement ? 
              `Viewing: ${selectedElement.name} (${selectedElement.symbol})` : 
              'Viewing: Water Molecule (H₂O)'
            }
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 z-10 bg-black/30 backdrop-blur-md rounded-lg p-4 border border-white/20">
        <h4 className="text-white font-semibold mb-2">Legend</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-300">Oxygen / Nucleus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white"></div>
            <span className="text-gray-300">Hydrogen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-400"></div>
            <span className="text-gray-300">Electrons</span>
          </div>
        </div>
      </div>
      
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
        shadows
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
          // preserveDrawingBuffer is needed for toDataURL/toBlob to work correctly for screenshots
          preserveDrawingBuffer: true,
          stencil: false,
          depth: true
        }}
      >
        <Scene 
          selectedElement={selectedElement} 
          viewMode={viewMode}
          controlsRef={controlsRef}
          onSceneReady={handleSceneReady}
        />
      </Canvas>
    </div>
  );
};

export default MoleculeViewer;