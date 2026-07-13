import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

/* ---- storage: IndexedDB-backed, same shape as the artifact storage API ---- */
const dbPromise = new Promise((resolve, reject) => {
  const req = indexedDB.open("offthetop", 1);
  req.onupgradeneeded = () => req.result.createObjectStore("kv");
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
const appStore = {
  async get(key) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const r = db.transaction("kv").objectStore("kv").get(key);
      r.onsuccess = () =>
        r.result === undefined ? reject(new Error("not found")) : resolve({ key, value: r.result });
      r.onerror = () => reject(r.error);
    });
  },
  async set(key, value) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(value, key);
      tx.oncomplete = () => resolve({ key, value });
      tx.onerror = () => reject(tx.error);
    });
  },
  async delete(key) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").delete(key);
      tx.oncomplete = () => resolve({ key, deleted: true });
      tx.onerror = () => reject(tx.error);
    });
  },
};


/* ============ RHYME BOOK — design tokens ============
   Paper: #FAF6EC | Ruled line: #C9D6EA | Ink: #1A160F
   Margin red: #D9382C | Ballpoint blue: #2447B2 | Highlighter: #F9E04B
   Display: Archivo Black / Impact — Notes: Caveat / cursive
====================================================== */

const C = {
  paper: "#FAF6EC",
  line: "#C9D6EA",
  ink: "#1A160F",
  red: "#D9382C",
  blue: "#2447B2",
  hi: "#F9E04B",
  dim: "#6F6857",
};

const DISPLAY = "'Archivo Black', Impact, 'Arial Black', sans-serif";
const HAND = "'Caveat', 'Segoe Script', cursive";
const BODY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/* ============ CONTENT ============ */

const LESSONS = [
  {
    id: "l1",
    title: "What freestyle is (and the one rule)",
    tag: "Foundations",
    body: [
      "Freestyling is rapping lyrics you invent in real time. That's it. No memorized verses, no do-overs — your brain picks words while your mouth stays on the beat. It feels impossible for exactly the first few hours, then it feels like a muscle.",
      "Two truths to internalize before anything else: everyone sounds bad at first, and nobody remembers your worst bar except you. The freestylers you admire have thousands of terrible bars behind them. They just kept going.",
      "Which brings us to the one rule of freestyle: NEVER STOP. A mediocre line delivered on beat beats a brilliant line that breaks your flow. Silence is the only real mistake. If you say something clumsy, the next bar is already coming — ride it.",
    ],
    drill:
      "Talk-rap about the room you're in for 60 straight seconds. No beat, no rhymes required — just describe what you see in rhythm and do not stop talking. Do this once a day this week.",
  },
  {
    id: "l2",
    title: "Bars, beats, and the pocket",
    tag: "Foundations",
    body: [
      "A bar is 4 beats of music. Almost all rap beats loop in groups of 4 bars. Count along: 1-2-3-4, 1-2-3-4. The snare (the sharp crack) almost always lands on beats 2 and 4 — that's where heads nod.",
      "The 'pocket' is the sweet spot where your syllables lock in with the drums. Most rap lines land their final rhyme word right on beat 4, like a period at the end of a sentence.",
      "Before you worry about words, get flows into your body. Mumble-rap nonsense syllables over a beat — 'da-da-DA, da-da-da-DA' — and let your patterns snap to the drums. Flow first, vocabulary second. Every great freestyler hears the rhythm of a line before they know the words in it.",
    ],
    drill:
      "Open The Booth, set 85 BPM, and count '1, 2, 3, 4' out loud for 8 bars, hitting each number exactly on the beat. Then hum or mumble invented flows for 8 more bars. Land something on every beat 4.",
  },
  {
    id: "l3",
    title: "End rhymes and thinking one line ahead",
    tag: "Rhyme basics",
    body: [
      "Start with couplets: two lines where the last words rhyme (AABB). Line one lands its final word on beat 4, line two answers it with a rhyme on its own beat 4. That's the backbone of 90% of freestyle.",
      "Choose friendly rhyme words — short words with huge rhyme families: flow, mind, game, day, real, cold. If you end a line on 'orange', you did that to yourself.",
      "Here's the actual secret of freestylers: they think one line AHEAD. Pick the rhyme word for your NEXT line first, then build the current line toward it. While your mouth finishes line one, your brain is already holding the landing word for line two. This one habit is the difference between scrambling and gliding.",
    ],
    drill:
      "Run 3 rounds in the Rhyme Lab to stretch your rhyme recall. Then hit The Booth in Words mode and build one couplet for every word that drops.",
  },
  {
    id: "l4",
    title: "Filler phrases and the art of recovery",
    tag: "Survival kit",
    body: [
      "Fillers are stock phrases you can drop on autopilot: 'you know what I'm sayin'', 'check it, uh', 'and it goes like this', 'off the top, no pause'. They're not cheating — they're scaffolding. Every pro uses them.",
      "A filler buys you two full seconds of thinking time while your delivery never breaks. That's enough to grab your next rhyme word and keep moving.",
      "Recovery plan for when you fall off (you will): loop a filler bar, breathe, and re-enter clean on the next bar 1. The crowd hears confidence, not the stumble. Build a personal kit of five go-to fillers and drill them until they fire without thought.",
    ],
    drill:
      "Freestyle for 2 minutes in The Booth and deliberately drop one filler phrase every 4 bars, even when you don't need it. You're installing escape hatches for later.",
  },
  {
    id: "l5",
    title: "Rhyme schemes and slant rhymes",
    tag: "Leveling up",
    body: [
      "Beyond AABB there's ABAB (alternating), and internal rhymes — rhyming words in the middle of bars, not just the ends. One internal rhyme per bar instantly makes you sound twice as skilled.",
      "Now the big unlock: slant rhyme. In rap, VOWELS are what rhyme, not spellings. 'Home' rhymes with 'alone', 'zone', 'chrome' — but also with 'toast', 'dope' and 'coast', because the long-O carries it. Consonants can bend; vowels must match.",
      "Once you rhyme by vowel sound, your rhyme options for any word multiply by ten. Stop hunting for perfect rhymes and start hunting for matching vowels.",
    ],
    drill:
      "Pick one vowel sound (say, the 'ay' in day). Out loud, list 20 words that carry it: fade, brave, paper, danger, mistake... Then freestyle 8 bars using only that family for your end rhymes.",
  },
  {
    id: "l6",
    title: "Multisyllabic rhymes",
    tag: "Leveling up",
    body: [
      "Multis are rhymes across GROUPS of syllables: 'elevator / educate her / never hate ya'. All three carry the same vowel pattern: eh-uh-AY-uh. This is the sound of elite rap.",
      "The method: break your word into its vowel sounds and match the pattern with a phrase. 'Physical' = ih-ih-uh, so 'typical', 'digital', 'in a duel' all lock in. Phrases count — often they're easier than single words.",
      "Build up gradually. First rhyme just the last 2 syllables of your lines. When that's comfortable, stretch to 3. Don't force multis into every bar; land one clean multi every 4 bars and you'll sound sharp, not strained.",
    ],
    drill:
      "Take a 3-syllable word (try 'gravity'). Find three multi matches ('happily', 'strategy', 'have to be'). Now use all of them as end rhymes in one 4-bar run in The Booth.",
  },
  {
    id: "l7",
    title: "Wordplay, punchlines, and the look-around method",
    tag: "Craft",
    body: [
      "The setup-punch pattern: bar one plants context, bar two lands the hit. Similes are the easiest entry — 'I stay cool under pressure like...' — your brain fills the blank better than you'd expect once the flow is carrying you.",
      "Flips are double meanings: one word, two readings ('I'm counting bars — locked in either way'). You can't force these off the top at first. Notice them when they happen, celebrate them, and your brain starts serving up more.",
      "The look-around method is the freestyler's cheat code: name objects you can literally see and flip them into lines. A lamp, a window, someone's jacket. It grounds you in the moment, feeds you endless material, and audiences love it because it proves you're truly off the top.",
      "For structure, think of a 16-bar verse as 4 + 8 + 4: four bars to arrive, eight bars riding one theme, four bars to close it out.",
    ],
    drill:
      "Look around and pick 3 objects you can see. Off the top, deliver one setup-punch couplet about each. Clumsy is fine — landing them is the rep.",
  },
  {
    id: "l8",
    title: "Cyphers, battles, and finding your voice",
    tag: "The culture",
    body: [
      "A cypher is a circle of MCs trading freestyles. Etiquette: keep your turn to 8–16 bars, react to what the last person said, and keep energy up for whoever's rapping — the circle lifts everyone.",
      "Battle basics: a responsive line beats a pre-written one every time. Flip your opponent's last punchline back at them and the room erupts. Listen more than you plan.",
      "Record yourself weekly, even just voice memos. Your ear develops faster than your mouth, so listening back is how you actually steer your growth. It will be uncomfortable. Do it anyway.",
      "Your voice — the thing that makes you sound like you — isn't found, it's accumulated. Your natural speaking cadence, your vocabulary, your obsessions. Ten thousand bars from now, it'll just be there. Congratulations: you now know the whole road. Walk it.",
    ],
    drill:
      "Record a 2-minute freestyle in The Booth. Listen back once, write down ONE thing to improve, and freestyle 2 more minutes focused only on that.",
  },
];

