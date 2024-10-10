// ==UserScript==
// @name         2ch antibot image generator
// @namespace    http://2ch.hk/b
// @match        *://2ch.hk/*
// @author       Anon
// @grant        none
// @version      0.9
// @updateURL  https://ortophius.github.io/2ch-image-by-text-generator/script.js
// @downloadURL  https://ortophius.github.io/2ch-image-by-text-generator/script.js
// ==/UserScript==

(function () {
  let settings = {
    INTERNAL_CANVAS_WIDTH: 900,
    INTERNAL_CANVAS_HEIGHT: 400,
    canvasWidth: 450,
    canvasHeight: "auto",
    removeAfterSubmit: false,
    customFontEnabled: false,
    selectedFont: null,
    selectedFontName: null,
    fontSize: 18,
  };

  const acceptedFontExtensions = ".otf,.ttf,.woff,.woff2";

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
  .ab__hidden {
    display: none;
  }

  .ab__toggle {
    padding: 4px 0px;
  }

  .ab__button {
      padding: 4px 6px;
      border: none;
      background-color: #eaeaea;
      background-color: var(--theme_default_btnbg);
      cursor: pointer;
      border: 1px solid #e0e0e0;
      border: 1px solid var(--theme_default_btnborder);
      transition: background-color .2s ease;
      color: var(--theme_default_btntext);
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

  #ab__submit {
    padding: 4px 6px;
    border: none;
    background-color: #eaeaea;
    background-color: var(--theme_default_btnbg);
    cursor: pointer;
    border: 1px solid #e0e0e0;
    border: 1px solid var(--theme_default_btnborder);
    transition: background-color .2s ease;
    color: var(--theme_default_btntext);
  }

  #ab__font-size {
    width: 45px;
  }

  .ab__footer {
    padding: 0 8px;
  }

  .ab__settings {
    padding: 8px 0;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-auto-rows: 1fr;
    gap: 8px;
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
      <label style="font-family: 'ABCustom';">
        <input id="ab__custom-font-toggle" type="checkbox" ${
          settings.customFontEnabled ? "checked" : ""
        } />
        Кастомный шрифт 
      </label>
      <div>
        <div id="ab__font-selector" class="${
          !settings.customFontEnabled ? "ab__hidden" : ""
        }">
          <div id="ab__selected-font-name">${settings.selectedFontName}</div>
          <input class="ab__button" id="ab__font-button" type="button" value="Выбрать файл (.ttf, .otf, .woff, woff2)" />
          <input type="file" id="ab__font-input" style="display:none" accept="${acceptedFontExtensions}" />
        </div>
      </div>
      <label>
        Размер шрифта
        <input id="ab__font-size" type="number" value="${settings.fontSize}" />
      </label>
        <label>
          <input type="checkbox" id="ab__remove-after-submit" ${
            settings.removeAfterSubmit ? "checked" : ""
          } />
          Удалить текст после добавления
        </label>
      </div>
      <input type="button" id="ab__submit" class="ab__button" value="Добавить">
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
    const useCustomFont = settings.customFontEnabled && !!settings.selectedFont;

    if (useCustomFont) {
      const element = document.createElement("style");
      element.setAttribute("id", "ab__custom-font-style");

      element.innerText = `
        @font-face {
          font-family: "ABCustom";
          src: url(${settings.selectedFont});
        }
      `;

      document.head.appendChild(element);
    }
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

    setInterval(renderCanvas, 300);
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
        const offsetY = (i + 1) * settings.fontSize;
        ctx.fillText(line, 20, offsetY);
      });
    };

    ctx.reset();

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const useCustomFont = settings.customFontEnabled && !!settings.selectedFont;

    ctx.font = `${settings.fontSize}px ${
      useCustomFont ? "ABCustom" : "sans-serif"
    }`;

    ctx.fillStyle = "black";
    renderText();
  };

  const handleCommentChange = () => {
    const commentBox = getElement(replyWindow, "textarea#qr-shampoo");
    const text = commentBox.value;
    commentText = text;
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
    saveOpt("removeAfterSubmit", isChecked);
  };

  const handleFontSizeChange = (e) => {
    const { value } = e.currentTarget;
    saveOpt("fontSize", Number(value) || 18);
    renderCanvas();
  };

  const applyFont = () => {
    const font = settings.selectedFont;
    const fontName = settings.selectedFontName;
    const fontNameElement = getElement(replyWindow, "#ab__selected-font-name");

    let styleElement = document.querySelector("#ab__custom-font-style");

    if (!styleElement) {
      const element = document.createElement("style");
      element.setAttribute("id", "ab__custom-font-style");
      document.head.appendChild(element);
      styleElement = element;
    }

    styleElement.innerText = `
      @font-face {
        font-family: "ABCustom";
        src: url(${font});
      }
    `;

    fontNameElement.innerText = fontName;

    setTimeout(renderCanvas, 2000);
  };

  const handleToggleCustomFont = (e) => {
    const fontSettingsElement = getElement(replyWindow, "#ab__font-selector");
    const { checked } = e.currentTarget;
    saveOpt("customFontEnabled", checked);

    if (checked) {
      fontSettingsElement.classList.remove("ab__hidden");
    } else fontSettingsElement.classList.add("ab__hidden");

    if (!!settings.selectedFont) applyFont();
  };

  const handleSelectFont = () => {
    const fontInput = getElement(replyWindow, "#ab__font-input");

    fontInput.click();
  };

  const handleChangeFontFile = (e) => {
    const file = e.currentTarget.files[0];
    const filename = file.name.match(/^(.*)\..*$/)[1] || "";
    const reader = new FileReader();

    reader.onload = (e) => {
      saveOpt("selectedFont", e.target.result);
      saveOpt("selectedFontName", filename);
      applyFont();
    };

    reader.readAsDataURL(file);
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

    const fontSizeInput = getElement(replyWindow, "#ab__font-size");
    fontSizeInput.addEventListener("change", handleFontSizeChange);

    const toggleCustomFontElement = getElement(
      replyWindow,
      "#ab__custom-font-toggle"
    );
    toggleCustomFontElement.addEventListener("change", handleToggleCustomFont);

    const updateSelectedFontButton = getElement(
      replyWindow,
      "#ab__font-button"
    );
    updateSelectedFontButton.addEventListener("click", handleSelectFont);

    const fontfileInput = getElement(replyWindow, "#ab__font-input");
    fontfileInput.addEventListener("change", handleChangeFontFile);

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
