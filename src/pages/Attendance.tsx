import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";

import { Employee, Attendance as AttendanceType, AttendanceStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Attendance: React.FC = () => {
  const { user, company } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
    loadAttendance();
  }, [company, date]);

  const loadEmployees = () => {
    const allEmployees: Employee[] = JSON.parse(localStorage.getItem('employees') || '[]');
    let companyEmployees = allEmployees.filter(
      e => e.companyId === company?.id && e.status === 'active'
    );

    if (user?.role === 'SUPERVISOR') {
      companyEmployees = companyEmployees.filter(e => e.supervisorId === user.id);
    }

    setEmployees(companyEmployees);
  };

  const loadAttendance = () => {
    const allAttendance: AttendanceType[] = JSON.parse(localStorage.getItem('attendances') || '[]');
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAttendance = allAttendance.filter(
      a => a.date === dateStr && a.companyId === company?.id
    );

    const attendanceMap: Record<string, AttendanceStatus> = {};
    dayAttendance.forEach(a => {
      attendanceMap[a.employeeId] = a.status;
    });
    setAttendance(attendanceMap);
  };

  const toggleAttendance = (employeeId: string) => {
    setAttendance(prev => ({
      ...prev,
      [employeeId]: prev[employeeId] === 'P' ? 'A' : 'P',
    }));
  };

  const saveAttendance = () => {
    const allAttendance: AttendanceType[] = JSON.parse(localStorage.getItem('attendances') || '[]');
    const dateStr = format(date, 'yyyy-MM-dd');

    // Remove existing attendance for this date and company
    const filtered = allAttendance.filter(
      a => !(a.date === dateStr && a.companyId === company?.id)
    );

    // Add new attendance records
    Object.entries(attendance).forEach(([employeeId, status]) => {
      filtered.push({
        id: `att_${Date.now()}_${employeeId}`,
        employeeId,
        date: dateStr,
        status,
        markedBy: user!.id,
        companyId: company!.id,
      });
    });

    localStorage.setItem('attendances', JSON.stringify(filtered));
    
    toast({
      title: 'Attendance saved',
      description: `Attendance for ${format(date, 'PPP')} has been saved successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mark Attendance</h1>
          <p className="text-muted-foreground mt-1">
            Track daily attendance for your team
          </p>
        </div>
        <Button onClick={saveAttendance}>
          <Save className="w-4 h-4 mr-2" />
          Save Attendance
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Select Date</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-[280px] justify-start text-left font-normal')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {employees.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No employees found
              </div>
            ) : (
              employees.map(employee => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.mobile}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={attendance[employee.id] === 'P' ? 'default' : 'outline'}
                      className={cn(
                        attendance[employee.id] === 'P' && 'bg-secondary hover:bg-secondary/90'
                      )}
                      onClick={() => toggleAttendance(employee.id)}
                    >
                      Present
                    </Button>
                    <Button
                      variant={attendance[employee.id] === 'A' ? 'destructive' : 'outline'}
                      onClick={() => toggleAttendance(employee.id)}
                    >
                      Absent
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
