# MongoDB 스키마 정보

> Database: `test`
> Generated: 2026-03-29
> 이 문서는 `node scripts/db-schema-export.js`로 자동 생성되었습니다.

---

## 컬렉션 요약

| 컬렉션 | 문서 수 | 인덱스 수 | 비고 |
| ------ | ------: | --------: | ---- |
| aiinstructionhistories | 3 | 3 | |
| aipresets | 0 | 3 | |
| aisettings | 1 | 1 | |
| aiusages | 3 | 3 | |
| applications | 20 | 2 | |
| availabilities | 3 | 2 | |
| boards | 12 | 2 | |
| chatmessages | 56 | 3 | |
| chatrooms | 2 | 4 | |
| comments | 0 | 1 | |
| commoncodes | 8 | 3 | |
| counters | 2 | 1 | |
| memberbasics | 18 | 4 | |
| notes | 123 | 4 | |
| notifications | 17 | 3 | |
| posts | 9 | 1 | |
| projectmembers | 28 | 2 | |
| projects | 19 | 6 | |
| reviews | 0 | 2 | |
| sections | 9 | 2 | |
| sessions | 0 | 2 | |
| tasks | 16 | 4 | |
| techstacks | 32 | 2 | |
| users | 0 | 2 | |

---

## aiinstructionhistories

문서 수: **3**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `additionalInstruction` | string |
| `boardId` | ObjectId |
| `createdAt` | Date |
| `creatorId` | ObjectId |
| `inputTokens` | number |
| `modelName` | string |
| `outputTokens` | number |
| `preset` | string |
| `projectId` | number |
| `provider` | string |
| `reference.noteIds` | Array (empty) |
| `reference.sectionIds` | Array (empty) |
| `resultMarkdown` | string |
| `target.noteIds` | Array<ObjectId> | Array (empty) |
| `target.sectionIds` | Array (empty) | Array<ObjectId> |
| `target.type` | string |
| `updatedAt` | Date |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| boardId_1_createdAt_-1 | `{ boardId: 1, createdAt: -1 }` | - |
| projectId_1_createdAt_-1 | `{ projectId: 1, createdAt: -1 }` | - |

---

## aipresets

문서 수: **0**

> 문서 없음 (빈 컬렉션)

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| projectId_1 | `{ projectId: 1 }` | - |
| projectId_1_createdAt_-1 | `{ projectId: 1, createdAt: -1 }` | - |

---

## aisettings

문서 수: **1**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `contextIncludeDeadline` | boolean |
| `contextIncludeMembers` | boolean |
| `contextIncludeOverview` | boolean |
| `contextIncludeResources` | boolean |
| `cooldownMinutes` | number |
| `createdAt` | Date |
| `dailyLimitPerProject` | number |
| `defaultPresets` | Array<Object> |
| `enabled` | boolean |
| `modelName` | string |
| `provider` | string |
| `systemPromptTemplate` | string |
| `updatedAt` | Date |
| `updatedBy` | null |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |

---

## aiusages

문서 수: **3**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `boardId` | ObjectId |
| `createdAt` | Date |
| `estimatedCost` | number |
| `inputTokens` | number |
| `modelName` | string |
| `outputTokens` | number |
| `projectId` | number |
| `provider` | string |
| `updatedAt` | Date |
| `userId` | ObjectId |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| userId_1_createdAt_-1 | `{ userId: 1, createdAt: -1 }` | - |
| projectId_1_createdAt_-1 | `{ projectId: 1, createdAt: -1 }` | - |

---

## applications

문서 수: **20**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `applicantId` | ObjectId |
| `createdAt` | Date |
| `message` | string |
| `projectId` | ObjectId |
| `role` | string |
| `status` | string |
| `updatedAt` | Date |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| projectId_1_applicantId_1_role_1 | `{ projectId: 1, applicantId: 1, role: 1 }` | unique |

---

## availabilities

