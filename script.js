const API_URL = "http://localhost:5000";

let chart;

// ===================== 模板定义 =====================
const TEMPLATES = {
  PEEL: ["Point", "Evidence", "Explain", "Link"],
  PEEEL: ["Point", "Example", "Evidence", "Explain", "Link"],
  PETAL: ["Point", "Example", "Technique", "Analysis", "Link"],
  PEELL: ["Point", "Evidence", "Explain", "Link", "Link"]
};

let selectedBlock = null;

// ===================== 切换模板（清空 + 重建）=====================
function loadTemplate() {
  const selected = document.getElementById("template-select").value;
  renderDynamicBlocks(TEMPLATES[selected]);
  updateAll();
}

// ===================== 动态渲染区块 =====================
function renderDynamicBlocks(blockNames) {
  const container = document.getElementById("dynamic-blocks");
  container.innerHTML = "";

  const typeMap = {
    "Point": "point",
    "Evidence": "evidence",
    "Example": "evidence",
    "Explain": "explain",
    "Analysis": "explain",
    "Technique": "explain",
    "Link": "link"
  };

  blockNames.forEach((name, index) => {
    addBlockUI(name, index + 1, typeMap[name] || "none");
  });
}

function addBlockUI(name, number, type = null) {
  const container = document.getElementById("dynamic-blocks");
  const id = name.toLowerCase().replace(/\s+/g, "-");
  const html = `
    <div class="input-group" data-block="${name}" data-type="${type}" onclick="selectBlock(this)">
      <label for="${id}" class="input-label">
        ${number}. <span class="block-name">${name}</span>
        <button onclick="renameBlock(this, event)" style="margin-left:8px; font-size:12px; padding:2px 6px;">✏️</button>
      </label>
      <textarea id="${id}"
                placeholder="Write your ${name} here..."
                oninput="updateAll()"></textarea>
      <div class="word-count" id="${id}-count">Word count: 0</div>
    </div>
  `;
  container.innerHTML += html;
}

// 选择区块（用于删除）
function selectBlock(el) {
  document.querySelectorAll(".input-group").forEach(g => g.classList.remove("selected"));
  el.classList.add("selected");
  selectedBlock = el;
}

// 重命名区块
function renameBlock(btn, e) {
  e.stopPropagation();
  const labelSpan = btn.parentElement.querySelector(".block-name");
  const oldName = labelSpan.textContent.trim();
  const newName = prompt("Rename this section:", oldName);
  if (!newName || newName.trim() === "") return;

  const group = btn.closest(".input-group");
  labelSpan.textContent = newName;
  group.setAttribute("data-block", newName);

  const textarea = group.querySelector("textarea");
  textarea.setAttribute("placeholder", "Write your " + newName + " here...");

  updateAll();
}

// 在选中区块后方插入新区块
document.getElementById("add-block").onclick = () => {
  const newName = prompt("Enter new section name:", "New Section");
  if (!newName) return;

  const allBlocks = Array.from(document.querySelectorAll("#dynamic-blocks .input-group"));
  const insertIndex = selectedBlock
    ? allBlocks.indexOf(selectedBlock) + 1
    : allBlocks.length;

  const number = insertIndex + 1;
  const id = newName.toLowerCase().replace(/\s+/g, "-");

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = `
    <div class="input-group" data-block="${newName}" data-type="none" onclick="selectBlock(this)">
      <label for="${id}" class="input-label">
        ${number}. <span class="block-name">${newName}</span>
        <button onclick="renameBlock(this, event)" style="margin-left:8px; font-size:12px; padding:2px 6px;">✏️</button>
      </label>
      <textarea id="${id}" placeholder="Write your ${newName} here..." oninput="updateAll()"></textarea>
      <div class="word-count" id="${id}-count">Word count: 0</div>
    </div>
  `;
  const newEl = tempDiv.firstElementChild;

  const container = document.getElementById("dynamic-blocks");
  if (insertIndex >= allBlocks.length) {
    container.appendChild(newEl);
  } else {
    container.insertBefore(newEl, allBlocks[insertIndex]);
  }

  renumberBlocks();
  updateAll();
};

// 删除选中区块（核心区块禁止删除）
document.getElementById("delete-selected").onclick = () => {
  if (!selectedBlock) {
    alert("Please click a section to select it first.");
    return;
  }
  const type = selectedBlock.getAttribute("data-type");
  if (type && type !== "none") {
    alert("This is a required scoring section and cannot be deleted.");
    return;
  }
  selectedBlock.remove();
  renumberBlocks();
  updateAll();
};

// 重新编号
function renumberBlocks() {
  const blocks = document.querySelectorAll("#dynamic-blocks .input-group");
  blocks.forEach((b, i) => {
    const numLabel = b.querySelector(".input-label");
    const nameSpan = b.querySelector(".block-name");
    numLabel.innerHTML = `${i + 1}. ` + nameSpan.outerHTML + ` <button onclick="renameBlock(this, event)" style="margin-left:8px; font-size:12px; padding:2px 6px;">✏️</button>`;
  });
}

// ===================== 统一更新 =====================
function updateAll() {
  updateWordCount();
  updateFullText();
  saveToLocal();
}

