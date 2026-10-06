(function () {
  "use strict";

  var DEFAULT_SIZE = 60;
  var STYLE_ID = "gce-style-v9";

  function validSize(n) {
    return n === 40 || n === 60 || n === 80 ||
           n === 100 || n === 120;
  }

  function getSize(callback) {
    chrome.storage.sync.get({ emojiSize: DEFAULT_SIZE }, function (r) {
      var n = parseInt(r.emojiSize, 10);

      if (!validSize(n)) {
        n = DEFAULT_SIZE;
      }

      callback(n);
    });
  }

  /*
   * 반응(Reaction) 또는 반응 선택창에 표시되는 이모티콘인지 확인합니다.
   *
   * 실제 확인된 반응 구조:
   * .Zoygqc
   *   img[data-emoji-uuid]
   *   .YK45Id
   *     .j3630
   *
   * 추가로 호버 시 나타나는 반응 선택창은
   * 커스텀 이모티콘 IMG를 버튼/role=button 내부에 배치할 수 있으므로
   * button 및 role=button 계열도 확대 대상에서 제외합니다.
   */
  function isExcluded(img) {
    if (!img) {
      return true;
    }

    /*
     * 이미 제외 대상으로 판정한 경우
     */
    if (img.getAttribute("data-gce-excluded") === "1") {
      return true;
    }

    var p = img.parentElement;

    if (!p) {
      return true;
    }

    /*
     * 실제 Reaction DOM
     */
    if (p.classList &&
        p.classList.contains("Zoygqc")) {
      return true;
    }

    if (p.querySelector &&
        p.querySelector(".YK45Id, .j3630")) {
      return true;
    }

    if (img.closest) {
      /*
       * Reaction 결과
       */
      if (img.closest(".Zoygqc, .YK45Id, .j3630")) {
        return true;
      }

      /*
       * 호버 반응 선택창에서 각 반응은 보통
       * button 또는 role=button 요소 안에 존재합니다.
       *
       * 일반 메시지 본문의 커스텀 이모티콘은
       * 이 구조를 사용하지 않는 것을 기준으로 합니다.
       */
      if (img.closest("button, [role='button']")) {
        return true;
      }

      /*
       * 팝업/메뉴 내부에 있는 이모티콘은
       * 메시지 본문이 아니므로 제외합니다.
       */
      if (img.closest(
        "[role='menu'], [role='menuitem'], " +
        "[role='dialog'], [aria-haspopup='menu']"
      )) {
        return true;
      }
    }

    /*
     * 상위 8단계까지 검사하여 반응 UI의 특징을 찾습니다.
     */
    p = img.parentElement;

    for (var i = 0; p && i < 8; i++) {
      var cls = "";

      if (typeof p.className === "string") {
        cls = p.className;
      }

      /*
       * 알려진 Reaction 컨테이너
       */
      if (cls.indexOf("Zoygqc") >= 0 ||
          cls.indexOf("YK45Id") >= 0 ||
          cls.indexOf("j3630") >= 0) {
        return true;
      }

      /*
       * 클릭 가능한 호버 UI의 경우
       */
      var role = p.getAttribute("role");

      if (p.tagName === "BUTTON" ||
          role === "button" ||
          role === "menuitem") {
        return true;
      }

      p = p.parentElement;
    }

    return false;
  }

  function ensureStyle(size) {
    var old = document.getElementById(STYLE_ID);

    if (old) {
      old.remove();
    }

    var style = document.createElement("style");
    style.id = STYLE_ID;

    /*
     * data-gce-excluded가 붙은 이미지는 CSS에서도 제외합니다.
     */
    style.textContent =
      'img[data-emoji-uuid]:not([data-gce-excluded]) {' +
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
      ' }';

    (document.head || document.documentElement).appendChild(style);
  }

  function restoreExcluded(img) {
    /*
     * 이전 스캔에서 확대되었던 요소가
     * 호버 UI로 판정되는 경우 기존 변경값을 제거합니다.
     */
    img.removeAttribute("data-gce-applied");
    img.setAttribute("data-gce-excluded", "1");

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
     * 이전에 부모에 적용했던 값도 제거합니다.
     * Reaction/호버 메뉴는 레이아웃을 건드리면 안 됩니다.
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
  }

  function applyToImage(img, size) {
    if (!img ||
        !img.matches ||
        !img.matches("img[data-emoji-uuid]")) {
      return;
    }

    /*
     * Reaction 및 Reaction Picker는 절대 변경하지 않습니다.
     */
    if (isExcluded(img)) {
      restoreExcluded(img);
      return;
    }

    img.removeAttribute("data-gce-excluded");

    /*
     * LEVEL 0 IMG
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
     * 메시지 행의 높이만 확보합니다.
     * 가로 width는 강제하지 않습니다.
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
       * v8과 동일하게 가로 width는 변경하지 않습니다.
       */
      p.style.removeProperty("width");

      /*
       * 첫 번째 컨테이너에는 최소 폭만 확보합니다.
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
  }

  function scan(root, size) {
    if (!root) {
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
      applyToImage(list[j], size);
    }
  }

  function apply(size) {
    ensureStyle(size);
    scan(document, size);
  }

  getSize(function (size) {
    apply(size);
  });

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
   * Google Chat은 메시지와 호버 UI를 동적으로 생성합니다.
   */
  var observer = new MutationObserver(
    function (mutations) {
      var changed = false;

      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          changed = true;
          break;
        }
      }

      if (changed) {
        getSize(function (size) {
          scan(document, size);
        });
      }
    }
  );

  if (document.documentElement) {
    observer.observe(
      document.documentElement,
      {
        childList: true,
        subtree: true
      }
    );
  }

  /*
   * 호버 상태가 바뀌면서 기존 DOM 요소의 위치/구조가
   * 변경되는 경우도 있으므로 주기적으로 재확인합니다.
   */
  setInterval(function () {
    getSize(function (size) {
      scan(document, size);
    });
  }, 700);
})();
