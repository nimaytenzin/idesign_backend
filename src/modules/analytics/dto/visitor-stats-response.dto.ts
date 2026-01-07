import { DeviceType, ReferrerSource } from '../entities/visitor.entity';

export class VisitorStatsResponseDto {
  totalVisitors: number;
  uniqueVisitors: number;
  visitorsByCountry: { country: string; count: number }[];
  visitorsByDevice: { deviceType: DeviceType; count: number }[];
  visitorsByReferrer: { referrerSource: ReferrerSource; count: number }[];
  visitorsByDistrict: { country: string; district: string; count: number }[];
}

export class VisitorsByCountryDto {
  country: string;
  count: number;
}

export class VisitorsByDeviceDto {
  deviceType: DeviceType;
  count: number;
}

export class VisitorsByReferrerDto {
  referrerSource: ReferrerSource;
  count: number;
}

export class VisitorsByDistrictDto {
  country: string;
  district: string;
  count: number;
}

