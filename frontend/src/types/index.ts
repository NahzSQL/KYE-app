export interface User {
  id: string;
  staffId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  region: string;
  isAdmin: boolean;
  avatar: string | null;
  kyeStatus: KyeStatus;
  kyeStep: number;
  kyeTotalSteps: number;
  kyeStepLabel: string;
  kyeSubmittedDate: string | null;
  kyeRefId: string | null;
  documentsUploaded: number;
  documentsRequired: number;
  riskScore: number;
}

export type KyeStatus = 'pending_submission' | 'pending_review' | 'verified' | 'rejected';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface KyeStatusResponse {
  status: KyeStatus;
  step: number;
  totalSteps: number;
  stepLabel: string;
  submittedDate: string | null;
  refId: string | null;
  documentsUploaded: number;
  documentsRequired: number;
  riskScore: number;
  rejectReason: string | null;
  adminComment: string | null;
  personalDetails: {
    fullName: string | null;
    phone: string | null;
    dob: string | null;
    address: string | null;
  };
  documents: {
    idType: string | null;
    hasIdDocument: boolean;
    hasAddressDoc: boolean;
    hasSelfie: boolean;
  };
}

export interface DashboardResponse {
  user: {
    name: string;
    email: string;
    role: string;
    department: string;
    region: string;
    staffId: string;
    avatar: string | null;
  };
  kye: {
    status: KyeStatus;
    step: number;
    totalSteps: number;
    stepLabel: string;
    submittedDate: string | null;
    refId: string | null;
    documentsUploaded: number;
    documentsRequired: number;
    riskScore: number;
  };
  accessLevel: string;
  activities: Activity[];
  notifications: Notification[];
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  icon: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isAdmin: boolean;
  avatar: string | null;
  kyeStatus: KyeStatus;
  kyeSubmittedDate: string | null;
  kyeRefId: string | null;
}

export interface StaffDetail {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  region: string;
  avatar: string | null;
  kye: {
    status: KyeStatus;
    step: number;
    stepLabel: string;
    refId: string | null;
    submittedDate: string | null;
    riskScore: number;
    fullName: string | null;
    phone: string | null;
    dob: string | null;
    address: string | null;
    idType: string | null;
    hasIdDocument: boolean;
    hasAddressDoc: boolean;
    hasSelfie: boolean;
    documentsUploaded: number;
    documentsRequired: number;
    rejectReason: string | null;
    adminComment: string | null;
  } | null;
}

export interface AuditLog {
  id: string;
  admin: string;
  action: string;
  date: string;
  details: string | null;
}

export interface AdminStaffResponse {
  staff: StaffMember[];
  stats: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    notSubmitted: number;
  };
}

export interface AuditLogResponse {
  logs: AuditLog[];
  stats: {
    total: number;
    approvals: number;
    rejections: number;
    other: number;
  };
}
