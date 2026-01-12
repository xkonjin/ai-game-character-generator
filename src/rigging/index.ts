import fs from 'fs/promises';
import path from 'path';
import type { SkeletonType, RiggingResult } from '../types.js';

const TRIPO_API_BASE = 'https://api.tripo3d.ai/v2/openapi';

interface TripoTaskResponse {
  code: number;
  data: {
    task_id: string;
  };
}

interface TripoTaskStatus {
  code: number;
  data: {
    task_id: string;
    type: string;
    status: 'queued' | 'running' | 'success' | 'failed';
    progress: number;
    output?: {
      model?: string;
      rendered_image?: string;
    };
  };
}

export async function generateAndRig3DModel(
  imagePath: string,
  outputDir: string,
  skeletonType: SkeletonType = 'biped'
): Promise<RiggingResult> {
  const apiKey = process.env.TRIPO_API_KEY;
  if (!apiKey) {
    throw new Error('TRIPO_API_KEY environment variable is required');
  }

  console.log(`[Rigging] Converting ${imagePath} to 3D model`);
  console.log(`[Rigging] Skeleton type: ${skeletonType}`);

  const modelDir = path.join(outputDir, 'model');
  await fs.mkdir(modelDir, { recursive: true });

  const modelTaskId = await createImageToModelTask(imagePath, apiKey);
  console.log(`[Rigging] Created model task: ${modelTaskId}`);
  
  await waitForTask(modelTaskId, apiKey);
  const modelUrl = await getTaskOutput(modelTaskId, apiKey);
  
  const basePath = path.join(modelDir, 'base.glb');
  await downloadFile(modelUrl, basePath);
  console.log(`[Rigging] Downloaded base model to ${basePath}`);

  const rigTaskId = await createRiggingTask(modelTaskId, skeletonType, apiKey);
  console.log(`[Rigging] Created rigging task: ${rigTaskId}`);
  
  await waitForTask(rigTaskId, apiKey);
  const riggedUrl = await getTaskOutput(rigTaskId, apiKey);
  
  const riggedPath = path.join(modelDir, 'rigged.glb');
  await downloadFile(riggedUrl, riggedPath);
  console.log(`[Rigging] Downloaded rigged model to ${riggedPath}`);

  return {
    modelPath: basePath,
    riggedModelPath: riggedPath,
    skeletonType,
    boneCount: getBoneCount(skeletonType),
  };
}

async function createImageToModelTask(imagePath: string, apiKey: string): Promise<string> {
  const imageBuffer = await fs.readFile(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  const response = await fetch(`${TRIPO_API_BASE}/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      type: 'image_to_model',
      file: {
        type: 'png',
        data: base64Image,
      },
      model_version: 'v2.5-20250117',
      face_limit: 10000,
      texture: true,
      pbr: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tripo API error: ${error}`);
  }

  const data: TripoTaskResponse = await response.json();
  return data.data.task_id;
}

async function createRiggingTask(
  modelTaskId: string,
  skeletonType: SkeletonType,
  apiKey: string
): Promise<string> {
  const rigType = skeletonType === 'biped' ? 'biped' : 
                  skeletonType === 'quadruped' ? 'quadruped' : 'biped';
  
  const response = await fetch(`${TRIPO_API_BASE}/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      type: 'rig',
      original_model_task_id: modelTaskId,
      rig_type: rigType,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tripo API error: ${error}`);
  }

  const data: TripoTaskResponse = await response.json();
  return data.data.task_id;
}

async function waitForTask(taskId: string, apiKey: string): Promise<void> {
  const maxAttempts = 60;
  const pollInterval = 5000;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getTaskStatus(taskId, apiKey);
    
    if (status.data.status === 'success') {
      return;
    }
    
    if (status.data.status === 'failed') {
      throw new Error(`Task ${taskId} failed`);
    }
    
    console.log(`[Rigging] Task ${taskId}: ${status.data.status} (${status.data.progress}%)`);
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error(`Task ${taskId} timed out`);
}

async function getTaskStatus(taskId: string, apiKey: string): Promise<TripoTaskStatus> {
  const response = await fetch(`${TRIPO_API_BASE}/task/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tripo API error: ${error}`);
  }

  return response.json();
}

async function getTaskOutput(taskId: string, apiKey: string): Promise<string> {
  const status = await getTaskStatus(taskId, apiKey);
  
  if (!status.data.output?.model) {
    throw new Error(`No model output for task ${taskId}`);
  }
  
  return status.data.output.model;
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destPath, buffer);
}

function getBoneCount(skeletonType: SkeletonType): number {
  switch (skeletonType) {
    case 'biped': return 25;
    case 'quadruped': return 32;
    case 'custom': return 20;
  }
}
