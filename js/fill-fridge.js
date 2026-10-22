/* Fresh'd Fill Fridge: standalone vanilla JS; no external dependencies. */
(() => {
  'use strict';
  const KEY = 'freshd-inventory-v1';
  const $ = id => document.getElementById(id);
  const form = $('food-form');
  const stage = $('fridge-stage');
  const workspace = document.querySelector('.workspace');
  const fridgeImage = $('fridge-image');
  const images = {closed:'images/fridge-closed.png',fridge:'images/fridge-opened.png',freezer:'images/freezer-opened.png',both:'images/fridge-and-freezer-opened.png'};
  const emoji = {'Fruit':'🍓','Vegetables':'🥬','Dairy & Eggs':'🥚','Meat & Seafood':'🥩','Drinks':'🥛','Frozen Foods':'🧊','Snacks':'🍪','Condiments':'🫙','Other':'🥫'};
  const shelfCenter = {top:[50,31],middle:[50,44],bottom:[50,55],freezer:[50,80]};
  let items = load();
  let organizing = false;
  let filter = 'all';
  let view = 'both';
  let editingId = null;
  let selectedId = null;
  let draggedId = null;
  function load(){try{const value=JSON.parse(localStorage.getItem(KEY));return Array.isArray(value)?value:[]}catch{return []}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(items));return true}catch{showError('Browser storage is full. Try smaller images or remove old items.');return false}}
  function showError(message){$('form-error').textContent=message;$('form-error').hidden=false}
  function clearError(){$('form-error').hidden=true;$('form-error').textContent=''}
  function foodIcon(item){if(item.image){const img=document.createElement('img');img.className='food-picture';img.src=item.image;img.alt='';return img}const span=document.createElement('span');span.className='food-emoji';span.textContent=emoji[item.category]||'🥫';span.setAttribute('aria-hidden','true');return span}
  function niceDate(item){if(!item.date||item.dateType==='none')return 'No date';const [y,m,d]=item.date.split('-').map(Number);if(!y||!m||!d)return 'No date';return `${item.dateType==='purchased'?'Bought ':'Exp. '}${new Date(y,m-1,d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`}
  function dateStatus(item){if(!item.date||item.dateType!=='expiration')return '';const [y,m,d]=item.date.split('-').map(Number);const now=new Date();now.setHours(0,0,0,0);const days=Math.round((new Date(y,m-1,d)-now)/86400000);return days<0?' • EXPIRED':days<=3?' • USE SOON':''}
  function filteredItems(){return items.filter(item=>filter==='all'||(filter==='unplaced'?!item.shelf:filter==='freezer'?item.shelf==='freezer':item.shelf!=='freezer'))}
  function render(){
    $('stock-count').textContent=`(${items.length})`;
    $('placed-count').textContent=`${items.filter(item=>item.shelf).length} PLACED`;
    const list=$('stock-list');list.replaceChildren();
    const shown=filteredItems();$('empty-state').hidden=shown.length>0;
    $('empty-state').textContent=items.length?'No items match this filter.':'Your fridge is waiting! Add your first item.';
    for(const item of shown){
      const li=document.createElement('li');li.className='stock-item'+(item.id===selectedId?' selected':'');li.draggable=organizing;
      li.addEventListener('dragstart',event=>{if(!organizing){event.preventDefault();return}draggedId=item.id;event.dataTransfer.setData('text/plain',item.id);event.dataTransfer.effectAllowed='move'});
      const handle=document.createElement('span');handle.className='drag-handle';handle.textContent='⠿';handle.title='Drag to fridge';li.append(handle,foodIcon(item));
      const details=document.createElement('div');details.className='food-details';
      const name=document.createElement('div');name.className='food-name';name.textContent=item.name;
      const meta=document.createElement('div');meta.className='food-meta';meta.textContent=`${item.category}${item.brand?' • '+item.brand:''}\n${item.quantity} ${item.unit} | ${niceDate(item)}${dateStatus(item)}${item.shelf?' | '+item.shelf.toUpperCase():''}`;meta.style.whiteSpace='pre-line';details.append(name,meta);li.append(details);
      const actions=document.createElement('div');actions.className='food-actions';
      const choose=document.createElement('button');choose.type='button';choose.className='select-food';choose.textContent=organizing?'PLACE':'SELECT';choose.setAttribute('aria-label',`Select ${item.name}`);choose.addEventListener('click',()=>select(item.id));actions.append(choose);
      const edit=document.createElement('button');edit.type='button';edit.textContent='EDIT';edit.addEventListener('click',()=>editItem(item));actions.append(edit);
      const del=document.createElement('button');del.type='button';del.textContent='DELETE';del.addEventListener('click',()=>{if(confirm(`Delete ${item.name}?`)){items=items.filter(x=>x.id!==item.id);if(selectedId===item.id)selectedId=null;save();render()}});actions.append(del);li.append(actions);list.append(li)
    }
    document.querySelectorAll('.filter').forEach(btn=>{const active=btn.dataset.filter===filter;btn.classList.toggle('is-selected',active);btn.setAttribute('aria-pressed',String(active))});
    $('shelf-actions').hidden=!organizing||!selectedId;
    renderPlaced();
  }
  function renderPlaced(){
    const box=$('placed-foods');box.replaceChildren();
    if(view==='closed')return;
    for(const item of items.filter(x=>x.shelf&&(view==='both'||(view==='freezer'?x.shelf==='freezer':x.shelf!=='freezer')))){
      const [cx,cy]=shelfCenter[item.shelf]||shelfCenter.middle;
      const el=document.createElement('button');el.type='button';el.className='placed-food'+(selectedId===item.id?' selected':'');el.style.left=`${item.x??cx}%`;el.style.top=`${item.y??cy}%`;el.title=`${item.name} — select`;el.setAttribute('aria-label',`Select ${item.name} on ${item.shelf}`);el.addEventListener('click',()=>select(item.id));
      if(item.image){const img=document.createElement('img');img.src=item.image;img.alt='';el.append(img)}else el.textContent=emoji[item.category]||'🥫';
      box.append(el)
    }
  }
  function select(id){selectedId=id;render();if(organizing)$('place-shelf').focus()}
  function editItem(item){editingId=item.id;$('food-category').value=item.category;$('food-name').value=item.name;$('food-brand').value=item.brand||'';$('food-quantity').value=item.quantity;$('food-unit').value=item.unit;$('food-date-type').value=item.dateType||'expiration';$('food-date').value=item.date||'';dateToggle();$('save-food').textContent='✓ SAVE CHANGES';$('cancel-edit').hidden=false;setMode(false);$('food-name').focus();window.scrollTo({top:0,behavior:'smooth'})}
  function resetForm(){form.reset();editingId=null;$('food-quantity').value=1;$('save-food').textContent='＋ ADD TO FRIDGE';$('cancel-edit').hidden=true;dateToggle();clearError()}
  function dateToggle(){const noDate=$('food-date-type').value==='none';$('food-date').disabled=noDate;if(noDate)$('food-date').value=''}
  function setMode(next){organizing=next;workspace.classList.toggle('organizing',next);$('mode-add').classList.toggle('is-active',!next);$('mode-organize').classList.toggle('is-active',next);$('mode-add').setAttribute('aria-pressed',String(!next));$('mode-organize').setAttribute('aria-pressed',String(next));$('organize-hint').hidden=!next;render()}
  function setView(next){view=next;fridgeImage.src=images[next];fridgeImage.alt={closed:'Closed refrigerator',fridge:'Open refrigerator',freezer:'Open freezer drawer',both:'Refrigerator and freezer both open'}[next];document.querySelectorAll('[data-view]').forEach(btn=>btn.classList.toggle('is-selected',btn.dataset.view===next));stage.classList.toggle('closed-view',next==='closed');document.querySelectorAll('.shelf-zone').forEach(zone=>{zone.hidden=next==='closed'||(next==='fridge'&&zone.dataset.storage==='freezer')||(next==='freezer'&&zone.dataset.storage==='fridge')});renderPlaced()}
  function placeItem(id,shelf,x,y){const item=items.find(x=>x.id===id);if(!item)return;const [cx,cy]=shelfCenter[shelf];item.shelf=shelf;item.x=x??cx;item.y=y??cy;selectedId=id;save();render();if(view==='closed'||(shelf==='freezer'&&view==='fridge')||(shelf!=='freezer'&&view==='freezer'))setView('both')}
  async function fileToDataURL(file){if(!file)return null;if(file.size>750000)throw Error('Please choose a food photo smaller than 750 KB.');return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read image.'));reader.readAsDataURL(file)})}
  form.addEventListener('submit',async event=>{
    event.preventDefault();clearError();const name=$('food-name').value.trim();const quantity=Number($('food-quantity').value);if(!name||!Number.isInteger(quantity)||quantity<1||quantity>9999){showError('Enter a food name and a whole-number quantity between 1 and 9999.');return}
    try{const existing=items.find(x=>x.id===editingId);const photo=await fileToDataURL($('food-image').files[0]);const item={id:existing?.id||((crypto.randomUUID&&crypto.randomUUID())||String(Date.now())+Math.random()),name,category:$('food-category').value,brand:$('food-brand').value.trim(),quantity,unit:$('food-unit').value,dateType:$('food-date-type').value,date:$('food-date').value,image:photo||existing?.image||null,shelf:existing?.shelf||null,x:existing?.x??null,y:existing?.y??null};
      if(existing)items=items.map(x=>x.id===existing.id?item:x);else items.unshift(item);if(!save()){items=load();return}resetForm();render();$('food-name').focus()
    }catch(error){showError(error.message||'Could not save this item.')}
  });
  $('cancel-edit').addEventListener('click',resetForm);$('food-date-type').addEventListener('change',dateToggle);
  $('mode-add').addEventListener('click',()=>setMode(false));$('mode-organize').addEventListener('click',()=>setMode(true));
  $('add-another').addEventListener('click',()=>{setMode(false);$('food-name').focus()});
  document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{filter=btn.dataset.filter;render()}));
  document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.view)));
  document.querySelectorAll('.shelf-zone').forEach(zone=>{
    zone.addEventListener('dragover',event=>{if(!organizing||zone.hidden)return;event.preventDefault();zone.classList.add('drag-over')});
    zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
    zone.addEventListener('drop',event=>{event.preventDefault();zone.classList.remove('drag-over');if(!organizing||zone.hidden)return;const id=event.dataTransfer.getData('text/plain')||draggedId;if(!items.some(item=>item.id===id))return;const rect=stage.getBoundingClientRect();const x=Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100));const y=Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100));placeItem(id,zone.dataset.shelf,x,y)})
  });
  $('place-button').addEventListener('click',()=>{if(selectedId)placeItem(selectedId,$('place-shelf').value)});
  $('unplace-button').addEventListener('click',()=>{const item=items.find(x=>x.id===selectedId);if(item){item.shelf=null;item.x=null;item.y=null;save();render()}});
  $('clear-placements').addEventListener('click',()=>{if(!items.some(x=>x.shelf))return;if(confirm('Remove all food from shelves? Your stock list will be kept.')){items.forEach(item=>{item.shelf=null;item.x=null;item.y=null});save();render()}});
  setView('both');dateToggle();setMode(false);
})();

const fridgeViews = {
    closed: "images/fridge-closed.png",
    fridge: "images/fridge-opened.png",
    freezer: "images/freezer-opened.png",
    both: "images/fridge-and-freezer-opened.png"
};

document.querySelectorAll(".fridge-view-buttons button").forEach(button => {
    button.addEventListener("click", () => {
        const view = button.dataset.view;
        const fridgeImage = document.getElementById("fridge-image");

        if (!fridgeImage || !fridgeViews[view]) return;

        fridgeImage.src = fridgeViews[view];

        document.querySelectorAll(".fridge-view-buttons button")
            .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");
    });
});