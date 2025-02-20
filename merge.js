let mergedData = [];

// Event listeners for merge page
document.getElementById("mergeImportBtn").addEventListener("click", () => {
  document.getElementById("mergeFileInput").click();
});
document.getElementById("mergeFileInput").addEventListener("change", handleMergeImport);
document.getElementById("mergeBtn").addEventListener("click", mergeFiles);
document.getElementById("exportMergeJsonBtn").addEventListener("click", exportMergeJSON);
document.getElementById("exportMergeXlsxBtn").addEventListener("click", exportMergeXLSX);

function showMergeSpinner() {
  document.getElementById("mergeSpinner").style.display = "flex";
}

function hideMergeSpinner() {
  document.getElementById("mergeSpinner").style.display = "none";
}

// Handle file import for merging
function handleMergeImport(event) {
  const files = event.target.files;
  if (files.length === 0) return;
  const promises = [];
  for (let i = 0; i < files.length; i++) {
    promises.push(readFile(files[i]));
  }
  showMergeSpinner();
  // Simulate a loading delay (random between 1-4 seconds)
  let delay = Math.floor(Math.random() * 3000) + 1000;
  setTimeout(() => {
    Promise.all(promises).then(results => {
      results.forEach(dataArray => {
        mergedData = mergedData.concat(dataArray);
      });
      hideMergeSpinner();
      alert("Files imported successfully! Click 'Merge Files' to sort and view merged data.");
    });
    event.target.value = "";
  }, delay);
}

// Read file (supports JSON and XLSX)
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = e.target.result;
      if (file.name.endsWith(".json")) {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          alert("Error parsing JSON file: " + file.name);
          resolve([]);
        }
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        resolve(json);
      } else {
        alert("Unsupported file type: " + file.name);
        resolve([]);
      }
    };
    if (file.name.endsWith(".json")) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  });
}

// Merge files: sort data and adjust duplicate SN values
function mergeFiles() {
  if (mergedData.length === 0) {
    alert("No data to merge. Please import files first.");
    return;
  }
  showMergeSpinner();
  // Random delay between 1 and 4 seconds
  let delay = Math.floor(Math.random() * 3000) + 1000;
  setTimeout(() => {
    // Sort mergedData by SN (numerically when possible)
    mergedData.sort((a, b) => {
      let snA = parseFloat(a.SN) || 0;
      let snB = parseFloat(b.SN) || 0;
      return snA - snB;
    });
    // Adjust duplicate SNs: if a base SN appears multiple times, append .1, .2, etc.
    let snMap = {};
    mergedData.forEach((item, index) => {
      let baseSN = item.SN ? String(item.SN) : String(index + 1);
      if (snMap[baseSN] === undefined) {
        snMap[baseSN] = 1;
        item.SN = baseSN;
      } else {
        item.SN = baseSN + '.' + snMap[baseSN];
        snMap[baseSN]++;
      }
    });
    populateMergeTable();
    hideMergeSpinner();
  }, delay);
}

// Populate the merge table with merged data
function populateMergeTable() {
  const tbody = document.getElementById("mergeTableBody");
  tbody.innerHTML = "";
  mergedData.forEach((item, index) => {
    const tr = document.createElement("tr");
    const snCell = document.createElement("td");
    snCell.textContent = item.SN || (index + 1);
    tr.appendChild(snCell);
    const fields = ["Prompt", "Answer_1", "Answer_2", "Answer_3", "Document_Name"];
    fields.forEach(field => {
      const td = document.createElement("td");
      td.textContent = item[field] || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// Export merged data as JSON
function exportMergeJSON() {
  if (mergedData.length === 0) {
    alert("No data to export.");
    return;
  }
  const jsonStr = JSON.stringify(mergedData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "merged_data.json";
  a.click();
}

function exportMergeXLSX() {
  if (mergedData.length === 0) {
    alert("No data to export.");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(mergedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Merged Data");
  XLSX.writeFile(wb, "merged_data.xlsx");
}
