/* ============================================
   PRP Uni Landing — Common Scripts
   1) UTM capture & persistence
   2) Mobile nav
   3) Self-diagnosis quiz engine
   4) Consultation form
   5) Clinic search + map (clinics page)
   ============================================ */

/* ---------- 1) UTM tracking ----------
   최초 유입 시 utm_* 파라미터를 sessionStorage에 저장하고,
   페이지 이동 후에도 상담신청 폼의 hidden 필드에 자동 주입한다. */
(function captureUTM() {
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  var params = new URLSearchParams(window.location.search);
  var found = false;

  KEYS.forEach(function (k) {
    if (params.get(k)) {
      sessionStorage.setItem("prp_uni_" + k, params.get(k));
      found = true;
    }
  });
  if (found && !sessionStorage.getItem("prp_uni_landing_page")) {
    sessionStorage.setItem("prp_uni_landing_page", window.location.pathname);
    sessionStorage.setItem("prp_uni_landing_ts", new Date().toISOString());
  }
})();

function getUTM() {
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  var out = {};
  KEYS.forEach(function (k) {
    out[k] = sessionStorage.getItem("prp_uni_" + k) || "";
  });
  out.landing_page = sessionStorage.getItem("prp_uni_landing_page") || "";
  out.landing_ts = sessionStorage.getItem("prp_uni_landing_ts") || "";
  return out;
}

/* ---------- 2) Mobile nav ---------- */
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var gnb = document.querySelector(".gnb");
  if (toggle && gnb) {
    toggle.addEventListener("click", function () {
      gnb.classList.toggle("open");
    });
  }
});

/* ---------- 3) Quiz engine ----------
   각 서브페이지에서 window.QUIZ_DATA = { title, questions:[{q, options:[{label, score}]}], results:{low,mid,high} }
   를 선언하면 #quiz-root 에 자동 렌더링된다.
   ※ 결과 문구는 의료법 제56조 준수: 진단·효능 단정 금지, 상담 안내로 한정. */
document.addEventListener("DOMContentLoaded", function () {
  var root = document.getElementById("quiz-root");
  if (!root || !window.QUIZ_DATA) return;

  var data = window.QUIZ_DATA;
  var idx = 0;
  var score = 0;
  var max = data.questions.reduce(function (sum, q) {
    return sum + Math.max.apply(null, q.options.map(function (o) { return o.score; }));
  }, 0);

  function render() {
    if (idx >= data.questions.length) return renderResult();
    var q = data.questions[idx];
    var pct = Math.round((idx / data.questions.length) * 100);
    var html =
      '<div class="quiz-progress"><div class="bar" style="width:' + pct + '%"></div></div>' +
      '<p class="quiz-q"><span class="qnum">Q' + (idx + 1) + '.</span>' + q.q + "</p>" +
      '<div class="quiz-options">';
    q.options.forEach(function (o, i) {
      html += '<button type="button" data-i="' + i + '">' + o.label + "</button>";
    });
    html += "</div>" + disclaimer();
    root.innerHTML = html;

    root.querySelectorAll(".quiz-options button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        score += q.options[parseInt(btn.dataset.i, 10)].score;
        idx += 1;
        render();
      });
    });
  }

  function renderResult() {
    var ratio = score / max;
    var level = ratio < 0.34 ? "low" : ratio < 0.67 ? "mid" : "high";
    var r = data.results[level];
    root.innerHTML =
      '<div class="quiz-progress"><div class="bar" style="width:100%"></div></div>' +
      '<div class="quiz-result">' +
      '<span class="badge badge-' + level + '">' + r.badge + "</span>" +
      "<h3>" + r.title + "</h3>" +
      "<p>" + r.desc + "</p>" +
      '<a class="btn btn-primary btn-lg" href="consult.html?topic=' + encodeURIComponent(data.topic) + '">도입 문의하기</a>' +
      '&nbsp;&nbsp;<button type="button" class="btn btn-outline" id="quiz-retry">다시 하기</button>' +
      "</div>" + disclaimer();
    document.getElementById("quiz-retry").addEventListener("click", function () {
      idx = 0; score = 0; render();
    });
  }

  function disclaimer() {
    return '<p class="quiz-disclaimer">본 자가진단은 참고용 설문이며 의학적 진단이 아닙니다. ' +
      "정확한 진단과 치료 방법은 반드시 의료기관에서 전문의와 상담하시기 바랍니다.</p>";
  }

  render();
});

/* ---------- 4) Consultation form ---------- */
/* 상담 접수 엔드포인트 (Google Apps Script 웹 앱 URL).
   apps-script/consult-endpoint.gs 배포 후 발급된 URL을 붙여넣으면
   접수 내역이 Google Sheets에 저장되고 info@rev-med.co.kr 로 알림 메일이 발송된다.
   비어 있으면 데모 모드(콘솔 출력)로 동작. */
