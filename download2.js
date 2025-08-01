(async () => {
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

  let previousDataUrl = null;
  const maxTries = 10;

  for (let i = 0; i < maxTries; i++) {
    console.log(`Capturando slide ${i + 1}...`);

    const scrollContainer = document.querySelector('div[style*="overflow: scroll"]');
    if (!scrollContainer) {
      console.warn("No se encontró el contenedor con scroll");
      break;
    }

    const originalHeight = scrollContainer.style.height;
    scrollContainer.style.height = scrollContainer.scrollHeight + 'px';
    await new Promise(r => setTimeout(r, 800)); // Esperar render

    const canvas = await html2canvas(scrollContainer);
    scrollContainer.style.height = originalHeight;

    const imgData = canvas.toDataURL('image/png');

    // Comparar con el slide anterior
    if (imgData === previousDataUrl) {
      console.log("Slide repetido. Se asume que no hay más slides.");
      break;
    }
    previousDataUrl = imgData;

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Simular flecha derecha
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, which: 39, bubbles: true,
    }));

    await new Promise(r => setTimeout(r, 2000)); // Esperar cambio
  }

  pdf.save('captura_autodetectada.pdf');
})();
