// Run with: node --test
const test = require('node:test');
const assert = require('node:assert');

const { normalise, compareNames, eliminate, calculate } = require('../logic.js');

test('normalise keeps letters only, in lower case', () => {
    assert.strictEqual(normalise('Anna-Marie 2!'), 'annamarie');
    assert.strictEqual(normalise('José'), 'josé');
    assert.strictEqual(normalise('  '), '');
});

test('shared letters cancel out one for one', () => {
    const { a, b, remaining } = compareNames('Kishore', 'Priya');
    assert.deepStrictEqual(a.filter((l) => l.matched).map((l) => l.char), ['i', 'r']);
    assert.deepStrictEqual(b.filter((l) => l.matched).map((l) => l.char), ['r', 'i']);
    assert.strictEqual(remaining, 8);
});

test('repeated letters only cancel as many times as they appear in both', () => {
    // "anna" vs "an": one a and one n cancel, leaving "na"
    assert.strictEqual(compareNames('Anna', 'An').remaining, 2);
});

test('elimination follows the classic counting rules', () => {
    // Count 8 around F-L-A-M-E-S: L, E, M, F, S go; A remains
    assert.deepStrictEqual(eliminate(8).order, ['L', 'E', 'M', 'F', 'S']);
    assert.strictEqual(eliminate(8).result, 'A');
    // Count 1 strikes letters in order, leaving S
    assert.deepStrictEqual(eliminate(1).order, ['F', 'L', 'A', 'M', 'E']);
    // Count 6 always lands on the last letter first
    assert.strictEqual(eliminate(6).order[0], 'S');
});

test('every count gives exactly one result and strikes five letters', () => {
    for (let count = 1; count <= 60; count += 1) {
        const { order, result } = eliminate(count);
        assert.strictEqual(order.length, 5);
        assert.ok('FLAMES'.includes(result));
        assert.ok(!order.includes(result));
    }
});

test('known pairs', () => {
    assert.strictEqual(calculate('Kishore', 'Priya').result, 'A');
    assert.strictEqual(calculate('Romeo', 'Juliet').result, 'E');
    assert.strictEqual(calculate('Anna', 'Arjun').result, 'F');
});

test('names that cancel out completely have no result', () => {
    const outcome = calculate('Ravi', 'ravi 2');
    assert.strictEqual(outcome.remaining, 0);
    assert.strictEqual(outcome.result, null);
});

test('steps describe each round for the wheel animation', () => {
    const { steps } = eliminate(8);
    assert.strictEqual(steps.length, 5);
    assert.deepStrictEqual(steps[0], { start: 0, landing: 1, letters: ['F', 'L', 'A', 'M', 'E', 'S'], removed: 'L' });
    // Each round's landing letter is the one removed
    steps.forEach((step) => assert.strictEqual(step.letters[step.landing], step.removed));
});

test('matched letters point at their partner in the other name', () => {
    const { a, b } = compareNames('Kishore', 'Priya');
    a.filter((l) => l.matched).forEach((letter) => {
        assert.strictEqual(b[letter.pair].char, letter.char);
    });
});
