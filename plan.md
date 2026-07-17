# Plan — Quản trị Material / Assignment / QuestionBank / Milestone (Manager)

> Mô hình: **contextual** — CRUD nằm trong cây `CurriculumSplitPanel` (Program → Module → Course → Activity).
> Nguồn: `specs/oboxsteam.openapi.json`. Base URL: `NEXT_PUBLIC_API_URL`.

## 1. Quan hệ dữ liệu (đã xác minh từ spec)

| Entity | Khóa cha | Ghi chú |
|---|---|---|
| Material | `activityId` (1‑1, chỉ `SelfPaced`) | Nhúng sẵn trong Activity/Course detail |
| Assignment | `moduleId` (bắt buộc), `courseId` (nullable) | Quiz tham chiếu `questionBankId` |
| QuestionBank | `courseId` | Chứa questions (import CSV) |
| ResearchMilestone | `moduleId` (chỉ module `Research`) | Gói 1 deliverable Assignment + link N Activity |

---

## 2. Trạng thái API backend theo từng entity

Ký hiệu: ✅ có · ❌ thiếu (cần backend bổ sung).

### 2.1 Material — ĐỦ (đã triển khai UI)
| Thao tác | Endpoint | Trạng thái |
|---|---|---|
| Lấy theo activity | `GET /api/materials/activity/{activityId}` | ✅ |
| Upload | `POST /api/materials/upload?activityId&title` (multipart `file`) | ✅ |
| Sửa tiêu đề | `PUT /api/materials/{materialId}` | ✅ |
| Xóa | `DELETE /api/materials/{materialId}` | ✅ |

### 2.2 Assignment — ĐỦ cho tạo/sửa/xóa
| Thao tác | Endpoint | Trạng thái |
|---|---|---|
| Tạo | `POST /api/assignments` | ✅ |
| Xem theo id | `GET /api/assignments/{assignmentId}` | ✅ |
| Sửa | `PUT /api/assignments/{assignmentId}` | ✅ |
| Xóa (soft) | `DELETE /api/assignments/{assignmentId}` | ✅ |
| **List theo module** | *(không có)* | ❌ **THIẾU** |

> ❌ **Thiếu**: `GET /api/modules/{moduleId}/assignments` (hoặc `GET /api/assignments?moduleId=`) trả `AssignmentResponseDto[]`.
> Trường mong muốn trong mỗi item list: `id, code, moduleId, courseId, title, assignmentType, maxPoints, passScore, isRequiredForModulePass, dueDate, questionBankId`.
> Tạm thời: sau khi tạo, giữ assignment trong state phiên để sửa/xóa; reload trang sẽ mất danh sách cho tới khi có endpoint list.

### 2.3 QuestionBank — THIẾU NHIỀU
| Thao tác | Endpoint | Trạng thái |
|---|---|---|
| Tạo bank | `POST /api/question-banks` | ✅ |
| Xem bank theo id | `GET /api/question-banks/{questionBankId}` | ✅ (không kèm questions) |
| Xóa bank (soft) | `DELETE /api/question-banks/{questionBankId}` | ✅ |
| Import câu hỏi (CSV) | `POST /api/question-banks/{questionBankId}/import` | ✅ |
| Xóa 1 câu hỏi | `DELETE /api/question-banks/{questionBankId}/questions/{questionId}` | ✅ |
| **Sửa bank** | *(không có PUT)* | ❌ **THIẾU** |
| **List bank theo course** | *(không có GET list)* | ❌ **THIẾU** |
| **List câu hỏi trong bank** | *(GET bank không trả questions)* | ❌ **THIẾU** |
| **Thêm 1 câu hỏi (không qua CSV)** | *(không có POST question)* | ❌ **THIẾU** |
| **Sửa 1 câu hỏi** | *(không có PUT question)* | ❌ **THIẾU** |

> ❌ **Thiếu cần bổ sung**:
> - `PUT /api/question-banks/{questionBankId}` — body: `{ name, description }`.
> - `GET /api/question-banks?courseId=` — item: `{ id, courseId, name, description, questionCount, createdAt }`.
> - `GET /api/question-banks/{questionBankId}/questions` — item: `{ id, questionBankId, content, difficulty(Easy|Medium|Hard), questionType(SingleChoice|MultipleChoice|...), options: [{ id, content, isCorrect }] }`.
> - `POST /api/question-banks/{questionBankId}/questions` — body: `{ content, difficulty, questionType, options: [{ content, isCorrect }] }`.
> - `PUT /api/question-banks/{questionBankId}/questions/{questionId}` — body như trên.
> Tạm thời: chỉ hỗ trợ **tạo bank / xóa bank / import CSV / xóa câu hỏi**.

