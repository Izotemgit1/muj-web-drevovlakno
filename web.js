'use strict';
const products = window.PRODUCTS;
const form = document.querySelector('#inquiry-form');
const productSelect = document.querySelector('#product');
const thicknessSelect = document.querySelector('#thickness');
const useSelect = document.querySelector('#use');
const status = document.querySelector('#form-status');
const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const text = selector => document.querySelector(selector).value.trim();
for (const p of products) productSelect.add(new Option(p.brand + ' — ' + p.name, p.id));
function updateThickness() {
  thicknessSelect.replaceChildren(new Option('Potřebuji poradit', ''));
  const p = products.find(p => p.id === productSelect.value);
  for (const t of p?.thickness || []) thicknessSelect.add(new Option(t + ' mm', t));
  if (p && !p.thickness.length) thicknessSelect.add(new Option('Nabízené tloušťky: (doplnit)', 'pending'));
}
function renderProducts(filter = 'all') {
  const shown = products.filter(p => filter === 'all' || p.uses.includes(filter));
  document.querySelector('#product-count').textContent = 'Zobrazené výrobky: ' + shown.length;
  document.querySelector('#product-grid').innerHTML = shown.length ? shown.map(p => {
    const price = window.WEB_CONFIG.showPrices && p.price && p.price.amount != null && p.price.unit && p.price.vatLabel ? '<p>' + escapeHtml(p.price.amount + ' Kč / ' + p.price.unit + ' · ' + p.price.vatLabel) + '</p>' : '';
    const doc = p.doc ? '<a class="doc-link" href="dokumenty/' + escapeHtml(p.doc) + '" target="_blank" rel="noopener">' + escapeHtml(p.docLabel) + ' ↗</a>' : p.url ? '<a class="doc-link" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' + escapeHtml(p.docLabel || 'Podklady na stránce výrobce · německy') + ' ↗</a>' : '<p>Technický list: (doplnit)</p>';
    return '<article class="product-card"><div class="product-top"><div><p class="product-brand">' + escapeHtml(p.brand) + '</p><h3>' + escapeHtml(p.name) + '</h3><p class="product-type">' + escapeHtml(p.type) + '</p></div><div class="material-mark" aria-hidden="true"><i></i><i></i></div></div><div class="product-body"><p class="product-description">' + escapeHtml(p.description) + '</p><p class="variant-list"><b>Vybrané tloušťky</b>' + (p.thickness.length ? p.thickness.join(' · ') + ' mm' : '(doplnit)') + '</p>' + (p.note ? '<p class="missing">' + escapeHtml(p.note) + '</p>' : '') + '<details><summary>Rozměry, podklady a podrobnosti</summary><dl class="specs"><div><dt>Rozměr</dt><dd>' + escapeHtml(p.size) + '</dd></div><div><dt>Prodejní jednotka a balení</dt><dd>' + escapeHtml(p.salesUnit) + '</dd></div>' + (p.parameter ? '<div><dt>Tepelná vodivost materiálu</dt><dd>' + escapeHtml(p.parameter) + '</dd></div>' : '') + '<div><dt>Fotografie konkrétního výrobku</dt><dd>(doplnit) · zobrazená značka je pouze ilustrace</dd></div></dl>' + doc + '<p class="source">Zdroj: ' + escapeHtml(p.source) + '</p></details>' + price + '<p class="availability">Dostupnost ověříme při poptávce.</p><a href="#poptavka" class="product-button" data-product="' + p.id + '">Poptat výrobek <span aria-hidden="true">↗</span></a></div></article>';
  }).join('') : '<p>Pro tento výběr nemáme přiřazený výrobek. <button type="button" data-filter="all">Zobrazit všechny výrobky</button> nebo <a href="#poptavka">požádat o radu</a>.</p>';
  for (const b of document.querySelectorAll('.chip')) { const active = b.dataset.filter === filter; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); }
}
document.addEventListener('click', event => {
  const filter = event.target.closest('[data-filter], [data-use]');
  if (filter) renderProducts(filter.dataset.filter || filter.dataset.use);
  const button = event.target.closest('[data-product]');
  if (button) {
    const p = products.find(p => p.id === button.dataset.product);
    productSelect.value = p.id;
    updateThickness();
    useSelect.value = p.uses.length === 1 ? p.uses[0] : '';
    updatePreview();
    productSelect.focus({preventScroll:true});
  }
});
document.querySelector('#advice-link').addEventListener('click', () => { productSelect.value = ''; useSelect.value = ''; updateThickness(); updatePreview(); });
productSelect.addEventListener('change', () => { updateThickness(); updatePreview(); });
document.querySelector('#delivery').addEventListener('change', () => {
  const pickup = text('#delivery') === 'pickup';
  document.querySelector('#place-label').hidden = pickup;
  document.querySelector('#place').disabled = pickup;
  updatePreview();
});
function buildMessage() {
  const p = products.find(p => p.id === productSelect.value);
  const use = useSelect.value ? useSelect.selectedOptions[0].textContent : 'Potřebuji poradit';
  const thickness = thicknessSelect.value === 'pending' ? '(doplnit) — prosím o upřesnění' : thicknessSelect.value ? thicknessSelect.value + ' mm' : 'Potřebuji poradit';
  const delivery = text('#delivery') === 'pickup' ? 'Osobní odběr — Bežerovice 9, Bechyně' : 'Doprava — ' + (text('#place') || 'Místo závozu upřesním');
  const lines = ['Dobrý den,', '', 'mám zájem o nabídku dřevovláknité izolace.', '', 'Výrobek: ' + (p ? p.brand + ' ' + p.name : 'Potřebuji poradit'), 'Použití: ' + use, 'Tloušťka: ' + thickness, 'Množství: ' + (text('#quantity') ? text('#quantity') + ' ' + text('#unit') : 'Upřesním'), 'Převzetí: ' + delivery, 'Kontakt: ' + (text('#contact') || '(doplním)')];
  if (p?.note) lines.push('Poznámka k výrobku: ' + p.note);
  if (text('#message')) lines.push('', 'Moje poznámka:', text('#message'));
  lines.push('', 'Prosím o ověření vhodnosti, dostupnosti a ceny.' );
  if (text('#delivery') !== 'pickup') lines.push('Prosím také o vyčíslení dopravy.');
  lines.push('', 'Děkuji.');
  return lines.join('\n');
}
function updatePreview() { document.querySelector('#email-preview').value = buildMessage(); }
form.addEventListener('input', updatePreview);
form.addEventListener('change', updatePreview);
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!text('#contact')) { status.textContent = 'Doplňte prosím svůj e-mail nebo telefon.'; document.querySelector('#contact').focus(); return; }
  const body = buildMessage();
  const url = 'mailto:izotem@izotem.cz?subject=' + encodeURIComponent('Poptávka dřevovláknité izolace') + '&body=' + encodeURIComponent(body);
  updatePreview();
  if (url.length > 6000) { status.textContent = 'Poptávka je delší. Zkopírujte její text a vložte jej do e-mailu na izotem@izotem.cz.'; document.querySelector('.email-fallback').open = true; return; }
  status.textContent = 'Připraveno k otevření v e-mailovém programu. Zprávu v něm sami odešlete. Pokud se neotevřel, zkopírujte text poptávky.';
  window.location.href = url;
});
async function copy(value, success) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else {
      const field = document.createElement('textarea'); field.value = value; field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field); field.select(); const copied = document.execCommand('copy'); field.remove(); if (!copied) throw new Error('copy failed');
    }
    status.textContent = success;
  } catch {
    document.querySelector('.email-fallback').open = true;
    status.textContent = 'Automatické kopírování se nepodařilo. Text níže označte a zkopírujte ručně. Adresát: izotem@izotem.cz.';
    const preview = document.querySelector('#email-preview'); preview.focus(); preview.select();
  }
}
document.querySelector('#copy-request').addEventListener('click', () => { updatePreview(); copy(buildMessage(), 'Text poptávky je zkopírován. Vložte jej do e-mailu na izotem@izotem.cz a odešlete.'); });
document.querySelector('#copy-address').addEventListener('click', () => copy('izotem@izotem.cz', 'E-mailová adresa je zkopírována.'));
renderProducts(); updatePreview();
