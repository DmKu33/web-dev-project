// DEMO 1: Gradient descent with a single-parameter quadratic loss

function initGradientDescent() {
    const width = 700;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    
    const svg = d3.select("#gradient-viz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Clip path so the chart can be revealed with a vertical scan
    const gradDefs = svg.append("defs");
    const gradClipPath = gradDefs.append("clipPath")
        .attr("id", "gradient-clip");

    const gradClipRect = gradClipPath.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", 0);

    const gradContainer = svg.append("g")
        .attr("clip-path", "url(#gradient-clip)");
    
    const xScale = d3.scaleLinear()
        .domain([-5, 5])
        .range([margin.left, width - margin.right]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 25])
        .range([height - margin.bottom, margin.top]);
    
    // Loss function: f(x) = 0.5 * x^2 + 1 (simple quadratic)
    const lossFunction = x => 0.5 * x * x + 1;
    const derivative = x => x;
    
    const curveData = d3.range(-5, 5.1, 0.1).map(x => ({
        x: x,
        y: lossFunction(x)
    }));
    
    const line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));
    
    gradContainer.append("path")
        .datum(curveData)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "#666")
        .attr("stroke-width", 2.5);
    
    gradContainer.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));
    
    gradContainer.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));
    
    gradContainer.append("text")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#999")
        .text("Parameter (θ)");
    
    gradContainer.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#999")
        .text("Loss");
    
    let currentX = 4;
    let learningRate = 0.1;
    let animationInterval = null;
    let initialCycleDone = false;
    let initialAutoRunning = false;
    let stepCount = 0;
    
    const currentPoint = gradContainer.append("circle")
        .attr("cx", xScale(currentX))
        .attr("cy", yScale(lossFunction(currentX)))
        .attr("r", 6)
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);
    
    const pathHistory = [{ x: currentX, y: lossFunction(currentX) }];
    const pathLine = gradContainer.append("path")
        .attr("fill", "none")
        .attr("stroke", "#999")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4")
        .attr("opacity", 0.6);

    const statusText = gradContainer.append("text")
        .attr("x", width - 10)
        .attr("y", margin.top + 15)
        .attr("text-anchor", "end")
        .style("font-size", "14px")
        .style("fill", "#b0b0b0")
        .style("font-weight", "400");

    function updateStatus() {
        const loss = lossFunction(currentX).toFixed(3);
        statusText.text(`step ${stepCount} · loss ${loss}`);
    }
    
    function updateVisualization() {
        currentPoint
            .transition()
            .duration(300)
            .attr("cx", xScale(currentX))
            .attr("cy", yScale(lossFunction(currentX)));
        
        pathHistory.push({ x: currentX, y: lossFunction(currentX) });
        if (pathHistory.length > 50) pathHistory.shift();
        
        pathLine
            .datum(pathHistory)
            .attr("d", line);

        updateStatus();
    }
    
    function gradientStep() {
        const gradient = derivative(currentX);
        currentX = currentX - learningRate * gradient;
        currentX = Math.max(-5, Math.min(5, currentX));
        stepCount += 1;
        updateVisualization();
    }
    
    function reset() {
        currentX = 4;
        stepCount = 0;
        pathHistory.length = 0;
        pathHistory.push({ x: currentX, y: lossFunction(currentX) });
        updateVisualization();
        
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
    }
    
    function animate() {
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
            d3.select("#animate-gradient").text("Animate");
        } else {
            animationInterval = setInterval(() => {
                gradientStep();
                if (Math.abs(currentX) < 0.01) {
                    clearInterval(animationInterval);
                    animationInterval = null;
                    d3.select("#animate-gradient").text("Animate");
                }
            }, 300);
            d3.select("#animate-gradient").text("Stop");
        }
    }
    
    function stopInitialGradientCycle() {
        if (!initialAutoRunning) return;
        initialAutoRunning = false;
        initialCycleDone = true;
    }

    d3.select("#learning-rate").on("input", function() {
        if (initialAutoRunning) stopInitialGradientCycle();
        learningRate = +this.value;
        d3.select("#lr-value").text(learningRate.toFixed(2));
    });
    
    d3.select("#reset-gradient").on("click", function() {
        if (initialAutoRunning) stopInitialGradientCycle();
        reset();
    });
    d3.select("#step-gradient").on("click", function() {
        if (initialAutoRunning) stopInitialGradientCycle();
        gradientStep();
    });
    d3.select("#animate-gradient").on("click", function() {
        if (initialAutoRunning) stopInitialGradientCycle();
        animate();
    });

    // One automatic pass; user interaction cancels it
    function runInitialGradientCycle() {
        if (initialCycleDone || initialAutoRunning) return;
        initialAutoRunning = true;
        let steps = 0;
        const maxSteps = 40;
        function tick() {
            if (!initialAutoRunning) return;
            gradientStep();
            steps += 1;
            if (Math.abs(currentX) < 0.01 || steps >= maxSteps) {
                initialCycleDone = true;
                initialAutoRunning = false;
                return;
            }
            setTimeout(tick, 300);
        }
        tick();
    }

    // Trigger scanline reveal and initial cycle when the section becomes visible
    const gradSection = document.querySelector('#gradient-viz')?.closest('.demo-section');
    if (gradSection) {
        let gradRevealed = false;
        const gradObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !gradRevealed) {
                    gradRevealed = true;
                    gradClipRect
                        .transition()
                        .duration(2000)
                        .attr("height", height);

                    runInitialGradientCycle();
                }
            });
        }, { threshold: 0.2 });
        gradObserver.observe(gradSection);
    }
}


