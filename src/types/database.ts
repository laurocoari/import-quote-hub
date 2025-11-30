export type AppRole = 'importer' | 'exporter';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  owner_id: string;
  name: string;
  internal_code: string | null;
  category: string;
  reference_link: string | null;
  target_price_usd: number | null;
  description: string | null;
  usage_notes: string | null;
  status: 'draft' | 'sent_for_quote' | 'quoted';
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  is_main: boolean;
  created_at: string;
}

export interface QuoteRequest {
  id: string;
  product_id: string;
  requested_by_id: string;
  assigned_to_id: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
  quotes?: Quote[];
  requester?: Profile;
}

export interface Quote {
  id: string;
  quote_request_id: string;
  created_by_id: string;
  factory_name: string;
  factory_location: string | null;
  incoterm: 'EXW' | 'FOB' | 'CIF' | 'DDP' | null;
  price_per_unit_usd: number;
  moq: number;
  available_stock: number | null;
  lead_time_days: number | null;
  competitor_links: string | null;
  certifications: string | null;
  remarks: string | null;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface QuoteCostSimulation {
  id: string;
  quote_id: string;
  quantity: number;
  freight_usd: number;
  insurance_usd: number;
  other_costs_usd: number;
  tax_rate_percent: number;
  exchange_rate: number;
  estimated_total_cost_usd: number;
  estimated_total_cost_brl: number;
  estimated_unit_cost_usd: number;
  estimated_unit_cost_brl: number;
  created_at: string;
}
