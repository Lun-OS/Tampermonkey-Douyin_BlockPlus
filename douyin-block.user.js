// ==UserScript==
// @name         抖音一键拉黑
// @namespace    https://github.com/Lun-OS/Tampermonkey-Douyin_BlockPlus
// @version      4.0
// @description  抖音拉黑从未如此丝滑——0.01秒接口直封，无需模拟点击，无需跳转菜单。全场景（推荐/详情/评论...）按钮自动就位，点一下瞬间屏蔽/解除，纯净体验零等待。
// @author       Lun.
// @match        https://www.douyin.com/?recommend=1
// @match        https://www.douyin.com/
// @match        https://www.douyin.com/video/*
// @match        https://live.douyin.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @license      MIT
// @run-at       document-end
// @downloadURL https://update.greasyfork.org/scripts/575489/%E6%8A%96%E9%9F%B3%E4%B8%80%E9%94%AE%E6%8B%89%E9%BB%91.user.js
// @updateURL https://update.greasyfork.org/scripts/575489/%E6%8A%96%E9%9F%B3%E4%B8%80%E9%94%AE%E6%8B%89%E9%BB%91.meta.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('[抖音拉黑] v4.0');

    // 清理旧版本的设置项
    localStorage.removeItem('douyin-block-comment-shortcut-enabled');

    // 添加样式
    GM_addStyle(`
        .douyin-block-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            margin-top: 8px;
            margin-bottom: 4px;
            position: relative;
            width: 48px;
            height: 48px;
        }
        .douyin-block-btn .block-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            backdrop-filter: blur(2px);
        }
        .douyin-block-btn:hover .block-icon {
            background: rgba(0, 0, 0, 0.35);
            border-color: rgba(255, 255, 255, 0.5);
        }
        .douyin-block-btn .block-icon svg {
            width: 22px;
            height: 22px;
            fill: rgba(255, 255, 255, 0.85);
            transition: all 0.2s ease;
        }
        .douyin-block-btn:hover .block-icon svg {
            fill: #fff;
        }
        .douyin-block-btn.blocked .block-icon svg path {
            fill: #ff6666 !important;
        }
        .douyin-block-btn.blocked:hover .block-icon svg path {
            fill: #ff8080 !important;
        }
        .douyin-block-btn .block-tooltip {
            position: absolute;
            left: -8px;
            top: 50%;
            transform: translateX(-100%) translateY(-50%);
            background: rgba(37, 38, 50, 0.95);
            color: #fff;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .douyin-block-btn:hover .block-tooltip {
            opacity: 1;
        }
        .douyin-comment-block-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            background: transparent;
            transition: all 0.2s;
            position: relative;
        }
        .douyin-comment-block-btn:hover {
            background: rgba(0, 0, 0, 0.05);
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
            transition: fill 0.2s;
        }
        .douyin-comment-block-btn:hover .block-icon svg {
            fill: #8a9199;
        }
        .douyin-comment-block-btn.blocked .block-icon svg path {
            fill: #ff6666 !important;
        }
        .douyin-comment-block-btn.blocked:hover .block-icon svg path {
            fill: #ff8080 !important;
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
        .douyin-block-settings-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.7) !important;
            z-index: 2147483647 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        .douyin-block-settings-panel {
            background: #1a1a1a !important;
            border-radius: 12px !important;
            padding: 24px !important;
            min-width: 320px !important;
            color: #fff !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
            border: 1px solid #333 !important;
        }
        .douyin-block-settings-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .douyin-block-settings-close {
            cursor: pointer;
            padding: 4px;
            opacity: 0.7;
        }
        .douyin-block-settings-close:hover {
            opacity: 1;
        }
        .douyin-block-settings-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }
        .douyin-block-settings-label {
            font-size: 14px;
            color: #ccc;
        }
        .douyin-block-settings-input {
            width: 100px;
            height: 32px;
            border: 1px solid #333;
            border-radius: 6px;
            background: #2a2a2a;
            color: #fff;
            text-align: center;
            font-size: 14px;
        }
        .douyin-block-settings-input:focus {
            outline: none;
            border-color: #fe2c55;
        }
        .douyin-block-settings-save {
            width: 100%;
            padding: 10px;
            background: #fe2c55;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            margin-top: 16px;
        }
        .douyin-block-settings-save:hover {
            background: #e6254b;
        }
        .douyin-block-settings-hint {
            font-size: 11px;
            color: #888;
            margin-top: 8px;
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
                
                console.log('[抖音拉黑] 用户信息:', result);
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
                        break;
                    }
                } catch (e) {}
            }
        }

        // 方式0: 尝试使用 API 获取主播信息
        if (anchorId) {
            try {
                let profileUrl = `https://live.douyin.com/webcast/user/profile/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&enter_from=web_live&cookie_enabled=true&screen_width=${window.screen.width}&screen_height=${window.screen.height}&browser_language=zh-CN&browser_platform=Win32&browser_name=Chrome&browser_version=${getBrowserVersion()}&os_name=Windows&os_version=10&anchor_id=${anchorId}&click_source=pc_pc_comment_user&msToken=${generateMsToken()}`;

                if (secAnchorId) {
                    profileUrl += `&sec_anchor_id=${secAnchorId}`;
                }

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
                    if (data.status_code && data.status_code !== 0) {
                    } else if (data.data && data.data.user_profile && data.data.user_profile.base_info) {
                        const baseInfo = data.data.user_profile.base_info;
                        return {
                            secUid: baseInfo.sec_uid,
                            nickname: baseInfo.nickname || '主播'
                        };
                    }
                }
            } catch (e) {}
        }

        // 方式1: 尝试从 __INITIAL_STATE__ 获取
        if (win.__INITIAL_STATE__ && win.__INITIAL_STATE__.room) {
            const room = win.__INITIAL_STATE__.room;
            if (room.owner) {
                return {
                    secUid: room.owner.sec_uid || room.owner.secUid,
                    nickname: room.owner.nickname || room.owner.short_id || '主播'
                };
            }
            if (room.anchor) {
                return {
                    secUid: room.anchor.sec_uid || room.anchor.secUid,
                    nickname: room.anchor.nickname || room.anchor.short_id || '主播'
                };
            }
        }

        // 方式2: 尝试从页面 script 标签获取
        const allScripts = document.querySelectorAll('script');
        for (const script of allScripts) {
            const content = script.textContent;
            if (content && (content.includes('sec_anchor_id') || content.includes('secUid') || content.includes('MS4wLj'))) {
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
        const metaTags = document.querySelectorAll('meta');
        for (const meta of metaTags) {
            const content = meta.content;
            if (content && content.includes('MS4wLj')) {
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
        const urlMatch = pageUrl.match(/sec_anchor_id=([^&\s]+)/);
        if (urlMatch) {
            return {
                secUid: urlMatch[1],
                nickname: '主播'
            };
        }

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
        const nicknameSelectors = [
            '.v8LY0gZF',
            '[class*="nickname"]',
            '[class*="user"]',
            '[class*="name"]',
            '.NkS2Invn',
        ];

        let nicknameEl = null;
        for (const sel of nicknameSelectors) {
            try {
                nicknameEl = commentElement.querySelector(sel);
            } catch (e) { continue; }
            if (nicknameEl) break;
        }

        if (!nicknameEl) return null;

        const nickname = nicknameEl.textContent.replace('：', '').trim();

        // 先从缓存中查找 secUid（通过资料卡获取的）
        let secUid = liveCommentUserCache.get(nickname) || null;

        let userId = null;
        let targetUid = null;
        let secTargetUid = null;
        let webcastUid = null;

        // 遍历评论元素及其父级元素，查找用户信息
        let searchElement = commentElement;
        for (let i = 0; i < 8 && searchElement; i++) {
            const attrs = searchElement.attributes;
            for (const attr of attrs) {
                if (attr.name.startsWith('data-')) {
                    const val = attr.value || '';
                    // 查找 sec_uid
                    if ((attr.name.includes('sec') && attr.name.includes('uid')) || val.includes('MS4wLj')) {
                        if (val.match(/MS4wLj[A-Za-z0-9_-]+/)) {
                            secUid = secUid || val.match(/MS4wLj[A-Za-z0-9_-]+/)[0];
                        }
                    }
                    // 查找 target_uid
                    if (attr.name.includes('target') && attr.name.includes('uid')) {
                        targetUid = val;
                    }
                    // 查找 webcast_uid (可能是 sec_target_uid)
                    if (attr.name.includes('webcast') && attr.name.includes('uid')) {
                        secTargetUid = val;
                    }
                    // 查找纯数字的 user_id
                    if ((attr.name.includes('uid') || attr.name.includes('user')) && !attr.name.includes('sec') && /^\d+$/.test(val)) {
                        userId = val;
                    }
                    // 查找 target_webcast_uid
                    if (attr.name.includes('target_webcast')) {
                        webcastUid = val;
                    }
                }
            }
            searchElement = searchElement.parentElement;
        }

        if (!secUid && secTargetUid) {
            secUid = secTargetUid;
        }

        return {
            nickname: nickname,
            secUid: secUid,
            userId: userId,
            targetUid: targetUid,
            secTargetUid: secTargetUid,
            webcastUid: webcastUid
        };
    }

    // 通过 API 获取直播间评论用户的 secUid
    async function fetchLiveCommentUserSecUid(targetUid, secTargetUid, webcastUid) {
        if (!targetUid && !secTargetUid && !webcastUid) return null;

        const pageUrl = window.location.href;
        const anchorIdMatch = pageUrl.match(/anchor_id=(\d+)/);
        const secAnchorIdMatch = pageUrl.match(/sec_anchor_id=([^&\s]+)/);
        const roomIdMatch = pageUrl.match(/room_id=(\d+)/);

        if (!anchorIdMatch) return null;

        const anchorId = anchorIdMatch[1];
        const secAnchorId = secAnchorIdMatch ? secAnchorIdMatch[1] : '';
        const roomId = roomIdMatch ? roomIdMatch[1] : '';

        let profileUrl = `https://live.douyin.com/webcast/user/profile/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&enter_from=web_live&cookie_enabled=true&screen_width=${window.screen.width}&screen_height=${window.screen.height}&browser_language=zh-CN&browser_platform=Win32&browser_name=Chrome&browser_version=${getBrowserVersion()}&os_name=Windows&os_version=10&anchor_id=${anchorId}&click_source=pc_pc_comment_user&msToken=${generateMsToken()}`;

        if (secAnchorId) profileUrl += `&sec_anchor_id=${secAnchorId}`;
        if (targetUid) profileUrl += `&target_uid=${targetUid}`;
        if (secTargetUid) profileUrl += `&sec_target_uid=${secTargetUid}`;
        if (webcastUid) profileUrl += `&target_webcast_uid=${webcastUid}`;
        if (roomId) profileUrl += `&current_room_id=${roomId}`;

        console.log('[抖音一键拉黑] 调用评论用户信息 API');

        try {
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
                    return data.data.user_profile.base_info.sec_uid;
                }
            }
        } catch (e) {}

        return null;
    }

    // 直播间评论用户信息缓存（点击用户名弹出资料卡时获取）
    const liveCommentUserCache = new Map();

    // 监听直播间资料卡弹窗，获取用户 secUid
    function setupLiveProfileObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;

                    // 查找资料卡弹窗（抖音直播间的用户资料卡）
                    const profileCard = node.querySelector?.('[class*="profile-card"]') ||
                                       node.querySelector?.('[class*="user-profile"]') ||
                                       node.querySelector?.('[class*="card"]') ||
                                       node.classList?.contains?.('profile-card') ||
                                       node.classList?.contains?.('user-profile');

                    if (profileCard) {
                        console.log('[抖音拉黑] 检测到资料卡弹窗');
                        // 等待弹窗内容加载
                        setTimeout(() => extractUserInfoFromProfileCard(node), 500);
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[抖音拉黑] 资料卡监听已启动');
    }

    // 从资料卡弹窗提取用户信息
    function extractUserInfoFromProfileCard(cardElement) {
        // 尝试从弹窗中获取 secUid
        const secUidMatch = cardElement.innerHTML.match(/sec_uid["\s:]+["']?([^"'&\s]+)/) ||
                           cardElement.innerHTML.match(/MS4wLj[A-Za-z0-9_-]+/);

        if (secUidMatch) {
            const secUid = secUidMatch[1] || secUidMatch[0];
            console.log('[抖音拉黑] 从资料卡获取到 secUid:', secUid);

            // 尝试获取昵称
            const nicknameEl = cardElement.querySelector('[class*="nickname"]') ||
                             cardElement.querySelector('[class*="name"]') ||
                             cardElement.querySelector('span');
            const nickname = nicknameEl?.textContent?.trim() || '';

            // 存入缓存
            if (nickname) {
                liveCommentUserCache.set(nickname, secUid);
            }
        }
    }

    // 通过用户名搜索获取用户 secUid（用于直播间评论）
    async function searchUserByNickname(nickname) {
        if (!nickname) return null;

        const pageUrl = window.location.href;
        const cookies = document.cookie.split(';');
        let msToken = generateMsToken();

        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'msToken') msToken = value;
        }

        const searchUrl = `https://www.douyin.com/aweme/v1/web/search/item/?aid=6383&app_name=douyin_web&channel=channel_pc_web&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Chrome&browser_version=147.0.0.0&os_name=Windows&os_version=10&search_source=tab_search&query=${encodeURIComponent(nickname)}&search_channel=aweme_user_fans&enable_history=1&source=normal_search&items_count=10&msToken=${msToken}&a_bogus=`;

        console.log('[抖音拉黑] 搜索用户:', nickname);

        try {
            const response = await fetch(searchUrl, {
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
                console.log('[抖音拉黑] 搜索响应');

                // 解析搜索结果获取用户 sec_uid
                if (data.data && data.data.items) {
                    for (const item of data.data.items) {
                        if (item.user_info && item.user_info.sec_uid) {
                            console.log('[抖音拉黑] 找到用户 sec_uid');
                            return item.user_info.sec_uid;
                        }
                    }
                }
            }
        } catch (e) {
            console.log('[抖音一键拉黑] 搜索用户失败:', e);
        }

        return null;
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
            console.log('[抖音拉黑] 开始' + (isUnblock ? '解除' : '拉黑') + ':', secUid);

            const blockType = isUnblock ? 1 : 0;

            // 首先尝试使用页面内部方法
            const pageMethodResult = await blockUserWithPageMethod(secUid, blockType);
            
            // 获取签名参数
            const signParams = getSignParams();
            console.log('[抖音拉黑] 签名参数');

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

            console.log('[抖音拉黑] 请求 URL');

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
            console.log('[抖音拉黑] fetch 响应');
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
                        resolve({ success: true, isBlocked: true });
                    } else {
                        showToast('拉黑失败');
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
                <svg class="icon" style="width: 1.5em;height: 1.5em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4148"><path d="M671.9488 303.3088c0-112.9472-91.904-204.8512-204.8512-204.8512S262.2464 190.3104 262.2464 303.3088c0 72.6528 38.0928 136.6016 95.2832 172.9536-123.0336 44.8512-211.1488 163.072-211.1488 301.4144 0 14.1312 11.4688 25.6 25.6 25.6s25.6-11.4688 25.6-25.6c0-148.6336 120.9344-269.5168 269.5168-269.5168 112.9472 0 204.8512-91.904 204.8512-204.8512zM467.0976 456.96c-84.736 0-153.6512-68.9152-153.6512-153.6512s68.9152-153.6512 153.6512-153.6512 153.6512 68.9152 153.6512 153.6512-68.9152 153.6512-153.6512 153.6512zM706.5088 489.6768c-101.12 0-183.4496 82.2784-183.4496 183.4496 0 101.12 82.2784 183.4496 183.4496 183.4496 101.1712 0 183.4496-82.2784 183.4496-183.4496-0.0512-101.12-82.3296-183.4496-183.4496-183.4496z m-132.2496 183.4496c0-72.9088 59.3408-132.2496 132.2496-132.2496 27.904 0 53.8112 8.704 75.1616 23.552l-188.1088 177.3568c-12.2368-20.0192-19.3024-43.52-19.3024-68.6592z m132.2496 132.2496c-29.3376 0-56.4224-9.6256-78.3872-25.8048l189.2352-178.432a131.4304 131.4304 0 0 1 21.4016 71.9872c-0.0512 72.9088-59.3408 132.2496-132.2496 132.2496z" fill="#ffffff" p-id="4149"></path></svg>
            </div>
            <span class="block-tooltip">拉黑用户</span>
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
                const tooltip = btn.querySelector('.block-tooltip');
                if (result.isBlocked) {
                    btn.dataset.blocked = 'true';
                    btn.classList.add('blocked');
                    tooltip.textContent = '已拉黑';
                    console.log('[抖音一键拉黑] 按钮状态已更新为: 已拉黑');
                } else {
                    btn.dataset.blocked = 'false';
                    btn.classList.remove('blocked');
                    tooltip.textContent = '拉黑用户';
                    console.log('[抖音一键拉黑] 按钮状态已更新为: 未拉黑');
                }
            }

            setTimeout(() => {
                btn.style.pointerEvents = 'auto';
            }, 1000);
        });

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openBlockSettings();
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
        return true;
    }

    // 为评论区单个评论插入拉黑按钮
    function insertButtonForComment(commentItem) {
        if (commentItem.querySelector('.douyin-comment-block-btn')) {
            console.log('[抖音一键拉黑] 评论已存在拉黑按钮，跳过');
            return false;
        }

        // 尝试多种方式查找更多按钮的位置
        const moreBtnSelectors = [
            '.aVT9D1a8',
            '[data-e2e="comment-more"]',
            '.comment-more',
            'button[class*="more"]',
            'svg[class*="more"]',
            '.comment-action'
        ];

        let moreBtn = null;
        for (const selector of moreBtnSelectors) {
            moreBtn = commentItem.querySelector(selector);
            if (moreBtn) break;
        }

        const commentInfo = getCommentAuthorInfo(commentItem);
        if (!commentInfo || !commentInfo.secUid) {
            console.log('[抖音一键拉黑] 无法获取评论作者信息:', commentInfo);
            return false;
        }

        console.log('[抖音一键拉黑] 准备插入评论区按钮，用户信息:', commentInfo);

        const blockBtn = createCommentBlockButton(commentItem, commentInfo);

        if (moreBtn && moreBtn.parentElement) {
            moreBtn.parentElement.insertBefore(blockBtn, moreBtn);
            console.log('[抖音一键拉黑] 评论区按钮已插入到更多按钮前');
        } else {
            // 如果没有找到更多按钮，直接添加到评论项末尾
            commentItem.appendChild(blockBtn);
            console.log('[抖音一键拉黑] 评论区按钮已添加到评论项末尾');
        }
        return true;
    }

    // 获取评论区作者信息
    function getCommentAuthorInfo(commentItem) {
        // 尝试多种选择器查找用户链接
        const userLinkSelectors = [
            'a[href*="/user/"]',
            'a[href*="MS4wLj"]',
            '[data-e2e="comment-username"] a',
            '.comment-username a',
            'a[class*="user"]',
            'a[class*="author"]'
        ];

        let authorLink = null;
        for (const selector of userLinkSelectors) {
            authorLink = commentItem.querySelector(selector);
            if (authorLink) {
                console.log('[抖音一键拉黑] 找到用户链接，选择器:', selector);
                break;
            }
        }

        if (authorLink) {
            const href = authorLink.getAttribute('href');
            console.log('[抖音一键拉黑] 用户链接href:', href);
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

                console.log('[抖音一键拉黑] 成功获取评论作者信息:', result);
                return result;
            } else {
                console.log('[抖音一键拉黑] 无法从href匹配secUid:', href);
            }
        } else {
            console.log('[抖音一键拉黑] 未找到用户链接，评论HTML:', commentItem.innerHTML.substring(0, 200));
        }
        return null;
    }

    // 创建评论区拉黑按钮
    function createCommentBlockButton(commentItem, authorInfo) {
        const btn = document.createElement('div');
        btn.className = 'douyin-comment-block-btn';
        btn.dataset.blocked = 'false';
        btn.title = '拉黑用户';
        btn.innerHTML = `
            <div class="block-icon">
                <svg class="icon" style="width: 1.5em;height: 1.5em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4148"><path d="M671.9488 303.3088c0-112.9472-91.904-204.8512-204.8512-204.8512S262.2464 190.3104 262.2464 303.3088c0 72.6528 38.0928 136.6016 95.2832 172.9536-123.0336 44.8512-211.1488 163.072-211.1488 301.4144 0 14.1312 11.4688 25.6 25.6 25.6s25.6-11.4688 25.6-25.6c0-148.6336 120.9344-269.5168 269.5168-269.5168 112.9472 0 204.8512-91.904 204.8512-204.8512zM467.0976 456.96c-84.736 0-153.6512-68.9152-153.6512-153.6512s68.9152-153.6512 153.6512-153.6512 153.6512 68.9152 153.6512 153.6512-68.9152 153.6512-153.6512 153.6512zM706.5088 489.6768c-101.12 0-183.4496 82.2784-183.4496 183.4496 0 101.12 82.2784 183.4496 183.4496 183.4496 101.1712 0 183.4496-82.2784 183.4496-183.4496-0.0512-101.12-82.3296-183.4496-183.4496-183.4496z m-132.2496 183.4496c0-72.9088 59.3408-132.2496 132.2496-132.2496 27.904 0 53.8112 8.704 75.1616 23.552l-188.1088 177.3568c-12.2368-20.0192-19.3024-43.52-19.3024-68.6592z m132.2496 132.2496c-29.3376 0-56.4224-9.6256-78.3872-25.8048l189.2352-178.432a131.4304 131.4304 0 0 1 21.4016 71.9872c-0.0512 72.9088-59.3408 132.2496-132.2496 132.2496z" fill="#ffffff" p-id="4149"></path></svg>
            </div>
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
                    btn.title = '已拉黑';
                    showToast('已拉黑该用户');
                } else {
                    btn.dataset.blocked = 'false';
                    btn.classList.remove('blocked');
                    btn.title = '拉黑用户';
                    showToast('已解除拉黑');
                }
            }

            setTimeout(() => {
                btn.style.pointerEvents = 'auto';
            }, 1000);
        });

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openBlockSettings();
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
        console.log('[抖音一键拉黑] 开始查找评论区...');

        // 支持多种评论区选择器
        const selectors = [
            '.UuCzPLbi[data-e2e="comment-item"]',
            '[data-e2e="comment-item"]',
            '.comment-mainContent',
            '.comment-item',
            '[class*="comment"] [class*="item"]',
            '[class*="Comment"]',
            '.comment',
            '.comment-content',
            '[data-e2e="comment-list"] > div > div',
            '.B6JkCp0k',
            '.lC6iS6P0'
        ];

        let commentItems = [];
        let usedSelector = '';
        for (const selector of selectors) {
            try {
                commentItems = document.querySelectorAll(selector);
                if (commentItems.length > 0) {
                    usedSelector = selector;
                    console.log('[抖音一键拉黑] 使用评论区选择器:', selector, '找到', commentItems.length, '条评论');
                    break;
                }
            } catch (e) {
                console.log('[抖音一键拉黑] 选择器错误:', selector, e.message);
            }
        }

        if (commentItems.length === 0) {
            console.log('[抖音一键拉黑] 未找到任何评论区元素');
            return 0;
        }

        let insertedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < commentItems.length; i++) {
            const item = commentItems[i];
            const result = insertButtonForComment(item);
            if (result === true) {
                insertedCount++;
            } else if (result === false) {
                // 检查是否因为按钮已存在
                if (item.querySelector('.douyin-comment-block-btn')) {
                    skippedCount++;
                } else {
                    failedCount++;
                }
            }
        }

        console.log('[抖音一键拉黑] 评论区处理完成: 插入', insertedCount, '个, 跳过', skippedCount, '个, 失败', failedCount, '个');

        return insertedCount;
    }

    // 为视频详情页面插入拉黑按钮
    function insertButtonForVideoDetailPage() {
        if (!isVideoDetailPage()) {
            return 0;
        }
        
        const authorInfo = getAuthorInfoFromVideoDetailPage();
        if (!authorInfo || !authorInfo.secUid) {
            return 0;
        }

        return insertVideoDetailBlockButton(authorInfo);
    }

    // 视频详情页插入拉黑按钮
    function insertVideoDetailBlockButton(authorInfo) {
        const existingBtn = document.querySelector('.douyin-video-detail-block-btn');
        if (existingBtn) {
            return 0;
        }

        const btn = document.createElement('div');
        btn.className = 'douyin-video-detail-block-btn';
        btn.dataset.blocked = 'false';
        btn.title = '拉黑用户';
        btn.innerHTML = `
            <div class="block-icon">
                <svg class="icon" style="width: 1em;height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4148"><path d="M671.9488 303.3088c0-112.9472-91.904-204.8512-204.8512-204.8512S262.2464 190.3104 262.2464 303.3088c0 72.6528 38.0928 136.6016 95.2832 172.9536-123.0336 44.8512-211.1488 163.072-211.1488 301.4144 0 14.1312 11.4688 25.6 25.6 25.6s25.6-11.4688 25.6-25.6c0-148.6336 120.9344-269.5168 269.5168-269.5168 112.9472 0 204.8512-91.904 204.8512-204.8512zM467.0976 456.96c-84.736 0-153.6512-68.9152-153.6512-153.6512s68.9152-153.6512 153.6512-153.6512 153.6512 68.9152 153.6512 153.6512-68.9152 153.6512-153.6512 153.6512zM706.5088 489.6768c-101.12 0-183.4496 82.2784-183.4496 183.4496 0 101.12 82.2784 183.4496 183.4496 183.4496 101.1712 0 183.4496-82.2784 183.4496-183.4496-0.0512-101.12-82.3296-183.4496-183.4496-183.4496z m-132.2496 183.4496c0-72.9088 59.3408-132.2496 132.2496-132.2496 27.904 0 53.8112 8.704 75.1616 23.552l-188.1088 177.3568c-12.2368-20.0192-19.3024-43.52-19.3024-68.6592z m132.2496 132.2496c-29.3376 0-56.4224-9.6256-78.3872-25.8048l189.2352-178.432a131.4304 131.4304 0 0 1 21.4016 71.9872c-0.0512 72.9088-59.3408 132.2496-132.2496 132.2496z" fill="#252424" p-id="4149"></path></svg>
            </div>
        `;

        btn.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.85);
            transition: all 0.2s;
        `;

        btn.addEventListener('mouseenter', () => {
            if (btn.dataset.blocked === 'true') {
                btn.style.color = '#ff4d6d';
            } else {
                btn.style.color = '#fff';
            }
        });

        btn.addEventListener('mouseleave', () => {
            if (btn.dataset.blocked === 'true') {
                btn.style.color = '#fe2c55';
            } else {
                btn.style.color = 'rgba(255, 255, 255, 0.85)';
            }
        });

        btn.addEventListener('click', async () => {
            btn.style.pointerEvents = 'none';
            const isCurrentlyBlocked = btn.dataset.blocked === 'true';
            const result = await blockUser(authorInfo.secUid, isCurrentlyBlocked);

            if (result.success) {
                if (result.isBlocked) {
                    btn.dataset.blocked = 'true';
                    btn.style.color = '#fe2c55';
                    btn.title = '已拉黑';
                    showToast('已拉黑该用户');
                } else {
                    btn.dataset.blocked = 'false';
                    btn.style.color = 'rgba(255, 255, 255, 0.85)';
                    btn.title = '拉黑用户';
                    showToast('已解除拉黑');
                }
            }

            setTimeout(() => {
                btn.style.pointerEvents = 'auto';
            }, 1000);
        });

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openBlockSettings();
        });

        const shareBtn = document.querySelector('.efAlTMqD') || document.querySelector('[class*="share"]') || document.querySelector('[data-e2e*="share"]');
        if (shareBtn && shareBtn.parentElement) {
            shareBtn.parentElement.insertBefore(btn, shareBtn.nextSibling);
            return 1;
        }

        const interactionArea = document.querySelector('.EHfFajzd') || document.querySelector('[class*="interaction"]');
        if (interactionArea) {
            interactionArea.appendChild(btn);
            return 1;
        }

        const videoContainer = document.querySelector('.video-detail-container') || document.querySelector('.player-container');
        if (videoContainer) {
            videoContainer.appendChild(btn);
            return 1;
        }

        return 0;
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
                <svg class="icon" style="width: 1em;height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4148"><path d="M671.9488 303.3088c0-112.9472-91.904-204.8512-204.8512-204.8512S262.2464 190.3104 262.2464 303.3088c0 72.6528 38.0928 136.6016 95.2832 172.9536-123.0336 44.8512-211.1488 163.072-211.1488 301.4144 0 14.1312 11.4688 25.6 25.6 25.6s25.6-11.4688 25.6-25.6c0-148.6336 120.9344-269.5168 269.5168-269.5168 112.9472 0 204.8512-91.904 204.8512-204.8512zM467.0976 456.96c-84.736 0-153.6512-68.9152-153.6512-153.6512s68.9152-153.6512 153.6512-153.6512 153.6512 68.9152 153.6512 153.6512-68.9152 153.6512-153.6512 153.6512zM706.5088 489.6768c-101.12 0-183.4496 82.2784-183.4496 183.4496 0 101.12 82.2784 183.4496 183.4496 183.4496 101.1712 0 183.4496-82.2784 183.4496-183.4496-0.0512-101.12-82.3296-183.4496-183.4496-183.4496z m-132.2496 183.4496c0-72.9088 59.3408-132.2496 132.2496-132.2496 27.904 0 53.8112 8.704 75.1616 23.552l-188.1088 177.3568c-12.2368-20.0192-19.3024-43.52-19.3024-68.6592z m132.2496 132.2496c-29.3376 0-56.4224-9.6256-78.3872-25.8048l189.2352-178.432a131.4304 131.4304 0 0 1 21.4016 71.9872c-0.0512 72.9088-59.3408 132.2496-132.2496 132.2496z" fill="#252424" p-id="4149"></path></svg>
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

                let secUid = userInfo.secUid;

                // 如果没有 secUid，从缓存中查找（通过资料卡获取的）
                if (!secUid && userInfo.nickname) {
                    secUid = liveCommentUserCache.get(userInfo.nickname) || null;
                }

                // 如果缓存也没有，尝试通过 API 获取
                if (!secUid && (userInfo.targetUid || userInfo.secTargetUid || userInfo.webcastUid)) {
                    showToast('正在获取用户信息...');
                    secUid = await fetchLiveCommentUserSecUid(userInfo.targetUid, userInfo.secTargetUid, userInfo.webcastUid);
                }

                if (!secUid) {
                    showToast('无法获取用户信息');
                    btn.style.pointerEvents = 'auto';
                    return;
                }

                const result = await blockUser(secUid, isCurrentlyBlocked);
                
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

            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openBlockSettings();
            });
            
            const wrapper = item.querySelector('.NkS2Invn');
            if (wrapper) {
                wrapper.prepend(btn);
                insertedCount++;
            }
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
            <svg class="icon" style="width: 1em;height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4148"><path d="M671.9488 303.3088c0-112.9472-91.904-204.8512-204.8512-204.8512S262.2464 190.3104 262.2464 303.3088c0 72.6528 38.0928 136.6016 95.2832 172.9536-123.0336 44.8512-211.1488 163.072-211.1488 301.4144 0 14.1312 11.4688 25.6 25.6 25.6s25.6-11.4688 25.6-25.6c0-148.6336 120.9344-269.5168 269.5168-269.5168 112.9472 0 204.8512-91.904 204.8512-204.8512zM467.0976 456.96c-84.736 0-153.6512-68.9152-153.6512-153.6512s68.9152-153.6512 153.6512-153.6512 153.6512 68.9152 153.6512 153.6512-68.9152 153.6512-153.6512 153.6512zM706.5088 489.6768c-101.12 0-183.4496 82.2784-183.4496 183.4496 0 101.12 82.2784 183.4496 183.4496 183.4496 101.1712 0 183.4496-82.2784 183.4496-183.4496-0.0512-101.12-82.3296-183.4496-183.4496-183.4496z m-132.2496 183.4496c0-72.9088 59.3408-132.2496 132.2496-132.2496 27.904 0 53.8112 8.704 75.1616 23.552l-188.1088 177.3568c-12.2368-20.0192-19.3024-43.52-19.3024-68.6592z m132.2496 132.2496c-29.3376 0-56.4224-9.6256-78.3872-25.8048l189.2352-178.432a131.4304 131.4304 0 0 1 21.4016 71.9872c-0.0512 72.9088-59.3408 132.2496-132.2496 132.2496z" fill="#252424" p-id="4149"></path></svg>
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

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openBlockSettings();
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
            <svg class="icon" style="width: 1em;height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4148"><path d="M671.9488 303.3088c0-112.9472-91.904-204.8512-204.8512-204.8512S262.2464 190.3104 262.2464 303.3088c0 72.6528 38.0928 136.6016 95.2832 172.9536-123.0336 44.8512-211.1488 163.072-211.1488 301.4144 0 14.1312 11.4688 25.6 25.6 25.6s25.6-11.4688 25.6-25.6c0-148.6336 120.9344-269.5168 269.5168-269.5168 112.9472 0 204.8512-91.904 204.8512-204.8512zM467.0976 456.96c-84.736 0-153.6512-68.9152-153.6512-153.6512s68.9152-153.6512 153.6512-153.6512 153.6512 68.9152 153.6512 153.6512-68.9152 153.6512-153.6512 153.6512zM706.5088 489.6768c-101.12 0-183.4496 82.2784-183.4496 183.4496 0 101.12 82.2784 183.4496 183.4496 183.4496 101.1712 0 183.4496-82.2784 183.4496-183.4496-0.0512-101.12-82.3296-183.4496-183.4496-183.4496z m-132.2496 183.4496c0-72.9088 59.3408-132.2496 132.2496-132.2496 27.904 0 53.8112 8.704 75.1616 23.552l-188.1088 177.3568c-12.2368-20.0192-19.3024-43.52-19.3024-68.6592z m132.2496 132.2496c-29.3376 0-56.4224-9.6256-78.3872-25.8048l189.2352-178.432a131.4304 131.4304 0 0 1 21.4016 71.9872c-0.0512 72.9088-59.3408 132.2496-132.2496 132.2496z" fill="#252424" p-id="4149"></path></svg>
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

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openBlockSettings();
        });

        // 插入到关注按钮旁边
        const followBtn = container.querySelector('.follow');
        if (followBtn && followBtn.parentElement) {
            followBtn.parentElement.insertBefore(btn, followBtn.nextSibling);
            return 1;
        }
        
        return 0;
    }

    // 主初始化函数
    function init() {
        console.log('[抖音拉黑] 初始化');

        // 首次立即插入
        insertButtonsForAll();
        insertButtonsForComments();

        if (isVideoDetailPage()) {
            insertButtonForVideoDetailPage();
        }

        // if (isLiveStreamPage()) {
        //     insertButtonForLiveStreamHost();
        //     insertButtonsForLiveStreamComments();
        //     setupLiveProfileObserver();
        // }

        // 推荐页直播间
        // insertButtonForRecommendLiveStream();

        // 快速同步重试机制（不依赖 MutationObserver）
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = 200;

        function quickRetry() {
            if (retryCount >= maxRetries) {
                return;
            }

            retryCount++;
            let inserted = false;

            if (insertButtonsForAll() > 0) inserted = true;
            if (insertButtonsForComments() > 0) inserted = true;
            // if (isLiveStreamPage() && insertButtonForLiveStreamHost() > 0) inserted = true;
            // if (isLiveStreamPage() && insertButtonsForLiveStreamComments() > 0) inserted = true;
            // if (insertButtonForRecommendLiveStream() > 0) inserted = true;

            setTimeout(quickRetry, retryInterval);
        }

        quickRetry();

        // 评论区定时检查机制（确保评论区按钮始终显示）
        setInterval(() => {
            const commentBtns = document.querySelectorAll('.douyin-comment-block-btn');
            const commentItems = document.querySelectorAll('[data-e2e="comment-item"], .comment-mainContent');

            // 如果找到了评论项但没有找到对应的按钮，重新插入
            if (commentItems.length > 0) {
                let missingCount = 0;
                for (const item of commentItems) {
                    if (!item.querySelector('.douyin-comment-block-btn')) {
                        missingCount++;
                    }
                }

                if (missingCount > 0) {
                    console.log('[抖音一键拉黑] 定时检查: 发现', missingCount, '条评论缺少按钮，重新插入');
                    insertButtonsForComments();
                }
            }
        }, 2000); // 每2秒检查一次
    }

    // 监听新视频加载
    function observeNewVideos() {
        console.log('[抖音一键拉黑] 开始监听新视频');

        let debounceTimer = null;
        let commentDebounceTimer = null;

        const observer = new MutationObserver((mutations) => {
            let hasNewVideo = false;
            let hasNewComment = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 检测视频区域
                            if (node.classList && node.classList.contains('zqe4B9aR') && node.classList.contains('WU6dkKao')) {
                                hasNewVideo = true;
                            }
                            else if (node.querySelector && node.querySelector('.zqe4B9aR.WU6dkKao')) {
                                hasNewVideo = true;
                            }
                            else if (node.classList && node.classList.contains('swiper-slide')) {
                                hasNewVideo = true;
                            }
                            // 检测评论区
                            else if (node.classList && (node.classList.contains('comment-mainContent') || node.classList.contains('UuCzPLbi'))) {
                                hasNewComment = true;
                            }
                            else if (node.querySelector && (node.querySelector('.comment-mainContent') || node.querySelector('[data-e2e="comment-item"]'))) {
                                hasNewComment = true;
                            }
                            else if (node.getAttribute && node.getAttribute('data-e2e') === 'comment-item') {
                                hasNewComment = true;
                            }
                            // else if (node.classList && node.classList.contains('webcast-chatroom___item')) {
                            //     hasNewVideo = true;
                            // }
                            // else if (node.querySelector && node.querySelector('.webcast-chatroom___item')) {
                            //     hasNewVideo = true;
                            // }
                        }
                    }
                }

                if (hasNewVideo && hasNewComment) break;
            }

            if (hasNewVideo) {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }

                debounceTimer = setTimeout(() => {
                    insertButtonsForAll();
                    insertButtonsForComments();

                    // if (isLiveStreamPage()) {
                    //     insertButtonForLiveStreamHost();
                    //     insertButtonsForLiveStreamComments();
                    // }

                    // insertButtonForRecommendLiveStream();
                }, 100);
            }

            // 评论区单独处理，更频繁的检查
            if (hasNewComment) {
                if (commentDebounceTimer) {
                    clearTimeout(commentDebounceTimer);
                }

                commentDebounceTimer = setTimeout(() => {
                    console.log('[抖音一键拉黑] 检测到评论区变化，插入按钮');
                    insertButtonsForComments();
                }, 50);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[抖音一键拉黑] 已启动视频加载监听');
    }

    // 键盘快捷键功能
    const STORAGE_KEY = 'douyin-block-shortcut-key';
    const STORAGE_MODIFIERS_KEY = 'douyin-block-shortcut-modifiers';
    const STORAGE_COMMENT_SHORTCUT_KEY = 'douyin-block-comment-shortcut-enabled';
    let blockShortcutKey = localStorage.getItem(STORAGE_KEY) || 'Q';
    let blockShortcutModifiers = JSON.parse(localStorage.getItem(STORAGE_MODIFIERS_KEY) || '{}');
    let commentShortcutEnabled = localStorage.getItem(STORAGE_COMMENT_SHORTCUT_KEY) !== 'false'; // 默认开启

    // 功能键映射表
    const FUNCTION_KEY_MAP = {
        'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5',
        'F6': 'F6', 'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10',
        'F11': 'F11', 'F12': 'F12',
        'DELETE': 'Delete', 'DEL': 'Delete',
        'INSERT': 'Insert', 'INS': 'Insert',
        'HOME': 'Home', 'END': 'End',
        'PAGEUP': 'PageUp', 'PAGEDOWN': 'PageDown',
        'ESCAPE': 'Escape', 'ESC': 'Escape',
        'TAB': 'Tab', 'CAPSLOCK': 'CapsLock',
        'BACKSPACE': 'Backspace',
        'ENTER': 'Enter', 'RETURN': 'Enter',
        'SPACE': ' ', 'SPACEKEY': ' ',
        'ARROWUP': 'ArrowUp', 'UP': 'ArrowUp',
        'ARROWDOWN': 'ArrowDown', 'DOWN': 'ArrowDown',
        'ARROWLEFT': 'ArrowLeft', 'LEFT': 'ArrowLeft',
        'ARROWRIGHT': 'ArrowRight', 'RIGHT': 'ArrowRight'
    };

    function isInInputMode() {
        const activeElement = document.activeElement;
        if (!activeElement) return false;
        const tagName = activeElement.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea') return true;
        if (activeElement.isContentEditable) return true;
        if (activeElement.hasAttribute('contenteditable')) return true;
        return false;
    }

    function normalizeKey(key) {
        if (!key) return '';
        const upperKey = key.toUpperCase();
        return FUNCTION_KEY_MAP[upperKey] || key.toUpperCase();
    }

    function getKeyDisplayName(key, modifiers) {
        if (!key) return '';
        const parts = [];
        if (modifiers?.ctrl) parts.push('Ctrl');
        if (modifiers?.alt) parts.push('Alt');
        if (modifiers?.shift) parts.push('Shift');
        if (modifiers?.meta) parts.push('Meta');

        let keyName = key;
        if (key === ' ') keyName = 'Space';
        parts.push(keyName);

        return parts.join('+');
    }

    function getShortcutDisplayName() {
        return getKeyDisplayName(blockShortcutKey, blockShortcutModifiers);
    }

    // 跟踪鼠标位置
    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function getFocusedBlockButton() {
        const activeElement = document.activeElement;
        if (!activeElement) return null;
        const blockBtn = activeElement.closest('.douyin-block-btn, .douyin-comment-block-btn, .douyin-video-detail-block-btn, .live-block-btn, .live-host-block-btn, .douyin-recommend-live-block-btn');
        return blockBtn;
    }

    // 获取鼠标位置下的拉黑按钮
    function getBlockButtonAtMouse() {
        // 获取鼠标位置的元素
        let element = document.elementFromPoint(mouseX, mouseY);
        if (!element) return null;

        console.log('[抖音一键拉黑] 鼠标位置元素:', element.tagName, element.className?.substring(0, 50));

        // 向上查找拉黑按钮
        let blockBtn = element.closest('.douyin-block-btn, .douyin-comment-block-btn, .douyin-video-detail-block-btn, .live-block-btn, .live-host-block-btn, .douyin-recommend-live-block-btn');

        // 如果没找到，尝试在鼠标周围小范围内查找（处理遮挡情况）
        if (!blockBtn) {
            const offsets = [
                {x: 0, y: 0},
                {x: -5, y: 0}, {x: 5, y: 0},
                {x: 0, y: -5}, {x: 0, y: 5},
                {x: -10, y: 0}, {x: 10, y: 0},
                {x: 0, y: -10}, {x: 0, y: 10}
            ];

            for (const offset of offsets) {
                const testX = mouseX + offset.x;
                const testY = mouseY + offset.y;
                const testElement = document.elementFromPoint(testX, testY);
                if (testElement) {
                    blockBtn = testElement.closest('.douyin-block-btn, .douyin-comment-block-btn, .douyin-video-detail-block-btn, .live-block-btn, .live-host-block-btn, .douyin-recommend-live-block-btn');
                    if (blockBtn) {
                        console.log('[抖音一键拉黑] 在偏移位置找到按钮:', offset);
                        break;
                    }
                }
            }
        }

        if (blockBtn) {
            console.log('[抖音一键拉黑] 找到鼠标下的按钮:', blockBtn.className);
        }

        return blockBtn;
    }

    // 检查鼠标是否在评论区区域
    function isMouseInCommentArea() {
        const element = document.elementFromPoint(mouseX, mouseY);
        if (!element) return false;

        // 检查是否在评论区容器内
        const commentArea = element.closest('[data-e2e="comment-list"], .comment-mainContent, .comment-container, [class*="comment"]');

        if (commentArea) {
            console.log('[抖音一键拉黑] 鼠标在评论区区域内');
        }

        return !!commentArea;
    }

    function triggerBlockFromShortcut() {
        // 1. 优先检查焦点所在的按钮
        const focusedBtn = getFocusedBlockButton();
        if (focusedBtn) {
            // 如果焦点在评论区按钮上，检查开关是否开启
            if (focusedBtn.classList.contains('douyin-comment-block-btn')) {
                if (!commentShortcutEnabled) {
                    return false;
                }
            }
            focusedBtn.click();
            return true;
        }

        // 2. 检查鼠标位置下的按钮（指到哪里是哪里）
        const mouseBtn = getBlockButtonAtMouse();
        if (mouseBtn) {
            // 如果是评论区按钮，检查开关
            if (mouseBtn.classList.contains('douyin-comment-block-btn')) {
                if (!commentShortcutEnabled) {
                    return false;
                }
            }
            mouseBtn.click();
            return true;
        }

        // 3. 如果开启了评论区快捷键且鼠标在评论区区域，查找鼠标位置最近的评论区按钮
        if (commentShortcutEnabled && isMouseInCommentArea()) {
            const commentBlockBtns = document.querySelectorAll('.douyin-comment-block-btn');
            if (commentBlockBtns.length > 0) {
                // 找到距离鼠标位置最近的按钮
                let closestBtn = null;
                let closestDistance = Infinity;

                for (const btn of commentBlockBtns) {
                    const rect = btn.getBoundingClientRect();
                    const btnCenterX = rect.left + rect.width / 2;
                    const btnCenterY = rect.top + rect.height / 2;
                    const distance = Math.sqrt(
                        Math.pow(mouseX - btnCenterX, 2) + Math.pow(mouseY - btnCenterY, 2)
                    );

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestBtn = btn;
                    }
                }

                if (closestBtn) {
                    console.log('[抖音一键拉黑] 点击最近的评论区按钮，距离:', closestDistance);
                    closestBtn.click();
                    return true;
                }
            }
        }

        // 4. 视频详情页
        if (isVideoDetailPage()) {
            const detailBtn = document.querySelector('.douyin-video-detail-block-btn');
            if (detailBtn) {
                detailBtn.click();
                return true;
            }
        }

        // 5. 直播间
        if (isLiveStreamPage()) {
            const hostBtn = document.querySelector('.live-host-block-btn');
            if (hostBtn) {
                hostBtn.click();
                return true;
            }
        }

        // 6. 推荐页直播间
        const recommendLiveBtn = document.querySelector('.douyin-recommend-live-block-btn');
        if (recommendLiveBtn) {
            recommendLiveBtn.click();
            return true;
        }

        // 7. 默认：首页视频作者
        const blockBtns = document.querySelectorAll('.douyin-block-btn');
        if (blockBtns.length > 0) {
            blockBtns[0].click();
            return true;
        }

        return false;
    }

    function handleShortcutKey(e) {
        const pressedKey = normalizeKey(e.key);
        const savedKey = normalizeKey(blockShortcutKey);

        // 检查修饰键是否匹配
        const modifiersMatch =
            (!!blockShortcutModifiers.ctrl === e.ctrlKey) &&
            (!!blockShortcutModifiers.alt === e.altKey) &&
            (!!blockShortcutModifiers.shift === e.shiftKey) &&
            (!!blockShortcutModifiers.meta === e.metaKey);

        if (pressedKey === savedKey && modifiersMatch) {
            if (isInInputMode()) {
                return;
            }
            e.preventDefault();
            const triggered = triggerBlockFromShortcut();
            if (triggered) {
                console.log('[抖音一键拉黑] 快捷键触发成功');
            } else {
                console.log('[抖音一键拉黑] 未找到可拉黑的用户');
            }
        }
    }

    function openBlockSettings() {
        console.log('[抖音一键拉黑] 尝试打开设置面板');

        if (document.querySelector('.douyin-block-settings-overlay')) {
            console.log('[抖音一键拉黑] 设置面板已存在');
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'douyin-block-settings-overlay';
        overlay.innerHTML = `
            <div class="douyin-block-settings-panel">
                <div class="douyin-block-settings-title">
                    <span>拉黑快捷键设置</span>
                    <span class="douyin-block-settings-close">✕</span>
                </div>
                <div class="douyin-block-settings-row">
                    <span class="douyin-block-settings-label">快捷键</span>
                    <input type="text" class="douyin-block-settings-input" id="block-shortcut-input" value="${getShortcutDisplayName()}" placeholder="按组合键">
                </div>
                <div class="douyin-block-settings-row" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #333;">
                    <span class="douyin-block-settings-label" style="flex: 1;">允许快捷键拉黑评论区用户<br><span style="font-size: 11px; color: #888;">（关闭后快捷键不会拉黑评论区用户）</span></span>
                    <label class="douyin-block-settings-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" id="comment-shortcut-toggle" ${commentShortcutEnabled ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                        <span class="douyin-block-settings-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${commentShortcutEnabled ? '#fe2c55' : '#444'}; transition: .3s; border-radius: 24px;"></span>
                    </label>
                </div>
                <div class="douyin-block-settings-hint">点击输入框后按组合键设置<br>支持: Ctrl+Q, Alt+Q, Ctrl+Alt+Q, Shift+F4 等<br>右键点击拉黑按钮可打开设置<br>按 ESC 关闭设置</div>
                <button class="douyin-block-settings-save">保存</button>
            </div>
        `;

        document.body.appendChild(overlay);
        console.log('[抖音一键拉黑] 设置面板已添加到页面');

        const input = overlay.querySelector('#block-shortcut-input');
        const closeBtn = overlay.querySelector('.douyin-block-settings-close');
        const saveBtn = overlay.querySelector('.douyin-block-settings-save');
        const commentToggle = overlay.querySelector('#comment-shortcut-toggle');
        const slider = overlay.querySelector('.douyin-block-settings-slider');

        // 临时存储当前设置
        let tempKey = blockShortcutKey;
        let tempModifiers = { ...blockShortcutModifiers };
        let tempCommentEnabled = commentShortcutEnabled;

        input.focus();
        input.select();

        // 评论区开关切换
        commentToggle.addEventListener('change', (e) => {
            tempCommentEnabled = e.target.checked;
            slider.style.backgroundColor = tempCommentEnabled ? '#fe2c55' : '#444';
        });

        closeBtn.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        saveBtn.addEventListener('click', () => {
            if (tempKey) {
                blockShortcutKey = tempKey;
                blockShortcutModifiers = tempModifiers;
                commentShortcutEnabled = tempCommentEnabled;
                localStorage.setItem(STORAGE_KEY, blockShortcutKey);
                localStorage.setItem(STORAGE_MODIFIERS_KEY, JSON.stringify(blockShortcutModifiers));
                localStorage.setItem(STORAGE_COMMENT_SHORTCUT_KEY, commentShortcutEnabled);
                showToast('设置已保存');
                overlay.remove();
            } else {
                showToast('请按组合键设置快捷键');
            }
        });

        input.addEventListener('keydown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'Enter') {
                saveBtn.click();
                return;
            }
            if (e.key === 'Escape') {
                overlay.remove();
                return;
            }

            // 获取修饰键状态
            const modifiers = {
                ctrl: e.ctrlKey,
                alt: e.altKey,
                shift: e.shiftKey,
                meta: e.metaKey
            };

            // 获取主键（排除修饰键本身）
            const normalizedKey = normalizeKey(e.key);
            const isModifierKey = ['CONTROL', 'ALT', 'SHIFT', 'META'].includes(normalizedKey);

            if (!isModifierKey && normalizedKey) {
                tempKey = normalizedKey;
                tempModifiers = modifiers;
                input.value = getKeyDisplayName(normalizedKey, modifiers);
            }
        });
    }

    document.addEventListener('keydown', handleShortcutKey);

    // 注册油猴菜单命令
    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('⚙️ 设置拉黑快捷键', openBlockSettings);
        console.log('[抖音一键拉黑] 已注册油猴菜单命令');
    }

    // 监听抖音快捷键设置面板，插入拉黑快捷键设置
    function insertBlockShortcutIntoDouyinSettings() {
        // 查找包含"键盘快捷键"文本的元素
        const allElements = document.querySelectorAll('*');
        let settingsPanel = null;

        for (const el of allElements) {
            if (el.children && el.children.length > 0) {
                for (const child of el.children) {
                    if (child.textContent && child.textContent.trim() === '键盘快捷键') {
                        // 向上查找面板容器
                        let parent = el;
                        for (let i = 0; i < 5 && parent; i++) {
                            if (parent.offsetWidth > 300 && parent.offsetHeight > 200) {
                                settingsPanel = parent;
                                break;
                            }
                            parent = parent.parentElement;
                        }
                        if (settingsPanel) break;
                    }
                }
            }
            if (settingsPanel) break;
        }

        if (!settingsPanel) return;

        // 检查是否已插入我们的设置
        if (settingsPanel.querySelector('.douyin-block-shortcut-setting')) {
            return;
        }

        // 查找"功能类"区域
        let functionSection = null;
        const allDivs = settingsPanel.querySelectorAll('div');

        for (const div of allDivs) {
            // 查找直接包含"功能类"文本的子元素
            for (const child of div.children) {
                if (child.tagName === 'DIV' && child.textContent && child.textContent.trim() === '功能类') {
                    functionSection = div;
                    break;
                }
            }
            if (functionSection) break;
        }

        if (functionSection) {
            // 创建拉黑快捷键设置行
            const settingRow = document.createElement('div');
            settingRow.className = 'douyin-block-shortcut-setting';
            settingRow.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                margin: 4px 0;
                border-radius: 8px;
                background: rgba(255,255,255,0.05);
                cursor: pointer;
                transition: background 0.2s;
            `;
            settingRow.innerHTML = `
                <span style="font-size: 14px; color: #fff;">拉黑配置</span>
                <span style="font-size: 14px; color: #fe2c55; font-weight: 500;">${getShortcutDisplayName()}</span>
            `;

            // 绑定点击事件
            settingRow.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                openBlockSettings();
            });

            // 添加到功能类区域末尾
            functionSection.appendChild(settingRow);

            console.log('[抖音一键拉黑] 已插入快捷键设置到抖音设置面板');
        }
    }

    // 使用 MutationObserver 监听设置面板的出现
    let settingsObserver = null;

    function startSettingsObserver() {
        if (settingsObserver) return;

        settingsObserver = new MutationObserver((mutations) => {
            let shouldCheck = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 检查是否是设置面板或包含设置面板
                            const text = node.textContent || '';
                            if (text.includes('键盘快捷键') && text.includes('功能类')) {
                                shouldCheck = true;
                                break;
                            }
                        }
                    }
                }
                if (shouldCheck) break;
            }

            if (shouldCheck) {
                setTimeout(insertBlockShortcutIntoDouyinSettings, 200);
            }
        });

        settingsObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 启动监听
    startSettingsObserver();

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

    console.log('[抖音一键拉黑] 脚本加载完成，当前快捷键: ' + getShortcutDisplayName() + '，右键点击拉黑按钮或在抖音设置中修改');
})();

