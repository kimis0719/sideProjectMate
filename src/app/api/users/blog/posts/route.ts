import { NextRequest, NextResponse } from 'next/server';
import { getLatestBlogPosts, BlogPost } from '@/lib/blog/rss';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const blogUrl = searchParams.get('url');

  if (!blogUrl) {
    return NextResponse.json({ error: 'Blog URL is required' }, { status: 400 });
  }

  // Basic validation: must be a URL
  try {
    const url = new URL(blogUrl);
    // Auto-detect RSS URL for common platforms (Tistory/Velog)
    // If user enters 'https://velog.io/@username', we append '/rss'
    // If user enters 'https://username.tistory.com', we append '/rss'

    let rssUrl = url.href;
    if (url.hostname.includes('velog.io') && !url.pathname.endsWith('/rss')) {
      rssUrl = `${url.origin}${url.pathname}/rss`;
    } else if (url.hostname.includes('tistory.com') && !url.pathname.endsWith('/rss')) {
      rssUrl = `${url.origin}/rss`;
    }

    const posts = await getLatestBlogPosts(rssUrl);
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid URL or Failed to fetch feed' },
      { status: 400 }
    );
  }
}