문서 수: **3**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `createdAt` | Date |
| `personalityTags` | Array<string> | Array (empty) |
| `preference` | number |
| `schedule` | Array<Object> |
| `updatedAt` | Date |
| `userId` | ObjectId |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| userId_1 | `{ userId: 1 }` | unique |

---

## boards

문서 수: **12**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `createdAt` | Date |
| `name` | string |
| `ownerId` | string |
| `pid` | number |
| `updatedAt` | Date |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| pid_1 | `{ pid: 1 }` | unique |

---

## chatmessages

문서 수: **56**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `content` | string |
| `createdAt` | Date |
| `messageType` | string |
| `readBy` | Array<ObjectId> |
| `roomId` | ObjectId |
| `sender` | ObjectId |
| `updatedAt` | Date |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| roomId_1 | `{ roomId: 1 }` | - |
| roomId_1_createdAt_-1 | `{ roomId: 1, createdAt: -1 }` | - |

---

## chatrooms

문서 수: **2**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `applicationId` | null |
| `category` | string |
| `createdAt` | Date |
| `lastMessage` | string |
| `participants` | Array<ObjectId> |
| `projectId` | ObjectId |
| `unreadCounts.68bbdc810cb2f6675cd479d9` | number |
| `unreadCounts.6905a836e8eb89bea6af1b8a` | number |
| `unreadCounts.6918281cc86d83b9742ebf36` | number |
| `unreadCounts.693d17d9754c2bfc80917301` | number |
| `updatedAt` | Date |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| category_1 | `{ category: 1 }` | - |
| participants_1 | `{ participants: 1 }` | - |
| projectId_1 | `{ projectId: 1 }` | - |

---

## comments

문서 수: **0**

> 문서 없음 (빈 컬렉션)

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |

---

## commoncodes

문서 수: **8**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `code` | string |
| `group` | string |
| `groupName` | string |
| `isActive` | boolean |
| `label` | string |
| `order` | number |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| group_1 | `{ group: 1 }` | - |
| group_1_code_1 | `{ group: 1, code: 1 }` | unique |

---

## counters

문서 수: **2**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | string |
| `seq` | number |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |

---

## memberbasics

문서 수: **18**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `authorEmail` | string |
| `avatarUrl` | string |
| `career` | string |
| `createdAt` | Date |
| `delYn` | boolean |
| `githubStats.contributions` | number |
| `githubStats.followers` | number |
| `githubStats.following` | number |
| `githubStats.techStack` | Array<string> |
| `githubStats.totalCommits` | number |
| `githubStats.totalIssues` | number |
| `githubStats.totalPRs` | number |
| `githubStats.totalStars` | number |
| `introduction` | string |
| `level` | number |
| `mblNo` | number | string |
| `memberType` | string |
| `nName` | string |
| `password` | string |
| `portfolioLinks` | Array<string> | Array (empty) |
| `position` | string |
| `providers` | Array<string> | Array (empty) |
| `socialLinks.blog` | string |
| `socialLinks.github` | string |
| `socialLinks.linkedin` | string |
| `socialLinks.other` | string |
| `socialLinks.solvedAc` | string |
| `status` | string |
| `techTags` | Array<string> |
| `uid` | number |
| `updatedAt` | Date |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| uid_1 | `{ uid: 1 }` | unique |
| authorEmail_1 | `{ authorEmail: 1 }` | unique |
| delYn_1_createdAt_-1 | `{ delYn: 1, createdAt: -1 }` | - |

---

## notes

문서 수: **123**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `assigneeId` | null |
| `boardId` | ObjectId |
| `color` | string |
| `createdAt` | Date |
| `creatorId` | ObjectId |
| `dueDate` | null |
| `height` | number |
| `sectionId` | null | ObjectId |
| `tags` | Array (empty) |
| `text` | string |
| `updatedAt` | Date |
| `updaterId` | ObjectId |
| `width` | number |
| `x` | number |
| `y` | number |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| boardId_1 | `{ boardId: 1 }` | - |
| sectionId_1 | `{ sectionId: 1 }` | - |
| boardId_1_status_1 | `{ boardId: 1, status: 1 }` | - |

