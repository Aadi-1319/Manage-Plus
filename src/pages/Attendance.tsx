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
import { supabase } from '@/lib/supabaseClient'; // Make sure you have a supabaseClient setup

const Attendance: React.FC = () => {
  const { user, company,role } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const { toast } = useToast();
  const dateStr = format(date, 'yyyy-MM-dd');

  useEffect(() => {
    if (company) {
      fetchEmployees();
      fetchAttendance();
    }
  }, [company, date]);

  /** Fetch employees from Supabase */
  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from<Employee>('employee')
      .select('*')
      .eq('company_id', company!.company_id)
      .eq('status', 'active');

    if (error) return console.error('Error fetching employees:', error);

    let companyEmployees = data || [];

    if (role === 'SUPERVISOR') {
      companyEmployees = companyEmployees.filter(e => e.supervisorId === user.id);
    }

    setEmployees(companyEmployees);
  };

  /** Fetch attendance from Supabase for selected date */
  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from<AttendanceType>('attendance')
      .select('*')
      .eq('company_id', company!.company_id)
      .eq('date', dateStr);

    if (error) return console.error('Error fetching attendance:', error);

    const attendanceMap: Record<string, AttendanceStatus> = {};
    data?.forEach(a => {
      attendanceMap[a.employee_id] = a.status;
    });
    setAttendance(attendanceMap);
  };

  /** Toggle attendance for an employee */
  const toggleAttendance = (employee_id: string) => {
    setAttendance(prev => ({
      ...prev,
      [employee_id]: prev[employee_id] === 'P' ? 'A' : 'P',
    }));
  };

  /** Save attendance to Supabase */
  const saveAttendance = async () => {
    // Delete existing attendance for this date and company
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('company_id', company!.company_id)
      .eq('date', dateStr);

    if (deleteError) {
      console.error('Error deleting old attendance:', deleteError);
      return;
    }

    // Insert new attendance
    const newRecords = Object.entries(attendance).map(([employee_id, status]) => ({
      employee_id,
      company_id: company!.company_id,
      date: dateStr,
      status,
      marked_by_owner: role === 'OWNER' ? user.id : null,
      marked_by_supervisor: role === 'SUPERVISOR' ? user.id : null,
    }));

    const { error: insertError } = await supabase
      .from('attendance')
      .insert(newRecords);

    if (insertError) {
      console.error('Error saving attendance:', insertError);
      toast({
        title: 'Error',
        description: 'Failed to save attendance.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Attendance saved',
        description: `Attendance for ${format(date, 'PPP')} has been saved successfully.`,
      });
    }
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
                  key={employee.employee_id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{employee.full_name}</p>
                    <p className="text-sm text-muted-foreground">{employee.mobile}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={attendance[employee.employee_id] === 'P' ? 'default' : 'outline'}
                      className={cn(
                        attendance[employee.employee_id] === 'P' && 'bg-secondary hover:bg-secondary/90'
                      )}
                      onClick={() => toggleAttendance(employee.employee_id)}
                    >
                      Present
                    </Button>
                    <Button
                      variant={attendance[employee.employee_id] === 'A' ? 'destructive' : 'outline'}
                      onClick={() => toggleAttendance(employee.employee_id)}
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
