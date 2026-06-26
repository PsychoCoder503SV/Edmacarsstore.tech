export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  gallery_urls?: string[] | null;
  stock: number;
  category_id: string | null;
  is_active: boolean;
  categories?: Pick<Category, "name" | "slug"> | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  default_address: string | null;
  default_lat: number | null;
  default_lng: number | null;
  address_notes: string | null;
  preferred_payment: string | null;
  role: string | null;
};

export type ProfileInsert = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  default_address?: string | null;
  default_lat?: number | null;
  default_lng?: number | null;
  address_notes?: string | null;
  preferred_payment?: string | null;
  role?: string | null;
};

export type Order = {
  id: string;
  created_at: string;
  user_id: string | null;
  status: string;
  total_amount: number;
  shipping_address: string | null;
};

export type OrderInsert = {
  user_id?: string | null;
  status?: string;
  total_amount: number;
  shipping_address?: string | null;
};

export type OrderItemInsert = {
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
};

type TableDef<Row, Insert = Row, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      categories: TableDef<Category>;
      products: TableDef<Product>;
      profiles: TableDef<Profile, ProfileInsert, Partial<ProfileInsert>>;
      orders: TableDef<Order, OrderInsert, Partial<OrderInsert>>;
      order_items: TableDef<
        { id: string; order_id: string; product_id: string; quantity: number; unit_price: number },
        OrderItemInsert,
        Partial<OrderItemInsert>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};