import { DeviceType } from '../entities/visitor.entity';

/**
 * Detect device type from User-Agent string
 */
export function detectDeviceType(userAgent: string | undefined): DeviceType {
  if (!userAgent) {
    return DeviceType.UNKNOWN;
  }

  const ua = userAgent.toLowerCase();

  // Check for mobile devices
  const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile|mobile safari|windows phone/i;
  if (mobileRegex.test(ua)) {
    // Check if it's a tablet (larger mobile devices)
    const tabletRegex = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i;
    if (tabletRegex.test(ua)) {
      return DeviceType.TABLET;
    }
    return DeviceType.MOBILE;
  }

  // Check for tablets (standalone tablet user agents)
  const tabletRegex = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i;
  if (tabletRegex.test(ua)) {
    return DeviceType.TABLET;
  }

  // Default to computer for desktop browsers
  const desktopRegex = /windows|macintosh|linux|x11|unix/i;
  if (desktopRegex.test(ua)) {
    return DeviceType.COMPUTER;
  }

  return DeviceType.UNKNOWN;
}

