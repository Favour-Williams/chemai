/*
  # Initial Schema for Chemistry Platform

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password` (text, hashed)
      - `name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `preferences` (jsonb)
      - `is_active` (boolean)
      - `last_login` (timestamp)

    - `elements`
      - `id` (uuid, primary key)
      - `symbol` (text, unique)
      - `name` (text)
      - `atomic_number` (integer)
      - `atomic_mass` (numeric)
      - `category` (text)
      - `color` (text)
      - `electron_configuration` (text)
      - `melting_point` (numeric)
      - `boiling_point` (numeric)
      - `density` (numeric)
      - `uses` (text[])
      - `safety_info` (text)
      - `discovered_by` (text)
      - `discovery_year` (integer)
      - `group_number` (integer)
      - `period` (integer)
      - `block` (text)
      - `oxidation_states` (integer[])
      - `electronegativity` (numeric)
      - `ionization_energy` (numeric)
      - `atomic_radius` (numeric)
      - `crystal_structure` (text)

    - `reactions`
      - `id` (uuid, primary key)
      - `name` (text)
      - `equation` (text)
      - `reactants` (text[])
      - `products` (text[])
      - `reaction_type` (text)
      - `energy_change` (numeric)
      - `temperature` (numeric)
      - `pressure` (numeric)
      - `catalyst` (text)
      - `safety_warnings` (text[])
      - `description` (text)
      - `mechanism` (text)
      - `yield_percentage` (numeric)
      - `created_by` (uuid, references users)
      - `created_at` (timestamp)
      - `is_public` (boolean)
      - `tags` (text[])

    - `chat_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `title` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean)

    - `chat_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references chat_conversations)
      - `user_id` (uuid, references users)
      - `message` (text)
      - `response` (text)
      - `timestamp` (timestamp)
      - `context` (jsonb)
      - `rating` (integer)

    - `safety_data`
      - `id` (uuid, primary key)
      - `element_symbol` (text, references elements.symbol)
      - `hazard_level` (text)
      - `hazard_types` (text[])
      - `precautions` (text[])
      - `first_aid` (jsonb)
      - `storage` (text)
      - `disposal` (text)
      - `incompatible_with` (text[])
      - `emergency_procedures` (text[])

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access where appropriate
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  preferences jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_login timestamptz
);

-- Create elements table
CREATE TABLE IF NOT EXISTS elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text UNIQUE NOT NULL,
  name text NOT NULL,
  atomic_number integer NOT NULL,
  atomic_mass numeric NOT NULL,
  category text NOT NULL,
  color text DEFAULT '#cccccc',
  electron_configuration text,
  melting_point numeric,
  boiling_point numeric,
  density numeric,
  uses text[] DEFAULT '{}',
  safety_info text,
  discovered_by text,
  discovery_year integer,
  group_number integer,
  period integer,
  block text,
  oxidation_states integer[] DEFAULT '{}',
  electronegativity numeric,
  ionization_energy numeric,
  atomic_radius numeric,
  crystal_structure text
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  equation text NOT NULL,
  reactants text[] NOT NULL,
  products text[] NOT NULL,
  reaction_type text NOT NULL,
  energy_change numeric,
  temperature numeric,
  pressure numeric,
  catalyst text,
  safety_warnings text[] DEFAULT '{}',
  description text,
  mechanism text,
  yield_percentage numeric,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT true,
  tags text[] DEFAULT '{}'
);

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  message text NOT NULL,
  response text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  context jsonb DEFAULT '{}',
  rating integer CHECK (rating >= 1 AND rating <= 5)
);

-- Create safety_data table
CREATE TABLE IF NOT EXISTS safety_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  element_symbol text NOT NULL,
  hazard_level text NOT NULL CHECK (hazard_level IN ('low', 'medium', 'high', 'extreme')),
  hazard_types text[] DEFAULT '{}',
  precautions text[] DEFAULT '{}',
  first_aid jsonb DEFAULT '{}',
  storage text,
  disposal text,
  incompatible_with text[] DEFAULT '{}',
  emergency_procedures text[] DEFAULT '{}'
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_data ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for elements table (public read)
CREATE POLICY "Elements are publicly readable" ON elements
  FOR SELECT USING (true);

-- Create policies for reactions table
CREATE POLICY "Public reactions are readable" ON reactions
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create reactions" ON reactions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own reactions" ON reactions
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own reactions" ON reactions
  FOR DELETE USING (auth.uid() = created_by);

-- Create policies for chat_conversations table
CREATE POLICY "Users can read own conversations" ON chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations" ON chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON chat_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for chat_messages table
CREATE POLICY "Users can read own messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for safety_data table (public read)
CREATE POLICY "Safety data is publicly readable" ON safety_data
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_elements_symbol ON elements(symbol);
CREATE INDEX IF NOT EXISTS idx_elements_atomic_number ON elements(atomic_number);
CREATE INDEX IF NOT EXISTS idx_reactions_created_by ON reactions(created_by);
CREATE INDEX IF NOT EXISTS idx_reactions_is_public ON reactions(is_public);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_data_element_symbol ON safety_data(element_symbol);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();