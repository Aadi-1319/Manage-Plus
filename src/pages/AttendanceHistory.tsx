import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from "@/hooks/useAuth";
import type { Employee, Attendance } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AttendanceHistory() {
  const { user, company,role } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);

  useEffect(() => {
    if (company) fetchEmployees();
  }, [company]);

  useEffect(() => {
    if (company) fetchAttendance();
  }, [currentMonth, selectedEmployeeId, company]);

  /** Fetch employees from Supabase */
  const fetchEmployees = async () => {
    let query = supabase
      .from<Employee>('employee')
      .select('*')
      .eq('company_id', company!.company_id)
      .eq('status', 'active');

    // If user is supervisor, filter by supervisorId
    if (role === 'SUPERVISOR') {
      query = query.eq('supervisor_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }

    setEmployees(data || []);
  };

  /** Fetch attendance from Supabase */
  const fetchAttendance = async () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    let query = supabase
      .from<Attendance>('attendance')
      .select('*')
      .eq('company_id', company!.company_id)
      .gte('date', format(monthStart, 'yyyy-MM-dd'))
      .lte('date', format(monthEnd, 'yyyy-MM-dd'));

    // Filter by employee if selected
    if (selectedEmployeeId !== 'all') {
      query = query.eq('employee_id', selectedEmployeeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching attendance:', error);
      return;
    }

    setAttendanceRecords(data || []);
  };

  const getAttendanceStatus = (employeeId: string, date: Date) => {
    const record = attendanceRecords.find(r =>
      r.employee_id === employeeId &&
      isSameDay(new Date(r.date), date)
    );
    return record?.status;
  };

  const getDaysInMonth = () => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getAttendanceSummary = (employeeId: string) => {
    const employeeRecords = attendanceRecords.filter(r => r.employee_id === employeeId);
    const present = employeeRecords.filter(r => r.status === 'P').length;
    const absent = employeeRecords.filter(r => r.status === 'A').length;
    return { present, absent, total: present + absent };
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Attendance History - ${format(currentMonth, 'MMMM yyyy')}`, 14, 15);
    doc.setFontSize(10);
    doc.text(company?.name || 'Company', 14, 22);

    const displayEmployees = selectedEmployeeId === 'all'
      ? employees
      : employees.filter(e => e.employee_id === selectedEmployeeId);

    const tableData = displayEmployees.map(emp => {
      const summary = getAttendanceSummary(emp.employee_id);
      return [
        emp.full_name,
        emp.mobile,
        summary.present.toString(),
        summary.absent.toString(),
        summary.total.toString(),
        summary.total > 0 ? `${((summary.present / summary.total) * 100).toFixed(1)}%` : '0%'
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [['Employee', 'Mobile', 'Present', 'Absent', 'Total', 'Attendance %']],
      body: tableData,
    });

    doc.save(`attendance-history-${format(currentMonth, 'yyyy-MM')}.pdf`);
  };

  const displayEmployees = selectedEmployeeId === 'all'
    ? employees
    : employees.filter(e => e.employee_id === selectedEmployeeId);

  const daysInMonth = getDaysInMonth();
  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Attendance History</h1>
        <Button onClick={exportToPDF} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Calendar View</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Legend */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <span className="text-sm font-medium">Legend:</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary"></div>
                <span className="text-sm">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-destructive"></div>
                <span className="text-sm">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-muted"></div>
                <span className="text-sm">No Record</span>
              </div>
            </div>

            {displayEmployees.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No employees found</p>
            ) : (
              <div className="space-y-6">
                {displayEmployees.map(employee => {
                  const summary = getAttendanceSummary(employee.employee_id);
                  return (
                    <div key={employee.employee_id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{employee.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{employee.mobile}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="outline" className="bg-primary/10">
                            Present: {summary.present}
                          </Badge>
                          <Badge variant="outline" className="bg-destructive/10">
                            Absent: {summary.absent}
                          </Badge>
                          {summary.total > 0 && (
                            <Badge variant="secondary">
                              {((summary.present / summary.total) * 100).toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {daysInMonth.map(day => {

                          const record = attendanceRecords.find(r =>
                          r.employee_id === employee.employee_id &&
                          isSameDay(new Date(r.date), day)
                          );
                          const status = getAttendanceStatus(employee.employee_id, day);
                          const isToday = isSameDay(day, today);
                          const isFutureDate = day > today;

                          return (
                            <div
                              key={day.toISOString()}
                              className={`
                                aspect-square rounded-md flex flex-col items-center justify-center
                                text-sm border transition-colors
                                ${status === 'P' ? 'bg-primary text-primary-foreground' : ''}
                                ${status === 'A' ? 'bg-destructive text-destructive-foreground' : ''}
                                ${!status && !isFutureDate ? 'bg-muted text-muted-foreground' : ''}
                                ${isFutureDate ? 'bg-background text-muted-foreground opacity-50' : ''}
                                ${isToday ? 'ring-2 ring-ring' : ''}
                              `}
                            >
                              <span className="font-medium">{format(day, 'd')}</span>
                              <span className="text-xs">{format(day, 'EEE')}</span>

                              {/* Show in/out time only if present */}
                            {status === 'P' && record && (
                              <div className="mt-2 flex flex-col items-center justify-center text-[10px] space-y-1">
                                <div className="flex items-center gap-1 bg-white/20 rounded px-1 py-0.5 font-medium text-white">
                                  <span>In:</span>
                                  <span>{record.in_time}</span>
                                </div>
                                <div className="flex items-center gap-1 bg-white/20 rounded px-1 py-0.5 font-medium text-white">
                                  <span>Out:</span>
                                  <span>{record.out_time}</span>
                                </div>
                              </div>
                            )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
