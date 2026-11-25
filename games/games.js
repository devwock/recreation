// 게임 목록: games 폴더에 게임 html 을 추가했다면 여기에 한 항목을 등록한다.
// file 은 games 폴더 기준 경로이며, 비워 두면 메인 화면에 '준비 중'으로 표시된다.
// (fetch 로 JSON 을 읽으면 파일을 직접 열었을 때 막히므로 스크립트로 둔다.)
window.GAMES = [
  {
    id: 'zombie',
    icon: '🧟',
    title: '좀비 게임',
    desc: '3라운드 동안 1:1 터치로 감염이 퍼지는 비밀 역할 게임. 치료제 1개로 한 번 되돌릴 수 있습니다.',
    file: 'zombie.html'
  }
];
