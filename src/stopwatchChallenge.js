const randomTarget = () => (Math.random() * 3 + 2).toFixed(2);

const gradeFromDiff = (diff) => {
  if (diff < 0.05) return "S";
  if (diff < 0.12) return "A";
  if (diff < 0.25) return "B";
  return "C";
};

export function initStopwatchChallenge({ stage, setStats, setStatus, setHistory }) {
  stage.innerHTML = `
    <div class="game-area stopwatch-area">
      <div class="time-halo">
        <div class="halo-glow"></div>
        <p class="time-label">elapsed</p>
        <div class="time-display">0.000s</div>
        <p class="time-sub">seconds</p>
      </div>
      <div class="ghost-summary">
        <div>
          <span>ターゲット</span>
          <strong class="ghost-value">0.00s</strong>
        </div>
        <button class="focus-toggle" data-action="focus">
          集中モード: <strong>OFF</strong>
        </button>
      </div>
      <div class="time-gauge">
        <div class="time-gauge-fill"></div>
      </div>
      <div class="celebration-layer" aria-live="polite">
        <p class="celebration-title"></p>
        <p class="celebration-sub"></p>
      </div>
    </div>
    <div class="game-controls stacked">
      <div class="primary-controls">
        <button class="primary" data-action="start-stop">スタート</button>
        <button class="secondary" data-action="new-target">ランダムターゲット</button>
      </div>
      <div class="target-tuner">
        <label>
          ターゲット微調整 (秒)
          <input type="range" min="2" max="5" step="0.05" value="3.00" data-action="tuner" />
        </label>
        <span class="tuner-value">3.00s</span>
      </div>
    </div>
  `;

  const display = stage.querySelector(".time-display");
  const ghost = stage.querySelector(".ghost-value");
  const startStopBtn = stage.querySelector('[data-action="start-stop"]');
  const newTargetBtn = stage.querySelector('[data-action="new-target"]');
  const tunerInput = stage.querySelector('[data-action="tuner"]');
  const tunerValue = stage.querySelector(".tuner-value");
  const focusBtn = stage.querySelector('[data-action="focus"]');
  const gaugeFill = stage.querySelector(".time-gauge-fill");
  const halo = stage.querySelector(".time-halo");
  const celebrationLayer = stage.querySelector(".celebration-layer");
  const celebrationTitle = celebrationLayer.querySelector(".celebration-title");
  const celebrationSub = celebrationLayer.querySelector(".celebration-sub");

  let target = Number(randomTarget());
  let running = false;
  let focusMode = false;
  let startTime = 0;
  let timerId = 0;
  let bestDiff = null;
  let attempts = 0;
  let celebrationTimer = 0;
  const recentAttempts = [];
  const celebrationTones = ["tone-s", "tone-a", "tone-b", "tone-best"];
  const gradeEmojis = { S: "🌟", A: "✨", B: "👍", C: "💪" };

  const syncTarget = () => {
    ghost.textContent = `${target.toFixed(2)}s`;
    tunerInput.value = target.toFixed(2);
    tunerValue.textContent = `${target.toFixed(2)}s`;
  };

  const updateGauge = (progress) => {
    gaugeFill.style.setProperty("--progress", Math.min(progress, 1.2));
  };

  const showCelebration = (title, subtitle, tone = "tone-a") => {
    celebrationTones.forEach((cls) => celebrationLayer.classList.remove(cls));
    celebrationLayer.classList.add("show", tone);
    celebrationTitle.textContent = title;
    celebrationSub.textContent = subtitle;
    clearTimeout(celebrationTimer);
    celebrationTimer = setTimeout(() => {
      celebrationLayer.classList.remove("show");
    }, 1600);
  };

  const hideCelebration = () => {
    celebrationLayer.classList.remove("show");
    celebrationTones.forEach((cls) => celebrationLayer.classList.remove(cls));
    clearTimeout(celebrationTimer);
  };

  const pushHistory = (elapsed, diff) => {
    const grade = gradeFromDiff(diff);
    recentAttempts.unshift({
      label: `#${attempts} ${elapsed.toFixed(3)}s`,
      value: `${diff.toFixed(3)}s ・ ${grade} ${gradeEmojis[grade] ?? ""}`,
      tone: grade === "S" ? "tone-positive" : grade === "A" ? "tone-bright" : "",
    });
    if (recentAttempts.length > 5) recentAttempts.pop();
    setHistory(recentAttempts);
  };

  const renderStats = (diff = null) => {
    const gradeText = diff !== null ? `${gradeFromDiff(diff)} (${diff.toFixed(3)}s)` : "-";
    setStats([
      { label: "Target", value: `${target.toFixed(2)}s` },
      { label: "Attempts", value: attempts },
      {
        label: "Best Diff",
        value: bestDiff !== null ? `${bestDiff.toFixed(3)}s` : "-",
      },
      { label: "Last Grade", value: gradeText },
    ]);
  };

  const resetTimer = () => {
    running = false;
    startTime = 0;
    cancelAnimationFrame(timerId);
    display.textContent = "0.000s";
    startStopBtn.textContent = "スタート";
    updateGauge(0);
    halo.classList.remove("pulse");
    hideCelebration();
  };

  const updateDisplay = () => {
    if (!running) return;
    const elapsed = (performance.now() - startTime) / 1000;
    if (focusMode) {
      display.textContent = "…集中…";
    } else {
      display.textContent = `${elapsed.toFixed(3)}s`;
    }
    updateGauge(elapsed / target);
    timerId = requestAnimationFrame(updateDisplay);
  };

  const evaluate = () => {
    const elapsed = (performance.now() - startTime) / 1000;
    const diff = Math.abs(elapsed - target);
    attempts += 1;
    bestDiff = bestDiff === null ? diff : Math.min(bestDiff, diff);
    renderStats(diff);
    pushHistory(elapsed, diff);

    const grade = gradeFromDiff(diff);
    if (diff <= bestDiff + Number.EPSILON) {
      showCelebration("Best 更新！", `±${diff.toFixed(3)}s`, "tone-best");
    }

    if (grade === "S") {
      setStatus("神業！ほぼ誤差ゼロ。");
      showCelebration("S RANK", `ズレ ±${diff.toFixed(3)}s`, "tone-s");
    } else if (grade === "A") {
      setStatus("かなりいい感覚です。");
      showCelebration("リズム良好", `±${diff.toFixed(3)}s`, "tone-a");
    } else if (grade === "B") {
      setStatus("悪くない！リズムを安定させよう。");
      showCelebration("Nice Try", `±${diff.toFixed(3)}s`, "tone-b");
    } else {
      setStatus("差が開きました。呼吸を整えて再挑戦。");
    }
    display.textContent = `${elapsed.toFixed(3)}s`;
    halo.classList.add("pulse");
    setTimeout(() => halo.classList.remove("pulse"), 600);
  };

  const handleStartStop = () => {
    if (!running) {
      running = true;
      startTime = performance.now();
      startStopBtn.textContent = "ストップ";
      setStatus("ターゲット時間を頭の中でカウント。");
      halo.classList.add("active");
      timerId = requestAnimationFrame(updateDisplay);
    } else {
      running = false;
      startStopBtn.textContent = "スタート";
      cancelAnimationFrame(timerId);
      halo.classList.remove("active");
      evaluate();
    }
  };

  const handleNewTarget = () => {
    target = Number(randomTarget());
    syncTarget();
    setStatus("ランダムなターゲットに更新しました。");
    resetTimer();
    renderStats();
  };

  const handleTuner = (event) => {
    target = Number(event.target.value);
    syncTarget();
    setStatus("ターゲットを微調整しました。");
    resetTimer();
    renderStats();
  };

  const handleFocusToggle = () => {
    focusMode = !focusMode;
    focusBtn.innerHTML = `集中モード: <strong>${focusMode ? "ON" : "OFF"}</strong>`;
    stage
      .querySelector(".stopwatch-area")
      .classList.toggle("focus-active", focusMode);
    if (focusMode) {
      showCelebration("集中モード", "表示を隠して感覚だけで狙おう。", "tone-a");
    } else {
      hideCelebration();
    }
  };

  syncTarget();
  renderStats();
  setHistory([]);
  setStatus("スタートを押してターゲット時間を狙おう。");

  startStopBtn.addEventListener("click", handleStartStop);
  newTargetBtn.addEventListener("click", handleNewTarget);
  tunerInput.addEventListener("input", handleTuner);
  focusBtn.addEventListener("click", handleFocusToggle);

  return () => {
    cancelAnimationFrame(timerId);
    clearTimeout(celebrationTimer);
    startStopBtn.removeEventListener("click", handleStartStop);
    newTargetBtn.removeEventListener("click", handleNewTarget);
    tunerInput.removeEventListener("input", handleTuner);
    focusBtn.removeEventListener("click", handleFocusToggle);
  };
}


