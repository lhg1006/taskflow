# 📋 TaskFlow - Collaborative Kanban Board

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

**실시간 협업이 가능한 현대적인 프로젝트 관리 도구**

[Features](#-주요-기능) • [Tech Stack](#-기술-스택) • [Installation](#-설치-및-실행) • [Testing](#-테스트)

</div>

---

## 📖 프로젝트 소개

TaskFlow는 팀 협업을 위한 실시간 Kanban 보드 애플리케이션입니다. 직관적인 드래그 앤 드롭 인터페이스와 실시간 동기화를 통해 팀원들과 효율적으로 작업을 관리할 수 있습니다.

### 🎯 개발 목표
- **확장 가능한 아키텍처**: 마이크로서비스 패턴과 모듈화된 구조
- **실시간 협업**: WebSocket 기반 실시간 동기화
- **타입 안정성**: TypeScript를 활용한 엔드투엔드 타입 안정성
- **테스트 주도 개발**: 155개의 단위 테스트로 높은 코드 품질 보장

---

## ✨ 주요 기능

### 🏢 워크스페이스 & 보드 관리
- **다중 워크스페이스**: 프로젝트별 독립적인 작업 공간 생성
- **커스터마이징 가능한 보드**: 칼럼 추가/삭제/순서 변경
- **멤버 초대 시스템**: 워크스페이스 단위 권한 관리

### 📝 카드 관리
- **드래그 앤 드롭**: @dnd-kit을 활용한 부드러운 UX
- **체크리스트**: 세부 작업 관리 및 진행률 추적
- **라벨 시스템**: 색상별 카테고리 분류
- **마감일 관리**: 날짜별 필터링 및 알림
- **첨부파일**: 파일 업로드 및 관리
- **댓글**: 카드별 실시간 커뮤니케이션
- **담당자 할당**: 멤버별 작업 배정

### 🔍 검색 & 필터링
- **전역 검색**: 카드 제목, 설명, 댓글 전체 검색
- **고급 필터**: 담당자, 라벨, 마감일, 상태별 필터링
- **아카이브**: 완료된 카드 보관 및 복원

### 📊 대시보드 & 통계
- **실시간 통계**: 워크스페이스/보드별 진행 현황
- **완료율 추적**: 개인 및 팀 생산성 지표
- **차트 시각화**: Recharts를 활용한 데이터 시각화
- **최근 활동**: 최신 업데이트 카드 목록

### 🔔 실시간 알림
- **WebSocket 기반**: 실시간 변경사항 동기화
- **활동 피드**: 카드 생성, 이동, 댓글 등 모든 활동 추적
- **알림 시스템**: 중요 이벤트 알림

### 🎨 사용자 경험
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 최적화
- **애니메이션**: Framer Motion을 활용한 자연스러운 전환
- **디자인 시스템**: 일관된 UI/UX를 위한 공통 컴포넌트
- **접근성**: ARIA 속성 및 키보드 네비게이션 지원

---

## 🛠 기술 스택

### Frontend
| 기술 | 사용 이유 |
|------|----------|
| **Next.js 16** | App Router, Server Components, 최신 React 기능 |
| **TypeScript** | 타입 안정성 및 개발 생산성 향상 |
| **Tailwind CSS v4** | 유틸리티 우선 스타일링, 커스텀 디자인 시스템 |
| **Zustand** | 경량 상태 관리, 간결한 API |
| **Socket.io Client** | 실시간 양방향 통신 |
| **@dnd-kit** | 접근성 높은 드래그 앤 드롭 |
| **Framer Motion** | 선언적 애니메이션 |
| **Recharts** | React 친화적 차트 라이브러리 |
| **React Hot Toast** | 우아한 알림 UI |
| **Lucide React** | 현대적인 아이콘 세트 |

### Backend
| 기술 | 사용 이유 |
|------|----------|
| **NestJS** | 엔터프라이즈급 아키텍처, DI 컨테이너 |
| **TypeScript** | 프론트엔드와 타입 공유 |
| **Prisma** | 타입 안전 ORM, 마이그레이션 관리 |
| **PostgreSQL** | 관계형 데이터 무결성, JSON 지원 |
| **Socket.io** | 실시간 이벤트 브로드캐스팅 |
| **Passport JWT** | 표준 인증 전략 |
| **Class Validator** | DTO 자동 검증 |
| **Jest** | 155개 단위 테스트 (90%+ 커버리지) |

---

## 🏗 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages/     │  │  Components  │  │    Stores    │      │
│  │  App Router  │  │   (Atomic)   │  │   (Zustand)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                   ┌────────┴────────┐
                   │   HTTP / WS     │
                   └────────┬────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                        Backend (NestJS)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │   Services   │  │  Gateways    │      │
│  │  (REST API)  │  │  (Business)  │  │ (WebSocket)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
│                  ┌────────┴────────┐                        │
│                  │  Prisma Client  │                        │
│                  └────────┬────────┘                        │
└───────────────────────────┼──────────────────────────────────┘
                            │
                   ┌────────┴────────┐
                   │   PostgreSQL    │
                   └─────────────────┘
```

### 주요 디자인 패턴
- **Repository Pattern**: Prisma를 통한 데이터 액세스 추상화
- **DTO Pattern**: 요청/응답 검증 및 타입 안전성
- **Dependency Injection**: NestJS의 IoC 컨테이너 활용
- **Gateway Pattern**: WebSocket 실시간 통신 관리

---

## 🚀 설치 및 실행

### 사전 요구사항
- Node.js 18+
- PostgreSQL 14+
- npm 또는 yarn

### 1. 저장소 클론
```bash
git clone https://github.com/lhg1006/taskflow.git
cd taskflow
```

### 2. Backend 설정
```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 생성)
DATABASE_URL="postgresql://user:password@localhost:5432/taskflow"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001

