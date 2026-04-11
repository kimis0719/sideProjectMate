---
name: anti-bot-analyzer
description: "A skill for analyzing website anti-bot defense mechanisms and developing legitimate evasion strategies. Use for requests like 'analyze anti-bot defenses', 'bot blocking bypass', 'Cloudflare response', 'CAPTCHA detection', 'rate limit check', etc. Note: developing illegal bypass tools, CAPTCHA auto-solving services, and privacy-violating scraping are outside the scope of this skill."
---

# Anti-Bot Analyzer — Anti-Bot Defense Analysis + Legitimate Response

A skill that enhances target-analyst's and crawler-developer's anti-bot analysis capabilities.

## Target Agents

- **target-analyst** — Pre-assesses the defense level of target sites
- **crawler-developer** — Develops legitimate crawler strategies based on analysis results

## Anti-Bot Defense Layer Classification

### Level 1: Basic Defense (Difficulty: Low)
| Defense | Detection Method | Response Strategy |
|---------|-----------------|-------------------|
| robots.txt | `GET /robots.txt` | Comply with rules (Crawl-delay, Disallow) |
| User-Agent filter | 403/429 response | Set real browser UA header |
| Referer check | Blocked on empty Referer | Set appropriate Referer header |
| IP Rate Limit | 429 on rapid requests | `time.sleep()` + random delay |

### Level 2: Intermediate Defense (Difficulty: Medium)
| Defense | Detection Method | Response Strategy |
|---------|-----------------|-------------------|
| Cookie-based sessions | Set-Cookie tracking | Maintain `requests.Session()` |
| JavaScript rendering required | Empty HTML body | Use Playwright/Puppeteer |
| Dynamic tokens (CSRF) | Hidden input | Extract token and include in request |
| API authentication | 401 response | Analyze public API keys |

### Level 3: Advanced Defense (Difficulty: High)
| Defense | Detection Method | Response Strategy |
|---------|-----------------|-------------------|
| Cloudflare | `cf-` cookies, challenge page | Explore legitimate API alternatives |
| Akamai Bot Manager | `_abck` cookie | Explore official API/RSS alternatives |
| Browser fingerprinting | navigator/WebGL checks | Stealth plugins |
| reCAPTCHA/hCaptcha | `g-recaptcha` DOM | Use API alternatives |
| TLS fingerprinting (JA3) | Non-standard TLS blocked | curl_cffi |

## Automated Defense Level Detection Flow

```
1. HTTP request (no UA)
   ├── 200 OK -> Level 0 (no defense)
   └── 403/503 -> UA filter suspected

2. HTTP request (Chrome UA)
   ├── 200 + data -> Level 1
   ├── 200 + empty body -> JS rendering required (Level 2)
   └── 403/503 -> Level 2+

3. Response header analysis
   ├── server: cloudflare -> Cloudflare
   ├── x-akamai-* -> Akamai
   └── set-cookie: __cf_bm -> CF Bot Management

4. HTML analysis
   ├── <script src="captcha"> -> CAPTCHA
   └── API endpoint discovery (XHR/fetch)

5. Final: Level 0-3 + defense list output
```

## Rate Limit Design Formula

```python
base_delay = max(robots_crawl_delay, response_time * 5, 1.0)
actual_delay = base_delay + random.uniform(0, base_delay * 0.5)

# Exponential backoff on 429
backoff_delay = base_delay * (2 ** retry_count)
max_backoff = 300  # Maximum 5 minutes

# Business hours consideration
if is_business_hours(target_tz):
    actual_delay *= 2
```

## robots.txt Analysis Checklist

```
1. Crawl-delay -> Apply to base_delay
2. Sitemap URL -> Collect crawling targets
3. Disallow patterns -> Apply URL filters
4. Allow exceptions -> Specify permitted paths
5. UA-specific rules -> Custom UA strategy
```

## Legitimate Alternative Search Order

```
1. Official API -> Top priority
2. RSS/Atom feeds -> /feed, /rss
3. Sitemap XML -> URL list
4. Open Data / Public APIs -> government data portals
5. Partnership/Partner APIs
6. Web Archives -> web.archive.org
```

## Legal Risk Checklist

| Item | Risk Level |
|------|-----------|
| robots.txt compliance | Mandatory |
| ToS anti-scraping clauses | High |
| No personal data collection | Mandatory |
| Copyright verification | High |
| No excessive server load | Mandatory |
| No login credential usage | Medium |
| Data purpose (analysis vs. resale) | High |

## Report Template

```markdown
## Anti-Bot Analysis Report
### Target: [URL]
### Defense Level: Level [0-3]
### Detected Defense Mechanisms
| Defense Type | Details | Counterable |
### robots.txt Analysis
### Recommended Strategy
### Legitimate Alternatives
### Legal Risk Assessment: [Low/Medium/High]
```
