// === Головна програма ===
const canvas = document.getElementById('familyTreeCanvas');
const ctx = canvas.getContext('2d'); // "пензлик"

// --- Налаштування ---
const COLOR_PERSON = "#e6f7ff";
const COLOR_PERSON_BORDER = "#0056b3";
const COLOR_MIYAGI_LINE = "#fff5e6";
const COLOR_SPECIAL_NODE = "#f5f5f5";
const COLOR_NOTE_NODE = "#fffbeb";
const COLOR_UNION = "#555"; // Колір вузла "союзу"

// === Функції для малювання ===

/**
 * Малює вузол "людини" (прямокутник + текст) 
 */
function drawNode(x, y, name, color = COLOR_PERSON, shape = 'rect') {
    const fontSize = 12;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textMetrics = ctx.measureText(name);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    
    const paddingX = (shape === 'note') ? 15 : 20;
    const paddingY = 10;
    
    const rectWidth = textWidth + (paddingX * 2);
    const rectHeight = textHeight + (paddingY * 2);
    const rectX = x - rectWidth / 2;
    const rectY = y - rectHeight / 2;
    
    ctx.fillStyle = color;
    ctx.strokeStyle = COLOR_PERSON_BORDER;
    ctx.lineWidth = (shape === 'note') ? 1 : 2;
    
    ctx.beginPath();
    if (shape === 'note') {
        ctx.rect(rectX, rectY, rectWidth, rectHeight);
        ctx.setLineDash([3, 3]);
    } else {
        ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 8);
        ctx.setLineDash([]);
    }
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = (shape === 'note') ? "#555" : "black";
    ctx.fillText(name, x, y);
    
    ctx.setLineDash([]);
    
    // Повертаємо повний опис вузла для розрахунку країв
    return { x: x, y: y, width: rectWidth, height: rectHeight };
}

/**
 * НОВА ФУНКЦІЯ: Обчислює точку з'єднання на краю вузла.
 * p_start - це точка, ЗВІДКИ йде лінія (напр. {x: 100, y: 100})
 * p_end_node - це вузол, КУДИ йде лінія (об'єкт з {x, y, width, height})
 */
function getEdgeConnectionPoint(p_start, p_end_node) {
    const dx = p_end_node.x - p_start.x;
    const dy = p_end_node.y - p_start.y;
    
    let x, y;
    
    // Визначаємо, чи лінія переважно вертикальна чи горизонтальна
    if (Math.abs(dy) * p_end_node.width > Math.abs(dx) * p_end_node.height) {
        // Переважно вертикальна
        if (dy > 0) { // Йде вниз
            y = p_end_node.y - p_end_node.height / 2; // Верхній край
        } else { // Йде вгору
            y = p_end_node.y + p_end_node.height / 2; // Нижній край
        }
        x = p_end_node.x; // Центр по X
    } else {
        // Переважно горизонтальна
        if (dx > 0) { // Йде вправо
            x = p_end_node.x - p_end_node.width / 2; // Лівий край
        } else { // Йде вліво
            x = p_end_node.x + p_end_node.width / 2; // Правий край
        }
        y = p_end_node.y; // Центр по Y
    }
    
    return { x: x, y: y };
}

/**
 * ОНОВЛЕНО: Малює ПРЯМУ лінію зв'язку (для "син")
 * p_start_point - точка союзу {x,y}
 * p_end_node - вузол дитини {x, y, width, height}
 */
