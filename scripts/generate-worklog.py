import urllib.request
import json
import os
import sys
import datetime

api_key = os.environ['ANTHROPIC_API_KEY']
actor = os.environ['GITHUB_ACTOR']
branch = os.environ['GITHUB_REF_NAME'].replace('/', '-')
sha = os.environ['GITHUB_SHA'][:7]
changed = os.environ['CHANGED_FILES']
stat = os.environ['DIFF_STAT']

prompt = f"""아래 git 변경사항을 분석해서 work-log를 작성해줘. 간결하게 작성할 것.

변경된 파일:
{changed}

변경 통계: {stat}

다음 형식으로만 출력 (다른 말 없이):

## 작업 요약
(한 줄 요약)

## 변경된 파일
- `파일경로` — 변경 내용 (각 파일마다 한 줄)

## 미완성 / 다음 세션에서 이어받을 부분
없음 (또는 내용)

## 건드리면 안 되는 부분
없음 (또는 내용)"""

payload = json.dumps({
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 400,
    "messages": [{"role": "user", "content": prompt}]
}).encode('utf-8')

req = urllib.request.Request(
    'https://api.anthropic.com/v1/messages',
    data=payload,
    headers={
        'x-api-key': api_key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
    }
)

try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        content = result['content'][0]['text']
except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"❌ Anthropic API 오류 {e.code}: {error_body}", file=sys.stderr)
    sys.exit(1)

date = datetime.date.today().strftime('%Y-%m-%d')
filename = f"work-logs/{date}-{actor}-{sha}.md"

header = f"## {date} — {actor} ({branch}) `{sha}`\n> 모델: claude-haiku-4-5 (자동생성)\n\n"

os.makedirs('work-logs', exist_ok=True)
with open(filename, 'w', encoding='utf-8') as f:
    f.write(header + content + '\n')

print(f"✅ Work log 생성 완료: {filename}")
