const width = window.innerWidth;
const height = window.innerHeight;

// Scatter plot layout
let scatterMargin = {top: 10, right: 30, bottom: 50, left: 60},
    scatterWidth = 400 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 350 - scatterMargin.top - scatterMargin.bottom,
    scatterLeft = 50,
    scatterTop = 50;

// Histogram layout
let histMargin = {top: 10, right: 30, bottom: 50, left: 60},
    histWidth = 600 - histMargin.left - histMargin.right,
    histHeight = 400 - histMargin.top - histMargin.bottom,
    histLeft = 500,
    histTop = 50;

// Parallel coordinates layout
let parallelMargin = {top: 50, right: 30, bottom: 10, left: 60},
    parallelWidth = width - parallelMargin.left - parallelMargin.right,
    parallelHeight = 400 - parallelMargin.top - parallelMargin.bottom,
    parallelTop = 500;

d3.csv("pokemon_alopez247.csv").then(rawData => {
    rawData.forEach(d => {
        d.HP = +d.HP;
        d.Attack = +d.Attack;
        d.Defense = +d.Defense;
        d["Sp. Atk"] = +d["Sp. Atk"];
        d["Sp. Def"] = +d["Sp. Def"];
        d.Speed = +d.Speed;
        d.Total = +d.Total;
    });

    const svg = d3.select("svg");

    // ======= SCATTER PLOT: Attack vs Defense =======
    const scatterGroup = svg.append("g")
        .attr("transform", `translate(${scatterLeft + scatterMargin.left}, ${scatterTop + scatterMargin.top})`);

    const x1 = d3.scaleLinear()
        .domain([0, d3.max(rawData, d => d.Attack)])
        .range([0, scatterWidth]);

    const y1 = d3.scaleLinear()
        .domain([0, d3.max(rawData, d => d.Defense)])
        .range([scatterHeight, 0]);

    scatterGroup.append("g")
        .attr("transform", `translate(0, ${scatterHeight})`)
        .call(d3.axisBottom(x1));
    
    scatterGroup.append("g").call(d3.axisLeft(y1));

    scatterGroup.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight + 40)
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .text("Attack");

    scatterGroup.append("text")
        .attr("x", -scatterHeight / 2)
        .attr("y", -40)
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Defense");

    scatterGroup.selectAll("circle")
        .data(rawData)
        .enter()
        .append("circle")
        .attr("cx", d => x1(d.Attack))
        .attr("cy", d => y1(d.Defense))
        .attr("r", 4)
        .attr("fill", "#69b3a2")
        .append("title")
        .text(d => `${d.Name}: Atk=${d.Attack}, Def=${d.Defense}`);

    // SCATTER BRUSH
    const scatterBrush = d3.brush()
        .extent([[0, 0], [scatterWidth, scatterHeight]])
        .on("brush end", scatterBrushed);

    scatterGroup.append("g")
        .attr("class", "scatter-brush")
        .call(scatterBrush);

    function scatterBrushed({selection}) {
        if (!selection) {
            scatterGroup.selectAll("circle")
                .attr("fill", "#69b3a2");
            return;
        }

        const [[x0, y0], [x1Sel, y1Sel]] = selection;

        scatterGroup.selectAll("circle")
            .attr("fill", d => {
                const xPos = x1(d.Attack);
                const yPos = y1(d.Defense);
                return (x0 <= xPos && xPos <= x1Sel && y0 <= yPos && yPos <= y1Sel)
                    ? "#e15759"
                    : "#69b3a2";
            });
    }


    // ======= HISTOGRAM: Total Stats =======
    const histGroup = svg.append("g")
        .attr("transform", `translate(${histLeft + histMargin.left}, ${histTop + histMargin.top})`);

    const x2 = d3.scaleLinear()
        .domain([d3.min(rawData, d => d.Total), d3.max(rawData, d => d.Total)])
        .range([0, histWidth]);

    const histogram = d3.histogram()
        .value(d => d.Total)
        .domain(x2.domain())
        .thresholds(x2.ticks(20));

    const bins = histogram(rawData);

    const y2 = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([histHeight, 0])
        .nice();

    histGroup.append("g")
        .attr("transform", `translate(0, ${histHeight})`)
        .call(d3.axisBottom(x2));

    histGroup.append("g").call(d3.axisLeft(y2));

    histGroup.append("text")
        .attr("x", histWidth / 2)
        .attr("y", histHeight + 40)
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .text("Total Stats");

    histGroup.append("text")
        .attr("x", -histHeight / 2)
        .attr("y", -40)
        .attr("transform", "rotate(-90)")
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .text("Number of Pokémon");

    histGroup.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", d => x2(d.x0) + 1)
        .attr("y", d => y2(d.length))
        .attr("width", d => x2(d.x1) - x2(d.x0) - 1)
        .attr("height", d => histHeight - y2(d.length))
        .attr("fill", "steelblue")
        .append("title")
        .text(d => `${d.length} Pokémon between ${d.x0} and ${d.x1}`);

    // ======= PARALLEL COORDINATES PLOT =======

    const parallelStats = ["HP", "Attack", "Defense", "Sp_Atk", "Sp_Def", "Speed", "Total"];

    // Normalize keys for easier use
    rawData.forEach(d => {
        d.Sp_Atk = d["Sp_Atk"];
        d.Sp_Def = d["Sp_Def"];
        parallelStats.forEach(stat => d[stat] = +d[stat]);
    });

    // Y-scales for each stat
    const yScales = {};
    parallelStats.forEach(stat => {
        yScales[stat] = d3.scaleLinear()
            .domain(d3.extent(rawData, d => d[stat]))
            .range([parallelHeight, 0]);
    });

    // X-scale
    const x3 = d3.scalePoint()
        .domain(parallelStats)
        .range([0, parallelWidth])
        .padding(0.5);

    // Outer group
    const parallelGroup = svg.append("g")
        .attr("transform", `translate(${parallelMargin.left}, ${parallelTop + parallelMargin.top})`);

    // Zoom layer
    const zoomLayer = parallelGroup.append("g")
        .attr("class", "zoom-layer");

    // Axis group
    const axesGroup = zoomLayer.append("g").attr("class", "axes");

    parallelStats.forEach(stat => {
        const g = axesGroup.append("g")
            .attr("transform", `translate(${x3(stat)}, 0)`);

        g.call(d3.axisLeft(yScales[stat]));

        g.append("text")
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .text(stat);
    });

    // Zoom
    const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on("zoom", event => {
            zoomLayer.attr("transform", event.transform);
        });

    parallelGroup.call(zoom);

    // Line path generator
    function path(d) {
        return d3.line()(parallelStats.map(stat => [x3(stat), yScales[stat](d[stat])]));
    }

    // Create Total slider UI
    const totalExtent = d3.extent(rawData, d => d.Total);
    let totalThreshold = totalExtent[0]; // starting value

    const filterDiv = d3.select("#filters").style("margin", "20px");

    filterDiv.append("label")
        .attr("for", "total-slider")
        .style("font-weight", "bold")
        .text("Minimum Total: ");

    filterDiv.append("input")
        .attr("type", "range")
        .attr("id", "total-slider")
        .attr("min", totalExtent[0])
        .attr("max", totalExtent[1])
        .attr("value", totalExtent[0])
        .attr("step", 1)
        .style("width", "300px")
        .on("input", function () {
            totalThreshold = +this.value;
            filterDiv.select("#slider-value").text(totalThreshold);
            updateParallelPlot();
        });

    filterDiv.append("span")
        .attr("id", "slider-value")
        .style("margin-left", "10px")
        .text(totalThreshold);

    // Draw and update lines
    function updateParallelPlot() {
        const filteredData = rawData.filter(d => d.Total >= totalThreshold);

        const lines = zoomLayer.selectAll("path.line")
            .data(filteredData, d => d.Name);

        lines.exit().remove();

        lines
            .attr("d", path);

        lines.enter()
            .append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "rgba(100, 100, 200, 0.3)")
            .attr("stroke-width", 1)
            .attr("d", path);
    }

    // Initial draw
    updateParallelPlot();


}).catch(error => {
    console.error("Error loading CSV:", error);
});