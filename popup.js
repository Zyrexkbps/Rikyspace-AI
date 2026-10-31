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

    // Load API Key dari LocalStorage
    if (localStorage.getItem('gemini_api_key')) {
        apiKeyInput.value = localStorage.getItem('gemini_api_key');
    }

    // Hitung karakter otomatis
    if (inputTextArea && charCount) {
        inputTextArea.addEventListener('input', () => {
            charCount.innerText = inputTextArea.value.length;
        });
    }

    // Fitur Salin Hasil
    if (copyBtn && resultDiv) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(resultDiv.innerText);
            copyBtn.innerText = '✅ Tersalin!';
            setTimeout(() => copyBtn.innerText = '📋 Salin Hasil', 2000);
        });
    }

    // Logika Pemanggilan API Gemini
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

        // Simpan API Key
        localStorage.setItem('gemini_api_key', apiKey);

        // UI Loading State
        loadingDiv.style.display = 'block';
        resultBox.style.display = 'none';
        summarizeBtn.disabled = true;

        // Menyusun Prompt
        let promptText = `Tolong bertindak sebagai asisten AI profesional. Berikan rangkuman dari teks berikut dengan ketentuan:`;
        promptText += `\n- Gaya Rangkuman: ${mode === 'bullet' ? 'Poin-poin utama' : mode === 'short' ? 'Ringkasan singkat 2-3 paragraf' : 'Analisis mendalam dan komprehensif'}`;
        promptText += `\n- Nada Bahasa: ${tone === 'formal' ? 'Formal dan Profesional' : tone === 'casual' ? 'Santai dan mudah dipahami' : 'Edukatif dengan penjelasan detail'}`;
        promptText += `\n- Bahasa Hasil: Bahasa Indonesia\n\nTeks:\n${textToSummarize}`;

        // Menggunakan Endpoint v1beta dengan fallback model
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    contents: [{ 
                        parts: [{ text: promptText }] 
                    }]
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || `HTTP Error status: ${response.status}`);
            }

            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                resultDiv.innerText = data.candidates[0].content.parts[0].text;
            } else {
                resultDiv.innerText = 'Respons diterima, namun tidak ada teks rangkuman yang dihasilkan oleh AI.';
            }

        } catch (error) {
            console.error('Gemini API Error:', error);
            resultDiv.innerText = `❌ Terjadi Kesalahan:\n${error.message}\n\nSaran: Pastikan API Key yang dimasukkan dari Google AI Studio sudah benar dan tidak ada pembatasan kuota.`;
        } finally {
            loadingDiv.style.display = 'none';
            resultBox.style.display = 'block';
            summarizeBtn.disabled = false;
        }
    });
});
