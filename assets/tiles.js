// Home page: tiles open a full-screen sheet for their section. The sheet grows out of the tile that was clicked
// (clip-path animation) and shrinks back into it on close. #section links open the matching panel.
(function () {
  var sheet = document.getElementById("sheet");
  var closeBtn = document.getElementById("sheet-close");
  var panels = Array.prototype.slice.call(sheet.querySelectorAll(".panel"));
  var tiles = Array.prototype.slice.call(document.querySelectorAll(".tile"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var current = null, opener = null;

  function tileFor(id) { return document.querySelector('.tile[data-panel="' + id + '"]'); }

  function clipFrom(el) {
    if (!el) return "inset(40% 40% 40% 40% round 12px)";
    var r = el.getBoundingClientRect(), w = window.innerWidth, h = window.innerHeight;
    return "inset(" + Math.max(0, r.top) + "px " + Math.max(0, w - r.right) + "px " +
      Math.max(0, h - r.bottom) + "px " + Math.max(0, r.left) + "px round 12px)";
  }

  function show(id) {
    panels.forEach(function (p) { p.hidden = p.id !== id; });
    var p = document.getElementById(id);
    sheet.setAttribute("aria-label", p.querySelector("h2").textContent);
    sheet.scrollTop = 0;
    current = id;
  }

  function open(id, fromEl, updateHash) {
    if (!document.getElementById(id) || !sheet.contains(document.getElementById(id))) return false;
    var wasOpen = !sheet.hidden;
    show(id);
    if (updateHash && location.hash !== "#" + id) history.pushState(null, "", "#" + id);
    if (!wasOpen) {
      opener = fromEl || tileFor(id);
      sheet.hidden = false;
      document.body.classList.add("sheet-open");
      if (!reduce && sheet.animate) {
        sheet.animate([{ clipPath: clipFrom(opener) }, { clipPath: "inset(0px 0px 0px 0px round 0px)" }],
          { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" });
        sheet.querySelector(".sheet-body").animate([{ opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "none" }], { duration: 380, delay: 140, easing: "ease-out", fill: "backwards" });
      }
    }
    closeBtn.focus({ preventScroll: true });
    return true;
  }

  function close(updateHash) {
    if (sheet.hidden) return;
    var back = tileFor(current) || opener;
    function done() {
      sheet.hidden = true;
      document.body.classList.remove("sheet-open");
      if (back) back.focus({ preventScroll: true });
    }
    if (updateHash && location.hash) history.pushState(null, "", location.pathname + location.search);
    if (!reduce && sheet.animate) {
      var a = sheet.animate([{ clipPath: "inset(0px 0px 0px 0px round 0px)" }, { clipPath: clipFrom(back) }],
        { duration: 320, easing: "cubic-bezier(.4,0,.6,1)" });
      a.onfinish = done;
    } else { done(); }
    current = null;
  }

  tiles.forEach(function (t) {
    t.addEventListener("click", function () { open(t.dataset.panel, t, true); });
  });
  closeBtn.addEventListener("click", function () { close(true); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) close(true); });

  // keep keyboard focus inside the open sheet
  sheet.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var f = Array.prototype.slice.call(sheet.querySelectorAll('a[href], button:not([disabled])'))
      .filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  // in-page links (#research, #students ...) switch panels instead of scrolling
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    if (document.getElementById(id) && sheet.contains(document.getElementById(id))) {
      e.preventDefault();
      open(id, tileFor(id), true);
    }
  });

  function fromHash() {
    var id = location.hash.slice(1);
    if (id && document.getElementById(id) && sheet.contains(document.getElementById(id))) open(id, tileFor(id), false);
    else close(false);
  }
  window.addEventListener("popstate", fromHash);
  fromHash();
})();
