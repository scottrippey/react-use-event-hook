import React from "react";
import { renderHook } from "@testing-library/react";
import { useEvent } from "./useEvent";

// Only available in React 18+
const reactSupportsUseInsertionEffect = !!React.useInsertionEffect;

describe(`useEvent (React ${React.version})`, () => {
  let initialCallback = jest.fn((...args) => args);
  let stableCallback: jest.Mock;
  let rerender: (newCallback?: jest.Mock) => void;

  function renderTestHook() {
    const result = renderHook(
      (latestCallback) => {
        stableCallback = useEvent(latestCallback);
      },
      { initialProps: initialCallback }
    );
    rerender = result.rerender;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    renderTestHook();
  });

  it("should return a different function", () => {
    expect(typeof stableCallback).toEqual("function");
    expect(stableCallback).not.toBe(initialCallback);
    expect(initialCallback).not.toHaveBeenCalled();
  });

  it("calling the stableCallback should call the initialCallback", () => {
    stableCallback();
    expect(initialCallback).toHaveBeenCalled();
  });

  it("all params and return value should be passed through", () => {
    const returnValue = stableCallback(1, 2, 3);
    expect(initialCallback).toHaveBeenCalledWith(1, 2, 3);
    expect(returnValue).toEqual([1, 2, 3]);
  });

  it('will pass through the current "this" value', () => {
    const thisObj = { stableCallback };
    thisObj.stableCallback(1, 2, 3);
    expect(initialCallback).toHaveBeenCalledTimes(1);
    expect(initialCallback.mock.instances[0]).toBe(thisObj);
  });

  describe("timing", () => {
    beforeEach(() => {
      jest.spyOn(console, "error").mockImplementation(() => {
        /* suppress Reacts error logging  */
      });
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("will throw an error if called during render", () => {
      const useEventBeforeMount = () => {
        const cb = useEvent(() => 5);
        cb();
      };
      expect(() => {
        const r = renderHook(() => useEventBeforeMount());

        // @ts-expect-error This is just for React 17:
        if (r.result.error) throw r.result.error;
      }).toThrowErrorMatchingInlineSnapshot(
        `"INVALID_USEEVENT_INVOCATION: the callback from useEvent cannot be invoked before the component has mounted."`
      );
    });

    it("will work fine if called inside a useLayoutEffect", () => {
      const useEventInLayoutEffect = () => {
        const [state, setState] = React.useState(0);
        const cb = useEvent(() => 5);
        React.useLayoutEffect(() => {
          setState(cb());
        }, []);
        return state;
      };
      const { result } = renderHook(() => useEventInLayoutEffect());
      expect(result).toMatchObject({ current: 5 });
    });

    describe("when used in a NESTED useLayoutEffect", () => {
      const renderNestedTest = () => {
        /**
         * This is a tricky edge-case scenario that happens in React 16/17.
         *
         * We update our callback inside a `useLayoutEffect`.
         * With nested React components, `useLayoutEffect` gets called
         * in children first, parents last.
         *
         * So if we pass a `useEvent` callback into a child component,
         * and the child component calls it in a useLayoutEffect,
         * we will throw an error.
         */

        // Since we're testing this with react-hooks, we need to use a Context to achieve parent-child hierarchy
        const ctx = React.createContext<{ callback(): number }>(null!);
        const wrapper: React.FC<React.PropsWithChildren> = (props) => {
          const callback = useEvent(() => 5);
          return React.createElement(ctx.Provider, { value: { callback } }, props.children);
        };

        const { result } = renderHook(
          () => {
            const [layoutResult, setLayoutResult] = React.useState<any>(null);
            const { callback } = React.useContext(ctx);
            React.useLayoutEffect(() => {
              // Unfortunately, renderHook won't capture a layout error.
              // Instead, we'll manually capture it:
              try {
                setLayoutResult({ callbackResult: callback() });
              } catch (err) {
                setLayoutResult({ layoutError: err });
              }
            }, []);

            return layoutResult;
          },
          { wrapper }
        );

        return result;
      };

      if (!reactSupportsUseInsertionEffect) {
        // React 17
        it("will throw an error", () => {
          const result = renderNestedTest();
          expect(result.current).toMatchInlineSnapshot(`
            Object {
              "layoutError": [Error: INVALID_USEEVENT_INVOCATION: the callback from useEvent cannot be invoked before the component has mounted.],
            }
          `);
        });
      } else {
        // React 18+
        it("will have no problems because of useInjectionEffect", () => {
          const result = renderNestedTest();
          expect(result.current).toMatchInlineSnapshot(`
            Object {
              "callbackResult": 5,
            }
          `);
        });
      }
    });
  });

  describe("when the hook is rerendered", () => {
    let newCallback = jest.fn();
    let originalStableCallback: typeof stableCallback;
    beforeEach(() => {
      originalStableCallback = stableCallback;
      rerender(newCallback);
    });

    it("the stableCallback is stable", () => {
      expect(stableCallback).toBe(originalStableCallback);
    });

    it("calling the stableCallback only calls the latest callback", () => {
      stableCallback();
      expect(initialCallback).not.toHaveBeenCalled();
      expect(newCallback).toHaveBeenCalled();
    });

    it("the same goes for the 3rd render, etc", () => {
      const thirdCallback = jest.fn();
      rerender(thirdCallback);
      stableCallback();
      expect(initialCallback).not.toHaveBeenCalled();
      expect(newCallback).not.toHaveBeenCalled();
      expect(thirdCallback).toHaveBeenCalled();
    });
  });
});
