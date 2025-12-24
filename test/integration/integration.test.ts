/* @vitest-environment jsdom */

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import * as React from "react";
import { describe, it, expect, afterEach } from "vitest";
import * as rtl from "@testing-library/react";
import { singletonHook } from "../../src/singletonHook";

describe("singletonHook", () => {
  afterEach(() => {
    rtl.cleanup();
  });

  it("works", () => {
    const useHook = singletonHook<Record<string, number>>({ a: 1 }, () => ({
      b: 2,
    }));

    const messages: Record<string, number>[] = [];
    const Tmp = () => {
      const message = useHook();
      useEffect(() => {
        messages.push(message);
      }, [message]);
      return null;
    };

    rtl.render(React.createElement(Tmp));
    expect(messages).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("does not recalculate the state", () => {
    let counter = 0;
    const useHook = singletonHook<any>(
      () => counter++,
      () => {
        return "xxx";
      },
    );

    const messages = [];
    const Tmp = () => {
      const message = useHook();
      useEffect(() => {
        messages.push(message);
      }, [message]);
      return null;
    };

    rtl.render(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(Tmp),
        React.createElement(Tmp),
      ),
    );

    expect(messages).toEqual([0, 0, "xxx", "xxx"]);
    expect(counter).toEqual(1);
  });

  it("might be initialized with callback", () => {
    let state = "init state";
    const useHook = singletonHook(
      () => state,
      () => {
        return "state-in-body";
      },
    );

    const messages: Array<string> = [];
    const Tmp = () => {
      const message = useHook();
      useEffect(() => {
        messages.push(message);
      }, [message]);
      return null;
    };

    state = "init state changed before render";
    rtl.render(React.createElement(Tmp));
    expect(messages).toEqual([
      "init state changed before render",
      "state-in-body",
    ]);
  });

  it("works when several hooks mounted at the same time", () => {
    const useHook1 = singletonHook<Record<string, number>>({ a: 1 }, () => {
      return useMemo(() => ({ b: 2 }), []);
    });

    const useHook2 = singletonHook<Record<string, string>>({ a: "x" }, () => {
      return useMemo(() => ({ b: "y" }), []);
    });

    const messages1 = [];
    const messages2 = [];
    const Tmp = () => {
      const message1 = useHook1();
      const message2 = useHook2();
      useEffect(() => {
        messages1.push(message1);
      }, [message1]);
      useEffect(() => {
        messages2.push(message2);
      }, [message2]);
      return null;
    };

    rtl.render(React.createElement(Tmp));
    expect(messages1).toEqual([{ a: 1 }, { b: 2 }]);
    expect(messages2).toEqual([{ a: "x" }, { b: "y" }]);
  });

  it("works when hook updates itself right after render", () => {
    const useHook = singletonHook("initVal", () => {
      const [state, setState] = useState("initVal");
      useLayoutEffect(() => {
        setState("newVal");
      }, []);
      return state;
    });

    const messages = [];
    const Tmp = () => {
      const message = useHook();
      useEffect(() => {
        messages.push(message);
      }, [message]);
      return null;
    };

    rtl.render(React.createElement(Tmp));
    expect(messages).toEqual(["initVal", "newVal"]);
  });

  // TypeScript
  it("unmounts hook if no consumers", () => {
    let mounts = 0;
    let unmounts = 0;

    const useHook = singletonHook<number>(
      0,
      () => {
        useEffect(() => {
          mounts += 1;
          return () => {
            unmounts += 1;
          };
        }, []);
        return 0;
      },
      { unmountIfNoConsumers: true },
    );

    const Tmp = () => {
      const _ = useHook();
      return null;
    };

    const { rerender } = rtl.render(React.createElement(Tmp));
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);

    // Add a second consumer; runner should not remount
    rerender(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(Tmp),
        React.createElement(Tmp),
      ),
    );
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);

    // Remove all consumers; runner should unmount once
    rerender(null);
    expect(unmounts).toBe(1);
  });
});
