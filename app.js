// FLAMES page: atmosphere, the four-act reveal, result card and sharing.
// Nothing is stored: names and results only exist on the page until you leave it.
// The calculation itself lives in logic.js.

const RESULTS = {
    F: { word: 'Friends', emoji: '🤝', line: 'A friendship worth keeping for life.', colors: ['#34d399', '#60a5fa'] },
    L: { word: 'Love', emoji: '❤️', line: 'Hearts in sync. This one is special.', colors: ['#ff3d7f', '#ff8a3d'] },
    A: { word: 'Affection', emoji: '🥰', line: 'Warm, caring and full of fondness.', colors: ['#f472b6', '#c084fc'] },
    M: { word: 'Marriage', emoji: '💍', line: 'Wedding bells might be in the future!', colors: ['#fbbf24', '#f472b6'] },
    E: { word: 'Enemy', emoji: '⚔️', line: 'Sparks fly, and not always the good kind.', colors: ['#ff4d4d', '#ff9f43'] },
    S: { word: 'Siblings', emoji: '👫', line: 'Close like family, through thick and thin.', colors: ['#22d3ee', '#a78bfa'] },
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const $ = (id) => document.getElementById(id);

/* ---------- Ember particles ---------- */

const embers = (() => {
    const canvas = $('embers');
    const ctx = canvas.getContext('2d');
    const particles = [];
    const pointer = { x: -999, y: -999 };
    const warm = ['#ff7a45', '#ff3d7f', '#ffb347', '#ff9f6b'];
    let width = 0;
    let height = 0;
    let running = true;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnAmbient() {
        particles.push({
            x: Math.random() * width,
            y: height + 10,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -(0.35 + Math.random() * 0.9),
            size: 0.8 + Math.random() * 2.2,
            life: 0,
            max: 380 + Math.random() * 420,
            color: warm[(Math.random() * warm.length) | 0],
            drag: 1,
            lift: 0,
        });
    }

    function burst(x, y, colors = warm, count = 46) {
        if (reduceMotion) return;
        for (let i = 0; i < count; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4.5;
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                size: 1 + Math.random() * 2.8,
                life: 0,
                max: 50 + Math.random() * 50,
                color: colors[(Math.random() * colors.length) | 0],
                drag: 0.95,
                lift: 0.04,
            });
        }
    }

    function frame() {
        if (!running) return;
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'lighter';

        if (particles.length < 90 && Math.random() < 0.35) {
            spawnAmbient();
        }

        for (let i = particles.length - 1; i >= 0; i -= 1) {
            const p = particles[i];
            // Embers drift away from the pointer
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 110 && dist > 0) {
                p.vx += (dx / dist) * 0.25;
                p.vy += (dy / dist) * 0.25;
            }
            p.vx *= p.drag;
            p.vy = p.vy * p.drag - p.lift;
            p.x += p.vx + Math.sin((p.life + i) * 0.03) * 0.25;
            p.y += p.vy;
            p.life += 1;

            const t = p.life / p.max;
            if (t >= 1 || p.y < -20) {
                particles.splice(i, 1);
                continue;
            }
            const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
            ctx.globalAlpha = alpha * 0.22;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; });
    document.addEventListener('visibilitychange', () => {
        running = !document.hidden && !reduceMotion;
        if (running) requestAnimationFrame(frame);
    });
    if (reduceMotion) {
        running = false;
    } else {
        requestAnimationFrame(frame);
    }

    return { burst };
})();

function burstAt(element, colors, count) {
    const box = element.getBoundingClientRect();
    embers.burst(box.left + box.width / 2, box.top + box.height / 2, colors, count);
}

/* ---------- Views ---------- */

const views = { form: $('view-form'), reveal: $('view-reveal'), result: $('view-result') };

