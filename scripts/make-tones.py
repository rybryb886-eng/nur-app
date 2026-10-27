"""Synthesises the bundled notification tones (assets/sounds/*.wav)."""
import os, wave
import numpy as np

RATE = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')


def bell(freq, dur, decay):
    t = np.linspace(0, dur, int(RATE * dur), endpoint=False)
    # Fundamental plus soft inharmonic partials, like a small bell.
    tone = (np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 2.76 * t)
            + 0.2 * np.sin(2 * np.pi * freq * 5.4 * t))
    env = np.exp(-t * decay) * np.minimum(1, t * 200)
    return tone * env


def sequence(notes, total):
    out = np.zeros(int(RATE * total))
    for start, freq, dur, decay in notes:
        s = int(RATE * start)
        b = bell(freq, dur, decay)
        out[s:s + len(b)] += b[: len(out) - s]
    return out / np.max(np.abs(out)) * 0.8


def save(name, data):
    with wave.open(os.path.join(OUT, name), 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((data * 32767).astype(np.int16).tobytes())


save('chime.wav', sequence([(0, 880, 2.0, 2.5), (0.35, 1318.5, 2.0, 2.5)], 2.6))
save('soft.wav', sequence([(0, 523.25, 1.8, 2.2), (0.4, 659.25, 1.8, 2.2), (0.8, 783.99, 2.2, 1.8)], 3.2))
