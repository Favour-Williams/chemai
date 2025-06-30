import React from 'react';
import { Plus, Beaker } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { Link } from 'react-router-dom';

const commonReactions = [
  { name: 'Water Formation', equation: 'H₂ + O₂ → H₂O' },
  { name: 'Methane Combustion', equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O' },
  { name: 'Salt Formation', equation: 'Na + Cl₂ → 2NaCl' },
];

const ReactionCard: React.FC = () => {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="p-6">
        <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Start New Reaction
        </h2>

        <Link
          to="/reaction/new"
          className={`
            flex items-center justify-center gap-3 w-full p-4 mb-6 rounded-lg border-2 border-dashed
            ${isDark 
              ? 'border-gray-600 hover:border-gray-500 text-gray-300' 
              : 'border-gray-300 hover:border-gray-400 text-gray-600'
            }
            transition-all hover:bg-gray-50/5
          `}
        >
          <Plus className="h-6 w-6" />
          <span className="text-lg">Create New Reaction</span>
        </Link>

        <div className="space-y-4">
          <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Popular Reactions
          </h3>
          {commonReactions.map((reaction, index) => (
            <Link
              key={index}
              to={`/reaction/template/${index}`}
              className={`
                block p-4 rounded-lg
                ${isDark 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-50 hover:bg-gray-100'
                }
                transition-colors
              `}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {reaction.name}
                </span>
                <Beaker className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>
              <div className={`mt-2 font-mono text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {reaction.equation}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/reaction/builder"
            className={`
              text-sm font-medium
              ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}
            `}
          >
            Or build custom reaction →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReactionCard;