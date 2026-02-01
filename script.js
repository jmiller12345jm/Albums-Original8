const baseScriptURL = 'https://script.google.com/macros/s/AKfycbzhVikXLP9cHZcxR_TBXiS10AeKjXlXlcmV4H83LejyczwlB3Xbzrsap-iIWIQXRh7C/exec';

const collectionURL = baseScriptURL + '?sheet=albums2026' ; // Change 'Sheet1' to your tab name
const archiveURL    = baseScriptURL + '?sheet=Sheet3';

let scriptURL = collectionURL; 
let currentSort = 'newest'; 
let globalData = [];

// 2. INITIALIZATION
function init() {
  const container = document.getElementById('cardContainer');
  container.innerHTML = ` <div class="loader-container">
      <div class="loading-circle"></div>
      <p style="color:white; letter-spacing:3px; margin-top:15px;"></p>
    </div> `;
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
    console.log("Data Sample:", data[0]); // Look at this in F12 console!
    
    
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        
        console.log("Extracted Headers:", headers);
        setupDropdown(headers);
      }
      renderCards(data);
      renderAves(data);
      setupDropdown(data[0]);
    })



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
  // 1. Check if headers actually exist
  if (!headers || headers.length === 0) {
    console.error("SetupDropdown failed: No headers provided.");
    return;
  }

  const dropdown = document.getElementById('categoryDropdown');
  const sortSelect = document.getElementById('sortSelect');
  
  // 2. Slice the categories (Column 7 onwards)
  const ratingCategories = headers.slice(7, 20);
  console.log("Categories to load:", ratingCategories);

  // 3. Fill the Sort Dropdown (Main Page)
  if (sortSelect) {
    sortSelect.innerHTML = `
      <option value="newest">Newest Added</option>
      <option value="Release">Release Date</option>
      <option value="highest">Overall Average</option>
    `;
    ratingCategories.forEach(cat => {
      sortSelect.add(new Option(cat, cat));
    });
  }

  // 4. Fill the Category Dropdown (Inside the Form - might be null)
  if (dropdown) {
    dropdown.innerHTML = '<option value="">Chooser</option>';
    ratingCategories.forEach(cat => {
      dropdown.add(new Option(cat, cat));
    });
  }
}



