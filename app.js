// Calculator + payment flow (clean implementation)
const displayEl = document.getElementById('display');
const historyEl = document.getElementById('history');
const statusEl = document.getElementById('status');
const modal = document.getElementById('modal');
const backdrop = document.getElementById('backdrop');
const processingScreen = document.getElementById('processingScreen');
const resultScreen = document.getElementById('resultScreen');
const resultValue = document.getElementById('resultValue');
const resultExpression = document.getElementById('resultExpression');
const calcAgainBtn = document.getElementById('calcAgain');

let current = '0';
let operator = null;
let first = null;
let awaitingSecond = false;
let pendingCompute = null;

const PLANS = {
  basic: {name:'Basic', price:18, credits:1, ops:['+','-']},
  advanced: {name:'Advanced', price:36, credits:3, ops:['+','-','*']},
  professional: {name:'Professional', price:67, credits:5, ops:['+','-','*','/']}
};

let plan = JSON.parse(localStorage.getItem('calc_plan') || 'null');

function savePlan(){ localStorage.setItem('calc_plan', JSON.stringify(plan)); updateStatus(); updateUIState(); }
function updateStatus(){ if(!plan) { statusEl.textContent = 'No plan chosen'; return; } statusEl.textContent = `${plan.name} — ${plan.credits} calculation${plan.credits===1?'':'s'} left`; }
function updateUIState(){
  // disable multiply/divide buttons when plan doesn't allow or credits exhausted
  Array.from(document.querySelectorAll('.op')).forEach(b=>{
    const op = b.dataset.op;
    if(op === '*' || op === '/'){
      if(!plan || !plan.ops.includes(op) || (plan && plan.credits <= 0)){
        b.disabled = true; b.classList.add('disabled');
      } else {
        b.disabled = false; b.classList.remove('disabled');
      }
    }
  });
}
updateStatus();
updateUIState();

function refresh(){ displayEl.textContent = current; historyEl.textContent = first !== null && operator ? `${first} ${operator}` : '' }
function clearAll(){ current='0'; first=null; operator=null; awaitingSecond=false; pendingCompute=null; refresh(); }
function clearEntry(){ current='0'; refresh(); }

function inputNum(n){
  if(awaitingSecond){ current = n; awaitingSecond = false; }
  else if(n === '.' && current.includes('.')) return;
  else if(current === '0' && n !== '.') current = n;
  else current = current + n;
  refresh();
}

function chooseOp(op){
  // if op needs plan and not permitted, open modal
  if((op === '*' || op === '/') && (!plan || !plan.ops.includes(op) || (plan && plan.credits <= 0))){
    pendingCompute = {type:'opclick', op};
    openModal();
    return;
  }

  if(first === null){ first = parseFloat(current); }
  else if(operator){
    const result = compute();
    first = result;
    current = String(result);
  }
  operator = op; awaitingSecond = true; refresh();
}

function compute(){
  let a = first; let b = parseFloat(current); let res = 0;
  switch(operator){
    case '+': res = a + b; break;
    case '-': res = a - b; break;
    case '*': res = a * b; break;
    case '/': res = b === 0 ? 'Error' : a / b; break;
  }
  return (typeof res === 'number') ? +res.toPrecision(12) : res;
}

function handleEquals(){
  if(!operator) return;
  if(!plan || plan.credits <= 0){ pendingCompute = {type:'equals'}; openModal(); return; }
  const result = compute();
  plan.credits = Math.max(0, plan.credits - 1); savePlan();
  current = String(result); first = null; operator = null; awaitingSecond = false; refresh();
}

// Modal handling
function openModal(){ modal.setAttribute('aria-hidden','false'); modal.style.display = 'flex'; }
function closeModal(){ modal.setAttribute('aria-hidden','true'); modal.style.display = 'none'; }
backdrop.addEventListener('click', closeModal);
document.getElementById('closeModal').addEventListener('click', closeModal);

// Processing & result screens
function showProcessingScreen(){ processingScreen.classList.remove('hidden'); processingScreen.setAttribute('aria-hidden','false'); }
function hideProcessingScreen(){ processingScreen.classList.add('hidden'); processingScreen.setAttribute('aria-hidden','true'); }
function showResultScreen(expression, value){ resultExpression.textContent = expression || ''; resultValue.textContent = value; resultScreen.classList.remove('hidden'); resultScreen.setAttribute('aria-hidden','false'); }
function hideResultScreen(){ resultScreen.classList.add('hidden'); resultScreen.setAttribute('aria-hidden','true'); }
calcAgainBtn.addEventListener('click', ()=>{ hideResultScreen(); clearAll(); });

// start payment simulation
function startPayment(key){
  closeModal();
  showProcessingScreen();
  document.querySelectorAll('.choose').forEach(b=>b.disabled=true);

  setTimeout(()=>{
    plan = Object.assign({}, PLANS[key]);
    savePlan();
    hideProcessingScreen();

    if(pendingCompute){
      if(pendingCompute.type === 'equals'){
        if(!plan.ops.includes(operator)){
          showResultScreen('', 'Operation not allowed'); pendingCompute = null; document.querySelectorAll('.choose').forEach(b=>b.disabled=false); return;
        }
        const result = compute();
        plan.credits = Math.max(0, plan.credits - 1);
        savePlan();
        showResultScreen(`${first} ${operator} ${current}`, result);
        current = String(result); first = null; operator = null; awaitingSecond = false;
      } else if(pendingCompute.type === 'opclick'){
        operator = pendingCompute.op; awaitingSecond = true; showResultScreen('', 'Plan activated');
      }
      pendingCompute = null;
    } else {
      showResultScreen('', 'Payment completed');
    }

    document.querySelectorAll('.choose').forEach(b=>b.disabled=false);
  },3000);
}

// hook plan buttons (modal) and other UI
Array.from(document.querySelectorAll('.choose')).forEach(btn=>{ if(btn.dataset && btn.dataset.plan){ btn.addEventListener('click', ()=> startPayment(btn.dataset.plan)); } });
Array.from(document.querySelectorAll('.num')).forEach(b=> b.addEventListener('click', ()=> inputNum(b.dataset.num)));
Array.from(document.querySelectorAll('.op')).forEach(b=> b.addEventListener('click', ()=> chooseOp(b.dataset.op)));

document.getElementById('equals').addEventListener('click', ()=>{
  if(operator === '*' || operator === '/'){
    if(!plan || !plan.ops.includes(operator)){
      pendingCompute = {type:'equals'}; openModal(); return;
    }
  }
  handleEquals();
});

// Controls
document.getElementById('c').addEventListener('click', ()=> clearAll());
document.getElementById('ce').addEventListener('click', ()=> clearEntry());

// keyboard
window.addEventListener('keydown',(e)=>{
  if(e.key >= '0' && e.key <= '9') inputNum(e.key);
  if(e.key === '.') inputNum('.');
  if(['+','-','*','/'].includes(e.key)) chooseOp(e.key);
  if(e.key === 'Enter') handleEquals();
  if(e.key === 'Backspace') clearEntry();
});

// initial render
refresh();