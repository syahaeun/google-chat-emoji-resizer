(function () {
"use strict";

var DEFAULT_SIZE = 60;
var STYLE_ID = "gce-style-v10";

function validSize(n) {
return n === 40 || n === 60 || n === 80 ||
n === 100 || n === 120;
}

function getSize(callback) {
chrome.storage.sync.get(
{ emojiSize: DEFAULT_SIZE },
function (r) {
var n = parseInt(r.emojiSize, 10);

```
    if (!validSize(n)) {
      n = DEFAULT_SIZE;
    }

    callback(n);
  }
);
```

}

/*

* 채팅 메시지 안에 있는 이미지인지 확인합니다.
*
* 핵심:
* 1. Reaction 영역 제외
* 2. Reaction Picker / Hover 메뉴 제외
* 3. 메뉴 / 버튼 / Dialog 제외
* 4. 실제 메시지 영역으로 판단되는 DOM을 찾아야만 확대
     */
     function isChatMessageImage(img) {
     if (!img) {
     return false;
     }

```
if (!img.matches ||
```

```
    !img.matches("img[data-emoji-uuid]")) {
  return false;
}

/*
 * 이미 제외 처리된 경우
 */
if (img.getAttribute("data-gce-excluded") === "1") {
  return false;
}

/*
 * Reaction 및 Reaction Picker 제외
 */
if (isReactionOrPicker(img)) {
  return false;
}

/*
 * Google Chat 메시지 영역을 나타내는 특징을
 * 상위 DOM에서 찾습니다.
 *
 * Google Chat은 화면 구성에 따라 클래스명이 변경될 수 있으므로
 * 여러 가지 메시지 관련 속성을 순차적으로 확인합니다.
 */
var p = img.parentElement;
var level = 0;

while (p && level < 12) {

  /*
   * 명확하게 메시지를 나타내는 data 속성
   */
  if (p.hasAttribute("data-message-id") ||
      p.hasAttribute("data-message-id-for-copy") ||
      p.hasAttribute("data-message-id-for-reply")) {
    return true;
  }

  /*
   * 메시지 관련 aria 속성
   */
  var ariaLabel = p.getAttribute("aria-label");

  if (ariaLabel &&
      (ariaLabel.indexOf("message") >= 0 ||
       ariaLabel.indexOf("Message") >= 0 ||
       ariaLabel.indexOf("메시지") >= 0)) {
    return true;
  }

  /*
   * Google Chat 메시지에서 자주 사용되는
   * 메시지 관련 class 특징을 확인합니다.
   */
  var cls = "";

  if (typeof p.className === "string") {
    cls = p.className;
  }

  if (cls.indexOf("message") >= 0 ||
      cls.indexOf("Message") >= 0) {
    return true;
  }

  p = p.parentElement;
  level++;
}

/*
 * 위 조건을 만족하지 못한 이미지는
 * 채팅 메시지인지 확실하지 않으므로 변경하지 않습니다.
 */
return false;
```

}

/*

* Reaction / Reaction Picker / 메뉴 영역인지 확인
  */
  function isReactionOrPicker(img) {
  if (!img) {
  return true;
  }

```
var p = img.parentElement;
```

```
if (!p) {
  return true;
}

/*
 * 실제 확인된 Reaction DOM
 */
if (p.classList &&
    p.classList.contains("Zoygqc")) {
  return true;
}

if (p.querySelector &&
    p.querySelector(".YK45Id, .j3630")) {
  return true;
}

/*
 * 상위 DOM 검사
 */
if (img.closest) {

  /*
   * Reaction 결과
   */
  if (img.closest(
    ".Zoygqc, .YK45Id, .j3630"
  )) {
    return true;
  }

  /*
   * Reaction Picker
   */
  if (img.closest(
    "button, [role='button']"
  )) {
    return true;
  }

  /*
   * 메뉴 / Dialog
   */
  if (img.closest(
    "[role='menu'], " +
    "[role='menuitem'], " +
    "[role='dialog'], " +
    "[aria-haspopup='menu']"
  )) {
    return true;
  }
}

/*
 * 상위 8단계까지 Reaction 관련 class 확인
 */
p = img.parentElement;

for (var i = 0; p && i < 8; i++) {

  var cls = "";

  if (typeof p.className === "string") {
    cls = p.className;
  }

  if (cls.indexOf("Zoygqc") >= 0 ||
      cls.indexOf("YK45Id") >= 0 ||
      cls.indexOf("j3630") >= 0) {
    return true;
  }

  var role = p.getAttribute("role");

  if (p.tagName === "BUTTON" ||
      role === "button" ||
      role === "menuitem") {
    return true;
  }

  p = p.parentElement;
}

return false;
```

}

function ensureStyle(size) {
var old = document.getElementById(STYLE_ID);

```
if (old) {
  old.remove();
}

var style = document.createElement("style");
style.id = STYLE_ID;

/*
 * 채팅 메시지로 판정된 이미지에만
 * data-gce-chat-image 속성을 부여합니다.
 *
 * 기존처럼 모든 img[data-emoji-uuid]에
 * CSS를 적용하지 않습니다.
 */
style.textContent =
  'img[data-gce-chat-image="1"] {' +
  ' width: ' + size + 'px !important;' +
  ' height: ' + size + 'px !important;' +
  ' min-width: ' + size + 'px !important;' +
  ' min-height: ' + size + 'px !important;' +
  ' max-width: ' + size + 'px !important;' +
  ' max-height: ' + size + 'px !important;' +
  ' object-fit: contain !important;' +
  ' transform: none !important;' +
  ' position: relative !important;' +
  ' z-index: 20 !important;' +
  '}';

(document.head || document.documentElement)
  .appendChild(style);
```

}

function restoreExcluded(img) {
if (!img) {
return;
}

```
img.removeAttribute("data-gce-applied");
img.removeAttribute("data-gce-chat-image");

img.setAttribute(
  "data-gce-excluded",
  "1"
);

img.style.removeProperty("width");
img.style.removeProperty("height");
img.style.removeProperty("min-width");
img.style.removeProperty("min-height");
img.style.removeProperty("max-width");
img.style.removeProperty("max-height");
img.style.removeProperty("object-fit");
img.style.removeProperty("transform");
img.style.removeProperty("position");
img.style.removeProperty("z-index");

/*
 * 이전에 부모에 적용했던 값 제거
 */
var p = img.parentElement;
var level = 1;

while (p && level <= 8) {

  if (p.getAttribute("data-gce-level") === String(level)) {

    p.removeAttribute("data-gce-level");

    p.style.removeProperty("min-height");
    p.style.removeProperty("height");
    p.style.removeProperty("width");
    p.style.removeProperty("min-width");
  }

  p = p.parentElement;
  level++;
}
```

}

function applyToImage(img, size) {

```
if (!img ||
    !img.matches ||
    !img.matches("img[data-emoji-uuid]")) {
  return;
}

/*
 * 채팅 메시지가 아니면 변경하지 않습니다.
 */
if (!isChatMessageImage(img)) {

  /*
   * 이전에 확대했던 이미지가
   * 이후 DOM 변경으로 Reaction 영역이 된 경우
   * 원래 크기로 복구합니다.
   */
  if (img.getAttribute("data-gce-applied")) {
    restoreExcluded(img);
  }

  return;
}

/*
 * 채팅 메시지 이미지로 확정
 */
img.removeAttribute("data-gce-excluded");

img.setAttribute(
  "data-gce-chat-image",
  "1"
);

/*
 * 이미지 크기 적용
 */
img.style.setProperty(
  "width",
  size + "px",
  "important"
);

img.style.setProperty(
  "height",
  size + "px",
  "important"
);

img.style.setProperty(
  "min-width",
  size + "px",
  "important"
);

img.style.setProperty(
  "min-height",
  size + "px",
  "important"
);

img.style.setProperty(
  "max-width",
  size + "px",
  "important"
);

img.style.setProperty(
  "max-height",
  size + "px",
  "important"
);

img.style.setProperty(
  "object-fit",
  "contain",
  "important"
);

img.style.setProperty(
  "transform",
  "none",
  "important"
);

img.style.setProperty(
  "position",
  "relative",
  "important"
);

img.style.setProperty(
  "z-index",
  "20",
  "important"
);

/*
 * 메시지 행 높이 확보
 */
var requiredHeight = size + 20;

var p = img.parentElement;
var level = 1;

while (p && level <= 8) {

  p.style.setProperty(
    "min-height",
    requiredHeight + "px",
    "important"
  );

  p.style.setProperty(
    "height",
    "auto",
    "important"
  );

  /*
   * 가로 width는 강제하지 않습니다.
   */
  p.style.removeProperty("width");

  /*
   * 첫 번째 컨테이너만 최소 폭 확보
   */
  if (level === 1) {

    p.style.setProperty(
      "min-width",
      size + "px",
      "important"
    );
  }

  var cs = getComputedStyle(p);

  if (cs.overflowY === "hidden" ||
      cs.overflowY === "clip") {

    p.style.setProperty(
      "overflow-y",
      "visible",
      "important"
    );
  }

  p.setAttribute(
    "data-gce-level",
    String(level)
  );

  p = p.parentElement;
  level++;
}

img.setAttribute(
  "data-gce-applied",
  String(size)
);
```

}

/*

* 지정된 영역에서만 이미지 검색
  */
  function scan(root, size) {

```
if (!root) {
```

```
  return;
}

var list = [];

if (root.nodeType === 1 &&
    root.matches &&
    root.matches("img[data-emoji-uuid]")) {

  list.push(root);
}

if (root.querySelectorAll) {

  var nodes = root.querySelectorAll(
    "img[data-emoji-uuid]"
  );

  for (var i = 0; i < nodes.length; i++) {
    list.push(nodes[i]);
  }
}

for (var j = 0; j < list.length; j++) {
  applyToImage(
    list[j],
    size
  );
}
```

}

function apply(size) {

```
ensureStyle(size);

/*
 * document 전체를 검색하되,
 * applyToImage에서 실제 채팅 메시지인지
 * 다시 확인합니다.
 *
 * 따라서 메뉴 / Reaction / Picker 등은
 * 실제 확대 대상에서 제외됩니다.
 */
scan(
  document,
  size
);
```

}

/*

* 최초 실행
  */
  getSize(function (size) {
  apply(size);
  });

/*

* 크기 설정 변경
  */
  chrome.storage.onChanged.addListener(
  function (changes, area) {

  if (area !== "sync" ||
  !changes.emojiSize) {
  return;
  }

  var size = parseInt(
  changes.emojiSize.newValue,
  10
  );

  if (!validSize(size)) {
  size = DEFAULT_SIZE;
  }

  apply(size);
  }
  );

/*

* Google Chat은 메시지를 동적으로 생성합니다.
  */
  var observer = new MutationObserver(
  function (mutations) {

  var changed = false;

  for (var i = 0;
  i < mutations.length;
  i++) {

  if (mutations[i].addedNodes.length > 0) {
  changed = true;
  break;
  }
  }

  if (changed) {

  getSize(function (size) {
  scan(
  document,
  size
  );
  });
  }
  }
  );

if (document.documentElement) {

```
observer.observe(
  document.documentElement,
  {
    childList: true,
    subtree: true
  }
);
```

}

/*

* Google Chat에서 호버 상태 변경이나
* 동적 DOM 변경이 발생할 수 있으므로
* 주기적으로 재확인합니다.
  */
  setInterval(
  function () {

  getSize(function (size) {

  scan(
  document,
  size
  );
  });

```
},
```

```
700
```

);

})();
