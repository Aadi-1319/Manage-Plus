import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileDown, Calendar } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

import type { Employee, Attendance } from '@/types';

interface MonthlyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MonthlyReportDialog: React.FC<MonthlyReportDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { company } = useAuth();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  /* ---------------- FETCH DATA ---------------- */

  const fetchReportData = async () => {
    if (!company) return;

    setLoading(true);
    setReportGenerated(false);

    const startDate = new Date(selectedYear, selectedMonth, 1)
      .toISOString()
      .split('T')[0];

    const endDate = new Date(selectedYear, selectedMonth + 1, 0)
      .toISOString()
      .split('T')[0];

    const [{ data: empData, error: empError }, { data: attData, error: attError }] =
      await Promise.all([
        supabase
          .from('employee')
          .select('*')
          .eq('company_id', company.company_id)
          .eq('status', 'active'),

        supabase
          .from('attendance')
          .select('*')
          .eq('company_id', company.company_id)
          .gte('date', startDate)
          .lte('date', endDate),
      ]);

    if (empError || attError) {
      console.error(empError || attError);
      setLoading(false);
      return;
    }

    setEmployees(empData || []);
    setAttendance(attData || []);
    setReportGenerated(true);
    setLoading(false);
  };

  /* ---------------- REPORT LOGIC ---------------- */

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const reportData = useMemo(() => {
    if (!reportGenerated) return [];

    return employees.map(emp => {
      const empAttendance = attendance.filter(
        a => a.employee_id === emp.employee_id
      );

      const hasAttendance = empAttendance.length > 0;

const presentDays = hasAttendance
  ? empAttendance.filter(a => a.status === 'P').length
  : 0;

const absentDays = hasAttendance
  ? empAttendance.filter(a => a.status === 'A').length
  : 0;

      let calculatedWage = 0;
      let deductions = 0;
      let finalPay = 0;

      if (!hasAttendance) {
  // 🚨 No attendance = No pay
  calculatedWage = 0;
  deductions = 0;
  finalPay = 0;
} else {
  if (emp.employment_type === 'FIXED' && emp.monthly_salary) {
    const dailyRate = emp.monthly_salary / daysInMonth;
    deductions = dailyRate * absentDays;
    finalPay = dailyRate - deductions;
  }

 if (emp.employment_type === 'DAILY' && emp.daily_rate) {
  const hourlyRate = emp.daily_rate / 8; // standard 8-hour day

  calculatedWage = empAttendance.reduce((sum, record) => {
    const hours = record.work_hours ?? 0;
    return sum + hours * hourlyRate;
  }, 0);

  finalPay = calculatedWage;
}

}

      return {
        employee: emp,
        totalDays: daysInMonth,
        presentDays,
        absentDays,
        calculatedWage,
        deductions,
        finalPay,
      };
    });
  }, [employees, attendance, reportGenerated]);

  const totals = useMemo(() => {
    return reportData.reduce(
      (acc, r) => ({
        calculatedWage: acc.calculatedWage + r.calculatedWage,
        deductions: acc.deductions + r.deductions,
        finalPay: acc.finalPay + r.finalPay,
      }),
      { calculatedWage: 0, deductions: 0, finalPay: 0 }
    );
  }, [reportData]);

  /* ---------------- EXPORT ---------------- */

  const exportCSV = () => {
    if (!reportData.length) return;

    const headers = [
      'Employee Name',
      'Type',
      'Total Days',
      'Present',
      'Absent',
      'Base Pay',
      'Deductions',
      'Final Pay',
    ];

    const rows = reportData.map(r => [
      r.employee.full_name,
      r.employee.employment_type,
      r.totalDays,
      r.presentDays,
      r.absentDays,
      r.calculatedWage.toFixed(2),
      r.deductions.toFixed(2),
      r.finalPay.toFixed(2),
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `monthly-report-${months[selectedMonth]}-${selectedYear}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  /* ---------------- UI ---------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Monthly Attendance & Wage Report</DialogTitle>
          <DialogDescription>
            Attendance summary and salary calculation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={v => setSelectedMonth(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={v => setSelectedYear(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={fetchReportData} disabled={loading} className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>

          {reportGenerated && reportData.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Absent</TableHead>
                    <TableHead className="text-right">Final Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map(r => (
                    <TableRow key={r.employee.employee_id}>
                      <TableCell>{r.employee.full_name}</TableCell>
                      <TableCell>{r.employee.employment_type}</TableCell>
                      <TableCell className="text-right">{r.presentDays}</TableCell>
                      <TableCell className="text-right">{r.absentDays}</TableCell>
                      <TableCell className="text-right">
                        ₹{r.finalPay.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell colSpan={4}>TOTAL</TableCell>
                    <TableCell className="text-right">
                      ₹{totals.finalPay.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Button variant="outline" onClick={exportCSV} className="w-full">
                <FileDown className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </>
          )}

          {reportGenerated && reportData.length === 0 && (
            <p className="text-center text-muted-foreground">
              No data found for selected month
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyReportDialog;