function showView(name) {
    Object.entries(views).forEach(([key, view]) => {
        const active = key === name;
        view.hidden = !active;
        view.classList.remove('is-active');
        if (active) {
            void view.offsetWidth;   // restart the entrance animation
            view.classList.add('is-active');
        }
    });
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

/* ---------- Timing, with Skip support ---------- */

let skipping = false;
let runToken = 0;
const pending = new Set();

function wait(ms) {
    if (skipping || reduceMotion) return Promise.resolve();
    return new Promise((resolve) => {
        const done = () => { clearTimeout(timer); pending.delete(done); resolve(); };
        const timer = setTimeout(done, ms);
        pending.add(done);
    });
}

function skip() {
    skipping = true;
    [...pending].forEach((done) => done());
}

/* ---------- The reveal ---------- */

const chipsA = $('chips-a');
const chipsB = $('chips-b');
const countNum = $('count-num');
const countLabel = $('count-label');
const wheel = $('wheel');
const hand = $('wheel-hand');
const wheelStep = $('wheel-step');
const caption = $('caption');
const announcer = $('announcer');
const acts = { names: $('act-names'), count: $('act-count'), wheel: $('act-wheel') };

// Pace of the reveal (milliseconds). Tuned to be easy to follow; Skip/Esc is always available.
const PACE = {
    chipStagger: 70,      // letters flying in, one after another
    settle: 700,          // pause before shared letters start burning
    pairBurn: 1000,       // one shared pair igniting and turning to ash
    countUp: 1100,        // counter climbing
    afterCount: 700,
    actFade: 500,         // crossfade between acts
    wheelIntro: 800,      // wheel letters appearing
    roundTime: 850,       // one round of counting around the wheel
    hopMin: 80,
    hopMax: 400,
    letterBurn: 650,      // a wheel letter flaring and burning out
    betweenRounds: 120,
    survivor: 1200,
    beforeResult: 600,
};

// Smoothly move between acts: fade out the ones leaving, then fade in the new one
async function setActs(state) {
    const leaving = Object.entries(acts).filter(([key, el]) => state[key] === 'hidden' && !el.classList.contains('is-hidden'));
    leaving.forEach(([, el]) => el.classList.add('is-leaving'));
    if (leaving.length) await wait(PACE.actFade);
    Object.entries(acts).forEach(([key, el]) => {
        const hidden = state[key] === 'hidden';
        const wasHidden = el.classList.contains('is-hidden');
        el.classList.remove('is-leaving');
        el.classList.toggle('is-hidden', hidden);
        el.classList.toggle('is-dim', state[key] === 'dim');
        if (wasHidden && !hidden) {
            el.classList.remove('is-entering');
            void el.offsetWidth;
            el.classList.add('is-entering');
        }
    });
}

function renderChips(container, letters) {
    container.replaceChildren(...letters.map((letter, i) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = letter.char;
        chip.style.setProperty('--i', i);
        return chip;
    }));
}

const WHEEL_ANGLE = { F: -90, L: -30, A: 30, M: 90, E: 150, S: 210 };

function buildWheel() {
    wheel.querySelectorAll('.wheel-letter').forEach((el) => el.remove());
    wheel.classList.remove('is-done');
    Object.entries(WHEEL_ANGLE).forEach(([letter, angle], i) => {
        const el = document.createElement('span');
        el.className = 'wheel-letter';
        el.dataset.letter = letter;
        el.textContent = letter;
        el.style.setProperty('--angle', `${angle}deg`);
        el.style.setProperty('--i', i);
        wheel.appendChild(el);
    });
    handAngle = -90;
    hand.style.setProperty('--hand', '-90deg');
    wheelStep.textContent = '';
}

let handAngle = -90;

// Turn the hand clockwise to point at a letter
function pointAt(letter) {
    let target = WHEEL_ANGLE[letter];
    while (target < handAngle) target += 360;
    handAngle = target;
    hand.style.setProperty('--hand', `${handAngle}deg`);
}

// Count up frame by frame with an ease-out curve, so it slows into the final number
function countUp(to) {
    if (skipping || reduceMotion) {
        countNum.textContent = to;
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min((now - start) / PACE.countUp, 1);
            const eased = 1 - (1 - t) ** 3;
            countNum.textContent = Math.round(to * eased);
            if (t < 1 && !skipping) {
                requestAnimationFrame(tick);
            } else {
                countNum.textContent = to;
                resolve();
            }
        };
        requestAnimationFrame(tick);
    });
}

