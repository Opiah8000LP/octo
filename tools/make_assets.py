#!/usr/bin/env python3
"""Generates the original PNG artwork in assets/ (UI icons, decorations, creatures, chess pieces, game sprites).
Everything here is original and covered by the project's MIT licence. Needs: pillow, numpy.  Run: python3 tools/make_assets.py"""
import os, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
random.seed(7); np.random.seed(7)
SS = 4  # supersampling

def canvas(w, h=None):
    h = h or w; im = Image.new('RGBA', (w*SS, h*SS), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)
def done(im, path, size=None):
    w, h = im.size; size = size or (w//SS, h//SS)
    im = im.resize(size, Image.LANCZOS); p = os.path.join(ROOT, path); os.makedirs(os.path.dirname(p), exist_ok=True); im.save(p)
def S(v):
    if isinstance(v, (list, tuple)): return [tuple(y*SS for y in x) if isinstance(x, (list, tuple)) else x*SS for x in v]
    return v*SS
W = (255, 255, 255, 255)

# ------------------------------------------------------------------ UI icons (white, 64 grid -> 96px)
def icon(name, fn):
    im, d = canvas(96); k = 96/64
    def P(pts): return [(x*k*SS, y*k*SS) for x, y in pts]
    def L(pts, w=5): d.line(P(pts), fill=W, width=int(w*k*SS), joint='curve')
    def R(b, w=0, fill=True): b = [v*k*SS for v in b]; d.rectangle(b, fill=W if fill else None, outline=None if fill else W, width=int(w*k*SS))
    def C(cx, cy, r, fill=True, w=4): d.ellipse([(cx-r)*k*SS, (cy-r)*k*SS, (cx+r)*k*SS, (cy+r)*k*SS], fill=W if fill else None, outline=None if fill else W, width=int(w*k*SS))
    fn(d, P, L, R, C, k); done(im, f'ui/{name}.png')
icon('play', lambda d, P, L, R, C, k: d.polygon(P([(20, 11), (54, 32), (20, 53)]), fill=W))
icon('pause', lambda d, P, L, R, C, k: (R((15, 12, 28, 52)), R((36, 12, 49, 52))))
icon('prev', lambda d, P, L, R, C, k: (R((11, 12, 18, 52)), d.polygon(P([(53, 12), (53, 52), (21, 32)]), fill=W)))
icon('next', lambda d, P, L, R, C, k: (R((46, 12, 53, 52)), d.polygon(P([(11, 12), (11, 52), (43, 32)]), fill=W)))
def spk(d, P, L, R, C, k): d.polygon(P([(8, 24), (20, 24), (34, 12), (34, 52), (20, 40), (8, 40)]), fill=W)
def vol(d, P, L, R, C, k):
    spk(d, P, L, R, C, k)
    for r in (10, 18): d.arc([(40-r+4)*k*SS, (32-r)*k*SS, (40+r+4)*k*SS, (32+r)*k*SS], -50, 50, fill=W, width=int(4.5*k*SS))
icon('volume', vol)
icon('mute', lambda d, P, L, R, C, k: (spk(d, P, L, R, C, k), L([(41, 22), (58, 42)]), L([(58, 22), (41, 42)])))
icon('playlist', lambda d, P, L, R, C, k: ([L([(22, y), (56, y)], 5) for y in (16, 32, 48)], [C(10, y, 3.4) for y in (16, 32, 48)]))
icon('close', lambda d, P, L, R, C, k: (L([(14, 14), (50, 50)], 6), L([(50, 14), (14, 50)], 6)))
icon('grip', lambda d, P, L, R, C, k: [C(x, y, 3.6) for x in (22, 42) for y in (14, 32, 50)])
icon('minimize', lambda d, P, L, R, C, k: L([(14, 46), (50, 46)], 7))
icon('maximize', lambda d, P, L, R, C, k: R((14, 14, 50, 50), 5, False))
icon('menu', lambda d, P, L, R, C, k: [L([(10, y), (54, y)], 6) for y in (16, 32, 48)])
def gear(d, P, L, R, C, k):
    pts = []
    for i in range(16):
        a = i/16*2*math.pi; r = 27 if (i % 2 == 0) else 20; pts += [(32+math.cos(a-0.1)*r, 32+math.sin(a-0.1)*r), (32+math.cos(a+0.1)*r, 32+math.sin(a+0.1)*r)]
    d.polygon(P(pts), fill=W); d.ellipse([22*k*SS, 22*k*SS, 42*k*SS, 42*k*SS], fill=(0, 0, 0, 0))
icon('settings', lambda d, P, L, R, C, k: (gear(d, P, L, R, C, k), C(32, 32, 10, True)))
def settings_fix():
    im, d = canvas(96); k = 96/64; pts = []
    for i in range(24):
        a = i/24*2*math.pi; r = 28 if i % 3 != 2 else 21
        pts += [((32+math.cos(a-0.12)*r)*k*SS, (32+math.sin(a-0.12)*r)*k*SS), ((32+math.cos(a+0.12)*r)*k*SS, (32+math.sin(a+0.12)*r)*k*SS)]
    d.polygon(pts, fill=W)
    hole = Image.new('L', im.size, 0); ImageDraw.Draw(hole).ellipse([22*k*SS, 22*k*SS, 42*k*SS, 42*k*SS], fill=255)
    a = np.array(im); a[..., 3] = np.where(np.array(hole) > 0, 0, a[..., 3]); done(Image.fromarray(a), 'ui/settings.png')
settings_fix()
def sun(d, P, L, R, C, k):
    C(32, 32, 11); [L([(32+math.cos(a)*18, 32+math.sin(a)*18), (32+math.cos(a)*27, 32+math.sin(a)*27)], 4.5) for a in [i*math.pi/4 for i in range(8)]]
icon('sun', sun)
def moon(d, P, L, R, C, k):
    C(30, 32, 22); d.ellipse([(30-6+10)*k*SS, (32-24+4)*k*SS, (30+30+10)*k*SS, (32+24+4)*k*SS], fill=(0, 0, 0, 0))
def moon_fix():
    im, d = canvas(96); k = 96/64; d.ellipse([8*k*SS, 10*k*SS, 52*k*SS, 54*k*SS], fill=W)
    cut = Image.new('L', im.size, 0); ImageDraw.Draw(cut).ellipse([26*k*SS, 4*k*SS, 66*k*SS, 48*k*SS], fill=255)
    a = np.array(im); a[..., 3] = np.where(np.array(cut) > 0, 0, a[..., 3]); done(Image.fromarray(a), 'ui/moon.png')
moon_fix()
icon('chat', lambda d, P, L, R, C, k: (d.rounded_rectangle([8*k*SS, 10*k*SS, 56*k*SS, 44*k*SS], radius=9*k*SS, fill=W), d.polygon(P([(18, 42), (18, 58), (34, 42)]), fill=W)))
icon('send', lambda d, P, L, R, C, k: d.polygon(P([(6, 30), (58, 8), (40, 56), (31, 36)]), fill=W))
icon('copy', lambda d, P, L, R, C, k: (R((8, 20, 40, 56), 5, False), R((22, 8, 56, 42), 5, False)))
icon('external', lambda d, P, L, R, C, k: (L([(26, 14), (12, 14), (12, 52), (50, 52), (50, 38)], 5), L([(30, 34), (54, 10)], 5.5), L([(36, 10), (54, 10), (54, 28)], 5.5)))
def restart(d, P, L, R, C, k):
    d.arc([10*k*SS, 10*k*SS, 54*k*SS, 54*k*SS], 40, 330, fill=W, width=int(6*k*SS)); d.polygon(P([(44, 6), (56, 24), (36, 26)]), fill=W)
icon('restart', restart)
icon('info', lambda d, P, L, R, C, k: (C(32, 32, 26, False, 5), C(32, 19, 3.6), L([(32, 29), (32, 46)], 6)))
icon('fullscreen', lambda d, P, L, R, C, k: [L(p, 5) for p in ([(10, 24), (10, 10), (24, 10)], [(40, 10), (54, 10), (54, 24)], [(54, 40), (54, 54), (40, 54)], [(24, 54), (10, 54), (10, 40)])])
icon('upload', lambda d, P, L, R, C, k: (L([(32, 40), (32, 10)], 6), L([(20, 21), (32, 9), (44, 21)], 6), L([(10, 42), (10, 54), (54, 54), (54, 42)], 5)))
icon('check', lambda d, P, L, R, C, k: L([(12, 34), (26, 48), (53, 16)], 7))
icon('arrow', lambda d, P, L, R, C, k: (L([(10, 32), (52, 32)], 6), L([(36, 16), (52, 32), (36, 48)], 6)))
icon('home', lambda d, P, L, R, C, k: (d.polygon(P([(32, 8), (58, 30), (50, 30), (50, 54), (14, 54), (14, 30), (6, 30)]), fill=W)))
icon('eye', lambda d, P, L, R, C, k: (d.ellipse(P([(6, 20), (58, 44)])[0] + P([(6, 20), (58, 44)])[1], outline=W, width=int(5*k*SS)), C(32, 32, 8)))
icon('heart', lambda d, P, L, R, C, k: d.polygon(P([(32, 56), (6, 28), (10, 14), (22, 10), (32, 20), (42, 10), (54, 14), (58, 28)]), fill=W))
icon('star', lambda d, P, L, R, C, k: d.polygon(P([(32+math.cos(-math.pi/2+i*math.pi/5)*(28 if i % 2 == 0 else 12), 32+math.sin(-math.pi/2+i*math.pi/5)*(28 if i % 2 == 0 else 12)) for i in range(10)]), fill=W))
icon('shuffle', lambda d, P, L, R, C, k: (L([(8, 18), (22, 18), (42, 46), (56, 46)], 5), L([(8, 46), (22, 46), (42, 18), (56, 18)], 5), L([(48, 38), (56, 46), (48, 54)], 5), L([(48, 10), (56, 18), (48, 26)], 5)))

# ------------------------------------------------------------------ decoration
def deco(name, fn, size=256, color=W):
    im, d = canvas(size); fn(d, size*SS); done(im, f'deco/{name}.png')
def sparkle(d, s):
    c = s/2; pts = []
    for i in range(8):
        a = i*math.pi/4; r = c*0.95 if i % 2 == 0 else c*0.14; pts.append((c+math.cos(a)*r, c+math.sin(a)*r))
    d.polygon(pts, fill=W)
deco('sparkle', sparkle)
def star5(d, s):
    c = s/2; d.polygon([(c+math.cos(-math.pi/2+i*math.pi/5)*(c*0.92 if i % 2 == 0 else c*0.4), c+math.sin(-math.pi/2+i*math.pi/5)*(c*0.92 if i % 2 == 0 else c*0.4)) for i in range(10)], fill=W)
deco('star', star5)
def sunbig(d, s):
    c = s/2; d.ellipse([c-s*0.2, c-s*0.2, c+s*0.2, c+s*0.2], outline=W, width=int(s*0.025))
    for i in range(16):
        a = i*math.pi/8; r0 = s*0.28; r1 = s*0.46 if i % 2 == 0 else s*0.38
        d.line([(c+math.cos(a)*r0, c+math.sin(a)*r0), (c+math.cos(a)*r1, c+math.sin(a)*r1)], fill=W, width=int(s*0.02))
deco('sun', sunbig)
def cloud(d, s):
    w = int(s*0.022); d.arc([s*.08, s*.38, s*.38, s*.7], 90, 270, fill=W, width=w); d.arc([s*.22, s*.2, s*.58, s*.62], 180, 360, fill=W, width=w)
    d.arc([s*.5, s*.3, s*.82, s*.64], 200, 380, fill=W, width=w); d.arc([s*.66, s*.4, s*.92, s*.7], 270, 450, fill=W, width=w)
    d.line([(s*.23, s*.7), (s*.79, s*.7)], fill=W, width=w)
deco('cloud', cloud)
def moonbig(d, s):
    c = s/2; d.ellipse([s*.1, s*.1, s*.9, s*.9], fill=W)
    # carve crescent
    m = Image.new('L', (int(s), int(s)), 0); ImageDraw.Draw(m).ellipse([s*.34, s*.04, s*1.0, s*.78], fill=255); return m
def moon_asset():
    s = 256*SS; im = Image.new('RGBA', (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(im); d.ellipse([s*.1, s*.1, s*.9, s*.9], fill=W)
    cut = Image.new('L', (s, s), 0); ImageDraw.Draw(cut).ellipse([s*.36, s*.02, s*1.02, s*.74], fill=255)
    a = np.array(im); a[..., 3] = np.where(np.array(cut) > 0, 0, a[..., 3]); done(Image.fromarray(a), 'deco/moon.png')
moon_asset()
def crescent_outline():
    s = 256*SS; im = Image.new('RGBA', (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse([s*.12, s*.12, s*.88, s*.88], outline=W, width=int(s*.012))
    cut = Image.new('L', (s, s), 0); ImageDraw.Draw(cut).ellipse([s*.3, s*.06, s*.98, s*.76], fill=255)
    a = np.array(im); a[..., 3] = np.where(np.array(cut) > 0, 0, a[..., 3]); done(Image.fromarray(a), 'deco/crescent.png')
crescent_outline()
def cross(d, s): c = s/2; d.line([(c, s*.1), (c, s*.9)], fill=W, width=int(s*.03)); d.line([(c-s*.18, s*.3), (c+s*.18, s*.3)], fill=W, width=int(s*.03))
deco('cross', cross)
def ring(d, s):
    d.ellipse([s*.06, s*.06, s*.94, s*.94], outline=W, width=int(s*.012)); d.ellipse([s*.2, s*.2, s*.8, s*.8], outline=W, width=int(s*.008))
    for i in range(36): a = i*math.pi/18; d.line([(s/2+math.cos(a)*s*.44, s/2+math.sin(a)*s*.44), (s/2+math.cos(a)*s*.48, s/2+math.sin(a)*s*.48)], fill=W, width=int(s*.006))
deco('ring', ring)
def pearl():
    n = 256; y, x = np.mgrid[0:n, 0:n]; cx = cy = n/2; r = np.hypot(x-cx, y-cy)/(n*0.46); m = r < 1
    hx = np.hypot(x-(cx-n*0.14), y-(cy-n*0.16))/(n*0.5); t = np.clip(hx, 0, 1)
    c0 = np.array([255, 255, 255]); c1 = np.array([163, 174, 248]); c2 = np.array([70, 80, 196])
    col = np.where(t[..., None] < .35, c0 + (c1-c0)*(t[..., None]/.35), c1 + (c2-c1)*((t[..., None]-.35)/.65))
    a = np.dstack([col, np.where(m, 255, 0)]).astype('uint8'); Image.fromarray(a, 'RGBA').save(os.path.join(ROOT, 'deco/pearl.png'))
pearl()
def tile(name, fn, n=128):
    a = fn(n); Image.fromarray(a.astype('uint8'), 'RGBA').save(os.path.join(ROOT, f'deco/{name}.png'))
tile('noise', lambda n: np.dstack([np.full((n, n), 255), np.full((n, n), 255), np.full((n, n), 255), np.random.randint(0, 70, (n, n))]))
tile('scan', lambda n: np.dstack([np.zeros((n, n)), np.zeros((n, n)), np.zeros((n, n)), np.tile(np.array([0]*2+[90]*2)[:, None], (n//4, n))[:n]]), 64)
def halftone(n):
    im = Image.new('RGBA', (n*SS, n*SS), (0, 0, 0, 0)); d = ImageDraw.Draw(im); g = 8*SS
    for i in range(0, n*SS, g):
        for j in range(0, n*SS, g):
            r = (1+math.sin((i+j)/n/SS*2*math.pi*2))*0.5*g*0.38+g*0.08; o = g/2 if (i//g) % 2 else 0
            d.ellipse([i+o-r, j-r+g/2, i+o+r, j+r+g/2], fill=(0, 0, 0, 255))
    return np.array(im.resize((n, n), Image.LANCZOS))
tile('halftone', halftone, 128)
def gridtile(n):
    a = np.zeros((n, n, 4)); a[0, :] = (255, 255, 255, 255); a[:, 0] = (255, 255, 255, 255); return a
tile('grid', gridtile, 48)
def dither():
    w, h = 170, 40; x = np.linspace(0, 1, w)[None, :].repeat(h, 0); bayer = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]])/16
    th = np.tile(bayer, (h//4+1, w//4+1))[:h, :w]; on = x < th*0.9+0.08; a = np.zeros((h, w, 4), 'uint8'); a[on] = (255, 255, 255, 255)
    Image.fromarray(a, 'RGBA').resize((w*2, h*2), Image.NEAREST).save(os.path.join(ROOT, 'deco/dither.png'))
dither()
def tapes():
    im, d = canvas(256, 64)
    for i in range(0, 64, 16): d.polygon(S([(i*4, 0), (i*4+32, 0), (i*4+8, 64), (i*4-24, 64)]), fill=W)
    done(im, 'deco/hazard.png')
tapes()

# ------------------------------------------------------------------ brand images
def favicon():
    im, d = canvas(128); d.rectangle(S([6, 6, 122, 122]), fill=(10, 9, 19, 255)); f = ImageFont.load_default()
    # blocky D made of rects
    c = (165, 150, 255, 255); d.rectangle(S([30, 26, 48, 102]), fill=c); d.rectangle(S([30, 26, 78, 44]), fill=c); d.rectangle(S([30, 84, 78, 102]), fill=c); d.rectangle(S([78, 38, 98, 90]), fill=c)
    d.rectangle(S([54, 52, 70, 76]), fill=(255, 255, 255, 255)); done(im, 'img/favicon.png')
favicon()
def og():
    im = Image.new('RGB', (1200, 630), (10, 9, 19)); d = ImageDraw.Draw(im)
    for i in range(1400): x, y = random.randint(0, 1199), random.randint(0, 629); d.point((x, y), fill=(120+random.randint(0, 100), 110+random.randint(0, 100), 255))
    d.ellipse([350, 100, 850, 600], outline=(165, 150, 255), width=2)
    try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 190); f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 34)
    except Exception: f = f2 = ImageFont.load_default()
    d.text((70, 200), 'RDWEEB', font=f, fill=(255, 255, 255)); d.text((78, 440), 'DWEEB RECORDS  //  music . web . games . edits', font=f2, fill=(165, 150, 255))
    d.rectangle([70, 150, 94, 174], fill=(255, 255, 255)); im.save(os.path.join(ROOT, 'img/og-image.png'))
og()
def mockbot():
    im, d = canvas(256); d.ellipse(S([14, 14, 242, 242]), fill=(165, 150, 255, 255), outline=(20, 18, 40, 255), width=S(8))
    for ex in (86, 170):
        d.ellipse(S([ex-26, 92, ex+26, 148]), fill=(255, 255, 255, 255), outline=(20, 18, 40, 255), width=S(6)); d.ellipse(S([ex-9, 108, ex+9, 132]), fill=(20, 18, 40, 255))
        d.rectangle(S([ex-32, 82, ex+32, 112]), fill=(165, 150, 255, 255)); d.line(S([ex-32, 112, ex+32, 112]), fill=(20, 18, 40, 255), width=S(7))
    d.line(S([60, 70, 112, 86]), fill=(20, 18, 40, 255), width=S(8)); d.arc(S([70, 150, 190, 215]), 15, 150, fill=(20, 18, 40, 255), width=S(8)); d.line(S([175, 170, 196, 158]), fill=(20, 18, 40, 255), width=S(8))
    d.polygon(S([(210, 40), (216, 58), (234, 64), (216, 70), (210, 88), (204, 70), (186, 64), (204, 58)]), fill=(255, 255, 255, 255)); done(im, 'img/mockbot.png')
mockbot()

# ------------------------------------------------------------------ creatures (schizo mode). white strokes + black fill: readable on both themes
BK = (8, 6, 14, 255)
def creature(name, fn, size=320):
    im, d = canvas(size); fn(d, size*SS); done(im, f'creatures/{name}.png')
def watcher(d, s):
    c = s/2; d.ellipse([s*.1, s*.28, s*.9, s*.72], fill=BK, outline=W, width=int(s*.012)); d.ellipse([s*.36, s*.36, s*.64, s*.64], fill=W); d.ellipse([s*.45, s*.42, s*.55, s*.58], fill=BK)
    random.seed(3)
    for i in range(22):
        a = random.random()*6.28; r = s*(0.32+random.random()*0.1); x, y = c+math.cos(a)*r*1.05, c+math.sin(a)*r*0.6; q = s*random.uniform(.015, .04)
        d.ellipse([x-q, y-q*.7, x+q, y+q*.7], fill=W); d.ellipse([x-q*.4, y-q*.3, x+q*.4, y+q*.3], fill=BK)
    for i in range(14): a = i*math.pi/7; d.line([(c+math.cos(a)*s*.47, c+math.sin(a)*s*.3), (c+math.cos(a)*s*.5, c+math.sin(a)*s*.34)], fill=W, width=int(s*.006))
creature('watcher', watcher)
def smiler(d, s):
    c = s/2; d.ellipse([s*.1, s*.1, s*.9, s*.9], fill=BK, outline=W, width=int(s*.012))
    d.ellipse([s*.3, s*.3, s*.38, s*.4], fill=W); d.ellipse([s*.62, s*.3, s*.7, s*.4], fill=W)
    d.arc([s*.2, s*.28, s*.8, s*.82], 10, 170, fill=W, width=int(s*.02))
    for i in range(15):
        a = math.radians(14+i*10.4); x, y = c+math.cos(a)*s*.3, s*.55+math.sin(a)*s*.27; d.line([(x, y), (x, y+s*.05)], fill=W, width=int(s*.01))
creature('smiler', smiler)
def tall(d, s):
    c = s/2; d.ellipse([c-s*.07, s*.04, c+s*.07, s*.19], fill=BK, outline=W, width=int(s*.01)); d.rectangle([c-s*.02, s*.19, c+s*.02, s*.62], fill=W)
    d.polygon([(c-s*.05, s*.2), (c+s*.05, s*.2), (c+s*.03, s*.6), (c-s*.03, s*.6)], fill=BK, outline=W)
    d.line([(c-s*.04, s*.26), (c-s*.2, s*.6), (c-s*.18, s*.97)], fill=W, width=int(s*.008)); d.line([(c+s*.04, s*.26), (c+s*.22, s*.58), (c+s*.2, s*.97)], fill=W, width=int(s*.008))
    d.line([(c-s*.02, s*.6), (c-s*.06, s*.97)], fill=W, width=int(s*.008)); d.line([(c+s*.02, s*.6), (c+s*.06, s*.97)], fill=W, width=int(s*.008))
creature('tall', tall)
def hands(d, s):
    c = s/2; d.ellipse([c-s*.16, s*.55, c+s*.16, s*.88], fill=BK, outline=W, width=int(s*.01))
    for i in range(9):
        a = math.radians(-150+i*(120/8)+0); L = s*(0.3+0.04*(i % 3)); x0, y0 = c+math.cos(a)*s*.13, s*.66+math.sin(a)*s*.13; x1, y1 = c+math.cos(a)*L, s*.66+math.sin(a)*L
        d.line([(x0, y0), (x1, y1)], fill=W, width=int(s*.018)); d.ellipse([x1-s*.012, y1-s*.012, x1+s*.012, y1+s*.012], fill=W)
creature('hands', hands)
def tv(d, s):
    d.rounded_rectangle([s*.12, s*.25, s*.88, s*.8], radius=s*.05, fill=BK, outline=W, width=int(s*.012)); d.rounded_rectangle([s*.18, s*.31, s*.7, s*.74], radius=s*.04, fill=(30, 28, 50, 255), outline=W, width=int(s*.006))
    for i in range(160): x, y = random.uniform(.19, .69)*s, random.uniform(.32, .73)*s; d.rectangle([x, y, x+s*.01, y+s*.006], fill=(200, 200, 255, 220))
    d.ellipse([s*.34, s*.43, s*.54, s*.6], fill=W); d.ellipse([s*.41, s*.47, s*.47, s*.57], fill=BK)
    d.line([(s*.4, s*.25), (s*.28, s*.08)], fill=W, width=int(s*.01)); d.line([(s*.6, s*.25), (s*.72, s*.1)], fill=W, width=int(s*.01))
    for y in (.4, .5, .6): d.ellipse([s*.76, s*y*1.0, s*.82, s*y*1.0+s*.05], outline=W, width=int(s*.006))
creature('tv', tv)
def hollow(d, s):
    c = s/2; d.ellipse([s*.2, s*.08, s*.8, s*.82], fill=BK, outline=W, width=int(s*.012))
    for ex in (.36, .64): d.ellipse([s*(ex-.07), s*.34, s*(ex+.07), s*.5], fill=(0, 0, 0, 255), outline=W, width=int(s*.008)); d.line([(s*ex, s*.5), (s*ex, s*.95)], fill=W, width=int(s*.007))
    d.line([(c-s*.08, s*.66), (c+s*.08, s*.66)], fill=W, width=int(s*.008))
creature('hollow', hollow)
def door(d, s):
    d.rectangle([s*.25, s*.05, s*.75, s*.95], fill=BK, outline=W, width=int(s*.012)); d.polygon([(s*.25, s*.05), (s*.45, s*.12), (s*.45, s*.88), (s*.25, s*.95)], fill=(20, 18, 36, 255), outline=W)
    for y in (.4, .5, .6, .47, .55):
        x0 = s*(.52+random.random()*.12); d.ellipse([x0, s*y, x0+s*.03, s*y+s*.02], fill=W)
    d.ellipse([s*.62, s*.46, s*.7, s*.56], fill=W); d.ellipse([s*.65, s*.48, s*.68, s*.54], fill=BK)
creature('door', door)
def static_kid(d, s):
    c = s/2; d.ellipse([c-s*.1, s*.12, c+s*.1, s*.34], fill=BK, outline=W, width=int(s*.01)); d.polygon([(c-s*.14, s*.36), (c+s*.14, s*.36), (c+s*.2, s*.8), (c-s*.2, s*.8)], fill=BK, outline=W)
    for i in range(200): x, y = random.gauss(c, s*.12), random.uniform(.12, .8)*s; d.rectangle([x, y, x+s*.012, y+s*.006], fill=(255, 255, 255, random.randint(60, 220)))
    d.line([(c-s*.14, s*.4), (c-s*.3, s*.7)], fill=W, width=int(s*.008)); d.line([(c+s*.14, s*.4), (c+s*.3, s*.7)], fill=W, width=int(s*.008))
creature('kid', static_kid)

# ------------------------------------------------------------------ chess pieces: glitchy geometric set
def piece(kind, side, name):
    s = 128; im, d = canvas(s); fill = (244, 241, 255, 255) if side == 'w' else (26, 21, 48, 255); line = (26, 21, 48, 255) if side == 'w' else (165, 150, 255, 255)
    def shape(dd, ox, col, outline):
        def P(pts): return [((x+ox)*SS, y*SS) for x, y in pts]
        base = [(28, 108), (100, 108), (92, 94), (36, 94)]
        if kind == 'p':
            dd.ellipse([((50+ox))*SS, 24*SS, (78+ox)*SS, 52*SS], fill=col, outline=outline, width=4*SS); dd.polygon(P([(46, 94), (82, 94), (74, 56), (54, 56)]), fill=col, outline=outline); dd.polygon(P(base), fill=col, outline=outline)
        elif kind == 'r':
            dd.polygon(P([(36, 94), (92, 94), (86, 46), (42, 46)]), fill=col, outline=outline)
            for x in (38, 58, 78): dd.rectangle([(x+ox)*SS, 24*SS, (x+14+ox)*SS, 48*SS], fill=col, outline=outline, width=3*SS)
            dd.polygon(P(base), fill=col, outline=outline)
        elif kind == 'n':
            dd.polygon(P([(40, 94), (92, 94), (88, 52), (70, 24), (52, 20), (60, 36), (36, 58), (40, 70), (58, 62), (50, 94)]), fill=col, outline=outline); dd.ellipse([(66+ox)*SS, 36*SS, (72+ox)*SS, 42*SS], fill=outline); dd.polygon(P(base), fill=col, outline=outline)
        elif kind == 'b':
            dd.polygon(P([(64, 14), (88, 52), (64, 90), (40, 52)]), fill=col, outline=outline); dd.line(P([(52, 40), (76, 64)]), fill=outline, width=4*SS); dd.ellipse([(58+ox)*SS, 6*SS, (70+ox)*SS, 18*SS], fill=outline)
            dd.polygon(P([(44, 108), (84, 108), (78, 92), (50, 92)]), fill=col, outline=outline)
        elif kind == 'q':
            pts = [(34, 94), (24, 34), (46, 58), (64, 20), (82, 58), (104, 34), (94, 94)]; dd.polygon(P(pts), fill=col, outline=outline)
            for x, y in ((24, 30), (64, 16), (104, 30)): dd.ellipse([(x-6+ox)*SS, (y-6)*SS, (x+6+ox)*SS, (y+6)*SS], fill=outline)
            dd.polygon(P(base), fill=col, outline=outline)
        elif kind == 'k':
            dd.rectangle([(60+ox)*SS, 6*SS, (68+ox)*SS, 34*SS], fill=outline); dd.rectangle([(50+ox)*SS, 14*SS, (78+ox)*SS, 22*SS], fill=outline)
            dd.polygon(P([(36, 94), (92, 94), (98, 46), (80, 56), (64, 36), (48, 56), (30, 46)]), fill=col, outline=outline); dd.polygon(P(base), fill=col, outline=outline)
    if side == 'b': shape(d, -3, (255, 42, 109, 120), (255, 42, 109, 120)); shape(d, 3, (5, 217, 232, 120), (5, 217, 232, 120))
    else: shape(d, -2, (255, 42, 109, 110), (255, 42, 109, 110)); shape(d, 2, (5, 217, 232, 110), (5, 217, 232, 110))
    shape(d, 0, fill, line); done(im, f'games/chess/{name}.png')
for k in 'prnbqk':
    for sd in 'wb': piece(k, sd, sd+k)

# ------------------------------------------------------------------ game sprites
def glow(im, rad=14, k=1.0):
    g = im.filter(ImageFilter.GaussianBlur(rad)); a = np.array(g).astype(float); a[..., 3] *= k; g = Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA'); return Image.alpha_composite(g, im)
def sprite(name, fn, size=128, col=(165, 150, 255, 255)):
    im, d = canvas(size); fn(d, size*SS, col); im = im.resize((size, size), Image.LANCZOS); im = glow(im, size*0.06); p = os.path.join(ROOT, f'games/{name}.png'); os.makedirs(os.path.dirname(p), exist_ok=True); im.save(p)
sprite('rhyme/low', lambda d, s, c: (d.rectangle([s*.18, s*.18, s*.82, s*.82], fill=(255, 42, 109, 255)), d.rectangle([s*.3, s*.3, s*.7, s*.7], fill=(10, 9, 19, 255)), d.rectangle([s*.42, s*.42, s*.58, s*.58], fill=W)))
sprite('rhyme/mid', lambda d, s, c: (d.polygon([(s*.5, s*.1), (s*.88, s*.5), (s*.5, s*.9), (s*.12, s*.5)], fill=(255, 225, 74, 255)), d.polygon([(s*.5, s*.3), (s*.7, s*.5), (s*.5, s*.7), (s*.3, s*.5)], fill=(10, 9, 19, 255)), d.line([(s*.2, s*.8), (s*.8, s*.2)], fill=W, width=int(s*.04))))
sprite('rhyme/high', lambda d, s, c: d.polygon([(s*.5+math.cos(-math.pi/2+i*math.pi/4)*s*(.42 if i % 2 == 0 else .1), s*.5+math.sin(-math.pi/2+i*math.pi/4)*s*(.42 if i % 2 == 0 else .1)) for i in range(8)], fill=(5, 217, 232, 255)))
sprite('rhyme/ring', lambda d, s, c: d.ellipse([s*.06, s*.06, s*.94, s*.94], outline=W, width=int(s*.03)))
sprite('snake/food', lambda d, s, c: (d.polygon([(s*.5, s*.12), (s*.84, s*.3), (s*.84, s*.7), (s*.5, s*.88), (s*.16, s*.7), (s*.16, s*.3)], fill=(255, 225, 74, 255)), d.line([(s*.5, s*.12), (s*.5, s*.5), (s*.84, s*.7)], fill=(10, 9, 19, 255), width=int(s*.03)), d.line([(s*.5, s*.5), (s*.16, s*.7)], fill=(10, 9, 19, 255), width=int(s*.03))))
sprite('snake/hole', lambda d, s, c: [d.ellipse([s*(.1+i*.07), s*(.1+i*.07), s*(.9-i*.07), s*(.9-i*.07)], outline=(165, 150, 255, 255), width=int(s*.025)) for i in range(5)])
sprite('snake/spike', lambda d, s, c: [d.polygon([(s*(.12+i*.28), s*.88), (s*(.26+i*.28), s*.14), (s*(.4+i*.28), s*.88)], fill=(255, 42, 109, 255)) for i in range(3)])
sprite('snake/portal', lambda d, s, c: (d.ellipse([s*.1, s*.1, s*.9, s*.9], outline=(5, 217, 232, 255), width=int(s*.05)), d.ellipse([s*.3, s*.3, s*.7, s*.7], fill=(5, 217, 232, 120))))

def preview(name, fn):
    w, h = 640, 400; im = Image.new('RGB', (w, h), (10, 9, 19)); d = ImageDraw.Draw(im)
    for i in range(500): d.point((random.randint(0, w-1), random.randint(0, h-1)), fill=(100+random.randint(0, 120), 100+random.randint(0, 100), 255))
    fn(im, d, w, h); im.save(os.path.join(ROOT, f'games/preview_{name}.png'))
def pv_rhyme(im, d, w, h):
    for i in range(12): r = 20+i*i*2.2; d.ellipse([w/2-r*1.5, h/2-r*.9, w/2+r*1.5, h/2+r*.9], outline=(165, 150, 255), width=1)
    for x, y, k in ((120, 100, 'high'), (500, 120, 'mid'), (320, 300, 'low'), (200, 260, 'high'), (440, 250, 'high'), (330, 120, 'mid')):
        sp = Image.open(os.path.join(ROOT, f'games/rhyme/{k}.png')).resize((70, 70)); im.paste(sp, (x-35, y-35), sp)
def pv_snake(im, d, w, h):
    cx, cy = w/2, h/2
    for q in range(-5, 6):
        for r in range(-3, 4):
            x = cx+(q+r*.5)*54; y = cy+r*47; d.polygon([(x+27*math.cos(a), y*1+27*math.sin(a)) for a in [i*math.pi/3+math.pi/6 for i in range(6)]], outline=(70, 60, 130))
    pts = [(cx-160, cy+60), (cx-110, cy+30), (cx-60, cy+60), (cx, cy+30), (cx+50, cy-10), (cx+100, cy-50)]
    for a, b in zip(pts, pts[1:]): d.line([a, b], fill=(165, 150, 255), width=22)
    d.ellipse([pts[-1][0]-20, pts[-1][1]-20, pts[-1][0]+20, pts[-1][1]+20], fill=W)
    sp = Image.open(os.path.join(ROOT, 'games/snake/food.png')).resize((60, 60)); im.paste(sp, (int(cx+150), int(cy-120)), sp); sp = Image.open(os.path.join(ROOT, 'games/snake/hole.png')).resize((70, 70)); im.paste(sp, (int(cx-210), int(cy-90)), sp)
def pv_chess(im, d, w, h):
    s = 46; ox, oy = (w-8*s)/2, (h-8*s)/2
    for r in range(8):
        for c in range(8):
            col = (80, 70, 150) if (r+c) % 2 else (200, 195, 255); d.rectangle([ox+c*s, oy+r*s, ox+c*s+s, oy+r*s+s], fill=col)
    for c in range(8): d.rectangle([ox+c*s+2, oy+4*s+2, ox+c*s+s-2, oy+4*s+s-2], outline=(255, 42, 109), width=2) if c in (1, 2) else None
    for (r, c, n) in ((0, 4, 'bk'), (0, 3, 'bq'), (1, 2, 'bp'), (6, 4, 'wp'), (7, 4, 'wk'), (7, 1, 'wn'), (0, 6, 'bn'), (3, 3, 'wb')):
        sp = Image.open(os.path.join(ROOT, f'games/chess/{n}.png')).resize((s, s)); im.paste(sp, (int(ox+c*s), int(oy+r*s)), sp)
preview('rhyme', pv_rhyme); preview('snake', pv_snake); preview('chess', pv_chess)
print('assets done')