// DEMO 2: Decision boundary slider on a concentric-rings dataset

function initBoundaryVisualization() {
    const width = 700;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    
    const svg = d3.select("#boundary-viz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Clip-based reveal for decision boundary chart
    const boundDefs = svg.append("defs");
    const boundClipPath = boundDefs.append("clipPath")
        .attr("id", "boundary-clip");

    const boundClipRect = boundClipPath.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", 0);

    const boundContainer = svg.append("g")
        .attr("clip-path", "url(#boundary-clip)");
    
    const xScale = d3.scaleLinear()
        .domain([-1.3, 1.3])
        .range([margin.left, width - margin.right]);
    
    const yScale = d3.scaleLinear()
        .domain([-1.3, 1.3])
        .range([height - margin.bottom, margin.top]);
    
    // Rough make_circles-style data: inner ring is class 0, outer ring is class 1
    const data = [
        // Inner circle points
        {x: 0.12, y: -0.38, class: 0}, {x: -0.22, y: 0.35, class: 0}, {x: 0.45, y: 0.15, class: 0},
        {x: -0.15, y: -0.42, class: 0}, {x: 0.38, y: -0.22, class: 0}, {x: -0.42, y: -0.08, class: 0},
        {x: 0.25, y: 0.38, class: 0}, {x: -0.35, y: 0.25, class: 0}, {x: 0.48, y: -0.05, class: 0},
        {x: 0.08, y: 0.45, class: 0}, {x: -0.45, y: 0.12, class: 0}, {x: 0.32, y: -0.35, class: 0},
        {x: -0.28, y: -0.32, class: 0}, {x: 0.42, y: 0.25, class: 0}, {x: -0.18, y: 0.42, class: 0},
        {x: 0.15, y: -0.45, class: 0}, {x: -0.38, y: -0.22, class: 0}, {x: 0.35, y: 0.32, class: 0},
        {x: -0.05, y: -0.48, class: 0}, {x: 0.22, y: 0.42, class: 0}, {x: -0.48, y: 0.05, class: 0},
        {x: 0.38, y: -0.28, class: 0}, {x: -0.32, y: 0.35, class: 0}, {x: 0.45, y: 0.08, class: 0},
        {x: -0.12, y: -0.45, class: 0}, {x: 0.28, y: -0.38, class: 0}, {x: -0.42, y: 0.18, class: 0},
        // Outer circle points
        {x: 0.88, y: -0.45, class: 1}, {x: -0.92, y: 0.38, class: 1}, {x: 0.95, y: 0.32, class: 1},
        {x: -0.85, y: -0.52, class: 1}, {x: 0.78, y: 0.62, class: 1}, {x: -0.68, y: 0.72, class: 1},
        {x: 0.58, y: -0.82, class: 1}, {x: -0.52, y: -0.85, class: 1}, {x: 1.02, y: 0.18, class: 1},
        {x: -0.98, y: -0.22, class: 1}, {x: 0.72, y: 0.68, class: 1}, {x: -0.78, y: 0.62, class: 1},
        {x: 0.92, y: -0.38, class: 1}, {x: -0.88, y: -0.45, class: 1}, {x: 0.62, y: -0.78, class: 1},
        {x: -0.72, y: -0.68, class: 1}, {x: 1.05, y: 0.08, class: 1}, {x: -1.02, y: 0.15, class: 1},
        {x: 0.85, y: 0.52, class: 1}, {x: -0.62, y: 0.78, class: 1}, {x: 0.68, y: -0.72, class: 1},
        {x: -0.58, y: -0.82, class: 1}, {x: 0.98, y: 0.25, class: 1}, {x: -0.95, y: -0.32, class: 1},
        {x: 0.75, y: 0.65, class: 1}, {x: -0.82, y: 0.58, class: 1}, {x: 0.88, y: -0.48, class: 1},
        {x: -0.75, y: -0.65, class: 1}, {x: 0.52, y: -0.85, class: 1}, {x: -0.48, y: 0.88, class: 1},
        {x: 1.08, y: -0.12, class: 1}, {x: -1.05, y: 0.22, class: 1}, {x: 0.65, y: 0.75, class: 1},
        {x: -0.58, y: -0.82, class: 1}, {x: 0.82, y: 0.58, class: 1}, {x: -0.68, y: 0.72, class: 1},
        {x: 0.95, y: -0.32, class: 1}, {x: -0.92, y: -0.38, class: 1}, {x: 0.78, y: -0.62, class: 1}
    ];
    
    boundContainer.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));
    
    boundContainer.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));
    
    boundContainer.append("text")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .text("Feature 1");
    
    boundContainer.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .text("Feature 2");
    
    boundContainer.selectAll(".data-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 5)
        .attr("fill", d => d.class === 0 ? "#666" : "#bbb")
        .attr("opacity", 0.75)
        .attr("stroke", d => d.class === 0 ? "#444" : "#999")
        .attr("stroke-width", 1.5);
    
    // Pre-baked boundary shapes for epochs 0–50, growing from tiny ellipse to near-perfect circle
    const epochs = [];
    for (let e = 0; e <= 50; e++) {
        const progress = e / 50;
        const points = [];
        
        const radius = 0.2 + progress * 0.45; // ends around the gap between inner/outer rings
        const xStretch = 1.0 + (1 - progress) * 0.8; // slowly relaxes from ellipse -> circle
        const yStretch = 1.0 + (1 - progress) * 0.5;
        
        for (let angle = 0; angle <= 360; angle += 10) {
            const rad = (angle * Math.PI) / 180;
            const x = radius * Math.cos(rad) * xStretch;
            const y = radius * Math.sin(rad) * yStretch;
            points.push({x, y});
        }
        epochs.push(points);
    }
    
    const boundaryLine = boundContainer.append("path")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 3)
        .attr("opacity", 0.9);

    let boundaryInitialDone = false;
    let boundaryAutoRunning = false;

    const epochLabel = boundContainer.append("text")
        .attr("x", width - 10)
        .attr("y", margin.top + 15)
        .attr("text-anchor", "end")
        .style("font-size", "14px")
        .style("fill", "#b0b0b0")
        .style("font-weight", "400");
    
    const accuracyLabel = boundContainer.append("text")
        .attr("x", width - 10)
        .attr("y", margin.top + 35)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .style("fill", "#999");
    
    const boundaryGenerator = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveBasis);
    
    // Calculate accuracy based on which side of boundary each point is on
    function calculateAccuracy(epoch) {
        const boundaryPoints = epochs[epoch];
        const radius = 0.2 + (epoch / 50) * 0.45; // mirror the radius logic above
        
        let correct = 0;
        data.forEach(point => {
            const dist = Math.sqrt(point.x * point.x + point.y * point.y);
            const predictedClass = dist < radius ? 0 : 1;
            if (predictedClass === point.class) correct++;
        });
        
        return (correct / data.length * 100).toFixed(1);
    }

    function updateBoundary(epoch) {
        const boundaryPoints = epochs[epoch];
        
        boundaryLine
            .transition()
            .duration(300)
            .attr("d", boundaryGenerator(boundaryPoints));

        const accuracy = calculateAccuracy(epoch);
        epochLabel.text(`epoch ${epoch} / ${epochs.length - 1}`);
        accuracyLabel.text(`accuracy: ${accuracy}%`);
        
        d3.select("#epoch-slider-value").text(epoch);
        const slider = document.getElementById("epoch-slider");
        if (slider) slider.value = String(epoch);
    }
    
    updateBoundary(0);
    
    d3.select("#epoch-slider").on("input", function() {
        const epoch = +this.value;
        updateBoundary(epoch);
        if (boundaryAutoRunning && !boundaryInitialDone) {
            boundaryAutoRunning = false;
            boundaryInitialDone = true;
        }
    });

    // One automatic sweep of epochs; user input can interrupt
    function runInitialBoundaryCycle() {
        if (boundaryInitialDone || boundaryAutoRunning) return;
        boundaryAutoRunning = true;
        let epoch = 0;
        const lastEpoch = epochs.length - 1;
        function tick() {
            if (!boundaryAutoRunning) return;
            updateBoundary(epoch);
            if (epoch >= lastEpoch) {
                boundaryInitialDone = true;
                boundaryAutoRunning = false;
                return;
            }
            epoch += 1;
            setTimeout(tick, 80);
        }
        tick();
    }

    // Trigger scanline reveal and initial sweep when the section becomes visible
    const boundSection = document.querySelector('#boundary-viz')?.closest('.demo-section');
    if (boundSection) {
        let boundRevealed = false;
        const boundObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !boundRevealed) {
                    boundRevealed = true;
                    boundClipRect
                        .transition()
                        .duration(2000)
                        .attr("height", height);

                    runInitialBoundaryCycle();
                }
            });
        }, { threshold: 0.2 });
        boundObserver.observe(boundSection);
    }
}


