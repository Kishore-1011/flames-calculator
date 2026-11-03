// FLAMES logic: pure functions with no DOM access, shared by the page and the tests.

const FLAMES = ['F', 'L', 'A', 'M', 'E', 'S'];

// Keep letters only, in lower case ("Anna-Marie 2" -> "annamarie")
function normalise(name) {
    return name.toLowerCase().replace(/[^\p{L}]/gu, '');
}

// Cancel out letters the two names share, one for one.
// Returns each name as a list of { char, matched, pair } plus the count of letters left over.
// `pair` links a matched letter to its partner's position in the other name.
function compareNames(first, second) {
    const a = [...normalise(first)].map((char) => ({ char, matched: false, pair: -1 }));
    const b = [...normalise(second)].map((char) => ({ char, matched: false, pair: -1 }));

    a.forEach((letter, i) => {
        const j = b.findIndex((other) => !other.matched && other.char === letter.char);
        if (j !== -1) {
            letter.matched = true;
            letter.pair = j;
            b[j].matched = true;
            b[j].pair = i;
        }
    });

    const remaining = [...a, ...b].filter((letter) => !letter.matched).length;
    return { a, b, remaining };
}

// Count around F-L-A-M-E-S, striking out a letter every `count` steps,
// starting the next count from the letter after the one removed.
// `steps` records each round: where counting started, where it landed and what was removed
// (indexes refer to the letters still in play at the start of that round).
function eliminate(count) {
    const letters = [...FLAMES];
    const order = [];
    const steps = [];
    let index = 0;

    while (letters.length > 1) {
        const start = index;
        index = (index + count - 1) % letters.length;
        steps.push({ start, landing: index, letters: [...letters], removed: letters[index] });
        order.push(letters.splice(index, 1)[0]);
        if (index === letters.length) {
            index = 0;
        }
    }
    return { order, steps, result: letters[0] };
}

function calculate(first, second) {
    const comparison = compareNames(first, second);
    if (comparison.remaining === 0) {
        return { ...comparison, order: [], steps: [], result: null };
    }
    return { ...comparison, ...eliminate(comparison.remaining) };
}

if (typeof module !== 'undefined') {
    module.exports = { FLAMES, normalise, compareNames, eliminate, calculate };
}
