import fs from 'fs/promises';
import path from 'path';
import type { SkeletonType, RiggingResult } from '../types.js';

const TRIPO_API_BASE = 'https://api.tripo3d.ai/v2/openapi';

export type RiggingProvider = 'tripo' | 'placeholder';

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
      pbr_model?: string;
    };
  };
}

interface RiggingOptions {
  skeletonType?: SkeletonType;
  provider?: RiggingProvider;
  faceLimit?: number;
  enableTexture?: boolean;
  enablePBR?: boolean;
  modelVersion?: string;
  maxPollAttempts?: number;
  pollInterval?: number;
}

const SKELETON_CONFIGS: Record<SkeletonType, { boneCount: number; description: string }> = {
  biped: {
    boneCount: 25,
    description: 'Humanoid skeleton with standard bone hierarchy',
  },
  quadruped: {
    boneCount: 32,
    description: 'Four-legged creature skeleton',
  },
  custom: {
    boneCount: 20,
    description: 'Custom skeleton for non-standard characters',
  },
};

export async function generateAndRig3DModel(
  imagePath: string,
  outputDir: string,
  options: RiggingOptions = {}
): Promise<RiggingResult> {
  const {
    skeletonType = 'biped',
    provider = 'tripo',
    faceLimit = 10000,
    enableTexture = true,
    enablePBR = true,
    modelVersion = 'v2.5-20250117',
    maxPollAttempts = 60,
    pollInterval = 5000,
  } = options;

  console.log(`[Rigging] Converting ${imagePath} to 3D model`);
  console.log(`[Rigging] Provider: ${provider}, Skeleton: ${skeletonType}`);

  const modelDir = path.join(outputDir, 'model');
  await fs.mkdir(modelDir, { recursive: true });

  if (provider === 'placeholder') {
    return createPlaceholderModel(modelDir, skeletonType);
  }

  const apiKey = process.env.TRIPO_API_KEY;
  if (!apiKey) {
    console.warn('[Rigging] TRIPO_API_KEY not set, using placeholder model');
    return createPlaceholderModel(modelDir, skeletonType);
  }

  try {
    // Step 1: Create image-to-model task
    const modelTaskId = await createImageToModelTask(imagePath, apiKey, {
      faceLimit,
      enableTexture,
      enablePBR,
      modelVersion,
    });
    console.log(`[Rigging] Created model task: ${modelTaskId}`);

    // Step 2: Wait for model generation
    await waitForTask(modelTaskId, apiKey, maxPollAttempts, pollInterval);
    const modelUrl = await getTaskOutput(modelTaskId, apiKey);

    // Step 3: Download base model
    const basePath = path.join(modelDir, 'base.glb');
    await downloadFile(modelUrl, basePath);
    console.log(`[Rigging] Downloaded base model to ${basePath}`);

    // Step 4: Create rigging task
    const rigTaskId = await createRiggingTask(modelTaskId, skeletonType, apiKey);
    console.log(`[Rigging] Created rigging task: ${rigTaskId}`);

    // Step 5: Wait for rigging
    await waitForTask(rigTaskId, apiKey, maxPollAttempts, pollInterval);
    const riggedUrl = await getTaskOutput(rigTaskId, apiKey);

    // Step 6: Download rigged model
    const riggedPath = path.join(modelDir, 'rigged.glb');
    await downloadFile(riggedUrl, riggedPath);
    console.log(`[Rigging] Downloaded rigged model to ${riggedPath}`);

    return {
      modelPath: basePath,
      riggedModelPath: riggedPath,
      skeletonType,
      boneCount: SKELETON_CONFIGS[skeletonType].boneCount,
    };
  } catch (error) {
    console.error('[Rigging] Error during 3D model generation:', error);
    console.warn('[Rigging] Falling back to placeholder model');
    return createPlaceholderModel(modelDir, skeletonType);
  }
}

interface ImageToModelOptions {
  faceLimit: number;
  enableTexture: boolean;
  enablePBR: boolean;
  modelVersion: string;
}

