"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const C={steel:"#8A8D8F",steelL:"#B8BBBE",steelD:"#5C5F61",oak:"#C4944A",sage:"#B5C4B1",surface:"#F5F4F1",surfaceD:"#ECEAE5",white:"#FFFFFF",black:"#1A1A1A",text:"#2C2C2C",textS:"#6B6B6B",accent:"#3D6B4F",warn:"#D4A843",danger:"#C75B4A",success:"#5A8F6A",go:"#4A7C5C",review:"#C4944A",nogo:"#C75B4A"};

const PHASES=[
  {num:0,name:"Qualification",color:"#7AB648",desc:"Validate minimum required inputs via Filecard. Capture opportunity data and confirm project viability."},
  {num:1,name:"Internal Layout Direction",color:"#E8384F",desc:"Create initial floorplan layout in E-planner. Align internally on layout logic and inventory assumptions."},
  {num:2,name:"Internal Budget Commitment",color:"#FD9A00",desc:"Collect supplier quotes. Evaluate ROI (Worst/Base/Best scenarios). Confirm cost split principles."},
  {num:3,name:"Customer Layout Approval",color:"#EEC300",desc:"Partner approval of the customer-facing floorplan and layout package."},
  {num:4,name:"Technical Freeze",color:"#E8D500",desc:"Lock technical specifications. No further changes without formal change request."},
  {num:5,name:"Commercial Approval",color:"#A4CF30",desc:"Brand + HoR + optional Country Director approval of final scope and investment."},
  {num:6,name:"Production & Order Lock",color:"#4ECBC4",desc:"Formal PROJECT GO. Suppliers begin production. Partner informed with execution plan."},
  {num:7,name:"Installation Planning",color:"#37C5AB",desc:"Readiness checks 1 month and 1 week prior. Final confirmations from all parties."},
  {num:8,name:"Delivery & Installation",color:"#4186E0",desc:"Execute delivery and installation on-site. Space management and merchandising zoning."},
  {num:9,name:"Merchandising & Opening",color:"#7A6FF0",desc:"Opening report. Screen content deployment. Space management execution with partner."},
  {num:10,name:"Close & Learning",color:"#AA62E3",desc:"ROI follow-up. Performance deck. Brand space maintenance planning. Annual review."},
];

const FALLBACK_PROJECTS=[
  {gid:"1",name:"Salling / Kultorvet, København K",type:"Shop-in-Shop – New Opening",sex:null,phaseNum:0,region:null,dueOn:null,completed:false,completedAt:null,notes:"",url:"#",created:"2026-03-20"},
  {gid:"2",name:"Magasin, Lyngby",type:"Soft Shop Solution",sex:"WOMENS",phaseNum:0,region:"NORTH",dueOn:"2026-04-09",completed:false,completedAt:null,notes:"",url:"#",created:"2026-02-12"},
  {gid:"3",name:"Heppel, Rosenheim",type:"SIS",sex:"MENS",phaseNum:11,region:null,dueOn:"2025-03-21",completed:true,completedAt:"2025-03-25",notes:"",url:"#",created:"2025-01-29"},
];

const fmtDate=(d)=>d?new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"—";
const fmtEur=(n)=>typeof n==="number"&&n>0?`€${n.toLocaleString("de-DE",{minimumFractionDigits:0,maximumFractionDigits:0})}`:"—";
const SIS_IMAGES=["/images/kh_selected_sis_018_web.jpg","/images/kh_selected_sis_075_web.jpg","/images/kh_selected_sis_023_web.jpg","/images/kh_selected_sis_032_web.jpg","/images/kh_selected_sis_048_web.jpg","/images/kh_selected_sis_029_web.jpg"];

