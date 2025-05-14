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

    // Ensure all fields are numbers
    rawData.forEach(d => {
        parallelStats.forEach(stat => {
            d[stat] = +d[stat];
        });
    });

    // Create y scales for each stat
    const yScales = {};
    parallelStats.forEach(stat => {
        yScales[stat] = d3.scaleLinear()
            .domain(d3.extent(rawData, d => d[stat]))
            .range([parallelHeight, 0]);
    });

    // X scale
    const x3 = d3.scalePoint()
        .domain(parallelStats)
        .range([0, parallelWidth])
        .padding(0.5);

    // Append group
    const parallelGroup = svg.append("g")
        .attr("transform", `translate(${parallelMargin.left}, ${parallelTop + parallelMargin.top})`);

    // Draw polylines
    function path(d) {
        return d3.line()(parallelStats.map(stat => [x3(stat), yScales[stat](d[stat])]));
    }

    parallelGroup.selectAll("path")
        .data(rawData)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "rgba(100, 100, 200, 0.3)")
        .attr("stroke-width", 1);

    // Draw axes for each stat
    parallelStats.forEach(stat => {
        const g = parallelGroup.append("g")
            .attr("transform", `translate(${x3(stat)}, 0)`);

        g.call(d3.axisLeft(yScales[stat]));

        g.append("text")
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .text(stat);
    });


}).catch(error => {
    console.error("Error loading CSV:", error);
});
