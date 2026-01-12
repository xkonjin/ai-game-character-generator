import fs from 'fs/promises';
import path from 'path';
import type { ExportResult } from '../types.js';

export async function exportForThreeJS(
  riggedModelPath: string,
  outputDir: string,
  options: { optimize?: boolean; animations?: string[] } = {}
): Promise<ExportResult> {
  const { optimize = true, animations = [] } = options;

  console.log(`[Export] Preparing ${riggedModelPath} for Three.js`);

  const glbPath = riggedModelPath;
  const previewPath = path.join(outputDir, 'preview.html');
  
  const stats = await fs.stat(glbPath);
  const fileSize = stats.size;

  if (optimize && fileSize > 5 * 1024 * 1024) {
    console.log(`[Export] Warning: File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds recommended 5MB`);
  }

  const previewHtml = generatePreviewHTML(path.basename(glbPath));
  await fs.writeFile(previewPath, previewHtml);

  console.log(`[Export] Created preview at ${previewPath}`);

  return {
    glbPath,
    previewPath,
    fileSize,
    animations,
  };
}

function generatePreviewHTML(modelFilename: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Character Preview</title>
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
    }
    button {
      padding: 10px 20px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
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
      background: rgba(0,0,0,0.5);
      padding: 15px;
      border-radius: 8px;
      font-size: 14px;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div id="canvas-container">
    <div class="loading" id="loading">Loading model...</div>
    <div class="info" id="info" style="display: none;">
      <div><strong>Model:</strong> ${modelFilename}</div>
      <div id="anim-info"></div>
      <div style="margin-top: 10px; color: #aaa;">
        Drag to rotate • Scroll to zoom
      </div>
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

    const container = document.getElementById('canvas-container');
    const loadingEl = document.getElementById('loading');
    const infoEl = document.getElementById('info');
    const controlsEl = document.getElementById('controls');
    const animInfoEl = document.getElementById('anim-info');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.5, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x4a9eff, 0.3);
    backLight.position.set(-5, 3, -5);
    scene.add(backLight);

    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(gridHelper);

    let mixer = null;
    let animations = [];
    let activeAction = null;

    const loader = new GLTFLoader();
    loader.load(
      'model/${modelFilename}',
      (gltf) => {
        const model = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.sub(center);
        model.position.y += size.y / 2;
        
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 2) {
          model.scale.multiplyScalar(2 / maxDim);
        }
        
        scene.add(model);
        
        loadingEl.style.display = 'none';
        infoEl.style.display = 'block';
        
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
          
          playAnimation(0, controlsEl.children[0]);
        }
      },
      (progress) => {
        const percent = (progress.loaded / progress.total * 100).toFixed(0);
        loadingEl.textContent = 'Loading: ' + percent + '%';
      },
      (error) => {
        loadingEl.textContent = 'Error loading model';
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

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>`;
}

export function generateThreeJSCode(modelPath: string): string {
  return `// Three.js Character Loading Code
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
let mixer;

loader.load('${modelPath}', (gltf) => {
  const model = gltf.scene;
  scene.add(model);
  
  // Setup animation mixer
  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);
    
    // Play all animations
    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
    });
  }
});

// In your animation loop:
function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  
  renderer.render(scene, camera);
}
`;
}
