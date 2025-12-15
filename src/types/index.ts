export type UserRole = 'OWNER' | 'SUPERVISOR' | 'ADMIN';

export type EmployeeType = 'FIXED' | 'DAILY';

export type AttendanceStatus = 'P' | 'A';

export interface User {
  supervisor_id: string;
  email: string;
  fullName: string;
  role: UserRole;
  companyId: string;
  aadhar?: string;
  phone?: string;
  pan?: string;
  address?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  gstNo?: string;
  address?: string;
  subscriptionEndDate?: string;
  subscriptionStatus: 'active' | 'expired';
  createdAt: string;
}

export interface Supervisor {
  id: string;
  fullName: string;
  email: string;
  companyId: string;
  createdAt: string;
}

export interface Employee {
  employee_id:string;
  id: string;
  name: string;
  mobile: string;
  aadhar?: string;
  pan?: string;
  address?: string;
  type: EmployeeType;
  salary?: number;
  dailyRate?: number;
  supervisorId?: string;
  joinDate: string;
  status: 'active' | 'inactive';
  companyId: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
  companyId: string;
}

export interface PayHistory {
  id: string;
  employeeId: string;
  month: string;
  basePay: number;
  deductions: number;
  finalPay: number;
  companyId: string;
}
