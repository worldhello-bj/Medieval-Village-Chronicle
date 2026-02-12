# Cookie Storage Implementation - Memory Issue Resolution

## Problem Statement
The Medieval Village Chronicle game was experiencing out of memory (OOM) errors due to unbounded growth of in-memory state, particularly the `logs` array that grew continuously without any limit during gameplay.

## Solution Overview
Implemented a cookie-based state persistence system that:
1. Caps the logs array to prevent memory bloat
2. Persists game state to browser cookies
3. Automatically saves and restores game progress
4. Reduces memory pressure by limiting data retention

## Changes Made

### 1. Cookie Storage Utility (`utils/cookieStorage.ts`)
Created a comprehensive cookie storage module with the following features:

- **Base64 Encoding**: Encodes state data for safe cookie storage (increases size by ~33% but necessary for compatibility)
- **Chunking**: Splits large data into 4KB chunks to work within cookie size limits
- **Smart Capping**: Automatically limits logs to 500 entries and history to 260 entries when saving
- **Security**: Includes `Secure` flag for HTTPS connections and `SameSite=Strict` for CSRF protection
- **Error Handling**: Graceful fallback if encoding/decoding fails

Key Functions:
- `saveStateToCookie(state)`: Saves game state to cookies with automatic chunking
- `loadStateFromCookie()`: Restores game state from cookies
- `clearStateCookies()`: Removes all state cookies

### 2. App Component Modifications (`App.tsx`)

#### State Capping
- Modified the TICK reducer to cap logs at 1000 entries: `logs: newLogs.slice(-1000)`
- This prevents unbounded growth even before saving to cookies

#### Cookie Integration
- **On Mount**: Loads saved state from cookies if available
- **During Gameplay**: Saves state every 20 ticks (~16 seconds) to balance performance and save frequency
- **On Restart**: Clears cookies to start fresh
- **New Action**: Added `LOAD_STATE` action type for state restoration

### 3. Testing
Created comprehensive test suite:
- `test-cookie.html`: Interactive test page for cookie operations
- Verified save, load, clear, and large data handling
- All operations working correctly

## Technical Details

### Memory Savings
- **Before**: Logs array could grow to thousands of entries over a long game
- **After**: Capped at 1000 entries in memory, 500 in cookies
- **Result**: Significant reduction in memory usage for long gaming sessions

### Cookie Storage Strategy
```
State → JSON → Base64 Encode → Split into 4KB chunks → Store in multiple cookies
```

Maximum 20 chunks allowed = ~80KB of encoded data = ~60KB of actual state data

### Performance Considerations
- Save frequency: Every 20 ticks (approx. 16 seconds)
- Minimal impact on gameplay due to infrequent saves
- Asynchronous operations don't block game loop

## Benefits

1. **Memory Efficiency**: Prevents OOM errors by capping array growth
2. **Data Persistence**: Game state survives page refreshes
3. **User Experience**: Players can continue where they left off
4. **No External Dependencies**: Uses native browser APIs
5. **Security**: Proper cookie attributes for security

## Security Considerations

- ✅ `SameSite=Strict` prevents CSRF attacks
- ✅ `Secure` flag for HTTPS connections
- ✅ No sensitive data stored (game state only)
- ✅ 7-day expiration for automatic cleanup
- ✅ No security vulnerabilities found by CodeQL

## Testing Results

![Cookie Storage Test Results](https://github.com/user-attachments/assets/c4e5bf37-a9fa-4236-824c-5dedf6082c2c)

All tests passed:
- ✅ Save to cookie
- ✅ Load from cookie  
- ✅ Clear cookies
- ✅ Large data handling (shows appropriate error when too large)

## Usage

The system works automatically:
1. Start a game normally
2. Play the game - state saves automatically every 20 ticks
3. Close/refresh the page
4. Game resumes from last saved state
5. Click "书写新的篇章" to clear saved state and start fresh

## Future Improvements

Potential enhancements for later:
- Implement actual compression (e.g., LZ-string) to reduce cookie size further
- Add manual save/load buttons for player control
- Show save indicator in UI
- Support multiple save slots
- Use IndexedDB for larger storage capacity

## Conclusion

This implementation successfully resolves the memory pressure issue by:
1. Capping unbounded array growth
2. Persisting state to cookies
3. Maintaining game continuity across sessions
4. Following security best practices

The solution is minimal, focused, and solves the specific problem without over-engineering.
