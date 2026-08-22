(() => {
  "use strict";

  const ASSETS = {
    train: "https://cdn.creativeclaw.co/u/ce56d390/images/11c80fff-5ec1-4139-9151-2d3688d10bc2.png",
    bag: "https://cdn.creativeclaw.co/u/ce56d390/images/8c0a0b44-a788-4c64-872c-dd662c7df9db.png",
    recorder: "https://cdn.creativeclaw.co/u/ce56d390/images/8df5dfd5-0375-494b-99f0-2541540d4b46.png",
    ownerVoice: "https://cdn.creativeclaw.co/u/ce56d390/audio/ca1d9628-d2c3-4a59-87e5-39e0bee3af5b.mp3",
    manRecorded: "https://cdn.creativeclaw.co/u/ce56d390/audio/0a291c5a-c367-46df-a725-c941f01424f7.mp3",
    manLive: "https://cdn.creativeclaw.co/u/ce56d390/audio/3efdbfb3-3224-4887-9eaf-c19e8e252f9d.mp3",
    manEarlier: "https://cdn.creativeclaw.co/u/ce56d390/audio/c66b24c2-171a-4bf2-8ff0-9f9f4fa46b15.mp3",
    conductor: "https://cdn.creativeclaw.co/u/ce56d390/images/ab532e04-bbfd-45e6-b8af-2e51503cf064.webp",
  };

  const TELEMETRY_URL = "https://bosjlvrsgayngbcnzjzk.supabase.co/functions/v1/story-playtest";
  const STORAGE_KEY = "between-stations-workprint-v1";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const ui = {
    app: $("#app"), gate: $("#gate"), experience: $("#experience"), chapter: $("#chapter"),
    objective: $("#objective"), twoCountries: $("#twoCountries"), dialogue: $("#dialogue"),
    speaker: $("#speaker"), dialogueChannel: $("#dialogueChannel"), line: $("#line"), dialogueNext: $("#dialogueNext"),
    ticketTask: $("#ticketTask"), ticket: $("#ticket"),
    scanner: $("#scanner"), bagTask: $("#bagTask"), bag: $("#bag"), recorderFind: $("#recorderFind"),
    recorderPanel: $("#recorderPanel"), deviceState: $("#deviceState"),
    deviceTime: $("#deviceTime"), controlHint: $("#controlHint"), soundCaption: $("#soundCaption"),
    recordingScene: $("#recordingScene"), recordingRecorderImage: $("#recordingRecorderImage"),
    recordingSpeaker: $("#recordingSpeaker"), recordingText: $("#recordingText"),
    continueRecording: $("#continueRecording"), voiceMatch: $("#voiceMatch"), voiceChoices: $("#voiceChoices"),
    workprintEnd: $("#workprintEnd"), choiceConsequence: $("#choiceConsequence"),
    continueChapter: $("#continueChapter"), handoffScene: $("#handoffScene"), handoffRecorder: $("#handoffRecorder"),
    archiveScene: $("#archiveScene"), file45: $("#file45"), file45Playback: $("#file45Playback"),
    file45Transcript: $("#file45Transcript"), closeFile45: $("#closeFile45"), chapterTwoEnd: $("#chapterTwoEnd"),
    motionWash: $("#motionWash"),
    trainBackground: $("#trainBackground"), soundToggle: $("#soundToggle"),
  };

  const state = {
    phase: "gate", sound: true, audio: null, master: null,
    remoteAudio: null, controlStep: 0,
    session: localStorage.getItem("story-session") || crypto.randomUUID(),
  };
  localStorage.setItem("story-session", state.session);

  ui.trainBackground.src = ASSETS.train;
  ui.bag.querySelector("img").src = ASSETS.bag;
  ui.recorderFind.querySelector("img").src = ASSETS.recorder;
  ui.recorderPanel.querySelector("img").src = ASSETS.recorder;
  ui.recordingRecorderImage.src = ASSETS.recorder;
  ui.handoffRecorder.querySelector("img").src = ASSETS.recorder;

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
    await sleep(2400);
    ui.twoCountries.classList.add("gone");
    await runIntro();
  }

  async function showLine(speaker, line, channel = "phone") {
    ui.speaker.textContent = speaker;
    ui.dialogue.dataset.channel = channel;
    ui.dialogueChannel.textContent = channel === "phone" ? "ЗВОНОК · НА ЛИНИИ" : "РЯДОМ · В ВАГОНЕ";
    ui.line.textContent = line;
    ui.dialogue.hidden = false;
    tone(speaker === "ОН" ? 470 : 620, .07, .022);
    await new Promise((resolve) => {
      ui.dialogueNext.addEventListener("click", resolve, { once: true });
    });
    ui.dialogue.hidden = true;
    await sleep(120);
  }

  async function runIntro() {
    await showLine("ОН", "Ты ещё там?");
    await showLine("ОНА", "Уже выхожу.");
    await showLine("ОН", "У тебя «уже» обычно минут на десять.");
    await showLine("ОНА", "Сегодня на восемь.");
    await showLine("ОН", "До дома ещё долго?");
    await showLine("ОНА", "Ночной поезд, потом такси. Не отключайся, пока не сяду.");
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
    await showLine("ОН", "Ты в вагоне?");
    await showLine("ОНА", "Да. Сумку поставлю — и всё.");
    showBagTask();
  }

  function showBagTask() {
    setPhase("bag-place");
    ui.objective.textContent = "Коснись сумки, чтобы поставить её на нижнюю полку.";
    ui.bagTask.hidden = false;
    ui.bag.addEventListener("click", onBagPlaced, { once: true });
  }

  async function onBagPlaced() {
    noise(.24, .05, 700);
    thump(.12, .08, 75);
    ui.bag.classList.add("settled");
    ui.bag.setAttribute("aria-label", "Отодвинуть сумку и посмотреть, что под ней");
    ui.recorderFind.hidden = false;
    ui.objective.textContent = "Под сумкой мигает красный свет. Коснись её ещё раз.";
    setPhase("bag-move");
    ui.bag.addEventListener("click", revealRecorder, { once: true });
  }

  async function revealRecorder() {
    ui.bag.classList.add("moved-aside");
    noise(.38, .045, 950);
    await sleep(520);
    ui.recorderFind.classList.add("revealed");
    ui.recorderFind.focus({ preventScroll: true });
    thump(0, .06, 90);
    tone(740, .14, .025, .08);
    ui.objective.textContent = "Под полкой лежит включённый диктофон. Коснись его.";
    ui.recorderFind.addEventListener("click", pickUpRecorder, { once: true });
    setPhase("recorder-found");
  }

  async function pickUpRecorder() {
    ui.recorderFind.classList.add("picked-up");
    tone(740, .14, .025);
    await sleep(720);
    ui.bagTask.hidden = true;
    await showLine("ОНА", "Тут чужой диктофон. И он всё ещё пишет.");
    await showLine("ОН", "Останови запись. Посмотрим последний файл — может, поймём, кому вернуть.");
    await showLine("ОНА", "Потом отнесу проводнице.");
    ui.recorderPanel.hidden = false;
    state.controlStep = 0;
    ui.deviceState.textContent = "REC";
    ui.deviceTime.textContent = "00:17:42";
    ui.controlHint.textContent = "Сначала останови чужую запись · STOP";
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
      ui.controlHint.textContent = "Вернись к началу последнего файла · REW";
      renderRecorderControls();
      thump(0, .04, 110);
    } else if (control === "rew" && state.controlStep === 1) {
      state.controlStep = 2;
      ui.deviceTime.textContent = "00:17:34";
      ui.controlHint.textContent = "Включи последний файл · PLAY";
      renderRecorderControls();
      [0, .08, .16, .24].forEach((delay, index) => tone(620 - index * 70, .04, .018, delay, "square"));
    } else if (control === "play" && state.controlStep === 2) {
      state.controlStep = 3;
      ui.deviceState.textContent = "PLAY";
      ui.controlHint.textContent = "Воспроизведение";
      renderRecorderControls();
      logEvent("recorder_sequence_complete");
      await sleep(300);
      playRecordingScene();
    }
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

  function waitForAudio(audio, silentMs = 2200, timeoutMs = 45000) {
    if (!audio) return sleep(silentMs);
    return new Promise((resolve) => {
      let settled = false;
      const finishWaiting = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve();
      };
      const timer = window.setTimeout(finishWaiting, timeoutMs);
      audio.addEventListener("ended", finishWaiting, { once: true });
      audio.addEventListener("error", finishWaiting, { once: true });
      if (audio.ended) finishWaiting();
    });
  }

  async function playRecordingScene() {
    ui.recorderPanel.hidden = true;
    setPhase("recording");
    ui.recordingScene.hidden = false;
    ui.continueRecording.hidden = true;
    ui.objective.textContent = "Диктофон воспроизводит последний сохранённый файл.";
    const parts = [
      "Он пришёл за мной. На вокзал. Мой руководитель. Стоит у вагона.",
      "Я не поеду. Сейчас выйду, вернусь внутрь и позвоню сто двенадцать.",
    ];
    ui.recordingSpeaker.textContent = "ГОЛОС ХОЗЯЙКИ ДИКТОФОНА";
    ui.recordingText.textContent = `${parts[0]}\n\n${parts[1]}`;
    const ownerAudio = await playRemote(ASSETS.ownerVoice);
    await waitForAudio(ownerAudio, 8500, 45000);
    await sleep(450);
    ui.recordingSpeaker.textContent = "МУЖСКОЙ ГОЛОС РЯДОМ С НЕЙ";
    ui.recordingText.textContent = "Нам надо договорить.";
    const recordedVoice = await playRemote(ASSETS.manRecorded);
    await waitForAudio(recordedVoice, 2400, 15000);
    ui.continueRecording.hidden = false;
  }

  async function showVoiceMatch() {
    ui.recordingScene.hidden = true;
    ui.voiceMatch.hidden = false;
    ui.voiceChoices.hidden = true;
    setPhase("voice-match");
    ui.chapter.textContent = "02 · ЗА ДВЕРЬЮ";
    ui.objective.textContent = "Шаги остановились у дальней двери тамбура.";
    ui.trainBackground.style.transform = "scale(1.18) translate(-4%, 1%)";
    [0, .48, .96].forEach((delay, index) => footstep(delay, .045 + index * .018, 58));
    await sleep(1750);
    thump(0, .08, 74);
    await sleep(550);
    ui.soundCaption.textContent = "[тот же мужской голос за стеклом] Ваш билет, пожалуйста.";
    ui.soundCaption.hidden = false;
    const liveVoice = await playRemote(ASSETS.manLive);
    await waitForAudio(liveVoice, 3200, 15000);
    await sleep(450);
    ui.soundCaption.hidden = true;
    ui.voiceChoices.hidden = false;
  }

  function finish(choice) {
    logEvent("first_choice", { choice });
    ui.voiceMatch.hidden = true;
    ui.workprintEnd.hidden = false;
    setPhase("end");
    ui.choiceConsequence.textContent = "Свет жилой части вагона становится ближе. Дверь тамбура остаётся у тебя за спиной.";
    ui.objective.textContent = "До проводницы — два купе. Он остаётся на линии.";
  }

  async function startChapterTwo() {
    ui.workprintEnd.hidden = true;
    ui.chapter.textContent = "03 · ПРОВОДНИЦА";
    setPhase("conductor");
    ui.trainBackground.style.opacity = "0";
    await sleep(360);
    if (ASSETS.conductor) {
      ui.trainBackground.src = ASSETS.conductor;
      try { await ui.trainBackground.decode(); } catch { /* continue with browser fallback */ }
    }
    ui.trainBackground.style.transform = "scale(1.04)";
    ui.trainBackground.style.filter = "saturate(.72) contrast(1.06) brightness(.78)";
    ui.trainBackground.style.opacity = "1";
    ui.objective.textContent = "Ты доходишь до служебного купе.";
    await sleep(1300);
    await showLine("ОН", "Ты дошла?");
    await showLine("ОНА", "Да. Проводница здесь.");
    await showLine("ПРОВОДНИЦА", "Что случилось?", "room");
    await showLine("ОНА", "У дальней двери мужчина. Сказал: «Ваш билет».", "room");
    await showLine("ПРОВОДНИЦА", "В этом вагоне билеты проверяю только я. Я никого не посылала.", "room");
    ui.handoffScene.hidden = false;
    ui.objective.textContent = "Покажи проводнице найденный диктофон.";
  }

  async function handoffRecorder() {
    ui.handoffRecorder.classList.add("passed");
    await sleep(620);
    ui.handoffScene.hidden = true;
    await showLine("ПРОВОДНИЦА", "Где ты его нашла?", "room");
    await showLine("ОНА", "Под полкой. Он продолжал записывать.", "room");
    await showLine("ПРОВОДНИЦА", "Оставайся здесь. Я сообщу начальнику поезда.", "room");
    await showLine("ОН", "Перед последним файлом есть ещё один. Восемь секунд.");
    ui.archiveScene.hidden = false;
    ui.objective.textContent = "На экране диктофона виден предыдущий файл.";
    setPhase("archive");
  }

  async function playEarlierFile() {
    ui.file45.disabled = true;
    ui.file45.classList.add("playing");
    ui.file45Playback.hidden = false;
    ui.file45Transcript.textContent = "[офисный шум · щелчок двери]";
    noise(.55, .035, 1300);
    await sleep(1300);
    ui.file45Transcript.textContent = "[тот же мужской голос] Удалите запись.";
    const earlierVoice = await playRemote(ASSETS.manEarlier);
    await waitForAudio(earlierVoice, 2800, 15000);
    await sleep(500);
    ui.file45Transcript.textContent = "[конец файла]";
    ui.closeFile45.hidden = false;
    ui.objective.textContent = "Это тот же голос. Теперь понятна его цель.";
  }

  async function closeEarlierFile() {
    ui.archiveScene.hidden = true;
    await showLine("ОН", "Теперь понятно, зачем он сел в поезд.");
    await showLine("ОНА", "Он ищет этот диктофон.");
    await showLine("ПРОВОДНИЦА", "Не включай остальные файлы. Дождёмся начальника поезда.", "room");
    ui.chapterTwoEnd.hidden = false;
    ui.objective.textContent = "Служебная дверь заперта. Ты не одна.";
    setPhase("chapter-two-end");
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
  $$("[data-control]").forEach((button) => button.addEventListener("click", () => deviceControl(button.dataset.control)));
  ui.continueRecording.addEventListener("click", showVoiceMatch);
  $("[data-final-choice]").forEach((button) => button.addEventListener("click", () => finish(button.dataset.finalChoice)));
  ui.continueChapter.addEventListener("click", startChapterTwo);
  ui.handoffRecorder.addEventListener("click", handoffRecorder);
  ui.file45.addEventListener("click", playEarlierFile);
  ui.closeFile45.addEventListener("click", closeEarlierFile);
  $("#restart").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
})();
