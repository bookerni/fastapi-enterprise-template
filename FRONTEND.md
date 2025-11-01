# Frontend Documentation

## 概述

此项目已集成基于 Tabler 的前端管理界面，提供用户管理等功能。

## 技术栈

- **Tabler** - 基于 Bootstrap 5 的管理后台 UI 框架
- **Jinja2** - 服务端模板引擎
- **原生 JavaScript** - 前端交互逻辑
- **Axios/Fetch API** - API 请求

## 项目结构

```
src/
├── static/                      # 静态资源
│   ├── css/
│   │   └── custom.css          # 自定义样式
│   ├── js/
│   │   ├── auth.js             # 认证管理
│   │   ├── api.js              # API 客户端
│   │   ├── utils.js            # 工具函数
│   │   └── users.js            # 用户管理逻辑
│   └── img/
│       └── avatar.svg          # 默认头像
├── templates/                   # Jinja2 模板
│   ├── base.html               # 基础模板
│   ├── layout.html             # 带导航的布局
│   ├── login.html              # 登录页面
│   ├── dashboard.html          # 控制台
│   └── users/
│       └── list.html           # 用户列表
└── features/
    └── frontend/               # 前端路由
        ├── __init__.py
        └── routes.py           # 页面路由定义
```

## 功能说明

### 1. 登录页面 (`/login`)

**功能特性：**
- 用户名/密码登录
- 密码显示/隐藏切换
- 记住我功能
- JWT Token 管理
- 自动重定向已登录用户

**使用方法：**
1. 访问 `http://localhost:8000/login`
2. 输入用户名和密码
3. 点击"Sign in"按钮
4. 登录成功后自动跳转到控制台

### 2. 控制台 (`/dashboard`)

**功能特性：**
- 系统统计数据（用户数、组数、角色数）
- 快速操作按钮
- 响应式布局

**数据展示：**
- 自动加载统计数据
- 实时更新显示

### 3. 用户管理 (`/users`)

**功能特性：**
- ✅ 用户列表展示
- ✅ 分页功能
- ✅ 搜索功能（姓名、邮箱）
- ✅ 按组筛选
- ✅ 新增用户
- ✅ 编辑用户
- ✅ 删除用户
- ✅ 关联角色和组

**操作说明：**

#### 查看用户列表
- 访问 `/users` 查看所有用户
- 使用搜索框搜索用户
- 使用组下拉框筛选

#### 添加用户
1. 点击"Add User"按钮
2. 填写用户信息：
   - 姓名（必填）
   - 邮箱
   - 电话
   - 密码（必填）
   - 组（必填）
   - 角色
3. 点击"Save"保存

#### 编辑用户
1. 点击用户行的编辑图标
2. 修改信息
3. 密码可选（留空则不修改）
4. 点击"Save"保存

#### 删除用户
1. 点击用户行的删除图标
2. 确认删除操作

## API 集成

### 认证机制

使用 JWT Token 进行身份认证：

```javascript
// 登录
await window.authService.login(username, password);

// 检查认证状态
window.authService.isAuthenticated();

// 登出
window.authService.logout();
```

### API 调用

所有 API 请求都通过 `apiClient` 进行：

```javascript
// 获取用户列表
const response = await window.apiClient.users.list({
    page: 1,
    page_size: 10,
    search: 'keyword'
});

// 创建用户
await window.apiClient.users.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secret',
    group_id: 1
});

// 更新用户
await window.apiClient.users.update(userId, data);

// 删除用户
await window.apiClient.users.delete(userId);
```

## 开发指南

### 添加新页面

1. **创建模板文件**
   ```html
   <!-- src/templates/your_page.html -->
   {% extends "layout.html" %}
   {% block content %}
   <!-- 你的内容 -->
   {% endblock %}
   ```

2. **添加路由**
   ```python
   # src/features/frontend/routes.py
   @router.get("/your-page", response_class=HTMLResponse)
   async def your_page(request: Request):
       return templates.TemplateResponse("your_page.html", {"request": request})
   ```

3. **添加导航菜单**
   在 `templates/layout.html` 中添加菜单项

### 自定义样式

在 `static/css/custom.css` 中添加自定义样式：

```css
.your-custom-class {
    /* 你的样式 */
}
```

### 添加 JavaScript 功能

创建新的 JS 文件并在模板中引入：

```html
{% block extra_js %}
<script src="{{ url_for('static', path='/js/your_module.js') }}"></script>
{% endblock %}
```

## 注意事项

### 1. CORS 配置

确保后端 CORS 配置正确（已在 `app.py` 中配置）。

### 2. 认证保护

所有需要认证的页面都会自动检查登录状态，未登录用户会被重定向到登录页。

### 3. 表单验证

- 前端使用 HTML5 表单验证
- 后端使用 Pydantic 模型验证
- 错误信息通过 Toast 通知显示

### 4. 错误处理

API 错误会自动显示友好的错误消息：
- 401: 自动重定向到登录页
- 其他错误: 显示错误 Toast

## 浏览器兼容性

支持现代浏览器：
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 性能优化建议

1. **CDN 资源**: Tabler 资源使用 CDN 加载
2. **按需加载**: 页面专属 JS 使用 `extra_js` 块加载
3. **分页**: 大列表使用分页减少数据传输
4. **防抖**: 搜索功能使用防抖减少 API 调用

## 故障排查

### 登录失败
- 检查用户名密码是否正确
- 查看浏览器控制台是否有错误
- 确认后端 API 正常运行

### 页面无法加载
- 检查 FastAPI 服务是否启动
- 确认路由配置正确
- 查看服务器日志

### API 调用失败
- 打开浏览器开发者工具查看网络请求
- 检查 Token 是否过期
- 确认 API 端点是否正确

## 下一步扩展

可以继续添加的功能：
- [ ] 角色管理页面
- [ ] 组管理页面
- [ ] 权限管理页面
- [ ] 用户头像上传
- [ ] 数据导出（Excel/CSV）
- [ ] 操作日志查看
- [ ] 暗黑模式
- [ ] 多语言支持

## 参考资源

- [Tabler 文档](https://tabler.io/docs)
- [Bootstrap 5 文档](https://getbootstrap.com/docs/5.0)
- [FastAPI 文档](https://fastapi.tiangolo.com)
- [Jinja2 文档](https://jinja.palletsprojects.com)
