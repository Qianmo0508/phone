/* ============================================================
 * patch/v3/story-engine.js
 * 交互式剧情引擎 v3
 * 放置：在 overhaul.js / content.js / fix-gesture.js 之后加载
 * ============================================================ */
(function () {
  "use strict";

  function boot() {
    if (typeof D === "undefined" || typeof Router === "undefined" || typeof Story === "undefined") {
      setTimeout(boot, 60); return;
    }
    if (window.__QJ_STORY_V3__) return;
    window.__QJ_STORY_V3__ = true;
    try { run(); } catch (e) { console.error("[story-v3]", e); }
  }
  setTimeout(boot, 0);

  /* ================== 状态 ================== */
  function ensureState() {
    if (!D.story) D.story = {};
    const s = D.story;
    if (!Array.isArray(s.done)) s.done = [];
    if (!Array.isArray(s.log)) s.log = [];
    if (!s.vars || typeof s.vars !== "object") s.vars = {};
    if (!s.graph || typeof s.graph !== "object") s.graph = { start: null, nodes: {} };
    if (!s.graph.nodes || typeof s.graph.nodes !== "object") s.graph.nodes = {};
    if (!("waiting" in s)) s.waiting = null;

    // 兼容旧的 D.story.story.nodes（自动迁移到 graph.nodes，仅一次）
    if (s.story && Array.isArray(s.story.nodes) && s.story.nodes.length && !s.story.__migratedToGraph) {
      s.story.nodes.forEach(n => {
        if (n && n.id && !s.graph.nodes[n.id]) s.graph.nodes[n.id] = legacyNode(n);
      });
      if (!s.graph.start) s.graph.start = s.story.nodes[0].id;
      s.story.__migratedToGraph = true;
      s.story.nodes = []; // 清空旧节点，避免主脚本里的 Story.trigger 双重触发
    }
  }

  function legacyNode(n) {
    return {
      id: n.id,
      once: !!n.once,
      on: n.on || null,
      actions: n.actions || [],
      next: n.next || null
    };
  }

  /* ================== 事件匹配 ================== */
  function matchCond(cond, evt) {
    if (!cond) return false;
    if (typeof cond === "string") return cond === evt.type;
    if (cond.type && cond.type !== evt.type) return false;
    if (cond.app && cond.app !== evt.app) return false;
    if (cond.chatId && cond.chatId !== evt.chatId) return false;
    if (cond.fromNode && cond.fromNode !== evt.fromNode) return false;
    if (cond.var) {
      const v = D.story.vars[cond.var];
      if ("eq" in cond && v !== cond.eq) return false;
      if ("ne" in cond && v === cond.ne) return false;
      if ("truthy" in cond && !!v !== !!cond.truthy) return false;
    }
    return true;
  }

  function isDone(id) { return D.story.done.includes(id); }
  function markDone(id) { if (!isDone(id)) D.story.done.push(id); }

  /* ================== 节点执行 ================== */
  function runNode(id, fromEvent) {
    const node = D.story.graph.nodes[id];
    if (!node) { console.warn("[story-v3] 节点不存在", id); return; }
    if (node.once && isDone(id)) return;
    markDone(id);
    D.story.log.push({ id, ts: Date.now() });
    if (D.story.log.length > 200) D.story.log = D.story.log.slice(-200);
    executeNode(node);
  }

  function executeNode(node) {
    const sayList = node.say ? (Array.isArray(node.say) ? node.say : [node.say]) : [];
    const afterSay = () => {
      if (node.ask) presentAsk(node);
      else finishNode(node);
    };
    if (sayList.length) sayAll(node, sayList, afterSay);
    else afterSay();
  }

  function sayAll(node, sayList, done) {
    const chatId = node.chatId || null;
    if (chatId) {
      const chat = D.chats.find(c => c.id === chatId);
      if (!chat) { done(); return; }
      let i = 0;
      const next = () => {
        if (i >= sayList.length) { save(); refreshForChat(chatId); done(); return; }
        const item = sayList[i++];
        chat.msgs.push({
          id: uid(), from: item.from || "them", type: "text",
          text: item.text || "", ts: Date.now()
        });
        if (item.from !== "me") chat.unread = (chat.unread || 0) + 1;
        save();
        refreshForChat(chatId);
        setTimeout(next, item.delay != null ? item.delay : 700);
      };
      next();
    } else {
      showSceneDialogue(node, sayList, done);
    }
  }

  function refreshForChat(chatId) {
    const top = Router.top();
    if (!top) return;
    const cid = getCurrentChatId();
    if (cid === chatId || top.key === "app:wechat") Router.refresh();
  }

  function showSceneDialogue(node, sayList, done) {
    const lines = sayList.map(s => {
      const who = s.from === "me"
        ? ((D.persona && D.persona.name) || "我")
        : (s.speaker || node.speaker || node.from || "旁白");
      return `<div style="margin-bottom:10px">
        <div style="font-size:12px;color:var(--text2);font-weight:600;margin-bottom:2px">${esc(who)}</div>
        <div style="font-size:14.5px;line-height:1.5;white-space:pre-wrap">${esc(s.text || "")}</div>
      </div>`;
    }).join("");
    modal(`<h3 class="m-title">${esc(node.title || "剧情")}</h3>
      <div style="max-height:50vh;overflow:auto">${lines}</div>
      <div class="m-actions"><button class="btn primary" id="scene-continue">继续</button></div>`);
    const btn = document.getElementById("scene-continue");
    if (btn) btn.onclick = () => { closeModal(); setTimeout(done, 180); };
  }

  function presentAsk(node) {
    const chatId = node.chatId || null;
    const options = node.ask;
    D.story.waiting = {
      nodeId: node.id || null,
      chatId, mode: chatId ? "chat" : "scene",
      options: options.map(o => ({ text: o.text, goto: o.goto || null })),
      prompt: node.prompt || null,
      title: node.title || null
    };
    save();
    if (chatId) showChatChoices();
    else showSceneChoices();
  }

  function showChatChoices() {
    const w = D.story.waiting;
    if (!w) return;
    const cid = getCurrentChatId();
    if (cid !== w.chatId) return;
    renderChoiceBar(w.options);
  }

  function showSceneChoices() {
    const w = D.story.waiting;
    if (!w) return;
    modal(`<h3 class="m-title">${esc(w.title || "选择")}</h3>
      ${w.prompt ? `<p class="m-text">${esc(w.prompt)}</p>` : ""}
      <div class="sheet-list">
        ${w.options.map((o, i) => `<button class="sheet-item" data-qj-opt="${i}">${esc(o.text)}</button>`).join("")}
      </div>`);
    document.querySelectorAll("#modal-wrap [data-qj-opt]").forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.qjOpt);
        closeModal();
        setTimeout(() => chooseOption(idx), 180);
      };
    });
  }

  function chooseOption(idx) {
    const w = D.story.waiting;
    if (!w) return;
    const opt = w.options[idx];
    if (!opt) return;
    const fromNode = w.nodeId;

    if (w.chatId) {
      const chat = D.chats.find(c => c.id === w.chatId);
      if (chat) {
        chat.msgs.push({ id: uid(), from: "me", type: "text", text: opt.text, ts: Date.now() });
        save();
      }
    }

    D.story.waiting = null;
    removeChoiceBar();
    save();

    Story.event("playerChoose", { fromNode, index: idx, text: opt.text, chatId: w.chatId });

    if (opt.goto) setTimeout(() => runNode(opt.goto, { type: "playerChoose" }), 100);
    else if (w.chatId) refreshForChat(w.chatId);
  }

  function finishNode(node) {
    if (node.setVar) Object.keys(node.setVar).forEach(k => { D.story.vars[k] = node.setVar[k]; });
    if (node.actions) runLegacyActions(node, node.actions, 0, () => afterActions(node));
    else afterActions(node);
  }

  function afterActions(node) {
    save();
    if (node.next) {
      const delay = node.nextDelay || 0;
      setTimeout(() => runNode(node.next, { type: "internal" }), delay);
    }
  }

  function runLegacyActions(node, actions, i, done) {
    if (i >= actions.length) { done(); return; }
    const act = actions[i];
    let wait = 0;
    try {
      if (act.type === "notify") {
        D.notifications.unshift({ id: uid(), app: act.app || "system", title: act.title || "系统", body: act.body || "", ts: Date.now() });
        if (typeof renderLockNotifs === "function") renderLockNotifs();
        toast(act.title ? act.title + "：" + (act.body || "") : (act.body || "新通知"));
      } else if (act.type === "addMessage") {
        const c = D.chats.find(x => x.id === act.chatId) || D.chats[0];
        if (c) {
          c.msgs.push({ id: uid(), from: act.from || "them", type: "text", text: act.text || "", ts: Date.now() });
          c.unread = (c.unread || 0) + 1;
        }
      } else if (act.type === "setVar") {
        D.story.vars[act.key] = act.value;
      } else if (act.type === "delay") {
        wait = act.ms || 1000;
      }
    } catch (e) { console.warn(e); }
    save();
    setTimeout(() => runLegacyActions(node, actions, i + 1, done), wait);
  }

  /* ================== 选项浮层（聊天页） ================== */
  function ensureChoiceBar() {
    let bar = document.getElementById("story-choice-bar");
    if (bar) return bar;
    if (!document.getElementById("qj-story-style")) {
      const st = document.createElement("style");
      st.id = "qj-story-style";
      st.innerHTML = `
        #story-choice-bar {
          position: absolute; left: 12px; right: 12px;
          bottom: calc(78px + env(safe-area-inset-bottom));
          z-index: 75; display: none; flex-direction: column; gap: 8px;
          animation: qjSlideUp .26s cubic-bezier(.32,.72,0,1);
        }
        @keyframes qjSlideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        #story-choice-bar .sj-opt {
          background: var(--card, #fff); color: var(--text, #0b0b0f);
          border: 1px solid var(--line, rgba(60,60,67,.12));
          border-radius: 14px; padding: 12px 16px; font-size: 14.5px;
          text-align: left; box-shadow: 0 6px 20px rgba(0,0,0,.18);
          font-weight: 500; display: flex; align-items: center; gap: 8px;
          transition: transform .14s, background .14s;
        }
        #story-choice-bar .sj-opt:active { transform: scale(.97); background: var(--card2, #f4f4f7); }
        #story-choice-bar .sj-opt::before {
          content: "▸"; color: var(--tint, #0a84ff); font-weight: 700;
        }
      `;
      document.head.appendChild(st);
    }
    bar = document.createElement("div");
    bar.id = "story-choice-bar";
    document.getElementById("screen").appendChild(bar);
    return bar;
  }

  function renderChoiceBar(options) {
    const bar = ensureChoiceBar();
    bar.style.display = "flex";
    bar.innerHTML = options.map((o, i) =>
      `<button class="sj-opt" data-sj-opt="${i}">${esc(o.text)}</button>`
    ).join("");
    bar.querySelectorAll("[data-sj-opt]").forEach(btn => {
      btn.onclick = () => chooseOption(Number(btn.dataset.sjOpt));
    });
  }

  function removeChoiceBar() {
    const bar = document.getElementById("story-choice-bar");
    if (bar) bar.style.display = "none";
  }

  /* ================== 事件分发 ================== */
  function dispatchEvent(evt) {
    if (!D.story.enabled) return;                       // 【修复】尊重剧情总开关
    if (D.story.waiting && evt.type !== "playerChoose" && evt.type !== "internal") return;
    Object.keys(D.story.graph.nodes).forEach(id => {
      const node = D.story.graph.nodes[id];
      if (!node || !node.on) return;
      if (node.once && isDone(id)) return;
      if (!matchCond(node.on, evt)) return;
      if (node.__running) return;
      node.__running = true;
      setTimeout(() => {
        try { runNode(id, evt); } finally { delete node.__running; }
      }, node.triggerDelay || 0);
    });
  }

  /* ================== 当前 chatId 推断 ================== */
  function getCurrentChatId() {
    const top = Router.top();
    if (!top) return null;
    const k = top.key || "";
    // 主脚本所有聊天页 key 都是 "chat:<id>"，直接匹配
    const m = k.match(/^chat:([A-Za-z0-9_-]+)$/);
    if (m) return m[1];
    // 兜底：nav 标题反查
    const titleEl = top.el.querySelector(".nav-title");
    if (titleEl) {
      const title = titleEl.textContent.trim();
      const chat = D.chats.find(c => c.name === title);
      if (chat) return chat.id;
    }
    return null;
  }

  /* ================== 监听 Router 变化 ================== */
  function checkChoiceVisibility() {
    const w = D.story.waiting;
    if (!w || w.mode !== "chat") { removeChoiceBar(); return; }
    const cid = getCurrentChatId();
    if (cid === w.chatId) renderChoiceBar(w.options);
    else removeChoiceBar();
  }

  function hookRouter() {
    const oldPush = Router.push.bind(Router);
    Router.push = function (key, renderFn) {
      const rec = oldPush(key, renderFn);
      setTimeout(checkChoiceVisibility, 90);
      return rec;
    };
    const oldPop = Router.pop.bind(Router);
    Router.pop = function () {
      const r = oldPop();
      setTimeout(checkChoiceVisibility, 90);
      return r;
    };
    const oldPaint = Router.paint.bind(Router);
    Router.paint = function (rec) {
      oldPaint(rec);
      setTimeout(checkChoiceVisibility, 60);
    };
    const oldHome = Router.home.bind(Router);
    Router.home = function () {
      oldHome();
      setTimeout(checkChoiceVisibility, 90);
    };
  }

  /* ================== 玩家发消息钩子（重写版） ================== */
  function hookPlayerSend() {
    // 【修复 1】包装 ACTIONS.chatSend，在 refresh 之前捕获 text
    if (typeof ACTIONS.chatSend === "function" && !ACTIONS.chatSend.__qjWrapped) {
      const orig = ACTIONS.chatSend;
      ACTIONS.chatSend = function (el, e) {
        const chatId = (el && el.dataset && el.dataset.id) || getCurrentChatId();
        const inp = document.getElementById("chat-input");
        const text = inp ? inp.value.trim() : "";
        const result = orig.apply(this, arguments);
        if (text && chatId) {
          setTimeout(() => Story.event("playerSend", { chatId, text }), 50);
        }
        return result;
      };
      ACTIONS.chatSend.__qjWrapped = true;
    }

    // 【修复 2】原代码没有 Enter 发送，补上
    document.addEventListener("keydown", e => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const input = e.target.closest(".chat-input");
      if (!input) return;
      e.preventDefault();
      const bar = input.closest(".chat-inputbar");
      const btn = bar && bar.querySelector(".send-btn");
      if (btn) btn.click();
    }, true);
  }

  /* ================== 恢复等待 ================== */
  function restoreWaiting() {
    const w = D.story.waiting;
    if (!w) return;
    const lock = document.getElementById("lock-screen");
    if (lock && !lock.classList.contains("hidden") && !lock.classList.contains("hide")) {
      setTimeout(restoreWaiting, 500);
      return;
    }
    if (w.mode === "chat") {
      const cid = getCurrentChatId();
      if (cid === w.chatId) renderChoiceBar(w.options);
    } else if (w.mode === "scene") {
      setTimeout(showSceneChoices, 300);
    }
  }

  /* ================== 覆盖 Story ================== */
  function patchStory() {
    const oldTrigger = Story.trigger.bind(Story);
    Story.trigger = function (evt) {
      try { oldTrigger(evt); } catch (e) { console.warn(e); }
      dispatchEvent(evt);
    };
    Story.event = function (name, payload) {
      dispatchEvent(Object.assign({ type: name }, payload || {}));
    };
    Story.node = function (id) { runNode(id, { type: "manual" }); };
    Story.waiting = function () { return D.story.waiting; };
    Story.clearWaiting = function () { D.story.waiting = null; removeChoiceBar(); save(); };
  }

  /* ================== 主入口 ================== */
  function run() {
    ensureState();
    patchStory();
    hookPlayerSend();
    hookRouter();
    setTimeout(restoreWaiting, 800);
    window.StoryEngine = {
      event: (name, payload) => Story.event(name, payload),
      node: (id) => Story.node(id),
      waiting: () => D.story.waiting,
      clearWaiting: () => Story.clearWaiting(),
      onChatOpen: (chatId) => {
        const w = D.story.waiting;
        if (w && w.mode === "chat" && w.chatId === chatId) renderChoiceBar(w.options);
        else removeChoiceBar();
      },
      onChatClose: () => removeChoiceBar()
    };
    console.log("[story-v3] 已加载。API: StoryEngine.event/node/waiting/onChatOpen");
  }
})();
