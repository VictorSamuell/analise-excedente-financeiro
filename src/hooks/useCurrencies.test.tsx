// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useCurrencies } from "./useCurrencies";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("atualiza a cada minuto e para ao sair da aba", async () => {
  vi.useFakeTimers();
  const f = vi.fn(async () =>
    Response.json({ quotes: [], fetchedAt: new Date().toISOString() }),
  );
  vi.stubGlobal("fetch", f);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  const { unmount } = renderHook(() => useCurrencies());
  await act(async () => {});
  expect(f).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(f).toHaveBeenCalledTimes(2);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(f).toHaveBeenCalledTimes(2);
  unmount();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(f).toHaveBeenCalledTimes(2);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});
