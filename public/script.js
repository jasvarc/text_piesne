const APP_VERSION = 'origin-fix-1';

const artistInput = document.getElementById('artist');
const titleInput = document.getElementById('title');
const findBtn = document.getElementById('find-btn');
const searchError = document.getElementById('search-error');

const searchSection = document.getElementById('search-section');
const loadingSection = document.getElementById('loading');
const notFoundSection = document.getElementById('not-found');
const notFoundMsg = document.getElementById('not-found-msg');
const retryBtn = document.getElementById('retry-btn');
const resultSection = document.getElementById('result');

const videoBox = document.getElementById('video-box');
const videoFallback = document.getElementById('video-fallback');
const lyricsMissing = document.getElementById('lyrics-missing');
const gameProgress = document.getElementById('game-progress');
const lyricsText = document.getElementById('lyrics-text');
const gameComplete = document.getElementById('game-complete');
const newSongBtn = document.getElementById('new-song-btn');

const debugSection = document.getElementById('debug-section');
const debugLogEl = document.getElementById('debug-log');

function debugLog(msg) {
  const time = new Date().toLocaleTimeString('sk-SK');
  debugLogEl.textContent += `[${time}] ${msg}\n`;
  debugSection.classList.remove('hidden');
  debugLogEl.scrollTop = debugLogEl.scrollHeight;
}

function debugReset() {
  debugLogEl.textContent = '';
  debugSection.classList.remove('hidden');
}

const YT_ERROR_MESSAGES = {
  2: 'neplatné video ID (chyba appky)',
  5: 'chyba HTML5 prehrávača',
  100: 'video nenájdené / súkromné / zmazané',
  101: 'vlastník videa zakázal embedovanie na iných stránkach',
  150: 'vlastník videa zakázal embedovanie na iných stránkach',
};

let ytApiPromise = null;
function loadYouTubeAPI() {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const timeout = setTimeout(() => {
      reject(new Error('YouTube IFrame API sa nenačítalo do 6s (možno blokované rozšírením prehliadača)'));
    }, 6000);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      if (previous) previous();
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Skript https://www.youtube.com/iframe_api sa nepodarilo načítať (sieť/blokovanie)'));
    };
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

let videoCandidates = [];
let ytPlayer = null;

async function tryPlayVideo(index) {
  if (index >= videoCandidates.length) {
    debugLog(`Žiadne z ${videoCandidates.length} videí sa nepodarilo embedovať. Použi odkaz "otvoriť na YouTube" nižšie.`);
    videoBox.innerHTML = '';
    return;
  }

  const video = videoCandidates[index];
  debugLog(`Skúšam embed videa ${index + 1}/${videoCandidates.length}: ${video.videoId} ("${video.title}"), origin=${window.location.origin}`);

  try {
    await loadYouTubeAPI();
  } catch (err) {
    debugLog(`Chyba YouTube API: ${err.message}`);
    videoBox.innerHTML = '';
    return;
  }

  videoBox.innerHTML = '<div id="yt-player-target"></div>';

  ytPlayer = new YT.Player('yt-player-target', {
    videoId: video.videoId,
    width: '100%',
    height: '100%',
    host: 'https://www.youtube-nocookie.com',
    playerVars: { rel: 0, origin: window.location.origin },
    events: {
      onReady: () => debugLog(`Video ${video.videoId} sa úspešne načítalo.`),
      onError: (e) => {
        const reason = YT_ERROR_MESSAGES[e.data] || `neznáma chyba (kód ${e.data})`;
        debugLog(`Video ${video.videoId} zlyhalo: ${reason} [kód ${e.data}]`);
        tryPlayVideo(index + 1);
      },
    },
  });
}

const FALLBACK_WORDS = [
  'love', 'time', 'night', 'light', 'dream', 'heart', 'world', 'music',
  'dance', 'story', 'smile', 'friend', 'forever', 'today', 'magic', 'stars',
  'ocean', 'mountain', 'journey', 'laughter', 'sunshine', 'rainbow', 'freedom',
  'courage', 'wonder', 'harmony', 'melody', 'whisper', 'thunder', 'breeze',
];

let totalBlanks = 0;
let solvedBlanks = 0;

function updateProgress() {
  gameProgress.textContent = `Vyriešené: ${solvedBlanks} / ${totalBlanks}`;
  if (totalBlanks > 0 && solvedBlanks === totalBlanks) {
    gameComplete.classList.remove('hidden');
  } else {
    gameComplete.classList.add('hidden');
  }
}

