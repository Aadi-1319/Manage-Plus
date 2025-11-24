import React, { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Calendar } from 'lucide-react';
import MonthlyReportDialog from '@/components/Reports/MonthlyReportDialog';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [monthlyReportOpen, setMonthlyReportOpen] = useState(false);

  if (user?.role !== 'OWNER') {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don't have permission to view this page</p>
      </div>
    );
  }

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
            <Button className="w-full">
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
            <Button className="w-full" variant="outline">
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
            <Button className="w-full" variant="outline">
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
