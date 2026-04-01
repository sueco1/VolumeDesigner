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
    g.innerHTML = ''; 

    // Create a sub-group for the text table so we can hide it easily
    const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    textGroup.setAttribute('id', 'specs-text-table');
    g.appendChild(textGroup);

    const addText = (content, x, y, size = "11px", bold = false) => {
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', x); 
        txt.setAttribute('y', y);
        txt.style.fontFamily = 'monospace'; 
        txt.style.fontSize = size;
        if (bold) txt.style.fontWeight = 'bold';
        txt.textContent = content;
        textGroup.appendChild(txt); // Add to the sub-group
    };

    // ... (Keep all your existing addText calls for Canvas, Triangle, Spacing, etc.) ...
    const labelY = H + 45;
    const valueY = H + 60;
    const totalTriangles = (cols * rows) + ((cols - 1) * rows);

    addText("TECHNICAL SPECIFICATIONS", 0, H + 25, "13px", true);
    addText("CANVAS SIZE", 0, labelY, "10px", true);
    addText(`${W}x${H}mm`, 0, valueY);
    addText("TRIANGLE (B/H)", 140, labelY, "10px", true);
    addText(`${b}x${th}mm`, 140, valueY);
    addText("SPACING (H/V)", 280, labelY, "10px", true);
    addText(`${sh}x${sv}mm`, 280, valueY);
    addText("GRID / TOTAL COUNT", 420, labelY, "10px", true);
    addText(`${cols}x${rows} / ${totalTriangles} Units`, 420, valueY);

    // Dimension Lines (These stay in the main g group, not the textGroup)
    const drawDim = (x1, y1, x2, y2, label, tx, ty) => {
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', x1); l.setAttribute('y1', y1);
        l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        l.setAttribute('stroke', '#333');
        l.setAttribute('stroke-width', '1.5'); // Make them slightly thicker to be seen
        l.setAttribute('marker-start', 'url(#arrowhead)');
        l.setAttribute('marker-end', 'url(#arrowhead)');
        g.appendChild(l);
        
        // Add label for the arrow
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', tx); 
        txt.setAttribute('y', ty);
        txt.style.fontSize = "12px";
        txt.style.fontWeight = "bold";
        txt.textContent = label;
        g.appendChild(txt);
    };

    drawDim(0, -25, W, -25, `${W}mm`, W/2 - 15, -35); 
    drawDim(-35, 0, -35, H, `${H}mm`, -75, H/2);     
}

async function exportToPdf() {
    const { jsPDF } = window.jspdf;
    const triangles = document.querySelectorAll('.design-tri');
    
    // Get actual dimensions
    const W = parseFloat(elements.w.value) || 100;
    const H = parseFloat(elements.h.value) || 100;

    // 1. Setup A3 PDF (420x297mm)
    const pdfW = 420;
    const pdfH = 297;
    const doc = new jsPDF('l', 'mm', [pdfW, pdfH]);

    // 2. Calculate "Zoom" (Scale to fit A3 Safe Zone)
    const margin = 20;
    const footerH = 40;
    const availW = pdfW - (margin * 2);
    const availH = pdfH - (margin * 2) - footerH;

    // This ratio determines how much we "zoom" the drawing to fill the A3 sheet
    const scale = Math.min(availW / W, availH / H);
    
    const finalW = W * scale;
    const finalH = H * scale;
    const xOff = (pdfW - finalW) / 2;
    const yOff = margin + (availH - finalH) / 2;

    // 3. Draw Background Rect (Hollow)
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.rect(xOff, yOff, finalW, finalH);

    // 4. Draw Triangles directly as Vectors (No Black Boxes!)
    doc.setLineWidth(0.1);
    triangles.forEach(tri => {
        const pointsStr = tri.getAttribute('points');
        if (!pointsStr) return;

        // Convert SVG coordinates to PDF coordinates
        const coords = pointsStr.split(' ').map(p => {
            const [x, y] = p.split(',').map(Number);
            return {
                x: xOff + (x * scale),
                y: yOff + (y * scale)
            };
        });

        // Draw the triangle outline in the PDF
        doc.line(coords[0].x, coords[0].y, coords[1].x, coords[1].y);
        doc.line(coords[1].x, coords[1].y, coords[2].x, coords[2].y);
        doc.line(coords[2].x, coords[2].y, coords[0].x, coords[0].y);
    });

    // 5. Draw Technical Footer (Fixed size, high legibility)
    const tableY = pdfH - 25;
    doc.setDrawColor(180);
    doc.line(margin, tableY - 10, pdfW - margin, tableY - 10); 

    doc.setFont("courier", "bold");
    doc.setFontSize(14);
    doc.text("TECHNICAL SPECIFICATIONS", margin, tableY);

    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    
    const b = elements.base.value;
    const th = elements.triH.value;
    const sh = elements.fill.checked ? 10 : elements.sh.value;
    const sv = elements.fill.checked ? 10 : elements.sv.value;
    const total = triangles.length;

    doc.text(`CANVAS: ${W}x${H}mm`, margin, tableY + 8);
    doc.text(`TRIANGLE: ${b}x${th}mm`, margin + 90, tableY + 8);
    doc.text(`SPACING: ${sh}x${sv}mm`, margin + 185, tableY + 8);
    doc.text(`TOTAL UNITS: ${total}`, margin + 280, tableY + 8);

    doc.save(`Blueprints_${W}x${H}mm.pdf`);
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
