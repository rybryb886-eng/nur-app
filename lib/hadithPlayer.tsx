import * as Speech from 'expo-speech';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { BOOKS, Hadith, HadithBook, loadSection } from './hadith';

/** Android's TextToSpeech rejects input over ~4000 characters, so long hadiths are read in parts. */
const MAX_CHUNK = 3000;

export const RATES = [0.8, 1, 1.25, 1.5];

function speakable(text: string) {
  return text
    .replace(/ﷺ/g, ', да благословит его Аллах и приветствует,')
    .replace(/[‘’ʼ`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function chunks(text: string): string[] {
  const out: string[] = [];
  let current = '';
  for (const sentence of (text.match(/[^.!?»]+[.!?»]*/g) ?? [text]).map((s) => s.trim()).filter(Boolean)) {
    if (current && current.length + sentence.length + 1 > MAX_CHUNK) {
      out.push(current);
      current = '';
    }
    current = current ? `${current} ${sentence}` : sentence;
    while (current.length > MAX_CHUNK) {
      out.push(current.slice(0, MAX_CHUNK));
      current = current.slice(MAX_CHUNK);
    }
  }
  if (current) out.push(current);
  return out;
}

type Track = { book: HadithBook['id']; section: number; items: Hadith[]; index: number };

type Ctx = {
  track: Track | null;
  playing: boolean;
  loading: boolean;
  rate: number;
  /** Start reading `section` of `book` from hadith `index`; carries on into the following sections. */
  play: (book: HadithBook['id'], section: number, index?: number, items?: Hadith[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
  cycleRate: () => void;
};

const PlayerContext = createContext<Ctx | null>(null);

export function HadithPlayerProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState(1);
  // Bumped on every start/stop so callbacks from an interrupted utterance are ignored.
  const session = useRef(0);
  const rateRef = useRef(rate);
  rateRef.current = rate;

  const speakTrack = useCallback((t: Track) => {
    const id = ++session.current;
    Speech.stop();
    setTrack(t);
    setPlaying(true);
    const parts = chunks(speakable(t.items[t.index].text));
    const speakPart = (i: number) => {
      if (id !== session.current) return;
      if (i >= parts.length) {
        advance(t, id);
        return;
      }
      Speech.speak(parts[i], {
        language: 'ru-RU',
        rate: rateRef.current,
        onDone: () => speakPart(i + 1),
        onError: () => {
          if (id === session.current) setPlaying(false);
        },
      });
    };
    speakPart(0);
  }, []);

  const loadAndPlay = useCallback(
    async (book: HadithBook['id'], section: number, index: number, items?: Hadith[], id?: number) => {
      if (items) {
        speakTrack({ book, section, items, index });
        return;
      }
      setLoading(true);
      try {
        const loaded = await loadSection(book, section);
        if (id !== undefined && id !== session.current) return;
        const start = index < 0 ? loaded.length - 1 : index;
        speakTrack({ book, section, items: loaded, index: start });
      } catch {
        setPlaying(false);
      } finally {
        setLoading(false);
      }
    },
    [speakTrack],
  );

  /** Moves to the next hadith, crossing into the next section at the end of one. */
  const advance = useCallback(
    (t: Track, id: number) => {
      if (id !== session.current) return;
      if (t.index + 1 < t.items.length) {
        speakTrack({ ...t, index: t.index + 1 });
        return;
      }
      const sections = BOOKS.find((b) => b.id === t.book)!.sections;
      const pos = sections.findIndex((s) => s.n === t.section);
      const nextSection = sections[pos + 1];
      if (!nextSection) {
        setPlaying(false);
        return;
      }
      loadAndPlay(t.book, nextSection.n, 0, undefined, id);
    },
    [speakTrack, loadAndPlay],
  );

  const play: Ctx['play'] = useCallback(
    (book, section, index = 0, items) => {
      session.current++;
      loadAndPlay(book, section, index, items, session.current);
    },
    [loadAndPlay],
  );

  const stop = useCallback(() => {
    session.current++;
    Speech.stop();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (!track) return;
    if (playing) stop();
    else speakTrack(track);
  }, [track, playing, stop, speakTrack]);

  const next = useCallback(() => {
    if (track) advance(track, session.current);
  }, [track, advance]);

  const prev = useCallback(() => {
    if (!track) return;
    if (track.index > 0) {
      speakTrack({ ...track, index: track.index - 1 });
      return;
    }
    const sections = BOOKS.find((b) => b.id === track.book)!.sections;
    const pos = sections.findIndex((s) => s.n === track.section);
    if (pos > 0) {
      session.current++;
      loadAndPlay(track.book, sections[pos - 1].n, -1, undefined, session.current);
    } else speakTrack(track);
  }, [track, speakTrack, loadAndPlay]);

  const cycleRate = useCallback(() => {
    setRate((r) => RATES[(RATES.indexOf(r) + 1) % RATES.length]);
  }, []);

  // Apply a new speed by restarting the current hadith.
  useEffect(() => {
    if (track && playing) speakTrack(track);
  }, [rate]);

  useEffect(() => () => void Speech.stop(), []);

  return (
    <PlayerContext.Provider value={{ track, playing, loading, rate, play, toggle, next, prev, stop, cycleRate }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function useHadithPlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('useHadithPlayer outside HadithPlayerProvider');
  return ctx;
}
