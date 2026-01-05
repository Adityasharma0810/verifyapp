document.addEventListener("DOMContentLoaded", () => {
    const SUPABASE_URL = "https://iglkrwpruybqmdtqijet.supabase.co/rest/v1/shipments";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbGtyd3BydXlicW1kdHFpamV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODg1MDAsImV4cCI6MjA3ODk2NDUwMH0.gdsS3I8NYS5fJb-My_Pq08yL_2kXLZQYK_ut_1DAauM";

    const resultBox = document.getElementById("result");
    const shipmentInput = document.getElementById("shipmentId");
    const verifyBtn = document.getElementById("verifyBtn");

    // Matches React's extractIdFromQr logic
    function extractIdFromQr(raw) {
        let text = raw.trim();
        // URL QR
        if (text.startsWith('http')) {
            const parts = text.split('/');
            return parts[parts.length - 1] || null;
        }
        // JSON QR
        try {
            const parsed = JSON.parse(text);
            if (parsed?.id) return parsed.id;
        } catch (e) {}
        
        return text || null;
    }

    function showResult(type, message, details = "") {
        resultBox.className = `result ${type}`;
        resultBox.innerHTML = `
            <div class="result-header">
                <span class="icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="status-text">${message}</span>
            </div>
            ${details ? `<div class="details">${details}</div>` : ''}
            ${type === 'success' ? `<button class="view-btn" onclick="window.open('https://yourwebsite.com/certification/${details.id}', '_blank')">View Full Certificate Details</button>` : ''}
        `;
        resultBox.classList.remove("hidden");
    }

    window.verifyShipment = async function () {
        const rawId = shipmentInput.value;
        const id = extractIdFromQr(rawId);
        
        if (!id) return;

        verifyBtn.disabled = true;
        verifyBtn.textContent = "Verifying...";
        resultBox.classList.add("hidden");

        try {
            const query = `id=eq.${id}&select=*`;
            const res = await fetch(`${SUPABASE_URL}?${query}`, {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`
                }
            });

            const data = await res.json();
            const record = data[0];

            // Strict check like React: must exist AND status must be 'Certificate Issued'
            if (!record || record.status !== 'Certificate Issued') {
                showResult("error", "Certificate Not Found");
            } else {
                showResult("success", "Certificate Valid", { id: record.id });
            }
        } catch (err) {
            showResult("error", "Verification failed");
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.textContent = "Verify";
        }
    };

    // QR logic... (remains same but calls extractIdFromQr)
    let qrScanner;
    window.startQR = function () {
        const reader = document.getElementById("qr-reader");
        reader.style.display = "block";
        qrScanner = new Html5Qrcode("qr-reader");
        qrScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
            qrScanner.stop();
            reader.style.display = "none";
            shipmentInput.value = extractIdFromQr(text);
            verifyShipment();
        });
    };
});