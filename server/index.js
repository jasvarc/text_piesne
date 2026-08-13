const path = require('path');
const express = require('express');
const yts = require('yt-search');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

async function findVideo(artist, title) {
  const query = [artist, title].filter(Boolean).join(' ');
  if (!query) return null;
  const result = await yts(query);
  const count = result && result.videos ? result.videos.length : 0;
  console.log(`[youtube] dopyt "${query}" -> ${count} výsledkov`);
  const video = result.videos && result.videos[0];
  if (!video) return null;
  return {
    videoId: video.videoId,
    title: video.title,
    author: video.author && video.author.name,
    thumbnail: video.thumbnail,
  };
}

async function findLyrics(artist, title) {
  if (!artist || !title) return null;
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const { data } = await axios.get(url, { timeout: 8000 });
    if (data && data.lyrics) {
      return data.lyrics.trim();
    }
    console.log(`[lyrics] "${artist} - ${title}" -> žiadny text v odpovedi lyrics.ovh`);
    return null;
  } catch (err) {
    const status = err.response ? err.response.status : 'bez odpovede';
    console.error(`[lyrics] chyba pre "${artist} - ${title}" (status ${status}): ${err.message}`);
    return null;
  }
}

app.post('/api/find', async (req, res) => {
  const artist = (req.body.artist || '').trim();
  const title = (req.body.title || '').trim();

  console.log(`[find] dopyt: interpret="${artist}" názov="${title}"`);

  if (!artist && !title) {
    return res.status(400).json({ error: 'Zadaj aspoň interpreta alebo názov piesne.' });
  }

  try {
    let video = null;
    try {
      video = await findVideo(artist, title);
    } catch (err) {
      console.error(`[find] YouTube search zlyhal pre "${artist} ${title}":`, err && err.stack ? err.stack : err);
    }

    const lyricsArtist = artist || (video && video.author) || '';
    const lyrics = await findLyrics(lyricsArtist, title);

    console.log(`[find] výsledok: video=${video ? `ÁNO (${video.videoId})` : 'NIE'} lyrics=${lyrics ? 'ÁNO' : 'NIE'}`);

    res.json({ video, lyrics });
  } catch (err) {
    console.error('[find] neočakávaná chyba:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Interná chyba servera.' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`text_piesne beží na http://${HOST}:${PORT} (iba lokálne, verejne je dostupná cez Apache reverse proxy)`);
});
