# Research Assistant Harness

학술 연구 보조 에이전트 팀 하네스.

## 구조

```
.claude/
├── agents/
│   ├── literature-searcher.md
│   ├── note-taker.md
│   ├── critic-synthesizer.md
│   ├── reference-manager.md
│   └── research-coordinator.md
├── skills/
│   ├── research-assistant/
│   │   └── skill.md              — 오케스트레이터
│   ├── systematic-review-protocol/
│   │   └── skill.md              — 체계적 문헌 고찰 (PRISMA, PICO, Boolean 검색)
│   └── citation-formatter/
│       └── skill.md              — 인용 형식 변환 (APA/MLA/Chicago, BibTeX)
└── CLAUDE.md                     — 이 파일
```

## 사용법

`/research-assistant` 스킬을 트리거하거나 자연어로 요청한다.
