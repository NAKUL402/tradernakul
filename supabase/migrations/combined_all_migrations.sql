-- ============================================================================
-- TRADERNAKUL COMBINED PRODUCTION MIGRATION (100% IDEMPOTENT & SAFE TO RUN MULTIPLE TIMES)
-- Owner: nakultrader007@gmail.com
-- Safe: Uses IF NOT EXISTS, CREATE OR REPLACE, DROP POLICY IF EXISTS & ON CONFLICT DO NOTHING
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE & SAAS AUTH TRIGGERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'enterprise')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a SECURITY DEFINER function to check admin/owner status without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR is_owner = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update user status" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update subscription plans" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (
    public.is_admin_or_owner()
);
CREATE POLICY "Admins can update user status" ON public.profiles FOR UPDATE TO authenticated USING (
    public.is_admin_or_owner()
) WITH CHECK (
    public.is_admin_or_owner()
);
CREATE POLICY "Admins can delete user profiles" ON public.profiles FOR DELETE TO authenticated USING (
    public.is_admin_or_owner()
);

CREATE OR REPLACE FUNCTION public.prevent_owner_demotion_or_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' AND OLD.is_owner = TRUE THEN
        RAISE EXCEPTION 'CRITICAL SECURITY: Owner profile cannot be deleted.';
    END IF;
    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_owner = TRUE AND (NEW.is_owner = FALSE OR NEW.role != 'admin' OR NEW.status != 'approved') THEN
            RAISE EXCEPTION 'CRITICAL SECURITY: Owner account role, status, and owner status are immutable.';
        END IF;
        IF OLD.is_owner = FALSE AND NEW.is_owner = TRUE THEN
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_owner = TRUE) THEN
                RAISE EXCEPTION 'CRITICAL SECURITY: Only existing Owner can assign owner privileges.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_owner ON public.profiles;
CREATE TRIGGER trg_protect_owner BEFORE UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_owner_demotion_or_deletion();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INT;
    is_first_or_owner BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.profiles;

    IF user_count = 0 OR NEW.email = 'nakulrathi641@gmail.com' THEN
        is_first_or_owner := TRUE;
    ELSE
        is_first_or_owner := FALSE;
    END IF;

    INSERT INTO public.profiles (
        id, email, full_name, avatar_url, role, status, is_owner, subscription_plan, subscription_status
    )
    VALUES (
        NEW.id, NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Trader'),
        NEW.raw_user_meta_data->>'avatar_url',
        CASE WHEN is_first_or_owner THEN 'admin' ELSE 'user' END,
        CASE WHEN is_first_or_owner THEN 'approved' ELSE 'pending' END,
        is_first_or_owner,
        CASE WHEN is_first_or_owner THEN 'enterprise' ELSE 'free' END,
        'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. SITE SETTINGS TABLE (NO-CODE CONTROL PANEL)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    announcement_banner TEXT DEFAULT '',
    banner_active BOOLEAN DEFAULT FALSE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    ai_coach_enabled BOOLEAN DEFAULT TRUE,
    mt5_sync_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT single_row_check CHECK (id = 1)
);

