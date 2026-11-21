/* ============================================================
 * patch/fix-gesture.js
 * 修复桌面第二页划不开的问题（用 Touch 事件重写滑动逻辑）
 * ============================================================ */
(function () {
  "use strict";

  function fix() {
    if (typeof $ === "undefined" || typeof S === "undefined" || !document.getElementById("dpages")) {
      setTimeout(fix, 50); return;
    }
    if (window.__QJ_GESTURE_FIXED__) return;
    window.__QJ_GESTURE_FIXED__ = true;

    const dp = $("#dpages");
    let dragging = false, startX = 0, startY = 0, dx = 0, dy = 0, w = 390;
    let isHorizontal = false;

    const start = (clientX, clientY, e) => {
      if (S.locked) return;
      if (e.target.closest("input,textarea")) return;
      dragging = true;
      isHorizontal = false;
      startX = clientX;
      startY = clientY;
      dx = 0; dy = 0;
      w = $("#screen").clientWidth || 390;
      dp.classList.add("dragging");
    };

    const move = (clientX, clientY, e) => {
      if (!dragging) return;
      dx = clientX - startX;
      dy = clientY - startY;

      // 判断手势方向
      if (!isHorizontal) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
          isHorizontal = true;
        } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
          // 垂直滑动，放弃翻页
          dragging = false;
          dp.classList.remove("dragging");
          return;
        }
      }

      if (isHorizontal) {
        // 阻止浏览器原生的滚动/侧滑返回
        if (e.cancelable) e.preventDefault();
        const pages = window.homePages ? window.homePages() : [1, 2];
        let base = -S.page * w, offset = dx;
        // 边缘阻尼效果
        if ((S.page === 0 && dx > 0) || (S.page === pages.length - 1 && dx < 0)) offset = dx * 0.32;
        dp.style.transform = `translateX(${base + offset}px)`;
      }
    };

    const end = () => {
      if (!dragging) { dp.classList.remove("dragging"); return; }
      dragging = false;
      dp.classList.remove("dragging");
      const pages = window.homePages ? window.homePages() : [1, 2];
      
      if (isHorizontal) {
        if (dx < -60 && S.page < pages.length - 1) S.page++;
        else if (dx > 60 && S.page > 0) S.page--;
        
        // 阻止滑动结束后的误触点击
        window.__ignoreNextClick = true;
        setTimeout(() => { window.__ignoreNextClick = false; }, 300);
      }
      
      // 调用原有的 transform 更新函数
      if (window.updatePageTransform) window.updatePageTransform();
      if (typeof $$ !== "undefined") {
        $$("#dots .dot-ind").forEach((d, i) => d.classList.toggle("on", i === S.page));
      }
    };

    // 1. 绑定原生 Touch 事件 (移动端)
    dp.addEventListener("touchstart", e => start(e.touches[0].clientX, e.touches[0].clientY, e), { passive: true });
    dp.addEventListener("touchmove", e => move(e.touches[0].clientX, e.touches[0].clientY, e), { passive: false });
    dp.addEventListener("touchend", end);
    dp.addEventListener("touchcancel", end);

    // 2. 绑定鼠标事件 (桌面端预览)
    dp.addEventListener("mousedown", e => start(e.clientX, e.clientY, e));
    window.addEventListener("mousemove", e => move(e.clientX, e.clientY, e));
    window.addEventListener("mouseup", end);

    // 3. 拦截全局 Click，防止滑动结束时误触打开应用
    const origClickHandler = (e) => {
      if (window.__ignoreNextClick) {
        window.__ignoreNextClick = false;
        e.preventDefault();
        e.stopPropagation();
      }
    };
    // 在捕获阶段拦截，优先级高于原版的 click 事件
    document.addEventListener("click", origClickHandler, true);
  }

  setTimeout(fix, 0);
})();
