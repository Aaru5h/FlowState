const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(path, dependencies) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`)((name) => dependencies[name], module, module.exports);
  return module.exports;
}
(async () => {
  const events = [];
  let fail = false;
  const { alertSessionEnd } = load('src/lib/sessionAlert.ts', {
    '@/hooks/useSpotifyEmbed': { pause: () => { events.push('embed paused'); } },
    '@/hooks/useSpotifyPlayer': { pause: async () => { events.push('premium paused'); if (fail) throw Error('Disconnected'); } },
    '@/lib/sounds': { playChime: async () => { events.push('alarm'); } },
  });
  await alertSessionEnd(true);
  assert.deepEqual(events, ['embed paused', 'premium paused', 'alarm']);
  events.length = 0;
  await alertSessionEnd(false);
  assert.deepEqual(events, ['embed paused', 'premium paused']);
  events.length = 0;
  fail = true;
  await alertSessionEnd(true);
  assert.equal(events.at(-1), 'alarm');
  let contexts = 0;
  let notes = 0;
  global.AudioContext = class {
    constructor() { contexts++; this.state = 'suspended'; this.currentTime = 0; }
    async resume() { this.state = 'running'; }
    createOscillator() { return { connect() {}, disconnect() {}, frequency: {}, start() { notes++; }, stop() {} }; }
    createGain() { return { connect() {}, disconnect() {}, gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
  };
  const sounds = load('src/lib/sounds.ts', {});
  sounds.prepareAlarm();
  await sounds.playChime();
  assert.equal(contexts, 1);
  assert.equal(notes, 6);
  await sounds.playChime();
  assert.equal(contexts, 1);
  console.log('Passed Spotify pause ordering, muted alarm, pause failure recovery, audio unlock/reuse, and alarm pulses.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
