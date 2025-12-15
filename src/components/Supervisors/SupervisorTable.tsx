import React from 'react';
import { User } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
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

interface SupervisorTableProps {
  supervisors: User[];
  onDelete: (id: string) => void;
}

const SupervisorTable: React.FC<SupervisorTableProps> = ({ supervisors, onDelete }) => {
  if (supervisors.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No supervisors found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>PAN</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {supervisors.map((supervisor) => (
          <TableRow key={supervisor.id}>
            <TableCell className="font-medium">{supervisor.fullName}</TableCell>
            <TableCell>{supervisor.email}</TableCell>
            <TableCell>{supervisor.phone || '-'}</TableCell>
            <TableCell>{supervisor.pan || '-'}</TableCell>
            <TableCell className="max-w-[200px] truncate">{supervisor.address || '-'}</TableCell>
            <TableCell>{new Date(supervisor.createdAt).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <AlertDialog key={`delete-${supervisor.id}`}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Supervisor</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {supervisor.fullName}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(supervisor.supervisor_id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SupervisorTable;
