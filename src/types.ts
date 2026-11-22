export type Shop = {
  id: number;
  name: string;
  slug: string;
};

export type ShopQty = {
  expected_qty: number;
  received_qty: number;
  remaining_qty: number;
};

export type Product = {
  id: number;
  barcode: string | null;
  sku: string | null;
  name: string | null;
  total_expected_qty: number;
  amazon_expected_qty: number;
  noon_expected_qty: number;
  namshi_expected_qty: number;
  total_received_qty: number;
  amazon_received_qty: number;
  noon_received_qty: number;
  namshi_received_qty: number;
  created_at: string;
  updated_at: string;
};

export type Stats = {
  total: number;
  mapped: number;
  pending: number;
  expected_qty: number;
  received_qty: number;
  remaining_qty: number;
  shops: {
    amazon: ShopQty;
    noon: ShopQty;
    namshi: ShopQty;
  };
};

export type ProductListMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export type ProductList = {
  data: Product[];
  meta: ProductListMeta;
};

export type ListProductsParams = {
  page?: number;
  perPage?: number;
  q?: string;
  status?: 'mapped' | 'pending';
};

export function productShopQty(
  product: Product,
  slug: string,
): { received: number; expected: number } {
  switch (slug) {
    case 'amazon':
      return { received: product.amazon_received_qty, expected: product.amazon_expected_qty };
    case 'noon':
      return { received: product.noon_received_qty, expected: product.noon_expected_qty };
    case 'namshi':
      return { received: product.namshi_received_qty, expected: product.namshi_expected_qty };
    default:
      return { received: 0, expected: 0 };
  }
}
