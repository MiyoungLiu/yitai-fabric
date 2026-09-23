# yitai-fabric · 亿泰纺织官网

单文件静态产品展示网站：产品展示 + 本地后台管理，部署于 **GitHub Pages**。

**官网地址**：https://miyoungliu.github.io/yitai-fabric/

## 目录结构

```
yitai-fabric/
├── index.html          # 网站主页面（展示 + 后台）
├── data/products.json  # 已发布的产品数据（访客读取，改这个=改官网内容）
├── images/             # favicon 等本地资源（hero-bg.jpg 放入后自动成为首屏背景）
└── js/tailwind.js      # Tailwind 本地化脚本
```

## 更新产品流程（推荐：全程网页操作，无需装任何软件）

1. 打开官网 → 点「后台管理」→ 输入密码
2. 新增 / 编辑 / 删除产品（改动先保存在你的浏览器，页面顶部有状态提示）
3. 点「导出数据」，得到 `products.json`（产品图片已自动转成 base64 包含在内）
4. 打开 GitHub 上的数据文件：
   `github.com/MiyoungLiu/yitai-fabric/blob/main/data/products.json`
5. 点右上角**铅笔图标**编辑 → 全选删除 → 粘贴新导出的 JSON 内容
6. 点 **Commit changes** → 约 1 分钟后官网自动更新

> 会用 git 的话：本地替换 `data/products.json` 后 `git push` 到 main 分支，效果相同。

## 转交管理 / 多人协作

**只管产品内容**（最常见的交接）：把官网地址、后台密码、上面的更新流程交给对方即可，全程不需要接触代码。

**仓库协作**：仓库 Settings → Collaborators → Add people → 输入对方 GitHub 用户名。

**彻底转手**：Settings → General → Danger Zone → Transfer ownership。
注意：转移后官网地址会变成 `新用户名.github.io/yitai-fabric`，已发出的链接需更换。

⚠️ 后台的未发布修改存在各自浏览器里，**多人同时编辑会互相覆盖**，请约定同一时间只有一人修改。

## 后台密码

源码中只保存 SHA-256 哈希（`index.html` 中 `ADMIN_PASSWORD_HASH`），不存明文。
修改密码：计算新密码的 SHA-256（小写十六进制）替换该常量后提交即可。

注意：前端密码校验仅用于防误入，不构成真正的安全屏障。

## 部署说明（GitHub Pages）

- 仓库 main 分支根目录即网站根目录，push 后自动重新部署（约 1 分钟）
- 开关位置：仓库 Settings → Pages → Deploy from a branch → main /(root)

## 其他说明

- 首屏背景：当前为暖色渐变；将实拍图命名为 `images/hero-bg.jpg` 放入仓库即自动生效（无需改代码）
- 所有图片、样式均为本地引用，无外部依赖
- 微信/QQ 分享卡片已配置（`og:image` 指向线上图片地址）
