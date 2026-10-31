// Before:
//   import Vivus from 'vivus';
import Vivus from 'svg-scroll-draw/vivus'; // the only change

const logo = new Vivus('logo', { type: 'oneByOne', duration: 160, animTimingFunction: Vivus.EASE, start: 'autostart' });
new Vivus('chart', { type: 'delayed', duration: 120 });

document.getElementById('replay').addEventListener('click', () => logo.reset().play());
