import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
  },
});

export interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  thumbnail?: string;
}

export async function getLatestBlogPosts(rssUrl: string): Promise<BlogPost[]> {
  try {
    const feed = await parser.parseURL(rssUrl);

    return feed.items.slice(0, 3).map((item) => {
      // Tistory/Velog thumbnail extraction logic if needed
      // Currently rss-parser might not extract thumbnails well from standard RSS
      // We can add custom parsing here if specific platforms are targeted

      return {
        title: item.title || 'Untitled',
        link: item.link || '#',
        pubDate: item.pubDate || new Date().toISOString(),
        contentSnippet: item.contentSnippet?.slice(0, 100) + '...',
      };
    });
  } catch (error) {
    console.error(`Failed to parse RSS from ${rssUrl}:`, error);
    return [];
  }
}
