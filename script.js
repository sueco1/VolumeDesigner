const { jsPDF } = window.jspdf;

// Configuration Constants
const MIN_SPACING = 10;
const PALETTE = ['#f39c12', '#e67e22', '#3498db', '#2980b9', '#95a5a6', '#bdc3c7', '#ecf0f1'];

// DOM Elements
const elements = {
    w: document.getElementById('rectWidth'),
    h: document.getElementById('rectHeight'),
    base: document.getElementById('triBase'),
    triH: document.getElementById('triHeight'),
    fill: document.getElementById('fillMode'),
    sh: document.getElementById('spacingHoriz'),
    sv: document.getElementById('spacingVert'),
    svg: document.getElementById('main-svg'),
    triGroup: document.getElementById('triangleContainer'),
    dimGroup: document.getElementById('dimensions-group'),
    outer: document.getElementById('outerRect')
};

// Event Listeners
[elements.w, elements.h, elements.base, elements.triH, elements.sh, elements.sv].forEach(el => {
    el.addEventListener('input', draw);
});

elements.fill.addEventListener('change', (e) => {
    elements.sh.disabled = e.target.checked;
    elements.sv.disabled = e.target.checked;
    draw();
});

document.getElementById('exportPdf').addEventListener('click', exportToPdf);

function draw() {
    const W = parseFloat(elements.w.value) || 100;
    const H = parseFloat(elements.h.value) || 100;
    const b = parseFloat(elements.base.value) || 20;
    const th = parseFloat(elements.triH.value) || 20;
    
    const sh = elements.fill.checked ? MIN_SPACING : Math.max(MIN_SPACING, parseFloat(elements.sh.value));
    const sv = elements.fill.checked ? MIN_SPACING : Math.max(MIN_SPACING, parseFloat(elements.sv.value));

    // Update Definitions
    document.getElementById('triUp').setAttribute('points', `0,0 ${-b/2},${th} ${b/2},${th}`);
    document.getElementById('triDown').setAttribute('points', `${-b/2},0 ${b/2},0 0,${th}`);

    // Update SVG Canvas
    const margin = 60;
    elements.svg.setAttribute('viewBox', `-${margin} -${margin} ${W + margin*2} ${H + margin*2}`);
    elements.outer.setAttribute('width', W);
    elements.outer.setAttribute('height', H);

    elements.triGroup.innerHTML = '';
    elements.dimGroup.innerHTML = '';

    // Layout Logic
    const rowStep = th + sv;
    const rows = Math.floor((H + sv) / rowStep);
    const colStep = b + sh;
    const cols = Math.floor((W + sh) / colStep);

    // Centering offsets
    const offsetX = (W - ((cols - 1) * colStep + b)) / 2 + b/2;
    const offsetY = (H - ((rows - 1) * rowStep + th)) / 2;

    for (let r = 0; r < rows; r++) {
        const y = offsetY + r * rowStep;
        for (let c = 0; c < cols; c++) {
            const x = offsetX + c * colStep;
            addTriangle('triUp', x, y);
            
            // Interlocking "Down" triangles
            if (c < cols - 1) {
                addTriangle('triDown', x + colStep/2, y);
            }
        }
    }

    addDimensions(W, H, b, th);
}

function addTriangle(type, x, y) {
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${type}`);
    use.setAttribute('x', x);
    use.setAttribute('y', y);
    use.setAttribute('fill', PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    use.setAttribute('stroke', '#2c3e50');
    use.setAttribute('stroke-width', '0.5');
    elements.triGroup.appendChild(use);
}

function addDimensions(W, H, b, th) {
    // Basic helper to draw dimension lines
    const drawDim = (x1, y1, x2, y2, label, offX, offY) => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1); line.setAttribute('y1', y1);
        line.setAttribute('x2', x2); line.setAttribute('y2', y2);
        line.setAttribute('class', 'dim-line');
        line.setAttribute('marker-start', 'url(#arrowhead)');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', (x1 + x2) / 2 + offX);
        txt.setAttribute('y', (y1 + y2) / 2 + offY);
        txt.setAttribute('class', 'dim-text');
        txt.setAttribute('text-anchor', 'middle');
        txt.textContent = label + "mm";
        
        g.appendChild(line); g.appendChild(txt);
        elements.dimGroup.appendChild(g);
    };

    drawDim(0, -20, W, -20, W, 0, -5); // Width
    drawDim(-20, 0, -20, H, H, -15, 5); // Height
}

async function exportToPdf() {
    // 1. Explicitly grab the classes from the global window object
    const { jsPDF } = window.jspdf;
    const svg2pdf = window.svg2pdf;

    const W = parseFloat(elements.w.value) || 100;
    const H = parseFloat(elements.h.value) || 100;
    const margin = 60; 
    
    const doc = new jsPDF({
        orientation: W > H ? 'l' : 'p',
        unit: 'mm',
        format: [W + margin * 2, H + margin * 2]
    });

    const svgElement = document.getElementById('main-svg');

    try {
        // 2. We use the svg2pdf function directly on the doc
        await doc.svg(svgElement, {
            x: 0,
            y: 0,
            width: W + margin * 2,
            height: H + margin * 2
        });

        doc.save(`Triangle_Design_${W}x${H}mm.pdf`);
    } catch (error) {
        // This will print the actual technical reason in your browser console (F12)
        console.error("Technical Error Details:", error);
        alert("Export failed. Open the browser console (F12) to see the full error log.");
    }
}

// Initialize
draw();
