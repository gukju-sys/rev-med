/* ============================================================
   PRP Uni 온라인 상담 접수 엔드포인트 (Google Apps Script)
   ------------------------------------------------------------
   기능:
   1) 웹사이트 상담 폼 제출을 받아 Google Sheets에 행으로 저장
   2) 접수 즉시 NOTIFY_EMAIL 로 알림 메일 발송

   ★ 배포 방법 (5분):
   1. https://script.google.com 접속 → "새 프로젝트"
   2. 기본 코드를 지우고 이 파일 전체를 붙여넣기 → 저장
   3. 우측 상단 [배포] → [새 배포] → 유형: "웹 앱"
      - 다음 사용자 인증 정보로 실행: "나"
      - 액세스 권한이 있는 사용자: "모든 사용자"  ← 중요!
   4. [배포] 클릭 → 권한 승인 (Google 계정 확인)
   5. 발급된 "웹 앱 URL" 복사 (https://script.google.com/macros/s/…/exec)
   6. 웹사이트 js/main.js 상단의 CONSULT_ENDPOINT 에 붙여넣기

   ※ 코드 수정 후에는 [배포] → [배포 관리] → 연필 아이콘 →
      버전: "새 버전" 으로 재배포해야 반영됩니다.
   ============================================================ */

var NOTIFY_EMAIL = "info@rev-med.co.kr"; // 도입 문의 알림을 받을 메일
var SHEET_NAME = "도입문의";             // 내역이 쌓일 시트 탭 이름 (새 탭이 자동 생성됨)

var TOPIC_LABELS = {
  plantar: "족저근막염",
  rotator: "회전근개건병증",
  olfactory: "후각기능",
  etc: "전체/기타"
};

var HEADERS = [
  "접수일시", "의료기관명", "담당자명", "연락처", "이메일", "관심적응증", "소재지",
  "문의내용", "유입경로(utm_source)", "매체(utm_medium)", "캠페인(utm_campaign)",
  "키워드(utm_term)", "소재(utm_content)", "랜딩페이지"
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var topicLabel = TOPIC_LABELS[data.topic] || data.topic || "";
    var now = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

    // 1) 시트에 저장
    //    연결된 스프레드시트가 없으면 최초 1회 자동 생성 후 ID를 저장해 재사용
    var props = PropertiesService.getScriptProperties();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      var ssId = props.getProperty("SS_ID");
      if (ssId) {
        ss = SpreadsheetApp.openById(ssId);
      } else {
        ss = SpreadsheetApp.create("PRP Uni 상담신청 내역");
        props.setProperty("SS_ID", ss.getId());
      }
    }
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      now, data.hospital || "", data.name || "", data.phone || "", data.email || "",
      topicLabel, data.region || "", data.message || "", data.utm_source || "",
      data.utm_medium || "", data.utm_campaign || "", data.utm_term || "",
      data.utm_content || "", data.landing_page || ""
    ]);

    // 2) 알림 메일 발송
    var body =
      "새 도입 문의가 접수되었습니다.\n\n" +
      "■ 접수일시: " + now + "\n" +
      "■ 의료기관명: " + (data.hospital || "-") + "\n" +
      "■ 담당자명: " + (data.name || "-") + "\n" +
      "■ 연락처: " + (data.phone || "-") + "\n" +
      "■ 이메일: " + (data.email || "-") + "\n" +
      "■ 관심적응증: " + (topicLabel || "-") + "\n" +
      "■ 소재지: " + (data.region || "-") + "\n" +
      "■ 문의내용:\n" + (data.message || "-") + "\n\n" +
      "─ 유입 정보 ─\n" +
      "utm_source: " + (data.utm_source || "-") + "\n" +
      "utm_medium: " + (data.utm_medium || "-") + "\n" +
      "utm_campaign: " + (data.utm_campaign || "-") + "\n" +
      "랜딩페이지: " + (data.landing_page || "-") + "\n\n" +
      "전체 내역: " + ss.getUrl();

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: "[PRP Uni 도입문의] " + (data.hospital || "기관미입력") + " - " + (data.name || "담당자미입력"),
      body: body
    });

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* 배포 확인용: 웹 앱 URL을 브라우저로 열면 이 메시지가 보입니다 */
function doGet() {
  return ContentService.createTextOutput("PRP Uni 상담 접수 엔드포인트가 정상 동작 중입니다.");
}
