document.addEventListener('DOMContentLoaded', () => {

    // 1. CONFIGURACIÓN
    // ============================
    const width = 800;
    const height = 800;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select("#coffee-wheel")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const partition = d3.partition();


    // 2. CARGA Y TRANSFORMACIÓN DE DATOS DESDE CSV
    // ==============================================
    d3.csv("coffee_flavor_wheel.csv").then(function(csvData) {
        
        // Función para convertir el CSV plano a una estructura jerárquica (JSON)
        function transformData(data) {
            const root = { name: "Raíz", children: [] };
            const level1Map = new Map();

            data.forEach(row => {
                // Procesar Nivel1
                if (!level1Map.has(row.Nivel1)) {
                    const l1Node = { name: row.Nivel1, color: row.Color, children: [] };
                    level1Map.set(row.Nivel1, l1Node);
                    root.children.push(l1Node);
                }
                let currentNode = level1Map.get(row.Nivel1);

                // Procesar Nivel2
                if (row.Nivel2) {
                    let l2Node = currentNode.children.find(child => child.name === row.Nivel2);
                    if (!l2Node) {
                        l2Node = { name: row.Nivel2, color: row.Color || currentNode.color, children: [] };
                        currentNode.children.push(l2Node);
                    }
                    currentNode = l2Node;
                }

                // Procesar Nivel3
                if (row.Nivel3) {
                    let l3Node = currentNode.children.find(child => child.name === row.Nivel3);
                    if (!l3Node) {
                        l3Node = { name: row.Nivel3, color: row.Color || currentNode.color };
                        currentNode.children.push(l3Node);
                    }
                    currentNode = l3Node;
                }
                
                // Añadir la definición al nodo más profundo
                if (row['Definición (Lexicon)']) {
                    currentNode.definition = row['Definición (Lexicon)'];
                }
            });
            return root;
        }

        const hierarchicalData = transformData(csvData);

        // Crear la jerarquía D3 y calcular las posiciones
        const root = d3.hierarchy(hierarchicalData)
            .sum(d => d.children ? 0 : 1) // Valor para nodos hoja
            .sort((a, b) => b.value - a.value);
        
        // Ajustar el layout para que cada nivel tenga el mismo grosor radial
        partition.size([2 * Math.PI, root.height + 1])(root);
        const radialScale = radius / (root.height + 1); // Escala para traducir niveles a píxeles

        const arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(1 / radius)
            .padRadius(radius * 1.15)
            .innerRadius(d => d.y0 * radialScale)
            .outerRadius(d => d.y1 * radialScale - 1);


        // 3. DIBUJO DE LOS ARCOS (SEGMENTOS)
        // ===================================
        const nodes = root.descendants().filter(d => d.depth > 0);

        const segment = g.selectAll("path")
            .data(nodes)
            .join("path")
            .attr("class", "segment")
            .attr("d", arc)
            .style("fill", d => d.data.color || '#ccc')
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut);


        // 4. DIBUJO DE LAS ETIQUETAS
        // ===========================
        const label = g.selectAll("text")
            .data(nodes.filter(d => {
                // Mostrar solo etiquetas que quepan en el arco
                return (d.x1 - d.x0) > 0.012;
            }))
            .join("text")
            .attr("class", "label")
            .attr("transform", function(d) {
                const angle = ((d.x0 + d.x1) / 2) * 180 / Math.PI;
                const r = ((d.y0 + d.y1) / 2) * radialScale;
                const rotate = angle - 90;
                const flip = angle >= 180 ? 180 : 0;
                return `rotate(${rotate}) translate(${r},0) rotate(${flip})`;
            })
            .attr("dy", "0.35em")
            .text(d => d.data.name);


        // 5. FUNCIONES DE INTERACTIVIDAD
        // ===============================
        function handleMouseOver(event, d) {
            const sequence = getAncestors(d);
            const flavorNames = sequence.map(node => node.data.name).join(" > ");
            const definition = d.data.definition || "";

            // Actualizar el texto de información
            d3.select("#selected-flavor-path").text(flavorNames);
            d3.select("#selected-flavor-description").text(definition);

            // Resaltar la trayectoria
            segment.classed("fade", true);
            segment.classed("highlight", node => sequence.includes(node));
        }

        function handleMouseOut() {
            // Restaura la visualización
            d3.select("#selected-flavor-path").text("Pasa el ratón sobre la rueda");
            d3.select("#selected-flavor-description").text("");
            segment.classed("fade", false).classed("highlight", false);
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

    }).catch(function(error){
        console.error("Error al cargar o procesar el archivo CSV:", error);
        d3.select("#flavor-info").html("<h2>Error</h2><p>No se pudo cargar el archivo 'coffee_flavor_wheel.csv'. Asegúrate de que esté en la misma carpeta que el archivo HTML.</p>");
    });
});
