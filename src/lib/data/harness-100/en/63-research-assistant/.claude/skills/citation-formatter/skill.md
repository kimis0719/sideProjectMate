---
name: citation-formatter
description: "A specialized skill for accurately converting academic citations and references across major styles including APA, MLA, and Chicago. Used by the reference-manager agent when collecting bibliographic information and standardizing formats. Automatically applied in contexts involving 'citation format,' 'APA,' 'MLA,' 'Chicago,' 'references,' 'BibTeX,' or 'bibliography management.' Note: automatic bibliographic extraction from academic databases and Zotero/EndNote software operation are outside the scope of this skill."
---

# Citation Formatter — Academic Citation Format Conversion Tool

A specialized skill that enhances the reference-manager agent's bibliography management capabilities.

## Target Agent

- **reference-manager** — Reference format standardization, bibliographic information management

## APA 7th Edition

### In-text Citations

| Situation | Format | Example |
|-----------|--------|---------|
| 1 author | (Author, Year) | (Kim, 2023) |
| 2 authors | (Author1 & Author2, Year) | (Kim & Lee, 2023) |
| 3+ authors | (First Author et al., Year) | (Kim et al., 2023) |
| Direct quote | (Author, Year, p. Page) | (Kim, 2023, p. 45) |
| 40+ word quote | Block quote (indented) | Separate paragraph |
| Same author same year | (Author, YearX) | (Kim, 2023a) |
| Group author first use | (Full Name [Abbreviation], Year) | (WHO, 2023) |

### Reference Format

**Journal Article:**
```
Author. (Year). Article title. Journal Name, Volume(Issue), Pages. https://doi.org/xxx
```

**Book:**
```
Author. (Year). Title (Edition). Publisher.
Author. (Year). Title (Editor, Ed.). Publisher.
```

**Edited Book Chapter:**
```
Chapter Author. (Year). Chapter title. In Editor (Ed.), Book title (pp. Pages). Publisher.
```

**Dissertation/Thesis:**
```
Author. (Year). Title [Master's thesis/Doctoral dissertation, University Name]. Database/URL.
```

**Web Page:**
```
Author/Organization. (Year, Month Day). Title. Site Name. URL
```

**Report:**
```
Organization Name. (Year). Report title (Report No.). URL
```

## MLA 9th Edition

### In-text Citations

| Situation | Format | Example |
|-----------|--------|---------|
| Basic | (Author Page) | (Kim 45) |
| 2 authors | (Author1 and Author2 Page) | (Kim and Lee 45) |
| 3+ authors | (First Author et al. Page) | (Kim et al. 45) |

### Works Cited

```
Journal: Author. "Article Title." Journal Name, vol. Volume, no. Issue, Year, pp. Pages.
Book: Author. Title. Publisher, Year.
Web: Author. "Title." Site Name, Date, URL.
```

## Chicago (Author-Date Style)

### In-text Citations

```
(Author Year, Page)
Example: (Kim 2023, 45)
```

### References

```
Journal: Author. Year. "Article Title." Journal Name Volume (Issue): Pages.
Book: Author. Year. Title. City: Publisher.
```

## BibTeX Conversion

```bibtex
@article{kim2023,
  author  = {Kim, Minjun and Lee, Soojin},
  title   = {Article Title Here},
  journal = {Journal Name},
  year    = {2023},
  volume  = {15},
  number  = {3},
  pages   = {123--145},
  doi     = {10.1234/example}
}

@book{park2022,
  author    = {Park, Jihye},
  title     = {Book Title Here},
  publisher = {Publisher Name},
  year      = {2022},
  edition   = {2nd}
}
```

## Citation Quality Checklist

### Format Verification

- [ ] 1:1 correspondence between in-text citations and reference list
- [ ] Check for orphaned citations (in text but not in references)
- [ ] Check for unused references (in list but not cited in text)
- [ ] Consistent use of the same citation style
- [ ] DOI/URL links are active
- [ ] Author name format consistency (Full name vs. Initials)
- [ ] Year accuracy

### Academic Appropriateness

- [ ] Are 50% or more of sources from the last 5 years?
- [ ] Is the peer-reviewed journal ratio 70% or higher?
- [ ] Are primary sources preferentially cited? (Minimize secondary citations)
- [ ] Are key sources (highly cited papers) included?
- [ ] Are sources from diverse perspectives included without bias?

## Non-English Literature Citations (APA Standard)

```
Journal:
Author1, Author2. (Year). Article title. Journal Name, Volume(Issue), Pages.

Book:
Author. (Year). Title. Publisher.

Thesis:
Author. (Year). Title [Master's thesis/Doctoral dissertation, University Name].
```

**Reference list ordering:** Non-English literature (alphabetical by native script) -> English literature (alphabetical) -> Other languages