const WORDS = [
  "mirror", "rocket", "subway", "coffee", "thunder", "pocket", "diamond",
  "shadow", "winter", "bottle", "jungle", "money", "planet", "whisper",
  "ladder", "ocean", "battery", "engine", "sneakers", "pigeon", "elevator",
  "notebook", "microphone", "hoodie", "corner", "sirens", "asphalt", "neon",
  "vinyl", "cipher", "hunger", "pressure", "patience", "legacy", "gravity",
  "momentum", "static", "echo", "rhythm", "hustle", "vision", "karma",
  "danger", "fortune", "silence", "voltage", "empire", "phantom", "chrome",
  "smoke", "frost", "blaze", "maze", "crown", "throne", "wolves", "sharks",
  "chess", "magnet", "compass", "satellite", "concrete", "lightning",
];

const TOPICS = [
  "your morning so far",
  "the room you're in right now",
  "your phone and everything on it",
  "the weather outside",
  "a food you could eat forever",
  "your neighborhood",
  "money — having it, chasing it",
  "the internet",
  "your day job or school",
  "a place you want to visit",
  "your best friend",
  "growing up",
  "being stuck in traffic",
  "your sneakers",
  "a dream you remember",
  "yourself, ten years from now",
  "something you lost",
  "your favorite season",
];

const RHYME_TARGETS = [
  "flow", "mind", "game", "street", "paper", "dream", "fire", "cold",
  "time", "real", "shine", "block", "pain", "crown", "day", "cash",
  "night", "road", "heart", "star",
];

/* ============ Helpers ============ */

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const clean = (w) => (w || "").toLowerCase().replace(/[^a-z]/g, "");

// tail from the last vowel onward, with a rough silent-e strip
const vowelTail = (word) => {
  let s = clean(word);
  if (s.length > 2 && s.endsWith("e") && !/[aeiou]/.test(s[s.length - 2])) {
    s = s.slice(0, -1);
  }
  const m = s.match(/[aeiouy][^aeiouy]*$/);
  return m ? m[0] : s;
};

const tailVowels = (word) => vowelTail(word).replace(/[^aeiouy]/g, "");

const todayStr = () => new Date().toISOString().slice(0, 10);
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const fmtTime = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const blobToDataURL = (blob) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("read failed"));
    r.readAsDataURL(blob);
  });

const avgScore = (s) => {
  const vals = ["rhymes", "wordplay", "vocabulary", "coherence"].map(
    (k) => Number(s[k]) || 0
  );
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
};

/* ============ Small UI pieces ============ */

const Highlight = ({ children, rotate = -1 }) => (
  <span
    style={{
      backgroundColor: C.hi,
      display: "inline-block",
      padding: "2px 10px",
      transform: `rotate(${rotate}deg)`,
      boxShadow: "2px 2px 0 rgba(26,22,15,0.15)",
    }}
  >
    {children}
  </span>
);

const InkButton = ({ children, onClick, active, big, disabled, style }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`select-none font-bold uppercase ${
      big ? "px-6 py-4 text-lg" : "px-3 py-2 text-xs"
    }`}
    style={{
      fontFamily: DISPLAY,
      letterSpacing: "0.06em",
      backgroundColor: disabled ? "#D8D2C4" : active ? C.ink : C.paper,
      color: disabled ? C.dim : active ? C.hi : C.ink,
      border: `2px solid ${C.ink}`,
      boxShadow: active ? "none" : `3px 3px 0 ${C.ink}`,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "box-shadow 0.1s, transform 0.1s",
      ...style,
    }}
  >
    {children}
  </button>
);

const MarginNote = ({ children }) => (
  <div
    style={{
      fontFamily: HAND,
      color: C.blue,
      fontSize: "1.15rem",
      lineHeight: 1.2,
      transform: "rotate(-1.5deg)",
    }}
  >
    {children}
  </div>
);

/* ============ Main App ============ */

