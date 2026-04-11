---
name: selector-generator
description: "A skill for systematically generating and validating CSS/XPath selectors for web page data extraction. Use for requests like 'create selectors', 'CSS selectors', 'write XPath', 'data extraction patterns', 'parsing rules', etc. Note: directly operating browser DevTools is outside the scope of this skill."
---

# Selector Generator — CSS/XPath Selector Generation + Validation

A skill that enhances parser-engineer's selector authoring capabilities.

## Target Agents

- **parser-engineer** — Designs accurate selectors during HTML parsing
- **monitor-operator** — Implements selector change detection logic

## Selector Strategy Priority

```
1st: Unique ID           -> #product-price
2nd: data-* attributes   -> [data-testid="price"]
3rd: Semantic classes     -> .product-price
4th: ARIA attributes      -> [aria-label="price"]
5th: Structural selectors -> article > .info > span
6th: Text XPath          -> //span[contains(text(),"$")]
```

### Patterns to Avoid

| Pattern | Problem | Alternative |
|---------|---------|-------------|
| `.css-1a2b3c` | CSS-in-JS hash changes | Parent semantic element |
| `div>div>div>span` | Breaks on structure changes | Meaningful class |
| `:nth-child(7)` alone | Breaks when elements change | Class + nth combination |

## Selector Pattern Recipes

### Product Listings

```python
selectors = {
    "container": "ul.product-list > li",
    "name": ".product-name, h3.title",
    "price": {
        "current": ".sale-price, [data-price]",
        "original": ".original-price, del"
    },
    "image": "img.product-image::attr(src)",
    "link": "a.product-link::attr(href)",
    "pagination": {
        "next": "a.next, [rel='next']",
        "total": ".total-pages"
    }
}
```

### Forums/News

```python
selectors = {
    "article_list": "article, .post-item",
    "title": "h2 > a, .article-title",
    "author": ".author, .writer",
    "date": "time::attr(datetime), .date",
    "content": "article .content, .post-body"
}
```

### Tables

```python
def table_to_dicts(html):
    headers = [th.text for th in select("thead th")]
    return [
        {h: cell.text for h, cell in zip(headers, row.select("td"))}
        for row in select("tbody tr")
    ]
```

## XPath vs CSS Decision Criteria

| Situation | Recommendation | Example |
|-----------|---------------|---------|
| ID/class-based | CSS | `#price` |
| Text contains search | XPath | `//span[contains(text(),"$")]` |
| Parent traversal | XPath | `//span[@class="price"]/parent::div` |
| Sibling relationship | XPath | `//dt[text()="Price"]/following-sibling::dd` |
| Conditional | XPath | `//div[@class="item" and .//span[@class="sale"]]` |

## Selector Robustness Score (0-100)

```
+30: ID-based
+25: data-testid
+20: Semantic class
+15: ARIA attribute
-10: nth-child alone
-20: Hash class
-30: 5+ level nesting

80-100: Stable | 60-79: Moderate | 40-59: Fragile | 0-39: Risky
```

## Change Detection Pattern

```python
selector_health = {
    "selector": ".product-price",
    "expected_pattern": r"[\d,.]+",
    "expected_count_min": 1,
    "fallback_selectors": ["[data-price]", "span.price"],
    "status": "active"  # active | degraded | broken
}
```

## Data Cleansing Pipeline

```python
def clean_price(raw: str) -> int:
    return int(re.sub(r'[^\d]', '', raw))

def clean_date(raw: str) -> str:
    # Various formats -> ISO 8601 conversion

def clean_url(raw: str, base: str) -> str:
    return urljoin(base, raw)
```
