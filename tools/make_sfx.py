#!/usr/bin/env python3
"""Generates every sound effect in assets/sfx/ from scratch (numpy + scipy + ffmpeg).
All sounds are original and covered by the project's MIT licence.
Run:  python3 tools/make_sfx.py      (needs numpy, scipy, ffmpeg)"""
import os, subprocess, tempfile, wave
import numpy as np
from scipy import signal

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sfx')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(1337)

def t_(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.005, r=0.05, curve=2.0):
    e = np.ones(n); na = min(n, max(1, int(SR * a))); nr = min(n, max(1, int(SR * r)))
    e[:na] = np.linspace(0, 1, na); e[-nr:] = np.minimum(e[-nr:], np.linspace(1, 0, nr) ** curve); return e
def decay(n, k=6.0): return np.exp(-np.linspace(0, k, n))
def sine(f, d, ph=0): t = t_(d); f = np.broadcast_to(f, t.shape) if np.isscalar(f) else f; return np.sin(2*np.pi*np.cumsum(f)/SR + ph)
def sweep(f0, f1, d, exp=True):
    t = t_(d); f = f0 * (f1/f0) ** (t/d) if exp else np.linspace(f0, f1, len(t)); return f
def tri(f, d): return signal.sawtooth(2*np.pi*np.cumsum(sweep(f, f, d) if np.isscalar(f) else f)/SR, 0.5)
def square(f, d): return signal.square(2*np.pi*np.cumsum(sweep(f, f, d) if np.isscalar(f) else f)/SR)
def saw(f, d): return signal.sawtooth(2*np.pi*np.cumsum(sweep(f, f, d) if np.isscalar(f) else f)/SR)
def noise(d): return rng.uniform(-1, 1, int(SR*d))
def filt(x, kind, fc, order=3):
    fc = np.clip(fc, 20, SR/2 - 100); sos = signal.butter(order, fc, btype=kind, fs=SR, output='sos'); return signal.sosfilt(sos, x)
def band(x, lo, hi): return signal.sosfilt(signal.butter(3, [lo, hi], btype='band', fs=SR, output='sos'), x)
def sweepfilt(x, f0, f1, kind='low'):
    # time-varying filter by blocks
    out = np.zeros_like(x); B = 512; n = len(x); zi = None
    for i in range(0, n, B):
        fc = f0 * (f1/f0) ** (i/n); fc = np.clip(fc, 30, SR/2-200)
        sos = signal.butter(2, fc, btype=kind, fs=SR, output='sos')
        if zi is None: zi = np.zeros((sos.shape[0], 2))
        seg, zi = signal.sosfilt(sos, x[i:i+B], zi=zi); out[i:i+B] = seg
    return out
def mix(*parts, n=None):
    n = n or max(len(p) for p in parts); o = np.zeros(n)
    for p in parts:
        p = np.asarray(p); o[:min(n, len(p))] += p[:n]
    return o
def msum(it): return mix(*list(it))
def at(x, off, total=None):
    pad = np.zeros(int(SR*off)); y = np.concatenate([pad, x]); 
    if total: y = np.pad(y, (0, max(0, int(SR*total)-len(y))))[:int(SR*total)]
    return y
def reverb(x, wet=0.25, d=0.35):
    n = int(SR*d); ir = noise(d) * decay(n, 7); ir = filt(ir, 'low', 3500); y = signal.fftconvolve(x, ir)[:len(x)+n]
    y /= (np.max(np.abs(y)) + 1e-9); x2 = np.pad(x, (0, len(y)-len(x))); return x2 + wet*np.max(np.abs(x))*y
def norm(x, peak=0.5):
    m = np.max(np.abs(x)) + 1e-9; return x / m * peak
def save(name, x, peak=0.5):
    x = norm(x, peak); x[:64] *= np.linspace(0, 1, 64); x[-128:] *= np.linspace(1, 0, 128)
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f: p = f.name
    with wave.open(p, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, '-ac', '1', '-b:a', '56k', os.path.join(OUT, name + '.mp3')], check=True)
    os.remove(p); print('  ', name, f'{len(x)/SR:.2f}s')
