export class EventResponseDto {
  id: number;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  eventTypeId: number;
  eventCategoryId: number | null;
  createdById: number;
  isAllDay: boolean;
  createdAt: Date;
  updatedAt: Date;
  eventType?: {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
  };
  eventCategory?: {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
  } | null;
  createdBy?: {
    id: number;
    name: string;
    emailAddress: string;
  };
}

