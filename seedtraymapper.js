(() => {
  const CONFIG = {
    grid: {
      defaultRows: 6,
      defaultCols: 12,
      minSize: 1,
      maxSize: 64
    },
    zone: {
      initialLabel: 1,
      initialNextId: 1
    },
    history: {
      maxSteps: 200
    },
    labels: {
      yOffset: 0
    },
    svg: {
      pixelsPerCell: 40,
      labelDy: "0.35em",
      backgroundFill: "#fff",
      gridGroup: {
        stroke: "#888",
        strokeWidth: "0.01",
        vectorEffect: "non-scaling-stroke",
        shapeRendering: "crispEdges"
      },
      zoneBorderGroup: {
        fill: "none",
        stroke: "#000",
        strokeWidth: "0.06",
        vectorEffect: "non-scaling-stroke",
        shapeRendering: "crispEdges"
      },
      labelGroup: {
        fontFamily: "sans-serif",
        fontSize: "0.4",
        fontWeight: "700",
        fill: "#000",
        textAnchor: "middle"
      },
      frameRect: {
        fill: "none",
        stroke: "#000",
        strokeWidth: "0.06",
        vectorEffect: "non-scaling-stroke",
        shapeRendering: "crispEdges"
      }
    },
    messages: {
      selectZoneToFill: "Add/select a zone first to fill blank cells.",
      selectOrAddZoneBeforeFill: "Select or add a zone before filling blank cells.",
      zoneSelectedSuffix: "selected. Drag to toggle cells in a rectangle.",
      undoDone: "Undid last action.",
      redoDone: "Redid last action.",
      svgCopied: "SVG copied to clipboard.",
      svgCopiedFallback: "SVG copied using fallback copy."
    }
  };

  const state = {
    rows: CONFIG.grid.defaultRows,
    cols: CONFIG.grid.defaultCols,
    cells: [],
    zones: [],
    activeZoneId: null,
    isDragging: false,
    dragStart: null,
    dragCurrent: null,
    nextZoneId: CONFIG.zone.initialNextId
  };

  const els = {
    rowsInput: document.getElementById("rowsInput"),
    colsInput: document.getElementById("colsInput"),
    resizeBtn: document.getElementById("resizeBtn"),
    clearGridBtn: document.getElementById("clearGridBtn"),
    resetBtn: document.getElementById("resetBtn"),
    undoBtn: document.getElementById("undoBtn"),
    redoBtn: document.getElementById("redoBtn"),
    addZoneBtn: document.getElementById("addZoneBtn"),
    zonesList: document.getElementById("zonesList"),
    grid: document.getElementById("grid"),
    statusText: document.getElementById("statusText"),
    svgPreview: document.getElementById("svgPreview"),
    svgOutput: document.getElementById("svgOutput"),
    copyBtn: document.getElementById("copyBtn"),
    downloadBtn: document.getElementById("downloadBtn")
  };
  const history = {
    undoStack: [],
    redoStack: []
  };

  function snapshotState() {
    return structuredClone({
      rows: state.rows,
      cols: state.cols,
      cells: state.cells,
      zones: state.zones,
      activeZoneId: state.activeZoneId,
      nextZoneId: state.nextZoneId
    });
  }

  function restoreSnapshot(snapshot) {
    const next = structuredClone(snapshot);
    state.rows = next.rows;
    state.cols = next.cols;
    state.cells = next.cells;
    state.zones = next.zones;
    state.activeZoneId = next.activeZoneId;
    state.nextZoneId = next.nextZoneId;
  }

  function updateHistoryControls() {
    els.undoBtn.disabled = history.undoStack.length === 0;
    els.redoBtn.disabled = history.redoStack.length === 0;
  }

  function pushUndoState() {
    history.undoStack.push(snapshotState());
    if (history.undoStack.length > CONFIG.history.maxSteps) {
      history.undoStack.shift();
    }
    history.redoStack = [];
    updateHistoryControls();
  }

  function commitChange(mutator, options = {}) {
    const {
      recordHistory = true,
      afterChange = renderAll
    } = options;

    if (recordHistory) {
      pushUndoState();
    }

    mutator();

    if (typeof afterChange === "function") {
      afterChange();
    }
    updateHistoryControls();
  }

  function undo() {
    if (!history.undoStack.length) {
      return false;
    }
    history.redoStack.push(snapshotState());
    if (history.redoStack.length > CONFIG.history.maxSteps) {
      history.redoStack.shift();
    }
    const previous = history.undoStack.pop();
    restoreSnapshot(previous);
    renderAll();
    setStatus(CONFIG.messages.undoDone);
    updateHistoryControls();
    return true;
  }

  function redo() {
    if (!history.redoStack.length) {
      return false;
    }
    history.undoStack.push(snapshotState());
    if (history.undoStack.length > CONFIG.history.maxSteps) {
      history.undoStack.shift();
    }
    const next = history.redoStack.pop();
    restoreSnapshot(next);
    renderAll();
    setStatus(CONFIG.messages.redoDone);
    updateHistoryControls();
    return true;
  }

  function createEmptyCells(rows, cols) {
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
  }

  function forEachCell(rows, cols, visitor) {
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        visitor(r, c);
      }
    }
  }

  function forEachStateCell(visitor) {
    forEachCell(state.rows, state.cols, visitor);
  }

  function clampInt(value, min, max, fallback) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  function hslToHex(h, s, l) {
    const sat = s / 100;
    const light = l / 100;
    const c = (1 - Math.abs((2 * light) - 1)) * sat;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0;
    let g = 0;
    let b = 0;

    if (hp >= 0 && hp < 1) {
      r = c;
      g = x;
    } else if (hp < 2) {
      r = x;
      g = c;
    } else if (hp < 3) {
      g = c;
      b = x;
    } else if (hp < 4) {
      g = x;
      b = c;
    } else if (hp < 5) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }

    const m = light - (c / 2);
    const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function autoColor(index) {
    const hue = (index * 137.508) % 360;
    return hslToHex(hue, 62, 70);
  }

  function getNextLabel() {
    let max = 0;
    for (const zone of state.zones) {
      const label = Number.parseInt(zone.label, 10);
      if (!Number.isNaN(label)) {
        max = Math.max(max, label);
      }
    }
    return max + 1;
  }

  function appendZone(label = null) {
    const zone = {
      id: state.nextZoneId++,
      label: label === null ? getNextLabel() : label,
      color: autoColor(state.zones.length)
    };
    state.zones.push(zone);
    state.activeZoneId = zone.id;
    return zone;
  }

  function applyDefaultState() {
    state.rows = CONFIG.grid.defaultRows;
    state.cols = CONFIG.grid.defaultCols;
    state.cells = createEmptyCells(state.rows, state.cols);
    state.zones = [];
    state.activeZoneId = null;
    state.nextZoneId = CONFIG.zone.initialNextId;
    appendZone(CONFIG.zone.initialLabel);
  }

  function resetToDefaultState(shouldRecord = true) {
    commitChange(() => {
      applyDefaultState();
    }, { recordHistory: shouldRecord });
  }

  function addZone(label = null, shouldRecord = true) {
    commitChange(() => {
      appendZone(label);
    }, { recordHistory: shouldRecord });
  }

  function removeZone(zoneId, shouldRecord = true) {
    const hasZone = state.zones.some((zone) => zone.id === zoneId);
    if (!hasZone) {
      return;
    }
    commitChange(() => {
      state.zones = state.zones.filter((zone) => zone.id !== zoneId);

      forEachStateCell((r, c) => {
        if (state.cells[r][c] === zoneId) {
          state.cells[r][c] = null;
        }
      });

      if (!state.zones.some((zone) => zone.id === state.activeZoneId)) {
        state.activeZoneId = state.zones.length ? state.zones[state.zones.length - 1].id : null;
      }
    }, { recordHistory: shouldRecord });
  }

  function resizeGrid(newRows, newCols, shouldRecord = true) {
    if (newRows === state.rows && newCols === state.cols) {
      return;
    }
    commitChange(() => {
      const resized = createEmptyCells(newRows, newCols);
      const rowsToCopy = Math.min(newRows, state.rows);
      const colsToCopy = Math.min(newCols, state.cols);

      forEachCell(rowsToCopy, colsToCopy, (r, c) => {
        resized[r][c] = state.cells[r][c];
      });

      state.rows = newRows;
      state.cols = newCols;
      state.cells = resized;
    }, { recordHistory: shouldRecord });
  }

  function clearGrid(shouldRecord = true) {
    let hasPaintedCell = false;
    forEachStateCell((r, c) => {
      if (state.cells[r][c] !== null) {
        hasPaintedCell = true;
      }
    });
    if (!hasPaintedCell) {
      return;
    }
    commitChange(() => {
      state.cells = createEmptyCells(state.rows, state.cols);
    }, { recordHistory: shouldRecord });
  }

  function syncInputs() {
    els.rowsInput.value = String(state.rows);
    els.colsInput.value = String(state.cols);
  }

  function syncInputBounds() {
    els.rowsInput.min = String(CONFIG.grid.minSize);
    els.rowsInput.max = String(CONFIG.grid.maxSize);
    els.colsInput.min = String(CONFIG.grid.minSize);
    els.colsInput.max = String(CONFIG.grid.maxSize);
  }

  function createZoneItem(zone) {
    const item = document.createElement("div");
    item.className = "zone-item";
    item.classList.toggle("active", state.activeZoneId === zone.id);

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "activeZone";
    radio.checked = state.activeZoneId === zone.id;
    radio.setAttribute("aria-label", `Select zone ${zone.label}`);
    radio.addEventListener("change", () => {
      state.activeZoneId = zone.id;
      renderAll();
    });

    const labelTag = document.createElement("span");
    labelTag.textContent = "Label";

    const labelInput = document.createElement("input");
    labelInput.type = "number";
    labelInput.min = "0";
    labelInput.step = "1";
    labelInput.value = String(zone.label);
    labelInput.setAttribute("aria-label", `Zone ${zone.label} number`);
    labelInput.addEventListener("change", () => {
      const parsed = Number.parseInt(labelInput.value, 10);
      if (!Number.isNaN(parsed) && parsed !== zone.label) {
        commitChange(() => {
          zone.label = parsed;
        }, { afterChange: refreshSvgOnly });
      }
    });

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = zone.color;
    colorInput.setAttribute("aria-label", `Zone ${zone.label} color`);
    colorInput.addEventListener("change", () => {
      if (colorInput.value === zone.color) {
        return;
      }
      commitChange(() => {
        zone.color = colorInput.value;
      }, {
        afterChange: () => {
          refreshGridOnly();
          refreshSvgOnly();
        }
      });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      removeZone(zone.id);
    });

    item.append(
      radio,
      labelTag,
      labelInput,
      colorInput,
      deleteButton
    );

    return item;
  }

  function renderZones() {
    els.zonesList.innerHTML = "";

    if (!state.zones.length) {
      const empty = document.createElement("p");
      empty.className = "help";
      empty.textContent = "No zones yet. Add one, then drag on the grid to toggle cells.";
      els.zonesList.appendChild(empty);
      return;
    }

    for (const zone of state.zones) {
      els.zonesList.appendChild(createZoneItem(zone));
    }
  }

  function getPreviewRect() {
    if (!state.isDragging || !state.dragStart || !state.dragCurrent) {
      return null;
    }
    const minRow = Math.min(state.dragStart.r, state.dragCurrent.r);
    const maxRow = Math.max(state.dragStart.r, state.dragCurrent.r);
    const minCol = Math.min(state.dragStart.c, state.dragCurrent.c);
    const maxCol = Math.max(state.dragStart.c, state.dragCurrent.c);
    return { minRow, maxRow, minCol, maxCol };
  }

  function zoneById(zoneId) {
    return state.zones.find((zone) => zone.id === zoneId) || null;
  }

  function refreshGridOnly() {
    const previewRect = getPreviewRect();
    const zoneMap = new Map(state.zones.map((zone) => [zone.id, zone]));
    els.grid.style.setProperty("--cols", String(state.cols));
    els.grid.innerHTML = "";

    forEachStateCell((r, c) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "grid-cell";
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);

      const zoneId = state.cells[r][c];
      const zone = zoneId !== null ? zoneMap.get(zoneId) || null : null;
      cell.style.background = zone ? zone.color : "#ffffff";
      if (
        previewRect &&
        r >= previewRect.minRow &&
        r <= previewRect.maxRow &&
        c >= previewRect.minCol &&
        c <= previewRect.maxCol
      ) {
        cell.classList.add("preview");
      }

      els.grid.appendChild(cell);
    });
  }

  function escapeXml(text) {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&apos;");
  }

  function formatNumber(value) {
    if (Number.isInteger(value)) {
      return String(value);
    }
    return value.toFixed(2).replace(/\.0+$/, "").replace(/(\.[0-9]*?)0+$/, "$1");
  }

  function createVisitedCells() {
    return createEmptyCells(state.rows, state.cols).map((row) => row.map(() => false));
  }

  function isUnvisitedZoneCell(zoneId, visited, row, col) {
    return !visited[row][col] && state.cells[row][col] === zoneId;
  }

  function measureRectangleWidth(zoneId, visited, row, col) {
    let width = 0;
    while (col + width < state.cols && isUnvisitedZoneCell(zoneId, visited, row, col + width)) {
      width += 1;
    }
    return width;
  }

  function canFillRectangleRow(zoneId, visited, row, col, width) {
    for (let k = col; k < col + width; k += 1) {
      if (!isUnvisitedZoneCell(zoneId, visited, row, k)) {
        return false;
      }
    }
    return true;
  }

  function measureRectangleHeight(zoneId, visited, row, col, width) {
    let height = 1;
    while (row + height < state.rows && canFillRectangleRow(zoneId, visited, row + height, col, width)) {
      height += 1;
    }
    return height;
  }

  function markRectangleVisited(visited, row, col, width, height) {
    for (let rr = row; rr < row + height; rr += 1) {
      for (let cc = col; cc < col + width; cc += 1) {
        visited[rr][cc] = true;
      }
    }
  }

  function collectZoneComponent(zoneId, visited, startRow, startCol) {
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];
    const queue = [[startRow, startCol]];
    const componentCells = [];
    visited[startRow][startCol] = true;
    let head = 0;

    while (head < queue.length) {
      const [row, col] = queue[head++];
      componentCells.push({ row, col });

      for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nr >= state.rows || nc < 0 || nc >= state.cols) {
          continue;
        }
        if (!isUnvisitedZoneCell(zoneId, visited, nr, nc)) {
          continue;
        }
        visited[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }

    return componentCells;
  }

  function getComponentCenter(componentCells) {
    let centerX = 0;
    let centerY = 0;
    for (const cell of componentCells) {
      centerX += cell.col + 0.5;
      centerY += cell.row + 0.5;
    }
    return {
      x: centerX / componentCells.length,
      y: centerY / componentCells.length
    };
  }

  function pickNearestCenterCell(componentCells, center) {
    let bestCell = componentCells[0];
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const cell of componentCells) {
      const dx = (cell.col + 0.5) - center.x;
      const dy = (cell.row + 0.5) - center.y;
      const distance = (dx * dx) + (dy * dy);

      if (
        distance < bestDistance ||
        (distance === bestDistance && (cell.row < bestCell.row || (cell.row === bestCell.row && cell.col < bestCell.col)))
      ) {
        bestDistance = distance;
        bestCell = cell;
      }
    }

    return bestCell;
  }

  function buildRectanglesForZone(zoneId) {
    const visited = createVisitedCells();
    const rects = [];

    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.cols; c += 1) {
        if (!isUnvisitedZoneCell(zoneId, visited, r, c)) {
          continue;
        }

        const width = measureRectangleWidth(zoneId, visited, r, c);
        const height = measureRectangleHeight(zoneId, visited, r, c, width);
        markRectangleVisited(visited, r, c, width, height);

        rects.push({ x: c, y: r, width, height });
      }
    }

    return rects;
  }

  function buildLabelPositionsForZone(zoneId) {
    const visited = createVisitedCells();
    const labels = [];

    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.cols; c += 1) {
        if (!isUnvisitedZoneCell(zoneId, visited, r, c)) {
          continue;
        }

        const componentCells = collectZoneComponent(zoneId, visited, r, c);
        const center = getComponentCenter(componentCells);
        const bestCell = pickNearestCenterCell(componentCells, center);

        labels.push({
          x: bestCell.col + 0.5,
          y: bestCell.row + 0.5 + CONFIG.labels.yOffset
        });
      }
    }

    return labels;
  }

  function buildZoneBorderSegments() {
    const segments = [];
    const seen = new Set();

    function addSegment(x1, y1, x2, y2) {
      let ax = x1;
      let ay = y1;
      let bx = x2;
      let by = y2;

      if (ax > bx || (ax === bx && ay > by)) {
        ax = x2;
        ay = y2;
        bx = x1;
        by = y1;
      }

      const key = `${ax},${ay},${bx},${by}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      segments.push({ x1: ax, y1: ay, x2: bx, y2: by });
    }

    forEachStateCell((r, c) => {
      const zoneId = state.cells[r][c];
      if (zoneId === null) {
        return;
      }

      if (r === 0 || state.cells[r - 1][c] !== zoneId) {
        addSegment(c, r, c + 1, r);
      }
      if (c === state.cols - 1 || state.cells[r][c + 1] !== zoneId) {
        addSegment(c + 1, r, c + 1, r + 1);
      }
      if (r === state.rows - 1 || state.cells[r + 1][c] !== zoneId) {
        addSegment(c, r + 1, c + 1, r + 1);
      }
      if (c === 0 || state.cells[r][c - 1] !== zoneId) {
        addSegment(c, r, c, r + 1);
      }
    });

    return segments;
  }

  function buildSvgZoneContent() {
    const fillLines = [];
    const labelLines = [];

    for (const zone of state.zones) {
      const rects = buildRectanglesForZone(zone.id);
      if (!rects.length) {
        continue;
      }
      for (const rect of rects) {
        fillLines.push(`  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${zone.color}"/>`);
      }
      const labels = buildLabelPositionsForZone(zone.id);
      for (const labelPos of labels) {
        labelLines.push(`    <text x="${formatNumber(labelPos.x)}" y="${formatNumber(labelPos.y)}" dy="${CONFIG.svg.labelDy}">${escapeXml(String(zone.label))}</text>`);
      }
    }

    return { fillLines, labelLines };
  }

  function buildSvgGridLines(rowCount, colCount) {
    const verticalGridLines = [];
    for (let x = 0; x <= colCount; x += 1) {
      verticalGridLines.push(`    <line x1="${x}" y1="0" x2="${x}" y2="${rowCount}"/>`);
    }
    const horizontalGridLines = [];
    for (let y = 0; y <= rowCount; y += 1) {
      horizontalGridLines.push(`    <line x1="0" y1="${y}" x2="${colCount}" y2="${y}"/>`);
    }
    return { verticalGridLines, horizontalGridLines };
  }

  function assembleSvgDocument({
    rowCount,
    colCount,
    width,
    height,
    fillLines,
    labelLines,
    borderLines,
    verticalGridLines,
    horizontalGridLines
  }) {
    const grid = CONFIG.svg.gridGroup;
    const zoneBorder = CONFIG.svg.zoneBorderGroup;
    const label = CONFIG.svg.labelGroup;
    const frame = CONFIG.svg.frameRect;

    return [
      `<svg xmlns="http://www.w3.org/2000/svg"`,
      `     width="${width}" height="${height}" viewBox="0 0 ${colCount} ${rowCount}"`,
      `     preserveAspectRatio="none">`,
      "",
      `  <rect x="0" y="0" width="${colCount}" height="${rowCount}" fill="${CONFIG.svg.backgroundFill}"/>`,
      "",
      "  <!-- fills (cell units) -->",
      ...(fillLines.length ? fillLines : ["  <!-- no zones painted yet -->"]),
      "",
      "  <!-- gridlines -->",
      `  <g stroke="${grid.stroke}" stroke-width="${grid.strokeWidth}" vector-effect="${grid.vectorEffect}" shape-rendering="${grid.shapeRendering}">`,
      ...verticalGridLines,
      ...horizontalGridLines,
      "  </g>",
      "",
      "  <!-- zone borders -->",
      `  <g fill="${zoneBorder.fill}" stroke="${zoneBorder.stroke}" stroke-width="${zoneBorder.strokeWidth}" vector-effect="${zoneBorder.vectorEffect}" shape-rendering="${zoneBorder.shapeRendering}">`,
      ...(borderLines.length ? borderLines : ["    <!-- no zone borders yet -->"]),
      "  </g>",
      "",
      "  <!-- labels -->",
      `  <g font-family="${label.fontFamily}" font-size="${label.fontSize}" font-weight="${label.fontWeight}" fill="${label.fill}"`,
      `     text-anchor="${label.textAnchor}">`,
      ...(labelLines.length ? labelLines : ["    <!-- no labels yet -->"]),
      "  </g>",
      "",
      `  <rect x="0" y="0" width="${colCount}" height="${rowCount}"`,
      `        fill="${frame.fill}" stroke="${frame.stroke}" stroke-width="${frame.strokeWidth}"`,
      `        vector-effect="${frame.vectorEffect}" shape-rendering="${frame.shapeRendering}"/>`,
      "</svg>"
    ].join("\n");
  }

  function generateSvg() {
    const rowCount = state.rows;
    const colCount = state.cols;
    const pxPerCell = CONFIG.svg.pixelsPerCell;
    const width = colCount * pxPerCell;
    const height = rowCount * pxPerCell;

    const { fillLines, labelLines } = buildSvgZoneContent();
    const borderLines = buildZoneBorderSegments().map(
      (segment) => `    <line x1="${segment.x1}" y1="${segment.y1}" x2="${segment.x2}" y2="${segment.y2}"/>`
    );
    const { verticalGridLines, horizontalGridLines } = buildSvgGridLines(rowCount, colCount);

    return assembleSvgDocument({
      rowCount,
      colCount,
      width,
      height,
      fillLines,
      labelLines,
      borderLines,
      verticalGridLines,
      horizontalGridLines
    });
  }

  function refreshSvgOnly() {
    const svg = generateSvg();
    els.svgOutput.value = svg;
    els.svgPreview.innerHTML = svg;
  }

  function setStatus(message, isWarning = false) {
    els.statusText.textContent = message;
    els.statusText.style.color = isWarning ? "var(--warning)" : "var(--muted)";
  }

  function getActiveZone() {
    return state.activeZoneId === null ? null : zoneById(state.activeZoneId);
  }

  function ensureActiveZoneOrWarn(message = CONFIG.messages.selectZoneToFill) {
    const zone = getActiveZone();
    if (!zone) {
      setStatus(message, true);
      return null;
    }
    return zone;
  }

  function getStatusMessage() {
    const zone = getActiveZone();
    if (!zone) {
      return {
        message: CONFIG.messages.selectZoneToFill,
        isWarning: true
      };
    }
    return {
      message: `Zone ${zone.label} ${CONFIG.messages.zoneSelectedSuffix}`,
      isWarning: false
    };
  }

  function renderAll() {
    syncInputs();
    renderZones();
    refreshGridOnly();
    refreshSvgOnly();
    updateHistoryControls();
    const status = getStatusMessage();
    setStatus(status.message, status.isWarning);
  }

  function getCellFromTarget(target) {
    const cell = target.closest(".grid-cell");
    if (!cell || !els.grid.contains(cell)) {
      return null;
    }
    const r = Number.parseInt(cell.dataset.r, 10);
    const c = Number.parseInt(cell.dataset.c, 10);
    if (Number.isNaN(r) || Number.isNaN(c)) {
      return null;
    }
    return { r, c };
  }

  function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    return target.closest("input, textarea, select, [contenteditable='true']") !== null;
  }

  function toggleDragSelectionCells() {
    if (!state.dragStart || !state.dragCurrent) {
      return;
    }
    const activeZone = ensureActiveZoneOrWarn(CONFIG.messages.selectOrAddZoneBeforeFill);
    if (!activeZone) {
      return;
    }

    const minRow = Math.min(state.dragStart.r, state.dragCurrent.r);
    const maxRow = Math.max(state.dragStart.r, state.dragCurrent.r);
    const minCol = Math.min(state.dragStart.c, state.dragCurrent.c);
    const maxCol = Math.max(state.dragStart.c, state.dragCurrent.c);
    commitChange(() => {
      for (let r = minRow; r <= maxRow; r += 1) {
        for (let c = minCol; c <= maxCol; c += 1) {
          if (state.cells[r][c] === activeZone.id) {
            state.cells[r][c] = null;
          } else {
            state.cells[r][c] = activeZone.id;
          }
        }
      }
    }, { afterChange: null });
  }

  function handleGridPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    const cell = getCellFromTarget(event.target);
    if (!cell) {
      return;
    }

    if (!ensureActiveZoneOrWarn(CONFIG.messages.selectOrAddZoneBeforeFill)) {
      return;
    }

    state.isDragging = true;
    state.dragStart = cell;
    state.dragCurrent = cell;
    refreshGridOnly();
    event.preventDefault();
  }

  function handleGridPointerMove(event) {
    if (!state.isDragging) {
      return;
    }
    const cell = getCellFromTarget(event.target);
    if (!cell) {
      return;
    }
    if (!state.dragCurrent || state.dragCurrent.r !== cell.r || state.dragCurrent.c !== cell.c) {
      state.dragCurrent = cell;
      refreshGridOnly();
    }
  }

  function handleGlobalPointerUp() {
    if (!state.isDragging) {
      return;
    }
    toggleDragSelectionCells();
    state.isDragging = false;
    state.dragStart = null;
    state.dragCurrent = null;
    renderAll();
  }

  function handleGlobalKeydown(event) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || isEditableTarget(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "z" && !event.shiftKey) {
      if (undo()) {
        event.preventDefault();
      }
      return;
    }
    if (key === "y" || (key === "z" && event.shiftKey)) {
      if (redo()) {
        event.preventDefault();
      }
    }
  }

  async function copySvgToClipboard() {
    const svg = els.svgOutput.value;
    try {
      await navigator.clipboard.writeText(svg);
      setStatus(CONFIG.messages.svgCopied);
    } catch {
      els.svgOutput.select();
      document.execCommand("copy");
      setStatus(CONFIG.messages.svgCopiedFallback);
    }
  }

  function downloadSvg() {
    const svg = els.svgOutput.value;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `seed-tray-${state.cols}x${state.rows}.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function bindControlEvents() {
    els.undoBtn.addEventListener("click", () => {
      undo();
    });

    els.redoBtn.addEventListener("click", () => {
      redo();
    });

    els.resizeBtn.addEventListener("click", () => {
      const rows = clampInt(els.rowsInput.value, CONFIG.grid.minSize, CONFIG.grid.maxSize, state.rows);
      const cols = clampInt(els.colsInput.value, CONFIG.grid.minSize, CONFIG.grid.maxSize, state.cols);
      resizeGrid(rows, cols);
    });

    els.clearGridBtn.addEventListener("click", () => {
      clearGrid();
    });

    els.resetBtn.addEventListener("click", () => {
      resetToDefaultState();
    });

    els.addZoneBtn.addEventListener("click", () => {
      addZone();
    });
  }

  function bindGridEvents() {
    els.grid.addEventListener("pointerdown", handleGridPointerDown);
    els.grid.addEventListener("pointermove", handleGridPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
  }

  function bindShortcutEvents() {
    window.addEventListener("keydown", handleGlobalKeydown);
  }

  function bindExportEvents() {
    els.copyBtn.addEventListener("click", copySvgToClipboard);
    els.downloadBtn.addEventListener("click", downloadSvg);
  }

  function setupEvents() {
    bindControlEvents();
    bindGridEvents();
    bindShortcutEvents();
    bindExportEvents();
  }

  function init() {
    applyDefaultState();
    syncInputBounds();
    setupEvents();
    renderAll();
  }

  init();
})();


