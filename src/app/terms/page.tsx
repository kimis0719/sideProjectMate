import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '서비스 이용약관',
  description: 'Side Project Mate 서비스 이용약관',
};

// ─────────────────────────────────────────────────────────────────────────────
// 서비스 이용약관 — 초안 (법적 검토 필요)
//
// TODO 체크리스트 (법적 검토 시 반드시 확인):
//  [ ] 사업자 정보(상호, 주소, 대표자, 사업자등록번호) 기재
//  [ ] 준거법 및 관할 법원 확정 (현재: 대한민국법, 서울중앙지방법원)
//  [ ] 유료 서비스(Freemium) 도입 시 요금, 환불 정책 조항 추가
//  [ ] 광고 도입 시 광고 관련 조항 추가
//  [ ] 소셜 로그인 도입 시 제3자 계정 관련 조항 검토
//  [ ] 만 14세 미만 이용 제한 고지 방식 확인
//  [ ] 지식재산권 조항 구체화 (이용자 콘텐츠 라이선스 범위)
// ─────────────────────────────────────────────────────────────────────────────

const LAST_UPDATED = '2026년 3월 3일';

export default function TermsPage() {
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">서비스 이용약관</h1>
          <p className="text-sm text-muted-foreground">최종 업데이트: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-10 text-foreground">
          {/* 전문 */}
          <section>
            <p className="text-muted-foreground leading-relaxed text-sm">
              본 약관은 Side Project Mate(이하 &quot;회사&quot;)가 제공하는 웹 서비스(이하
              &quot;서비스&quot;)의 이용 조건, 이용자와 회사의 권리·의무 및 책임 사항을 규정합니다.
              서비스에 가입하거나 이용함으로써 본 약관에 동의한 것으로 간주됩니다.
            </p>
          </section>

          {/* 제1조 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제1조 목적</h2>
            <p className="text-muted-foreground text-sm">
              본 약관은 회사가 운영하는 Side Project Mate 서비스의 이용과 관련하여 회사와 이용자의
              권리, 의무 및 책임 사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 — 정의 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제2조 용어 정의</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">서비스:</strong> 회사가 제공하는 사이드 프로젝트
                팀 매칭 및 협업 플랫폼 일체 (PC, 모바일 브라우저 포함)
              </li>
              <li>
                <strong className="text-foreground">이용자:</strong> 본 약관에 동의하고 회원가입을
                완료하여 서비스를 이용하는 자
              </li>
              <li>
                <strong className="text-foreground">회원:</strong> 이용자와 동일한 의미로 사용
              </li>
              <li>
                <strong className="text-foreground">콘텐츠:</strong> 이용자가 서비스 내에
                게시·등록하는 프로젝트 정보, 프로필, 메시지, 지원서, 칸반 노트, 일정 정보 등 모든
                데이터
              </li>
              <li>
                <strong className="text-foreground">계정:</strong> 이메일 주소와 비밀번호 또는 소셜
                로그인 정보의 조합으로 식별되는 이용자 접근 권한
              </li>
            </ul>
          </section>

          {/* 제3조 — 약관 게시 및 효력 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              제3조 약관의 게시 및 변경
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>회사는 본 약관을 서비스 내 별도 페이지(/terms)에 게시합니다.</li>
              <li>
                회사는 약관을 변경할 경우 시행일 최소 7일 전 서비스 공지사항 또는 이메일을 통해
                고지합니다. 이용자에게 불리한 변경은 30일 전 고지합니다.
              </li>
              <li>
                이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 요청할
                수 있습니다. 변경 약관 시행 후 서비스를 계속 이용하면 변경에 동의한 것으로
                간주됩니다.
              </li>
            </ol>
          </section>

          {/* 제4조 — 서비스 이용계약 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              제4조 서비스 이용계약 체결
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                이용계약은 이용자가 회원가입 시 본 약관과 개인정보처리방침에 동의하고 가입 신청 후,
                회사가 이를 승낙함으로써 성립됩니다.
              </li>
              <li>
                회사는 아래에 해당하는 경우 가입 신청을 거부하거나 이용을 제한할 수 있습니다.
                <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                  <li>실명 또는 타인 정보를 도용한 경우</li>
                  <li>만 14세 미만인 경우</li>
                  <li>이전에 서비스 이용이 정지·탈퇴된 이용자가 재가입을 시도하는 경우</li>
                  <li>기타 회사가 정한 이용 조건을 충족하지 않는 경우</li>
                </ul>
              </li>
              <li>
                소셜 로그인(GitHub, Google)을 통해 가입하는 경우에도 본 약관이 동일하게 적용됩니다.
              </li>
            </ol>
          </section>

          {/* 제5조 — 서비스 내용 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제5조 서비스의 내용</h2>
            <p className="text-muted-foreground mb-3 text-sm">
              회사는 아래 서비스를 제공합니다. 서비스 내용은 회사의 정책에 따라 변경될 수 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>사이드 프로젝트 등록 및 팀원 모집</li>
              <li>개발자 프로필 및 포트폴리오 공개</li>
              <li>팀 매칭 (지원, 수락/거절)</li>
              <li>협업 도구: 칸반 보드, WBS 간트 차트, 실시간 채팅</li>
              <li>GitHub, Solved.ac, 블로그 RSS 연동</li>
              <li>기타 회사가 추가 개발하는 기능</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-sm">
              서비스는 연중무휴 제공을 원칙으로 하나, 시스템 점검, 장애 또는 운영상 필요에 의해 일시
              중단될 수 있습니다. 이 경우 사전 또는 사후 공지합니다.
            </p>
          </section>

          {/* 제6조 — 이용자 의무 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제6조 이용자의 의무</h2>
            <p className="text-muted-foreground mb-3 text-sm">
              이용자는 아래 행위를 해서는 안 됩니다.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>타인의 계정, 이메일, 개인정보를 도용하거나 사칭하는 행위</li>
              <li>허위 정보를 등록하거나 서비스를 기만하는 행위</li>
              <li>
                서비스 운영을 방해하거나 시스템에 비정상적인 부하를 주는 행위 (크롤링, DDoS 등)
              </li>
              <li>다른 이용자를 희롱, 위협, 차별하거나 불쾌감을 주는 콘텐츠를 게시하는 행위</li>
              <li>음란물, 폭력적 콘텐츠, 불법 저작물을 게시하거나 유포하는 행위</li>
              <li>스팸성 모집 공고, 광고, 홍보를 무단으로 게시하는 행위</li>
              <li>
                회사의 사전 동의 없이 서비스를 영리 목적으로 이용하거나 제3자에게 재판매하는 행위
              </li>
              <li>관계 법령을 위반하는 행위</li>
            </ol>
            <p className="text-muted-foreground mt-3 text-sm">
              위 행위를 적발한 경우 회사는 사전 통지 없이 해당 콘텐츠를 삭제하거나 계정을 정지·탈퇴
              처리할 수 있습니다.
            </p>
          </section>

          {/* 제7조 — 회사 의무 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제7조 회사의 의무</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>회사는 지속적이고 안정적인 서비스를 제공하기 위해 최선을 다합니다.</li>
              <li>회사는 이용자의 개인정보를 개인정보처리방침에 따라 안전하게 관리합니다.</li>
              <li>회사는 이용자로부터 접수된 문의 및 불만을 신속하게 처리합니다.</li>
              <li>
                회사는 서비스 개선을 위해 수집된 데이터를 익명화하여 통계·분석 목적으로 활용할 수
                있습니다.
              </li>
            </ol>
          </section>

          {/* 제8조 — 계정 관리 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제8조 계정 관리</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>이용자는 자신의 계정 정보 관리에 책임을 집니다.</li>
              <li>이용자는 계정 정보를 타인에게 공유하거나 양도할 수 없습니다.</li>
              <li>계정 도용 또는 무단 사용이 의심되는 경우 즉시 회사에 신고해야 합니다.</li>
              <li>
                장기간(12개월 이상) 미로그인 계정은 안전한 서비스 운영을 위해 휴면 처리될 수 있으며,
                사전에 이메일로 안내합니다.
              </li>
            </ol>
          </section>

          {/* 제9조 — 콘텐츠 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제9조 콘텐츠에 관한 권리</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>이용자가 서비스에 게시한 콘텐츠에 대한 저작권은 이용자에게 있습니다.</li>
              <li>
                이용자는 회사에 대해 서비스 제공·운영·개선 및 홍보 목적으로 해당 콘텐츠를 무상으로
                이용(복제, 전송, 수정, 편집, 전시)할 수 있는 비독점적 라이선스를 부여합니다.
              </li>
              <li>
                회원 탈퇴 시 이용자가 직접 게시한 콘텐츠는 삭제됩니다. 단, 다른 이용자의
                콘텐츠(채팅, 프로젝트 내 공동 작업물 등)와 결합된 경우 서비스 운영상 필요에 따라
                일정 기간 유지될 수 있습니다.
                {/* TODO: 구체적인 데이터 보유 정책 확정 후 갱신 필요 */}
              </li>
            </ol>
          </section>

          {/* 제10조 — 회원 탈퇴 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              제10조 회원 탈퇴 및 계정 해지
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>이용자는 언제든지 서비스 내 탈퇴 기능을 통해 탈퇴할 수 있습니다.</li>
              <li>
                탈퇴 시 개인정보처리방침에 따라 개인정보가 삭제됩니다. 단, 법령에 따라 일정 기간
                보관이 필요한 정보는 예외입니다.
              </li>
              <li>
                회사는 이용자가 제6조에 명시된 금지 행위를 한 경우, 사전 통지 후 또는 긴급한 경우
                사전 통지 없이 계정을 정지하거나 해지할 수 있습니다.
              </li>
            </ol>
          </section>

          {/* 제11조 — 책임 제한 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제11조 책임의 제한</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                회사는 천재지변, 불가항력, 제3자 인프라(서버, 네트워크) 장애로 인한 서비스 중단에
                대해 책임을 지지 않습니다.
              </li>
              <li>
                회사는 이용자 간 분쟁, 팀 매칭 결과, 프로젝트의 성패에 대해 책임을 지지 않습니다.
              </li>
              <li>
                회사는 이용자가 서비스 내에 게시한 콘텐츠의 정확성, 신뢰성에 대해 보증하지 않습니다.
              </li>
              <li>
                외부 링크(GitHub, Solved.ac, 블로그 등)를 통해 접속하는 제3자 사이트에 대한 책임은
                해당 사이트 운영자에게 있습니다.
              </li>
              <li>
                법령상 허용되는 범위 내에서, 회사의 서비스는 &quot;있는 그대로(AS IS)&quot; 제공되며
                특정 목적 적합성을 보증하지 않습니다.
              </li>
            </ol>
          </section>

          {/* 제12조 — 분쟁 해결 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              제12조 분쟁 해결 및 준거법
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>본 약관과 서비스 이용과 관련한 분쟁은 대한민국 법률을 준거법으로 합니다.</li>
              <li>
                서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 상호 협의를 통해 해결하는
                것을 원칙으로 합니다.
              </li>
              <li>
                협의가 이루어지지 않을 경우 「소비자기본법」에 따른 소비자분쟁조정위원회에 조정을
                신청할 수 있습니다.
              </li>
              <li>
                소송이 필요한 경우 서울중앙지방법원을 전속 관할 법원으로 합니다.
                {/* TODO: 법인 소재지에 따라 관할 법원을 변경하세요 */}
              </li>
            </ol>
          </section>

          {/* 제13조 — 광고 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제13조 광고</h2>
            <p className="text-muted-foreground text-sm">
              회사는 서비스 운영을 위해 서비스 내 광고를 게재할 수 있습니다. 이용자는 서비스 이용 중
              광고에 노출될 수 있음에 동의합니다. 광고 콘텐츠는 제3자가 제공하며, 회사는 광고 내용의
              정확성 및 신뢰성에 대해 책임을 지지 않습니다.
              {/* TODO: 광고 도입 시 구체적인 광고 유형 및 데이터 활용 방침을 추가하세요. 현재는 광고 미도입 상태입니다. */}
            </p>
          </section>

          {/* 시행일 */}
          <section className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              본 약관은 <strong>{LAST_UPDATED}</strong>부터 시행됩니다.
            </p>
            <div className="mt-4 flex gap-4 text-sm">
              <Link href="/privacy" className="text-primary hover:underline">
                개인정보처리방침 보기
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
