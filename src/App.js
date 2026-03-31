import { useState, useEffect, useMemo, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════ */
const CATEGORIES = ["Food","Transport","Shopping","Health","Entertainment","Bills","Education","Rent","Investment","Other"];
const CAT_COLOR  = {Food:"#F97316",Transport:"#3B82F6",Shopping:"#EC4899",Health:"#10B981",Entertainment:"#8B5CF6",Bills:"#EF4444",Education:"#06B6D4",Rent:"#F59E0B",Investment:"#22C55E",Other:"#6B7280"};
const CAT_ICON   = {Food:"🍔",Transport:"🚌",Shopping:"🛍️",Health:"💊",Entertainment:"🎬",Bills:"📄",Education:"📚",Rent:"🏠",Investment:"📈",Other:"📦"};
const TABS = [
  {id:"dashboard", label:"Home",      icon:"⚡"},
  {id:"expenses",  label:"Expenses",  icon:"💸"},
  {id:"budget",    label:"Budget",    icon:"🎯"},
  {id:"emi",       label:"EMI",       icon:"🏦"},
  {id:"debts",     label:"Debts",     icon:"🤝"},
  {id:"analytics", label:"Analytics", icon:"📊"},
];

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const fmt    = n  => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);
const fmtD   = d  => new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
const today  = () => new Date().toISOString().split("T")[0];
const uid    = () => Math.random().toString(36).slice(2,9);

/* ═══════════════════════════════════════════════════
   SEED DATA
═══════════════════════════════════════════════════ */
const SEED_EXP = [
  {id:"e1",title:"Zomato Order",     amount:480,  date:"2025-03-01",category:"Food",         note:"",         recurring:false},
  {id:"e2",title:"Metro Card",       amount:500,  date:"2025-03-02",category:"Transport",    note:"",         recurring:true },
  {id:"e3",title:"Amazon – Earbuds", amount:2199, date:"2025-03-04",category:"Shopping",     note:"Sony WF",  recurring:false},
  {id:"e4",title:"Gym Membership",   amount:1500, date:"2025-03-05",category:"Health",       note:"",         recurring:true },
  {id:"e5",title:"Netflix",          amount:649,  date:"2025-03-06",category:"Entertainment",note:"",         recurring:true },
  {id:"e6",title:"Electricity Bill", amount:1340, date:"2025-03-08",category:"Bills",        note:"",         recurring:true },
  {id:"e7",title:"Udemy Course",     amount:399,  date:"2025-03-10",category:"Education",    note:"React DSA",recurring:false},
  {id:"e8",title:"Rent",             amount:12000,date:"2025-03-01",category:"Rent",         note:"March",    recurring:true },
  {id:"e9",title:"SIP – MF",         amount:3000, date:"2025-03-05",category:"Investment",   note:"",         recurring:true },
  {id:"e10",title:"Groceries",       amount:1800, date:"2025-03-12",category:"Food",         note:"Weekly",   recurring:false},
];
const SEED_INC = [
  {id:"i1",title:"Salary",          amount:52000,date:"2025-03-01",source:"Employment",note:"",       recurring:true },
  {id:"i2",title:"Freelance Project",amount:9500,date:"2025-03-10",source:"Freelance", note:"UI work",recurring:false},
];
const SEED_BUD = {Food:5000,Transport:2000,Shopping:4000,Health:2000,Entertainment:1500,Bills:3000,Education:2000,Rent:13000,Investment:5000,Other:2000};
const SEED_EMI = [
  {id:"m1",title:"Home Loan",  bank:"SBI",  principal:1500000,outstanding:1200000,emi:14500,rate:8.5,tenure:240,paid:36,startDate:"2022-03-01",icon:"🏠"},
  {id:"m2",title:"Phone Loan", bank:"HDFC", principal:60000,  outstanding:22000,  emi:5500, rate:14, tenure:12, paid:7, startDate:"2024-08-01",icon:"📱"},
];
const SEED_DEBT = [
  {id:"d1",person:"Rahul",type:"lent",    amount:2500,date:"2025-02-15",note:"Restaurant split",settled:false},
  {id:"d2",person:"Priya",type:"borrowed",amount:1000,date:"2025-03-01",note:"Petrol",           settled:false},
  {id:"d3",person:"Arjun",type:"lent",    amount:5000,date:"2025-01-20",note:"Medical emergency", settled:true },
];

/* ═══════════════════════════════════════════════════
   TINY CHART PRIMITIVES
═══════════════════════════════════════════════════ */
function DonutChart({data,size=150}){
  const total=data.reduce((s,d)=>s+d.value,0);
  if(!total) return <div style={{width:size,height:size,borderRadius:"50%",background:"#1E293B",display:"flex",alignItems:"center",justifyContent:"center",color:"#334155",fontSize:12}}>No data</div>;
  let angle=-90;
  const cx=size/2,cy=size/2,r=size*.36,sw=size*.13;
  const arcs=data.map(d=>{
    const sweep=d.value/total*360, s=angle;
    angle+=sweep;
    const r1=s*Math.PI/180, r2=(s+sweep-.5)*Math.PI/180;
    return{...d,path:`M${cx+r*Math.cos(r1)} ${cy+r*Math.sin(r1)} A${r} ${r} 0 ${sweep>180?1:0} 1 ${cx+r*Math.cos(r2)} ${cy+r*Math.sin(r2)}`};
  });
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a,i)=><path key={i} d={a.path} fill="none" stroke={a.color} strokeWidth={sw} strokeLinecap="butt" opacity=".9"/>)}
      <text x={cx} y={cy-7} textAnchor="middle" fill="#F1F5F9" fontSize={size*.085} fontFamily="'JetBrains Mono',monospace" fontWeight="700">{fmt(total)}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fill="#64748B" fontSize={size*.065} fontFamily="'Lato',sans-serif">spent</text>
    </svg>
  );
}

function ProgressBar({value,max,color,height=8}){
  const pct=Math.min((value/(max||1))*100,100);
  return(
    <div style={{height,background:"#1E293B",borderRadius:height/2,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:height/2,transition:"width .5s ease"}}/>
    </div>
  );
}

