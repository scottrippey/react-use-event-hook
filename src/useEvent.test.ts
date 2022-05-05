import { renderHook } from "@testing-library/react-hooks";
import { useEvent } from "./useEvent";

describe("useEvent", () => {
  let initialCallback = jest.fn((...args) => args);
  let stableCallback: jest.Mock;
  let rerender: (newCallback?: jest.Mock) => void;
  function renderTestHook() {
    const result =
     ( renderHook(
      (latestCallback) => {
        stableCallback = useEvent(latestCallback);
      },
      { initialProps: initialCallback }
    ));
    rerender = result.rerender;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    renderTestHook();
  });

  it("should return a different function", () => {
    expect(typeof stableCallback).toEqual('function')
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
