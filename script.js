const MIN_SPACING = 10;
const PALETTE = ['#f39c12', '#e67e22', '#3498db', '#2980b9', '#95a5a6', '#bdc3c7', '#ecf0f1'];

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

function draw() {
    const W = parseFloat(elements.w.value) || 100;
    const H = parseFloat(elements.h.value) || 100;
    const b = parseFloat(elements.base.value) || 20;
    const th = parseFloat(elements.triH.value) || 20;
    
    const sh = elements.fill.checked ? MIN_SPACING : Math.max(MIN_SPACING, parseFloat(elements.sh.value));
    const sv = elements.fill.checked ? MIN_SPACING : Math.max(MIN_SPACING, parseFloat(elements.sv.value));

    // Update SVG Canvas
    const padding = 80;
    elements.svg.setAttribute('width', W + padding * 2);
    elements.svg.setAttribute('height', H + padding * 2);
    elements.svg.setAttribute('viewBox', `-${padding} -${padding} ${W + padding * 2} ${H + padding * 2}`);
    
    elements.outer.setAttribute('width', W);
    elements.outer.setAttribute('height', H);

    elements.triGroup.innerHTML = '';
    elements.dimGroup.innerHTML = '';

    const rowStep = th + sv;
    const rows = Math.floor((H + sv) / rowStep);
    const colStep = b + sh;
    const cols = Math.floor((W + sh) / colStep);

    const offsetX = (W - ((cols - 1) * colStep + b)) / 2 + b/2;
    const offsetY = (H - ((rows - 1) * rowStep + th)) / 2;

    for (let r = 0; r < rows; r++) {
        const y = offsetY + r * rowStep;
        for (let c = 0; c < cols; c++) {
            const x = offsetX + c * colStep;
            // Draw Up Triangle
            addTrianglePolygon(x, y, b, th, 'up');
            // Draw Down Triangle
            if (c < cols - 1) {
                addTrianglePolygon(x + colStep/2, y, b, th, 'down');
            }
        }
    }

    addTechnicalSpecs(W, H, b, th, sh, sv, rows, cols);
}

// NEW: Creates direct polygons instead of <use> tags
function addTrianglePolygon(x, y, b, th, direction) {
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const points = direction === 'up' 
        ? `${x},${y} ${x - b/2},${y + th} ${x + b/2},${y + th}`
        : `${x - b/2},${y} ${x + b/2},${y} ${x},${y + th}`;
    
    poly.setAttribute('points', points);
    poly.setAttribute('fill', PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    poly.setAttribute('stroke', '#2c3e50');
    poly.setAttribute('stroke-width', '0.5');
    poly.classList.add('design-tri'); // Class for easy selection
    elements.triGroup.appendChild(poly);
}

function addTechnicalSpecs(W, H, b, th, sh, sv, rows, cols) {
    const g = elements.dimGroup;
    const addText = (content, x, y, size = "11px", bold = false) => {
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', x); txt.setAttribute('y', y);
        txt.style.fontFamily = 'monospace'; txt.style.fontSize = size;
        if (bold) txt.style.fontWeight = 'bold';
        txt.textContent = content;
        g.appendChild(txt);
    };

    const labelY = H + 45;
    const valueY = H + 60;
    addText("TECHNICAL SPECIFICATIONS", 0, H + 25, "13px", true);
    addText("CANVAS SIZE", 0, labelY, "10px", true);
    addText(`${W}x${H}mm`, 0, valueY);
    addText("TRIANGLE (B/H)", 150, labelY, "10px", true);
    addText(`${b}x${th}mm`, 150, valueY);
    addText("SPACING (H/V)", 300, labelY, "10px", true);
    addText(`${sh}x${sv}mm`, 300, valueY);
    addText("GRID DENSITY", 450, labelY, "10px", true);
    addText(`${cols} Cols / ${rows} Rows`, 450, valueY);

    const drawDim = (x1, y1, x2, y2, label, tx, ty) => {
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', x1); l.setAttribute('y1', y1);
        l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        l.setAttribute('stroke', '#333');
        l.setAttribute('marker-start', 'url(#arrowhead)');
        l.setAttribute('marker-end', 'url(#arrowhead)');
        g.appendChild(l);
        addText(label, tx, ty, "10px", true);
    };
    drawDim(0, -25, W, -25, `${W}mm`, W/2 - 15, -30); 
    drawDim(-30, 0, -30, H, `${H}mm`, -75, H/2);     
}

async function exportToPdf() {
    const { jsPDF } = window.jspdf;
    const captureArea = document.getElementById('capture-area');
    const triangles = document.querySelectorAll('.design-tri');

    const W = parseFloat(elements.w.value) || 100;
    const H = parseFloat(elements.h.value) || 100;

    try {
        // 1. FORCE HOLLOW: Remove all fills directly
        triangles.forEach(tri => {
            tri.style.fill = 'none';
            tri.setAttribute('fill', 'none');
            tri.setAttribute('stroke', '#000000');
        });

        // 2. WAIT: Give the browser plenty of time to re-render
        await new Promise(resolve => setTimeout(resolve, 300)); 

        // 3. CAPTURE
        const canvas = await html2canvas(captureArea, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // 4. GENERATE PDF
        const doc = new jsPDF({
            orientation: W > H ? 'l' : 'p',
            unit: 'mm',
            format: [W + 160, H + 160]
        });

        doc.addImage(imgData, 'PNG', 0, 0, W + 160, H + 160);
        doc.save(`Technical_Drawing_${W}x${H}mm.pdf`);

        // We leave the app hollow so the user sees it worked. 
        // Moving any slider will trigger draw() and bring colors back.

    } catch (error) {
        console.error("Export Error:", error);
        alert("Export failed. See console.");
    }
}

// Listeners
[elements.w, elements.h, elements.base, elements.triH, elements.sh, elements.sv].forEach(el => {
    el.addEventListener('input', draw);
});

elements.fill.addEventListener('change', (e) => {
    elements.sh.disabled = e.target.checked;
    elements.sv.disabled = e.target.checked;
    draw();
});

document.getElementById('exportPdf').addEventListener('click', exportToPdf);

draw();
