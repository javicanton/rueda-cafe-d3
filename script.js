document.addEventListener('DOMContentLoaded', () => {

    // 1. CONFIGURACIÓN Y DATOS
    // ============================
    const width = 700;
    const height = 700;
    const radius = Math.min(width, height) / 2;

    const flavorData = {
        name: "Café",
        children: [
            {
                name: "Frutal / Floral",
                children: [
                    {
                        name: "Frutal",
                        children: [
                            { name: "Baya" },
                            { name: "Cítrico" },
                            { name: "Fruta Drupa" },
                            { name: "Otras Frutas" }
                        ]
                    },
                    {
                        name: "Floral",
                        children: [
                            { name: "Flor Negra" },
                            { name: "Flor Blanca" }
                        ]
                    }
                ]
            },
            {
                name: "Dulce",
                children: [
                    {
                        name: "Panela / Miel",
                        children: [
                            { name: "Miel" },
                            { name: "Panela" },
                            { name: "Melaza" }
                        ]
                    },
                    {
                        name: "Chocolate",
                        children: [
                            { name: "Chocolate Negro" },
                            { name: "Chocolate con Leche" }
                        ]
                    },
                    {
                        name: "Caramelo",
                        children: [
                            { name: "Caramelo" },
                            { name: "Tostado" },
                            { name: "Grano Tostado" }
                        ]
                    }
                ]
            },
            {
                name: "Especiado / Vegetal",
                children: [
                    {
                        name: "Especiado",
                        children: [
                            { name: "Canela" },
                            { name: "Clavo" },
                            { name: "Nuez Moscada" },
                            { name: "Pimienta" }
                        ]
                    },
                    {
                        name: "Vegetal",
                        children: [
                            { name: "Fresco" },
                            { name: "Verde Oscuro" },
                            { name: "Legumbre" }
                        ]
                    }
                ]
            },
            {
                name: "Tostado / Cereal",
                children: [
                    {
                        name: "Grano / Cereal",
                        children: [
                            { name: "Cereal" },
                            { name: "Malteado" }
                        ]
                    },
                    {
                        name: "Tostado",
                        children: [
                            { name: "Tostado" },
                            { name: "Ahumado" },
                            { name: "Ceniza" }
                        ]
                    },
                    {
                        name: "Frutos Secos / Cacao",
                        children: [
                            { name: "Cacao" },
                            { name: "Frutos Secos" }
                        ]
                    }
                ]
            },
            {
                name: "Otros",
                children: [
                    {
                        name: "Químico",
                        children: [
                            { name: "Medicinal" },
                            { name: "Goma" },
                            { name: "Plástico" }
                        ]
                    },
                    {
                        name: "Papel / Tierra",
                        children: [
                            { name: "Papel" },
                            { name: "Cartón" },
                            { name: "Tierra" },
                            { name: "Polvo" }
                        ]
                    }
                ]
            }
        ]
    };

    // Paleta de colores. D3 la asignará automáticamente.
    const color = d3.scaleOrdinal(d3.schemeSet3);


    // 2. CREACIÓN DEL SVG Y LAYOUT
    // ============================
    const svg = d3.select("#coffee-wheel")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Crea el layout de partición (sunburst)
    const partition = d3.partition()
        .size([2 * Math.PI, radius]);

    // Convierte los datos en una jerarquía
    const root = d3.hierarchy(flavorData)
        .sum(d => d.children ? 0 : 1) // Asigna un valor a los nodos hoja
        .sort((a, b) => b.value - a.value);

    // Calcula las posiciones de los segmentos
    partition(root);


    // 3. DIBUJO DE LOS ARCOS (SEGMENTOS)
    // ===================================
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);

    const segment = g.selectAll("path")
        .data(root.descendants())
        .join("path")
        .attr("class", "segment")
        .attr("d", arc)
        .style("fill", d => {
            // Asigna un color basado en la profundidad en la jerarquía
            if (d.depth === 0) return "#fff"; // Centro blanco
            while (d.depth > 1) d = d.parent;
            return color(d.data.name);
        })
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);


    // 4. DIBUJO DE LAS ETIQUETAS
    // ===========================
    const label = g.selectAll("text")
        .data(root.descendants().filter(d => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 15)) // Filtra para mostrar solo etiquetas que quepan
        .join("text")
        .attr("class", "label")
        .attr("transform", function(d) {
            const x = (d.x0 + d.x1) / 2;
            const y = (d.y0 + d.y1) / 2;
            const rotation = x < Math.PI ? (x * 180 / Math.PI - 90) : (x * 180 / Math.PI + 90);
            return `rotate(${rotation}) translate(${y},0) rotate(${rotation < 0 ? 180 : 0})`;
        })
        .attr("dy", "0.35em")
        .text(d => d.data.name);


    // 5. FUNCIONES DE INTERACTIVIDAD
    // ===============================
    function handleMouseOver(event, d) {
        const sequence = getAncestors(d);
        const flavorNames = sequence.map(node => node.data.name).join(" > ");

        // Actualiza el texto de información
        d3.select("#selected-flavor").text(flavorNames);

        // Resalta la trayectoria
        segment.classed("fade", true);
        segment.classed("highlight", node => sequence.includes(node));
    }

    function handleMouseOut() {
        // Restaura la visualización
        d3.select("#selected-flavor").text("Pasa el ratón sobre la rueda");
        segment.classed("fade", false).classed("highlight", false);
    }

    // Función para obtener todos los ancestros de un nodo en la jerarquía
    function getAncestors(node) {
        const path = [];
        let current = node;
        while (current.parent) {
            path.unshift(current);
            current = current.parent;
        }
        return path;
    }
});