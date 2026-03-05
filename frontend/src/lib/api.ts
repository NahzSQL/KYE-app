import {
  LoginResponse,
  User,
  DashboardResponse,
  KyeStatusResponse,
  AdminStaffResponse,
  StaffDetail,
  AuditLogResponse,
  Notification,
  Activity,
} from '@/types';

const API_BASE = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('degxifi_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (multipart)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ============ AUTH ============
export async function login(email: string, password: string, role: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
}

export async function getMe(): Promise<User> {
  return request<User>('/auth/me');
}

// ============ STAFF ============
export async function getDashboard(): Promise<DashboardResponse> {
  return request<DashboardResponse>('/staff/dashboard');
}

export async function getNotifications(): Promise<Notification[]> {
  return request<Notification[]>('/staff/notifications');
}

export async function markNotificationRead(id: string): Promise<void> {
  await request(`/staff/notifications/${id}/read`, { method: 'PUT' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await request('/staff/notifications/read-all', { method: 'PUT' });
}

export async function getActivities(): Promise<Activity[]> {
  return request<Activity[]>('/staff/activities');
}

// ============ KYE ============
export async function getKyeStatus(): Promise<KyeStatusResponse> {
  return request<KyeStatusResponse>('/kye/status');
}

export async function submitPersonalDetails(data: {
  fullName: string;
  phone: string;
  dob: string;
  address: string;
}): Promise<{ success: boolean }> {
  return request('/kye/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadDocument(
  docType: 'id' | 'address' | 'selfie',
  file: File,
  idType?: string
): Promise<{ success: boolean; filePath: string; documentsUploaded: number }> {
  const formData = new FormData();
  formData.append('file', file);
  if (idType) formData.append('idType', idType);

  return request(`/kye/upload/${docType}`, {
    method: 'POST',
    body: formData,
  });
}

export async function finalizeKye(): Promise<{
  success: boolean;
  status: string;
  refId: string;
  submittedDate: string;
}> {
  return request('/kye/finalize', { method: 'POST' });
}

// ============ ADMIN ============
export async function getAdminStaff(params?: {
  search?: string;
  status?: string;
}): Promise<AdminStaffResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return request<AdminStaffResponse>(`/admin/staff${qs ? `?${qs}` : ''}`);
}

export async function getStaffDetail(staffId: string): Promise<StaffDetail> {
  return request<StaffDetail>(`/admin/staff/${staffId}`);
}

export async function inviteStaff(data: {
  name: string;
  email: string;
  department?: string;
  role?: string;
}): Promise<{ success: boolean; staff: { id: string }; tempPassword: string }> {
  return request('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeStaff(staffId: string): Promise<void> {
  await request(`/admin/staff/${staffId}`, { method: 'DELETE' });
}

export async function approveKye(staffId: string, comment?: string): Promise<void> {
  await request(`/admin/staff/${staffId}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ comment }),
  });
}

export async function rejectKye(staffId: string, reason: string, comment?: string): Promise<void> {
  await request(`/admin/staff/${staffId}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason, comment }),
  });
}

export async function reopenKye(staffId: string): Promise<void> {
  await request(`/admin/staff/${staffId}/reopen`, { method: 'PUT' });
}

export async function getAuditLogs(params?: {
  search?: string;
  action?: string;
  date?: string;
}): Promise<AuditLogResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.action) query.set('action', params.action);
  if (params?.date) query.set('date', params.date);
  const qs = query.toString();
  return request<AuditLogResponse>(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
}

export async function clearAuditLogs(): Promise<void> {
  await request('/admin/audit-logs', { method: 'DELETE' });
}
