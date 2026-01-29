const baseScriptURL = 'https://script.google.com/macros/s/AKfycbzhVikXLP9cHZcxR_TBXiS10AeKjXlXlcmV4H83LejyczwlB3Xbzrsap-iIWIQXRh7C/exec';

const collectionURL = baseScriptURL + '?sheet=albums2026' ; // Change 'Sheet1' to your tab name
const archiveURL    = baseScriptURL + '?sheet=Sheet3';

let scriptURL = collectionURL; 
let currentSort = 'newest'; 
let globalData = [];

// 2. INITIALIZATION
function init() {
  const container = document.getElementById('cardContainer');
  container.innerHTML = "<p style='color:white; letter-spacing:3px; text-align:center;'>Loading...</p>";
if (scriptURL.includes('Sheet3')) {
    // We are in Archive (2025)
    document.getElementById('btn-arc').classList.add('active-glow');
    document.getElementById('btn-col').classList.remove('active-glow');
  } else {
    // We are in Collection (2026)
    document.getElementById('btn-col').classList.add('active-glow');
    document.getElementById('btn-arc').classList.remove('active-glow');
  }
  fetch(scriptURL)
    .then(res => res.json())
    .then(data => {
      globalData = data;
      if (data.length > 0) {
        setupDropdown(Object.keys(data[0]));
      }
      renderCards(data);
      renderAves(data);
    })
    .catch(err => {
      console.error("Fetch Error:", err);
      container.innerHTML = "<p style='color:red;'>Error loading data. Check console.</p>";
    });
}
function switchSheet(mode) {
  // 1. Update the URL
  scriptURL = (mode === 'archive') ? archiveURL : collectionURL;
  
  // 2. Highlight buttons
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active-glow'));
  const btnId = (mode === 'archive') ? 'btn-arc' : 'btn-col';
  const activeBtn = document.getElementById(btnId);
  if (activeBtn) activeBtn.classList.add('active-glow');

  // 3. Reset data and reload
  globalData = [];
  init();
}

// 4. DROPDOWN SETUP
function setupDropdown(headers) {
  const dropdown = document.getElementById('categoryDropdown');
  const sortSelect = document.getElementById('sortSelect');
  if (!dropdown) return;
  dropdown.innerHTML = '<option value="">Chooser</option>';
  
  // Rating columns (adjust slice if headers change)
  const ratingCategories = headers.slice(7, 20);
if(dropdown) {ratingCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.innerText = cat; 
    dropdown.appendChild(option);
  })};
  if (sortSelect) {
    // Keep the defaults, then add categories
    sortSelect.innerHTML = `
     
      <option value="newest">Newest Added</option>
       <option value="Release">Release Date</option>
      <option value="highest">Overall Average</option>
    `;
    ratingCategories.forEach(cat => {
      let opt = new Option(cat, cat); // Value and Text are the same
      sortSelect.add(opt);
    });
  }
}



function renderAves(data) {
  const avesContainer =document.getElementById('averagesforall');
   if (!avesContainer || data.length === 0) return;
  avesContainer.innerHTML = "";


  const allKeys = Object.keys(data[0]);
  const ratingKeys = allKeys.slice(7, 20); 
  
  ratingKeys.forEach ( key => {
    let count = 0;
    let total = 0;
    
    data.forEach( item => {
     
     let rawVal = item[key];
      // Only count if cell is not empty and is a number > 0
      if (rawVal !== "" && rawVal !== null && !isNaN(rawVal)) {
        let val = Number(rawVal);
        if (val > 0) {
          if (val <= 10) val *= 10;
          total += val;
          count++;
        }
      }
    
    
  });
  
    
    const aveScorepres = count > 0 ? Math.round(total / count): 0;
    
    const color = getBarColor(aveScorepres);
    
     const aveCard = document.createElement('div');
     aveCard.className = 'aveCard'
     aveCard.style.background = color;     
     aveCard.style.boxShadow= `0 4px 15px rgba(0, 0, 0, 0.3)`;
     aveCard.innerHTML = `
   
    <p class="aveNames">${key}</p>
     <p class="aveScores">${aveScorepres} </p>
     <p class ="aveCount">${count}</p>
   
     `
         
     
     avesContainer.appendChild(aveCard);
                                      
  });   
                                      
                                      }








