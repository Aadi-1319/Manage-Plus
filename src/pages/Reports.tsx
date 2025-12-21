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

  let ownerName;

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
    const daysInMonth = monthEnd.getDate();

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
      const absentDays = daysInMonth - presentDays;
      
      let calculatedWage = 0;
let deductions = 0;
let finalPay = 0;

if (emp.employment_type === 'FIXED' && emp.monthly_salary) {

  // ❗ No attendance at all → no salary
  if (presentDays === 0) {
    finalPay = 0;
  } else {
    const dailyRate = emp.monthly_salary / daysInMonth;
    deductions = dailyRate * absentDays;

    calculatedWage = emp.monthly_salary;
    finalPay = calculatedWage - deductions;
  }
}

  if (emp.employment_type === 'DAILY' && emp.daily_rate) {
  const hourlyRate = emp.daily_rate / 8; // standard 8-hour day

  calculatedWage = empAttendance.reduce((sum, record) => {
    const hours = record.work_hours ?? 0;
    return sum + hours * hourlyRate;
  }, 0);

  finalPay = calculatedWage;
}

    
    return [
        emp.full_name,
        emp.employment_type,
        presentDays.toString(),
        `${finalPay.toFixed(2)}`
      ];
    }) || [];

    // Create PDF
     const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const generatedOn = format(new Date(), 'dd MMM yyyy, hh:mm a');

  /* ---------- COMPANY HEADER ---------- */

  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(company.company_name.toUpperCase(), pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text(`GST No: ${company.gst_no || 'N/A'}`, pageWidth / 2, 22, { align: 'center' });
  doc.text(company.address || '', pageWidth / 2, 28, { align: 'center' });

  doc.line(14, 32, pageWidth - 14, 32);

  /* ---------- REPORT INFO ---------- */

  doc.setFontSize(14);
  doc.setTextColor(33, 37, 41);
  doc.text(
    `Monthly Wage Report – ${format(new Date(), 'MMMM yyyy')}`,
    14,
    42
  );

  const { data: owner, error: ownerError } = await supabase
  .from('owner')
  .select('full_name')
  .eq('owner_id', user.id)
  .single();

if (ownerError) {
  console.error('Error fetching owner:', ownerError);
}

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated On: ${generatedOn}`, 14, 48);
  doc.text(`Owner: ${owner.full_name || 'N/A'}`, pageWidth - 14, 48, {
    align: 'right',
  });

  /* ---------- TABLE ---------- */

  autoTable(doc, {
    startY: 55,
    head: [['Employee Name', 'Type', 'Present Days', 'Total Wage (in RS)']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      halign: 'center',
    },
    bodyStyles: {
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left' },
    },
    didDrawPage: (data) => {
      /* ---------- FOOTER (PAGE NUMBER) ---------- */
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        `Page ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    },
  });

  /* ---------- SAVE ---------- */

  doc.save(`wage-report-${format(new Date(), 'yyyy-MM')}.pdf`);
  };


  

  /** Export all data to CSV */
const exportAllData = async () => {

  if (!company) return;

  const { data: employees } = await supabase
    .from<Employee>('employee')
    .select('*')
    .eq('company_id', company.company_id);

  const { data: attendance } = await supabase
    .from<Attendance>('attendance')
    .select('*')
    .eq('company_id', company.company_id);

  if (!employees || !attendance) return;


  /* ----------- CALCULATE TOTAL PAYABLE PER EMPLOYEE ----------- */

  const daysInMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  0
).getDate();

  /* ---------------- CSV HEADER ---------------- */

  const csvHeader = [
    [
      'Employee Name',
      'Mobile',
      'Employment Type',
      'Status',
      'Date',
      'Work Hours',
      'Daily Rate/Salary',
      'Calculated Wage',
      'Total (Cumulative)',
      'Marked By',
      'Company Name'
    ].join(',')
  ];

  const csvRows: string[] = [];

  const attendanceByEmployee = new Map<string, Attendance[]>();

attendance.forEach(a => {
  if (!attendanceByEmployee.has(a.employee_id)) {
    attendanceByEmployee.set(a.employee_id, []);
  }
  attendanceByEmployee.get(a.employee_id)!.push(a);
});


const employeeTotalPay = new Map<string, number>();

attendanceByEmployee.forEach((empAttendance, employeeId) => {
  const emp = employees.find(e => e.employee_id === employeeId);
  if (!emp) return;

  let totalPay = 0;

  /* ---------- FIXED SALARY ---------- */
  if (emp.employment_type === 'FIXED' && emp.monthly_salary) {
    const daysInMonth = 30; // or calculate dynamically
    const presentDays = empAttendance.filter(a => a.status === 'P').length;
    const absentDays = daysInMonth - presentDays;

    if (presentDays === 0) {
      totalPay = 0;
    } else {
      const dailyRate = emp.monthly_salary / daysInMonth;
      // const deductions = dailyRate * absentDays;
      totalPay = dailyRate;
    }
  }

  /* ---------- DAILY WAGE ---------- */
  if (emp.employment_type === 'DAILY' && emp.daily_rate) {
    const hourlyRate = emp.daily_rate / 8;

    totalPay = empAttendance.reduce((sum, record) => {
      const hours = record.work_hours ?? 0;
      return sum + hours * hourlyRate;
    }, 0);
  }

  employeeTotalPay.set(employeeId, totalPay);
});

const { data: owner, error: ownerError } = await supabase
  .from('owner')
  .select('full_name')
  .eq('owner_id', user.id)
  .single();


  /* ---------------- CSV ROWS ---------------- */
const employeeRunningTotal = new Map<string, number>();

attendance.forEach(a => {
  const emp = employees.find(e => e.employee_id === a.employee_id);
  if (!emp) return;

  let calculatedWage = 0;

  if (emp.employment_type === 'DAILY' && emp.daily_rate) {
    const hours = a.work_hours ?? 0;
    calculatedWage = (emp.daily_rate / 8) * hours;
  }

  if (emp.employment_type === 'FIXED' && emp.monthly_salary) {
    // show 0 per day, total shown separately
    const dailyRate = emp.monthly_salary / daysInMonth; // or dynamic days
    calculatedWage = a.status === 'P' ? dailyRate : 0;  }

  const prevTotal = employeeRunningTotal.get(emp.employee_id) ?? 0;
  const newTotal = prevTotal + calculatedWage;
    employeeRunningTotal.set(emp.employee_id, newTotal);


  employeeRunningTotal.set(emp.employee_id, newTotal);

  csvRows.push([
    emp.full_name,
    emp.mobile,
    emp.employment_type,
    a.status,
    a.date,
    a.work_hours ?? 0,
    emp.employment_type === 'DAILY'
      ? emp.daily_rate
      : emp.monthly_salary,
    calculatedWage.toFixed(2),
    newTotal.toFixed(2),
    owner.full_name,
    company.company_name
  ].join(','));
});


  /* ---------------- DOWNLOAD CSV ---------------- */

  const csvContent = [...csvHeader, ...csvRows].join('\n');
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute(
    'download',
    `attendance-wage-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
  );

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