function renderAves(data) {
  const avesContainer =document.getElementById('averagesforall');
   if (!avesContainer || data.length === 0) return;
  avesContainer.innerHTML = "";


  const allKeys = Object.keys(data[0]);
  const ratingKeys = allKeys.slice(7, 20); 
  

  
  let allScores = [];
  ratingKeys.forEach(key => {
    data.forEach(item => {
      let val = Number(item[key]);
      if (val > 0) {
        if (val <= 10) val *= 10;
        allScores.push(val);
      }
    });
  });
  
  
  const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;

  // 3. CALCULATE STANDARD DEVIATION (σ)
  const squareDiffs = allScores.map(score => Math.pow(score - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);
  
  

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
    
  const zScore = stdDev > 0 ? (aveScorepres - mean) / stdDev : 0;
    const colorValue = Math.max(0, Math.min(100, 75 + (zScore * 12)));
    const color = getBarColor(colorValue);
    
     const aveCard = document.createElement('div');
     aveCard.className = 'aveCard'
     aveCard.style.background = color;     
     aveCard.style.boxShadow= `0 4px 15px rgba(0, 0, 0, 0.3)`;
     aveCard.innerHTML = `
   
     <p class="aveNamesL">${key}</p>
     <p class="aveNamesS">${key.substring(0,3)}</p>
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
  } 
  
  else if (currentSort === 'highest') {
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
  
  
   let allScores = [];
  ratingKeys.forEach(key => {
    data.forEach(item => {
      let val = Number(item[key]);
      if (val > 0) {
        if (val <= 10) val *= 10;
        allScores.push(val);
      }
    });
  });
  
  
  const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      const squareDiffs = allScores.map(score => Math.pow(score - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);
  
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
    
    
  
    
     const zScore = stdDev > 0 ? (item.avgScore - mean) / stdDev : 0;
    const colorValue = Math.max(0, Math.min(100, 75 + (zScore * 12)));
    
    
    const avgColor = getBarColor(colorValue);
    const releaseplaceholder = 'Date';

    card.innerHTML = `
      <div class="hover-glow-backdrop" crossorigin="anonymous" style="background-image: url('${item.Art || placeholder}')"></div>
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
      <button class="comments" onclick="addcomment(${item.originalRow})">  ${item.Comment  || "..."}</button>
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
setTimeout(initScrollObserver, 100);
    // iTunes Color Sampling
    const img = document.getElementById(imgId);
    img.onload = function() {
      img.style.opacity = "1";
      try {
        const colorThief = new ColorThief();
        const color = colorThief.getColor(img);
        const rgb = `${color[0]}, ${color[1]}, ${color[2]}`;
      card.style.setProperty('--glow-color', rgb);
      } catch (e) { console.warn("ColorThief blocked"); }
    };
    const dateEl = document.getElementById(dateID);
    // Fetch iTunes art if column is empty
  if (!item.Art && searchTerm) {
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=album&limit=1`)
        .then(res => res.json())
        .then(result => {
          if (result.results.length > 0) {
            // 1. Define the URL clearly so we can use it twice
            const foundArt = result.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
            const foundDate = result.results[0].releaseDate.substring(0, 10);
            
            // 2. Update the screen immediately
            img.src = foundArt;
            if (!item.Release) { dateEl.textContent = foundDate; }
            
            const currentSheet = scriptURL.includes('Sheet3') ? 'Sheet3' : 'albums2026';

            // 3. Update Release Date in Google Sheet
            fetch(baseScriptURL, {
              method: 'POST',
              mode: 'no-cors',
              body: JSON.stringify({
                action: "updatereleaseDate",
                row: item.originalRow,
                relDate: foundDate,
                sheetMode: currentSheet
              })
            });

            // 4. Update Art URL in Google Sheet
            fetch(baseScriptURL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({
                    action: "updateArt", 
                    row: item.originalRow,
                    artUrl: foundArt, // FIXED: Now matches the variable above
                    sheetMode: currentSheet
                })
            }).then(() => {
              console.log(`Auto-saved art and date for row ${item.originalRow}`);
            }); // Closes the updateArt fetch .then
          } // Closes if (result.results.length > 0)
        }); // Closes the iTunes fetch .then
    } // Closes if (!item.Art && searchTerm)
  }); // Closes processedData.forEach loop
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
  const newreleaseDate = prompt("YYYY-MM-DD");
  if (!newreleaseDate) return;
  
  // Identify which sheet we are on
  const currentSheet = scriptURL.includes('Sheet3') ? 'Sheet3' : 'albums2026';

  fetch(baseScriptURL, { // Use baseScriptURL for POST
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({
      action: "updatereleaseDate", 
      row: rowNumber, 
      relDate: newreleaseDate,
      sheetMode: currentSheet // Essential for hitting the right tab
    })
  }).then(() => {
    setTimeout(() => init(), 500);
  });
}

function addcomment(rowNumber) {
  const newcomment = prompt("hot take");
  if (!newcomment) return;

  const currentSheet = scriptURL.includes('Sheet3') ? 'Sheet3' : 'albums2026';

  fetch(baseScriptURL, { // Use baseScriptURL
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({
      action: "updateComment", 
      row: rowNumber, 
      newC: newcomment,
      sheetMode: currentSheet
    })
  }).then(() => {
    setTimeout(() => init(), 500);
  });
}

function createForm() {
  // 1. Check if it's already on the screen
  const existingOverlay = document.getElementById('formOverlay');
  if (existingOverlay) {const isClosing = existingOverlay.style.display === 'flex';
    
    existingOverlay.style.display = isClosing ? 'none' : 'flex';
    // If closing, set overflow to auto. If opening, set to hidden.
    document.body.style.overflow = isClosing ? 'auto' : 'hidden';
    return;
  }

  // 2. Create the element
  const submitForm = document.createElement('div');
  submitForm.id = 'formOverlay';
  submitForm.className = 'form-overlay'; // Ensure this CSS has position: fixed
  
  submitForm.innerHTML = `
    <div class="toggle">
      <button class="close-popup" onclick="createForm()">×</button>
      <form id="reviewForm" class="popup-form">
        <input type="text" name="Artist" placeholder="Artist" required>
        <input type="text" name="Album" placeholder="Album" required>
        <select id="categoryDropdown" name="Chooser" required>
          <option value="">Category</option>
        </select>
        <button type="submit" id="submitBtn">Submit</button>
      </form>
      <div id="status"></div>
    </div>
  `;

  // 3. Add to page and show
  document.body.appendChild(submitForm);
  submitForm.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // LOCK SCROLL on first create

  if (globalData && globalData.length > 0) {
    setupDropdown(Object.keys(globalData[0]));
  }
  document.getElementById('reviewForm').addEventListener('submit', handleSubmit);
}



function initScrollObserver() {
  const options = {
    root: null, // use the viewport
    rootMargin: '-49% 0px -49% 0px', // Only triggers when in the middle 20% of the screen
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-centered');
      } else {
        entry.target.classList.remove('is-centered');
      }
    });
  }, options);

  // Attach observer to all cards
  document.querySelectorAll('.card').forEach(card => {
    observer.observe(card);
  });
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
  dataObject.sheetMode = currentSheet;

  submitBtn.innerText = "Sending...";
  submitBtn.classList.add('glow-sending');
  
  fetch(baseScriptURL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(dataObject)
  }).then(() => {
    submitBtn.classList.remove('glow-sending');
    submitBtn.innerText = "Success!";
    submitBtn.style.color = "#2ecc71";
    
    e.target.reset();

    // --- NEW POPUP CLOSING LOGIC ---
    setTimeout(() => {
      const overlay = document.getElementById('formOverlay');
      if (overlay) {
        overlay.style.display = 'none'; // Hide the popup
      }
      document.body.style.overflow = 'auto';
      // Reset button text for next time
      submitBtn.innerText = "Submit";
      submitBtn.style.color = "#666";
      
      init(); // Refresh the list to show the new album
    }, 1500);
  });
}


