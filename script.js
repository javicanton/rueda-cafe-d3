document.addEventListener('DOMContentLoaded', () => {

    // 1. CONFIGURACIÓN
    // ============================
    const width = 880;
    const height = 880;
    const radius = Math.min(width, height) / 2;

    const colorPalette = {
        "Afrutado": "#DA1D23",
        "Ácido/Fermentado": "#EBB40D",
        "Verde/Vegetal": "#197A2F",
        "Otros": "#0AA3B5",
        "Tostado": "#C94930",
        "Especias": "#AD213E",
        "Frutos secos/Cacao": "#A87B64",
        "Dulce": "#E65832",
        "Floral": "#DA0D68"
    };

    const wheelRadiusScale = d3.scalePow()
        .exponent(1.3) // imita la escala radial del ejemplo original
        .domain([0, 1])
        .range([0, radius]);

    const leafTrim = radius * 0.26; // recorte del anillo exterior para que no llegue al borde

    const svg = d3.select("#coffee-wheel")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const partition = d3.partition().size([2 * Math.PI, 1]);

    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip");


    // 2. CARGA Y TRANSFORMACIÓN DE DATOS DESDE JSON
    // ==============================================
    Promise.all([d3.json("scaa-2.json"), d3.json("scaa-original.json")]).then(function([jsonData, original]) {
        const hierarchicalData = { name: jsonData.meta?.name || "Raíz", children: jsonData.data };

        // Crear la jerarquía D3 y calcular las posiciones
        const root = d3.hierarchy(hierarchicalData)
            .sum(d => d.children ? 0 : 1) // Valor para nodos hoja
            .sort((a, b) => b.value - a.value);
        
        // Copiar colores desde el JSON original por índice; fallback a paleta
        function copyColors(esNode, origNode) {
            let color = esNode.data.color;
            if (origNode && origNode.colour) {
                color = origNode.colour;
            } else if (esNode.depth === 1 && colorPalette[esNode.data.name]) {
                color = colorPalette[esNode.data.name];
            } else if (!color && esNode.parent) {
                color = esNode.parent.data.color;
            }
            esNode.data.color = color;

            const esChildren = esNode.children || [];
            const origChildren = origNode && origNode.children ? origNode.children : [];
            const max = Math.max(esChildren.length, origChildren.length);
            for (let i = 0; i < max; i++) {
                const esChild = esChildren[i];
                const origChild = origChildren[i];
                if (esChild) {
                    copyColors(esChild, origChild);
                }
            }
        }
        // construir un nodo raíz para original con children
        const origRoot = original ? { children: original.data } : null;
        root.children.forEach((child, idx) => {
            const origChild = origRoot && origRoot.children ? origRoot.children[idx] : null;
            copyColors(child, origChild);
        });
        
        partition(root);
        const maxDepth = root.height;

        const arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(0.002)
            .padRadius(radius * 1.1)
            .innerRadius(d => wheelRadiusScale(d.y0))
            .outerRadius(d => {
                const outer = wheelRadiusScale(d.y1);
                return d.depth === maxDepth ? Math.max(outer - leafTrim, wheelRadiusScale(d.y0) + 5) : outer;
            });


        // 3. DIBUJO DE LOS ARCOS (SEGMENTOS)
        // ===================================
        const nodes = root.descendants().filter(d => d.depth > 0);
        nodes.forEach((d, idx) => {
            d.data._id = idx + 1;
        });
        const nodeById = new Map(nodes.map(d => [String(d.data._id), d]));

        let pinned = null;
        let pinnedPos = { x: 0, y: 0 };

        const segment = g.selectAll("path")
            .data(nodes)
            .join("path")
            .attr("class", "segment")
            .attr("d", arc)
            .style("fill", d => d.data.color || '#ccc')
            .on("mouseover", handleMouseOver)
            .on("mousemove", handleMouseMove)
            .on("mouseout", handleMouseOut)
            .on("click", handleClick);


        // 4. DIBUJO DE LAS ETIQUETAS
        // ===========================
        const innerLabels = nodes.filter(d => d.depth < maxDepth && (d.x1 - d.x0) > 0.012);
        const leafLabels = nodes.filter(d => d.depth === maxDepth && (d.x1 - d.x0) > 0.008);

        g.selectAll("text.label")
            .data(innerLabels)
            .join("text")
            .attr("class", "label")
            .attr("transform", function(d) {
                const midAngle = (d.x0 + d.x1) / 2;
                const angleDeg = midAngle * 180 / Math.PI;
                const isRightSide = angleDeg < 180;
                const r = wheelRadiusScale(d.y0) + 8; // pegado al centro del anillo
                const rotate = angleDeg - 90;
                return `rotate(${rotate}) translate(${r},0) rotate(${isRightSide ? 0 : 180})`;
            })
            .attr("dy", "0.35em")
            .attr("text-anchor", d => {
                const midAngle = (d.x0 + d.x1) / 2;
                const angleDeg = midAngle * 180 / Math.PI;
                return angleDeg < 180 ? "start" : "end";
            })
            .style("fill", "#fff")
            .each(function(d) {
                const text = d3.select(this);
                const parts = d.data.name.split("/");
                if (parts.length > 1) {
                    text.text(null);
                    parts.forEach((p, i) => {
                        text.append("tspan")
                            .attr("x", 0)
                            .attr("dy", i === 0 ? 0 : "1.1em")
                            .text(p.trim());
                    });
                } else {
                    text.text(d.data.name);
                }
            });

        const leafGroups = g.selectAll("g.leaf-label")
            .data(leafLabels)
            .join("g")
            .attr("class", "leaf-label")
            .attr("transform", function(d) {
                const midAngle = (d.x0 + d.x1) / 2;
                const angleDeg = midAngle * 180 / Math.PI;
                const isRightSide = angleDeg < 180;
                const r = wheelRadiusScale(d.y1) - leafTrim + 8;
                const rotate = angleDeg - 90;
                return `rotate(${rotate}) translate(${r},0) rotate(${isRightSide ? 0 : 180})`;
            });

        leafGroups.append("text")
            .attr("dy", "0.35em")
            .attr("x", 0)
            .attr("text-anchor", d => {
                const midAngle = (d.x0 + d.x1) / 2;
                const angleDeg = midAngle * 180 / Math.PI;
                return angleDeg < 180 ? "start" : "end";
            })
            .text(d => d.data.name);


        // 5. FUNCIONES DE INTERACTIVIDAD
        // ===============================
        function handleMouseOver(event, d) {
            if (pinned && pinned !== d) return;
            const sequence = getAncestors(d);
            const flavorNames = sequence.map(node => node.data.name).join(" > ");

            renderTooltip(d, sequence);
            tooltip.style("opacity", 1);
            highlightOnly(d);
        }

        function handleMouseMove(event) {
            if (pinned) return;
            const padding = 14;
            tooltip
                .style("left", `${event.pageX + padding}px`)
                .style("top", `${event.pageY + padding}px`);
        }

        function handleMouseOut() {
            if (pinned) return;
            tooltip.style("opacity", 0);
            segment.classed("fade", false).classed("highlight", false);
        }

        function handleClick(event, d) {
            event.stopPropagation();
            const padding = 14;
            pinned = d;
            pinnedPos = { x: event.pageX + padding, y: event.pageY + padding };
            renderTooltip(d, getAncestors(d));
            tooltip
                .style("opacity", 1)
                .style("left", `${pinnedPos.x}px`)
                .style("top", `${pinnedPos.y}px`);
            highlightOnly(d);
        }

        // Función para obtener todos los ancestros de un nodo
        function getAncestors(node) {
            const path = [];
            let current = node;
            while (current.parent) {
                path.unshift(current);
                current = current.parent;
            }
            return path;
        }

        function highlightOnly(d) {
            segment.classed("highlight", node => node === d);
            segment.classed("fade", node => node !== d);
        }

        function renderTooltip(d, sequence) {
            const flavorNames = sequence.map(node => node.data.name).join(" > ");
            const ref = d.data.reference;
            const crumbs = sequence.map(node => `<span class="crumb" data-node-id="${node.data._id}">${node.data.name}</span>`).join("");
            let html = `<div class="tooltip-path">${crumbs}</div>`;
            html += `<div class="tooltip-title">${d.data.name}</div>`;
            if (d.data.definition) {
                html += `<div class="tooltip-def">${d.data.definition}</div>`;
            }
            if (ref && (ref.example || ref.intensity || ref.preparation)) {
                html += `<table><thead><tr><th>Referencia</th><th>Intensidad</th><th>Preparación</th></tr></thead><tbody>`;
                html += `<tr><td>${ref.example || ''}</td><td>${ref.type ? ref.type + (ref.intensity ? `: ${ref.intensity}` : '') : (ref.intensity || '')}</td><td>${ref.preparation || ''}</td></tr>`;
                html += `</tbody></table>`;
            }
            tooltip.html(html);
        }

        tooltip.on("click", (event) => {
            event.stopPropagation();
            const target = event.target.closest("[data-node-id]");
            if (target) {
                const node = nodeById.get(target.dataset.nodeId);
                if (node) {
                    pinned = node;
                    const box = tooltip.node().getBoundingClientRect();
                    pinnedPos = { x: box.left + window.scrollX, y: box.top + window.scrollY };
                    renderTooltip(node, getAncestors(node));
                    tooltip.style("opacity", 1);
                    highlightOnly(node);
                }
            }
        });

        d3.select(window).on("click", () => {
            pinned = null;
            tooltip.style("opacity", 0);
            segment.classed("highlight", false);
        });

    }).catch(function(error){
        console.error("Error al cargar o procesar el archivo JSON:", error);
    });
});
