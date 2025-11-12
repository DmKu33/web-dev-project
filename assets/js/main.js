// DEMO 1: GRADIENT DESCENT WITH SLIDER

function initGradientDescent() {
    const width = 700;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    
    const svg = d3.select("#gradient-viz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
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
    
    svg.append("path")
        .datum(curveData)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "#444")
        .attr("stroke-width", 2);
    
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));
    
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .text("Parameter (θ)");
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .text("Loss");
    
    let currentX = 4;
    let learningRate = 0.1;
    let animationInterval = null;
    
    const currentPoint = svg.append("circle")
        .attr("cx", xScale(currentX))
        .attr("cy", yScale(lossFunction(currentX)))
        .attr("r", 6)
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);
    
    const pathHistory = [{ x: currentX, y: lossFunction(currentX) }];
    const pathLine = svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#666")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,4")
        .attr("opacity", 0.5);
    
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
    }
    
    function gradientStep() {
        const gradient = derivative(currentX);
        currentX = currentX - learningRate * gradient;
        currentX = Math.max(-5, Math.min(5, currentX));
        updateVisualization();
    }
    
    function reset() {
        currentX = 4;
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
    
    d3.select("#learning-rate").on("input", function() {
        learningRate = +this.value;
        d3.select("#lr-value").text(learningRate.toFixed(2));
    });
    
    d3.select("#reset-gradient").on("click", reset);
    d3.select("#step-gradient").on("click", gradientStep);
    d3.select("#animate-gradient").on("click", animate);
}


// DEMO 2: SLIDER-BASED DECISION BOUNDARY


function initBoundaryVisualization() {
    const width = 700;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    
    const svg = d3.select("#boundary-viz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    const xScale = d3.scaleLinear()
        .domain([0, 10])
        .range([margin.left, width - margin.right]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 10])
        .range([height - margin.bottom, margin.top]);
    
    // Two clusters of points
    const data = [];
    for (let i = 0; i < 30; i++) {
        data.push({ x: Math.random() * 3 + 1, y: Math.random() * 3 + 1, class: 0 });
    }
    for (let i = 0; i < 30; i++) {
        data.push({ x: Math.random() * 3 + 6, y: Math.random() * 3 + 6, class: 1 });
    }
    
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));
    
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .text("Feature 1");
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .text("Feature 2");
    
    svg.selectAll(".data-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 4)
        .attr("fill", d => d.class === 0 ? "#666" : "#999")
        .attr("opacity", 0.6)
        .attr("stroke", d => d.class === 0 ? "#444" : "#777")
        .attr("stroke-width", 1);
    
    // Pre-computed boundary positions for each epoch 
    const epochs = [
        { slope: 0.2, intercept: 2 },
        { slope: 0.3, intercept: 2.5 },
        { slope: 0.4, intercept: 3 },
        { slope: 0.5, intercept: 3.5 },
        { slope: 0.6, intercept: 4 },
        { slope: 0.7, intercept: 4.5 },
        { slope: 0.8, intercept: 5 },
        { slope: 0.9, intercept: 5.5 },
        { slope: 0.95, intercept: 6 },
        { slope: 1.0, intercept: 6.5 },
        { slope: 1.0, intercept: 7 }
    ];
    
    const boundaryLine = svg.append("line")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("opacity", 0.8);
    
    function updateBoundary(epoch) {
        const { slope, intercept } = epochs[epoch];
        const y1 = 0, y2 = 10;
        const x1 = (y1 - intercept) / slope;
        const x2 = (y2 - intercept) / slope;
        
        boundaryLine
            .transition()
            .duration(300)
            .attr("x1", xScale(x1))
            .attr("y1", yScale(y1))
            .attr("x2", xScale(x2))
            .attr("y2", yScale(y2));
    }
    
    updateBoundary(0);
    
    d3.select("#epoch-slider").on("input", function() {
        const epoch = +this.value;
        d3.select("#epoch-slider-value").text(epoch);
        updateBoundary(epoch);
    });
}


// DEMO 3: SCROLL-BASED LOSS CURVE (OVERFITTING)


function initLossVisualization() {
    const width = 700;
    const height = 500;
    const margin = { top: 40, right: 120, bottom: 50, left: 60 };
    
    const svg = d3.select("#loss-viz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([margin.left, width - margin.right]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 1.5])
        .range([height - margin.bottom, margin.top]);
    
    // Training loss keeps decreasing, validation starts increasing after epoch 40
    const epochs = d3.range(0, 101);
    const trainingLoss = epochs.map(e => ({
        epoch: e,
        loss: 1.2 * Math.exp(-0.04 * e) + 0.05
    }));
    
    const validationLoss = epochs.map(e => ({
        epoch: e,
        loss: e < 40 ? 1.3 * Math.exp(-0.035 * e) + 0.08 : 0.25 + 0.008 * (e - 40)
    }));
    
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));
    
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));
    
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).tickSize(-height + margin.top + margin.bottom).tickFormat(""));
    
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale).tickSize(-width + margin.left + margin.right).tickFormat(""));
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .text("Epoch");
    
    svg.append("text")
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
    
    const trainPath = svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#888")
        .attr("stroke-width", 2);
    
    const valPath = svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);
    
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 110}, ${margin.top})`);
    
    legend.append("line")
        .attr("x1", 0).attr("x2", 30).attr("y1", 0).attr("y2", 0)
        .attr("stroke", "#888").attr("stroke-width", 2);
    
    legend.append("text")
        .attr("x", 35).attr("y", 4)
        .style("fill", "#999").style("font-size", "11px")
        .text("Training");
    
    legend.append("line")
        .attr("x1", 0).attr("x2", 30).attr("y1", 20).attr("y2", 20)
        .attr("stroke", "#fff").attr("stroke-width", 2);
    
    legend.append("text")
        .attr("x", 35).attr("y", 24)
        .style("fill", "#999").style("font-size", "11px")
        .text("Validation");
    
    const overfit = svg.append("text")
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
        
        trainPath
            .datum(trainingLoss.slice(0, currentEpoch + 1))
            .attr("d", line);
        
        valPath
            .datum(validationLoss.slice(0, currentEpoch + 1))
            .attr("d", line);
        
        overfit.style("opacity", currentEpoch > 50 ? 0.9 : 0);
    }
    
    updateLossCurve(0);
    
    // Only animate when this section is actually visible
    const scrollSection = document.querySelector(".scroll-section");
    let isVisible = false;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
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
    
    const observerOptions = {
        root: null,
        threshold: 0.15,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    initGradientDescent();
    initBoundaryVisualization();
    initLossVisualization();
    initScrollAnimations();
});
