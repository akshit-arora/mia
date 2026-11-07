// Debug-only demo of the plug-in interface (loaded when the URL has ?demo). It is NOT the real Stage 2 games.
// Tap the big picture and the animal on the door's shelf is earned and revealed: proves registerGame -> start -> reveal -> exit.
import { registerGame } from '../app/registry';
import { shelfCards } from '../cards/data';

const pickIndex: Record<string, number> = { jungle: 0, farm: 0, house: 0 };

for (const shelf of ['jungle', 'farm', 'house'] as const) {
  registerGame({
    id: 'demo-' + shelf,
    shelf,
    start(container, api) {
      api.exitButton();
      const cards = shelfCards(shelf);
      api.stage.draw = (g) => { g.drawImage(api.kit.scene(shelf), 0, 0); };
      api.stage.invalidate();
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'hot'; b.setAttribute('aria-label', api.t('home.' + shelf));
      api.stage.onResize = () => {};
      Object.assign(b.style, { left: '50%', top: '55%', width: '30%', height: '40%' });
      b.addEventListener('click', () => {
        if (api.isRevealing()) return;
        const id = cards[pickIndex[shelf] % cards.length].id;
        pickIndex[shelf]++;
        void api.reveal(id);
      });
      container.appendChild(b);
    },
  });
}
