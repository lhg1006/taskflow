# TaskFlow - 실시간 협업 칸반보드

실시간으로 팀원들과 협업 가능한 칸반보드 애플리케이션

## 프로젝트 개요

TaskFlow는 Trello, Jira와 같은 칸반 보드 시스템으로, WebSocket을 통한 실시간 동기화 기능을 제공합니다.

## 기술 스택

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (상태관리)
- @dnd-kit (Drag & Drop)
- Socket.io-client (실시간 통신)

### Backend
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Socket.io (WebSocket)
- Passport JWT

### Infra
- Docker & Docker Compose
- Vercel (Frontend)
- Railway (Backend)

## 주요 기능

- ✅ 사용자 인증 (JWT + Google OAuth)
- ✅ 워크스페이스 관리
- ✅ 보드 관리
- ✅ 드래그앤드롭 칸반보드
- ✅ 실시간 동기화 (여러 사용자 동시 작업)
- ✅ 멤버 초대 및 권한 관리
- ✅ 댓글 시스템

## 시작하기

### 사전 요구사항
- Node.js 18+
- Docker & Docker Compose
- pnpm (권장)

### 설치 및 실행

```bash
# 저장소 클론 후
cd taskflow

# Docker Compose로 DB 실행
docker-compose up -d

# Frontend 실행
cd frontend
pnpm install
pnpm dev

# Backend 실행 (새 터미널)
cd backend
pnpm install
pnpm start:dev
```

## 프로젝트 구조

```
taskflow/
├── frontend/          # Next.js 애플리케이션
├── backend/           # NestJS 애플리케이션
├── docker-compose.yml # DB 컨테이너 설정
└── README.md
```

## 개발 진행 상황

- [ ] 프로젝트 초기 설정
- [ ] 인증 시스템
- [ ] 칸반보드 CRUD
- [ ] 실시간 동기화
- [ ] 배포

## 라이선스

MIT
