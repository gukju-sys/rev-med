/* ============================================
   공인클리닉 데이터 + Google Sheets 실시간 연동 로더
   --------------------------------------------
   동작 방식:
   1) 아래 기본 데이터(window.CLINICS)로 즉시 동작한다.
   2) CLINIC_SHEET.id 에 Google Sheets ID를 넣으면
      페이지 로드 시 시트에서 최신 목록을 불러와 교체한다.
      · 시트 공유 설정: "링크가 있는 모든 사용자 - 뷰어" 필수
      · 시트 URL 중 /d/ 와 /edit 사이 문자열이 ID
   3) 시트 컬럼(1행 헤더, 순서 무관):
      노출상태 | 병원명 | 지역 | 주소 | 대표전화 | 진료분야 | 진료시간 | 예약링크
      · 노출상태가 "승인"인 행만 챗봇에 표시된다 (검수 후 노출)
      · 지역은 시/도 단위 권장: 서울, 경기, 인천, 부산, 대구, 대전, 광주 등
      · 진료분야는 쉼표 구분: 족저근막염, 회전근개건병증, 후각기능
   ============================================ */

window.CLINIC_SHEET = {
  id: "",   // 여기에 Google Sheets ID 입력 → 실시간 연동 활성화
  gid: "0"  // 시트 탭 gid (첫 번째 탭이면 0)
};

/* 기본 데이터 — 시트 미연동 시 또는 로드 실패 시 사용. */
window.CLINICS = [
  { name: "제이에스병원", region: "경기",
    address: "경기 수원시 권선구 금곡로196번길 76 제이에스병원 3층~7층",
    tel: "1800-5446",
    fields: ["족저근막염", "회전근개건병증"],
    hours: "평일 09:00~20:00 (점심 13:00~14:00) · 토 09:00~13:00 · 일요일 휴무",
    booking: "http://js-hospital.com/",
    lat: 37.2570, lng: 126.9550 }
];

/* ---------- CSV 파서 (따옴표 필드 지원) ---------- */
function parseCSV(text) {
  var rows = [], row = [], cell = "", inQuote = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuote = false;
      } else cell += ch;
    } else if (ch === '"') {
      inQuote = true;
    } else if (ch === ",") {
      row.push(cell); cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/* ---------- 시트 → CLINICS 변환 ---------- */
function clinicsFromSheet(csvText) {
  var rows = parseCSV(csvText);
  if (rows.length < 2) return [];
  var header = rows[0].map(function (h) { return h.trim(); });
  function col(name) { return header.indexOf(name); }
  var iStatus = col("노출상태"), iName = col("병원명"), iRegion = col("지역"),
      iAddr = col("주소"), iTel = col("대표전화"), iFields = col("진료분야"),
      iHours = col("진료시간"), iBooking = col("예약링크");
  if (iName === -1 || iRegion === -1) return []; // 헤더가 맞지 않으면 무시

  var out = [];
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    function get(i) { return i > -1 && row[i] ? String(row[i]).trim() : ""; }
    if (iStatus > -1 && get(iStatus) !== "승인") continue; // 검수 승인된 행만 노출
    if (!get(iName)) continue;
    out.push({
      name: get(iName),
      region: get(iRegion),
      address: get(iAddr),
      tel: get(iTel),
      fields: get(iFields) ? get(iFields).split(",").map(function (f) { return f.trim(); }).filter(Boolean) : [],
      hours: get(iHours),
      booking: get(iBooking)
    });
  }
  return out;
}

/* ---------- 로더 ---------- */
function loadClinicSheet(overrideUrl) {
  var cfg = window.CLINIC_SHEET || {};
  var url = overrideUrl;
  if (!url && cfg.id) {
    url = "https://docs.google.com/spreadsheets/d/" + cfg.id +
          "/gviz/tq?tqx=out:csv&gid=" + (cfg.gid || "0");
  }
  if (!url) return Promise.resolve(false);
  return fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then(function (text) {
      var list = clinicsFromSheet(text);
      if (list.length) {
        window.CLINICS = list;
        console.log("[PRP Uni] 클리닉 " + list.length + "곳을 시트에서 불러왔습니다.");
        return true;
      }
      console.warn("[PRP Uni] 시트에 승인된 클리닉이 없어 기본 데이터를 유지합니다.");
      return false;
    })
    .catch(function (err) {
      console.warn("[PRP Uni] 시트 로드 실패, 기본 데이터를 사용합니다:", err.message);
      return false;
    });
}
window.loadClinicSheet = loadClinicSheet;
loadClinicSheet();
