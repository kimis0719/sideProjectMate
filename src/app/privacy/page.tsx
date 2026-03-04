import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'Side Project Mate 개인정보처리방침',
};

// ─────────────────────────────────────────────────────────────────────────────
// 개인정보처리방침 — 초안 (법적 검토 필요)
//
// TODO 체크리스트 (법적 검토 시 반드시 확인):
//  [ ] 사업자등록번호 / 법인명 / 대표자 이름 기재
//  [ ] 개인정보 보호책임자 이름·연락처 기재
//  [ ] 실제 서버 소재지(국가) 확인 후 국외이전 조항 검토
//  [ ] 쿠키 정책 세부 내용 확인 (Google Analytics 등 추가 시 업데이트)
//  [ ] 보유 기간 법령 근거 조항 번호 확인
//  [ ] 소셜 로그인(Google, GitHub) 도입 전 해당 항목 활성화
//  [ ] 광고/수익화 도입 시 제3자 제공 및 위탁 항목 추가
//  [ ] 개인정보보호위원회 표준 양식 최신 버전과 대조
// ─────────────────────────────────────────────────────────────────────────────

const LAST_UPDATED = '2026년 3월 3일';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">개인정보처리방침</h1>
          <p className="text-sm text-muted-foreground">최종 업데이트: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-10 text-foreground">

          {/* 전문 */}
          <section>
            <p className="text-muted-foreground leading-relaxed">
              Side Project Mate(이하 &quot;회사&quot; 또는 &quot;서비스&quot;)는 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 및 관계 법령을 준수합니다.
              본 방침은 회사가 수집하는 개인정보의 항목, 수집 방법, 이용 목적, 보유 기간, 이용자의 권리, 그 밖의 개인정보 처리에 관한 사항을 안내합니다.
            </p>
          </section>

          {/* 1조 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제1조 수집하는 개인정보 항목</h2>
            <p className="text-muted-foreground mb-4">회사는 서비스 제공을 위해 다음과 같이 개인정보를 수집합니다.</p>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">1. 회원가입 시 (직접 수집)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-4 py-2 text-left font-medium">구분</th>
                        <th className="border border-border px-4 py-2 text-left font-medium">항목</th>
                        <th className="border border-border px-4 py-2 text-left font-medium">필수 여부</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr>
                        <td className="border border-border px-4 py-2">계정 정보</td>
                        <td className="border border-border px-4 py-2">이메일 주소, 비밀번호(암호화 저장)</td>
                        <td className="border border-border px-4 py-2">필수</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2">프로필 정보</td>
                        <td className="border border-border px-4 py-2">닉네임</td>
                        <td className="border border-border px-4 py-2">선택</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2">연락처</td>
                        <td className="border border-border px-4 py-2">휴대폰 번호</td>
                        <td className="border border-border px-4 py-2">선택</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">2. 소셜 로그인 시 (OAuth 제공자로부터 수집)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-4 py-2 text-left font-medium">제공자</th>
                        <th className="border border-border px-4 py-2 text-left font-medium">수집 항목</th>
                        <th className="border border-border px-4 py-2 text-left font-medium">필수 여부</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr>
                        <td className="border border-border px-4 py-2">GitHub OAuth</td>
                        <td className="border border-border px-4 py-2">이메일 주소, GitHub 사용자명(login), 프로필 이미지</td>
                        <td className="border border-border px-4 py-2">필수 (로그인 시)</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2">Google OAuth</td>
                        <td className="border border-border px-4 py-2">이메일 주소, Google 계정 이름, 프로필 이미지</td>
                        <td className="border border-border px-4 py-2">필수 (로그인 시)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  소셜 로그인 시 수집되는 정보는 해당 OAuth 제공자(GitHub, Google)의 개인정보처리방침에도 적용됩니다.
                  소셜 로그인을 통해 수집된 이메일이 기존 계정과 동일한 경우 자동으로 연결됩니다.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">3. 서비스 이용 중 (선택 입력)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-4 py-2 text-left font-medium">항목</th>
                        <th className="border border-border px-4 py-2 text-left font-medium">설명</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr>
                        <td className="border border-border px-4 py-2">프로필 이미지</td>
                        <td className="border border-border px-4 py-2">Cloudinary를 통해 업로드 및 저장</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2">직군·경력·소개</td>
                        <td className="border border-border px-4 py-2">팀 매칭 서비스 활용 목적</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2">GitHub 아이디</td>
                        <td className="border border-border px-4 py-2">GitHub 활동 지표 연동(공개 API 활용)</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2">Solved.ac 아이디</td>
                        <td className="border border-border px-4 py-2">알고리즘 티어 표시 목적</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2">블로그 URL, LinkedIn, 포트폴리오 링크</td>
                        <td className="border border-border px-4 py-2">공개 프로필 노출 목적</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2">기술 스택 태그</td>
                        <td className="border border-border px-4 py-2">팀 매칭 알고리즘 활용 목적</td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2">협업 가능 시간(가용 일정)</td>
                        <td className="border border-border px-4 py-2">팀 일정 매칭 목적</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">4. 서비스 이용 과정에서 자동 생성·수집</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                  <li>서비스 이용 기록 (접속 일시, 이용 기능)</li>
                  <li>접속 IP 주소</li>
                  <li>쿠키 (세션 관리, 인증 토큰)</li>
                  <li>기기 정보 (브라우저 종류, OS 유형) — 서버 로그 한정</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2조 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제2조 개인정보의 수집 방법</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
              <li>회원가입 및 프로필 입력 양식</li>
              <li>소셜 로그인(GitHub OAuth, Google OAuth) — 추후 제공 예정</li>
              <li>서비스 이용 중 자동 생성(쿠키, 서버 로그)</li>
              <li>외부 API 연동 시 이용자 동의 후 수집 (GitHub GraphQL API, Solved.ac API)</li>
            </ul>
          </section>

          {/* 3조 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제3조 개인정보의 이용 목적</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left font-medium">목적</th>
                    <th className="border border-border px-4 py-2 text-left font-medium">상세 내용</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="border border-border px-4 py-2">회원 관리</td>
                    <td className="border border-border px-4 py-2">본인 확인, 계정 유지 및 관리, 부정 이용 방지</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">서비스 제공</td>
                    <td className="border border-border px-4 py-2">팀 매칭, 프로젝트 협업 도구(칸반·WBS·채팅) 운영</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">공개 프로필 제공</td>
                    <td className="border border-border px-4 py-2">타 이용자에게 개발자 프로필·포트폴리오·기술 스택 공개</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">고지사항 전달</td>
                    <td className="border border-border px-4 py-2">서비스 변경, 약관 개정, 공지사항 안내</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">서비스 개선</td>
                    <td className="border border-border px-4 py-2">이용 통계 분석, 신규 기능 개발 기초 자료 활용</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4조 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제4조 개인정보의 보유 및 이용 기간</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              회사는 이용자의 개인정보를 수집 목적이 달성된 후 즉시 파기합니다. 단, 관계 법령에 의해 보존이 필요한 경우 아래 기간 동안 보관합니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left font-medium">구분</th>
                    <th className="border border-border px-4 py-2 text-left font-medium">보유 기간</th>
                    <th className="border border-border px-4 py-2 text-left font-medium">근거</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="border border-border px-4 py-2">회원 정보</td>
                    <td className="border border-border px-4 py-2">회원 탈퇴 시 즉시 삭제</td>
                    <td className="border border-border px-4 py-2">서비스 운영 목적 달성</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">전자상거래 관련 기록</td>
                    <td className="border border-border px-4 py-2">5년</td>
                    <td className="border border-border px-4 py-2">전자상거래법 제6조 — 추후 유료 기능 도입 시 적용</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">접속 로그</td>
                    <td className="border border-border px-4 py-2">3개월</td>
                    <td className="border border-border px-4 py-2">통신비밀보호법 제15조의2</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">소비자 불만·분쟁 기록</td>
                    <td className="border border-border px-4 py-2">3년</td>
                    <td className="border border-border px-4 py-2">전자상거래법 제6조</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5조 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제5조 개인정보의 제3자 제공</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 아래의 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 text-sm">
              <li>이용자가 직접 동의한 경우</li>
              <li>법령에 의한 수사기관의 적법한 요청이 있는 경우</li>
            </ul>
            <p className="text-muted-foreground mt-4 text-sm">
              공개 프로필(닉네임, 기술 스택, GitHub 아이디 등 이용자가 공개 설정한 정보)은 서비스 내 다른 이용자에게 표시될 수 있습니다.
            </p>
          </section>

          {/* 6조 — 수탁사 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제6조 개인정보 처리 위탁</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              회사는 서비스 운영을 위해 아래 업체에 개인정보 처리 업무를 위탁합니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left font-medium">수탁 업체</th>
                    <th className="border border-border px-4 py-2 text-left font-medium">위탁 업무</th>
                    <th className="border border-border px-4 py-2 text-left font-medium">보유 기간</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="border border-border px-4 py-2">MongoDB Atlas (MongoDB Inc.)</td>
                    <td className="border border-border px-4 py-2">데이터베이스 저장 및 관리</td>
                    <td className="border border-border px-4 py-2">회원 탈퇴 시까지</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">Cloudinary Ltd.</td>
                    <td className="border border-border px-4 py-2">프로필 이미지 등 미디어 파일 저장</td>
                    <td className="border border-border px-4 py-2">이미지 삭제 요청 시까지</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">Render.com (Render Services Inc.)</td>
                    <td className="border border-border px-4 py-2">서버 호스팅 및 운영</td>
                    <td className="border border-border px-4 py-2">서비스 종료 시까지</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">GitHub Inc.</td>
                    <td className="border border-border px-4 py-2">GitHub OAuth 인증 처리</td>
                    <td className="border border-border px-4 py-2">로그인 세션 종료 시</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">Google LLC</td>
                    <td className="border border-border px-4 py-2">Google OAuth 인증 처리</td>
                    <td className="border border-border px-4 py-2">로그인 세션 종료 시</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 7조 — 국외이전 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제7조 개인정보의 국외 이전</h2>
            <p className="text-muted-foreground text-sm">
              회사가 이용하는 MongoDB Atlas, Cloudinary, Render.com의 서버는 대한민국 외 국가에 위치할 수 있습니다.
              이용자는 서비스 가입 및 이용을 통해 본 방침에 명시된 국외 이전에 동의한 것으로 간주됩니다.
              {/* TODO: 각 수탁사의 실제 서버 소재 국가를 확인하고 구체적으로 기재하세요. */}
            </p>
          </section>

          {/* 8조 — 파기 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제8조 개인정보의 파기</h2>
            <p className="text-muted-foreground mb-3 text-sm">
              회원 탈퇴 시 또는 보유 기간 만료 시 아래 방법으로 개인정보를 파기합니다.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
              <li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
              <li>종이 출력물: 해당하는 경우 분쇄 또는 소각</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-sm">
              단, 법령에 의해 보존이 필요한 정보는 별도 데이터베이스에 분리 보관 후 해당 기간 경과 시 파기합니다.
            </p>
          </section>

          {/* 9조 — 쿠키 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제9조 쿠키의 사용</h2>
            <p className="text-muted-foreground mb-3 text-sm">
              회사는 세션 유지 및 로그인 상태 관리를 위해 쿠키(Cookie)를 사용합니다.
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><strong className="text-foreground">사용 목적:</strong> 로그인 세션 유지(JWT 기반), 사용자 설정 저장(다크/라이트 테마 등)</p>
              <p><strong className="text-foreground">거부 방법:</strong> 브라우저 설정에서 쿠키를 차단할 수 있으나, 이 경우 로그인이 필요한 서비스 이용이 제한될 수 있습니다.</p>
              {/* TODO: Google Analytics, AdSense 등 추가 시 해당 쿠키 목적과 거부 방법을 구체적으로 명시하세요. */}
            </div>
          </section>

          {/* 10조 — 이용자 권리 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제10조 이용자의 권리 및 행사 방법</h2>
            <p className="text-muted-foreground mb-3 text-sm">
              이용자는 언제든지 아래 권리를 행사할 수 있습니다.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 text-sm">
              <li>개인정보 열람 요청: 마이페이지 &gt; 내 정보에서 직접 확인</li>
              <li>개인정보 정정·수정: 마이페이지 &gt; 프로필 편집에서 직접 수정</li>
              <li>개인정보 삭제(회원 탈퇴): 마이페이지 &gt; 회원 탈퇴 — 탈퇴 즉시 개인정보 삭제 처리</li>
              <li>개인정보 처리 정지 요청: 아래 개인정보 보호책임자에게 이메일 문의</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-sm">
              만 14세 미만 아동의 회원가입은 허용하지 않습니다.
            </p>
          </section>

          {/* 11조 — 보호책임자 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제11조 개인정보 보호책임자</h2>
            {/* TODO: 실제 담당자 정보를 기재하세요 */}
            <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground space-y-1">
              <p><strong className="text-foreground">담당 부서:</strong> [담당 부서명 기재 필요]</p>
              <p><strong className="text-foreground">담당자 이름:</strong> [담당자 이름 기재 필요]</p>
              <p><strong className="text-foreground">이메일:</strong> contact@sideprojectmate.com</p>
              <p className="text-xs mt-2 text-muted-foreground">
                개인정보 침해 신고·상담은 개인정보보호위원회(privacy.go.kr, 국번 없이 182) 또는 한국인터넷진흥원(privacy.kisa.or.kr)에 문의하실 수 있습니다.
              </p>
            </div>
          </section>

          {/* 12조 — 변경 고지 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제12조 개인정보처리방침의 변경</h2>
            <p className="text-muted-foreground text-sm">
              본 방침이 변경될 경우 시행일 최소 7일 전에 서비스 공지사항 또는 이메일을 통해 고지합니다.
              중요한 변경(수집 항목 추가, 이용 목적 변경 등)은 30일 전에 고지합니다.
            </p>
          </section>

          {/* 시행일 */}
          <section className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              본 개인정보처리방침은 <strong>{LAST_UPDATED}</strong>부터 시행됩니다.
            </p>
            <div className="mt-4 flex gap-4 text-sm">
              <Link href="/terms" className="text-primary hover:underline">
                서비스 이용약관 보기
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
