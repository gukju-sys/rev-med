/* ============================================
   PRP Uni 상담 도우미 챗봇 (시나리오 기반)
   - 모든 답변은 사전 작성된 문구만 사용 (의료법 제56조 대응:
     생성형 답변 없음, 문구 일괄 법무 검토 가능)
   - 증상 안내 → 자가진단 연결 → 지역별 클리닉 추천 → 상담 신청
   - style.css의 CSS 변수(테마)를 그대로 사용, DOM/스타일 자체 주입
   ============================================ */
(function () {
  "use strict";

  /* ---------- 대화 시나리오 ---------- */
  var FLOW = {
    start: {
      bot: ["안녕하세요! PRP Uni 상담 도우미입니다. 😊", "무엇을 도와드릴까요?"],
      options: [
        { label: "🩺 증상이 궁금해요", next: "symptom" },
        { label: "🏥 가까운 클리닉 찾기", next: "clinic" },
        { label: "💉 PRP 치료 과정 안내", next: "process" },
        { label: "📝 도입 문의", next: "consult" }
      ]
    },
    symptom: {
      bot: ["어느 부위·증상이 궁금하신가요?"],
      options: [
        { label: "🦶 발바닥·발뒤꿈치", next: "sym_plantar" },
        { label: "💪 어깨", next: "sym_rotator" },
        { label: "🦵 무릎", next: "sym_knee" },
        { label: "🤾 팔꿈치", next: "sym_epicondylitis" },
        { label: "👃 후각(냄새)", next: "sym_olfactory" },
        { label: "👁️ 눈(안구 건조·자극)", next: "sym_eye" },
        { label: "🤰 난임·얇은 자궁내막", next: "sym_endometrium" },
        { label: "기타 / 잘 모르겠어요", next: "sym_etc" }
      ]
    },
    sym_plantar: {
      bot: [
        "아침 첫걸음에 발뒤꿈치가 찌르듯 아프거나, 오래 앉았다 일어설 때 발바닥 통증이 반복된다면 족저근막염을 의심해 볼 수 있어요.",
        "1분 자가진단으로 상태를 확인해 보시겠어요?"
      ],
      options: [
        { label: "자가진단 해보기", href: "plantar-fasciitis.html#quiz" },
        { label: "족저근막염 자세히 보기", href: "plantar-fasciitis.html" },
        { label: "도입 문의하기", href: "consult.html?topic=plantar" },
        { label: "← 처음으로", next: "start" }
      ]
    },
    sym_rotator: {
      bot: [
        "팔을 어깨 높이 이상 들 때 통증이 있거나, 밤에 아픈 쪽으로 눕기 힘들다면 회전근개 힘줄의 문제일 수 있어요.",
        "1분 자가진단으로 상태를 확인해 보시겠어요?"
      ],
      options: [
        { label: "자가진단 해보기", href: "rotator-cuff.html#quiz" },
        { label: "회전근개건병증 자세히 보기", href: "rotator-cuff.html" },
        { label: "도입 문의하기", href: "consult.html?topic=rotator" },
        { label: "← 처음으로", next: "start" }
      ]
    },
    sym_knee: {
      bot: [
        "계단을 오르내릴 때 무릎이 아프거나, 아침에 무릎이 뻣뻣하다 움직이면 나아진다면 무릎 골관절염을 의심해 볼 수 있어요.",
        "1분 자가진단으로 상태를 확인해 보시겠어요?"
      ],
      options: [
        { label: "자가진단 해보기", href: "knee-osteoarthritis.html#quiz" },
        { label: "무릎 골관절염 자세히 보기", href: "knee-osteoarthritis.html" },
        { label: "도입 문의하기", href: "consult.html?topic=knee" },
        { label: "← 처음으로", next: "start" }
      ]
    },
    sym_epicondylitis: {
      bot: [
        "물건을 들거나 손목을 젖힐 때 팔꿈치 바깥·안쪽이 아프다면 상과염(테니스·골프 엘보)을 의심해 볼 수 있어요.",
        "1분 자가진단으로 상태를 확인해 보시겠어요?"
      ],
      options: [
        { label: "자가진단 해보기", href: "epicondylitis.html#quiz" },
        { label: "상과염 자세히 보기", href: "epicondylitis.html" },
        { label: "도입 문의하기", href: "consult.html?topic=epicondylitis" },
        { label: "← 처음으로", next: "start" }
      ]
    },
    sym_olfactory: {
      bot: [
        "감기·감염 후 냄새를 잘 못 맡거나, 음식 맛이 예전과 다르게 느껴진다면 후각기능 저하를 의심해 볼 수 있어요.",
        "1분 자가진단으로 상태를 확인해 보시겠어요?"
      ],
      options: [
        { label: "자가진단 해보기", href: "olfactory.html#quiz" },
        { label: "후각기능 자세히 보기", href: "olfactory.html" },
        { label: "도입 문의하기", href: "consult.html?topic=olfactory" },
        { label: "← 처음으로", next: "start" }
      ]
    },
    sym_eye: {
      bot: [
        "인공눈물을 넣어도 눈의 이물감·건조감이 잘 낫지 않는 난치성 안구표면 질환에는 자가 PRP 안약치료를 고려해 볼 수 있어요.",
        "1분 자가진단으로 상태를 확인해 보시겠어요?"
      ],
      options: [
        { label: "자가진단 해보기", href: "prp-eye-drops.html#quiz" },
        { label: "자가 PRP 안약치료 자세히 보기", href: "prp-eye-drops.html" },
        { label: "도입 문의하기", href: "consult.html?topic=eye" },
        { label: "← 처음으로", next: "start" }
      ]
    },
    sym_endometrium: {
      bot: [
        "양질의 배아를 이식해도 반복적으로 착상에 실패하고 자궁내막이 얇다면, 냉동배아이식 중 자궁강 내 자가 PRP 주입술을 고려해 볼 수 있어요.",
        "간단한 자가 체크를 해보시겠어요?"
      ],
      options: [
        { label: "자가 체크 해보기", href: "endometrium.html#quiz" },
        { label: "난치성 얇은 자궁내막 자세히 보기", href: "endometrium.html" },
        { label: "도입 문의하기", href: "consult.html?topic=endometrium" },
        { label: "← 처음으로", next: "start" }
      ]
    },
    sym_etc: {
      bot: [
        "증상이 애매하거나 여러 부위가 불편하시군요.",
        "상담을 신청해 주시면 담당자가 확인 후 알맞은 안내를 도와드릴게요. 정확한 진단은 의료기관에서 전문의 진료를 통해 받으실 수 있습니다."
      ],
      options: [
        { label: "도입 문의하기", href: "consult.html?topic=etc" },
        { label: "← 처음으로", next: "start" }
      ]
    },
    clinic: {
      bot: ["어느 지역에서 찾으시나요?"],
      options: "REGIONS" // 동적 생성
    },
    process: {
      bot: [
        "PRP Uni 세포치료는 이렇게 진행돼요.",
        "① 인증 클리닉에서 전문의 진료·평가\n② 본인 혈액 소량 채취\n③ 원심분리로 혈소판풍부혈장(PRP) 분리\n④ 의료진 판단에 따라 병변 부위 주입",
        "구체적인 적용 여부와 방법은 전문의 진료를 통해 결정됩니다."
      ],
      options: [
        { label: "도입 문의하기", href: "consult.html" },
        { label: "가까운 클리닉 찾기", next: "clinic" },
        { label: "← 처음으로", next: "start" }
      ]
    },
    consult: {
      bot: ["도입 문의 페이지로 안내해 드릴게요. 의료기관명과 연락처를 남겨주시면 담당자가 영업일 기준 1일 이내에 도입 절차를 안내드립니다."],
      options: [
        { label: "도입 문의 페이지 열기", href: "consult.html" },
        { label: "← 처음으로", next: "start" }
      ]
    }
  };

  /* ---------- 스타일 주입 ---------- */
  var css = [
    ".chat-fab{position:fixed;right:22px;bottom:22px;z-index:900;width:60px;height:60px;border-radius:50%;",
    "border:none;background:var(--orange,#F37021);color:#fff;font-size:1.6rem;box-shadow:0 6px 20px rgba(217,90,10,.35);",
    "display:flex;align-items:center;justify-content:center;transition:transform .2s}",
    ".chat-fab:hover{transform:scale(1.08)}",
    ".chat-panel{position:fixed;right:22px;bottom:94px;z-index:901;width:360px;max-width:calc(100vw - 32px);",
    "height:520px;max-height:calc(100vh - 130px);display:none;flex-direction:column;overflow:hidden;",
    "background:var(--surface,var(--white,#fff));border:1px solid var(--line,#F0E3D8);border-radius:20px;",
    "box-shadow:0 16px 48px rgba(0,0,0,.18)}",
    ".chat-panel.open{display:flex}",
    ".chat-head{display:flex;align-items:center;gap:10px;padding:16px 18px;color:#fff;",
    "background:linear-gradient(120deg,#F37021 0%,#D95A0A 100%)}",
    ".chat-head .cdot{width:10px;height:10px;border-radius:50%;background:#7CF5B2;flex-shrink:0}",
    ".chat-head strong{font-size:.98rem}",
    ".chat-head small{display:block;font-size:.74rem;opacity:.85;font-weight:400}",
    ".chat-close{margin-left:auto;background:none;border:none;color:#fff;font-size:1.3rem;line-height:1;padding:4px}",
    ".chat-body{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:10px;",
    "background:var(--ground,var(--cream,#FFFBF7))}",
    ".chat-msg{max-width:82%;padding:11px 14px;border-radius:16px;font-size:.9rem;line-height:1.55;white-space:pre-line}",
    ".chat-msg.bot{align-self:flex-start;background:var(--surface,#fff);border:1px solid var(--line,#F0E3D8);",
    "border-bottom-left-radius:4px;color:var(--ink,#1E1A17)}",
    ".chat-msg.user{align-self:flex-end;background:var(--orange,#F37021);color:#fff;border-bottom-right-radius:4px}",
    ".chat-opts{display:flex;flex-direction:column;gap:8px;align-self:stretch;padding-top:2px}",
    ".chat-opts button,.chat-opts a{display:block;text-align:left;padding:11px 14px;border-radius:12px;",
    "border:1.5px solid var(--orange,#F37021);background:var(--surface,#fff);color:var(--orange,#F37021);",
    "font-weight:700;font-size:.88rem;text-decoration:none;transition:background .15s;font-family:inherit;cursor:pointer}",
    ".chat-opts button:hover,.chat-opts a:hover{background:var(--orange-soft,#FFF3EA)}",
    ".chat-clinic{align-self:flex-start;max-width:88%;background:var(--surface,#fff);border:1px solid var(--line,#F0E3D8);",
    "border-radius:14px;padding:12px 14px;font-size:.85rem}",
    ".chat-clinic strong{display:block;color:var(--ink,#1E1A17)}",
    ".chat-clinic span{color:var(--ink-soft,#55504B);font-size:.8rem}",
    ".chat-clinic a{display:inline-block;margin-top:7px;color:var(--orange,#F37021);font-weight:700;",
    "font-size:.8rem;text-decoration:none}",
    ".chat-clinic a:hover{text-decoration:underline}",
    ".chat-typing{align-self:flex-start;padding:12px 16px;display:flex;gap:5px}",
    ".chat-typing i{width:7px;height:7px;border-radius:50%;background:var(--orange,#F37021);opacity:.4;",
    "animation:chatBlink 1.2s infinite}",
    ".chat-typing i:nth-child(2){animation-delay:.2s}.chat-typing i:nth-child(3){animation-delay:.4s}",
    "@keyframes chatBlink{0%,80%,100%{opacity:.3}40%{opacity:1}}",
    ".chat-foot{padding:9px 14px;border-top:1px solid var(--line,#F0E3D8);font-size:.68rem;line-height:1.5;",
    "color:var(--ink-faint,#9A928A);background:var(--surface,#fff)}",
    "@media(prefers-reduced-motion:reduce){.chat-fab,.chat-typing i{transition:none;animation:none}}",
    "@media(max-width:480px){.chat-panel{right:16px;bottom:88px}}"
  ].join("");
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- DOM ---------- */
  var fab = document.createElement("button");
  fab.className = "chat-fab";
  fab.setAttribute("aria-label", "상담 도우미 열기");
  fab.textContent = "💬";

  var panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "PRP Uni 상담 도우미");
  panel.innerHTML =
    '<div class="chat-head"><span class="cdot"></span>' +
    "<div><strong>PRP Uni 상담 도우미</strong><small>사전 안내 · 진단이 아닌 참고 정보입니다</small></div>" +
    '<button class="chat-close" aria-label="닫기">×</button></div>' +
    '<div class="chat-body"></div>' +
    '<div class="chat-foot">본 챗봇은 사전 작성된 안내 정보만 제공하며 의학적 진단·처방을 대신하지 않습니다. ' +
    "정확한 진단과 치료는 의료기관에서 전문의 진료를 통해 받으시기 바랍니다.</div>";

  function mount() {
    document.body.appendChild(fab);
    document.body.appendChild(panel);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  var body = panel.querySelector(".chat-body");
  var started = false;

  fab.addEventListener("click", function () {
    var open = panel.classList.toggle("open");
    fab.setAttribute("aria-label", open ? "상담 도우미 닫기" : "상담 도우미 열기");
    if (open && !started) { started = true; goTo("start"); }
  });
  panel.querySelector(".chat-close").addEventListener("click", function () {
    panel.classList.remove("open");
  });

  /* ---------- 엔진 ---------- */
  function scroll() { body.scrollTop = body.scrollHeight; }

  function addUser(text) {
    var el = document.createElement("div");
    el.className = "chat-msg user";
    el.textContent = text;
    body.appendChild(el); scroll();
  }

  function addBotSeq(messages, done) {
    var i = 0;
    (function next() {
      if (i >= messages.length) { if (done) done(); return; }
      var typing = document.createElement("div");
      typing.className = "chat-typing";
      typing.innerHTML = "<i></i><i></i><i></i>";
      body.appendChild(typing); scroll();
      setTimeout(function () {
        typing.remove();
        var el = document.createElement("div");
        el.className = "chat-msg bot";
        el.textContent = messages[i];
        body.appendChild(el); scroll();
        i += 1; next();
      }, 420);
    })();
  }

  function clearOpts() {
    var old = body.querySelector(".chat-opts");
    if (old) old.remove();
  }

  function addOptions(options) {
    clearOpts();
    var wrap = document.createElement("div");
    wrap.className = "chat-opts";
    options.forEach(function (o) {
      var el;
      if (o.href) {
        el = document.createElement("a");
        el.href = o.href;
        el.textContent = o.label + " →";
      } else {
        el = document.createElement("button");
        el.type = "button";
        el.textContent = o.label;
        el.addEventListener("click", function () {
          addUser(o.label.replace(/^([^\s가-힣a-zA-Z]+)\s*/, ""));
          clearOpts();
          if (o.action) o.action(); else goTo(o.next);
        });
      }
      wrap.appendChild(el);
    });
    body.appendChild(wrap); scroll();
  }

  function goTo(id) {
    var node = FLOW[id];
    addBotSeq(node.bot, function () {
      if (node.options === "REGIONS") addOptions(regionOptions());
      else addOptions(node.options);
    });
  }

  /* ---------- 지역별 클리닉 추천 (clinics-data.js 공유) ---------- */
  function regionOptions() {
    var clinics = window.CLINICS || [];
    var regions = [];
    clinics.forEach(function (c) {
      if (regions.indexOf(c.region) === -1) regions.push(c.region);
    });
    var opts = regions.map(function (r) {
      return { label: r, action: function () { showClinics(r); } };
    });
    opts.push({ label: "← 처음으로", next: "start" });
    return opts;
  }

  function showClinics(region) {
    var list = (window.CLINICS || []).filter(function (c) { return c.region === region; });
    addBotSeq([region + " 지역의 인증 클리닉이에요."], function () {
      list.slice(0, 4).forEach(function (c) {
        var card = document.createElement("div");
        card.className = "chat-clinic";
        var html = "<strong>" + c.name + "</strong><span>" + c.address +
          "<br>☎ " + c.tel + " · " + c.fields.join(" · ");
        if (c.hours) html += "<br>🕐 " + c.hours;
        html += "</span>";
        if (c.booking) {
          html += '<a href="' + c.booking + '" target="_blank" rel="noopener">온라인 예약 →</a>';
        }
        card.innerHTML = html;
        body.appendChild(card);
      });
      scroll();
      addOptions([
        { label: "도입 문의하기", href: "consult.html" },
        { label: "다른 지역 보기", next: "clinic" },
        { label: "← 처음으로", next: "start" }
      ]);
    });
  }
})();
