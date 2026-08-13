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
const lyricsMissing = document.getElementById('lyrics-missing');
const gameProgress = document.getElementById('game-progress');
const lyricsText = document.getElementById('lyrics-text');
const gameComplete = document.getElementById('game-complete');
const newSongBtn = document.getElementById('new-song-btn');

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

  return wrap;
}

function renderLyricsGame(lyrics) {
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

  lyricsText.innerHTML = '';
  rawLines.forEach((line, idx) => {
    if (line.trim() === '') {
      lyricsText.appendChild(document.createElement('br'));
      return;
    }
    const lineDiv = document.createElement('div');
    const blank = blanksByLine.get(idx);
    if (blank) {
      lineDiv.appendChild(document.createTextNode(line.slice(0, blank.start)));
      const distractors = pickDistractors(pool, blank.word, 2);
      lineDiv.appendChild(makeBlankWidget(blank.word, distractors));
      lineDiv.appendChild(document.createTextNode(line.slice(blank.end)));
    } else {
      lineDiv.textContent = line;
    }
    lyricsText.appendChild(lineDiv);
  });

  totalBlanks = blanks.length;
  solvedBlanks = 0;
  lyricsMissing.classList.add('hidden');
  gameProgress.classList.remove('hidden');
  updateProgress();
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

  try {
    const res = await fetch('/api/find', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artist, title }),
    });
    const data = await res.json();

    if (!data.video) {
      notFoundMsg.textContent = 'Túto pieseň sa nepodarilo nájsť na YouTube. Skontroluj názov/interpreta a skús to znova.';
      showOnly(notFoundSection);
      return;
    }

    videoBox.innerHTML = `<iframe src="https://www.youtube.com/embed/${data.video.videoId}" allowfullscreen></iframe>`;

    gameComplete.classList.add('hidden');
    if (data.lyrics) {
      renderLyricsGame(data.lyrics);
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
