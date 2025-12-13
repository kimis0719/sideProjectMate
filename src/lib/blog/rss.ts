import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 5000,
  headers: {
    'User-Agent': 'SideProjectMate/1.0',
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
