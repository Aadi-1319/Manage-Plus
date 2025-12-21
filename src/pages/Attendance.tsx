import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Employee, Attendance as AttendanceType, AttendanceStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const [inTime, setInTime] = useState<Record<string, string>>({});
  const [outTime, setOutTime] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const dateStr = format(date, 'yyyy-MM-dd');

  const DEFAULT_IN_TIME = '10:00';
const DEFAULT_OUT_TIME = '18:00';


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
      companyEmployees = companyEmployees.filter(e => e.supervisor_id === user.id);
    }

    setEmployees(companyEmployees);

    setInTime(prev => {
    const updated = { ...prev };
    companyEmployees.forEach(e => {
      if (!updated[e.employee_id]) {
        updated[e.employee_id] = DEFAULT_IN_TIME;
      }
    });
    return updated;
  });

  setOutTime(prev => {
    const updated = { ...prev };
    companyEmployees.forEach(e => {
      if (!updated[e.employee_id]) {
        updated[e.employee_id] = DEFAULT_OUT_TIME;
      }
    });
    return updated;
  });
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
    const inMap: Record<string, string> = {};
  const outMap: Record<string, string> = {};

    data?.forEach(a => {
      attendanceMap[a.employee_id] = a.status;
      if (a.in_time) {
        inMap[a.employee_id] = a.in_time;
      } if (a.out_time) {
        outMap[a.employee_id] = a.out_time;
      }
    });
    setInTime(inMap);
    setOutTime(outMap);
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
      in_time:status === 'A'? '00:00' : inTime[employee_id] || null,
      out_time: status === 'A'? '00:00' : outTime[employee_id] || null,
      work_hours:
      attendance[employee_id] === 'P'
        ? calculateWorkHours(inTime[employee_id], outTime[employee_id])
        : 0,
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

  const handleTimeChange = (
  employee_id: string,
  type: 'in' | 'out',
  value: string
) => {
  if (type === 'in') {
    setInTime(prev => ({ ...prev, [employee_id]: value }));
  } else {
    setOutTime(prev => ({ ...prev, [employee_id]: value }));
  }
};

/**
 * Calculate total work hours between inTime and outTime
 * Handles overnight shifts and proper minute conversion
 */
const calculateWorkHours = (inTime?: string, outTime?: string): number | null => {
  if (!inTime || !outTime) return null;

  // Convert HH:MM to total minutes
  const [inH, inM] = inTime.split(':').map(Number);
  const [outH, outM] = outTime.split(':').map(Number);

  const inDate = new Date();
  inDate.setHours(inH, inM, 0, 0);

  const outDate = new Date();
  outDate.setHours(outH, outM, 0, 0);

  // Handle overnight (e.g., in: 22:00, out: 06:00)
  if (outDate <= inDate) {
    outDate.setDate(outDate.getDate() + 1);
  }

  const diffMs = outDate.getTime() - inDate.getTime(); // milliseconds
  const diffHours = diffMs / (1000 * 60 * 60); // convert to hours

  return Number(diffHours.toFixed(2));
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

                  {attendance[employee.employee_id] === 'P' && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-3">

  {/* In Time */}
  <div className="relative">
  {!inTime[employee.employee_id] && (
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
      In Time
    </span>
  )}

  <input
    type="time"
    value={inTime[employee.employee_id] || ''}
    onChange={(e) =>
      setInTime(prev => ({
        ...prev,
        [employee.employee_id]: e.target.value,
      }))
    }
     onClick={(e) => {
    // Open time picker when clicking anywhere
    (e.currentTarget as HTMLInputElement).showPicker?.();
  }}
    className={cn(
      "w-full h-[38px] rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
      !inTime[employee.employee_id] && "text-transparent"
    )}
  />
</div>


  {/* Out Time */}
  <div className="relative">
  {!outTime[employee.employee_id] && (
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
      Out Time
    </span>
  )}

  <input
    type="time"
    value={outTime[employee.employee_id] || ''}
    onChange={(e) =>
      setOutTime(prev => ({
        ...prev,
        [employee.employee_id]: e.target.value,
      }))
    }
     onClick={(e) => {
    // Open time picker when clicking anywhere
    (e.currentTarget as HTMLInputElement).showPicker?.();
  }}
    className={cn(
      "w-full h-[38px] rounded-md border bg-background px-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
      !outTime[employee.employee_id] && "text-transparent"
    )}
  />
</div>


  {/* Work Hours */}
  <div className="relative">
    {!calculateWorkHours(
      inTime[employee.employee_id],
      outTime[employee.employee_id]
    ) && (
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        Work Hours
      </span>
    )}

    <div className="w-full h-[38px] rounded-md border bg-muted px-3 flex items-center text-sm">
      {calculateWorkHours(
        inTime[employee.employee_id],
        outTime[employee.employee_id]
      ) || ''}
    </div>
  </div>

</div>


)}

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