const Badge=({children,variant="default"})=>{const s={default:{bg:C.surfaceD,c:C.text},success:{bg:"#E8F2EA",c:C.go},warning:{bg:"#FDF3E0",c:C.warn},danger:{bg:"#FDEAE6",c:C.danger},phase0:{bg:"#E8F5E0",c:"#4A8C2A"}}[variant]||{bg:C.surfaceD,c:C.text};return<span style={{display:"inline-block",padding:"3px 10px",borderRadius:4,fontSize:11,fontWeight:600,letterSpacing:".5px",textTransform:"uppercase",background:s.bg,color:s.c}}>{children}</span>};
const KPI=({label,value,sub})=>(<div style={{background:C.white,borderRadius:8,padding:"20px 24px",border:`1px solid ${C.surfaceD}`,flex:1,minWidth:160}}><div style={{fontSize:11,color:C.textS,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>{label}</div><div style={{fontSize:32,fontWeight:300,color:C.text,fontFamily:"'Cormorant Garamond',serif",lineHeight:1}}>{value}</div>{sub&&<div style={{fontSize:12,color:C.textS,marginTop:6}}>{sub}</div>}</div>);
const Title=({children,sub})=>(<div style={{marginBottom:24}}><h2 style={{fontSize:22,fontWeight:400,color:C.text,fontFamily:"'Cormorant Garamond',serif",margin:0}}>{children}</h2>{sub&&<p style={{fontSize:13,color:C.textS,margin:"4px 0 0"}}>{sub}</p>}</div>);

// ─── OVERVIEW ─────────────────────────────────────────────
const OverviewPage=({projects,setPage,setDetail})=>{
  const active=projects.filter(p=>!p.completed);const completed=projects.filter(p=>p.completed);
  const upcoming=active.filter(p=>p.dueOn&&new Date(p.dueOn)>=new Date()).sort((a,b)=>new Date(a.dueOn)-new Date(b.dueOn));
  return(<div>
    <div style={{background:`linear-gradient(135deg,${C.black} 0%,${C.steelD} 100%)`,borderRadius:12,padding:"40px 44px",marginBottom:32,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,right:0,width:"50%",height:"100%",backgroundImage:"url(/images/kh_selected_sis_075_web.jpg)",backgroundSize:"cover",backgroundPosition:"center",opacity:.15}}/>
      <div style={{position:"relative",zIndex:1}}><img src="/images/logo.png" alt="Selected Frame" style={{height:32,marginBottom:12,filter:"invert(1)"}}/><div style={{fontSize:11,color:C.steelL,fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",marginTop:8}}>[ Command Space ]</div><p style={{fontSize:14,color:C.steelL,margin:"8px 0 0"}}>A frame for the business we share</p></div>
    </div>
    <div style={{display:"flex",gap:16,marginBottom:32,flexWrap:"wrap"}}><KPI label="Active Projects" value={active.length} sub="In progress"/><KPI label="Completed" value={completed.length} sub="Installed"/><KPI label="Total" value={projects.length} sub="All Brand Spaces"/></div>
    <Title sub="Selected Frame in action">The Concept</Title>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:32}}>{SIS_IMAGES.slice(0,3).map((src,i)=><div key={i} style={{borderRadius:8,overflow:"hidden",height:180}}><img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:32}}>
      <div><Title sub="Nearest deadlines">Upcoming</Title><div style={{background:C.white,borderRadius:8,border:`1px solid ${C.surfaceD}`}}>{upcoming.slice(0,6).map((p,i)=><div key={p.gid} style={{padding:"14px 20px",borderBottom:i<5?`1px solid ${C.surfaceD}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>{setDetail(p);setPage("projects")}}><div><div style={{fontSize:13,fontWeight:500,color:C.text}}>{p.name}</div><div style={{fontSize:11,color:C.textS,marginTop:2}}>{p.type}</div></div><div style={{fontSize:13,fontWeight:500,color:C.oak}}>{fmtDate(p.dueOn)}</div></div>)}{upcoming.length===0&&<div style={{padding:20,fontSize:13,color:C.textS,textAlign:"center"}}>No upcoming deadlines</div>}</div></div>
      <div><Title sub="Tools & views">Quick Access</Title><div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[{l:"ROI Calculator",d:"Evaluate SIS investment cases",p:"roi",i:"📊"},{l:"Quotation Builder",d:"Parse supplier PDFs & create branded quotes",p:"quotation",i:"📋"},{l:"Project Flow",d:"Phase 0–10 governance overview",p:"flow",i:"🔄"},{l:"Installed Base",d:"Completed installations",p:"installed",i:"🏪"}].map(t=><div key={t.p} style={{background:C.white,borderRadius:8,padding:"14px 18px",border:`1px solid ${C.surfaceD}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14}} onClick={()=>setPage(t.p)} onMouseEnter={e=>e.currentTarget.style.borderColor=C.oak} onMouseLeave={e=>e.currentTarget.style.borderColor=C.surfaceD}><div style={{fontSize:24}}>{t.i}</div><div><div style={{fontSize:13,fontWeight:500,color:C.text}}>{t.l}</div><div style={{fontSize:11,color:C.textS}}>{t.d}</div></div></div>)}
      </div></div>
    </div>
  </div>);
};

// ─── PROJECTS ─────────────────────────────────────────────
const ProjectsPage=({projects,detail,setDetail})=>{
  const [filter,setFilter]=useState({status:"all",search:""});
  let filtered=projects.filter(p=>{if(filter.status==="active"&&p.completed)return false;if(filter.status==="completed"&&!p.completed)return false;if(filter.search&&!p.name.toLowerCase().includes(filter.search.toLowerCase()))return false;return true;});
  filtered=filtered.sort((a,b)=>{if(a.completed&&!b.completed)return 1;if(!a.completed&&b.completed)return-1;if(!a.dueOn&&!b.dueOn)return 0;if(!a.dueOn)return 1;if(!b.dueOn)return-1;return new Date(a.dueOn)-new Date(b.dueOn)});
  const active=projects.filter(p=>!p.completed);const completed=projects.filter(p=>p.completed);
  if(detail){const ph=PHASES.find(x=>x.num===detail.phaseNum);return(<div><button onClick={()=>setDetail(null)} style={{background:"none",border:"none",color:C.oak,fontSize:13,cursor:"pointer",padding:0,marginBottom:20,fontWeight:500}}>← Back</button>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:24}}><div><div style={{background:C.white,borderRadius:8,padding:32,border:`1px solid ${C.surfaceD}`,marginBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}><div><h2 style={{fontSize:26,fontWeight:400,color:C.text,fontFamily:"'Cormorant Garamond',serif",margin:"0 0 6px"}}>{detail.name}</h2><div style={{fontSize:12,color:C.textS}}>{detail.type}</div></div><Badge variant={detail.completed?"success":"phase0"}>{detail.completed?"Completed":"Active"}</Badge></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,fontSize:13}}>{[["Phase",detail.completed?"Completed":`Ph. ${detail.phaseNum} – ${ph?.name||"?"}`],["Type",detail.type],["Sex",detail.sex||"—"],["Region",detail.region||"—"],["Due",fmtDate(detail.dueOn)],["Created",fmtDate(detail.created)],detail.completed?["Completed",fmtDate(detail.completedAt)]:["Notes",detail.notes||"—"]].map(([l,v])=><div key={l}><div style={{color:C.textS,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>{l}</div><div style={{color:C.text,fontWeight:500}}>{v}</div></div>)}</div></div>
      {!detail.completed&&ph&&<div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}><div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:16}}>Phase Progression</div><div style={{display:"flex",gap:3}}>{PHASES.map(x=><div key={x.num} style={{flex:1,height:8,borderRadius:4,background:x.num<=detail.phaseNum?x.color:C.surfaceD}} title={`Ph ${x.num} – ${x.name}`}/>)}</div></div>}
    </div><div>
      {!detail.completed&&ph&&<div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`,marginBottom:20}}><div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:12}}>Current Phase</div><div style={{background:ph.color+"18",borderRadius:8,padding:16,borderLeft:`4px solid ${ph.color}`}}><div style={{fontSize:15,fontWeight:600,color:C.text}}>Phase {ph.num} – {ph.name}</div><div style={{fontSize:12,color:C.textS,marginTop:6,lineHeight:1.5}}>{ph.desc}</div></div></div>}
      <a href={detail.url} target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",background:C.black,color:C.white,padding:12,borderRadius:8,fontSize:13,fontWeight:500,textDecoration:"none"}}>Open in Asana →</a>
    </div></div></div>);}
  return(<div><Title sub={`${projects.length} projects · Sorted by due date`}>All Projects</Title>
    <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"}}><input placeholder="Search…" value={filter.search} onChange={e=>setFilter({...filter,search:e.target.value})} style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,width:220,outline:"none"}}/>
      <select value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})} style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,background:C.white}}><option value="all">All ({projects.length})</option><option value="active">Active ({active.length})</option><option value="completed">Completed ({completed.length})</option></select></div>
    <div style={{background:C.white,borderRadius:8,border:`1px solid ${C.surfaceD}`,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{background:C.surface}}>{["Project","Type","Phase","Due","Status"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontWeight:600,fontSize:11,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",borderBottom:`1px solid ${C.surfaceD}`}}>{h}</th>)}</tr></thead>
      <tbody>{filtered.map(p=><tr key={p.gid} style={{cursor:"pointer",borderBottom:`1px solid ${C.surfaceD}`}} onClick={()=>setDetail(p)} onMouseEnter={e=>e.currentTarget.style.background=C.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <td style={{padding:"12px 16px"}}><div style={{fontWeight:500,color:C.text}}>{p.name}</div>{p.sex&&<div style={{fontSize:11,color:C.textS}}>{p.sex}</div>}</td>
        <td style={{padding:"12px 16px",color:C.text,fontSize:12}}>{p.type}</td>
        <td style={{padding:"12px 16px"}}>{p.completed?<Badge variant="success">Done</Badge>:<span style={{display:"inline-flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:"50%",background:PHASES[p.phaseNum]?.color||C.steel}}/>Ph. {p.phaseNum}</span>}</td>
        <td style={{padding:"12px 16px",color:C.text}}>{fmtDate(p.dueOn)}</td>
        <td style={{padding:"12px 16px"}}><Badge variant={p.completed?"success":"phase0"}>{p.completed?"Done":"Active"}</Badge></td>
      </tr>)}</tbody></table></div></div>);
};

// ─── QUOTATION BUILDER ────────────────────────────────────
const ADD_ONS=[
  {id:"screen55",name:'55" Screen (wall mounted)',price:1370,cat:"AV & HiFi"},
  {id:"screen75",name:'75" Screen (wall module mounted)',price:1351,cat:"AV & HiFi"},
  {id:"carpet",name:"Carpet",price:469,cat:"Floor"},
  {id:"leather_tray",name:"Leather Tray",price:282,cat:"Accessories"},
  {id:"shirt_hangers_50",name:"Shirt Hangers (50 pcs)",price:69,cat:"Selected Deliveries"},
  {id:"clip_hangers_50",name:"Clip Hangers (50 pcs)",price:83,cat:"Selected Deliveries"},
  {id:"coat_hangers_25",name:"Coat Hangers (25 pcs)",price:89,cat:"Selected Deliveries"},
];

const QuotationPage=()=>{
  const [parsedData,setParsedData]=useState(null);
  const [parsing,setParsing]=useState(false);
  const [parseError,setParseError]=useState(null);
  const [addOns,setAddOns]=useState({});
  const [customItems,setCustomItems]=useState([]);
  const [header,setHeader]=useState({project:"",salesArea:"",gender:"",updated:""});
  // Editable category totals
  const [catOverrides,setCatOverrides]=useState({inventory:"",selectedDeliveries:"",specificProjectCost:""});
  const fileRef=useRef(null);

  const loadPdfJs=useCallback(()=>new Promise((resolve,reject)=>{
    if(window.pdfjsLib)return resolve(window.pdfjsLib);
    const script=document.createElement('script');
    script.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';resolve(window.pdfjsLib)};
    script.onerror=reject;document.head.appendChild(script);
  }),[]);

  const handlePDFUpload=async(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    setParsing(true);setParseError(null);
    try{
      const pdfjsLib=await loadPdfJs();
      const arrayBuffer=await file.arrayBuffer();
      const pdf=await pdfjsLib.getDocument({data:arrayBuffer}).promise;
      const lines=[];
      for(let i=1;i<=pdf.numPages;i++){
        const page=await pdf.getPage(i);
        const content=await page.getTextContent();
        let lastY=null;let line='';
        for(const item of content.items){
          if(lastY!==null&&Math.abs(item.transform[5]-lastY)>2){lines.push(line);line='';}
          line+=(line?' ':'')+item.str;
          lastY=item.transform[5];
        }
        if(line)lines.push(line);
      }
      const res=await fetch("/api/parse-quotation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lines})});
      if(!res.ok){const err=await res.json();throw new Error(err.error||"Parse failed");}
      const data=await res.json();
      setParsedData(data);
      setHeader({project:data.project||"",salesArea:String(data.salesArea||""),gender:data.gender||"",updated:data.updated||""});
      setCatOverrides({inventory:String(data.summary?.inventory||""),selectedDeliveries:String(data.summary?.selectedDeliveries||""),specificProjectCost:String(data.summary?.specificProjectCost||"")});
    }catch(err){setParseError(err.message);}finally{setParsing(false);}
  };

  const toggleAddOn=(id)=>setAddOns(prev=>{const n={...prev};if(n[id])delete n[id];else n[id]={qty:1};return n;});
  const setAddOnQty=(id,qty)=>setAddOns(prev=>({...prev,[id]:{qty:Math.max(1,parseInt(qty)||1)}}));
  const addCustomItem=()=>setCustomItems(prev=>[...prev,{name:"",price:"",qty:"1"}]);
  const updateCustom=(i,field,val)=>setCustomItems(prev=>prev.map((item,idx)=>idx===i?{...item,[field]:val}:item));
  const removeCustom=(i)=>setCustomItems(prev=>prev.filter((_,idx)=>idx!==i));

  const invTotal=parseFloat(catOverrides.inventory)||0;
  const delTotal=parseFloat(catOverrides.selectedDeliveries)||0;
  const projTotal=parseFloat(catOverrides.specificProjectCost)||0;
  const supplierTotal=invTotal+delTotal+projTotal;
  const addOnTotal=Object.entries(addOns).reduce((sum,[id,{qty}])=>{const item=ADD_ONS.find(a=>a.id===id);return sum+(item?item.price*qty:0);},0);
  const customTotal=customItems.reduce((sum,item)=>sum+(parseFloat(item.price)||0)*(parseInt(item.qty)||1),0);
  const grandTotal=supplierTotal+addOnTotal+customTotal;
  const sqm=parseFloat(header.salesArea)||0;

  const PlusMinus=({value,onChange})=>(
    <div style={{display:"flex",alignItems:"center",gap:0}}>
      <button onClick={()=>onChange(Math.max(1,value-1))} style={{width:28,height:28,border:`1px solid ${C.surfaceD}`,borderRadius:"4px 0 0 4px",background:C.surface,cursor:"pointer",fontSize:14,color:C.text,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      <input type="text" inputMode="numeric" value={value} onChange={e=>onChange(parseInt(e.target.value)||1)} style={{width:40,height:28,border:`1px solid ${C.surfaceD}`,borderLeft:"none",borderRight:"none",fontSize:13,textAlign:"center",outline:"none",fontFamily:"'DM Mono',monospace"}}/>
      <button onClick={()=>onChange(value+1)} style={{width:28,height:28,border:`1px solid ${C.surfaceD}`,borderRadius:"0 4px 4px 0",background:C.surface,cursor:"pointer",fontSize:14,color:C.text,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
    </div>
  );

  const EditableTotal=({label,field})=>(
    <div style={{padding:"10px 14px",background:C.surface,borderRadius:6}}>
      <div style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>{label}</div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:16,color:C.text,fontFamily:"'Cormorant Garamond',serif"}}>€</span>
        <input type="text" inputMode="decimal" value={catOverrides[field]} onChange={e=>setCatOverrides(prev=>({...prev,[field]:e.target.value}))} style={{fontSize:18,fontWeight:300,color:C.text,fontFamily:"'DM Mono',monospace",border:"none",borderBottom:`1px solid ${C.surfaceD}`,background:"transparent",outline:"none",width:100,padding:"2px 0"}}/>
      </div>
    </div>
  );

  return(<div>
    <Title sub="Upload a supplier quotation PDF to generate a branded project quotation">Quotation Builder</Title>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:32}}>
      <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>
        <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:16}}>1. Upload Supplier Quotation</div>
        <div style={{border:`2px dashed ${parsing?C.oak:C.surfaceD}`,borderRadius:8,padding:32,textAlign:"center",cursor:"pointer",background:parsing?C.oak+"06":"transparent"}} onClick={()=>fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept=".pdf" style={{display:"none"}} onChange={handlePDFUpload}/>
          {parsing?<div><div style={{fontSize:24,marginBottom:8}}>⏳</div><div style={{fontSize:13,color:C.oak,fontWeight:500}}>Parsing PDF…</div></div>:
          parsedData?<div><div style={{fontSize:24,marginBottom:8}}>✅</div><div style={{fontSize:13,color:C.success,fontWeight:500}}>{parsedData.project}</div><div style={{fontSize:11,color:C.textS,marginTop:4}}>{fmtEur(supplierTotal)} · {parsedData.salesArea} m² · Click to upload new</div></div>:
          <div><div style={{fontSize:24,marginBottom:8}}>📄</div><div style={{fontSize:13,color:C.textS}}>Drop PDF here or click to upload</div></div>}
        </div>
        {parseError&&<div style={{marginTop:12,padding:"10px 14px",background:"#FDEAE6",borderRadius:6,fontSize:12,color:C.danger}}>{parseError}</div>}
      </div>
      <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>
        <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:16}}>Project Details</div>
        <div style={{marginBottom:12}}><label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Project Name</label><input value={header.project} onChange={e=>setHeader(h=>({...h,project:e.target.value}))} style={{width:"100%",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/></div>
        <div style={{marginBottom:12}}><label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Sales Area (m²)</label><input value={header.salesArea} onChange={e=>setHeader(h=>({...h,salesArea:e.target.value}))} style={{width:"100%",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/></div>
        <div style={{marginBottom:12}}><label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Gender</label><select value={header.gender} onChange={e=>setHeader(h=>({...h,gender:e.target.value}))} style={{width:"100%",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,background:C.white}}><option value="">Choose Gender</option><option value="Unisex">Unisex</option><option value="Womens">Womens</option><option value="Mens">Mens</option></select></div>
        <div style={{marginBottom:12}}><label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Date</label><input type="date" value={header.updated} onChange={e=>setHeader(h=>({...h,updated:e.target.value}))} style={{width:"100%",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/></div>
      </div>
    </div>

    {/* Parsed summary with editable totals */}
    {parsedData&&<div style={{marginBottom:32}}>
      <Title sub="From supplier quotation – click amounts to edit">Cost Breakdown</Title>
      <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
          <EditableTotal label="Inventory" field="inventory"/>
          <EditableTotal label="Selected Deliveries" field="selectedDeliveries"/>
          <EditableTotal label="Specific Project Cost" field="specificProjectCost"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div style={{padding:"10px 14px",background:C.black,borderRadius:6,color:C.white}}><div style={{fontSize:11,fontWeight:600,color:C.steelL,textTransform:"uppercase",letterSpacing:".5px"}}>Supplier Total</div><div style={{fontSize:20,fontWeight:300,fontFamily:"'Cormorant Garamond',serif"}}>{fmtEur(supplierTotal)}</div></div>
          {sqm>0&&<div style={{padding:"10px 14px",background:C.surface,borderRadius:6}}><div style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px"}}>SQM Price</div><div style={{fontSize:20,fontWeight:300,color:C.text,fontFamily:"'Cormorant Garamond',serif"}}>{fmtEur(sqm>0?Math.round(supplierTotal/sqm):0)} / m²</div></div>}
        </div>
        {parsedData.categories?.map(cat=>(
          <details key={cat.name} style={{marginBottom:8}}>
            <summary style={{cursor:"pointer",fontSize:13,fontWeight:600,color:C.text,padding:"8px 0",borderBottom:`1px solid ${C.surfaceD}`}}>{cat.name} — {fmtEur(cat.total)} ({cat.items?.length||0} items)</summary>
            <div style={{padding:"8px 0"}}>{cat.items?.map((item,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0",color:C.textS}}><span>{item.qty>0?`${item.qty}× `:""}{item.name}</span><span style={{fontWeight:500,color:C.text}}>{fmtEur(item.totalPrice)}</span></div>)}</div>
          </details>
        ))}
      </div>
    </div>}

    {/* Add-ons */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:32}}>
      <div>
        <Title sub="Select optional elements">2. Add-ons</Title>
        <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>
          {ADD_ONS.map(item=>{const sel=addOns[item.id];return(
            <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.surfaceD}`}}>
              <input type="checkbox" checked={!!sel} onChange={()=>toggleAddOn(item.id)} style={{width:16,height:16,accentColor:C.oak}}/>
              <div style={{flex:1}}><div style={{fontSize:13,color:C.text}}>{item.name}</div><div style={{fontSize:11,color:C.textS}}>{item.cat} · {fmtEur(item.price)} / pc</div></div>
              {sel&&<PlusMinus value={sel.qty} onChange={v=>setAddOnQty(item.id,v)}/>}
              {sel&&<div style={{fontSize:13,fontWeight:600,color:C.text,minWidth:60,textAlign:"right"}}>{fmtEur(item.price*sel.qty)}</div>}
            </div>);})}
        </div>
      </div>
      <div>
        <Title sub="Additional costs">3. Custom Items</Title>
        <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>
          {customItems.map((item,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
              <input placeholder="Description" value={item.name} onChange={e=>updateCustom(i,"name",e.target.value)} style={{flex:2,padding:"8px 10px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/>
              <input placeholder="Price" type="text" inputMode="decimal" value={item.price} onChange={e=>updateCustom(i,"price",e.target.value)} style={{width:80,padding:"8px 10px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/>
              <input placeholder="Qty" type="text" inputMode="numeric" value={item.qty} onChange={e=>updateCustom(i,"qty",e.target.value)} style={{width:48,padding:"8px 10px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,textAlign:"center",outline:"none"}}/>
              <button onClick={()=>removeCustom(i)} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,padding:4}}>×</button>
            </div>))}
          <button onClick={addCustomItem} style={{width:"100%",padding:"10px",borderRadius:6,border:`1px dashed ${C.surfaceD}`,background:"transparent",cursor:"pointer",fontSize:13,color:C.textS}}>+ Add custom item</button>
        </div>

        <div style={{background:C.black,borderRadius:8,padding:24,marginTop:20,color:C.white}}>
          <div style={{fontSize:11,color:C.steelL,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",marginBottom:12}}>Quotation Summary</div>
          {supplierTotal>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}><span style={{color:C.steelL}}>Supplier</span><span style={{fontWeight:500}}>{fmtEur(supplierTotal)}</span></div>}
          {addOnTotal>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}><span style={{color:C.steelL}}>Add-ons</span><span style={{fontWeight:500}}>{fmtEur(addOnTotal)}</span></div>}
          {customTotal>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}><span style={{color:C.steelL}}>Custom items</span><span style={{fontWeight:500}}>{fmtEur(customTotal)}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:20,paddingTop:12,fontFamily:"'Cormorant Garamond',serif"}}><span>Total excl. VAT</span><span style={{fontWeight:500}}>{fmtEur(grandTotal)}</span></div>
          {sqm>0&&<div style={{fontSize:12,color:C.steelL,marginTop:4,textAlign:"right"}}>{fmtEur(Math.round(grandTotal/sqm))} / m²</div>}
        </div>

        {grandTotal>0&&<button onClick={()=>{
          const addOnItems=Object.entries(addOns).map(([id,{qty}])=>{const a=ADD_ONS.find(x=>x.id===id);return a?{name:a.name,qty,total:a.price*qty}:null}).filter(Boolean);
          const customItemsList=customItems.filter(i=>i.name&&parseFloat(i.price)).map(i=>({name:i.name,qty:parseInt(i.qty)||1,total:(parseFloat(i.price)||0)*(parseInt(i.qty)||1)}));
          const w=window.open('','_blank');
          w.document.write(`<!DOCTYPE html><html><head><title>Quotation – ${header.project||'Selected Frame'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
          <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;color:#2C2C2C;padding:40px 60px;max-width:900px;margin:0 auto}
          .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:2px solid #1A1A1A}
          .logo{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300}.logo span{display:block;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8A8D8F;font-family:'DM Sans',sans-serif;margin-top:4px}
          .meta{text-align:right;font-size:12px;color:#6B6B6B}.meta strong{color:#2C2C2C;display:block;font-size:14px;margin-bottom:4px}
          h2{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:400;margin:32px 0 16px;padding-bottom:8px;border-bottom:1px solid #ECEAE5}
          table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px}th{text-align:left;padding:8px 12px;background:#F5F4F1;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6B6B6B;border-bottom:1px solid #ECEAE5}
          td{padding:6px 12px;border-bottom:1px solid #F5F4F1}.r{text-align:right}
          .total-row{background:#1A1A1A;color:#fff;padding:20px 24px;border-radius:8px;margin-top:32px}.total-label{font-size:14px;color:#B8BBBE}.total-amount{font-size:24px;font-family:'Cormorant Garamond',serif;font-weight:300;text-align:right}
          .sqm{font-size:11px;color:#B8BBBE;text-align:right;margin-top:4px}
          .footer{margin-top:48px;padding-top:20px;border-top:1px solid #ECEAE5;font-size:10px;color:#8A8D8F;display:flex;justify-content:space-between}
          @media print{body{padding:20px 40px}button{display:none!important}}</style></head><body>
          <div class="header"><div class="logo">Selected Frame<span>[ A frame for the business we share ]</span></div>
          <div class="meta"><strong>Quotation</strong>${header.project}<br>${header.salesArea?header.salesArea+' m²':''} ${header.gender?'· '+header.gender:''}<br>${header.updated}</div></div>
          <button onclick="window.print()" style="background:#1A1A1A;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-size:13px;cursor:pointer;margin-bottom:24px;font-family:'DM Sans',sans-serif">Print / Save as PDF</button>
          <h2>Supplier – &elements ApS</h2>
          <table><thead><tr><th>Category</th><th class="r">Amount</th></tr></thead><tbody>
          <tr><td>Inventory</td><td class="r">${fmtEur(invTotal)}</td></tr>
          <tr><td>Selected Deliveries</td><td class="r">${fmtEur(delTotal)}</td></tr>
          <tr><td>Specific Project Cost</td><td class="r">${fmtEur(projTotal)}</td></tr>
          <tr style="font-weight:600;border-top:2px solid #ECEAE5"><td>Supplier Total</td><td class="r">${fmtEur(supplierTotal)}</td></tr>
          </tbody></table>
          ${addOnItems.length>0?`<h2>Add-ons</h2><table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Total</th></tr></thead><tbody>
          ${addOnItems.map(a=>`<tr><td>${a.name}</td><td class="r">${a.qty}</td><td class="r">${fmtEur(a.total)}</td></tr>`).join('')}
          <tr style="font-weight:600;border-top:2px solid #ECEAE5"><td colspan="2">Add-ons Total</td><td class="r">${fmtEur(addOnTotal)}</td></tr></tbody></table>`:''}
          ${customItemsList.length>0?`<h2>Additional Items</h2><table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Total</th></tr></thead><tbody>
          ${customItemsList.map(a=>`<tr><td>${a.name}</td><td class="r">${a.qty}</td><td class="r">${fmtEur(a.total)}</td></tr>`).join('')}
          <tr style="font-weight:600;border-top:2px solid #ECEAE5"><td colspan="2">Additional Total</td><td class="r">${fmtEur(customTotal)}</td></tr></tbody></table>`:''}
          <div class="total-row"><div style="display:flex;justify-content:space-between;align-items:center"><div class="total-label">Total excl. VAT</div><div class="total-amount">${fmtEur(grandTotal)}</div></div>${sqm>0?`<div class="sqm">${fmtEur(Math.round(grandTotal/sqm))} / m²</div>`:''}</div>
          <div class="footer"><span>Selected Frame · Brand Spaces</span><span>Confidential – for internal use only</span></div></body></html>`);w.document.close();
        }} style={{width:"100%",padding:"14px",borderRadius:8,border:"none",background:C.oak,color:C.white,fontSize:14,fontWeight:600,cursor:"pointer",marginTop:16}}>
          Export Quotation as PDF →
        </button>}
      </div>
    </div>
  </div>);
};

