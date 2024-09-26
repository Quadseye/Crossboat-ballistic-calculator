// C:\Users\quads\OneDrive\Documents\AI-projects\crossbow-reticle-visualization\components\CrossbowReticle.js
import { InputGroup } from './InputGroup.js';

export function CrossbowReticle() {
    const { useState, useCallback, useMemo } = React;
    const { createElement: e } = React;

    // State variables
    const [distance, setDistance] = useState(20); // yards
    const [windSpeed, setWindSpeed] = useState(0); // mph
    const [windDirection, setWindDirection] = useState(0); // degrees
    const [dropAngle, setDropAngle] = useState(0); // degrees
    const [scopeHeight, setScopeHeight] = useState(1.5); // inches
    const [feetPerSecond, setFeetPerSecond] = useState(225); // fps (min 225, max 500)
    const [arrowWeight, setArrowWeight] = useState(350); // grains (min 350, max 800)
    const [cantAngle, setCantAngle] = useState(0); // degrees
    const [magnification, setMagnification] = useState(1.5); // Scope Magnification (1.5x to 5x)

    /**
     * Function to map FPS to Magnification.
     * Ensures magnification stays within 1.5x to 5x based on FPS changes.
     * 
     * @param {number} fps - Feet Per Second value.
     * @returns {number} - Corresponding Magnification value.
     */
    const fpsToMagnification = useCallback((fps) => {
        // Linear mapping from FPS to Magnification
        const mag = 1.5 + ((fps - 225) / 275) * 3.5;
        // Clamp the value between 1.5 and 5
        return Math.min(Math.max(mag, 1.5), 5).toFixed(1);
    }, []);

    /**
     * Handler for Magnification changes.
     * Updates magnification independently.
     */
    const handleMagnificationChange = useCallback((newMag) => {
        // Clamp magnification between 1.5 and 5
        const clampedMag = Math.min(Math.max(newMag, 1.5), 5);
        setMagnification(parseFloat(clampedMag.toFixed(1)));
    }, []);

    /**
     * Handler for Feet Per Second changes.
     * Updates feetPerSecond and automatically adjusts magnification based on FPS.
     */
    const handleFeetPerSecondChange = useCallback((newFPS) => {
        // Clamp fps between 225 and 500
        const clampedFPS = Math.min(Math.max(newFPS, 225), 500);
        setFeetPerSecond(clampedFPS);

        // Compute magnification based on FPS
        const computedMag = parseFloat(fpsToMagnification(clampedFPS));
        setMagnification(computedMag);
    }, [fpsToMagnification]);

    /**
     * Handler for Arrow Weight changes.
     * Updates arrowWeight independently without affecting magnification or FPS.
     */
    const handleArrowWeightChange = useCallback((newAW) => {
        // Clamp arrow weight between 350 and 800
        const clampedAW = Math.min(Math.max(newAW, 350), 800);
        setArrowWeight(clampedAW);
    }, []);

    /**
     * Calculates the trajectory of the arrow based on the provided parameters.
     * @param {number} distYards - Distance in yards.
     * @returns {object} - Contains drop and windage in inches.
     */
    const calculateTrajectory = useCallback((distYards) => {
        const g = 9.81; // gravity in m/s^2
        const v0 = feetPerSecond * 0.3048; // Convert fps to m/s
        const angleRad = dropAngle * Math.PI / 180; // Convert angle to radians
        const mass = arrowWeight * 0.00006479891; // Convert grains to kg (1 grain = 0.00006479891 kg)
        const scopeHeightM = scopeHeight * 0.0254; // Convert inches to meters

        const distMeters = distYards * 0.9144; // Convert yards to meters
        const time = distMeters / (v0 * Math.cos(angleRad)); // Time to reach distance

        const verticalDisplacement = v0 * Math.sin(angleRad) * time - 0.5 * g * Math.pow(time, 2); // Vertical displacement in meters

        // Adjust for scope height
        const totalDrop = verticalDisplacement - scopeHeightM; // meters

        // Convert drop to inches
        const dropInInches = totalDrop * 39.3701; // meters to inches

        // Adjust drop based on arrow weight
        const baseWeight = 400; // grains (used for weightFactor calculation)
        const weightFactor = baseWeight / arrowWeight;
        const adjustedDrop = dropInInches * weightFactor;

        // Windage calculation
        const windSpeedMS = windSpeed * 0.44704; // Convert mph to m/s
        const windageMeters = windSpeedMS * time * Math.cos(windDirection * Math.PI / 180); // meters
        const windageInInches = windageMeters * 39.3701; // meters to inches
        const adjustedWindage = windageInInches * weightFactor;

        return { drop: adjustedDrop, windage: adjustedWindage };
    }, [feetPerSecond, dropAngle, arrowWeight, scopeHeight, windSpeed, windDirection]);

    // Calculate zero drop at 20 yards
    const zeroDrop = useMemo(() => calculateTrajectory(20).drop, [calculateTrajectory]);

    /**
     * Readout: how many real inches per SVG inch
     * Updated to reflect scope's magnification.
     */
    const magnificationReadout = useMemo(() => {
        return `${magnification.toFixed(1)}x`;
    }, [magnification]);

    /**
     * Creates hash marks for distances from 30 to 100 yards every 10 yards.
     * Each hash mark is positioned downward from the zero point.
     */
    const hashMarks = useMemo(() => {
        const marks = [];
        const svgWidth = 400; // Updated to match reduced SVG size
        const svgHeight = 400;
        const centerX = svgWidth / 2;
        const centerY = svgHeight / 2;

        for(let d = 30; d <= 100; d += 10) {
            const { drop } = calculateTrajectory(d);
            let relativeDrop = zeroDrop - drop; // Positive means drop beyond zero

            relativeDrop = Math.max(relativeDrop, 0);
            const scaledDrop = relativeDrop * magnification * (svgHeight / 500); // Adjust scaling based on new SVG size

            marks.push(
                e('line', {
                    key: `hash-${d}`,
                    x1: centerX - 8, // Reduced length
                    y1: centerY + scaledDrop,
                    x2: centerX + 8,
                    y2: centerY + scaledDrop,
                    stroke: 'black',
                    strokeWidth: 1
                })
            );
            marks.push(
                e('text', {
                    key: `hash-text-${d}`,
                    x: centerX + 12, // Adjusted position
                    y: centerY + scaledDrop + 3,
                    className: 'reticle-text',
                    textAnchor: 'start',
                    alignmentBaseline: 'middle'
                }, `${d} yd`)
            );
        }
        return marks;
    }, [calculateTrajectory, magnification, zeroDrop]);

    // Current selected distance drop and windage
    const { drop: currentDrop, windage: currentWindage } = useMemo(() => calculateTrajectory(distance), [calculateTrajectory, distance]);

    const scaledDrop = zeroDrop - currentDrop;
    const finalDrop = Math.max(scaledDrop * magnification * (400 / 500), 0); // Adjusted scaling
    const scaledWindage = currentWindage * magnification * (400 / 500); // Adjusted scaling

    // Wind direction label
    const getWindDirectionLabel = () => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(windDirection / 45) % 8;
        return directions[index];
    };

    /**
     * Dynamically calculates distance drops based on current state.
     */
    const distanceDrops = useMemo(() => {
        const drops = [];
        for(let d = 10; d <= 100; d += 10) {
            const { drop } = calculateTrajectory(d);
            const relativeDrop = drop - zeroDrop;
            drops.push({ yards: d, inches: relativeDrop });
        }
        return drops;
    }, [calculateTrajectory, zeroDrop]);

    /**
     * Function to render each distance drop.
     * Now uses the dynamically calculated distanceDrops.
     */
    function renderDistanceDrops() {
        return e('div', { className: 'distance-grid' }, distanceDrops.map(drop => 
            e('div', { key: drop.yards, className: 'distance-grid-item' }, `${drop.yards} yd: ${drop.inches.toFixed(2)} in`)
        ));
    }

    /**
     * Function to render the readouts above the reticle.
     */
    function renderReadouts() {
        return e('div', { className: 'readouts' }, [
            e('div', { className: 'readout-item', key: 'drop' }, `Drop: ${(currentDrop - zeroDrop).toFixed(2)} in`),
            e('div', { className: 'readout-item', key: 'windage' }, `Windage: ${currentWindage.toFixed(2)} in`),
            e('div', { className: 'readout-item', key: 'wind' }, `Wind: ${windSpeed} mph ${getWindDirectionLabel()}`),
            e('div', { className: 'readout-item', key: 'cantAngle' }, `Cant Angle: ${cantAngle}°`)
            // Removed 'cantIndicator' readout
        ]);
    }

    return e('div', null, [
        // Header
        e('h1', { className: 'header', key: 'header' }, 'Crossbow Reticle Visualization with 20-Yard Zero'),
        
        // Magnification Readout
        e('div', { className: 'magnification-readout', key: 'magnification-readout' }, `Scope Magnification: ${magnificationReadout}`),
        
        // Controls
        e('div', { className: 'controls', key: 'controls' }, [
            e(InputGroup, { 
                key: 'magnification', 
                label: 'Magnification (x)', 
                value: magnification, 
                onChange: handleMagnificationChange, 
                min: 1.5, 
                max: 5, 
                step: 0.1 
            }),
            e(InputGroup, { 
                key: 'distance', 
                label: 'Distance (yd)', 
                value: distance, 
                onChange: setDistance, 
                min: 20, 
                max: 100, 
                step: 1 
            }),
            e(InputGroup, { 
                key: 'windSpeed', 
                label: 'Wind Speed (mph)', 
                value: windSpeed, 
                onChange: setWindSpeed, 
                min: 0, 
                max: 30, 
                step: 1 
            }),
            e(InputGroup, { 
                key: 'windDirection', 
                label: 'Wind Direction (°)', 
                value: windDirection, 
                onChange: setWindDirection, 
                min: 0, 
                max: 359, 
                step: 1 
            }),
            e(InputGroup, { 
                key: 'dropAngle', 
                label: 'Drop Angle (°)', 
                value: dropAngle, 
                onChange: setDropAngle, 
                min: -5, 
                max: 5, 
                step: 0.1 
            }),
            e(InputGroup, { 
                key: 'scopeHeight', 
                label: 'Scope Height (in)', 
                value: scopeHeight, 
                onChange: setScopeHeight, 
                min: 0, 
                max: 5, 
                step: 0.1 
            }),
            e(InputGroup, { 
                key: 'feetPerSecond', 
                label: 'Speed (ft/s)', 
                value: feetPerSecond, 
                onChange: handleFeetPerSecondChange, 
                min: 225, 
                max: 500, 
                step: 1 
            }),
            e(InputGroup, { 
                key: 'arrowWeight', 
                label: 'Arrow Weight (gr)', 
                value: arrowWeight, 
                onChange: handleArrowWeightChange, 
                min: 350, 
                max: 800, 
                step: 1 
            }),
            e(InputGroup, { 
                key: 'cantAngle', 
                label: 'Cant Angle (°)', 
                value: cantAngle, 
                onChange: setCantAngle, 
                min: -45, 
                max: 45, 
                step: 1 
            })
        ]),

        // Distance Drop Table
        e('div', { className: 'distance-drops-container', key: 'distance-drops-container' }, [
            e('h2', null, 'Distance Drop Table'),
            renderDistanceDrops()
        ]),

        // Readouts Above Reticle
        renderReadouts(),

        // Visualization
        e('div', { className: 'visualization', key: 'visualization' }, [
            e('svg', { width: '100%', height: '100%', viewBox: '0 0 400 400' }, [ // Updated viewBox
                e('circle', {cx: 200, cy: 200, r: 195, fill: 'none', stroke: 'black', strokeWidth: 2}), // Adjusted for smaller SVG
                e('line', {x1: 0, y1: 200, x2: 400, y2: 200, stroke: 'black', strokeWidth: 1}),
                e('line', {x1: 200, y1: 0, x2: 200, y2: 400, stroke: 'black', strokeWidth: 1}),
                e('circle', {cx: 200, cy: 200, r: 96, fill: 'none', stroke: 'black', strokeWidth: 1}),
                e('circle', {cx: 200, cy: 200, r: 48, fill: 'none', stroke: 'black', strokeWidth: 1}),
                // Removed red Cant Indicator lines
                ...hashMarks,
                e('circle', {cx: 200 + scaledWindage, cy: 200 + finalDrop, r: 3, fill: 'red'}), // Reduced radius
                e('line', {
                    x1: 200,
                    y1: 200,
                    x2: 200 + 48 * Math.sin(windDirection * Math.PI / 180),
                    y2: 200 - 48 * Math.cos(windDirection * Math.PI / 180),
                    stroke: 'green',
                    strokeWidth: 2,
                    markerEnd: 'url(#arrowhead)'
                }),
                e('line', {
                    x1: 200,
                    y1: 200,
                    x2: 200 + 48 * Math.cos(cantAngle * Math.PI / 180),
                    y2: 200 + 48 * Math.sin(cantAngle * Math.PI / 180),
                    stroke: 'blue',
                    strokeWidth: 2,
                    markerEnd: 'url(#arrowhead-cant)'
                }),
                e('defs', null, [
                    e('marker', {
                        id: 'arrowhead',
                        markerWidth: 8, // Reduced size
                        markerHeight: 5,
                        refX: 0,
                        refY: 2.5,
                        orient: 'auto'
                    },
                    e('polygon', {
                        points: '0 0, 8 2.5, 0 5',
                        fill: 'green'
                    })
                    ),
                    e('marker', {
                        id: 'arrowhead-cant',
                        markerWidth: 8, // Reduced size
                        markerHeight: 5,
                        refX: 0,
                        refY: 2.5,
                        orient: 'auto'
                    },
                    e('polygon', {
                        points: '0 0, 8 2.5, 0 5',
                        fill: 'blue'
                    })
                    )
                ])
                // Removed SVG text readouts
            ])
        ])
    ]);
}
