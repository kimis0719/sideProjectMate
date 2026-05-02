# CLAUDE.md ??Side Project Mate

> AI ?먯씠?꾪듃 諛???먯쓣 ?꾪븳 **鍮좊Ⅸ 李몄“ 移대뱶**?낅땲??
> ?곸꽭 ?댁슜? `docs/` ?섏쐞 ?뚯씪???꾩슂???뚮쭔 ?쎌쑝?몄슂.

---

## ?꾨줈?앺듃 ?듭떖 ?뺣낫

- **?ㅽ깮**: Next.js 14 / TypeScript / MongoDB(Mongoose) / Zustand / Socket.io / Tailwind
- **?쒕쾭**: `server.ts` (Express + Socket.io) ?꾩뿉??Next.js App Router 援щ룞
- **諛고룷**: Render.com (`render.yaml`)
- **寃쎈줈 蹂꾩묶**: `@/` ??`src/` (??긽 `@/` ?ъ슜, ?곷?寃쎈줈 湲덉?)

---

## AI 而⑦뀓?ㅽ듃 濡쒕뵫 媛?대뱶

### ??긽 ?쎌쓣 寃?(紐⑤뱺 ?몄뀡 ?꾩닔)

1. `.workzones.yml` ??locked 援ъ뿭 ?뺤씤 (異⑸룎 諛⑹?)
2. `work-logs/` 理쒖떊 3媛??????理쒓렐 ?묒뾽 ?뚯븙

### ?묒뾽 ?좏삎蹂?異붽? 濡쒕뵫

| ?묒뾽             | ?쎌쓣 ?뚯씪                                        |
| ---------------- | ------------------------------------------------ |
| API ?묒뾽         | `src/app/api/MAP.md` ???대떦 ?꾨찓??`MAP.md`      |
| AI 湲곕뒫 ?묒뾽     | `src/app/api/ai/MAP.md`                          |
| 移몃컲 ?묒뾽        | `src/app/api/kanban/MAP.md` + `src/store/MAP.md` |
| ?꾨줈?앺듃 ?묒뾽    | `src/app/api/projects/MAP.md`                    |
| ?좎?/?꾨줈???묒뾽 | `src/app/api/users/MAP.md`                       |
| WBS ?묒뾽         | `src/app/api/wbs/MAP.md`                         |
| 梨꾪똿 ?묒뾽        | `src/app/api/chat/MAP.md`                        |
| 紐⑤뜽 ?묒뾽        | `src/lib/models/MAP.md`                          |
| ?ㅽ넗???묒뾽      | `src/store/MAP.md`                               |
| 而⑤깽???뺤씤      | `docs/conventions.md`                            |
| ?꾪궎?띿쿂 ?뺤씤    | `docs/architecture.md`                           |
| ?뚯뒪???묒꽦      | `docs/testing-guide.md`                          |

> ???뚯씪?ㅻ줈 ?遺遺꾩쓽 而⑦뀓?ㅽ듃媛 ?뺣낫?⑸땲??
> `DEV_ROADMAP.md`, `docs/plans/` ?깆? 湲고쉷 ?뺤씤 ?쒖뿉留??쎌쑝?몄슂.

---

## API Route ?꾩닔 ?⑦꽩

```ts
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// ?몃뱾?щ뒗 export ?섏? ?딄퀬, withApiLogging ?섑띁濡?媛먯떥??export
async function _GET(request: NextRequest) {
  await dbConnect();
  // ?몄쬆 ?꾩슂 ??
  const session = await getServerSession(authOptions);
  if (!session?.user?._id)
    return NextResponse.json({ success: false, message: '濡쒓렇?몄씠 ?꾩슂?⑸땲??' }, { status: 401 });
  // ?깃났 ?묐떟:
  return NextResponse.json({ success: true, data: { ... } });
  // ?ㅽ뙣 ?묐떟:
  return NextResponse.json({ success: false, message: '...' }, { status: 400 });
}

export const GET = withApiLogging(_GET, '/api/?꾨찓??寃쎈줈');
```

> **二쇱쓽**: Streaming ?묐떟(`Response` 諛섑솚)???ъ슜?섎뒗 API???섑띁 ?곸슜 遺덇? (?? `ai/generate-instruction`)

### ?깅뒫 愿???섍꼍蹂??

| ?섍꼍蹂??| 湲곕낯媛?| ?ㅻ챸 |
|---------|--------|------|
| `API_LOGGING` | ?쒖꽦??| `false`濡??ㅼ젙 ??API 濡쒓퉭/吏묎퀎 鍮꾪솢?깊솕 |
| `MONGODB_DEBUG` | 鍮꾪솢?깊솕 | `true`濡??ㅼ젙 ??Mongoose 荑쇰━ 濡쒓렇 異쒕젰 |

### ?깅뒫 紐⑤땲?곕쭅

- `/api/health` ???쒕쾭 媛???댄썑 ?꾩쟻??API ?묐떟?쒓컙 ?듦퀎 ?뺤씤
- 500ms 珥덇낵 API??`[SLOW API]` 濡쒓렇濡??먮룞 寃쎄퀬

---

## 肄붾뱶 ?앹꽦 泥댄겕由ъ뒪??

- [ ] `'use client'` ?좎뼵 (?대씪?댁뼵??而댄룷?뚰듃)
- [ ] API Route: `dynamic` + `dbConnect()` + ?몄쬆 泥댄겕 + `withApiLogging` ?섑띁
- [ ] API Route: ?쎄린 ?꾩슜 荑쇰━??`.lean()` ?ъ슜
- [ ] ?묐떟 ?뺤떇 `{ success, data | message }` ?듭씪
- [ ] Mongoose 紐⑤뜽 以묐났 ?깅줉 諛⑹? ?⑦꽩
- [ ] Zustand ?ㅽ넗?댁뿉 `devtools` 誘몃뱾?⑥뼱
- [ ] Socket `socket.off()` cleanup ?깅줉
- [ ] `@/` 寃쎈줈 蹂꾩묶 ?ъ슜 / `any` ???湲덉?

---

## ?뚯뒪??泥댄겕由ъ뒪??

- [ ] 肄붾뱶 異붽?/?섏젙 ??`*.test.ts` ?뚯씪 ?④퍡 ?앹꽦
- [ ] `npm run test:run` ?꾩껜 ?듦낵 ?뺤씤
- [ ] 湲곗〈 `src/__tests__/fixtures/` fixture ?ъ궗??
- [ ] ?곸꽭 ?⑦꽩: `docs/testing-guide.md`

---

## Git ?꾨왂

```
main ??諛고룷 (Render ?먮룞 諛고룷)
feature/* / fix/* /
```

---

## ?꾩옱 吏꾪뻾 以묒씤 ?묒뾽 ?꾪솴

| ?대떦 ?곸뿭                  | ?묒뾽??| ?곹깭    | ?묒뾽 ?댁슜 |
| -------------------------- | ------ | ------- | --------- |
| (현재 작업 중인 항목 없음) | — | 🟢 자유 | — |