// ===================== 统计字数 =====================
function updateWordCount() {
  let total = 0;
  const textareas = document.querySelectorAll("#dynamic-blocks textarea");

  textareas.forEach(el => {
    const len = el.value.trim().length;
    total += len;
    const cnt = document.getElementById(`${el.id}-count`);
    if (cnt) cnt.textContent = `Word count: ${len}`;
  });

  document.getElementById("total-count").textContent = total;
}

// ===================== 拼接全文 =====================
function updateFullText() {
  const textareas = document.querySelectorAll("#dynamic-blocks textarea");
  const full = Array.from(textareas)
    .map(el => el.value.trim())
    .filter(Boolean)
    .join("\n\n");

  document.getElementById("full-text").value = full;
}

// ===================== 复制 =====================
function copyFullText() {
  const fullText = document.getElementById("full-text");
  fullText.select();
  navigator.clipboard.writeText(fullText.value);

  const toast = document.getElementById("copy-toast");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

// ===================== 本地保存 =====================
function saveToLocal() {
  const blockElements = document.querySelectorAll("#dynamic-blocks .input-group");
  const blockList = [];

  blockElements.forEach(el => {
    blockList.push({
      name: el.getAttribute("data-block"),
      type: el.getAttribute("data-type"),
      text: el.querySelector("textarea").value
    });
  });

  const data = {
    title: document.getElementById("title")?.value || "",
    template: document.getElementById("template-select").value,
    blocks: blockList
  };

  localStorage.setItem("peel_data", JSON.stringify(data));
}

function loadSavedData() {
  const saved = localStorage.getItem("peel_data");

  // 第一次打开：加载默认 PEEL
  if (!saved) {
    document.getElementById("template-select").value = "PEEL";
    renderDynamicBlocks(TEMPLATES.PEEL);
    updateAll();
    return;
  }

  const data = JSON.parse(saved);

  // 恢复标题
  if (data.title) document.getElementById("title").value = data.title;

  // 恢复模板
  if (data.template) {
    document.getElementById("template-select").value = data.template;
  }

  // 恢复区块 + 内容 + type
  if (data.blocks && data.blocks.length > 0) {
    const container = document.getElementById("dynamic-blocks");
    container.innerHTML = "";

    data.blocks.forEach((item, index) => {
      addBlockUI(item.name, index + 1, item.type);
    });

    setTimeout(() => {
      data.blocks.forEach(item => {
        const el = document.querySelector(`.input-group[data-block="${item.name}"][data-type="${item.type}"] textarea`);
        if (el) el.value = item.text || "";
      });
      updateAll();
    }, 10);
  }
}

// ===================== 提交评分 =====================
async function submitPEEL() {
  const title = document.getElementById("title")?.value || "";

  const data = {
    title: title,
    point: getBlockText("point"),
    evidence: getBlockText("evidence"),
    explain: getBlockText("explain"),
    link: getBlockText("link")
  };

  const wordCounts = Array.from(document.querySelectorAll("#dynamic-blocks textarea"))
    .map(el => el.value.trim().length);

  updateChart(wordCounts);

  try {
    const response = await fetch(API_URL + "/score", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    showResults(result);
  } catch (err) {
    alert("Server error: Make sure backend is running.");
  }
}

function getBlockText(targetType) {
  const el = document.querySelector(`.input-group[data-type="${targetType}"] textarea`);
  return el ? el.value.trim() : "";
}

// ===================== 显示结果 =====================
function showResults(result) {
  document.getElementById("score-point").textContent = `${result.scores.point}/18`;
  document.getElementById("score-evidence").textContent = `${result.scores.evidence}/22`;
  document.getElementById("score-explain").textContent = `${result.scores.explain}/22`;
  document.getElementById("score-link").textContent = `${result.scores.link}/18`;
  document.getElementById("score-grammar").textContent = `${result.scores.grammar}/20`;
  document.getElementById("score-total").textContent = `${result.total}/100`;

  const sug = document.getElementById("suggestions");
  if (result.suggestions.length === 0) {
    sug.innerHTML = `<h3 class="card-title">Perfect!</h3><p>No improvements needed.</p>`;
    return;
  }
  let html = `<h3 class="card-title">Suggestions</h3><ul>`;
  result.suggestions.forEach(s => html += `<li>${s}</li>`);
  sug.innerHTML = html + "</ul>";
}

// ===================== 图表 =====================
function updateChart(data) {
  if (chart) chart.destroy();
  const ctx = document.getElementById('peelChart').getContext('2d');
  const labels = Array.from(document.querySelectorAll("#dynamic-blocks .input-group"))
    .map(g => g.getAttribute("data-block"));

  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f97316', '#84cc16'],
        borderWidth: 2,
        borderColor: 'white'
      }]
    },
    options: {
      plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Word Count' } }
    }
  });
}

// ===================== 深色模式 =====================
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById('theme-toggle');
  const current = document.documentElement.getAttribute('data-theme');
  btn.innerHTML = current === 'dark'
    ? '<i class="fas fa-sun"></i> Light Mode'
    : '<i class="fas fa-moon"></i> Dark Mode';
}

function loadTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon();
}

// ===================== 初始化 =====================
window.onload = () => {
  loadTheme();
  document.getElementById('theme-toggle').onclick = toggleTheme;
  loadSavedData();
};