function wordMatches(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

function pickWordInLines(lines, minLen) {
  const candidates = [];
  lines.forEach(({ lineIndex, text }) => {
    const regex = /\p{L}+/gu;
    let m;
    while ((m = regex.exec(text)) !== null) {
      if (m[0].length >= minLen) {
        candidates.push({ lineIndex, start: m.index, end: m.index + m[0].length, word: m[0] });
      }
    }
  });
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function selectBlanks(lyrics) {
  const rawLines = lyrics.split('\n');
  const stanzas = [];
  let current = [];
  rawLines.forEach((line, idx) => {
    if (line.trim() === '') {
      if (current.length) {
        stanzas.push(current);
        current = [];
      }
    } else {
      current.push({ lineIndex: idx, text: line });
    }
  });
  if (current.length) stanzas.push(current);

  const blanks = [];
  const usedLines = new Set();

  stanzas.forEach((stanza) => {
    let stanzaHasBlank = false;
    for (let i = 0; i < stanza.length; i += 2) {
      const group = stanza.slice(i, i + 2);
      const picked = pickWordInLines(group, 4);
      if (picked) {
        blanks.push(picked);
        usedLines.add(picked.lineIndex);
        stanzaHasBlank = true;
      }
    }
    if (!stanzaHasBlank && stanza.length) {
      const picked = pickWordInLines(stanza, 3);
      if (picked) {
        blanks.push(picked);
        usedLines.add(picked.lineIndex);
      }
    }
  });

  return { rawLines, blanks };
}

function buildDistractorPool(lyrics) {
  const pool = new Set();
  const regex = /\p{L}+/gu;
  let m;
  while ((m = regex.exec(lyrics)) !== null) {
    if (m[0].length >= 4) pool.add(m[0]);
  }
  FALLBACK_WORDS.forEach((w) => pool.add(w));
  return Array.from(pool);
}

function pickDistractors(pool, answer, count) {
  const shuffled = pool
    .filter((w) => !wordMatches(w, answer))
    .sort(() => Math.random() - 0.5);
  const picked = [];
  const seen = new Set([answer.toLowerCase()]);
  for (const w of shuffled) {
    if (picked.length >= count) break;
    if (seen.has(w.toLowerCase())) continue;
    seen.add(w.toLowerCase());
    picked.push(w);
  }
  return picked;
}

function makeBlankWidget(answer, distractors) {
  const wrap = document.createElement('span');
  wrap.className = 'blank-widget';

  const choices = [answer, ...distractors].sort(() => Math.random() - 0.5);

  choices.forEach((choiceWord) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice-btn';
    btn.textContent = choiceWord;
    btn.addEventListener('click', () => {
      if (wrap.classList.contains('solved')) return;
      if (wordMatches(choiceWord, answer)) {
        wrap.classList.add('solved');
        wrap.innerHTML = '';
        const revealed = document.createElement('span');
        revealed.className = 'revealed';
        revealed.textContent = answer;
        wrap.appendChild(revealed);
        solvedBlanks += 1;
        updateProgress();
      } else {
        btn.classList.add('wrong');
        btn.disabled = true;
      }
    });
    wrap.appendChild(btn);
  });

  const hintEl = document.createElement('span');
  hintEl.className = 'word-hint hidden';

  return { wrap, hintEl };
}

async function loadHints(blankWidgets, songContext) {
  const uniqueWords = Array.from(new Set(blankWidgets.map((b) => b.word)));
  if (!uniqueWords.length) return;

  debugLog(`Žiadam preklad hintov pre ${uniqueWords.length} slov (kontext="${songContext}")...`);

  try {
    const res = await fetch('api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words: uniqueWords, context: songContext }),
    });
    debugLog(`Preklad hintov: server odpovedal HTTP ${res.status}`);
    const data = await res.json();
    const translations = data.translations || {};
    const translatedCount = Object.keys(translations).length;

    if (data.error) {
      debugLog(`Preklad hintov: server vrátil chybu: ${data.error}`);
    }
    debugLog(`Preklad hintov: dostal som ${translatedCount} / ${uniqueWords.length} prekladov (${Object.entries(translations).map(([w, t]) => `${w}=${t}`).join(', ') || 'žiadne'})`);

    blankWidgets.forEach(({ word, hintEl }) => {
      const t = translations[word];
      if (t && hintEl.isConnected) {
        hintEl.textContent = `💡 ${t}`;
        hintEl.classList.remove('hidden');
      }
    });
  } catch (err) {
    debugLog(`Preklad hintov zlyhal: ${err.message}`);
  }
}

