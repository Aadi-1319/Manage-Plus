import React, { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, UserCog, Calendar } from 'lucide-react';
import { Employee, Attendance } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { user, company } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    totalSupervisors: 0,
  });
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    if (company?.subscriptionEndDate) {
      const endDate = new Date(company.subscriptionEndDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, diffDays));
    }
  }, [company]);

  useEffect(() => {
    const employees: Employee[] = JSON.parse(localStorage.getItem('employees') || '[]');
    const attendances: Attendance[] = JSON.parse(localStorage.getItem('attendances') || '[]');
    const supervisors = JSON.parse(localStorage.getItem('users') || '[]')
      .filter((u: any) => u.role === 'SUPERVISOR' && u.companyId === company?.id);

    // Filter employees based on user role
    let relevantEmployees = employees.filter(e => e.companyId === company?.id && e.status === 'active');
    
    if (user?.role === 'SUPERVISOR') {
      // Supervisors only see their assigned employees
      relevantEmployees = relevantEmployees.filter(e => e.supervisorId === user.id);
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Get employee IDs for filtering attendance
    const employeeIds = relevantEmployees.map(e => e.id);
    const todayAttendance = attendances.filter(a => 
      a.date === today && 
      a.companyId === company?.id &&
      employeeIds.includes(a.employeeId)
    );

    setStats({
      totalEmployees: relevantEmployees.length,
      presentToday: todayAttendance.filter(a => a.status === 'P').length,
      absentToday: todayAttendance.filter(a => a.status === 'A').length,
      totalSupervisors: supervisors.length,
    });
  }, [company, user]);

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      icon: UserCheck,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: 'Absent Today',
      value: stats.absentToday,
      icon: UserX,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    ...(user?.role === 'OWNER' ? [{
      title: 'Supervisors',
      value: stats.totalSupervisors,
      icon: UserCog,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    }] : []),
  ];

  const weeklyData = [
    { day: 'Mon', present: 45, absent: 5 },
    { day: 'Tue', present: 48, absent: 2 },
    { day: 'Wed', present: 47, absent: 3 },
    { day: 'Thu', present: 46, absent: 4 },
    { day: 'Fri', present: 44, absent: 6 },
    { day: 'Sat', present: 50, absent: 0 },
  ];

  const wageData = [
    { name: 'Fixed Salary', value: 35, color: 'hsl(var(--primary))' },
    { name: 'Daily Wage', value: 15, color: 'hsl(var(--secondary))' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.fullName}
          </p>
        </div>
        {user?.role === 'OWNER' && (
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subscription</p>
                  <p className="text-lg font-bold">
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="hsl(var(--secondary))" />
                <Bar dataKey="absent" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={wageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {wageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