export default function FreestyleRhymeBook() {
  const [tab, setTab] = useState("learn");

  /* ---- persistent progress ---- */
  const [progress, setProgress] = useState({
    completed: [],
    sessions: 0,
    streak: 0,
    lastDay: null,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await appStore.get("freestyle-journey-v1");
        if (r && r.value) setProgress(JSON.parse(r.value));
      } catch (e) {
        /* first visit — nothing saved yet */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await appStore.set(
          "freestyle-journey-v1",
          JSON.stringify(progress)
        );
      } catch (e) {
        console.error("Couldn't save progress", e);
      }
    })();
  }, [progress, loaded]);

  const logPractice = useCallback(() => {
    setProgress((p) => {
      const today = todayStr();
      let streak = p.streak;
      if (p.lastDay !== today) {
        streak = p.lastDay === yesterdayStr() ? p.streak + 1 : 1;
      }
      return { ...p, sessions: p.sessions + 1, streak, lastDay: today };
    });
  }, []);

  const toggleLesson = (id) =>
    setProgress((p) => ({
      ...p,
      completed: p.completed.includes(id)
        ? p.completed.filter((x) => x !== id)
        : [...p.completed, id],
    }));

  /* ---- shared beat engine (Tone.js) ---- */
  const kitRef = useRef(null);
  const loopRef = useRef(null);
  const stepRef = useRef(-1);
  const barRef = useRef(0);
  const bpmRef = useRef(88);
  const intervalRef = useRef(4);
  const promptsRef = useRef([]);
  const promptIdxRef = useRef(0);
  const startTsRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [bar, setBar] = useState(0);
  const [bpm, setBpm] = useState(88);
  const [mode, setMode] = useState("words"); // 'words' | 'topics'
  const [changeEvery, setChangeEvery] = useState(4);
  const [prompt, setPrompt] = useState("press start");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    bpmRef.current = bpm;
    try {
      Tone.Transport.bpm.value = bpm;
    } catch (e) {}
  }, [bpm]);

  useEffect(() => {
    intervalRef.current = changeEvery;
  }, [changeEvery]);

  const modeRef = useRef("words");
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    let t;
    if (playing) {
      t = setInterval(() => {
        if (startTsRef.current)
          setElapsed((Date.now() - startTsRef.current) / 1000);
      }, 500);
    }
    return () => clearInterval(t);
  }, [playing]);

  const nextPrompt = useCallback((currentMode) => {
    const m = currentMode || modeRef.current;
    const list = promptsRef.current;
    if (!list.length) {
      promptsRef.current = shuffle(m === "words" ? WORDS : TOPICS);
      promptIdxRef.current = 0;
    }
    const p = promptsRef.current[promptIdxRef.current % promptsRef.current.length];
    promptIdxRef.current += 1;
    if (recordingRef.current) recPromptsRef.current.push(p);
    setPrompt(p);
  }, []);

  const startBeat = useCallback(async () => {
    await Tone.start();
    if (!kitRef.current) {
      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.35, sustain: 0 },
      }).toDestination();
      kick.volume.value = -2;
      const snare = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
      }).toDestination();
      snare.volume.value = -9;
      const hat = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.04, sustain: 0 },
      }).toDestination();
      hat.volume.value = -21;
      kitRef.current = { kick, snare, hat };
    }

    promptsRef.current = shuffle(mode === "words" ? WORDS : TOPICS);
    promptIdxRef.current = 0;
    nextPrompt(mode);

    stepRef.current = -1;
    barRef.current = 0;
    setBar(0);

    Tone.Transport.bpm.value = bpmRef.current;
    loopRef.current = Tone.Transport.scheduleRepeat((time) => {
      stepRef.current = (stepRef.current + 1) % 8;
      const s = stepRef.current;
      const kit = kitRef.current;
      try {
        kit.hat.triggerAttackRelease("16n", time, s % 2 === 0 ? 0.7 : 0.4);
        if (s === 0 || s === 3) kit.kick.triggerAttackRelease("C1", "8n", time);
        if (s === 2 || s === 6) kit.snare.triggerAttackRelease("8n", time);
      } catch (e) {}
      if (s === 0) {
        barRef.current += 1;
        const b = barRef.current;
        setBar(b);
        if (b > 1 && (b - 1) % intervalRef.current === 0) {
          nextPrompt(modeRef.current);
        }
      }
      setBeat(Math.floor(s / 2));
    }, "8n");

    Tone.Transport.start();
    startTsRef.current = Date.now();
    setElapsed(0);
    setPlaying(true);
  }, [mode, nextPrompt]);

  const stopBeat = useCallback(() => {
    try {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    } catch (e) {}
    setPlaying(false);
    setBeat(-1);
    const secs = startTsRef.current
      ? (Date.now() - startTsRef.current) / 1000
      : 0;
    startTsRef.current = null;
    if (secs >= 45) logPractice();
  }, [logPractice]);

  useEffect(() => () => {
    try {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    } catch (e) {}
  }, []);

  /* ---- Recording & the take log ---- */
  const [recording, setRecording] = useState(false);
  const [recElapsed, setRecElapsed] = useState(0);
  const [liveText, setLiveText] = useState("");
  const [micError, setMicError] = useState(null);
  const [takes, setTakes] = useState([]);
  const [judgingId, setJudgingId] = useState(null);

  const recordingRef = useRef(false);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const speechRef = useRef(null);
  const transcriptRef = useRef("");
  const recStartRef = useRef(null);
  const recPromptsRef = useRef([]);
  const urlMapRef = useRef({});

  useEffect(() => {
    (async () => {
      try {
        const r = await appStore.get("takes-v1");
        if (r && r.value) setTakes(JSON.parse(r.value));
      } catch (e) {
        /* no takes yet */
      }
    })();
  }, []);

  const saveTakes = useCallback(async (list) => {
    try {
      await appStore.set("takes-v1", JSON.stringify(list));
    } catch (e) {
      console.error("Couldn't save takes", e);
    }
  }, []);

  const updateTakes = useCallback(
    (updater) => {
      setTakes((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveTakes(next);
        return next;
      });
    },
    [saveTakes]
  );

  useEffect(() => {
    let t;
    if (recording) {
      t = setInterval(() => {
        if (recStartRef.current)
          setRecElapsed((Date.now() - recStartRef.current) / 1000);
      }, 500);
    }
    return () => clearInterval(t);
  }, [recording]);

  const startRecording = async () => {
    setMicError(null);
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setMicError("Recording isn't supported in this browser.");
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setMicError(
        "Mic access was denied — allow the microphone for this site in your browser settings, then try again."
      );
      return;
    }
    let mime = "";
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus"))
      mime = "audio/webm;codecs=opus";
    else if (MediaRecorder.isTypeSupported("audio/mp4")) mime = "audio/mp4";
    const mr = new MediaRecorder(
      stream,
      mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : undefined
    );
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size) chunksRef.current.push(e.data);
    };
    mr.start(1000);
    recRef.current = mr;

    transcriptRef.current = "";
    setLiveText("");
    recPromptsRef.current = playing ? [prompt] : [];

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const sr = new SR();
      sr.continuous = true;
      sr.interimResults = true;
      sr.lang = "en-US";
      sr.onresult = (ev) => {
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          if (res.isFinal) transcriptRef.current += res[0].transcript + " ";
          else interim += res[0].transcript;
        }
        const full = (transcriptRef.current + " " + interim).trim();
        setLiveText(full.length > 220 ? "…" + full.slice(-220) : full);
      };
      sr.onerror = () => {};
      sr.onend = () => {
        if (recordingRef.current) {
          try {
            sr.start();
          } catch (e) {}
        }
      };
      try {
        sr.start();
      } catch (e) {}
      speechRef.current = sr;
    }

    recStartRef.current = Date.now();
    setRecElapsed(0);
    recordingRef.current = true;
    setRecording(true);
  };

  const finishRecording = async () => {
    recordingRef.current = false;
    if (speechRef.current) {
      try {
        speechRef.current.stop();
      } catch (e) {}
      speechRef.current = null;
    }
    const mr = recRef.current;
    const blob = await new Promise((resolve) => {
      if (!mr || mr.state === "inactive") return resolve(null);
      mr.onstop = () => {
        try {
          mr.stream.getTracks().forEach((t) => t.stop());
        } catch (e) {}
        resolve(new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" }));
      };
      try {
        mr.stop();
      } catch (e) {
        resolve(null);
      }
    });
    recRef.current = null;
    const dur = recStartRef.current ? (Date.now() - recStartRef.current) / 1000 : 0;
    recStartRef.current = null;
    setRecording(false);
    setLiveText("");
    if (!blob || dur < 3) return;

    const id = String(Date.now());
    const take = {
      id,
      date: new Date().toISOString(),
      duration: Math.round(dur),
      bpm,
      mode,
      prompts: recPromptsRef.current.slice(0, 24),
      transcript: transcriptRef.current.trim(),
      eval: null,
      hasAudio: false,
    };
    urlMapRef.current[id] = URL.createObjectURL(blob);
    if (blob.size < 25000000) {
      try {
        const dataUrl = await blobToDataURL(blob);
        await appStore.set("takeaudio:" + id, dataUrl);
        take.hasAudio = true;
      } catch (e) {
        /* audio couldn't be stored — the transcript lives on */
      }
    }
    updateTakes((prev) => [take, ...prev]);
    if (dur >= 45) logPractice();
    setTab("log");
  };

  const deleteTake = async (id) => {
    updateTakes((prev) => prev.filter((t) => t.id !== id));
    delete urlMapRef.current[id];
    try {
      await appStore.delete("takeaudio:" + id);
    } catch (e) {}
  };

  const loadTakeAudio = async (id) => {
    if (urlMapRef.current[id]) return urlMapRef.current[id];
    try {
      const r = await appStore.get("takeaudio:" + id);
      if (r && r.value) {
        urlMapRef.current[id] = r.value;
        return r.value;
      }
    } catch (e) {}
    return null;
  };

  const editTranscript = (id, text) => {
    updateTakes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, transcript: text } : t))
    );
  };

  const addManualTake = () => {
    const id = String(Date.now());
    const take = {
      id,
      date: new Date().toISOString(),
      duration: 0,
      bpm,
      mode,
      prompts: [],
      transcript: "",
      eval: null,
      hasAudio: false,
      manual: true,
    };
    updateTakes((prev) => [take, ...prev]);
    setTab("log");
  };

  const judgeTake = async (take, override) => {
    const words = (override !== undefined ? override : take.transcript || "").trim();
    if (override !== undefined && override !== take.transcript) {
      updateTakes((prev) =>
        prev.map((t) => (t.id === take.id ? { ...t, transcript: override } : t))
      );
    }
    if (words.split(/\s+/).filter(Boolean).length < 8) {
      updateTakes((prev) =>
        prev.map((t) =>
          t.id === take.id
            ? {
                ...t,
                eval: {
                  verdict:
                    "The Freestyle God stirs, then settles back onto the throne. A handful of words is a sneeze, not a freestyle, mortal. If the machine failed to hear you, type your bars into the scroll above — then summon me again.",
                  scores: null,
                },
              }
            : t
        )
      );
      return;
    }
    const apiKey = (localStorage.getItem("otr:apikey") || "").trim();
    if (!apiKey) {
      updateTakes((prev) =>
        prev.map((t) =>
          t.id === take.id
            ? {
                ...t,
                eval: {
                  verdict:
                    "The God cannot hear you from this realm without an offering. Open ⚙ God settings at the top of The Log, paste your Anthropic API key, and summon again.",
                  scores: null,
                },
              }
            : t
        )
      );
      return;
    }
    setJudgingId(take.id);
    const promptText = `You are THE FREESTYLE GOD — ancient, all-hearing deity of the cypher, judge of every MC since the first breakbeat echoed off a Bronx wall. Your voice is booming, mythic, playfully arrogant, and funny — but your feedback is technically sharp and genuinely useful. You know rhyme schemes, slant rhyme, multisyllabics, internal rhymes, filler crutches, punchline setups, and theme control. Above all, you want this mortal to improve.

A mortal offers you a freestyle transcript. Context:
${take.manual ? "- The mortal spoke these bars out loud, then wrote or dictated them into the book by hand (no audio recording). Treat the words as intended — no transcription garble." : `- Duration: ${take.duration} seconds, over a ${take.bpm} BPM beat.`}
- Practice mode: ${take.mode === "words" ? "random word drops they had to work into bars" : "a topic round"}.
- Prompts dropped during the take: ${take.prompts && take.prompts.length ? take.prompts.join(", ") : "none recorded"}.

${take.manual ? "You cannot hear rhythm or delivery, so judge only what is on the page: rhyme craft, wordplay, vocabulary, and coherence." : "Important: this transcript came from imperfect speech-to-text. Some words are surely garbled — be generous about likely mishearings and never mock probable transcription errors. You cannot hear rhythm or delivery, so judge only what is on the page: rhyme craft, wordplay, vocabulary, coherence, and whether the dropped prompts were actually worked in."}

TRANSCRIPT:
"""
${words.slice(0, 4000)}
"""

Respond with ONLY a valid JSON object — no markdown fences, no preamble, no text outside the JSON:
{
  "verdict": "3-5 sentences of overall judgment in your godly voice, referencing specific moments from the transcript",
  "scores": { "rhymes": 0, "wordplay": 0, "vocabulary": 0, "coherence": 0 },
  "bestBar": "the single strongest line, quoted from the transcript",
  "weakSpot": "one sentence naming the single biggest habit holding them back",
  "commandment": "one imperative sentence: a specific drill or instruction for their next session"
}
Scores are integers 0-10. Be honest and calibrated — a beginner usually earns 3-6; reserve 8+ for genuinely impressive craft.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: promptText }],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const msg =
          data && data.error && data.error.message
            ? data.error.message
            : "status " + response.status;
        throw new Error(msg);
      }
      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const cleanText = text.replace(/```json|```/g, "").trim();
      let parsed = null;
      try {
        parsed = JSON.parse(cleanText);
      } catch (e) {
        const m = cleanText.match(/\{[\s\S]*\}/);
        if (m) {
          try {
            parsed = JSON.parse(m[0]);
          } catch (e2) {}
        }
      }
      if (!parsed || !parsed.verdict) {
        parsed = {
          verdict:
            cleanText ||
            "The heavens crackled, but no verdict came through. Summon the God again.",
          scores: null,
        };
      }
      updateTakes((prev) =>
        prev.map((t) => (t.id === take.id ? { ...t, eval: parsed } : t))
      );
    } catch (e) {
      updateTakes((prev) =>
        prev.map((t) =>
          t.id === take.id
            ? {
                ...t,
                eval: {
                  verdict:
                    "The heavens rejected the offering: " +
                    (e && e.message ? e.message : "connection failed") +
                    ". Check your API key in ⚙ God settings and summon again.",
                  scores: null,
                },
              }
            : t
        )
      );
    } finally {
      setJudgingId(null);
    }
  };

  /* ---- Rhyme Lab state ---- */
  const [rlTarget, setRlTarget] = useState(null);
  const [rlTime, setRlTime] = useState(30);
  const [rlRunning, setRlRunning] = useState(false);
  const [rlInput, setRlInput] = useState("");
  const [rlEntries, setRlEntries] = useState([]);
  const [rlBest, setRlBest] = useState(0);

  useEffect(() => {
    let t;
    if (rlRunning && rlTime > 0) {
      t = setTimeout(() => setRlTime((x) => x - 1), 1000);
    } else if (rlRunning && rlTime === 0) {
      setRlRunning(false);
      setRlBest((b) => Math.max(b, rlEntries.length));
      if (rlEntries.length > 0) logPractice();
    }
    return () => clearTimeout(t);
  }, [rlRunning, rlTime, rlEntries.length, logPractice]);

  const startRound = () => {
    setRlTarget(RHYME_TARGETS[Math.floor(Math.random() * RHYME_TARGETS.length)]);
    setRlEntries([]);
    setRlInput("");
    setRlTime(30);
    setRlRunning(true);
  };

  const submitRhyme = () => {
    const w = clean(rlInput);
    if (!w || !rlRunning) return;
    if (rlEntries.some((e) => e.word === w) || w === clean(rlTarget)) {
      setRlInput("");
      return;
    }
    let grade = "stretch";
    if (vowelTail(w) === vowelTail(rlTarget)) grade = "tight";
    else if (tailVowels(w) === tailVowels(rlTarget)) grade = "slant";
    setRlEntries((es) => [{ word: w, grade }, ...es]);
    setRlInput("");
  };

  /* ---- derived ---- */
  const done = progress.completed.length;
  const pct = Math.round((done / LESSONS.length) * 100);

  /* ============ RENDER ============ */
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: C.ink, fontFamily: BODY, color: C.ink }}
    >
      <style>{`
        @font-face {
          font-family: 'Archivo Black';
          src: url('./assets/fonts/archivo-black-latin-400-normal.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Caveat';
          src: url('./assets/fonts/caveat-latin-600-normal.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        .beatdot { transition: transform 0.08s ease, background-color 0.08s ease; }
        @media (prefers-reduced-motion: reduce) {
          .beatdot { transition: none; }
        }
        button:focus-visible, input:focus-visible {
          outline: 3px solid ${C.blue}; outline-offset: 2px;
        }
        input::placeholder { color: #A39B87; }
      `}</style>

      {/* ---- Header ---- */}
      <header
        className="w-full sticky top-0 z-10"
        style={{ backgroundColor: C.ink, color: C.paper }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-end justify-between gap-3">
          <div>
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: "1.5rem",
                lineHeight: 1,
                color: C.hi,
                letterSpacing: "0.02em",
              }}
            >
              OFF THE TOP
            </div>
            <div
              className="uppercase"
              style={{
                fontSize: "0.62rem",
                letterSpacing: "0.22em",
                color: "#B9B29E",
              }}
            >
              your freestyle rhyme book
            </div>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <div
                style={{ fontFamily: DISPLAY, fontSize: "1.1rem", color: C.paper }}
              >
                {progress.streak}
              </div>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.15em", color: "#B9B29E" }}>
                DAY STREAK
              </div>
            </div>
            <div>
              <div
                style={{ fontFamily: DISPLAY, fontSize: "1.1rem", color: C.paper }}
              >
                {progress.sessions}
              </div>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.15em", color: "#B9B29E" }}>
                SESSIONS
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---- Ruled paper page ---- */}
      <main
        className="flex-1 w-full relative overflow-y-auto"
        style={{
          background: `repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, ${C.line} 27px, ${C.line} 28px), ${C.paper}`,
        }}
      >
        {/* red margin line */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: "30px",
            width: "2px",
            backgroundColor: C.red,
            opacity: 0.45,
          }}
        />

        <div className="max-w-2xl mx-auto px-4 pb-32 pt-5" style={{ paddingLeft: "44px" }}>
          {/* ================= LEARN ================= */}
          <section className={tab === "learn" ? "" : "hidden"}>
            <MarginNote>the whole road, A to Z — check 'em off as you go ↓</MarginNote>

            {/* progress bar */}
            <div className="mt-3 mb-5">
              <div className="flex justify-between items-end mb-1">
                <span
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: "0.8rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  {done}/{LESSONS.length} LESSONS
                </span>
                <span style={{ fontSize: "0.7rem", color: C.dim }}>{pct}%</span>
              </div>
              <div
                className="w-full"
                style={{ height: "12px", border: `2px solid ${C.ink}`, backgroundColor: C.paper }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    backgroundColor: C.hi,
                    borderRight: pct > 0 && pct < 100 ? `2px solid ${C.ink}` : "none",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {LESSONS.map((ls, i) => (
                <LessonCard
                  key={ls.id}
                  lesson={ls}
                  index={i}
                  complete={progress.completed.includes(ls.id)}
                  onToggle={() => toggleLesson(ls.id)}
                />
              ))}
            </div>

            {done === LESSONS.length && (
              <div className="mt-6 text-center">
                <Highlight rotate={-2}>
                  <span style={{ fontFamily: DISPLAY, fontSize: "1rem" }}>
                    CURRICULUM COMPLETE — NOW GO RUN THE BOOTH DAILY
                  </span>
                </Highlight>
              </div>
            )}
          </section>

          {/* ================= BOOTH ================= */}
          <section className={tab === "booth" ? "" : "hidden"}>
            <MarginNote>
              beat drops, word drops — you keep rapping. never stop.
            </MarginNote>

            {/* mode toggle */}
            <div className="flex gap-2 mt-3">
              <InkButton
                active={mode === "words"}
                onClick={() => {
                  setMode("words");
                  if (playing) {
                    promptsRef.current = shuffle(WORDS);
                    promptIdxRef.current = 0;
                  }
                }}
              >
                Word drops
              </InkButton>
              <InkButton
                active={mode === "topics"}
                onClick={() => {
                  setMode("topics");
                  if (playing) {
                    promptsRef.current = shuffle(TOPICS);
                    promptIdxRef.current = 0;
                  }
                }}
              >
                Topic rounds
              </InkButton>
            </div>

            {/* the word */}
            <div
              className="mt-5 mb-4 flex flex-col items-center justify-center text-center"
              style={{ minHeight: "150px" }}
            >
              <div
                style={{
                  fontFamily: HAND,
                  color: C.blue,
                  fontSize: "1.1rem",
                  marginBottom: "10px",
                }}
              >
                {mode === "words" ? "work this into your bars:" : "rap about:"}
              </div>
              <Highlight rotate={-1.5}>
                <span
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: prompt.length > 18 ? "1.4rem" : "2.2rem",
                    lineHeight: 1.15,
                    textTransform: "uppercase",
                  }}
                >
                  {prompt}
                </span>
              </Highlight>
              {playing && (
                <button
                  onClick={() => nextPrompt(mode)}
                  className="mt-3 text-xs uppercase font-bold px-2 py-1"
                  style={{
                    fontFamily: BODY,
                    letterSpacing: "0.1em",
                    color: C.dim,
                    background: "none",
                    border: "none",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  skip →
                </button>
              )}
            </div>

            {/* beat dots */}
            <div className="flex items-center justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((b) => (
                <div
                  key={b}
                  className="beatdot flex items-center justify-center font-bold"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: `2px solid ${C.ink}`,
                    fontFamily: DISPLAY,
                    fontSize: "0.9rem",
                    backgroundColor:
                      beat === b ? (b === 1 || b === 3 ? C.red : C.ink) : C.paper,
                    color: beat === b ? C.paper : C.ink,
                    transform: beat === b ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  {b + 1}
                </div>
              ))}
            </div>

            <div className="text-center mb-4" style={{ fontSize: "0.75rem", color: C.dim }}>
              {playing ? (
                <>
                  bar <b style={{ color: C.ink }}>{bar}</b> · next drop in{" "}
                  <b style={{ color: C.ink }}>
                    {changeEvery - ((bar - 1) % changeEvery)}
                  </b>{" "}
                  bar(s) · {fmtTime(elapsed)}
                </>
              ) : (
                "snare hits on 2 and 4 — nod there"
              )}
            </div>

            {/* start / stop */}
            <div className="flex justify-center mb-6">
              {!playing ? (
                <InkButton big active onClick={startBeat}>
                  ▶ Start the beat
                </InkButton>
              ) : (
                <InkButton big onClick={stopBeat} style={{ borderColor: C.red, color: C.red, boxShadow: `3px 3px 0 ${C.red}` }}>
                  ■ Stop
                </InkButton>
              )}
            </div>

            {/* record */}
            <div className="flex flex-col items-center gap-2 mb-6">
              {!recording ? (
                <InkButton
                  onClick={startRecording}
                  style={{
                    borderColor: C.red,
                    color: C.red,
                    boxShadow: `3px 3px 0 ${C.red}`,
                  }}
                >
                  ● Record a take
                </InkButton>
              ) : (
                <InkButton
                  active
                  onClick={finishRecording}
                  style={{ backgroundColor: C.red, color: C.paper }}
                >
                  ■ Finish take · {fmtTime(recElapsed)}
                </InkButton>
              )}
              {micError && (
                <div style={{ fontSize: "0.7rem", color: C.red, textAlign: "center" }}>
                  {micError}
                </div>
              )}
              {recording && (
                <div
                  className="w-full p-3"
                  style={{
                    border: `2px dashed ${C.blue}`,
                    backgroundColor: "rgba(255,255,255,0.6)",
                  }}
                >
                  <div
                    className="uppercase font-bold mb-1"
                    style={{ fontSize: "0.6rem", letterSpacing: "0.15em", color: C.red }}
                  >
                    ● rec — live transcript
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      lineHeight: 1.5,
                      fontStyle: "italic",
                      minHeight: "1.5em",
                    }}
                  >
                    {liveText || "listening… (if nothing appears, you can type your bars in The Log after)"}
                  </div>
                </div>
              )}
              {!recording && (
                <div style={{ fontSize: "0.65rem", color: C.dim, textAlign: "center" }}>
                  headphones recommended — the mic hears the beat too. takes land in The Log.
                </div>
              )}
            </div>

            {/* controls */}
            <div
              className="p-4 flex flex-col gap-4"
              style={{ border: `2px solid ${C.ink}`, backgroundColor: "rgba(255,255,255,0.55)" }}
            >
              <div>
                <div className="flex justify-between mb-1">
                  <label
                    htmlFor="bpm"
                    className="uppercase font-bold"
                    style={{ fontSize: "0.65rem", letterSpacing: "0.15em" }}
                  >
                    Tempo
                  </label>
                  <span style={{ fontFamily: DISPLAY, fontSize: "0.8rem" }}>{bpm} BPM</span>
                </div>
                <input
                  id="bpm"
                  type="range"
                  min={70}
                  max={110}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: C.red }}
                />
                <div className="flex justify-between" style={{ fontSize: "0.6rem", color: C.dim }}>
                  <span>70 · roomy</span>
                  <span>110 · sprint</span>
                </div>
              </div>

              <div>
                <div
                  className="uppercase font-bold mb-1"
                  style={{ fontSize: "0.65rem", letterSpacing: "0.15em" }}
                >
                  New drop every
                </div>
                <div className="flex gap-2">
                  {[2, 4, 8].map((n) => (
                    <InkButton
                      key={n}
                      active={changeEvery === n}
                      onClick={() => setChangeEvery(n)}
                    >
                      {n} bars
                    </InkButton>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <MarginNote>
                45+ seconds on the mic = a logged session. record a take and the
                Freestyle God will judge your bars in The Log.
              </MarginNote>
            </div>
          </section>

          {/* ================= RHYME LAB ================= */}
          <section className={tab === "rhyme" ? "" : "hidden"}>
            <MarginNote>
              30 seconds. one word. flood it with rhymes — vowels are what count.
            </MarginNote>

            <div
              className="mt-4 mb-4 flex flex-col items-center text-center"
              style={{ minHeight: "120px", justifyContent: "center" }}
            >
              {rlTarget ? (
                <>
                  <div style={{ fontFamily: HAND, color: C.blue, fontSize: "1.1rem", marginBottom: "8px" }}>
                    rhyme with:
                  </div>
                  <Highlight rotate={1}>
                    <span
                      style={{
                        fontFamily: DISPLAY,
                        fontSize: "2.2rem",
                        textTransform: "uppercase",
                      }}
                    >
                      {rlTarget}
                    </span>
                  </Highlight>
                </>
              ) : (
                <div style={{ fontFamily: HAND, color: C.blue, fontSize: "1.3rem" }}>
                  hit start and empty your brain onto the page
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 mb-4">
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: "1.6rem",
                  color: rlRunning && rlTime <= 5 ? C.red : C.ink,
                  minWidth: "70px",
                  textAlign: "center",
                }}
              >
                0:{String(rlTime).padStart(2, "0")}
              </div>
              <InkButton big={!rlRunning} active={!rlRunning} onClick={startRound}>
                {rlTarget ? "New round" : "▶ Start"}
              </InkButton>
            </div>

            {rlTarget && (
              <div className="flex gap-2 mb-3">
                <input
                  value={rlInput}
                  onChange={(e) => setRlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitRhyme()}
                  disabled={!rlRunning}
                  placeholder={rlRunning ? "type a rhyme, hit enter" : "time's up"}
                  autoComplete="off"
                  autoCapitalize="off"
                  className="flex-1 px-3 py-3"
                  style={{
                    border: `2px solid ${C.ink}`,
                    backgroundColor: rlRunning ? "#FFFFFF" : "#EDE8DA",
                    fontFamily: BODY,
                    fontSize: "1rem",
                    color: C.ink,
                  }}
                />
                <InkButton onClick={submitRhyme} disabled={!rlRunning}>
                  Add
                </InkButton>
              </div>
            )}

            {rlTarget && (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontFamily: DISPLAY, fontSize: "0.85rem" }}>
                    {rlEntries.length} RHYME{rlEntries.length === 1 ? "" : "S"}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: C.dim }}>
                    best round: {rlBest}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rlEntries.map((e, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-sm font-bold"
                      style={{
                        border: `2px solid ${C.ink}`,
                        backgroundColor:
                          e.grade === "tight"
                            ? C.hi
                            : e.grade === "slant"
                            ? "#FFFFFF"
                            : "#EDE8DA",
                        color: C.ink,
                      }}
                    >
                      {e.word}
                      <span
                        className="uppercase"
                        style={{ fontSize: "0.55rem", marginLeft: "6px", color: C.dim, letterSpacing: "0.1em" }}
                      >
                        {e.grade}
                      </span>
                    </span>
                  ))}
                </div>
                {!rlRunning && rlEntries.length > 0 && (
                  <div className="mt-4">
                    <MarginNote>
                      my ear is approximate — "stretch" rhymes might still bang out loud.
                      trust your mouth over my math.
                    </MarginNote>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ================= THE LOG ================= */}
          <section className={tab === "log" ? "" : "hidden"}>
            <MarginNote>
              every take, written in the book. fix the scroll if the machine
              misheard you — then summon the God.
            </MarginNote>

            <GodKey />

            {takes.length === 0 ? (
              <div className="mt-8 text-center">
                <div
                  style={{ fontFamily: DISPLAY, fontSize: "1.2rem", marginBottom: "8px" }}
                >
                  THE BOOK IS EMPTY
                </div>
                <div
                  style={{ fontSize: "0.85rem", color: C.dim, marginBottom: "16px" }}
                >
                  Hit ● Record in The Booth — or if recording is blocked on your
                  device, write a take by hand and use your keyboard's dictation
                  mic to speak your bars in.
                </div>
                <div className="flex flex-col items-center gap-3">
                  <InkButton active onClick={() => setTab("booth")}>
                    Go to The Booth
                  </InkButton>
                  <InkButton onClick={addManualTake}>✎ Write a take by hand</InkButton>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex justify-end">
                  <InkButton onClick={addManualTake}>✎ Write a take by hand</InkButton>
                </div>
                {takes.map((t) => (
                  <TakeCard
                    key={t.id}
                    take={t}
                    judging={judgingId === t.id}
                    onJudge={(text) => judgeTake(t, text)}
                    onDelete={() => deleteTake(t.id)}
                    onEdit={(text) => editTranscript(t.id, text)}
                    loadAudio={() => loadTakeAudio(t.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ---- Bottom tabs ---- */}
      <nav
        className="w-full sticky bottom-0 z-10"
        style={{ backgroundColor: C.ink }}
      >
        <div className="max-w-2xl mx-auto flex">
          {[
            { id: "learn", label: "Lessons" },
            { id: "booth", label: "Booth" },
            { id: "rhyme", label: "Rhymes" },
            { id: "log", label: "The Log" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-4 uppercase font-bold"
              style={{
                fontFamily: DISPLAY,
                fontSize: "0.68rem",
                letterSpacing: "0.05em",
                backgroundColor: tab === t.id ? C.hi : C.ink,
                color: tab === t.id ? C.ink : C.paper,
                border: "none",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

/* ============ Lesson card ============ */

function LessonCard({ lesson, index, complete, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: `2px solid ${C.ink}`,
        backgroundColor: complete ? "rgba(249,224,75,0.28)" : "rgba(255,255,255,0.6)",
        boxShadow: `3px 3px 0 rgba(26,22,15,0.25)`,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
        style={{ background: "none", border: "none", cursor: "pointer", color: C.ink }}
        aria-expanded={open}
      >
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: "1.3rem",
            color: complete ? C.ink : C.red,
            lineHeight: 1,
            minWidth: "34px",
          }}
        >
          {complete ? "✓" : String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1">
          <span
            className="block uppercase"
            style={{ fontSize: "0.58rem", letterSpacing: "0.2em", color: C.dim }}
          >
            {lesson.tag}
          </span>
          <span
            className="block"
            style={{ fontFamily: DISPLAY, fontSize: "0.95rem", lineHeight: 1.25 }}
          >
            {lesson.title}
          </span>
        </span>
        <span style={{ fontFamily: DISPLAY, color: C.dim }}>{open ? "–" : "+"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {lesson.body.map((p, i) => (
            <p key={i} className="mb-3" style={{ fontSize: "0.9rem", lineHeight: 1.55 }}>
              {p}
            </p>
          ))}
          <div
            className="p-3 mb-3"
            style={{ backgroundColor: C.hi, border: `2px solid ${C.ink}` }}
          >
            <div
              className="uppercase font-bold mb-1"
              style={{ fontFamily: DISPLAY, fontSize: "0.65rem", letterSpacing: "0.15em" }}
            >
              ✎ Drill
            </div>
            <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>{lesson.drill}</div>
          </div>
          <InkButton active={complete} onClick={onToggle}>
            {complete ? "✓ Done — tap to undo" : "Mark complete"}
          </InkButton>
        </div>
      )}
    </div>
  );
}

/* ============ Take card (The Log) ============ */

function ScoreBar({ label, value }) {
  const v = Math.max(0, Math.min(10, Number(value) || 0));
  return (
    <div className="flex items-center gap-2">
      <span
        className="uppercase"
        style={{ fontSize: "0.6rem", letterSpacing: "0.1em", width: "84px", color: C.dim }}
      >
        {label}
      </span>
      <div
        className="flex-1"
        style={{ height: "10px", border: `2px solid ${C.ink}`, backgroundColor: C.paper }}
      >
        <div
          style={{
            height: "100%",
            width: `${v * 10}%`,
            backgroundColor: v >= 7 ? C.hi : v >= 4 ? C.blue : C.red,
          }}
        />
      </div>
      <span
        style={{ fontFamily: DISPLAY, fontSize: "0.7rem", width: "26px", textAlign: "right" }}
      >
        {v}
      </span>
    </div>
  );
}

function TakeCard({ take, judging, onJudge, onDelete, onEdit, loadAudio }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(take.transcript || "");
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioMissing, setAudioMissing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    setText(take.transcript || "");
  }, [take.transcript]);

  const d = new Date(take.date);
  const when =
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const ev = take.eval;

  return (
    <div
      style={{
        border: `2px solid ${C.ink}`,
        backgroundColor: "rgba(255,255,255,0.6)",
        boxShadow: "3px 3px 0 rgba(26,22,15,0.25)",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
        style={{ background: "none", border: "none", cursor: "pointer", color: C.ink }}
        aria-expanded={open}
      >
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: "1rem",
            color: ev && ev.scores ? C.ink : C.red,
            minWidth: "38px",
          }}
        >
          {ev && ev.scores ? avgScore(ev.scores) : "—"}
        </span>
        <span className="flex-1">
          <span className="block" style={{ fontFamily: DISPLAY, fontSize: "0.85rem" }}>
            {when} · {take.manual ? "by hand" : fmtTime(take.duration)}
          </span>
          <span className="block" style={{ fontSize: "0.7rem", color: C.dim }}>
            {take.manual
              ? "written take"
              : `${take.bpm} BPM · ${take.mode === "words" ? "word drops" : "topic round"}`}{" "}
            · {ev ? "judged" : "awaiting judgment"}
          </span>
        </span>
        <span style={{ fontFamily: DISPLAY, color: C.dim }}>{open ? "–" : "+"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {take.prompts && take.prompts.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {take.prompts.map((p, i) => (
                <span
                  key={i}
                  className="px-2 py-1 uppercase"
                  style={{
                    fontSize: "0.6rem",
                    letterSpacing: "0.08em",
                    border: `1px solid ${C.dim}`,
                    color: C.dim,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}

          <div>
            <div
              className="uppercase font-bold mb-1"
              style={{ fontSize: "0.6rem", letterSpacing: "0.15em", color: C.blue }}
            >
              The scroll — edit if the machine misheard you
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => text !== take.transcript && onEdit(text)}
              rows={5}
              placeholder="No transcript was caught — type your bars here so the God can judge them."
              className="w-full p-3"
              style={{
                border: `2px solid ${C.ink}`,
                backgroundColor: "#FFFFFF",
                fontFamily: BODY,
                fontSize: "0.85rem",
                lineHeight: 1.5,
                color: C.ink,
                resize: "vertical",
              }}
            />
          </div>

          {take.manual ? null : audioUrl ? (
            <audio controls src={audioUrl} className="w-full" />
          ) : audioMissing ? (
            <div style={{ fontSize: "0.65rem", color: C.dim }}>
              audio for this take isn't stored — the transcript lives on.
            </div>
          ) : (
            <InkButton
              onClick={async () => {
                const u = await loadAudio();
                if (u) setAudioUrl(u);
                else setAudioMissing(true);
              }}
            >
              ▶ Load recording
            </InkButton>
          )}

          {ev && (
            <div style={{ border: `2px solid ${C.ink}` }}>
              <div
                className="px-3 py-2"
                style={{
                  backgroundColor: C.ink,
                  color: C.hi,
                  fontFamily: DISPLAY,
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                }}
              >
                ⚡ THE FREESTYLE GOD HAS SPOKEN
              </div>
              <div
                className="p-3 flex flex-col gap-3"
                style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
              >
                {ev.scores && (
                  <div className="flex flex-col gap-1">
                    <ScoreBar label="Rhyme craft" value={ev.scores.rhymes} />
                    <ScoreBar label="Wordplay" value={ev.scores.wordplay} />
                    <ScoreBar label="Vocabulary" value={ev.scores.vocabulary} />
                    <ScoreBar label="Coherence" value={ev.scores.coherence} />
                  </div>
                )}
                <p style={{ fontSize: "0.85rem", lineHeight: 1.55 }}>{ev.verdict}</p>
                {ev.bestBar && (
                  <div>
                    <div
                      className="uppercase font-bold mb-1"
                      style={{ fontSize: "0.6rem", letterSpacing: "0.15em", color: C.dim }}
                    >
                      Best bar
                    </div>
                    <Highlight rotate={-1}>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                        "{ev.bestBar}"
                      </span>
                    </Highlight>
                  </div>
                )}
                {ev.weakSpot && (
                  <div style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                    <span
                      className="uppercase font-bold"
                      style={{ fontSize: "0.6rem", letterSpacing: "0.15em", color: C.red }}
                    >
                      Weak spot ·{" "}
                    </span>
                    {ev.weakSpot}
                  </div>
                )}
                {ev.commandment && (
                  <div className="p-3" style={{ backgroundColor: C.hi, border: `2px solid ${C.ink}` }}>
                    <div
                      className="uppercase font-bold mb-1"
                      style={{ fontFamily: DISPLAY, fontSize: "0.6rem", letterSpacing: "0.15em" }}
                    >
                      ⚡ Commandment
                    </div>
                    <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>{ev.commandment}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 items-center flex-wrap">
            <InkButton active onClick={() => onJudge(text)} disabled={judging}>
              {judging
                ? "The God listens…"
                : ev
                ? "⚡ Summon again"
                : "⚡ Summon the Freestyle God"}
            </InkButton>
            {confirmDel ? (
              <>
                <InkButton
                  onClick={onDelete}
                  style={{ borderColor: C.red, color: C.red, boxShadow: `3px 3px 0 ${C.red}` }}
                >
                  Really delete
                </InkButton>
                <InkButton onClick={() => setConfirmDel(false)}>Keep</InkButton>
              </>
            ) : (
              <button
                onClick={() => setConfirmDel(true)}
                style={{
                  background: "none",
                  border: "none",
                  textDecoration: "underline",
                  color: C.dim,
                  fontSize: "0.7rem",
                  cursor: "pointer",
                }}
              >
                delete take
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ God settings (API key, web version only) ============ */

function GodKey() {
  const [key, setKey] = useState(
    () => localStorage.getItem("otr:apikey") || ""
  );
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div
      className="mt-3"
      style={{ border: `2px solid ${C.ink}`, backgroundColor: "rgba(255,255,255,0.55)" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-3 py-2 flex justify-between items-center"
        style={{ background: "none", border: "none", cursor: "pointer", color: C.ink }}
        aria-expanded={open}
      >
        <span
          className="uppercase font-bold"
          style={{ fontFamily: DISPLAY, fontSize: "0.65rem", letterSpacing: "0.1em" }}
        >
          ⚙ God settings {key ? "· key set" : "· key missing"}
        </span>
        <span style={{ fontFamily: DISPLAY, color: C.dim }}>{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          <div style={{ fontSize: "0.7rem", color: C.dim, lineHeight: 1.5 }}>
            On this site, the Freestyle God speaks through your own Anthropic API
            key (create one at console.anthropic.com). It is stored only in this
            browser and sent only to api.anthropic.com — but treat it like a
            password and never share this device or the key.
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setSaved(false);
              }}
              placeholder="sk-ant-…"
              autoComplete="off"
              className="flex-1 px-3 py-2"
              style={{
                border: `2px solid ${C.ink}`,
                fontFamily: BODY,
                fontSize: "0.85rem",
                backgroundColor: "#FFFFFF",
                color: C.ink,
              }}
            />
            <InkButton
              onClick={() => {
                localStorage.setItem("otr:apikey", key.trim());
                setSaved(true);
              }}
            >
              {saved ? "✓ Saved" : "Save"}
            </InkButton>
          </div>
        </div>
      )}
    </div>
  );
}
