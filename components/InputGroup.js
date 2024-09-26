// C:\Users\quads\OneDrive\Documents\AI-projects\crossbow-reticle-visualization\components\InputGroup.js
export function InputGroup({ label, value, onChange, min, max, step }) {
    const { createElement: e } = React;

    return e('div', { className: 'input-group' }, [
        e('label', { htmlFor: label }, label),
        e('input', {
            type: 'range',
            id: label,
            min: min,
            max: max,
            step: step,
            value: value,
            onChange: (event) => onChange(Number(event.target.value))
        }),
        e('input', {
            type: 'number',
            id: `${label}-number`,
            min: min,
            max: max,
            step: step,
            value: value,
            onChange: (event) => onChange(Number(event.target.value))
        })
    ]);
}
