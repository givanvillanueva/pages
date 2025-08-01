(async () => {
  let cancelRequested = false;

  // Detectar tecla Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cancelRequested = true;
      const msg = document.getElementById('pdf-message');
      if (msg) msg.textContent = '❌ Cancelado por el usuario';
    }
  });

  // Crear overlay con blur y spinner centrado
  const overlay = document.createElement('div');
  overlay.id = 'pdf-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(5px);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
    font-size: 18px;
    color: #333;
  `;

  overlay.innerHTML = `
    <div style="
      width: 40px;
      height: 40px;
      border: 5px solid #999;
      border-top: 5px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    "></div>
    <div id="pdf-message">Generando PDF...</div>
  `;

  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  async function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(`Error cargando script: ${src}`);
      document.head.appendChild(script);
    });
  }

  await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

  while (!window.html2canvas || !window.jspdf) {
    await new Promise(r => setTimeout(r, 100));
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'pt', 'a4');
  const maxSlides = 4;

  for (let i = 0; i < maxSlides; i++) {
    if (cancelRequested) break;

    const scrollContainer = document.querySelector('div[style*="overflow: scroll"]');
    if (!scrollContainer) break;

    const originalHeight = scrollContainer.style.height;
    scrollContainer.style.height = scrollContainer.scrollHeight + 'px';
    await new Promise(r => setTimeout(r, 800));

    const canvas = await html2canvas(scrollContainer);
    scrollContainer.style.height = originalHeight;

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();

    if (pdfHeight <= pageHeight) {
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    } else {
      let heightLeft = pdfHeight;
      let position = 0;
      while (heightLeft > 0) {
        if (cancelRequested) break;
        if (i > 0 || position !== 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
      }
    }

    const keyboardEvent = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      code: 'ArrowRight',
      keyCode: 39,
      which: 39,
      bubbles: true,
    });
    document.dispatchEvent(keyboardEvent);

    await new Promise(r => setTimeout(r, 1500));
  }

  if (!cancelRequested) {
    pdf.save('captura_multislide.pdf');
    document.getElementById('pdf-message').textContent = '✅ PDF descargado correctamente';
  }

  setTimeout(() => {
    document.getElementById('pdf-overlay')?.remove();
  }, 3000);
})();
