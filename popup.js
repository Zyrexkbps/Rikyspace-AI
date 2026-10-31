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
    inputTextArea.addEventListener('input', () => {
        charCount.innerText = inputTextArea.value.length;
    });

    // Fitur Salin Hasil
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(resultDiv.innerText);
        copyBtn.innerText = '✅ Tersalin!';
        setTimeout(() => copyBtn.innerText = '📋 Salin Hasil', 2000);
    });

    // Logika AI Gemini
    summarizeBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const textToSummarize = inputTextArea.value.trim();
        const mode = summaryType.value;
        const tone = toneType.value;

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

        // Menyusun Prompt AI Otomatis Berdasarkan Pilihan User
        let promptText = `Tolong bertindak sebagai asisten AI profesional. Berikan rangkuman dari teks berikut dengan ketentuan:`;
        promptText += `\n- Gaya Rangkuman: ${mode === 'bullet' ? 'Poin-poin utama' : mode === 'short' ? 'Ringkasan singkat 2-3 paragraf' : 'Analisis mendalam dan komprehensif'}`;
        promptText += `\n- Nada Bahasa: ${tone === 'formal' ? 'Formal dan Profesional' : tone === 'casual' ? 'Santai dan mudah dipahami' : 'Edukatif dengan penjelasan detail'}`;
        promptText += `\n- Bahasa Hasil: Bahasa Indonesia\n\nTeks:\n${textToSummarize}`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }]
                })
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0].content.parts[0].text) {
                resultDiv.innerText = data.candidates[0].content.parts[0].text;
                resultBox.style.display = 'block';
            } else if (data.error) {
                resultDiv.innerText = `Error: ${data.error.message}`;
                resultBox.style.display = 'block';
            } else {
                resultDiv.innerText = 'Gagal memproses AI. Periksa kembali API Key Anda.';
                resultBox.style.display = 'block';
            }
        } catch (error) {
            resultDiv.innerText = `Terjadi kesalahan koneksi: ${error.message}`;
            resultBox.style.display = 'block';
        } finally {
            loadingDiv.style.display = 'none';
            summarizeBtn.disabled = false;
        }
    });
});
