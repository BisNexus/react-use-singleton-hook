import React, { useEffect } from "react";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { createRoot, type Root } from "react-dom/client";

type Options = {
  mountId?: string;
  unmountIfNoConsumers?: boolean;
};

export function singletonHook<T>(
  initValue: T | (() => T),
  useHookBody: () => T,
  options: Options = {},
): () => T {
  type Slice = { value: T };

  const { mountId, unmountIfNoConsumers = true } = options;

  const hasLazyInit = typeof initValue === "function";
  let initResolved = !hasLazyInit;
  let resolvedInit: T = hasLazyInit
    ? (undefined as unknown as T)
    : (initValue as T);

  const store = createStore<Slice>(() => ({ value: resolvedInit }));

  let consumers = 0;
  let root: Root | null = null;
  let host: HTMLElement | null = null;

  function HiddenRunner() {
    const val = useHookBody();
    useEffect(() => {
      store.setState({ value: val });
    }, [val]);
    return null;
  }

  function mountRunner() {
    if (root) return;
    host = document.createElement("div");
    host.style.display = "none";
    if (mountId) host.id = mountId;
    document.body.appendChild(host);
    root = createRoot(host);
    root.render(React.createElement(HiddenRunner));
  }

  function unmountRunner() {
    if (!root || !host) return;
    root.unmount();
    host.remove();
    root = null;
    host = null;
  }

  function resolveInitIfNeeded() {
    if (!initResolved && hasLazyInit) {
      initResolved = true;
      resolvedInit = (initValue as () => T)();
      store.setState({ value: resolvedInit });
    }
  }

  function useSingleton(): T {
    resolveInitIfNeeded();

    const value = useStore(store, (s) => s.value);

    useEffect(() => {
      consumers += 1;
      if (consumers === 1) mountRunner();
      return () => {
        consumers -= 1;
        if (consumers === 0 && unmountIfNoConsumers) unmountRunner();
      };
    }, []);

    return value;
  }

  return useSingleton;
}
