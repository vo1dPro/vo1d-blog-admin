import { afterEach, expect, it, vi } from 'vitest';
import { animateWhileVisible } from '../../../vo1d-blog/src/lib/visible-animation';

afterEach(() => vi.unstubAllGlobals());

it('pauses offscreen and in hidden tabs, resumes without a time jump and cleans up', () => {
  const frames = new Map<number, FrameRequestCallback>();
  let nextId = 0;
  let notify: (visible: boolean) => void = () => {};
  const disconnect = vi.fn();
  const document = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal('document', document);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextId, callback);
    return nextId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        notify = (visible) => callback([{ isIntersecting: visible }]);
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  const draw = vi.fn();
  const cleanup = animateWhileVisible({} as Element, draw);
  const tick = (time: number) => {
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback(time);
  };
  expect(frames.size).toBe(0);
  notify(true);
  notify(true);
  expect(frames.size).toBe(1);
  tick(100);
  tick(116);
  expect(draw).toHaveBeenLastCalledWith(0.016);
  notify(false);
  expect(frames.size).toBe(0);
  notify(true);
  tick(10000);
  expect(draw).toHaveBeenLastCalledWith(0.016);
  document.hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  expect(frames.size).toBe(0);
  document.hidden = false;
  document.dispatchEvent(new Event('visibilitychange'));
  expect(frames.size).toBe(1);
  cleanup();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(frames.size).toBe(0);
  notify(true);
  document.dispatchEvent(new Event('visibilitychange'));
  expect(frames.size).toBe(0);
});