# Prisma 마이그레이션
npx prisma migrate dev

# 개발 서버 실행
npm run start:dev
```

### 3. Frontend 설정
```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정 (.env.local 파일 생성)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001

# 개발 서버 실행
npm run dev
```

### 4. 접속
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs (Swagger): http://localhost:3001/api

---

## 🧪 테스트

### Backend 테스트 (155 단위 테스트)
```bash
cd backend

# 전체 테스트 실행
npm test

# 커버리지 확인
npm run test:cov

# 특정 모듈 테스트
npm test -- workspace.service.spec.ts
```

### 테스트 커버리지
- **Workspace Service**: 100%
- **Board Service**: 100%
- **Card Service**: 100%
- **Activity Service**: 100%
- **Auth Service**: 95%+
- **전체 평균**: 90%+

---

## 🗄 데이터베이스 스키마

```prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  password   String
  name       String
  workspaces WorkspaceMember[]
  cards      Card[]   @relation("AssignedCards")
  comments   Comment[]
  activities Activity[]
}

model Workspace {
  id          String   @id @default(cuid())
  name        String
  description String?
  members     WorkspaceMember[]
  boards      Board[]
}

model Board {
  id          String   @id @default(cuid())
  name        String
  workspace   Workspace @relation(fields: [workspaceId])
  columns     Column[]
}

