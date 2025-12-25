import ogs from 'open-graph-scraper';
import nodeFetch from 'node-fetch';

export interface Metadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  author?: string;
  type?: 'article' | 'video' | 'social' | 'other';
  duration?: number;
}

// Placeholder image for failed fetches
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/1200x630/e4e4e7/71717a?text=No+Preview';

// Validate URL before fetching
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // Only allow http and https protocols
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Sleep utility for retry backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getMetadata(url: string): Promise<Metadata> {
  // Validate URL first
  if (!isValidUrl(url)) {
    console.error(`Invalid URL provided: ${url}`);
    return {
      title: 'Invalid URL',
      description: 'The provided URL is not valid',
      type: 'other',
      image: PLACEHOLDER_IMAGE,
    };
  }

  const timeoutMs = 5000; // 5 second timeout
  const maxRetries = 2;
  let lastError: any = null;

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Custom fetch wrapper with timeout and user-agent
      const customFetch = async (input: any) => {
        return nodeFetch(input, {
          signal: controller.signal as any,
          headers: {
            'User-Agent': 'DayOS-Bot/1.0 (+https://dayos.app)',
          }
        });
      };

      const options = { url, fetch: customFetch as any };
      const { result } = await ogs(options);
      clearTimeout(timeoutId);

      // Determine type
      let type: Metadata['type'] = 'other';
      if (result.ogType?.includes('video') || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
        type = 'video';
      } else if (result.ogType?.includes('article')) {
        type = 'article';
      } else if (url.includes('twitter.com') || url.includes('x.com') || url.includes('reddit.com')) {
        type = 'social';
      }

      // Get favicon and domain
      let domain = '';
      try {
        domain = new URL(url).hostname;
      } catch {
        domain = 'unknown';
      }

      const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

      // Use placeholder if no image found
      const image = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || PLACEHOLDER_IMAGE;

      return {
        title: result.ogTitle || result.twitterTitle || 'Untitled Link',
        description: result.ogDescription || result.twitterDescription,
        image,
        siteName: result.ogSiteName || domain,
        favicon,
        author: result.author,
        type,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      // Log the attempt
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Metadata fetch attempt ${attempt + 1}/${maxRetries + 1} failed for ${url}:`, errorMessage);

      // If this isn't the last attempt, wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s
        console.log(`Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
      }
    }
  }

  // All retries failed - return safe fallback
  console.error(`All metadata fetch attempts failed for ${url}. Last error:`, lastError);

  try {
    const u = new URL(url);
    return {
      title: 'Untitled Link',
      description: 'Could not fetch metadata for this link',
      siteName: u.hostname,
      favicon: `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=128`,
      image: PLACEHOLDER_IMAGE,
      type: 'other'
    };
  } catch {
    // If even URL parsing fails, return bare minimum
    return {
      title: 'Invalid Link',
      description: 'The provided URL could not be processed',
      image: PLACEHOLDER_IMAGE,
      type: 'other'
    };
  }
}