async function createImageToModelTask(
  imagePath: string,
  apiKey: string,
  options: ImageToModelOptions
): Promise<string> {
  const imageBuffer = await fs.readFile(imagePath);
  const base64Image = imageBuffer.toString('base64');

  // Detect image type from file extension
  const ext = path.extname(imagePath).toLowerCase();
  const imageType = ext === '.jpg' || ext === '.jpeg' ? 'jpeg' : 'png';

  const response = await fetch(`${TRIPO_API_BASE}/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      type: 'image_to_model',
      file: {
        type: imageType,
        data: base64Image,
      },
      model_version: options.modelVersion,
      face_limit: options.faceLimit,
      texture: options.enableTexture,
      pbr: options.enablePBR,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tripo API error (${response.status}): ${error}`);
  }

  const data: TripoTaskResponse = await response.json();

  if (data.code !== 0) {
    throw new Error(`Tripo API returned error code: ${data.code}`);
  }

  return data.data.task_id;
}

async function createRiggingTask(
  modelTaskId: string,
  skeletonType: SkeletonType,
  apiKey: string
): Promise<string> {
  const rigType = skeletonType === 'quadruped' ? 'quadruped' : 'biped';

  const response = await fetch(`${TRIPO_API_BASE}/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      type: 'rig',
      original_model_task_id: modelTaskId,
      rig_type: rigType,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tripo API error (${response.status}): ${error}`);
  }

  const data: TripoTaskResponse = await response.json();

  if (data.code !== 0) {
    throw new Error(`Tripo API returned error code: ${data.code}`);
  }

  return data.data.task_id;
}

async function waitForTask(
  taskId: string,
  apiKey: string,
  maxAttempts: number,
  pollInterval: number
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getTaskStatus(taskId, apiKey);

    if (status.data.status === 'success') {
      return;
    }

    if (status.data.status === 'failed') {
      throw new Error(`Task ${taskId} failed`);
    }

    const progress = status.data.progress || 0;
    console.log(`[Rigging] Task ${taskId}: ${status.data.status} (${progress}%)`);
    await sleep(pollInterval);
  }

  throw new Error(`Task ${taskId} timed out after ${maxAttempts} attempts`);
}

async function getTaskStatus(taskId: string, apiKey: string): Promise<TripoTaskStatus> {
  const response = await fetch(`${TRIPO_API_BASE}/task/${taskId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tripo API error (${response.status}): ${error}`);
  }

  return response.json();
}

async function getTaskOutput(taskId: string, apiKey: string): Promise<string> {
  const status = await getTaskStatus(taskId, apiKey);

  // Try different output fields
  const modelUrl = status.data.output?.model || status.data.output?.pbr_model;

  if (!modelUrl) {
    throw new Error(`No model output for task ${taskId}`);
  }

  return modelUrl;
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destPath, buffer);
}

async function createPlaceholderModel(
  modelDir: string,
  skeletonType: SkeletonType
): Promise<RiggingResult> {
  const basePath = path.join(modelDir, 'base.glb');
  const riggedPath = path.join(modelDir, 'rigged.glb');

  // Create placeholder GLB files
  const placeholderContent = `PLACEHOLDER_GLB:${skeletonType}:${Date.now()}`;
  await fs.writeFile(basePath, placeholderContent);
  await fs.writeFile(riggedPath, placeholderContent);

  console.log('[Rigging] Created placeholder models');

  return {
    modelPath: basePath,
    riggedModelPath: riggedPath,
    skeletonType,
    boneCount: SKELETON_CONFIGS[skeletonType].boneCount,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getSkeletonTypes(): SkeletonType[] {
  return Object.keys(SKELETON_CONFIGS) as SkeletonType[];
}

export function getSkeletonConfig(skeletonType: SkeletonType): { boneCount: number; description: string } {
  return { ...SKELETON_CONFIGS[skeletonType] };
}

export function getSupportedProviders(): RiggingProvider[] {
  return ['tripo', 'placeholder'];
}

export async function checkTripoApiKey(): Promise<boolean> {
  const apiKey = process.env.TRIPO_API_KEY;
  if (!apiKey) {
    return false;
  }

  try {
    const response = await fetch(`${TRIPO_API_BASE}/user/balance`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
