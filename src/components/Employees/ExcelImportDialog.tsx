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
import { supabase } from '@/lib/supabaseClient';

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
  const { company,user ,role} = useAuth();
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
    full_name: 'Rohan Sharma',
    mobile: '9876543210',
    aadhar: '123412341234',
    pan: 'ABCDE1234F',
    address: '12 MG Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipcode: '400001',
    employment_type: 'FIXED',
    monthly_salary: 35000,
    daily_rate: '',
    join_date: '2024-01-01',
    status: 'active',
  },
  {
    full_name: 'Priya Verma',
    mobile: '9876543211',
    aadhar: '123412341235',
    pan: 'ABCDE1234G',
    address: '45 Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    zipcode: '110001',
    employment_type: 'DAILY',
    monthly_salary: '',
    daily_rate: 600,
    join_date: '2024-02-10',
    status: 'active',
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

     const { data: existingEmployees, error: fetchError } = await supabase
      .from('employee')
      .select('mobile')
      .eq('company_id', company.company_id);

    if (fetchError) throw fetchError;

    const existingMobiles = new Set(
      (existingEmployees || []).map(e => String(e.mobile).trim())
    );

    /* ---------- TRACK DUPLICATES IN EXCEL ---------- */
    const excelMobiles = new Set<string>();

    /* ---------- PROCESS ROWS ---------- */
    jsonData.forEach((row: any, index: number) => {
      const rowNumber = index + 2;
      const mobile = String(row.mobile).trim();

      try {
        /* --- SILENT SKIP: DUPLICATE IN DB --- */
        if (existingMobiles.has(mobile)) return;

        /* --- SILENT SKIP: DUPLICATE IN EXCEL --- */
        if (excelMobiles.has(mobile)) return;
        excelMobiles.add(mobile);

        /* --- VALIDATION --- */
        const validatedData = employeeSchema.parse({
          name: row.full_name,
          mobile,
          aadhar: row.aadhar ? String(row.aadhar).trim() : '',
          pan: row.pan ? String(row.pan).trim().toUpperCase() : '',
          address: row.address || '',
          city: row.city || '',
          state: row.state || '',
          zipcode: row.zipcode || '',
          type: String(row.employment_type).toUpperCase(),
          salary: row.monthly_salary ? Number(row.monthly_salary) : undefined,
          dailyRate: row.daily_rate ? Number(row.daily_rate) : undefined,
          joinDate: row.join_date,
        });

        if (validatedData.type === 'FIXED' && !validatedData.salary) {
          throw new Error('Salary is required for FIXED type employees');
        }
        if (validatedData.type === 'DAILY' && !validatedData.dailyRate) {
          throw new Error('Daily rate is required for DAILY type employees');
        }

        const newEmployee: Employee = {
          full_name: validatedData.name,
          mobile: validatedData.mobile,
          aadhar: validatedData.aadhar || undefined,
          pan: validatedData.pan || undefined,
          address: validatedData.address || undefined,
          city: row.city || undefined,
          state: row.state || undefined,
          zipcode: row.zipcode || undefined,
          employment_type: validatedData.type as EmployeeType,
          monthly_salary: validatedData.salary,
          daily_rate: validatedData.dailyRate,
          join_date: validatedData.joinDate,
          company_id: company.company_id,
          status: 'active',
          supervisor_id: role === 'SUPERVISOR' ? user.id : undefined,
          owner_id: role === 'OWNER' ? user.id : undefined
        };

        validEmployees.push(newEmployee);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            row: rowNumber,
            errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          });
        } else if (error instanceof Error) {
          errors.push({ row: rowNumber, errors: [error.message] });
        }
      }
    });

    if (validEmployees.length > 0) {
      const { error } = await supabase.from('employee').insert(validEmployees);

      if (error) {
        toast({
          title: 'Import failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setSuccessCount(validEmployees.length);
      }
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
      }, 1000);
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
