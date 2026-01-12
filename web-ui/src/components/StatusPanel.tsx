import type { GenerationStatus } from '../App';

const STAGE_LABELS: Record<GenerationStatus['stage'], string> = {
  idle: 'Ready',
  image: 'Image Generation',
  video: 'Animation',
  rigging: '3D Rigging',
  export: 'Export',
  complete: 'Complete',
  error: 'Error',
};

const STAGE_COLORS: Record<GenerationStatus['stage'], string> = {
  idle: 'bg-gray-500',
  image: 'bg-blue-500',
  video: 'bg-purple-500',
  rigging: 'bg-orange-500',
  export: 'bg-green-500',
  complete: 'bg-emerald-500',
  error: 'bg-red-500',
};

interface Props {
  status: GenerationStatus;
}

export default function StatusPanel({ status }: Props) {
  const isActive = status.stage !== 'idle' && status.stage !== 'complete' && status.stage !== 'error';

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">Status</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STAGE_COLORS[status.stage]} text-white`}>
          {STAGE_LABELS[status.stage]}
        </span>
      </div>

      <div className="h-2 bg-black/30 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-500 ${STAGE_COLORS[status.stage]}`}
          style={{ width: `${status.progress}%` }}
        />
      </div>

      <p className={`text-sm ${status.stage === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
        {status.message}
      </p>

      {isActive && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          Processing...
        </div>
      )}

      {status.result && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <h4 className="text-sm font-medium text-emerald-400 mb-2">Generation Complete</h4>
          <dl className="text-xs space-y-1">
            <div className="flex justify-between">
              <dt className="text-gray-400">Character:</dt>
              <dd className="text-white">{status.result.characterName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Animations:</dt>
              <dd className="text-white">{status.result.animations.join(', ')}</dd>
            </div>
          </dl>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-medium transition">
              Download GLB
            </button>
            <button className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition">
              View Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
