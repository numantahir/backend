-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.user_save_profiles;
DROP TABLE IF EXISTS public.user_social_links;
DROP TABLE IF EXISTS public.social_media_platforms;
DROP TABLE IF EXISTS public.users;

-- Create users table
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    user_profile_url TEXT,
    bio TEXT,
    website TEXT,
    profile_image TEXT,
    cover_image TEXT,
    phone TEXT,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create social_media_platforms table
CREATE TABLE public.social_media_platforms (
    id BIGSERIAL PRIMARY KEY,
    social_name TEXT NOT NULL UNIQUE,
    social_icon TEXT NOT NULL,
    social_status INTEGER NOT NULL DEFAULT 1,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_social_links table with explicit foreign key names
CREATE TABLE public.user_social_links (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    social_type_id BIGINT NOT NULL,
    social_link TEXT NOT NULL,
    user_social_status INTEGER NOT NULL DEFAULT 1,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_social_links_user
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_social_links_platform
        FOREIGN KEY (social_type_id) 
        REFERENCES public.social_media_platforms(id) 
        ON DELETE CASCADE
);

-- Create user_save_profiles table with explicit foreign key names
CREATE TABLE public.user_save_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    profile_id BIGINT NOT NULL,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_save_profiles_user
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_save_profiles_profile
        FOREIGN KEY (profile_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE,
    CONSTRAINT unique_user_profile UNIQUE(user_id, profile_id)
);

-- Create indexes
CREATE INDEX idx_user_social_links_user_id ON public.user_social_links(user_id);
CREATE INDEX idx_user_social_links_social_type_id ON public.user_social_links(social_type_id);
CREATE INDEX idx_user_save_profiles_user_id ON public.user_save_profiles(user_id);
CREATE INDEX idx_user_save_profiles_profile_id ON public.user_save_profiles(profile_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_save_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on id" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for social_media_platforms
CREATE POLICY "Enable read access for all users" ON public.social_media_platforms
    FOR SELECT USING (true);

-- Create policies for user_social_links
CREATE POLICY "Enable all access for users" ON public.user_social_links
    FOR ALL USING (true);

-- Create policies for user_save_profiles
CREATE POLICY "Enable all access for users" ON public.user_save_profiles
    FOR ALL USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema'; 