function renderLyricsGame(lyrics, songContext) {
  const { rawLines, blanks } = selectBlanks(lyrics);

  if (!blanks.length) {
    lyricsText.textContent = lyrics;
    lyricsMissing.textContent = 'V texte sa nenašlo vhodné slovo na vynechanie, ale môžeš si ho aspoň prečítať vyššie.';
    lyricsMissing.classList.remove('hidden');
    gameProgress.classList.add('hidden');
    totalBlanks = 0;
    solvedBlanks = 0;
    return;
  }

  const blanksByLine = new Map();
  blanks.forEach((b) => blanksByLine.set(b.lineIndex, b));

  const pool = buildDistractorPool(lyrics);
  const blankWidgets = [];

  lyricsText.innerHTML = '';
  rawLines.forEach((line, idx) => {
    if (line.trim() === '') {
      const spacer = document.createElement('div');
      spacer.className = 'lyrics-row-spacer';
      lyricsText.appendChild(spacer);
      return;
    }
    const lineDiv = document.createElement('div');
    lineDiv.className = 'lyrics-line';
    const hintCell = document.createElement('div');
    hintCell.className = 'hint-cell';

    const blank = blanksByLine.get(idx);
    if (blank) {
      lineDiv.appendChild(document.createTextNode(line.slice(0, blank.start)));
      const distractors = pickDistractors(pool, blank.word, 2);
      const { wrap, hintEl } = makeBlankWidget(blank.word, distractors);
      blankWidgets.push({ word: blank.word, hintEl });
      lineDiv.appendChild(wrap);
      lineDiv.appendChild(document.createTextNode(line.slice(blank.end)));
      hintCell.appendChild(hintEl);
    } else {
      lineDiv.textContent = line;
    }
    lyricsText.appendChild(lineDiv);
    lyricsText.appendChild(hintCell);
  });

  totalBlanks = blanks.length;
  solvedBlanks = 0;
  lyricsMissing.classList.add('hidden');
  gameProgress.classList.remove('hidden');
  updateProgress();

  loadHints(blankWidgets, songContext);
}

async function findSong() {
  const artist = artistInput.value.trim();
  const title = titleInput.value.trim();

  searchError.classList.add('hidden');
  if (!artist && !title) {
    searchError.textContent = 'Zadaj aspoň interpreta alebo názov piesne.';
    searchError.classList.remove('hidden');
    return;
  }

  showOnly(loadingSection);
  debugReset();
  debugLog(`Hľadám: interpret="${artist}" názov="${title}"`);

  try {
    const res = await fetch('api/find', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artist, title }),
    });
    debugLog(`Server odpovedal: HTTP ${res.status}`);
    const data = await res.json();
    const videos = data.videos || [];
    debugLog(`Nájdených YouTube výsledkov: ${videos.length}${videos.length ? ' (' + videos.map((v) => v.videoId).join(', ') + ')' : ''}, text piesne: ${data.lyrics ? 'áno' : 'nie'}`);

    if (!videos.length) {
      notFoundMsg.textContent = 'Túto pieseň sa nepodarilo nájsť na YouTube. Skontroluj názov/interpreta a skús to znova.';
      showOnly(notFoundSection);
      return;
    }

    videoCandidates = videos;
    videoFallback.href = `https://www.youtube.com/watch?v=${videos[0].videoId}`;
    videoFallback.classList.remove('hidden');
    tryPlayVideo(0);

    gameComplete.classList.add('hidden');
    if (data.lyrics) {
      const songContext = videos[0].title || `${artist} ${title}`.trim();
      renderLyricsGame(data.lyrics, songContext);
    } else {
      lyricsText.textContent = '';
      gameProgress.classList.add('hidden');
      lyricsMissing.textContent = 'Text tejto piesne sa nepodarilo nájsť (appka zatiaľ podporuje len anglické piesne), ale video si môžeš vypočuť vyššie.';
      lyricsMissing.classList.remove('hidden');
      totalBlanks = 0;
      solvedBlanks = 0;
    }

    showOnly(resultSection);
  } catch (err) {
    debugLog(`Chyba pri fetch/spracovaní: ${err.message}`);
    notFoundMsg.textContent = 'Nastala chyba pri hľadaní piesne. Skús to znova.';
    showOnly(notFoundSection);
  }
}

function showOnly(section) {
  [searchSection, loadingSection, notFoundSection, resultSection].forEach((s) => {
    s.classList.add('hidden');
  });
  section.classList.remove('hidden');
}

findBtn.addEventListener('click', findSong);
[artistInput, titleInput].forEach((el) => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') findSong();
  });
});

retryBtn.addEventListener('click', () => {
  showOnly(searchSection);
});

newSongBtn.addEventListener('click', () => {
  artistInput.value = '';
  titleInput.value = '';
  showOnly(searchSection);
  artistInput.focus();
});

artistInput.focus();
