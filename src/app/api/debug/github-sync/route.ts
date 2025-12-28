import { NextRequest, NextResponse } from 'next/server';
import { fetchGitHubStats } from '@/lib/utils/github';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');
        const token = process.env.GITHUB_ACCESS_TOKEN;

        if (!username) {
            return NextResponse.json({ error: 'Username required' }, { status: 400 });
        }

        const stats = await fetchGitHubStats(username);

        if (!stats) {
            return NextResponse.json({
                success: false,
                message: 'Stats fetch returned null.',
                diagnostics: {
                    envTokenExists: !!token,
                    tokenPrefix: token ? token.substring(0, 4) + '...' : 'NONE',
                    username
                }
            });
        }

        // DB Update Simulation
        await dbConnect();
        const user = await User.findOne({
            $or: [
                { 'socialLinks.github': { $regex: username, $options: 'i' } }
            ]
        });

        let updateStatus = 'User not found in DB with this github link';
        if (user) {
            updateStatus = `User found: ${user.nName}. Would update stats.`;
        }

        return NextResponse.json({
            success: true,
            stats,
            updateStatus,
            diagnostics: {
                envTokenExists: !!token,
                tokenPrefix: token ? token.substring(0, 4) + '...' : 'NONE'
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