// ─── ROI TOOL ─────────────────────────────────────────────
const ROIPage=()=>{
  const [model,setModel]=useState("uplift");const [inp,setInp]=useState({retail:"150000",markup:"2.9",capex:"20000",opex:"16",scenario:"Base",valueView:"Gross Profit",gm:"35",ebit:"19",existSqm:"20",addSqm:"10"});
  const n=(k)=>parseFloat(inp[k])||0;const scen={Worst:.05,Base:.10,Best:.15};const goT=24,revT=36;const totSqm=n("existSqm")+n("addSqm");const retailSqm=totSqm>0?n("retail")/totSqm:0;const annOpex=n("capex")*(n("opex")/100);
  const incWS=n("markup")>0?((n("addSqm")*retailSqm)+(n("existSqm")*retailSqm*(scen[inp.scenario]||.1)))/n("markup"):0;
  let nav;if(model==="uplift"){if(inp.valueView==="Wholesale")nav=incWS-annOpex;else if(inp.valueView==="Gross Profit")nav=(incWS*(n("gm")/100))-annOpex;else nav=(incWS*(n("ebit")/100))-annOpex;}else{const tWS=n("markup")>0?n("retail")/n("markup"):0;if(inp.valueView==="Wholesale")nav=tWS-annOpex;else if(inp.valueView==="Gross Profit")nav=(tWS*(n("gm")/100))-annOpex;else nav=(tWS*(n("ebit")/100))-annOpex;}
  const pbM=nav>0?(n("capex")/nav)*12:null;const status=!pbM||nav<=0?"NO GO":pbM<=goT?"GO":pbM<=revT?"REVIEW":"NO GO";
  const reason=nav<=0?"Net value ≤ 0":status==="NO GO"?"Payback above threshold":status==="REVIEW"?"Borderline – escalation":"Within policy";
  const IF=({label,field,suffix,options})=><div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>{label}</label>{options?<select value={inp[field]} onChange={e=>setInp(p=>({...p,[field]:e.target.value}))} style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:14,background:C.white}}>{options.map(o=><option key={o}>{o}</option>)}</select>:<div style={{display:"flex",alignItems:"center",gap:6}}><input type="text" inputMode="decimal" value={inp[field]} onChange={e=>setInp(p=>({...p,[field]:e.target.value}))} onFocus={e=>e.target.select()} style={{flex:1,padding:"10px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:14,outline:"none",fontFamily:"'DM Mono',monospace"}}/>{suffix&&<span style={{fontSize:12,color:C.textS,minWidth:28}}>{suffix}</span>}</div>}</div>;
  return<div><Title sub="Evaluate SIS investment business cases">ROI Investment Tool</Title>
    <div style={{display:"flex",gap:8,marginBottom:24}}>{[["uplift","Uplift Model","Existing distribution"],["total","Total Payback","New distribution"]].map(([k,l,d])=><div key={k} style={{flex:1,padding:"16px 20px",borderRadius:8,cursor:"pointer",border:`2px solid ${model===k?C.oak:C.surfaceD}`,background:model===k?C.oak+"08":C.white}} onClick={()=>setModel(k)}><div style={{fontSize:14,fontWeight:600,color:C.text}}>{l}</div><div style={{fontSize:11,color:C.textS,marginTop:4}}>{d}</div></div>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 280px",gap:24}}>
      <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}><div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:16}}>Financial</div><IF label="Retail Sales / Year (EUR)" field="retail" suffix="EUR"/><IF label="Mark-up" field="markup"/><IF label="CAPEX (EUR)" field="capex" suffix="EUR"/><IF label="OPEX (%)" field="opex" suffix="%"/>{model==="uplift"&&<IF label="Scenario" field="scenario" options={["Worst","Base","Best"]}/>}<IF label="Value View" field="valueView" options={["Wholesale","Gross Profit","EBIT"]}/>{inp.valueView==="Gross Profit"&&<IF label="Gross Margin (%)" field="gm" suffix="%"/>}</div>
      <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}><div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:16}}>Space</div>{model==="uplift"&&<><IF label="Existing (m²)" field="existSqm" suffix="m²"/><IF label="Added (m²)" field="addSqm" suffix="m²"/></>}<div style={{background:C.surface,borderRadius:6,padding:"12px 14px"}}><div style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase"}}>Total</div><div style={{fontSize:22,fontWeight:300,color:C.text,fontFamily:"'Cormorant Garamond',serif"}}>{totSqm} m²</div></div></div>
      <div style={{borderRadius:8,padding:24,border:`2px solid ${status==="GO"?C.go:status==="REVIEW"?C.review:C.nogo}`,background:status==="GO"?"#E8F2EA":status==="REVIEW"?"#FDF3E0":"#FDEAE6"}}><div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:48,fontWeight:300,fontFamily:"'Cormorant Garamond',serif",color:status==="GO"?C.go:status==="REVIEW"?C.review:C.nogo}}>{status}</div></div><div style={{fontSize:12,color:C.textS,textAlign:"center",marginBottom:20}}>{reason}</div>
        {[["Net Annual Value",nav?fmtEur(Math.round(nav)):"—"],["Payback",pbM?`${pbM.toFixed(1)} months`:"N/A"],["OPEX/yr",fmtEur(Math.round(annOpex))]].map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:12,borderBottom:"1px solid rgba(0,0,0,.06)"}}><span style={{color:C.textS}}>{l}</span><span style={{fontWeight:600,color:C.text}}>{v}</span></div>)}
      </div>
    </div></div>;
};