// 5. RENDER CARDS
function renderCards(data) {
  const container = document.getElementById('cardContainer');
  const albumCountEl = document.getElementById('albumCount');
  
  if (albumCountEl) albumCountEl.innerText = `${data.length} ALBUMS`;
  container.innerHTML = ""; 

  if (data.length === 0) return;

  const allKeys = Object.keys(data[0]);
  const ratingKeys = allKeys.slice(7, 20); 

  // Process data for Sorting and Decimal Fix
 let processedData = data.map((item, index) => {
    const allKeys = Object.keys(data[0]);
    const ratingKeys = allKeys.slice(7, 20);
    
    const ratings = ratingKeys.map(key => {
      let val = Number(item[key]) || 0;
      return (val > 0 && val <= 10) ? val * 10 : val;
    });

    const activeRatings = ratings.filter(val => val > 0);
    const average = activeRatings.length > 0 
        ? Math.round(activeRatings.reduce((a, b) => a + b, 0) / activeRatings.length) 
        : 0;
        
    return { ...item, originalRow: index + 2, avgScore: average, fixedRatings: ratings };
  });

  // 2. NEW DYNAMIC SORT LOGIC
  if (currentSort === 'newest') {
    processedData.reverse();
  } else if (currentSort === 'highest') {
    processedData.sort((a, b) => b.avgScore - a.avgScore);
  }
  
   else if (currentSort === 'Release') {
  processedData.sort((a, b) => {
    // 1. Convert the strings into actual Date objects
    // If a.Release is empty, we use a very old date (0) as a fallback
    const dateA = a.Release ? new Date(a.Release) : 0;
    const dateB = b.Release ? new Date(b.Release) : 0;
    
    // 2. Subtract the dates (Newest to Oldest)
    return dateB - dateA; 
  });
}
  
  else {
    // Sort by specific header name (e.g., "Production")
    processedData.sort((a, b) => {
      let valA = Number(a[currentSort]) || 0;
      let valB = Number(b[currentSort]) || 0;
      // Apply decimal fix to individual categories during sort
      if (valA <= 10 && valA > 0) valA *= 10;
      if (valB <= 10 && valB > 0) valB *= 10;
      return valB - valA; // High to low
    });
  }
  // Create Card HTML
  processedData.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    
    let barsHTML = "";
    ratingKeys.forEach((key, i) => {
      const val = item.fixedRatings[i]; // Use fixed decimal value
      const safeId = `${key.replace(/\s+/g, '')}-${index}`;
      const isNeon = val >= 95;

      barsHTML += `
        <div class="bar-wrapper">
          <div class="bar-track">
            <div id="fill-${safeId}" class="bar-fill" style="height: ${val}%; background: ${getBarColor(val)}; box-shadow: ${isNeon ? '0 0 20px #bc13fe' : 'none'};"></div>
            <input type="range" class="chart-slider" value="${val}" min="0" max="100" orient="vertical" oninput="updateBar('${safeId}', this.value)">
          </div>
          <div class="bar-footer">
            <span class="bar-label">${key.substring(0, 3)}</span>
            <span class="bar-val" id="val-${safeId}">${val}</span>
          </div> 
        </div>
      `;
    });
    const dateID = `release-date-${index}`;
    const imgId = `album-art-${index}`;
    const placeholder = "https://cdn-icons-png.flaticon.com/512/26/26356.png";
    const searchTerm = `${item.Artist} ${item.Album}`.trim();
    const avgColor = getBarColor(item.avgScore);
    const releaseplaceholder = 'Date';

    card.innerHTML = `
      <div class="card-content">
      
  <div class="artandedit">  
  <div class="metaname">
  ${item.Chooser}
  </div>

    <img src="${item.Art || placeholder}" class="album-art" id="${imgId}" crossorigin="anonymous">
    
    <div>
    <button class="edit-art-btn" onclick="editArtURL(${item.originalRow})">Edit Art</button>
 <button class="edit-releaseDate-btn" onclick="editreleaseDate(${item.originalRow})">Edit Date
    </div>

  <div class="releaseDate" id=${dateID} >
    ${item.Release.substring(0,10) ||releaseplaceholder}
    </div>
    </div>
   <div class="titles">
      <h3>${item.Artist || ''}</h3>
      <h4>${item.Album || ''}</h4>
      <button class="comments" onclick="addcomment(${item.originalRow})">  "${item.Comment  || "No comment"}"</button>
      </div>
 
 <div class="chartupdate">
    <div class="bar-chart">${barsHTML}</div>
     <button class="save-card-btn" onclick="saveCardUpdate(${item.originalRow}, this)">Update</button>
</div>


    <div class="card-actions">
      <div class="ave" style="background: ${avgColor};">${item.avgScore}</div>
     
    </div>

    <button class="delete-btn" onclick="confirmDelete(${item.originalRow})">x</button>
  </div>

`;
    container.appendChild(card);

    // iTunes Color Sampling
    const img = document.getElementById(imgId);
    img.onload = function() {
      img.style.opacity = "1";
      try {
        const colorThief = new ColorThief();
        const color = colorThief.getColor(img);
        const rgb = `${color[0]}, ${color[1]}, ${color[2]}`;
        card.style.boxShadow = `0 10px 40px rgba(${rgb}, 0.4)`;
        card.style.borderColor = `rgba(${rgb}, 0.2)`;
      } catch (e) { console.warn("ColorThief blocked"); }
    };
    const dateEl = document.getElementById(dateID);
    // Fetch iTunes art if column is empty
    if (!item.Art && searchTerm) {
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=album&limit=1`)
        .then(res => res.json())
        .then(result => {
          if (result.results.length > 0) {
            img.src = result.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
            itunesDate = result.results[0].releaseDate.substring(0,10);
            if(!item.Release)  {dateEl.textContent =itunesDate}
            
            const currentSheet = scriptURL.includes('Sheet3') ? 'Sheet3' : 'albums2026';
            // 3. Automatically update the Google Sheet
        fetch(baseScriptURL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            action: "updatereleaseDate",
            row: item.originalRow,
            relDate: itunesDate,
            sheetMode: currentSheet
          })
        }).then(() => {
          console.log(`Auto-updated date for row ${item.originalRow}`);
        });
          }
        });
    }
  });
}
// 6. HELPER FUNCTIONS
function getBarColor(val) {
  if (val >= 95) return "linear-gradient(to top, #2ecc71, #bc13fe)";
  if (val >= 80) return "#2ecc71";
  if (val >= 70) return "#f1c40f";
  if (val >= 50) return "#e67e22";
  return "#e74c3c";
}

function updateBar(id, val) {
  const fill = document.getElementById(`fill-${id}`);
  const valText = document.getElementById(`val-${id}`);
  fill.style.height = val + '%';
  fill.style.background = getBarColor(val);
  valText.innerText = val;
}

function saveCardUpdate(rowNumber, btnElement) {
  const card = btnElement.closest('.card'); 
  const ratings = Array.from(card.querySelectorAll('.chart-slider')).map(input => Number(input.value));
  
  // Figure out if we are currently looking at Sheet1 or Sheet2
  const currentSheet = scriptURL.includes('Sheet3') ? 'Sheet3' : 'albums2026';

  btnElement.innerText = "Saving...";
  fetch(baseScriptURL, { 
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ 
      row: rowNumber, 
      ratings: ratings, 
      sheetMode: currentSheet 
    })
  }).then(() => {
    btnElement.innerText = "Success!";
    setTimeout(() => init(), 1200);
  });
}

function confirmDelete(rowNumber) {
  const password = prompt("Enter security code:");
  const currentSheet = scriptURL.includes('Sheet3') ? 'Sheet3' : 'albums2026';
  if (!password) return;
 fetch(baseScriptURL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ 
      action: "delete", 
      row: rowNumber, 
      pass: password,
      sheetMode: currentSheet // This tells Google which tab to delete from
    })
  }).then(() => {
    // Refresh the display after deletion
    setTimeout(() => init(), 500);
  });
}

function editArtURL(rowNumber) {
  const newURL = prompt("Paste Image URL:");
  if (!newURL) return;
const currentSheet = scriptURL.includes('Sheet3') ? 'Sheet3' : 'albums2026';
fetch(baseScriptURL, { // Use baseScriptURL for POST
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ 
      action: "updateArt", 
      row: rowNumber, 
      artUrl: newURL,
      sheetMode: currentSheet // This tells the Google Script which sheet to use!
    })
  }).then(() => {
    // Give Google a second to process before refreshing
    setTimeout(() => init(), 500);
  });
}



function editreleaseDate(rowNumber) {
  const newreleaseDate =prompt ("YYYY-MM-DD");
  if (!newreleaseDate) return;
  fetch(scriptURL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({action: "updatereleaseDate", row:rowNumber, relDate: newreleaseDate})
  }).then(() => init());
  
}




function addcomment(rowNumber) {
  const newcomment= prompt("hot take")
  if (!newcomment) return;
  fetch(scriptURL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({action: "updateComment", row:rowNumber, newC: newcomment})
  }).then(() => init());
}

// 7. EVENT LISTENERS
window.addEventListener('DOMContentLoaded', init);

document.getElementById('sortSelect').addEventListener('change', function(e) {
  currentSort = e.target.value;
  renderCards(globalData);
});

function manualRefresh() {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('active-glow');
  init();
  setTimeout(() => btn.classList.remove('active-glow'), 1000);
}

function handleSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submitBtn');
  const currentSheet = scriptURL.includes('Sheet3') ? 'Sheet3' : 'albums2026';
  
  const myFormData = new FormData(e.target);
  const dataObject = Object.fromEntries(myFormData.entries());
  dataObject.sheetMode = currentSheet; // Tell Google which sheet to add to

  submitBtn.innerText = "Sending...";
  submitBtn.classList.add('glow-sending');
  
  fetch(baseScriptURL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(dataObject)
  }).then(() => {
   
      submitBtn.classList.remove('glow-sending')
  
    submitBtn.innerText = "Success!";
    submitBtn.style.color="#2ecc71"
    e.target.reset();
    setTimeout(() => {
      submitBtn.innerText = "Submit";
       submitBtn.style.color = "#666"
      init();
    }, 1500);
  });
}

// Add this listener at the very bottom
document.getElementById('reviewForm').addEventListener('submit', handleSubmit);
