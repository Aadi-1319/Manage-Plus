import React, { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Calendar } from 'lucide-react';
import MonthlyReportDialog from '@/components/Reports/MonthlyReportDialog';
import { supabase } from '@/lib/supabaseClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Employee, Attendance } from '@/types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Reports: React.FC = () => {
  const { user, role, company } = useAuth();
  const [monthlyReportOpen, setMonthlyReportOpen] = useState(false);
  const navigate = useNavigate();

  if (role !== 'OWNER') {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don't have permission to view this page</p>
      </div>
    );
  }

  /** Generate wage summary PDF */
  const generateWageReport = async () => {
    if (!company) return;

    // Fetch employees
    const { data: employees, error: empError } = await supabase
      .from<Employee>('employee')
      .select('*')
      .eq('company_id', company.company_id);

    if (empError) return console.error('Error fetching employees:', empError);

    // Fetch attendance for current month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const { data: attendance, error: attError } = await supabase
      .from<Attendance>('attendance')
      .select('*')
      .eq('company_id', company.company_id)
      .gte('date', format(monthStart, 'yyyy-MM-dd'))
      .lte('date', format(monthEnd, 'yyyy-MM-dd'));

    if (attError) return console.error('Error fetching attendance:', attError);

    // Prepare table
    const tableData = employees?.map(emp => {
      const empAttendance = attendance?.filter(a => a.employee_id === emp.employee_id) || [];
      const presentDays = empAttendance.filter(a => a.status === 'P').length;
      const dailyRate = emp.daily_rate || 0;
      const monthlySalary = emp.monthly_salary || dailyRate * presentDays;
      return [
        emp.full_name,
        emp.employee_id,
        presentDays.toString(),
        monthlySalary.toString()
      ];
    }) || [];

    // Create PDF
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Wage Summary Report - ${format(new Date(), 'MMMM yyyy')}`, 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [['Employee Name', 'Employee ID', 'Present Days', 'Wage']],
      body: tableData
    });
    doc.save(`wage-summary-${format(new Date(), 'yyyy-MM')}.pdf`);
  };

  /** Export all data to CSV */
  const exportAllData = async () => {
    if (!company) return;

    const { data: employees } = await supabase.from<Employee>('employee').select('*').eq('company_id', company.company_id);
    const { data: attendance } = await supabase.from<Attendance>('attendance').select('*').eq('company_id', company.company_id);

    // Convert to CSV string
    const csvHeader = [
      'Employee Name,Employee ID,Mobile,Status,Date,Marked By,Company ID'
    ];
    const csvRows: string[] = [];

    attendance?.forEach(a => {
      const emp = employees?.find(e => e.employee_id === a.employee_id);
      if (emp) {
        csvRows.push(`${emp.full_name},${emp.employee_id},${emp.mobile},${a.status},${a.date},${a.marked_by_owner || a.marked_by_supervisor},${a.company_id}`);
      }
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `all-data-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Generate and download attendance and wage reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a comprehensive monthly attendance report for all employees
            </p>
            <Button className="w-full" onClick={() => setMonthlyReportOpen(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Select Month & Generate
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wage Summary Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download wage calculations and payment summaries
            </p>
            <Button className="w-full" onClick={generateWageReport}>
              <FileDown className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View complete attendance history for individual employees
            </p>
            <Button onClick={() => navigate('/attendance-history')} className="w-full" variant="outline">
              View History
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export All Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export all employee and attendance data to Excel/CSV
            </p>
            <Button className="w-full" variant="outline" onClick={exportAllData}>
              <FileDown className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      <MonthlyReportDialog 
        open={monthlyReportOpen} 
        onOpenChange={setMonthlyReportOpen} 
      />
    </div>
  );
};

export default Reports;
