'use strict';

/* ═══════════════════════════════════════════════════════════════
   pdf.js — html2pdf.js wrapper for A4 PDF export
═══════════════════════════════════════════════════════════════ */

const PDF = {

  export(player) {
    if (typeof html2pdf === 'undefined') {
      alert('PDF library not loaded. Please check your internet connection and refresh.');
      return;
    }

    // Build a fresh card element at full A4 size
    const cardEl = buildCard(player);

    // Remove any scale transform from preview and ensure full size
    cardEl.style.transform = 'none';
    cardEl.style.position = 'fixed';
    cardEl.style.left   = '-9999px';
    cardEl.style.top    = '0';
    cardEl.style.width  = '794px';
    cardEl.style.height = '1123px';
    document.body.appendChild(cardEl);

    const lastName  = (player.lastName  || 'Player').toUpperCase().replace(/\s+/g, '_');
    const firstName = (player.firstName || '').toUpperCase().replace(/\s+/g, '_');
    const filename  = `${lastName}_${firstName}_ITP_Card.pdf`;

    const opt = {
      margin:   0,
      filename,
      image:    { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale:    2,
        useCORS:  true,
        logging:  false,
        width:    794,
        height:   1123,
        windowWidth:  794,
        windowHeight: 1123
      },
      jsPDF: {
        unit:        'mm',
        format:      'a4',
        orientation: 'portrait'
      }
    };

    // Show loading state
    const exportBtns = document.querySelectorAll('#btn-export-pdf, #btn-preview-export');
    exportBtns.forEach(b => { b.disabled = true; b.textContent = 'Exporting…'; });

    html2pdf()
      .set(opt)
      .from(cardEl)
      .save()
      .then(() => {
        document.body.removeChild(cardEl);
        exportBtns.forEach(b => { b.disabled = false; b.textContent = 'Export PDF'; });
      })
      .catch(err => {
        console.error('PDF export failed:', err);
        if (document.body.contains(cardEl)) document.body.removeChild(cardEl);
        exportBtns.forEach(b => { b.disabled = false; b.textContent = 'Export PDF'; });
        alert('PDF export failed. Try in Chrome for best results.');
      });
  }

};
