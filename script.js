let unsavedChanges = false;

// Event listeners for main page controls
document.getElementById("addRowBtn").addEventListener("click", addRow);
document.getElementById("exportJsonBtn").addEventListener("click", exportJSON);
document.getElementById("exportXlsxBtn").addEventListener("click", exportXLSX);
document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("importFileInput").click();
});
document.getElementById("importFileInput").addEventListener("change", handleImport);

// Keyboard shortcut: Shift + Enter adds a new row
document.addEventListener("keydown", function(e) {
  if (e.shiftKey && e.key === "Enter") {
    e.preventDefault();
    addRow();
  }
});

// Warn user if there are unsaved changes
window.addEventListener("beforeunload", function(e) {
  if (unsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Spinner overlay control functions
function showSpinner() {
  document.getElementById("spinnerOverlay").style.display = "flex";
}

function hideSpinner() {
  document.getElementById("spinnerOverlay").style.display = "none";
}

// Auto-scroll the table container to the bottom
function scrollDown() {
  const container = document.getElementById("tableContainer");
  container.scrollTop = container.scrollHeight;
}

// Add a new row to the "New Data" table
function addRow() {
  const tbody = document.getElementById("newData");
  const tr = document.createElement("tr");

  // SN cell
  const snCell = document.createElement("td");
  snCell.textContent = tbody.children.length + 1;
  tr.appendChild(snCell);

  // Fields: Prompt, Answer_1, Answer_2, Answer_3, Document_Name
  const fields = ["Prompt", "Answer_1", "Answer_2", "Answer_3", "Document_Name"];
  fields.forEach(() => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control";
    input.addEventListener("change", () => { unsavedChanges = true; });
    td.appendChild(input);
    tr.appendChild(td);
  });

  // Actions cell with Delete button
  const actionsTd = document.createElement("td");
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-danger btn-sm";
  deleteBtn.title = "Delete row";
  deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
  deleteBtn.addEventListener("click", function() {
    tr.remove();
    unsavedChanges = true;
    updateSN();
  });
  actionsTd.appendChild(deleteBtn);
  tr.appendChild(actionsTd);

  tbody.appendChild(tr);
  unsavedChanges = true;
  // Auto-scroll down after rendering the new row
  setTimeout(scrollDown, 100);
}

// Update serial numbers in the "New Data" table
function updateSN() {
  const tbody = document.getElementById("newData");
  Array.from(tbody.children).forEach((tr, index) => {
    tr.cells[0].textContent = index + 1;
  });
}

// Export combined data (imported and new) to JSON
function exportJSON() {
  let data = [];
  // Gather data from imported table
  const importedTbody = document.getElementById("importedDataBody");
  Array.from(importedTbody.children).forEach(tr => {
    const rowData = {
      SN: tr.cells[0].textContent,
      Prompt: tr.cells[1].textContent,
      Answer_1: tr.cells[2].textContent,
      Answer_2: tr.cells[3].textContent,
      Answer_3: tr.cells[4].textContent,
      Document_Name: tr.cells[5].textContent
    };
    data.push(rowData);
  });
  // Gather data from new data table
  const newTbody = document.getElementById("newData");
  Array.from(newTbody.children).forEach(tr => {
    const rowData = {
      SN: tr.cells[0].textContent,
      Prompt: tr.cells[1].querySelector("input").value,
      Answer_1: tr.cells[2].querySelector("input").value,
      Answer_2: tr.cells[3].querySelector("input").value,
      Answer_3: tr.cells[4].querySelector("input").value,
      Document_Name: tr.cells[5].querySelector("input").value
    };
    data.push(rowData);
  });
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.json";
  a.click();
  unsavedChanges = false;
}

// Export combined data to XLSX using SheetJS
function exportXLSX() {
  let data = [];
  // Gather imported data
  const importedTbody = document.getElementById("importedDataBody");
  Array.from(importedTbody.children).forEach(tr => {
    const rowData = {
      SN: tr.cells[0].textContent,
      Prompt: tr.cells[1].textContent,
      Answer_1: tr.cells[2].textContent,
      Answer_2: tr.cells[3].textContent,
      Answer_3: tr.cells[4].textContent,
      Document_Name: tr.cells[5].textContent
    };
    data.push(rowData);
  });
  // Gather new data
  const newTbody = document.getElementById("newData");
  Array.from(newTbody.children).forEach(tr => {
    const rowData = {
      SN: tr.cells[0].textContent,
      Prompt: tr.cells[1].querySelector("input").value,
      Answer_1: tr.cells[2].querySelector("input").value,
      Answer_2: tr.cells[3].querySelector("input").value,
      Answer_3: tr.cells[4].querySelector("input").value,
      Document_Name: tr.cells[5].querySelector("input").value
    };
    data.push(rowData);
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, "data.xlsx");
  unsavedChanges = false;
}

// Handle file import with simulated loading
function handleImport(event) {
  const files = event.target.files;
  if (files.length === 0) return;

  showSpinner();
  // Simulate a loading delay of 2 seconds
  setTimeout(() => {
    const promises = [];
    for (let i = 0; i < files.length; i++) {
      promises.push(readFile(files[i]));
    }
    Promise.all(promises).then(results => {
      hideSpinner();
      let mode = confirm("Click OK to view previous data (imported data will appear in a popup) and add on to it, or Cancel to add new entries directly.");
      results.forEach(dataArray => {
        dataArray.forEach(item => {
          if (mode) {
            addImportedRow(item);
          } else {
            addNewRowFromImport(item);
          }
        });
      });
      unsavedChanges = true;
      // If the user chose to view previous data, show the modal
      if (mode) {
        var importedModal = new bootstrap.Modal(document.getElementById('importedDataModal'));
        importedModal.show();
      }
    });
    event.target.value = "";
  }, 2000);
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

// Add a row to the Imported Data modal table
function addImportedRow(item) {
  const tbody = document.getElementById("importedDataBody");
  const tr = document.createElement("tr");

  const snCell = document.createElement("td");
  snCell.textContent = item.SN || (tbody.children.length + 1);
  tr.appendChild(snCell);

  const fields = ["Prompt", "Answer_1", "Answer_2", "Answer_3", "Document_Name"];
  fields.forEach(field => {
    const td = document.createElement("td");
    td.textContent = item[field] || "";
    tr.appendChild(td);
  });

  const actionsTd = document.createElement("td");
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-danger btn-sm";
  deleteBtn.title = "Delete row";
  deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
  deleteBtn.addEventListener("click", function() {
    tr.remove();
    updateImportedSN();
    unsavedChanges = true;
  });
  actionsTd.appendChild(deleteBtn);
  tr.appendChild(actionsTd);

  tbody.appendChild(tr);
}

// Update serial numbers in the imported data modal table
function updateImportedSN() {
  const tbody = document.getElementById("importedDataBody");
  Array.from(tbody.children).forEach((tr, index) => {
    tr.cells[0].textContent = index + 1;
  });
}

// Add new row from imported file directly into the "New Data" table
function addNewRowFromImport(item) {
  const tbody = document.getElementById("newData");
  const tr = document.createElement("tr");

  const snCell = document.createElement("td");
  snCell.textContent = tbody.children.length + 1;
  tr.appendChild(snCell);

  const fields = ["Prompt", "Answer_1", "Answer_2", "Answer_3", "Document_Name"];
  fields.forEach(field => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control";
    input.value = item[field] || "";
    input.addEventListener("change", () => { unsavedChanges = true; });
    td.appendChild(input);
    tr.appendChild(td);
  });

  const actionsTd = document.createElement("td");
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-danger btn-sm";
  deleteBtn.title = "Delete row";
  deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
  deleteBtn.addEventListener("click", function() {
    tr.remove();
    updateSN();
    unsavedChanges = true;
  });
  actionsTd.appendChild(deleteBtn);
  tr.appendChild(actionsTd);

  tbody.appendChild(tr);
  unsavedChanges = true;
  setTimeout(scrollDown, 100);
}
