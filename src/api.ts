import type { BoxContents, BoxRecord, Lot, LotList, ReceiveResult, Shop, Stats } from './types';

export const API_USER = 'admin';
export const API_PASSWORD = 'admin01';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  get displayMessage(): string {
    const first = this.errors
      ? Object.values(this.errors).flat().find((item) => item.length > 0)
      : undefined;

    return first ?? this.message;
  }
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function authHeader(): string {
  return `Basic ${btoa(`${API_USER}:${API_PASSWORD}`)}`;
}

async function readError(response: Response): Promise<ApiError> {
  let message = `Request failed (${response.status})`;
  let errors: Record<string, string[]> | undefined;

  try {
    const body = (await response.json()) as {
      message?: unknown;
      errors?: Record<string, string[]>;
    };

    if (typeof body.message === 'string' && body.message.length > 0) {
      message = body.message;
    }

    if (body.errors && typeof body.errors === 'object') {
      errors = body.errors;
    }
  } catch {
    if (response.status === 401) {
      message = 'Login failed.';
    }
  }

  return new ApiError(message, response.status, errors);
}

async function request<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(joinUrl(baseUrl, path), {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        Authorization: authHeader(),
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });

    if (!response.ok) {
      throw await readError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Could not reach the server. Check the API address.', 0);
  } finally {
    clearTimeout(timeout);
  }
}

export async function getStats(baseUrl: string): Promise<Stats> {
  const body = await request<{ data: Stats }>(baseUrl, '/stats');
  return body.data;
}

export async function listLots(
  baseUrl: string,
  params: { page?: number; perPage?: number; q?: string } = {},
): Promise<LotList> {
  const search = new URLSearchParams();

  if (params.page) {
    search.set('page', String(params.page));
  }

  if (params.perPage) {
    search.set('per_page', String(params.perPage));
  }

  if (params.q && params.q.trim() !== '') {
    search.set('q', params.q.trim());
  }

  const query = search.toString();
  return request<LotList>(baseUrl, `/lots${query ? `?${query}` : ''}`);
}

export async function resetDemo(baseUrl: string): Promise<void> {
  await request(baseUrl, '/demo/reset', { method: 'POST' });
}

export async function getShops(baseUrl: string): Promise<Shop[]> {
  const body = await request<{ data: Shop[] }>(baseUrl, '/shops');
  return body.data;
}

export async function receiveLot(
  baseUrl: string,
  lotBarcode: string,
  shop: string,
  box: string,
  allowRepeat = false,
): Promise<ReceiveResult> {
  const body = await request<{ data: ReceiveResult }>(
    baseUrl,
    `/lots/${encodeURIComponent(lotBarcode)}/receive`,
    {
      method: 'POST',
      body: JSON.stringify({
        shop,
        box,
        allow_repeat: allowRepeat,
      }),
    },
  );

  return body.data;
}

export async function receiveItem(
  baseUrl: string,
  barcode: string,
  shop: string,
  box: string,
): Promise<ReceiveResult> {
  const body = await request<{ data: ReceiveResult }>(
    baseUrl,
    `/items/${encodeURIComponent(barcode)}/receive`,
    {
      method: 'POST',
      body: JSON.stringify({
        shop,
        box,
      }),
    },
  );

  return body.data;
}

function boxPath(shop: string, box: string): string {
  return `/boxes/${encodeURIComponent(shop)}/${encodeURIComponent(box)}`;
}

export async function listBoxes(baseUrl: string, shop?: string): Promise<BoxRecord[]> {
  const query = shop ? `?shop=${encodeURIComponent(shop)}` : '';
  const body = await request<{ data: BoxRecord[] }>(baseUrl, `/boxes${query}`);
  return body.data;
}

export async function createBox(
  baseUrl: string,
  shop: string,
  box: string,
): Promise<BoxRecord> {
  const body = await request<{ data: BoxRecord }>(baseUrl, '/boxes', {
    method: 'POST',
    body: JSON.stringify({ shop, box }),
  });
  return body.data;
}

export async function closeBox(baseUrl: string, shop: string, box: string): Promise<BoxRecord> {
  const body = await request<{ data: BoxRecord }>(baseUrl, `${boxPath(shop, box)}/close`, {
    method: 'POST',
  });
  return body.data;
}

export async function openBox(baseUrl: string, shop: string, box: string): Promise<BoxRecord> {
  const body = await request<{ data: BoxRecord }>(baseUrl, `${boxPath(shop, box)}/open`, {
    method: 'POST',
  });
  return body.data;
}

export async function moveBoxShop(
  baseUrl: string,
  fromShop: string,
  toShop: string,
  box: string,
): Promise<BoxRecord> {
  const body = await request<{ data: BoxRecord }>(baseUrl, '/boxes/move-shop', {
    method: 'POST',
    body: JSON.stringify({
      from_shop: fromShop,
      to_shop: toShop,
      box,
    }),
  });
  return body.data;
}

export async function getBoxContents(
  baseUrl: string,
  shop: string,
  box: string,
): Promise<BoxContents> {
  const body = await request<{ data: BoxContents }>(baseUrl, boxPath(shop, box));
  return body.data;
}

export async function updateBoxReceiptQty(
  baseUrl: string,
  receiptId: number,
  qty: number,
): Promise<void> {
  await request(baseUrl, `/box-receipts/${receiptId}`, {
    method: 'PATCH',
    body: JSON.stringify({ qty }),
  });
}

export async function deleteBoxReceipt(baseUrl: string, receiptId: number): Promise<void> {
  await request(baseUrl, `/box-receipts/${receiptId}`, { method: 'DELETE' });
}

export async function deleteBoxLot(
  baseUrl: string,
  shop: string,
  box: string,
  lotId: number,
): Promise<void> {
  await request(baseUrl, `${boxPath(shop, box)}/lots/${lotId}`, { method: 'DELETE' });
}

export async function getLot(baseUrl: string, lotBarcode: string): Promise<Lot | null> {
  try {
    const body = await request<{ data: Lot }>(
      baseUrl,
      `/lots/${encodeURIComponent(lotBarcode)}`,
    );
    return body.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