model Card {
  id          String   @id @default(cuid())
  title       String
  description String?
  position    Int
  dueDate     DateTime?
  assignees   User[]   @relation("AssignedCards")
  labels      Label[]
  checklists  ChecklistItem[]
  comments    Comment[]
  attachments Attachment[]
  activities  Activity[]
}
```

---

## 🔒 보안 기능

- **JWT 인증**: Passport를 활용한 표준 토큰 기반 인증
- **비밀번호 해싱**: bcrypt를 사용한 안전한 비밀번호 저장
- **DTO 검증**: Class Validator를 통한 입력값 검증
- **CORS 설정**: 화이트리스트 기반 CORS 정책
- **SQL Injection 방지**: Prisma의 파라미터화된 쿼리
- **XSS 방지**: 자동 이스케이핑 및 CSP 헤더

---

## ⚡️ 성능 최적화

### Frontend
- **Code Splitting**: Next.js 자동 코드 분할
- **Image Optimization**: Next.js Image 컴포넌트 사용
- **Dynamic Import**: 모달 및 대시보드 컴포넌트 지연 로딩
- **Memoization**: React.memo 및 useMemo 활용
- **Debouncing**: 검색 입력 최적화 (300ms)

### Backend
- **Connection Pooling**: Prisma 커넥션 풀 관리
- **Indexed Queries**: 주요 컬럼 인덱싱
- **Pagination**: 대용량 데이터 페이지네이션
- **Caching**: 자주 조회되는 데이터 캐싱

---

## 📸 화면 구성

### 🏠 대시보드
<img src="./screenshots/dashboard.png" alt="Dashboard" width="800">

*실시간 통계와 차트로 프로젝트 진행 상황을 한눈에 파악*

### 🎯 워크스페이스
<img src="./screenshots/workspace.png" alt="Workspace" width="800">

*프로젝트별 독립적인 작업 공간 및 멤버 관리*

### 📋 칸반 보드
<img src="./screenshots/kanban-board.png" alt="Kanban Board" width="800">

*드래그 앤 드롭으로 직관적인 작업 관리*

### 📊 보드 분석
<img src="./screenshots/board-analytics.png" alt="Board Analytics" width="800">

*완료율, 컬럼별 카드 분포 등 보드 진행 현황 시각화*

### 📅 캘린더 뷰
<img src="./screenshots/calendar-view.png" alt="Calendar View" width="800">

*마감일 기반 일정 캘린더로 작업 일정 관리*

### 📝 카드 상세
<img src="./screenshots/card-detail.png" alt="Card Detail" width="800">

*체크리스트, 담당자, 마감일, 라벨 등 풍부한 카드 기능*

### 💬 댓글 & 협업
<img src="./screenshots/card-comments.png" alt="Card Comments" width="800">

*카드별 댓글과 활동 로그로 팀 협업 지원*

---

## 📁 프로젝트 구조

```
taskflow/
├── frontend/                  # Next.js 애플리케이션
│   ├── app/                  # App Router 페이지
│   ├── components/           # 재사용 컴포넌트
│   ├── store/                # Zustand 상태 관리
│   ├── lib/                  # 유틸리티 함수
│   └── styles/               # 글로벌 스타일
├── backend/                   # NestJS 애플리케이션
│   ├── src/
│   │   ├── auth/            # 인증 모듈
│   │   ├── workspace/       # 워크스페이스 모듈
│   │   ├── board/           # 보드 모듈
│   │   ├── card/            # 카드 모듈
│   │   ├── activity/        # 활동 로그 모듈
│   │   └── gateway/         # WebSocket 게이트웨이
│   ├── prisma/              # 데이터베이스 스키마
│   └── test/                # 단위 테스트 (155개)
└── README.md
```

---

## 🗺 향후 계획

### Phase 1 (완료)
- [x] 기본 Kanban 보드 기능
- [x] 실시간 동기화
- [x] 검색 및 필터링
- [x] 대시보드 통계
- [x] 단위 테스트 (155개)

### Phase 2 (진행중)
- [ ] Redis 캐싱 레이어
- [ ] 이메일 알림
- [ ] 파일 업로드 (AWS S3)
- [x] 캘린더 뷰
- [ ] 간트 차트
- [ ] 타임라인 뷰

### Phase 3 (향후)
- [ ] 모바일 앱 (React Native)
- [ ] Slack/Discord 통합
- [ ] 자동화 규칙
- [ ] 템플릿 시스템
- [ ] 다국어 지원

---

## 📝 라이선스

MIT License

---

## 👤 Contact

프로젝트에 대한 문의나 피드백은 환영합니다!

- **GitHub**: [@lhg1006](https://github.com/lhg1006)
