document.addEventListener('DOMContentLoaded', () => {

    // 1. CONFIGURACIÓN
    // ============================
    const width = 800;
    const height = 800;
    const radius = Math.min(width, height) / 2;

    const wheelRadiusScale = d3.scalePow()
        .exponent(1.3) // imita la escala radial del ejemplo original
        .domain([0, 1])
        .range([0, radius]);

    const angleScale = d3.scaleLinear().range([0, 2 * Math.PI]);
    const leafTrim = radius * 0.26; // recorte del anillo exterior para que no llegue al borde

    const svg = d3.select("#coffee-wheel")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const partition = d3.partition().size([2 * Math.PI, 1]);


    // 2. CARGA Y TRANSFORMACIÓN DE DATOS DESDE JSON
    // ==============================================
    d3.json("scaa-2.json").then(function(jsonData) {
        const hierarchicalData = { name: jsonData.meta?.name || "Raíz", children: jsonData.data };

        // Crear la jerarquía D3 y calcular las posiciones
        const root = d3.hierarchy(hierarchicalData)
            .sum(d => d.children ? 0 : 1) // Valor para nodos hoja
            .sort((a, b) => b.value - a.value);
        
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
                const midAngle = (d.x0 + d.x1) / 2;
                const angleDeg = midAngle * 180 / Math.PI;
                const isRightSide = angleDeg < 90 || angleDeg > 270;
                const r = wheelRadiusScale((d.y0 + d.y1) / 2) - (d.depth === maxDepth ? leafTrim / 2 : 0);
                const rotate = angleDeg - 90;
                return `rotate(${rotate}) translate(${r},0) rotate(${isRightSide ? 0 : 180})`;
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
        console.error("Error al cargar o procesar el archivo JSON:", error);
        d3.select("#flavor-info").html("<h2>Error</h2><p>No se pudo cargar el archivo 'scaa-2.json'. Asegúrate de que esté en la misma carpeta que el archivo HTML.</p>");
    });
});
