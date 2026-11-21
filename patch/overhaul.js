/* ============================================================
 * patch/overhaul.js
 * 个人信息 / HRA 增强 / 人物与异常档案
 * 放置：主 <script> 之后、</body> 之前
 * ============================================================ */
(function () {
  "use strict";

  function boot() {
    if (typeof D === "undefined" || typeof APPS === "undefined" || !D.hra) {
      setTimeout(boot, 60); return;
    }
    if (window.__QJ_OVERHAUL__) return;
    window.__QJ_OVERHAUL__ = true;
    try { run(); } catch (e) { console.error("[overhaul]", e); }
  }
  setTimeout(boot, 0);

  function run() {
    ensureData();
    toolLevel();
    wrapSettings();
    wrapHRA();
    wrapTask();
    save();
  }

  /* ---------------- 数据 ---------------- */
  function ensureData() {
    if (!D.persona) {
      D.persona = {
        name: D.hra.agent.name || "沈默",
        gender: "未填写",
        birthday: "",
        signature: "",
        avatarHue: 210,
        abilities: [
          { id: uid(), name: "未记录", type: "主动", desc: "在「个人设置」中添加你的异能记录。" }
        ]
      };
    }
    if (!D.hra.agent.name) D.hra.agent.name = D.persona.name;
    if (!D.persona.name) D.persona.name = D.hra.agent.name;
    if (D.hra.rank == null) D.hra.rank = 3;
    if (D.hra.points == null) D.hra.points = 0;
    if (!D.hra.log) D.hra.log = [];

    if (!D.hra.promotions) {
      D.hra.promotions = [
        { level: 1, need: 0,    title: "见习研究员" },
        { level: 2, need: 100,  title: "研究助理" },
        { level: 3, need: 300,  title: "外勤调查员" },
        { level: 4, need: 800,  title: "M.T.F. 队长" },
        { level: 5, need: 2000, title: "科室负责人" },
        { level: 6, need: 5000, title: "院务委员" }
      ];
    }

    if (!D.hra.roster) {
      D.hra.roster = [
        {
          id: "r-mistake", name: "米斯塔克", codeName: "mistake",
          gender: "未公开", age: "不详", position: "现院长", hue: 0,
          abilities: [
            { name: "？？？", type: "被动", desc: "摘除眼镜后，存在感无限趋近于0。无论走到谁身后、混入人群、甚至混入固定小组出任务，都不会被注意到。对诡异的亲和度高达100%，接近本体后不受其特定效应影响。" },
            { name: "仇目", type: "被动", desc: "无论生活还是战场，总以莫名其妙的前提被「看不顺眼」。与诡异团体斗争时，诡异默认「未摘除眼镜的mistake」为最大威胁，率先攻击她。" },
            { name: "熄灯", type: "主动", desc: "以敌人为圆心，直径3米左右陷入绝对黑暗。即使诡异没有「视力」概念，也会失去判断与方向。除mistake本人，无人能在「熄灯」中保持视力。" },
            { name: "泯灭棋盘", type: "主动", desc: "将敌人魂体拉入棋盘空间。黑棋攻实体，骑马而行，武器随敌弱点变幻；白棋囚非实体（精神类/模因污染类），自带净化封印。异常被永久封印，被棋盘吞噬并学习其能力。" }
          ],
          likes: "国际象棋（黑白棋）、巴洛克音乐、扑克牌、千禧年代老剧老歌",
          dislikes: "—",
          personality: "亲民（和同事站一起时暂未被发现是院长）、脑回路不可捉摸、一身反骨、吊儿郎当、爱玩梗的8G冲浪者、低精力受害者、松弛感过高、地狱笑话爱好者。渠京精神病院研究管理院最不严厉的母亲。出任务时切临床腔。",
          appearance: "纯黑发、黑眼圈、半圆框眼镜、反翘发。",
          background: "诞生地与国籍不详，按语言暂定亚裔。与原科学研究院院长Tulsa密切联系，爱好多为西洋传入本土。由编外人员越级上位。在前科学研究院因研制出诡异而一发不可收拾时站出，提议收容，是改变研究院性质的转折点。Tulsa遇害后上位。",
          social: "与Tulsa（前院长，已故）关系密切。院内研究员私下常抱怨「院长好像没怎么出过任务」。同时是论坛版主。",
          note: "立场：混沌中立 · 人类官方。喜欢摘下眼镜走到摸鱼的员工身后默默视间。"
        },
        {
          id: "r-tavana", name: "Tavana Ribeira", codeName: "—",
          gender: "女", age: "29", position: "首席调查官 / 记录员", hue: 36,
          abilities: [
            { name: "档案记录", type: "职业", desc: "负责诡异档案的记录与归档。严谨、克制，几乎不出错。" }
          ],
          likes: "书籍、咖啡、银杏林",
          dislikes: "欺骗、战争、繁杂的公务",
          personality: "温文尔雅。总戴一副单片金丝镜。",
          appearance: "浅咖色发，单片金丝眼镜。",
          background: "首席调查官，负责记录诡异档案。",
          social: "Tulsa（姐姐，已故，前院长）；Sevilla（研究院编外人员）",
          note: ""
        }
      ];
    }

    if (!D.hra.anomalies) {
      D.hra.anomalies = [
        { id: "a-013", code: "HRA-013", name: "低语", level: "P", status: "已收容",
          desc: "认知污染型实体。靠近时会听到持续低语，内容多为听者最不愿回想的片段。", note: "" },
        { id: "a-077", code: "HRA-077", name: "回声", level: "C", status: "锚定中",
          desc: "7号线末班车段的空间重叠现象。广播沉默时禁止下车，门开也别下。", note: "空间物理科已连续两次过载告警。" },
        { id: "a-102", code: "HRA-102", name: "长夜", level: "A", status: "仅引导",
          desc: "异常空间现象，无法收容，仅能在特定坐标引导。接近者将被存在性抹消。", note: "" },
        { id: "a-208", code: "HRA-208", name: "白伞", level: "S", status: "标准保险柜",
          desc: "雨天出现的白色雨伞，伞下无人。当前处于可控收容状态。", note: "" },
        { id: "a-301", code: "HRA-301", name: "深井", level: "N", status: "最高接触限制",
          desc: "90年代渠京十余口井被统一填埋，档案记为「市政改造」。井底存在未探明实体。", note: "关键词相关帖文会在数秒后空白化。" },
        { id: "a-401", code: "HRA-401", name: "询问式信息危害", level: "N", status: "待补充", desc: "", note: "占位 · 等待剧情补充" },
        { id: "a-402", code: "HRA-402", name: "笑犬", level: "N", status: "待补充", desc: "", note: "占位 · 等待剧情补充" },
        { id: "a-403", code: "HRA-403", name: "半人面", level: "N", status: "待补充", desc: "", note: "占位 · 等待剧情补充" },
        { id: "a-404", code: "HRA-404", name: "404 not found", level: "N", status: "待补充", desc: "", note: "占位 · 等待剧情补充" },
        { id: "a-405", code: "HRA-405", name: "瞳孔", level: "A", status: "共生",
          desc: "院徽本体。以被清除的记忆为食。所有电子产品无法记录院徽相关信息；无权限者即使翻阅档案，合上瞬间记忆即被清除。佩戴院徽可在关键时刻唤回理智；最危险时被吞噬记忆者将遭受严重精神污染，理智无法修复。",
          note: "初代H.R.A高层制造的诡异之一。因早期不知如何处理A级诡异，与之黏连共生，最终成为院徽。摘下眼镜的mistake不受其特定效应影响。院徽可摘下，但不进入组织时可不被监视。" },
        { id: "a-406", code: "HRA-406", name: "棋魂", level: "N", status: "待补充", desc: "", note: "占位 · 等待剧情补充" }
      ];
    }
  }

  /* ---------------- 积分 / 等级 ---------------- */
  function levelInfo(points) {
    const arr = D.hra.promotions.slice().sort((a, b) => a.need - b.need);
    let cur = arr[0], next = null;
    for (let i = 0; i < arr.length; i++) {
      if (points >= arr[i].need) cur = arr[i]; else { next = arr[i]; break; }
    }
    return { cur, next, arr };
  }
  function addPoints(n, reason) {
    D.hra.points = Math.max(0, D.hra.points + n);
    D.hra.log.unshift({ id: uid(), delta: n, reason: reason || "调整", ts: Date.now() });
    if (D.hra.log.length > 60) D.hra.log.length = 60;
    save();
  }
  function toolLevel() {
    /* 把工具函数挂到 window，方便下一轮剧情脚本调用 */
    window.QJ = window.QJ || {};
    window.QJ.levelInfo = levelInfo;
    window.QJ.addPoints = addPoints;
    window.QJ.renameBoth = function (name) {
      const n = String(name || "").trim();
      if (!n) return toast("姓名不能为空");
      D.persona.name = n;
      D.hra.agent.name = n;
      save();
      return n;
    };
  }

  /* ---------------- 个人设置页 ---------------- */
  function personaView() {
    const p = D.persona;
    const genders = ["未填写", "女", "男", "其他"];
    return nav("个人设置", {
      right: `<button class="nav-btn" data-action="personaSave" aria-label="保存">${ic("check")}</button>`
    }) + body(`
      <div style="text-align:center;padding:14px 0 6px">
        <button data-action="personaHue" aria-label="更换头像颜色"
          style="width:76px;height:76px;border-radius:50%;border:0;cursor:pointer;color:#fff;
          font-size:28px;font-weight:600;margin:0 auto;display:grid;place-items:center;
          background:hsl(${p.avatarHue} 62% 55%)">${esc((p.name || "?").slice(0, 1))}</button>
        <div style="font-size:11.5px;color:var(--text3);margin-top:8px">点击头像换颜色</div>
      </div>
      <div class="list">
        <div class="list-item">
          <div class="li-main"><div class="li-title">姓名</div></div>
          <input class="field" id="pf-name" value="${esc(p.name)}" style="width:150px;text-align:right;padding:7px 10px" aria-label="姓名">
        </div>
        <div class="list-item">
          <div class="li-main"><div class="li-title">性别</div></div>
          <select class="field" id="pf-gender" style="width:120px;text-align:right;padding:7px 10px">
            ${genders.map(g => `<option value="${g}" ${p.gender === g ? "selected" : ""}>${g}</option>`).join("")}
          </select>
        </div>
        <div class="list-item">
          <div class="li-main"><div class="li-title">生日</div></div>
          <input class="field" id="pf-birthday" type="date" value="${esc(p.birthday || "")}" style="width:150px;text-align:right;padding:7px 10px">
        </div>
        <div class="list-item" style="flex-direction:column;align-items:stretch">
          <div class="li-title" style="margin-bottom:6px">签名</div>
          <textarea class="field" id="pf-signature" rows="3" placeholder="写点什么">${esc(p.signature || "")}</textarea>
        </div>
      </div>

      <div class="section-title" style="display:flex;align-items:center">
        <span style="flex:1">异能记录</span>
        <button class="btn ghost sm" data-action="abilityAdd">＋ 添加</button>
      </div>
      <div class="list">
        ${p.abilities.length ? p.abilities.map(a => `
          <div class="list-item" data-action="abilityEdit" data-id="${a.id}">
            <div class="li-main">
              <div class="li-title">${esc(a.name)} <span class="tag">${esc(a.type || "未分类")}</span></div>
              <div class="li-sub" style="white-space:normal;line-height:1.5">${esc(a.desc || "无描述")}</div>
            </div>
            ${ic("edit")}
          </div>`).join("") : `<div class="empty" style="padding:26px">还没有异能记录</div>`}
      </div>

      <div style="padding:16px 20px;font-size:11.5px;color:var(--text3);line-height:1.6">
        姓名与 H.R.A. 内部终端双向同步。修改后点右上角 ✓ 保存。
      </div>
    `);
  }
  ACTIONS.openPersona = () => Router.push("persona", personaView);
  ACTIONS.hraPersona  = () => Router.push("persona", personaView);

  ACTIONS.personaSave = () => {
    const name = ($("#pf-name") || {}).value || "";
    if (!name.trim()) return toast("姓名不能为空");
    D.persona.name = name.trim();
    D.hra.agent.name = name.trim();
    D.persona.gender = $("#pf-gender").value;
    D.persona.birthday = $("#pf-birthday").value;
    D.persona.signature = $("#pf-signature").value;
    save();
    Router.refresh();
    toast("已保存");
  };
  ACTIONS.personaHue = () => {
    D.persona.avatarHue = (D.persona.avatarHue + 47) % 360;
    save(); Router.refresh();
  };
  ACTIONS.abilityAdd = () => {
    promptBox("异能名称", "", n => {
      if (!n.trim()) return;
      promptBox("异能描述", "", d => {
        D.persona.abilities.push({ id: uid(), name: n.trim(), type: "主动", desc: d.trim() });
        save(); Router.refresh(); toast("已添加");
      }, true);
    });
  };
  ACTIONS.abilityEdit = el => {
    const a = D.persona.abilities.find(x => x.id === el.dataset.id);
    if (!a) return;
    sheet([
      { label: "编辑名称", fn: () => promptBox("名称", a.name, v => { if (v.trim()) { a.name = v.trim(); save(); Router.refresh(); } }) },
      { label: "编辑类型", fn: () => sheet(["主动", "被动", "职业", "被动 / 主动"].map(t => ({ label: t, fn: () => { a.type = t; save(); Router.refresh(); } }))) },
      { label: "编辑描述", fn: () => promptBox("描述", a.desc || "", v => { a.desc = v; save(); Router.refresh(); }, true) },
      { label: "删除", fn: () => confirmBox("删除异能", "确定删除这条记录吗？", "删除", () => {
        D.persona.abilities = D.persona.abilities.filter(x => x.id !== a.id);
        save(); Router.refresh(); toast("已删除");
      }) }
    ]);
  };

  /* ---------------- 注入设置页 ---------------- */
  function wrapSettings() {
    if (!APPS.settings || APPS.settings.__overhauled) return;
    const orig = APPS.settings.render;
    APPS.settings.render = function () {
      let html = orig();
      const block = `
        <div class="section-title">个人信息</div>
        <div class="list">
          <div class="list-item" data-action="openPersona">
            <div class="avatar" style="--h:${D.persona.avatarHue}">${esc((D.persona.name || "?").slice(0, 1))}</div>
            <div class="li-main">
              <div class="li-title">${esc(D.persona.name)}</div>
              <div class="li-sub">${esc(D.persona.gender)}${D.persona.birthday ? " · " + esc(D.persona.birthday) : ""} · 点击编辑</div>
            </div>
            <span style="color:var(--text3);transform:rotate(180deg)">${ic("back")}</span>
          </div>
        </div>`;
      const anchor = '<div class="section-title">外观</div>';
      html = html.includes(anchor) ? html.replace(anchor, block + anchor) : block + html;
      return html;
    };
    APPS.settings.__overhauled = true;
  }

  /* ---------------- HRA 详情页 ---------------- */
  ACTIONS.hraRoster = el => {
    const r = D.hra.roster.find(x => x.id === el.dataset.id);
    if (!r) return;
    Router.push("roster:" + r.id, () => nav(r.name) + body(`
      <div style="padding:16px;text-align:center">
        <div class="avatar lg" style="margin:0 auto 10px;--h:${r.hue}">${esc(r.name.slice(0, 1))}</div>
        <div style="font-size:19px;font-weight:600">${esc(r.name)}</div>
        <div style="font-size:12.5px;color:var(--text2);margin-top:4px">
          代号：${esc(r.codeName || "—")} · ${esc(r.position || "")}
        </div>
      </div>
      <div class="list">
        <div class="list-item"><div class="li-main"><div class="li-title">性别</div></div><div style="color:var(--text2)">${esc(r.gender || "未公开")}</div></div>
        <div class="list-item"><div class="li-main"><div class="li-title">年龄</div></div><div style="color:var(--text2)">${esc(r.age || "不详")}</div></div>
      </div>
      <div class="section-title">技能</div>
      <div class="list">
        ${(r.abilities || []).map(a => `<div class="list-item" style="align-items:flex-start">
          <div class="li-main">
            <div class="li-title">${esc(a.name)} <span class="tag">${esc(a.type || "")}</span></div>
            <div class="li-sub" style="white-space:normal;line-height:1.55;margin-top:4px">${esc(a.desc)}</div>
          </div>
        </div>`).join("") || `<div class="empty" style="padding:20px">暂无记录</div>`}
      </div>
      <div class="section-title">档案</div>
      <div class="list">
        ${[["喜欢", r.likes], ["厌恶", r.dislikes], ["性格", r.personality], ["外观", r.appearance], ["背景", r.background], ["社交", r.social], ["备注", r.note]]
          .filter(x => x[1]).map(([k, v]) => `<div class="list-item" style="align-items:flex-start">
            <div class="li-main">
              <div class="li-title">${k}</div>
              <div class="li-sub" style="white-space:normal;line-height:1.55;margin-top:4px">${esc(v)}</div>
            </div>
          </div>`).join("")}
      </div>
    `));
  };
  ACTIONS.hraAnomaly = el => {
    const a = D.hra.anomalies.find(x => x.id === el.dataset.id);
    if (!a) return;
    Router.push("anomaly:" + a.id, () => nav(a.name) + body(`
      <div style="padding:16px">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="lvl ${a.level}" style="font-size:13px;padding:3px 9px">${a.level}</span>
          <span style="font-size:12px;color:var(--text2)">${esc(a.code)}</span>
          <div class="spacer"></div>
          <span class="tag">${esc(a.status || "未知")}</span>
        </div>
        <div style="font-size:20px;font-weight:700;margin-top:10px">${esc(a.name)}</div>
      </div>
      <div style="padding:0 16px 16px;font-size:14.5px;line-height:1.72;white-space:pre-wrap">${esc(a.desc || "（档案内容待补充）")}</div>
      ${a.note ? `<div class="section-title">备注</div>
      <div style="padding:0 16px 16px;font-size:13px;color:var(--text2);line-height:1.65;white-space:pre-wrap">${esc(a.note)}</div>` : ""}
    `));
  };

  /* ---------------- 签到 + 积分流水 + 晋升 ---------------- */
  ACTIONS.hraSign = () => {
    const today = isoDate(new Date());
    if (D.hra.sign.includes(today)) return toast("今日已签到");
    D.hra.sign.push(today);
    let streak = 0, d = new Date();
    while (true) {
      const s = isoDate(d);
      if (D.hra.sign.includes(s)) { streak++; d.setDate(d.getDate() - 1); } else break;
    }
    D.hra.streak = streak;
    const bonus = 5 + Math.min(10, Math.floor(streak / 3) * 2);
    addPoints(bonus, "签到（连续 " + streak + " 天）");
    save(); Router.refresh();
    beep(760, 0.08);
    toast("签到成功 · 连续 " + streak + " 天 · +" + bonus + " 积分");
  };
  ACTIONS.hraPromote = () => {
    const { next } = levelInfo(D.hra.points);
    if (!next) return toast("已达到当前最高职级");
    if (D.hra.points < next.need) {
      return toast("积分不足，还差 " + (next.need - D.hra.points));
    }
    confirmBox("申请晋升", `确认晋升为「${next.title}」？需要 ${next.need} 积分。`, "晋升", () => {
      D.hra.rank = next.level;
      addPoints(0, "晋升：" + next.title);
      save(); Router.refresh();
      toast("晋升成功 · " + next.title);
    });
  };
  ACTIONS.hraPointLog = () => {
    modal(`<h3 class="m-title">积分流水</h3>
      <div style="max-height:320px;overflow:auto;font-size:13px">
        ${D.hra.log.length ? D.hra.log.map(l => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)">
            <div><div>${esc(l.reason)}</div>
              <div style="font-size:11px;color:var(--text3)">${fmtRel(l.ts)}</div></div>
            <div style="font-weight:600;color:${l.delta >= 0 ? "var(--green)" : "var(--red)"}">
              ${l.delta >= 0 ? "+" : ""}${l.delta}
            </div>
          </div>`).join("") : `<div class="empty" style="padding:20px">还没有积分记录</div>`}
      </div>
      <div class="m-actions"><button class="btn primary" data-action="closeModal">关闭</button></div>`);
  };

  /* ---------------- 重写 HRA 主页面 ---------------- */
  function wrapHRA() {
    if (!APPS.hra) return;
    APPS.hra.render = function () {
      if (!D.hra.installed) return nav("H.R.A.") + body(emptyState("未授权的内部终端"));
      const tab = S.hraTab || "sign";
      const h = D.hra;
      const tabs = [["sign", "签到"], ["task", "任务"], ["net", "内网"], ["chat", "群聊"], ["file", "档案"]];
      const { cur, next } = levelInfo(h.points);
      let content = "";

      if (tab === "sign") {
        const signed = h.sign.includes(isoDate(new Date()));
        const monthCount = h.sign.filter(s => s.startsWith(isoDate(new Date()).slice(0, 7))).length;
        const pct = next
          ? Math.min(100, Math.round(((h.points - cur.need) / Math.max(1, next.need - cur.need)) * 100))
          : 100;
        content = `
          <div class="hra-hero" data-action="hraPersona" style="cursor:pointer">
            <div class="hra-code">${esc(h.agent.id)} · 权限 LEVEL ${h.agent.level} · ${esc(cur.title)}</div>
            <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
              <div class="avatar" style="--h:${D.persona.avatarHue};margin:0">${esc((D.persona.name || "?").slice(0, 1))}</div>
              <div>
                <div style="font-size:19px;font-weight:600">${esc(D.persona.name)}</div>
                <div style="font-size:12px;opacity:.75;margin-top:2px">${esc(h.agent.dept)}</div>
              </div>
              <div style="margin-left:auto;font-size:11px;opacity:.65">个人设置 ›</div>
            </div>
            <div style="display:flex;gap:22px;margin-top:16px">
              <div><div style="font-size:22px;font-weight:300">${h.streak}</div>
                <div style="font-size:11px;opacity:.7">连续签到</div></div>
              <div><div style="font-size:22px;font-weight:300">${monthCount}</div>
                <div style="font-size:11px;opacity:.7">本月签到</div></div>
              <div data-action="hraPointLog"><div style="font-size:22px;font-weight:300">${h.points}</div>
                <div style="font-size:11px;opacity:.7">积分 ›</div></div>
            </div>
            <div style="margin-top:14px">
              <div style="display:flex;justify-content:space-between;font-size:11px;opacity:.8;margin-bottom:5px">
                <span>${esc(cur.title)}</span>
                <span>${next ? esc(next.title) + " · " + next.need : "已满级"}</span>
              </div>
              <div style="height:5px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden">
                <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7ad6ff,#ffd166)"></div>
              </div>
            </div>
          </div>
          <div style="padding:0 16px;display:flex;gap:10px">
            <button class="btn ${signed ? "ghost" : "primary"}" style="flex:1" data-action="hraSign">
              ${signed ? "今日已签到" : "签到打卡 +5"}
            </button>
            <button class="btn ghost" style="flex:1" data-action="hraPromote">
              申请晋升${next ? " · " + next.need : ""}
            </button>
          </div>
          <div class="section-title">值班提示</div>
          <div class="list">
            <div class="list-item"><div class="li-main"><div class="li-title">今日值班</div>
              <div class="li-sub">M.T.F.-03 · 7 号线末班车段</div></div><span class="lvl C">C</span></div>
            <div class="list-item"><div class="li-main"><div class="li-title">档案移交</div>
              <div class="li-sub">10 月异常事件归档未完成</div></div><span class="lvl S">S</span></div>
            <div class="list-item"><div class="li-main"><div class="li-title">舆情提醒</div>
              <div class="li-sub">论坛「灵异」板块讨论量上升</div></div><span class="lvl S">S</span></div>
          </div>
          <div style="padding:16px 20px;font-size:11.5px;color:var(--text3);line-height:1.6">
            绝对缄默 · 双人互证 · 三米原则<br>痕迹清理 · 无需了解
          </div>`;
      } else if (tab === "task") {
        content = `<div class="section-title">任务派发</div>
          <div class="list">
            ${h.tasks.map(t => `<div class="list-item" style="align-items:flex-start">
              <div class="li-main" style="white-space:normal">
                <div class="li-title"><span class="lvl ${t.level}">${t.level}</span> ${esc(t.title)}</div>
                <div class="li-sub" style="white-space:normal;line-height:1.5;margin-top:4px">${esc(t.desc)}</div>
                <div style="font-size:11.5px;color:var(--text3);margin-top:6px">${esc(t.reward)}</div>
              </div>
              <button class="btn ${t.status === "done" ? "ghost" : t.status === "active" ? "danger" : "primary"} sm"
                data-action="hraTask" data-id="${t.id}">
                ${t.status === "done" ? "已完成" : t.status === "active" ? "进行中" : "接取"}
              </button>
            </div>`).join("")}
          </div>
          <div style="padding:16px 20px;font-size:11.5px;color:var(--text3);line-height:1.6">
            接取任务后请按《三米原则》执行。任何涉及活体实体的操作，必须两人以上在场。
          </div>`;
      } else if (tab === "net") {
        content = `<div class="section-title">院内论坛</div>
          <div class="list">
            ${h.posts.map(p => `<div class="list-item" data-action="hraPost" data-id="${p.id}" style="align-items:flex-start">
              <div class="li-main" style="white-space:normal">
                <div class="li-title"><span class="lvl ${p.level}">${p.level}</span> ${esc(p.title)}</div>
                <div class="li-sub" style="white-space:normal;margin-top:4px">${esc(p.author)} · ${fmtRel(p.ts)} · ${p.replies.length} 条回复</div>
              </div>
            </div>`).join("")}
          </div>`;
      } else if (tab === "chat") {
        content = `<div class="section-title">工作群聊</div>
          <div class="list">
            ${h.chats.map(c => {
              const last = c.msgs[c.msgs.length - 1];
              return `<div class="list-item" data-action="hraChat" data-id="${c.id}">
                <div class="avatar" style="--h:${c.name.length * 37 % 360}">${esc(c.name.slice(0, 1))}</div>
                <div class="li-main"><div class="li-title">${esc(c.name)}</div>
                  <div class="li-sub">${esc(last ? (last.name || "") + "：" + last.text : "暂无消息")}</div></div>
                <div class="li-time">${last ? fmtRel(last.ts) : ""}</div>
              </div>`;
            }).join("")}
          </div>`;
      } else {
        content = `
          <div class="hra-hero" data-action="hraPersona" style="cursor:pointer">
            <div class="hra-code">PERSONNEL FILE</div>
            <div style="font-size:19px;font-weight:600;margin-top:8px">${esc(D.persona.name)}</div>
            <div style="font-size:12px;opacity:.75;margin-top:4px">${esc(h.agent.id)} · LEVEL ${h.agent.level}</div>
            <div style="font-size:12px;opacity:.75;margin-top:2px">${esc(h.agent.dept)}</div>
          </div>
          <div class="section-title">人物档案 ${D.hra.roster.length}</div>
          <div class="list">
            ${D.hra.roster.map(r => `<div class="list-item" data-action="hraRoster" data-id="${r.id}">
              <div class="avatar" style="--h:${r.hue}">${esc(r.name.slice(0, 1))}</div>
              <div class="li-main"><div class="li-title">${esc(r.name)}</div>
                <div class="li-sub">${esc(r.codeName || "—")} · ${esc(r.position || "")}</div></div>
              <span style="color:var(--text3);transform:rotate(180deg)">${ic("back")}</span>
            </div>`).join("")}
          </div>
          <div class="section-title">异常档案 ${D.hra.anomalies.length}</div>
          <div class="list">
            ${D.hra.anomalies.map(a => `<div class="list-item" data-action="hraAnomaly" data-id="${a.id}">
              <div class="li-main">
                <div class="li-title"><span class="lvl ${a.level}">${a.level}</span> ${esc(a.code)} · ${esc(a.name)}</div>
                <div class="li-sub">${esc(a.status || "")}${a.desc ? " · " + esc(a.desc.slice(0, 18)) : ""}</div>
              </div>
              <span style="color:var(--text3);transform:rotate(180deg)">${ic("back")}</span>
            </div>`).join("")}
          </div>
          <div style="padding:16px 20px;font-size:11.5px;color:var(--text3);line-height:1.6">
            关于诡异的「诞生」或「起源」，无需了解、不必了解。你只需知道，我们与诡异一生为敌。
          </div>`;
      }

      return `<div class="nav">
          <button class="nav-btn" data-action="back" aria-label="返回">${ic("back")}</button>
          <div class="nav-title">H.R.A. 内部终端</div>
          <div class="nav-right"><button class="nav-btn" data-action="home" aria-label="回到桌面">${ic("hra")}</button></div>
        </div>
        <div class="chips" style="padding-top:0">
          ${tabs.map(([k, n]) => `<button class="chip ${tab === k ? "on" : ""}" data-action="hraTab" data-t="${k}">${n}</button>`).join("")}
        </div>
        ${body(content)}`;
    };
  }

  /* ---------------- 重写任务（走积分流水） ---------------- */
  function wrapTask() {
    ACTIONS.hraTask = el => {
      const t = D.hra.tasks.find(x => x.id === el.dataset.id);
      if (!t) return;
      if (t.status === "done") return toast("该任务已完成");
      if (t.status === "pending") {
        confirmBox("接取任务", `确认接取「${t.title}」？接取后将进入执行中。`, "接取", () => {
          t.status = "active"; save(); Router.refresh(); toast("已接取任务");
        });
      } else {
        confirmBox("完成任务", `确认已完成「${t.title}」？完成后将计入院内积分。`, "完成", () => {
          t.status = "done";
          addPoints(30, "任务：" + t.title);
          Router.refresh(); toast("任务完成 · +30 积分");
        });
      }
    };
  }
})();
