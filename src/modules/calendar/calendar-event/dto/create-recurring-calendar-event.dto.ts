import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  Matches,
  ValidateIf,
} from 'class-validator';
import { RecurrenceType } from '../entities/recurrence-type.enum';

/**
 * DTO for creating recurring calendar events.
 * Generates multiple CalendarEvent records (one per occurrence) for WEEKLY, MONTHLY, or ANNUALLY.
 */
export class CreateRecurringCalendarEventDto {
  @IsString()
  title: string;

  @IsEnum(RecurrenceType, {
    message: 'recurrenceType must be WEEKLY, MONTHLY, or ANNUALLY',
  })
  recurrenceType: RecurrenceType;

  /**
   * Time of day for the event (HH:mm or HH:mm:ss). Used when allDay is false.
   * E.g. "17:00" for 5pm.
   */
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'time must be HH:mm or HH:mm:ss',
  })
  time: string;

  /**
   * First date to generate occurrences (YYYY-MM-DD). First occurrence will be on or after this date.
   */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startFrom must be YYYY-MM-DD' })
  startFrom: string;

  /**
   * Last date to generate occurrences (YYYY-MM-DD). No occurrence will be after this date.
   */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endAt must be YYYY-MM-DD' })
  endAt: string;

  /** For WEEKLY: day of week 1=Monday, 7=Sunday. Required when recurrenceType is WEEKLY. */
  @ValidateIf((o) => o.recurrenceType === RecurrenceType.WEEKLY)
  @IsInt()
  @Min(1, { message: 'dayOfWeek must be 1 (Monday) to 7 (Sunday)' })
  @Max(7)
  dayOfWeek?: number;

  /** For MONTHLY or ANNUALLY: day of month 1-31. Required when recurrenceType is MONTHLY or ANNUALLY. */
  @ValidateIf(
    (o) =>
      o.recurrenceType === RecurrenceType.MONTHLY ||
      o.recurrenceType === RecurrenceType.ANNUALLY,
  )
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  /** For ANNUALLY only: month 1-12 (e.g. 1 = January). Required when recurrenceType is ANNUALLY. */
  @ValidateIf((o) => o.recurrenceType === RecurrenceType.ANNUALLY)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  /** Duration in minutes for timed events. Default 60. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  durationMinutes?: number;

  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @IsString()
  @IsOptional()
  backgroundColor?: string;

  @IsString()
  @IsOptional()
  borderColor?: string;

  @IsString()
  @IsOptional()
  textColor?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
