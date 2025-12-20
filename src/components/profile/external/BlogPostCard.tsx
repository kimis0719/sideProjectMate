'use client';

import React, { useEffect, useState } from 'react';
import { BlogPost } from '@/lib/blog/rss';

interface BlogPostCardProps {
    blogUrl?: string; // e.g., https://velog.io/@username
}

export default function BlogPostCard({ blogUrl }: BlogPostCardProps) {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPosts = async () => {
            if (!blogUrl) return;

            setLoading(true);
            try {
                const res = await fetch(`/api/users/blog/posts?url=${encodeURIComponent(blogUrl)}`);
                if (!res.ok) throw new Error('Failed to load blog posts');
                const data = await res.json();
                setPosts(data);
            } catch (err) {
                console.error(err);
                setError('최신 글을 불러올 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (blogUrl) {
            fetchPosts();
        }
    }, [blogUrl]);

    if (!blogUrl) return null;

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <span className="text-2xl">✍️</span>
                    Tech Blog
                </h2>
                <a
                    href={blogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    블로그 방문 &rarr;
                </a>
            </div>

            {loading && (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-muted rounded-lg"></div>
                    ))}
                </div>
            )}

            {error && <div className="text-sm text-destructive text-center py-4">{error}</div>}

            {!loading && !error && (
                <div className="space-y-4">
                    {posts.map((post, index) => (
                        <a
                            key={index}
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                        >
                            <div className="bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all rounded-xl p-4">
                                <h3 className="font-semibold text-foreground group-hover:text-primary line-clamp-1 mb-1">
                                    {post.title}
                                </h3>
                                <div className="text-xs text-muted-foreground mb-2">
                                    {new Date(post.pubDate).toLocaleDateString()}
                                </div>
                                {post.contentSnippet && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {post.contentSnippet}
                                    </p>
                                )}
                            </div>
                        </a>
                    ))}
                    {posts.length === 0 && (
                        <div className="text-center text-muted-foreground py-4 text-sm">최신 글이 없습니다.</div>
                    )}
                </div>
            )}
        </div>
    );
}
