import './propuesta.css';

const printBtn = document.getElementById('printPdfBtn');
if (printBtn) {
  printBtn.addEventListener('click', () => {
    window.print();
  });
}
