(function () {
  "use strict";

  var DEFAULT_SIZE = 60;
  var buttons = document.querySelectorAll(
    "button[data-size]"
  );
  var status = document.getElementById("status");

  function update(size) {
    for (var i = 0; i < buttons.length; i++) {
      var n = parseInt(
        buttons[i].getAttribute("data-size"),
        10
      );

      if (n === size) {
        buttons[i].classList.add("selected");
      } else {
        buttons[i].classList.remove("selected");
      }
    }

    status.textContent =
      "현재 설정: " + size + "px";
  }

  chrome.storage.sync.get(
    { emojiSize: DEFAULT_SIZE },
    function (r) {
      var n = parseInt(r.emojiSize, 10);

      if ([40, 60, 80, 100, 120].indexOf(n) < 0) {
        n = DEFAULT_SIZE;
      }

      update(n);
    }
  );

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener(
      "click",
      function () {
        var n = parseInt(
          this.getAttribute("data-size"),
          10
        );

        chrome.storage.sync.set(
          { emojiSize: n },
          function () {
            update(n);
          }
        );
      }
    );
  }
})();