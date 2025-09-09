// SCRIPT PARA DESCARGAR PDF (UNA PAGINA CON SCROLL)
// BY TABVO V2.0  

(async () => {

// FRAGMENTO DE BLUR DE CARGA CON SISTEMA DE CANCELACIÓN DEL PROCESO 
  let cancelRequested = false;

  // Detectar tecla Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cancelPDF();
    }
  });

  function cancelPDF() {
    cancelRequested = true;
    const msg = document.getElementById('pdf-message');
    if (msg) msg.textContent = '❌ Cancelado por el usuario';
    const overlay = document.getElementById('pdf-overlay');
    if (overlay) overlay.remove();
  }

  // Crear overlay con spinner
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
      width: 50px;
      height: 50px;
      border: 6px solid #999;
      border-top: 6px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    "></div>
    <div id="pdf-message" style="margin-bottom: 10px;">Generando PDF...</div>
    <button id="cancel-btn" style="
      padding: 8px 16px;
      background: #cc0000;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    ">Cancelar</button>
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

  document.getElementById('cancel-btn').addEventListener('click', cancelPDF);

// FRAGMENTO QUE PERMITE LA INYECCIÓN JS
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
// CARGA DE LIBRERIAS HTML2CANVAS Y JSPDF
  await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

  while (!window.html2canvas || !window.jspdf) {
    await new Promise(r => setTimeout(r, 100));
  }
// FRAGMENTO QUE CREA ELEMENTO PDF VERTICAL, PUNTO, A4
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'pt', 'a4');

  
 //LOOP PARA SLIDES
const maxSlides = 4;
 for (let i = 0; i < maxSlides; i++) {


let headerHeight = 0; //variable global  de largo de encabezado

// FRAGMENTO QUE CAPTURAR EL ENCABEZADO (filtrando hijos) ===
  const header = document.querySelector('.free-position-layout.deselect-all-container-selector');
  if (header) {
    // Clonar el nodo
    const headerClone = header.cloneNode(true);

    // Quitar hijos que cumplan las condiciones
    headerClone.querySelectorAll('*').forEach(el => {
      const isContentType13 = el.getAttribute('data-content-type') === "13";
      const isRuntime = el.classList.contains('se-elimino-selector');
      const isHoverClickable = el.classList.contains('element-hover-clickable');

      if (isContentType13 || isRuntime || isHoverClickable) {
        el.remove();
      }
    });

    // Insertar temporalmente fuera de pantalla para renderizarlo
    headerClone.style.position = 'absolute';
    headerClone.style.top = '-9999px';
    document.body.appendChild(headerClone);

    await new Promise(r => setTimeout(r, 1000));
    const headerCanvas = await html2canvas(headerClone, { scale: 2, useCORS: true });
    document.body.removeChild(headerClone);

    const imgData = headerCanvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (headerCanvas.height * pdfWidth) / headerCanvas.width;
   
    headerHeight = pdfHeight;  // asignamos altura a la variable global 

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  }

// FRAGMENTO CAPTURAR EL CONTENIDO DEL SCROLL (versión corregida)
const scrollContainer = document.querySelector('div[style*="overflow: scroll"]');
if (scrollContainer) {
  const originalHeight = scrollContainer.style.height;
  scrollContainer.style.height = scrollContainer.scrollHeight + 'px';
  await new Promise(r => setTimeout(r, 1500));

  const canvas = await html2canvas(scrollContainer, {
    scale: 2,
    width: scrollContainer.scrollWidth,
    height: scrollContainer.scrollHeight,
    useCORS: true
  });
  scrollContainer.style.height = originalHeight;

  const imgData = canvas.toDataURL('image/png');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // altura total de la imagen en pts PDF
  const pageHeight = pdf.internal.pageSize.getHeight();

  let heightLeft = pdfHeight;
  // aquí respetamos tu offset exacto:
  let position = header ? headerHeight * 0.12 : 0;

  while (heightLeft > 0) {
    if (cancelRequested) return;

    // dibuja la imagen completa, desplazada en "position".
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);

    // avanzamos "una página" en la imagen (movemos la imagen hacia arriba)
    heightLeft -= pageHeight;
    position -= pageHeight; // <- clave: mover imagen hacia arriba para mostrar la siguiente porción

    // sólo añadimos página si queda contenido por mostrar
    if (heightLeft > 0) {
      pdf.addPage();
    }
  }
}
  // Simular flecha derecha
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


//FRAGMENTO QUE GUARDA EL PDF
  if (!cancelRequested) {
    pdf.save('Impresión_tablero.pdf');
    document.getElementById('pdf-message').textContent = '✅ PDF descargado correctamente';
    setTimeout(() => {
      document.getElementById('pdf-overlay')?.remove();
    }, 2500);
  }
})();
