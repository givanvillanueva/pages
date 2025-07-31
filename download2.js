(async function () {
  async function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
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
    await new Promise(r => setTimeout(r, 50));
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'pt', 'a4');
  const maxSlides = 4;

  // Función para dividir el canvas en páginas
  function addCanvasBySlices(canvas, pdf, pdfWidth, pageHeight) {
    const ctx = canvas.getContext("2d");
    const totalHeight = canvas.height;
    const scale = pdfWidth / canvas.width;
    const sliceHeight = pageHeight / scale;
    const totalPages = Math.ceil(totalHeight / sliceHeight);

    for (let page = 0; page < totalPages; page++) {
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.min(sliceHeight, totalHeight - page * sliceHeight);

      const sliceCtx = sliceCanvas.getContext("2d");
      sliceCtx.drawImage(
        canvas,
        0,
        page * sliceHeight,
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        canvas.width,
        sliceCanvas.height
      );

      const imgData = sliceCanvas.toDataURL("image/png");
      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pageHeight);
    }
  }

  for (let i = 0; i < maxSlides; i++) {
    const scrollContainer = document.querySelector('div[style*="overflow: scroll"]');
    if (!scrollContainer) {
      console.warn("No se encontró contenedor con scroll");
      break;
    }

    const originalHeight = scrollContainer.style.height;
    scrollContainer.style.height = scrollContainer.scrollHeight + 'px';
    scrollContainer.scrollTop = 0;
    await new Promise(r => setTimeout(r, 100)); // aseguramos que se renderice

    const canvas = await html2canvas(scrollContainer, { useCORS: true });
    scrollContainer.style.height = originalHeight;

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    addCanvasBySlices(canvas, pdf, pdfWidth, pageHeight);

    // Simular flecha derecha (ArrowRight)
    const keyboardEvent = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      code: 'ArrowRight',
      keyCode: 39,
      which: 39,
      bubbles: true,
    });
    document.dispatchEvent(keyboardEvent);

    await new Promise(r => setTimeout(r, 500)); // Espera a que el slide cambie
  }

  pdf.save('captura_multislide.pdf');
})();
