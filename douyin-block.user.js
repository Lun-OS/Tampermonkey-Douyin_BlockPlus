// ==UserScript==
// @name         抖音一键拉黑
// @namespace    https://github.com/Lun-OS/Tampermonkey-Douyin_BlockPlus
// @version      5.5
// @description  抖音拉黑从未如此丝滑——0.01秒接口直封，无需模拟点击，无需跳转菜单。全场景（推荐/详情/评论/直播间...）按钮自动就位，点一下瞬间屏蔽/解除，纯净体验零等待。长按快捷键批量拉黑评论区所有用户（并发数与触发时间可配置），作者评论可选择性最后拉黑。关键词自动拉黑 + 命中隐藏，拉黑记录可查看与清除。
// @author       Lun.
// @match        https://www.douyin.com/*
// @match        https://www.douyin.com/
// @match        https://www.douyin.com/video/*
// @match        https://live.douyin.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      live.douyin.com
// @grant        unsafeWindow
// @license      MIT
// @run-at       document-end
// @downloadURL https://update.greasyfork.org/scripts/575489/%E6%8A%96%E9%9F%B3%E4%B8%80%E9%94%AE%E6%8B%89%E9%BB%91.user.js
// @updateURL https://update.greasyfork.org/scripts/575489/%E6%8A%96%E9%9F%B3%E4%B8%80%E9%94%AE%E6%8B%89%E9%BB%91.meta.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('[抖音拉黑] v5.5 (关键词拉黑 + 拉黑日志版)');

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
            pointer-events: auto !important;
            z-index: 100;
            isolation: isolate;
        }
        .douyin-block-btn * {
            pointer-events: none !important;
        }
        /* 确保按钮区域完全阻挡鼠标事件 */
        .douyin-block-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: auto;
            z-index: -1;
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
            background: rgba(0, 0, 0, 0.25);
            border-color: rgba(255, 255, 255, 0.3);
        }
        .douyin-block-btn .block-icon svg {
            width: 22px;
            height: 22px;
            fill: rgba(255, 255, 255, 0.85);
            transition: all 0.2s ease;
        }
        .douyin-block-btn:hover .block-icon svg {
            fill: #fff;
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.6));
            transform: scale(1.1);
        }
        .douyin-block-btn.blocked .block-icon svg path {
            fill: #ff4444 !important;
        }
        .douyin-block-btn.blocked:hover .block-icon svg path {
            fill: #ff6666 !important;
        }
        .douyin-block-btn.blocked {
            background: rgba(255, 68, 68, 0.15) !important;
            border-radius: 50%;
        }
        .douyin-block-btn.blocked:hover {
            background: rgba(255, 68, 68, 0.25) !important;
        }
        .douyin-block-btn .block-tooltip-wrapper {
            position: absolute;
            left: -8px;
            top: 50%;
            transform: translateX(-100%) translateY(-50%);
            display: flex;
            align-items: center;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 1000;
        }
        .douyin-block-btn:hover .block-tooltip-wrapper {
            opacity: 1;
        }
        .douyin-block-btn .block-tooltip-content {
            background: rgba(37, 38, 50, 0.95);
            color: #fff;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .douyin-block-btn .block-tooltip-arrow {
            width: 7px;
            height: 24px;
            fill: rgba(37, 38, 50, 0.95);
            margin-left: -1px;
        }
        .douyin-block-btn .block-tooltip-shortcut {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 2px 6px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9);
            min-width: 18px;
            text-align: center;
        }
        .douyin-comment-block-btn {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            background: transparent;
            transition: all 0.2s;
            position: relative;
            vertical-align: middle;
            margin-left: 4px;
            flex-shrink: 0;
        }
        .douyin-comment-block-btn:hover {
            background: transparent;
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
            transition: all 0.2s ease;
        }
        .douyin-comment-block-btn:hover .block-icon svg {
            fill: #fff;
            filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.6));
            transform: scale(1.15);
        }
        .douyin-comment-block-btn.blocked .block-icon svg path {
            fill: #ff4444 !important;
        }
        .douyin-comment-block-btn.blocked:hover .block-icon svg path {
            fill: #ff6666 !important;
        }
        .douyin-comment-block-btn.blocked {
            background: rgba(255, 68, 68, 0.1) !important;
            border-radius: 4px;
        }
        .douyin-comment-block-btn.blocked:hover {
            background: rgba(255, 68, 68, 0.2) !important;
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
        /* 开关按钮 - iOS 风格，与面板整体深色融合 */
        .douyin-block-settings-switch {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 22px;
            flex-shrink: 0;
        }
        .douyin-block-settings-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .douyin-block-settings-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #2a2a2a;
            transition: .25s ease;
            border-radius: 22px;
            border: 1px solid #3a3a3a;
        }
        .douyin-block-settings-slider::before {
            content: "";
            position: absolute;
            height: 16px;
            width: 16px;
            left: 2px;
            top: 50%;
            transform: translateY(-50%);
            background-color: #6a6a6a;
            transition: .25s ease;
            border-radius: 50%;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
        }
        .douyin-block-settings-switch input:checked + .douyin-block-settings-slider {
            background-color: #3a3a3a;
            border-color: #555;
        }
        .douyin-block-settings-switch input:checked + .douyin-block-settings-slider::before {
            transform: translateY(-50%) translateX(18px);
            background-color: #e0e0e0;
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
        /* 360浏览器兼容性样式 */
        .douyin-comment-block-btn {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        .douyin-comment-block-btn * {
            pointer-events: none;
        }
        /* 确保按钮在各种主题下可见 */
        @media (prefers-color-scheme: dark) {
            .douyin-comment-block-btn .block-icon svg {
                fill: #a0a0a0;
            }
        }
        /* 批量拉黑状态指示器 - 深色磨砂风格（与设置面板一致） */
        #douyin-batch-block-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(28, 28, 30, 0.96);
            color: #e8e8e8;
            padding: 14px 20px;
            border-radius: 12px;
            font-size: 13px;
            z-index: 99999;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.25);
            display: none;
            line-height: 1.55;
            min-width: 220px;
            border: 1px solid #333;
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            animation: batchIndicatorSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes batchIndicatorSlideIn {
            from { transform: translateX(40px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        #douyin-batch-block-indicator .batch-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 6px;
            color: #f5f5f5;
        }
        #douyin-batch-block-indicator .batch-pulse-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #b8b8b8;
            box-shadow: 0 0 0 0 rgba(184, 184, 184, 0.7);
            animation: batchPulse 1.4s infinite;
        }
        @keyframes batchPulse {
            0% { box-shadow: 0 0 0 0 rgba(184, 184, 184, 0.7); }
            70% { box-shadow: 0 0 0 8px rgba(184, 184, 184, 0); }
            100% { box-shadow: 0 0 0 0 rgba(184, 184, 184, 0); }
        }
        #douyin-batch-block-indicator .batch-stats {
            display: flex;
            gap: 14px;
            font-size: 12px;
            opacity: 0.95;
            padding-top: 6px;
            border-top: 1px solid #333;
            margin-top: 4px;
            color: #cfcfcf;
        }
        #douyin-batch-block-indicator .batch-count {
            font-weight: 700;
            font-size: 15px;
            color: #ffffff;
        }
        #douyin-batch-block-indicator .batch-phase {
            font-size: 11px;
            opacity: 0.7;
            margin-top: 2px;
            color: #aaaaaa;
        }
        /* 评论区按钮的"批量已拉黑"过渡动画 */
        @keyframes batchBlockedFade {
            0% { transform: scale(1); }
            50% { transform: scale(1.25); }
            100% { transform: scale(1); }
        }
        .douyin-comment-block-btn.batch-just-blocked {
            animation: batchBlockedFade 0.4s ease;
        }
        /* 拉黑日志页专用样式 */
        .douyin-block-log-list::-webkit-scrollbar { width: 6px; }
        .douyin-block-log-list::-webkit-scrollbar-track { background: #1a1a1a; }
        .douyin-block-log-list::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
        .douyin-block-log-list::-webkit-scrollbar-thumb:hover { background: #666; }
        .douyin-block-log-item a:hover { color: #ccc !important; text-decoration: underline !important; }
        .log-remove-btn:hover { background: #333 !important; color: #fff !important; border-color: #888 !important; }
        .log-unblock-btn:hover { background: #333 !important; color: #fff !important; border-color: #888 !important; }
        .log-unblock-btn:disabled { opacity: 0.5; cursor: not-allowed !important; }
        /* 屏蔽词输入框聚焦样式 */
        #block-words-input:focus { outline: none; border-color: #5a5a5a; }
        /* 弹幕拉黑按钮 */
        .douyin-danmu-block-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 0 2px;
            border-radius: 3px;
            background: rgba(0,0,0,0.4);
            transition: all 0.2s;
            margin-left: 4px;
            vertical-align: middle;
            line-height: 1;
        }
        .douyin-danmu-block-btn:hover {
            background: rgba(0,0,0,0.7);
            transform: scale(1.15);
        }
        .douyin-danmu-block-btn svg { display: block; }
    `);

    // 显示提示
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'douyin-block-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // 从按钮所在容器获取视频作者信息 - 增强版（360浏览器兼容性优化）
    function getVideoAuthorInfoFromContainer(container) {
        console.log('[抖音一键拉黑] 开始从容器获取视频作者信息...');

        // 检测是否是直播卡片
        const liveRoomId = container.getAttribute('data-live-room-id');
        if (liveRoomId) {
            console.log('[抖音一键拉黑] 检测到直播卡片，room_id:', liveRoomId);

            // 搜索范围：从容器向上遍历到 feed-item 级别
            const searchRoots = [container];
            let ancestor = container.parentElement;
            for (let i = 0; i < 10 && ancestor; i++) {
                searchRoots.push(ancestor);
                if (ancestor.hasAttribute('data-e2e') && ancestor.getAttribute('data-e2e') === 'feed-item') {
                    break;
                }
                ancestor = ancestor.parentElement;
            }

            // 在多层容器中搜索 user 链接
            for (const root of searchRoots) {
                const userLink = root.querySelector('a[href*="/user/MS4wLj"]');
                if (userLink) {
                    const href = userLink.getAttribute('href') || '';
                    const secUidMatch = href.match(/MS4wLj[A-Za-z0-9_\-]{15,}/);
                    if (secUidMatch) {
                        console.log('[抖音一键拉黑] 从直播卡片user链接提取到sec_uid:', secUidMatch[0]);
                        return { isLiveCard: true, liveRoomId: liveRoomId, secUid: secUidMatch[0] };
                    }
                }
            }

            // 尝试更宽泛的搜索：查找任何包含 MS4wLj 的链接
            for (const root of searchRoots) {
                const allLinks = root.querySelectorAll('a');
                for (const link of allLinks) {
                    const href = link.getAttribute('href') || '';
                    const secUidMatch = href.match(/MS4wLj[A-Za-z0-9_\-]{15,}/);
                    if (secUidMatch) {
                        console.log('[抖音一键拉黑] 从直播卡片遍历链接提取到sec_uid:', secUidMatch[0]);
                        return { isLiveCard: true, liveRoomId: liveRoomId, secUid: secUidMatch[0] };
                    }
                }
            }

            console.log('[抖音一键拉黑] 直播卡片无法从DOM提取sec_uid，将依赖API');
            return { isLiveCard: true, liveRoomId: liveRoomId, secUid: null };
        }

        // 第一层：标准用户链接选择器
        let authorLink = container.querySelector('a[href*="/user/"]');
        let foundMethod = '标准选择器';

        // 第二层：如果没找到，尝试直播头像框结构中的链接
        if (!authorLink) {
            const liveAvatarWrapper = container.querySelector('.HptCz35d');
            if (liveAvatarWrapper) {
                authorLink = liveAvatarWrapper.querySelector('a[href*="/user/"]');
                if (authorLink) foundMethod = '直播头像框';

                // 如果还是没找到，尝试查找任何包含 user 链接的 a 标签
                if (!authorLink) {
                    const allLinks = liveAvatarWrapper.querySelectorAll('a');
                    for (const link of allLinks) {
                        const href = link.getAttribute('href') || '';
                        if (href.includes('/user/') || href.includes('MS4wLj')) {
                            authorLink = link;
                            foundMethod = '直播头像框内遍历';
                            break;
                        }
                    }
                }
            }
        }

        // 第三层：通过头像图片查找用户链接
        if (!authorLink) {
            const avatarSelectors = [
                'img[src*="douyinpic.com"]',
                'img[alt*="头像"]',
                '[class*="avatar"] img',
                '.semi-avatar img'
            ];

            for (const selector of avatarSelectors) {
                const avatarImg = container.querySelector(selector);
                if (avatarImg) {
                    // 向上查找包含用户链接的父元素
                    let parent = avatarImg.parentElement;
                    for (let i = 0; i < 5 && parent; i++) {
                        const link = parent.querySelector('a[href*="/user/"]');
                        if (link) {
                            authorLink = link;
                            foundMethod = '头像图片关联';
                            break;
                        }
                        parent = parent.parentElement;
                    }
                    if (authorLink) break;
                }
            }
        }

        // 第四层：遍历容器内所有链接
        if (!authorLink) {
            const allLinks = container.querySelectorAll('a');
            for (const link of allLinks) {
                const href = link.getAttribute('href') || '';
                if (href.includes('/user/') || href.includes('MS4wLj')) {
                    authorLink = link;
                    foundMethod = '容器内遍历';
                    break;
                }
            }
        }

        // 第五层：从data属性获取
        if (!authorLink) {
            const dataSecUid = container.getAttribute('data-sec-uid') ||
                              container.getAttribute('data-user-sec-uid');
            if (dataSecUid && dataSecUid.includes('MS4wLj')) {
                console.log('[抖音一键拉黑] 从容器data属性获取到secUid:', dataSecUid);
                return { secUid: dataSecUid };
            }

            // 查找子元素中的data属性
            const elementsWithData = container.querySelectorAll('[data-sec-uid], [data-user-sec-uid]');
            for (const el of elementsWithData) {
                const secUid = el.getAttribute('data-sec-uid') || el.getAttribute('data-user-sec-uid');
                if (secUid && secUid.includes('MS4wLj')) {
                    console.log('[抖音一键拉黑] 从子元素data属性获取到secUid:', secUid);
                    return { secUid: secUid };
                }
            }
        }

        // 处理找到的用户链接
        if (authorLink) {
            const href = authorLink.getAttribute('href') || '';
            console.log('[抖音一键拉黑] 找到用户链接，方式:', foundMethod, 'href:', href);

            // 尝试多种方式提取secUid
            let secUid = null;

            // 方式1：标准匹配
            const match = href.match(/\/user\/([^?\s]+)/);
            if (match) {
                secUid = match[1];
            }

            // 方式2：直接匹配MS4wLj
            if (!secUid) {
                const msMatch = href.match(/(MS4wLj[A-Za-z0-9_-]+)/);
                if (msMatch) {
                    secUid = msMatch[1];
                }
            }

            if (secUid) {
                const result = { secUid: secUid };

                // 尝试获取userId
                const uidMatch = href.match(/uid=(\d+)/);
                if (uidMatch) {
                    result.userId = uidMatch[1];
                }

                // 从data属性获取
                const userIdAttr = container.querySelector('[data-user-id]');
                if (userIdAttr) {
                    result.userId = userIdAttr.getAttribute('data-user-id');
                }

                // 从当前元素获取
                if (!result.userId) {
                    result.userId = container.getAttribute('data-user-id');
                }

                // 遍历获取
                if (!result.userId) {
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

                console.log('[抖音拉黑] 用户信息:', result, '获取方式:', foundMethod);
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
                let profileUrl = `https://live.douyin.com/webcast/user/profile/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&enter_from=web_live&cookie_enabled=true&screen_width=${window.screen.width}&screen_height=${window.screen.height}&browser_language=${navigator.language||'zh-CN'}&browser_platform=${navigator.platform||'Win32'}&browser_name=${(()=>{const ua=navigator.userAgent;return ua.includes('Edg/')?'Edge':ua.includes('OPR/')||ua.includes('Opera')?'Opera':ua.includes('Chrome/')?'Chrome':ua.includes('Safari/')?'Safari':ua.includes('Firefox/')?'Firefox':'Chrome'})()}&browser_version=${getBrowserVersion()}&os_name=${(()=>{const ua=navigator.userAgent;return ua.includes('Windows')?'Windows':ua.includes('Mac OS')||ua.includes('Macintosh')?'Mac':ua.includes('Linux')?'Linux':'Windows'})()}&os_version=${(()=>{const ua=navigator.userAgent;const wm=ua.match(/Windows NT (\d+\.\d+)/);if(wm)return parseFloat(wm[1])>10?'11':'10';const mm=ua.match(/Mac OS X (\d+[._]\d+)/);if(mm)return mm[1].replace(/_/g,'.');return'10'})()}&anchor_id=${anchorId}&click_source=pc_pc_comment_user&msToken=${generateMsToken()}`;

                if (secAnchorId) {
                    profileUrl += `&sec_anchor_id=${secAnchorId}`;
                }

                const response = await fetch(profileUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Accept-Language': navigator.language || 'zh-CN',
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

    // ========== 直播间评论用户ID获取（WebSocket拦截 + React Fiber方案）==========

    // 直播间评论用户信息缓存：nickname → {secUid, userId}
    const liveCommentUserMap = new Map();
    let wsInterceptorInstalled = false;

    // 从 React Fiber 节点中提取用户信息
    function extractUserFromFiber(domElement) {
        const fiberKey = Object.keys(domElement).find(k =>
            k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
        );
        if (!fiberKey) return null;

        let node = domElement[fiberKey];
        let depth = 0;
        while (node && depth < 20) {
            const props = node.memoizedProps || node.pendingProps || {};
            if (props.user || props.userInfo || props.msg || props.message) {
                const u = props.user || props.userInfo || (props.msg && props.msg.user) || (props.message && props.message.user);
                if (u) {
                    const secUid = u.sec_uid || u.secUid || u.sec_uid_str || u.secUidStr;
                    const uid = u.uid || u.user_id || u.userId || u.id || u.id_str || u.idStr;
                    const nick = u.nickname || u.nick_name || u.nickName || u.name;
                    if (secUid && nick) {
                        liveCommentUserMap.set(nick, { secUid: secUid, userId: uid || null });
                        return { nickname: nick, secUid: secUid, userId: uid || null };
                    }
                }
            }
            // 检查直接挂在props上的uid/sec_uid
            if (props.secUid || props.sec_uid || props.uid) {
                const secUid = props.secUid || props.sec_uid;
                const uid = props.uid || props.userId || props.user_id;
                const nick = props.nickname || props.nickName || props.name;
                if (secUid && nick) {
                    liveCommentUserMap.set(nick, { secUid: secUid, userId: uid || null });
                    return { nickname: nick, secUid: secUid, userId: uid || null };
                }
            }
            // 递归检查children
            if (props.children) {
                const children = Array.isArray(props.children) ? props.children : [props.children];
                for (const child of children) {
                    if (child && child.props) {
                        const result = extractUserFromChildProps(child);
                        if (result) return result;
                    }
                }
            }
            node = node.return;
            depth++;
        }
        return null;
    }

    function extractUserFromChildProps(child) {
        const p = child.props || {};
        const u = p.user || p.userInfo;
        if (u) {
            const secUid = u.sec_uid || u.secUid;
            const uid = u.uid || u.user_id || u.userId || u.id;
            const nick = u.nickname || u.nick_name || u.name;
            if (secUid && nick) {
                liveCommentUserMap.set(nick, { secUid: secUid, userId: uid || null });
                return { nickname: nick, secUid: secUid, userId: uid || null };
            }
        }
        return null;
    }

    // 从WebSocket消息中提取用户信息（protobuf文本提取）
    function processWebSocketMessage(data) {
        let rawStr = '';
        try {
            if (typeof data === 'string') {
                rawStr = data;
            } else if (data instanceof ArrayBuffer) {
                const bytes = new Uint8Array(data);
                for (let i = 0; i < bytes.length; i++) {
                    const b = bytes[i];
                    if (b >= 0x20 && b <= 0x7e || b >= 0x80) {
                        rawStr += String.fromCharCode(b);
                    }
                }
            } else if (data instanceof Uint8Array) {
                for (let i = 0; i < data.length; i++) {
                    const b = data[i];
                    if (b >= 0x20 && b <= 0x7e || b >= 0x80) {
                        rawStr += String.fromCharCode(b);
                    }
                }
            } else {
                rawStr = String(data);
            }
        } catch (e) { return; }

        // 查找sec_uid模式
        const secUidMatches = [];
        const secUidRegex = /MS4wLj[A-Za-z0-9_\-]{15,}/g;
        let secMatch;
        while ((secMatch = secUidRegex.exec(rawStr)) !== null) {
            secUidMatches.push({ value: secMatch[0], idx: secMatch.index });
        }

        // 查找数字user_id
        const userIdMatches = [];
        const uidRegex = /\b(\d{8,15})\b/g;
        let uidMatch;
        while ((uidMatch = uidRegex.exec(rawStr)) !== null) {
            userIdMatches.push({ value: uidMatch[1], idx: uidMatch.index });
        }

        if (secUidMatches.length === 0) return;

        // 尝试查找昵称：sec_uid附近的非ASCII文本
        for (const su of secUidMatches) {
            const nearby = rawStr.substring(Math.max(0, su.idx - 60), Math.min(rawStr.length, su.idx + 100));
            const nickMatch = nearby.match(/[\u4e00-\u9fff][\u4e00-\u9fff\w_\-.]{0,20}/);
            const nick = nickMatch ? nickMatch[0] : null;

            // 找最近的userId
            let closestUid = null;
            let closestDist = Infinity;
            for (const um of userIdMatches) {
                const dist = Math.abs(um.idx - su.idx);
                if (dist < closestDist && dist < 300) {
                    closestDist = dist;
                    closestUid = um.value;
                }
            }

            if (nick) {
                if (!liveCommentUserMap.has(nick)) {
                    liveCommentUserMap.set(nick, { secUid: su.value, userId: closestUid });
                }
            } else if (closestUid) {
                liveCommentUserMap.set('uid_' + closestUid, { secUid: su.value, userId: closestUid });
            }
        }

        // 尝试JSON解析
        try {
            const json = JSON.parse(rawStr);
            extractUserFromJSON(json);
        } catch (e) {}
    }

    function extractUserFromJSON(obj) {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
            obj.forEach(v => extractUserFromJSON(v));
            return;
        }
        const secUid = obj.sec_uid || obj.secUid || obj.secUserId || obj.sec_uid_str;
        const uid = obj.user_id || obj.userId || obj.id || obj.id_str;
        const nick = obj.nickname || obj.nick_name || obj.nickName || obj.name;
        if (secUid && nick) {
            liveCommentUserMap.set(nick, { secUid: secUid, userId: uid || null });
        }
        Object.values(obj).forEach(v => {
            if (typeof v === 'object' && v !== null) extractUserFromJSON(v);
        });
    }

    // WebSocket拦截器
    function setupWebSocketInterceptor() {
        if (wsInterceptorInstalled) return;
        wsInterceptorInstalled = true;

        const win = unsafeWindow || window;
        const OriginalWebSocket = win.WebSocket;

        function WebSocketProxy(url, protocols) {
            const isWebcast = typeof url === 'string' && (
                url.includes('webcast') || url.includes('push') || url.includes('douyin')
            );
            const ws = protocols ?
                new OriginalWebSocket(url, protocols) :
                new OriginalWebSocket(url);

            if (isWebcast) {
                console.log('[抖音拉黑] 拦截到直播WebSocket:', url.substring(0, 100));

                ws.addEventListener('message', function(event) {
                    processWebSocketMessage(event.data);
                });
            }

            return ws;
        }
        WebSocketProxy.prototype = OriginalWebSocket.prototype;
        WebSocketProxy.CONNECTING = OriginalWebSocket.CONNECTING;
        WebSocketProxy.OPEN = OriginalWebSocket.OPEN;
        WebSocketProxy.CLOSING = OriginalWebSocket.CLOSING;
        WebSocketProxy.CLOSED = OriginalWebSocket.CLOSED;

        win.WebSocket = WebSocketProxy;

        console.log('[抖音拉黑] WebSocket拦截器已启动');
    }

    // 获取直播间评论用户信息
    function getLiveStreamUserInfo(commentElement) {
        // 1. 提取昵称元素（按已知DOM结构：.NkS2Invn > .v8LY0gZF）
        const nicknameSelectors = [
            '.v8LY0gZF',                          // 抖音直播间昵称专用类
            '.NkS2Invn span[class]',              // 昵称容器内的classed span
            '[class*="nickname"]',
            '[class*="nick"]',
            'a[href*="/user/"]',
        ];
        let nicknameEl = null;
        for (const sel of nicknameSelectors) {
            try { nicknameEl = commentElement.querySelector(sel); } catch (e) { continue; }
            if (nicknameEl) break;
        }

        // 兜底：找 .NkS2Invn 内部第一个含文本的 span
        if (!nicknameEl) {
            const nkContainer = commentElement.querySelector('.NkS2Invn');
            if (nkContainer) {
                const spans = nkContainer.querySelectorAll('span');
                for (const s of spans) {
                    const txt = s.textContent.trim();
                    if (txt.length >= 2 && txt.length <= 30 && !txt.startsWith('<')) {
                        nicknameEl = s;
                        break;
                    }
                }
            }
        }

        if (!nicknameEl) return null;

        // 提取纯昵称（去掉尾部的冒号和空白）
        let nickname = nicknameEl.textContent.replace(/[：:]\s*$/, '').trim();

        // 如果昵称还包含消息内容（兜底场景：nicknameEl拿到了整个消息外层），截取冒号前部分
        const colonIdx = nickname.indexOf('：');
        if (colonIdx === -1) {
            const colonIdx2 = nickname.indexOf(':');
            if (colonIdx2 > 0 && colonIdx2 < 20) {
                nickname = nickname.substring(0, colonIdx2).trim();
            }
        } else if (colonIdx > 0 && colonIdx < 20) {
            nickname = nickname.substring(0, colonIdx).trim();
        }

        // 限制昵称长度合理性
        if (nickname.length < 2 || nickname.length > 30) return null;

        // 2. 先从WebSocket缓存中查找
        let cached = liveCommentUserMap.get(nickname);
        if (cached && cached.secUid) {
            return { nickname: nickname, secUid: cached.secUid, userId: cached.userId };
        }

        // 3. 尝试React Fiber提取
        const fiberResult = extractUserFromFiber(nicknameEl);
        if (fiberResult && fiberResult.secUid) {
            return fiberResult;
        }

        // 4. 尝试从data-*属性提取 sec_uid 模式
        let walkEl = commentElement;
        for (let i = 0; i < 12 && walkEl; i++) {
            if (walkEl.attributes) {
                for (const attr of walkEl.attributes) {
                    const val = attr.value || '';
                    if (val.startsWith('MS4wLj') && val.length > 20) {
                        return { nickname: nickname, secUid: val, userId: null };
                    }
                }
            }
            walkEl = walkEl.parentElement;
        }

        // 5. 只有昵称，secUid等WS缓存或API异步补充
        return { nickname: nickname, secUid: null, userId: null };
    }

    // 延迟获取secUid的异步包装
    async function getLiveCommentSecUid(nickname) {
        let cached = liveCommentUserMap.get(nickname);
        if (cached && cached.secUid) return cached.secUid;

        const pageUrl = window.location.href;
        const anchorIdMatch = pageUrl.match(/anchor_id=(\d+)/);
        if (!anchorIdMatch) return null;

        const anchorId = anchorIdMatch[1];
        const profileUrl = `https://live.douyin.com/webcast/user/profile/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&enter_from=web_live&cookie_enabled=true&screen_width=${window.screen.width}&screen_height=${window.screen.height}&browser_language=${navigator.language||'zh-CN'}&browser_platform=${navigator.platform||'Win32'}&browser_name=${(()=>{const ua=navigator.userAgent;return ua.includes('Edg/')?'Edge':ua.includes('OPR/')||ua.includes('Opera')?'Opera':ua.includes('Chrome/')?'Chrome':ua.includes('Safari/')?'Safari':ua.includes('Firefox/')?'Firefox':'Chrome'})()}&browser_version=${getBrowserVersion()}&os_name=${(()=>{const ua=navigator.userAgent;return ua.includes('Windows')?'Windows':ua.includes('Mac OS')||ua.includes('Macintosh')?'Mac':ua.includes('Linux')?'Linux':'Windows'})()}&os_version=${(()=>{const ua=navigator.userAgent;const wm=ua.match(/Windows NT (\d+\.\d+)/);if(wm)return parseFloat(wm[1])>10?'11':'10';const mm=ua.match(/Mac OS X (\d+[._]\d+)/);if(mm)return mm[1].replace(/_/g,'.');return'10'})()}&anchor_id=${anchorId}&click_source=pc_pc_comment_user&msToken=${generateMsToken()}`;

        try {
            const response = await fetch(profileUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': navigator.language || 'zh-CN',
                    'Referer': pageUrl
                },
                credentials: 'include'
            });
            if (response.ok) {
                const data = JSON.parse(await response.text());
                if (data.data && data.data.user_profile && data.data.user_profile.base_info) {
                    const secUid = data.data.user_profile.base_info.sec_uid;
                    const uid = data.data.user_profile.base_info.uid;
                    if (secUid) {
                        liveCommentUserMap.set(nickname, { secUid: secUid, userId: uid || null });
                        return secUid;
                    }
                }
            }
        } catch (e) {}

        return null;
    }

    // 判断推荐页卡片是否是直播卡片
    function isLiveStreamCard(container) {
        const avatarLink = container.querySelector('a[data-e2e="video-avatar"], a[href*="live.douyin.com"]');
        if (!avatarLink) return false;
        const href = avatarLink.getAttribute('href') || '';
        if (href.includes('live.douyin.com')) return true;
        const liveIcon = container.querySelector('.HoSMor44, img[alt="LiveIcon"], img[src*="avatar-live"]');
        return !!liveIcon;
    }

    // 从直播卡片中提取 room_id
    function extractRoomIdFromLiveCard(container) {
        const avatarLink = container.querySelector('a[href*="live.douyin.com"]');
        if (!avatarLink) return null;
        const href = avatarLink.getAttribute('href') || '';
        const roomIdMatch = href.match(/room_id=(\d+)/);
        if (roomIdMatch) return roomIdMatch[1];
        const pathMatch = href.match(/live\.douyin\.com\/(\d+)/);
        if (pathMatch) return pathMatch[1];
        return null;
    }

    // 通过直播间 room_id 获取用户 sec_uid（调用 webcast/room/web/enter 接口）
    async function fetchUserInfoFromLiveRoom(roomId) {
        if (!roomId) {
            console.log('[抖音一键拉黑] 直播房间ID为空，无法获取用户信息');
            return null;
        }

        console.log('[抖音一键拉黑] 正在通过直播间ID获取用户信息:', roomId);

        const msToken = generateMsToken();
        const params = new URLSearchParams();
        params.append('aid', '6383');
        params.append('app_name', 'douyin_web');
        params.append('live_id', '1');
        params.append('device_platform', 'web');
        params.append('language', 'zh-CN');
        params.append('enter_from', 'web_homepage_hot');
        params.append('cookie_enabled', 'true');
        params.append('screen_width', String(window.screen.width));
        params.append('screen_height', String(window.screen.height));
        params.append('browser_language', navigator.language || 'zh-CN');
        params.append('browser_platform', navigator.platform || 'Win32');
        params.append('browser_name', (() => { const ua = navigator.userAgent; return ua.includes('Edg/') ? 'Edge' : ua.includes('OPR/') || ua.includes('Opera') ? 'Opera' : ua.includes('Chrome/') ? 'Chrome' : ua.includes('Safari/') ? 'Safari' : ua.includes('Firefox/') ? 'Firefox' : 'Chrome'; })());
        params.append('browser_version', getBrowserVersion());
        params.append('os_name', (() => { const ua = navigator.userAgent; return ua.includes('Windows') ? 'Windows' : ua.includes('Mac OS') || ua.includes('Macintosh') ? 'Mac' : ua.includes('Linux') ? 'Linux' : 'Windows'; })());
        params.append('os_version', (() => { const ua = navigator.userAgent; const wm = ua.match(/Windows NT (\d+\.\d+)/); if (wm) return parseFloat(wm[1]) > 10 ? '11' : '10'; const mm = ua.match(/Mac OS X (\d+[._]\d+)/); if (mm) return mm[1].replace(/_/g, '.'); return '10'; })());
        params.append('web_rid', roomId);
        params.append('room_id_str', roomId);
        params.append('enter_source', '');
        params.append('is_need_double_stream', 'false');
        params.append('insert_task_id', '');
        params.append('live_reason', '');
        params.append('msToken', msToken);

        const url = `https://live.douyin.com/webcast/room/web/enter/?${params.toString()}`;

        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': navigator.language || 'zh-CN',
                    'Referer': 'https://www.douyin.com/',
                    'Origin': 'https://www.douyin.com',
                    'Cookie': document.cookie
                },
                timeout: 10000,
                onload: function(response) {
                    console.log('[抖音一键拉黑] 直播间API响应状态:', response.status);
                    if (response.status !== 200) {
                        console.log('[抖音一键拉黑] 直播间API请求失败，状态码:', response.status);
                        resolve(null);
                        return;
                    }

                    const text = response.responseText;
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (parseErr) {
                        console.log('[抖音一键拉黑] 直播间API返回非JSON数据:', text.substring(0, 200));
                        resolve(null);
                        return;
                    }

                    if (data.status_code !== 0) {
                        console.log('[抖音一键拉黑] 直播间API返回错误，status_code:', data.status_code, 'status_msg:', data.status_msg);
                        resolve(null);
                        return;
                    }

                    if (data.data && data.data.user) {
                        const user = data.data.user;
                        const result = {
                            secUid: user.sec_uid,
                            userId: user.id_str,
                            nickname: user.nickname
                        };
                        console.log('[抖音一键拉黑] 从直播间API获取到用户信息:', result);
                        resolve(result);
                        return;
                    }

                    console.log('[抖音一键拉黑] 直播间API返回数据中无用户信息:', JSON.stringify(data).substring(0, 300));
                    resolve(null);
                },
                onerror: function(error) {
                    console.log('[抖音一键拉黑] 直播间API请求网络错误:', error);
                    resolve(null);
                },
                ontimeout: function() {
                    console.log('[抖音一键拉黑] 直播间API请求超时');
                    resolve(null);
                }
            });
        });
    }

    // 获取设备参数
    function getDeviceParams() {
        const ua = navigator.userAgent;

        let browserName = 'Chrome';
        if (ua.includes('Edg/')) browserName = 'Edge';
        else if (ua.includes('OPR/') || ua.includes('Opera')) browserName = 'Opera';
        else if (ua.includes('Chrome/')) browserName = 'Chrome';
        else if (ua.includes('Safari/')) browserName = 'Safari';
        else if (ua.includes('Firefox/')) browserName = 'Firefox';

        let osName = 'Windows';
        if (ua.includes('Windows')) osName = 'Windows';
        else if (ua.includes('Mac OS') || ua.includes('Macintosh')) osName = 'Mac';
        else if (ua.includes('Linux') && !ua.includes('Android')) osName = 'Linux';
        else if (ua.includes('Android')) osName = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) osName = 'iOS';

        let osVersion = '10';
        const winMatch = ua.match(/Windows NT (\d+\.\d+)/);
        if (winMatch) {
            const ver = parseFloat(winMatch[1]);
            osVersion = ver > 10 ? '11' : '10';
        } else {
            const macMatch = ua.match(/Mac OS X (\d+[._]\d+)/);
            if (macMatch) osVersion = macMatch[1].replace(/_/g, '.');
            else {
                const androidMatch = ua.match(/Android (\d+(?:\.\d+)*)/);
                if (androidMatch) osVersion = androidMatch[1];
            }
        }

        return {
            device_platform: 'webapp',
            aid: '6383',
            channel: 'channel_pc_web',
            pc_client_type: '1',
            pc_libra_divert: (() => { const ua = navigator.userAgent; return ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'Mac' : 'Linux'; })(),
            update_version_code: '170400',
            support_h265: '1',
            support_dash: '1',
            version_code: '170400',
            version_name: '17.4.0',
            cookie_enabled: String(navigator.cookieEnabled),
            screen_width: String(window.screen.width),
            screen_height: String(window.screen.height),
            browser_language: navigator.language || 'zh-CN',
            browser_platform: navigator.platform || 'Win32',
            browser_name: browserName,
            browser_version: getBrowserVersion(),
            browser_online: String(navigator.onLine),
            engine_name: 'Blink',
            engine_version: getBrowserVersion(),
            os_name: osName,
            os_version: osVersion,
            cpu_core_num: String(navigator.hardwareConcurrency || 4),
            device_memory: String(Math.ceil((navigator.deviceMemory || 4))),
            platform: 'PC',
            downlink: String((navigator.connection && navigator.connection.downlink) || 10),
            effective_type: (navigator.connection && navigator.connection.effectiveType) || '4g',
            round_trip_time: String((navigator.connection && navigator.connection.rtt) || 0)
        };
    }

    function getBrowserVersion() {
        const ua = navigator.userAgent;
        let match = ua.match(/Edg\/(\d+)/);
        if (match) return match[1] + '.0.0.0';
        match = ua.match(/OPR\/(\d+)/);
        if (match) return match[1] + '.0.0.0';
        match = ua.match(/Chrome\/(\d+)/);
        if (match) return match[1] + '.0.0.0';
        match = ua.match(/Firefox\/(\d+)/);
        if (match) return match[1] + '.0.0.0';
        match = ua.match(/Version\/(\d+)/);
        if (match) return match[1] + '.0.0.0';
        return '147.0.0.0';
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
            xhr.setRequestHeader('Accept-Language', navigator.language || 'zh-CN');
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
            'Accept-Language': navigator.language || 'zh-CN',
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
    async function blockUser(secUid, isUnblock = false, silent = false) {
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
                        handleResponse(xhrResult.responseText, isUnblock, resolve, silent);
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
                        handleResponse(text, isUnblock, resolve, silent);
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
                                    if (!silent) showToast('请求被拒绝，请确保已登录抖音');
                                    resolve({ success: false, error: '403 Forbidden - 需要登录' });
                                    return;
                                }

                                handleResponse(response.responseText, isUnblock, resolve, silent);
                            },
                            onerror: function(error) {
                                console.error('[抖音一键拉黑] 请求失败:', error);
                                if (!silent) showToast('网络错误，请稍后重试');
                                resolve({ success: false, error: '网络错误' });
                            },
                            ontimeout: function() {
                                console.error('[抖音一键拉黑] 请求超时');
                                if (!silent) showToast('请求超时，请稍后重试');
                                resolve({ success: false, error: '超时' });
                            }
                        });
                    });
            });
        } catch (error) {
            console.error('[抖音一键拉黑] 异常:', error);
            if (!silent) showToast('操作失败，请重试');
            return { success: false, error: error.message };
        }
    }

    // 处理响应数据
    function handleResponse(responseText, isUnblock, resolve, silent = false) {
        if (!responseText) {
            if (!silent) showToast('服务器返回空响应');
            resolve({ success: false, isBlocked: undefined, error: 'Empty response' });
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
                        if (!silent) showToast('已解除拉黑');
                        resolve({ success: true, isBlocked: false });
                    } else {
                        if (!silent) showToast('解除拉黑失败');
                        resolve({ success: false, isBlocked: true, error: '解除拉黑失败' });
                    }
                } else {
                    // 拉黑操作
                    if (data.block_status === 1) {
                        if (!silent) showToast('已拉黑该用户');
                        resolve({ success: true, isBlocked: true });
                    } else {
                        if (!silent) showToast('拉黑失败');
                        resolve({ success: false, isBlocked: false, error: '拉黑失败' });
                    }
                }
            } else {
                const errorMsg = data.status_msg || '操作失败';
                if (!silent) showToast(errorMsg);
                // 根据操作类型返回预期的isBlocked状态
                resolve({ success: false, isBlocked: isUnblock ? undefined : undefined, error: errorMsg });
            }
        } catch (e) {
            console.error('[抖音一键拉黑] 解析响应失败:', e);
            if (!silent) showToast('操作失败，请重试');
            resolve({ success: false, isBlocked: undefined, error: '解析失败' });
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
            <div class="block-tooltip-wrapper">
                <div class="block-tooltip-content">
                    <span class="block-tooltip-text">拉黑用户</span>
                    <span class="block-tooltip-shortcut">${getShortcutDisplayName()}</span>
                </div>
                <svg class="block-tooltip-arrow" viewBox="0 0 7 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z"></path>
                </svg>
            </div>
        `;

        // 阻止所有鼠标事件穿透到下层元素
        const preventEventBubbling = (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        };

        // 阻止鼠标进入和离开事件穿透（防止触发下层头像的tooltip）
        // 使用 capture 阶段阻止事件
        btn.addEventListener('mouseenter', preventEventBubbling, true);
        btn.addEventListener('mouseleave', preventEventBubbling, true);
        btn.addEventListener('mouseover', preventEventBubbling, true);
        btn.addEventListener('mouseout', preventEventBubbling, true);

        // 额外阻止 pointer 事件
        btn.addEventListener('pointerenter', preventEventBubbling, true);
        btn.addEventListener('pointerleave', preventEventBubbling, true);
        btn.addEventListener('pointerover', preventEventBubbling, true);
        btn.addEventListener('pointerout', preventEventBubbling, true);

        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            let secUid = null;
            const liveRoomId = btn.getAttribute('data-live-room-id');

            // 如果是直播卡片，先通过直播间API获取用户sec_uid
            if (liveRoomId) {
                console.log('[抖音一键拉黑] 直播卡片，正在获取用户信息...');
                showToast('正在获取直播用户信息...');
                const liveUserInfo = await fetchUserInfoFromLiveRoom(liveRoomId);
                if (liveUserInfo && liveUserInfo.secUid) {
                    secUid = liveUserInfo.secUid;
                    console.log('[抖音一键拉黑] 直播卡片获取到secUid:', secUid);
                }
            }

            // 如果不是直播卡片或直播API未能获取，尝试从容器获取
            if (!secUid) {
                const authorInfo = getVideoAuthorInfoFromContainer(container);
                if (authorInfo && authorInfo.secUid) {
                    secUid = authorInfo.secUid;
                }
            }

            // 最终兜底：如果是直播卡片，从 feed-item 层级直接搜索用户链接
            if (!secUid && liveRoomId) {
                console.log('[抖音一键拉黑] 直播卡片兜底搜索用户链接...');
                let feedItem = container;
                for (let i = 0; i < 10 && feedItem; i++) {
                    if (feedItem.hasAttribute('data-e2e') && feedItem.getAttribute('data-e2e') === 'feed-item') {
                        break;
                    }
                    feedItem = feedItem.parentElement;
                }
                if (feedItem) {
                    const allLinks = feedItem.querySelectorAll('a');
                    for (const link of allLinks) {
                        const href = link.getAttribute('href') || '';
                        const secUidMatch = href.match(/MS4wLj[A-Za-z0-9_\-]{15,}/);
                        if (secUidMatch) {
                            secUid = secUidMatch[0];
                            console.log('[抖音一键拉黑] 直播卡片兜底提取到sec_uid:', secUid);
                            break;
                        }
                    }
                }
            }

            if (!secUid) {
                showToast('无法获取用户信息');
                return;
            }

            btn.style.pointerEvents = 'none';
            const isCurrentlyBlocked = btn.dataset.blocked === 'true';
            console.log('[抖音一键拉黑] 当前拉黑状态:', isCurrentlyBlocked, '准备执行:', isCurrentlyBlocked ? '解除拉黑' : '拉黑');

            const result = await blockUser(secUid, isCurrentlyBlocked);
            console.log('[抖音一键拉黑] 拉黑操作结果:', result);

            if (result && result.success) {
                const tooltipText = btn.querySelector('.block-tooltip-text');
                console.log('[抖音一键拉黑] 操作成功，新的拉黑状态:', result.isBlocked);

                if (result.isBlocked === true) {
                    btn.dataset.blocked = 'true';
                    btn.classList.add('blocked');
                    if (tooltipText) tooltipText.textContent = '已拉黑';
                    // 记录到拉黑日志（推荐页视频/直播卡片）
                    try {
                        recordBlockedUser(enrichAuthorInfo({
                            secUid: secUid,
                            nickname: '' // 推荐页卡片通常没有显式昵称
                        }), 'feed-card');
                    } catch (e) {}
                    console.log('[抖音一键拉黑] 按钮状态已更新为: 已拉黑');
                } else if (result.isBlocked === false) {
                    btn.dataset.blocked = 'false';
                    btn.classList.remove('blocked');
                    if (tooltipText) tooltipText.textContent = '拉黑用户';
                    console.log('[抖音一键拉黑] 按钮状态已更新为: 未拉黑');
                } else {
                    console.log('[抖音一键拉黑] 警告: isBlocked值异常:', result.isBlocked);
                }
            } else {
                console.log('[抖音一键拉黑] 操作失败或结果异常:', result);
            }

            setTimeout(() => {
                btn.style.pointerEvents = 'auto';
            }, 1000);
        });

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            openBlockSettings();
        });

        return btn;
    }

    // 为单个互动区域插入按钮 - 重构版（完全依赖 data-e2e 和 DOM 结构）
    // 核心原则：
    // 1. 所有选择器仅依赖 data-e2e 属性或结构关系，避免任何 class
    // 2. 以用户主页链接的存在与否作为开关，没有主页 URL 的卡片不操作
    // 3. 插入目标：在头像容器之前（即视觉上头像的上方），且与可能存在的 AI 按钮处于同一父容器
    // 4. 兼容 AI 按钮存在/不存在的两种情况
    function insertButtonForInteractionArea(interactionArea) {
        // 检查是否已处理过此互动区域
        if (interactionArea.hasAttribute('data-block-btn-processed')) {
            return false;
        }

        console.log('[抖音一键拉黑] 开始为互动区域插入按钮...');

        // 步骤1：查找头像链接（使用 data-e2e="video-avatar" 或包含 /user/ 的链接，也支持直播链接）
        let avatarLink = interactionArea.querySelector('a[data-e2e="video-avatar"]');
        let isLiveCard = false;
        let liveRoomId = null;

        if (!avatarLink) {
            // 查找包含用户主页链接的 a 标签
            const allLinks = interactionArea.querySelectorAll('a[href*="/user/"]');
            for (const link of allLinks) {
                const href = link.getAttribute('href') || '';
                if (href.includes('MS4wLj') || href.match(/\/user\/[^\/\s?]+/)) {
                    avatarLink = link;
                    break;
                }
            }
        }

        // 如果仍然没找到，检查是否是直播卡片（链接指向 live.douyin.com）
        if (!avatarLink) {
            const liveLinks = interactionArea.querySelectorAll('a[href*="live.douyin.com"]');
            for (const link of liveLinks) {
                const href = link.getAttribute('href') || '';
                const roomIdMatch = href.match(/room_id=(\d+)/);
                if (roomIdMatch) {
                    avatarLink = link;
                    isLiveCard = true;
                    liveRoomId = roomIdMatch[1];
                    console.log('[抖音一键拉黑] 检测到直播卡片，room_id:', liveRoomId);
                    break;
                }
                const pathMatch = href.match(/live\.douyin\.com\/(\d+)/);
                if (pathMatch) {
                    avatarLink = link;
                    isLiveCard = true;
                    liveRoomId = pathMatch[1];
                    console.log('[抖音一键拉黑] 检测到直播卡片，room_id(从路径):', liveRoomId);
                    break;
                }
            }
            if (!avatarLink) {
                const liveIcons = interactionArea.querySelectorAll('.HoSMor44, img[alt="LiveIcon"], img[src*="avatar-live"]');
                if (liveIcons.length > 0) {
                    const anyLink = interactionArea.querySelector('a');
                    if (anyLink) {
                        const href = anyLink.getAttribute('href') || '';
                        if (href.includes('live.douyin.com')) {
                            const roomIdMatch = href.match(/room_id=(\d+)/);
                            if (roomIdMatch) {
                                avatarLink = anyLink;
                                isLiveCard = true;
                                liveRoomId = roomIdMatch[1];
                                console.log('[抖音一键拉黑] 通过直播图标检测到直播卡片，room_id:', liveRoomId);
                            }
                        }
                    }
                }
            }
        }

        // 如果没有找到头像链接，终止操作
        if (!avatarLink) {
            console.log('[抖音一键拉黑] 未找到有效的用户主页链接，跳过此卡片');
            return false;
        }

        const href = avatarLink.getAttribute('href') || '';

        // 对于直播卡片，跳过 secUid 校验（将在点击时异步获取）
        if (!isLiveCard) {
            const secUidMatch = href.match(/\/user\/([^?\s]+)/);
            if (!secUidMatch || !secUidMatch[1]) {
                console.log('[抖音一键拉黑] 无法从链接中提取用户标识，跳过');
                return false;
            }
        }

        console.log('[抖音一键拉黑] 找到用户链接:', href, isLiveCard ? '(直播卡片)' : '');

        // 步骤2：从头像链接向上遍历，找到关注图标容器（data-e2e="feed-follow-icon" 的祖先）
        // 该元素即为头像及关注按钮的外层容器
        let avatarBlock = null;
        let currentEl = avatarLink;
        const maxTraverse = 10; // 最大遍历层数，防止无限循环

        for (let i = 0; i < maxTraverse && currentEl; i++) {
            currentEl = currentEl.parentElement;
            if (!currentEl) break;

            // 检查当前元素是否包含关注图标
            const followIcon = currentEl.querySelector('[data-e2e="feed-follow-icon"]');
            if (followIcon) {
                avatarBlock = currentEl;
                console.log('[抖音一键拉黑] 找到头像容器（包含关注图标），层级:', i + 1);
                break;
            }
        }

        // 如果没找到包含关注图标的容器，尝试使用头像链接的直接父容器作为备选
        if (!avatarBlock) {
            avatarBlock = avatarLink.parentElement;
            console.log('[抖音一键拉黑] 使用头像链接父容器作为备选');
        }

        if (!avatarBlock) {
            console.log('[抖音一键拉黑] 无法确定头像容器位置');
            return false;
        }

        // 步骤3：获取头像容器的父节点（与AI按钮同一层级）
        const avatarContainer = avatarBlock.parentElement;
        if (!avatarContainer) {
            console.log('[抖音一键拉黑] 无法找到头像容器父节点');
            return false;
        }

        // 获取互动面板（再往外一层，包含AI按钮、头像容器等的父容器）
        const panel = avatarContainer.parentElement;
        if (!panel) {
            console.log('[抖音一键拉黑] 无法找到互动面板');
            return false;
        }

        // 进一步验证：检查面板是否包含点赞图标（data-e2e="video-player-digg"）
        const diggIcon = panel.querySelector('[data-e2e="video-player-digg"]');
        if (!diggIcon) {
            // 如果没有找到点赞图标，可能不是正确的面板，但仍继续尝试
            console.log('[抖音一键拉黑] 警告：面板未包含点赞图标，可能位置不正确');
        }

        // 步骤4：检查是否已存在按钮（使用自定义属性标记）
        if (panel.querySelector('[data-custom-inserted="block-btn"]')) {
            console.log('[抖音一键拉黑] 面板中已存在拉黑按钮，跳过');
            interactionArea.setAttribute('data-block-btn-processed', 'true');
            return false;
        }

        // 步骤5：创建新按钮元素
        const blockBtn = createBlockButton(interactionArea);
        if (isLiveCard && liveRoomId) {
            blockBtn.setAttribute('data-live-room-id', liveRoomId);
            interactionArea.setAttribute('data-live-room-id', liveRoomId);
        }

        // 为按钮打上自定义属性，避免重复插入
        blockBtn.setAttribute('data-custom-inserted', 'block-btn');

        // 步骤6：将按钮插入到头像容器之前（与AI按钮同一父容器）
        // 这样无论 AI 按钮是否存在，新按钮都会在头像上方
        // - 有 AI 按钮时：新按钮位于 AI 按钮之后、头像容器之前
        // - 无 AI 按钮时：新按钮成为面板的第一个子元素，依然在头像上方
        try {
            panel.insertBefore(blockBtn, avatarContainer);
            console.log('[抖音一键拉黑] 按钮成功插入到头像容器之前（与AI按钮同层级）');

            // 标记互动区域已处理
            interactionArea.setAttribute('data-block-btn-processed', 'true');
            return true;
        } catch (e) {
            console.log('[抖音一键拉黑] 插入按钮失败:', e.message);
            return false;
        }
    }

    // 为评论区单个评论插入拉黑按钮 - 增强版
    function insertButtonForComment(commentItem) {
        // 检查是否已存在按钮
        if (commentItem.querySelector('.douyin-comment-block-btn')) {
            console.log('[抖音一键拉黑] 评论已存在拉黑按钮，跳过');
            return false;
        }

        const commentInfo = getCommentAuthorInfo(commentItem);
        if (!commentInfo || !commentInfo.secUid) {
            console.log('[抖音一键拉黑] 无法获取评论作者信息:', commentInfo);
            return false;
        }

        console.log('[抖音一键拉黑] 准备插入评论区按钮，用户信息:', commentInfo);

        const blockBtn = createCommentBlockButton(commentItem, commentInfo);
        const inserted = insertButtonToCommentItem(commentItem, blockBtn);

        if (inserted) {
            console.log('[抖音一键拉黑] 评论区按钮插入成功');
            return true;
        } else {
            console.log('[抖音一键拉黑] 评论区按钮插入失败');
            return false;
        }
    }

    // 将按钮插入到评论项中 - 重构版（插入到不喜欢按钮之后）
    function insertButtonToCommentItem(commentItem, blockBtn) {
        // 核心目标：将按钮插入到不喜欢按钮之后，在点赞/不喜欢容器内部
        // 根据 HTML 结构：
        // <div class="comment-item-stats-container">  <!-- 操作栏 -->
        //   <div class="I26W2ERo L2ptqwYp">  <!-- 点赞/踩容器 -->
        //     <p class="soEq5p_Y">...</p>  <!-- 点赞按钮 -->
        //     <p class="Gb0hN2DA">...</p>  <!-- 不喜欢按钮 -->
        //     <!-- 按钮应该插入到这里，在不喜欢按钮之后 -->
        //   </div>
        //   <div class="y8vae7Xx ztxZDhWP">...</div>  <!-- 分享按钮 -->
        //   <div class="dJVTtR1P">...</div>  <!-- 更多按钮 -->
        // </div>

        // 步骤1：查找操作栏容器（comment-item-stats-container）
        let actionBar = commentItem.querySelector('.comment-item-stats-container');

        // 如果没找到，尝试通过子元素反推
        if (!actionBar) {
            const likeOrDislikeBtn = commentItem.querySelector('[data-e2e="comment-like"], [data-e2e="comment-dislike"]');
            if (likeOrDislikeBtn) {
                let currentEl = likeOrDislikeBtn;
                for (let i = 0; i < 5 && currentEl; i++) {
                    currentEl = currentEl.parentElement;
                    if (!currentEl) break;

                    // 检查是否包含分享或更多按钮，确认是操作栏
                    const hasShare = currentEl.querySelector('[data-e2e="comment-share"]') ||
                                      currentEl.textContent.includes('分享');
                    const hasMore = currentEl.querySelector('[data-e2e="comment-more"]');

                    if ((hasShare || hasMore) && currentEl.children.length >= 3) {
                        actionBar = currentEl;
                        break;
                    }
                }
            }
        }

        // 步骤2：在操作栏中找到不喜欢按钮，将按钮插入到其后
        if (actionBar) {
            // 查找不喜欢按钮（优先使用 data-e2e，备选使用 class）
            let dislikeBtn = actionBar.querySelector('[data-e2e="comment-dislike"]');

            // 如果没找到，尝试通过 class 查找
            if (!dislikeBtn) {
                // 根据 HTML 结构，不喜欢按钮在第二个 p 元素中
                const likeDislikeContainer = actionBar.querySelector('.I26W2ERo, .L2ptqwYp') || actionBar.firstElementChild;
                if (likeDislikeContainer) {
                    // 查找第二个 p 元素（不喜欢按钮）
                    const pElements = likeDislikeContainer.querySelectorAll('p');
                    if (pElements.length >= 2) {
                        dislikeBtn = pElements[1]; // 第二个 p 是不喜欢按钮
                    }
                }
            }

            // 如果找到了不喜欢按钮，在其后插入
            if (dislikeBtn && dislikeBtn.parentElement) {
                const parent = dislikeBtn.parentElement;
                parent.insertBefore(blockBtn, dislikeBtn.nextSibling);
                console.log('[抖音一键拉黑] 按钮成功插入到不喜欢按钮之后');
                return true;
            }

            // 兜底：如果没找到不喜欢按钮，查找点赞按钮，在其后插入
            const likeBtn = actionBar.querySelector('[data-e2e="comment-like"]');
            if (likeBtn && likeBtn.parentElement) {
                const parent = likeBtn.parentElement;
                parent.insertBefore(blockBtn, likeBtn.nextSibling);
                console.log('[抖音一键拉黑] 按钮插入到点赞按钮之后');
                return true;
            }
        }

        // 步骤3：兜底方案 - 全局查找不喜欢按钮
        const globalDislikeBtn = commentItem.querySelector('[data-e2e="comment-dislike"]');
        if (globalDislikeBtn && globalDislikeBtn.parentElement) {
            const parent = globalDislikeBtn.parentElement;
            parent.insertBefore(blockBtn, globalDislikeBtn.nextSibling);
            console.log('[抖音一键拉黑] 按钮插入到不喜欢按钮之后（全局查找）');
            return true;
        }

        // 步骤4：最后兜底 - 查找点赞/不喜欢容器，在最后一个子元素后插入
        const likeDislikeContainer = commentItem.querySelector('.I26W2ERo, .L2ptqwYp');
        if (likeDislikeContainer) {
            // 查找不喜欢按钮（第二个 p 元素）
            const pElements = likeDislikeContainer.querySelectorAll('p');
            if (pElements.length >= 2) {
                likeDislikeContainer.insertBefore(blockBtn, pElements[1].nextSibling);
                console.log('[抖音一键拉黑] 按钮插入到不喜欢按钮之后（class查找）');
                return true;
            }
            // 如果只有一个 p 元素，在其后插入
            if (pElements.length === 1) {
                likeDislikeContainer.insertBefore(blockBtn, pElements[0].nextSibling);
                console.log('[抖音一键拉黑] 按钮插入到唯一按钮之后');
                return true;
            }
        }

        // 步骤5：最终兜底 - 直接添加到评论项的操作栏区域
        const anyActionEl = commentItem.querySelector('[data-e2e="comment-like"], [data-e2e="comment-dislike"]');
        if (anyActionEl) {
            let container = anyActionEl;
            for (let i = 0; i < 4 && container; i++) {
                const parent = container.parentElement;
                if (!parent) break;

                // 如果父元素包含多个子元素，在此容器内插入到当前元素之后
                if (parent.children.length >= 2) {
                    parent.appendChild(blockBtn);
                    console.log('[抖音一键拉黑] 按钮添加到容器内部末尾');
                    return true;
                }
                container = parent;
            }
        }

        // 步骤5：最终兜底 - 添加到评论项末尾
        commentItem.appendChild(blockBtn);
        console.log('[抖音一键拉黑] 按钮添加到评论项末尾（最终兜底）');
        return true;
    }

    // 获取评论区作者信息 - 增强版（360浏览器兼容性优化）
    function getCommentAuthorInfo(commentItem) {
        console.log('[抖音一键拉黑] 开始获取评论作者信息...');

        // 尝试多种选择器查找用户链接
        const userLinkSelectors = [
            // 高优先级选择器
            'a[href*="/user/"]',
            'a[href*="MS4wLj"]',
            '[data-e2e="comment-username"] a',
            '.comment-username a',
            // 头像区域的用户链接
            '.eyntNXip a[href*="/user/"]',
            '.comment-item-avatar a[href*="/user/"]',
            '[class*="avatar"] a[href*="/user/"]',
            // 通用选择器
            'a[class*="user"]',
            'a[class*="author"]',
            'a[class*="nickname"]',
            // 兜底选择器
            'a[href^="//www.douyin.com/user/"]',
            'a[href^="https://www.douyin.com/user/"]'
        ];

        let authorLink = null;
        let usedSelector = '';

        // 第一层：在当前元素内查找
        for (const selector of userLinkSelectors) {
            try {
                authorLink = commentItem.querySelector(selector);
                if (authorLink) {
                    usedSelector = selector;
                    console.log('[抖音一键拉黑] 找到用户链接，选择器:', selector);
                    break;
                }
            } catch (e) {
                console.log('[抖音一键拉黑] 选择器执行失败:', selector, e.message);
            }
        }

        // 第二层：在父元素中查找（处理嵌套结构）
        if (!authorLink) {
            let parent = commentItem.parentElement;
            for (let i = 0; i < 3 && parent; i++) {
                for (const selector of userLinkSelectors) {
                    try {
                        authorLink = parent.querySelector(selector);
                        if (authorLink) {
                            usedSelector = `父元素${i+1}层 ${selector}`;
                            console.log('[抖音一键拉黑] 在父元素中找到用户链接:', usedSelector);
                            break;
                        }
                    } catch (e) {}
                }
                if (authorLink) break;
                parent = parent.parentElement;
            }
        }

        // 第三层：通过文本内容匹配查找用户链接
        if (!authorLink) {
            const allLinks = commentItem.querySelectorAll('a');
            for (const link of allLinks) {
                const href = link.getAttribute('href') || '';
                if (href.includes('/user/') || href.includes('MS4wLj')) {
                    authorLink = link;
                    usedSelector = '文本匹配';
                    console.log('[抖音一键拉黑] 通过文本匹配找到用户链接');
                    break;
                }
            }
        }

        // 第四层：从data属性中获取
        if (!authorLink) {
            // 尝试从data属性获取secUid
            const dataSecUid = commentItem.getAttribute('data-sec-uid') ||
                              commentItem.getAttribute('data-user-sec-uid');
            if (dataSecUid && dataSecUid.includes('MS4wLj')) {
                console.log('[抖音一键拉黑] 从data属性获取到secUid:', dataSecUid);
                return { secUid: dataSecUid };
            }

            // 查找子元素中的data属性
            const elementsWithData = commentItem.querySelectorAll('[data-sec-uid], [data-user-sec-uid]');
            for (const el of elementsWithData) {
                const secUid = el.getAttribute('data-sec-uid') || el.getAttribute('data-user-sec-uid');
                if (secUid && secUid.includes('MS4wLj')) {
                    console.log('[抖音一键拉黑] 从子元素data属性获取到secUid:', secUid);
                    return { secUid: secUid };
                }
            }
        }

        // 处理找到的用户链接
        if (authorLink) {
            const href = authorLink.getAttribute('href') || '';
            console.log('[抖音一键拉黑] 用户链接href:', href);

            // 尝试多种方式提取secUid
            let secUid = null;

            // 方式1：标准匹配 /user/xxx
            const match = href.match(/\/user\/([^?\s]+)/);
            if (match) {
                secUid = match[1];
            }

            // 方式2：直接匹配MS4wLj开头的secUid
            if (!secUid) {
                const msMatch = href.match(/(MS4wLj[A-Za-z0-9_-]+)/);
                if (msMatch) {
                    secUid = msMatch[1];
                }
            }

            if (secUid) {
                const result = { secUid: secUid };

                // 尝试获取userId
                const uidMatch = href.match(/uid=(\d+)/);
                if (uidMatch) {
                    result.userId = uidMatch[1];
                }

                // 从data属性获取userId
                const userIdAttr = commentItem.querySelector('[data-user-id]');
                if (userIdAttr) {
                    result.userId = userIdAttr.getAttribute('data-user-id');
                }

                // 从当前元素获取userId
                if (!result.userId) {
                    result.userId = commentItem.getAttribute('data-user-id');
                }

                // 标记是否为视频作者
                try {
                    const authorSec = batchBlockState.authorSecUid || getCurrentVideoAuthorSecUid();
                    if (authorSec && authorSec === secUid) {
                        result.isAuthor = true;
                    }
                } catch (e) {}

                // 顺手提取昵称和头像（用于拉黑日志）
                try {
                    const nickEl = authorLink.querySelector('span') || authorLink;
                    if (nickEl && nickEl.textContent) {
                        result.nickname = (nickEl.textContent || '').trim().split(/\s/)[0] || '';
                    }
                    const avatarImg = commentItem.querySelector('img[class*="avatar"], img[alt*="头像"], img[class*="Avatar"]');
                    if (avatarImg && avatarImg.src) {
                        result.avatar = avatarImg.src;
                    }
                } catch (e) {}

                console.log('[抖音一键拉黑] 成功获取评论作者信息:', result);
                return result;
            } else {
                console.log('[抖音一键拉黑] 无法从href匹配secUid:', href);
            }
        } else {
            console.log('[抖音一键拉黑] 未找到用户链接，评论HTML:', commentItem.innerHTML.substring(0, 300));
        }

        // 最后一层：尝试从页面全局数据获取
        try {
            const win = unsafeWindow || window;
            if (win.__SSR_DATA__ && win.__SSR_DATA__.comments) {
                // 尝试匹配当前评论
                const commentText = commentItem.textContent?.substring(0, 50);
                if (commentText) {
                    console.log('[抖音一键拉黑] 尝试从SSR数据匹配评论:', commentText);
                    // 这里可以实现更复杂的匹配逻辑
                }
            }
        } catch (e) {}

        return null;
    }

    // 创建评论区拉黑按钮
    function createCommentBlockButton(commentItem, authorInfo) {
        const btn = document.createElement('div');
        btn.className = 'douyin-comment-block-btn';
        btn.dataset.blocked = 'false';
        btn.dataset.secUid = authorInfo.secUid || ''; // 存储secUid供批量模式使用
        // 视频作者评论标识：批量模式下跳过、停止后单独拉黑
        if (authorInfo.isAuthor) {
            btn.dataset.authorComment = 'true';
        }
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
            console.log('[抖音一键拉黑] 评论区按钮 - 当前拉黑状态:', isCurrentlyBlocked, '准备执行:', isCurrentlyBlocked ? '解除拉黑' : '拉黑');

            const result = await blockUser(authorInfo.secUid, isCurrentlyBlocked);
            console.log('[抖音一键拉黑] 评论区拉黑操作结果:', result);

            if (result && result.success) {
                console.log('[抖音一键拉黑] 评论区操作成功，新的拉黑状态:', result.isBlocked);

                if (result.isBlocked === true) {
                    markCommentBtnBlocked(btn);
                    showToast('已拉黑该用户');
                    // 拉黑后自动触发"不感兴趣"（仅对评论，且开关打开）—— 已注释：功能不完善
                    // 记录到拉黑日志
                    try {
                        const info = enrichAuthorInfo({
                            secUid: authorInfo.secUid,
                            userId: authorInfo.userId,
                            nickname: extractNicknameFromBtn(btn) || authorInfo.nickname,
                            avatar: extractAvatarFromBtn(btn) || authorInfo.avatar
                        });
                        recordBlockedUser(info, isCurrentlyBlocked ? 'manual-unblock' : 'manual');
                    } catch (e) {}
                    console.log('[抖音一键拉黑] 评论区按钮状态已更新为: 已拉黑');
                } else if (result.isBlocked === false) {
                    btn.dataset.blocked = 'false';
                    btn.classList.remove('blocked');
                    btn.title = '拉黑用户';
                    // 重置 SVG 填充色
                    try {
                        const svg = btn.querySelector('svg');
                        if (svg) {
                            const path = svg.querySelector('path');
                            if (path) path.setAttribute('fill', '#ffffff');
                        }
                    } catch (e) {}
                    showToast('已解除拉黑');
                    console.log('[抖音一键拉黑] 评论区按钮状态已更新为: 未拉黑');
                } else {
                    console.log('[抖音一键拉黑] 警告: 评论区isBlocked值异常:', result.isBlocked);
                }
            } else {
                console.log('[抖音一键拉黑] 评论区操作失败或结果异常:', result);
            }

            setTimeout(() => {
                btn.style.pointerEvents = 'auto';
            }, 1000);
        });

        // 记录批量/作者收尾拉黑时的用户信息
        if (authorInfo && authorInfo.secUid) {
            btn.dataset.nickname = authorInfo.nickname || '';
            btn.dataset.avatar = authorInfo.avatar || '';
        }

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openBlockSettings();
        });

        return btn;
    }

    // 清理所有已存在的拉黑按钮（用于视频切换时）
    function cleanupOldButtons() {
        const oldButtons = document.querySelectorAll('.douyin-block-btn, .douyin-comment-block-btn');
        if (oldButtons.length > 0) {
            console.log('[抖音一键拉黑] 清理', oldButtons.length, '个旧按钮');
            oldButtons.forEach(btn => {
                try {
                    btn.remove();
                } catch (e) {
                    console.log('[抖音一键拉黑] 清理按钮失败:', e.message);
                }
            });
        }
    }

    // 从评论区按钮反向提取昵称/头像
    function extractNicknameFromBtn(btn) {
        if (!btn) return '';
        const item = btn.closest('[data-e2e="comment-item"], .comment-item');
        if (item) {
            const nickEl = item.querySelector('[data-e2e="comment-username"], .comment-username, a[href*="/user/"] span');
            if (nickEl) return (nickEl.textContent || '').trim();
        }
        return btn.dataset.nickname || '';
    }
    function extractAvatarFromBtn(btn) {
        if (!btn) return '';
        const item = btn.closest('[data-e2e="comment-item"], .comment-item');
        if (item) {
            const img = item.querySelector('img[class*="avatar"], img[class*="Avatar"], img[alt*="头像"]');
            if (img) return img.src || '';
        }
        return btn.dataset.avatar || '';
    }

    // 为所有互动区域插入按钮 - 重构版（基于 data-e2e 和 DOM 结构）
    // 核心原则：
    // 1. 通过头像链接 a[data-e2e="video-avatar"] 或包含 /user/ 的链接定位
    // 2. 向上遍历找到包含关注图标的容器作为互动区域
    // 3. 完全避免使用 class 选择器
    function insertButtonsForAll() {
        console.log('[抖音一键拉黑] 开始查找互动区域...');

        // 清理已处理标记，允许重新处理（用于动态加载的新视频）
        // 但保留按钮本身，避免闪烁
        const processedAreas = document.querySelectorAll('[data-block-btn-processed]');
        for (const area of processedAreas) {
            // 检查是否真的有按钮，如果没有则移除标记重新处理
            const panel = area.querySelector('[data-custom-inserted="block-btn"]');
            if (!panel) {
                area.removeAttribute('data-block-btn-processed');
            }
        }

        let allInteractionAreas = [];

        // 方法1：通过 data-e2e="video-avatar" 查找头像链接，然后向上找到互动区域
        const avatarLinks = document.querySelectorAll('a[data-e2e="video-avatar"]');
        console.log('[抖音一键拉黑] 找到', avatarLinks.length, '个头像链接（data-e2e="video-avatar"）');

        for (const link of avatarLinks) {
            // 向上遍历找到包含关注图标的容器
            let currentEl = link;
            let avatarBlock = null;
            for (let i = 0; i < 10 && currentEl; i++) {
                currentEl = currentEl.parentElement;
                if (!currentEl) break;

                // 检查是否包含关注图标
                const followIcon = currentEl.querySelector('[data-e2e="feed-follow-icon"]');
                if (followIcon) {
                    avatarBlock = currentEl;
                    break;
                }
            }

            if (avatarBlock) {
                // 找到头像容器后，获取其父节点（avatarContainer），再获取祖父节点（panel）
                // panel 才是与 AI 按钮同一层级的父容器
                const avatarContainer = avatarBlock.parentElement;
                if (avatarContainer) {
                    const panel = avatarContainer.parentElement;
                    if (panel && !allInteractionAreas.includes(panel)) {
                        // 验证面板是否包含点赞图标
                        const diggIcon = panel.querySelector('[data-e2e="video-player-digg"]');
                        if (diggIcon) {
                            allInteractionAreas.push(panel);
                        }
                    }
                }
            }
        }

        // 方法2：通过包含 /user/ 的链接查找（备选方案）
        if (allInteractionAreas.length === 0) {
            console.log('[抖音一键拉黑] 尝试通过用户链接查找互动区域...');
            const userLinks = document.querySelectorAll('a[href*="/user/"]');

            for (const link of userLinks) {
                const href = link.getAttribute('href') || '';
                // 确保是有效的用户链接
                if (!href.includes('MS4wLj') && !href.match(/\/user\/[^\/\s?]+/)) {
                    continue;
                }

                // 向上遍历找到包含关注图标的容器
                let currentEl = link;
                let avatarBlock = null;
                for (let i = 0; i < 10 && currentEl; i++) {
                    currentEl = currentEl.parentElement;
                    if (!currentEl) break;

                    // 检查是否包含关注图标
                    const followIcon = currentEl.querySelector('[data-e2e="feed-follow-icon"]');
                    if (followIcon) {
                        avatarBlock = currentEl;
                        break;
                    }
                }

                if (avatarBlock) {
                    // 找到头像容器后，获取其父节点（avatarContainer），再获取祖父节点（panel）
                    const avatarContainer = avatarBlock.parentElement;
                    if (avatarContainer) {
                        const panel = avatarContainer.parentElement;
                        if (panel && !allInteractionAreas.includes(panel)) {
                            // 验证面板是否包含点赞图标
                            const diggIcon = panel.querySelector('[data-e2e="video-player-digg"]');
                            if (diggIcon) {
                                allInteractionAreas.push(panel);
                            }
                        }
                    }
                }
            }
        }

        // 方法3：通过关注图标反向查找（兜底方案）
        if (allInteractionAreas.length === 0) {
            console.log('[抖音一键拉黑] 尝试通过关注图标反向查找...');
            const followIcons = document.querySelectorAll('[data-e2e="feed-follow-icon"]');

            for (const icon of followIcons) {
                // 向上遍历：关注图标 -> 头像容器 -> 头像容器父节点 -> 互动面板
                let currentEl = icon;
                for (let i = 0; i < 5 && currentEl; i++) {
                    currentEl = currentEl.parentElement;
                    if (!currentEl) break;

                    // 找到头像容器（包含关注图标的容器）
                    const followIconCheck = currentEl.querySelector('[data-e2e="feed-follow-icon"]');
                    if (followIconCheck && followIconCheck === icon) {
                        // 再往上两层找到互动面板
                        const avatarContainer = currentEl.parentElement;
                        if (avatarContainer) {
                            const panel = avatarContainer.parentElement;
                            if (panel && !allInteractionAreas.includes(panel)) {
                                // 检查是否包含点赞图标
                                const diggIcon = panel.querySelector('[data-e2e="video-player-digg"]');
                                if (diggIcon) {
                                    allInteractionAreas.push(panel);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }

        // 方法4：查找直播卡片（推荐页中"正在直播"的用户卡片）
        if (allInteractionAreas.length === 0) {
            console.log('[抖音一键拉黑] 尝试通过直播卡片查找互动区域...');
            const liveLinks = document.querySelectorAll('a[href*="live.douyin.com"]');
            for (const link of liveLinks) {
                const href = link.getAttribute('href') || '';
                if (!href.includes('room_id=') && !href.match(/live\.douyin\.com\/\d+/)) continue;

                let currentEl = link;
                for (let i = 0; i < 10 && currentEl; i++) {
                    currentEl = currentEl.parentElement;
                    if (!currentEl) break;

                    const followIcon = currentEl.querySelector('[data-e2e="feed-follow-icon"]');
                    if (followIcon) {
                        const avatarContainer = currentEl.parentElement;
                        if (avatarContainer) {
                            const panel = avatarContainer.parentElement;
                            if (panel && !allInteractionAreas.includes(panel)) {
                                const diggIcon = panel.querySelector('[data-e2e="video-player-digg"]');
                                if (diggIcon) {
                                    allInteractionAreas.push(panel);
                                    console.log('[抖音一键拉黑] 找到直播卡片互动区域');
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }

        // 方法4也不限制 allInteractionAreas.length === 0，补充未覆盖的直播卡片
        {
            const liveLinks = document.querySelectorAll('a[href*="live.douyin.com"]');
            for (const link of liveLinks) {
                const href = link.getAttribute('href') || '';
                if (!href.includes('room_id=') && !href.match(/live\.douyin\.com\/\d+/)) continue;

                let currentEl = link;
                for (let i = 0; i < 10 && currentEl; i++) {
                    currentEl = currentEl.parentElement;
                    if (!currentEl) break;

                    const followIcon = currentEl.querySelector('[data-e2e="feed-follow-icon"]');
                    if (followIcon) {
                        const avatarContainer = currentEl.parentElement;
                        if (avatarContainer) {
                            const panel = avatarContainer.parentElement;
                            if (panel && !allInteractionAreas.includes(panel)) {
                                const diggIcon = panel.querySelector('[data-e2e="video-player-digg"]');
                                if (diggIcon) {
                                    allInteractionAreas.push(panel);
                                    console.log('[抖音一键拉黑] 补充找到直播卡片互动区域');
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }

        console.log('[抖音一键拉黑] 找到', allInteractionAreas.length, '个有效互动区域');

        let insertedCount = 0;
        let skippedCount = 0;

        for (const area of allInteractionAreas) {
            const result = insertButtonForInteractionArea(area);
            if (result) {
                insertedCount++;
            } else if (area.querySelector('[data-custom-inserted="block-btn"]')) {
                skippedCount++;
            }
        }

        if (insertedCount > 0 || skippedCount > 0) {
            console.log('[抖音一键拉黑] 互动区域处理完成: 插入', insertedCount, '个, 跳过', skippedCount, '个');
        }

        return insertedCount;
    }

    // 为所有评论区插入按钮
    function insertButtonsForComments() {
        console.log('[抖音一键拉黑] 开始查找评论区...');

        // 支持多种评论区选择器 - 优先级排序（360浏览器兼容性优化）
        const selectors = [
            // 高优先级：带data-e2e属性的选择器（最稳定）
            '[data-e2e="comment-item"]',
            '.UuCzPLbi[data-e2e="comment-item"]',
            '[data-e2e="comment-list"] > div > div',
            '[data-e2e="comment-list"] [data-e2e="comment-item"]',
            // 中优先级：class选择器
            '.comment-mainContent',
            '.comment-item',
            '.iHMk75le',  // 抖音评论区外层容器
            '.eyntNXip',  // 评论区头像容器
            // 低优先级：模糊匹配
            '[class*="comment"] [class*="item"]',
            '[class*="Comment"]',
            '.comment',
            '.comment-content',
            '.B6JkCp0k',
            '.lC6iS6P0',
            // 兜底选择器：通用的评论相关元素
            '[class*="comment-main"]',
            '[class*="CommentItem"]',
            '[class*="commentItem"]'
        ];

        let commentItems = [];
        let usedSelector = '';
        let allPotentialItems = [];

        // 首先收集所有可能的选择器结果
        for (const selector of selectors) {
            try {
                const items = document.querySelectorAll(selector);
                if (items.length > 0) {
                    // 验证这些元素是否真的是评论（包含用户信息）
                    let validCount = 0;
                    for (const item of items) {
                        if (isValidCommentElement(item)) {
                            validCount++;
                        }
                    }

                    if (validCount > 0) {
                        allPotentialItems.push({
                            selector: selector,
                            items: items,
                            validCount: validCount
                        });
                    }
                }
            } catch (e) {
                console.log('[抖音一键拉黑] 选择器错误:', selector, e.message);
            }
        }

        // 选择最有效的选择器
        if (allPotentialItems.length > 0) {
            // 按有效评论数量排序，选择最多的
            allPotentialItems.sort((a, b) => b.validCount - a.validCount);
            const bestMatch = allPotentialItems[0];
            commentItems = bestMatch.items;
            usedSelector = bestMatch.selector;
            console.log('[抖音一键拉黑] 使用评论区选择器:', usedSelector, '找到', commentItems.length, '条评论，有效', bestMatch.validCount, '条');
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

            // 跳过无效的评论元素
            if (!isValidCommentElement(item)) {
                continue;
            }

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
            // 顺手扫一遍关键词
            handleCommentBlockWord(item);
        }

        console.log('[抖音一键拉黑] 评论区处理完成: 插入', insertedCount, '个, 跳过', skippedCount, '个, 失败', failedCount, '个');

        return insertedCount;
    }

    // 提取评论文本（不包含作者昵称/位置等元数据）
    function extractCommentText(commentItem) {
        // 尝试用 .C7LroK_h/.WFJiGxr7 等结构定位
        const candidates = [
            '.WFJiGxr7',
            '.C7LroK_h',
            '.comment-content',
            '.comment-text',
            '[class*="commentContent"]',
            '[class*="CommentContent"]',
            '[class*="comment-text"]'
        ];
        for (const sel of candidates) {
            try {
                const el = commentItem.querySelector(sel);
                if (el && el.textContent) {
                    return el.textContent.trim();
                }
            } catch (e) {}
        }
        // 兜底：取整个评论项的 textContent 减去可能的"4小时前·安徽"尾巴
        return (commentItem.textContent || '').trim();
    }

    // 检查评论文本是否包含屏蔽词
    function commentTextMatchesBlockWord(text, wordList) {
        if (!text || !wordList || wordList.length === 0) return null;
        for (const word of wordList) {
            const w = (word || '').trim();
            if (!w) continue;
            if (text.includes(w)) return w;
        }
        return null;
    }

    // 应用屏蔽词到一条评论（隐藏或仅标记）
    function applyBlockWordToComment(commentItem, matchedWord) {
        if (!commentItem || !commentItem.isConnected) return;
        if (commentItem.dataset.dyBlockWordApplied === '1') return;
        commentItem.dataset.dyBlockWordApplied = '1';
        commentItem.dataset.dyBlockWord = matchedWord;
        if (hideCommentsOnBlockWord) {
            commentItem.style.setProperty('display', 'none', 'important');
        } else {
            commentItem.style.setProperty('outline', '1px dashed #555', 'important');
        }
    }

    // 处理一条评论的关键词命中（命中后顺手拉黑该用户）
    async function handleCommentBlockWord(commentItem) {
        if (!commentItem || commentItem.dataset.dyBlockWordHandled === '1') return;
        if (!blockWordEnabled) return;
        if (!blockWords || blockWords.length === 0) return;

        const text = extractCommentText(commentItem);
        const matched = commentTextMatchesBlockWord(text, blockWords);
        if (!matched) return;

        applyBlockWordToComment(commentItem, matched);
        commentItem.dataset.dyBlockWordHandled = '1';

        // 命中 → 拉黑用户（不弹 toast 避免刷屏）
        const info = getCommentAuthorInfo(commentItem);
        if (info && info.secUid) {
            const processedKey = 'kw:' + info.secUid;
            if (batchBlockState.processedUids.has(processedKey)) return;
            batchBlockState.processedUids.add(processedKey);
            try {
                const result = await blockUser(info.secUid, false, true);
                if (result && result.success) {
                    recordBlockedUser(info, 'keyword:' + matched);
                    // 同步按钮状态
                    const btn = commentItem.querySelector('.douyin-comment-block-btn');
                    if (btn) markCommentBtnBlocked(btn);
                }
            } catch (e) {}
        }
    }

    // 批量处理当前所有评论的关键词
    function processAllCommentsForBlockWord() {
        if (!blockWordEnabled) return;
        if (!blockWords || blockWords.length === 0) return;
        const items = document.querySelectorAll('[data-e2e="comment-item"]');
        items.forEach(handleCommentBlockWord);
    }

    // 处理一条弹幕的关键词命中（命中后顺手拉黑该用户）
    // 弹幕与评论结构差异大：弹幕是数字 userId，评论是 sec_uid，所以独立实现
    async function handleDanmuBlockWord(danmuEl) {
        if (!danmuEl || danmuEl.dataset.dyBlockWordHandled === '1') return;
        if (!blockWordEnabled) return;
        if (!blockWords || blockWords.length === 0) return;
        if (!isValidDanmuElement(danmuEl)) return;

        const info = getDanmuAuthorInfo(danmuEl);
        const text = info.text;
        if (!text) return;

        const matched = commentTextMatchesBlockWord(text, blockWords);
        if (!matched) return;

        // 标记为已处理（无论后续拉黑成功与否，避免重复触发）
        danmuEl.dataset.dyBlockWordHandled = '1';
        danmuEl.dataset.dyBlockWord = matched;
        danmuEl.dataset.dyBlockWordApplied = '1';

        // 视觉：隐藏或加虚框
        if (hideCommentsOnBlockWord) {
            danmuEl.style.setProperty('display', 'none', 'important');
        } else {
            danmuEl.style.setProperty('outline', '1px dashed #555', 'important');
        }

        // 异步拉黑（弹幕是数字 userId，先转 sec_uid）
        if (!info.userId) return;
        try {
            const sec = await resolveDanmuUserToSecUid(info.userId);
            if (!sec) return;
            const processedKey = 'danmu-kw:' + sec;
            if (batchBlockState.processedUids.has(processedKey)) return;
            batchBlockState.processedUids.add(processedKey);

            const result = await blockUser(sec, false, true);
            if (result && result.success) {
                recordBlockedUser(enrichAuthorInfo({
                    secUid: sec,
                    nickname: info.nickname || ('uid_' + info.userId)
                }), 'danmu-keyword:' + matched);
                // 同步弹幕按钮的"已拉黑"态
                const btn = danmuEl.querySelector('.douyin-danmu-block-btn');
                if (btn) {
                    btn.title = '已拉黑';
                    btn.style.opacity = '0.5';
                }
            }
        } catch (e) {}
    }

    // 批量处理弹幕的关键词（在按钮已插入后调用）
    function processAllDanmuForBlockWord() {
        if (!blockWordEnabled) return;
        if (!blockWords || blockWords.length === 0) return;
        const items = document.querySelectorAll('.jnuqoLJD[data-danmu-id], .jnuqoLJD[data-danmaku-user-id]');
        items.forEach(handleDanmuBlockWord);
    }

    // 验证元素是否是有效的评论元素（包含用户信息）
    function isValidCommentElement(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        // 检查是否包含用户链接
        const hasUserLink = element.querySelector('a[href*="/user/"]') !== null ||
                           element.querySelector('a[href*="MS4wLj"]') !== null;

        // 检查是否包含评论内容
        const hasContent = element.textContent && element.textContent.trim().length > 0;

        // 检查是否是按钮本身（避免重复处理）
        const isButton = element.classList && (
            element.classList.contains('douyin-comment-block-btn') ||
            element.classList.contains('douyin-block-btn')
        );

        return hasUserLink && hasContent && !isButton;
    }

    // 验证元素是否是有效的弹幕元素（含 data-danmaku-user-id / data-danmu-id）
    function isValidDanmuElement(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
        if (element.classList && (
            element.classList.contains('douyin-comment-block-btn') ||
            element.classList.contains('douyin-block-btn') ||
            element.classList.contains('douyin-danmu-block-btn')
        )) return false;
        const userId = element.getAttribute('data-danmaku-user-id');
        const danmuId = element.getAttribute('data-danmu-id');
        if (!userId && !danmuId) return false;
        const textEl = element.querySelector('.danMuText, .CX7YtMrf');
        return !!(textEl && (textEl.textContent || '').trim());
    }

    // 从弹幕元素提取用户信息
    function getDanmuAuthorInfo(danmuEl) {
        const userId = danmuEl.getAttribute('data-danmaku-user-id') || '';
        const danmuId = danmuEl.getAttribute('data-danmu-id') || '';
        const textEl = danmuEl.querySelector('.danMuText, .CX7YtMrf');
        const text = textEl ? (textEl.textContent || '').trim() : '';
        const isAuthor = danmuEl.getAttribute('data-is-danmu-author') === 'true';
        return {
            userId: userId,
            danmuId: danmuId,
            nickname: text.slice(0, 30),
            text: text,
            isAuthor: isAuthor
        };
    }

    // 给单条弹幕创建迷你拉黑按钮
    function createDanmuBlockButton(danmuEl, danmuInfo) {
        const btn = document.createElement('div');
        btn.className = 'douyin-danmu-block-btn';
        btn.title = '拉黑该弹幕用户';
        btn.dataset.danmuUserId = danmuInfo.userId || '';
        btn.dataset.danmuId = danmuInfo.danmuId || '';
        btn.innerHTML = '<svg viewBox="0 0 1024 1024" width="14" height="14" style="fill:#ff4444;vertical-align:middle;"><path d="M671.9488 303.3088c0-112.9472-91.904-204.8512-204.8512-204.8512S262.2464 190.3104 262.2464 303.3088c0 72.6528 38.0928 136.6016 95.2832 172.9536-123.0336 44.8512-211.1488 163.072-211.1488 301.4144 0 14.1312 11.4688 25.6 25.6 25.6s25.6-11.4688 25.6-25.6c0-148.6336 120.9344-269.5168 269.5168-269.5168 112.9472 0 204.8512-91.904 204.8512-204.8512zM467.0976 456.96c-84.736 0-153.6512-68.9152-153.6512-153.6512s68.9152-153.6512 153.6512-153.6512 153.6512 68.9152 153.6512 153.6512-68.9152 153.6512-153.6512 153.6512zM706.5088 489.6768c-101.12 0-183.4496 82.2784-183.4496 183.4496 0 101.12 82.2784 183.4496 183.4496 183.4496 101.1712 0 183.4496-82.2784 183.4496-183.4496-0.0512-101.12-82.3296-183.4496-183.4496-183.4496z m-132.2496 183.4496c0-72.9088 59.3408-132.2496 132.2496-132.2496 27.904 0 53.8112 8.704 75.1616 23.552l-188.1088 177.3568c-12.2368-20.0192-19.3024-43.52-19.3024-68.6592z m132.2496 132.2496c-29.3376 0-56.4224-9.6256-78.3872-25.8048l189.2352-178.432a131.4304 131.4304 0 0 1 21.4016 71.9872c-0.0512 72.9088-59.3408 132.2496-132.2496 132.2496z" p-id="4149"></path></svg>';
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const userId = btn.dataset.danmuUserId;
            if (!userId) {
                showToast('弹幕用户 ID 缺失');
                return;
            }
            btn.style.pointerEvents = 'none';
            try {
                const secUid = await resolveDanmuUserToSecUid(userId);
                if (!secUid) {
                    showToast('无法获取该用户 sec_uid（可能接口受限）');
                    btn.style.pointerEvents = 'auto';
                    return;
                }
                const result = await blockUser(secUid, false, true);
                if (result && result.success) {
                    btn.title = '已拉黑';
                    btn.style.opacity = '0.5';
                    recordBlockedUser(enrichAuthorInfo({ secUid: secUid, nickname: danmuInfo.nickname || ('uid_' + userId) }), 'danmu');
                    showToast('已拉黑该弹幕用户');
                } else {
                    showToast('拉黑失败');
                }
            } catch (err) {
                console.error('[抖音一键拉黑] 弹幕拉黑异常:', err);
                showToast('拉黑失败：' + (err && err.message ? err.message : '未知'));
            } finally {
                btn.style.pointerEvents = 'auto';
            }
        });
        return btn;
    }

    // 把抖音的 numeric userId 转成 sec_uid（轻量接口）
    async function resolveDanmuUserToSecUid(userId) {
        if (!userId) return null;
        if (/^MS4wLj/.test(userId)) return userId; // 已是 sec_uid
        // 优先从直播间 WS 缓存查
        try {
            for (const [nick, info] of liveCommentUserMap.entries()) {
                if (info && info.userId === userId && info.secUid) {
                    return info.secUid;
                }
            }
        } catch (e) {}
        // 调抖音用户信息接口：https://www.douyin.com/aweme/v1/web/user/profile/other/
        try {
            const sec = await fetchUserSecUidByUserId(userId);
            if (sec) return sec;
        } catch (e) {}
        return null;
    }

    // 通过 userId (数字) 调抖音用户 profile 接口拿 sec_uid
    async function fetchUserSecUidByUserId(userId) {
        if (!userId) return null;
        const params = new URLSearchParams({
            aid: '6383',
            app_name: 'douyin_web',
            live_id: '1',
            device_platform: 'web',
            language: 'zh-CN',
            cookie_enabled: 'true',
            screen_width: String(window.screen.width || 1920),
            screen_height: String(window.screen.height || 1080),
            browser_language: navigator.language || 'zh-CN',
            browser_platform: navigator.platform || 'Win32',
            browser_name: 'Chrome',
            browser_version: getBrowserVersion(),
            os_name: 'Windows',
            os_version: '10',
            msToken: generateMsToken(),
            sec_user_id: '',
            publish_video_strategy_type: '2',
            source: 'publish',
            user_id: String(userId)
        });
        const url = 'https://www.douyin.com/aweme/v1/web/user/profile/other/?' + params.toString();
        return new Promise((resolve) => {
            try {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Referer': window.location.href,
                        'Cookie': document.cookie
                    },
                    timeout: 8000,
                    onload: function (resp) {
                        try {
                            const data = JSON.parse(resp.responseText || '{}');
                            const u = (data && data.user) || (data && data.data && data.data.user) || null;
                            if (u && (u.sec_uid || u.secUid)) {
                                resolve(u.sec_uid || u.secUid);
                                return;
                            }
                        } catch (e) {}
                        resolve(null);
                    },
                    onerror: function () { resolve(null); },
                    ontimeout: function () { resolve(null); }
                });
            } catch (e) { resolve(null); }
        });
    }

    // 把拉黑按钮插入到弹幕元素附近
    function insertButtonToDanmu(danmuEl, btn) {
        if (!danmuEl || danmuEl.querySelector('.douyin-danmu-block-btn')) return false;
        // 优先插到 .danMuText 后
        const textEl = danmuEl.querySelector('.danMuText, .CX7YtMrf');
        if (textEl && textEl.parentElement) {
            try {
                const wrap = document.createElement('span');
                wrap.style.cssText = 'display:inline-flex;align-items:center;margin-left:6px;vertical-align:middle;';
                wrap.appendChild(btn);
                textEl.insertAdjacentElement('afterend', wrap);
                return true;
            } catch (e) {}
        }
        // 兜底：插到 danmuEl 末尾
        try {
            danmuEl.appendChild(btn);
            return true;
        } catch (e) {}
        return false;
    }

    // 处理页面所有可见弹幕
    function processAllDanmu() {
        if (!blockWordEnabled && !logBlockedEnabled) return; // 没启用任何依赖则不渲染
        const items = document.querySelectorAll('.jnuqoLJD[data-danmu-id], .jnuqoLJD[data-danmaku-user-id]');
        items.forEach((el) => {
            if (!isValidDanmuElement(el)) return;
            if (el.querySelector('.douyin-danmu-block-btn')) return;
            const info = getDanmuAuthorInfo(el);
            const btn = createDanmuBlockButton(el, info);
            insertButtonToDanmu(el, btn);
        });
        // 按钮插完后再走关键词检测（独立函数，含去重 + 日志）
        if (blockWordEnabled) {
            processAllDanmuForBlockWord();
        }
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
                    // 记录到拉黑日志（视频详情页作者）
                    try {
                        recordBlockedUser(enrichAuthorInfo({
                            secUid: authorInfo.secUid,
                            userId: authorInfo.userId,
                            nickname: authorInfo.nickname || ''
                        }), 'video-author');
                    } catch (e) {}
                    // 拉黑后自动"不感兴趣"（仅对视频详情页作者）—— 已注释：功能不完善
                    // 视频不感兴趣藏在「更多」菜单里，自动打开菜单会跳页/拉黑按钮消失
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

    // 查找直播间聊天消息DOM元素
    function findLiveChatMessageElements() {
        // 策略1：精确选择器（当前抖音版本确认有效）
        const selectors = ['.webcast-chatroom___item', '.webcast-chatroom___item_new'];
        for (const sel of selectors) {
            try {
                const items = document.querySelectorAll(sel);
                if (items.length > 0) {
                    console.log('[抖音拉黑] 通过选择器找到聊天消息:', sel, items.length, '条');
                    return Array.from(items);
                }
            } catch (e) {}
        }

        // 策略2：部分匹配
        const partialSelectors = ['[class*="chatroom___item"]', '[class*="chat-room"]'];
        for (const sel of partialSelectors) {
            try {
                const items = document.querySelectorAll(sel);
                if (items.length > 0) {
                    console.log('[抖音拉黑] 通过部分匹配找到聊天消息:', sel, items.length, '条');
                    return Array.from(items);
                }
            } catch (e) {}
        }

        // 策略3：查找聊天区域滚动容器，取其直接子元素中的 .webcast-chatroom___item
        const scrollContainers = [];
        document.querySelectorAll('div').forEach(div => {
            try {
                const s = window.getComputedStyle(div);
                if ((s.overflowY === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'hidden') &&
                    div.children.length >= 2) {
                    scrollContainers.push(div);
                }
            } catch (e) {}
        });
        scrollContainers.sort((a, b) => b.children.length - a.children.length);
        for (const container of scrollContainers) {
            const chatItems = container.querySelectorAll('.webcast-chatroom___item, [class*="chatroom___item"]');
            if (chatItems.length >= 2) {
                console.log('[抖音拉黑] 滚动容器内找到聊天消息:', chatItems.length, '条');
                return Array.from(chatItems);
            }
        }

        console.log('[抖音拉黑] 未找到聊天消息元素');
        return [];
    }

    // 为直播间评论区插入拉黑按钮
    function insertButtonsForLiveStreamComments() {
        if (!isLiveStreamPage()) {
            return 0;
        }

        const commentItems = findLiveChatMessageElements();
        console.log('[抖音拉黑] 扫描直播间评论区, 找到', commentItems.length, '条消息');

        let insertedCount = 0;

        for (const item of commentItems) {
            if (item.querySelector('.live-block-btn')) continue;

            const userInfo = getLiveStreamUserInfo(item);
            if (!userInfo || !userInfo.nickname) continue;

            const btn = createLiveCommentBlockBtn(userInfo);
            if (!btn) continue;

            // 插入到 .NkS2Invn 容器的最前面
            let inserted = false;
            const nkContainer = item.querySelector('.NkS2Invn');
            if (nkContainer) {
                nkContainer.insertBefore(btn, nkContainer.firstChild);
                inserted = true;
            }
            // 兜底：插入到消息元素的开头
            if (!inserted && item.firstChild) {
                item.insertBefore(btn, item.firstChild);
                inserted = true;
            }

            if (inserted) insertedCount++;
        }

        return insertedCount;
    }

    // 创建直播间评论拉黑按钮
    function createLiveCommentBlockBtn(userInfo) {
        const btn = document.createElement('div');
        btn.className = 'live-block-btn';
        btn.dataset.blocked = 'false';
        btn.innerHTML = `
            <svg class="icon" style="width:1em;height:1em;vertical-align:middle;fill:currentColor;overflow:hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M671.9488 303.3088c0-112.9472-91.904-204.8512-204.8512-204.8512S262.2464 190.3104 262.2464 303.3088c0 72.6528 38.0928 136.6016 95.2832 172.9536-123.0336 44.8512-211.1488 163.072-211.1488 301.4144 0 14.1312 11.4688 25.6 25.6 25.6s25.6-11.4688 25.6-25.6c0-148.6336 120.9344-269.5168 269.5168-269.5168 112.9472 0 204.8512-91.904 204.8512-204.8512zM467.0976 456.96c-84.736 0-153.6512-68.9152-153.6512-153.6512s68.9152-153.6512 153.6512-153.6512 153.6512 68.9152 153.6512 153.6512-68.9152 153.6512-153.6512 153.6512zM706.5088 489.6768c-101.12 0-183.4496 82.2784-183.4496 183.4496 0 101.12 82.2784 183.4496 183.4496 183.4496 101.1712 0 183.4496-82.2784 183.4496-183.4496-0.0512-101.12-82.3296-183.4496-183.4496-183.4496z m-132.2496 183.4496c0-72.9088 59.3408-132.2496 132.2496-132.2496 27.904 0 53.8112 8.704 75.1616 23.552l-188.1088 177.3568c-12.2368-20.0192-19.3024-43.52-19.3024-68.6592z m132.2496 132.2496c-29.3376 0-56.4224-9.6256-78.3872-25.8048l189.2352-178.432a131.4304 131.4304 0 0 1 21.4016 71.9872c-0.0512 72.9088-59.3408 132.2496-132.2496 132.2496z"/></svg>
        `;

        btn.style.cssText = `
            display:inline-flex;align-items:center;justify-content:center;
            width:20px;height:20px;cursor:pointer;color:#8a9199;
            border-radius:4px;transition:all 0.2s;margin-left:6px;
            flex-shrink:0;
        `;

        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            btn.style.pointerEvents = 'none';

            const isCurrentlyBlocked = btn.dataset.blocked === 'true';
            let secUid = userInfo.secUid;

            if (!secUid && userInfo.nickname) {
                secUid = liveCommentUserMap.get(userInfo.nickname)?.secUid || null;
            }

            if (!secUid && userInfo.nickname) {
                showToast('正在获取用户信息...');
                secUid = await getLiveCommentSecUid(userInfo.nickname);
            }

            if (!secUid) {
                showToast('无法获取用户信息，请先点击用户名弹出资料卡');
                btn.style.pointerEvents = 'auto';
                return;
            }

            const result = await blockUser(secUid, isCurrentlyBlocked);

            if (result.success) {
                if (result.isBlocked) {
                    btn.dataset.blocked = 'true';
                    btn.style.color = '#fe2c55';
                    showToast('已拉黑 ' + userInfo.nickname);
                    // 记录到拉黑日志（直播间评论）
                    try {
                        recordBlockedUser(enrichAuthorInfo({
                            secUid: secUid,
                            nickname: userInfo.nickname || ''
                        }), 'live-comment');
                    } catch (e) {}
                } else {
                    btn.dataset.blocked = 'false';
                    btn.style.color = '#8a9199';
                    showToast('已解除拉黑 ' + userInfo.nickname);
                }
            }

            setTimeout(() => { btn.style.pointerEvents = 'auto'; }, 1000);
        });

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openBlockSettings();
        });

        return btn;
    }

    // 直播间聊天消息DOM变化监听
    function setupLiveStreamChatObserver() {
        if (!isLiveStreamPage()) return;

        const liveChatObserver = new MutationObserver((mutations) => {
            let hasNewChat = false;
            for (const m of mutations) {
                if (m.type === 'childList' && m.addedNodes.length > 0) {
                    hasNewChat = true;
                    break;
                }
            }
            if (hasNewChat) {
                insertButtonsForLiveStreamComments();
            }
        });

        // 先找到聊天容器再观察
        setTimeout(() => {
            const items = findLiveChatMessageElements();
            if (items.length > 0 && items[0].parentElement) {
                liveChatObserver.observe(items[0].parentElement, { childList: true });
                console.log('[抖音拉黑] 直播间聊天变化监听已启动');
            } else {
                liveChatObserver.observe(document.body, { childList: true, subtree: true });
                console.log('[抖音拉黑] 直播间聊天监听已启动（全局模式，等待聊天区域出现）');
            }
        }, 1000);
    }

    // 为推荐页直播间播放器插入拉黑按钮
    // 从推荐页直播卡片的info区域提取用户信息（user链接中的 sec_uid）
    function getRecommendLiveStreamInfo(container) {
        // 查找包含 sec_uid 的用户链接
        const userLink = container.querySelector('a[href*="/user/MS4wLj"]');
        if (!userLink) return null;

        const href = userLink.getAttribute('href') || '';
        const secUidMatch = href.match(/MS4wLj[A-Za-z0-9_\-]{15,}/);
        if (!secUidMatch) return null;

        const nickname = userLink.textContent.replace(/^@/, '').trim();

        return {
            secUid: secUidMatch[0],
            nickname: nickname || '主播'
        };
    }

    function insertButtonForRecommendLiveStream() {
        // 只在首页推荐页执行
        if (isVideoDetailPage() || isLiveStreamPage()) {
            return 0;
        }

        let totalInserted = 0;

        // 途径1：播放器模式的直播（带 douyin-player-controls）
        const playerControls = document.querySelector('.douyin-player-controls');
        if (playerControls && !document.querySelector('.douyin-recommend-live-block-btn')) {
            const hostInfo = getLiveStreamHostInfo();
            if (hostInfo && hostInfo.secUid) {
                console.log('[抖音一键拉黑] 推荐页播放器直播主播:', hostInfo);
                const btn = createRecommendLiveBlockBtn(hostInfo);
                const controlsRight = document.querySelector('.douyin-player-controls-right');
                if (controlsRight) {
                    controlsRight.appendChild(btn);
                    totalInserted++;
                }
            }
        }

        // 途径2：卡片信息区模式的直播（feed-live，user链接中包含sec_uid）
        const feedLiveCards = document.querySelectorAll('[data-e2e="feed-live"]');
        for (const card of feedLiveCards) {
            if (card.querySelector('.douyin-recommend-live-block-btn')) continue;

            const hostInfo = getRecommendLiveStreamInfo(card);
            if (!hostInfo || !hostInfo.secUid) continue;

            console.log('[抖音一键拉黑] 推荐页卡片直播主播:', hostInfo);

            const btn = createRecommendLiveBlockBtn(hostInfo);

            // 插入到卡片信息区域（昵称旁边）
            const infoArea = card.querySelector('.mW1rnCF4, .USi52T4u, [class*="info"]');
            const nickArea = card.querySelector('.c9YbeHv6, [class*="nickname"]');
            if (infoArea && nickArea && nickArea.parentElement) {
                nickArea.parentElement.insertBefore(btn, nickArea.nextSibling);
            } else if (infoArea) {
                infoArea.appendChild(btn);
            } else {
                card.appendChild(btn);
            }
            totalInserted++;
        }

        if (totalInserted > 0) {
            console.log('[抖音一键拉黑] 推荐页直播间拉黑按钮已插入', totalInserted, '个');
        }
        return totalInserted;
    }

    function createRecommendLiveBlockBtn(hostInfo) {
        const btn = document.createElement('div');
        btn.className = 'douyin-recommend-live-block-btn';
        btn.dataset.blocked = 'false';
        btn.innerHTML = `
            <svg class="icon" style="width:1em;height:1em;vertical-align:middle;fill:currentColor;overflow:hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M671.9488 303.3088c0-112.9472-91.904-204.8512-204.8512-204.8512S262.2464 190.3104 262.2464 303.3088c0 72.6528 38.0928 136.6016 95.2832 172.9536-123.0336 44.8512-211.1488 163.072-211.1488 301.4144 0 14.1312 11.4688 25.6 25.6 25.6s25.6-11.4688 25.6-25.6c0-148.6336 120.9344-269.5168 269.5168-269.5168 112.9472 0 204.8512-91.904 204.8512-204.8512zM467.0976 456.96c-84.736 0-153.6512-68.9152-153.6512-153.6512s68.9152-153.6512 153.6512-153.6512 153.6512 68.9152 153.6512 153.6512-68.9152 153.6512-153.6512 153.6512zM706.5088 489.6768c-101.12 0-183.4496 82.2784-183.4496 183.4496 0 101.12 82.2784 183.4496 183.4496 183.4496 101.1712 0 183.4496-82.2784 183.4496-183.4496-0.0512-101.12-82.3296-183.4496-183.4496-183.4496z m-132.2496 183.4496c0-72.9088 59.3408-132.2496 132.2496-132.2496 27.904 0 53.8112 8.704 75.1616 23.552l-188.1088 177.3568c-12.2368-20.0192-19.3024-43.52-19.3024-68.6592z m132.2496 132.2496c-29.3376 0-56.4224-9.6256-78.3872-25.8048l189.2352-178.432a131.4304 131.4304 0 0 1 21.4016 71.9872c-0.0512 72.9088-59.3408 132.2496-132.2496 132.2496z"/></svg>
        `;

        btn.style.cssText = `
            display:inline-flex;align-items:center;justify-content:center;
            width:28px;height:28px;cursor:pointer;color:#fff;
            border-radius:4px;transition:all 0.2s;
            background:rgba(0,0,0,0.3);flex-shrink:0;margin-left:6px;
        `;

        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            btn.style.pointerEvents = 'none';
            const isCurrentlyBlocked = btn.dataset.blocked === 'true';
            const result = await blockUser(hostInfo.secUid, isCurrentlyBlocked);
            if (result.success) {
                if (result.isBlocked) {
                    btn.dataset.blocked = 'true';
                    btn.style.background = 'rgba(254,44,85,0.6)';
                    showToast('已拉黑 ' + (hostInfo.nickname || '主播'));
                    // 记录到拉黑日志（推荐页直播间卡片）
                    try {
                        recordBlockedUser(enrichAuthorInfo({
                            secUid: hostInfo.secUid,
                            nickname: hostInfo.nickname || ''
                        }), 'live-recommend');
                    } catch (e) {}
                } else {
                    btn.dataset.blocked = 'false';
                    btn.style.background = 'rgba(0,0,0,0.3)';
                    showToast('已解除拉黑');
                }
            }
            setTimeout(() => { btn.style.pointerEvents = 'auto'; }, 1000);
        });

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openBlockSettings();
        });

        return btn;
    }

    // 为直播间主播信息侧边栏插入拉黑按钮
    async function insertButtonForLiveStreamHost() {
        if (!isLiveStreamPage()) {
            return 0;
        }

        // 通用方式查找主播信息容器
        const hostInfo = await getLiveStreamHostFromSidePanel();
        if (!hostInfo || !hostInfo.secUid) {
            return 0;
        }

        console.log('[抖音一键拉黑] 直播间主播信息:', hostInfo);

        // 查找插入位置——跟随按钮
        const followBtn = document.querySelector('[data-e2e="feed-follow-icon"], .follow, [class*="follow"]');
        if (followBtn) {
            if (followBtn.parentElement) {
                if (followBtn.parentElement.querySelector('.live-host-block-btn')) return 0;

                const btn = createLiveHostBlockBtn(hostInfo);
                followBtn.parentElement.insertBefore(btn, followBtn.nextSibling);
                return 1;
            }
        }

        // 兜底：查找包含主播头像的容器
        const avatarImg = document.querySelector('img[src*="douyinpic.com"]');
        if (avatarImg) {
            let container = avatarImg.parentElement;
            for (let i = 0; i < 8 && container; i++) {
                if (container.querySelector('.live-host-block-btn')) return 0;
                const texts = container.querySelectorAll('span, div');
                for (const t of texts) {
                    if (t.textContent && t.textContent.trim().length >= 2 && t.textContent.trim().length <= 30) {
                        if (t.textContent.trim() === hostInfo.nickname) {
                            const btn = createLiveHostBlockBtn(hostInfo);
                            t.parentElement.insertBefore(btn, t.nextSibling);
                            return 1;
                        }
                    }
                }
                container = container.parentElement;
            }
        }

        return 0;
    }

    function createLiveHostBlockBtn(hostInfo) {
        const btn = document.createElement('div');
        btn.className = 'live-host-block-btn';
        btn.dataset.blocked = 'false';
        btn.innerHTML = `
            <svg class="icon" style="width:1em;height:1em;vertical-align:middle;fill:currentColor;overflow:hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M671.9488 303.3088c0-112.9472-91.904-204.8512-204.8512-204.8512S262.2464 190.3104 262.2464 303.3088c0 72.6528 38.0928 136.6016 95.2832 172.9536-123.0336 44.8512-211.1488 163.072-211.1488 301.4144 0 14.1312 11.4688 25.6 25.6 25.6s25.6-11.4688 25.6-25.6c0-148.6336 120.9344-269.5168 269.5168-269.5168 112.9472 0 204.8512-91.904 204.8512-204.8512zM467.0976 456.96c-84.736 0-153.6512-68.9152-153.6512-153.6512s68.9152-153.6512 153.6512-153.6512 153.6512 68.9152 153.6512 153.6512-68.9152 153.6512-153.6512 153.6512zM706.5088 489.6768c-101.12 0-183.4496 82.2784-183.4496 183.4496 0 101.12 82.2784 183.4496 183.4496 183.4496 101.1712 0 183.4496-82.2784 183.4496-183.4496-0.0512-101.12-82.3296-183.4496-183.4496-183.4496z m-132.2496 183.4496c0-72.9088 59.3408-132.2496 132.2496-132.2496 27.904 0 53.8112 8.704 75.1616 23.552l-188.1088 177.3568c-12.2368-20.0192-19.3024-43.52-19.3024-68.6592z m132.2496 132.2496c-29.3376 0-56.4224-9.6256-78.3872-25.8048l189.2352-178.432a131.4304 131.4304 0 0 1 21.4016 71.9872c-0.0512 72.9088-59.3408 132.2496-132.2496 132.2496z"/></svg>
        `;
        btn.style.cssText = `
            display:flex;align-items:center;justify-content:center;
            width:36px;height:36px;cursor:pointer;color:#61666d;
            border-radius:8px;transition:all 0.2s;
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
                    // 记录到拉黑日志（直播间主播）
                    try {
                        recordBlockedUser(enrichAuthorInfo({
                            secUid: hostInfo.secUid,
                            nickname: hostInfo.nickname || ''
                        }), 'live-host');
                    } catch (e) {}
                } else {
                    btn.dataset.blocked = 'false';
                    btn.style.color = '#61666d';
                    btn.style.background = 'transparent';
                    showToast('已解除拉黑 ' + hostInfo.nickname);
                }
            }
            setTimeout(() => { btn.style.pointerEvents = 'auto'; }, 1000);
        });
        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openBlockSettings();
        });
        return btn;
    }

    // 主初始化函数 - 增强版
    function init() {
        console.log('[抖音拉黑] 初始化 v5.5 (关键词拉黑 + 拉黑日志版)');

        // 启动WebSocket拦截器（必须最早执行）
        setupWebSocketInterceptor();

        // 首次立即插入
        insertButtonsForAll();
        insertButtonsForComments();

        if (isVideoDetailPage()) {
            insertButtonForVideoDetailPage();
        }

        if (isLiveStreamPage()) {
            insertButtonsForLiveStreamComments();
            insertButtonForLiveStreamHost();
            setupLiveStreamChatObserver();
        }

        // 推荐页直播间
        insertButtonForRecommendLiveStream();

        // 启动关键词拉黑扫描
        processAllCommentsForBlockWord();

        // 启动弹幕按钮扫描
        processAllDanmu();

        // 页面可见性变化时的处理
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log('[抖音一键拉黑] 页面变为可见，重新检查评论区');
                insertButtonsForComments();
                processAllCommentsForBlockWord();
                processAllDanmu();
                if (isLiveStreamPage()) {
                    insertButtonsForLiveStreamComments();
                    insertButtonForLiveStreamHost();
                    setupLiveStreamChatObserver();
                }
            }
        });
    }

    // 监听新视频加载 - 增强版
    function observeNewVideos() {
        console.log('[抖音一键拉黑] 开始监听新视频和评论区变化');

        let debounceTimer = null;
        let commentDebounceTimer = null;
        let lastProcessedComments = new Set(); // 用于去重

        const observer = new MutationObserver((mutations) => {
            let hasNewVideo = false;
            let hasNewComment = false;
            let newCommentItems = []; // 收集新的评论项

            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 检测视频区域 - 基于 data-e2e 和结构关系（避免使用 class）
                            // 方式1：检测到包含视频头像链接的新节点
                            if (node.querySelector && node.querySelector('a[data-e2e="video-avatar"]')) {
                                hasNewVideo = true;
                            }
                            // 方式2：检测到包含用户链接的新节点
                            else if (node.querySelector && node.querySelector('a[href*="/user/"]')) {
                                // 进一步验证是否包含点赞图标，确认是互动区域
                                if (node.querySelector('[data-e2e="video-player-digg"]')) {
                                    hasNewVideo = true;
                                }
                            }
                            // 方式3：检测到包含关注图标的新节点
                            else if (node.querySelector && node.querySelector('[data-e2e="feed-follow-icon"]')) {
                                // 进一步验证是否包含点赞图标
                                if (node.querySelector('[data-e2e="video-player-digg"]')) {
                                    hasNewVideo = true;
                                }
                            }
                            // 方式4：检测到包含点赞图标的新节点（可能是新的互动面板）
                            else if (node.getAttribute && node.getAttribute('data-e2e') === 'video-player-digg') {
                                hasNewVideo = true;
                            }
                            // 方式5：检测到视频播放器相关节点
                            else if (node.getAttribute && (
                                node.getAttribute('data-e2e') === 'video-player' ||
                                node.getAttribute('data-e2e') === 'slide-content'
                            )) {
                                hasNewVideo = true;
                            }

                            // 检测评论区 - 基于 data-e2e
                            // 方式1：直接检测评论项
                            if (node.getAttribute && node.getAttribute('data-e2e') === 'comment-item') {
                                hasNewComment = true;
                                if (!lastProcessedComments.has(node)) {
                                    newCommentItems.push(node);
                                    lastProcessedComments.add(node);
                                }
                            }
                            // 方式2：检测包含评论项的容器
                            else if (node.querySelector) {
                                const commentItems = node.querySelectorAll('[data-e2e="comment-item"]');
                                if (commentItems.length > 0) {
                                    hasNewComment = true;
                                    commentItems.forEach(item => {
                                        if (!lastProcessedComments.has(item)) {
                                            newCommentItems.push(item);
                                            lastProcessedComments.add(item);
                                        }
                                    });
                                }
                            }
                        }
                    }
                }

                if (hasNewVideo && hasNewComment) break;
            }

            // 处理视频变化
            if (hasNewVideo) {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }

                debounceTimer = setTimeout(() => {
                    console.log('[抖音一键拉黑] 检测到新视频，插入按钮');
                    insertButtonsForAll();
                    insertButtonsForComments();
                    if (isLiveStreamPage()) {
                        insertButtonsForLiveStreamComments();
                        insertButtonForLiveStreamHost();
                        setupLiveStreamChatObserver();
                    }
                }, 150);
            }

            // 处理评论区变化 - 优先处理单个新评论项
            if (hasNewComment) {
                if (commentDebounceTimer) {
                    clearTimeout(commentDebounceTimer);
                }

                commentDebounceTimer = setTimeout(() => {
                    if (newCommentItems.length > 0) {
                        console.log('[抖音一键拉黑] 检测到', newCommentItems.length, '条新评论，单独处理');
                        // 只处理新的评论项
                        for (const item of newCommentItems) {
                            if (isValidCommentElement(item) && !item.querySelector('.douyin-comment-block-btn')) {
                                insertButtonForComment(item);
                            }
                            // 关键词拉黑扫描
                            handleCommentBlockWord(item);
                        }
                    } else {
                        // 如果没有收集到具体的新评论项，执行全面检查
                        console.log('[抖音一键拉黑] 检测到评论区变化，全面检查');
                        insertButtonsForComments();
                        processAllCommentsForBlockWord();
                    }

                    // ===== 弹幕：检测到节点变化就扫一遍 =====
                    processAllDanmu();

                    // ===== 批量模式：新评论出现时立即触发扫描 =====
                    if (batchBlockState.active && Date.now() - batchBlockState.startTime >= 5000) {
                        setTimeout(processBatchBlockQueue, 0);
                    }
                }, 100);
            }

            // 清理已处理集合，防止内存泄漏（保留最近1000个）
            if (lastProcessedComments.size > 1000) {
                const iterator = lastProcessedComments.values();
                for (let i = 0; i < 500; i++) {
                    const value = iterator.next().value;
                    if (value) lastProcessedComments.delete(value);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[抖音一键拉黑] 已启动视频和评论区监听');
    }

    // ========== 批量拉黑模式（长按快捷键 >5秒） ==========
    const batchBlockState = {
        active: false,
        startTime: 0,
        timer: null,
        processedUids: new Set(),
        running: false,
        authorSecUid: null,      // 当前视频作者的 sec_uid
        authorBtn: null,         // 视频作者对应的评论按钮
        authorPending: false,    // 是否还有作者未拉黑
        phaseLabel: '扫描评论区中…',
        stats: { success: 0, failed: 0, authorPending: 0 }
    };

    // 提取当前视频作者 sec_uid（按优先级：全局变量 → 视频详情按钮 → 视频卡片按钮）
    function getCurrentVideoAuthorSecUid() {
        const win = unsafeWindow || window;
        const candidates = [
            () => win.__INITIAL_STATE__?.user?.sec_uid,
            () => win.__INITIAL_STATE__?.aweme?.author?.sec_uid,
            () => win.__INITIAL_STATE__?.awemeItem?.author?.sec_uid,
            () => win.__INITIAL_STATE__?.video?.author?.sec_uid,
            () => win.__INITIAL_STATE__?.videoInfo?.author?.sec_uid,
            () => win.__INITIAL_STATE__?.currentVideo?.author?.sec_uid,
            () => win.__SSR_DATA__?.user?.sec_uid,
            () => win.__SSR_DATA__?.aweme?.author?.sec_uid,
            () => win.__INITIAL_PROPS__?.aweme?.author?.sec_uid,
            () => win._ROUTER_DATA?.loaderData?.aweme?.aweme?.author?.sec_uid,
            () => {
                // 兜底：尝试从页面上的"作者主页"链接获取
                const authorLink = document.querySelector('a[data-e2e="video-info-username"], [data-e2e="user-info"] a[href*="/user/"], .user-info a[href*="/user/"]');
                if (authorLink) {
                    const href = authorLink.getAttribute('href') || '';
                    const m = href.match(/MS4wLj[A-Za-z0-9_\-]+/);
                    return m ? m[0] : null;
                }
                return null;
            },
            () => {
                // 兜底 2：从 videoPlayer / 视频容器中已插入的拉黑按钮反推
                const btn = document.querySelector('.douyin-block-btn[data-sec-uid]');
                if (btn) {
                    const sec = btn.dataset.secUid;
                    if (sec && sec.startsWith('MS4wLj')) return sec;
                }
                return null;
            }
        ];
        for (const fn of candidates) {
            try {
                const v = fn();
                if (v && typeof v === 'string' && v.startsWith('MS4wLj')) {
                    return v;
                }
            } catch (e) {}
        }
        return null;
    }

    function showBatchBlockIndicator() {
        let indicator = document.getElementById('douyin-batch-block-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'douyin-batch-block-indicator';
            indicator.innerHTML = `
                <div class="batch-header">
                    <span class="batch-pulse-dot"></span>
                    <span>批量拉黑进行中</span>
                </div>
                <div class="batch-phase" id="batch-phase">扫描评论区中…</div>
                <div class="batch-stats">
                    <span>成功 <span class="batch-count" id="batch-success">0</span></span>
                    <span>失败 <span class="batch-count" id="batch-failed">0</span></span>
                    <span>作者待拉黑 <span class="batch-count" id="batch-author-pending">0</span></span>
                </div>
            `;
            document.body.appendChild(indicator);
        }
        const s = document.getElementById('batch-success');
        const f = document.getElementById('batch-failed');
        const p = document.getElementById('batch-author-pending');
        if (s) s.textContent = batchBlockState.stats.success;
        if (f) f.textContent = batchBlockState.stats.failed;
        if (p) p.textContent = batchBlockState.stats.authorPending;
        indicator.style.display = 'block';
    }

    function hideBatchBlockIndicator() {
        const indicator = document.getElementById('douyin-batch-block-indicator');
        if (indicator) indicator.style.display = 'none';
    }

    function updateBatchIndicator() {
        const indicator = document.getElementById('douyin-batch-block-indicator');
        if (indicator && indicator.style.display === 'block') {
            const s = document.getElementById('batch-success');
            const f = document.getElementById('batch-failed');
            const p = document.getElementById('batch-author-pending');
            const ph = document.getElementById('batch-phase');
            if (s) s.textContent = batchBlockState.stats.success;
            if (f) f.textContent = batchBlockState.stats.failed;
            if (p) p.textContent = batchBlockState.stats.authorPending;
            if (ph && batchBlockState.phaseLabel) ph.textContent = batchBlockState.phaseLabel;
        }
    }

    function startBatchBlock() {
        if (batchBlockState.active) return;
        batchBlockState.active = true;
        batchBlockState.startTime = Date.now();
        batchBlockState.stats = { success: 0, failed: 0, authorPending: 0 };
        batchBlockState.authorSecUid = null;
        batchBlockState.authorBtn = null;
        batchBlockState.authorPending = false;
        batchBlockState.phaseLabel = '扫描评论区中…';
        console.log('[抖音一键拉黑] 长按检测启动, batchLongPressMs=', batchLongPressMs, ' batchConcurrency=', batchConcurrency, ' blockVideoAuthorAfterBatch=', blockVideoAuthorAfterBatch);

        // 提前预取视频作者 sec_uid（多路兜底）
        try {
            batchBlockState.authorSecUid = getCurrentVideoAuthorSecUid();
            console.log('[抖音一键拉黑] 当前视频作者 sec_uid:', batchBlockState.authorSecUid);
        } catch (e) {
            console.warn('[抖音一键拉黑] 预取作者 sec_uid 异常:', e);
        }

        // 定时器：长按达到 batchLongPressMs 之后才进入批量模式
        if (batchBlockState.timer) {
            clearTimeout(batchBlockState.timer);
            batchBlockState.timer = null;
        }
        batchBlockState.timer = setTimeout(() => {
            if (batchBlockState.active) {
                enterBatchBlockMode();
            }
        }, batchLongPressMs);
    }

    function enterBatchBlockMode() {
        showToast('批量拉黑模式已启动，并发拉黑中');
        showBatchBlockIndicator();
        processBatchBlockQueue();
    }

    // 用户停止长按：先停止扫描，最后拉黑作者
    async function stopBatchBlock() {
        const duration = Date.now() - batchBlockState.startTime;
        const wasActive = batchBlockState.active;

        batchBlockState.active = false;
        if (batchBlockState.timer) {
            clearTimeout(batchBlockState.timer);
            batchBlockState.timer = null;
        }

        if (!wasActive) return;

        if (duration < batchLongPressMs) {
            // 短按：执行原有单条拉黑逻辑
            triggerBlockFromShortcut();
        } else {
            // 长按结束：等待当前并发队列结束，最后拉黑作者
            batchBlockState.phaseLabel = '收尾中…';
            updateBatchIndicator();

            // 等待 processBatchBlockQueue 自行退出
            await waitForBatchIdle();

            // 最后拉黑作者：每次重取一次 sec_uid（长按期间可能未及时识别）
            let authorSecUid = batchBlockState.authorSecUid;
            if (!authorSecUid) {
                try {
                    authorSecUid = getCurrentVideoAuthorSecUid();
                    batchBlockState.authorSecUid = authorSecUid;
                } catch (e) {}
            }
            console.log('[抖音一键拉黑] 批量结束, blockVideoAuthorAfterBatch=', blockVideoAuthorAfterBatch, ' authorSecUid=', authorSecUid, ' 已处理=', batchBlockState.processedUids.has(authorSecUid));

            if (blockVideoAuthorAfterBatch && authorSecUid && !batchBlockState.processedUids.has(authorSecUid)) {
                batchBlockState.phaseLabel = '拉黑视频作者…';
                updateBatchIndicator();
                try {
                    const result = await blockUser(authorSecUid, false, true);
                    if (result && result.success) {
                        batchBlockState.stats.success++;
                        // 同步更新作者评论按钮的状态
                        if (batchBlockState.authorBtn && batchBlockState.authorBtn.isConnected) {
                            markCommentBtnBlocked(batchBlockState.authorBtn);
                        }
                        // 同时更新页面上所有"作者标记"的评论按钮
                        updateAuthorCommentBtns(authorSecUid);
                        // 同步更新视频详情页作者拉黑按钮的状态（与点击"不感兴趣"那条独立按钮）
                        try {
                            const detailBtn = document.querySelector('.douyin-video-detail-block-btn');
                            if (detailBtn && detailBtn.dataset.blocked !== 'true') {
                                detailBtn.dataset.blocked = 'true';
                                detailBtn.style.color = '#fe2c55';
                                detailBtn.title = '已拉黑';
                            }
                        } catch (e) {}
                        // 记录作者拉黑
                        try {
                            const nick = batchBlockState.authorBtn ? extractNicknameFromBtn(batchBlockState.authorBtn) : '';
                            const avatar = batchBlockState.authorBtn ? extractAvatarFromBtn(batchBlockState.authorBtn) : '';
                            recordBlockedUser(enrichAuthorInfo({
                                secUid: authorSecUid,
                                nickname: nick,
                                avatar: avatar
                            }), 'batch-author');
                        } catch (e) {}
                    } else {
                        batchBlockState.stats.failed++;
                    }
                } catch (e) {
                    batchBlockState.stats.failed++;
                }
                updateBatchIndicator();
            } else if (blockVideoAuthorAfterBatch && !authorSecUid) {
                batchBlockState.phaseLabel = '未识别到视频作者';
                updateBatchIndicator();
            }

            setTimeout(() => {
                hideBatchBlockIndicator();
                const { success, failed } = batchBlockState.stats;
                showToast(`批量拉黑结束：成功 ${success}，失败 ${failed}`);
            }, 600);
        }

        // 60秒后清空已处理集合，避免内存泄漏
        setTimeout(() => {
            batchBlockState.processedUids.clear();
            batchBlockState.stats = { success: 0, failed: 0, authorPending: 0 };
        }, 60000);
    }

    // 等待批处理空闲（队列执行完）
    function waitForBatchIdle(maxWait = 5000) {
        return new Promise((resolve) => {
            const t0 = Date.now();
            const tick = () => {
                if (!batchBlockState.running || (Date.now() - t0) > maxWait) {
                    resolve();
                    return;
                }
                setTimeout(tick, 100);
            };
            tick();
        });
    }

    // 标记评论按钮为"已拉黑"状态（含过渡动画）
    function markCommentBtnBlocked(btn) {
        if (!btn || !btn.isConnected) return;
        try {
            btn.dataset.blocked = 'true';
            btn.classList.remove('blocked');
            btn.classList.add('blocked', 'batch-just-blocked');
            btn.title = '已拉黑';
            // 图标颜色：与普通已拉黑态一致
            const svg = btn.querySelector('svg');
            if (svg) {
                const path = svg.querySelector('path');
                if (path) path.setAttribute('fill', '#ff4444');
            }
            setTimeout(() => btn.classList.remove('batch-just-blocked'), 500);
        } catch (e) {}
    }

    // 批量更新页面上所有作者评论按钮(给作者评论添加 data-author-comment 标记)
    function updateAuthorCommentBtns(authorSecUid) {
        if (!authorSecUid) return;
        const btns = document.querySelectorAll('.douyin-comment-block-btn[data-author-comment="true"]');
        btns.forEach(btn => {
            if (btn.dataset.secUid === authorSecUid) {
                markCommentBtnBlocked(btn);
            }
        });
    }

    // 主并发批量拉黑队列 - 10 并发（可配置），作者评论延后
    async function processBatchBlockQueue() {
        if (batchBlockState.running) return;
        batchBlockState.running = true;

        const CONCURRENCY = batchConcurrency;
        const authorSecUid = batchBlockState.authorSecUid;

        while (batchBlockState.active) {
            // 扫描所有未处理的评论按钮
            const allBtns = Array.from(document.querySelectorAll('.douyin-comment-block-btn:not([data-blocked="true"])'));

            // 把作者评论的按钮也识别出来（用于最后拉黑）
            const authorBtns = [];
            const normalBtns = [];
            for (const btn of allBtns) {
                const secUid = btn.dataset.secUid;
                if (!secUid) continue;
                if (batchBlockState.processedUids.has(secUid)) continue;

                // 给按钮打上"作者评论"标记，便于后续状态同步
                if (authorSecUid && secUid === authorSecUid) {
                    btn.dataset.authorComment = 'true';
                    authorBtns.push(btn);
                } else {
                    normalBtns.push(btn);
                }
            }

            // 记录作者评论数量（用于指示器）
            if (authorBtns.length > 0) {
                batchBlockState.authorPending = true;
                batchBlockState.stats.authorPending = authorBtns.length;
                // 记录第一个作者按钮用于停止后拉黑作者
                if (!batchBlockState.authorBtn) {
                    batchBlockState.authorBtn = authorBtns[0];
                }
            } else {
                batchBlockState.stats.authorPending = 0;
            }

            // 优先拉黑非作者评论
            if (normalBtns.length === 0) {
                batchBlockState.phaseLabel = authorBtns.length > 0
                    ? '已识别作者评论，长按结束后再拉黑…'
                    : '等待新评论…';
                updateBatchIndicator();
                await new Promise(r => setTimeout(r, 300));
                continue;
            }

            batchBlockState.phaseLabel = authorBtns.length > 0
                ? `拉黑普通评论中（${authorBtns.length} 条作者评论待最后处理）`
                : '拉黑评论中…';
            updateBatchIndicator();

            // 并发执行
            const queue = normalBtns.slice();
            const workers = [];
            for (let i = 0; i < CONCURRENCY; i++) {
                workers.push((async () => {
                    while (batchBlockState.active && queue.length > 0) {
                        const btn = queue.shift();
                        if (!btn) break;
                        if (!batchBlockState.active) break;
                        if (btn.dataset.blocked === 'true') continue;
                        const secUid = btn.dataset.secUid;
                        if (!secUid) continue;
                        if (batchBlockState.processedUids.has(secUid)) continue;
                        batchBlockState.processedUids.add(secUid);

                        try {
                            const result = await blockUser(secUid, false, true);
                            if (result && result.success) {
                                batchBlockState.stats.success++;
                                if (btn.isConnected) markCommentBtnBlocked(btn);
                                // 记录到拉黑日志
                                try {
                                    const info = enrichAuthorInfo({
                                        secUid: secUid,
                                        nickname: extractNicknameFromBtn(btn),
                                        avatar: extractAvatarFromBtn(btn)
                                    });
                                    recordBlockedUser(info, 'batch');
                                } catch (e) {}
                            } else {
                                batchBlockState.stats.failed++;
                            }
                        } catch (e) {
                            batchBlockState.stats.failed++;
                        }

                        // 减少频率：每 3 个成功/失败刷新一次指示器
                        if ((batchBlockState.stats.success + batchBlockState.stats.failed) % 3 === 0) {
                            updateBatchIndicator();
                        }
                    }
                })());
            }
            await Promise.all(workers);

            // 退出条件：用户已松开
            if (!batchBlockState.active) break;

            // 一轮跑完，短暂休息后继续扫描（支持动态加载的新评论）
            await new Promise(r => setTimeout(r, 200));
        }

        hideBatchBlockIndicator();
        batchBlockState.running = false;
    }

    // 键盘快捷键功能
    const STORAGE_KEY = 'douyin-block-shortcut-key';
    const STORAGE_MODIFIERS_KEY = 'douyin-block-shortcut-modifiers';
    const STORAGE_COMMENT_SHORTCUT_KEY = 'douyin-block-comment-shortcut-enabled';
    const STORAGE_LONG_PRESS_MS = 'douyin-block-longpress-ms';
    const STORAGE_BATCH_CONCURRENCY = 'douyin-block-batch-concurrency';
    const STORAGE_BLOCK_VIDEO_AUTHOR = 'douyin-block-block-video-author';
    const STORAGE_BLOCK_WORDS = 'douyin-block-words';
    const STORAGE_BLOCK_WORD_ENABLED = 'douyin-block-word-enabled';
    const STORAGE_HIDE_ON_BLOCK_WORD = 'douyin-block-hide-on-blockword';
    const STORAGE_LOG_BLOCKED = 'douyin-block-log-enabled';
    const STORAGE_LOG_DATA = 'douyin-block-log-data';
    // const STORAGE_AUTO_DISLIKE = 'douyin-block-auto-dislike'; // 已注释：自动不感兴趣功能不完善
    let blockShortcutKey = localStorage.getItem(STORAGE_KEY) || 'Q';
    let blockShortcutModifiers = JSON.parse(localStorage.getItem(STORAGE_MODIFIERS_KEY) || '{}');
    let commentShortcutEnabled = localStorage.getItem(STORAGE_COMMENT_SHORTCUT_KEY) !== 'false'; // 默认开启
    let batchLongPressMs = parseInt(localStorage.getItem(STORAGE_LONG_PRESS_MS) || '5000', 10);
    // let autoDislikeOnBlock = localStorage.getItem(STORAGE_AUTO_DISLIKE) === 'true'; // 已注释
    if (!Number.isFinite(batchLongPressMs) || batchLongPressMs < 500) batchLongPressMs = 5000;
    let batchConcurrency = parseInt(localStorage.getItem(STORAGE_BATCH_CONCURRENCY) || '10', 10);
    if (!Number.isFinite(batchConcurrency) || batchConcurrency < 1) batchConcurrency = 10;
    if (batchConcurrency > 50) batchConcurrency = 50;
    let blockVideoAuthorAfterBatch = localStorage.getItem(STORAGE_BLOCK_VIDEO_AUTHOR) !== 'false'; // 默认开启
    // 关键词拉黑相关
    let blockWords = [];
    try {
        const raw = localStorage.getItem(STORAGE_BLOCK_WORDS) || '';
        blockWords = raw.split('\n').map(s => s.trim()).filter(Boolean);
    } catch (e) { blockWords = []; }
    let blockWordEnabled = localStorage.getItem(STORAGE_BLOCK_WORD_ENABLED) === 'true';
    let hideCommentsOnBlockWord = localStorage.getItem(STORAGE_HIDE_ON_BLOCK_WORD) !== 'false'; // 默认隐藏
    // 拉黑日志相关
    let logBlockedEnabled = localStorage.getItem(STORAGE_LOG_BLOCKED) === 'true';
    let blockLog = [];
    try {
        const raw = localStorage.getItem(STORAGE_LOG_DATA) || '[]';
        blockLog = JSON.parse(raw);
        if (!Array.isArray(blockLog)) blockLog = [];
    } catch (e) { blockLog = []; }
    if (blockLog.length > 5000) blockLog = blockLog.slice(0, 5000); // 上限保护

    function saveBlockWords() {
        try {
            localStorage.setItem(STORAGE_BLOCK_WORDS, blockWords.join('\n'));
        } catch (e) {}
    }
    function saveBlockLog() {
        try {
            localStorage.setItem(STORAGE_LOG_DATA, JSON.stringify(blockLog));
        } catch (e) {}
    }
    // 记录一条拉黑日志（去重 secUid + 时间聚合）
    function recordBlockedUser(info, source) {
        if (!logBlockedEnabled) return;
        if (!info || !info.secUid) return;
        // 查找现有记录
        const existing = blockLog.find(r => r.secUid === info.secUid);
        if (existing) {
            existing.count = (existing.count || 1) + 1;
            existing.lastTime = Date.now();
            if (source) existing.lastSource = source;
        } else {
            blockLog.unshift({
                secUid: info.secUid,
                userId: info.userId || '',
                nickname: info.nickname || '',
                avatar: info.avatar || '',
                profileUrl: info.profileUrl || ('https://www.douyin.com/user/' + info.secUid),
                firstTime: Date.now(),
                lastTime: Date.now(),
                count: 1,
                lastSource: source || 'manual'
            });
            if (blockLog.length > 5000) blockLog.length = 5000;
        }
        saveBlockLog();
    }
    // 从作者信息推断 profileUrl 与可能的 avatar（不阻塞主流程）
    function enrichAuthorInfo(info) {
        if (!info) return info;
        if (!info.profileUrl && info.secUid) {
            info.profileUrl = 'https://www.douyin.com/user/' + info.secUid;
        }
        return info;
    }

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

    // HTML 转义
    function escapeHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // 格式化时间戳为可读字符串
    function formatTime(ts) {
        if (!ts) return '-';
        try {
            const d = new Date(ts);
            const pad = n => (n < 10 ? '0' + n : '' + n);
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        } catch (e) { return '-'; }
    }

    // 来源翻译
    function sourceLabel(s) {
        switch (s) {
            case 'manual': return '手动';
            case 'manual-unblock': return '解除';
            case 'batch': return '批量';
            case 'batch-author': return '批量-作者';
            default:
                if (s && s.startsWith('keyword:')) return '关键词(' + s.slice(8) + ')';
                return s || '-';
        }
    }

    // 拉黑日志页
    function openBlockLogPage() {
        if (document.querySelector('.douyin-block-log-overlay')) {
            return;
        }
        // 拉取最新数据
        try {
            const raw = localStorage.getItem(STORAGE_LOG_DATA) || '[]';
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) blockLog = parsed;
        } catch (e) {}

        const overlay = document.createElement('div');
        overlay.className = 'douyin-block-log-overlay douyin-block-settings-overlay';
        const total = blockLog.length;
        const itemsHtml = blockLog.slice(0, 500).map((r, idx) => {
            const profileUrl = r.profileUrl || ('https://www.douyin.com/user/' + r.secUid);
            const nickname = escapeHtml(r.nickname || '未记录昵称');
            const avatar = r.avatar || '';
            const avatarHtml = avatar
                ? `<img src="${escapeHtml(avatar)}" referrerpolicy="no-referrer" style="width:40px;height:40px;border-radius:50%;object-fit:cover;background:#333;flex-shrink:0;" onerror="this.style.display='none'">`
                : `<div style="width:40px;height:40px;border-radius:50%;background:#333;flex-shrink:0;"></div>`;
            return `
                <div class="douyin-block-log-item" data-sec-uid="${escapeHtml(r.secUid)}" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#222;border:1px solid #2a2a2a;border-radius:8px;margin-bottom:8px;">
                    ${avatarHtml}
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:14px;color:#f5f5f5;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${nickname}</div>
                        <div style="font-size:11px;color:#888;margin-top:2px;">${escapeHtml(sourceLabel(r.lastSource))} · ${escapeHtml(formatTime(r.lastTime))} · 累计 ${r.count || 1} 次</div>
                        <a href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#888;text-decoration:none;display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(profileUrl)}</a>
                    </div>
                    <button class="log-unblock-btn" data-sec-uid="${escapeHtml(r.secUid)}" style="background:transparent;border:1px solid #555;color:#bbb;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:12px;flex-shrink:0;">解除拉黑</button>
                </div>
            `;
        }).join('');

        overlay.innerHTML = `
            <div class="douyin-block-log-panel" style="background:#1a1a1a;border-radius:12px;padding:20px;min-width:520px;max-width:680px;max-height:80vh;color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid #333;display:flex;flex-direction:column;">
                <div class="douyin-block-settings-title" style="margin-bottom:12px;">
                    <span>拉黑记录（${total}）</span>
                    <span class="douyin-block-settings-close">×</span>
                </div>
                <div style="display:flex;gap:8px;margin-bottom:10px;">
                    <input id="log-search-input" type="text" placeholder="搜索昵称或sec_uid" style="flex:1;background:#2a2a2a;color:#fff;border:1px solid #333;border-radius:6px;padding:6px 10px;font-size:13px;">
                    <button id="log-clear-all" style="background:#2a2a2a;color:#bbb;border:1px solid #555;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">清除记录</button>
                </div>
                <div class="douyin-block-log-list" style="overflow-y:auto;flex:1;padding-right:4px;">
                    ${itemsHtml || '<div style="text-align:center;color:#666;padding:40px 0;font-size:13px;">暂无拉黑记录</div>'}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const closeBtn = overlay.querySelector('.douyin-block-settings-close');
        const searchInput = overlay.querySelector('#log-search-input');
        const clearAllBtn = overlay.querySelector('#log-clear-all');
        const list = overlay.querySelector('.douyin-block-log-list');

        closeBtn.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // 搜索过滤
        searchInput.addEventListener('input', (e) => {
            const q = (e.target.value || '').trim().toLowerCase();
            const allItems = list.querySelectorAll('.douyin-block-log-item');
            allItems.forEach(it => {
                if (!q) {
                    it.style.display = '';
                } else {
                    const sec = (it.dataset.secUid || '').toLowerCase();
                    const text = (it.textContent || '').toLowerCase();
                    it.style.display = (sec.includes(q) || text.includes(q)) ? '' : 'none';
                }
            });
        });

        // 单条解除拉黑（事件委托）
        list.addEventListener('click', async (e) => {
            const btn = e.target.closest('.log-unblock-btn');
            if (!btn) return;
            const sec = btn.dataset.secUid;
            if (!sec) return;
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '解除中…';
            try {
                const result = await blockUser(sec, true, true);
                if (result && result.success) {
                    blockLog = blockLog.filter(r => r.secUid !== sec);
                    saveBlockLog();
                    const item = btn.closest('.douyin-block-log-item');
                    if (item) item.remove();
                    const title = overlay.querySelector('.douyin-block-settings-title span');
                    if (title) title.textContent = '拉黑记录（' + blockLog.length + '）';
                    showToast('已解除拉黑');
                } else {
                    showToast('解除失败，请稍后重试');
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            } catch (err) {
                console.error('[抖音一键拉黑] 解除拉黑异常:', err);
                showToast('解除失败：' + (err && err.message ? err.message : '未知错误'));
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });

        // 清除记录
        clearAllBtn.addEventListener('click', () => {
            if (blockLog.length === 0) {
                showToast('暂无拉黑记录');
                return;
            }
            if (!confirm('确定清除全部 ' + blockLog.length + ' 条拉黑记录？此操作仅清除本地记录，不会解除拉黑。')) return;
            blockLog = [];
            saveBlockLog();
            list.innerHTML = '<div style="text-align:center;color:#666;padding:40px 0;font-size:13px;">暂无拉黑记录</div>';
            const title = overlay.querySelector('.douyin-block-settings-title span');
            if (title) title.textContent = '拉黑记录（0）';
        });
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

    // ========== 不感兴趣（纯函数触发）==========
    // 整个功能块已注释：自动不感兴趣存在缺陷（视频菜单调出会跳页/按钮消失；评论区 API 行为不一致）
    // 三个函数（triggerVideoDislike / triggerCommentDislike / triggerDislike）保留代码，等待未来抖音 UI 稳定后再启用
    /*
    function triggerVideoDislike() {
        try {
            // 1. 直接在页面上找"不感兴趣"文字的菜单项
            const items = document.querySelectorAll('.fzhg3Mci');
            for (const it of items) {
                const label = (it.textContent || '').trim();
                if (label.includes('不感兴趣')) {
                    it.click();
                    console.log('[抖音一键拉黑] 已点击视频"不感兴趣"');
                    return true;
                }
            }
            // 2. 兜底：通过文本搜索
            const allEls = document.querySelectorAll('div, span, li');
            for (const el of allEls) {
                if (el.children.length > 3) continue;
                const text = (el.textContent || '').trim();
                if (text === '不感兴趣' || text === '不感兴趣（R）') {
                    el.click();
                    console.log('[抖音一键拉黑] 已点击视频"不感兴趣"（文本匹配）');
                    return true;
                }
            }
            // 3. 模拟键盘 R 键（用户提供的 UI 显示 R 键）
            const rEvt = new KeyboardEvent('keydown', { key: 'r', code: 'KeyR', bubbles: true, cancelable: true });
            document.dispatchEvent(rEvt);
            return true;
        } catch (e) {
            console.error('[抖音一键拉黑] 视频不感兴趣触发失败:', e);
            return false;
        }
    }

    function triggerCommentDislike(commentItem) {
        try {
            if (!commentItem) {
                // 兜底：找当前焦点评论或最近评论
                commentItem = document.querySelector('[data-e2e="comment-item"]:hover, [data-e2e="comment-item"].focused, .comment-item:hover');
            }
            if (commentItem) {
                // 1. 直接点 .lA1t997_（不喜欢按钮）
                const dislikeBtn = commentItem.querySelector('.lA1t997_, [data-e2e="comment-dislike"]');
                if (dislikeBtn) {
                    dislikeBtn.click();
                    console.log('[抖音一键拉黑] 已点击评论"不感兴趣"');
                    return true;
                }
                // 2. 兜底：点更多按钮然后选"不感兴趣"
                const moreBtn = commentItem.querySelector('[data-e2e="video-comment-more"], .l_udJNgz');
                if (moreBtn) moreBtn.click();
            }
            return false;
        } catch (e) {
            console.error('[抖音一键拉黑] 评论不感兴趣触发失败:', e);
            return false;
        }
    }

    // 触发不感兴趣（统一入口，自动判断视频/评论）
    function triggerDislike(targetItem) {
        if (targetItem && (targetItem.matches?.('[data-e2e="comment-item"]') || targetItem.closest?.('[data-e2e="comment-item"]'))) {
            return triggerCommentDislike(targetItem.closest('[data-e2e="comment-item"]'));
        }
        return triggerVideoDislike();
    }
    */

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

        // 7. 默认：首页视频作者 - 找到当前可见的视频按钮
        const visibleBlockBtn = findVisibleBlockButton();
        if (visibleBlockBtn) {
            visibleBlockBtn.click();
            return true;
        }

        return false;
    }

    // 找到当前可见的拉黑按钮（解决刷视频后快捷键拉黑错误作者的问题）
    function findVisibleBlockButton() {
        const blockBtns = document.querySelectorAll('.douyin-block-btn');
        if (blockBtns.length === 0) return null;
        if (blockBtns.length === 1) return blockBtns[0];

        // 首先尝试找到当前活动的视频容器
        const activeVideoContainer = findActiveVideoContainer();
        if (activeVideoContainer) {
            // 在活动视频容器内查找拉黑按钮
            const btnInContainer = activeVideoContainer.querySelector('.douyin-block-btn');
            if (btnInContainer) {
                console.log('[抖音一键拉黑] 在活动视频容器内找到按钮');
                return btnInContainer;
            }
        }

        // 如果无法确定活动容器，使用距离中心最近的方法
        return findClosestButtonToCenter(blockBtns);
    }

    // 查找当前活动的视频容器（360浏览器兼容版）
    function findActiveVideoContainer() {
        try {
            // 方法1：查找正在播放的视频元素
            const videos = document.querySelectorAll('video');
            for (let i = 0; i < videos.length; i++) {
                const video = videos[i];
                // 检查视频是否正在播放且可见（兼容360浏览器）
                if (video && !video.paused && video.currentTime > 0) {
                    const rect = video.getBoundingClientRect();
                    // 视频必须在视口内且足够大（当前视频）
                    if (rect.top >= -rect.height * 0.5 && rect.bottom <= window.innerHeight + rect.height * 0.5) {
                        if (rect.height > 100) { // 确保是主视频而不是小窗口
                            // 向上查找包含该视频的容器
                            let container = video.parentElement;
                            let depth = 0;
                            while (container && depth < 10) {
                                // 检查容器是否包含点赞按钮，确认是视频卡片
                                if (container.querySelector && container.querySelector('[data-e2e="video-player-digg"]')) {
                                    return container;
                                }
                                container = container.parentElement;
                                depth++;
                            }
                        }
                    }
                }
            }

            // 方法2：查找包含可见点赞按钮的容器（当前视频通常有可见的点赞按钮）
            const diggButtons = document.querySelectorAll('[data-e2e="video-player-digg"]');
            for (let i = 0; i < diggButtons.length; i++) {
                const diggBtn = diggButtons[i];
                const rect = diggBtn.getBoundingClientRect();
                let style;
                try {
                    style = window.getComputedStyle(diggBtn);
                } catch (e) {
                    continue; // 360浏览器兼容性处理
                }
                // 点赞按钮必须在视口中心附近且可见
                if (rect.top > window.innerHeight * 0.3 && rect.top < window.innerHeight * 0.8) {
                    const opacity = style.opacity ? parseFloat(style.opacity) : 1;
                    if (style.display !== 'none' && style.visibility !== 'hidden' && opacity > 0.5) {
                        // 向上查找容器
                        let container = diggBtn.parentElement;
                        let depth = 0;
                        while (container && depth < 10) {
                            if (container.querySelector && container.querySelector('.douyin-block-btn')) {
                                return container;
                            }
                            container = container.parentElement;
                            depth++;
                        }
                    }
                }
            }
        } catch (e) {
            console.log('[抖音一键拉黑] 查找活动视频容器时出错:', e);
        }

        return null;
    }

    // 查找距离视口中心最近的按钮（360浏览器兼容版）
    function findClosestButtonToCenter(blockBtns) {
        try {
            const viewportCenterX = window.innerWidth / 2;
            const viewportCenterY = window.innerHeight / 2;

            let bestBtn = null;
            let minDistance = Infinity;

            for (let i = 0; i < blockBtns.length; i++) {
                const btn = blockBtns[i];
                const rect = btn.getBoundingClientRect();

                // 检查按钮是否在视口内且可见
                if (rect.width === 0 || rect.height === 0) continue;
                if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
                if (rect.right < 0 || rect.left > window.innerWidth) continue;

                // 检查按钮是否被隐藏（360浏览器兼容性处理）
                let style;
                try {
                    style = window.getComputedStyle(btn);
                } catch (e) {
                    continue;
                }
                const opacity = style.opacity ? parseFloat(style.opacity) : 1;
                if (style.display === 'none' || style.visibility === 'hidden' || opacity === 0) continue;

                // 计算按钮中心点
                const btnCenterX = rect.left + rect.width / 2;
                const btnCenterY = rect.top + rect.height / 2;

                // 计算与视口中心的距离
                const distanceToCenter = Math.sqrt(
                    Math.pow(btnCenterX - viewportCenterX, 2) +
                    Math.pow(btnCenterY - viewportCenterY, 2)
                );

                if (distanceToCenter < minDistance) {
                    minDistance = distanceToCenter;
                    bestBtn = btn;
                }
            }

            if (bestBtn) {
                console.log('[抖音一键拉黑] 选中距离中心最近的按钮，距离:', minDistance);
            }

            return bestBtn || blockBtns[0];
        } catch (e) {
            console.log('[抖音一键拉黑] 查找最近按钮时出错:', e);
            return blockBtns[0];
        }
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

            // 启动长按批量检测
            startBatchBlock();
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
            <div class="douyin-block-settings-panel" style="max-height: 88vh; overflow-y: auto;">
                <div class="douyin-block-settings-title">
                    <span>拉黑快捷键设置</span>
                    <span class="douyin-block-settings-close">×</span>
                </div>
                <div class="douyin-block-settings-row">
                    <span class="douyin-block-settings-label">快捷键</span>
                    <input type="text" class="douyin-block-settings-input" id="block-shortcut-input" value="${getShortcutDisplayName()}" placeholder="按组合键">
                </div>
                <div class="douyin-block-settings-row" style="margin-top: 12px;">
                    <span class="douyin-block-settings-label" style="flex: 1;">长按触发批量时间<br><span style="font-size: 11px; color: #888;">（按住快捷键多久后进入批量拉黑，单位：毫秒，最小 500）</span></span>
                    <input type="number" min="500" max="60000" step="100" class="douyin-block-settings-input" id="longpress-input" value="${batchLongPressMs}" style="width:90px;">
                </div>
                <div class="douyin-block-settings-row" style="margin-top: 12px;">
                    <span class="douyin-block-settings-label" style="flex: 1;">批量并发数量<br><span style="font-size: 11px; color: #888;">（同时拉黑多少个用户，建议 3-15，过高可能触发风控）</span></span>
                    <input type="number" min="1" max="50" step="1" class="douyin-block-settings-input" id="concurrency-input" value="${batchConcurrency}" style="width:90px;">
                </div>
                <div class="douyin-block-settings-row" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #333;">
                    <span class="douyin-block-settings-label" style="flex: 1;">批量拉黑后拉黑视频作者<br><span style="font-size: 11px; color: #888;">（评论区批量拉黑结束后，把该视频的作者也一并拉黑）</span></span>
                    <label class="douyin-block-settings-switch">
                        <input type="checkbox" id="author-block-toggle" ${blockVideoAuthorAfterBatch ? 'checked' : ''}>
                        <span class="douyin-block-settings-slider" id="author-block-slider"></span>
                    </label>
                </div>
                <div class="douyin-block-settings-row" style="margin-top: 12px;">
                    <span class="douyin-block-settings-label" style="flex: 1;">允许快捷键拉黑评论区用户<br><span style="font-size: 11px; color: #888;">（关闭后快捷键不会拉黑评论区用户）</span></span>
                    <label class="douyin-block-settings-switch">
                        <input type="checkbox" id="comment-shortcut-toggle" ${commentShortcutEnabled ? 'checked' : ''}>
                        <span class="douyin-block-settings-slider" id="comment-shortcut-slider"></span>
                    </label>
                </div>
                <div class="douyin-block-settings-row" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #333;">
                    <span class="douyin-block-settings-label" style="flex: 1;">关键词自动拉黑<br><span style="font-size: 11px; color: #888;">（评论命中关键词自动拉黑该用户）</span></span>
                    <label class="douyin-block-settings-switch">
                        <input type="checkbox" id="word-block-toggle" ${blockWordEnabled ? 'checked' : ''}>
                        <span class="douyin-block-settings-slider" id="word-block-slider"></span>
                    </label>
                </div>
                <div class="douyin-block-settings-row" style="margin-top: 12px; align-items: flex-start;">
                    <span class="douyin-block-settings-label" style="flex: 1; padding-right: 10px;">屏蔽词列表<br><span style="font-size: 11px; color: #888;">（一行一个关键词，命中即拉黑）</span></span>
                </div>
                <textarea id="block-words-input" placeholder="一行一个关键词" style="width:100%;min-height:90px;max-height:160px;box-sizing:border-box;background:#2a2a2a;color:#fff;border:1px solid #333;border-radius:6px;padding:8px;font-size:13px;line-height:1.5;resize:vertical;font-family:inherit;">${blockWords.map(w => escapeHtml(w)).join('\n')}</textarea>
                <div class="douyin-block-settings-row" style="margin-top: 8px;">
                    <span class="douyin-block-settings-label" style="flex: 1;">命中后隐藏该评论<br><span style="font-size: 11px; color: #888;">（关闭后只标记不隐藏）</span></span>
                    <label class="douyin-block-settings-switch">
                        <input type="checkbox" id="word-hide-toggle" ${hideCommentsOnBlockWord ? 'checked' : ''}>
                        <span class="douyin-block-settings-slider" id="word-hide-slider"></span>
                    </label>
                </div>
                <div class="douyin-block-settings-row" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #333;">
                    <span class="douyin-block-settings-label" style="flex: 1;">记录拉黑操作<br><span style="font-size: 11px; color: #888;">（开启后所有拉黑的用户会保存到日志，可查看/清除）</span></span>
                    <label class="douyin-block-settings-switch">
                        <input type="checkbox" id="log-block-toggle" ${logBlockedEnabled ? 'checked' : ''}>
                        <span class="douyin-block-settings-slider" id="log-block-slider"></span>
                    </label>
                </div>
                <div class="douyin-block-settings-row" style="margin-top: 8px;">
                    <button id="open-block-log-btn" class="douyin-block-settings-save" style="background:#2a2a2a;margin-top:0;flex:1;">查看拉黑记录（${blockLog.length}）</button>
                </div>
                <div class="douyin-block-settings-hint">
                    点击输入框后按组合键设置<br>
                    支持: Ctrl+Q, Alt+Q, Ctrl+Alt+Q, Shift+F4 等<br>
                    右键点击拉黑按钮可打开设置<br>
                    按 ESC 关闭设置<br><br>
                    <b style="color:#ccc;">长按快捷键可批量拉黑评论区所有用户，松开后收尾</b>
                </div>
                <button id="douyin-block-settings-save-btn" class="douyin-block-settings-save">保存</button>
            </div>
        `;

        document.body.appendChild(overlay);
        console.log('[抖音一键拉黑] 设置面板已添加到页面');

        const input = overlay.querySelector('#block-shortcut-input');
        const closeBtn = overlay.querySelector('.douyin-block-settings-close');
        const saveBtn = overlay.querySelector('#douyin-block-settings-save-btn');
        const commentToggle = overlay.querySelector('#comment-shortcut-toggle');
        const longpressInput = overlay.querySelector('#longpress-input');
        const concurrencyInput = overlay.querySelector('#concurrency-input');
        const authorToggle = overlay.querySelector('#author-block-toggle');
        const wordToggle = overlay.querySelector('#word-block-toggle');
        const wordsInput = overlay.querySelector('#block-words-input');
        const wordHideToggle = overlay.querySelector('#word-hide-toggle');
        const logToggle = overlay.querySelector('#log-block-toggle');
        const openLogBtn = overlay.querySelector('#open-block-log-btn');
        // const autoDislikeToggle = overlay.querySelector('#auto-dislike-toggle'); // 已注释：自动不感兴趣功能不完善

        if (!saveBtn) {
            console.error('[抖音一键拉黑] 未找到保存按钮，初始化失败');
            return;
        }

        // 临时存储当前设置
        let tempKey = blockShortcutKey;
        let tempModifiers = { ...blockShortcutModifiers };
        let tempCommentEnabled = commentShortcutEnabled;
        let tempLongPressMs = batchLongPressMs;
        let tempConcurrency = batchConcurrency;
        let tempAuthorBlock = blockVideoAuthorAfterBatch;
        let tempWordEnabled = blockWordEnabled;
        let tempWordsText = wordsInput.value;
        let tempHideOnWord = hideCommentsOnBlockWord;
        let tempLogEnabled = logBlockedEnabled;
        // let tempAutoDislike = autoDislikeOnBlock; // 已注释：自动不感兴趣功能不完善

        input.focus();
        input.select();

        // 评论区开关切换
        commentToggle.addEventListener('change', (e) => {
            tempCommentEnabled = e.target.checked;
        });

        // 作者拉黑开关切换
        authorToggle.addEventListener('change', (e) => {
            tempAuthorBlock = e.target.checked;
        });

        // 关键词开关切换
        wordToggle.addEventListener('change', (e) => {
            tempWordEnabled = e.target.checked;
        });

        // 命中后隐藏开关
        wordHideToggle.addEventListener('change', (e) => {
            tempHideOnWord = e.target.checked;
        });

        // 日志开关
        logToggle.addEventListener('change', (e) => {
            tempLogEnabled = e.target.checked;
        });

        // 拉黑后自动"不感兴趣"开关 —— 已注释：功能不完善

        // 关键词 textarea
        wordsInput.addEventListener('input', (e) => {
            tempWordsText = e.target.value;
        });

        // 长按时间输入实时校验
        longpressInput.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10);
            if (Number.isFinite(v) && v >= 500 && v <= 60000) {
                tempLongPressMs = v;
                longpressInput.style.borderColor = '#333';
            } else {
                longpressInput.style.borderColor = '#ff4444';
            }
        });

        // 并发数输入实时校验
        concurrencyInput.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10);
            if (Number.isFinite(v) && v >= 1 && v <= 50) {
                tempConcurrency = v;
                concurrencyInput.style.borderColor = '#333';
            } else {
                concurrencyInput.style.borderColor = '#ff4444';
            }
        });

        // 打开拉黑记录页
        openLogBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.remove();
            openBlockLogPage();
        });

        closeBtn.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[抖音一键拉黑] 保存按钮被点击');

            if (!tempKey) {
                showToast('请按组合键设置快捷键');
                return;
            }
            // 校验
            const finalLongPress = Math.max(500, Math.min(60000, tempLongPressMs || 5000));
            const finalConcurrency = Math.max(1, Math.min(50, tempConcurrency || 10));

            try {
                blockShortcutKey = tempKey;
                blockShortcutModifiers = { ...tempModifiers };
                commentShortcutEnabled = !!tempCommentEnabled;
                batchLongPressMs = finalLongPress;
                batchConcurrency = finalConcurrency;
                blockVideoAuthorAfterBatch = !!tempAuthorBlock;
                blockWordEnabled = !!tempWordEnabled;
                blockWords = (tempWordsText || '').split('\n').map(s => s.trim()).filter(Boolean);
                hideCommentsOnBlockWord = !!tempHideOnWord;
                logBlockedEnabled = !!tempLogEnabled;
                // autoDislikeOnBlock = !!tempAutoDislike; // 已注释：自动不感兴趣功能不完善

                localStorage.setItem(STORAGE_KEY, blockShortcutKey);
                localStorage.setItem(STORAGE_MODIFIERS_KEY, JSON.stringify(blockShortcutModifiers));
                localStorage.setItem(STORAGE_COMMENT_SHORTCUT_KEY, commentShortcutEnabled);
                localStorage.setItem(STORAGE_LONG_PRESS_MS, String(batchLongPressMs));
                localStorage.setItem(STORAGE_BATCH_CONCURRENCY, String(batchConcurrency));
                localStorage.setItem(STORAGE_BLOCK_VIDEO_AUTHOR, String(blockVideoAuthorAfterBatch));
                localStorage.setItem(STORAGE_BLOCK_WORD_ENABLED, String(blockWordEnabled));
                saveBlockWords();
                localStorage.setItem(STORAGE_HIDE_ON_BLOCK_WORD, String(hideCommentsOnBlockWord));
                localStorage.setItem(STORAGE_LOG_BLOCKED, String(logBlockedEnabled));
                // localStorage.setItem(STORAGE_AUTO_DISLIKE, String(autoDislikeOnBlock)); // 已注释

                showToast('设置已保存');
                overlay.remove();
                // 保存后立即对新评论生效
                processAllCommentsForBlockWord();
            } catch (err) {
                console.error('[抖音一键拉黑] 保存设置失败:', err);
                showToast('保存失败：' + (err && err.message ? err.message : '未知错误'));
            }
        });

        // 让保存按钮也能响应 Enter（避免被快捷键 input 抢走）
        saveBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveBtn.click();
            }
        });

        // 面板整体键盘：Tab 焦点循环、Enter 默认提交
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target !== input) {
                e.preventDefault();
                saveBtn.click();
            }
        });

        input.addEventListener('keydown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'Enter') {
                e.preventDefault();
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

    // ===== keyup 监听：用于检测长按结束 =====
    document.addEventListener('keyup', (e) => {
        const pressedKey = normalizeKey(e.key);
        const savedKey = normalizeKey(blockShortcutKey);
        if (pressedKey === savedKey) {
            stopBatchBlock();
        }
    });

    // 注册油猴菜单命令
    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('设置拉黑快捷键', openBlockSettings);
        GM_registerMenuCommand('查看拉黑记录', openBlockLogPage);
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

    console.log('[抖音一键拉黑] v5.5 关键词拉黑 + 拉黑日志版脚本加载完成');
    console.log('[抖音一键拉黑] 当前快捷键: ' + getShortcutDisplayName());
    console.log('[抖音一键拉黑] 长按 >5秒 可批量拉黑评论区所有用户');
    console.log('[抖音一键拉黑] 右键点击拉黑按钮可打开设置面板');
    console.log('[抖音一键拉黑] 360浏览器兼容性优化已启用');


console.log(
  '%c作者: Lun.%c | %chttps://github.com/Lun-OS',
  'color: #ff6b6b; font-size: 1.2em; font-weight: bold; text-shadow: 0 0 2px #ff6b6b;',
  'color: #ccc; font-weight: normal;',
  'color: #5f9ea0; text-decoration: underline; font-style: italic;'
);


})();
