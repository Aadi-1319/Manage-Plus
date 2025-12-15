import React from 'react';
import { Employee } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, History } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onViewHistory: (employee: Employee) => void;
  canEdit: boolean;
  showHistory: boolean;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onEdit,
  onDelete,
  onViewHistory,
  canEdit,
  showHistory,
}) => {
  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No employees found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Mobile</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Salary/Rate</TableHead>
          <TableHead>Join Date</TableHead>
          <TableHead>Status</TableHead>
          {canEdit && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell className="font-medium">{employee.full_name}</TableCell>
            <TableCell>{employee.mobile}</TableCell>
            <TableCell>
              <Badge variant={employee.employment_type === 'FIXED' ? 'default' : 'secondary'}>
                {employee.employment_type}
              </Badge>
            </TableCell>
            <TableCell>
              {employee.employment_type === 'FIXED'
                ? `₹${employee.monthly_salary?.toLocaleString()}/month`
                : `₹${employee.daily_rate}/day`}
            </TableCell>
            <TableCell>{new Date(employee.join_date).toLocaleDateString()}</TableCell>
            <TableCell>
              <Badge variant={employee.status === 'active' ? 'default' : 'outline'}>
                {employee.status}
              </Badge>
            </TableCell>
            {(canEdit || showHistory) && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {showHistory && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewHistory(employee)}
                    >
                      <History className="w-4 h-4" />
                    </Button>
                  )}
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(employee)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {employee.full_name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(employee.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default EmployeeTable;
