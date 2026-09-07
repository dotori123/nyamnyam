# firebase/

Firebase 연동. **구글 로그인 + Firestore 동기화가 동작합니다. 사진(Storage)은 아직입니다.**

설정(`.env.local`)이 없으면 `config.ts`가 null을 내보내고 앱은 로컬 저장만 쓰는 모드로 돕니다.
키 없이 clone한 사람도 그대로 실행할 수 있게 하려는 것입니다.

## 새 환경에서 붙이기

이미 다 구현돼 있어서, 새로 clone했거나 Firebase 프로젝트를 새로 만들 때만 필요합니다.

1. **콘솔에서 프로젝트 + 웹 앱 만들기** ([console.firebase.google.com](https://console.firebase.google.com))
2. **Authentication → Sign-in method → Google 사용 설정**
3. **Firestore Database 만들기** (위치는 `asia-northeast3` 권장)
4. **규칙 배포** — 루트의 `firestore.rules` 내용을 콘솔 규칙 탭에 통째로 붙여넣고 게시.
   규칙 편집기는 자바스크립트가 아니라 규칙 전용 언어라 `import`·`const`가 들어가면 안 됩니다.
5. **키 넣기** — 콘솔의 설정 코드를 루트의 `firebase-config.txt`에 붙여넣고 `npm run firebase:env`.
   `.env.local`이 만들어집니다 (손으로 6줄 옮기다 나는 오타 방지).
6. `npm run dev` → 설정 화면에 **계정** 항목이 생기면 연결된 것입니다.

## 파일

| 파일 | 하는 일 |
| --- | --- |
| `config.ts` | 초기화. 설정이 없으면 null을 내보내 앱이 로컬 전용으로 돈다. 오프라인 캐시 켬 |
| `converters.ts` | ISO 문자열 ↔ `Timestamp`, 사진 메타데이터 정리 |
| `records.ts` | `users/{uid}/records` 구독·CRUD·일괄 업로드 |
| `cats.ts` | `users/{uid}/cats` 구독·CRUD·일괄 업로드 |
| `storage.ts` | 사진 업로드 자리 — **아직 비어 있음** |

부르는 쪽은 `RecordsProvider`/`CatsProvider` 뿐입니다.
화면 컴포넌트는 `useRecords()`/`useCats()` 인터페이스만 보고 있어서 저장 위치를 모릅니다.

## 정해 둔 것

- **정렬은 `createdAt` 하나만 서버에.** 만족도순·가격순까지 서버에 맡기면 조합마다
  복합 색인이 필요해집니다. 기록이 수백 건 수준이라 화면에서 정렬하는 편이 낫습니다.
- **통합 검색은 클라이언트에서.** Firestore는 부분일치를 지원하지 않습니다.
- **프로필을 지워도 기록은 남깁니다.** `catId`만 null(미지정)로 되돌리고,
  프로필 삭제와 기록 갱신을 `writeBatch`로 묶어 둘 중 하나만 반영되는 상태를 막습니다.
- **문서 id는 클라이언트에서 만듭니다.** 저장 직후 화면이 그 id로 이동해야 해서,
  서버 응답을 기다리지 않아야 오프라인에서도 매끄럽습니다.
- **사진은 Firestore에 메타데이터만.** `blob:` 주소는 다음 세션이면 죽고,
  data URL을 넣으면 문서 1MB 제한에 걸리고 요금도 늡니다.

## 문서 구조

```
users/{uid}
  ├── cats/{catId}        → Cat
  └── records/{recordId}  → FeedRecord
```

Storage 경로

- 기록 사진: `users/{uid}/records/{recordId}/{photoId}.jpg`
- 프로필 사진: `users/{uid}/cats/{catId}/{photoId}.jpg`

## 색인 / 규칙 메모

- 목록 정렬에 `orderBy('createdAt', 'desc')`, `orderBy('rating', 'desc')`를 쓴다면
  브랜드 필터와 조합할 때 복합 색인이 필요합니다 (`brand` + `createdAt` 등).
- 고양이별 필터는 `where('catId', '==', catId)` + `orderBy('createdAt', 'desc')` 조합이라
  복합 색인이 필요합니다.
- 통합 검색(`query`)은 Firestore가 부분일치를 지원하지 않으므로
  클라이언트 필터로 두거나 별도 검색 서비스를 붙여야 합니다.
- 고양이 프로필을 지울 때 해당 `catId`를 참조하는 기록을 어떻게 할지는
  `cats.ts` 주석 참고 (지금 UI는 기록을 남기고 catId만 null로 되돌립니다).

## 보안 — 지금 상태

### 되어 있는 것

- **Firestore 규칙이 실제 방어선입니다.** `firestore.rules`가 `request.auth.uid == userId`를
  확인하므로, 로그인했더라도 **남의 문서는 읽지도 쓰지도 못합니다.** 로그인하지 않았으면
  `request.auth`가 null이라 자동으로 막힙니다.
- 규칙에 적히지 않은 경로는 Firestore가 기본으로 거부합니다.
- `.env.local`은 커밋되지 않습니다(`.gitignore`의 `*.local`).

### 오해하기 쉬운 것

- **`VITE_FIREBASE_*` 값은 비밀이 아닙니다.** 빌드 결과물에 그대로 들어가고 브라우저에서
  누구나 볼 수 있습니다. 원래 그렇게 설계된 값이라, 유출돼도 규칙만 제대로면 남의 데이터는 못 봅니다.
  커밋하지 않는 건 습관과 프로젝트 분리를 위한 것이지 비밀이라서가 아닙니다.

### 배포 전에 해야 할 것 (10번 작업과 함께)

- [ ] **승인된 도메인** — 콘솔 → Authentication → 설정 → 승인된 도메인에
      배포 주소를 추가합니다. 여기 없는 도메인에서는 로그인이 동작하지 않아,
      남이 내 Firebase 프로젝트로 로그인 화면을 흉내 내는 것을 막습니다.
- [ ] **규칙 시뮬레이터로 확인** — 콘솔 → Firestore → 규칙 → 시뮬레이터에서
      `users/남의uid/records/x` 에 다른 uid로 읽기를 시도해 **거부되는지** 직접 확인합니다.
      규칙은 짜는 것보다 "정말 막히는지" 확인하는 게 중요합니다.
- [ ] **예산 알림** — 무료(Spark) 요금제면 한도를 넘으면 멈추므로 요금 사고는 없습니다.
      유료로 올릴 일이 생기면 예산 알림을 먼저 겁니다.

### 지금은 하지 않는 것 (이유와 함께)

- **규칙에서 필드 타입·크기 검증** — 할 수는 있지만 도메인 타입이 바뀔 때마다 규칙도 같이
  고쳐야 해서, 혼자 쓰는 앱에서는 득보다 실이 큽니다. 쓰는 쪽이 앱 하나뿐이라
  타입 검사는 TypeScript가 맡습니다.
- **App Check** — 봇/스크래핑 방어용입니다. 공개 서비스가 되면 그때 답니다.
