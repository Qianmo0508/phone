/* ============================================================
 * patch/overhaul.js
 * 个人信息(引导表单) / HRA增强 / 人物档案 / 统一格式异常档案
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
    // 注入档案专属样式（纸质文件风）
    if (!document.getElementById("qj-doc-style")) {
      const style = document.createElement("style");
      style.id = "qj-doc-style";
      style.innerHTML = `
        .qj-doc { padding: 16px; font-family: "Courier New", Courier, monospace; background: #fdfaf3; color: #222; border: 1.5px solid #222; border-radius: 6px; margin: 16px; position: relative; box-shadow: 2px 4px 12px rgba(0,0,0,0.15); }
        .qj-doc-header { display: flex; border-bottom: 2px solid #222; padding-bottom: 10px; margin-bottom: 10px; align-items: flex-end; }
        .qj-doc-title { font-size: 26px; font-weight: 900; letter-spacing: 4px; flex: 1; font-family: "STKaiti", "KaiTi", serif; }
        .qj-doc-meta { text-align: right; font-size: 12px; line-height: 1.6; border-left: 1px solid #222; padding-left: 10px; }
        .qj-doc-row { display: flex; border-bottom: 1px solid #222; padding: 8px 0; font-size: 13px; align-items: center; }
        .qj-doc-label { width: 80px; font-weight: bold; flex-shrink: 0; border-right: 1px solid #222; padding-right: 10px; text-align: center; }
        .qj-doc-val { flex: 1; padding-left: 12px; font-weight: 600; }
        .qj-doc-section { font-size: 14px; line-height: 1.8; margin-top: 14px; font-weight: 500; }
        .qj-doc-red { color: #d32f2f; font-weight: 700; }
        .qj-doc-footer { display: flex; justify-content: space-between; margin-top: 24px; font-size: 13px; border-top: 1px dashed #666; padding-top: 10px; font-weight: 600; }
      `;
      document.head.appendChild(style);
    }

    // 个人信息初始化
    if (!D.persona) {
      D.persona = {
        name: D.hra.agent.name || "沈默",
        gender: "未填写",
        birthday: "",
        dept: D.hra.agent.dept || "档案记录部 · 诡异情报档案科",
        signature: "",
        avatarHue: 210,
        abilities: []
      };
    }
    if (!D.hra.agent.name) D.hra.agent.name = D.persona.name;
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

    // 人物档案 (增加立场字段)
    if (!D.hra.roster) {
      D.hra.roster = [
        {
          id: "r-mistake", name: "米斯塔克", codeName: "mistake",
          gender: "未公开", age: "不详", position: "现院长", hue: 0,
          stance: "<span style='text-decoration: line-through; opacity: 0.4;'>混沌中立</span> 人类官方",
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
          note: "喜欢摘下眼镜走到摸鱼的员工身后默默视间。"
        },
        {
          id: "r-tavana", name: "Tavana Ribeira", codeName: "—",
          gender: "女", age: "29", position: "首席调查官 / 记录员", hue: 36,
          stance: "人类官方",
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
    } else {
      (D.hra.roster || []).forEach(r => {
        if (!r.stance) r.stance = "人类官方";
      });
      const m = D.hra.roster.find(x => x.id === "r-mistake");
      if (m) m.stance = "<span style='text-decoration: line-through; opacity: 0.4;'>混沌中立</span> 人类官方";
    }

    // 异常档案统一格式与初始化
    const defaultAnomalies = [
      { id: "a-013", code: "HRA-013", name: "低语", level: "P", status: "已收容", clearance: "P", handler: "生物解剖实验室", date: "1998/11/04",
        intro: "认知污染型实体。实体形态为一团黏稠的阴影，表面偶尔浮现人类五官。", abilities: "靠近时会听到持续低语，内容多为听者最不愿回想的片段。长时间暴露会导致精神衰弱。", guide: "接触人员必须佩戴认知滤网头盔，严禁对视。若听到低语，立刻切断听觉输入。" },
      { id: "a-077", code: "HRA-077", name: "回声", level: "C", status: "锚定中", clearance: "B", handler: "空间物理科", date: "2001/05/20",
        intro: "7号线末班车段的空间重叠现象。表现为站台灯光异常、广播沉默。", abilities: "车门打开时，外部空间不可信。若下车，将被困于重叠夹层。", guide: "广播沉默时禁止下车，门开也别下。等广播重新响起来，再走。" },
      { id: "a-102", code: "HRA-102", name: "长夜", level: "A", status: "仅引导", clearance: "A++", handler: "空间物理科", date: "1995/01/12",
        intro: "异常空间现象，出现于特定坐标。表现为绝对的黑暗与寂静。", abilities: "接近者将被存在性抹消，物理防御无效。", guide: "无法收容，仅能在特定坐标引导。严禁进入其范围。" },
      { id: "a-208", code: "HRA-208", name: "白伞", level: "S", status: "标准保险柜", clearance: "C", handler: "行动科", date: "2010/09/18",
        intro: "雨天出现的白色雨伞，伞下无人。", abilities: "目击者会产生强烈的跟踪感，并伴随记忆模糊。", guide: "发现后立刻进行记忆清除。实体已收容至标准保险柜。" },
      { id: "a-301", code: "HRA-301", name: "深井", level: "N", status: "最高接触限制", clearance: "A", handler: "档案记录部", date: "1990/07/22",
        intro: "90年代渠京十余口井被统一填埋，档案记为「市政改造」。井底存在未探明实体。", abilities: "关键词相关帖文会在数秒后空白化。对相关事物产生窥探欲者，将被标记。", guide: "严禁打捞。若搜索相关内容遭遇内容清空，立刻停止搜索并上报。" },
      { id: "a-401", code: "HRA-401", name: "询问式信息危害", level: "A", status: "已收容", clearance: "A++", handler: "Tavana", date: "2000/2/12",
        intro: "如果我告诉你，该诡异通常以网络为载体，以询问形式对人类进行“诡异”的散播，会怎么样？你知道，“询问式信息危害”有一个异常属性，它在入侵网络后可以将人发出的普通信息转换为一个<span class='qj-doc-red'>问题</span>吗？难道没有人指出这个诡异存在着严重的<span class='qj-doc-red'>模因危险以及异常信息的潜在泄露风险</span>吗？",
        abilities: "你知道它属于“认知模因污染”与“传染性”类非实体诡异吗？你有没有注意到，它的存在形式为非此维度可以理解的概念？除此之外，你知道它可以使人失去思想、语言能力又或被逼疯至精神崩溃吗？最初问句发出人无法察觉到异样，但被作为“载体”，这<span class='qj-doc-red'>难道不可怕吗？你知道“载体”在一至二天内若仍旧无法发现异样，将会被“诡异”彻底取代后转化他人？</span>",
        guide: "你知道官方且正确的应对方法是在察觉到异常时无误且精准地回答“询问式信息危害”的每一个问题吗？如果我告诉你尽管它并无意义、或是没有正确答案，也要作出“回答”的动作，你会怎么想？<span class='qj-doc-red'>不要被问句逼疯？不要精神崩溃？保持好理智？不要失去网络连接？</span>",
        extra: "如果我告诉你，你可能看到非现实维度的、无法理解含义的文字，你会怎么做？你知道需要谨慎对待此诡异吗？" },
      { id: "a-402", code: "HRA-402", name: "笑犬", level: "N", status: "待补充", clearance: "N", handler: "未知", date: "待定", intro: "性质与危险性尚未完全探明。", abilities: "待补充。", guide: "待补充。" },
      { id: "a-403", code: "HRA-403", name: "半人面", level: "N", status: "待补充", clearance: "N", handler: "未知", date: "待定", intro: "性质与危险性尚未完全探明。", abilities: "待补充。", guide: "待补充。" },
      { id: "a-404", code: "HRA-404", name: "404 not found", level: "N", status: "待补充", clearance: "N", handler: "未知", date: "待定", intro: "性质与危险性尚未完全探明。", abilities: "待补充。", guide: "待补充。" },
      { id: "a-405", code: "HRA-405", name: "瞳孔", level: "A", status: "共生", clearance: "S", handler: "初代高层", date: "1970/01/01",
        intro: "院徽本体。以被清除的记忆为食。所有电子产品无法记录院徽相关信息；无权限者即使翻阅档案，合上瞬间记忆即被清除。",
        abilities: "佩戴院徽可在关键时刻唤回理智；最危险时被吞噬记忆者将遭受严重精神污染，理智无法修复。摘下眼镜的mistake不受其特定效应影响。",
        guide: "院徽可摘下，但不进入组织时可不被监视。因早期不知如何处理A级诡异，与之黏连共生，最终成为院徽。",
        extra: "初代H.R.A高层制造的诡异之一。" },
      { id: "a-406", code: "HRA-406", name: "棋魂", level: "N", status: "待补充", clearance: "N", handler: "未知", date: "待定", intro: "性质与危险性尚未完全探明。", abilities: "待补充。", guide: "待补充。" }
    ];

    if (!D.hra.anomalies) {
      D.hra.anomalies = defaultAnomalies;
    } else {
      // 兼容并强制升级旧数据
      const mMap = {}; defaultAnomalies.forEach(a => mMap[a.id] = a);
      D.hra.anomalies.forEach(a => {
        if (a.id === "a-401") {
          Object.assign(a, mMap["a-401"]);
          if (a.desc && !a.intro) delete a.desc;
        } else {
          if (!a.intro) a.intro = a.desc || "暂无记录。";
          if (!a.abilities) a.abilities = "暂无记录。";
          if (!a.guide) a.guide = "暂无记录。";
          if (!a.clearance) a.clearance = "A";
          if (!a.handler) a.handler = "未知";
          if (!a.date) a.date = "未知";
        }
      });
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
    window.QJ = window.QJ || {};
    window.QJ.levelInfo = levelInfo;
    window.QJ.addPoints = addPoints;
    window.QJ.renameBoth = function (name) {
      const n = String(name || "").trim();
      if (!n) return toast("姓名不能为空");
      D.persona.name = n; D.hra.agent.name = n; save();
      return n;
    };
  }

  /* ---------------- 个人设置页 (引导型大表单) ---------------- */
  function personaView() {
    const p = D.persona;
    return nav("个人设置", {
      right: `<button class="nav-btn" data-action="personaSave" aria-label="保存">${ic("check")}</button>`
    }) + body(`
      <div style="text-align:center;padding:14px 0 6px">
        <button data-action="personaHue" aria-label="更换头像颜色"
          style="width:80px;height:80px;border-radius:50%;border:0;cursor:pointer;color:#fff;
          font-size:30px;font-weight:600;margin:0 auto;display:grid;place-items:center;
          background:hsl(${p.avatarHue} 62% 55%)">${esc((p.name || "?").slice(0, 1))}</button>
        <div style="font-size:11.5px;color:var(--text3);margin-top:8px">点击头像换颜色</div>
      </div>

      <div class="section-title">基本信息</div>
      <div class="list">
        <div class="list-item" style="flex-direction:column;align-items:stretch;padding:12px 16px">
          <div class="li-title" style="margin-bottom:8px">姓名</div>
          <input class="field" id="pf-name" value="${esc(p.name)}" placeholder="例：沈默（必须与院内档案一致）" style="padding:12px">
        </div>
        <div class="list-item" style="flex-direction:column;align-items:stretch;padding:12px 16px">
          <div class="li-title" style="margin-bottom:8px">性别</div>
          <select class="field" id="pf-gender" style="padding:12px">
            <option value="未填写" ${p.gender === "未填写" ? "selected" : ""}>请选择性别</option>
            <option value="女" ${p.gender === "女" ? "selected" : ""}>女</option>
            <option value="男" ${p.gender === "男" ? "selected" : ""}>男</option>
            <option value="其他" ${p.gender === "其他" ? "selected" : ""}>其他 / 保密</option>
          </select>
        </div>
        <div class="list-item" style="flex-direction:column;align-items:stretch;padding:12px 16px">
          <div class="li-title" style="margin-bottom:8px">生日</div>
          <input class="field" id="pf-birthday" type="date" value="${esc(p.birthday || "")}" style="padding:12px">
        </div>
        <div class="list-item" style="flex-direction:column;align-items:stretch;padding:12px 16px">
          <div class="li-title" style="margin-bottom:8px">所属部门</div>
          <select class="field" id="pf-dept" style="padding:12px">
            ${["行政部 · 档案管理科", "行政部 · 行动科", "科研部 · 生物解剖实验室", "科研部 · 模因效应科", "科研部 · 空间物理科", "档案记录部 · 诡异情报档案科", "特遣调查组 M.T.F."].map(d => `<option value="${d}" ${p.dept === d ? "selected" : ""}>${d}</option>`).join("")}
          </select>
        </div>
        <div class="list-item" style="flex-direction:column;align-items:stretch;padding:12px 16px">
          <div class="li-title" style="margin-bottom:8px">个性签名</div>
          <textarea class="field" id="pf-signature" rows="3" placeholder="例：不要试图打探，不要试图获取所谓「真相」。">${esc(p.signature || "")}</textarea>
        </div>
      </div>

      <div class="section-title" style="display:flex;align-items:center">
        <span style="flex:1">个人异能记录</span>
        <button class="btn ghost sm" data-action="abilityAdd">＋ 添加</button>
      </div>
      <div style="padding:0 16px 8px;font-size:11.5px;color:var(--text3);line-height:1.5">
        若你在任务中展现出未归档的异常能力，请在此处如实登记。不得瞒报。
      </div>
      <div class="list">
        ${p.abilities.length ? p.abilities.map(a => `
          <div class="list-item" data-action="abilityEdit" data-id="${a.id}">
            <div class="li-main">
              <div class="li-title">${esc(a.name)} <span class="tag">${esc(a.type || "未分类")}</span></div>
              <div class="li-sub" style="white-space:normal;line-height:1.5;margin-top:4px">${esc(a.desc || "无描述")}</div>
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
    D.persona.dept = $("#pf-dept").value;
    D.hra.agent.dept = D.persona.dept;
    D.persona.signature = $("#pf-signature").value;
    save(); Router.refresh(); toast("已保存");
  };
  ACTIONS.personaHue = () => { D.persona.avatarHue = (D.persona.avatarHue + 47) % 360; save(); Router.refresh(); };
  ACTIONS.abilityAdd = () => {
    modal(`<h3 class="m-title">添加异能</h3>
      <input class="field" id="ab-name" placeholder="名称（例：熄灯）" style="margin-bottom:8px;padding:12px">
      <select class="field" id="ab-type" style="margin-bottom:8px;padding:12px">
        <option value="主动">主动技能</option><option value="被动">被动技能</option><option value="职业">职业专长</option>
      </select>
      <textarea class="field" id="ab-desc" rows="4" placeholder="详细描述触发条件、效果、副作用..."></textarea>
      <div class="m-actions"><button class="btn ghost" data-action="closeModal">取消</button><button class="btn primary" id="ab-save">确定</button></div>`);
    $("#ab-save").onclick = () => {
      const n = $("#ab-name").value.trim();
      if (!n) return toast("名称不能为空");
      D.persona.abilities.push({ id: uid(), name: n, type: $("#ab-type").value, desc: $("#ab-desc").value.trim() });
      save(); closeModal(); Router.refresh(); toast("已添加");
    };
  };
  ACTIONS.abilityEdit = el => {
    const a = D.persona.abilities.find(x => x.id === el.dataset.id);
    if (!a) return;
    sheet([
      { label: "编辑", fn: () => {
        modal(`<h3 class="m-title">编辑异能</h3>
          <input class="field" id="ab-name" value="${esc(a.name)}" style="margin-bottom:8px;padding:12px">
          <select class="field" id="ab-type" style="margin-bottom:8px;padding:12px">
            <option value="主动" ${a.type === "主动" ? "selected" : ""}>主动技能</option>
            <option value="被动" ${a.type === "被动" ? "selected" : ""}>被动技能</option>
            <option value="职业" ${a.type === "职业" ? "selected" : ""}>职业专长</option>
          </select>
          <textarea class="field" id="ab-desc" rows="4">${esc(a.desc)}</textarea>
          <div class="m-actions"><button class="btn ghost" data-action="closeModal">取消</button><button class="btn primary" id="ab-save">保存</button></div>`);
        $("#ab-save").onclick = () => {
          a.name = $("#ab-name").value.trim() || a.name;
          a.type = $("#ab-type").value;
          a.desc = $("#ab-desc").value.trim();
          save(); closeModal(); Router.refresh(); toast("已保存");
        };
      }},
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

  /* ---------------- 档案详情 ---------------- */
  ACTIONS.hraRoster = el => {
    const r = D.hra.roster.find(x => x.id === el.dataset.id);
    if (!r) return;
    Router.push("roster:" + r.id, () => nav("人物档案") + body(`
      <div style="padding:16px;text-align:center">
        <div class="avatar lg" style="margin:0 auto 10px;--h:${r.hue}">${esc(r.name.slice(0, 1))}</div>
        <div style="font-size:19px;font-weight:600">${esc(r.name)}</div>
        <div style="font-size:12.5px;color:var(--text2);margin-top:4px">代号：${esc(r.codeName || "—")} · ${esc(r.position || "")}</div>
      </div>
      <div class="list">
        <div class="list-item"><div class="li-main"><div class="li-title">性别</div></div><div style="color:var(--text2)">${esc(r.gender || "未公开")}</div></div>
        <div class="list-item"><div class="li-main"><div class="li-title">年龄</div></div><div style="color:var(--text2)">${esc(r.age || "不详")}</div></div>
        <div class="list-item"><div class="li-main"><div class="li-title">立场</div></div><div style="color:var(--text2)">${r.stance || "人类官方"}</div></div>
      </div>
      <div class="section-title">技能</div>
      <div class="list">
        ${(r.abilities || []).map(a => `<div class="list-item" style="align-items:flex-start">
          <div class="li-main"><div class="li-title">${esc(a.name)} <span class="tag">${esc(a.type || "")}</span></div>
          <div class="li-sub" style="white-space:normal;line-height:1.55;margin-top:4px">${esc(a.desc)}</div></div>
        </div>`).join("")}
      </div>
      <div class="section-title">档案</div>
      <div class="list">
        ${[["喜欢", r.likes], ["厌恶", r.dislikes], ["性格", r.personality], ["外观", r.appearance], ["背景", r.background], ["社交", r.social], ["备注", r.note]]
          .filter(x => x[1]).map(([k, v]) => `<div class="list-item" style="align-items:flex-start">
            <div class="li-main"><div class="li-title">${k}</div>
            <div class="li-sub" style="white-space:normal;line-height:1.55;margin-top:4px">${esc(v)}</div></div>
          </div>`).join("")}
      </div>
    `));
  };

  ACTIONS.hraAnomaly = el => {
    const a = D.hra.anomalies.find(x => x.id === el.dataset.id);
    if (!a) return;
    const is401 = a.code === "HRA-401";
    const renderTxt = (txt) => is401 ? txt : esc(txt || "暂无记录。");
    
    Router.push("anomaly:" + a.id, () => nav("情报档案") + body(`
      <div class="qj-doc">
        <div class="qj-doc-header">
          <div class="qj-doc-title">情报档案</div>
          <div class="qj-doc-meta">
            编号：${esc(a.code)}<br>
            分类：${esc(a.level)}级<br>
            机密等级：${esc(a.clearance || "A")}
          </div>
        </div>
        <div class="qj-doc-row">
          <div class="qj-doc-label">名称</div>
          <div class="qj-doc-val" style="font-size:18px;color:${is401 ? '#d32f2f' : 'inherit'}">${esc(a.name)}</div>
        </div>
        <div class="qj-doc-row">
          <div class="qj-doc-label">威胁等级</div>
          <div class="qj-doc-val"><span class="lvl ${a.level}">${a.level}</span> ${a.status ? "(" + esc(a.status) + ")" : ""}</div>
        </div>
        
        <div class="qj-doc-section">
          <div style="font-weight:bold;margin-bottom:6px">基本介绍：</div>
          <div>${renderTxt(a.intro)}</div>
        </div>
        
        <div class="qj-doc-section">
          <div style="font-weight:bold;margin-bottom:6px">能力体系：</div>
          <div>${renderTxt(a.abilities)}</div>
        </div>
        
        <div class="qj-doc-section">
          <div style="font-weight:bold;margin-bottom:6px">作战指南：</div>
          <div>${renderTxt(a.guide)}</div>
        </div>
        
        ${a.extra ? `
        <div class="qj-doc-section">
          <div style="font-weight:bold;margin-bottom:6px">补充信息：</div>
          <div>${renderTxt(a.extra)}</div>
        </div>` : ""}
        
        <div class="qj-doc-footer">
          <div>负责人：${esc(a.handler || "未知")}</div>
          <div>更新日期：${esc(a.date || "未知")}</div>
        </div>
      </div>
    `));
  };

  /* ---------------- 提交新异常档案 ---------------- */
  ACTIONS.hraAddAnomaly = () => {
    modal(`<h3 class="m-title">提交新异常档案</h3>
      <p class="m-text" style="margin-bottom:12px">请务必使用项目编号代替真实名称，防止名称成为模因污染载体。</p>
      <input class="field" id="na-code" placeholder="编号（例：HRA-407）" style="margin-bottom:8px;padding:12px">
      <input class="field" id="na-name" placeholder="项目名称" style="margin-bottom:8px;padding:12px">
      <select class="field" id="na-level" style="margin-bottom:8px;padding:12px">
        <option value="S">S - 安全级</option>
        <option value="P">P - 异感级</option>
        <option value="C">C - 临界级</option>
        <option value="A">A - 异常级</option>
        <option value="N" selected>N - 未分级</option>
      </select>
      <textarea class="field" id="na-intro" placeholder="基本介绍（发现地、外貌、基础现象）" rows="3" style="margin-bottom:8px"></textarea>
      <textarea class="field" id="na-ability" placeholder="能力体系（触发条件、影响范围）" rows="3" style="margin-bottom:8px"></textarea>
      <textarea class="field" id="na-guide" placeholder="作战指南（应对方式、收容措施）" rows="3" style="margin-bottom:8px"></textarea>
      <textarea class="field" id="na-extra" placeholder="补充信息（非必填）" rows="2"></textarea>
      <div class="m-actions">
        <button class="btn ghost" data-action="closeModal">取消</button>
        <button class="btn primary" id="na-submit">提交审核</button>
      </div>`);

    $("#na-submit").onclick = () => {
      const code = $("#na-code").value.trim().toUpperCase();
      const name = $("#na-name").value.trim();
      if (!code || !name) return toast("编号与名称不能为空");
      if (D.hra.anomalies.some(a => a.code === code)) return toast("该编号已存在，请勿重复提交");
      
      closeModal();
      // 假审批动画
      modal(`<div style="text-align:center;padding:24px 0">
        <div style="font-size:36px;margin-bottom:12px;animation:bob 1s infinite alternate">⏳</div>
        <h3 class="m-title" style="text-align:center">数据校验中...</h3>
        <p class="m-text" style="text-align:center">档案正在通过模因过滤网，<br>等待院长确认……</p>
      </div>`);
      
      setTimeout(() => {
        closeModal();
        const newAnomaly = {
          id: "a-" + Date.now(),
          code, name,
          level: $("#na-level").value,
          status: "已收容",
          clearance: "A",
          handler: D.persona.name,
          date: new Date().toISOString().slice(0,10).replace(/-/g, "/"),
          intro: $("#na-intro").value.trim() || "暂无记录。",
          abilities: $("#na-ability").value.trim() || "暂无记录。",
          guide: $("#na-guide").value.trim() || "暂无记录。",
          extra: $("#na-extra").value.trim() || ""
        };
        D.hra.anomalies.unshift(newAnomaly);
        addPoints(50, "提交新异常档案：" + name);
        save();
        Router.refresh();
        toast("院长已确认归档。积分 +50");
        beep(880, 0.1);
      }, 2000);
    };
  };

  /* ---------------- 签到 / 晋升 / 流水 ---------------- */
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
    if (D.hra.points < next.need) return toast("积分不足，还差 " + (next.need - D.hra.points));
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
            <div><div>${esc(l.reason)}</div><div style="font-size:11px;color:var(--text3)">${fmtRel(l.ts)}</div></div>
            <div style="font-weight:600;color:${l.delta >= 0 ? "var(--green)" : "var(--red)"}">${l.delta >= 0 ? "+" : ""}${l.delta}</div>
          </div>`).join("") : `<div class="empty" style="padding:20px">还没有积分记录</div>`}
      </div>
      <div class="m-actions"><button class="btn primary" data-action="closeModal">关闭</button></div>`);
  };

  /* ---------------- 重写 HRA 主页 ---------------- */
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
        const pct = next ? Math.min(100, Math.round(((h.points - cur.need) / Math.max(1, next.need - cur.need)) * 100)) : 100;
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
              <div><div style="font-size:22px;font-weight:300">${h.streak}</div><div style="font-size:11px;opacity:.7">连续签到</div></div>
              <div><div style="font-size:22px;font-weight:300">${monthCount}</div><div style="font-size:11px;opacity:.7">本月签到</div></div>
              <div data-action="hraPointLog"><div style="font-size:22px;font-weight:300">${h.points}</div><div style="font-size:11px;opacity:.7">积分 ›</div></div>
            </div>
            <div style="margin-top:14px">
              <div style="display:flex;justify-content:space-between;font-size:11px;opacity:.8;margin-bottom:5px">
                <span>${esc(cur.title)}</span><span>${next ? esc(next.title) + " · " + next.need : "已满级"}</span>
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
            <div class="list-item"><div class="li-main"><div class="li-title">今日值班</div><div class="li-sub">M.T.F.-03 · 7 号线末班车段</div></div><span class="lvl C">C</span></div>
            <div class="list-item"><div class="li-main"><div class="li-title">档案移交</div><div class="li-sub">10 月异常事件归档未完成</div></div><span class="lvl S">S</span></div>
            <div class="list-item"><div class="li-main"><div class="li-title">舆情提醒</div><div class="li-sub">论坛「灵异」板块讨论量上升</div></div><span class="lvl S">S</span></div>
          </div>
          <div style="padding:16px 20px;font-size:11.5px;color:var(--text3);line-height:1.6">绝对缄默 · 双人互证 · 三米原则<br>痕迹清理 · 无需了解</div>`;
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
          <div style="padding:16px 20px;font-size:11.5px;color:var(--text3);line-height:1.6">接取任务后请按《三米原则》执行。任何涉及活体实体的操作，必须两人以上在场。</div>`;
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
          
          <div class="section-title" style="display:flex;align-items:center">
            <span style="flex:1">异常档案 ${D.hra.anomalies.length}</span>
            <button class="btn primary sm" data-action="hraAddAnomaly">＋ 提交新档案</button>
          </div>
          <div class="list">
            ${D.hra.anomalies.map(a => `<div class="list-item" data-action="hraAnomaly" data-id="${a.id}">
              <div class="li-main">
                <div class="li-title"><span class="lvl ${a.level}">${a.level}</span> ${esc(a.code)} · ${esc(a.name)}</div>
                <div class="li-sub">${esc(a.status || "")}${a.intro ? " · " + esc(a.intro.slice(0, 15)) : ""}</div>
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

  /* ---------------- 任务流程 ---------------- */
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
