-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('importer', 'exporter');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  internal_code TEXT,
  category TEXT NOT NULL,
  reference_link TEXT,
  target_price_usd NUMERIC,
  description TEXT,
  usage_notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent_for_quote', 'quoted')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create product_images table
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create quote_requests table
CREATE TABLE public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  requested_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  factory_name TEXT NOT NULL,
  factory_location TEXT,
  incoterm TEXT CHECK (incoterm IN ('EXW', 'FOB', 'CIF', 'DDP')),
  price_per_unit_usd NUMERIC NOT NULL,
  moq INTEGER NOT NULL,
  available_stock INTEGER,
  lead_time_days INTEGER,
  competitor_links TEXT,
  certifications TEXT,
  remarks TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create quote_cost_simulations table
CREATE TABLE public.quote_cost_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  freight_usd NUMERIC DEFAULT 0,
  insurance_usd NUMERIC DEFAULT 0,
  other_costs_usd NUMERIC DEFAULT 0,
  tax_rate_percent NUMERIC DEFAULT 0,
  exchange_rate NUMERIC NOT NULL,
  estimated_total_cost_usd NUMERIC,
  estimated_total_cost_brl NUMERIC,
  estimated_unit_cost_usd NUMERIC,
  estimated_unit_cost_brl NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_cost_simulations ENABLE ROW LEVEL SECURITY;

-- Create function to get user's profile id
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Create function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Exporters can view importer profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role() = 'exporter' AND role = 'importer');

CREATE POLICY "Importers can view exporter profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role() = 'importer' AND role = 'exporter');

-- Products RLS policies
CREATE POLICY "Importers can view own products" ON public.products
  FOR SELECT USING (owner_id = public.get_user_profile_id());

CREATE POLICY "Importers can insert own products" ON public.products
  FOR INSERT WITH CHECK (owner_id = public.get_user_profile_id());

CREATE POLICY "Importers can update own products" ON public.products
  FOR UPDATE USING (owner_id = public.get_user_profile_id());

CREATE POLICY "Importers can delete own products" ON public.products
  FOR DELETE USING (owner_id = public.get_user_profile_id());

CREATE POLICY "Exporters can view products with quote requests" ON public.products
  FOR SELECT USING (
    public.get_user_role() = 'exporter' AND
    EXISTS (
      SELECT 1 FROM public.quote_requests qr
      WHERE qr.product_id = products.id
      AND (qr.assigned_to_id IS NULL OR qr.assigned_to_id = public.get_user_profile_id())
    )
  );

-- Product images RLS policies
CREATE POLICY "Product owners can manage images" ON public.product_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
      AND p.owner_id = public.get_user_profile_id()
    )
  );

CREATE POLICY "Exporters can view product images" ON public.product_images
  FOR SELECT USING (
    public.get_user_role() = 'exporter' AND
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.quote_requests qr ON qr.product_id = p.id
      WHERE p.id = product_images.product_id
      AND (qr.assigned_to_id IS NULL OR qr.assigned_to_id = public.get_user_profile_id())
    )
  );

-- Quote requests RLS policies
CREATE POLICY "Importers can view own quote requests" ON public.quote_requests
  FOR SELECT USING (requested_by_id = public.get_user_profile_id());

CREATE POLICY "Importers can insert quote requests" ON public.quote_requests
  FOR INSERT WITH CHECK (requested_by_id = public.get_user_profile_id());

CREATE POLICY "Importers can update own quote requests" ON public.quote_requests
  FOR UPDATE USING (requested_by_id = public.get_user_profile_id());

CREATE POLICY "Exporters can view assigned or open quote requests" ON public.quote_requests
  FOR SELECT USING (
    public.get_user_role() = 'exporter' AND
    (assigned_to_id IS NULL OR assigned_to_id = public.get_user_profile_id())
  );

CREATE POLICY "Exporters can update assigned quote requests" ON public.quote_requests
  FOR UPDATE USING (
    public.get_user_role() = 'exporter' AND
    (assigned_to_id IS NULL OR assigned_to_id = public.get_user_profile_id())
  );

-- Quotes RLS policies
CREATE POLICY "Exporters can manage own quotes" ON public.quotes
  FOR ALL USING (created_by_id = public.get_user_profile_id());

CREATE POLICY "Importers can view quotes for their products" ON public.quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quote_requests qr
      JOIN public.products p ON p.id = qr.product_id
      WHERE qr.id = quotes.quote_request_id
      AND p.owner_id = public.get_user_profile_id()
    )
  );

-- Quote cost simulations RLS policies
CREATE POLICY "Importers can manage simulations for their products" ON public.quote_cost_simulations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      JOIN public.quote_requests qr ON qr.id = q.quote_request_id
      JOIN public.products p ON p.id = qr.product_id
      WHERE q.id = quote_cost_simulations.quote_id
      AND p.owner_id = public.get_user_profile_id()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quote_requests_updated_at BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Users can delete own product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');