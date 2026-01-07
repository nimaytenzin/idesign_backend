import { ReferrerSource } from '../entities/visitor.entity';

/**
 * Parse and categorize referrer URL into source type
 */
export function parseReferrerSource(referrer: string | undefined): {
  referrer: string | null;
  referrerSource: ReferrerSource;
} {
  if (!referrer || referrer.trim() === '') {
    return {
      referrer: null,
      referrerSource: ReferrerSource.DIRECT,
    };
  }

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();

    // Search engines
    const searchEngines = [
      'google.com',
      'google.bt',
      'bing.com',
      'yahoo.com',
      'yandex.com',
      'duckduckgo.com',
      'baidu.com',
      'search.yahoo.com',
      'search.google.com',
    ];

    for (const engine of searchEngines) {
      if (hostname.includes(engine)) {
        return {
          referrer,
          referrerSource: ReferrerSource.SEARCH_ENGINE,
        };
      }
    }

    // Social media platforms
    const socialMedia = [
      'facebook.com',
      'instagram.com',
      'twitter.com',
      'x.com',
      'linkedin.com',
      'pinterest.com',
      'tiktok.com',
      'youtube.com',
      'whatsapp.com',
      'telegram.org',
      'reddit.com',
      'snapchat.com',
    ];

    for (const social of socialMedia) {
      if (hostname.includes(social)) {
        return {
          referrer,
          referrerSource: ReferrerSource.SOCIAL_MEDIA,
        };
      }
    }

    // If it's from the same domain, treat as direct/internal
    // This would need to be configured based on your domain
    // For now, treat as OTHER

    return {
      referrer,
      referrerSource: ReferrerSource.OTHER,
    };
  } catch (error) {
    // Invalid URL format
    return {
      referrer,
      referrerSource: ReferrerSource.UNKNOWN,
    };
  }
}

