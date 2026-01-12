import type { GenerationConfig, CharacterStyle, AnimationType, SkeletonType } from '../App';

const STYLES: { value: CharacterStyle; label: string }[] = [
  { value: 'pixel', label: 'Pixel Art' },
  { value: 'anime', label: 'Anime/Chibi' },
  { value: 'lowpoly', label: 'Low Poly' },
  { value: 'painterly', label: 'Painterly' },
  { value: 'voxel', label: 'Voxel' },
];

const ANIMATIONS: { value: AnimationType; label: string }[] = [
  { value: 'idle', label: 'Idle' },
  { value: 'walk', label: 'Walk' },
  { value: 'run', label: 'Run' },
  { value: 'attack', label: 'Attack' },
  { value: 'jump', label: 'Jump' },
  { value: 'death', label: 'Death' },
  { value: 'hurt', label: 'Hurt' },
];

const SKELETONS: { value: SkeletonType; label: string; description: string }[] = [
  { value: 'biped', label: 'Biped', description: '25 bones - humanoid' },
  { value: 'quadruped', label: 'Quadruped', description: '32 bones - animals' },
  { value: 'custom', label: 'Custom', description: '20 bones - flexible' },
];

interface Props {
  config: GenerationConfig;
  onChange: (config: GenerationConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function CharacterForm({ config, onChange, onGenerate, isGenerating }: Props) {
  const toggleAnimation = (anim: AnimationType) => {
    const newAnims = config.animations.includes(anim)
      ? config.animations.filter(a => a !== anim)
      : [...config.animations, anim];
    onChange({ ...config, animations: newAnims.length ? newAnims : ['idle'] });
  };

  return (
    <div className="glass rounded-xl p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Character Description
        </label>
        <textarea
          value={config.prompt}
          onChange={e => onChange({ ...config, prompt: e.target.value })}
          placeholder="e.g., cute pixel knight with sword and shield, golden armor"
          className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
          rows={3}
          disabled={isGenerating}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Art Style</label>
        <div className="grid grid-cols-3 gap-2">
          {STYLES.map(style => (
            <button
              key={style.value}
              onClick={() => onChange({ ...config, style: style.value })}
              disabled={isGenerating}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                config.style === style.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-black/30 text-gray-300 hover:bg-black/50'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Animations</label>
        <div className="flex flex-wrap gap-2">
          {ANIMATIONS.map(anim => (
            <button
              key={anim.value}
              onClick={() => toggleAnimation(anim.value)}
              disabled={isGenerating}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                config.animations.includes(anim.value)
                  ? 'bg-pink-600 text-white'
                  : 'bg-black/30 text-gray-400 hover:bg-black/50'
              }`}
            >
              {anim.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Skeleton Type</label>
        <div className="space-y-2">
          {SKELETONS.map(skel => (
            <button
              key={skel.value}
              onClick={() => onChange({ ...config, skeleton: skel.value })}
              disabled={isGenerating}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition ${
                config.skeleton === skel.value
                  ? 'bg-purple-600/50 border border-purple-500'
                  : 'bg-black/30 border border-transparent hover:border-gray-600'
              }`}
            >
              <span className="font-medium">{skel.label}</span>
              <span className="text-sm text-gray-400">{skel.description}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || !config.prompt.trim()}
        className={`w-full py-3 rounded-lg font-semibold text-white transition ${
          isGenerating || !config.prompt.trim()
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
        }`}
      >
        {isGenerating ? 'Generating...' : 'Generate Character'}
      </button>
    </div>
  );
}
