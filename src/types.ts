export type Shop = {
  id: number;
  name: string;
  slug: string;
};

export type LotItem = {
  barcode: string;
  size_code: string;
  pieces_per_lot: number;
  pieces_added?: number;
  amazon_received_qty: number;
  noon_received_qty: number;
  namshi_received_qty: number;
  total_received_qty: number;
};

export type Lot = {
  id: number;
  lot_barcode: string;
  model: string | null;
  brand: string | null;
  name_en: string | null;
  name_ru: string | null;
  color: string | null;
  color_en: string | null;
  variant: string | null;
  assortment: string | null;
  size_set: string | null;
  pieces_per_lot?: number;
  amazon_received_qty?: number;
  noon_received_qty?: number;
  namshi_received_qty?: number;
  items: LotItem[];
};

export type ReceiveResult = Lot & {
  shop: string;
  shop_name: string;
  box: string;
  pieces_added: number;
};

export type Stats = {
  lots: number;
  items: number;
  received_qty: number;
  shops: {
    amazon: { received_qty: number };
    noon: { received_qty: number };
    namshi: { received_qty: number };
  };
};

export type LotListMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type LotList = {
  data: Lot[];
  meta: LotListMeta;
};

export type BoxRecord = {
  id: number;
  shop: string;
  shop_name: string;
  box_number: string;
  status: 'open' | 'closed';
  qty: number;
  different_lots: number;
  exists?: boolean;
};

export type BoxLotItem = {
  id: number;
  lot_item_id: number;
  barcode: string;
  size_code: string;
  qty: number;
};

export type BoxLot = {
  id: number;
  lot_barcode: string;
  model: string | null;
  name: string | null;
  color: string | null;
  qty: number;
  items: BoxLotItem[];
};

export type BoxContents = BoxRecord & {
  lots: BoxLot[];
};
