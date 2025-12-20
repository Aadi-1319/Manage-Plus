export type UserRole = 'OWNER' | 'SUPERVISOR' | 'ADMIN';

export type EmployeeType = 'FIXED' | 'DAILY';

export type AttendanceStatus = 'P' | 'A';

// export interface User {
//   supervisor_id: string;
//   email: string;
//   fullName: string;
//   role: UserRole;
//   companyId: string;
//   aadhar?: string;
//   phone?: string;
//   pan?: string;
//   address?: string;
//   createdAt: string;
// }

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
  supervisor_id: string;
  email: string;
  fullName: string;
  role: UserRole;      // keep role for permission checks
  companyId: string;

  // optional identity details
  aadhar?: string;
  phone?: string;
  pan?: string;
  address?: string;

  createdAt: string;
}

export interface subscription_data {
  company_id: string;
  owner_id :string;
  plan_name: string;
  expire_date? : Date;
  status? : 'active'|'expire'; 
}


export interface Employee {
  employee_id?: string;
  full_name: string;
  mobile: string;
  aadhar?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  employment_type: EmployeeType;
  monthly_salary?: number;
  daily_rate?: number;
  supervisor_id?: string;
  owner_id?: string;
  join_date: string;
  status: 'active' | 'inactive';
  company_id: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  status: AttendanceStatus;
  marked_by_supervisor: string;
  marked_by_owner: string;
  company_id: string;
  in_time?: string;
  out_time?: string;
}

export interface PayHistory {
  id: string;
  employee_id: string;
  month: string;
  basePay: number;
  deductions: number;
  finalPay: number;
  company_id: string;
}
