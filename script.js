document.addEventListener('DOMContentLoaded', () => {

    const width = 1080;
    const height = 1080;
    const radius = 390;

    const leafTrim = radius * 0.26;

    const svg = d3.select("#coffee-wheel")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const partition = d3.partition().size([2 * Math.PI, 1]);

    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip");

    const copy = {
        es: {
            title: "Rueda de sabor del café",
            footnote: "Datos basados en la <em>Coffee Taster's Flavor Wheel</em> de la <abbr title=\"Specialty Coffee Association\">SCA</abbr> (2016) y el <em>Sensory Lexicon</em> de <abbr title=\"World Coffee Research\">WCR</abbr>. Traducción y adaptación al español por Javier Cantón.",
            reference: "Referencia",
            intensity: "Intensidad",
            preparation: "Preparación"
        },
        en: {
            title: "Coffee Taster's Flavor Wheel",
            footnote: "Based on the <em>Coffee Taster's Flavor Wheel</em> by the <abbr title=\"Specialty Coffee Association\">SCA</abbr> (2016) and the WCR <em>Sensory Lexicon</em>. Spanish adaptation by Javier Cantón.",
            reference: "Reference",
            intensity: "Intensity",
            preparation: "Preparation"
        }
    };

    // Ruta en inglés (orden y color SCA) → ruta en el léxico español.
    const EN_TO_ES = {
        "Fruity": "Afrutado",
        "Fruity > Berry": "Afrutado > Bayas",
        "Fruity > Berry > Blackberry": "Afrutado > Bayas > Mora",
        "Fruity > Berry > Raspberry": "Afrutado > Bayas > Frambuesa",
        "Fruity > Berry > Blueberry": "Afrutado > Bayas > Arándano",
        "Fruity > Berry > Strawberry": "Afrutado > Bayas > Fresa",
        "Fruity > Dried fruit": "Afrutado > Frutas secas",
        "Fruity > Dried fruit > Raisin": "Afrutado > Frutas secas > Uva pasa",
        "Fruity > Dried fruit > Prune": "Afrutado > Frutas secas > Ciruela pasa",
        "Fruity > Other fruit": "Afrutado > Otras frutas",
        "Fruity > Other fruit > Coconut": "Afrutado > Otras frutas > Coco",
        "Fruity > Other fruit > Cherry": "Afrutado > Otras frutas > Cereza",
        "Fruity > Other fruit > Pomegranate": "Afrutado > Otras frutas > Granada",
        "Fruity > Other fruit > Pineapple": "Afrutado > Otras frutas > Piña",
        "Fruity > Other fruit > Grape": "Afrutado > Otras frutas > Uva",
        "Fruity > Other fruit > Apple": "Afrutado > Otras frutas > Manzana",
        "Fruity > Other fruit > Peach": "Afrutado > Otras frutas > Melocotón",
        "Fruity > Other fruit > Pear": "Afrutado > Otras frutas > Pera",
        "Fruity > Citrus fruit": "Afrutado > Frutas cítricas",
        "Fruity > Citrus fruit > Grapefruit": "Afrutado > Frutas cítricas > Pomelo",
        "Fruity > Citrus fruit > Orange": "Afrutado > Frutas cítricas > Naranja",
        "Fruity > Citrus fruit > Lemon": "Afrutado > Frutas cítricas > Limón",
        "Fruity > Citrus fruit > Lime": "Afrutado > Frutas cítricas > Lima",
        "Sour/Fermented": "Ácido/Fermentado",
        "Sour/Fermented > Sour": "Ácido/Fermentado > Ácido",
        "Sour/Fermented > Sour > Sour aromatics": "Ácido/Fermentado > Ácido > Aromáticos agrios",
        "Sour/Fermented > Sour > Acetic acid": "Ácido/Fermentado > Ácido > Ácido acético",
        "Sour/Fermented > Sour > Butyric acid": "Ácido/Fermentado > Ácido > Ácido butírico",
        "Sour/Fermented > Sour > Isovaleric acid": "Ácido/Fermentado > Ácido > Ácido isovalérico",
        "Sour/Fermented > Sour > Citric acid": "Ácido/Fermentado > Ácido > Ácido cítrico",
        "Sour/Fermented > Sour > Malic acid": "Ácido/Fermentado > Ácido > Ácido málico",
        "Sour/Fermented > Alcohol/Fermented": "Ácido/Fermentado > Alcohol/Fermentado",
        "Sour/Fermented > Alcohol/Fermented > Winey": "Ácido/Fermentado > Alcohol/Fermentado > Vinoso",
        "Sour/Fermented > Alcohol/Fermented > Whiskey": "Ácido/Fermentado > Alcohol/Fermentado > Whiskey",
        "Sour/Fermented > Alcohol/Fermented > Fermented": "Ácido/Fermentado > Alcohol/Fermentado > Fermentado",
        "Sour/Fermented > Alcohol/Fermented > Overripe": "Ácido/Fermentado > Alcohol/Fermentado > Excesivamente maduro",
        "Green/Vegetative": "Verde/Vegetal",
        "Green/Vegetative > Olive oil": "Verde/Vegetal > Aceite de oliva",
        "Green/Vegetative > Raw": "Verde/Vegetal > Crudo",
        "Green/Vegetative > Green/Vegetative": "Verde/Vegetal > Verde/Vegetal",
        "Green/Vegetative > Green/Vegetative > Under-ripe": "Verde/Vegetal > Verde/Vegetal > Inmaduro",
        "Green/Vegetative > Green/Vegetative > Peapod": "Verde/Vegetal > Verde/Vegetal > Vaina de guisante",
        "Green/Vegetative > Green/Vegetative > Fresh": "Verde/Vegetal > Verde/Vegetal > Verde fresco",
        "Green/Vegetative > Green/Vegetative > Dark green": "Verde/Vegetal > Verde/Vegetal > Verde oscuro",
        "Green/Vegetative > Green/Vegetative > Vegetative": "Verde/Vegetal > Verde/Vegetal > Vegetal",
        "Green/Vegetative > Green/Vegetative > Hay-like": "Verde/Vegetal > Verde/Vegetal > Heno",
        "Green/Vegetative > Green/Vegetative > Herb-like": "Verde/Vegetal > Verde/Vegetal > Herbal",
        "Green/Vegetative > Beany": "Verde/Vegetal > Leguminoso",
        "Other": "Otros",
        "Other > Papery/Musty": "Otros > Papel/Humedad",
        "Other > Papery/Musty > Stale": "Otros > Papel/Humedad > Rancio",
        "Other > Papery/Musty > Cardboard": "Otros > Papel/Humedad > Cartón",
        "Other > Papery/Musty > Papery": "Otros > Papel/Humedad > Papel",
        "Other > Papery/Musty > Woody": "Otros > Papel/Humedad > Madera",
        "Other > Papery/Musty > Moldy/Damp": "Otros > Papel/Humedad > Mohoso/Húmedo",
        "Other > Papery/Musty > Musty/Dusty": "Otros > Papel/Humedad > Rancio/Polvo",
        "Other > Papery/Musty > Musty/Earthy": "Otros > Papel/Humedad > Rancio/Tierra",
        "Other > Papery/Musty > Animalic": "Otros > Papel/Humedad > Animal",
        "Other > Papery/Musty > Meaty/Brothy": "Otros > Papel/Humedad > Carne/Caldo",
        "Other > Papery/Musty > Phenolic": "Otros > Papel/Humedad > Fenólico",
        "Other > Chemical": "Otros > Químico",
        "Other > Chemical > Bitter": "Otros > Químico > Amargo",
        "Other > Chemical > Salty": "Otros > Químico > Salado",
        "Other > Chemical > Medicinal": "Otros > Químico > Medicinal",
        "Other > Chemical > Petroleum": "Otros > Químico > Petróleo",
        "Other > Chemical > Skunky": "Otros > Químico > Zorrillo",
        "Other > Chemical > Rubber": "Otros > Químico > Goma",
        "Roasted": "Tostado",
        "Roasted > Pipe tobacco": "Tostado > Tabaco de pipa",
        "Roasted > Tobacco": "Tostado > Tabaco",
        "Roasted > Burnt": "Tostado > Quemado",
        "Roasted > Burnt > Acrid": "Tostado > Quemado > Acre",
        "Roasted > Burnt > Ashy": "Tostado > Quemado > Ceniza",
        "Roasted > Burnt > Smoky": "Tostado > Quemado > Humo",
        "Roasted > Burnt > Brown, Roast": "Tostado > Quemado > Marrón, tostado",
        "Roasted > Cereal": "Tostado > Cereal",
        "Roasted > Cereal > Grain": "Tostado > Cereal > Grano",
        "Roasted > Cereal > Malt": "Tostado > Cereal > Malta",
        "Spices": "Especias",
        "Spices > Pungent": "Especias > Picante",
        "Spices > Pepper": "Especias > Pimienta",
        "Spices > Brown spice": "Especias > Especias marrones",
        "Spices > Brown spice > Anise": "Especias > Especias marrones > Anís",
        "Spices > Brown spice > Nutmeg": "Especias > Especias marrones > Nuez moscada",
        "Spices > Brown spice > Cinnamon": "Especias > Especias marrones > Canela",
        "Spices > Brown spice > Clove": "Especias > Especias marrones > Clavo",
        "Nutty/Cocoa": "Frutos secos/Cacao",
        "Nutty/Cocoa > Nutty": "Frutos secos/Cacao > Frutos secos",
        "Nutty/Cocoa > Nutty > Peanuts": "Frutos secos/Cacao > Frutos secos > Cacahuete",
        "Nutty/Cocoa > Nutty > Hazelnut": "Frutos secos/Cacao > Frutos secos > Avellana",
        "Nutty/Cocoa > Nutty > Almond": "Frutos secos/Cacao > Frutos secos > Almendra",
        "Nutty/Cocoa > Cocoa": "Frutos secos/Cacao > Cacao",
        "Nutty/Cocoa > Cocoa > Chocolate": "Frutos secos/Cacao > Cacao > Chocolate",
        "Nutty/Cocoa > Cocoa > Dark chocolate": "Frutos secos/Cacao > Cacao > Chocolate negro",
        "Sweet": "Dulce",
        "Sweet > Brown sugar": "Dulce > Azúcar moreno",
        "Sweet > Brown sugar > Molasses": "Dulce > Azúcar moreno > Melaza",
        "Sweet > Brown sugar > Mapple syrup": "Dulce > Azúcar moreno > Jarabe de arce",
        "Sweet > Brown sugar > Caramelized": "Dulce > Azúcar moreno > Caramelizado",
        "Sweet > Brown sugar > Honey": "Dulce > Azúcar moreno > Miel",
        "Sweet > Vanilla": "Dulce > Vainilla",
        "Sweet > Vanillin": "Dulce > Vainillina",
        "Sweet > Overall sweet": {
            name: "Dulzor general",
            definition: "Impresión general de dulzor en boca, sin un aromático dulce concreto."
        },
        "Sweet > Sweet Aromatics": "Dulce > Aromáticos dulces",
        "Floral": "Floral",
        "Floral > Black Tea": "Floral > Té negro",
        "Floral > Floral": "Floral > Floral",
        "Floral > Floral > Chamomile": "Floral > Floral > Manzanilla",
        "Floral > Floral > Rose": "Floral > Floral > Rosa",
        "Floral > Floral > Jasmine": "Floral > Floral > Jazmín"
    };

    let lang = "es";
    try {
        const stored = localStorage.getItem("rueda-lang");
        if (stored === "en" || stored === "es") lang = stored;
    } catch (error) {
        lang = "es";
    }

    let nodeById = new Map();
    let segment = null;
    let pinned = null;

    function indexByPath(nodes, prefix, map) {
        nodes.forEach(node => {
            const path = prefix ? `${prefix} > ${node.name}` : node.name;
            map.set(path, node);
            if (node.children) indexByPath(node.children, path, map);
        });
        return map;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function channel(value) {
        const v = value / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }

    function labelFill(hex) {
        const color = d3.color(hex);
        if (!color) return "#ffffff";
        const luma = 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
        const contrastWhite = 1.05 / (luma + 0.05);
        const contrastBlack = (luma + 0.05) / 0.05;
        return contrastBlack > contrastWhite ? "#1a1a1a" : "#ffffff";
    }

    function meaningful(value) {
        return value !== undefined && value !== null && String(value).trim() !== "" && String(value).trim() !== "—";
    }

    function normalizeEnglishReference(node) {
        const source = (node.references || [])[0];
        if (!source) return null;
        const hasFlavor = meaningful(source.flavor);
        const hasAroma = meaningful(source.aroma);
        if (hasFlavor) {
            return {
                example: source.reference || "",
                type: "Flavor",
                intensity: String(source.flavor),
                preparation: source.flavor_preparation || ""
            };
        }
        if (hasAroma) {
            return {
                example: source.reference || "",
                type: "Aroma",
                intensity: String(source.aroma),
                preparation: source.aroma_preparation || ""
            };
        }
        if (meaningful(source.reference)) {
            return { example: source.reference, type: "", intensity: "", preparation: "" };
        }
        return null;
    }

    function spanishContent(enPath, esIndex) {
        const spec = EN_TO_ES[enPath];
        if (!spec) return null;
        if (typeof spec === "string") {
            const node = esIndex.get(spec);
            if (!node) {
                console.warn("Falta la traducción española de", enPath, "→", spec);
                return null;
            }
            return {
                name: node.name,
                definition: node.definition || "",
                reference: node.reference || null
            };
        }
        return {
            name: spec.name,
            definition: spec.definition || "",
            reference: spec.reference || null
        };
    }

    function toDisplayNode(enNode, enPath, esIndex) {
        const localized = lang === "es" ? spanishContent(enPath, esIndex) : null;
        const reference = localized ? localized.reference : normalizeEnglishReference(enNode);
        const children = (enNode.children || []).map(child => {
            const childPath = `${enPath} > ${child.name}`;
            return toDisplayNode(child, childPath, esIndex);
        });
        const node = {
            name: localized ? localized.name : (enNode.name === "Mapple syrup" ? "Maple syrup" : enNode.name),
            color: enNode.colour || "#cccccc",
            definition: localized ? localized.definition : (enNode.definition || ""),
            reference: reference
        };
        if (children.length) node.children = children;
        return node;
    }

    function labelLines(name) {
        if (name.includes("/")) return name.split("/").map(part => part.trim()).filter(Boolean);
        if (name.includes(",")) return name.split(",").map(part => part.trim()).filter(Boolean);
        const words = name.split(/\s+/).filter(Boolean);
        if (words.length === 3 && words[1].length <= 3) {
            return [words[0], words.slice(1).join(" ")];
        }
        if (words.length > 1 && name.length > 14) {
            const mid = Math.ceil(words.length / 2);
            return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
        }
        return [name];
    }

    const hub = 46;

    function radiusAt(t) {
        const clamped = Math.max(0, Math.min(1, t));
        return hub + (radius - hub) * Math.pow(clamped, 1.3);
    }

    function syncChrome() {
        const strings = copy[lang];
        document.documentElement.lang = lang;
        document.title = strings.title;
        document.getElementById("wheel-title").textContent = strings.title;
        document.getElementById("footnote").innerHTML = strings.footnote;
        document.querySelectorAll(".lang-tab").forEach(button => {
            const active = button.dataset.lang === lang;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-selected", active ? "true" : "false");
        });
    }

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
        if (!segment) return;
        segment.classed("highlight", node => node === d);
        segment.classed("fade", node => node !== d);
    }

    function clearPin() {
        pinned = null;
        tooltip.style("opacity", 0);
        if (segment) segment.classed("highlight", false).classed("fade", false);
    }

    function renderTooltip(d, sequence) {
        const strings = copy[lang];
        const ref = d.data.reference;
        const crumbs = sequence
            .map(node => `<span class="crumb" data-node-id="${node.data._id}">${escapeHtml(node.data.name)}</span>`)
            .join("");
        let html = `<div class="tooltip-path">${crumbs}</div>`;
        html += `<div class="tooltip-title">${escapeHtml(d.data.name)}</div>`;
        if (d.data.definition) {
            html += `<div class="tooltip-def">${escapeHtml(d.data.definition)}</div>`;
        }
        if (ref) {
            const hasIntensity = meaningful(ref.intensity);
            const hasPrep = meaningful(ref.preparation);
            const hasExample = meaningful(ref.example);
            if (hasExample || hasIntensity || hasPrep) {
                const intensityText = hasIntensity
                    ? (meaningful(ref.type) ? `${ref.type}: ${ref.intensity}` : ref.intensity)
                    : "";
                html += "<table><thead><tr>";
                if (hasExample) html += `<th>${strings.reference}</th>`;
                if (hasIntensity) html += `<th>${strings.intensity}</th>`;
                if (hasPrep) html += `<th>${strings.preparation}</th>`;
                html += "</tr></thead><tbody><tr>";
                if (hasExample) html += `<td>${escapeHtml(ref.example)}</td>`;
                if (hasIntensity) html += `<td>${escapeHtml(intensityText)}</td>`;
                if (hasPrep) html += `<td>${escapeHtml(ref.preparation)}</td>`;
                html += "</tr></tbody></table>";
            }
        }
        tooltip.html(html);
    }

    Promise.all([d3.json("scaa-2.json"), d3.json("scaa-original.json")]).then(([esJson, enJson]) => {
        const esIndex = indexByPath(esJson.data, "", new Map());

        function render() {
            clearPin();
            g.selectAll("*").remove();

            const hierarchicalData = {
                name: lang === "es" ? copy.es.title : copy.en.title,
                children: enJson.data.map(node => toDisplayNode(node, node.name, esIndex))
            };

            const root = d3.hierarchy(hierarchicalData)
                .sum(d => d.children && d.children.length ? 0 : 1);

            partition(root);
            const maxDepth = root.height;

            const arc = d3.arc()
                .startAngle(d => d.x0)
                .endAngle(d => d.x1)
                .padAngle(0.001)
                .padRadius(radius)
                .innerRadius(d => radiusAt((d.depth - 1) / maxDepth))
                .outerRadius(d => {
                    const outer = radiusAt(d.depth / maxDepth);
                    const inner = radiusAt((d.depth - 1) / maxDepth);
                    return d.depth === maxDepth ? Math.max(outer - leafTrim, inner + 8) : outer;
                });

            const nodes = root.descendants().filter(d => d.depth > 0);
            nodes.forEach((d, idx) => {
                d.data._id = idx + 1;
            });
            nodeById = new Map(nodes.map(d => [String(d.data._id), d]));

            segment = g.selectAll("path")
                .data(nodes)
                .join("path")
                .attr("class", "segment")
                .attr("d", arc)
                .style("fill", d => d.data.color || "#ccc")
                .on("mouseover", handleMouseOver)
                .on("mousemove", handleMouseMove)
                .on("mouseout", handleMouseOut)
                .on("click", handleClick);

            const innerLabels = nodes.filter(d => d.depth < maxDepth && (d.x1 - d.x0) > 0.012);
            const leafLabels = nodes.filter(d => d.depth === maxDepth && (d.x1 - d.x0) > 0.008);

            g.selectAll("text.label")
                .data(innerLabels)
                .join("text")
                .attr("class", "label")
                .attr("transform", function(d) {
                    const midAngle = (d.x0 + d.x1) / 2;
                    const angleDeg = midAngle * 180 / Math.PI;
                    const isRightSide = Math.sin(midAngle) >= 0;
                    const r = radiusAt((d.depth - 1) / maxDepth) + 8;
                    const rotate = angleDeg - 90;
                    return `rotate(${rotate}) translate(${r},0) rotate(${isRightSide ? 0 : 180})`;
                })
                .attr("dy", "0.35em")
                .attr("text-anchor", d => {
                    const midAngle = (d.x0 + d.x1) / 2;
                    return Math.sin(midAngle) >= 0 ? "start" : "end";
                })
                .style("fill", d => labelFill(d.data.color))
                .style("font-size", d => {
                    const inner = radiusAt((d.depth - 1) / maxDepth);
                    const outer = radiusAt(d.depth / maxDepth);
                    const room = Math.max(18, outer - inner - 18);
                    const longest = Math.max(...labelLines(d.data.name).map(line => line.length));
                    const base = d.depth === 1 ? 12 : 10;
                    const estimated = longest * base * 0.74;
                    const size = estimated > room ? Math.max(7.5, base * room / estimated) : base;
                    return `${size.toFixed(2)}px`;
                })
                .style("font-weight", d => d.depth === 1 ? 600 : 500)
                .each(function(d) {
                    const text = d3.select(this);
                    const parts = labelLines(d.data.name);
                    text.text(null);
                    parts.forEach((part, i) => {
                        text.append("tspan")
                            .attr("x", 0)
                            .attr("dy", i === 0 ? 0 : "1.15em")
                            .text(part);
                    });
                });

            const leafGroups = g.selectAll("g.leaf-label")
                .data(leafLabels)
                .join("g")
                .attr("class", "leaf-label")
                .attr("transform", function(d) {
                    const midAngle = (d.x0 + d.x1) / 2;
                    const angleDeg = midAngle * 180 / Math.PI;
                    const isRightSide = Math.sin(midAngle) >= 0;
                    const r = radiusAt(1) - leafTrim + 14;
                    const rotate = angleDeg - 90;
                    return `rotate(${rotate}) translate(${r},0) rotate(${isRightSide ? 0 : 180})`;
                });

            leafGroups.append("text")
                .attr("dy", "0.35em")
                .attr("x", d => {
                    const midAngle = (d.x0 + d.x1) / 2;
                    return Math.sin(midAngle) >= 0 ? 4 : -4;
                })
                .attr("text-anchor", d => {
                    const midAngle = (d.x0 + d.x1) / 2;
                    return Math.sin(midAngle) >= 0 ? "start" : "end";
                })
                .text(d => d.data.name);

            function handleMouseOver(event, d) {
                if (pinned && pinned !== d) return;
                renderTooltip(d, getAncestors(d));
                tooltip.style("opacity", 1);
                highlightOnly(d);
            }

            function handleMouseMove(event) {
                if (pinned) return;
                tooltip
                    .style("left", `${event.pageX + 14}px`)
                    .style("top", `${event.pageY + 14}px`);
            }

            function handleMouseOut() {
                if (pinned) return;
                tooltip.style("opacity", 0);
                segment.classed("fade", false).classed("highlight", false);
            }

            function handleClick(event, d) {
                event.stopPropagation();
                pinned = d;
                renderTooltip(d, getAncestors(d));
                tooltip
                    .style("opacity", 1)
                    .style("left", `${event.pageX + 14}px`)
                    .style("top", `${event.pageY + 14}px`);
                highlightOnly(d);
            }
        }

        tooltip.on("click", (event) => {
            event.stopPropagation();
            const target = event.target.closest("[data-node-id]");
            if (!target) return;
            const node = nodeById.get(target.dataset.nodeId);
            if (!node) return;
            pinned = node;
            renderTooltip(node, getAncestors(node));
            tooltip.style("opacity", 1);
            highlightOnly(node);
        });

        d3.select(window).on("click.wheel", () => {
            clearPin();
        });

        d3.selectAll(".lang-tab").on("click", (event) => {
            event.stopPropagation();
            const next = event.currentTarget.dataset.lang;
            if (next !== "es" && next !== "en") return;
            if (next === lang) return;
            lang = next;
            try {
                localStorage.setItem("rueda-lang", lang);
            } catch (error) {
                /* sin almacenamiento local la elección vale solo esta visita */
            }
            syncChrome();
            render();
        });

        syncChrome();
        render();
    }).catch(error => {
        console.error("Error al cargar o procesar el archivo JSON:", error);
    });
});
