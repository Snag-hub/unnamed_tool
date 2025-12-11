import ogs from 'open-graph-scraper';
import nodeFetch from 'node-fetch';

interface Metadata {
  title?: string;
  description?: string;
  image?: string;
}

export async function getMetadata(url: string): Promise<Metadata> {
  try {
    const options = { url, fetch: nodeFetch as any };
    const { result } = await ogs(options);

    return {
      title: result.ogTitle,
      description: result.ogDescription,
      image: result.ogImage && result.ogImage.length > 0 ? result.ogImage[0].url : undefined,
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return {};
  }
}
