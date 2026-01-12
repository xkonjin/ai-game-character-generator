import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateImage } from '../image-gen/index.js';
import { createAnimationBatch } from '../video-gen/index.js';
import { generateAndRig3DModel } from '../rigging/index.js';
import { exportForThreeJS } from '../threejs-export/index.js';
import { estimatePipelineCost, formatCost } from '../rate-limit/index.js';
import type { CharacterStyle, AnimationType, SkeletonType } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

interface GenerateRequest {
  prompt: string;
  style: CharacterStyle;
  animations: AnimationType[];
  skeleton: SkeletonType;
}

interface SSEClient {
  id: string;
  response: http.ServerResponse;
}

const clients: Map<string, SSEClient> = new Map();

function sendEvent(clientId: string, event: string, data: object) {
  const client = clients.get(clientId);
  if (client) {
    client.response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

async function handleGenerate(clientId: string, body: GenerateRequest) {
  const charName = body.prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const charDir = path.join(OUTPUT_DIR, charName);
  
  try {
    await fs.mkdir(charDir, { recursive: true });
    
    // Cost estimate
    const costEstimate = estimatePipelineCost({
      imageProvider: 'openai',
      videoProvider: 'veo',
      riggingProvider: 'tripo',
      animationCount: body.animations.length,
      animationDuration: 4,
    });
    
    sendEvent(clientId, 'cost', {
      estimated: formatCost(costEstimate.total),
      breakdown: costEstimate,
    });
    
    // Stage 1: Image
    sendEvent(clientId, 'progress', { stage: 'image', progress: 10, message: 'Generating sprite...' });
    const imageResult = await generateImage(body.prompt, body.style, charDir, { provider: 'openai' });
    sendEvent(clientId, 'progress', { stage: 'image', progress: 25, message: 'Sprite generated' });
    
    // Stage 2: Animation
    sendEvent(clientId, 'progress', { stage: 'video', progress: 30, message: 'Creating animations...' });
    const videoResults = await createAnimationBatch(
      imageResult.imagePath,
      body.animations,
      charDir,
      { provider: 'veo' }
    );
    sendEvent(clientId, 'progress', { stage: 'video', progress: 55, message: `Created ${videoResults.length} animations` });
    
    // Stage 3: 3D Rigging
    sendEvent(clientId, 'progress', { stage: 'rigging', progress: 60, message: 'Building 3D model...' });
    const riggingResult = await generateAndRig3DModel(
      imageResult.imagePath,
      charDir,
      { skeletonType: body.skeleton, provider: 'tripo' }
    );
    sendEvent(clientId, 'progress', { stage: 'rigging', progress: 80, message: '3D model rigged' });
    
    // Stage 4: Export
    sendEvent(clientId, 'progress', { stage: 'export', progress: 85, message: 'Exporting for Three.js...' });
    const exportResult = await exportForThreeJS(
      riggingResult.riggedModelPath,
      charDir,
      { animations: body.animations }
    );
    
    sendEvent(clientId, 'complete', {
      characterName: charName,
      imagePath: `/output/${charName}/${path.basename(imageResult.imagePath)}`,
      modelPath: `/output/${charName}/${path.basename(exportResult.glbPath)}`,
      previewPath: `/output/${charName}/${path.basename(exportResult.previewPath)}`,
      animations: body.animations,
    });
    
  } catch (error) {
    sendEvent(clientId, 'error', {
      message: error instanceof Error ? error.message : 'Generation failed',
    });
  }
}

function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // SSE endpoint
  if (url.pathname === '/api/events') {
    const clientId = url.searchParams.get('id') || crypto.randomUUID();
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    
    clients.set(clientId, { id: clientId, response: res });
    
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);
    
    req.on('close', () => {
      clients.delete(clientId);
    });
    
    return;
  }
  
  // Generate endpoint
  if (url.pathname === '/api/generate' && req.method === 'POST') {
    const clientId = url.searchParams.get('clientId');
    
    if (!clientId || !clients.has(clientId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid client ID. Connect to /api/events first.' }));
      return;
    }
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body) as GenerateRequest;
        
        // Start generation in background
        handleGenerate(clientId, data).catch(console.error);
        
        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'started' }));
      } catch (_error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    
    return;
  }
  
  // Cost estimate endpoint
  if (url.pathname === '/api/estimate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const estimate = estimatePipelineCost({
          imageProvider: data.imageProvider || 'openai',
          videoProvider: data.videoProvider || 'veo',
          riggingProvider: data.riggingProvider || 'tripo',
          animationCount: data.animationCount || 1,
          animationDuration: data.animationDuration || 4,
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          total: formatCost(estimate.total),
          breakdown: estimate,
        }));
      } catch (_error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    
    return;
  }
  
  // Health check
  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', clients: clients.size }));
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

export function startServer(port: number = 3001): http.Server {
  const server = http.createServer(handleRequest);
  
  server.listen(port, () => {
    console.log(`[Server] API server running at http://localhost:${port}`);
    console.log(`[Server] Connect to /api/events for SSE, POST to /api/generate`);
  });
  
  return server;
}

// Run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
