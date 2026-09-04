/**
 * Refetch AppContext lists after agent CRUD (same data manual forms update).
 * scopes: organizations | venues | devices | users | events
 *
 * Handlers are registered by AppProvider so this stays Redux-free.
 */

const listeners = new Set();

export function registerAgentDataRefreshHandler(handler) {
  if (typeof handler !== "function") return () => {};
  listeners.add(handler);
  return () => listeners.delete(handler);
}

export function dispatchAgentDataRefresh(
  _dispatch,
  _getState,
  { scopes = [], hints = {} } = {}
) {
  if (!Array.isArray(scopes) || scopes.length === 0) return;

  const uniqueScopes = [...new Set(scopes)];
  const detail = { scopes: uniqueScopes, hints };

  for (const handler of listeners) {
    try {
      handler(detail);
    } catch (err) {
      console.error("[ackit:agent-data-refresh]", err);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("ackit:agent-data-changed", { detail })
    );
  }
}
