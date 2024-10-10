// ==UserScript==
// @name         2ch antibot image generator
// @namespace    http://2ch.hk/b
// @match        *://2ch.hk/*
// @version      2024-10-09
// @author       Anon
// @grant        none
// @version      0.1.0
// @downloadURL  https://raw.githubusercontent.com/ortophius/2ch-image-by-text-generator/refs/heads/main/script.js
// ==/UserScript==

(function () {
  let settings = {
    INTERNAL_CANVAS_WIDTH: 900,
    INTERNAL_CANVAS_HEIGHT: 400,
    canvasWidth: 450,
    canvasHeight: "auto",
    removeAfterSubmit: false,
  };

  const loadSettings = () => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem("__ab"));
      Object.assign(settings, savedSettings);
    } catch (e) {
      localStorage.setItem("__ab", JSON.stringify(settings));
    }
  };

  const getOpt = (key) => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem("__ab"));
      return savedSettings[key];
    } catch (e) {
      return settings[key];
    }
  };

  const saveOpt = (key, value) => {
    settings[key] = value;
    localStorage.setItem("__ab", JSON.stringify(settings));
  };

  let commentText = "";
  let canvasWidth = settings.INTERNAL_CANVAS_WIDTH;
  let canvasHeight = settings.INTERNAL_CANVAS_HEIGHT;

  const FormFiles = window.FormFiles;

  loadSettings();

  const styles = `
  .ab__toggle {
    padding: 4px 0px;
  }

  .ab__main {
    padding-bottom: 8px;
  }

  .ab__main_hidden {
    display: none;
  }

  .ab__preview {
    position: relative;
    display: inline-block;
    font-size: 0;
  }

  #ab__canvas {
    border: 1px solid grey;
  }

  #ab__canvas-resize {
    position: absolute;
    width: 24px;
    height: 24px;
    right: 0px;
    bottom: 0px;
    padding: 4px;
    background-color: #677e9380;
    cursor: pointer;
    transition: background-color 0.1s;
  }

  #ab__canvas-resize:hover {
    background-color: #657a8dd1;
  }

  .ab__footer {
    padding: 0 8px;
  }

  .ab__settings {
    padding: 8px 0;
  }
`;

  const toggleHTML = `
<div class="ab__toggle">
  <label>
    <input type="checkbox" id="ab_toggle_checkbox" />
    Антибот
    </label>
</div>
`;

  const mainHTML = `
  <div class="ab__main ab__main_hidden">
    <div class="ab__preview">
      <div id="ab__canvas-resize"><svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <g fill="#ffffff" fill-rule="evenodd">
            <path d="m5.075 6.95 1.843-1.862-2.98-3.026 2.017-2.044h-5.903v5.986l2.046-2.076z"/>
            <path d="m16.0034788 9.916-2.1714788 2.097-3.033-3.053-1.881 1.881 3.039 3.056-1.996 2.0843842h6.0424788z"/>
          </g>
        </svg>
      </div>
      <canvas id="ab__canvas" width="${canvasWidth}" height="${canvasHeight}" />
    </div>
    <div class="ab__footer">
      <div class="ab__settings">
        <label>
          <input type="checkbox" id="ab__remove-after-submit" ${
            settings.removeAfterSubmit ? "checked" : ""
          } />
          Удалить текст после добавления
        </label>
      </div>
      <button id="ab__submit" class="button">Добавить</button>
    </div>
  </div>`;

  /**
   *
   * @param {HTMLElement} parent
   * @param {string} selector
   * @returns {HTMLElement}
   */

  const getElement = (parent, selector) => {
    const element = parent.querySelector(selector);
    if (!element) throw "No specified element found, terminating";
    return element;
  };

  const replyWindow = getElement(document, ".qr_reply");

  const applyStyles = () => {
    const style = document.createElement("style");
    style.innerText = styles;
    document.head.appendChild(style);
  };

  const handleCanvasResizeClick = (e) => {
    document.body.style.userSelect = "none";
    const canvasElement = getElement(replyWindow, "#ab__canvas");
    const currentWidth = Number(
      canvasElement.style.width.replace(/[^0-9]/g, "")
    );
    const offsetX = e.screenX;

    // To-do: add vertical scaling
    // const offsetY = e.screnY;

    const moveHandler = (e) => {
      const delta = e.screenX - offsetX;

      canvasElement.setAttribute(
        "style",
        `width: ${currentWidth + delta}px; height: auto; min-width: 100px`
      );
    };

    document.addEventListener("mousemove", moveHandler);
    document.addEventListener(
      "mouseup",
      () => {
        document.removeEventListener("mousemove", moveHandler);
        document.body.style.userSelect = "auto";
      },
      { once: true }
    );
  };

  const setupCanvas = () => {
    const canvas = getElement(replyWindow, "#ab__canvas");
    const resizeElement = getElement(replyWindow, "#ab__canvas-resize");

    canvas.setAttribute("style", `width: 450px;height: auto`);

    resizeElement.addEventListener("mousedown", handleCanvasResizeClick);
  };

  const renderCanvas = () => {
    let currentPosition = 20;
    const canvas = getElement(replyWindow, "#ab__canvas");
    const ctx = canvas.getContext("2d");
    const whiteSpaceWidth = ctx.measureText(" ").width;

    const renderText = () => {
      const inputLines = commentText.split("\n");
      const outputLines = [];
      let lineIndex = 0;

      inputLines.forEach((line) => {
        const words = line.split(/(?<=[^\s])\s/);
        words.forEach((word) => {
          const { width } = ctx.measureText(word);

          if (currentPosition + width > canvasWidth - 20) {
            lineIndex++;
            currentPosition = 20 + width;
          } else {
            currentPosition += width + whiteSpaceWidth;
          }

          outputLines[lineIndex] = `${outputLines[lineIndex] || ""}${
            !!outputLines[lineIndex] ? " " : ""
          }${word}`;
        });
        lineIndex++;
        currentPosition = 20;
      });

      outputLines.forEach((line, i) => {
        const fontHeight = 16;
        const offsetY = (i + 1) * fontHeight;
        ctx.fillText(line, 20, offsetY);
      });
    };

    ctx.reset();

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.font = "16px sans-serif";
    ctx.fillStyle = "black";
    renderText();
  };

  const handleCommentChange = () => {
    const commentBox = getElement(replyWindow, "textarea#qr-shampoo");
    const text = commentBox.value;
    commentText = text;
    renderCanvas();
  };

  const handleToggle = (e) => {
    const isChecked = e.currentTarget.checked;
    const main = getElement(replyWindow, ".ab__main");

    if (isChecked) {
      main.classList.remove("ab__main_hidden");
      handleCommentChange();
    } else {
      main.classList.add("ab__main_hidden");
    }
  };

  const handleRemoveAfterSubmitToggle = (e) => {
    const isChecked = e.currentTarget.checked;
    saveOpt(removeAfterSubmit, isChecked);
  };

  const handleSubmit = () => {
    const canvas = getElement(replyWindow, "#ab__canvas");
    canvas.toBlob((blob) => {
      const file = new File([blob], "test.png");
      FormFiles.addMultiFiles([file]);
    });

    if (settings.removeAfterSubmit) {
      const commentBox = getElement(replyWindow, "#qr-shampoo");
      commentBox.value = "";
    }
  };

  const init = () => {
    applyStyles();
    const postArea = getElement(replyWindow, ".postarea");

    postArea.insertAdjacentHTML("beforebegin", toggleHTML);
    postArea.insertAdjacentHTML("beforebegin", mainHTML);
    const toggle = getElement(replyWindow, "#ab_toggle_checkbox");
    toggle.addEventListener("change", handleToggle);
    const commentBox = getElement(replyWindow, "textarea#qr-shampoo");
    commentBox.addEventListener("input", handleCommentChange);

    const submitRemoveCheckbox = getElement(
      replyWindow,
      "#ab__remove-after-submit"
    );

    submitRemoveCheckbox.addEventListener(
      "change",
      handleRemoveAfterSubmitToggle
    );

    const submitButton = getElement(replyWindow, "#ab__submit");
    submitButton.addEventListener("click", handleSubmit);

    setupCanvas();
  };

  if (document.readyState == "interactive") {
    init();
  } else {
    document.addEventListener("readystatechange", function (event) {
      if (document.readyState == "interactive") {
        init();
      }
    });
  }
})();