function drawRelationship(p_start_point, p_end_node, labelText, lineColor = "black", style = "solid") {
    // Отримуємо точку на краю вузла дитини
    const p_end = getEdgeConnectionPoint(p_start_point, p_end_node);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    if (style === "dashed") ctx.setLineDash([5, 5]);
    if (style === "dotted") ctx.setLineDash([2, 2]);

    ctx.beginPath();
    ctx.moveTo(p_start_point.x, p_start_point.y);
    ctx.lineTo(p_end.x, p_end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Підпис
    const midX = (p_start_point.x + p_end.x) / 2;
    const midY = (p_start_point.y + p_end.y) / 2;
    const fontSize = 10;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textMetrics = ctx.measureText(labelText);
    const textWidth = textMetrics.width + 8;
    const textHeight = fontSize + 4;
    
    ctx.fillStyle = "white";
    ctx.fillRect(midX - textWidth / 2, midY - textHeight / 2, textWidth, textHeight);
    ctx.fillStyle = lineColor;
    ctx.fillText(labelText, midX, midY);
}

/**
 * НОВА ФУНКЦІЯ: Малює ВИГНУТУ лінію (для соціальних зв'язків)
 * p1_node, p2_node - повні об'єкти вузлів
 */
function drawSocialLink(p1_node, p2_node, labelText, lineColor = "gray", style = "solid", curveFactor = 0.2) {
    // Отримуємо точки на краях обох вузлів
    const p_start = getEdgeConnectionPoint(p2_node, p1_node);
    const p_end = getEdgeConnectionPoint(p1_node, p2_node);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    if (style === "dashed") ctx.setLineDash([5, 5]);
    if (style === "dotted") ctx.setLineDash([2, 2]);

    // Розрахунок контрольної точки для кривої
    const midX = (p_start.x + p_end.x) / 2;
    const midY = (p_start.y + p_end.y) / 2;
    const dx = p_end.x - p_start.x;
    const dy = p_end.y - p_start.y;
    
    // Перпендикулярний зсув
    const offsetX = -dy * curveFactor;
    const offsetY = dx * curveFactor;
    
    const ctrlX = midX + offsetX;
    const ctrlY = midY + offsetY;

    // Малюємо криву Безьє
    ctx.beginPath();
    ctx.moveTo(p_start.x, p_start.y);
    ctx.quadraticCurveTo(ctrlX, ctrlY, p_end.x, p_end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Підпис на контрольній точці
    const fontSize = 10;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textMetrics = ctx.measureText(labelText);
    const textWidth = textMetrics.width + 8;
    const textHeight = fontSize + 4;
    
    ctx.fillStyle = "white";
    ctx.fillRect(ctrlX - textWidth / 2, ctrlY - textHeight / 2, textWidth, textHeight);
    ctx.fillStyle = lineColor;
    ctx.fillText(labelText, ctrlX, ctrlY);
}


/**
 * ОНОВЛЕНО: Малює точку "союзу"
 * parent_nodes - масив повних об'єктів вузлів
 */
function createUnionNode(x, y, parent_nodes, lineColor = "black") {
    ctx.fillStyle = COLOR_UNION;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI); // Вузол союзу 4px
    ctx.fill();
    
    // Малюємо лінії від країв батьківських вузлів до точки
    for (const parent_node of parent_nodes) {
        const p_start = getEdgeConnectionPoint({x:x, y:y}, parent_node);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p_start.x, p_start.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    
    return { x: x, y: y }; // Повертаємо точку союзу
}

// === 1. Малюємо Вузли (НОВЕ РОЗТАШУВАННЯ) ===
// Розташування вузлів - це 90% успіху.
// Я повністю змінив його для максимальної читабельності.

// --- Група "D-Line" (Нижня частина) ---
const y_brothers = 1150;
const pos_artur = drawNode(200, y_brothers, "Артур");
const pos_sasha = drawNode(350, y_brothers, "Саша");
const pos_oleksiy = drawNode(500, y_brothers, "Олексій");
const pos_artem = drawNode(650, y_brothers, "Артем");
const pos_ivan_r = drawNode(800, y_brothers, "Іван Рижий");
const pos_vasya = drawNode(950, y_brothers, "Вася");
const pos_mark = drawNode(1100, y_brothers, "Марк");

const pos_lilya = drawNode(275, 1000, "Ліля");
const pos_dasha = drawNode(575, 1000, "Даша");
const pos_vlad = drawNode(425, 900, "Влад");


// --- Група "Цикл Вадима" (Верхній Лівий кут) ---
const pos_vadim = drawNode(300, 100, "Вадим");
const pos_vitya = drawNode(600, 100, "Вітя (Міягі)", COLOR_MIYAGI_LINE);
const pos_badabum = drawNode(450, 250, "Бадабум", COLOR_MIYAGI_LINE);
const pos_garasevych = drawNode(300, 400, "Гарасевич");
const pos_ivan_u = drawNode(450, 550, "Іван Ураган");
const pos_sasha_b = drawNode(300, 700, "Саша Бутрин");


// --- Група "A&F / Arsen" (Верхній Правий кут) ---
const pos_note_arsen = drawNode(1000, 100, "Батько втік\nв Північну Європу", COLOR_NOTE_NODE, 'note');
const pos_arsen = drawNode(1000, 250, "Арсен");
const pos_mirazh = drawNode(900, 400, "Міраж", COLOR_SPECIAL_NODE, 'note');
const pos_phoenix = drawNode(1200, 400, "Фенікс");
const pos_andriy = drawNode(1050, 550, "Андрій");
const pos_ivan_ivan = drawNode(800, 550, "Іван Іван");


// === 2. Малюємо Зв'язки ===

// -- A. Соціальні зв'язки (ВИГНУТІ ЛІНІЇ) --
// Зв'язки Міягі
drawSocialLink(pos_vadim, pos_vitya, "мама", "red", "solid", 0.1);
drawSocialLink(pos_dasha, pos_vitya, "названий батя", "blue", "dashed", 1.5); // Сильний вигин
drawSocialLink(pos_lilya, pos_vitya, "тьотя", "green", "dashed", 1.2); // Сильний вигин

// Фембої Лілі
drawSocialLink(pos_lilya, pos_artur, "фембой", "purple", "dotted", -0.3);
drawSocialLink(pos_lilya, pos_sasha, "фембой", "purple", "dotted", -0.2);
drawSocialLink(pos_lilya, pos_oleksiy, "фембой", "purple", "dotted", -0.3);

// Марк і Андрій
drawSocialLink(pos_mark, pos_andriy, "чоловіки", "darkgreen", "solid", -0.8); // Сильний вигин


// -- B. Родинні зв'язки (ПРЯМІ ЛІНІЇ) --

// Влад (син Даші і Лілі)
const union_DL = createUnionNode(425, 950, [pos_dasha, pos_lilya]);
drawRelationship(union_DL, pos_vlad, "син", "black");

// Лінія "брати Даші" (просто візуальний зв'язок)
const y_line = 1120;
ctx.strokeStyle = "gray"; ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(pos_artur.x, y_line); ctx.lineTo(pos_mark.x, y_line); ctx.stroke();
// Вертикальні риски
[pos_artur, pos_sasha, pos_oleksiy, pos_artem, pos_ivan_r, pos_vasya, pos_mark].forEach(n => {
    ctx.beginPath(); ctx.moveTo(n.x, y_line); ctx.lineTo(n.x, n.y - n.height/2); ctx.stroke();
});
// Зв'язок Даші з лінією
ctx.beginPath(); ctx.moveTo(pos_dasha.x, pos_dasha.y + pos_dasha.height/2); ctx.lineTo(pos_artem.x, y_line); ctx.stroke();


// -- C. Цикл Вадима (Червоні - циклічні) --
// Бадабум (син Віті і Вадима)
const union_VV = createUnionNode(450, 150, [pos_vitya, pos_vadim]);
drawRelationship(union_VV, pos_badabum, "син", "black");

// Гарасевич (син Бадабума і Вадима)
const union_BV = createUnionNode(350, 300, [pos_badabum, pos_vadim], "red");
drawRelationship(union_BV, pos_garasevych, "син", "red");

// Іван Ураган (син Гарасевича і Вадима)
const union_GV = createUnionNode(350, 450, [pos_garasevych, pos_vadim], "red");
drawRelationship(union_GV, pos_ivan_u, "син", "red");

// Саша Бутрин (син Івана Урагана і Вадима)
const union_IV = createUnionNode(350, 600, [pos_ivan_u, pos_vadim], "red");
drawRelationship(union_IV, pos_sasha_b, "син", "red");


// -- D. Група Андрія / Арсена --
// Арсен (син Бадабума, батько втік...)
const union_Arsen = createUnionNode(700, 200, [pos_badabum, pos_note_arsen]);
drawRelationship(union_Arsen, pos_arsen, "син", "black");

// Андрій (син Бадабума і міража)
const union_Andriy = createUnionNode(650, 400, [pos_badabum, pos_mirazh]);
drawRelationship(union_Andriy, pos_andriy, "син (від міража)", "black", "dashed");

// Іван Іван (син Бадабума, Андрія і Фенікса)
const union_BAF = createUnionNode(800, 400, [pos_badabum, pos_andriy, pos_phoenix]);
drawRelationship(union_BAF, pos_ivan_ivan, "син", "black");

// Андрій (брат Фенікса)
ctx.strokeStyle = "gray"; ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(pos_andriy.x, pos_andriy.y - pos_andriy.height/2); ctx.lineTo(pos_phoenix.x, pos_phoenix.y + pos_phoenix.height/2); ctx.stroke();