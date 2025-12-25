// 1. Main API URL
const BASE = 'https://api.thecatapi.com/v1';

// 2. Endpoints used in project
const ENDPOINTS = {
  IMAGES: BASE+'/images/search',     // get cat images
  BREEDS: BASE+'/breeds',            // get all breeds
  BREED_SEARCH: BASE+'/breeds/search'// search breed by name
};

// --- DOM ELEMENTS ---
const status = document.getElementById('statusContainer'); // error/loading container
const results = document.getElementById('results');       // where cat cards will show
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const breedSelect = document.getElementById('breedSelect');
const randomBtn = document.getElementById('randomBtn');
const darkToggle = document.getElementById('darkToggle');

/* --- 5. SAMPLE JSON RESPONSE ---
[
  {
    "id": "abc123",
    "url": "https://cdn2.thecatapi.com/images/abc123.jpg",
    "breeds": [
      {
        "id": "beng",
        "name": "Bengal",
        "life_span": "12 - 16",
        "temperament": "Alert, Agile, Energetic",
        "description": "The Bengal is a domestic cat breed..."
      }
    ]
  }
]
*/

// --- UTILITY FUNCTIONS ---
// showStatus displays loading, error, or messages
function showStatus(msg, {loading=false, error=false}={}){
  status.innerHTML='';
  if(loading){ const spin=document.createElement('span'); spin.className='spinner'; status.appendChild(spin); }
  const div = document.createElement('div'); div.textContent = msg;
  if(error) div.className='error';
  status.appendChild(div);
}

// clearStatus removes messages
function clearStatus(){ status.innerHTML=''; }

// disableControls disables buttons/inputs while fetching data
function disableControls(d=true){ [searchInput,breedSelect,randomBtn].forEach(el=>el.disabled=d); }

// sanitize trims whitespace and removes weird characters
function sanitize(text){ return text?text.trim():''; }

// --- API FUNCTIONS ---
// fetch all breeds
async function getBreeds(){
  const res = await fetch(ENDPOINTS.BREEDS);
  if(!res.ok) throw Error('Cannot load breeds');
  return await res.json();
}

// fetch images, optionally filtered by breed id
async function getImages(breedId=null, limit=1){
  let url = ENDPOINTS.IMAGES + '?limit='+limit;
  if(breedId) url += '&breed_ids='+breedId;
  const res = await fetch(url);
  if(!res.ok) throw Error('Cannot fetch image');
  return await res.json();
}

// search breed by name
async function searchBreeds(q){
  const res = await fetch(ENDPOINTS.BREED_SEARCH+'?q='+encodeURIComponent(q));
  if(!res.ok) throw Error('Search failed');
  return await res.json();
}

// --- DOM FUNCTIONS ---
// fill dropdown with all breeds
function renderDropdown(breeds){
  breedSelect.innerHTML='<option value="">-- Select a breed --</option>';
  breeds.forEach(b=>{
    const o=document.createElement('option'); o.value=b.id; o.textContent=b.name;
    breedSelect.appendChild(o);
  });
}

// create a cat card
function renderCard(imgObj, breed){
  const card = document.createElement('div'); card.className='card';

  const img = document.createElement('img');
  img.src=imgObj.url;
  img.alt=breed?.name || 'Cat';
  card.appendChild(img);

  const h = document.createElement('h3'); h.textContent=breed?.name || 'Unknown'; card.appendChild(h);

  const info = document.createElement('div'); info.className='info-row';
  if(breed){
    info.textContent = `Life: ${breed.life_span} yrs | Temperament: ${breed.temperament}`;
  } else info.textContent='No breed info';
  card.appendChild(info);

  if(breed?.description){ const p=document.createElement('p'); p.textContent=breed.description; card.appendChild(p); }
  return card;
}

// show message if no result
function renderNoResult(msg='No result'){ const d=document.createElement('div'); d.className='card'; d.textContent=msg; return d; }

// --- INITIALIZATION ---
async function init(){
  try{
    showStatus('Loading breeds...', {loading:true});
    disableControls(true);
    const breeds = await getBreeds();
    window._BREEDS = breeds.reduce((a,b)=>{a[b.id]=b; return a;},{});
    renderDropdown(breeds);
    clearStatus();
  } catch(e){ showStatus('Failed: '+e.message, {error:true}); }
  finally{ disableControls(false); }
}

// --- EVENT HANDLERS ---
// random cat button
async function handleRandom(){
  try{
    showStatus('Loading random...', {loading:true});
    disableControls(true); results.innerHTML='';
    const imgs = await getImages();
    results.appendChild(imgs[0]?renderCard(imgs[0], imgs[0].breeds?.[0]) : renderNoResult());
  } catch(e){ showStatus('Error: '+e.message, {error:true}); }
  finally{ clearStatus(); disableControls(false); }
}

// select breed from dropdown
async function handleBreedSelect(){
  const id = sanitize(breedSelect.value); if(!id) return;
  try{
    showStatus('Loading breed...', {loading:true});
    disableControls(true); results.innerHTML='';
    const imgs = await getImages(id);
    results.appendChild(imgs[0]?renderCard(imgs[0], window._BREEDS[id]) : renderNoResult());
  } catch(e){ showStatus('Error: '+e.message, {error:true}); }
  finally{ clearStatus(); disableControls(false); }
}

// search by text input
async function handleSearch(e){
  e.preventDefault();
  const q = sanitize(searchInput.value); if(!q){ showStatus('Enter breed', {error:true}); return; }
  try{
    showStatus('Searching...', {loading:true});
    disableControls(true); results.innerHTML='';
    const matches = await searchBreeds(q);
    if(!matches.length){ results.appendChild(renderNoResult('No breed found')); return; }
    for(const b of matches){
      const imgs = await getImages(b.id);
      results.appendChild(imgs[0]?renderCard(imgs[0], b) : renderNoResult('No image for '+b.name));
    }
    breedSelect.value=matches[0]?.id || '';
  } catch(e){ showStatus('Error: '+e.message, {error:true}); }
  finally{ clearStatus(); disableControls(false); }
}

// --- INIT EVENT LISTENERS ---
init();
randomBtn.onclick = handleRandom;
breedSelect.onchange = handleBreedSelect;
searchForm.onsubmit = handleSearch;

// toggle dark mode
darkToggle.onclick = ()=>{
  const dark = document.body.classList.toggle('dark');
  darkToggle.textContent=dark?'☀️':'🌙';
};
