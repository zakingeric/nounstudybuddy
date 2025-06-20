const fileInput = document.getElementById('fileInput');
const scriptArea = document.getElementById('scriptArea');
const summaryArea = document.getElementById('summaryArea');
const uploadBar = document.getElementById('uploadBar');
const processBar = document.getElementById('processBar');
const uploadText = document.getElementById('uploadText');
const processText = document.getElementById('processText');

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) {
    uploadBar.style.width = '100%';
    uploadText.textContent = 'PDF Selected ✔ Ready to read';
  } else {
    uploadText.textContent = 'No file selected ❌';
  }
});

async function processPDF() {
  const file = fileInput.files[0];
  if (!file) return alert('Upload a PDF file first.');
  const reader = new FileReader();

  reader.onload = async function () {
    const typedArray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      text += strings.join(' ') + '\n';
      const progress = Math.round((i / pdf.numPages) * 100);
      processBar.style.width = `${progress}%`;
      processText.textContent = `Reading: ${progress}%`;
    }

    scriptArea.value = text;
    processText.textContent = "Reading Complete!";
  };

  reader.readAsArrayBuffer(file);
}

async function generateSmartPodcast() {
  const script = scriptArea.value;
  const mode = document.getElementById('examMode').value;
  const style = document.getElementById('style').value;

  if (!script) return alert('Extract the script first.');

  let prompt = '';
  if (mode === 'eexam') {
    prompt = 'Read this material exactly as-is. Don’t rephrase. E-Exam students need exact wording.';
  } else {
    if (style === 'gist') {
      prompt = 'You are Ayo and Faith, two Nigerian students casually gisting and breaking this down:';
    } else if (style === 'classroom') {
      prompt = 'You are tutors explaining this clearly to fellow NOUN students in a classroom tone:';
    } else {
      prompt = 'Explain this in a calm, formal way with good clarity.';
    }
  }

  processBar.style.width = '10%';
  processText.textContent = 'Converting to podcast...';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer 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',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: script }
      ]
    })
  });

  const data = await response.json();
  const result = data.choices?.[0]?.message?.content || 'No response received.';
  scriptArea.value = result;

  processBar.style.width = '100%';
  processText.textContent = 'Podcast Generated!';
}

function generateSummary() {
  const lines = scriptArea.value.split(/\n|\. /);
  const summary = lines
    .filter(line => line.length > 40)
    .slice(0, 10)
    .map(line => '• ' + line.trim())
    .join('\n');

  summaryArea.value = summary;
}