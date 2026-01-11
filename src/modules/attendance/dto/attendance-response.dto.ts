export class AttendanceResponseDto {
  id: number;
  userId: number;
  date: Date;
  attendanceTime: Date;
  userLat: number;
  userLong: number;
  distanceFromOffice: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    name: string;
    emailAddress: string;
    role: string;
  };
}
