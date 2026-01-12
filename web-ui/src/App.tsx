import { useState } from 'react';
import CharacterForm from './components/CharacterForm';
import Preview3D from './components/Preview3D';
import StatusPanel from './components/StatusPanel';

export type CharacterStyle = 'pixel' | 'anime' | 'lowpoly' | 'painterly' | 'voxel';
export type AnimationType = 'idle' | 'walk' | 'run' | 'attack' | 'jump' | 'death' | 'hurt';
export type SkeletonType = 'biped' | 'quadruped' | 'custom';

export interface GenerationConfig {
  prompt: string;
  style: CharacterStyle;
  animations: AnimationType[];
  skeleton: SkeletonType;
}

export interface GenerationStatus {
  stage: 'idle' | 'image' | 'video' | 'rigging' | 'export' | 'complete' | 'error';
  progress: number;
  message: string;
  result?: GenerationResult;
}

export interface GenerationResult {
  characterName: string;
  imagePath: string;
  modelPath: string;
  previewPath: string;
  animations: string[];
}

function App() {
  const [config, setConfig] = useState<GenerationConfig>({
    prompt: '',
    style: 'pixel',
    animations: ['idle'],
    skeleton: 'biped',
  });

  const [status, setStatus] = useState<GenerationStatus>({
    stage: 'idle',
    progress: 0,
    message: 'Ready to generate',
  });

  const handleGenerate = async () => {
    if (!config.prompt.trim()) {
      setStatus({ stage: 'error', progress: 0, message: 'Please enter a character description' });
      return;
    }

    try {
      setStatus({ stage: 'image', progress: 10, message: 'Generating sprite...' });

      // Simulate API call - in production, call actual backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus({ stage: 'video', progress: 30, message: 'Creating animations...' });

      await new Promise(resolve => setTimeout(resolve, 2000));
      setStatus({ stage: 'rigging', progress: 60, message: 'Building 3D model...' });

      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus({ stage: 'export', progress: 85, message: 'Exporting for Three.js...' });

      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus({
        stage: 'complete',
        progress: 100,
        message: 'Character generated successfully!',
        result: {
          characterName: config.prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '_'),
          imagePath: '/output/sprite.png',
          modelPath: '/output/model.glb',
          previewPath: '/output/preview.html',
          animations: config.animations,
        },
      });
    } catch (error) {
      setStatus({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Generation failed',
      });
    }
  };

  return (
    <div className="min-h-screen text-white p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          AI Game Character Generator
        </h1>
        <p className="text-gray-400 mt-2">Create animated 3D game characters from text prompts</p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <CharacterForm
            config={config}
            onChange={setConfig}
            onGenerate={handleGenerate}
            isGenerating={status.stage !== 'idle' && status.stage !== 'complete' && status.stage !== 'error'}
          />
          <StatusPanel status={status} />
        </div>

        <div className="glass rounded-xl p-4 min-h-[500px]">
          <Preview3D result={status.result} />
        </div>
      </main>

      <footer className="text-center text-gray-500 mt-12 text-sm">
        Powered by OpenAI, Google Veo, Tripo AI, and Three.js
      </footer>
    </div>
  );
}

export default App;