def note(f, d=0.2, kind='sine', k=7, vib=0):
    if kind == 'sine': x = sine(f, d)
    elif kind == 'tri': x = tri(f, d)
    elif kind == 'sq': x = filt(square(f, d), 'low', 4000)
    else: x = saw(f, d)
    return x * decay(len(x), k) * env(len(x), 0.004, 0.02)
def mtof(m): return 440 * 2 ** ((m-69)/12)

# ---------------------------------------------------------------- UI
print('ui')
save('ui_click', mix(note(sweep(1500, 700, .05), .05, 'sine', 5), noise(.012)*decay(int(SR*.012), 4)*.2), .4)
save('ui_hover', note(2100, .03, 'tri', 5) * .6, .18)
save('ui_toggle_on', mix(note(660, .06, 'sq', 5), at(note(990, .09, 'sq', 5), .055)), .35)
save('ui_toggle_off', mix(note(990, .06, 'sq', 5), at(note(560, .09, 'sq', 5), .055)), .35)
save('ui_open', sweepfilt(saw(sweep(120, 520, .2), .2), 300, 5000) * env(int(SR*.2), .01, .06), .35)
save('ui_close', sweepfilt(saw(sweep(520, 110, .18), .18), 5000, 300) * env(int(SR*.18), .005, .06), .35)
save('ui_copy', mix(note(1800, .04, 'tri', 5), at(note(2400, .05, 'tri', 5), .05)), .3)
save('ui_error', filt(square(sweep(180, 110, .16), .16), 'low', 900) * env(int(SR*.16), .005, .05), .35)
save('ui_success', mix(note(mtof(76), .25, 'sine', 5), at(note(mtof(83), .35, 'sine', 5), .08), at(note(mtof(88), .4, 'sine', 5), .16)), .35)
save('ui_slide', note(sweep(400, 900, .08), .08, 'tri', 5), .25)
n = int(SR*.5); w = sweepfilt(noise(.5), 200, 6000) * np.sin(np.linspace(0, np.pi, n)) ** 1.5; save('whoosh_a', w, .4)
w = sweepfilt(noise(.5), 7000, 250) * np.sin(np.linspace(0, np.pi, n)) ** 1.5; save('whoosh_b', w, .4)
w = band(noise(.45), 800, 3000) * np.sin(np.linspace(0, np.pi, int(SR*.45))) ** 2 * (1 + 0.6 * np.sin(2*np.pi*40*t_(.45))); save('whoosh_glitch', w, .35)
# enter: impact + shimmer
imp = mix(sine(sweep(110, 38, .6), .6) * decay(int(SR*.6), 5), filt(noise(.25), 'low', 2200) * decay(int(SR*.25), 9) * .7)
sh = msum(note(mtof(m), 1.1, 'sine', 3.5) * .25 for m in (62, 69, 74, 81, 86)); save('enter', reverb(mix(imp, at(sh, .05)), .35, .6), .55)
save('theme_day', reverb(msum(at(note(mtof(m), .6, 'sine', 5), .07*i) for i, m in enumerate((84, 88, 91, 96))), .3, .5), .4)
save('theme_night', reverb(mix(note(mtof(55), 1.0, 'sine', 3), at(note(mtof(50), 1.2, 'sine', 3), .2), note(mtof(67), 1.0, 'tri', 4) * .3), .45, .8), .45)
# ---------------------------------------------------------------- MOCK BOT
print('bot')
save('bot_open', mix(note(sweep(300, 900, .12), .12, 'sine', 4), at(note(sweep(500, 1400, .1), .1, 'sine', 4), .09)), .4)
save('bot_msg', mix(note(880, .07, 'sine', 5), at(note(1320, .1, 'sine', 5), .06)), .3)
save('bot_send', mix(note(660, .05, 'sine', 5), at(note(990, .07, 'sine', 5), .04)), .28)
save('bot_type', note(sweep(1800, 1300, .018), .018, 'tri', 3) * .8, .1)
save('bot_glitch', band(noise(.4), 500, 5000) * np.sign(np.sin(2*np.pi*23*t_(.4))) * env(int(SR*.4), .01, .1), .3)
def censor(notes, wob):
    parts = []; off = 0
    for m in notes:
        d = .05; f = mtof(m) * (1 + wob * np.sin(2*np.pi*14*t_(d)))
        parts.append(at(filt(square(f, d), 'low', 2600) * env(int(SR*d), .004, .015), off)); off += d
    return msum(parts)
