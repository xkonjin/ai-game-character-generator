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

interface SkeletonConfig {
  boneCount: number;
  description: string;
  bones: string[];
  rootBone: string;
  compatibility: string[];
}

const SKELETON_CONFIGS: Record<SkeletonType, SkeletonConfig> = {
  biped: {
    boneCount: 25,
    description: 'Humanoid skeleton with standard bone hierarchy',
    rootBone: 'Hips',
    bones: [
      'Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
      'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
      'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
      'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase',
      'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase',
      'LeftHandThumb1', 'RightHandThumb1', 'HeadTop_End',
    ],
    compatibility: ['idle', 'walk', 'run', 'attack', 'jump', 'death', 'hurt'],
  },
  quadruped: {
    boneCount: 32,
    description: 'Four-legged creature skeleton',
    rootBone: 'Root',
    bones: [
      'Root', 'Pelvis', 'Spine1', 'Spine2', 'Spine3', 'Neck1', 'Neck2', 'Head', 'Jaw',
      'LeftFrontLeg1', 'LeftFrontLeg2', 'LeftFrontLeg3', 'LeftFrontFoot',
      'RightFrontLeg1', 'RightFrontLeg2', 'RightFrontLeg3', 'RightFrontFoot',
      'LeftBackLeg1', 'LeftBackLeg2', 'LeftBackLeg3', 'LeftBackFoot',
      'RightBackLeg1', 'RightBackLeg2', 'RightBackLeg3', 'RightBackFoot',
      'Tail1', 'Tail2', 'Tail3', 'Tail4',
      'LeftEar', 'RightEar', 'Snout',
    ],
    compatibility: ['idle', 'walk', 'run', 'attack', 'jump', 'death'],
  },
  custom: {
    boneCount: 20,
    description: 'Custom skeleton for non-standard characters',
    rootBone: 'Root',
    bones: [
      'Root', 'Center', 'Upper', 'Lower',
      'Appendage1_Base', 'Appendage1_Mid', 'Appendage1_End',
      'Appendage2_Base', 'Appendage2_Mid', 'Appendage2_End',
      'Appendage3_Base', 'Appendage3_Mid', 'Appendage3_End',
      'Appendage4_Base', 'Appendage4_Mid', 'Appendage4_End',
      'Head', 'Jaw', 'TailBase', 'TailEnd',
    ],
    compatibility: ['idle', 'walk', 'attack', 'death'],
  },
};

export const ADDITIONAL_SKELETON_TYPES = {
  bird: {
    boneCount: 28,
    description: 'Flying creature with wings',
    rootBone: 'Root',
    bones: [
      'Root', 'Pelvis', 'Spine', 'Chest', 'Neck', 'Head', 'Beak',
      'LeftWing1', 'LeftWing2', 'LeftWing3', 'LeftWingTip', 'LeftWingFeathers',
      'RightWing1', 'RightWing2', 'RightWing3', 'RightWingTip', 'RightWingFeathers',
      'LeftLeg1', 'LeftLeg2', 'LeftFoot', 'LeftToes',
      'RightLeg1', 'RightLeg2', 'RightFoot', 'RightToes',
      'Tail1', 'Tail2', 'TailFeathers',
    ],
    compatibility: ['idle', 'walk', 'attack', 'jump', 'death'],
  },
  fish: {
    boneCount: 18,
    description: 'Swimming creature skeleton',
    rootBone: 'Root',
    bones: [
      'Root', 'Body1', 'Body2', 'Body3', 'Body4', 'TailBase', 'Tail', 'TailFin',
      'Head', 'Jaw', 'LeftEye', 'RightEye',
      'DorsalFin', 'LeftPectoralFin', 'RightPectoralFin',
      'LeftPelvicFin', 'RightPelvicFin', 'AnalFin',
    ],
    compatibility: ['idle', 'walk', 'attack', 'death'],
  },
  spider: {
    boneCount: 42,
    description: 'Eight-legged creature',
    rootBone: 'Cephalothorax',
    bones: [
      'Cephalothorax', 'Abdomen', 'Spinnerets',
      'Head', 'LeftFang', 'RightFang', 'LeftPedipalp', 'RightPedipalp',
      'Leg1L_1', 'Leg1L_2', 'Leg1L_3', 'Leg1L_4', 'Leg1L_Foot',
      'Leg1R_1', 'Leg1R_2', 'Leg1R_3', 'Leg1R_4', 'Leg1R_Foot',
      'Leg2L_1', 'Leg2L_2', 'Leg2L_3', 'Leg2L_4', 'Leg2L_Foot',
      'Leg2R_1', 'Leg2R_2', 'Leg2R_3', 'Leg2R_4', 'Leg2R_Foot',
      'Leg3L_1', 'Leg3L_2', 'Leg3L_3', 'Leg3L_4', 'Leg3L_Foot',
      'Leg3R_1', 'Leg3R_2', 'Leg3R_3', 'Leg3R_4', 'Leg3R_Foot',
      'Leg4L_1', 'Leg4L_2', 'Leg4L_3', 'Leg4L_4', 'Leg4L_Foot',
      'Leg4R_1', 'Leg4R_2', 'Leg4R_3', 'Leg4R_4', 'Leg4R_Foot',
    ],
    compatibility: ['idle', 'walk', 'run', 'attack', 'death'],
  },
  snake: {
    boneCount: 24,
    description: 'Serpentine skeleton with no limbs',
    rootBone: 'Head',
    bones: [
      'Head', 'Jaw', 'LeftFang', 'RightFang', 'Tongue',
      'Spine1', 'Spine2', 'Spine3', 'Spine4', 'Spine5',
      'Spine6', 'Spine7', 'Spine8', 'Spine9', 'Spine10',
      'Spine11', 'Spine12', 'Spine13', 'Spine14', 'Spine15',
      'TailBase', 'TailMid', 'TailTip', 'Rattle',
    ],
    compatibility: ['idle', 'walk', 'attack', 'death'],
  },
  mech: {
    boneCount: 30,
    description: 'Mechanical/robotic biped',
    rootBone: 'Core',
    bones: [
      'Core', 'Torso', 'ChestPlate', 'Cockpit', 'HeadMount', 'Sensor',
      'LeftShoulderMount', 'LeftArmUpper', 'LeftElbow', 'LeftArmLower', 'LeftHand', 'LeftWeaponMount',
      'RightShoulderMount', 'RightArmUpper', 'RightElbow', 'RightArmLower', 'RightHand', 'RightWeaponMount',
      'LeftHipMount', 'LeftLegUpper', 'LeftKnee', 'LeftLegLower', 'LeftFoot', 'LeftThruster',
      'RightHipMount', 'RightLegUpper', 'RightKnee', 'RightLegLower', 'RightFoot', 'RightThruster',
    ],
    compatibility: ['idle', 'walk', 'run', 'attack', 'jump', 'death'],
  },
} as const;

