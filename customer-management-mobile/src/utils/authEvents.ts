/**
 * Auth Events
 * A module-level callback bridge that allows the axios interceptor (outside React)
 * to trigger authentication state changes (e.g. auto-logout on 401).
 */

type UnauthorizedCallback = () => void;

let _onUnauthorized: UnauthorizedCallback | null = null;

export const authEvents = {
  /**
   * Register a callback to be invoked when a 401 Unauthorized response is received.
   * Call this from AuthContext on mount.
   */
  setOnUnauthorized(callback: UnauthorizedCallback): void {
    _onUnauthorized = callback;
  },

  /**
   * Clear the registered callback (call on unmount).
   */
  clearOnUnauthorized(): void {
    _onUnauthorized = null;
  },

  /**
   * Fire the unauthorized event. Called by the axios response interceptor.
   */
  emitUnauthorized(): void {
    if (_onUnauthorized) {
      _onUnauthorized();
    }
  },
};
