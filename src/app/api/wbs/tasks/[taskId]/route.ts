import { NextResponse } from 'next/server';

const gone = () =>
  NextResponse.json(
    { success: false, message: 'WBS 기능은 서비스 개편으로 종료되었습니다.' },
    { status: 410 }
  );

export const PATCH = gone;
export const DELETE = gone;
