# recreation

레크리에이션 진행용 정적 웹페이지입니다. 빌드 없이 HTML만으로 동작하고, 데이터는 브라우저 로컬스토리지에 저장합니다.

- 배포: https://devwock.github.io/recreation/

## 구조

```
index.html        게임 목록 (games/games.js 를 읽어 표시)
games/games.js    게임 목록 등록 파일
games/*.html      각 게임 (단독으로 열어도 동작)
```

새 게임은 `games/` 에 html 을 추가하고 `games/games.js` 에 한 항목을 등록합니다.

로컬스토리지 키는 같은 github.io 도메인의 다른 페이지와 겹치지 않도록 `recreation:` 접두어를 붙입니다.

## 게임

- **좀비 게임** (`games/zombie.html`): 3라운드 동안 1:1 터치로 감염이 퍼지는 비밀 역할 게임. 심판 PC 한 대로 진행합니다.
- **검과 방패** (`games/sword_and_shield.html`): Verita·Falso 두 팀이 무기를 선언만으로 쓰는 블러핑 게임. 6~20명, 리더가 죽으면 패배.
