const categories = ["ability", "item", "trait", "skill", "familiar"];
const presets = [
    { name: "Bronze", min: 0.1, avg: 1.3, max: 3.3 },
    { name: "Silver", min: 0.5, avg: 2.3, max: 4.3 },
    { name: "Gold", min: 1.5, avg: 3.3, max: 5.3 },
    { name: "Platinum", min: 2.5, avg: 4.3, max: 6.3 },
    { name: "Diamond", min: 3.5, avg: 5.3, max: 7.3 },
    { name: "Legendary", min: 4.5, avg: 6.3, max: 8.3 },
    { name: "Mythical", min: 5.5, avg: 7.3, max: 9.3 },
    { name: "Divine", min: 6.5, avg: 8.3, max: 10.0 }
];

let activeCategory = "ability";
let gachaData = {};

const minInput = document.getElementById("minVal");
const avgInput = document.getElementById("avgVal");
const maxInput = document.getElementById("maxVal");
const resultEl = document.getElementById("result");
const headerEl = document.getElementById("header");
const descEl = document.getElementById("description");

fetch('data.json')
    .then(res => res.json())
    .then(data => { gachaData = data; })
    .catch(err => console.error(err));

function initUI() {
    const catContainer = document.getElementById("categories");
    categories.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        btn.onclick = () => selectCategory(cat, btn);
        if (cat === activeCategory) btn.classList.add("active");
        catContainer.appendChild(btn);
    });

    const randomBtn = document.createElement("button");
    randomBtn.textContent = "Random";
    randomBtn.onclick = () => selectCategory("random", randomBtn);
    catContainer.appendChild(randomBtn);

    const presetContainer = document.getElementById("presets");
    presets.forEach(p => {
        const btn = document.createElement("button");
        btn.textContent = p.name;
        btn.onclick = () => selectPreset(p);
        presetContainer.appendChild(btn);
    });

    selectPreset(presets[0]);
}

function selectCategory(cat, btnElement) {
    activeCategory = cat;
    document.querySelectorAll("#categories button").forEach(b => b.classList.remove("active"));
    btnElement.classList.add("active");
}

function selectPreset(preset) {
    minInput.value = preset.min.toFixed(1);
    avgInput.value = preset.avg.toFixed(1);
    maxInput.value = preset.max.toFixed(1);
}

function getTierAndColor(rarity) {
    if (rarity < 1.0) return { color: '#a39589', tier: 'Trash' };
    if (rarity < 2.0) return { color: '#9c7e5a', tier: 'Common' };
    if (rarity < 3.0) return { color: '#aed1d1', tier: 'Uncommon' };
    if (rarity < 4.0) return { color: '#11d939', tier: 'Rare' };
    if (rarity < 5.0) return { color: '#1172d9', tier: 'Elite' };
    if (rarity < 6.0) return { color: '#6811d9', tier: 'Epic' };
    if (rarity < 7.0) return { color: '#f7d40a', tier: 'Legendary' };
    if (rarity < 8.0) return { color: '#fc61ff', tier: 'Mythical' };
    if (rarity < 9.0) return { color: '#ff8c00', tier: 'Divine' };
    return { color: '#ff0000', tier: 'Transcendent' };
}

function getTargetRarity(min, max, avg) {
    let randarr = [];
    let weights = [];
    let x = min;
    let totalWeight = 0;
    
    while (x < max) {
        randarr.push(x);
        let w = 1 / Math.pow(4, Math.abs(avg - x));
        weights.push(w);
        totalWeight += w;
        x += 0.1;
    }
    
    let rand = Math.random() * totalWeight;
    let target = randarr[0];
    
    for (let i = 0; i < weights.length; i++) {
        if (rand < weights[i]) {
            target = randarr[i];
            break;
        }
        rand -= weights[i];
    }
    return target + 0.1;
}

function rollGacha() {
    let cat = activeCategory;
    if (cat === "random") {
        cat = categories[Math.floor(Math.random() * categories.length)];
    }

    if (!gachaData[cat]) return;

    const min = parseFloat(minInput.value);
    const avg = parseFloat(avgInput.value);
    const max = parseFloat(maxInput.value);

    const pool = gachaData[cat];
    let weightSum = 0;
    
    pool.forEach(item => {
        if (item.rarity > min && item.rarity <= max) {
            weightSum += (1 / Math.pow(4, Math.abs(avg - item.rarity)));
        }
    });

    let attempt = 0;
    while (attempt < 100) {
        const rarityPull = getTargetRarity(min, max, avg);
        
        let filteredItems = [];
        let filteredWeights = [];
        let totalFilteredWeight = 0;

        pool.forEach(item => {
            if (Math.abs(item.rarity - rarityPull) <= 0.2) {
                const w = 1 / Math.pow(4, Math.abs(avg - item.rarity));
                filteredItems.push({ ...item, weight: w });
                filteredWeights.push(w);
                totalFilteredWeight += w;
            }
        });

        if (filteredItems.length > 0) {
            let rand = Math.random() * totalFilteredWeight;
            let selected = filteredItems[0];
            
            for (let i = 0; i < filteredItems.length; i++) {
                if (rand < filteredWeights[i]) {
                    selected = filteredItems[i];
                    break;
                }
                rand -= filteredWeights[i];
            }

            const luck = (selected.weight / weightSum) * 100;
            const tierInfo = getTierAndColor(selected.rarity);

            headerEl.textContent = `-${tierInfo.tier} ${cat.charAt(0).toUpperCase() + cat.slice(1)}-`;
            headerEl.style.color = tierInfo.color;
            
            resultEl.textContent = `${selected.name} ${selected.rarity} (${luck.toFixed(2)}%)`;
            resultEl.style.color = tierInfo.color;
            
            descEl.textContent = selected.description.replace(/#/g, '');
            return;
        }
        attempt++;
    }
}

document.getElementById("rollBtn").addEventListener("click", rollGacha);

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

initUI();