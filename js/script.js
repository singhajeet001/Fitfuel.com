/* ============================
     Utility: On-scroll reveal
     ============================ */
     const revealEls = document.querySelectorAll('.reveal');
     const io = new IntersectionObserver((entries)=>{
       entries.forEach(e=>{
         if(e.isIntersecting) e.target.classList.add('inview');
       });
     }, {threshold:0.15});
     revealEls.forEach(el=>io.observe(el));
   
     /* ============================
        Interactive Feature icons:
        - animate icon (active)
        - change features section background smoothly
        ============================ */
     document.querySelectorAll('#features .feature').forEach(f=>{
       f.addEventListener('click', ()=>{
         // toggle active
         document.querySelectorAll('#features .feature').forEach(x=>x.classList.remove('active'));
         f.classList.add('active');
         // change BG of features section
         const bg = f.getAttribute('data-bg') || 'linear-gradient(180deg,#fff,#f6fff6)';
         document.getElementById('features').style.background = bg;
         // small pulse to hero for feedback
         document.querySelector('.hero-card').animate([{transform:'scale(1)'},{transform:'scale(1.02)'},{transform:'scale(1)'}], {duration:450, easing:'ease-out'});
       });
     });
   
     /* ============================
        Meal Box Builder
        - Add buttons add item (data-cal, data-pro, data-carbs, data-fat)
        - Maintains totals and progress relative to last calculated daily target
        ============================ */
     const box = {items:[], calories:0, protein:0, carbs:0, fats:0};
     const dailyTarget = {cal:2200}; // fallback before calc
     function updateBoxUI(){
       const list = document.getElementById('boxList');
       if(box.items.length===0){ list.innerHTML='No items yet. Click Add on products to assemble a box.'; }
       else {
         list.innerHTML = box.items.map(it=>`<div>${it.name} • ${it.cal} kcal</div>`).join('');
       }
       document.getElementById('boxCal').innerText = box.calories;
       // progress relative to daily target
       const pct = Math.min(100, Math.round((box.calories / dailyTarget.cal)*100));
       document.getElementById('calBar').style.width = pct+'%';
     }
   
     document.querySelectorAll('.btn-add').forEach(btn=>{
       btn.addEventListener('click', ()=>{
         const name = btn.dataset.name;
         const cal = Number(btn.dataset.cal)||0;
         const pro = Number(btn.dataset.pro)||0;
         const carbs = Number(btn.dataset.carbs)||0;
         const fat = Number(btn.dataset.fat)||0;
         box.items.push({name,cal,pro,carbs,fat});
         box.calories += cal; box.protein += pro; box.carbs += carbs; box.fats += fat;
         updateBoxUI();
         // add micro animation to button
         btn.animate([{transform:'scale(1)'},{transform:'scale(1.07)'},{transform:'scale(1)'}], {duration:280, easing:'ease-out'});
       });
     });
   
     function clearBox(){ box.items=[]; box.calories=0; box.protein=0; box.carbs=0; box.fats=0; updateBoxUI(); }
     function randomBox(){
       // pick up to 3 items randomly from product cards
       const addBtns = Array.from(document.querySelectorAll('.btn-add'));
       clearBox();
       for(let i=0;i<3;i++){
         const b = addBtns[Math.floor(Math.random()*addBtns.length)];
         b.click();
       }
     }
     function checkout(){ alert('Checkout flow placeholder — integrate your payment backend here.'); }
   
     /* ============================
        Macro Calculator (Mifflin-St Jeor)
        - gender, weight, height, age, activity multiplier, goal (cal delta)
        - calculates TDEE and macros (protein/carbs/fats grams)
        ============================ */
     function calculateMacros(){
       const gender = document.querySelector('input[name="gender"]:checked').value;
       const weight = Number(document.getElementById('mWeight').value) || 70;
       const height = Number(document.getElementById('mHeight').value) || 175;
       const age = Number(document.getElementById('mAge').value) || 26;
       const activity = Number(document.getElementById('mActivity').value) || 1.55;
       const goalDelta = Number(document.getElementById('mGoal').value) || 0;
   
       // BMR: Mifflin-St Jeor
       // male: 10*w + 6.25*h - 5*age + 5
       // female: 10*w + 6.25*h - 5*age - 161
       let bmr = 10*weight + 6.25*height - 5*age + (gender==='male'?5:-161);
       // TDEE
       let tdee = Math.round(bmr * activity + goalDelta);
   
       // choose macro split by goal
       const goalType = goalDelta>0 ? 'muscle' : (goalDelta<0 ? 'weightloss' : 'maintenance');
       let split;
       if(goalType==='muscle') split = {p:0.30, c:0.45, f:0.25};
       else if(goalType==='weightloss') split = {p:0.35, c:0.35, f:0.30};
       else split = {p:0.30, c:0.40, f:0.30};
   
       const proteinCals = Math.round(tdee * split.p);
       const carbCals = Math.round(tdee * split.c);
       const fatCals = Math.round(tdee * split.f);
   
       const proteinG = Math.round(proteinCals / 4);
       const carbsG = Math.round(carbCals / 4);
       const fatsG = Math.round(fatCals / 9);
   
       // update UI
       document.getElementById('macroResults').classList.remove('d-none');
       document.getElementById('resCalories').innerText = `Estimated daily calories: ${tdee} kcal (BMR: ${Math.round(bmr)} kcal)`;
       document.getElementById('resMacros').innerText = `Protein: ${proteinG} g | Carbs: ${carbsG} g | Fats: ${fatsG} g — split p:${Math.round(split.p*100)}% c:${Math.round(split.c*100)}% f:${Math.round(split.f*100)}%`;
   
       // store for meal suggestions and progress bar base
       dailyTarget.cal = tdee;
       updateBoxUI();
       // Auto-scroll result into view
       document.getElementById('macroResults').scrollIntoView({behavior:'smooth', block:'center'});
     }
   
     /* ============================
        Suggest Foods (based on TDEE)
        ============================ */
     function suggestFoods(){
       // simple suggestion based on dailyTarget.cal
       const cal = dailyTarget.cal || 2000;
       const suggestions = [];
       if(cal < 1800) suggestions.push('Lean sprouts bowl + boiled sweet potato + green salad');
       else if(cal < 2400) suggestions.push('Sprouts salad + chana curry + fruits + almonds');
       else suggestions.push('Larger portions: sprout+chana bowl, oats+banana, nuts & fruit, extra lean protein');
   
       alert('Suggested combo(s):\n• ' + suggestions.join('\n• '));
     }
   
     /* ============================
        Diet Teller — simple day plan generator based on goal selected
        - uses dailyTarget.cal if available, else defaults
        ============================ */
     const foods = {
       'Sprouted Moong': {cal:120, pro:10, carbs:14, fat:1},
       'Black Chana (100g)': {cal:160, pro:8, carbs:27, fat:2},
       'Honey (1 tbsp)': {cal:64, pro:0, carbs:17, fat:0},
       'Banana': {cal:89, pro:1, carbs:23, fat:0.3},
       'Almonds (28g)': {cal:164, pro:6, carbs:6, fat:14},
       'Broccoli (100g)': {cal:55, pro:3.7, carbs:11, fat:0.6},
       'Sweet Potato (150g)': {cal:130, pro:2, carbs:30, fat:0}
     };
   
     function tellDiet(){
       const goal = document.getElementById('tGoal').value; // maintenance, weightloss, muscle
       const base = dailyTarget.cal || 2200;
       let dayCalories = base;
       if(goal==='weightloss') dayCalories = Math.round(base * 0.8);
       if(goal==='muscle') dayCalories = Math.round(base * 1.12);
   
       // meal distribution: breakfast 25%, snack 10%, lunch 30%, snack 10%, dinner 25%
       const dist = {b:0.25, s1:0.10, l:0.30, s2:0.10, d:0.25};
       const buildMeal = (kcal) => {
         // simple greedy pack of foods to reach approx kcal
         const order = Object.entries(foods);
         let remaining = kcal;
         let items = [];
         for(let [name,info] of order){
           if(remaining <= 0) break;
           if(info.cal <= remaining + 30){
             items.push(name);
             remaining -= info.cal;
           }
         }
         if(items.length===0) items.push('Fruits & nuts');
         return items;
       };
   
       const breakfast = buildMeal(Math.round(dayCalories*dist.b));
       const snack1 = buildMeal(Math.round(dayCalories*dist.s1));
       const lunch = buildMeal(Math.round(dayCalories*dist.l));
       const snack2 = buildMeal(Math.round(dayCalories*dist.s2));
       const dinner = buildMeal(Math.round(dayCalories*dist.d));
   
       const html = `
         <div><strong>Goal:</strong> ${goal} • Target: ${dayCalories} kcal</div>
         <ul class="mt-2">
           <li><strong>Breakfast:</strong> ${breakfast.join(', ')}</li>
           <li><strong>Mid-morning Snack:</strong> ${snack1.join(', ')}</li>
           <li><strong>Lunch:</strong> ${lunch.join(', ')}</li>
           <li><strong>Afternoon Snack:</strong> ${snack2.join(', ')}</li>
           <li><strong>Dinner:</strong> ${dinner.join(', ')}</li>
         </ul>
         <div class="mt-2 small text-muted">Tip: Adjust portion sizes to better match your calculated macros.</div>
       `;
       document.getElementById('tellerResult').innerHTML = html;
       document.getElementById('tellerResult').scrollIntoView({behavior:'smooth'});
     }
   
     /* ============================
        Diet Plan generator for multiple days (1/3/7)
        - rotates simple templates with variations
        ============================ */
     function generateDietPlan(){
       const days = Number(document.getElementById('planDays').value) || 7;
       const base = dailyTarget.cal || 2200;
       const planContainer = document.getElementById('planResult');
       planContainer.innerHTML = '';
       const templates = [
         {b:['Oats + banana + almonds'], l:['Chana salad + brown rice'], d:['Grilled veggies + sprouts'], s:['Fruit','Greek yogurt']},
         {b:['Sprouts + sweet potato'], l:['Black chana curry + salad'], d:['Broccoli stir-fry + quinoa'], s:['Apple + nuts']},
         {b:['Smoothie (milk/banana/honey)'], l:['Sprouts bowl + roti'], d:['Baked sweet potato + broccoli'], s:['Makhana']},
       ];
       for(let i=0;i<days;i++){
         const tpl = templates[i % templates.length];
         const dayBox = document.createElement('div');
         dayBox.className = 'plan-day mb-2';
         dayBox.innerHTML = `<strong>Day ${i+1} — target ${Math.round(base)} kcal</strong>
           <div class="mt-2 small">
             <div><strong>Breakfast:</strong> ${tpl.b.join(', ')}</div>
             <div><strong>Lunch:</strong> ${tpl.l.join(', ')}</div>
             <div><strong>Dinner:</strong> ${tpl.d.join(', ')}</div>
             <div><strong>Snacks:</strong> ${tpl.s.join(', ')}</div>
           </div>`;
         planContainer.appendChild(dayBox);
       }
       planContainer.scrollIntoView({behavior:'smooth'});
     }
   
     /* ============================
        Small helpers
        ============================ */
     function showDetails(title, text){
       alert(title + '\\n\\n' + text);
     }
   
     // Open modals / scrollers
     document.getElementById('openCalc').addEventListener('click', ()=> document.getElementById('calculator').scrollIntoView({behavior:'smooth'}));
     document.getElementById('openOrder').addEventListener('click', ()=> document.getElementById('products').scrollIntoView({behavior:'smooth'}));
   
     // init
     updateBoxUI();