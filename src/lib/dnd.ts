// ponytail: browsers have no Do Not Disturb API. Apple Shortcuts does, and pages can run a shortcut via its
// URL scheme. Apple devices only; Windows/Android would need a native helper app.
export const DND_SHORTCUT = 'Flowstate Focus';

export const dndSupported = () => /Mac|iPhone|iPad/.test(navigator.userAgent);

// minutes > 0: DnD on until now + minutes (the OS turns it off itself, even if this tab is asleep). 0: off now.
// Must be called from a click: browsers block opening app links without a user gesture.
export function setDnd(minutes: number) {
  // encodeURIComponent, not URLSearchParams: Shortcuts reads '+' literally, not as a space
  location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(DND_SHORTCUT)}&input=text&text=${Math.ceil(minutes)}`;
}