async function run(first, second) {
    const token = ++runToken;
    const stale = () => token !== runToken;
    skipping = false;

    const outcome = calculate(first, second);
    const nameA = first.trim();
    const nameB = second.trim();
    const title = $('reveal-title');
    title.replaceChildren(nameA, Object.assign(document.createElement('span'), { className: 'amp-inline', textContent: ' & ' }), nameB);

    views.reveal.setAttribute('aria-busy', 'true');
    $('skip').hidden = false;
    caption.textContent = '';
    countNum.textContent = '0';
    countLabel.textContent = 'letters remain';
    renderChips(chipsA, outcome.a);
    renderChips(chipsB, outcome.b);
    buildWheel();
    Object.values(acts).forEach((el) => el.classList.remove('is-leaving', 'is-entering', 'is-dim'));
    acts.count.classList.add('is-hidden');
    acts.wheel.classList.add('is-hidden');
    acts.names.classList.remove('is-hidden');
    showView('reveal');

    // Act 1: shared letters ignite and burn away, one pair at a time
    caption.textContent = 'Finding the letters you share…';
    await wait(Math.max(chipsA.children.length, chipsB.children.length) * PACE.chipStagger + PACE.settle);
    if (stale()) return;
    const pairs = outcome.a.map((letter, i) => [i, letter.pair]).filter(([, j]) => j !== -1);
    // Many shared letters overlap a little so long names don't drag
    const pairGap = Math.max(450, PACE.pairBurn - (pairs.length - 1) * 90);
    for (const [i, j] of pairs) {
        const chipA = chipsA.children[i];
        const chipB = chipsB.children[j];
        chipA.classList.add('is-burning');
        chipB.classList.add('is-burning');
        await wait(PACE.pairBurn * 0.35);   // burst at the peak of the flare
        if (stale()) return;
        if (!skipping) {
            burstAt(chipA, undefined, 26);
            burstAt(chipB, undefined, 26);
        }
        await wait(pairGap - PACE.pairBurn * 0.35);
        if (stale()) return;
    }
    await wait(pairs.length ? PACE.pairBurn * 0.65 : 0);
    if (stale()) return;

    if (outcome.result === null) {
        caption.textContent = '';
        const strong = document.createElement('strong');
        strong.textContent = 'Every letter burned away.';
        caption.append(strong, ' Try using full names!');
        $('skip').hidden = true;
        views.reveal.setAttribute('aria-busy', 'false');
        announcer.textContent = 'Every letter cancels out. Try using full names.';
        await wait(1800);
        if (!stale()) {
            showView('form');
            $('name-1').focus();
        }
        return;
    }

    // Act 2: count the letters left
    caption.textContent = pairs.length
        ? `${pairs.length} shared letter${pairs.length === 1 ? '' : 's'} burned from each name.`
        : 'No shared letters to burn.';
    countLabel.textContent = outcome.remaining === 1 ? 'letter remains' : 'letters remain';
    await setActs({ names: 'dim', count: 'show', wheel: 'hidden' });
    if (stale()) return;
    await countUp(outcome.remaining);
    if (stale()) return;
    await wait(PACE.afterCount);
    if (stale()) return;

    // Act 3: count around the wheel, burning a letter each round
    await setActs({ names: 'hidden', count: 'dim', wheel: 'show' });
    if (stale()) return;
    await wait(PACE.wheelIntro);
    if (stale()) return;

    // Each round takes about the same time whatever the count; the hand glides at the same pace
    const hopDelay = Math.min(PACE.hopMax, Math.max(PACE.hopMin, PACE.roundTime / outcome.remaining));
    wheel.style.setProperty('--hop', `${Math.round(hopDelay * 0.9)}ms`);
    let previous = null;
    for (const step of outcome.steps) {
        caption.replaceChildren('Counting ', Object.assign(document.createElement('strong'), { textContent: outcome.remaining }),
            ` around ${step.letters.join(' · ')}`);
        for (let k = 0; k < outcome.remaining; k += 1) {
            const letter = step.letters[(step.start + k) % step.letters.length];
            const el = wheel.querySelector(`[data-letter="${letter}"]`);
            if (previous && previous !== el) previous.classList.remove('is-hop');
            pointAt(letter);
            wheelStep.textContent = k + 1;
            el.classList.add('is-hop');
            previous = el;
            await wait(hopDelay);
            if (stale()) return;
        }
        previous.classList.remove('is-hop');
        previous = null;

        const burnt = wheel.querySelector(`[data-letter="${step.removed}"]`);
        burnt.classList.add('is-burnt');
        await wait(PACE.letterBurn * 0.3);   // burst at the peak of the flare
        if (stale()) return;
        if (!skipping) burstAt(burnt, undefined, 44);
        await wait(PACE.letterBurn * 0.7 + PACE.betweenRounds);
        if (stale()) return;
    }

    // Act 4: the survivor
    const info = RESULTS[outcome.result];
    setResultColors(info.colors);
    wheel.classList.add('is-done');
    caption.replaceChildren(Object.assign(document.createElement('strong'), { textContent: outcome.result }), ' survives the flames.');
    const survivor = wheel.querySelector(`[data-letter="${outcome.result}"]`);
    survivor.classList.add('is-survivor');
    await wait(PACE.survivor);
    if (stale()) return;
    if (!skipping) burstAt(survivor, info.colors, 80);
    await wait(PACE.beforeResult);
    if (stale()) return;

    showResult(nameA, nameB, outcome);
}

