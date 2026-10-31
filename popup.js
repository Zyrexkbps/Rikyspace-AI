document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const inputTextArea = document.getElementById('inputText');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const resultDiv = document.getElementById('result');
    const resultBox = document.getElementById('resultBox');
    const loadingDiv = document.getElementById('loading');
    const summaryType = document.getElementById('summaryType');
    const toneType = document.getElementById('toneType');
    const charCount = document.getElementById('charCount');
    const copyBtn = document.getElementById('copyBtn');

    if (localStorage.getItem('gemini_api_key')) {
        apiKeyInput.value = localStorage.getItem('gemini_api_key');
    }

    if (inputTextArea && charCount) {
        inputTextArea.addEventListener('input', () => {
            charCount.innerText = inputTextArea.value.length;
        });
    }

    if (copyBtn && resultDiv) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(resultDiv.innerText);
            copyBtn.innerText = '✅ Tersalin!';
            setTimeout(() => copyBtn.innerText = '📋 Salin Hasil', 2000);
        });
    }

    summarizeBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const textToSummarize = inputTextArea.value.trim();
        const mode = summaryType ? summaryType.value : 'bullet';
        const tone = toneType ? toneType.value : 'formal';

        if (!apiKey) {
            alert('Harap masukkan Gemini API Key terlebih dahulu!');
            return;
        }

        if (!textToSummarize) {
            alert('Harap masukkan teks yang ingin dirangkum!');
            return;
        }

        localStorage.setItem('gemini_api_key', apiKey);

        loadingDiv.style.display = 'block';
        resultBox.style.display = 'none';
        summarizeBtn.disabled = true;

        let promptText = `Tolong bertindak sebagai asisten AI profesional. Berikan rangkuman dari teks berikut:`;
        promptText += `\n- Gaya Rangkuman: ${mode === 'bullet' ? 'Poin-poin utama' : mode === 'short' ? 'Ringkasan singkat 2-3 paragraf' : 'Analisis mendalam'}`;
        promptText += `\n- Nada Bahasa: ${tone === 'formal' ? 'Formal' : tone === 'casual' ? 'Santai' : 'Edukatif'}`;
        promptText += `\n- Bahasa: Bahasa Indonesia\n\nTeks:\n${textToSummarize}`;

        // Daftar model yang diuji secara berurutan jika ada error
        const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
        let success = false;

        for (const model of models) {
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }]
                    })
                });

                const data = await response.json();

                if (response.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                    resultDiv.innerText = data.candidates[0].content.parts[0].text;
                    success = true;
                    break;
                } else if (data.error) {
                    console.warn(`Model ${model} gagal:`, data.error.message);
                }
            } catch (err) {
                console.warn(`Koneksi ke ${model} gagal:`, err);
            }
        }

        if (!success) {
            resultDiv.innerText = "❌ Gagal mendapatkan respons dari Google AI.\n\nHal yang bisa diperiksa:\n1. Pastikan API Key valid dari aistudio.google.com\n2. Pastikan koneksi internet stabil.";
        }

        loadingDiv.style.display = 'none';
        resultBox.style.display = 'block';
        summarizeBtn.disabled = false;
    });
});
