const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getAuthToken = (): string | null => {
  const token = localStorage.getItem('aura_auth_token');
  if (!token || token === 'undefined' || token === 'null') return null;
  return token;
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('aura_auth_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('aura_auth_token');
};

export class ApiError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      const textData = await response.text();
      return textData as any;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        clearAuthToken();
      }
      throw new ApiError(data.message || 'Request failed.', response.status, data.details);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Network error occurred. Please check your connection.', 500);
  }
}

const httpGet = <T>(endpoint: string, options?: RequestInit) =>
  request<T>(endpoint, { method: 'GET', ...options });

const httpPost = <T>(endpoint: string, body?: any, options?: RequestInit) =>
  request<T>(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options,
  });

const httpPut = <T>(endpoint: string, body?: any, options?: RequestInit) =>
  request<T>(endpoint, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options,
  });

const httpPatch = <T>(endpoint: string, body?: any, options?: RequestInit) =>
  request<T>(endpoint, {
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options,
  });

const httpDelete = <T>(endpoint: string, options?: RequestInit) =>
  request<T>(endpoint, { method: 'DELETE', ...options });

export const api = {
  get: httpGet,
  post: httpPost,
  put: httpPut,
  patch: httpPatch,
  delete: httpDelete,

  // Products
  getProducts: async (params: any = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
    const res: any = await request(`/products?${query.toString()}`);
    return {
      success: res.success,
      data: res.products || res.data || [],
      pagination: res.pagination,
    };
  },
  getProductById: async (id: string) => {
    const res: any = await request(`/products/${id}`);
    return {
      success: res.success,
      data: res.product || res.data,
    };
  },
  getAdminProducts: async () => {
    const res: any = await request('/products?adminView=true&limit=100');
    return {
      success: res.success,
      data: res.products || res.data || [],
    };
  },
  createProduct: (data: any) => httpPost<any>('/products', data),
  updateProduct: (id: string, data: any) => httpPut<any>(`/products/${id}`, data),
  deleteProduct: (id: string) => httpDelete<any>(`/products/${id}`),

  // Categories
  getCategories: async () => {
    const res: any = await request('/categories?all=true');
    return {
      success: res.success,
      data: res.categories || res.data || [],
    };
  },
  createCategory: (data: any) => httpPost<any>('/categories', data),
  updateCategory: (id: string, data: any) => httpPut<any>(`/categories/${id}`, data),
  deleteCategory: (id: string) => httpDelete<any>(`/categories/${id}`),

  // Coupons
  getActiveCoupons: async () => {
    const res: any = await request('/coupons/active');
    return {
      success: res.success,
      data: res.coupons || res.data || [],
    };
  },
  getAdminCoupons: async () => {
    const res: any = await request('/coupons');
    return {
      success: res.success,
      data: res.coupons || res.data || [],
    };
  },
  createCoupon: (data: any) => httpPost<any>('/coupons', data),
  updateCoupon: (id: string, data: any) => httpPut<any>(`/coupons/${id}`, data),
  deleteCoupon: (id: string) => httpDelete<any>(`/coupons/${id}`),

  // Orders
  getMyOrders: async () => {
    const res: any = await request('/orders/my-orders');
    return {
      success: res.success,
      data: res.orders || res.data || [],
    };
  },
  getOrderById: async (id: string) => {
    const res: any = await request(`/orders/${id}`);
    return {
      success: res.success,
      data: res.order || res.data,
      message: res.message as string | undefined,
    };
  },
  getAdminOrders: async () => {
    const res: any = await request('/orders');
    return {
      success: res.success,
      data: res.orders || res.data || [],
    };
  },
  updateOrderStatus: (id: string, data: any) => httpPatch<any>(`/orders/${id}/status`, data),
  cancelOrder: (id: string, reason?: string) => httpPost<any>(`/orders/${id}/cancel`, { reason }),

  // Returns & Refunds
  createReturnRequest: (data: any) => httpPost<any>(`/orders/${data.orderId}/return`, data),
  getAdminReturns: async () => {
    const res: any = await request('/orders/returns/all');
    return {
      success: res.success,
      data: res.returnRequests || res.data || [],
    };
  },
  updateReturnStatus: (id: string, data: any) => httpPatch<any>(`/orders/returns/${id}/status`, data),

  // Reviews
  getMyReviews: async () => {
    const res: any = await request('/reviews/my-reviews');
    return {
      success: res.success,
      data: res.reviews || res.data || [],
    };
  },
  getAdminReviews: async () => {
    const res: any = await request('/reviews');
    return {
      success: res.success,
      data: res.reviews || res.data || [],
    };
  },
  moderateReview: (id: string, data: any) => httpPatch<any>(`/reviews/${id}/status`, data),
  deleteReview: (id: string) => httpDelete<any>(`/reviews/${id}`),

  // Customer Profile & Addresses
  addAddress: (data: any) => httpPost<any>('/auth/addresses', data),
  updateAddress: (id: string, data: any) => httpPut<any>(`/auth/addresses/${id}`, data),
  deleteAddress: (id: string) => httpDelete<any>(`/auth/addresses/${id}`),
  setDefaultAddress: (id: string) => httpPatch<any>(`/auth/addresses/${id}/default`),
  updateProfile: (data: any) => httpPut<any>('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    httpPut<any>('/auth/change-password', { currentPassword, newPassword }),

  // Admin Customers
  getAdminCustomers: async () => {
    const res: any = await request('/customers');
    return {
      success: res.success,
      data: res.customers || res.data || [],
    };
  },
  updateCustomerStatus: (id: string, isActive: boolean) =>
    httpPatch<any>(`/customers/${id}/status`, { isActive }),

  // Inventory
  getInventoryTransactions: async () => {
    const res: any = await request('/inventory/transactions');
    return {
      success: res.success,
      data: res.transactions || res.data || [],
    };
  },
  adjustInventoryStock: (data: any) => httpPost<any>('/inventory/adjust', data),

  // Analytics & KPIs
  getAdminKPIs: async () => {
    const res: any = await request('/analytics/kpis');
    return {
      success: res.success,
      data: res.kpis || res.data,
    };
  },
  getRevenueAnalytics: async (period: string) => {
    const res: any = await request(`/analytics/revenue?range=${period}`);
    return {
      success: res.success,
      data: res.revenueTrend || res.data || [],
    };
  },
  getDetailedAnalytics: async (period: string) => {
    const res: any = await request(`/analytics/revenue?range=${period}`);
    return {
      success: res.success,
      data: res,
    };
  },
  getBestSellers: async (limit = 10) => {
    const res: any = await request(`/analytics/bestsellers?limit=${limit}`);
    return {
      success: res.success,
      data: res.bestsellers || res.data || [],
    };
  },

  // Reports
  getReportCSV: (type: string) => request<any>(`/reports?type=${type}&format=csv`),

  // Health & Bugs
  getWebsiteHealth: async () => {
    const res: any = await request('/health');
    return {
      success: res.success,
      data: res,
    };
  },
  getAdminBugs: async () => {
    const res: any = await request('/bugs');
    return {
      success: res.success,
      data: res.issues || res.data || [],
    };
  },
  updateBugStatus: (id: string, status: string) => httpPatch<any>(`/bugs/${id}/status`, { status }),
  triggerTestError: () => request<any>('/bugs/test-error'),

  // Audit Logs
  getAuditLogs: async () => {
    const res: any = await request('/audit-logs');
    return {
      success: res.success,
      data: res.logs || res.data || [],
    };
  },
};

export default api;
