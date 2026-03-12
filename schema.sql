-- Create chess rooms table
CREATE TABLE IF NOT EXISTS chess_rooms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    white_player_id TEXT,
    black_player_id TEXT,
    game_state JSONB,
    current_turn TEXT DEFAULT 'white',
    game_status TEXT DEFAULT 'waiting', -- waiting, playing, finished
    winner TEXT,
    white_time INTEGER DEFAULT 3600,
    black_time INTEGER DEFAULT 3600
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT REFERENCES chess_rooms(id) ON DELETE CASCADE,
    sender_id TEXT,
    sender_color TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE chess_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Create RLS policies for security
CREATE POLICY "Public access to chess rooms" 
  ON chess_rooms 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to chat messages" 
  ON chat_messages 
  USING (true)
  WITH CHECK (true);