### 2.4 ResearchMilestone — ĐỦ (kể cả list)
| Thao tác | Endpoint | Trạng thái |
|---|---|---|
| List theo module | `GET /api/modules/{moduleId}/research-milestones` | ✅ |
| Tạo (kèm deliverable assignment) | `POST /api/modules/{moduleId}/research-milestones` | ✅ |
| Xem theo id | `GET /api/research-milestones/{milestoneId}` | ✅ |
| Sửa | `PUT /api/research-milestones/{milestoneId}` | ✅ |
| Xóa (soft) | `DELETE /api/research-milestones/{milestoneId}` | ✅ |
| Link activity | `POST /api/research-milestones/{milestoneId}/activities` | ✅ |
| Gỡ activity | `DELETE /api/research-milestones/{milestoneId}/activities/{activityId}` | ✅ |

---

## 3. Trường của từng form (request body)

### 3.1 Assignment — `CreateAssignmentRequestDto` / `UpdateAssignmentRequestDto`
Chung:
- `code?: string`
- `moduleId: uuid` (bắt buộc khi tạo)
- `courseId?: uuid`
- `title: string`
- `description?: string`
- `assignmentType: "Retrospective" | "FileUpload" | "Quiz"`
- `maxPoints: int`
- `passScore: number`
- `isRequiredForModulePass: bool`
- `dueDate?`, `availableFrom?`, `availableUntil?` (định dạng `dd/MM/yyyy HH:mm:ss`)
- `maxAttempts: int`

Chỉ khi `assignmentType === "Quiz"`:
- `questionBankId?: uuid`
- `questionCount?: int`
- `allowShuffle: bool`, `shuffleOptions: bool`
- `easyPercent: int`, `mediumPercent: int`, `hardPercent: int` (validate tổng = 100)
- `timeLimitMinutes?: int`

### 3.2 QuestionBank — `CreateQuestionBankRequestDto`
- `courseId: uuid`
- `name: string`
- `description?: string`

### 3.3 ResearchMilestone — `CreateResearchMilestoneRequestDto`
- `code: string (1..50)`, `title: string (1..255)`, `description?: string`
- `milestoneOrder: int (>=1)`, `isCapstone: bool`
- Deliverable assignment: `assignmentCode: string`, `assignmentTitle: string`, `assignmentDescription?`, `assignmentType`, `maxPoints: int`, `passScore: number`, `dueDate?`, `availableFrom?`, `availableUntil?`, `maxAttempts: int`

`UpdateResearchMilestoneRequestDto` (partial): `title?, description?, milestoneOrder?, isCapstone?, assignmentTitle?, assignmentDescription?, maxPoints?, passScore?, dueDate?, availableFrom?, availableUntil?`

Link activity — `LinkMilestoneActivityRequestDto`:
- `activityId: uuid`, `isRequiredForSubmission: bool`, `displayOrder: int (>=0)`, `classId?: uuid`

---

## 4. Kế hoạch triển khai FE

### Lớp API + validations (backbone tạo/sửa/xóa)
- [x] Material (đã có sẵn)
- [ ] Assignment: `lib/validations/assignments.ts` (+create/update), `lib/api/assignments/*` (create/update/delete)
- [ ] QuestionBank: `lib/api/entities/question-bank.ts`, `lib/api/question-banks/*`, `lib/validations/question-banks.ts` (create/delete/import/deleteQuestion)
- [ ] ResearchMilestone: `lib/api/entities/research-milestone.ts`, `lib/api/research-milestones/*`, `lib/validations/research-milestones.ts` (full CRUD + link)

### UI trong `CurriculumSplitPanel`
- [x] Material: section trong `ActivityFormPanel` (SelfPaced)
- [ ] Assignment: node dưới Module → form type-driven; create + edit/delete (state phiên vì thiếu list)
- [ ] QuestionBank: node dưới Course → create/delete + import CSV (không sửa vì thiếu PUT)
- [ ] Milestone: node dưới Module `Research` → list + create/edit/delete + activity linker

### Trang phẳng `/manager/{materials,assignments,question-bank,milestones}`
- Hoãn cho tới khi có endpoint list toàn cục (chỉ làm tra cứu read-only).

---

## 5. Việc cần backend (tóm tắt để gửi team BE)
1. `GET /api/modules/{moduleId}/assignments` → `AssignmentResponseDto[]`.
2. `GET /api/question-banks?courseId=` → danh sách bank (kèm `questionCount`).
3. `PUT /api/question-banks/{questionBankId}` → sửa `name`, `description`.
4. `GET /api/question-banks/{questionBankId}/questions` → danh sách câu hỏi + options.
5. `POST` / `PUT` `/api/question-banks/{questionBankId}/questions[/{questionId}]` → thêm/sửa 1 câu hỏi.
6. (Tùy chọn) endpoint list toàn cục cho các trang phẳng ở sidebar.
