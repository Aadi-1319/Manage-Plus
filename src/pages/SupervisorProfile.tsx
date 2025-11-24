import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Employee, Attendance } from '@/types';
import { User, Users, Calendar, Clock, Download, FileText, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ActivityRecord {
  id: string;
  date: string;
  action: string;
  employeeName: string;
  status: string;
}

const SupervisorProfile: React.FC = () => {
  const { user, company } = useAuth();
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityRecord[]>([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    activeEmployees: 0,
    recentAttendance: 0,
  });

  useEffect(() => {
    loadProfileData();
  }, [company, user]);

  const loadProfileData = () => {
    if (!user || !company) return;

    // Load assigned employees
    const allEmployees: Employee[] = JSON.parse(localStorage.getItem('employees') || '[]');
    const assigned = allEmployees.filter(
      e => e.supervisorId === user.id && e.companyId === company.id
    );
    setAssignedEmployees(assigned);

    // Calculate stats
    const activeCount = assigned.filter(e => e.status === 'active').length;
    setStats({
      totalAssigned: assigned.length,
      activeEmployees: activeCount,
      recentAttendance: 0,
    });

    // Load activity history (recent attendance markings)
    const allAttendances: Attendance[] = JSON.parse(localStorage.getItem('attendances') || '[]');
    const supervisorAttendances = allAttendances
      .filter(a => a.markedBy === user.id && a.companyId === company.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    const activities: ActivityRecord[] = supervisorAttendances.map(a => {
      const employee = allEmployees.find(e => e.id === a.employeeId);
      return {
        id: a.id,
        date: a.date,
        action: 'Attendance Marked',
        employeeName: employee?.name || 'Unknown',
        status: a.status === 'P' ? 'Present' : 'Absent',
      };
    });

    setActivityHistory(activities);
  };

  const exportEmployeesToExcel = () => {
    const data = assignedEmployees.map(emp => ({
      'Name': emp.name,
      'Mobile': emp.mobile,
      'Type': emp.type,
      'Status': emp.status,
      'Aadhar': emp.aadhar || '',
      'PAN': emp.pan || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, `Employees_${user?.fullName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportEmployeesToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Assigned Employees Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Supervisor: ${user?.fullName}`, 14, 28);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 34);

    const tableData = assignedEmployees.map(emp => [
      emp.name,
      emp.mobile,
      emp.type,
      emp.status,
      emp.aadhar || '-',
      emp.pan || '-',
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Name', 'Mobile', 'Type', 'Status', 'Aadhar', 'PAN']],
      body: tableData,
    });

    doc.save(`Employees_${user?.fullName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportAttendanceToExcel = () => {
    const data = activityHistory.map(activity => ({
      'Date': new Date(activity.date).toLocaleDateString(),
      'Action': activity.action,
      'Employee': activity.employeeName,
      'Status': activity.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `Attendance_${user?.fullName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportAttendanceToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Attendance History Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Supervisor: ${user?.fullName}`, 14, 28);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 34);

    const tableData = activityHistory.map(activity => [
      new Date(activity.date).toLocaleDateString(),
      activity.action,
      activity.employeeName,
      activity.status,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Action', 'Employee', 'Status']],
      body: tableData,
    });

    doc.save(`Attendance_${user?.fullName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">View your details and activity</p>
      </div>

      {/* Profile Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="text-lg font-semibold">{user.fullName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Joined On</p>
              <p className="text-lg">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user.aadhar && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aadhar Number</p>
                <p className="text-lg font-mono">{user.aadhar}</p>
              </div>
            )}
            {user.pan && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">PAN Number</p>
                <p className="text-lg font-mono">{user.pan}</p>
              </div>
            )}
          </div>

          {user.address && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-lg">{user.address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAssigned}</div>
            <p className="text-xs text-muted-foreground mt-1">Assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Employees
            </CardTitle>
            <Users className="w-5 h-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activities Logged
            </CardTitle>
            <Calendar className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activityHistory.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Recent actions</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Employees */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assigned Employees ({assignedEmployees.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportEmployeesToExcel}
                disabled={assignedEmployees.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportEmployeesToPDF}
                disabled={assignedEmployees.length === 0}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {assignedEmployees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No employees assigned yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedEmployees.map(employee => (
                <Card key={employee.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.mobile}</p>
                        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'} className="mt-2">
                          {employee.status}
                        </Badge>
                      </div>
                      <Badge variant="outline">{employee.type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportAttendanceToExcel}
                disabled={activityHistory.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAttendanceToPDF}
                disabled={activityHistory.length === 0}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activityHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityHistory.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                    <TableCell>{activity.action}</TableCell>
                    <TableCell className="font-medium">{activity.employeeName}</TableCell>
                    <TableCell>
                      <Badge variant={activity.status === 'Present' ? 'default' : 'destructive'}>
                        {activity.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorProfile;
