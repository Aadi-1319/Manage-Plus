import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";

import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import type { Employee, EmployeeType } from '@/types';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const employeeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  mobile: z.string().trim().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  aadhar: z.string().trim().regex(/^\d{12}$/, 'Aadhar must be 12 digits').optional().or(z.literal('')),
  pan: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional().or(z.literal('')),
  address: z.string().trim().max(500, 'Address must be less than 500 characters').optional().or(z.literal('')),
  type: z.enum(['FIXED', 'DAILY'], { errorMap: () => ({ message: 'Type must be FIXED or DAILY' }) }),
  salary: z.number().positive('Salary must be positive').optional(),
  dailyRate: z.number().positive('Daily rate must be positive').optional(),
  supervisorId: z.string().optional().or(z.literal('')),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Join date must be in YYYY-MM-DD format'),
});

interface ImportError {
  row: number;
  errors: string[];
}

const ExcelImportDialog: React.FC<ExcelImportDialogProps> = ({ 
  open, 
  onOpenChange, 
  onImportComplete 
}) => {
  const { company } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an Excel file (.xlsx, .xls) or CSV file',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      setImportErrors([]);
      setSuccessCount(0);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'John Doe',
        mobile: '9876543210',
        aadhar: '123456789012',
        pan: 'ABCDE1234F',
        address: '123 Street, City',
        type: 'FIXED',
        salary: 30000,
        dailyRate: '',
        supervisorId: '',
        joinDate: '2024-01-01',
      },
      {
        name: 'Jane Smith',
        mobile: '9876543211',
        aadhar: '123456789013',
        pan: 'ABCDE1234G',
        address: '456 Avenue, City',
        type: 'DAILY',
        salary: '',
        dailyRate: 500,
        supervisorId: '',
        joinDate: '2024-01-15',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'employee_import_template.xlsx');
  };

  const handleImport = async () => {
    if (!file || !company) return;

    setImporting(true);
    setImportErrors([]);
    setSuccessCount(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const errors: ImportError[] = [];
      const validEmployees: Employee[] = [];

      jsonData.forEach((row: any, index: number) => {
        const rowNumber = index + 2; // +2 because Excel rows start at 1 and we have a header
        
        try {
          // Validate the row data
          const validatedData = employeeSchema.parse({
            name: row.name,
            mobile: String(row.mobile).trim(),
            aadhar: row.aadhar ? String(row.aadhar).trim() : '',
            pan: row.pan ? String(row.pan).trim().toUpperCase() : '',
            address: row.address || '',
            type: String(row.type).toUpperCase(),
            salary: row.salary ? Number(row.salary) : undefined,
            dailyRate: row.dailyRate ? Number(row.dailyRate) : undefined,
            supervisorId: row.supervisorId || '',
            joinDate: row.joinDate,
          });

          // Additional validation for type-specific fields
          if (validatedData.type === 'FIXED' && !validatedData.salary) {
            throw new Error('Salary is required for FIXED type employees');
          }
          if (validatedData.type === 'DAILY' && !validatedData.dailyRate) {
            throw new Error('Daily rate is required for DAILY type employees');
          }

          // Create employee object
          const newEmployee: Employee = {
            id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            full_name: validatedData.name,
            mobile: validatedData.mobile,
            aadhar: validatedData.aadhar || undefined,
            pan: validatedData.pan || undefined,
            address: validatedData.address || undefined,
            employment_type: validatedData.type as EmployeeType,
            monthly_salary: validatedData.salary,
            daily_rate: validatedData.dailyRate,
            supervisorId: validatedData.supervisorId || undefined,
            join_date: validatedData.joinDate,
            status: 'active',
            companyId: company.id,
          };

          validEmployees.push(newEmployee);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push({
              row: rowNumber,
              errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            });
          } else if (error instanceof Error) {
            errors.push({
              row: rowNumber,
              errors: [error.message],
            });
          }
        }
      });

      // Save valid employees
      if (validEmployees.length > 0) {
        const existingEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
        localStorage.setItem('employees', JSON.stringify([...existingEmployees, ...validEmployees]));
        setSuccessCount(validEmployees.length);
      }

      setImportErrors(errors);

      if (errors.length === 0) {
        toast({
          title: 'Import successful',
          description: `Successfully imported ${validEmployees.length} employees`,
        });
        onImportComplete();
        setTimeout(() => {
          onOpenChange(false);
          setFile(null);
        }, 2000);
      } else if (validEmployees.length > 0) {
        toast({
          title: 'Partial import',
          description: `Imported ${validEmployees.length} employees with ${errors.length} errors`,
          variant: 'destructive',
        });
        onImportComplete();
      } else {
        toast({
          title: 'Import failed',
          description: 'No valid employees found in the file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to process Excel file',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Employees from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file to bulk import employees. Download the template for the correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium">Download Template</p>
              <p className="text-xs text-muted-foreground">
                Get the Excel template with sample data and correct format
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excel-file">Upload Excel File</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={importing}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>

          {successCount > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Successfully imported {successCount} employee{successCount > 1 ? 's' : ''}
              </AlertDescription>
            </Alert>
          )}

          {importErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">
                  Found {importErrors.length} error{importErrors.length > 1 ? 's' : ''}:
                </p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {importErrors.slice(0, 10).map((error, idx) => (
                    <div key={idx} className="text-xs">
                      <p className="font-medium">Row {error.row}:</p>
                      <ul className="list-disc list-inside ml-2">
                        {error.errors.map((err, errIdx) => (
                          <li key={errIdx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {importErrors.length > 10 && (
                    <p className="text-xs">...and {importErrors.length - 10} more errors</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1"
            >
              {importing ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Employees
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImportDialog;
