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
const lyricsText = document.getElementById('lyrics-text');
const gameControls = document.getElementById('game-controls');
const guessInput = document.getElementById('guess');
const checkBtn = document.getElementById('check-btn');
const gameFeedback = document.getElementById('game-feedback');
const newSongBtn = document.getElementById('new-song-btn');

let currentAnswer = null;

function showOnly(section) {
  [searchSection, loadingSection, notFoundSection, resultSection].forEach((s) => {
    s.classList.add('hidden');
  });
  section.classList.remove('hidden');
}

function normalize(word) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function pickBlankIndex(words) {
  const candidates = [];
  words.forEach((w, i) => {
    const bare = w.replace(/[^\p{L}]/gu, '');
    if (bare.length >= 4) candidates.push(i);
  });
  if (candidates.length === 0) return -1;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function renderLyricsWithBlank(lyrics) {
  const words = lyrics.split(/(\s+)/);
  const wordIndexes = [];
  words.forEach((w, i) => {
    if (!/^\s+$/.test(w) && w.length > 0) wordIndexes.push(i);
  });

  const blankPos = pickBlankIndex(wordIndexes.map((i) => words[i]));
  if (blankPos === -1) {
    lyricsText.textContent = lyrics;
    gameControls.classList.add('hidden');
    lyricsMissing.textContent = 'V texte sa nenašlo vhodné slovo na vynechanie, ale môžeš si ho aspoň prečítať vyššie.';
    lyricsMissing.classList.remove('hidden');
    currentAnswer = null;
    return;
  }

  const blankWordIndex = wordIndexes[blankPos];
  const original = words[blankWordIndex];
  const bare = original.replace(/[^\p{L}]/gu, '');
  currentAnswer = bare;

  lyricsText.innerHTML = '';
  words.forEach((w, i) => {
    if (i === blankWordIndex) {
      const span = document.createElement('span');
      span.className = 'blank';
      span.textContent = '_____';
      lyricsText.appendChild(span);
    } else {
      lyricsText.appendChild(document.createTextNode(w));
    }
  });

  gameControls.classList.remove('hidden');
  lyricsMissing.classList.add('hidden');
  guessInput.value = '';
  gameFeedback.textContent = '';
  gameFeedback.className = '';
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

    if (data.lyrics) {
      renderLyricsWithBlank(data.lyrics);
    } else {
      lyricsText.textContent = '';
      gameControls.classList.add('hidden');
      lyricsMissing.textContent = 'Text tejto piesne sa nepodarilo nájsť (appka zatiaľ podporuje len anglické piesne), ale video si môžeš vypočuť vyššie.';
      lyricsMissing.classList.remove('hidden');
      currentAnswer = null;
    }

    showOnly(resultSection);
  } catch (err) {
    notFoundMsg.textContent = 'Nastala chyba pri hľadaní piesne. Skús to znova.';
    showOnly(notFoundSection);
  }
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

checkBtn.addEventListener('click', () => {
  if (!currentAnswer) return;
  const guess = normalize(guessInput.value.trim());
  const answer = normalize(currentAnswer);
  if (guess && guess === answer) {
    gameFeedback.textContent = '✅ Správne!';
    gameFeedback.className = 'correct';
    const blank = lyricsText.querySelector('.blank');
    if (blank) blank.textContent = currentAnswer;
  } else {
    gameFeedback.textContent = '❌ Skús to znova.';
    gameFeedback.className = 'incorrect';
  }
});

guessInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkBtn.click();
});

artistInput.focus();
