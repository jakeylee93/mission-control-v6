-- News & Mail Platform — Supabase Tables
-- Run this in your Supabase SQL Editor

-- 1. Brands (replaces hardcoded businesses)
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  logo_url TEXT,
  tone TEXT DEFAULT 'professional',
  is_client BOOLEAN DEFAULT FALSE,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT,
  font TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed your existing businesses
INSERT INTO brands (id, name, color, is_client) VALUES
  ('barpeople', 'The Bar People', '#ef4444', false),
  ('anyvendor', 'AnyVendor', '#f59e0b', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Add brand_id to existing tables
ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES brands(id);
ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'website';

ALTER TABLE news_industries ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES brands(id);
ALTER TABLE news_creators ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES brands(id);

-- 3. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_id TEXT REFERENCES brands(id),
  sections JSONB DEFAULT '[]',
  header_image TEXT,
  footer_html TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#f0eee8',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  brand_id TEXT REFERENCES brands(id),
  folder TEXT DEFAULT 'newsletters',
  template_id UUID REFERENCES email_templates(id),
  sections JSONB DEFAULT '[]',
  subject_line TEXT,
  html_content TEXT,
  list_id UUID,
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Subscriber Lists
CREATE TABLE IF NOT EXISTS subscriber_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_id TEXT REFERENCES brands(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Subscriber Members (many-to-many)
CREATE TABLE IF NOT EXISTS subscriber_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES subscriber_lists(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  tags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, subscriber_id)
);
