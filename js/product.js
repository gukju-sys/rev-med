const dialog = document.querySelector('#product-dialog');
const products = {
  prp: { title: 'PRP UNI', description: '혈액 샘플에서 혈장과 혈소판을 분리·추출하는 혈액 처리용 기구입니다.', spec: '용량 · 10 mL / 20 mL / 30 mL' },
  mover: { title: 'CELL MOVER', description: '키트를 고정하고, 회전 손잡이로 버피코트층의 위치를 조절합니다. 본 제품은 의료기기가 아닙니다.', spec: '모델명 · RM-271' }
};
document.querySelectorAll('[data-product]').forEach(button => button.addEventListener('click', () => {
  const product = products[button.dataset.product];
  document.querySelector('#dialog-title').textContent = product.title;
  document.querySelector('#dialog-description').textContent = product.description;
  document.querySelector('#dialog-spec').textContent = product.spec;
  dialog.showModal();
}));
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
const sections = document.querySelectorAll('.product');
const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) document.querySelectorAll('.header nav a').forEach(link => link.classList.toggle('active', link.hash === '#' + entry.target.id)); }); }, { rootMargin: '-15% 0px -55% 0px' });
sections.forEach(section => observer.observe(section));
