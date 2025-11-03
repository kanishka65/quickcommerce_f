(function(){
  const fileInput = document.getElementById('csv-input');
  const preview = document.getElementById('csv-preview');

  fileInput.addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results){
        renderPreview(results.data);
      },
      error: function(err){ preview.innerHTML = '<div class="text-danger">CSV parse error</div>'; }
    });
  });

  function renderPreview(rows){
    preview.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'table table-sm table-striped table-responsive';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr>' + Object.keys(rows[0]||{}).slice(0,6).map(h=>`<th>${h}</th>`).join('') + '<th></th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.slice(0,8).forEach(r=>{
      const tr = document.createElement('tr');
      Object.keys(r).slice(0,6).forEach(k=> tr.innerHTML += `<td>${(r[k]||'').toString().slice(0,30)}</td>`);
      tr.innerHTML += `<td></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    preview.appendChild(table);

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = `Upload ${rows.length} rows`;
    
    btn.addEventListener('click', async ()=>{
      btn.disabled = true;
      btn.textContent = 'Uploading...';
      
      const form = new FormData();
      const csv = Papa.unparse(rows);
      form.append('file', new Blob([csv], {type:'text/csv'}), 'upload.csv');
      
      try {
        const res = await api.uploadCSV('/purchases/upload-csv', form);
        alert(`Upload successful: ${res.inserted} rows inserted.`);
        preview.innerHTML = ''; // clear preview
        fileInput.value = ''; // clear input
      } catch(e) {
        alert('Upload failed: ' + (e.error || 'Check console'));
        btn.disabled = false;
        btn.textContent = `Upload ${rows.length} rows`;
      }
    });
    preview.appendChild(btn);
  }

})();