function MiniBarChart({data,h=120}){
  if(!data?.length) return null;
  const max=Math.max(...data.map(d=>d.value),1);
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:h,padding:"0 2px"}}>
      {data.map((d,i)=>{
        const bh=Math.max((d.value/max)*(h-32),4);
        return(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:8,color:"#64748B",fontFamily:"'JetBrains Mono',monospace"}}>{d.value>999?`${(d.value/1000).toFixed(0)}k`:d.value||""}</span>
            <div style={{width:"100%",height:bh,background:d.color||"#3B82F6",borderRadius:"3px 3px 0 0",opacity:.85}}/>
            <span style={{fontSize:8,color:"#94A3B8",textAlign:"center",lineHeight:1.1}}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   REUSABLE UI ATOMS
═══════════════════════════════════════════════════ */
function Modal({title,onClose,children}){
  useEffect(()=>{
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow="";};
  },[]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300,padding:0}} onClick={onClose}>
      <div style={{background:"#111827",borderRadius:"20px 20px 0 0",padding:"0",width:"100%",maxWidth:480,maxHeight:"92vh",display:"flex",flexDirection:"column",border:"1px solid #1E293B"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 0"}}>
          <div style={{width:36,height:4,background:"#334155",borderRadius:2}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px 16px"}}>
          <span style={{fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:17,color:"#F1F5F9"}}>{title}</span>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:"#1E293B",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:"0 20px 28px",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

const Fld = ({label,children}) => (
  <div style={{marginBottom:14}}>
    <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:".6px",marginBottom:6}}>{label}</label>
    {children}
  </div>
);
const Inp = (props) => (
  <input {...props} style={{width:"100%",background:"#0F172A",border:"1px solid #1E293B",borderRadius:10,padding:"12px 14px",color:"#E2E8F0",fontFamily:"'Lato',sans-serif",fontSize:15,outline:"none",WebkitAppearance:"none",boxSizing:"border-box",...props.style}}
    onFocus={e=>e.target.style.borderColor="#3B82F6"} onBlur={e=>e.target.style.borderColor="#1E293B"}/>
);
const Sel = ({children,...props}) => (
  <select {...props} style={{width:"100%",background:"#0F172A",border:"1px solid #1E293B",borderRadius:10,padding:"12px 14px",color:"#E2E8F0",fontFamily:"'Lato',sans-serif",fontSize:15,outline:"none",cursor:"pointer",WebkitAppearance:"none",boxSizing:"border-box",...props.style}}>
    {children}
  </select>
);
const Btn = ({children,variant="primary",full,sm,...props}) => {
  const base={cursor:"pointer",borderRadius:12,fontFamily:"'Lato',sans-serif",fontWeight:700,transition:"all .18s",outline:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,boxSizing:"border-box"};
  const sz=sm?{padding:"8px 14px",fontSize:13}:{padding:"13px 22px",fontSize:15};
  const v={
    primary:{background:"#2563EB",color:"#fff",border:"none"},
    success:{background:"#059669",color:"#fff",border:"none"},
    danger: {background:"#DC2626",color:"#fff",border:"none"},
    ghost:  {background:"#1E293B",color:"#94A3B8",border:"1px solid #334155"},
    outline:{background:"transparent",color:"#3B82F6",border:"1px solid #3B82F6"},
  };
  return <button {...props} style={{...base,...sz,...v[variant],width:full?"100%":undefined,...props.style}}>{children}</button>;
};

function StatCard({label,value,sub,color,icon,onClick}){
  return(
    <div onClick={onClick} style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16,padding:"16px 18px",cursor:onClick?"pointer":undefined,transition:"border-color .2s",minWidth:0}}
      onMouseEnter={e=>onClick&&(e.currentTarget.style.borderColor="#3B82F660")}
      onMouseLeave={e=>e.currentTarget.style.borderColor="#1E293B"}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <span style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:".5px"}}>{label}</span>
        <span style={{fontSize:20,lineHeight:1}}>{icon}</span>
      </div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:19,fontWeight:700,color:color||"#F1F5F9",marginBottom:3,wordBreak:"break-all"}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"#64748B"}}>{sub}</div>}
    </div>
  );
}

function SectionHead({title,action}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:15,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".6px"}}>{title}</h2>
      {action}
    </div>
  );
}

function CatPill({cat,active,onClick}){
  const c=CAT_COLOR[cat]||"#3B82F6";
  return(
    <button onClick={onClick} style={{cursor:"pointer",padding:"6px 12px",borderRadius:20,border:`1px solid ${active?c:"#1E293B"}`,background:active?c+"22":"transparent",color:active?c:"#64748B",fontSize:12,fontWeight:700,transition:"all .15s",whiteSpace:"nowrap",fontFamily:"'Lato',sans-serif"}}>
      {cat==="All"?"All ✦":`${CAT_ICON[cat]} ${cat}`}
    </button>
  );
}

function TxRow({item,isExpense,onEdit,onDelete}){
  const c=isExpense?CAT_COLOR[item.category]:"#22C55E";
  const ic=isExpense?CAT_ICON[item.category]:"💚";
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:"1px solid #0F172A",transition:"background .15s"}}
      onMouseEnter={e=>e.currentTarget.style.background="#0F172A80"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <div style={{width:42,height:42,borderRadius:13,background:c+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{ic}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:700,fontSize:14,color:"#F1F5F9",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{item.title}</span>
          {item.recurring&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:20,background:"#3B82F622",color:"#60A5FA",flexShrink:0}}>🔄</span>}
        </div>
        <div style={{fontSize:11,color:"#64748B",marginTop:2}}>{fmtD(item.date)}{item.category?` · ${item.category}`:""}{item.note?` · ${item.note}`:""}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:14,color:isExpense?"#F87171":"#4ADE80"}}>
          {isExpense?"-":"+"}{fmt(item.amount)}
        </span>
        <div style={{display:"flex",gap:4}}>
          <button onClick={()=>onEdit(item)} style={{width:32,height:32,borderRadius:8,background:"#1E293B",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="#1D4ED822";e.currentTarget.style.color="#3B82F6"}}
            onMouseLeave={e=>{e.currentTarget.style.background="#1E293B";e.currentTarget.style.color="#94A3B8"}}>✏️</button>
          <button onClick={()=>onDelete(item.id)} style={{width:32,height:32,borderRadius:8,background:"#1E293B",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="#EF444422";e.currentTarget.style.color="#EF4444"}}
            onMouseLeave={e=>{e.currentTarget.style.background="#1E293B";e.currentTarget.style.color="#94A3B8"}}>✕</button>
        </div>
      </div>
    </div>
  );
}

