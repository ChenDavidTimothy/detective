-- -------------------------------------
-- CLEAR EXISTING TABLES AND FUNCTIONS
-- -------------------------------------
DROP TABLE IF EXISTS public.user_purchases;
DROP TABLE IF EXISTS public.detective_cases;
DROP TABLE IF EXISTS public.user_preferences;
DROP TABLE IF EXISTS public.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- -------------------------------------
-- USER RELATED TABLES
-- -------------------------------------

-- Users table with minimal, essential fields
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User preferences for application settings
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  has_completed_onboarding BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT user_preferences_user_id_key UNIQUE (user_id)
);

-- -------------------------------------
-- DETECTIVE CASE TABLES
-- -------------------------------------

-- Detective cases for purchase
CREATE TABLE public.detective_cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  image_url TEXT,
  content TEXT, -- Full case content visible only to purchasers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Records of user case purchases
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  case_id TEXT NOT NULL REFERENCES public.detective_cases(id),
  payment_id TEXT NOT NULL, -- PayPal payment ID
  amount NUMERIC(10, 2) NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT user_purchases_user_case_unique UNIQUE(user_id, case_id)
);

-- -------------------------------------
-- FUNCTIONS AND TRIGGERS
-- -------------------------------------

-- Function to automatically create a public user record when auth.users is updated
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -------------------------------------
-- ROW LEVEL SECURITY POLICIES
-- -------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detective_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role has full access to users" ON public.users
  FOR ALL TO service_role USING (true);

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to preferences" ON public.user_preferences
  FOR ALL TO service_role USING (true);

-- Detective cases policies
CREATE POLICY "Detective cases are visible to all" ON public.detective_cases
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage detective cases" ON public.detective_cases
  FOR ALL TO service_role USING (true);

-- User purchases policies
CREATE POLICY "Users can view their own purchases" ON public.user_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON public.user_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all purchases" ON public.user_purchases
  FOR ALL TO service_role USING (true);

-- -------------------------------------
-- INITIAL SEED DATA
-- -------------------------------------

-- Seed detective cases
INSERT INTO public.detective_cases (id, title, description, price, difficulty, image_url, content)
VALUES
  (
    'case-001',
    'The Missing Artifact',
    'A valuable artifact has disappeared from the city museum. Can you track down the thief?',
    9.99,
    'easy',
    '/images/cases/missing-artifact.jpg',
    'This is the full case content for The Missing Artifact. This detailed case file includes witness statements, evidence photos, and clues that will help you solve the mystery of the missing museum artifact. The content is only visible to users who have purchased this case.'
  ),
  (
    'case-002', 
    'The Encrypted Message',
    'An encrypted message was found at a crime scene. Decode the message to find the culprit.',
    14.99,
    'medium',
    '/images/cases/encrypted-message.jpg',
    'This is the full case content for The Encrypted Message. Included are several encrypted notes, a cipher key that may or may not be relevant, and background information on potential suspects. Can you crack the code and identify the perpetrator?'
  ),
  (
    'case-003',
    'The Double Murder',
    'Two victims found in separate locations but killed by the same person. Connect the dots.',
    19.99,
    'hard',
    '/images/cases/double-murder.jpg',
    'This is the full case content for The Double Murder. This complex case involves two crime scenes, forensic reports, timeline discrepancies, and a list of suspects with seemingly airtight alibis. Your challenge is to find the connection between these two murders and identify the killer who thought they were clever enough to get away with it.'
  ),
  (
    'case-004',
    'The Corporate Sabotage',
    'Someone is sabotaging a tech company from the inside. Identify the mole.',
    12.99,
    'medium',
    '/images/cases/corporate-sabotage.jpg',
    'This is the full case content for The Corporate Sabotage. Inside you will find employee interviews, security logs, compromised code snippets, and communications that were leaked to a competitor. Your job is to sift through the corporate politics and technical details to identify which employee is working against the company.'
  ),
  (
    'case-005',
    'The Vanishing Witness',
    'A key witness has disappeared before the trial. Find them before it's too late.',
    15.99,
    'medium',
    '/images/cases/vanishing-witness.jpg',
    'This is the full case content for The Vanishing Witness. This time-sensitive case includes the witness''s personal history, recent communications, possible threat assessments, and the last known whereabouts. Can you determine if they left voluntarily or were taken, and locate them before critical testimony is lost forever?'
  );