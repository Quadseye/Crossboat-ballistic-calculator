// C:\Users\quads\OneDrive\Documents\AI-projects\crossbow-reticle-visualization\main.js
import { CrossbowReticle } from './components/CrossbowReticle.js';

const { createRoot } = ReactDOM;

// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
        const root = createRoot(rootElement); // Create a root.
        root.render(React.createElement(CrossbowReticle)); // Initial render
    } else {
        console.error('Root element not found');
    }
});
