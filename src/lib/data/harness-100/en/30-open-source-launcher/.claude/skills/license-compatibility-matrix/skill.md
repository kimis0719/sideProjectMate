---
name: license-compatibility-matrix
description: "open source license compatibility , licenseper ofmatter,  license strategy, SPDX identification guide. 'license compatibility', 'license optional', 'MIT', 'Apache', 'GPL', 'LGPL', 'BSD', ' license', 'SPDX', 'license ' etc. open source license related   this  for. license-specialistof license analysis  -ize. , -based this actual license day creation this of scope ."
---

# License Compatibility Matrix — open source license compatibility guide

open source license optional, compatibility analysis, dependency license  resolution  before guide.

## week license 

| license | type | upperfor for | modification items |   | network  |
|---------|------|----------|----------|----------|-------------|
| MIT |  | O | X | X | X |
| Apache 2.0 |  | O | X | O | X |
| BSD 2-Clause |  | O | X | X | X |
| BSD 3-Clause |  | O | X | X | X |
| MPL 2.0 |   | O | day  | O | X |
| LGPL 2.1/3.0 |   | O | libraryonly | X | X |
| GPL 2.0/3.0 |   | cases | O (before) | O(v3) | X |
| AGPL 3.0 |   | cases | O (before) | O | O |

## compatibility 

```
project license ↓  |  dependency license →
                    | MIT | Apache | BSD | MPL | LGPL | GPL | AGPL
────────────────────┼─────┼────────┼─────┼─────┼──────┼─────┼──────
MIT                 | ✅  | ✅     | ✅  | ✅  | ✅   | ❌  | ❌
Apache 2.0          | ✅  | ✅     | ✅  | ✅  | ✅   | ❌  | ❌
BSD                 | ✅  | ✅     | ✅  | ✅  | ✅   | ❌  | ❌
MPL 2.0             | ✅  | ✅     | ✅  | ✅  | ✅   | ✅* | ❌
LGPL 3.0            | ✅  | ✅     | ✅  | ✅  | ✅   | ✅  | ❌
GPL 3.0             | ✅  | ✅     | ✅  | ✅  | ✅   | ✅  | ❌
AGPL 3.0            | ✅  | ✅     | ✅  | ✅  | ✅   | ✅  | ✅

✅  | ❌  | ✅* cases 
```

**core rule:**
- GPL dependency for → project before GPL -basedfor (this and)
- AGPL dependency for → network servicealso  items of
- Apache 2.0 ↔ GPL 2.0  (  )

## license optional ofdecision tree

```
project target
├── maximum   → MIT or Apache 2.0
│   ├──   necessary → Apache 2.0
│   └── maximum simple → MIT
├── modification items  (day ) → MPL 2.0
├── library,  allowed → LGPL 3.0
├──  before items  → GPL 3.0
├── SaaS included items  → AGPL 3.0
└──  license (OSS + upperfor) → GPL + Commercial
```

## dependency license  resolution

###  patternand resolution

|  |  | resolution |
|------|------|------|
| MIT project + GPL dependency | GPL before |  package  or GPL transition |
| Apache + GPL 2.0 |    | GPL 3.0 before for |
| upperfor product + AGPL dependency |  items of |  package or license  |
|  GPL before  | before compatibility | "GPL 2.0 or later" for |

### license audit also

```bash
# Node.js
npx license-checker --json --production

# Python
pip-licenses --format=json --with-urls

# Go
go-licenses check ./...

# for
scancode-toolkit --json-pp output.json src/
```

## SPDX license 

```
# day license
SPDX-License-Identifier: MIT

# OR (optional possible)
SPDX-License-Identifier: MIT OR Apache-2.0

# AND ( license  compliant)
SPDX-License-Identifier: MIT AND BSD-3-Clause

# WITH (outside included)
SPDX-License-Identifier: GPL-2.0-only WITH Classpath-exception-2.0
```

##  license strategy

```
Community Edition: AGPL 3.0
├──  for possible
├── modification + service provided   items of
└── items/ open source projectin suitable

Enterprise Edition: upperfor license
├── AGPL of 
├── addition /supported included
└──  customer upper

success : MongoDB(SSPL), Redis(RSALv2), MySQL(GPL+Commercial)
```

## license of list

```markdown
project deployment before confirmation:
- [ ] all dependencyof license identification completed
- [ ] license compatibility  verification completed
- [ ] LICENSE dayin all 3 license included
- [ ]  (NOTICE) day  (Apache 2.0 required)
- [ ] GPL dependency for   items 
- [ ] SPDX identification  dayin included
- [ ] package.json/pyproject.tomlin license  people
```
