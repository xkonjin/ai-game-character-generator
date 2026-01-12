import fs from 'fs/promises';
import path from 'path';
import type { ExportResult } from '../types.js';

export type ExportFormat = 'glb' | 'gltf';

interface ExportOptions {
  optimize?: boolean;
  animations?: string[];
  format?: ExportFormat;
  embedTextures?: boolean;
}

export async function exportForThreeJS(
  riggedModelPath: string,
  outputDir: string,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const { 
    optimize = true, 
    animations = [],
    format = 'glb',
    embedTextures: _embedTextures = true,
  } = options;

  console.log(`[Export] Preparing ${riggedModelPath} for Three.js`);
  console.log(`[Export] Format: ${format}, Optimize: ${optimize}`);

  const glbPath = riggedModelPath;
  const previewPath = path.join(outputDir, 'preview.html');

  let fileSize = 0;
  try {
    const stats = await fs.stat(glbPath);
    fileSize = stats.size;
  } catch {
    console.warn(`[Export] Could not stat file: ${glbPath}`);
  }

  const fileSizeMB = fileSize / (1024 * 1024);
  
  if (optimize && fileSizeMB > 5) {
    console.log(`[Export] Warning: File size (${fileSizeMB.toFixed(2)}MB) exceeds recommended 5MB`);
    console.log('[Export] Consider using model optimization (Issue #12)');
  }

  // Generate preview HTML
  const previewHtml = generatePreviewHTML({
    modelFilename: path.basename(glbPath),
    animations,
    fileSize,
  });
  await fs.writeFile(previewPath, previewHtml);

  // Generate integration code
  const integrationCodePath = path.join(outputDir, 'integration.js');
  const integrationCode = generateThreeJSCode(path.basename(glbPath));
  await fs.writeFile(integrationCodePath, integrationCode);

  // Generate React component
  const reactComponentPath = path.join(outputDir, 'CharacterViewer.tsx');
  const reactComponent = generateReactComponent(path.basename(glbPath));
  await fs.writeFile(reactComponentPath, reactComponent);

  console.log(`[Export] Created preview at ${previewPath}`);
  console.log(`[Export] Created integration code at ${integrationCodePath}`);
  console.log(`[Export] Created React component at ${reactComponentPath}`);

  return {
    glbPath,
    previewPath,
    fileSize,
    animations,
  };
}

interface PreviewOptions {
  modelFilename: string;
  animations: string[];
  fileSize: number;
}

