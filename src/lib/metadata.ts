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

export async function getMetadata(url: string): Promise<Metadata> {
  try {
    const options = { url, fetch: nodeFetch as any };
    const { result } = await ogs(options);

    // Determine type
    let type: Metadata['type'] = 'other';
    if (result.ogType?.includes('video') || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
      type = 'video';
    } else if (result.ogType?.includes('article')) {
      type = 'article';
    } else if (url.includes('twitter.com') || url.includes('x.com') || url.includes('reddit.com')) {
      type = 'social';
    }

    // Get favicon (using Google's service as reliable fallback)
    const domain = new URL(url).hostname;
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    return {
      title: result.ogTitle || result.twitterTitle,
      description: result.ogDescription || result.twitterDescription,
      image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url,
      siteName: result.ogSiteName || domain,
      favicon,
      author: result.author, // ogs might not catch all authors, but it's a start
      type,
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    // Return basic info if scraping fails
    try {
      const domain = new URL(url).hostname;
      return {
        siteName: domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        type: 'other'
      };
    } catch {
      return { type: 'other' };
    }
  }
}
