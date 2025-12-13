# GitHub Copilot Instructions for sideProjectMate

## Updated Overview

This document provides essential guidance for AI coding agents to effectively navigate and contribute to the `sideProjectMate` codebase. Understanding the architecture, workflows, and conventions is crucial for productivity.

## 아키텍처
- **주요 구성 요소**: 이 프로젝트는 모듈형 구성 요소와 API 경로에 중점을 둔 Next.js 애플리케이션으로 구성되어 있습니다. 주요 디렉토리는 다음과 같습니다:
  - `src/app`: 페이지 및 API 경로를 포함한 주요 애플리케이션 논리를 포함합니다.
  - `src/components`: 재사용 가능한 UI 구성 요소를 포함합니다.
  - `lib`: 유틸리티 함수 및 데이터베이스 연결을 포함합니다.

- **Service Boundaries**: Each API route in `src/app/api` serves a specific purpose, such as user authentication, project management, and notifications. Understanding these boundaries helps in maintaining clean service interactions.

- **데이터 흐름**: 데이터는 주로 API 호출을 통해 관리되며, 상태 관리는 `store` 디렉토리에서 처리됩니다. 구성 요소와 API 경로 간의 데이터 흐름에 대한 친숙함은 디버깅 및 기능 개발에 필수적입니다.

## 개발자 워크플로우
- **빌드 및 실행**: 다음 명령어를 사용하여 개발 서버를 시작합니다:
  ```bash
  npm run dev
  ```

- **테스트**: 다음을 사용하여 테스트를 실행해야 합니다:
  ```bash
  npm test
  ```
  이 명령은 프로젝트에 정의된 모든 테스트를 실행합니다.

- **디버깅**: VS Code의 내장 디버깅 도구를 활용합니다. 특히 API 관련 문제에 대해 `src/app/api`의 관련 파일에 중단점을 설정합니다.

## 프로젝트 특정 규칙
- **파일 명명**: 구성 요소 파일에는 camelCase를 따르고 React 구성 요소에는 PascalCase를 따릅니다. 예를 들어, 구성 요소의 경우 `UserProfile.tsx` 및 서비스 파일의 경우 `userService.ts`입니다.

- **상태 관리**: 이 프로젝트는 중앙 집중식 저장소 패턴을 사용합니다. 상태 관리 관행의 예는 `store/notificationStore.ts` 및 `store/wbsStore.ts`를 참조하십시오.

## 통합 지점
- **외부 종속성**: 이 프로젝트는 Next.js, Tailwind CSS 및 MongoDB를 포함한 여러 주요 라이브러리에 의존합니다. 전체 종속성 목록은 `package.json`을 확인하십시오.

- **구성 요소 간 통신**: 구성 요소는 props 및 context를 통해 통신합니다. context 사용의 예는 `components/AuthSessionProvider.tsx`를 검토하십시오.

- **답변언어**: 이후 모든 대답은 한국어로 통일하여 작성

## Conclusion
This document serves as a foundational guide for AI agents working within the `sideProjectMate` codebase. For further details, refer to the specific files mentioned above and maintain adherence to the outlined conventions and workflows.