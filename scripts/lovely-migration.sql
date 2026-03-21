CREATE TABLE IF NOT EXISTS lovely_checkins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date text NOT NULL,
  mood integer NOT NULL DEFAULT 3,
  energy integer NOT NULL DEFAULT 3,
  sleep numeric NOT NULL DEFAULT 7,
  gratitude text DEFAULT '',
  wins text DEFAULT '',
  note text DEFAULT '',
  self_care text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX idx_lovely_date ON lovely_checkins(date);
ALTER TABLE lovely_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all ON lovely_checkins FOR ALL USING (true);
