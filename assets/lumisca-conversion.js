document.addEventListener('DOMContentLoaded',function(){

// Cart drawer
const cartIcon=document.querySelector('.cart-icon');
const cartDrawer=document.querySelector('.cart-drawer');
const cartOverlay=document.querySelector('.cart-drawer-overlay');
const cartClose=document.querySelector('.cart-drawer-close');
function openCart(){if(cartDrawer)cartDrawer.classList.add('active');document.body.style.overflow='hidden';}
function closeCart(){if(cartDrawer)cartDrawer.classList.remove('active');document.body.style.overflow='';}
if(cartIcon)cartIcon.addEventListener('click',function(e){e.preventDefault();openCart();});
if(cartOverlay)cartOverlay.addEventListener('click',closeCart);
if(cartClose)cartClose.addEventListener('click',closeCart);

// Quantity buttons
document.addEventListener('click',async function(e){
if(e.target.classList.contains('qty-plus')){
const key=e.target.dataset.key;
const res=await fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:key,quantity:parseInt(e.target.closest('.cart-item-qty').querySelector('span').textContent)+1})});
if(res.ok)location.reload();
}
if(e.target.classList.contains('qty-minus')){
const key=e.target.dataset.key;
const qty=parseInt(e.target.closest('.cart-item-qty').querySelector('span').textContent)-1;
const res=await fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:key,quantity:qty})});
if(res.ok)location.reload();
}
if(e.target.classList.contains('cart-item-remove')||e.target.closest('.cart-item-remove')){
const key=e.target.dataset.key||e.target.closest('.cart-item-remove').dataset.key;
const res=await fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:key,quantity:0})});
if(res.ok)location.reload();
}
});

// Add to cart with upsell popup
document.querySelectorAll('.main-atc,.btn-atc').forEach(btn=>{
btn.addEventListener('click',async function(e){
e.preventDefault();
const variantId=this.dataset.variantId;
const qty=parseInt(document.querySelector('.qty-input')?.value||1);
if(!variantId)return;
const res=await fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:variantId,quantity:qty})});
if(res.ok){
const cartCount=document.querySelectorAll('.cart-count');
const cartData=await fetch('/cart.js').then(r=>r.json());
cartCount.forEach(el=>el.textContent=cartData.item_count);
const upsellPopup=document.querySelector('#cart-upsell-popup');
if(upsellPopup&&!window.location.href.includes('bundle'))upsellPopup.classList.add('active');
else openCart();
}
});
});

// WhatsApp button
const waNum=document.querySelector('meta[name="whatsapp-number"]');
if(waNum){
const waBtn=document.createElement('a');
waBtn.href='https://wa.me/'+waNum.content;
waBtn.className='whatsapp-btn';
waBtn.target='_blank';
waBtn.rel='noopener noreferrer';
waBtn.setAttribute('aria-label','Chat on WhatsApp');
waBtn.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
document.body.appendChild(waBtn);
}

// Volume discount table
document.querySelectorAll('.volume-table tr').forEach(row=>{
row.addEventListener('click',function(){
document.querySelectorAll('.volume-table tr').forEach(r=>r.classList.remove('selected'));
this.classList.add('selected');
const price=this.dataset.price;
const priceEl=document.querySelector('.product-price');
if(priceEl&&price)priceEl.textContent='£'+price;
});
});

// Free shipping progress bar
function updateShippingBar(){
fetch('/cart.js').then(r=>r.json()).then(cart=>{
const bar=document.querySelector('.progress-bar-fill');
const text=document.querySelector('.free-shipping-text');
if(!bar)return;
const total=cart.total_price/100;
const threshold=80;
const pct=Math.min((total/threshold)*100,100);
bar.style.width=pct+'%';
if(text){
if(pct>=100){text.textContent='🎉 You\'ve unlocked free UK delivery!';}
else{text.textContent='You\'re £'+(threshold-total).toFixed(2)+' away from free delivery';}
}
});
}
updateShippingBar();

});
