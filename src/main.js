import { initStopwatchChallenge } from "./stopwatchChallenge.js";

const stageEl = document.getElementById("game-container");
const panelEl = document.getElementById("game-panel");
const helpDialog = document.getElementById("help-dialog");
const showHelpBtn = document.getElementById("show-help");
const closeHelpBtn = document.getElementById("close-help");

const gameMeta = {
  title: "ターゲット時間に合わせよう",
  summary: "1/1000秒単位まで表示されるタイマーで、集中力と時間感覚を研ぎ澄まします。",
  controls: "クリックのみ",
  instructions: [
    "スタートで計測開始、狙ったタイミングでストップ。",
    "ターゲットは2〜5秒から手動またはランダムで設定。",
    "安定してきたら“集中モード”をオンにして挑戦。",
  ],
};

const renderPanel = (meta) => {
  const listItems = meta.instructions.map((line) => `<li>${line}</li>`).join("");
  panelEl.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="panel-kicker">Precision Stopwatch Drill</p>
        <h3>${meta.title}</h3>
        <p class="lead">${meta.summary}</p>
      </div>
      <div class="tag-row">
        <span class="pill">Focus</span>
        <span class="pill pill-muted">Micro Timing</span>
        <span class="pill pill-outline">UX Polished</span>
      </div>
    </div>
    <div class="panel-body">
      <div>
        <h4>操作</h4>
        <p>${meta.controls}</p>
        <h4>ルール</h4>
        <ol>${listItems}</ol>
      </div>
      <div class="scoreboard metric-grid"></div>
    </div>
    <div class="history-card">
      <div class="history-header">
        <h4>チャレンジ履歴</h4>
        <span>直近5件</span>
      </div>
      <ul class="history-list"></ul>
    </div>
    <div class="status-line"></div>
  `;
  return {
    scoreboard: panelEl.querySelector(".scoreboard"),
    statusLine: panelEl.querySelector(".status-line"),
    historyList: panelEl.querySelector(".history-list"),
  };
};

const { scoreboard, statusLine, historyList } = renderPanel(gameMeta);

const setStats = (rows) => {
  scoreboard.innerHTML = rows
    .map(
      (row) => `
        <div class="score-row">
          <span>${row.label}</span>
          <strong>${row.value}</strong>
        </div>`
    )
    .join("");
};

const setStatus = (text) => {
  statusLine.textContent = text;
};

const setHistory = (items) => {
  if (!items.length) {
    historyList.innerHTML = `<li class="history-empty">まだ記録がありません。</li>`;
    return;
  }
  historyList.innerHTML = items
    .map(
      (item) => `
        <li class="history-item ${item.tone ?? ""}">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </li>`
    )
    .join("");
};

initStopwatchChallenge({
  stage: stageEl,
  setStats,
  setStatus,
  setHistory,
});

showHelpBtn?.addEventListener("click", () => {
  if (typeof helpDialog?.showModal === "function") {
    helpDialog.showModal();
  }
});

closeHelpBtn?.addEventListener("click", () => helpDialog?.close());