save('censor_1', censor([76, 83, 79, 88, 81], .02), .32)
save('censor_2', censor([84, 77, 81, 74, 86, 79], .03), .32)
save('censor_3', censor([72, 79, 86, 79, 91], .04), .32)
# ---------------------------------------------------------------- SCHIZO
print('schizo')
d = 2.0; wh = band(noise(d), 500, 3800); am = (np.sin(2*np.pi*3.1*t_(d)) * .5 + .5) ** 2; fm = band(noise(d), 1200, 2400) * np.sin(2*np.pi*7*t_(d)) ** 2
save('sz_whisper', filt(wh * am + fm * .6, 'low', 3500) * np.sin(np.linspace(0, np.pi, int(SR*d))) ** 1.5, .22)
d = 3.5; dr = mix(saw(55, d), saw(55.7, d), saw(82.9, d) * .5); dr = filt(dr, 'low', 380) * (0.6 + 0.4 * np.sin(2*np.pi*.7*t_(d))); save('sz_drone', dr * env(int(SR*d), .6, 1.2, 1), .4)
hb = lambda: mix(sine(sweep(80, 40, .18), .18) * decay(int(SR*.18), 7), at(sine(sweep(70, 36, .2), .2) * decay(int(SR*.2), 7) * .7, .22))
save('sz_heartbeat', msum(at(hb(), i * .85, 2.9) for i in range(3)), .55)
save('sz_static', band(noise(.7), 300, 9000) * decay(int(SR*.7), 3) * (rng.uniform(0, 1, int(SR*.7)) > .15), .28)
mb = msum(at(note(mtof(m) * (1 + .01 * i), .6, 'sine', 4), .32 * i) for i, m in enumerate((79, 76, 72, 75, 71, 68, 70)))
save('sz_musicbox', reverb(mb[::-1] if False else mb, .4, .9) * 1.0, .3)
cr = sweepfilt(saw(sweep(70, 45, 1.3) * (1 + .05 * np.sin(2*np.pi*9*t_(1.3))), 1.3), 900, 120) * env(int(SR*1.3), .2, .5) + band(noise(1.3), 100, 700) * .3 * (np.sin(2*np.pi*13*t_(1.3)) > 0.6)
save('sz_creak', cr, .3)
kn = msum(at(mix(sine(sweep(160, 70, .1), .1) * decay(int(SR*.1), 9), filt(noise(.05), 'low', 1500) * decay(int(SR*.05), 6) * .6), .32 * i, 1.2) for i in range(3)); save('sz_knock', kn, .5)
bt = band(noise(1.6), 200, 1800) * (np.sin(2*np.pi*.9*t_(1.6)) * .5 + .5) ** 3; save('sz_breath', bt, .3)
save('sz_reverse', (reverb(note(mtof(60), .8, 'tri', 3) + note(mtof(63), .8, 'tri', 3) * .7, .4, .6))[::-1], .3)
# ---------------------------------------------------------------- RHYME
print('rhyme')
save('rh_low', mix(sine(sweep(150, 42, .22), .22) * decay(int(SR*.22), 6), filt(noise(.02), 'low', 2500) * .5, n=int(SR*.22)), .6)
save('rh_mid', mix(filt(noise(.14), 'high', 1500) * decay(int(SR*.14), 9) * .8, sine(sweep(260, 170, .12), .12) * decay(int(SR*.12), 8)), .45)
save('rh_high', mix(filt(noise(.06), 'high', 6500) * decay(int(SR*.06), 7), note(5200, .05, 'sine', 8) * .6), .3)
save('rh_miss', filt(saw(sweep(220, 90, .22), .22), 'low', 600) * env(int(SR*.22), .004, .08) * .8, .3)
save('rh_combo', msum(at(note(mtof(m), .12, 'tri', 6), .05 * i) for i, m in enumerate((72, 76, 79, 84))), .3)
save('rh_start', sweepfilt(saw(sweep(80, 700, .7), .7), 300, 7000) * np.linspace(.2, 1, int(SR*.7)) ** 2, .35)
save('rh_finish', reverb(msum(at(note(mtof(m), .5, 'sq', 4), .09 * i) for i, m in enumerate((72, 76, 79, 84, 88))), .3, .5), .4)
save('rh_fail', reverb(msum(at(note(mtof(m), .5, 'sq', 4), .13 * i) for i, m in enumerate((72, 68, 65, 60))), .3, .5), .4)
save('rh_perfect', mix(note(mtof(96), .12, 'sine', 8), at(note(mtof(103), .15, 'sine', 8), .04)), .22)
# ---------------------------------------------------------------- SNAKE
print('snake')
save('sn_turn', note(sweep(800, 500, .03), .03, 'sq', 5), .22)
save('sn_eat', mix(note(sweep(500, 1400, .09), .09, 'sq', 4), at(note(sweep(900, 2000, .08), .08, 'sq', 5), .06)), .35)
save('sn_shift', sweepfilt(saw(sweep(200, 1400, .22), .22), 600, 6000) * env(int(SR*.22), .01, .08), .3)
save('sn_shift_back', sweepfilt(saw(sweep(1400, 200, .22), .22), 6000, 600) * env(int(SR*.22), .01, .08), .3)
save('sn_die', mix(filt(noise(.6), 'low', 2500) * decay(int(SR*.6), 5), sine(sweep(300, 40, .6), .6) * decay(int(SR*.6), 4)), .5)
save('sn_drop', mix(sine(sweep(220, 30, .6), .6) * decay(int(SR*.6), 3.5), sweepfilt(noise(.6), 5000, 150) * .5 * decay(int(SR*.6), 3)), .55)
save('sn_spawn', note(sweep(300, 1100, .07), .07, 'tri', 6), .22)
save('sn_portal', band(noise(.3), 400, 3000) * np.sin(2*np.pi*30*t_(.3)) * env(int(SR*.3), .02, .1), .25)
# ---------------------------------------------------------------- CHESS
print('chess')
save('ch_select', note(sweep(700, 1000, .04), .04, 'tri', 5), .25)
save('ch_move', mix(filt(noise(.05), 'low', 1400) * decay(int(SR*.05), 6), sine(sweep(240, 150, .09), .09) * decay(int(SR*.09), 7)), .45)
save('ch_capture', mix(filt(noise(.16), 'low', 3000) * decay(int(SR*.16), 6), sine(sweep(200, 60, .2), .2) * decay(int(SR*.2), 5), n=int(SR*.2)), .55)
save('ch_shift', sweepfilt(noise(.7), 150, 1500) * np.sin(np.linspace(0, np.pi, int(SR*.7))) + sine(sweep(60, 120, .7), .7) * .6, .45)
save('ch_static', band(noise(.3), 600, 8000) * (rng.uniform(0, 1, int(SR*.3)) > .3) * decay(int(SR*.3), 2.5), .28)
save('ch_win', reverb(msum(at(note(mtof(m), .4, 'tri', 4), .09 * i) for i, m in enumerate((67, 72, 76, 79, 84))), .35, .6), .4)
save('ch_lose', reverb(msum(at(note(mtof(m), .45, 'tri', 4), .15 * i) for i, m in enumerate((72, 67, 63, 58))), .35, .6), .4)
save('ch_think', msum(at(note(mtof(rng.integers(60, 90)), .04, 'sq', 6), .06 * i) for i in range(6)), .22)
save('ch_promote', msum(at(note(mtof(m), .15, 'sine', 5), .04 * i) for i, m in enumerate((84, 88, 91, 96, 100))), .3)
save('ch_illegal', filt(square(140, .12), 'low', 700) * env(int(SR*.12), .004, .04), .3)
print('done')