window.CONSULT_ENDPOINT = "https://script.google.com/macros/s/AKfycbzzUkIyXpZpLzGPMwGlGiTX9ts8ly5sKOCgARrVP6te1D6m-tx2tFLDwREH4hrwT2tWnw/exec";

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("consult-form");
  if (!form) return;

  // UTM hidden 필드 주입
  var utm = getUTM();
  Object.keys(utm).forEach(function (k) {
    var input = form.querySelector('input[name="' + k + '"]');
    if (input) input.value = utm[k];
  });

  // URL ?topic= 으로 진입 시 상담 분야 preselect
  var topic = new URLSearchParams(window.location.search).get("topic");
  var select = form.querySelector('select[name="topic"]');
  if (topic && select) {
    Array.prototype.forEach.call(select.options, function (opt) {
      if (opt.value === topic) select.value = topic;
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var valid = true;

    form.querySelectorAll(".form-row[data-required]").forEach(function (row) {
      var field = row.querySelector("input, select, textarea");
      var ok = !!field.value.trim();
      if (field.type === "checkbox") ok = field.checked;
      // 휴대폰·유선(02/031…)·대표번호(1800 등) 모두 허용
      if (field.name === "phone") ok = /^(0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}|1\d{3}[-\s]?\d{4})$/.test(field.value.trim());
      row.classList.toggle("invalid", !ok);
      if (!ok) valid = false;
    });

    var agree = form.querySelector('input[name="privacy_agree"]');
    var agreeRow = agree.closest(".form-row");
    agreeRow.classList.toggle("invalid", !agree.checked);
    if (!agree.checked) valid = false;

    if (!valid) return;

    var payload = {};
    new FormData(form).forEach(function (v, k) { payload[k] = v; });

    function showSuccess() {
      form.innerHTML =
        '<div class="form-success">' +
        '<div class="icon">🎉</div>' +
        "<h3>도입 문의가 접수되었습니다</h3>" +
        '<p style="color:var(--ink-soft);margin-top:10px">담당자가 영업일 기준 1일 이내에 남겨주신 연락처로 도입 절차를 안내드리겠습니다.</p>' +
        '<a class="btn btn-outline mt-40" href="index.html" style="margin-top:24px">홈으로 돌아가기</a>' +
        "</div>";
    }

    var endpoint = window.CONSULT_ENDPOINT;
    if (!endpoint) {
      // 데모 모드: 엔드포인트 미설정 시 콘솔 출력만
      console.log("[PRP Uni] consultation payload (전송 미설정):", payload);
      showSuccess();
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "전송 중...";

    /* Apps Script 웹 앱은 CORS 응답 헤더를 주지 않으므로 no-cors로 전송.
       (응답 본문은 읽을 수 없지만 요청은 정상 도달·처리된다) */
    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    })
      .then(showSuccess)
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "상담 신청하기";
        alert("전송 중 오류가 발생했습니다. 잠시 후 다시 시도하시거나 대표전화(031-741-0996)로 문의해 주세요.");
      });
  });
});

/* ---------- 5) Clinic search + Leaflet map ---------- */
document.addEventListener("DOMContentLoaded", function () {
  var listEl = document.getElementById("clinic-list");
  if (!listEl || !window.CLINICS) return;

  var regionSel = document.getElementById("clinic-region");
  var fieldSel = document.getElementById("clinic-field");
  var searchIn = document.getElementById("clinic-search");
  var map = null;
  var markers = [];

  if (window.L && document.getElementById("clinic-map")) {
    map = L.map("clinic-map").setView([36.5, 127.8], 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  }

  function orangeIcon() {
    return L.divIcon({
      className: "",
      html: '<div style="width:18px;height:18px;border-radius:50%;background:#F37021;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  function render() {
    var region = regionSel.value;
    var field = fieldSel.value;
    var kw = searchIn.value.trim().toLowerCase();

    var filtered = window.CLINICS.filter(function (c) {
      if (region !== "all" && c.region !== region) return false;
      if (field !== "all" && c.fields.indexOf(field) === -1) return false;
      if (kw && (c.name + c.address).toLowerCase().indexOf(kw) === -1) return false;
      return true;
    });

    // 목록
    if (!filtered.length) {
      listEl.innerHTML = '<div class="clinic-empty">조건에 맞는 클리닉이 없습니다.<br>검색 조건을 변경해 보세요.</div>';
    } else {
      listEl.innerHTML = filtered.map(function (c, i) {
        return (
          '<div class="clinic-item" data-i="' + i + '">' +
          "<h4>" + c.name + "</h4>" +
          '<p class="meta">' + c.address + "<br>☎ " + c.tel + "</p>" +
          '<div class="badges">' + c.fields.map(function (f) { return "<span>" + f + "</span>"; }).join("") + "</div>" +
          "</div>"
        );
      }).join("");
    }

    // 지도 마커
    if (map) {
      markers.forEach(function (m) { map.removeLayer(m); });
      markers = filtered.map(function (c) {
        return L.marker([c.lat, c.lng], { icon: orangeIcon() })
          .addTo(map)
          .bindPopup("<strong>" + c.name + "</strong><br>" + c.address + "<br>☎ " + c.tel);
      });
      if (filtered.length) {
        var group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.25));
      }
    }

    // 목록 클릭 → 지도 포커스
    listEl.querySelectorAll(".clinic-item").forEach(function (item) {
      item.addEventListener("click", function () {
        listEl.querySelectorAll(".clinic-item").forEach(function (el) { el.classList.remove("active"); });
        item.classList.add("active");
        var c = filtered[parseInt(item.dataset.i, 10)];
        if (map) {
          map.setView([c.lat, c.lng], 14);
          markers[parseInt(item.dataset.i, 10)].openPopup();
        }
      });
    });
  }

  [regionSel, fieldSel].forEach(function (el) { el.addEventListener("change", render); });
  searchIn.addEventListener("input", render);
  render();
});
