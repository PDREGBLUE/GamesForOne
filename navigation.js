function navigate() {
  const route = location.hash.slice(1);
  const screen = route === 'five-letters' ? 'five-screen' : route === 'common-thread' ? 'thread-screen' : route === 'word-trails' ? 'trails-screen' : route === 'midi' ? 'midi-screen' : 'home-screen';
  for (const id of ['home-screen', 'five-screen', 'thread-screen', 'trails-screen', 'midi-screen']) document.getElementById(id).hidden = id !== screen;
  document.body.dataset.screen = screen;
  document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  document.title = `${screen === 'five-screen' ? 'Five Letters · ' : screen === 'thread-screen' ? 'Common Thread · ' : screen === 'trails-screen' ? 'Word Trails · ' : screen === 'midi-screen' ? 'Midi · ' : ''}Games for One`;
  const heading = document.querySelector(`#${screen} h1`);
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', navigate);
navigate();
// Route immediately on a menu tap so rapid typing cannot reach the old screen.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.pushState(null, '', link.getAttribute('href'));
  navigate();
});
window.addEventListener('popstate', navigate);
