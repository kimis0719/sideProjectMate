import type { Metadata } from 'next';

interface Props {
    params: { pid: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/projects/${params.pid}`, {
            next: { revalidate: 60 },
        });
        const data = await res.json();

        if (!data.success || !data.data) {
            return { title: '프로젝트' };
        }

        const project = data.data;
        return {
            title: project.title,
            description: project.content?.slice(0, 120) || `${project.title} 프로젝트 상세 페이지`,
            openGraph: {
                title: project.title,
                description: project.content?.slice(0, 120),
                type: 'article',
            },
        };
    } catch {
        return { title: '프로젝트' };
    }
}

export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