/* ---------- Result ---------- */

let lastResult = null;

function setResultColors([c1, c2]) {
    document.documentElement.style.setProperty('--r1', c1);
    document.documentElement.style.setProperty('--r2', c2);
}

function showResult(nameA, nameB, outcome) {
    const info = RESULTS[outcome.result];
    lastResult = { nameA, nameB, outcome, info };
    setResultColors(info.colors);

    // Names are the most personal part of the card, so show them large; each name wraps as a unit
    $('result-pair').replaceChildren(
        Object.assign(document.createElement('span'), { className: 'pair-name', textContent: nameA }),
        Object.assign(document.createElement('span'), { className: 'pair-amp', textContent: '&' }),
        Object.assign(document.createElement('span'), { className: 'pair-name', textContent: nameB }),
    );
    $('result-emoji').textContent = info.emoji;
    $('result-word').textContent = info.word;
    $('result-line').textContent = info.line;

    const trail = $('result-trail');
    trail.replaceChildren(
        ...outcome.order.map((letter) => Object.assign(document.createElement('s'), { textContent: letter })),
        Object.assign(document.createElement('span'), { textContent: '→' }),
        Object.assign(document.createElement('span'), { className: 'trail-win', textContent: outcome.result }),
    );

    views.reveal.setAttribute('aria-busy', 'false');
    showView('result');
    if (!reduceMotion) {
        setTimeout(() => burstAt($('result-emoji'), info.colors, 80), 250);
    }
    announcer.textContent = `${nameA} and ${nameB}: ${info.word}. ${info.line}`;
    card.focus({ preventScroll: true });
}

// Gentle 3D tilt that follows the pointer
const card = $('result-card');
if (finePointer && !reduceMotion) {
    card.addEventListener('pointermove', (e) => {
        const box = card.getBoundingClientRect();
        const x = (e.clientX - box.left) / box.width - 0.5;
        const y = (e.clientY - box.top) / box.height - 0.5;
        card.style.setProperty('--ry', `${x * 10}deg`);
        card.style.setProperty('--rx', `${y * -10}deg`);
    });
    card.addEventListener('pointerleave', () => {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
    });
}

/* ---------- Share image ---------- */

