import type { ListProductsParams, Product, ProductList, Shop, Stats } from './types';

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
    // Laravel debug pages and empty bodies are ignored.
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

export async function listProducts(
  baseUrl: string,
  params: ListProductsParams = {},
): Promise<ProductList> {
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

  if (params.status) {
    search.set('status', params.status);
  }

  const query = search.toString();
  return request<ProductList>(baseUrl, `/products${query ? `?${query}` : ''}`);
}

export async function getProductBySku(baseUrl: string, sku: string): Promise<Product> {
  const body = await request<{ data: Product }>(
    baseUrl,
    `/products/sku/${encodeURIComponent(sku)}`,
  );
  return body.data;
}

export async function getProductByBarcode(
  baseUrl: string,
  barcode: string,
): Promise<Product | null> {
  try {
    const body = await request<{ data: Product }>(
      baseUrl,
      `/products/barcode/${encodeURIComponent(barcode)}`,
    );
    return body.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function updateProductBarcode(
  baseUrl: string,
  sku: string,
  barcode: string,
): Promise<Product> {
  const body = await request<{ data: Product }>(
    baseUrl,
    `/products/${encodeURIComponent(sku)}/barcode`,
    {
      method: 'PATCH',
      body: JSON.stringify({ barcode }),
    },
  );

  return body.data;
}

export async function getShops(baseUrl: string): Promise<Shop[]> {
  const body = await request<{ data: Shop[] }>(baseUrl, '/shops');
  return body.data;
}

export async function receiveProduct(
  baseUrl: string,
  barcode: string,
  shop: string,
  qty: number,
): Promise<Product> {
  const body = await request<{ data: Product }>(
    baseUrl,
    `/products/barcode/${encodeURIComponent(barcode)}/receive`,
    {
      method: 'POST',
      body: JSON.stringify({ shop, qty }),
    },
  );

  return body.data;
}
