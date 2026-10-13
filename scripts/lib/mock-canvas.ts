// A stand-in for CanvasRenderingContext2D, for `npm run check`: it accepts every drawing
// call and reports any argument or property that is NaN or Infinity, so a world that
// computes a bad coordinate fails the check instead of drawing nothing in the render.

export function mockContext(width: number, height: number, onBad: (what: string) => void): CanvasRenderingContext2D {
  const bad = (name: string, args: unknown[]) => {
    for (const a of args) {
      if (typeof a === 'number' && !Number.isFinite(a)) {
        onBad(`${name}(${args.map((x) => (typeof x === 'number' ? String(x) : typeof x)).join(', ')})`);
        return;
      }
    }
  };
  const gradient = {addColorStop: (offset: number) => bad('addColorStop', [offset])};
  const state: Record<string, unknown> = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    lineWidth: 1,
    fillStyle: '#000',
    strokeStyle: '#000',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    lineCap: 'butt',
    lineJoin: 'miter',
    shadowBlur: 0,
    shadowColor: 'transparent',
  };
  const fixed: Record<string, unknown> = {
    canvas: {width, height},
    createLinearGradient: (...a: number[]) => (bad('createLinearGradient', a), gradient),
    createRadialGradient: (...a: number[]) => (bad('createRadialGradient', a), gradient),
    createPattern: () => null,
    measureText: () => ({width: 10}),
    getLineDash: () => [],
  };
  return new Proxy(fixed, {
    get(target, key) {
      if (typeof key !== 'string') return undefined;
      if (key in state) return state[key];
      if (key in target) return target[key];
      return (...args: unknown[]) => bad(key, args);
    },
    set(_target, key, value) {
      if (typeof value === 'number' && !Number.isFinite(value)) onBad(`${String(key)} = ${value}`);
      state[String(key)] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}