async function makeShareImage() {
    const { nameA, nameB, outcome, info } = lastResult;
    await document.fonts.ready;
    const W = 1080;
    const H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#08070c';
    ctx.fillRect(0, 0, W, H);
    const glow = (x, y, r, color, alpha) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, 'transparent');
        ctx.globalAlpha = alpha;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
    };
    glow(260, 300, 700, info.colors[0], 0.55);
    glow(900, 760, 650, '#8b5cf6', 0.35);
    glow(420, 1250, 700, info.colors[1], 0.45);

    // Embers
    for (let i = 0; i < 70; i += 1) {
        ctx.globalAlpha = 0.25 + Math.random() * 0.6;
        ctx.fillStyle = ['#ffb347', '#ff7a45', '#ff3d7f'][i % 3];
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, 1.5 + Math.random() * 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';

    ctx.fillStyle = 'rgba(245, 241, 250, 0.9)';
    ctx.font = '600 44px Unbounded, sans-serif';
    ctx.fillText('🔥 flames', W / 2, 150);

    // Names: large, on one line if they fit, otherwise one name per line
    ctx.fillStyle = '#f5f1fa';
    ctx.font = '600 68px Unbounded, sans-serif';
    const pairText = `${nameA} & ${nameB}`;
    const twoLines = ctx.measureText(pairText).width > W - 160;
    const dy = twoLines ? 40 : 0;   // push the rest down when the names take more room
    if (!twoLines) {
        ctx.fillText(pairText, W / 2, 360);
    } else {
        ctx.font = '600 60px Unbounded, sans-serif';
        ctx.fillText(nameA, W / 2, 310, W - 160);
        ctx.fillStyle = info.colors[1];
        ctx.fillText('&', W / 2, 385);
        ctx.fillStyle = '#f5f1fa';
        ctx.fillText(nameB, W / 2, 460, W - 160);
    }

    ctx.font = '200px sans-serif';
    ctx.fillText(info.emoji, W / 2, 640 + dy);

    const grad = ctx.createLinearGradient(160, 0, W - 160, 0);
    grad.addColorStop(0, info.colors[0]);
    grad.addColorStop(1, info.colors[1]);
    ctx.fillStyle = grad;
    ctx.font = '800 150px Unbounded, sans-serif';
    ctx.fillText(info.word, W / 2, 840 + dy, W - 120);

    ctx.fillStyle = 'rgba(245, 241, 250, 0.7)';
    ctx.font = '400 44px Inter, sans-serif';
    ctx.fillText(info.line, W / 2, 940 + dy, W - 160);

    ctx.fillStyle = 'rgba(245, 241, 250, 0.4)';
    ctx.font = '600 40px Unbounded, sans-serif';
    ctx.fillText(`${outcome.order.join(' · ')}  →  ${outcome.result}`, W / 2, 1100 + dy);

    ctx.font = '400 32px Inter, sans-serif';
    ctx.fillText('Just for fun · FLAMES', W / 2, H - 90);

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

$('download').addEventListener('click', async () => {
    if (!lastResult) return;
    const blob = await makeShareImage();
    const name = `flames-${lastResult.nameA}-${lastResult.nameB}.png`.toLowerCase().replace(/\s+/g, '-');
    const file = new File([blob], name, { type: 'image/png' });

    // Phones: share the image directly; otherwise download it
    if (navigator.canShare && navigator.canShare({ files: [file] }) && !finePointer) {
        try {
            await navigator.share({ files: [file], text: shareText() });
            return;
        } catch (error) {
            if (error.name === 'AbortError') return;
        }
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
});

function shareText() {
    const { nameA, nameB, info } = lastResult;
    return `${nameA} & ${nameB} = ${info.word} ${info.emoji} (FLAMES)`;
}

$('copy').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    try {
        await navigator.clipboard.writeText(shareText());
        button.textContent = 'Copied ✓';
    } catch (error) {
        button.textContent = 'Copy blocked';
    }
    setTimeout(() => { button.textContent = 'Copy'; }, 1800);
});

$('replay').addEventListener('click', () => {
    if (lastResult) run(lastResult.nameA, lastResult.nameB);
});

$('again').addEventListener('click', () => {
    showView('form');
    $('name-1').select();
    $('name-1').focus();
});

$('skip').addEventListener('click', skip);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !views.reveal.hidden && !$('how').open) {
        skip();
    }
});

/* ---------- Form ---------- */

const form = $('flames-form');
const nameInputs = [$('name-1'), $('name-2')];

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const [first, second] = nameInputs.map((input) => input.value);
    const valid = nameInputs.map((input) => Boolean(normalise(input.value)));
    nameInputs.forEach((input, i) => input.setAttribute('aria-invalid', String(!valid[i])));

    if (!valid[0] || !valid[1]) {
        $('form-error').textContent = 'Enter both names to light the flames (letters only).';
        nameInputs[valid[0] ? 1 : 0].focus();
        return;
    }
    $('form-error').textContent = '';
    run(first, second);
});

// Enter in the first field moves to the second instead of submitting early
nameInputs[0].addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !nameInputs[1].value.trim()) {
        e.preventDefault();
        nameInputs[1].focus();
    }
});

nameInputs.forEach((input) => input.addEventListener('input', () => {
    input.setAttribute('aria-invalid', 'false');
    $('form-error').textContent = '';
}));

/* ---------- How it works ---------- */

const how = $('how');
$('open-how').addEventListener('click', () => how.showModal());
$('close-how').addEventListener('click', () => how.close());
how.addEventListener('click', (e) => { if (e.target === how) how.close(); });

/* ---------- Pointer effects ---------- */

if (finePointer && !reduceMotion) {
    window.addEventListener('pointermove', (e) => {
        document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
        document.documentElement.style.setProperty('--my', `${e.clientY}px`);
    });

    // Magnetic buttons
    document.querySelectorAll('.cta').forEach((button) => {
        button.addEventListener('pointermove', (e) => {
            const box = button.getBoundingClientRect();
            button.style.setProperty('--tx', `${(e.clientX - box.left - box.width / 2) * 0.18}px`);
            button.style.setProperty('--ty', `${(e.clientY - box.top - box.height / 2) * 0.25}px`);
        });
        button.addEventListener('pointerleave', () => {
            button.style.setProperty('--tx', '0px');
            button.style.setProperty('--ty', '0px');
        });
    });
}

