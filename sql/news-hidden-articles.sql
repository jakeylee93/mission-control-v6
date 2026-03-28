-- Hidden articles table — articles dismissed from the feed
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS news_hidden_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  business TEXT NOT NULL,
  hidden_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, business)
);

-- Index for fast lookups when filtering the feed
CREATE INDEX IF NOT EXISTS idx_news_hidden_business ON news_hidden_articles(business);
CREATE INDEX IF NOT EXISTS idx_news_hidden_article ON news_hidden_articles(article_id);