// ─── OTHER PAGES ──────────────────────────────────────────
const FlowPage=()=><div><Title sub="Phase 0–10 governance journey">Project Flow</Title><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:32,borderRadius:8,overflow:"hidden"}}><div style={{height:200}}><img src="/images/kh_selected_sis_048_web.jpg" alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div><div style={{height:200}}><img src="/images/kh_selected_sis_023_web.jpg" alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div></div><div style={{position:"relative"}}><div style={{position:"absolute",left:23,top:20,bottom:20,width:2,background:`linear-gradient(to bottom,${C.steelL},${C.accent})`}}/>{PHASES.map(ph=><div key={ph.num} style={{display:"flex",gap:24,marginBottom:16,position:"relative"}}><div style={{width:48,height:48,borderRadius:"50%",background:ph.color,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,fontWeight:600,boxShadow:`0 2px 8px ${ph.color}44`,zIndex:1}}>{ph.num}</div><div style={{background:C.white,borderRadius:8,padding:"16px 20px",border:`1px solid ${C.surfaceD}`,flex:1,borderLeft:`4px solid ${ph.color}`}}><div style={{fontSize:11,fontWeight:600,color:ph.color,textTransform:"uppercase",letterSpacing:"1px"}}>Phase {ph.num}</div><div style={{fontSize:18,fontWeight:400,color:C.text,fontFamily:"'Cormorant Garamond',serif"}}>{ph.name}</div><p style={{fontSize:12,color:C.textS,margin:"6px 0 0",lineHeight:1.5}}>{ph.desc}</p></div></div>)}</div></div>;
const InstalledPage=({projects})=>{const comp=projects.filter(p=>p.completed);return<div><Title sub="Completed installations">Installed Base</Title><div style={{display:"flex",gap:16,marginBottom:24}}><KPI label="Installations" value={comp.length}/></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>{comp.map(p=><div key={p.gid} style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`,borderTop:`4px solid ${C.accent}`}}><div style={{fontSize:16,fontWeight:400,color:C.text,fontFamily:"'Cormorant Garamond',serif",marginBottom:8}}>{p.name}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>{[["Type",p.type],["Sex",p.sex||"—"],["Completed",fmtDate(p.completedAt)],["Due Was",fmtDate(p.dueOn)]].map(([l,v])=><div key={l}><div style={{color:C.textS,fontSize:10,fontWeight:600,textTransform:"uppercase"}}>{l}</div><div style={{color:C.text,fontWeight:500}}>{v}</div></div>)}</div><a href={p.url} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:12,fontSize:11,color:C.oak,textDecoration:"none",fontWeight:500}}>View details →</a></div>)}</div></div>};
const StandardsPage=()=><div><Title sub="Concept guidelines">Standards & Knowledge</Title><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:32,borderRadius:8,overflow:"hidden"}}><div style={{height:220}}><img src="/images/kh_selected_sis_032_web.jpg" alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div><div style={{height:220}}><img src="/images/kh_selected_sis_018_web.jpg" alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>{[{t:"Selected Frame Concept",d:"Flexible, modular, balancing industrial precision with natural warmth.",items:["Steel – Cool, industrial, minimalistic","Colour & shapes – Softness, playfulness","Warm wood – Scandinavian touch"]},{t:"Floor Plan Standards",d:"Standard proposals by size.",items:["25 m² – Compact","40 m² – Standard","60 m² – Full","80 m² – Flagship"]},{t:"Design Pillars",d:"Three core pillars.",items:["[ Visibility ] – Impact in-store","[ Consistency ] – Cohesive brand","[ Flexibility ] – Scalable"]},{t:"Performance Partnership",d:"Data-driven collaboration.",items:["Real-time sell-in/sell-out","Trade meetings","Pre-set budgets","Seasonal planning control"]}].map(s=><div key={s.t} style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}><div style={{fontSize:18,fontWeight:400,color:C.text,fontFamily:"'Cormorant Garamond',serif",marginBottom:6}}>{s.t}</div><p style={{fontSize:12,color:C.textS,margin:"0 0 12px",lineHeight:1.5}}>{s.d}</p>{s.items.map(i=><div key={i} style={{fontSize:12,color:C.text,padding:"4px 0",borderBottom:`1px solid ${C.surfaceD}`}}>{i}</div>)}</div>)}</div></div>;
const AdminPage=({projects})=><div><Title sub="System health">Admin</Title><div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}><KPI label="Source" value="BRAND SPACES"/><KPI label="Tasks" value={projects.length}/><KPI label="Status" value="Connected"/></div><div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}><div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:16}}>Field Completeness</div>{[["Name",100],["Due Date",Math.round(projects.filter(p=>p.dueOn).length/Math.max(projects.length,1)*100)],["Phase",100],["Sex",Math.round(projects.filter(p=>p.sex).length/Math.max(projects.length,1)*100)],["Region",Math.round(projects.filter(p=>p.region).length/Math.max(projects.length,1)*100)]].map(([f,pct])=><div key={f} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span>{f}</span><span style={{color:pct>=80?C.success:pct>=40?C.warn:C.danger,fontWeight:600}}>{pct}%</span></div><div style={{height:4,background:C.surfaceD,borderRadius:2}}><div style={{height:4,borderRadius:2,width:`${pct}%`,background:pct>=80?C.success:pct>=40?C.warn:C.danger}}/></div></div>)}</div></div>;

// ─── MAIN ─────────────────────────────────────────────────
export default function Home(){
  const [page,setPage]=useState("overview");const [detail,setDetail]=useState(null);const [hover,setHover]=useState(null);
  const [projects,setProjects]=useState(FALLBACK_PROJECTS);
  useEffect(()=>{const f=async()=>{try{const r=await fetch("/api/projects");if(r.ok){const d=await r.json();if(d.projects?.length>0)setProjects(d.projects)}}catch(e){}};f();const i=setInterval(f,15*60*1000);return()=>clearInterval(i)},[]);
  const nav=[{id:"overview",label:"Overview",icon:"◈"},{id:"projects",label:"Projects",icon:"▦"},{id:"quotation",label:"Quotation",icon:"📋"},{id:"roi",label:"ROI Tool",icon:"◇"},{id:"flow",label:"Project Flow",icon:"⟳"},{id:"installed",label:"Installed Base",icon:"⊞"},{id:"standards",label:"Standards",icon:"☰"},{id:"admin",label:"Admin",icon:"⚙"}];
  return<div style={{display:"flex",minHeight:"100vh",background:C.surface}}>
    <div style={{width:220,background:C.black,color:C.white,flexShrink:0,display:"flex",flexDirection:"column",padding:"28px 0",position:"sticky",top:0,height:"100vh"}}>
      <div style={{padding:"0 24px",marginBottom:36}}><img src="/images/logo.png" alt="Selected Frame" style={{height:28,filter:"invert(1)",marginBottom:8}}/><div style={{fontSize:9,color:C.steel,letterSpacing:"1.5px",textTransform:"uppercase",marginTop:4}}>Command Space</div></div>
      <div style={{flex:1}}>{nav.map(item=><div key={item.id} style={{padding:"10px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontSize:13,fontWeight:page===item.id?600:400,background:page===item.id?C.steelD+"33":hover===item.id?"rgba(255,255,255,.04)":"transparent",color:page===item.id?C.white:C.steelL,borderLeft:page===item.id?`3px solid ${C.oak}`:"3px solid transparent"}} onClick={()=>{setPage(item.id);setDetail(null)}} onMouseEnter={()=>setHover(item.id)} onMouseLeave={()=>setHover(null)}><span style={{fontSize:16,width:20,textAlign:"center",opacity:.7}}>{item.icon}</span>{item.label}</div>)}</div>
      <div style={{padding:"16px 24px",borderTop:`1px solid ${C.steelD}33`}}><div style={{fontSize:10,color:C.steel}}>v1.4</div><div style={{fontSize:10,color:C.steel,marginTop:2}}>[ A frame for the business we share ]</div></div>
    </div>
    <div style={{flex:1,overflow:"auto"}}><div style={{padding:"14px 40px",background:C.white,borderBottom:`1px solid ${C.surfaceD}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:13,color:C.textS}}>{nav.find(n=>n.id===page)?.label}</div><div style={{fontSize:12,color:C.textS}}>{new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div></div>
      <div style={{padding:"32px 40px",maxWidth:1200}}>
        {page==="overview"&&<OverviewPage projects={projects} setPage={setPage} setDetail={setDetail}/>}
        {page==="projects"&&<ProjectsPage projects={projects} detail={detail} setDetail={setDetail}/>}
        {page==="quotation"&&<QuotationPage/>}
        {page==="roi"&&<ROIPage/>}
        {page==="flow"&&<FlowPage/>}
        {page==="installed"&&<InstalledPage projects={projects}/>}
        {page==="standards"&&<StandardsPage/>}
        {page==="admin"&&<AdminPage projects={projects}/>}
      </div>
    </div>
  </div>;
}
