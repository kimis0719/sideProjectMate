# API Route 전체 맵

> 작업할 도메인의 하위 MAP.md를 읽으세요. 이 파일은 전체 개요용입니다.

| 도메인     | 경로                   | MAP.md                    |
| ---------- | ---------------------- | ------------------------- |
| 칸반       | `api/kanban/`          | `api/kanban/MAP.md`       |
| 프로젝트   | `api/projects/`        | `api/projects/MAP.md`     |
| 유저       | `api/users/`           | `api/users/MAP.md`        |
| WBS        | `api/wbs/`             | `api/wbs/MAP.md`          |
| 채팅       | `api/chat/`            | `api/chat/MAP.md`         |
| 인증       | `api/auth/`            | — next-auth 표준 처리     |
| 어드민     | `api/admin/`           | `api/admin/MAP.md`        |
| 알림       | `api/notifications/`   | GET 목록, PATCH 읽음 처리 |
| 지원서     | `api/applications/`    | GET/PATCH 지원서 관리     |
| 공통코드   | `api/common-codes/`    | GET 공통코드 목록         |
| 기술스택   | `api/tech-stacks/`     | GET 기술스택 목록         |
| 리뷰       | `api/reviews/`         | POST 리뷰, GET check      |
| Cloudinary | `api/cloudinary/sign/` | POST 업로드 서명 발급     |
| 유틸       | `api/utils/og/`        | GET OG 태그 파싱          |

## 공통 패턴 (모든 Route 적용)

```ts
export const dynamic = 'force-dynamic';
await dbConnect();
// 인증 필요 시:
const session = await getServerSession(authOptions);
if (!session?.user?._id) return NextResponse.json({ success: false }, { status: 401 });
```
