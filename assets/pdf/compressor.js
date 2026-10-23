import * as pdfjsLib from './pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('./pdf.worker.min.mjs', import.meta.url).href;

const byId = id => document.getElementById(id);
const input = byId('pdf-file');
const dropzone = byId('pdf-dropzone');
const viewIds = ['pdf-dropzone', 'pdf-workspace', 'pdf-progress', 'pdf-result'];
const presets = { light: { scale: 1.7, quality: .88 }, balanced: { scale: 1.35, quality: .75 }, strong: { scale: 1, quality: .58 } };
let selected = null, resultUrl = null, resultName = '', busy = false, cancelled = false, renderTask = null;

function show(id) {
  viewIds.forEach(view => { byId(view).hidden = view !== id; });
}
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes, index = 0;
  while (value >= 1024 && index < units.length - 1) { value /= 1024; index++; }
  return value.toFixed(index ? 1 : 0) + ' ' + units[index];
}
function clearError() { byId('pdf-error').hidden = true; byId('pdf-error').textContent = ''; }
function showError(message) { byId('pdf-error').textContent = message; byId('pdf-error').hidden = false; }
function revokeResult() { if (resultUrl) URL.revokeObjectURL(resultUrl); resultUrl = null; }
function reset() {
  if (busy) return;
  selected = null; input.value = ''; revokeResult(); clearError(); show('pdf-dropzone'); dropzone.focus();
}
function choose(files) {
  if (busy || !files?.length) return;
  clearError();
  if (files.length !== 1) { showError('PDF 파일은 한 번에 1개씩 선택해 주세요.'); return; }
  const file = files[0];
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { showError('PDF 파일만 선택할 수 있습니다.'); return; }
  if (!file.size) { showError('내용이 없는 파일입니다. 다른 PDF를 선택해 주세요.'); return; }
  if (file.size > 100 * 1024 * 1024) { showError('100MB 이하의 PDF 파일을 선택해 주세요.'); return; }
  selected = file; revokeResult(); byId('pdf-filename').textContent = file.name; byId('pdf-filesize').textContent = formatSize(file.size);
  show('pdf-workspace'); byId('pdf-compress').focus();
}
dropzone.addEventListener('click', () => input.click());
dropzone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); } });
input.addEventListener('change', event => choose(event.target.files));
['dragenter', 'dragover'].forEach(name => dropzone.addEventListener(name, event => { event.preventDefault(); dropzone.classList.add('is-dragging'); }));
['dragleave', 'drop'].forEach(name => dropzone.addEventListener(name, event => { event.preventDefault(); dropzone.classList.remove('is-dragging'); }));
dropzone.addEventListener('drop', event => choose(event.dataTransfer.files));
byId('pdf-remove').addEventListener('click', reset);
byId('pdf-again').addEventListener('click', reset);
byId('pdf-cancel').addEventListener('click', () => { cancelled = true; byId('pdf-cancel').disabled = true; byId('pdf-progress-text').textContent = '작업을 취소하고 있습니다.'; renderTask?.cancel(); });

function progress(value, text) {
  byId('pdf-progressbar').value = value;
  byId('pdf-progress-text').textContent = text;
}
function canvasJpeg(canvas, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('CANVAS_EXPORT')), 'image/jpeg', quality));
}

byId('pdf-compress').addEventListener('click', async () => {
  if (!selected || busy) return;
  const file = selected;
  const preset = presets[document.querySelector('input[name="pdf-quality"]:checked').value];
  busy = true; cancelled = false; clearError(); revokeResult(); byId('pdf-cancel').disabled = false;
  byId('pdf-card').setAttribute('aria-busy', 'true'); show('pdf-progress'); progress(0, '문서를 준비하고 있습니다.');
  let loadingTask = null, pdf = null;
  try {
    if (!window.PDFLib) throw new Error('ENGINE_NOT_READY');
    loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
    pdf = await loadingTask.promise;
    if (cancelled) throw new Error('CANCELLED');
    const output = await window.PDFLib.PDFDocument.create();
    for (let number = 1; number <= pdf.numPages; number++) {
      if (cancelled) throw new Error('CANCELLED');
      progress(Math.round((number - 1) / pdf.numPages * 100), number + ' / ' + pdf.numPages + ' 페이지 처리 중');
      const page = await pdf.getPage(number);
      const base = page.getViewport({ scale: 1 });
      // Render resolution may change; physical page dimensions stay the same.
      const scale = Math.min(preset.scale, Math.sqrt(16000000 / (base.width * base.height)), 8192 / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(viewport.width)); canvas.height = Math.max(1, Math.ceil(viewport.height));
      try {
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('CANVAS_UNAVAILABLE');
        context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise; renderTask = null;
        if (cancelled) throw new Error('CANCELLED');
        const jpeg = await canvasJpeg(canvas, preset.quality);
        const image = await output.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
        const resultPage = output.addPage([base.width, base.height]);
        resultPage.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height });
      } finally { canvas.width = 0; canvas.height = 0; page.cleanup(); }
      progress(Math.round(number / pdf.numPages * 100), number + ' / ' + pdf.numPages + ' 페이지 처리 완료');
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (cancelled) throw new Error('CANCELLED');
    progress(100, '압축된 PDF를 저장하고 있습니다.');
    const bytes = await output.save({ useObjectStreams: true });
    if (cancelled) throw new Error('CANCELLED');
    const blob = new Blob([bytes], { type: 'application/pdf' });
    resultUrl = URL.createObjectURL(blob); resultName = file.name.replace(/\.pdf$/i, '') + '_압축.pdf';
    byId('pdf-before').textContent = formatSize(file.size); byId('pdf-after').textContent = formatSize(blob.size);
    byId('pdf-result-pages').textContent = pdf.numPages + '페이지 처리 완료';
    const smaller = blob.size < file.size;
    byId('pdf-result-title').textContent = smaller ? 'PDF 압축을 완료했습니다.' : '용량이 줄지 않았습니다.';
    byId('pdf-saved').textContent = smaller ? '원본보다 약 ' + Math.round((1 - blob.size / file.size) * 100) + '% 가벼워졌습니다.' : '이미 최적화된 PDF는 처리 후 용량이 커질 수 있습니다. 이 경우 원본 사용을 권장합니다.';
    show('pdf-result'); byId('pdf-result-title').focus();
  } catch (error) {
    show('pdf-workspace');
    if (cancelled) showError('작업을 취소했습니다. 원본 파일은 변경되지 않았습니다.');
    else if (error.name === 'PasswordException') showError('암호로 보호된 PDF입니다. 암호를 해제한 파일로 다시 시도해 주세요.');
    else if (error.message === 'ENGINE_NOT_READY') showError('PDF 도구를 불러오고 있습니다. 잠시 후 다시 시도하거나 페이지를 새로고침해 주세요.');
    else showError('PDF를 처리하지 못했습니다. 정상적인 PDF 파일인지 확인하거나 압축 수준을 바꿔 다시 시도해 주세요.');
  } finally {
    renderTask = null; busy = false; byId('pdf-card').setAttribute('aria-busy', 'false');
    try { if (pdf) await pdf.destroy(); else if (loadingTask) await loadingTask.destroy(); } catch { /* Release local PDF resources. */ }
  }
});

byId('pdf-download').addEventListener('click', () => {
  if (!resultUrl) return;
  const link = document.createElement('a'); link.href = resultUrl; link.download = resultName;
  document.body.appendChild(link); link.click(); link.remove();
});
window.addEventListener('pagehide', revokeResult);