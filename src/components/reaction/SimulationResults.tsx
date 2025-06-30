import React, { useState } from 'react';
import { 
  Download,
  Share2,
  AlertTriangle,
  Info,
  ChevronRight,
  ArrowUpDown,
  Beaker
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface SimulationResultsProps {
  reactionData: {
    reactants: string[];
    products: string[];
    energyChange: number;
    reactionType: string;
    safetyWarnings: string[];
    yieldPercentage: number;
  };
  comparisonData?: {
    reactionId: string;
    name: string;
    yield: number;
    energyChange: number;
  }[];
  relatedReactions?: {
    id: string;
    name: string;
    equation: string;
  }[];
}

const SimulationResults: React.FC<SimulationResultsProps> = ({
  reactionData,
  comparisonData,
  relatedReactions
}) => {
  const isDark = useThemeStore((state) => state.isDark);
  const [showComparison, setShowComparison] = useState(false);

  const handleDownload = () => {
    const data = {
      reaction: reactionData,
      timestamp: new Date().toISOString(),
      comparison: comparisonData,
      related: relatedReactions
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reaction-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Reaction Simulation Results',
        text: `Check out this chemical reaction simulation: ${reactionData.reactants.join(' + ')} → ${reactionData.products.join(' + ')}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className={`
      rounded-lg shadow-lg overflow-hidden
      ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
    `}>
      {/* Video/Animation Player */}
      <div className="aspect-video bg-black relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Beaker className="h-12 w-12 mx-auto mb-2" />
            <p>Reaction Visualization</p>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="p-6 space-y-6">
        {/* Reaction Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Reaction Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className="text-sm opacity-70 mb-1">Energy Change</p>
              <p className={`text-xl font-semibold ${
                reactionData.energyChange < 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {reactionData.energyChange} kJ/mol
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className="text-sm opacity-70 mb-1">Yield</p>
              <p className="text-xl font-semibold">
                {reactionData.yieldPercentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Safety Warnings */}
        {reactionData.safetyWarnings.length > 0 && (
          <div className={`
            p-4 rounded-lg border
            ${isDark 
              ? 'bg-red-900/20 border-red-700' 
              : 'bg-red-50 border-red-200'
            }
          `}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h4 className="font-semibold">Safety Warnings</h4>
            </div>
            <ul className="space-y-2">
              {reactionData.safetyWarnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Comparison Tool */}
        {comparisonData && (
          <div>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`
                w-full px-4 py-2 rounded-lg flex items-center justify-between
                ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                transition-colors
              `}
            >
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                <span>Compare with Similar Reactions</span>
              </div>
              <ChevronRight 
                className={`h-5 w-5 transition-transform ${showComparison ? 'rotate-90' : ''}`}
              />
            </button>
            
            {showComparison && (
              <div className="mt-4 space-y-3">
                {comparisonData.map((reaction) => (
                  <div
                    key={reaction.reactionId}
                    className={`
                      p-4 rounded-lg
                      ${isDark ? 'bg-gray-700' : 'bg-gray-50'}
                    `}
                  >
                    <p className="font-medium mb-2">{reaction.name}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="opacity-70">Yield: </span>
                        <span>{reaction.yield}%</span>
                      </div>
                      <div>
                        <span className="opacity-70">Energy: </span>
                        <span>{reaction.energyChange} kJ/mol</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Related Reactions */}
        {relatedReactions && relatedReactions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Related Reactions</h3>
            <div className="space-y-2">
              {relatedReactions.map((reaction) => (
                <div
                  key={reaction.id}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-colors
                    ${isDark 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-50 hover:bg-gray-100'
                    }
                  `}
                >
                  <p className="font-medium mb-1">{reaction.name}</p>
                  <p className="text-sm font-mono opacity-70">{reaction.equation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className={`
              flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2
              ${isDark 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-500 hover:bg-blue-600'
              }
              text-white transition-colors
            `}
          >
            <Download className="h-4 w-4" />
            Download Results
          </button>
          <button
            onClick={handleShare}
            className={`
              flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2
              ${isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'
              }
              transition-colors
            `}
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationResults;