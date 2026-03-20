CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent text NOT NULL DEFAULT 'marg',
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  has_audio boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_chat_agent ON chat_messages(agent);
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON chat_messages FOR ALL USING (true);