export type AdditionalSkeletonType = keyof typeof ADDITIONAL_SKELETON_TYPES;

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

export function getAllSkeletonTypes(): string[] {
  return [...getSkeletonTypes(), ...Object.keys(ADDITIONAL_SKELETON_TYPES)];
}

export function getSkeletonConfig(skeletonType: SkeletonType): SkeletonConfig {
  return { ...SKELETON_CONFIGS[skeletonType] };
}

export function getAdditionalSkeletonConfig(skeletonType: AdditionalSkeletonType): SkeletonConfig {
  const config = ADDITIONAL_SKELETON_TYPES[skeletonType];
  return {
    ...config,
    bones: [...config.bones],
    compatibility: [...config.compatibility],
  };
}

export function getAnySkeletonConfig(skeletonType: string): SkeletonConfig | null {
  if (skeletonType in SKELETON_CONFIGS) {
    return { ...SKELETON_CONFIGS[skeletonType as SkeletonType] };
  }
  if (skeletonType in ADDITIONAL_SKELETON_TYPES) {
    const config = ADDITIONAL_SKELETON_TYPES[skeletonType as AdditionalSkeletonType];
    return {
      ...config,
      bones: [...config.bones],
      compatibility: [...config.compatibility],
    };
  }
  return null;
}

export function isAnimationCompatible(skeletonType: string, animationType: string): boolean {
  const config = getAnySkeletonConfig(skeletonType);
  if (!config) return false;
  return config.compatibility.includes(animationType);
}

export function getCompatibleAnimations(skeletonType: string): string[] {
  const config = getAnySkeletonConfig(skeletonType);
  if (!config) return [];
  return [...config.compatibility];
}

export function getBoneHierarchy(skeletonType: string): { bones: string[]; rootBone: string } | null {
  const config = getAnySkeletonConfig(skeletonType);
  if (!config) return null;
  return { bones: [...config.bones], rootBone: config.rootBone };
}

export function suggestSkeletonForCharacter(characterDescription: string): string {
  const desc = characterDescription.toLowerCase();
  
  // Check for specific creature types
  if (desc.includes('spider') || desc.includes('arachnid') || desc.includes('tarantula')) {
    return 'spider';
  }
  if (desc.includes('snake') || desc.includes('serpent') || desc.includes('worm')) {
    return 'snake';
  }
  if (desc.includes('bird') || desc.includes('flying') || desc.includes('wings')) {
    return 'bird';
  }
  if (desc.includes('fish') || desc.includes('swimming') || desc.includes('aquatic')) {
    return 'fish';
  }
  if (desc.includes('mech') || desc.includes('robot') || desc.includes('mechanical')) {
    return 'mech';
  }
  if (desc.includes('dog') || desc.includes('cat') || desc.includes('wolf') || 
      desc.includes('horse') || desc.includes('animal') || desc.includes('beast')) {
    return 'quadruped';
  }
  if (desc.includes('blob') || desc.includes('slime') || desc.includes('amorphous')) {
    return 'custom';
  }
  
  // Default to biped for humanoid characters
  return 'biped';
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