function generatePreviewHTML(options: PreviewOptions): string {
  const { modelFilename, fileSize } = options;
  const fileSizeStr = fileSize > 0 
    ? `${(fileSize / 1024).toFixed(1)} KB` 
    : 'Unknown';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Character Preview - ${modelFilename}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    #canvas-container {
      flex: 1;
      position: relative;
    }
    canvas { display: block; }
    .controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
      max-width: 90%;
    }
    button {
      padding: 10px 20px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }
    button:hover {
      background: rgba(255,255,255,0.2);
    }
    button.active {
      background: #4a9eff;
      border-color: #4a9eff;
    }
    .info {
      position: absolute;
      top: 20px;
      left: 20px;
      color: white;
      background: rgba(0,0,0,0.7);
      padding: 15px;
      border-radius: 8px;
      font-size: 14px;
      backdrop-filter: blur(10px);
    }
    .info div {
      margin-bottom: 5px;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 18px;
      text-align: center;
    }
    .loading .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: #4a9eff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .toolbar {
      position: absolute;
      top: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
    }
    .toolbar button {
      padding: 8px 12px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div id="canvas-container">
    <div class="loading" id="loading">
      <div class="spinner"></div>
      Loading model...
    </div>
    <div class="info" id="info" style="display: none;">
      <div><strong>Model:</strong> ${modelFilename}</div>
      <div><strong>Size:</strong> ${fileSizeStr}</div>
      <div id="anim-info"></div>
      <div style="margin-top: 10px; color: #aaa; font-size: 12px;">
        Drag to rotate • Scroll to zoom • Right-click to pan
      </div>
    </div>
    <div class="toolbar" id="toolbar" style="display: none;">
      <button onclick="resetCamera()">Reset View</button>
      <button onclick="toggleWireframe()">Wireframe</button>
      <button onclick="toggleGrid()">Grid</button>
    </div>
    <div class="controls" id="controls" style="display: none;"></div>
  </div>

  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
    }
  }
  </script>
  
  <script type="module">
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

    const container = document.getElementById('canvas-container');
    const loadingEl = document.getElementById('loading');
    const infoEl = document.getElementById('info');
    const controlsEl = document.getElementById('controls');
    const toolbarEl = document.getElementById('toolbar');
    const animInfoEl = document.getElementById('anim-info');

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.5, 0);
    controls.minDistance = 1;
    controls.maxDistance = 20;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x4a9eff, 0.3);
    backLight.position.set(-5, 3, -5);
    scene.add(backLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);

    // Grid
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(gridHelper);

    // State
    let mixer = null;
    let animations = [];
    let activeAction = null;
    let model = null;
    let wireframeEnabled = false;
    let gridVisible = true;
    const initialCameraPosition = camera.position.clone();
    const initialControlsTarget = controls.target.clone();

    // Loader setup
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
    loader.setDRACOLoader(dracoLoader);

    // Load model
    loader.load(
      'model/${modelFilename}',
      (gltf) => {
        model = gltf.scene;
        
        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.sub(center);
        model.position.y += size.y / 2;
        
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 2) {
          model.scale.multiplyScalar(2 / maxDim);
        }

        // Enable shadows
        model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });
        
        scene.add(model);
        
        // Update UI
        loadingEl.style.display = 'none';
        infoEl.style.display = 'block';
        toolbarEl.style.display = 'flex';
        
        // Setup animations
        animations = gltf.animations;
        if (animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          animInfoEl.innerHTML = '<strong>Animations:</strong> ' + animations.length;
          
          controlsEl.style.display = 'flex';
          
          animations.forEach((clip, index) => {
            const btn = document.createElement('button');
            btn.textContent = clip.name || 'Animation ' + (index + 1);
            btn.onclick = () => playAnimation(index, btn);
            controlsEl.appendChild(btn);
          });
          
          // Add stop button
          const stopBtn = document.createElement('button');
          stopBtn.textContent = 'Stop';
          stopBtn.onclick = stopAnimation;
          controlsEl.appendChild(stopBtn);
          
          playAnimation(0, controlsEl.children[0]);
        } else {
          animInfoEl.innerHTML = '<strong>Animations:</strong> None';
        }
      },
      (progress) => {
        if (progress.total > 0) {
          const percent = (progress.loaded / progress.total * 100).toFixed(0);
          loadingEl.querySelector('.spinner').style.display = 'none';
          loadingEl.textContent = 'Loading: ' + percent + '%';
        }
      },
      (error) => {
        loadingEl.innerHTML = '<div style="color: #ff6b6b;">Error loading model</div><div style="font-size: 12px; margin-top: 10px;">Check console for details</div>';
        console.error('Error:', error);
      }
    );

    function playAnimation(index, btn) {
      if (activeAction) {
        activeAction.fadeOut(0.3);
      }
      
      document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const clip = animations[index];
      activeAction = mixer.clipAction(clip);
      activeAction.reset().fadeIn(0.3).play();
    }

    function stopAnimation() {
      if (activeAction) {
        activeAction.stop();
        activeAction = null;
      }
      document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
    }

    window.resetCamera = function() {
      camera.position.copy(initialCameraPosition);
      controls.target.copy(initialControlsTarget);
      controls.update();
    };

    window.toggleWireframe = function() {
      wireframeEnabled = !wireframeEnabled;
      if (model) {
        model.traverse((node) => {
          if (node.isMesh && node.material) {
            node.material.wireframe = wireframeEnabled;
          }
        });
      }
    };

    window.toggleGrid = function() {
      gridVisible = !gridVisible;
      gridHelper.visible = gridVisible;
    };

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'r': window.resetCamera(); break;
        case 'w': window.toggleWireframe(); break;
        case 'g': window.toggleGrid(); break;
        case ' ': 
          e.preventDefault();
          if (animations.length > 0) {
            const nextIndex = activeAction ? (animations.indexOf(activeAction.getClip()) + 1) % animations.length : 0;
            playAnimation(nextIndex, controlsEl.children[nextIndex]);
          }
          break;
      }
    });
  </script>
