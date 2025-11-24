import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Calendar } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";

import type { Employee, Attendance } from '@/types';

interface MonthlyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EmployeeReport {
  employee: Employee;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  calculatedWage: number;
  deductions: number;
  finalPay: number;
}

const MonthlyReportDialog: React.FC<MonthlyReportDialogProps> = ({ open, onOpenChange }) => {
  const { company } = useAuth();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [reportGenerated, setReportGenerated] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const reportData = useMemo(() => {
    if (!company || !reportGenerated) return [];

    const employeesData = JSON.parse(localStorage.getItem('employees') || '[]') as Employee[];
    const attendanceData = JSON.parse(localStorage.getItem('attendance') || '[]') as Attendance[];

    const companyEmployees = employeesData.filter(emp => emp.companyId === company.id);
    
    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return companyEmployees.map(employee => {
      const employeeAttendance = attendanceData.filter(att => {
        const attDate = new Date(att.date);
        return att.employeeId === employee.id &&
               att.companyId === company.id &&
               attDate.getMonth() === month &&
               attDate.getFullYear() === year;
      });

      const presentDays = employeeAttendance.filter(att => att.status === 'P').length;
      const absentDays = employeeAttendance.filter(att => att.status === 'A').length;

      let calculatedWage = 0;
      let deductions = 0;
      let finalPay = 0;

      if (employee.type === 'FIXED' && employee.salary) {
        const dailyRate = employee.salary / daysInMonth;
        deductions = dailyRate * absentDays;
        calculatedWage = employee.salary;
        finalPay = employee.salary - deductions;
      } else if (employee.type === 'DAILY' && employee.dailyRate) {
        calculatedWage = employee.dailyRate * presentDays;
        finalPay = calculatedWage;
      }

      return {
        employee,
        totalDays: daysInMonth,
        presentDays,
        absentDays,
        calculatedWage,
        deductions,
        finalPay,
      };
    });
  }, [company, selectedMonth, selectedYear, reportGenerated]);

  const handleGenerateReport = () => {
    setReportGenerated(true);
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;

    const headers = ['Employee Name', 'Type', 'Total Days', 'Present', 'Absent', 'Base Pay', 'Deductions', 'Final Pay'];
    const rows = reportData.map(data => [
      data.employee.name,
      data.employee.type,
      data.totalDays,
      data.presentDays,
      data.absentDays,
      data.calculatedWage.toFixed(2),
      data.deductions.toFixed(2),
      data.finalPay.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${months[parseInt(selectedMonth)]}-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const totals = useMemo(() => {
    return reportData.reduce((acc, data) => ({
      calculatedWage: acc.calculatedWage + data.calculatedWage,
      deductions: acc.deductions + data.deductions,
      finalPay: acc.finalPay + data.finalPay,
    }), { calculatedWage: 0, deductions: 0, finalPay: 0 });
  }, [reportData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Monthly Attendance & Wage Report</DialogTitle>
          <DialogDescription>
            Generate comprehensive monthly reports with attendance summary and wage calculations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerateReport} className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            Generate Report
          </Button>

          {reportGenerated && reportData.length > 0 && (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Total Days</TableHead>
                      <TableHead className="text-right">Present</TableHead>
                      <TableHead className="text-right">Absent</TableHead>
                      <TableHead className="text-right">Base Pay</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Final Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((data) => (
                      <TableRow key={data.employee.id}>
                        <TableCell className="font-medium">{data.employee.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            data.employee.type === 'FIXED' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {data.employee.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{data.totalDays}</TableCell>
                        <TableCell className="text-right">{data.presentDays}</TableCell>
                        <TableCell className="text-right">{data.absentDays}</TableCell>
                        <TableCell className="text-right">₹{data.calculatedWage.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{data.deductions.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">₹{data.finalPay.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={5}>TOTAL</TableCell>
                      <TableCell className="text-right">₹{totals.calculatedWage.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{totals.deductions.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{totals.finalPay.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Button onClick={handleExportCSV} variant="outline" className="w-full">
                <FileDown className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
            </>
          )}

          {reportGenerated && reportData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No employee data found for the selected period
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyReportDialog;
