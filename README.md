# yitai-fabric · 亿泰纺织官网

单文件静态产品展示网站：产品展示 + 本地后台管理，部署于腾讯 EdgeOne（Makers）。

## 目录结构

```
yitai-fabric/
├── index.html          # 网站主页面（展示 + 后台）
├── data/products.json  # 已发布的产品数据（访客读取）
├── images/             # 产品图、favicon（hero-bg.jpg 放入后自动成为首屏背景）
└── js/tailwind.js      # Tailwind 本地化脚本
```

## 更新产品流程

1. 打开网站 → 点「后台管理」→ 输入密码
2. 新增 / 编辑 / 删除产品（此时改动**只保存在你的浏览器**，网页顶部会提示"有未发布的本地修改"）
3. 点「导出数据」，得到 `products.json`
4. 用它替换本目录的 `data/products.json`
5. 重新部署（EdgeOne 控制台重新上传本文件夹，或 CLI 上传）
6. 访客刷新页面即可看到新产品

## 后台密码

源码中只保存 SHA-256 哈希（`index.html` 中 `ADMIN_PASSWORD_HASH`）。
修改密码：计算新密码的 SHA-256（小写十六进制）替换该常量即可。

注意：前端密码校验仅用于防误入，不构成真正的安全屏障。

## 部署（腾讯 EdgeOne）

1. 登录腾讯云控制台 → 边缘安全加速平台 EdgeOne → Pages/Makers
2. 创建项目 → 选择"直接上传"，上传本文件夹
3. 使用平台分配的默认域名（`*.edgeone.app`），免备案

## 其他说明

- 首屏背景：当前为暖色渐变；将实拍图命名为 `images/hero-bg.jpg` 放入即自动生效（无需改代码）
- 所有图片、样式均为本地引用，无外部依赖
- 部署后建议把 `index.html` 中 `og:image` 改为完整线上地址，微信/QQ 分享卡片效果更好