function Empty({icon,msg,sub,action}){
  return(
    <div style={{padding:"48px 24px",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>{icon}</div>
      <div style={{fontFamily:"'Montserrat',sans-serif",fontWeight:700,fontSize:16,color:"#475569",marginBottom:6}}>{msg}</div>
      {sub&&<div style={{fontSize:13,color:"#334155",marginBottom:16}}>{sub}</div>}
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   FORM MODALS
═══════════════════════════════════════════════════ */
function ExpenseModal({initial,onSave,onClose}){
  const [f,sf]=useState({title:initial?.title||"",amount:initial?.amount||"",date:initial?.date||today(),category:initial?.category||"Food",note:initial?.note||"",recurring:initial?.recurring||false});
  const u=p=>sf(x=>({...x,...p}));
  const ok=f.title.trim()&&+f.amount>0;
  return(
    <Modal title={initial?"Edit Expense":"New Expense"} onClose={onClose}>
      <Fld label="Title"><Inp value={f.title} onChange={e=>u({title:e.target.value})} placeholder="e.g. Grocery shopping"/></Fld>
      <Fld label="Amount (₹)"><Inp type="number" inputMode="decimal" value={f.amount} onChange={e=>u({amount:e.target.value})} placeholder="0"/></Fld>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Fld label="Date"><Inp type="date" value={f.date} onChange={e=>u({date:e.target.value})}/></Fld>
        <Fld label="Category"><Sel value={f.category} onChange={e=>u({category:e.target.value})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</Sel></Fld>
      </div>
      <Fld label="Note (optional)"><Inp value={f.note} onChange={e=>u({note:e.target.value})} placeholder="Short note"/></Fld>
      <Fld label=" ">
        <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",color:"#94A3B8",fontSize:14}}>
          <input type="checkbox" checked={f.recurring} onChange={e=>u({recurring:e.target.checked})} style={{accentColor:"#3B82F6",width:18,height:18}}/>
          Recurring monthly
        </label>
      </Fld>
      <div style={{display:"flex",gap:10,marginTop:4}}>
        <Btn onClick={()=>ok&&onSave(f)} style={{flex:1,opacity:ok?1:.5}}>Save Expense</Btn>
        <Btn variant="ghost" onClick={onClose} style={{flex:1}}>Cancel</Btn>
      </div>
    </Modal>
  );
}

function IncomeModal({initial,onSave,onClose}){
  const [f,sf]=useState({title:initial?.title||"",amount:initial?.amount||"",date:initial?.date||today(),source:initial?.source||"Employment",note:initial?.note||"",recurring:initial?.recurring||false});
  const u=p=>sf(x=>({...x,...p}));
  const ok=f.title.trim()&&+f.amount>0;
  return(
    <Modal title={initial?"Edit Income":"New Income"} onClose={onClose}>
      <Fld label="Title"><Inp value={f.title} onChange={e=>u({title:e.target.value})} placeholder="e.g. Monthly Salary"/></Fld>
      <Fld label="Amount (₹)"><Inp type="number" inputMode="decimal" value={f.amount} onChange={e=>u({amount:e.target.value})} placeholder="0"/></Fld>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Fld label="Date"><Inp type="date" value={f.date} onChange={e=>u({date:e.target.value})}/></Fld>
        <Fld label="Source"><Sel value={f.source} onChange={e=>u({source:e.target.value})}>{["Employment","Freelance","Business","Investment","Gift","Other"].map(s=><option key={s}>{s}</option>)}</Sel></Fld>
      </div>
      <Fld label="Note"><Inp value={f.note} onChange={e=>u({note:e.target.value})} placeholder="Optional"/></Fld>
      <Fld label=" ">
        <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",color:"#94A3B8",fontSize:14}}>
          <input type="checkbox" checked={f.recurring} onChange={e=>u({recurring:e.target.checked})} style={{accentColor:"#10B981",width:18,height:18}}/>
          Recurring income
        </label>
      </Fld>
      <div style={{display:"flex",gap:10,marginTop:4}}>
        <Btn variant="success" onClick={()=>ok&&onSave(f)} style={{flex:1,opacity:ok?1:.5}}>Save Income</Btn>
        <Btn variant="ghost" onClick={onClose} style={{flex:1}}>Cancel</Btn>
      </div>
    </Modal>
  );
}

function EMIModal({initial,onSave,onClose}){
  const ICONS=["🏠","📱","🚗","🎓","💊","🏦","💡","🏗️"];
  const [f,sf]=useState({title:initial?.title||"",bank:initial?.bank||"",principal:initial?.principal||"",outstanding:initial?.outstanding||"",emi:initial?.emi||"",rate:initial?.rate||"",tenure:initial?.tenure||"",paid:initial?.paid||0,startDate:initial?.startDate||today(),icon:initial?.icon||"🏦"});
  const u=p=>sf(x=>({...x,...p}));
  const ok=f.title.trim()&&+f.emi>0;
  return(
    <Modal title={initial?"Edit Loan":"Add Loan / EMI"} onClose={onClose}>
      <Fld label="Loan Name"><Inp value={f.title} onChange={e=>u({title:e.target.value})} placeholder="e.g. Home Loan"/></Fld>
      <Fld label="Icon">
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {ICONS.map(ic=><button key={ic} onClick={()=>u({icon:ic})} style={{width:40,height:40,borderRadius:10,background:f.icon===ic?"#1D4ED8":"#0F172A",border:`1px solid ${f.icon===ic?"#3B82F6":"#1E293B"}`,fontSize:20,cursor:"pointer",transition:"all .15s"}}>{ic}</button>)}
        </div>
      </Fld>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Fld label="Bank / Lender"><Inp value={f.bank} onChange={e=>u({bank:e.target.value})} placeholder="SBI"/></Fld>
        <Fld label="Interest Rate %"><Inp type="number" inputMode="decimal" value={f.rate} onChange={e=>u({rate:e.target.value})} placeholder="8.5"/></Fld>
        <Fld label="Principal (₹)"><Inp type="number" inputMode="decimal" value={f.principal} onChange={e=>u({principal:e.target.value})} placeholder="Loan amount"/></Fld>
        <Fld label="Outstanding (₹)"><Inp type="number" inputMode="decimal" value={f.outstanding} onChange={e=>u({outstanding:e.target.value})} placeholder="Balance"/></Fld>
        <Fld label="Monthly EMI (₹)"><Inp type="number" inputMode="decimal" value={f.emi} onChange={e=>u({emi:e.target.value})} placeholder="0"/></Fld>
        <Fld label="Total Tenure (mo)"><Inp type="number" inputMode="numeric" value={f.tenure} onChange={e=>u({tenure:e.target.value})} placeholder="240"/></Fld>
        <Fld label="EMIs Paid"><Inp type="number" inputMode="numeric" value={f.paid} onChange={e=>u({paid:e.target.value})} placeholder="0"/></Fld>
        <Fld label="Start Date"><Inp type="date" value={f.startDate} onChange={e=>u({startDate:e.target.value})}/></Fld>
      </div>
      <div style={{display:"flex",gap:10,marginTop:4}}>
        <Btn onClick={()=>ok&&onSave({...f,principal:+f.principal,outstanding:+f.outstanding,emi:+f.emi,rate:+f.rate,tenure:+f.tenure,paid:+f.paid})} style={{flex:1,opacity:ok?1:.5}}>Save EMI</Btn>
        <Btn variant="ghost" onClick={onClose} style={{flex:1}}>Cancel</Btn>
      </div>
    </Modal>
  );
}

function DebtModal({initial,onSave,onClose}){
  const [f,sf]=useState({person:initial?.person||"",type:initial?.type||"lent",amount:initial?.amount||"",date:initial?.date||today(),note:initial?.note||"",settled:false});
  const u=p=>sf(x=>({...x,...p}));
  const ok=f.person.trim()&&+f.amount>0;
  return(
    <Modal title={initial?"Edit Entry":"New Debt / Lend"} onClose={onClose}>
      <Fld label="Person's Name"><Inp value={f.person} onChange={e=>u({person:e.target.value})} placeholder="e.g. Rahul"/></Fld>
      <Fld label="Type">
        <div style={{display:"flex",gap:8}}>
          {["lent","borrowed"].map(t=>(
            <button key={t} onClick={()=>u({type:t})} style={{flex:1,padding:"12px",borderRadius:10,border:`1.5px solid ${f.type===t?(t==="lent"?"#22C55E":"#EF4444"):"#1E293B"}`,background:f.type===t?(t==="lent"?"#22C55E18":"#EF444418"):"#0F172A",color:f.type===t?(t==="lent"?"#4ADE80":"#F87171"):"#64748B",fontFamily:"'Lato',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",transition:"all .15s"}}>
              {t==="lent"?"💚 I Lent":"❤️ I Borrowed"}
            </button>
          ))}
        </div>
      </Fld>
      <Fld label="Amount (₹)"><Inp type="number" inputMode="decimal" value={f.amount} onChange={e=>u({amount:e.target.value})} placeholder="0"/></Fld>
      <Fld label="Date"><Inp type="date" value={f.date} onChange={e=>u({date:e.target.value})}/></Fld>
      <Fld label="Reason / Note"><Inp value={f.note} onChange={e=>u({note:e.target.value})} placeholder="What was it for?"/></Fld>
      <div style={{display:"flex",gap:10,marginTop:4}}>
        <Btn variant={f.type==="lent"?"success":"danger"} onClick={()=>ok&&onSave({...f,amount:+f.amount})} style={{flex:1,opacity:ok?1:.5}}>Save</Btn>
        <Btn variant="ghost" onClick={onClose} style={{flex:1}}>Cancel</Btn>
      </div>
    </Modal>
  );
}

function BudgetModal({initial,onSave,onClose}){
  const [cat,setCat]=useState(initial?.cat||"Food");
  const [amt,setAmt]=useState(initial?.amt?String(initial.amt):"");
  return(
    <Modal title="Set Budget" onClose={onClose}>
      <Fld label="Category"><Sel value={cat} onChange={e=>setCat(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{CAT_ICON[c]} {c}</option>)}</Sel></Fld>
      <Fld label="Monthly Limit (₹)"><Inp type="number" inputMode="decimal" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="e.g. 5000"/></Fld>
      <div style={{display:"flex",gap:10,marginTop:4}}>
        <Btn onClick={()=>{if(!amt)return;onSave(cat,+amt);onClose();}} style={{flex:1}}>Update Budget</Btn>
        <Btn variant="ghost" onClick={onClose} style={{flex:1}}>Cancel</Btn>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════
   TAB SCREENS
═══════════════════════════════════════════════════ */
function Dashboard({expenses,incomes,budgets,emis,debts,spendByCat,totalIncome,totalExpense,balance,totalEMI,savingsRate,healthScore,scoreColor,scoreLabel,onAddExpense,onAddIncome,totalLent,totalBorrowed}){
  const topCats=CATEGORIES.map(c=>({name:c,value:spendByCat[c]||0,color:CAT_COLOR[c],icon:CAT_ICON[c]})).filter(c=>c.value>0).sort((a,b)=>b.value-a.value).slice(0,5);
  const recent=[...expenses].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        <StatCard label="Balance"  value={fmt(balance)}      sub="Income − Expenses"  color={balance>=0?"#4ADE80":"#F87171"} icon="🏦"/>
        <StatCard label="Income"   value={fmt(totalIncome)}  sub="This month"          color="#4ADE80" icon="📈"/>
        <StatCard label="Expenses" value={fmt(totalExpense)} sub="This month"          color="#F87171" icon="📉"/>
        <StatCard label="Savings"  value={`${savingsRate}%`} sub={savingsRate>=20?"On track 🎉":"Target: 20%"} color={savingsRate>=20?"#4ADE80":savingsRate>=10?"#FCD34D":"#F87171"} icon="💰"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16,padding:"16px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>Financial Health</div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{position:"relative",width:58,height:58,flexShrink:0}}>
              <svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="24" fill="none" stroke="#1E293B" strokeWidth="7"/><circle cx="29" cy="29" r="24" fill="none" stroke={scoreColor} strokeWidth="7" strokeDasharray={`${healthScore*1.508} 150.8`} strokeLinecap="round" transform="rotate(-90 29 29)"/></svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:13,color:scoreColor}}>{healthScore}</div>
            </div>
            <div>
              <div style={{fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:15,color:scoreColor}}>{scoreLabel}</div>
              <div style={{fontSize:11,color:"#64748B",marginTop:2}}>out of 100</div>
            </div>
          </div>
        </div>
        <div style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16,padding:"16px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>Friends</div>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:11,color:"#64748B"}}>Will receive</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:16,color:"#4ADE80"}}>{fmt(totalLent)}</div>
          </div>
          <div>
            <div style={{fontSize:11,color:"#64748B"}}>You owe</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:16,color:"#F87171"}}>{fmt(totalBorrowed)}</div>
          </div>
        </div>
      </div>
      {topCats.length>0&&(
        <div style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16,padding:"16px"}}>
          <SectionHead title="Top Spending"/>
          {topCats.map((c,i)=>(
            <div key={i} style={{marginBottom:i<topCats.length-1?12:0}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                <span>{c.icon} {c.name}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:"#CBD5E1"}}>{fmt(c.value)}</span>
              </div>
              <ProgressBar value={c.value} max={topCats[0].value} color={c.color}/>
            </div>
          ))}
        </div>
      )}
      <div style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16,overflow:"hidden"}}>
        <div style={{padding:"16px 16px 12px"}}><SectionHead title="Recent Transactions"/></div>
        {recent.length===0
          ? <Empty icon="📭" msg="No expenses yet" sub="Tap + to add your first one"/>
          : recent.map((t,i)=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderTop:"1px solid #0F172A"}}>
              <div style={{width:38,height:38,borderRadius:11,background:CAT_COLOR[t.category]+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{CAT_ICON[t.category]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                <div style={{fontSize:11,color:"#64748B"}}>{fmtD(t.date)}</div>
              </div>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:"#F87171",flexShrink:0}}>-{fmt(t.amount)}</span>
            </div>
          ))
        }
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Btn onClick={onAddExpense} full>➕ Expense</Btn>
        <Btn variant="success" onClick={onAddIncome} full>💚 Income</Btn>
      </div>
    </div>
  );
}

