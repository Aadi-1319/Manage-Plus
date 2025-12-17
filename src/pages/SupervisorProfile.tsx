import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import {
  Users,
  Calendar,
  Clock,
  FileText,
  FileSpreadsheet,
  User,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Employee {
  employee_id: string;
  full_name: string;
  phone: string;
  employment_type: "FIXED" | "DAILY";
  status: "ACTIVE" | "INACTIVE";
  aadhar?: string;
  pan?: string;
}

interface AttendanceRow {
  attendance_id: string;
  date: string;
  status: "P" | "A";
  employee_id: string;
}

interface ActivityRecord {
  id: string;
  date: string;
  employeeName: string;
  status: string;
}

const SupervisorProfile: React.FC = () => {
  const { user, company } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [Sup_name, setSup_name]= useState("");
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    activeEmployees: 0,
    recentAttendance: 0,
  });

  useEffect(() => {
    if (!user || !company) return;
    loadProfileData();
   fetchSupervisorName();
  }, [user, company]);

const fetchSupervisorName = async () => {
  const { data, error } = await supabase
    .from("supervisor") // check your table spelling, probably "supervisor"
    .select("full_name")
    .eq("supervisor_id", user.id)
    .single(); // use .single() if you expect only one row

  if (error) {
    console.error("Error fetching supervisor:", error);
    return;
  }

  setSup_name(data.full_name); // now set state
};


  const loadProfileData = async () => {
    /* ================================
       1️⃣ FETCH ASSIGNED EMPLOYEES
    ================================= */
    const { data: empData, error: empErr } = await supabase
      .from("employee")
      .select("*")
      .eq("company_id", company.company_id)
      .eq("supervisor_id", user.id);

    if (empErr) {
      console.error("Employee fetch failed:", empErr);
      return;
    }

    setEmployees(empData);

    const activeCount = empData.filter(
      (e) => e.status === "ACTIVE"
    ).length;

    /* ================================
       2️⃣ EMPLOYEE LOOKUP MAP
    ================================= */

    const employeeMap: Record<string, string> = Object.fromEntries(
      empData.map((e) => [e.employee_id, e.full_name])
    );

    /* ================================
       3️⃣ FETCH RECENT ATTENDANCE
    ================================= */
   const { data: attData, error: attErr } = await supabase
  .from("attendance")
  .select(`
    attendance_id,
    date,
    status,
    employee:employee_id (
      full_name
    )
  `)
  .eq("company_id", company.company_id)
  .eq("marked_by_supervisor", user.id)
  .order("date", { ascending: false })
  .limit(20);


    if (attErr) {
      console.error("Attendance fetch failed:", attErr);
      return;
    }

    const activityList: ActivityRecord[] = attData.map(a => ({
  id: a.attendance_id,
  date: a.date,
  employeeName: a.employee?.full_name ?? "Unknown",
  status: a.status === "P" ? "Present" : "Absent",
}));

    setActivities(activityList);

    setStats({
      totalAssigned: empData.length,
      activeEmployees: activeCount,
      recentAttendance: attData.length,
    });
  };

  /* ================================
     EXPORTS
  ================================= */

  const exportEmployeesToExcel = () => {
    const data = employees.map((e) => ({
      Name: e.full_name,
      Phone: e.phone,
      Type: e.employment_type,
      Status: e.status,
      Aadhar: e.aadhar ?? "",
      PAN: e.pan ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "assigned_employees.xlsx");
  };

  const exportAttendanceToPDF = () => {
    const doc = new jsPDF();
    doc.text("Attendance History", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Date", "Employee", "Status"]],
      body: activities.map((a) => [
        new Date(a.date).toLocaleDateString(),
        a.employeeName,
        a.status,
      ]),
    });

    doc.save("attendance_history.pdf");
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* PROFILE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <User className="w-5 h-5" /> My Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-sm">Name</p>
            <p className="font-semibold">{Sup_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Email</p>
            <p>{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-6">
        <Stat title="Total Employees" value={stats.totalAssigned} icon={Users} />
        <Stat title="Active Employees" value={stats.activeEmployees} icon={Users} />
        <Stat title="Recent Activities" value={stats.recentAttendance} icon={Calendar} />
      </div>

      {/* EMPLOYEES */}
      <Card>
        <CardHeader className="flex justify-between flex-row">
          <CardTitle>Assigned Employees</CardTitle>
          <Button size="sm" onClick={exportEmployeesToExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          {employees.map((e) => (
            <Card key={e.employee_id}>
              <CardContent className="pt-4">
                <p className="font-semibold">{e.full_name}</p>
                <p className="text-sm text-muted-foreground">{e.phone}</p>
                <Badge className="mt-2">{e.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* ACTIVITY */}
      <Card>
        <CardHeader className="flex justify-between flex-row">
          <CardTitle>Recent Activity</CardTitle>
          <Button size="sm" onClick={exportAttendanceToPDF}>
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                  <TableCell>{a.employeeName}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "Present" ? "default" : "destructive"}>
                      {a.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

/* ================================
   SMALL STAT COMPONENT
================================= */
const Stat = ({ title, value, icon: Icon }: any) => (
  <Card>
    <CardHeader className="flex flex-row justify-between pb-2">
      <CardTitle className="text-sm">{title}</CardTitle>
      <Icon className="w-4 h-4" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default SupervisorProfile;
