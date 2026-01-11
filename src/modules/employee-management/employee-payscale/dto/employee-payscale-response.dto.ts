export class EmployeePayscaleResponseDto {
  id: string;
  userId: number;
  basicSalary: number;
  benefitsAllowance: number;
  salaryArrear: number;
  grossSalary: number;
  pfDeduction: number;
  gisDeduction: number;
  netSalary: number;
  tds: number;
  healthContribution: number;
  totalPayout: number;
  updatedAt: Date;
  user?: {
    id: number;
    name: string;
    emailAddress: string;
  };
}