// DEMO 3: OPTIMIZER COMPARISON

function initOptimizerComparison() {
    const width = 700;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    
    const svg = d3.select("#optimizer-viz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const optClipPath = svg.append("defs").append("clipPath").attr("id", "opt-clip");
    const optClipRect = optClipPath.append("rect")
        .attr("x", 0).attr("y", 0).attr("width", width).attr("height", 0);
    const optContainer = svg.append("g").attr("clip-path", "url(#opt-clip)");
    
    const xScale = d3.scaleLinear().domain([-2.2, 2.2]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-2.2, 2.2]).range([height - margin.bottom, margin.top]);
    
    // Simple bowl-shaped loss: f(x, y) = x^2 + y^2
    const lossFunction = (x, y) => x * x + y * y;
    const gradX = x => 2 * x;
    const gradY = y => 2 * y;
    
    // Static contour rings for the loss surface
    const contourLevels = [0.1, 0.5, 1, 2, 3, 4];
    contourLevels.forEach(level => {
        const radius = Math.sqrt(level);
        optContainer.append("circle")
            .attr("cx", xScale(0))
            .attr("cy", yScale(0))
            .attr("r", xScale(radius) - xScale(0))
            .attr("fill", "none")
            .attr("stroke", "#444")
            .attr("stroke-width", 1)
            .attr("opacity", 0.6);
    });
    
    optContainer.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));
    optContainer.append("g").attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));
    
    // All optimizers start from the same point so their paths are comparable
    const optimizers = [
        { name: "SGD", color: "#aaa", x: -1.5, y: 1.2, vx: 0, vy: 0, path: [{x: -1.5, y: 1.2}], lr: 0.08, dashArray: "8,4" },
        { name: "Adam", color: "#fff", x: -1.5, y: 1.2, m_x: 0, m_y: 0, v_x: 0, v_y: 0, path: [{x: -1.5, y: 1.2}], lr: 0.25, beta1: 0.9, beta2: 0.999, eps: 1e-8, t: 0, dashArray: "none" }
    ];
    
    const line = d3.line().x(d => xScale(d.x)).y(d => yScale(d.y));
    
    optimizers.forEach(opt => {
        opt.pathLine = optContainer.append("path")
            .attr("fill", "none")
            .attr("stroke", opt.color)
            .attr("stroke-width", 2.5)
            .attr("stroke-dasharray", opt.dashArray)
            .attr("opacity", 0.8);
        opt.point = optContainer.append("circle")
            .attr("cx", xScale(opt.x))
            .attr("cy", yScale(opt.y))
            .attr("r", 6)
            .attr("fill", opt.color)
            .attr("stroke", "#000")
            .attr("stroke-width", 2);
    });
    
    const legend = optContainer.append("g").attr("transform", `translate(${width - 100}, ${margin.top + 10})`);
    optimizers.forEach((opt, i) => {
        // Show line style in legend instead of circle
        legend.append("line")
            .attr("x1", 0).attr("x2", 25).attr("y1", i * 22).attr("y2", i * 22)
            .attr("stroke", opt.color).attr("stroke-width", 2.5)
            .attr("stroke-dasharray", opt.dashArray);
        legend.append("text")
            .attr("x", 30).attr("y", i * 22 + 4)
            .style("font-size", "12px").style("fill", "#b0b0b0")
            .text(opt.name);
    });
    
    function step() {
        optimizers.forEach(opt => {
            const gx = gradX(opt.x);
            const gy = gradY(opt.y);
            
            if (opt.name === "SGD") {
                opt.x -= opt.lr * gx;
                opt.y -= opt.lr * gy;
            } else if (opt.name === "Adam") {
                opt.t += 1;
                opt.m_x = opt.beta1 * opt.m_x + (1 - opt.beta1) * gx;
                opt.m_y = opt.beta1 * opt.m_y + (1 - opt.beta1) * gy;
                opt.v_x = opt.beta2 * opt.v_x + (1 - opt.beta2) * gx * gx;
                opt.v_y = opt.beta2 * opt.v_y + (1 - opt.beta2) * gy * gy;
                const m_x_hat = opt.m_x / (1 - Math.pow(opt.beta1, opt.t));
                const m_y_hat = opt.m_y / (1 - Math.pow(opt.beta1, opt.t));
                const v_x_hat = opt.v_x / (1 - Math.pow(opt.beta2, opt.t));
                const v_y_hat = opt.v_y / (1 - Math.pow(opt.beta2, opt.t));
                opt.x -= opt.lr * m_x_hat / (Math.sqrt(v_x_hat) + opt.eps);
                opt.y -= opt.lr * m_y_hat / (Math.sqrt(v_y_hat) + opt.eps);
            }
            
            opt.path.push({x: opt.x, y: opt.y});
            if (opt.path.length > 100) opt.path.shift();
            
            opt.pathLine.datum(opt.path).attr("d", line);
            opt.point.attr("cx", xScale(opt.x)).attr("cy", yScale(opt.y));
        });
    }
    
    function reset() {
        optimizers.forEach(opt => {
            opt.x = -1.5; opt.y = 1.2;
            opt.vx = 0; opt.vy = 0;
            opt.m_x = 0; opt.m_y = 0; opt.v_x = 0; opt.v_y = 0; opt.t = 0;
            opt.path = [{x: opt.x, y: opt.y}];
            opt.pathLine.datum(opt.path).attr("d", line);
            opt.point.attr("cx", xScale(opt.x)).attr("cy", yScale(opt.y));
        });
        if (playInterval) { clearInterval(playInterval); playInterval = null; }
        d3.select("#play-optimizers").text("Play");
    }
    
    let playInterval = null;
    d3.select("#reset-optimizers").on("click", reset);
    d3.select("#step-optimizers").on("click", step);
    d3.select("#play-optimizers").on("click", function() {
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
            d3.select("#play-optimizers").text("Play");
        } else {
            playInterval = setInterval(step, 100);
            d3.select("#play-optimizers").text("Pause");
        }
    });
    
    // Let the optimizers walk automatically the first time this section scrolls into view
    let optInitialDone = false;
    
    function runOptimizerAutoPlay() {
        if (optInitialDone || playInterval) return;
        playInterval = setInterval(() => {
            step();
            // Check if any optimizer is close to center (converged)
            const allConverged = optimizers.every(opt => 
                Math.sqrt(opt.x * opt.x + opt.y * opt.y) < 0.1
            );
            if (allConverged) {
                clearInterval(playInterval);
                playInterval = null;
                optInitialDone = true;
            }
        }, 100);
    }
    
    const optSection = document.querySelector('#optimizer-viz')?.closest('.demo-section');
    if (optSection) {
        let optRevealed = false;
        const optObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !optRevealed) {
                    optRevealed = true;
                    optClipRect.transition().duration(2000).attr("height", height);
                    setTimeout(runOptimizerAutoPlay, 2000); // Start after scanline completes
                }
            });
        }, { threshold: 0.2 });
        optObserver.observe(optSection);
    }
}


