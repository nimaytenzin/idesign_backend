export class CalendarEventResponseDto {
  id: number | string;
  title: string;
  start: Date | string;
  end?: Date | string | null;
  allDay?: boolean;
  backgroundColor?: string | null;
  borderColor?: string | null;
  textColor?: string | null;
  extendedProps?: Record<string, any> | null;
  createdById?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: {
    id: number;
    name: string;
    emailAddress: string;
  };
}
