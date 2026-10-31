document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const inputTextArea = document.getElementById('inputText');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');

    // Muat API Key yang tersimpan di LocalStorage
    if (localStorage.getItem('gemini_api_key')) {
        apiKeyInput.value = localStorage.getItem('gemini_api_key');
    }

    // Ambil teks dari tab aktif jika berjalan sebagai Ekstensi Chrome
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.scripting?.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => window.getSelection().toString() || document.body.innerText
                }, (results) => {
                    if (results && results[0] && results[0].result && inputTextArea) {
                        inputTextArea.value = results[0].result.substring(0, 3000); // Batasi 3000 karakter awal
                    }
                });
            }
        });
    }

    // Logika saat tombol Rangkum diklik
    summarizeBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const textToSummarize = inputTextArea ? inputTextArea.value.trim() : '';

        if (!apiKey) {
            alert('Harap masukkan Gemini API Key Anda terlebih dahulu!');
            return;
        }

        if (!textToSummarize) {
            alert('Harap masukkan atau tempelkan teks yang ingin dirangkum!');
            return;
        }

        // Simpan API Key ke penyimpanan lokal
        localStorage.setItem('gemini_api_key', apiKey);

        // Tampilkan loading dan sembunyikan hasil sebelumnya
        loadingDiv.style.display = 'block';
        resultDiv.innerText = '';
        summarizeBtn.disabled = true;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Tolong rangkum teks berikut ke dalam bahasa Indonesia yang ringkas, jelas, dan berbentuk poin-poin utama:\n\n${textToSummarize}`
                        }]
                    }]
                })
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0].content.parts[0].text) {
                resultDiv.innerText = data.candidates[0].content.parts[0].text;
            } else if (data.error) {
                resultDiv.innerText = `Error dari Google AI: ${data.error.message}`;
            } else {
                resultDiv.innerText = 'Gagal merangkum teks. Silakan periksa kembali API Key Anda.';
            }
        } catch (error) {
            resultDiv.innerText = `Terjadi kesalahan koneksi: ${error.message}`;
        } finally {
            loadingDiv.style.display = 'none';
            summarizeBtn.disabled = false;
        }
    });
});