// DEMO 4: Bias–variance tradeoff as a 2x2 grid of toy regressors

function initBiasVarianceGrid() {
    const containerWidth = 700;
    const containerHeight = 700;
    const panelWidth = 320;
    const panelHeight = 320;
    const margin = { top: 30, right: 20, bottom: 30, left: 40 };
    
    const svg = d3.select("#bias-variance-viz")
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight);

    const bvClipPath = svg.append("defs").append("clipPath").attr("id", "bv-clip");
    const bvClipRect = bvClipPath.append("rect")
        .attr("x", 0).attr("y", 0).attr("width", containerWidth).attr("height", 0);
    const bvContainer = svg.append("g").attr("clip-path", "url(#bv-clip)");
    
    // Ground-truth function: a clean sine wave
    const trueFunc = x => Math.sin(x * 2);
    const xDomain = [-Math.PI, Math.PI];
    
    // Single shared noisy training set
    const trainData = [];
    for (let i = 0; i < 20; i++) {
        const x = -Math.PI + (2 * Math.PI * i) / 19;
        const y = trueFunc(x) + (Math.random() - 0.5) * 0.4;
        trainData.push({x, y});
    }
    
    const scenarios = [
        { title: "Low Bias, Low Variance", degree: 3, noise: 0.3, x: 0, y: 0 },
        { title: "Low Bias, High Variance", degree: 12, noise: 0.3, x: panelWidth + 60, y: 0 },
        { title: "High Bias, Low Variance", degree: 1, noise: 0.3, x: 0, y: panelHeight + 60 },
        { title: "High Bias, High Variance", degree: 8, noise: 0.8, x: panelWidth + 60, y: panelHeight + 60 }
    ];
    
    scenarios.forEach(scenario => {
        const panel = bvContainer.append("g").attr("transform", `translate(${scenario.x}, ${scenario.y})`);
        
        const xScale = d3.scaleLinear().domain(xDomain).range([margin.left, panelWidth - margin.right]);
        const yScale = d3.scaleLinear().domain([-2, 2]).range([panelHeight - margin.bottom, margin.top]);
        
        panel.append("text")
            .attr("x", panelWidth / 2).attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "13px").style("fill", "#fff").style("font-weight", "400")
            .text(scenario.title);
        
        panel.append("g").attr("class", "axis")
            .attr("transform", `translate(0,${panelHeight - margin.bottom})`)
            .call(d3.axisBottom(xScale).ticks(3));
        panel.append("g").attr("class", "axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale).ticks(3));
        
        // Plot the ground-truth curve
        const trueLine = d3.range(-Math.PI, Math.PI, 0.1).map(x => ({x, y: trueFunc(x)}));
        panel.append("path")
            .datum(trueLine)
            .attr("d", d3.line().x(d => xScale(d.x)).y(d => yScale(d.y)))
            .attr("fill", "none").attr("stroke", "#777").attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4,4");
        
        // Scatter the (slightly jittered) training samples
        panel.selectAll(".train-point")
            .data(trainData)
            .enter().append("circle")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y + (Math.random() - 0.5) * scenario.noise))
            .attr("r", 3)
            .attr("fill", "#aaa")
            .attr("opacity", 0.7);
        
        // Sketch of the fitted model for this scenario (not a real solver)
        const fittedLine = d3.range(-Math.PI, Math.PI, 0.1).map(x => {
            let y;
            if (scenario.degree === 1) {
                y = 0.3 * x; // Linear underfit
            } else if (scenario.degree === 3) {
                y = Math.sin(x * 2) + (Math.random() - 0.5) * 0.1; // Good fit
            } else if (scenario.degree === 8) {
                y = Math.sin(x * 2) + Math.sin(x * 8) * 0.5 + (Math.random() - 0.5) * scenario.noise; // High variance
            } else {
                y = Math.sin(x * 2) + Math.sin(x * 15) * 0.3 + Math.cos(x * 10) * 0.2; // Overfit
            }
            return {x, y};
        });
        
        panel.append("path")
            .datum(fittedLine)
            .attr("d", d3.line().x(d => xScale(d.x)).y(d => yScale(d.y)))
            .attr("fill", "none").attr("stroke", "#fff").attr("stroke-width", 2.5);
        
    });
    
    const bvSection = document.querySelector('#bias-variance-viz')?.closest('.demo-section');
    if (bvSection) {
        let bvRevealed = false;
        const bvObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !bvRevealed) {
                    bvRevealed = true;
                    bvClipRect.transition().duration(2000).attr("height", containerHeight);
                }
            });
        }, { threshold: 0.2 });
        bvObserver.observe(bvSection);
    }
}


