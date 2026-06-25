export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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

export type Database = {
  public: {
    Tables: {
      categories: { Row: Category };
      products: { Row: Product };
    };
  };
};