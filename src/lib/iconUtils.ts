export const getIconSlug = (name: string): string => {
    const lower = name.toLowerCase();
    const map: Record<string, string> = {
        'c++': 'cpp',
        'c#': 'cs',
        'vue.js': 'vue',
        'next.js': 'nextjs',
        'nextjs': 'nextjs',
        'nuxt.js': 'nuxtjs',
        'react native': 'react',
        'styled components': 'styledcomponents',
        'spring boot': 'spring',
        'express.js': 'express',
        'three.js': 'threejs',
        'socket.io': 'nodejs', // 아이콘 없음, nodejs로 대체
        'node.js': 'nodejs',
        'html5': 'html',
        'css3': 'css',
        'tailwindcss': 'tailwind',
        'tailwind css': 'tailwind',
        'postgres': 'postgresql',
        'postgresql': 'postgresql', // Self mapping for safety
        'psql': 'postgresql',
        'mongo': 'mongodb',
        'mongoose': 'mongodb',
        'express': 'express',
        'nest.js': 'nestjs',
        'nest': 'nestjs',
        'mysql2': 'mysql',
        'mariadb': 'mysql', // MariaDB -> MySQL (비슷하므로)
        'sqlite3': 'sqlite',
        'firebase-admin': 'firebase',
        'react-router': 'react', // React 생태계
        'react-router-dom': 'react',
        'redux-toolkit': 'redux',
        'rtk': 'redux',
        'jq': 'jquery',
        'scss': 'sass',
        'material-ui': 'materialui',
        'mui': 'materialui',
        'vuetify': 'vuetify',
        'aws-sdk': 'aws',
        'gcp': 'gcp',
        'google cloud': 'gcp',
        'k8s': 'kubernetes',
        'story': 'storybook',
    };
    return map[lower] || lower.replace(/[\s\.]/g, '');
};

export type SkillCategory = 'Languages' | 'Map' | 'Frameworks & Libs' | 'Tools & Infra' | 'Database' | 'Other';

export const getSkillCategory = (name: string): SkillCategory => {
    const lower = name.toLowerCase().replace(/[\s\.]/g, '');

    const languages = ['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'cs', 'c#', 'go', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css', 'scss', 'sass'];
    const frameworks = ['react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxtjs', 'gatsby', 'astro', 'spring', 'springboot', 'django', 'flask', 'fastapi', 'express', 'nestjs', 'rails', 'flutter', 'reactnative', 'threejs', 'styledcomponents', 'tailwind', 'tailwindcss', 'redux', 'mobx', 'zustand', 'jquery'];
    const tools = ['git', 'github', 'gitlab', 'docker', 'kubernetes', 'jenkins', 'aws', 'gcp', 'azure', 'vercel', 'netlify', 'heroku', 'linux', 'bash', 'vim', 'vscode', 'webpack', 'vite', 'babel', 'eslint', 'prettier', 'jest', 'cypress', 'storybook', 'figma', 'notion', 'slack', 'jira'];
    const databases = ['mysql', 'mariadb', 'postgres', 'postgresql', 'sqlite', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'firebase', 'supabase', 'prisma', 'graphql'];

    if (languages.includes(lower)) return 'Languages';
    if (frameworks.includes(lower)) return 'Frameworks & Libs';
    if (tools.includes(lower)) return 'Tools & Infra';
    if (databases.includes(lower)) return 'Database';

    return 'Other';
};

export const CATEGORY_ORDER: SkillCategory[] = [
    'Languages',
    'Frameworks & Libs',
    'Database',
    'Tools & Infra',
    'Other'
];