// DEMO 5: Feature space evolution - classes separating over epochs

function initFeatureSpaceEvolution() {
    const width = 700;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    
    const svg = d3.select("#feature-viz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const featClipPath = svg.append("defs").append("clipPath").attr("id", "feat-clip");
    const featClipRect = featClipPath.append("rect")
        .attr("x", 0).attr("y", 0).attr("width", width).attr("height", 0);
    const featContainer = svg.append("g").attr("clip-path", "url(#feat-clip)");
    
    const xScale = d3.scaleLinear().domain([-3, 3]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-3, 3]).range([height - margin.bottom, margin.top]);
    
    featContainer.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));
    featContainer.append("g").attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));
    
    featContainer.append("text")
        .attr("x", width / 2).attr("y", height - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "11px").style("fill", "#666")
        .text("Feature Dimension 1");
    
    featContainer.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2).attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "11px").style("fill", "#666")
        .text("Feature Dimension 2");
    
    // Three noisy blobs that we slowly pull apart in feature space
    const numPoints = 20;
    const classes = [
        { id: 0, color: "#777", targetX: -1.5, targetY: 1.2 },
        { id: 1, color: "#aaa", targetX: 1.5, targetY: 1.2 },
        { id: 2, color: "#ddd", targetX: 0, targetY: -1.5 }
    ];
    
    const dataPoints = [];
    classes.forEach(cls => {
        for (let i = 0; i < numPoints; i++) {
            dataPoints.push({
                class: cls.id,
                color: cls.color,
                targetX: cls.targetX + (Math.random() - 0.5) * 0.6,
                targetY: cls.targetY + (Math.random() - 0.5) * 0.6,
                initX: (Math.random() - 0.5) * 4,
                initY: (Math.random() - 0.5) * 4
            });
        }
    });
    
    const points = featContainer.selectAll(".feat-point")
        .data(dataPoints)
        .enter().append("circle")
        .attr("class", "feat-point")
        .attr("r", 4)
        .attr("fill", d => d.color)
        .attr("opacity", 0.75)
        .attr("stroke", d => d.class === 0 ? "#555" : d.class === 1 ? "#888" : "#bbb")
        .attr("stroke-width", 1.5);
    
    const epochLabel = featContainer.append("text")
        .attr("x", width - 10).attr("y", margin.top + 15)
        .attr("text-anchor", "end")
        .style("font-size", "14px").style("fill", "#b0b0b0").style("font-weight", "400");
    
    function updateFeatureSpace(epoch) {
        const progress = epoch / 30; // 0 to 1
        
        points.transition().duration(300)
            .attr("cx", d => {
                const x = d.initX + progress * (d.targetX - d.initX);
                return xScale(x);
            })
            .attr("cy", d => {
                const y = d.initY + progress * (d.targetY - d.initY);
                return yScale(y);
            });
        
        epochLabel.text(`epoch ${epoch} / 30`);
        d3.select("#feature-epoch-value").text(epoch);
    }
    
    updateFeatureSpace(0);
    
    d3.select("#feature-epoch-slider").on("input", function() {
        const epoch = +this.value;
        updateFeatureSpace(epoch);
    });
    
    // Let the features drift automatically once the section is visible
    let featAutoRunning = false;
    let featInitialDone = false;
    
    function runFeatureAutoPlay() {
        if (featInitialDone || featAutoRunning) return;
        featAutoRunning = true;
        let epoch = 0;
        function tick() {
            if (!featAutoRunning) return;
            updateFeatureSpace(epoch);
            if (epoch >= 30) {
                featInitialDone = true;
                featAutoRunning = false;
                return;
            }
            epoch += 1;
            setTimeout(tick, 100);
        }
        tick();
    }
    
    d3.select("#feature-epoch-slider").on("input", function() {
        if (featAutoRunning) {
            featAutoRunning = false;
            featInitialDone = true;
        }
        const epoch = +this.value;
        updateFeatureSpace(epoch);
    });
    
    const featSection = document.querySelector('#feature-viz')?.closest('.demo-section');
    if (featSection) {
        let featRevealed = false;
        const featObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !featRevealed) {
                    featRevealed = true;
                    featClipRect.transition().duration(2000).attr("height", height);
                    runFeatureAutoPlay();
                }
            });
        }, { threshold: 0.2 });
        featObserver.observe(featSection);
    }
}


