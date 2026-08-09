/** Passive DOM inspector: hover an element, then press C. */
let hoveredElement: Element | null = null;

function isVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.visibility !== 'collapse' &&
    Number(style.opacity) !== 0
  );
}

function domPath(element: Element): string {
  const parts: string[] = [];

  for (let current: Element | null = element; current; current = current.parentElement) {
    const siblings = current.parentElement
      ? [...current.parentElement.children].filter((child) => child.tagName === current.tagName)
      : [];
    const position = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(current) + 1})` : '';
    parts.unshift(`${current.tagName.toLowerCase()}${position}`);
  }

  return parts.join(' > ');
}

window.addEventListener('mousemove', (event) => {
  hoveredElement = event.target instanceof Element ? event.target : null;
});

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() !== 'c' || !hoveredElement || !isVisible(hoveredElement)) return;

  const innerText = hoveredElement instanceof HTMLElement ? hoveredElement.innerText : hoveredElement.textContent ?? '';

  console.log(
    '----------------------------------\n' +
      `TAG: ${hoveredElement.tagName.toLowerCase()}\n` +
      `CLASS: ${hoveredElement.getAttribute('class') || '(none)'}\n` +
      `TEXT CONTENT: ${hoveredElement.textContent ?? ''}\n` +
      `INNER TEXT: ${innerText}\n` +
      `OUTER HTML: ${hoveredElement.outerHTML.slice(0, 500)}\n` +
      `DOM PATH: ${domPath(hoveredElement)}\n` +
      '----------------------------------'
  );
});
