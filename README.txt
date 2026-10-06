Google Chat Custom Emoji Enlarger

1. 일반 메시지 커스텀 이모티콘
- 40 / 60 / 80 / 100 / 120px 지원
- IMG 실제 레이아웃 크기 변경
- 상위 메시지 행의 세로 공간 확보
- 가로 width는 강제로 변경하지 않음

2. Reaction 제외
실제 확인된 구조:
.Zoygqc
.YK45Id
.j3630

위 구조에 포함된 이모티콘은 변경하지 않습니다.

3. Reaction Picker / Hover 메뉴 제외
마우스를 메시지 위에 올렸을 때 나타나는 반응 선택 UI도
커스텀 이모티콘 IMG를 포함할 수 있으므로 다음 구조를 제외합니다.

- button
- [role="button"]
- [role="menu"]
- [role="menuitem"]
- [role="dialog"]
- [aria-haspopup="menu"]

4. 동적 UI 대응
- MutationObserver
- 700ms 주기 재검사
- 호버로 UI가 새로 생성되는 경우에도 제외 판정

설치:
21 chrome://extensions
2. 개발자 모드 ON
3. 압축해제된 확장 프로그램 로드
4. Google Chat 새로고침