// DEMO 6: Scroll-driven loss curves to show overfitting


function initLossVisualization() {
    const width = 700;
    const height = 500;
    const margin = { top: 40, right: 120, bottom: 50, left: 60 };

    const svg = d3.select("#loss-viz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Use a clip path so the chart can wipe in vertically
    const defs = svg.append("defs");
    const clipPath = defs.append("clipPath")
        .attr("id", "loss-clip");

    const clipRect = clipPath.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", 0);

    const container = svg.append("g")
        .attr("clip-path", "url(#loss-clip)");
    
    const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([margin.left, width - margin.right]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 1.5])
        .range([height - margin.bottom, margin.top]);
    
    const epochs = d3.range(0, 101);
    const trainingLoss = epochs.map(e => {
        const baseLoss = 1.2 * Math.exp(-0.04 * e) + 0.05;
        const variance = 0.03 + 0.01 * Math.exp(-0.05 * e);
        return {
            epoch: e,
            loss: baseLoss,
            lossLower: baseLoss - variance,
            lossUpper: baseLoss + variance
        };
    });
    
    const validationLoss = epochs.map(e => {
        const baseLoss = e < 40 ? 1.3 * Math.exp(-0.035 * e) + 0.08 : 0.25 + 0.008 * (e - 40);
        const variance = e < 40 ? 0.04 + 0.02 * Math.exp(-0.04 * e) : 0.04 + 0.002 * (e - 40);
        return {
            epoch: e,
            loss: baseLoss,
            lossLower: baseLoss - variance,
            lossUpper: baseLoss + variance
        };
    });
    
    container.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));
    
    container.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));
    
    container.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).tickSize(-height + margin.top + margin.bottom).tickFormat(""));
    
    container.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale).tickSize(-width + margin.left + margin.right).tickFormat(""));
    
    container.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .text("Epoch");
    
    container.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .text("Loss");
    
    const line = d3.line()
        .x(d => xScale(d.epoch))
        .y(d => yScale(d.loss));
    
    // Shaded bands = simple variance envelopes around each loss curve
    const trainArea = d3.area()
        .x(d => xScale(d.epoch))
        .y0(d => yScale(d.lossLower))
        .y1(d => yScale(d.lossUpper));
    
    const valArea = d3.area()
        .x(d => xScale(d.epoch))
        .y0(d => yScale(d.lossLower))
        .y1(d => yScale(d.lossUpper));
    
    const trainConfidence = container.append("path")
        .attr("fill", "#888")
        .attr("opacity", 0.25);
    
    const valConfidence = container.append("path")
        .attr("fill", "#bbb")
        .attr("opacity", 0.2);
    
    const trainPath = container.append("path")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 2.5);
    
    const valPath = container.append("path")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2.5);
    
    const legend = container.append("g")
        .attr("transform", `translate(${width - 110}, ${margin.top})`);
    
    legend.append("line")
        .attr("x1", 0).attr("x2", 30).attr("y1", 0).attr("y2", 0)
        .attr("stroke", "#aaa").attr("stroke-width", 2.5);
    
    legend.append("text")
        .attr("x", 35).attr("y", 4)
        .style("fill", "#b0b0b0").style("font-size", "11px")
        .text("Training");
    
    legend.append("line")
        .attr("x1", 0).attr("x2", 30).attr("y1", 20).attr("y2", 20)
        .attr("stroke", "#fff").attr("stroke-width", 2.5);
    
    legend.append("text")
        .attr("x", 35).attr("y", 24)
        .style("fill", "#b0b0b0").style("font-size", "11px")
        .text("Validation");
    
    const overfit = container.append("text")
        .attr("x", xScale(60))
        .attr("y", yScale(0.8))
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "400")
        .style("fill", "#fff")
        .style("opacity", 0)
        .text("Overfitting");
    
    function updateLossCurve(progress) {
        const currentEpoch = Math.floor(progress * 100);
        
        const currentTrain = trainingLoss.slice(0, currentEpoch + 1);
        const currentVal = validationLoss.slice(0, currentEpoch + 1);
        
        trainConfidence
            .datum(currentTrain)
            .attr("d", trainArea);
        
        valConfidence
            .datum(currentVal)
            .attr("d", valArea);
        
        trainPath
            .datum(currentTrain)
            .attr("d", line);
        
        valPath
            .datum(currentVal)
            .attr("d", line);
        
        overfit.style("opacity", currentEpoch > 50 ? 0.9 : 0);
    }
    
    updateLossCurve(0);
    
    // Only hook the scroll animation while the section is on screen
    const scrollSection = document.querySelector(".scroll-section");
    let isVisible = false;
    let hasRevealed = false;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;

            // Trigger the scanline-style reveal once when the section first becomes visible
            if (entry.isIntersecting && !hasRevealed) {
                hasRevealed = true;
                clipRect
                    .transition()
                    .duration(2000)
                    .attr("height", height);
            }
        });
    }, { threshold: 0.1 });
    
    observer.observe(scrollSection);
    
    function handleScroll() {
        if (!isVisible) return;
        
        const rect = scrollSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        const scrollProgress = Math.max(0, Math.min(1, 
            (windowHeight - rect.top) / (windowHeight + rect.height / 3)
        ));
        
        updateLossCurve(scrollProgress);
    }
    
    window.addEventListener("scroll", handleScroll);
    handleScroll();
}

