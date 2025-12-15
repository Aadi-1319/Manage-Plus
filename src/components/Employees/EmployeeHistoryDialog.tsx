import React, { useState, useEffect } from 'react';
import { Employee, Attendance, PayHistory } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, User, Phone, CreditCard, MapPin } from 'lucide-react';

interface EmployeeHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

const EmployeeHistoryDialog: React.FC<EmployeeHistoryDialogProps> = ({
  open,
  onOpenChange,
  employee,
}) => {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [payHistory, setPayHistory] = useState<PayHistory[]>([]);

  useEffect(() => {
    if (employee) {
      loadHistory();
    }
  }, [employee]);

  const loadHistory = () => {
    if (!employee) return;

    // Load attendance records
    const allAttendance: Attendance[] = JSON.parse(localStorage.getItem('attendance') || '[]');
    const employeeAttendance = allAttendance
      .filter(a => a.employeeId === employee.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAttendanceRecords(employeeAttendance);

    // Load pay history
    const allPayHistory: PayHistory[] = JSON.parse(localStorage.getItem('payHistory') || '[]');
    const employeePayHistory = allPayHistory
      .filter(p => p.employeeId === employee.id)
      .sort((a, b) => b.month.localeCompare(a.month));
    setPayHistory(employeePayHistory);
  };

  if (!employee) return null;

  const totalPresent = attendanceRecords.filter(a => a.status === 'P').length;
  const totalAbsent = attendanceRecords.filter(a => a.status === 'A').length;
  const totalPaid = payHistory.reduce((sum, p) => sum + p.finalPay, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Employee History - {employee.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{employee.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{employee.mobile}</p>
                </div>
              </div>
              {employee.aadhar && (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Aadhar</p>
                    <p className="font-medium">{employee.aadhar}</p>
                  </div>
                </div>
              )}
              {employee.pan && (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">PAN</p>
                    <p className="font-medium">{employee.pan}</p>
                  </div>
                </div>
              )}
              {employee.address && (
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{employee.address}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Join Date</p>
                  <p className="font-medium">{new Date(employee.join_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Type & Pay</p>
                  <p className="font-medium">
                    {employee.employment_type === 'FIXED'
                      ? `₹${employee.monthly_salary?.toLocaleString()}/month`
                      : `₹${employee.daily_rate}/day`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{totalPresent}</p>
                  <p className="text-sm text-muted-foreground">Total Present</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{totalAbsent}</p>
                  <p className="text-sm text-muted-foreground">Total Absent</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">₹{totalPaid.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History Tabs */}
          <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="attendance">Attendance History</TabsTrigger>
              <TabsTrigger value="payment">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {attendanceRecords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No attendance records found
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Marked By</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>
                                {new Date(record.date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={record.status === 'P' ? 'default' : 'destructive'}
                                >
                                  {record.status === 'P' ? 'Present' : 'Absent'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {record.markedBy}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {payHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No payment records found
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead>Base Pay</TableHead>
                            <TableHead>Deductions</TableHead>
                            <TableHead>Final Pay</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payHistory.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">
                                {new Date(record.month).toLocaleDateString('en-IN', {
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </TableCell>
                              <TableCell>₹{record.basePay.toLocaleString()}</TableCell>
                              <TableCell className="text-destructive">
                                -₹{record.deductions.toLocaleString()}
                              </TableCell>
                              <TableCell className="font-bold text-accent">
                                ₹{record.finalPay.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeHistoryDialog;
