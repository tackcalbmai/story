(() => {
  "use strict";

  const ASSETS = {
    train: "https://cdn.creativeclaw.co/u/ce56d390/images/11c80fff-5ec1-4139-9151-2d3688d10bc2.png",
    bag: "https://cdn.creativeclaw.co/u/ce56d390/images/8c0a0b44-a788-4c64-872c-dd662c7df9db.png",
    recorder: "https://cdn.creativeclaw.co/u/ce56d390/images/8df5dfd5-0375-494b-99f0-2541540d4b46.png",
    ownerVoice: "https://cdn.creativeclaw.co/u/ce56d390/audio/ca1d9628-d2c3-4a59-87e5-39e0bee3af5b.mp3",
    manRecorded: "https://cdn.creativeclaw.co/u/ce56d390/audio/21becc01-5f79-473d-bdb0-fe5561d05ad0.mp3",
    manLive: "https://cdn.creativeclaw.co/u/ce56d390/audio/60bd1d81-7afb-4656-993e-da78ef7bdd5c.mp3",
  };

  const TELEMETRY_URL = "https://bosjlvrsgayngbcnzjzk.supabase.co/functions/v1/story-playtest";
  const STORAGE_KEY = "between-stations-workprint-v1";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const ui = {
    app: $("#app"), gate: $("#gate"), experience: $("#experience"), chapter: $("#chapter"),
    objective: $("#objective"), twoCountries: $("#twoCountries"), dialogue: $("#dialogue"),
    speaker: $("#speaker"), line: $("#line"), ticketTask: $("#ticketTask"), ticket: $("#ticket"),
    scanner: $("#scanner"), bagTask: $("#bagTask"), bag: $("#bag"), bagTarget: $("#bagTarget"),
    recLed: $("#recLed"), recorderPanel: $("#recorderPanel"), deviceState: $("#deviceState"),
    deviceTime: $("#deviceTime"), controlHint: $("#controlHint"), soundCaption: $("#soundCaption"),
    orderPuzzle: $("#orderPuzzle"), orderSlots: $("#orderSlots"), orderChoices: $("#orderChoices"),
    checkOrder: $("#checkOrder"), orderResult: $("#orderResult"), recordingScene: $("#recordingScene"),
    recordingText: $("#recordingText"), continueRecording: $("#continueRecording"), voiceMatch: $("#voiceMatch"),
    workprintEnd: $("#workprintEnd"), choiceConsequence: $("#choiceConsequence"), motionWash: $("#motionWash"),
    trainBackground: $("#trainBackground"), soundToggle: $("#soundToggle"),
  };

  const state = {
    phase: "gate", sound: true, audio: null, master: null,
    remoteAudio: null, controlStep: 0, order: [],
    session: localStorage.getItem("story-session") || crypto.randomUUID(),
  };
  localStorage.setItem("story-session", state.session);

  ui.trainBackground.src = ASSETS.train;
  ui.bag.querySelector("img").src = ASSETS.bag;
  ui.recorderPanel.querySelector("img").src = ASSETS.recorder;

  function setPhase(phase) {
    state.phase = phase;
    ui.app.dataset.phase = phase;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ phase, sound: state.sound }));
    logEvent("phase", { phase });
  }

  async function logEvent(event, detail = {}) {
    if (!TELEMETRY_URL) return;
    const payload = { session_id: state.session, event_name: event, scene: state.phase, detail };
    try {
      await fetch(TELEMETRY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Story-Client": "between-stations-workprint-01",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch { /* logging never blocks the story */ }
  }

  function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  async function ensureAudio() {
    if (state.audio) {
      if (state.audio.state === "suspended") await state.audio.resume();
      return;
    }
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    state.audio = new Context();
    state.master = state.audio.createGain();
    state.master.gain.value = state.sound ? .72 : 0;
    state.master.connect(state.audio.destination);
  }

  function tone(frequency, duration = .12, gain = .06, delay = 0, type = "sine") {
    if (!state.audio || !state.master) return;
    const t = state.audio.currentTime + delay;
    const oscillator = state.audio.createOscillator();
    const volume = state.audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, t);
    volume.gain.setValueAtTime(.0001, t);
    volume.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), t + .012);
    volume.gain.exponentialRampToValueAtTime(.0001, t + duration);
    oscillator.connect(volume).connect(state.master);
    oscillator.start(t);
    oscillator.stop(t + duration + .03);
  }

  function noise(duration = .18, gain = .08, cutoff = 900, delay = 0) {
    if (!state.audio || !state.master) return;
    const length = Math.floor(state.audio.sampleRate * duration);
    const buffer = state.audio.createBuffer(1, length, state.audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = state.audio.createBufferSource();
    const filter = state.audio.createBiquadFilter();
    const volume = state.audio.createGain();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    volume.gain.value = gain;
    source.buffer = buffer;
    source.connect(filter).connect(volume).connect(state.master);
    source.start(state.audio.currentTime + delay);
  }

  function thump(delay = 0, gain = .13, pitch = 90) {
    if (!state.audio || !state.master) return;
    const t = state.audio.currentTime + delay;
    const oscillator = state.audio.createOscillator();
    const volume = state.audio.createGain();
    oscillator.frequency.setValueAtTime(pitch, t);
    oscillator.frequency.exponentialRampToValueAtTime(38, t + .16);
    volume.gain.setValueAtTime(gain, t);
    volume.gain.exponentialRampToValueAtTime(.0001, t + .2);
    oscillator.connect(volume).connect(state.master);
    oscillator.start(t);
    oscillator.stop(t + .22);
  }

  function footstep(delay, gain, pitch) {
    thump(delay, gain, pitch);
    noise(.07, gain * .34, 520, delay);
  }

  async function caption(text, duration) {
    ui.soundCaption.textContent = text;
    ui.soundCaption.hidden = false;
    await sleep(duration);
    ui.soundCaption.hidden = true;
  }

  async function playEvidence() {
    setPhase("evidence");
    ui.recorderPanel.hidden = true;
    ui.objective.textContent = "Слушай не направление, а порядок и изменение среды.";
    noise(.35, .08, 1200);
    thump(.32, .12, 115);
    noise(.52, .06, 1700, .45);
    await caption("[ткань · удар · скольжение]", 1200);

    [0, .38, .82, 1.28, 1.76].forEach((delay, index) => footstep(delay, .1 - index * .014, 72 + index * 2));
    await caption("[шаги становятся тише]", 2300);

    [0, .42, .86, 1.28].forEach((delay, index) => footstep(delay, .044 + index * .018, 58));
    await caption("[другая походка становится громче]", 1800);

    thump(0, .18, 65);
    noise(.32, .09, 460, .02);
    await caption("[закрывается металлическая дверь]", 680);

    for (let i = 0; i < 10; i += 1) thump(i * .28, .025 + i * .004, 42);
    ui.motionWash.classList.add("active");
    await caption("[поезд начинает движение]", 1450);
    showOrderPuzzle();
  }

  async function begin(sound) {
    state.sound = sound;
    await ensureAudio();
    if (state.master) state.master.gain.value = sound ? .72 : 0;
    ui.soundToggle.textContent = sound ? "ЗВУК" : "БЕЗ ЗВУКА";
    ui.soundToggle.setAttribute("aria-pressed", String(!sound));
    ui.gate.hidden = true;
    ui.experience.hidden = false;
    setPhase("intro");
    logEvent("start", { sound });
    tone(520, .16, .035);
    tone(780, .18, .025, .07);
    await sleep(1500);
    ui.twoCountries.classList.add("gone");
    await runIntro();
  }

  async function showLine(speaker, line, duration = 1450) {
    ui.speaker.textContent = speaker;
    ui.line.textContent = line;
    ui.dialogue.hidden = false;
    tone(speaker === "ОН" ? 470 : 620, .07, .022);
    await sleep(duration);
    ui.dialogue.hidden = true;
    await sleep(180);
  }

  async function runIntro() {
    await showLine("ОН", "Ты ещё там?");
    await showLine("ОНА", "Уже выхожу.");
    await showLine("ОН", "У тебя «уже» обычно минут на десять.", 1750);
    await showLine("ОНА", "Сегодня на восемь.");
    showTicketTask();
  }

  function showTicketTask() {
    setPhase("ticket");
    ui.chapter.textContent = "01 · ПОСАДКА";
    ui.objective.textContent = "Поднеси билет к сканеру у двери.";
    ui.ticketTask.hidden = false;
    makeDraggable(ui.ticket, ui.scanner, onTicketAccepted);
  }

  async function onTicketAccepted() {
    ui.scanner.classList.add("accept");
    ui.ticketTask.classList.add("success-flash");
    tone(880, .11, .04);
    tone(1174, .16, .025, .08);
    await sleep(450);
    ui.ticketTask.hidden = true;
    ui.trainBackground.style.transform = "scale(1.1) translateY(-1.5%)";
    noise(.52, .06, 520);
    thump(.42, .12, 60);
    await showLine("ОН", "Ты в вагоне?", 950);
    await showLine("ОНА", "Да. Сумку поставлю — и всё.", 1350);
    showBagTask();
  }

  function showBagTask() {
    setPhase("bag-place");
    ui.objective.textContent = "Поставь сумку у первой боковой полки.";
    ui.bagTask.hidden = false;
    makeDraggable(ui.bag, ui.bagTarget, onBagPlaced);
  }

  async function onBagPlaced() {
    noise(.24, .05, 700);
    thump(.12, .08, 75);
    ui.bag.style.transform = "";
    ui.bag.classList.add("settled");
    ui.objective.textContent = "Под сумкой мигает слабый красный свет. Сдвинь её вправо.";
    setPhase("bag-move");
    makeSwipe(ui.bag, async () => {
      ui.bag.style.transform = "translateX(42%) rotate(4deg)";
      noise(.38, .045, 950);
      await sleep(420);
      ui.recLed.hidden = false;
      setPhase("led");
    });
  }

  async function revealRecorder() {
    ui.recLed.hidden = true;
    ui.bagTask.hidden = true;
    thump(0, .06, 90);
    tone(740, .14, .025, .08);
    ui.objective.textContent = "Обычный диктофон. Красный индикатор всё ещё горит.";
    ui.recorderPanel.hidden = false;
    state.controlStep = 0;
    ui.deviceState.textContent = "REC";
    ui.deviceTime.textContent = "00:17:42";
    ui.controlHint.textContent = "Шаг 1 из 3 · Нажми STOP.";
    renderRecorderControls();
    setPhase("recorder-controls");
  }

  const recorderControlOrder = ["stop", "rew", "play"];

  function renderRecorderControls() {
    $$("[data-control]").forEach((controlButton, index) => {
      controlButton.disabled = false;
      controlButton.classList.toggle("done", index < state.controlStep);
      controlButton.classList.toggle("next", index === state.controlStep);
      controlButton.classList.toggle("future", index > state.controlStep);
      if (index === state.controlStep) {
        controlButton.setAttribute("aria-current", "step");
      } else {
        controlButton.removeAttribute("aria-current");
      }
    });
  }

  async function deviceControl(control) {
    if (state.controlStep >= recorderControlOrder.length) return;
    const expected = recorderControlOrder[state.controlStep];
    if (control !== expected) {
      ui.controlHint.textContent = `Сейчас нажми ${expected.toUpperCase()}.`;
      ui.recorderPanel.classList.remove("wrong");
      void ui.recorderPanel.offsetWidth;
      ui.recorderPanel.classList.add("wrong");
      tone(180, .08, .025, 0, "square");
      logEvent("recorder_wrong_control", { pressed: control, expected });
      return;
    }

    if (control === "stop" && state.controlStep === 0) {
      state.controlStep = 1;
      ui.deviceState.textContent = "STOP";
      ui.controlHint.textContent = "Шаг 2 из 3 · Нажми REW один раз.";
      renderRecorderControls();
      thump(0, .04, 110);
    } else if (control === "rew" && state.controlStep === 1) {
      state.controlStep = 2;
      ui.deviceTime.textContent = "00:17:34";
      ui.controlHint.textContent = "Шаг 3 из 3 · Нажми PLAY.";
      renderRecorderControls();
      [0, .08, .16, .24].forEach((delay, index) => tone(620 - index * 70, .04, .018, delay, "square"));
    } else if (control === "play" && state.controlStep === 2) {
      state.controlStep = 3;
      ui.deviceState.textContent = "PLAY";
      ui.controlHint.textContent = "Воспроизведение";
      renderRecorderControls();
      logEvent("recorder_sequence_complete");
      await sleep(300);
      playEvidence();
    }
  }

  const eventOptions = [
    { id: "door", label: "Металлическая дверь" },
    { id: "drop", label: "Удар и скольжение" },
    { id: "enter", label: "Вторая походка усилилась" },
    { id: "exit", label: "Первая походка затихла" },
  ];
  const answer = ["drop", "exit", "enter", "door"];

  function showOrderPuzzle() {
    setPhase("order");
    ui.orderPuzzle.hidden = false;
    ui.objective.textContent = "Собери только то, что действительно слышно.";
    renderOrder();
  }

  function renderOrder() {
    ui.orderSlots.innerHTML = "";
    answer.forEach((_, index) => {
      const slot = document.createElement("div");
      slot.className = "order-slot";
      const selected = eventOptions.find((item) => item.id === state.order[index]);
      slot.innerHTML = `<b>${index + 1}</b><span>${selected ? selected.label : "—"}</span>`;
      if (selected) slot.addEventListener("click", () => { state.order.splice(index, 1); renderOrder(); });
      ui.orderSlots.append(slot);
    });
    ui.orderChoices.innerHTML = "";
    eventOptions.forEach((item) => {
      const button = document.createElement("button");
      button.textContent = item.label;
      button.disabled = state.order.includes(item.id);
      button.addEventListener("click", () => {
        if (state.order.length < 4) state.order.push(item.id);
        renderOrder();
      });
      ui.orderChoices.append(button);
    });
    ui.checkOrder.disabled = state.order.length !== 4;
  }

  async function checkOrder() {
    const correct = state.order.every((id, index) => id === answer[index]);
    logEvent("order_attempt", { correct });
    if (!correct) {
      ui.orderPuzzle.classList.remove("wrong");
      void ui.orderPuzzle.offsetWidth;
      ui.orderPuzzle.classList.add("wrong");
      ui.orderResult.textContent = "Не сходится. Слушай, что затихает, а что приближается.";
      await sleep(900);
      state.order = [];
      renderOrder();
      return;
    }
    ui.orderResult.textContent = "Сначала предмет. Потом один человек вышел. Другой вошёл позже.";
    ui.checkOrder.disabled = true;
    tone(520, .25, .03);
    tone(660, .28, .025, .14);
    tone(820, .32, .02, .28);
    ui.orderPuzzle.hidden = true;
    playRecordingScene();
  }

  async function playRemote(url) {
    if (!url || !state.sound) return null;
    try {
      if (state.remoteAudio) state.remoteAudio.pause();
      const audio = new Audio(url);
      audio.volume = .88;
      state.remoteAudio = audio;
      await audio.play();
      return audio;
    } catch {
      return null;
    }
  }

  function waitForAudio(audio, fallbackMs) {
    if (!audio) return sleep(fallbackMs);
    return new Promise((resolve) => {
      const timer = window.setTimeout(resolve, fallbackMs);
      audio.addEventListener("ended", () => {
        window.clearTimeout(timer);
        resolve();
      }, { once: true });
    });
  }

  async function playRecordingScene() {
    setPhase("recording");
    ui.recordingScene.hidden = false;
    ui.objective.textContent = "На записи есть голос.";
    const parts = [
      "Он пришёл за мной. На вокзал. Мой руководитель. Стоит у вагона.",
      "Я не поеду. Сейчас выйду, вернусь внутрь и позвоню сто двенадцать.",
    ];
    ui.recordingText.textContent = `${parts[0]}\n\n${parts[1]}`;
    const ownerAudio = await playRemote(ASSETS.ownerVoice);
    await waitForAudio(ownerAudio, 10500);
    ui.recordingText.textContent = "[мужской голос рядом] Нам надо договорить.";
    const recordedVoice = await playRemote(ASSETS.manRecorded);
    await waitForAudio(recordedVoice, 2600);
    ui.continueRecording.hidden = false;
  }

  async function showVoiceMatch() {
    ui.recordingScene.hidden = true;
    ui.voiceMatch.hidden = false;
    setPhase("voice-match");
    ui.chapter.textContent = "02 · ТОТ ЖЕ ГОЛОС";
    ui.objective.textContent = "Мужчина в коридоре говорит спокойно.";
    playRemote(ASSETS.manLive);
    await sleep(180);
    await caption("[мужской голос за дверью] Ваш билет, пожалуйста.", 2600);
  }

  function finish(choice) {
    logEvent("first_choice", { choice });
    ui.voiceMatch.hidden = true;
    ui.workprintEnd.hidden = false;
    setPhase("end");
    ui.choiceConsequence.textContent = choice === "hide"
      ? "Она убирает устройство и идёт к проводнице. Безопасность раньше разгадки."
      : "Она оставляет устройство на виду, но сама перемещается ближе к проводнице и людям.";
    ui.objective.textContent = "Первая механика завершена.";
  }

  function makeDraggable(element, target, onSuccess) {
    let active = false;
    let startX = 0;
    let startY = 0;
    const down = (event) => {
      active = true;
      startX = event.clientX;
      startY = event.clientY;
      element.setPointerCapture(event.pointerId);
      element.classList.add("dragging");
    };
    const move = (event) => {
      if (!active) return;
      element.style.transform = `translate(${event.clientX - startX}px, ${event.clientY - startY}px)`;
    };
    const up = async () => {
      if (!active) return;
      active = false;
      element.classList.remove("dragging");
      const a = element.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      const overlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
        * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      if (overlap > Math.min(a.width * a.height, b.width * b.height) * .28) {
        element.removeEventListener("pointerdown", down);
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerup", up);
        await onSuccess();
      } else {
        element.style.transform = "";
        tone(180, .08, .025, 0, "square");
      }
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
  }

  function makeSwipe(element, onSuccess) {
    let startX = 0;
    let active = false;
    const down = (event) => {
      active = true;
      startX = event.clientX;
      element.setPointerCapture(event.pointerId);
    };
    const move = (event) => {
      if (active) element.style.transform = `translateX(${Math.max(0, event.clientX - startX)}px)`;
    };
    const up = (event) => {
      if (!active) return;
      active = false;
      if (event.clientX - startX > 72) {
        element.removeEventListener("pointerdown", down);
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerup", up);
        onSuccess();
      } else {
        element.style.transform = "";
      }
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
  }

  $("#startSound").addEventListener("click", () => begin(true));
  $("#startSilent").addEventListener("click", () => begin(false));
  ui.soundToggle.addEventListener("click", async () => {
    state.sound = !state.sound;
    await ensureAudio();
    if (state.master) state.master.gain.value = state.sound ? .72 : 0;
    ui.soundToggle.textContent = state.sound ? "ЗВУК" : "БЕЗ ЗВУКА";
    ui.soundToggle.setAttribute("aria-pressed", String(!state.sound));
    logEvent("sound_toggle", { sound: state.sound });
  });
  ui.recLed.addEventListener("click", revealRecorder);
  $$("[data-control]").forEach((button) => button.addEventListener("click", () => deviceControl(button.dataset.control)));
  ui.checkOrder.addEventListener("click", checkOrder);
  ui.continueRecording.addEventListener("click", showVoiceMatch);
  $$("[data-final-choice]").forEach((button) => button.addEventListener("click", () => finish(button.dataset.finalChoice)));
  $("#restart").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
})();