function ExpensesScreen({expenses,incomes,onAdd,onAddIncome,onEdit,onEditIncome,onDel,onDelIncome}){
  const [view,setView]=useState("expenses");
  const [cat,setCat]=useState("All");
  const list=view==="expenses"
    ? expenses.filter(e=>cat==="All"||e.category===cat).sort((a,b)=>new Date(b.date)-new Date(a.date))
    : incomes.sort((a,b)=>new Date(b.date)-new Date(a.date));
  const total=list.reduce((s,x)=>s+x.amount,0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:8}}>
        {["expenses","incomes"].map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"10px",borderRadius:10,border:`1.5px solid ${view===v?(v==="expenses"?"#3B82F6":"#22C55E"):"#1E293B"}`,background:view===v?(v==="expenses"?"#1D4ED820":"#05966920"):"transparent",color:view===v?(v==="expenses"?"#60A5FA":"#4ADE80"):"#64748B",fontFamily:"'Lato',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",transition:"all .15s"}}>
            {v==="expenses"?"💸 Expenses":"💚 Incomes"}
          </button>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:16,color:view==="expenses"?"#F87171":"#4ADE80"}}>{view==="expenses"?"-":"+"} {fmt(total)}</span>
        <Btn sm onClick={view==="expenses"?onAdd:onAddIncome}>{view==="expenses"?"+ Expense":"+ Income"}</Btn>
      </div>
      {view==="expenses"&&(
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
          {["All",...CATEGORIES].map(c=><CatPill key={c} cat={c} active={cat===c} onClick={()=>setCat(c)}/>)}
        </div>
      )}
      <div style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16,overflow:"hidden"}}>
        {list.length===0
          ? <Empty icon={view==="expenses"?"🧾":"💰"} msg="Nothing here yet" action={<Btn sm onClick={view==="expenses"?onAdd:onAddIncome}>Add one now</Btn>}/>
          : list.map(item=>(
            <TxRow key={item.id} item={item} isExpense={view==="expenses"}
              onEdit={view==="expenses"?onEdit:onEditIncome}
              onDelete={view==="expenses"?onDel:onDelIncome}/>
          ))
        }
      </div>
    </div>
  );
}