// Scroll-triggered reveal animations
function initScrollAnimations() {
    const sections = document.querySelectorAll('.demo-section');

    // Typewriter effect for headings and body text
    function typeText(element, speed, done) {
        if (!element) return;
        const full = element.dataset.fullText || "";
        element.textContent = "";
        let index = 0;
        function step() {
            if (index <= full.length) {
                element.textContent = full.slice(0, index);
                index += 1;
                setTimeout(step, speed);
            } else if (typeof done === "function") {
                done();
            }
        }
        step();
    }

    // Reserve space for full text so typewriter animation doesn't shift layout
    const demoTextBlocks = document.querySelectorAll('.demo-text');
    demoTextBlocks.forEach(block => {
        // Only measure once per block
        if (!block.dataset.minHeightSet) {
            const currentHeight = block.offsetHeight;
            if (currentHeight > 0) {
                block.style.minHeight = `${currentHeight}px`;
                block.dataset.minHeightSet = "true";
            }
        }
    });

    // Cache text for the typewriter effect (but leave .detailed-content alone)
    const textElements = document.querySelectorAll('.demo-text > h2, .demo-text > p');
    textElements.forEach(el => {
        if (!el.dataset.fullText) {
            el.dataset.fullText = el.textContent || "";
        }
        el.textContent = "";
    });

    // Controls fade in only after the text finishes typing
    sections.forEach(section => {
        const controls = section.querySelector('.controls');
        if (controls) {
            controls.classList.add('delayed-hidden');
        }
    });

    const observerOptions = {
        root: null,
        threshold: 0.15,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const section = entry.target;
                section.classList.add('visible');

                // Trigger typewriter text once per section
                const textContainer = section.querySelector('.demo-text');
                if (textContainer && !textContainer.dataset.typed) {
                    textContainer.dataset.typed = "true";
                    const heading = textContainer.querySelector('h2');
                    const paragraph = textContainer.querySelector('p');
                    const controls = section.querySelector('.controls');

                    const expandBtn = textContainer.querySelector('.expand-btn');
                    
                    if (heading) {
                        typeText(heading, 45, () => {
                            if (paragraph) {
                                typeText(paragraph, 22, () => {
                                    if (controls) {
                                        // First remove hidden class to make element visible in DOM
                                        controls.classList.remove('delayed-hidden');
                                        // Use requestAnimationFrame to ensure smooth transition
                                        requestAnimationFrame(() => {
                                            requestAnimationFrame(() => {
                                                controls.classList.add('delayed-shown');
                                            });
                                        });
                                        // Show expand button after controls animation completes (0.8s)
                                        if (expandBtn) {
                                            setTimeout(() => {
                                                expandBtn.classList.add('visible');
                                            }, 800);
                                        }
                                    } else if (expandBtn) {
                                        expandBtn.classList.add('visible');
                                    }
                                });
                            } else if (controls) {
                                controls.classList.remove('delayed-hidden');
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        controls.classList.add('delayed-shown');
                                    });
                                });
                                if (expandBtn) {
                                    setTimeout(() => {
                                        expandBtn.classList.add('visible');
                                    }, 800);
                                }
                            } else if (expandBtn) {
                                expandBtn.classList.add('visible');
                            }
                        });
                    } else if (paragraph) {
                        typeText(paragraph, 22, () => {
                            if (controls) {
                                controls.classList.remove('delayed-hidden');
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        controls.classList.add('delayed-shown');
                                    });
                                });
                                if (expandBtn) {
                                    setTimeout(() => {
                                        expandBtn.classList.add('visible');
                                    }, 800);
                                }
                            } else if (expandBtn) {
                                expandBtn.classList.add('visible');
                            }
                        });
                    } else if (expandBtn) {
                        expandBtn.classList.add('visible');
                    }
                }
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

// Expandable "Detailed Explanation" sections
function initExpandableSections() {
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('expanded');
            const content = btn.nextElementSibling;
            if (content) {
                content.classList.toggle('visible');
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", function() {
    // Animate header on page load
    const header = document.querySelector('header');
    if (header) {
        requestAnimationFrame(() => {
            header.classList.add('visible');
        });
    }
    
    initBoundaryVisualization();
    initLossVisualization();
    initOptimizerComparison();
    initBiasVarianceGrid();
    initFeatureSpaceEvolution();
    initScrollAnimations();
    initExpandableSections();
});
