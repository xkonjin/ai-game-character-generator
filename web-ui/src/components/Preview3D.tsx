import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Grid } from '@react-three/drei';
import type { GenerationResult } from '../App';

interface Props {
  result?: GenerationResult;
}

function PlaceholderModel() {
  return (
    <mesh>
      <boxGeometry args={[1, 2, 0.5]} />
      <meshStandardMaterial color="#6366f1" wireframe />
    </mesh>
  );
}

function CharacterModel() {
  // In production, load the actual GLB model
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.6, 1, 0.3]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#fcd34d" />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.45, 0.75, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>
      <mesh position={[0.45, 0.75, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.15, -0.25, 0]}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
      <mesh position={[0.15, -0.25, 0]}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
    </group>
  );
}

export default function Preview3D({ result }: Props) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">3D Preview</h3>
        {result && (
          <select className="bg-black/30 border border-gray-700 rounded px-2 py-1 text-sm text-white">
            {result.animations.map(anim => (
              <option key={anim} value={anim}>
                {anim.charAt(0).toUpperCase() + anim.slice(1)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex-1 rounded-lg overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
        <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.5}>
              {result ? <CharacterModel /> : <PlaceholderModel />}
            </Stage>
          </Suspense>
          <OrbitControls
            enablePan={false}
            minDistance={2}
            maxDistance={10}
            target={[0, 1, 0]}
          />
          <Grid
            infiniteGrid
            fadeDistance={20}
            fadeStrength={3}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#3f3f46"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#52525b"
          />
        </Canvas>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
        <span>Drag to rotate</span>
        <span>•</span>
        <span>Scroll to zoom</span>
      </div>
    </div>
  );
}
