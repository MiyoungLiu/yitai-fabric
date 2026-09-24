'use strict';
// 亿泰纺织 · 云发布函数（腾讯云 SCF / 事件函数 / Nodejs 18+）
// 作用：Token 保存在本函数的环境变量里，网页端凭后台密码即可发布
// 环境变量：
//   GH_TOKEN              —— GitHub Fine-grained Token（Contents: Read and write，仅授权本仓库）
//   ADMIN_PASSWORD_HASH   —— 后台密码的 SHA-256（小写十六进制）

const crypto = require('crypto');

// 候选仓库地址：自动探测真实归属（转移前后均可用）
const GH_REPOS = ['Chqpiggy/yitai-fabric', 'MiyoungLiu/yitai-fabric'];
const FILE_PATH = 'data/products.json';

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

// 简单防暴力猜解：连续 5 次密码错误，锁定 10 分钟（按热容器计）
let failCount = 0;
let blockedUntil = 0;

function sha256(s) {
    return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
}

function jsonRes(statusCode, body) {
    return {
        statusCode,
        headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS),
        body: JSON.stringify(body)
    };
}

// 事件格式自适应：兼容 httpMethod / requestContext.http.method 等不同封装
function getMethod(event) {
    if (!event || typeof event !== 'object') return 'POST';
    if (event.httpMethod) return String(event.httpMethod).toUpperCase();
    if (event.requestContext && event.requestContext.http && event.requestContext.http.method) {
        return String(event.requestContext.http.method).toUpperCase();
    }
    if (event.requestContext && event.requestContext.httpMethod) {
        return String(event.requestContext.httpMethod).toUpperCase();
    }
    return 'POST';
}

// 提取请求体：字符串直取；对象转 JSON；空值返回空串（绝不静默当成功）
function getRawBody(event) {
    if (!event || typeof event !== 'object') return '';
    const raw = event.body;
    if (raw === undefined || raw === null) return '';
    if (typeof raw === 'object') return JSON.stringify(raw);
    return String(raw);
}

async function ghApi(method, url, body, token) {
    const res = await fetch('https://api.github.com' + url, {
        method,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
            'User-Agent': 'yitai-publish-function'
        },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || ('HTTP ' + res.status));
        err.status = res.status;
        throw err;
    }
    return data;
}

// 探测仓库当前归属（API 会跟随转移重定向，full_name 即真实位置）
async function detectRepo(token) {
    for (const cand of GH_REPOS) {
        try {
            const info = await ghApi('GET', '/repos/' + cand, null, token);
            if (info && info.full_name) return info.full_name;
        } catch (e) { /* 尝试下一个候选 */ }
    }
    throw new Error('REPO_NOT_FOUND');
}

exports.main_handler = async (event) => {
    // 兼容 event 直接是字符串 body 的情况
    const method = (typeof event === 'string') ? 'POST' : getMethod(event);

    // CORS 预检
    if (method === 'OPTIONS') {
        return { statusCode: 204, headers: CORS, body: '' };
    }
    // 健康检查（仅显式 GET）
    if (method === 'GET') {
        return jsonRes(200, { ok: true, service: 'yitai-publish' });
    }

    if (Date.now() < blockedUntil) {
        return jsonRes(429, { ok: false, error: '尝试过于频繁，请 10 分钟后再试' });
    }

    // 提取并解析请求体（POST 缺 body 直接明确报错，绝不假装成功）
    let raw;
    if (typeof event === 'string') {
        raw = event;
    } else {
        raw = getRawBody(event);
        if (event && event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');
    }
    if (!raw) {
        return jsonRes(400, { ok: false, error: '缺少产品数据（请求体为空）' });
    }

    let payload;
    try {
        payload = JSON.parse(raw);
    } catch (e) {
        return jsonRes(400, { ok: false, error: '请求格式错误' });
    }

    const password = payload.password;
    const content = payload.content;
    if (!password || !content) {
        return jsonRes(400, { ok: false, error: '缺少密码或产品数据' });
    }

    // 服务端密码验证（不记录密码本身）
    if (sha256(password) !== (process.env.ADMIN_PASSWORD_HASH || '')) {
        failCount++;
        if (failCount >= 5) {
            blockedUntil = Date.now() + 10 * 60 * 1000;
            failCount = 0;
        }
        console.log('auth failed, attempt ' + failCount);
        return jsonRes(403, { ok: false, error: '密码错误' });
    }
    failCount = 0;

    const token = process.env.GH_TOKEN;
    if (!token) {
        return jsonRes(500, { ok: false, error: '服务端未配置 GH_TOKEN 环境变量' });
    }

    // 产品数据形状校验
    let products;
    try {
        products = (typeof content === 'string') ? JSON.parse(content) : content;
        if (!Array.isArray(products) || products.length === 0) throw new Error('empty');
        for (const p of products) {
            if (!p || typeof p.name !== 'string') throw new Error('shape');
        }
    } catch (e) {
        return jsonRes(400, { ok: false, error: '产品数据格式不正确' });
    }

    // 提交到 GitHub
    try {
        const repo = await detectRepo(token);
        const meta = await ghApi('GET', '/repos/' + repo + '/contents/' + FILE_PATH, null, token);
        const stamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        await ghApi('PUT', '/repos/' + repo + '/contents/' + FILE_PATH, {
            message: 'chore: 更新产品数据（后台云发布 ' + stamp + '）',
            content: Buffer.from(JSON.stringify(products, null, 2), 'utf8').toString('base64'),
            sha: meta.sha
        }, token);
        console.log('publish ok, repo=' + repo + ', products=' + products.length);
        return jsonRes(200, { ok: true, repo: repo });
    } catch (e) {
        console.log('publish failed: ' + e.message);
        return jsonRes(500, { ok: false, error: '提交失败：' + (e.message === 'REPO_NOT_FOUND' ? '服务端 Token 无权限（仓库转移后需更新 GH_TOKEN 环境变量）' : e.message) });
    }
};
