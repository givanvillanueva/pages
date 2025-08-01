(async () => {
  // Mostrar spinner de carga
  const loader = document.createElement('div');
  loader.id = 'pdf-loader';
  loader.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 16px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  loader.innerHTML = `<span class="spinner" style="border: 4px solid #fff; border-top: 4px solid transparent; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite;"></span> Generando PDF...`;
  document.body.appendChild(loader);

  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // Función para cargar scripts externos
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
    const scrollContainer = document.querySelector('div[style*="overflow: scroll"]');
    if (!scrollContainer) {
      console.warn("No se encontró el contenedor con scroll");
      break;
    }

    const originalHeight = scrollContainer.style.height;
    scrollContainer.style.height = scrollContainer.scrollHeight + 'px';
    await new Promise(r => setTimeout(r, 800)); // Esperar que se renderice

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
        if (i > 0 || position !== 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
      }
    }

    // Simular flecha derecha (ArrowRight)
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

  pdf.save('captura_multislide.pdf');

  // Cambiar mensaje de loader
  loader.innerHTML = '✅ PDF descargado correctamente';
  setTimeout(() => loader.remove(), 3000);
})();
