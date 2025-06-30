-- Add new columns to reactions table if they don't exist
DO $$ 
BEGIN
  -- Add balanced_equation column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reactions' AND column_name = 'balanced_equation'
  ) THEN
    ALTER TABLE reactions ADD COLUMN balanced_equation text;
  END IF;

  -- Add is_balanced column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reactions' AND column_name = 'is_balanced'
  ) THEN
    ALTER TABLE reactions ADD COLUMN is_balanced boolean DEFAULT false;
  END IF;

  -- Add reaction_conditions column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reactions' AND column_name = 'reaction_conditions'
  ) THEN
    ALTER TABLE reactions ADD COLUMN reaction_conditions jsonb DEFAULT '{}';
  END IF;

  -- Add analysis_result column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reactions' AND column_name = 'analysis_result'
  ) THEN
    ALTER TABLE reactions ADD COLUMN analysis_result text;
  END IF;

  -- Add user_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reactions' AND column_name = 'user_notes'
  ) THEN
    ALTER TABLE reactions ADD COLUMN user_notes text;
  END IF;

  -- Add difficulty_level column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reactions' AND column_name = 'difficulty_level'
  ) THEN
    ALTER TABLE reactions ADD COLUMN difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));
  END IF;

  -- Add real_world_applications column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reactions' AND column_name = 'real_world_applications'
  ) THEN
    ALTER TABLE reactions ADD COLUMN real_world_applications text[];
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reactions_reaction_type ON reactions(reaction_type);
CREATE INDEX IF NOT EXISTS idx_reactions_is_balanced ON reactions(is_balanced);
CREATE INDEX IF NOT EXISTS idx_reactions_difficulty_level ON reactions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_reactions_tags ON reactions USING GIN(tags);

-- Update RLS policies to be more specific about user access
DROP POLICY IF EXISTS "Public reactions are readable" ON reactions;
DROP POLICY IF EXISTS "Users can create reactions" ON reactions;
DROP POLICY IF EXISTS "Users can update own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON reactions;

-- Create new, more specific policies with proper type casting
CREATE POLICY "Users can read public reactions and own reactions" ON reactions
  FOR SELECT USING (
    is_public = true OR 
    created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create reactions" ON reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid()
  );

CREATE POLICY "Users can update their own reactions" ON reactions
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete their own reactions" ON reactions
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
  );

-- Insert some sample reaction data for testing
INSERT INTO reactions (
  name, 
  equation, 
  reactants, 
  products, 
  reaction_type, 
  energy_change, 
  temperature, 
  pressure, 
  safety_warnings, 
  description, 
  mechanism, 
  yield_percentage, 
  is_public, 
  tags,
  balanced_equation,
  is_balanced,
  difficulty_level,
  real_world_applications
) VALUES 
(
  'Water Formation', 
  '2H₂ + O₂ → 2H₂O', 
  ARRAY['H2', 'O2'], 
  ARRAY['H2O'], 
  'synthesis', 
  -571.6, 
  298, 
  1, 
  ARRAY['Highly exothermic reaction', 'Risk of explosion with hydrogen gas', 'Use proper ventilation'], 
  'The synthesis of water from hydrogen and oxygen gases. This is a highly exothermic reaction that releases significant energy.',
  'The reaction proceeds through a radical chain mechanism initiated by a spark or catalyst.',
  99.5, 
  true, 
  ARRAY['synthesis', 'combustion', 'water', 'hydrogen', 'oxygen'],
  '2H₂ + O₂ → 2H₂O',
  true,
  'intermediate',
  ARRAY['fuel cells', 'rocket propulsion', 'energy storage']
),
(
  'Methane Combustion', 
  'CH₄ + 2O₂ → CO₂ + 2H₂O', 
  ARRAY['CH4', 'O2'], 
  ARRAY['CO2', 'H2O'], 
  'combustion', 
  -890.3, 
  298, 
  1, 
  ARRAY['Highly flammable gas', 'Ensure adequate ventilation', 'Risk of carbon monoxide formation in incomplete combustion'], 
  'Complete combustion of methane in oxygen, producing carbon dioxide and water vapor.',
  'Free radical chain reaction involving initiation, propagation, and termination steps.',
  98.2, 
  true, 
  ARRAY['combustion', 'methane', 'natural gas', 'energy'],
  'CH₄ + 2O₂ → CO₂ + 2H₂O',
  true,
  'beginner',
  ARRAY['natural gas heating', 'power generation', 'cooking']
),
(
  'Sodium Chloride Formation', 
  '2Na + Cl₂ → 2NaCl', 
  ARRAY['Na', 'Cl2'], 
  ARRAY['NaCl'], 
  'synthesis', 
  -822.0, 
  298, 
  1, 
  ARRAY['Sodium is highly reactive with water', 'Chlorine gas is toxic', 'Violent reaction - use protective equipment'], 
  'Formation of table salt from sodium metal and chlorine gas.',
  'Direct combination of metal and nonmetal through electron transfer.',
  95.8, 
  true, 
  ARRAY['synthesis', 'ionic', 'salt', 'sodium', 'chlorine'],
  '2Na + Cl₂ → 2NaCl',
  true,
  'advanced',
  ARRAY['food preservation', 'chemical industry', 'de-icing roads']
) ON CONFLICT DO NOTHING;