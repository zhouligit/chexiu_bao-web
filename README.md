# 车修宝 Web 前端

PC 管理端（React + Vite + Ant Design）。

## 快速开始

```bash
npm install
npm run dev
```

访问 http://localhost:5173

默认通过 Vite 代理访问后端 `http://localhost:8000`。

## 默认账号

| 用户名 | 密码 |
|--------|------|
| admin | admin123 |

## 构建部署

```bash
npm run build
# 将 dist/ 同步到 Nginx 静态目录
rsync -avz dist/ user@server:/var/www/chexiu_bao/
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | API 地址，开发环境留空使用 Vite 代理 |

## 关联仓库

后端 API：https://github.com/.../chexiu_bao