---

## notifications

문서 수: **17**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `createdAt` | Date |
| `project` | ObjectId |
| `read` | boolean |
| `recipient` | ObjectId |
| `sender` | ObjectId |
| `type` | string |
| `updatedAt` | Date |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| recipient_1_createdAt_-1 | `{ recipient: 1, createdAt: -1 }` | - |
| recipient_1_read_1 | `{ recipient: 1, read: 1 }` | - |

---

## posts

문서 수: **9**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `authorEmail` | string |
| `content` | string |
| `createdAt` | Date |
| `like` | number |
| `likedBy` | Array<string> |
| `nName` | string |
| `title` | string |
| `uid` | number |
| `updatedAt` | Date |
| `viewCount` | number |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |

---

## projectmembers

문서 수: **28**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `createdAt` | Date |
| `projectId` | ObjectId |
| `role` | string |
| `status` | string |
| `updatedAt` | Date |
| `userId` | ObjectId |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| projectId_1_userId_1 | `{ projectId: 1, userId: 1 }` | unique |

---

## projects

문서 수: **19**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `author` | ObjectId |
| `category` | string |
| `content` | string |
| `createdAt` | Date |
| `deadline` | Date |
| `images` | Array<string> |
| `likes` | Array (empty) |
| `members` | Array<Object> | Array (empty) |
| `overview` | string |
| `pid` | number |
| `resources` | Array<Object> |
| `status` | string |
| `tags` | Array<ObjectId> |
| `title` | string |
| `updatedAt` | Date |
| `views` | number |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| pid_1 | `{ pid: 1 }` | unique |
| delYn_1_createdAt_-1 | `{ delYn: 1, createdAt: -1 }` | - |
| delYn_1_category_1_status_1 | `{ delYn: 1, category: 1, status: 1 }` | - |
| author_1 | `{ author: 1 }` | - |
| delYn_1_deadline_1 | `{ delYn: 1, deadline: 1 }` | - |

---

## reviews

문서 수: **0**

> 문서 없음 (빈 컬렉션)

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| projectId_1_reviewerId_1_revieweeId_1 | `{ projectId: 1, reviewerId: 1, revieweeId: 1 }` | unique |

---

## sections

문서 수: **9**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `boardId` | ObjectId |
| `color` | string |
| `createdAt` | Date |
| `depth` | number |
| `height` | number |
| `parentSectionId` | ObjectId | null |
| `title` | string |
| `updatedAt` | Date |
| `width` | number |
| `x` | number |
| `y` | number |
| `zIndex` | number |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| boardId_1 | `{ boardId: 1 }` | - |

---

## sessions

문서 수: **0**

> 문서 없음 (빈 컬렉션)

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| expiresAt_1 | `{ expiresAt: 1 }` | TTL: 0s |

---

## tasks

문서 수: **16**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `assignee` | ObjectId |
| `createdAt` | Date |
| `dependencies` | Array<Object> | Array (empty) |
| `description` | string |
| `endDate` | Date |
| `milestone` | boolean |
| `phase` | string |
| `pid` | number |
| `progress` | number |
| `startDate` | Date |
| `status` | string |
| `title` | string |
| `updatedAt` | Date |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| pid_1 | `{ pid: 1 }` | - |
| pid_1_startDate_1 | `{ pid: 1, startDate: 1 }` | - |
| pid_1_endDate_1 | `{ pid: 1, endDate: 1 }` | - |

---

## techstacks

문서 수: **32**

### 필드

| 필드 | 타입 |
| ---- | ---- |
| `_id` | ObjectId |
| `category` | string |
| `name` | string |

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| name_1 | `{ name: 1 }` | unique |

---

## users

문서 수: **0**

> 문서 없음 (빈 컬렉션)

### 인덱스

| 이름 | 키 | 옵션 |
| ---- | -- | ---- |
| _id_ | `{ _id: 1 }` | - |
| email_1 | `{ email: 1 }` | unique |

---

