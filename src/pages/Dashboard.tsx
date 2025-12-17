import React, { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, UserCog, Calendar } from 'lucide-react';
import { Employee, Attendance } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/lib/supabaseClient';

const Dashboard: React.FC = () => {

  const [employeeTypeData, setEmployeeTypeData] = useState<
  { name: string; value: number; color: string }[]
>([]);

const [weeklyAttendance, setWeeklyAttendance] = useState<
  { day: string; present: number; absent: number }[]
>([]);

  const { user ,role,company } = useAuth();
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
  const loadStats = async () => {
    if (!company?.company_id) return;

    const today = new Date().toISOString().split("T")[0];

    // =========================
    // 1️⃣ EMPLOYEE COUNT
    // =========================
    let employeeQuery = supabase
      .from("employee")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company.company_id);

    if (role === "SUPERVISOR") {
      employeeQuery = employeeQuery.eq("supervisor_id", user.id);
    }

    const { count: totalEmployees } = await employeeQuery;

    // =========================
    // 2️⃣ PRESENT TODAY
    // =========================
    let presentQuery = supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company.company_id)
      .eq("date", today)
      .eq("status", "P");

    if (role === "SUPERVISOR") {
      presentQuery = presentQuery.eq("marked_by_supervisor", user.id);
    }

    const { count: presentToday } = await presentQuery;

    // =========================
    // 3️⃣ ABSENT TODAY
    // =========================
    let absentQuery = supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company.company_id)
      .eq("date", today)
      .eq("status", "A");

    if (role === "SUPERVISOR") {
      absentQuery = absentQuery.eq("marked_by_supervisor", user.id);
    }

    const { count: absentToday } = await absentQuery;

    // =========================
    // 4️⃣ SUPERVISOR COUNT
    // =========================
    const { count: totalSupervisors } = await supabase
      .from("supervisor")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company.company_id)
      .eq("status", "ACTIVE");

    // =========================
    // 5️⃣ EMPLOYEE TYPE PIE
    // =========================
    let typeQuery = supabase
      .from("employee")
      .select("employment_type")
      .eq("company_id", company.company_id);

    if (role === "SUPERVISOR") {
      typeQuery = typeQuery.eq("supervisor_id", user.id);
    }

    const { data: typeData } = await typeQuery;

    const fixed =
      typeData?.filter(e => e.employment_type === "FIXED").length ?? 0;
    const daily =
      typeData?.filter(e => e.employment_type === "DAILY").length ?? 0;

    setEmployeeTypeData([
      { name: "Fixed Salary", value: fixed, color: "hsl(var(--primary))" },
      { name: "Daily Wage", value: daily, color: "hsl(var(--secondary))" },
    ]);

    // =========================
    // 6️⃣ WEEKLY ATTENDANCE BAR
    // =========================
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    let attendanceQuery = supabase
      .from("attendance")
      .select("date, status")
      .eq("company_id", company.company_id)
      .in("date", last7Days);

    if (role === "SUPERVISOR") {
      attendanceQuery = attendanceQuery.eq("marked_by_supervisor", user.id);
    }

    const { data: attendanceData } = await attendanceQuery;

    const weekly = last7Days.map(date => {
      const dayData = attendanceData?.filter(a => a.date === date) || [];
      return {
        day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
        present: dayData.filter(a => a.status === "P").length,
        absent: dayData.filter(a => a.status === "A").length,
      };
    });

    setWeeklyAttendance(weekly);

    // =========================
    // 7️⃣ SET STATS
    // =========================
    setStats({
      totalEmployees: totalEmployees ?? 0,
      presentToday: presentToday ?? 0,
      absentToday: absentToday ?? 0,
      totalSupervisors: totalSupervisors ?? 0,
    });
  };

  loadStats();
}, [company?.company_id, role, user?.id]);



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
    ...(role === 'OWNER' ? [{
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.email}
          </p>
        </div>
        {role === 'OWNER' && (
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
              <BarChart data={weeklyAttendance} >
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
                    data={employeeTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {employeeTypeData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
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