function BudgetScreen({budgets,spendByCat,totalIncome,onEdit}){
  const totalBudget=Object.values(budgets).reduce((s,v)=>s+v,0);
  const totalSpent=Object.values(spendByCat).reduce((s,v)=>s+v,0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <StatCard label="Total Budget"  value={fmt(totalBudget)} color="#3B82F6" icon="🎯"/>
        <StatCard label="Total Spent"   value={fmt(totalSpent)}  color="#F87171" icon="💸"/>
        <StatCard label="Remaining"     value={fmt(Math.max(totalBudget-totalSpent,0))} color="#4ADE80" icon="✅"/>
        <StatCard label="Used"          value={`${totalBudget>0?((totalSpent/totalBudget)*100).toFixed(0):0}%`} color="#FCD34D" icon="📊"/>
      </div>
      <SectionHead title="Categories" action={<span style={{fontSize:12,color:"#64748B"}}>Tap to edit</span>}/>
      {CATEGORIES.map(c=>{
        const spent=spendByCat[c]||0, budget=budgets[c]||0, over=spent>budget;
        const pct=budget>0?(spent/budget*100):0;
        return(
          <div key={c} onClick={()=>onEdit(c,budget)} style={{background:"#111827",border:`1px solid ${over?"#EF444330":"#1E293B"}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",transition:"border-color .2s",marginBottom:10}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=over?"#EF444360":"#334155"}
            onMouseLeave={e=>e.currentTarget.style.borderColor=over?"#EF444330":"#1E293B"}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{CAT_ICON[c]}</span>
                <span style={{fontWeight:700,fontSize:14}}>{c}</span>
                {over&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:20,background:"#EF444422",color:"#F87171"}}>Over!</span>}
              </div>
              <span style={{fontSize:11,color:"#64748B"}}>✏️</span>
            </div>
            <ProgressBar value={spent} max={budget||1} color={over?"#EF4444":CAT_COLOR[c]}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",color:over?"#F87171":"#94A3B8"}}>{fmt(spent)}</span>
              <span style={{color:"#64748B"}}>of {fmt(budget)}</span>
            </div>
            {over
              ? <div style={{fontSize:11,color:"#F87171",marginTop:2}}>⚠️ Exceeded by {fmt(spent-budget)}</div>
              : <div style={{fontSize:11,color:"#4ADE80",marginTop:2}}>✅ {fmt(budget-spent)} left ({(100-pct).toFixed(0)}%)</div>
            }
          </div>
        );
      })}
    </div>
  );
}

function EMIScreen({emis,totalEMI,totalIncome,onAdd,onEdit,onDel}){
  const ratio=totalIncome>0?((totalEMI/totalIncome)*100).toFixed(1):0;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <StatCard label="Monthly EMIs" value={fmt(totalEMI)} color="#FCD34D" icon="💳"/>
        <StatCard label="EMI / Income" value={`${ratio}%`} color={ratio>40?"#F87171":ratio>30?"#FCD34D":"#4ADE80"} icon="📊"/>
        <StatCard label="Active Loans" value={emis.length} color="#60A5FA" icon="🏦"/>
        <StatCard label="Status" value={ratio>40?"High":ratio>30?"Moderate":"Healthy"} color={ratio>40?"#F87171":ratio>30?"#FCD34D":"#4ADE80"} icon={ratio>40?"⚠️":"✅"}/>
      </div>
      {ratio>40&&<div style={{background:"#EF444410",border:"1px solid #EF444330",borderRadius:12,padding:"12px 14px",fontSize:13,color:"#F87171",lineHeight:1.5}}>⚠️ EMI burden ({ratio}%) exceeds the safe 40% limit. Consider prepaying or restructuring loans.</div>}
      <SectionHead title="Your Loans" action={<Btn sm onClick={onAdd}>+ Add Loan</Btn>}/>
      {emis.length===0
        ? <div style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16}}><Empty icon="🏦" msg="No loans tracked" sub="Add your EMIs to monitor repayment" action={<Btn sm onClick={onAdd}>Add EMI</Btn>}/></div>
        : emis.map(e=>{
            const prog=e.paid/e.tenure*100, rem=e.tenure-e.paid, interest=(e.emi*e.tenure)-e.principal;
            return(
              <div key={e.id} style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16,padding:"16px",marginBottom:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:44,height:44,borderRadius:14,background:"#FCD34D20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{e.icon||"🏦"}</div>
                    <div>
                      <div style={{fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:15}}>{e.title}</div>
                      <div style={{fontSize:12,color:"#64748B"}}>{e.bank} · {e.rate}% p.a.</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>onEdit(e)} style={{width:32,height:32,borderRadius:8,background:"#1E293B",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={ev=>ev.currentTarget.style.color="#60A5FA"} onMouseLeave={ev=>ev.currentTarget.style.color="#94A3B8"}>✏️</button>
                    <button onClick={()=>onDel(e.id)} style={{width:32,height:32,borderRadius:8,background:"#1E293B",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={ev=>ev.currentTarget.style.color="#F87171"} onMouseLeave={ev=>ev.currentTarget.style.color="#94A3B8"}>✕</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                  {[{l:"Monthly EMI",v:fmt(e.emi),c:"#FCD34D"},{l:"Outstanding",v:fmt(e.outstanding),c:"#F87171"},{l:"Paid",v:`${e.paid}/${e.tenure} mo`,c:"#4ADE80"},{l:"Remaining",v:`${rem} months`,c:"#60A5FA"}].map((s,i)=>(
                    <div key={i} style={{background:"#0F172A",borderRadius:10,padding:"10px 12px"}}>
                      <div style={{fontSize:10,color:"#64748B",marginBottom:3}}>{s.l}</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:13,color:s.c}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:6,display:"flex",justifyContent:"space-between",fontSize:11,color:"#64748B"}}><span>Progress</span><span>{prog.toFixed(0)}% paid off</span></div>
                <ProgressBar value={e.paid} max={e.tenure} color="#FCD34D" height={10}/>
                <div style={{marginTop:8,fontSize:11,color:"#64748B"}}>Total interest: <span style={{color:"#F97316",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{fmt(interest)}</span></div>
              </div>
            );
          })
      }
    </div>
  );
}

function DebtsScreen({debts,totalLent,totalBorrowed,onAdd,onSettle,onDel}){
  const [filter,setFilter]=useState("active");
  const net=totalLent-totalBorrowed;
  const list=debts.filter(d=>filter==="all"||(filter==="active"&&!d.settled)||(filter==="settled"&&d.settled));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <StatCard label="Receive" value={fmt(totalLent)} color="#4ADE80" icon="💚"/>
        <StatCard label="You Owe" value={fmt(totalBorrowed)} color="#F87171" icon="❤️"/>
        <StatCard label="Net" value={fmt(Math.abs(net))} color={net>=0?"#4ADE80":"#F87171"} icon={net>=0?"✅":"⚠️"}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:6}}>
          {["active","settled","all"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${filter===f?"#3B82F6":"#1E293B"}`,background:filter===f?"#1D4ED820":"transparent",color:filter===f?"#60A5FA":"#64748B",fontFamily:"'Lato',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",transition:"all .15s"}}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <Btn sm onClick={onAdd}>+ Add</Btn>
      </div>
      <div style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16,overflow:"hidden"}}>
        {list.length===0
          ? <Empty icon="🤝" msg="No records" sub={filter==="active"?"All settled up! 🎉":"No settled records yet"}/>
          : list.map((d,i)=>(
            <div key={d.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderTop:i>0?"1px solid #0F172A":"none",opacity:d.settled?.6:1,transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#0F172A80"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{width:42,height:42,borderRadius:13,background:d.type==="lent"?"#22C55E20":"#EF444420",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{d.type==="lent"?"💚":"❤️"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  {d.person}
                  <span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:d.type==="lent"?"#22C55E20":"#EF444420",color:d.type==="lent"?"#4ADE80":"#F87171"}}>{d.type==="lent"?"Lent":"Borrowed"}</span>
                  {d.settled&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"#64748B20",color:"#94A3B8"}}>✓ Settled</span>}
                </div>
                <div style={{fontSize:11,color:"#64748B",marginTop:2}}>{fmtD(d.date)}{d.note?" · "+d.note:""}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:14,color:d.type==="lent"?"#4ADE80":"#F87171"}}>{fmt(d.amount)}</span>
                {!d.settled&&<button onClick={()=>onSettle(d.id)} style={{padding:"5px 10px",borderRadius:8,background:"#22C55E20",border:"1px solid #22C55E40",color:"#4ADE80",fontFamily:"'Lato',sans-serif",fontWeight:700,fontSize:11,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.currentTarget.style.background="#22C55E40"} onMouseLeave={e=>e.currentTarget.style.background="#22C55E20"}>Settle ✓</button>}
                <button onClick={()=>onDel(d.id)} style={{width:30,height:30,borderRadius:8,background:"#1E293B",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>e.currentTarget.style.color="#F87171"} onMouseLeave={e=>e.currentTarget.style.color="#94A3B8"}>✕</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function AnalyticsScreen({expenses,spendByCat,budgets,totalIncome,totalExpense,savingsRate,totalEMI,healthScore,scoreColor,scoreLabel}){
  const donut=CATEGORIES.map(c=>({name:c,value:spendByCat[c]||0,color:CAT_COLOR[c],icon:CAT_ICON[c]})).filter(d=>d.value>0).sort((a,b)=>b.value-a.value);
  const totalSpent=donut.reduce((s,d)=>s+d.value,0);
  const barData=[
    {label:"Oct",value:18200,color:"#3B82F6"},{label:"Nov",value:22100,color:"#3B82F6"},
    {label:"Dec",value:31500,color:"#3B82F6"},{label:"Jan",value:25800,color:"#3B82F6"},
    {label:"Feb",value:19400,color:"#3B82F6"},{label:"Mar",value:totalExpense,color:"#6366F1"},
  ];
  const emiRatio=totalIncome>0?((totalEMI/totalIncome)*100).toFixed(1):0;
  const totalBudget=Object.values(budgets).reduce((s,v)=>s+v,0);
  const budgetUsed=totalBudget>0?((totalExpense/totalBudget)*100).toFixed(0):0;
  const insights=[
    savingsRate>=20?{icon:"🎉",color:"#22C55E",text:`Great! You're saving ${savingsRate}% of income — above the 20% goal.`}:{icon:"⚠️",color:"#F59E0B",text:`Savings rate is ${savingsRate}%. Aim for 20%+ by cutting discretionary spend.`},
    donut[0]?{icon:"📊",color:"#3B82F6",text:`${donut[0].icon} ${donut[0].name} is your top expense (${((donut[0].value/totalSpent)*100).toFixed(1)}% of total).`}:{icon:"📊",color:"#3B82F6",text:"Add expenses to see spending insights."},
    {icon:"🏦",color:"#F59E0B",text:`EMIs: ${fmt(totalEMI)}/mo (${emiRatio}% of income). ${emiRatio>40?"Consider reducing debt.":"Within safe limits."}`},
    {icon:"🎯",color:"#8B5CF6",text:`${CATEGORIES.filter(c=>spendByCat[c]>budgets[c]).length} categories over budget this month. Review your limits.`},
  ];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <StatCard label="Savings Rate" value={`${savingsRate}%`} color={savingsRate>=20?"#4ADE80":savingsRate>=10?"#FCD34D":"#F87171"} icon="💰"/>
        <StatCard label="Health Score" value={`${healthScore}`} color={scoreColor} icon="❤️" sub={scoreLabel}/>
        <StatCard label="EMI Burden"   value={`${emiRatio}%`}  color={emiRatio>40?"#F87171":"#4ADE80"} icon="🏦"/>
        <StatCard label="Budget Used"  value={`${budgetUsed}%`} color="#A78BFA" icon="🎯"/>
      </div>
      <div style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16,padding:"16px"}}>
        <SectionHead title="Spending Breakdown"/>
        <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flexShrink:0}}><DonutChart data={donut} size={140}/></div>
          <div style={{flex:1,minWidth:120}}>
            {donut.slice(0,6).map((d,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:9,height:9,borderRadius:2,background:d.color,flexShrink:0}}/>
                  <span style={{fontSize:12}}>{d.icon} {d.name}</span>
                </div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#94A3B8"}}>{totalSpent>0?((d.value/totalSpent)*100).toFixed(1):0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16,padding:"16px"}}>
        <SectionHead title="6-Month Expense Trend"/>
        <MiniBarChart data={barData} h={130}/>
      </div>
      <div style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16,padding:"16px"}}>
        <SectionHead title="Budget vs Actual"/>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {CATEGORIES.filter(c=>(spendByCat[c]||0)>0||budgets[c]>0).map(c=>{
            const spent=spendByCat[c]||0,budget=budgets[c]||0,over=spent>budget,maxVal=Math.max(spent,budget,1);
            return(
              <div key={c}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
                  <span>{CAT_ICON[c]} {c}</span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:over?"#F87171":"#4ADE80"}}>{fmt(spent)} / {fmt(budget)}</span>
                </div>
                <div style={{height:8,background:"#1E293B",borderRadius:4,overflow:"hidden",position:"relative"}}>
                  <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${(budget/maxVal)*100}%`,background:"#334155",borderRadius:4}}/>
                  <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${(spent/maxVal)*100}%`,background:over?"#EF4444":CAT_COLOR[c],borderRadius:4}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{background:"#111827",border:"1px solid #1E293B",borderRadius:16,padding:"16px"}}>
        <SectionHead title="💡 Smart Insights"/>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {insights.map((ins,i)=>(
            <div key={i} style={{background:"#0F172A",borderRadius:12,padding:"12px 14px",border:`1px solid ${ins.color}22`,display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:20,flexShrink:0}}>{ins.icon}</span>
              <span style={{fontSize:13,color:"#CBD5E1",lineHeight:1.5}}>{ins.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════ */
export default function App(){
  const [tab,setTab]=useState("dashboard");
  const [expenses,setExpenses]=useState(SEED_EXP);
  const [incomes, setIncomes] =useState(SEED_INC);
  const [budgets, setBudgets] =useState(SEED_BUD);
  const [emis,    setEmis]    =useState(SEED_EMI);
  const [debts,   setDebts]   =useState(SEED_DEBT);
  const [modal,   setModal]   =useState(null);
  const [editItem,setEditItem]=useState(null);

  const totalIncome  = useMemo(()=>incomes.reduce((s,i)=>s+i.amount,0),[incomes]);
  const totalExpense = useMemo(()=>expenses.reduce((s,e)=>s+e.amount,0),[expenses]);
  const balance      = totalIncome-totalExpense;
  const totalEMI     = useMemo(()=>emis.reduce((s,e)=>s+e.emi,0),[emis]);
  const totalLent    = useMemo(()=>debts.filter(d=>d.type==="lent"&&!d.settled).reduce((s,d)=>s+d.amount,0),[debts]);
  const totalBorrowed= useMemo(()=>debts.filter(d=>d.type==="borrowed"&&!d.settled).reduce((s,d)=>s+d.amount,0),[debts]);
  const savingsRate  = totalIncome>0?Math.round(((totalIncome-totalExpense)/totalIncome)*100):0;
  const spendByCat   = useMemo(()=>CATEGORIES.reduce((a,c)=>{a[c]=expenses.filter(e=>e.category===c).reduce((s,e)=>s+e.amount,0);return a;},{}),[expenses]);
  const healthScore  = useMemo(()=>{
    let s=0;
    if(savingsRate>=20)s+=30;else if(savingsRate>=10)s+=15;else if(savingsRate>0)s+=5;
    s+=Math.max(0,30-CATEGORIES.filter(c=>spendByCat[c]>budgets[c]).length*6);
    const er=totalIncome>0?(totalEMI/totalIncome)*100:100;
    if(er<20)s+=25;else if(er<35)s+=12;
    if(totalLent<5000)s+=15;else if(totalLent<15000)s+=8;
    return Math.min(s,100);
  },[savingsRate,spendByCat,budgets,totalEMI,totalIncome,totalLent]);
  const scoreColor = healthScore>=75?"#4ADE80":healthScore>=50?"#FCD34D":"#F87171";
  const scoreLabel = healthScore>=75?"Excellent":healthScore>=50?"Good":"Needs Work";

  const alerts = useMemo(()=>{
    const a=[];
    CATEGORIES.forEach(c=>{const p=(spendByCat[c]||0)/(budgets[c]||1)*100;if(p>=90)a.push({t:"warn",m:`${CAT_ICON[c]} ${c} ${p>=100?"over budget":"near limit"} (${Math.round(p)}%)`});});
    if(savingsRate<10&&totalIncome>0)a.push({t:"danger",m:`Low savings: ${savingsRate}%`});
    return a;
  },[spendByCat,budgets,savingsRate,totalIncome]);

  const openModal=(m,item=null)=>{setEditItem(item);setModal(m);};
  const closeModal=()=>{setModal(null);setEditItem(null);};

  const saveExp  = d=>{setExpenses(p=>editItem?p.map(x=>x.id===editItem.id?{...d,id:editItem.id}:x):[...p,{...d,id:uid()}]);closeModal();};
  const saveInc  = d=>{setIncomes(p=>editItem?p.map(x=>x.id===editItem.id?{...d,id:editItem.id}:x):[...p,{...d,id:uid()}]);closeModal();};
  const saveEmi  = d=>{setEmis(p=>editItem?p.map(x=>x.id===editItem.id?{...d,id:editItem.id}:x):[...p,{...d,id:uid()}]);closeModal();};
  const saveDebt = d=>{setDebts(p=>editItem?p.map(x=>x.id===editItem.id?{...d,id:editItem.id}:x):[...p,{...d,id:uid()}]);closeModal();};
  const saveBudget=(cat,amt)=>setBudgets(p=>({...p,[cat]:amt}));

  return(
    <div style={{fontFamily:"'Lato',sans-serif",minHeight:"100vh",background:"#080E1A",color:"#E2E8F0",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Lato:wght@400;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0F172A}
        ::-webkit-scrollbar-thumb{background:#1E293B;border-radius:2px}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.4)}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fadeIn .25s ease}

        /* DESKTOP */
        @media(min-width:768px){
          .app-body{flex-direction:row!important}
          .sidebar{display:flex!important}
          .bot-nav{display:none!important}
          .main{padding:24px 28px!important;padding-bottom:24px!important}
        }
        /* MOBILE */
        @media(max-width:767px){
          .sidebar{display:none!important}
          .bot-nav{display:flex!important}
          .main{padding:14px!important;padding-bottom:84px!important}
        }
      `}</style>

      {/* HEADER */}
      <header style={{background:"#0B1323",borderBottom:"1px solid #1E293B",padding:"0 16px",flexShrink:0,position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:1200,margin:"0 auto",height:56,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#1D4ED8,#3B82F6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💰</div>
            <span style={{fontFamily:"'Montserrat',sans-serif",fontWeight:900,fontSize:17,letterSpacing:"-.3px"}}>Fin<span style={{color:"#3B82F6"}}>Vault</span></span>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {alerts.length>0&&(
              <div style={{padding:"4px 10px",borderRadius:20,background:"#F59E0B20",border:"1px solid #F59E0B40",color:"#FCD34D",fontSize:12,fontWeight:700,cursor:"default"}}>
                ⚠️ {alerts.length}
              </div>
            )}
            <div style={{background:"#111827",border:"1px solid #1E293B",borderRadius:10,padding:"6px 12px",fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:balance>=0?"#4ADE80":"#F87171"}}>{fmt(balance)}</div>
            <div style={{position:"relative",width:36,height:36,flexShrink:0,cursor:"pointer"}} title={`Health: ${healthScore} – ${scoreLabel}`}>
              <svg viewBox="0 0 36 36" style={{width:36,height:36}}><circle cx="18" cy="18" r="15" fill="none" stroke="#1E293B" strokeWidth="4"/><circle cx="18" cy="18" r="15" fill="none" stroke={scoreColor} strokeWidth="4" strokeDasharray={`${healthScore*.942} 94.2`} strokeLinecap="round" transform="rotate(-90 18 18)"/></svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:10,color:scoreColor}}>{healthScore}</div>
            </div>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="app-body" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* SIDEBAR – desktop */}
        <aside className="sidebar" style={{display:"none",flexDirection:"column",width:216,background:"#0B1323",borderRight:"1px solid #1E293B",padding:"16px 12px",gap:4,flexShrink:0,overflowY:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:12,border:"none",cursor:"pointer",transition:"all .15s",background:tab===t.id?"linear-gradient(135deg,#1D4ED8,#2563EB)":"transparent",color:tab===t.id?"#fff":"#64748B",fontFamily:"'Lato',sans-serif",fontWeight:700,fontSize:14,textAlign:"left",width:"100%"}}>
              <span style={{fontSize:18,lineHeight:1}}>{t.icon}</span>{t.label}
              {tab===t.id&&<div style={{marginLeft:"auto",width:6,height:6,borderRadius:3,background:"rgba(255,255,255,.6)"}}/>}
            </button>
          ))}
          <div style={{marginTop:"auto",padding:"14px",borderRadius:14,background:"#111827",border:"1px solid #1E293B"}}>
            <div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:".5px",marginBottom:6}}>Health Score</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:24,fontWeight:700,color:scoreColor}}>{healthScore}<span style={{fontSize:13,color:"#64748B"}}>/100</span></div>
            <div style={{fontSize:12,color:scoreColor,marginTop:2,fontWeight:700}}>{scoreLabel}</div>
            {alerts.length>0&&<div style={{marginTop:10,fontSize:11,color:"#FCD34D"}}>⚠️ {alerts.length} alert{alerts.length>1?"s":""}</div>}
          </div>
        </aside>

        {/* CONTENT */}
        <div style={{flex:1,overflowY:"auto"}}>
          {alerts.length>0&&(
            <div style={{background:"#F59E0B08",borderBottom:"1px solid #F59E0B20",padding:"8px 16px",display:"flex",gap:10,overflowX:"auto"}}>
              {alerts.map((a,i)=>(
                <span key={i} style={{fontSize:12,color:a.t==="danger"?"#F87171":"#FCD34D",fontWeight:700,whiteSpace:"nowrap"}}>
                  {a.t==="danger"?"🔴":"🟡"} {a.m}
                </span>
              ))}
            </div>
          )}
          <div className="main fade" style={{maxWidth:720,margin:"0 auto",padding:16,paddingBottom:84}}>
            {tab==="dashboard"&&<Dashboard expenses={expenses} incomes={incomes} budgets={budgets} emis={emis} debts={debts} spendByCat={spendByCat} totalIncome={totalIncome} totalExpense={totalExpense} balance={balance} totalEMI={totalEMI} savingsRate={savingsRate} healthScore={healthScore} scoreColor={scoreColor} scoreLabel={scoreLabel} onAddExpense={()=>openModal("expense")} onAddIncome={()=>openModal("income")} totalLent={totalLent} totalBorrowed={totalBorrowed}/>}
            {tab==="expenses"&&<ExpensesScreen expenses={expenses} incomes={incomes} onAdd={()=>openModal("expense")} onAddIncome={()=>openModal("income")} onEdit={e=>openModal("expense",e)} onEditIncome={i=>openModal("income",i)} onDel={id=>setExpenses(p=>p.filter(e=>e.id!==id))} onDelIncome={id=>setIncomes(p=>p.filter(i=>i.id!==id))}/>}
            {tab==="budget"&&<BudgetScreen budgets={budgets} spendByCat={spendByCat} totalIncome={totalIncome} onEdit={(c,a)=>openModal("budget",{cat:c,amt:a})}/>}
            {tab==="emi"&&<EMIScreen emis={emis} totalEMI={totalEMI} totalIncome={totalIncome} onAdd={()=>openModal("emi")} onEdit={e=>openModal("emi",e)} onDel={id=>setEmis(p=>p.filter(e=>e.id!==id))}/>}
            {tab==="debts"&&<DebtsScreen debts={debts} totalLent={totalLent} totalBorrowed={totalBorrowed} onAdd={()=>openModal("debt")} onSettle={id=>setDebts(p=>p.map(d=>d.id===id?{...d,settled:true}:d))} onDel={id=>setDebts(p=>p.filter(d=>d.id!==id))}/>}
            {tab==="analytics"&&<AnalyticsScreen expenses={expenses} spendByCat={spendByCat} budgets={budgets} totalIncome={totalIncome} totalExpense={totalExpense} savingsRate={savingsRate} totalEMI={totalEMI} healthScore={healthScore} scoreColor={scoreColor} scoreLabel={scoreLabel}/>}
          </div>
        </div>
      </div>

      {/* BOTTOM NAV – mobile */}
      <nav className="bot-nav" style={{display:"none",position:"fixed",bottom:0,left:0,right:0,height:64,background:"#0B1323",borderTop:"1px solid #1E293B",zIndex:100,alignItems:"stretch",justifyContent:"space-around",padding:"0"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,border:"none",cursor:"pointer",background:"transparent",position:"relative",minWidth:0}}>
            <span style={{fontSize:20,lineHeight:1}}>{t.icon}</span>
            <span style={{fontSize:9,fontFamily:"'Lato',sans-serif",fontWeight:700,color:tab===t.id?"#60A5FA":"#475569",letterSpacing:".2px"}}>{t.label}</span>
            {tab===t.id&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:24,height:2,background:"#3B82F6",borderRadius:"0 0 2px 2px"}}/>}
          </button>
        ))}
      </nav>

      {/* MODALS */}
      {modal==="expense"&&<ExpenseModal initial={editItem} onSave={saveExp}   onClose={closeModal}/>}
      {modal==="income" &&<IncomeModal  initial={editItem} onSave={saveInc}   onClose={closeModal}/>}
      {modal==="emi"    &&<EMIModal     initial={editItem} onSave={saveEmi}   onClose={closeModal}/>}
      {modal==="debt"   &&<DebtModal    initial={editItem} onSave={saveDebt}  onClose={closeModal}/>}
      {modal==="budget" &&<BudgetModal  initial={editItem} onSave={saveBudget} onClose={closeModal}/>}
    </div>
  );
}