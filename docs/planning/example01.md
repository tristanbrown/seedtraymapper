<svg xmlns="http://www.w3.org/2000/svg"
     width="480" height="240" viewBox="0 0 12 6"
     preserveAspectRatio="none">

  <rect x="0" y="0" width="12" height="6" fill="#fff"/>

  <!-- fills (cell units) -->
  <rect x="0"  y="1" width="1" height="4" fill="lightblue"/>
  <rect x="1"  y="0" width="1" height="4" fill="lightgreen"/>
  <rect x="2"  y="0" width="1" height="4" fill="lightcoral"/>
  <rect x="3"  y="0" width="1" height="4" fill="lightyellow"/>
  <rect x="4"  y="0" width="1" height="4" fill="lightgray"/>
  <rect x="5"  y="0" width="1" height="4" fill="lightpink"/>
  <rect x="6"  y="0" width="1" height="4" fill="lightcyan"/>
  <rect x="7"  y="0" width="1" height="4" fill="lightgoldenrodyellow"/>
  <rect x="8"  y="0" width="1" height="4" fill="lightskyblue"/>
  <rect x="9"  y="0" width="1" height="4" fill="lightseagreen"/>
  <rect x="10" y="0" width="1" height="4" fill="plum"/>
  <rect x="11" y="1" width="1" height="3" fill="wheat"/>

  <rect x="1"  y="4" width="2" height="2" fill="salmon"/>
  <rect x="3"  y="4" width="2" height="2" fill="khaki"/>
  <rect x="5"  y="4" width="2" height="2" fill="orchid"/>
  <rect x="7"  y="4" width="4" height="2" fill="aquamarine"/>

  <!-- gridlines -->
  <g stroke="#888" stroke-width="0.01" vector-effect="non-scaling-stroke" shape-rendering="crispEdges">
    <line x1="0" y1="0" x2="0" y2="6"/><line x1="1" y1="0" x2="1" y2="6"/>
    <line x1="2" y1="0" x2="2" y2="6"/><line x1="3" y1="0" x2="3" y2="6"/>
    <line x1="4" y1="0" x2="4" y2="6"/><line x1="5" y1="0" x2="5" y2="6"/>
    <line x1="6" y1="0" x2="6" y2="6"/><line x1="7" y1="0" x2="7" y2="6"/>
    <line x1="8" y1="0" x2="8" y2="6"/><line x1="9" y1="0" x2="9" y2="6"/>
    <line x1="10" y1="0" x2="10" y2="6"/><line x1="11" y1="0" x2="11" y2="6"/>
    <line x1="12" y1="0" x2="12" y2="6"/>

    <line x1="0" y1="0" x2="12" y2="0"/><line x1="0" y1="1" x2="12" y2="1"/>
    <line x1="0" y1="2" x2="12" y2="2"/><line x1="0" y1="3" x2="12" y2="3"/>
    <line x1="0" y1="4" x2="12" y2="4"/><line x1="0" y1="5" x2="12" y2="5"/>
    <line x1="0" y1="6" x2="12" y2="6"/>
  </g>

  <!-- zone borders -->
  <g fill="none" stroke="#000" stroke-width="0.06" vector-effect="non-scaling-stroke" shape-rendering="crispEdges">
    <rect x="0"  y="1" width="1" height="4"/>
    <rect x="1"  y="0" width="1" height="4"/>
    <rect x="2"  y="0" width="1" height="4"/>
    <rect x="3"  y="0" width="1" height="4"/>
    <rect x="4"  y="0" width="1" height="4"/>
    <rect x="5"  y="0" width="1" height="4"/>
    <rect x="6"  y="0" width="1" height="4"/>
    <rect x="7"  y="0" width="1" height="4"/>
    <rect x="8"  y="0" width="1" height="4"/>
    <rect x="9"  y="0" width="1" height="4"/>
    <rect x="10" y="0" width="1" height="4"/>
    <rect x="11" y="1" width="1" height="3"/>

    <rect x="1" y="4" width="2" height="2"/>
    <rect x="3" y="4" width="2" height="2"/>
    <rect x="5" y="4" width="2" height="2"/>
    <rect x="7" y="4" width="4" height="2"/>
  </g>

  <!-- labels: original "top-left cell center" locations + 0.2y tweak -->
  <g font-family="sans-serif" font-size="0.4" font-weight="700" fill="#000"
     text-anchor="middle" dominant-baseline="middle">
    <!-- zones 1 and 12 shifted down one cell -->
    <text x="0.5"  y="2.7">1</text>

    <text x="1.5"  y="1.7">2</text>
    <text x="2.5"  y="1.7">3</text>
    <text x="3.5"  y="1.7">4</text>
    <text x="4.5"  y="1.7">5</text>
    <text x="5.5"  y="1.7">6</text>
    <text x="6.5"  y="1.7">7</text>
    <text x="7.5"  y="1.7">8</text>
    <text x="8.5"  y="1.7">9</text>
    <text x="9.5"  y="1.7">10</text>
    <text x="10.5" y="1.7">11</text>

    <text x="11.5" y="2.7">12</text>

    <text x="1.5"  y="4.7">13</text>
    <text x="3.5"  y="4.7">14</text>
    <text x="5.5"  y="4.7">15</text>
    <text x="7.5"  y="4.7">16</text>
  </g>

  <rect x="0" y="0" width="12" height="6"
        fill="none" stroke="#000" stroke-width="0.06"
        vector-effect="non-scaling-stroke" shape-rendering="crispEdges"/>
</svg>
