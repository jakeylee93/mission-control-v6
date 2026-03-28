-- App Roadmap table — tracks all Mission Control apps, ideas, and progress
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS app_roadmap (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '📱',
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'planned', 'building', 'live', 'review')),
  category TEXT DEFAULT 'business' CHECK (category IN ('business', 'personal', 'laboratory')),
  phases JSONB DEFAULT '[]'::jsonb,
  ideas JSONB DEFAULT '[]'::jsonb,
  fixes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate with existing apps
INSERT INTO app_roadmap (name, description, icon, status, category, phases, ideas, fixes) VALUES
  ('Email', 'Gmail integration — inbox, compose, search', '📧', 'planned', 'business', '[]', '[]', '[]'),
  ('Calendar', 'Google Calendar — events, scheduling', '📅', 'live', 'business', '[{"name":"Basic calendar view","done":true},{"name":"Calendar filter pills","done":true},{"name":"Event creation","done":false}]', '[]', '[]'),
  ('Costs', 'Business expense tracking and budgeting', '💰', 'idea', 'business', '[]', '[]', '[]'),
  ('Analytics', 'Business metrics dashboard', '📊', 'idea', 'business', '[]', '[]', '[]'),
  ('Tasks', 'Task management and to-do lists', '✅', 'idea', 'business', '[]', '[]', '[]'),
  ('Contacts', 'Contact management via Google Contacts', '👥', 'idea', 'business', '[]', '[]', '[]'),
  ('Docs', 'Document viewer and organizer', '📄', 'live', 'business', '[]', '[]', '[]'),
  ('Plans', 'Business plans and strategy notes', '📝', 'live', 'business', '[]', '[]', '[]'),
  ('Alerts', 'Notification center', '🔔', 'idea', 'business', '[]', '[]', '[]'),
  ('Websites', 'Portfolio and website management', '🌐', 'live', 'business', '[]', '[]', '[]'),
  ('Messages', 'Unified messaging across platforms', '💬', 'idea', 'business', '[]', '[]', '[]'),
  ('News & Mail', 'Multi-brand news aggregation + newsletter builder with AI drafting, campaigns, Stitch templates, Resend integration', '📰', 'live', 'business', '[{"name":"News feed from custom sources","done":true},{"name":"Multi-brand system","done":true},{"name":"AI newsletter drafting","done":true},{"name":"Campaign management","done":true},{"name":"Stitch template import","done":true},{"name":"Visual email editor","done":true},{"name":"Article timestamps fix","done":true},{"name":"Hide/dismiss articles","done":true},{"name":"Resend API sending","done":false},{"name":"Subscriber management","done":false}]', '["Auto-schedule newsletter sends","Brand-specific email templates","A/B subject line testing"]', '["Industries/creators not filtered by brand_id","No category filters in feed","Templates leaking across brands"]'),
  ('Weather', 'Weather forecasts via wttr.in', '☀️', 'live', 'personal', '[]', '[]', '[]'),
  ('Health', 'Health tracking and wellness', '❤️', 'live', 'personal', '[]', '[]', '[]'),
  ('Music', 'Music player integration', '🎵', 'idea', 'personal', '[]', '[]', '[]'),
  ('Photos', 'Photo gallery and management', '📸', 'idea', 'personal', '[]', '[]', '[]'),
  ('Maps', 'Location and navigation', '📍', 'live', 'personal', '[]', '[]', '[]'),
  ('Notes', 'Personal notes', '📝', 'idea', 'personal', '[]', '[]', '[]'),
  ('Shopping', 'Shopping lists and tracking', '🛒', 'idea', 'personal', '[]', '[]', '[]'),
  ('Home', 'Smart home controls', '🏠', 'idea', 'personal', '[]', '[]', '[]'),
  ('Reading', 'Reading list and media tracker', '📚', 'live', 'personal', '[]', '[]', '[]'),
  ('Downtime', 'Screen time and focus modes', '🌙', 'idea', 'personal', '[]', '[]', '[]'),
  ('Lovely', 'Relationship tracker and date ideas', '💛', 'live', 'personal', '[]', '[]', '[]'),
  ('Agents', 'AI agent management and monitoring', '🤖', 'live', 'laboratory', '[]', '[]', '[]'),
  ('Memory', 'Agent memory viewer', '🧠', 'live', 'laboratory', '[]', '[]', '[]'),
  ('Settings', 'System configuration', '⚙️', 'live', 'laboratory', '[]', '[]', '[]'),
  ('Skill Shop', 'Browse and manage agent skills', '🎨', 'live', 'laboratory', '[]', '[]', '[]'),
  ('Social Media Manager', 'Multi-brand social media scheduling, posting, and Stitch graphic generation across X, Instagram, Facebook, LinkedIn', '📱', 'idea', 'business', '[{"name":"App shell + brand integration","done":false},{"name":"Post composer","done":false},{"name":"Stitch graphic generation","done":false},{"name":"Calendar view + scheduling","done":false},{"name":"X/Twitter API connection","done":false},{"name":"Meta API (Instagram + Facebook)","done":false},{"name":"LinkedIn API","done":false},{"name":"Cross-app links (News Hub share)","done":false},{"name":"Client approval workflow","done":false},{"name":"Analytics dashboard","done":false}]', '["One-tap share from News Hub articles","Quick post templates per brand","Event promo graphic generator","Content calendar drag-to-reschedule","Client portal for post approval"]', '[]');