</body>
</html>`;
}

export function generateThreeJSCode(modelPath: string): string {
  return `// Three.js Character Loading Code
// Generated by AI Game Character Generator

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class CharacterLoader {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.mixer = null;
    this.model = null;
    this.animations = {};
    this.currentAction = null;
  }

  async load(path = '${modelPath}') {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          this.model = gltf.scene;
          this.scene.add(this.model);

          // Setup animations
          if (gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.model);
            gltf.animations.forEach((clip) => {
              this.animations[clip.name] = this.mixer.clipAction(clip);
            });
          }

          resolve(this);
        },
        undefined,
        reject
      );
    });
  }

  playAnimation(name, options = {}) {
    const { fadeIn = 0.3, loop = true } = options;
    
    if (this.currentAction) {
      this.currentAction.fadeOut(fadeIn);
    }

    const action = this.animations[name];
    if (action) {
      action.reset();
      action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
      action.fadeIn(fadeIn);
      action.play();
      this.currentAction = action;
    }
    
    return this;
  }

  stopAnimation() {
    if (this.currentAction) {
      this.currentAction.stop();
      this.currentAction = null;
    }
    return this;
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  getAnimationNames() {
    return Object.keys(this.animations);
  }

  setPosition(x, y, z) {
    if (this.model) {
      this.model.position.set(x, y, z);
    }
    return this;
  }

  setRotation(x, y, z) {
    if (this.model) {
      this.model.rotation.set(x, y, z);
    }
    return this;
  }

  setScale(scale) {
    if (this.model) {
      this.model.scale.setScalar(scale);
    }
    return this;
  }
}

// Usage example:
/*
const clock = new THREE.Clock();
const character = new CharacterLoader(scene);

await character.load('./character.glb');
character.playAnimation('idle');

function animate() {
  requestAnimationFrame(animate);
  character.update(clock.getDelta());
  renderer.render(scene, camera);
}
animate();
*/
`;
}

function generateReactComponent(modelPath: string): string {
  return `// React Three Fiber Character Component
// Generated by AI Game Character Generator

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, useAnimations, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface CharacterProps {
  position?: [number, number, number];
  scale?: number;
  animation?: string;
  autoPlay?: boolean;
}

function Character({ 
  position = [0, 0, 0], 
  scale = 1, 
  animation = 'idle',
  autoPlay = true 
}: CharacterProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/${modelPath}');
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (autoPlay && actions[animation]) {
      actions[animation]?.reset().fadeIn(0.3).play();
      return () => {
        actions[animation]?.fadeOut(0.3);
      };
    }
  }, [animation, actions, autoPlay]);

  return (
    <group ref={group} position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

interface CharacterViewerProps {
  className?: string;
  animation?: string;
  showControls?: boolean;
  backgroundColor?: string;
}

export function CharacterViewer({
  className = '',
  animation = 'idle',
  showControls = true,
  backgroundColor = '#1a1a2e',
}: CharacterViewerProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: 400 }}>
      <Canvas
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        style={{ background: backgroundColor }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} color="#4a9eff" />
        
        <Suspense fallback={null}>
          <Character animation={animation} />
          <Environment preset="studio" />
        </Suspense>
        
        {showControls && (
          <OrbitControls
            target={[0, 0.5, 0]}
            minDistance={1}
            maxDistance={20}
            enableDamping
          />
        )}
        
        <gridHelper args={[10, 10, '#444444', '#222222']} />
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload('/${modelPath}');

export default CharacterViewer;

/* Usage:
import CharacterViewer from './CharacterViewer';

function App() {
  return (
    <CharacterViewer 
      animation="idle"
      showControls={true}
    />
  );
}
*/
`;
}

export function getExportFormats(): ExportFormat[] {
  return ['glb', 'gltf'];
}

export async function validateGLBFile(filePath: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const buffer = await fs.readFile(filePath);
    
    // GLB magic number: 0x46546C67 ("glTF" in little-endian)
    if (buffer.length < 4) {
      return { valid: false, error: 'File too small to be a valid GLB' };
    }
    
    const magic = buffer.readUInt32LE(0);
    if (magic !== 0x46546C67) {
      return { valid: false, error: 'Invalid GLB magic number' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: String(error) };
  }
}
