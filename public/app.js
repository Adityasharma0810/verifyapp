// 🔐 Supabase config (anon key is SAFE for read-only)
window.onerror = function (msg, url, line, col, error) {
  alert("JS Error: " + msg);
};


const SUPABASE_URL =
  "https://iglkrwpruybqmdtqijet.supabase.co/rest/v1/shipments";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbGtyd3BydXlicW1kdHFpamV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODg1MDAsImV4cCI6MjA3ODk2NDUwMH0.gdsS3I8NYS5fJb-My_Pq08yL_2kXLZQYK_ut_1DAauM";

const resultBox = document.getElementById("result");
const shipmentInput = document.getElementById("shipmentId");

// -------------------- HELPERS --------------------
function cleanShipmentId(raw) {
  let text = raw.trim();

  // ✅ Handle JSON QR
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.id) text = parsed.id;
    } catch (e) {
      console.error("Invalid QR JSON");
    }
  }

  // ✅ Remove junk chars
  return text.replace(/[^a-zA-Z0-9-]/g, "");
}

function showError(msg) {
  resultBox.className = "result error";
  resultBox.textContent = "❌ " + msg;
  resultBox.classList.remove("hidden");
}

function showLoading() {
  resultBox.className = "result";
  resultBox.textContent = "⏳ Verifying...";
  resultBox.classList.remove("hidden");
}

// -------------------- VERIFY SHIPMENT --------------------
async function verifyShipment() {
  let id = shipmentInput.value;
  if (!id) return showError("Enter shipment ID");

  id = cleanShipmentId(id);
  shipmentInput.value = id;

  showLoading();

  try {
    const query =
      `or=(id.eq.${id},reference_id.eq.${id})` +
      `&limit=1` +
      `&select=product_name,quantity,unit,origin,status`;

    const res = await fetch(`${SUPABASE_URL}?${query}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return showError("Shipment not found");
    }

    const s = data[0];
    const issued =
      s.status && s.status.toLowerCase().includes("issued");

    resultBox.className = "result success";
    resultBox.textContent =
      (issued ? "✅ VERIFIED (Certificate Issued)\n\n" : "⚠️ PENDING VERIFICATION\n\n") +
      "Shipment Details:\n" +
      `Product: ${s.product_name}\n` +
      `Quantity: ${s.quantity} ${s.unit || ""}\n` +
      `Origin: ${s.origin}\n` +
      `Status: ${s.status}`;

  } catch (err) {
    showError("Verification failed");
  }
}

// -------------------- QR CAMERA SCAN --------------------
let qrScanner;

function startQR() {
  const reader = document.getElementById("qr-reader");
  reader.innerHTML = "";
  reader.style.display = "block";

  qrScanner = new Html5Qrcode("qr-reader");

  qrScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 220 },
    (text) => {
      qrScanner.stop();
      reader.style.display = "none";

      const cleaned = cleanShipmentId(text);
      shipmentInput.value = cleaned;
      verifyShipment();
    }
  );
}

// -------------------- QR IMAGE UPLOAD --------------------
function scanQRImage(input) {
  if (!input.files.length) return;

  const file = input.files[0];
  const qr = new Html5Qrcode("qr-reader");

  qr.scanFile(file, true)
    .then(text => {
      const cleaned = cleanShipmentId(text);
      shipmentInput.value = cleaned;
      verifyShipment();
    })
    .catch(() => showError("Invalid QR image"));
}
