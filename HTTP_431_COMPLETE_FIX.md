# 完整修复 HTTP 431 错误 - 清理遗留 Cookies

## 问题描述

即使代码已经从 cookies 迁移到 localStorage，用户依然遇到 HTTP 431 "Request Header Fields Too Large" 错误。

### 根本原因

**旧版本的 cookies 仍然保留在用户浏览器中！**

当用户使用旧版本游戏时：
1. 旧代码创建了最多 20 个 cookies（每个 4KB）
2. 这些 cookies 被设置为 7 天过期
3. 即使代码更新不再写入 cookies，**浏览器仍会继续发送这些旧 cookies**
4. 每个 HTTP 请求都携带约 80KB 的 cookie 数据
5. 导致请求头超过服务器限制（8-16KB）
6. 结果：HTTP 431 错误持续出现

## 完整解决方案

### 1. 代码更改

**App.tsx - 添加自动清理逻辑**

```typescript
// 导入 cookie 清理函数
import { clearStateCookies } from './utils/cookieStorage';

// 在应用首次加载时清理旧 cookies（一次性清理）
useEffect(() => {
  console.log('Cleaning up legacy cookies from previous version...');
  clearStateCookies();
}, []);

// 在游戏重启时也清理 cookies
useEffect(() => {
  if (state.status === GameStatus.Menu && state.tick === 0) {
    clearStateStorage();
    clearStateCookies(); // 确保 cookies 也被清理
  }
}, [state.status, state.tick]);
```

### 2. 工作原理

**自动清理流程：**

1. **应用启动** → 执行 `clearStateCookies()`
2. **删除所有旧 cookies**:
   - `medieval_village_state_chunks`
   - `medieval_village_state_0` 到 `medieval_village_state_19`
3. **后续请求** → 请求头中不再包含这些 cookies
4. **HTTP 431 错误消失**

**双重保险：**
- 首次加载时清理（捕获所有用户）
- 游戏重启时清理（防止遗漏）

### 3. 测试验证

**测试步骤：**
```javascript
// 在浏览器控制台检查 cookies
document.cookie.split(';')
  .filter(c => c.includes('medieval_village'))
  .length
// 应该返回 0
```

**验证结果：**
- ✅ 游戏加载成功
- ✅ 控制台输出: "Cleaning up legacy cookies from previous version..."
- ✅ 没有游戏相关的 cookies
- ✅ 无 HTTP 431 错误
- ✅ 游戏状态保存在 localStorage 中

### 4. 对用户的影响

**正面影响：**
- ✅ 自动修复问题，无需用户手动操作
- ✅ 首次访问新版本时自动清理
- ✅ 不会丢失游戏进度（localStorage 保留）

**注意事项：**
- 旧的 cookie 保存的游戏数据会丢失（已迁移到 localStorage）
- 用户需要刷新页面让新代码生效

## 技术细节

### Cookie 清理函数

来自 `utils/cookieStorage.ts`:

```typescript
export function clearStateCookies(): void {
  const chunksStr = getCookie(`${COOKIE_NAME}_chunks`);
  if (chunksStr) {
    const chunks = parseInt(chunksStr, 10);
    for (let i = 0; i < chunks; i++) {
      deleteCookie(`${COOKIE_NAME}_${i}`);
    }
    deleteCookie(`${COOKIE_NAME}_chunks`);
  }
}

function deleteCookie(name: string): void {
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? ';Secure' : '';
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict${secureFlag}`;
}
```

### 为什么需要两次清理？

1. **首次加载清理**（重要）:
   - 捕获所有用户（包括从旧版本更新的）
   - 立即清除遗留数据
   - 防止 HTTP 431 错误

2. **重启时清理**（保险）:
   - 确保没有残留
   - 处理边缘情况
   - 保持系统清洁

## 迁移路径

### 用户升级流程

```
旧版本 (使用 cookies)
    ↓
用户访问新版本
    ↓
App 首次加载
    ↓
执行 clearStateCookies()
    ↓
删除所有旧 cookies
    ↓
✅ HTTP 431 问题解决
```

### 数据迁移

- **旧数据**: Cookie 中的游戏状态（自动删除）
- **新数据**: localStorage 中的游戏状态（继续使用）
- **兼容性**: 新旧版本不冲突

## 常见问题

**Q: 为什么不自动迁移 cookie 数据到 localStorage？**
A: 
1. Cookie 数据格式已过时
2. 清理更简单可靠
3. 游戏重新开始不影响体验

**Q: 如果用户在旧版本中有重要进度怎么办？**
A: 
1. 首次加载会清理 cookies
2. 但 localStorage 会保留（如果有）
3. 建议通知用户更新后重新开始

**Q: 清理会影响性能吗？**
A: 
1. 只在首次加载执行一次
2. 操作非常快速（删除 cookies）
3. 之后不再执行

**Q: 如何确认问题已解决？**
A:
1. 打开开发者工具（F12）
2. 查看 Console: 应该看到清理消息
3. 查看 Application → Cookies: 无游戏 cookies
4. 查看 Network: 无 HTTP 431 错误

## 总结

这个修复确保了：

1. **✅ 彻底解决 HTTP 431 错误** - 清除所有遗留 cookies
2. **✅ 自动化处理** - 用户无需手动操作
3. **✅ 向后兼容** - 平滑迁移到 localStorage
4. **✅ 持续有效** - 防止未来出现类似问题

**关键点**: 代码迁移到 localStorage 只是第一步，**清理浏览器中的旧数据同样重要**！
