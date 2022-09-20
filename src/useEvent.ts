// @ts-ignore
import { useCallback, useLayoutEffect, useRef, useInsertionEffect } from "react";

type AnyFunction = (...args: any[]) => any;

/**
 * Suppress the warning when using useLayoutEffect with SSR and make use of useInsertionEffect if available.
 * https://reactjs.org/link/uselayouteffect-ssr
 */
const useBrowserEffect = typeof window !== "undefined" ? useInsertionEffect ?? useLayoutEffect : () => {};

/**
 * Similar to useCallback, with a few subtle differences:
 * - The returned function is a stable reference, and will always be the same between renders
 * - No dependency lists required
 * - Properties or state accessed within the callback will always be "current"
 */
export function useEvent<TCallback extends AnyFunction>(callback: TCallback): TCallback {
  const ref = useRef(useEvent_shouldNotBeInvokedBeforeMount as TCallback);
  useBrowserEffect(() => {
    ref.current = callback;
  }, [callback]);

  return useCallback<TCallback>(
    function (this: any) {
      return ref.current.apply(this, arguments as any);
    } as TCallback,
    []
  );
}

/**
 * Render methods should be pure, especially when concurrency is used,
 * so we will throw this error if the callback is called while rendering.
 */
function useEvent_shouldNotBeInvokedBeforeMount() {
  throw new Error(
    "INVALID_USEEVENT_INVOCATION: the callback from useEvent cannot be invoked before the component has mounted."
  );
}

export default useEvent;
