export interface UserCompanyAccess {
  companyId: string;
  companyName: string;
  ruc: string;
  countryCode?: string;
  membershipRole: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  legacyUserId?: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  ruc?: string;
  countryCode?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  role?: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
  companyId?: string;
  activeCompanyId?: string;
  companyName?: string;
  taxRegime?: string;
  availableCompanies?: UserCompanyAccess[];
  avatarUrl?: string;
  banned?: boolean;
  banReason?: string | null;
  banExpires?: Date | null;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  companyName: string;
  ruc: string;
}
