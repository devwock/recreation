# 레크리에이션 관리 페이지 — 전체 작업 계획서

## 1. 목표

- 심판 한 명이 PC(또는 태블릿) 한 대를 들고 오프라인 레크리에이션을 진행할 수 있게 돕는 정적 웹 페이지.
- 서버 없이 HTML만으로 동작하고, 필요한 데이터는 브라우저 `localStorage`에 저장한다.
- 배포 주소: `https://devwock.github.io/recreation/`

## 2. 원칙

| 항목 | 내용 |
| --- | --- |
| 기술 | 순수 HTML/CSS/JS. 빌드 도구·프레임워크·외부 라이브러리 없음 |
| 저장 | `localStorage`만 사용. 접근은 항상 `try/catch`로 감싼다 |
| 저장 키 | 반드시 `recreation:<게임id>:<이름>` 접두어. github.io는 같은 계정의 모든 저장소가 한 출처(origin)를 공유하므로 충돌 방지용 |
| 게임 분리 | 게임마다 `games/` 아래 별도 HTML 한 파일. 그 파일만 직접 열어도 동작해야 한다 |
| 오프라인 | `file://`로 열어도 동작해야 한다. 그래서 목록은 JSON `fetch` 대신 `games/games.js` 스크립트로 읽는다 |
| 화면 | 라이트/다크 모드(CSS 변수 + `prefers-color-scheme`), 모바일 폭 대응 |

## 3. 구조

```
index.html          게임 목록(허브). games/games.js 의 window.GAMES 를 카드로 그린다
games/games.js      게임 등록 목록(매니페스트)
games/zombie.html   좀비 게임
games/sword_and_shield.html  검과 방패
work/               작업 계획서
  work.md           (이 문서) 전체 계획
  games/zombie.md   좀비 게임 계획
  games/sword_and_shield.md  검과 방패 계획
  games/sim/        검과 방패 무기 수 시뮬레이션 (node)
README.md
```

### 게임 추가 절차

1. `games/<id>.html` 작성 (단독 실행 가능하게).
2. 상단 뒤로가기 링크는 `../index.html`.
3. `games/games.js`에 `{ id, icon, title, desc, file }` 추가. `file`을 비우면 목록에 "준비 중"으로 표시된다.
4. 저장 키는 `recreation:<id>:...` 형식.
5. `work/games/<id>.md`에 게임별 계획서 작성.

## 4. 진행 현황

| 단계 | 상태 | 비고 |
| --- | --- | --- |
| 허브 페이지(`index.html`) | 완료 | 매니페스트 방식 |
| 좀비 게임 | 완료(1차) | 상세는 `work/games/zombie.md` |
| 검과 방패 | 완료(1차) | 상세는 `work/games/sword_and_shield.md` |
| `.gitignore`, README | 완료 | `.idea/`, `.DS_Store` 제외 |
| `main` 푸시 | 완료 | 커밋 `52bfe77` |
| GitHub Pages 배포 | 완료 | 공개 저장소, `main` / `(root)` |

## 5. 남은 작업

### 5.1 배포

- 완료. 저장소 공개 전환 후 Pages(`main` / `/(root)`) 활성화, 허브와 `games/zombie.html` 모두 HTTP 200 확인.
- `main`에 푸시하면 1~2분 뒤 자동 반영된다.
- 남은 확인: 실제 주소에서 저장/이어하기 동작, 실기기(모바일·태블릿) 화면.

### 5.2 공통 개선 후보 (우선순위 순, 미확정)

1. 게임이 2개 이상이 되면 공통 스타일(색상 변수, 버튼, 카드)을 `games/common.css`로 분리할지 검토.
   - 단, 단독 실행 원칙 때문에 파일 하나만 복사해 가는 용도라면 분리하지 않는 편이 낫다. 게임이 늘 때 결정.
2. 저장 데이터 내보내기/가져오기(JSON 파일) — 기기를 바꿔 이어하기가 필요해질 때만.

## 6. 테스트 방법

- 로직: DOM을 흉내 낸 Node 스크립트로 상태 전이·계산을 검증.
- 화면: 헤드리스 Chrome에 스크립트를 주입해 실제 클릭 흐름을 끝까지 실행하고 콘솔 오류와 스크린샷을 확인.

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=out.png --window-size=1200,1600 file://$PWD/games/zombie.html
```

- 테스트 스크립트는 저장소에 포함하지 않았다. 게임이 늘어 회귀 확인이 잦아지면 `tests/`로 정리해 넣는 것을 검토한다.
