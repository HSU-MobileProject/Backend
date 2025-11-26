# ToyLink Backend (Serverless)

토이프로젝트 중개 플랫폼 **ToyLink**의 백엔드입니다.
**Firebase Serverless** 아키텍처를 기반으로 하며, 데이터베이스 트리거(Trigger)를 활용해 자동화된 로직을 수행합니다.

## 📂 Directory Structure

백엔드 로직은 `functions/src` 폴더 내에 기능별로 모듈화되어 있습니다.

```
backend/
└── functions/
    ├── index.js               # 메인 엔트리 포인트
    └── src/
        ├── auth.js            # [Trigger] 회원가입/탈퇴 후처리
        ├── chat.js            # [Trigger] 채팅방 메타데이터(마지막 메시지) 동기화
        ├── likes.js           # [Trigger] 좋아요 카운트 자동 증감
        ├── notifications.js   # [Trigger] FCM 알림 발송 (채팅, 결제)
        ├── payments.js        # [Callable] 포트원 결제 검증
        ├── projects.js        # [Trigger] 검색용 키워드 자동 생성
        └── projects/          # [Project Domain]
            ├── crud.js        # [Callable] 프로젝트 CRUD API
            ├── favorite.js    # [Callable] 즐겨찾기 추가/삭제 API
            └── search.js      # [Callable] 프로젝트 검색 및 필터링 API
```

## ✨ Key Features (Server Logic)
1. Project Search Optimization (src/projects.js)
Trigger: firestore.document('projects/{id}').onWrite

프로젝트 등록/수정 시, 제목(Title)을 띄어쓰기 단위로 분리하여 keywords 배열 필드를 자동 생성합니다.

프론트엔드에서 array-contains 쿼리를 사용해 검색 기능을 구현할 수 있습니다.

2. Chat Room Management (src/chat.js, src/notifications.js)
Trigger: firestore.document('messages/{id}').onCreate

메시지가 전송되면 상위 채팅방(chatRooms)의 lastMessage와 updatedAt을 갱신하여 목록 정렬을 돕습니다.

동시에 상대방의 FCM 토큰을 조회하여 푸시 알림을 전송합니다.

3. Secure Payment (src/payments.js)
Type: Callable Function

클라이언트가 아닌 서버 환경에서 PortOne API와 통신하여 결제 금액을 검증합니다.

검증 완료된 건만 payments 컬렉션에 저장하여 데이터 무결성을 보장합니다.

## How to Deploy
반드시 functions 디렉토리 내부에서 배포 명령어를 실행해야 합니다.
backend 폴더에서 아래 순서대로 실행하면 배포가 실행됩니다.

```
cd functions
npm run deploy
```
