export class StaffAttendanceResponseDto {
  userId: number;
  userName: string;
  userEmail: string;
  attendance?: {
    id: number;
    date: Date;
    attendanceTime: Date;
    distanceFromOffice: number;
  };
}
