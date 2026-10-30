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
    '@/lib/sounds': { playAlarm: async () => { events.push('alarm'); } },
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
  let starts = 0;
  let stops = 0;
  global.AudioContext = class {
    constructor() { contexts++; this.state = 'suspended'; this.sampleRate = 100; this.destination = {}; }
    async resume() { this.state = 'running'; }
    createBuffer(_channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    createBufferSource() { return { connect() {}, disconnect() {}, start() { starts++; }, stop() { stops++; }, buffer: null, loop: false }; }
    createGain() { return { connect() {}, disconnect() {}, gain: { value: 0 } }; }
  };
  const sounds = load('src/lib/sounds.ts', {});
  sounds.prepareAlarm();
  await sounds.playAlarm();
  assert.equal(contexts, 1);
  assert.equal(starts, 1);
  await sounds.playAlarm();
  assert.equal(contexts, 1);
  assert.equal(starts, 1);
  sounds.stopAlarm();
  assert.equal(stops, 1);
  await sounds.playAlarm();
  assert.equal(starts, 2);
  console.log('Passed Spotify pause ordering, muted alarm, pause failure recovery, looping audio reuse, and manual stop.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
