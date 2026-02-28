import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://sideprojectmate.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/dashboard/',   // 대시보드는 인증 필요
                    '/mypage',
                    '/profile/edit',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
