document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const lengthSelect = document.getElementById('length');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');

  // Muat API Key yang tersimpan sebelumnya
  const savedKey = localStorage.getItem('rikyspace_gemini_key');
  if (savedKey) apiKeyInput.value = savedKey;

  // Simpan API Key saat diubah
  apiKeyInput.addEventListener('input', () => {
    localStorage.setItem('rikyspace_gemini_key', apiKeyInput.value.trim());
  });

  summarizeBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      statusDiv.textContent = '❌ Masukkan Gemini API Key terlebih dahulu!';
      return;
    }

    summarizeBtn.disabled = true;
    statusDiv.textContent = '⏳ Membaca teks halaman web...';
    resultDiv.style.display = 'none';

    try {
      // 1. Ambil tab aktif saat ini
      const [tab] = await chrome.tabs.query({ active: true, currentWindowId: true });

      // 2. Ekstrak teks dari halaman aktif
      const [{ result: pageText }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText
      });

      if (!pageText || pageText.trim().length < 50) {
        throw new Error('Teks halaman terlalu pendek atau tidak dapat dibaca.');
      }

      statusDiv.textContent = '🤖 Menganalisis dengan Gemini AI...';

      // 3. Panggil API Google Gemini
      const promptText = `Tolong rangkum teks berikut dalam bahasa Indonesia dengan format ${lengthSelect.value}:\n\n${pageText.substring(0, 7000)}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Gagal menghubungi Gemini API.');
      }

      const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (summary) {
        resultDiv.textContent = summary;
        resultDiv.style.display = 'block';
        statusDiv.textContent = '✅ Rangkuman selesai!';
      } else {
        throw new Error('Respon AI kosong.');
      }

    } catch (err) {
      statusDiv.textContent = `⚠️ Error: ${err.message}`;
    } finally {
      summarizeBtn.disabled = false;
    }
  });
});