INSERT INTO public.site_settings (id, announcement_banner, banner_active, maintenance_mode, ai_coach_enabled, mt5_sync_enabled)
VALUES (1, 'Welcome to TraderNakul — Professional AI Trading Journal', FALSE, FALSE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;

CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (
    public.is_admin_or_owner()
) WITH CHECK (
    public.is_admin_or_owner()
);

-- ----------------------------------------------------------------------------
-- 3. TRADES DATABASE & SCREENSHOTS STORAGE (ROW LEVEL SECURITY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    pair TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('Buy', 'Sell')),
    session TEXT NOT NULL CHECK (session IN ('Asian', 'London', 'New York')),
    entry_time TEXT NOT NULL, exit_time TEXT NOT NULL,
    entry_price NUMERIC NOT NULL, exit_price NUMERIC NOT NULL,
    stop_loss NUMERIC, take_profit NUMERIC,
    result TEXT NOT NULL CHECK (result IN ('Win', 'Loss')),
    rrr NUMERIC NOT NULL DEFAULT 1.0, risk_pct NUMERIC NOT NULL DEFAULT 1.0, pnl NUMERIC NOT NULL DEFAULT 0.0,
    setup TEXT NOT NULL, confirmation TEXT DEFAULT '', notes TEXT DEFAULT '', screenshot_url TEXT DEFAULT '', tags TEXT[] DEFAULT '{}',
    mt5_order_id TEXT DEFAULT NULL, broker TEXT DEFAULT NULL, account_number TEXT DEFAULT NULL, lot_size NUMERIC DEFAULT NULL, commission NUMERIC DEFAULT NULL, swap NUMERIC DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_date ON public.trades(date);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own trades" ON public.trades;
DROP POLICY IF EXISTS "Users insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Users update own trades" ON public.trades;
DROP POLICY IF EXISTS "Users delete own trades" ON public.trades;
DROP POLICY IF EXISTS "Admins view all trades" ON public.trades;

CREATE POLICY "Users view own trades" ON public.trades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own trades" ON public.trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own trades" ON public.trades FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own trades" ON public.trades FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all trades" ON public.trades FOR SELECT TO authenticated USING (
    public.is_admin_or_owner()
);

INSERT INTO storage.buckets (id, name, public) VALUES ('trade-screenshots', 'trade-screenshots', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users Upload Own Screenshots" ON storage.objects;

CREATE POLICY "Public Read Screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'trade-screenshots');
CREATE POLICY "Users Upload Own Screenshots" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ----------------------------------------------------------------------------
-- 4. USER API KEYS TABLE (MT5 INTEGRATION FOUNDATION)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_label TEXT DEFAULT 'MT5 EA Key',
    api_key TEXT UNIQUE NOT NULL,
    account_number TEXT DEFAULT NULL,
    broker_name TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_api_key ON public.user_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users insert own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users delete own API keys" ON public.user_api_keys;

CREATE POLICY "Users view own API keys" ON public.user_api_keys FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own API keys" ON public.user_api_keys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own API keys" ON public.user_api_keys FOR DELETE TO authenticated USING (auth.uid() = user_id);
- -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   T R A D E R N A K U L   -   U S E R   S E T T I N G S   T A B L E   M I G R A T I O N  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . u s e r _ s e t t i n g s   (  
         u s e r _ i d   U U I D   P R I M A R Y   K E Y   R E F E R E N C E S   a u t h . u s e r s ( i d )   O N   D E L E T E   C A S C A D E ,  
         t h e m e   T E X T   D E F A U L T   ' s y s t e m '   C H E C K   ( t h e m e   I N   ( ' d a r k ' ,   ' l i g h t ' ,   ' s y s t e m ' ) ) ,  
         a c c e n t _ c o l o r   T E X T   D E F A U L T   ' o k l c h ( 0 . 6 4   0 . 2 1   2 6 8 ) ' ,  
         c o m p a c t _ u i   B O O L E A N   D E F A U L T   F A L S E ,  
         c u r r e n c y   T E X T   D E F A U L T   ' U S D   ( $ ) ' ,  
         d e f a u l t _ s e s s i o n   T E X T   D E F A U L T   N U L L   C H E C K   ( d e f a u l t _ s e s s i o n   I N   ( ' A s i a n ' ,   ' L o n d o n ' ,   ' N e w   Y o r k ' ,   N U L L ) ) ,  
         d e f a u l t _ r i s k _ p c t   N U M E R I C   D E F A U L T   N U L L ,  
         d e f a u l t _ r r r   T E X T   D E F A U L T   N U L L ,  
         d a i l y _ s u m m a r y   B O O L E A N   D E F A U L T   T R U E ,  
         w e e k l y _ r e p o r t   B O O L E A N   D E F A U L T   T R U E ,  
         a i _ c o a c h _ a l e r t s   B O O L E A N   D E F A U L T   F A L S E ,  
         a i _ r e s p o n s e _ s t y l e   T E X T   D E F A U L T   ' B a l a n c e d '   C H E C K   ( a i _ r e s p o n s e _ s t y l e   I N   ( ' C o n c i s e ' ,   ' B a l a n c e d ' ,   ' D e t a i l e d ' ) ) ,  
         c r e a t e d _ a t   T I M E S T A M P T Z   N O T   N U L L   D E F A U L T   N O W ( ) ,  
         u p d a t e d _ a t   T I M E S T A M P T Z   N O T   N U L L   D E F A U L T   N O W ( )  
 ) ;  
  
 - -   R L S  
 A L T E R   T A B L E   p u b l i c . u s e r _ s e t t i n g s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
  
 D R O P   P O L I C Y   I F   E X I S T S   " U s e r s   c a n   v i e w   o w n   s e t t i n g s "   O N   p u b l i c . u s e r _ s e t t i n g s ;  
 D R O P   P O L I C Y   I F   E X I S T S   " U s e r s   c a n   i n s e r t   o w n   s e t t i n g s "   O N   p u b l i c . u s e r _ s e t t i n g s ;  
 D R O P   P O L I C Y   I F   E X I S T S   " U s e r s   c a n   u p d a t e   o w n   s e t t i n g s "   O N   p u b l i c . u s e r _ s e t t i n g s ;  
  
 C R E A T E   P O L I C Y   " U s e r s   c a n   v i e w   o w n   s e t t i n g s "   O N   p u b l i c . u s e r _ s e t t i n g s   F O R   S E L E C T   T O   a u t h e n t i c a t e d   U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
 C R E A T E   P O L I C Y   " U s e r s   c a n   i n s e r t   o w n   s e t t i n g s "   O N   p u b l i c . u s e r _ s e t t i n g s   F O R   I N S E R T   T O   a u t h e n t i c a t e d   W I T H   C H E C K   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
 C R E A T E   P O L I C Y   " U s e r s   c a n   u p d a t e   o w n   s e t t i n g s "   O N   p u b l i c . u s e r _ s e t t i n g s   F O R   U P D A T E   T O   a u t h e n t i c a t e d   U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d )   W I T H   C H E C K   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
  
 - -   U p d a t e   t r i g g e r  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   u p d a t e _ u s e r _ s e t t i n g s _ u p d a t e d _ a t ( )  
 R E T U R N S   T R I G G E R   A S   $ $  
 B E G I N  
         N E W . u p d a t e d _ a t   =   N O W ( ) ;  
         R E T U R N   N E W ;  
 E N D ;  
 $ $   L A N G U A G E   p l p g s q l ;  
  
 D R O P   T R I G G E R   I F   E X I S T S   t r g _ u s e r _ s e t t i n g s _ u p d a t e d _ a t   O N   p u b l i c . u s e r _ s e t t i n g s ;  
 C R E A T E   T R I G G E R   t r g _ u s e r _ s e t t i n g s _ u p d a t e d _ a t    
 B E F O R E   U P D A T E   O N   p u b l i c . u s e r _ s e t t i n g s    
 F O R   E A C H   R O W   E X E C U T E   F U N C T I O N   u p d a t e _ u s e r _ s e t t i n g s _ u p d a t e d _ a t ( ) ;  
  
 - -   T r i g g e r   t o   a u t o m a t i c a l l y   c r e a t e   u s e r _ s e t t i n g s   r o w   f o r   n e w   u s e r s  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . h a n d l e _ n e w _ u s e r _ s e t t i n g s ( )  
 R E T U R N S   T R I G G E R   A S   $ $  
 B E G I N  
         I N S E R T   I N T O   p u b l i c . u s e r _ s e t t i n g s   ( u s e r _ i d )   V A L U E S   ( N E W . i d )  
         O N   C O N F L I C T   ( u s e r _ i d )   D O   N O T H I N G ;  
         R E T U R N   N E W ;  
 E N D ;  
 $ $   L A N G U A G E   p l p g s q l   S E C U R I T Y   D E F I N E R ;  
  
 D R O P   T R I G G E R   I F   E X I S T S   o n _ a u t h _ u s e r _ c r e a t e d _ s e t t i n g s   O N   a u t h . u s e r s ;  
 C R E A T E   T R I G G E R   o n _ a u t h _ u s e r _ c r e a t e d _ s e t t i n g s   A F T E R   I N S E R T   O N   a u t h . u s e r s   F O R   E A C H   R O W   E X E C U T E   F U N C T I O N   p u b l i c . h a n d l e _ n e w _ u s e r _ s e t t i n g s ( ) ;  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   T R A D E R N A K U L :   A C C O U N T   D E L E T I O N   &   D A N G E R   Z O N E  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 - -   1 .   S t o r a g e   P o l i c i e s   f o r   ` t r a d e - s c r e e n s h o t s `   t o   a l l o w   u s e r s   t o   m a n a g e   t h e i r   o w n   f i l e s  
 C R E A T E   P O L I C Y   " U s e r s   U p d a t e   O w n   S c r e e n s h o t s "  
         O N   s t o r a g e . o b j e c t s   F O R   U P D A T E  
         T O   a u t h e n t i c a t e d  
         U S I N G   ( b u c k e t _ i d   =   ' t r a d e - s c r e e n s h o t s '   A N D   a u t h . u i d ( ) : : t e x t   =   ( s t o r a g e . f o l d e r n a m e ( n a m e ) ) [ 1 ] )  
         W I T H   C H E C K   ( b u c k e t _ i d   =   ' t r a d e - s c r e e n s h o t s '   A N D   a u t h . u i d ( ) : : t e x t   =   ( s t o r a g e . f o l d e r n a m e ( n a m e ) ) [ 1 ] ) ;  
  
 C R E A T E   P O L I C Y   " U s e r s   D e l e t e   O w n   S c r e e n s h o t s "  
         O N   s t o r a g e . o b j e c t s   F O R   D E L E T E  
         T O   a u t h e n t i c a t e d  
         U S I N G   ( b u c k e t _ i d   =   ' t r a d e - s c r e e n s h o t s '   A N D   a u t h . u i d ( ) : : t e x t   =   ( s t o r a g e . f o l d e r n a m e ( n a m e ) ) [ 1 ] ) ;  
  
 - -   2 .   S e c u r e   R P C   f o r   A c c o u n t   D e l e t i o n  
 - -   M u s t   b e   S E C U R I T Y   D E F I N E R   t o   b y p a s s   R L S   a n d   a l l o w   d e l e t i n g   f r o m   a u t h . u s e r s  
  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . d e l e t e _ o w n _ a c c o u n t ( )  
 R E T U R N S   v o i d  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 S E T   s e a r c h _ p a t h   =   p u b l i c  
 A S   $ $  
 D E C L A R E  
         v _ u s e r _ i d   U U I D ;  
         v _ i s _ o w n e r   B O O L E A N ;  
 B E G I N  
         - -   G e t   t h e   a u t h e n t i c a t e d   u s e r   I D  
         v _ u s e r _ i d   : =   a u t h . u i d ( ) ;  
          
         I F   v _ u s e r _ i d   I S   N U L L   T H E N  
                 R A I S E   E X C E P T I O N   ' N o t   a u t h e n t i c a t e d ' ;  
         E N D   I F ;  
  
         - -   C h e c k   i f   t h e   u s e r   i s   t h e   o w n e r  
         S E L E C T   i s _ o w n e r   I N T O   v _ i s _ o w n e r   F R O M   p u b l i c . p r o f i l e s   W H E R E   i d   =   v _ u s e r _ i d ;  
  
         I F   v _ i s _ o w n e r   =   t r u e   T H E N  
                 R A I S E   E X C E P T I O N   ' O w n e r   a c c o u n t s   c a n n o t   b e   d e l e t e d   t h r o u g h   t h i s   m e t h o d .   A d m i n i s t r a t i v e   i n t e r v e n t i o n   r e q u i r e d . ' ;  
         E N D   I F ;  
  
         - -   D e l e t e   t h e   u s e r   f r o m   a u t h . u s e r s   ( T h i s   c a s c a d e s   t o   p r o f i l e s ,   t r a d e s ,   e t c . )  
         D E L E T E   F R O M   a u t h . u s e r s   W H E R E   i d   =   v _ u s e r _ i d ;  
  
         - -   L o g   t h e   d e l e t i o n  
         I N S E R T   I N T O   p u b l i c . a u d i t _ l o g s   (  
                 a c t i o n ,   e n t i t y _ t y p e ,   e n t i t y _ i d ,   d e t a i l s  
         )   V A L U E S   (  
                 ' a c c o u n t _ d e l e t e d ' ,  
                 ' u s e r ' ,  
                 v _ u s e r _ i d : : t e x t ,  
                 j s o n b _ b u i l d _ o b j e c t ( ' r e a s o n ' ,   ' U s e r   e x p l i c i t l y   r e q u e s t e d   a c c o u n t   d e l e t i o n ' )  
         ) ;  
 E N D ;  
 $ $ ;  
 