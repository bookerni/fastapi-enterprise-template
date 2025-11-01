# 快速启动指南

## 前置条件

确保你已经：
1. 安装了依赖: `rye sync`
2. 启动了 Docker 服务: `docker-compose up -d`
3. 运行了数据库迁移: `alembic upgrade head`
4. 初始化了管理员用户: `python deploy/init_pg.py`

## 启动应用

```bash
python src/__main__.py
```

或者使用 uvicorn:

```bash
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

## 访问前端

应用启动后，在浏览器中访问：

- **登录页**: http://localhost:8000/login
- **控制台**: http://localhost:8000/dashboard
- **用户管理**: http://localhost:8000/users
- **API 文档**: http://localhost:8000/api/docs

## 默认管理员账户

- **用户名**: admin@system.com
- **密码**: admin

⚠️ **重要**: 首次登录后请立即修改默认密码！

## 功能测试清单

### 1. 登录功能
- [ ] 访问登录页
- [ ] 使用默认账户登录
- [ ] 验证登录成功跳转到控制台
- [ ] 验证 Token 存储在 localStorage

### 2. 控制台
- [ ] 查看统计数据
- [ ] 验证用户数、组数、角色数显示
- [ ] 点击"Manage Users"跳转

### 3. 用户管理
- [ ] 查看用户列表
- [ ] 测试搜索功能
- [ ] 测试分页功能
- [ ] 添加新用户
- [ ] 编辑用户
- [ ] 删除用户

### 4. 认证保护
- [ ] 清除 localStorage 中的 token
- [ ] 刷新页面，验证自动跳转到登录页
- [ ] 重新登录

## 常见问题

### Q: 页面显示 404 错误
A: 确保 FastAPI 应用已正确启动，检查 `src/app.py` 中的路由配置。

### Q: 登录后立即跳转回登录页
A: 检查浏览器控制台是否有 Token 相关错误，确认 API 端点 `/api/pwd-login` 正常工作。

### Q: 用户列表无法加载
A: 
1. 确认已初始化数据库
2. 检查 API `/api/users` 是否返回正确数据
3. 打开浏览器开发者工具查看网络请求

### Q: 样式显示异常
A: 检查 CDN 资源是否可访问，如果网络问题，可以下载 Tabler 资源到本地。

## 开发模式

启用热重载：

```bash
uvicorn src.app:app --reload
```

查看日志：

```bash
# 查看应用日志
tail -f logs/app.log

# 查看 Docker 日志
docker-compose logs -f
```

## 生产部署

生产环境建议使用 Gunicorn + Uvicorn:

```bash
gunicorn src.app:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000
```

## 下载本地 Tabler 资源（可选）

如果需要离线使用，可以下载 Tabler 资源到本地：

```bash
# 下载 Tabler CSS
curl -o src/static/css/tabler.min.css https://cdn.jsdelivr.net/npm/@tabler/core@1.0.0-beta20/dist/css/tabler.min.css

# 下载 Tabler Icons CSS
curl -o src/static/css/tabler-icons.min.css https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css

# 下载 Tabler JS
curl -o src/static/js/tabler.min.js https://cdn.jsdelivr.net/npm/@tabler/core@1.0.0-beta20/dist/js/tabler.min.js
```

然后修改 `src/templates/base.html` 中的资源引用路径。

## 技术支持

如有问题，请查看：
- [FRONTEND.md](./FRONTEND.md) - 前端详细文档
- [README.md](./README.md) - 项目主文档
- FastAPI 日志输出
- 浏览器开发者工具控制台
