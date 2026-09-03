(function () {
  var STORE = "fwocs.v1";
  var EMAIL = "office@readywellpsych.com";

  function collect() {
    var data = { fields: {}, radios: {} };
    document.querySelectorAll("input[id], select[id], textarea[id]").forEach(function (el) {
      data.fields[el.id] = el.value;
    });
    document.querySelectorAll("input[type=radio]:checked").forEach(function (el) {
      data.radios[el.name] = el.value;
    });
    return data;
  }
  function apply(data) {
    if (!data) return;
    Object.keys(data.fields || {}).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = data.fields[id];
    });
    Object.keys(data.radios || {}).forEach(function (name) {
      var sel = 'input[type=radio][name="' + name + '"][value="' + String(data.radios[name]).replace(/"/g, '') + '"]';
      var el = document.querySelector(sel);
      if (el) el.checked = true;
    });
  }
  function save() {
    var payload = JSON.stringify(collect());
    try { localStorage.setItem(STORE, payload); } catch (e) {}
    document.cookie = STORE + "=" + encodeURIComponent(payload) + ";max-age=" + (60 * 60 * 24 * 14) + ";path=/;SameSite=Lax";
  }
  function load() {
    var raw = "";
    try { raw = localStorage.getItem(STORE) || ""; } catch (e) {}
    if (!raw) {
      var hit = document.cookie.split("; ").find(function (p) { return p.indexOf(STORE + "=") === 0; });
      raw = hit ? decodeURIComponent(hit.slice(STORE.length + 1)) : "";
    }
    if (!raw) return;
    try { apply(JSON.parse(raw)); } catch (e) {}
  }
  function clearStore() {
    try { localStorage.removeItem(STORE); } catch (e) {}
    document.cookie = STORE + "=;max-age=0;path=/;SameSite=Lax";
  }

  async function sendOffice() {
    var status = document.getElementById("copyStatus");
    var body = window._ocsSummary || "";
    if (!body) return;
    var initials = (document.getElementById("name") && document.getElementById("name").value.trim()) || "initials";
    var fd = new FormData();
    fd.append("_subject", "FOR REVIEW : OCS screener");
    fd.append("_template", "box");
    fd.append("_captcha", "false");
    fd.append("_url", "https://fwocs.yuriybortnik.com");
    fd.append("initials", initials);
    fd.append("message", body);
    if (status) status.textContent = "Sending to office@readywellpsych.com\u2026";
    try {
      var res = await fetch("https://formsubmit.co/ajax/" + EMAIL, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd
      });
      var data = await res.json().catch(function () { return {}; });
      if (String(data.success) === "true") {
        if (status) status.textContent = "Sent to office@readywellpsych.com.";
        return;
      }
      if (/activat/i.test(String(data.message || ""))) {
        if (status) status.textContent = "Queued. First send may need one Activate Form click at the office inbox.";
        return;
      }
      throw new Error(data.message || "send failed");
    } catch (err) {
      if (status) status.textContent = "Send did not go through. Copy summary is still in the box.";
    }
  }

  var gmail = document.getElementById("gmailBtn");
  if (gmail) gmail.remove();

  var actions = document.querySelector(".actions");
  if (actions && !document.getElementById("resetBtn")) {
    var reset = document.createElement("button");
    reset.type = "button";
    reset.id = "resetBtn";
    reset.className = "secondary";
    reset.textContent = "Reset";
    reset.onclick = function () {
      if (!confirm("Erase this screener on this phone and start over?")) return;
      clearStore();
      location.reload();
    };
    actions.appendChild(reset);
  }

  var scoreBtn = document.getElementById("scoreBtn");
  if (scoreBtn) {
    scoreBtn.textContent = "Score my answers";
    var prev = scoreBtn.onclick;
    scoreBtn.onclick = async function () {
      if (typeof score === "function") score();
      else if (typeof prev === "function") prev();
      if (typeof copySummary === "function") copySummary();
      if (window._ocsSummary) await sendOffice();
      save();
    };
  }

  load();
  document.addEventListener("change", save);
  document.addEventListener("input", save);
})();
