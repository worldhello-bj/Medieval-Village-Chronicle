# Fix for HTTP 431 Error - Migration from Cookies to localStorage

## Problem (问题)

The application was experiencing HTTP 431 "Request Header Fields Too Large" errors when accessing the Vite development server:

```
GET http://localhost:3000/@vite/client net::ERR_ABORTED 431 (Request Header Fields Too Large)
GET http://localhost:3000/index.tsx?t=1770083022251 net::ERR_ABORTED 431 (Request Header Fields Too Large)
GET http://localhost:3000/@react-refresh net::ERR_ABORTED 431 (Request Header Fields Too Large)
```

## Root Cause (根本原因)

The recently implemented cookie storage system could create up to 20 cookies (each 4KB), totaling ~80KB of cookie data. When browsers send these cookies with **every HTTP request**, the request headers exceeded the server's default limit (typically 8-16KB).

### Why Cookies Caused the Issue

- Cookies are automatically sent with **every HTTP request** to the same domain
- This includes requests for:
  - HTML pages
  - JavaScript files (@vite/client, index.tsx, @react-refresh)
  - CSS files
  - Images
  - API calls
- Large game state (up to 80KB) × every request = massive header overhead
- Vite development server's default header size limit was exceeded

## Solution (解决方案)

**Migrated from cookies to localStorage:**

### Why localStorage?

1. **No network overhead**: Data stays in the browser, not sent with every request
2. **Larger capacity**: ~5-10MB per domain vs ~4KB per cookie
3. **Better performance**: No HTTP header bloat
4. **Simpler implementation**: Single key-value storage vs chunking into multiple cookies
5. **Same persistence**: Data survives page refreshes like cookies

### Implementation

Created new `utils/gameStorage.ts` module:

```typescript
export function saveStateToStorage(state: GameState): boolean
export function loadStateFromStorage(): GameState | null
export function clearStateStorage(): void
```

Updated `App.tsx` to use localStorage instead of cookies:

```typescript
import { saveStateToStorage, loadStateFromStorage, clearStateStorage } from './utils/gameStorage';

// Load state from localStorage on mount
useEffect(() => {
  const savedState = loadStateFromStorage();
  if (savedState) {
    console.log('Loading saved game from localStorage...');
    dispatch({ type: 'LOAD_STATE', state: savedState });
  }
}, []);

// Save state to localStorage periodically
useEffect(() => {
  if (state.status === GameStatus.Playing && !state.paused) {
    if (state.tick % 20 === 0) {
      saveStateToStorage(state);
    }
  }
}, [state.tick, state.status, state.paused]);
```

## Benefits (优点)

✅ **Fixes HTTP 431 error** - No more large request headers  
✅ **Better performance** - No cookie overhead on every HTTP request  
✅ **Larger capacity** - Can store more data if needed (5-10MB vs ~80KB)  
✅ **Simpler code** - No need for chunking/encoding complexity  
✅ **Same functionality** - State still persists across page refreshes  

## Testing (测试)

- ✅ Build successful
- ✅ Game loads without HTTP 431 errors
- ✅ State persistence works correctly
- ✅ No errors in browser console (except expected CDN blocks)

## Files Changed

- **Created**: `utils/gameStorage.ts` - New localStorage-based storage utility
- **Updated**: `App.tsx` - Switched from cookie to localStorage functions
- **Kept**: `utils/cookieStorage.ts` - Preserved for reference/fallback if needed

## Migration Notes (迁移说明)

### For Users

- **No action required** - The game will automatically use localStorage
- Old cookie-based saves are **not** automatically migrated
- Simply start a new game and it will auto-save to localStorage

### For Developers

If you need to support both storage methods:

```typescript
// Try localStorage first, fallback to cookies
const savedState = loadStateFromStorage() || loadStateFromCookie();
```

## Technical Details

### localStorage Storage Structure

- **Key**: `medieval_village_state`
- **Value**: JSON stringified game state
- **Size limit check**: Warns if state exceeds 5MB
- **Auto-caps**: Logs to 500 entries, history to 260 entries (same as before)

### Comparison: Cookies vs localStorage

| Feature | Cookies | localStorage |
|---------|---------|--------------|
| Capacity | ~4KB per cookie, max ~80KB | ~5-10MB total |
| Network | Sent with every request | Never sent |
| HTTP 431 Risk | ✅ Yes (caused this issue) | ❌ No |
| Complexity | High (chunking, encoding) | Low (simple key-value) |
| Persistence | Yes (with expiry) | Yes (permanent until cleared) |
| Security | SameSite, Secure flags | Same-origin policy |

## Conclusion

This fix resolves the HTTP 431 error by eliminating the root cause: large cookies being sent with every HTTP request. localStorage provides the same functionality with better performance and no network overhead.

游戏现在使用 localStorage 而不是 cookies 来保存状态，这解决了 HTTP 431 错误，并提供了更好的性能。
