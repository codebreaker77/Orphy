// Genre & Vibe Detector for Orphy
// Analyzes track metadata (title, artist, album) to determine the music vibe & dance style.

const GenreDetector = {
  detect(info) {
    if (!info || !info.title) return 'standard';

    const text = `${info.title} ${info.artist || ''} ${info.album || ''}`.toLowerCase();

    // 1. Metal & Hard Rock (Headbanger)
    const rockKeywords = [
      'rock', 'metal', 'punk', 'grunge', 'heavy', 'hard rock', 'alt rock', 'guitar',
      'metallica', 'slipknot', 'linkin park', 'nirvana', 'rammstein', 'green day',
      'blink-182', 'bring me the horizon', 'arctic monkeys', 'radiohead', 'muse',
      'queen', 'led zeppelin', 'foo fighters', 'paramore', 'my chemical romance',
      'disturbed', 'judas priest', 'iron maiden', 'deftones', 'korn', 'system of a down',
      'slayer', 'megadeth', 'avenged sevenfold', 'fall out boy', 'rise against',
      'sombr', 'pierce the veil', 'sleeping with sirens', 'three days grace', 'skillet'
    ];
    for (const kw of rockKeywords) {
      if (text.includes(kw)) return 'rock';
    }

    // 2. Chill, Lo-Fi, Acoustic, Classical, Jazz
    const chillKeywords = [
      'lo-fi', 'lofi', 'chill', 'acoustic', 'ambient', 'piano', 'sleep', 'calm',
      'soft', 'relax', 'rain', 'cozy', 'coffee', 'study', 'gentle', 'jazz', 'bossa',
      'classical', 'orchestra', 'symphony', 'indie folk', 'bon iver', 'norah jones',
      'billie eilish', 'boyce avenue', 'yiruma', 'ludovico', 'chopin', 'debussy',
      'bach', 'mozart', 'beethoven', 'laufey', 'mac demarco', 'clairo', 'phoebe bridgers',
      'cigarettes after sex', 'mitski', 'sufjan stevens', 'novo amor', 'iron & wine'
    ];
    for (const kw of chillKeywords) {
      if (text.includes(kw)) return 'chill';
    }

    // 3. Hip-Hop, Rap, Trap, R&B (Groove & Swagger)
    const grooveKeywords = [
      'hip-hop', 'hip hop', 'rap', 'trap', 'r&b', 'rnb', 'freestyle', 'drake',
      'kendrick', 'kanye', 'travis scott', 'eminem', 'j cole', '21 savage', 'future',
      'metro boomin', 'post malone', 'snoop', 'tupac', 'notorious', 'cardi b',
      'doja cat', 'nicki minaj', 'lil ', 'gunna', 'playboi carti', 'juice wrld',
      'xxxtentacion', 'frank ocean', 'the weeknd', 'sza', 'brent faiyaz', 'partynextdoor',
      'tyler the creator', 'asap rocky', 'mac miller', 'chance the rapper', 'central cee'
    ];
    for (const kw of grooveKeywords) {
      if (text.includes(kw)) return 'groove';
    }

    // 4. EDM, Electronic, Dance, Pop, Rave (Energetic)
    const energeticKeywords = [
      'edm', 'electro', 'dance', 'rave', 'house', 'techno', 'dubstep', 'dnb',
      'drum and bass', 'synth', 'synthwave', 'hyperpop', 'remix', 'club', 'skrillex',
      'daft punk', 'avicii', 'calvin harris', 'david guetta', 'tiesto', 'martin garrix',
      'zedd', 'deadmau5', 'marshmello', 'kygo', 'alan walker', 'charli xcx', 'dua lipa',
      'k-pop', 'kpop', 'bts', 'blackpink', 'newjeans', 'twice', 'stray kids',
      'lady gaga', 'ariana grande', 'katy perry', 'taylor swift', 'bruno mars'
    ];
    for (const kw of energeticKeywords) {
      if (text.includes(kw)) return 'energetic';
    }

    // Default lively upbeat rhythm
    return 'standard';
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GenreDetector;
}
if (typeof window !== 'undefined') {
  window.GenreDetector = GenreDetector;
}
