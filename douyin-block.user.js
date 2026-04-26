// ==UserScript==
// @name         抖音一键拉黑
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  在抖音视频页面、评论区、视频详情页、直播间添加一键拉黑按钮
// @author       You
// @match        https://www.douyin.com/?recommend=1
// @match        https://www.douyin.com/
// @match        https://www.douyin.com/video/*
// @match        https://live.douyin.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('[抖音一键拉黑] 脚本开始加载 v2.6');

    // 添加样式
    GM_addStyle(`
        .douyin-block-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            margin-top: 8px;
            margin-bottom: 4px;
            transition: all 0.2s ease;
            position: relative;
        }
        .douyin-block-btn:hover {
            transform: scale(1.05);
        }
        .douyin-block-btn .block-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            backdrop-filter: blur(2px);
        }
        .douyin-block-btn:hover .block-icon {
            background: rgba(254, 44, 85, 0.8);
        }
        .douyin-block-btn .block-icon svg {
            width: 22px;
            height: 22px;
            fill: #fff;
        }
        .douyin-block-btn .block-text {
            margin-top: 4px;
            font-size: 12px;
            color: #fff;
            line-height: 16px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        .douyin-block-btn.blocked .block-icon {
            background: rgba(100, 100, 100, 0.4);
        }
        .douyin-block-btn.blocked .block-text {
            color: #aaa;
        }
        .douyin-block-btn.blocked .block-icon svg {
            fill: #aaa;
        }
        .douyin-comment-block-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            background: transparent;
            transition: background 0.2s;
        }
        .douyin-comment-block-btn:hover {
            background: rgba(0, 0, 0, 0.1);
        }
        .douyin-comment-block-btn .block-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .douyin-comment-block-btn .block-icon svg {
            width: 16px;
            height: 16px;
            fill: #61666d;
        }
        .douyin-comment-block-btn:hover .block-icon svg {
            fill: #fe2c55;
        }
        .douyin-comment-block-btn .block-text {
            font-size: 12px;
            color: #61666d;
        }
        .douyin-comment-block-btn:hover .block-text {
            color: #fe2c55;
        }
        .douyin-comment-block-btn.blocked .block-icon svg {
            fill: #fe2c55;
        }
        .douyin-comment-block-btn.blocked .block-text {
            color: #fe2c55;
        }
        .live-block-btn:hover {
            background: rgba(0, 0, 0, 0.1);
            color: #fe2c55;
        }
        .douyin-block-toast {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 99999;
            animation: fadeInOut 2s ease;
            pointer-events: none;
        }
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
    `);

    // 显示提示
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'douyin-block-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // 从按钮所在容器获取视频作者信息
    function getVideoAuthorInfoFromContainer(container) {
        const authorLink = container.querySelector('a[href*="/user/"]');
        if (authorLink) {
            const href = authorLink.getAttribute('href');
            const match = href.match(/\/user\/([^?]+)/);
            if (match) {
                const result = { secUid: match[1] };
                
                // 尝试从链接中获取 user_id（抖音数字 ID）
                const uidMatch = href.match(/uid=(\d+)/);
                if (uidMatch) {
                    result.userId = uidMatch[1];
                }
                
                // 尝试从 data-user-id 属性获取
                const userIdAttr = container.querySelector('[data-user-id]');
                if (userIdAttr) {
                    result.userId = userIdAttr.getAttribute('data-user-id');
                }
                
                // 尝试从更广泛的 DOM 范围获取 user_id
                if (!result.userId) {
                    // 查找包含 userId 或 uid 的元素
                    const allElements = container.querySelectorAll('*');
                    for (const el of allElements) {
                        const dataUid = el.getAttribute('data-uid');
                        if (dataUid) {
                            result.userId = dataUid;
                            break;
                        }
                        const dataUserId = el.getAttribute('data-user-id');
                        if (dataUserId && !result.userId) {
                            result.userId = dataUserId;
                            break;
                        }
                    }
                }
                
                console.log('[抖音一键拉黑] 获取到的用户信息:', result);
                return result;
            }
        }
        return null;
    }

    // 从视频详情页面获取作者信息
    function getAuthorInfoFromVideoDetailPage() {
        const win = unsafeWindow || window;
        
        if (win.__SSR_DATA__ && win.__SSR_DATA__.user) {
            const user = win.__SSR_DATA__.user;
            if (user.sec_uid) {
                return {
                    secUid: user.sec_uid,
                    userId: user.uid || user.user_id
                };
            }
        }
        
        const userLinks = document.querySelectorAll('a[href*="/user/MS4wLj"]');
        if (userLinks.length > 0) {
            const href = userLinks[0].getAttribute('href');
            const match = href.match(/\/user\/([^?]+)/);
            if (match) {
                return { secUid: match[1] };
            }
        }
        
        const authorElements = document.querySelectorAll('[data-sec-uid], [data-author-sec-uid]');
        for (const el of authorElements) {
            const secUid = el.getAttribute('data-sec-uid') || el.getAttribute('data-author-sec-uid');
            if (secUid) {
                return {
                    secUid: secUid,
                    userId: el.getAttribute('data-user-id') || el.getAttribute('data-uid')
                };
            }
        }
        
        return null;
    }

    // 判断是否是视频详情页面
    function isVideoDetailPage() {
        return window.location.pathname.startsWith('/video/');
    }

    // 判断是否是直播间页面
    function isLiveStreamPage() {
        return window.location.hostname === 'live.douyin.com';
    }

    // 从直播间主播信息侧边栏获取主播信息
    async function getLiveStreamHostFromSidePanel() {
        console.log('[抖音一键拉黑] 开始获取直播间主播信息');

        const win = unsafeWindow || window;
        const pageUrl = window.location.href;

        // 尝试从页面获取 sec_anchor_id
        let secAnchorId = null;
        let anchorId = null;

        // 1. 先从 URL 获取 anchor_id
        const anchorIdMatch = pageUrl.match(/anchor_id=(\d+)/);
        if (anchorIdMatch) {
            anchorId = anchorIdMatch[1];
        }

        // 2. 尝试从 iframe 获取 sec_anchor_id
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                const iframeSrc = iframe.src || '';
                const match = iframeSrc.match(/sec_anchor_id=([^&\s]+)/);
                if (match) {
                    secAnchorId = match[1];
                    console.log('[抖音一键拉黑] 从 iframe 获取到 sec_anchor_id:', secAnchorId);
                    break;
                }
            } catch (e) {}
        }

        // 3. 尝试从 script 标签获取 sec_anchor_id
        if (!secAnchorId) {
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                try {
                    const content = script.textContent || '';
                    const match = content.match(/sec_anchor_id["\s:]+["']?([^"'&\s\\]+)/);
                    if (match) {
                        secAnchorId = match[1];
                        console.log('[抖音一键拉黑] 从 script 获取到 sec_anchor_id:', secAnchorId);
                        break;
                    }
                } catch (e) {}
            }
        }

        // 方式0: 尝试使用 API 获取主播信息
        if (anchorId) {
            try {
                console.log('[抖音一键拉黑] 使用 anchor_id:', anchorId, 'sec_anchor_id:', secAnchorId);

                // 使用 live.douyin.com/webcast/user/profile/ API 获取主播信息
                let profileUrl = `https://live.douyin.com/webcast/user/profile/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&enter_from=web_live&cookie_enabled=true&screen_width=${window.screen.width}&screen_height=${window.screen.height}&browser_language=zh-CN&browser_platform=Win32&browser_name=Chrome&browser_version=${getBrowserVersion()}&os_name=Windows&os_version=10&anchor_id=${anchorId}&click_source=pc_pc_comment_user&msToken=${generateMsToken()}`;

                if (secAnchorId) {
                    profileUrl += `&sec_anchor_id=${secAnchorId}`;
                }

                console.log('[抖音一键拉黑] 调用主播信息 API:', profileUrl);

                const response = await fetch(profileUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                        'Referer': pageUrl
                    },
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = JSON.parse(await response.text());
                    if (data.data && data.data.user_profile && data.data.user_profile.base_info) {
                        const baseInfo = data.data.user_profile.base_info;
                        console.log('[抖音一键拉黑] API 返回的主播信息:', baseInfo);
                        return {
                            secUid: baseInfo.sec_uid,
                            nickname: baseInfo.nickname || '主播'
                        };
                    }
                }
            } catch (e) {
                console.log('[抖音一键拉黑] API 获取失败:', e);
            }
        }

        // 方式1: 尝试从 __INITIAL_STATE__ 获取
        console.log('[抖音一键拉黑] __INITIAL_STATE__:', win.__INITIAL_STATE__ ? '存在' : '不存在');
        if (win.__INITIAL_STATE__) {
            console.log('[抖音一键拉黑] __INITIAL_STATE__ keys:', Object.keys(win.__INITIAL_STATE__).join(', '));
        }

        if (win.__INITIAL_STATE__ && win.__INITIAL_STATE__.room) {
            const room = win.__INITIAL_STATE__.room;
            console.log('[抖音一键拉黑] room:', room);
            if (room.owner) {
                console.log('[抖音一键拉黑] owner:', room.owner);
                return {
                    secUid: room.owner.sec_uid || room.owner.secUid,
                    nickname: room.owner.nickname || room.owner.short_id || '主播'
                };
            }
            if (room.anchor) {
                console.log('[抖音一键拉黑] anchor:', room.anchor);
                return {
                    secUid: room.anchor.sec_uid || room.anchor.secUid,
                    nickname: room.anchor.nickname || room.anchor.short_id || '主播'
                };
            }
        }

        // 方式2: 尝试从页面 script 标签获取
        console.log('[抖音一键拉黑] 查找 script 标签');
        const allScripts = document.querySelectorAll('script');
        let scriptCount = 0;
        for (const script of allScripts) {
            const content = script.textContent;
            if (content && (content.includes('sec_anchor_id') || content.includes('secUid') || content.includes('MS4wLj'))) {
                scriptCount++;
                console.log('[抖音一键拉黑] 找到包含关键词的 script:', scriptCount, content.substring(0, 200));
                const match = content.match(/secUid["\s:]+["']?([^"'&\s]+)/);
                if (match) {
                    return {
                        secUid: match[1],
                        nickname: '主播'
                    };
                }
            }
        }

        // 方式3: 尝试从 meta 标签获取
        console.log('[抖音一键拉黑] 查找 meta 标签');
        const metaTags = document.querySelectorAll('meta');
        for (const meta of metaTags) {
            const content = meta.content;
            if (content && content.includes('MS4wLj')) {
                console.log('[抖音一键拉黑] 找到包含 MS4wLj 的 meta:', meta.outerHTML.substring(0, 200));
                const match = content.match(/MS4wLj[A-Za-z0-9_-]+/);
                if (match) {
                    return {
                        secUid: match[0],
                        nickname: '主播'
                    };
                }
            }
        }

        // 方式4: 尝试从 URL 参数获取
        console.log('[抖音一键拉黑] 页面 URL:', pageUrl);
        const urlMatch = pageUrl.match(/sec_anchor_id=([^&\s]+)/);
        if (urlMatch) {
            console.log('[抖音一键拉黑] 从 URL 找到 sec_anchor_id:', urlMatch[1]);
            return {
                secUid: urlMatch[1],
                nickname: '主播'
            };
        }

        console.log('[抖音一键拉黑] 无法获取直播间主播信息');
        return null;
    }

    // 从推荐页直播间播放器获取主播信息
    function getLiveStreamHostInfo() {
        // 查找直播间播放器容器
        const playerContainer = document.querySelector('.douyin-player-controls');
        if (!playerContainer) return null;
        
        // 尝试从页面数据获取主播信息
        const win = unsafeWindow || window;
        
        // 尝试从 __INITIAL_STATE__ 获取
        if (win.__INITIAL_STATE__ && win.__INITIAL_STATE__.room && win.__INITIAL_STATE__.room.owner) {
            const owner = win.__INITIAL_STATE__.room.owner;
            return {
                secUid: owner.sec_uid || owner.secUid,
                userId: owner.uid || owner.user_id
            };
        }
        
        // 尝试从 data-* 属性获取
        const playerEl = document.querySelector('[data-room-id]') || document.querySelector('[data-anchor-sec-uid]');
        if (playerEl) {
            return {
                secUid: playerEl.dataset.anchorSecUid || playerEl.dataset.secUid,
                userId: playerEl.dataset.anchorUid || playerEl.dataset.uid
            };
        }
        
        return null;
    }

    // 获取直播间评论用户信息
    function getLiveStreamUserInfo(commentElement) {
        console.log('[抖音一键拉黑] 获取直播间评论用户信息, 元素:', commentElement);
        
        // 查找用户昵称元素
        const nicknameEl = commentElement.querySelector('.v8LY0gZF');
        if (!nicknameEl) {
            console.log('[抖音一键拉黑] 未找到昵称元素 .v8LY0gZF');
            return null;
        }
        
        const nickname = nicknameEl.textContent.replace('：', '').trim();
        console.log('[抖音一键拉黑] 获取到昵称:', nickname);
        
        // 尝试从元素属性或父级获取用户信息
        // 直播间评论的用户信息可能在 data-* 属性中
        let secUid = null;
        let userId = null;
        
        // 方法1: 从 commentElement 的 data-* 属性获取
        console.log('[抖音一键拉黑] 评论元素所有 data-* 属性:');
        for (const attr of commentElement.attributes) {
            if (attr.name.startsWith('data-')) {
                console.log('  ', attr.name, '=', attr.value.substring(0, 100));
            }
        }
        
        // 检查父元素
        const parent = commentElement.parentElement;
        if (parent) {
            console.log('[抖音一键拉黑] 父元素 data-* 属性:');
            for (const attr of parent.attributes) {
                if (attr.name.startsWith('data-')) {
                    console.log('  ', attr.name, '=', attr.value.substring(0, 100));
                }
            }
        }
        
        const win = unsafeWindow || window;
        
        // 方法2: 尝试从 window.__INITIAL_STATE__ 获取
        console.log('[抖音一键拉黑] 检查 __INITIAL_STATE__');
        if (win.__INITIAL_STATE__) {
            console.log('  __INITIAL_STATE__ keys:', Object.keys(win.__INITIAL_STATE__).join(', '));
            if (win.__INITIAL_STATE__.user) {
                console.log('  user:', win.__INITIAL_STATE__.user);
            }
        }
        
        // 方法3: 尝试从 window.localState 获取
        console.log('[抖音一键拉黑] 检查 localState');
        if (win.localState && win.localState.user) {
            secUid = win.localState.user.secUid;
            console.log('  从 localState 获取到 secUid:', secUid);
        }
        
        console.log('[抖音一键拉黑] 直播间评论用户:', nickname, 'secUid:', secUid, 'userId:', userId);
        
        return {
            nickname: nickname,
            secUid: secUid,
            userId: userId
        };
    }

    // 获取设备参数
    function getDeviceParams() {
        return {
            device_platform: 'webapp',
            aid: '6383',
            channel: 'channel_pc_web',
            pc_client_type: '1',
            pc_libra_divert: 'Windows',
            update_version_code: '170400',
            support_h265: '1',
            support_dash: '1',
            version_code: '170400',
            version_name: '17.4.0',
            cookie_enabled: String(navigator.cookieEnabled),
            screen_width: String(window.screen.width),
            screen_height: String(window.screen.height),
            browser_language: navigator.language || 'zh-CN',
            browser_platform: 'Win32',
            browser_name: 'Chrome',
            browser_version: getBrowserVersion(),
            browser_online: String(navigator.onLine),
            engine_name: 'Blink',
            engine_version: getBrowserVersion(),
            os_name: 'Windows',
            os_version: '10',
            cpu_core_num: String(navigator.hardwareConcurrency || 4),
            device_memory: String(Math.ceil((navigator.deviceMemory || 4))),
            platform: 'PC',
            downlink: '10',
            effective_type: '4g',
            round_trip_time: '0'
        };
    }

    // 获取浏览器版本
    function getBrowserVersion() {
        const ua = navigator.userAgent;
        const match = ua.match(/Chrome\/(\d+)/);
        return match ? match[1] + '.0.0.0' : '147.0.0.0';
    }

    // 获取抖音的签名参数
    function getSignParams() {
        const params = {};
        const win = unsafeWindow || window;

        // 尝试从 window 对象获取
        try {
            // 抖音通常会把签名相关数据存储在全局变量中
            if (win._byted_acrawler && win._byted_acrawler.sign) {
                params.sign = win._byted_acrawler.sign;
            }
            if (win.byted_acrawler && win.byted_acrawler.sign) {
                params.sign = win.byted_acrawler.sign;
            }
            // 尝试获取签名函数
            if (win._byted_acrawler && win._byted_acrawler.signUrl) {
                params.signUrl = win._byted_acrawler.signUrl;
            }
            // 尝试获取 msToken 生成函数
            if (win._byted_acrawler && win._byted_acrawler.msToken) {
                params.msTokenFunc = win._byted_acrawler.msToken;
            }
        } catch(e) {}

        // 从 cookie 中获取必要的 token
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'msToken') {
                params.msToken = value;
            }
            if (name === 'ttwid') {
                params.ttwid = value;
            }
            if (name === 'odin_tt') {
                params.odin_tt = value;
            }
            if (name === 'sessionid') {
                params.sessionid = value;
            }
            if (name === 'passport_csrf_token') {
                params.passport_csrf_token = value;
            }
        }

        // 尝试从 SSR 数据获取
        try {
            if (win.SSR_RENDER_DATA && win.SSR_RENDER_DATA.app) {
                params.ssrData = win.SSR_RENDER_DATA.app;
            }
            if (win.__INITIAL_STATE__) {
                params.initialState = win.__INITIAL_STATE__;
            }
        } catch(e) {}

        return params;
    }

    // 生成 msToken（如果没有）
    function generateMsToken() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let token = '';
        for (let i = 0; i < 107; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

    // 生成 X-Bogus 签名
    function generateXBogus(params) {
        // 这是抖音签名的一个简化版本
        // 实际签名算法很复杂，这里尝试模拟
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        return `DF${random}${timestamp.toString(36).substring(0, 4)}`;
    }

    // 使用页面内部的 XMLHttpRequest 发送请求
    function sendRequestWithPageXHR(url, options = {}) {
        return new Promise((resolve, reject) => {
            const win = unsafeWindow || window;
            const xhr = new win.XMLHttpRequest();
            
            console.log('[抖音一键拉黑] 尝试使用页面 XHR');
            
            // 构建表单数据（按照接口.txt中的格式）
            const formData = new win.FormData();
            formData.append('block_type', options.blockType || '0');
            formData.append('sec_user_id', options.secUid || '');
            formData.append('source', '0');
            if (options.userId) {
                formData.append('user_id', options.userId);
            }
            
            xhr.open('POST', url, true);
            xhr.withCredentials = true;
            
            // 设置请求头
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
            xhr.setRequestHeader('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8');
            xhr.setRequestHeader('Origin', 'https://www.douyin.com');
            xhr.setRequestHeader('Referer', 'https://www.douyin.com/');
            
            xhr.onload = function() {
                console.log('[抖音一键拉黑] XHR 响应状态:', xhr.status);
                resolve({
                    status: xhr.status,
                    responseText: xhr.responseText
                });
            };
            
            xhr.onerror = function() {
                console.log('[抖音一键拉黑] XHR 请求失败');
                reject(new Error('XHR request failed'));
            };
            
            // 将 FormData 转换为 URL 编码字符串
            // 注意：根据接口.txt，block_type=1 表示拉黑，block_type=0 表示解除拉黑
            const params = new URLSearchParams();
            // isUnblock=true 表示当前是拉黑状态，要解除拉黑，所以 block_type=0
            // isUnblock=false 表示当前未拉黑，要拉黑，所以 block_type=1
            const actualBlockType = options.isUnblock ? 0 : 1;
            params.append('block_type', actualBlockType.toString());
            params.append('sec_user_id', options.secUid || '');
            params.append('source', '0');
            if (options.userId) {
                params.append('user_id', options.userId);
            }
            
            console.log('[抖音一键拉黑] XHR 请求体:', params.toString());
            xhr.send(params.toString());
        });
    }

    // 尝试使用抖音内部的请求模块
    async function sendRequestWithDouyinModule(secUid, blockType) {
        return new Promise((resolve) => {
            try {
                const win = unsafeWindow || window;
                
                // 尝试通过 webpack 获取抖音的请求模块
                if (win.webpackChunkdouyin_web) {
                    console.log('[抖音一键拉黑] 尝试通过 webpack 获取请求模块');
                    
                    // 尝试获取模块
                    let requestModule = null;
                    
                    // 遍历 webpack chunk 寻找请求相关的模块
                    win.webpackChunkdouyin_web.forEach((chunk) => {
                        chunk[1].forEach((module, id) => {
                            try {
                                const moduleStr = module.toString();
                                // 查找包含请求逻辑的模块
                                if (moduleStr.includes('/aweme/v1/') || 
                                    moduleStr.includes('user/block') ||
                                    moduleStr.includes('axios') ||
                                    moduleStr.includes('fetch')) {
                                    console.log('[抖音一键拉黑] 找到可能的请求模块:', id);
                                }
                            } catch (e) {}
                        });
                    });
                }
                
                resolve({ success: false });
            } catch (error) {
                console.error('[抖音一键拉黑] 使用抖音模块失败:', error);
                resolve({ success: false });
            }
        });
    }

    // 使用页面内部的请求方法
    async function blockUserWithPageMethod(secUid, blockType) {
        return new Promise((resolve) => {
            try {
                const win = unsafeWindow || window;
                
                // 查找页面中的请求模块
                if (win.webpackChunkdouyin_web) {
                    console.log('[抖音一键拉黑] 找到 webpackChunkdouyin_web');
                }

                // 尝试调用页面的签名函数
                let signedUrl = null;
                
                // 方法1: 尝试调用 _byted_acrawler.signUrl
                if (win._byted_acrawler) {
                    console.log('[抖音一键拉黑] 找到 _byted_acrawler');
                    
                    if (typeof win._byted_acrawler.signUrl === 'function') {
                        try {
                            const baseUrl = `/aweme/v1/web/user/block/?sec_user_id=${secUid}&block_type=${blockType}&source=0`;
                            signedUrl = win._byted_acrawler.signUrl(baseUrl);
                            console.log('[抖音一键拉黑] 使用页面签名函数 signUrl:', signedUrl);
                        } catch (e) {
                            console.log('[抖音一键拉黑] signUrl 调用失败:', e);
                        }
                    }
                    
                    // 尝试其他签名方法
                    if (!signedUrl && typeof win._byted_acrawler.sign === 'function') {
                        try {
                            const baseUrl = `/aweme/v1/web/user/block/?sec_user_id=${secUid}&block_type=${blockType}&source=0`;
                            const sign = win._byted_acrawler.sign(baseUrl);
                            console.log('[抖音一键拉黑] 使用页面签名函数 sign:', sign);
                            if (sign) {
                                signedUrl = baseUrl + '&_signature=' + encodeURIComponent(sign);
                            }
                        } catch (e) {
                            console.log('[抖音一键拉黑] sign 调用失败:', e);
                        }
                    }
                }

                // 方法2: 尝试使用 byted_acrawler
                if (!signedUrl && win.byted_acrawler) {
                    console.log('[抖音一键拉黑] 找到 byted_acrawler');
                    if (typeof win.byted_acrawler.sign === 'function') {
                        try {
                            const baseUrl = `/aweme/v1/web/user/block/?sec_user_id=${secUid}&block_type=${blockType}&source=0`;
                            const sign = win.byted_acrawler.sign(baseUrl);
                            console.log('[抖音一键拉黑] 使用 byted_acrawler.sign:', sign);
                            if (sign) {
                                signedUrl = baseUrl + '&_signature=' + encodeURIComponent(sign);
                            }
                        } catch (e) {
                            console.log('[抖音一键拉黑] byted_acrawler.sign 调用失败:', e);
                        }
                    }
                }

                // 方法3: 尝试拦截页面的 fetch 请求获取签名
                if (!signedUrl) {
                    console.log('[抖音一键拉黑] 尝试从页面网络请求获取签名...');
                }

                resolve({ signedUrl, success: !!signedUrl });
            } catch (error) {
                console.error('[抖音一键拉黑] 页面方法调用失败:', error);
                resolve({ signedUrl: null, success: false });
            }
        });
    }

    // 获取完整的请求头
    function getRequestHeaders() {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'X-Requested-With': 'XMLHttpRequest'
        };

        // 尝试从页面获取额外的头信息
        const win = unsafeWindow || window;
        if (win.__doudian__ && win.__doudian__.headers) {
            Object.assign(headers, win.__doudian__.headers);
        }

        return headers;
    }

    // 执行拉黑操作
    async function blockUser(secUid, isUnblock = false) {
        try {
            console.log('[抖音一键拉黑] 开始' + (isUnblock ? '解除拉黑' : '拉黑') + ':', secUid);

            const blockType = isUnblock ? 1 : 0;

            // 首先尝试使用页面内部方法
            const pageMethodResult = await blockUserWithPageMethod(secUid, blockType);
            
            // 获取签名参数
            const signParams = getSignParams();
            console.log('[抖音一键拉黑] 签名参数:', signParams);

            // 构建基础 URL - 参考实际的 curl 请求
            // 注意：实际的拉黑请求使用的是 www-hj.douyin.com 域名
            let url = 'https://www-hj.douyin.com/aweme/v1/web/user/block/?';
            const urlParams = new URLSearchParams();
            
            // 从 cookie 获取必要的参数
            const cookies = document.cookie.split(';');
            let webid = '', uifid = '', fp = '';
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'msToken') signParams.msToken = value;
                if (name === 'ttwid') signParams.ttwid = value;
                if (name === 'sessionid') signParams.sessionid = value;
                if (name === 'passport_csrf_token') signParams.passport_csrf_token = value;
                if (name === 'UIFID') uifid = value;
                if (name === 's_v_web_id') { webid = value; fp = value; }
            }
            
            // 添加设备参数（动态获取）
            const deviceParams = getDeviceParams();
            for (const [key, value] of Object.entries(deviceParams)) {
                urlParams.append(key, value);
            }
            
            // 添加用户相关参数
            if (webid) urlParams.append('webid', webid);
            if (uifid) urlParams.append('uifid', uifid);
            
            // 添加 msToken
            const msToken = signParams.msToken || generateMsToken();
            urlParams.append('msToken', msToken);
            
            // 添加指纹参数
            if (fp) {
                urlParams.append('verifyFp', fp);
                urlParams.append('fp', fp);
            }
            
            // 注意：业务参数（sec_user_id, block_type, source, user_id）会在 Form Data 中发送
            // 不再添加到 URL 参数中

            url += urlParams.toString();

            // 如果页面方法成功获取了签名URL，使用它
            if (pageMethodResult.success && pageMethodResult.signedUrl) {
                url = pageMethodResult.signedUrl;
                console.log('[抖音一键拉黑] 使用页面签名的 URL');
            }

            console.log('[抖音一键拉黑] 请求 URL:', url);

            return new Promise(async (resolve) => {
                // 获取请求头
                const headers = getRequestHeaders();

                // 方法1: 尝试使用页面的 XHR
                try {
                    console.log('[抖音一键拉黑] 尝试使用页面 XHR');
                    const xhrResult = await sendRequestWithPageXHR(url, {
                        secUid: secUid,
                        blockType: blockType,
                        userId: signParams.userId,
                        isUnblock: isUnblock
                    });
                    console.log('[抖音一键拉黑] 页面 XHR 结果:', xhrResult);
                    
                    if (xhrResult.status !== 403) {
                        handleResponse(xhrResult.responseText, isUnblock, resolve);
                        return;
                    }
                } catch (xhrError) {
                    console.log('[抖音一键拉黑] 页面 XHR 失败:', xhrError);
                }

                // 方法2: 尝试使用 fetch API（页面上下文）
                const fetchOptions = {
                    method: 'POST',
                    headers: headers,
                    credentials: 'include',
                    body: ''
                };

                fetch(url, fetchOptions)
                    .then(response => {
                        console.log('[抖音一键拉黑] fetch 响应状态:', response.status);
                        if (response.status === 403) {
                            throw new Error('fetch returned 403');
                        }
                        return response.text();
                    })
                    .then(text => {
                        console.log('[抖音一键拉黑] fetch 响应内容:', text);
                        handleResponse(text, isUnblock, resolve);
                    })
                    .catch(error => {
                        console.log('[抖音一键拉黑] fetch 失败，使用 GM_xmlhttpRequest:', error);
                        
                        // 方法3: 使用 GM_xmlhttpRequest 作为备选
                        // 构建请求体
                        const actualBlockType = isUnblock ? 0 : 1;
                        const gmData = `block_type=${actualBlockType}&sec_user_id=${encodeURIComponent(secUid)}&source=0${signParams.userId ? '&user_id=' + signParams.userId : ''}`;
                        console.log('[抖音一键拉黑] GM 请求体:', gmData);
                        
                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: url,
                            headers: {
                                ...headers,
                                'Cookie': document.cookie
                            },
                            data: gmData,
                            withCredentials: true,
                            timeout: 10000,
                            onload: function(response) {
                                console.log('[抖音一键拉黑] GM 响应状态:', response.status);
                                console.log('[抖音一键拉黑] GM 响应内容:', response.responseText);

                                if (response.status === 403) {
                                    showToast('请求被拒绝，请确保已登录抖音');
                                    resolve({ success: false, error: '403 Forbidden - 需要登录' });
                                    return;
                                }

                                handleResponse(response.responseText, isUnblock, resolve);
                            },
                            onerror: function(error) {
                                console.error('[抖音一键拉黑] 请求失败:', error);
                                showToast('网络错误，请稍后重试');
                                resolve({ success: false, error: '网络错误' });
                            },
                            ontimeout: function() {
                                console.error('[抖音一键拉黑] 请求超时');
                                showToast('请求超时，请稍后重试');
                                resolve({ success: false, error: '超时' });
                            }
                        });
                    });
            });
        } catch (error) {
            console.error('[抖音一键拉黑] 异常:', error);
            showToast('操作失败，请重试');
            return { success: false, error: error.message };
        }
    }

    // 处理响应数据
    function handleResponse(responseText, isUnblock, resolve) {
        if (!responseText) {
            showToast('服务器返回空响应');
            resolve({ success: false, error: 'Empty response' });
            return;
        }

        try {
            const data = JSON.parse(responseText);
            console.log('[抖音一键拉黑] 解析响应数据:', data);
            console.log('[抖音一键拉黑] 操作类型:', isUnblock ? '解除拉黑' : '拉黑');

            if (data.status_code === 0) {
                // block_status 表示用户当前的拉黑状态
                // block_status=1 表示用户已被拉黑
                // block_status=0 表示用户未被拉黑
                if (isUnblock) {
                    // 解除拉黑操作
                    if (data.block_status === 0) {
                        showToast('已解除拉黑');
                        resolve({ success: true, isBlocked: false });
                    } else {
                        showToast('解除拉黑失败');
                        resolve({ success: false, error: '解除拉黑失败' });
                    }
                } else {
                    // 拉黑操作
                    if (data.block_status === 1) {
                        showToast('已拉黑该用户');
                        console.log('[抖音一键拉黑] 拉黑成功，block_status:', data.block_status);
                        resolve({ success: true, isBlocked: true });
                    } else {
                        showToast('拉黑失败，block_status: ' + data.block_status);
                        console.log('[抖音一键拉黑] 拉黑失败，block_status:', data.block_status);
                        resolve({ success: false, error: '拉黑失败' });
                    }
                }
            } else {
                const errorMsg = data.status_msg || '操作失败';
                showToast(errorMsg);
                resolve({ success: false, error: errorMsg });
            }
        } catch (e) {
            console.error('[抖音一键拉黑] 解析响应失败:', e);
            showToast('操作失败，请重试');
            resolve({ success: false, error: '解析失败' });
        }
    }

    // 创建拉黑按钮
    function createBlockButton(container) {
        const btn = document.createElement('div');
        btn.className = 'douyin-block-btn';
        btn.dataset.blocked = 'false';
        btn.innerHTML = `
            <div class="block-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#fff" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
                </svg>
            </div>
            <span class="block-text">拉黑</span>
        `;

        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const authorInfo = getVideoAuthorInfoFromContainer(container);
            if (!authorInfo || !authorInfo.secUid) {
                showToast('无法获取用户信息');
                return;
            }

            btn.style.pointerEvents = 'none';
            const isCurrentlyBlocked = btn.dataset.blocked === 'true';
            const result = await blockUser(authorInfo.secUid, isCurrentlyBlocked);

            if (result.success) {
                if (result.isBlocked) {
                    btn.dataset.blocked = 'true';
                    btn.classList.add('blocked');
                    btn.querySelector('.block-text').textContent = '已拉黑';
                    console.log('[抖音一键拉黑] 按钮状态已更新为: 已拉黑');
                } else {
                    btn.dataset.blocked = 'false';
                    btn.classList.remove('blocked');
                    btn.querySelector('.block-text').textContent = '拉黑';
                    console.log('[抖音一键拉黑] 按钮状态已更新为: 未拉黑');
                }
            }

            setTimeout(() => {
                btn.style.pointerEvents = 'auto';
            }, 1000);
        });

        return btn;
    }

    // 为单个互动区域插入按钮
    function insertButtonForInteractionArea(interactionArea) {
        if (interactionArea.querySelector('.douyin-block-btn')) {
            return false;
        }

        const avatarContainer = interactionArea.querySelector('.B0JKdzQ8');
        if (!avatarContainer) {
            return false;
        }

        const parent = avatarContainer.parentElement;
        if (!parent || !parent.parentElement) {
            return false;
        }

        const blockBtn = createBlockButton(interactionArea);
        parent.parentElement.insertBefore(blockBtn, parent);
        console.log('[抖音一键拉黑] 按钮已插入');
        return true;
    }

    // 为评论区单个评论插入拉黑按钮
    function insertButtonForComment(commentItem) {
        if (commentItem.querySelector('.douyin-comment-block-btn')) {
            return false;
        }

        const moreBtn = commentItem.querySelector('.aVT9D1a8');
        if (!moreBtn) {
            return false;
        }

        const commentInfo = getCommentAuthorInfo(commentItem);
        if (!commentInfo || !commentInfo.secUid) {
            console.log('[抖音一键拉黑] 无法获取评论区用户 secUid');
            return false;
        }

        const blockBtn = createCommentBlockButton(commentItem, commentInfo);
        moreBtn.parentElement.insertBefore(blockBtn, moreBtn);
        console.log('[抖音一键拉黑] 评论区按钮已插入');
        return true;
    }

    // 获取评论区作者信息
    function getCommentAuthorInfo(commentItem) {
        const authorLink = commentItem.querySelector('a[href*="/user/"]');
        if (authorLink) {
            const href = authorLink.getAttribute('href');
            const match = href.match(/\/user\/([^?]+)/);
            if (match) {
                const result = { secUid: match[1] };

                const uidMatch = href.match(/uid=(\d+)/);
                if (uidMatch) {
                    result.userId = uidMatch[1];
                }

                const userIdAttr = commentItem.querySelector('[data-user-id]');
                if (userIdAttr) {
                    result.userId = userIdAttr.getAttribute('data-user-id');
                }

                console.log('[抖音一键拉黑] 获取到评论区用户信息:', result);
                return result;
            }
        }
        return null;
    }

    // 创建评论区拉黑按钮
    function createCommentBlockButton(commentItem, authorInfo) {
        const btn = document.createElement('div');
        btn.className = 'douyin-comment-block-btn';
        btn.dataset.blocked = 'false';
        btn.innerHTML = `
            <div class="block-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#fff" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
                </svg>
            </div>
            <span class="block-text">拉黑</span>
        `;

        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!authorInfo || !authorInfo.secUid) {
                showToast('无法获取用户信息');
                return;
            }

            btn.style.pointerEvents = 'none';
            const isCurrentlyBlocked = btn.dataset.blocked === 'true';
            const result = await blockUser(authorInfo.secUid, isCurrentlyBlocked);

            if (result.success) {
                if (result.isBlocked) {
                    btn.dataset.blocked = 'true';
                    btn.classList.add('blocked');
                    btn.querySelector('.block-text').textContent = '已拉黑';
                    showToast('已拉黑该用户');
                } else {
                    btn.dataset.blocked = 'false';
                    btn.classList.remove('blocked');
                    btn.querySelector('.block-text').textContent = '拉黑';
                    showToast('已解除拉黑');
                }
            }

            setTimeout(() => {
                btn.style.pointerEvents = 'auto';
            }, 1000);
        });

        return btn;
    }

    // 为所有互动区域插入按钮
    function insertButtonsForAll() {
        const interactionAreas = document.querySelectorAll('.zqe4B9aR.WU6dkKao');
        let insertedCount = 0;

        for (const area of interactionAreas) {
            if (insertButtonForInteractionArea(area)) {
                insertedCount++;
            }
        }

        if (insertedCount > 0) {
            console.log('[抖音一键拉黑] 已插入', insertedCount, '个按钮');
        }

        return insertedCount;
    }

    // 为所有评论区插入按钮
    function insertButtonsForComments() {
        const commentItems = document.querySelectorAll('.UuCzPLbi[data-e2e="comment-item"]');
        let insertedCount = 0;

        for (const item of commentItems) {
            if (insertButtonForComment(item)) {
                insertedCount++;
            }
        }

        if (insertedCount > 0) {
            console.log('[抖音一键拉黑] 已插入评论区', insertedCount, '个按钮');
        }

        return insertedCount;
    }

    // 为视频详情页面插入拉黑按钮
    function insertButtonForVideoDetailPage() {
        if (!isVideoDetailPage()) {
            return 0;
        }
        
        const authorInfo = getAuthorInfoFromVideoDetailPage();
        if (!authorInfo || !authorInfo.secUid) {
            console.log('[抖音一键拉黑] 无法获取视频详情页作者信息');
            return 0;
        }
        
        console.log('[抖音一键拉黑] 视频详情页作者信息:', authorInfo);
        
        const existingBtn = document.querySelector('.douyin-video-detail-block-btn');
        if (existingBtn) {
            return 0;
        }
        
        const btn = document.createElement('div');
        btn.className = 'douyin-video-detail-block-btn';
        btn.dataset.blocked = 'false';
        btn.innerHTML = `
            <div class="block-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
                </svg>
            </div>
            <span class="block-text">拉黑</span>
        `;
        
        btn.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            cursor: pointer;
            color: #fff;
            font-size: 14px;
            transition: all 0.2s;
        `;
        
        btn.addEventListener('click', async () => {
            btn.style.pointerEvents = 'none';
            const isCurrentlyBlocked = btn.dataset.blocked === 'true';
            const result = await blockUser(authorInfo.secUid, isCurrentlyBlocked);
            
            if (result.success) {
                if (result.isBlocked) {
                    btn.dataset.blocked = 'true';
                    btn.style.background = 'rgba(254, 44, 85, 0.2)';
                    btn.querySelector('.block-text').textContent = '已拉黑';
                    showToast('已拉黑该用户');
                } else {
                    btn.dataset.blocked = 'false';
                    btn.style.background = 'rgba(255, 255, 255, 0.1)';
                    btn.querySelector('.block-text').textContent = '拉黑';
                    showToast('已解除拉黑');
                }
            }
            
            setTimeout(() => {
                btn.style.pointerEvents = 'auto';
            }, 1000);
        });
        
        // 尝试找到合适的位置插入按钮
        // 查找分享按钮（视频详情页面互动区域）
        const shareBtn = document.querySelector('.efAlTMqD') || document.querySelector('[class*="share"]') || document.querySelector('[data-e2e*="share"]');
        if (shareBtn && shareBtn.parentElement) {
            shareBtn.parentElement.insertBefore(btn, shareBtn.nextSibling);
            console.log('[抖音一键拉黑] 视频详情页按钮已插入（分享按钮右边）');
            return 1;
        }
        
        // 尝试查找互动按钮区域
        const interactionArea = document.querySelector('.EHfFajzd') || document.querySelector('[class*="interaction"]');
        if (interactionArea) {
            interactionArea.appendChild(btn);
            console.log('[抖音一键拉黑] 视频详情页按钮已插入（互动区域）');
            return 1;
        }
        
        // 如果找不到合适位置，添加到 body
        document.body.appendChild(btn);
        btn.style.position = 'fixed';
        btn.style.bottom = '100px';
        btn.style.right = '20px';
        btn.style.zIndex = '9999';
        console.log('[抖音一键拉黑] 视频详情页按钮已插入（备用位置）');
        return 1;
    }

    // 为直播间评论区插入拉黑按钮
    function insertButtonsForLiveStreamComments() {
        if (!isLiveStreamPage()) {
            return 0;
        }
        
        const commentItems = document.querySelectorAll('.webcast-chatroom___item');
        let insertedCount = 0;
        
        for (const item of commentItems) {
            if (item.querySelector('.live-block-btn')) continue;
            
            const userInfo = getLiveStreamUserInfo(item);
            if (!userInfo || !userInfo.nickname) continue;
            
            const btn = document.createElement('div');
            btn.className = 'live-block-btn';
            btn.dataset.blocked = 'false';
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
                </svg>
            `;
            
            btn.style.cssText = `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                cursor: pointer;
                color: #8a9199;
                border-radius: 4px;
                transition: all 0.2s;
                margin-left: 8px;
            `;
            
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                btn.style.pointerEvents = 'none';
                
                const isCurrentlyBlocked = btn.dataset.blocked === 'true';
                
                // 直播间评论拉黑需要 secUid，暂时用 nickname 代替
                if (!userInfo.secUid) {
                    showToast('无法获取用户信息，请刷新重试');
                    btn.style.pointerEvents = 'auto';
                    return;
                }
                
                const result = await blockUser(userInfo.secUid, isCurrentlyBlocked);
                
                if (result.success) {
                    if (result.isBlocked) {
                        btn.dataset.blocked = 'true';
                        btn.style.color = '#fe2c55';
                        showToast('已拉黑 ' + userInfo.nickname);
                    } else {
                        btn.dataset.blocked = 'false';
                        btn.style.color = '#8a9199';
                        showToast('已解除拉黑 ' + userInfo.nickname);
                    }
                }
                
                setTimeout(() => {
                    btn.style.pointerEvents = 'auto';
                }, 1000);
            });
            
            const wrapper = item.querySelector('.NkS2Invn');
            if (wrapper) {
                wrapper.prepend(btn);
                insertedCount++;
            }
        }
        
        if (insertedCount > 0) {
            console.log('[抖音一键拉黑] 直播间已插入', insertedCount, '个拉黑按钮');
        }
        
        return insertedCount;
    }

    // 为推荐页直播间播放器插入拉黑按钮
    function insertButtonForRecommendLiveStream() {
        // 只在首页推荐页执行
        if (isVideoDetailPage() || isLiveStreamPage()) {
            return 0;
        }
        
        // 检查是否存在直播间播放器
        const playerControls = document.querySelector('.douyin-player-controls');
        if (!playerControls) {
            return 0;
        }
        
        // 检查是否已插入
        if (document.querySelector('.douyin-recommend-live-block-btn')) {
            return 0;
        }
        
        const hostInfo = getLiveStreamHostInfo();
        if (!hostInfo || !hostInfo.secUid) {
            console.log('[抖音一键拉黑] 无法获取推荐页直播间主播信息');
            return 0;
        }
        
        console.log('[抖音一键拉黑] 推荐页直播间主播信息:', hostInfo);
        
        const btn = document.createElement('div');
        btn.className = 'douyin-recommend-live-block-btn';
        btn.dataset.blocked = 'false';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
            </svg>
        `;
        
        btn.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            cursor: pointer;
            color: #fff;
            border-radius: 4px;
            transition: all 0.2s;
            background: rgba(0, 0, 0, 0.3);
        `;
        
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            btn.style.pointerEvents = 'none';
            
            const isCurrentlyBlocked = btn.dataset.blocked === 'true';
            const result = await blockUser(hostInfo.secUid, isCurrentlyBlocked);
            
            if (result.success) {
                if (result.isBlocked) {
                    btn.dataset.blocked = 'true';
                    btn.style.background = 'rgba(254, 44, 85, 0.6)';
                    showToast('已拉黑该主播');
                } else {
                    btn.dataset.blocked = 'false';
                    btn.style.background = 'rgba(0, 0, 0, 0.3)';
                    showToast('已解除拉黑');
                }
            }
            
            setTimeout(() => {
                btn.style.pointerEvents = 'auto';
            }, 1000);
        });
        
        // 插入到播放器控制栏的最右边
        const controlsRight = document.querySelector('.douyin-player-controls-right');
        if (controlsRight) {
            controlsRight.appendChild(btn);
            console.log('[抖音一键拉黑] 推荐页直播间拉黑按钮已插入');
            return 1;
        }
        
        return 0;
    }

    // 为直播间主播信息侧边栏插入拉黑按钮
    async function insertButtonForLiveStreamHost() {
        if (!isLiveStreamPage()) {
            return 0;
        }

        const container = document.querySelector('.NZ4dNxK4');
        if (!container) {
            return 0;
        }

        if (container.querySelector('.live-host-block-btn')) {
            return 0;
        }

        const hostInfo = await getLiveStreamHostFromSidePanel();
        if (!hostInfo || !hostInfo.secUid) {
            console.log('[抖音一键拉黑] 无法获取直播间主播信息');
            return 0;
        }
        
        console.log('[抖音一键拉黑] 直播间主播信息:', hostInfo);
        
        const btn = document.createElement('div');
        btn.className = 'live-host-block-btn';
        btn.dataset.blocked = 'false';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
            </svg>
        `;
        
        btn.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            cursor: pointer;
            color: #61666d;
            border-radius: 8px;
            transition: all 0.2s;
        `;
        
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            btn.style.pointerEvents = 'none';
            
            const isCurrentlyBlocked = btn.dataset.blocked === 'true';
            const result = await blockUser(hostInfo.secUid, isCurrentlyBlocked);
            
            if (result.success) {
                if (result.isBlocked) {
                    btn.dataset.blocked = 'true';
                    btn.style.color = '#fe2c55';
                    btn.style.background = 'rgba(254, 44, 85, 0.1)';
                    showToast('已拉黑 ' + hostInfo.nickname);
                } else {
                    btn.dataset.blocked = 'false';
                    btn.style.color = '#61666d';
                    btn.style.background = 'transparent';
                    showToast('已解除拉黑 ' + hostInfo.nickname);
                }
            }
            
            setTimeout(() => {
                btn.style.pointerEvents = 'auto';
            }, 1000);
        });
        
        // 插入到关注按钮旁边
        const followBtn = container.querySelector('.follow');
        if (followBtn && followBtn.parentElement) {
            followBtn.parentElement.insertBefore(btn, followBtn.nextSibling);
            console.log('[抖音一键拉黑] 直播间主播拉黑按钮已插入');
            return 1;
        }
        
        return 0;
    }

    // 主初始化函数
    function init() {
        console.log('[抖音一键拉黑] 初始化开始');
        
        // 首次立即插入
        insertButtonsForAll();
        insertButtonsForComments();
        
        if (isVideoDetailPage()) {
            console.log('[抖音一键拉黑] 检测到视频详情页面');
            insertButtonForVideoDetailPage();
        }
        
        if (isLiveStreamPage()) {
            console.log('[抖音一键拉黑] 检测到直播间页面');
            insertButtonForLiveStreamHost();
        }
        
        // 推荐页直播间
        insertButtonForRecommendLiveStream();
        
        // 快速同步重试机制（不依赖 MutationObserver）
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = 200;
        
        function quickRetry() {
            if (retryCount >= maxRetries) {
                console.log('[抖音一键拉黑] 快速重试结束');
                return;
            }
            
            retryCount++;
            let inserted = false;
            
            if (insertButtonsForAll() > 0) inserted = true;
            if (insertButtonsForComments() > 0) inserted = true;
            if (isLiveStreamPage() && insertButtonForLiveStreamHost() > 0) inserted = true;
            if (insertButtonForRecommendLiveStream() > 0) inserted = true;
            
            if (inserted) {
                console.log('[抖音一键拉黑] 第', retryCount, '次重试插入成功');
            }
            
            setTimeout(quickRetry, retryInterval);
        }
        
        quickRetry();
    }

    // 监听新视频加载
    function observeNewVideos() {
        console.log('[抖音一键拉黑] 开始监听新视频');

        let debounceTimer = null;

        const observer = new MutationObserver((mutations) => {
            let hasNewVideo = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList && node.classList.contains('zqe4B9aR') && node.classList.contains('WU6dkKao')) {
                                hasNewVideo = true;
                                console.log('[抖音一键拉黑] 检测到新互动区域');
                            }
                            else if (node.querySelector && node.querySelector('.zqe4B9aR.WU6dkKao')) {
                                hasNewVideo = true;
                                console.log('[抖音一键拉黑] 检测到包含互动区域的节点');
                            }
                            else if (node.classList && node.classList.contains('swiper-slide')) {
                                hasNewVideo = true;
                                console.log('[抖音一键拉黑] 检测到新的swiper-slide');
                            }
                            else if (node.classList && node.classList.contains('UuCzPLbi') && node.hasAttribute('data-e2e') && node.getAttribute('data-e2e') === 'comment-item') {
                                hasNewVideo = true;
                                console.log('[抖音一键拉黑] 检测到新评论');
                            }
                            else if (node.querySelector && node.querySelector('.UuCzPLbi[data-e2e="comment-item"]')) {
                                hasNewVideo = true;
                                console.log('[抖音一键拉黑] 检测到包含评论的节点');
                            }
                            else if (node.classList && node.classList.contains('webcast-chatroom___item')) {
                                hasNewVideo = true;
                                console.log('[抖音一键拉黑] 检测到直播间新评论');
                            }
                            else if (node.classList && node.classList.contains('NZ4dNxK4')) {
                                hasNewVideo = true;
                                console.log('[抖音一键拉黑] 检测到直播间主播信息区域');
                            }
                            else if (node.querySelector && node.querySelector('.NZ4dNxK4')) {
                                hasNewVideo = true;
                                console.log('[抖音一键拉黑] 检测到包含主播信息区域的节点');
                            }
                            else if (node.querySelector && node.querySelector('.webcast-chatroom___item')) {
                                hasNewVideo = true;
                                console.log('[抖音一键拉黑] 检测到包含直播间评论的节点');
                            }
                            else if (node.classList && node.classList.contains('douyin-player-controls')) {
                                hasNewVideo = true;
                                console.log('[抖音一键拉黑] 检测到推荐页直播间播放器');
                            }
                            else if (node.querySelector && node.querySelector('.douyin-player-controls')) {
                                hasNewVideo = true;
                                console.log('[抖音一键拉黑] 检测到包含直播间播放器的节点');
                            }
                        }
                    }
                }

                if (hasNewVideo) break;
            }

            if (hasNewVideo) {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }

                debounceTimer = setTimeout(() => {
                    console.log('[抖音一键拉黑] 延迟执行插入');
                    insertButtonsForAll();
                    insertButtonsForComments();
                    
                    if (isLiveStreamPage()) {
                        insertButtonForLiveStreamHost();
                    }
                    
                    insertButtonForRecommendLiveStream();
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[抖音一键拉黑] 已启动视频加载监听');
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[抖音一键拉黑] DOMContentLoaded');
            setTimeout(() => {
                init();
                observeNewVideos();
            }, 1000);
        });
    } else {
        console.log('[抖音一键拉黑] 页面已加载');
        setTimeout(() => {
            init();
            observeNewVideos();
        }, 1000);
    }

    console.log('[抖音一键拉黑] 脚本加载完成');
})();
