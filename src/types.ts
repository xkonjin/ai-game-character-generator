export type CharacterStyle = 'pixel' | 'anime' | 'lowpoly' | 'painterly' | 'voxel';

export type AnimationType = 'idle' | 'walk' | 'run' | 'attack' | 'jump' | 'death' | 'hurt';

export type SkeletonType = 'biped' | 'quadruped' | 'custom';

export interface GenerationConfig {
  prompt: string;
  style: CharacterStyle;
  animations: AnimationType[];
  resolution: number;
  skeleton: SkeletonType;
  outputDir: string;
}

export interface ImageGenResult {
  imagePath: string;
  prompt: string;
  provider: 'openai' | 'stability' | 'pixellab';
  metadata: Record<string, unknown>;
}

export interface VideoGenResult {
  videoPath: string;
  animationType: AnimationType;
  duration: number;
  fps: number;
}

export interface RiggingResult {
  modelPath: string;
  riggedModelPath: string;
  skeletonType: SkeletonType;
  boneCount: number;
}

export interface ExportResult {
  glbPath: string;
  previewPath: string;
  fileSize: number;
  animations: string[];
}

export interface PipelineResult {
  characterName: string;
  imageGen: ImageGenResult;
  videoGen: VideoGenResult[];
  rigging: RiggingResult;
  export: ExportResult;
  metadata: {
    createdAt: string;
    totalDuration: number;
    config: GenerationConfig;
  };
}

export interface TripoTask {
  task_id: string;
  type: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  progress: number;
  output?: {
    model?: string;
    rendered_image?: string;
  };
}

export interface VeoRequest {
  model: string;
  prompt: string;
  image?: string;
  duration: string;
  aspectRatio: string;
}

export interface VeoResponse {
  name: string;
  done: boolean;
  response?: {
    generatedSamples: Array<{
      video: {
        uri: string;
      };
    }>;
  };
}
