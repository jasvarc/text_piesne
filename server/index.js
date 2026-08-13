const path = require('path');
const express = require('express');
const yts = require('yt-search');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

async function findVideo(artist, title) {
  const query = [artist, title].filter(Boolean).join(' ');
  if (!query) return null;
  const result = await yts(query);
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
    return null;
  } catch (err) {
    return null;
  }
}

app.post('/api/find', async (req, res) => {
  const artist = (req.body.artist || '').trim();
  const title = (req.body.title || '').trim();

  if (!artist && !title) {
    return res.status(400).json({ error: 'Zadaj aspoň interpreta alebo názov piesne.' });
  }

  let video = null;
  try {
    video = await findVideo(artist, title);
  } catch (err) {
    console.error('YouTube search failed:', err.message);
  }

  const lyricsArtist = artist || (video && video.author) || '';
  const lyrics = await findLyrics(lyricsArtist, title);

  res.json({
    video,
    lyrics,
  });
});

app.listen(PORT, () => {
  console.log(`text_piesne beží na http://localhost:${PORT}`);
});
