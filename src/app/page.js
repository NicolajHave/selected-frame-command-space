"use client";
import { SECTIONS as SF_SECTIONS, INTRO as SF_INTRO, DNA as SF_DNA, NON_NEGOTIABLES as SF_NON_NEGOTIABLES, SPACE_MANAGEMENT as SF_SPACE_MANAGEMENT, BRAND_APPLICATION as SF_BRAND_APPLICATION, FIXTURES as SF_FIXTURES, MERCHANDISING as SF_MERCHANDISING, PLAYBOOKS as SF_PLAYBOOKS, EXCEPTIONS as SF_EXCEPTIONS } from "./standards-content";
import DraftStudioPage from "./draft-studio/DraftStudioPage";
import ToolboxPage from "./toolbox/ToolboxPage";
import ProjectIntakePage from "./project-intake/ProjectIntakePage";
import ExternalFoldersPage from "./external-project-folders/ExternalFoldersPage";
import OpeningReportsPage from "./opening-reports/OpeningReportsPage";
import ShowroomOpsPage from "./showroom-ops/ShowroomOpsPage";
import { ExternalFolderCard, RecentlyOpenedFolders } from "./external-project-folders/ui";
import { NEWS } from "../data/news";
import React, { useState, useEffect, useCallback, useRef } from "react";

const C={steel:"#8A8D8F",steelL:"#B8BBBE",steelD:"#5C5F61",oak:"#C4944A",sage:"#B5C4B1",surface:"#F5F4F1",surfaceD:"#ECEAE5",white:"#FFFFFF",black:"#1A1A1A",text:"#2C2C2C",textS:"#6B6B6B",accent:"#3D6B4F",warn:"#D4A843",danger:"#C75B4A",success:"#5A8F6A",go:"#4A7C5C",review:"#C4944A",nogo:"#C75B4A"};
const PHASES=[
  {num:0,name:"Qualification",color:"#7AB648",tagline:"Validate scope, timing, feasibility",desc:"Project is reviewed and qualified based on the Filecard. Scope, timing, and feasibility are assessed before any work begins."},
  {num:1,name:"Internal Layout Direction",color:"#E8384F",tagline:"Internal-only zoning (Level 1)",desc:"An internal layout direction is defined, including overall zoning and scope. No customer involvement at this stage."},
  {num:2,name:"Internal Budget & ROI Commitment",color:"#FD9A00",tagline:"Cost estimate + ROI + budget approval",desc:"Project cost is estimated, ROI is assessed, and internal budget approval is secured. No customer presentation before this phase is completed."},
  {num:3,name:"Customer Layout Approval",color:"#EEC300",tagline:"Partner approval (Level 2)",desc:"Customer-facing layout and zoning are presented and approved. Scope is aligned and locked with the partner."},
  {num:4,name:"Technical Freeze",color:"#E8D500",tagline:"All technical details locked",desc:"All technical details are finalized, including drawings and integrations. Project is prepared for production with no open technical questions."},
  {num:5,name:"Commercial Approval",color:"#A4CF30",tagline:"Quotation validated and signed off",desc:"Final quotation is validated and approved internally. Scope, pricing, and cost split are formally confirmed."},
  {num:6,name:"Production & Order Lock",color:"#4ECBC4",tagline:"Orders placed, project committed",desc:"All elements are ordered and production is initiated. Project is now fully committed and changes may impact cost and timeline."},
  {num:7,name:"Installation Planning",color:"#37C5AB",tagline:"Logistics and site readiness",desc:"Installation timing and logistics are coordinated with all stakeholders. Site readiness and responsibilities are confirmed."},
  {num:8,name:"Delivery & Installation",color:"#4186E0",tagline:"On-site execution and quality check",desc:"All elements are delivered and installed on-site. Quality is checked and any issues are resolved."},
  {num:9,name:"Merchandising & Opening",color:"#7A6FF0",tagline:"Visual quality, ready to go live",desc:"The shop is merchandised according to guidelines and prepared for opening. Final visual quality is ensured before going live."},
  {num:10,name:"Close & Learning",color:"#AA62E3",tagline:"Documentation and insights captured",desc:"The project is formally closed and key learnings are documented. Insights are captured to improve future projects."},
];
const FALLBACK_PROJECTS=[{gid:"1",name:"Salling / Kultorvet",type:"SIS",sex:null,phaseNum:0,region:null,dueOn:null,completed:false,completedAt:null,notes:"",url:"#",created:"2026-03-20"},{gid:"2",name:"Magasin, Lyngby",type:"Soft Shop",sex:"WOMENS",phaseNum:0,region:"NORTH",dueOn:"2026-04-09",completed:false,completedAt:null,notes:"",url:"#",created:"2026-02-12"},{gid:"3",name:"Heppel, Rosenheim",type:"SIS",sex:"MENS",phaseNum:11,region:null,dueOn:"2025-03-21",completed:true,completedAt:"2025-03-25",notes:"",url:"#",created:"2025-01-29"}];
const fmtDate=(d)=>d?new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"—";
const fmtEur=(n)=>typeof n==="number"&&n>0?`€${n.toLocaleString("de-DE",{minimumFractionDigits:0,maximumFractionDigits:0})}`:"—";
const fmtEurSigned=(n)=>{if(typeof n!=="number"||n===0)return"—";const abs=Math.abs(n).toLocaleString("de-DE",{minimumFractionDigits:0,maximumFractionDigits:0});return n<0?`−€${abs}`:`€${abs}`};
// Quotation currencies. `eurRate` = how many units of the currency per 1 EUR;
// used to convert the fixed EUR add-on price list into the chosen currency.
// DKK is pegged to EUR (~7.46); GBP floats (indicative) — both editable in the UI.
const CURRENCIES={
  EUR:{code:"EUR",symbol:"€",locale:"de-DE",eurRate:1},
  DKK:{code:"DKK",symbol:"kr ",locale:"da-DK",eurRate:7.46},
  GBP:{code:"GBP",symbol:"£",locale:"en-GB",eurRate:0.85},
};
const fmtMoney=(n,cur)=>typeof n==="number"&&n>0?`${cur.symbol}${n.toLocaleString(cur.locale,{minimumFractionDigits:0,maximumFractionDigits:0})}`:"—";
const fmtMoneySigned=(n,cur)=>{if(typeof n!=="number"||n===0)return"—";const abs=Math.abs(n).toLocaleString(cur.locale,{minimumFractionDigits:0,maximumFractionDigits:0});return n<0?`−${cur.symbol}${abs}`:`${cur.symbol}${abs}`};
const todayISO=()=>new Date().toISOString().split("T")[0];
const addDaysISO=(iso,days)=>{const d=new Date(iso);d.setDate(d.getDate()+days);return d.toISOString().split("T")[0]};
const IMG=["/images/kh_selected_sis_018_web.jpg","/images/kh_selected_sis_075_web.jpg","/images/kh_selected_sis_023_web.jpg","/images/kh_selected_sis_032_web.jpg","/images/kh_selected_sis_048_web.jpg","/images/kh_selected_sis_029_web.jpg"];
const LOGO_BLACK="/images/logo-black.png";
const LOGO_WHITE="/images/logo-white.png";
const Badge=({children,variant="default"})=>{const s={default:{bg:C.surfaceD,c:C.text},success:{bg:"#E8F2EA",c:C.go},phase0:{bg:"#E8F5E0",c:"#4A8C2A"},warn:{bg:"#FDF3E0",c:C.warn},danger:{bg:"#FDEAE6",c:C.danger}}[variant]||{bg:C.surfaceD,c:C.text};return<span style={{display:"inline-block",padding:"3px 10px",borderRadius:4,fontSize:11,fontWeight:600,letterSpacing:".5px",textTransform:"uppercase",background:s.bg,color:s.c}}>{children}</span>};
const KPI=({label,value,sub,accent})=><div style={{background:C.white,borderRadius:8,padding:"20px 24px",border:`1px solid ${C.surfaceD}`,borderTop:accent?`3px solid ${accent}`:`1px solid ${C.surfaceD}`,flex:1,minWidth:160}}><div style={{fontSize:11,color:C.textS,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>{label}</div><div style={{fontSize:32,fontWeight:300,color:C.text,fontFamily:"'Cormorant Garamond',serif",lineHeight:1}}>{value}</div>{sub&&<div style={{fontSize:12,color:C.textS,marginTop:6}}>{sub}</div>}</div>;
const Title=({children,sub})=><div style={{marginBottom:24}}><h2 style={{fontSize:22,fontWeight:400,color:C.text,fontFamily:"'Cormorant Garamond',serif",margin:0}}>{children}</h2>{sub&&<p style={{fontSize:13,color:C.textS,margin:"4px 0 0"}}>{sub}</p>}</div>;

// Plus/minus quantity stepper (module-level to keep referential identity stable across renders)
const PM=({value,onChange})=><div style={{display:"flex",alignItems:"center"}}><button onClick={()=>onChange(Math.max(1,value-1))} style={{width:28,height:28,border:`1px solid ${C.surfaceD}`,borderRadius:"4px 0 0 4px",background:C.surface,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button><input type="text" inputMode="numeric" value={value} onChange={e=>onChange(parseInt(e.target.value)||1)} style={{width:40,height:28,border:`1px solid ${C.surfaceD}`,borderLeft:"none",borderRight:"none",fontSize:13,textAlign:"center",outline:"none"}}/><button onClick={()=>onChange(value+1)} style={{width:28,height:28,border:`1px solid ${C.surfaceD}`,borderRadius:"0 4px 4px 0",background:C.surface,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button></div>;

// Editable Total field (module-level for stable identity - prevents focus loss on every keystroke)
const ET=({label,field,cats,setCats,symbol="€"})=><div style={{padding:"10px 14px",background:C.surface,borderRadius:6}}><div style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>{label}</div><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:16,color:C.text}}>{symbol}</span><input type="text" inputMode="decimal" value={cats[field]} onChange={e=>setCats(p=>({...p,[field]:e.target.value}))} style={{fontSize:18,fontWeight:300,color:C.text,fontFamily:"'DM Mono',monospace",border:"none",borderBottom:`1px solid ${C.surfaceD}`,background:"transparent",outline:"none",width:100,padding:"2px 0"}}/></div></div>;

// ─── NEWS ─────────────────────────────────────────────────
const fmtNewsDate=(d)=>new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});

const NewsMedia=({item,height})=>item.mediaType==="video"
  ? <video src={item.mediaSrc} poster={item.poster} autoPlay muted loop playsInline preload="metadata" style={{width:"100%",height:height||"100%",objectFit:"cover",display:"block",background:C.surfaceD}}/>
  : <img src={item.mediaSrc} alt={item.title} style={{width:"100%",height:height||"100%",objectFit:"cover",display:"block",background:C.surfaceD}}/>;

const NewsMeta=({item,size="default"})=>{
  const fs=size==="lg"?11:10;
  return <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:size==="lg"?10:6}}>
    <span style={{fontSize:fs,fontWeight:700,color:C.oak,textTransform:"uppercase",letterSpacing:"1.2px"}}>{item.category}</span>
    <span style={{fontSize:fs,color:C.steelL}}>·</span>
    <span style={{fontSize:fs,color:C.textS,fontFamily:"'DM Mono',monospace"}}>{fmtNewsDate(item.date)}</span>
  </div>;
};

const FeaturedNewsCard=({item,onLink})=><div style={{background:C.white,borderRadius:10,border:`1px solid ${C.surfaceD}`,overflow:"hidden",display:"grid",gridTemplateColumns:"minmax(0,1.1fr) minmax(0,1fr)",cursor:item.link?"pointer":"default"}} onClick={()=>item.link&&onLink(item.link)}>
  <div style={{aspectRatio:"16 / 10",overflow:"hidden"}}><NewsMedia item={item}/></div>
  <div style={{padding:"28px 32px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
    <NewsMeta item={item} size="lg"/>
    <div style={{fontSize:22,fontWeight:400,fontFamily:"'Cormorant Garamond',serif",color:C.text,lineHeight:1.25,marginBottom:10}}>{item.title}</div>
    <div style={{fontSize:13,color:C.textS,lineHeight:1.65}}>{item.description}</div>
    {item.link&&<div style={{marginTop:14,fontSize:12,fontWeight:600,color:C.oak,letterSpacing:".5px"}}>Open →</div>}
  </div>
</div>;

const SmallNewsCard=({item,onLink})=><div style={{background:C.white,borderRadius:8,border:`1px solid ${C.surfaceD}`,overflow:"hidden",display:"flex",flexDirection:"column",cursor:item.link?"pointer":"default"}} onClick={()=>item.link&&onLink(item.link)}>
  <div style={{aspectRatio:"16 / 10",overflow:"hidden"}}><NewsMedia item={item}/></div>
  <div style={{padding:"16px 18px 20px",display:"flex",flexDirection:"column",flex:1}}>
    <NewsMeta item={item}/>
    <div style={{fontSize:14,fontWeight:500,color:C.text,lineHeight:1.35,marginBottom:8}}>{item.title}</div>
    <div style={{fontSize:12,color:C.textS,lineHeight:1.6}}>{item.description}</div>
  </div>
</div>;

const NewsSection=({setPage})=>{
  if(!NEWS.length)return null;
  const [featured,...rest]=NEWS;
  const smalls=rest.slice(0,3);
  const handleLink=(target)=>{
    if(!target)return;
    if(/^https?:/.test(target)){window.open(target,"_blank","noopener");return;}
    setPage&&setPage(target);
  };
  return <div style={{marginBottom:36}}>
    <Title sub="Latest Selected Frame updates">News</Title>
    <div style={{marginBottom:smalls.length?16:0}}><FeaturedNewsCard item={featured} onLink={handleLink}/></div>
    {smalls.length>0&&<div style={{display:"grid",gridTemplateColumns:`repeat(${smalls.length},1fr)`,gap:14}}>
      {smalls.map((it,i)=><SmallNewsCard key={i} item={it} onLink={handleLink}/>)}
    </div>}
  </div>;
};

const OverviewPage=({projects,setPage,setDetail})=>{const active=projects.filter(p=>!p.completed);const comp=projects.filter(p=>p.completed);const upcoming=active.filter(p=>p.dueOn&&new Date(p.dueOn)>=new Date()).sort((a,b)=>new Date(a.dueOn)-new Date(b.dueOn));return<div>
  <div style={{background:`linear-gradient(135deg,${C.black},${C.steelD})`,borderRadius:12,padding:"40px 44px",marginBottom:32,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,right:0,width:"50%",height:"100%",backgroundImage:"url(/images/kh_selected_sis_075_web.jpg)",backgroundSize:"cover",backgroundPosition:"center",opacity:.15}}/><div style={{position:"relative",zIndex:1}}><img src={LOGO_WHITE} alt="Selected Frame" style={{height:32,marginBottom:12}}/><div style={{fontSize:11,color:C.steelL,fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",marginTop:8}}>[ Command Space ]</div><p style={{fontSize:14,color:C.steelL,margin:"8px 0 0"}}>A frame for the business we share</p></div></div>
  <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap"}}><KPI label="Active" value={active.length} sub="In progress"/><KPI label="Completed" value={comp.length} sub="Installed"/><KPI label="Total" value={projects.length}/></div>
  <div onClick={()=>setPage("intake")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,background:C.black,borderRadius:10,padding:"20px 26px",marginBottom:32,cursor:"pointer"}}>
    <div><div style={{fontSize:15,fontWeight:600,color:C.white,marginBottom:4}}>Start a New SIS Project</div><div style={{fontSize:12,color:C.steelL}}>Begin the project briefing and intake flow.</div></div>
    <div style={{fontSize:12,fontWeight:600,color:C.oak,letterSpacing:".5px",whiteSpace:"nowrap"}}>Open →</div>
  </div>
  <NewsSection setPage={setPage}/>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:32}}>
    <div><Title sub="Nearest deadlines">Upcoming</Title><div style={{background:C.white,borderRadius:8,border:`1px solid ${C.surfaceD}`}}>{upcoming.slice(0,6).map((p,i)=><div key={p.gid} style={{padding:"14px 20px",borderBottom:i<5?`1px solid ${C.surfaceD}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>{setDetail(p);setPage("projects")}}><div><div style={{fontSize:13,fontWeight:500,color:C.text}}>{p.name}</div><div style={{fontSize:11,color:C.textS,marginTop:2}}>{p.type}</div></div><div style={{fontSize:13,fontWeight:500,color:C.oak}}>{fmtDate(p.dueOn)}</div></div>)}{!upcoming.length&&<div style={{padding:20,fontSize:13,color:C.textS,textAlign:"center"}}>No upcoming deadlines</div>}</div></div>
    <div><Title sub="Selected Frame in action">The Concept</Title><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{IMG.slice(0,4).map((s,i)=><div key={i} style={{borderRadius:8,overflow:"hidden",aspectRatio:"4 / 3"}}><img src={s} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>)}</div></div>
  </div></div>};

// ─── PROJECTS ─────────────────────────────────────────────
// ─── EXTERNAL FOLDER (project-detail integration) ─────────────────────────
// Lazy fetch of the project's external folder so we don't block the detail
// view when the password gate hasn't been unlocked. 401/503 are silent.
const ProjectDetailExternalFolder=({project,setPage,setExternalFolderTarget})=>{
  const [folder,setFolder]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [locked,setLocked]=useState(false);
  const [dbConfigured,setDbConfigured]=useState(true);
  const refresh=useCallback(async()=>{
    if(!project?.gid){setLoaded(true);return;}
    try{
      const r=await fetch(`/api/external-folders/by-project/${project.gid}`);
      if(r.status===401){setLocked(true);setLoaded(true);return;}
      if(r.status===503){setDbConfigured(false);setLoaded(true);return;}
      const d=await r.json();
      if(d.dbConfigured===false)setDbConfigured(false);
      setFolder(d.folder||null);
    }catch(e){}finally{setLoaded(true);}
  },[project?.gid]);
  useEffect(()=>{refresh();},[refresh]);
  if(!loaded)return null;
  if(locked){
    return <div style={{background:C.white,border:`1px solid ${C.surfaceD}`,borderRadius:10,padding:22,marginTop:20}}>
      <div style={{fontSize:9,fontWeight:700,color:C.oak,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>External Project Folder</div>
      <div style={{fontSize:13,color:C.textS,lineHeight:1.6}}>Restricted area. Open External Folders from the sidebar to unlock with the shared password.</div>
      <button onClick={()=>setPage("external-folders")} style={{marginTop:12,padding:"10px 18px",background:C.black,color:C.white,border:"none",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:500}}>Unlock</button>
    </div>;
  }
  return <div style={{marginTop:20}}><ExternalFolderCard folder={folder} dbConfigured={dbConfigured} asanaProjectId={project.gid} projectMeta={{name:project.name,type:project.type,region:project.region,dueOn:project.dueOn,completed:project.completed,completedAt:project.completedAt}} onCreated={(f)=>setFolder(f)} onOpen={(f)=>{setExternalFolderTarget(f.id);setPage("external-folders");}}/></div>;
};

const ProjectsRecentlyOpened=({setPage,setExternalFolderTarget})=>{
  const [folders,setFolders]=useState([]);
  useEffect(()=>{
    fetch("/api/external-folders/recent")
      .then(r=>r.ok?r.json():{folders:[]})
      .then(d=>setFolders(d.folders||[]))
      .catch(()=>setFolders([]));
  },[]);
  if(!folders.length)return null;
  return <RecentlyOpenedFolders folders={folders} onOpen={(f)=>{setExternalFolderTarget(f.id);setPage("external-folders");}}/>;
};

const ProjectsPage=({projects,detail,setDetail,setPage,setExternalFolderTarget})=>{
  const [view,setView]=useState("active"); // "active" | "archived"
  const [filter,setFilter]=useState({region:"all",sex:"all",search:""});

  const active=projects.filter(p=>!p.completed);
  const completed=projects.filter(p=>p.completed);
  const inPipeline=projects.filter(p=>!p.completed&&p.phaseNum===0);
  const missingDue=projects.filter(p=>!p.completed&&!p.dueOn);

  const base=view==="active"?active:completed;
  let filtered=base.filter(p=>{
    if(filter.region!=="all"&&p.region!==filter.region)return false;
    if(filter.sex!=="all"&&p.sex!==filter.sex)return false;
    if(filter.search&&!p.name.toLowerCase().includes(filter.search.toLowerCase()))return false;
    return true;
  }).sort((a,b)=>{
    if(view==="archived"){
      if(!a.completedAt&&!b.completedAt)return 0;
      if(!a.completedAt)return 1;
      if(!b.completedAt)return -1;
      return new Date(b.completedAt)-new Date(a.completedAt);
    }
    if(!a.dueOn&&!b.dueOn)return 0;
    if(!a.dueOn)return 1;
    if(!b.dueOn)return -1;
    return new Date(a.dueOn)-new Date(b.dueOn);
  });

  const REGIONS=["NORTH","DACH","SOUTH","BENELUX & ROW"];
  const SEXES=["MENS","WOMENS"];

  if(detail){const ph=PHASES.find(x=>x.num===detail.phaseNum);return<div><button onClick={()=>setDetail(null)} style={{background:"none",border:"none",color:C.oak,fontSize:13,cursor:"pointer",padding:0,marginBottom:20,fontWeight:500}}>← Back</button><div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:24}}><div><div style={{background:C.white,borderRadius:8,padding:32,border:`1px solid ${C.surfaceD}`,marginBottom:20}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><div><h2 style={{fontSize:26,fontWeight:400,color:C.text,fontFamily:"'Cormorant Garamond',serif",margin:"0 0 6px"}}>{detail.name}</h2><div style={{fontSize:12,color:C.textS}}>{detail.type}</div></div><Badge variant={detail.completed?"success":"phase0"}>{detail.completed?"Completed":"Active"}</Badge></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,fontSize:13}}>{[["Phase",detail.completed?"Completed":`Ph. ${detail.phaseNum} – ${ph?.name||"?"}`],["Type",detail.type],["Sex",detail.sex||"—"],["Region",detail.region||"—"],["Due",fmtDate(detail.dueOn)],["Created",fmtDate(detail.created)]].map(([l,v])=><div key={l}><div style={{color:C.textS,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>{l}</div><div style={{color:C.text,fontWeight:500}}>{v}</div></div>)}</div></div>{!detail.completed&&ph&&<div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}><div style={{fontSize:14,fontWeight:600,marginBottom:16}}>Phase Progression</div><div style={{display:"flex",gap:3}}>{PHASES.map(x=><div key={x.num} style={{flex:1,height:8,borderRadius:4,background:x.num<=detail.phaseNum?x.color:C.surfaceD}}/>)}</div></div>}</div><div>{!detail.completed&&ph&&<div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`,marginBottom:20}}><div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Current Phase</div><div style={{background:ph.color+"18",borderRadius:8,padding:16,borderLeft:`4px solid ${ph.color}`}}><div style={{fontSize:15,fontWeight:600}}>{ph.name}</div><div style={{fontSize:12,color:C.textS,marginTop:6}}>{ph.desc}</div></div></div>}<a href={detail.url} target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",background:C.black,color:C.white,padding:12,borderRadius:8,fontSize:13,fontWeight:500,textDecoration:"none"}}>Open in Asana →</a><ProjectDetailExternalFolder project={detail} setPage={setPage} setExternalFolderTarget={setExternalFolderTarget}/></div></div></div>}

  return<div>
    <Title sub={`${projects.length} projects total`}>Current</Title>

    {/* KPI counters */}
    <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
      <KPI label="Active" value={active.length} sub="In progress" accent={C.oak}/>
      <KPI label="In Pipeline" value={inPipeline.length} sub="Phase 0" accent="#7AB648"/>
      <KPI label="Completed" value={completed.length} sub="Installed" accent={C.success}/>
      <KPI label="Missing Due" value={missingDue.length} sub="No deadline" accent={missingDue.length>0?C.warn:C.steel}/>
    </div>

    {/* View tabs */}
    <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:`1px solid ${C.surfaceD}`}}>
      {[["active",`Active Projects (${active.length})`],["archived",`Completed / Archived (${completed.length})`]].map(([k,l])=>
        <div key={k} onClick={()=>setView(k)} style={{padding:"10px 20px",cursor:"pointer",fontSize:13,fontWeight:view===k?600:400,color:view===k?C.text:C.textS,borderBottom:view===k?`2px solid ${C.oak}`:"2px solid transparent",marginBottom:-1}}>{l}</div>
      )}
    </div>

    {/* Filters */}
    <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap",alignItems:"center"}}>
      <input placeholder="Search…" value={filter.search} onChange={e=>setFilter({...filter,search:e.target.value})} style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,width:220,outline:"none"}}/>
      <select value={filter.region} onChange={e=>setFilter({...filter,region:e.target.value})} style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,background:C.white}}>
        <option value="all">All Regions</option>
        {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
      </select>
      <select value={filter.sex} onChange={e=>setFilter({...filter,sex:e.target.value})} style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,background:C.white}}>
        <option value="all">All Sex</option>
        {SEXES.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      {(filter.region!=="all"||filter.sex!=="all"||filter.search)&&<button onClick={()=>setFilter({region:"all",sex:"all",search:""})} style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:12,background:C.white,cursor:"pointer",color:C.textS}}>Clear filters</button>}
      <div style={{marginLeft:"auto",fontSize:12,color:C.textS}}>Showing {filtered.length} of {base.length}</div>
    </div>

    {/* Table */}
    <div style={{background:C.white,borderRadius:8,border:`1px solid ${C.surfaceD}`,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{background:C.surface}}>{["Project","Type","Region","Sex",view==="active"?"Phase":"Completed","Due","Status"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontWeight:600,fontSize:11,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",borderBottom:`1px solid ${C.surfaceD}`}}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map(p=>
          <tr key={p.gid} style={{cursor:"pointer",borderBottom:`1px solid ${C.surfaceD}`}} onClick={()=>setDetail(p)} onMouseEnter={e=>e.currentTarget.style.background=C.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <td style={{padding:"12px 16px"}}><div style={{fontWeight:500}}>{p.name}</div></td>
            <td style={{padding:"12px 16px",fontSize:12}}>{p.type}</td>
            <td style={{padding:"12px 16px",fontSize:12,color:p.region?C.text:C.textS}}>{p.region||"—"}</td>
            <td style={{padding:"12px 16px",fontSize:12,color:p.sex?C.text:C.textS}}>{p.sex||"—"}</td>
            <td style={{padding:"12px 16px"}}>{view==="active"?<span style={{display:"inline-flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:"50%",background:PHASES[p.phaseNum]?.color||C.steel}}/>Ph. {p.phaseNum}</span>:fmtDate(p.completedAt)}</td>
            <td style={{padding:"12px 16px",color:!p.dueOn?C.warn:C.text}}>{p.dueOn?fmtDate(p.dueOn):view==="active"?"Missing":"—"}</td>
            <td style={{padding:"12px 16px"}}><Badge variant={p.completed?"success":"phase0"}>{p.completed?"Done":"Active"}</Badge></td>
          </tr>
        )}{!filtered.length&&<tr><td colSpan={7} style={{padding:32,textAlign:"center",color:C.textS,fontSize:13}}>No projects match the current filters</td></tr>}</tbody>
      </table>
    </div>
  </div>
};

// ─── QUOTATION ────────────────────────────────────────────
const ADD_ONS=[{id:"screen55",name:'55" Screen (wall mounted)',price:1370,cat:"AV & HiFi"},{id:"screen75",name:'75" Screen (wall module)',price:1351,cat:"AV & HiFi"},{id:"carpet",name:"Carpet",price:469,cat:"Floor"},{id:"leather_tray",name:"Leather Tray",price:282,cat:"Accessories"},{id:"shirt50",name:"Shirt Hangers (50 pcs)",price:69,cat:"Selected Deliveries"},{id:"clip50",name:"Clip Hangers (50 pcs)",price:83,cat:"Selected Deliveries"},{id:"coat25",name:"Coat Hangers (25 pcs)",price:89,cat:"Selected Deliveries"}];

// Hanger Calculator: matching rules ordered by specificity (first match wins)
// Each rule: test function on lowercased item name -> hangers per unit
// Note: "1400" can appear before OR after "sidehang" depending on supplier format
const HANGER_RULES=[
  // Specific subtype FIRST: sidehang+mirror has special hanger count
  {label:"Wall unit Sidehang 1400 + mirror",hangers:30,test:n=>n.includes("sidehang")&&n.includes("1400")&&n.includes("mirror")},
  {label:"Wall unit Sidehang 1400",hangers:50,test:n=>n.includes("sidehang")&&n.includes("1400")},
  {label:"Wall unit Sidehang 700",hangers:25,test:n=>n.includes("sidehang")&&n.includes("700")},
  {label:"Wall unit Jeans unit",hangers:10,test:n=>n.includes("wall unit")&&n.includes("jeans")},
  {label:"Wall unit Front hang",hangers:12,test:n=>n.includes("front hang")},
  {label:"Floor rack 1400",hangers:50,test:n=>n.includes("floor rack 1400")},
  {label:"Floor rack 700",hangers:25,test:n=>n.includes("floor rack 700")},
  {label:"Jeans rack double",hangers:10,test:n=>n.includes("jeans")&&n.includes("double")},
  {label:"Jeans rack single",hangers:30,test:n=>n.includes("jeans")&&n.includes("single")},
  // Generic Wall unit 1400 / 700 - LAST so specific rules above win first
  // Wall rack column = base structural element, NO hangers (excluded by !wall rack)
  {label:"Wall unit 1400",hangers:50,test:n=>n.includes("wall unit")&&n.includes("1400")&&!n.includes("bracket")&&!n.includes("mirror")&&!n.includes("screen")&&!n.includes("connector")&&!n.includes("wall rack")},
  {label:"Wall unit 700",hangers:25,test:n=>n.includes("wall unit")&&n.includes("700")&&!n.includes("bracket")&&!n.includes("connector")&&!n.includes("wall rack")},
];

const matchHangerRule=(itemName)=>{
  if(!itemName)return null;
  const n=itemName.toLowerCase();
  return HANGER_RULES.find(r=>r.test(n))||null;
};

// Custom rounding: shirt/clips to nearest 50 (rest>15 up, rest<=15 down)
//                  coat to nearest 25 (rest>5 up, rest<=5 down)
const roundShirtClips=(n)=>{const rest=n%50;return rest>15?n+(50-rest):n-rest};
const roundCoat=(n)=>{const rest=n%25;return rest>5?n+(25-rest):n-rest};

// Cost split between HQ / Market / optional third party. Distributes the
// grand total by percentage. Lives in the right column of the Quotation Builder.
const CostSplitCard=({grand,split,setSplit,splitOn,setSplitOn,amounts,sum,valid,money})=>{
  const setAt=(i,patch)=>setSplit(p=>p.map((x,j)=>j===i?{...x,...patch}:x));
  const removeAt=(i)=>setSplit(p=>p.length<=2?p:p.filter((_,j)=>j!==i));
  const addParty=()=>setSplit(p=>p.length>=3?p:[...p,{label:p.length===2?"Third party":`Party ${p.length+1}`,pct:"0"}]);
  const setPcts=(arr)=>setSplit(p=>p.map((x,i)=>({...x,pct:String(arr[i]??x.pct)})));
  const evenSplit=()=>setSplit(p=>{const n=p.length;const base=Math.floor(100/n);const rem=100-base*n;return p.map((x,i)=>({...x,pct:String(base+(i<rem?1:0))}));});
  return (
    <div style={{background:C.white,border:`1px solid ${C.surfaceD}`,borderRadius:8,padding:20,marginTop:16}}>
      <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:splitOn?14:0}}>
        <input type="checkbox" checked={splitOn} onChange={e=>setSplitOn(e.target.checked)} style={{width:16,height:16,accentColor:C.oak}}/>
        <span style={{fontSize:13,fontWeight:600,color:C.text}}>Cost split</span>
        <span style={{fontSize:11,color:C.textS}}>HQ / Market{split.length>2?" / third party":""} — included in PDF when on</span>
      </label>
      {splitOn&&<div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {split.length===2&&[["50 / 50",[50,50]],["60 / 40",[60,40]],["70 / 30",[70,30]]].map(([l,arr])=>
            <button key={l} onClick={()=>setPcts(arr)} style={{fontSize:11,fontWeight:500,padding:"5px 10px",borderRadius:14,border:`1px solid ${C.surfaceD}`,background:C.white,color:C.text,cursor:"pointer"}}>{l}</button>)}
          <button onClick={evenSplit} style={{fontSize:11,fontWeight:500,padding:"5px 10px",borderRadius:14,border:`1px solid ${C.surfaceD}`,background:C.white,color:C.text,cursor:"pointer"}}>Even</button>
        </div>
        {split.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <input value={p.label} onChange={e=>setAt(i,{label:e.target.value})} placeholder="Party" style={{flex:1,minWidth:0,padding:"7px 10px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:2}}>
            <input value={p.pct} onChange={e=>setAt(i,{pct:e.target.value})} type="text" inputMode="decimal" style={{width:48,padding:"7px 6px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,textAlign:"right",outline:"none"}}/>
            <span style={{fontSize:13,color:C.textS}}>%</span>
          </div>
          <div style={{minWidth:78,textAlign:"right",fontSize:13,fontWeight:600,color:C.text}}>{money(amounts[i])}</div>
          {split.length>2&&<button onClick={()=>removeAt(i)} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>}
        </div>)}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,paddingTop:10,borderTop:`1px solid ${C.surfaceD}`}}>
          {split.length<3
            ? <button onClick={addParty} style={{fontSize:12,fontWeight:500,color:C.oak,background:"none",border:"none",cursor:"pointer",padding:0}}>+ Add third party</button>
            : <span/>}
          <span style={{fontSize:12,fontWeight:600,color:valid?C.go:C.warn}}>Σ {sum.toLocaleString("en-US",{maximumFractionDigits:1})}%{valid?"":" — must total 100%"}</span>
        </div>
      </div>}
    </div>
  );
};

const QuotationPage=()=>{
  const [parsed,setParsed]=useState(null);
  const [parsing,setParsing]=useState(false);
  const [err,setErr]=useState(null);
  const [addOns,setAddOns]=useState({});
  const [customs,setCustoms]=useState([]);
  const [hdr,setHdr]=useState({project:"",salesArea:"",gender:"",quotationDate:todayISO()});
  const [cats,setCats]=useState({inventory:"",selectedDeliveries:"",specificProjectCost:""});
  const [warnings,setWarnings]=useState([]);
  const [warningsCollapsed,setWarningsCollapsed]=useState(false);
  const [emailOpen,setEmailOpen]=useState(false);
  const [emailTo,setEmailTo]=useState("");
  const [sendResult,setSendResult]=useState(null); // {ok, message}
  const [currency,setCurrency]=useState("EUR");
  const [fxRate,setFxRate]=useState(String(CURRENCIES.EUR.eurRate));
  const [splitOn,setSplitOn]=useState(false);
  const [split,setSplit]=useState([{label:"HQ",pct:"50"},{label:"Market",pct:"50"}]);
  const fileRef=useRef(null);

  // Switching currency resets the rate to that currency's default (editable).
  const changeCurrency=(code)=>{setCurrency(code);setFxRate(String(CURRENCIES[code].eurRate));};

  const loadPdfJs=useCallback(()=>new Promise((res,rej)=>{if(window.pdfjsLib)return res(window.pdfjsLib);const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';res(window.pdfjsLib)};s.onerror=rej;document.head.appendChild(s)}),[]);

  const processPDF=async(file)=>{
    if(!file||!file.name.endsWith('.pdf'))return;
    setParsing(true);setErr(null);setWarnings([]);
    try{
      const pdfjsLib=await loadPdfJs();
      const buf=await file.arrayBuffer();
      const pdf=await pdfjsLib.getDocument({data:buf}).promise;
      const lines=[];
      for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const c=await pg.getTextContent();let lastY=null,line='';for(const it of c.items){if(lastY!==null&&Math.abs(it.transform[5]-lastY)>2){lines.push(line);line=''}line+=(line?' ':'')+it.str;lastY=it.transform[5]}if(line)lines.push(line)}
      const r=await fetch("/api/parse-quotation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lines})});
      if(!r.ok){const e=await r.json();throw new Error(e.error||"Parse failed")}
      const data=await r.json();
      setParsed(data);
      setHdr(h=>({...h,project:data.project||"",salesArea:String(data.salesArea||""),gender:data.gender||""}));
      setCats({inventory:String(data.summary?.inventory||""),selectedDeliveries:String(data.summary?.selectedDeliveries||""),specificProjectCost:String(data.summary?.specificProjectCost||"")});
      setWarnings(data.parseWarnings||[]);
      setWarningsCollapsed(false);
    }catch(e){setErr(e.message)}finally{setParsing(false)}
  };

  const handleFileInput=(e)=>{const f=e.target.files?.[0];if(f)processPDF(f)};
  const handleDrop=(e)=>{e.preventDefault();e.stopPropagation();const f=e.dataTransfer?.files?.[0];if(f)processPDF(f)};
  const handleDragOver=(e)=>{e.preventDefault();e.stopPropagation()};

  const toggleAO=(id)=>setAddOns(p=>{const n={...p};if(n[id])delete n[id];else n[id]={qty:1};return n});
  const setAOQty=(id,q)=>setAddOns(p=>({...p,[id]:{qty:Math.max(1,parseInt(q)||1)}}));

  // Currency-aware formatting: shadow the EUR helpers locally so every call
  // site inside this component (display, PDF, email) follows the chosen
  // currency without touching the global EUR formatters used elsewhere.
  const curBase=CURRENCIES[currency]||CURRENCIES.EUR;
  const rate=parseFloat(String(fxRate).replace(",","."))||curBase.eurRate;
  const cur={...curBase,eurRate:rate};
  const fmtEur=(n)=>fmtMoney(n,cur);
  const fmtEurSigned=(n)=>fmtMoneySigned(n,cur);

  const inv=parseFloat(cats.inventory)||0;const del=parseFloat(cats.selectedDeliveries)||0;const proj=parseFloat(cats.specificProjectCost)||0;
  const supTotal=inv+del+proj;
  // Add-on list prices are defined in EUR → convert to the chosen currency.
  const aoTotal=Object.entries(addOns).reduce((s,[id,{qty}])=>{const a=ADD_ONS.find(x=>x.id===id);return s+(a?a.price*qty*cur.eurRate:0)},0);
  const parseLooseEur=(s)=>{if(!s)return 0;const v=String(s).replace(/\s+/g,"").replace(",",".");return parseFloat(v)||0};
  const custTotal=customs.reduce((s,i)=>s+parseLooseEur(i.price)*(parseInt(i.qty)||1),0);
  const grand=supTotal+aoTotal+custTotal;
  // Cost split: distribute the grand total across parties by percentage.
  const splitPct=(p)=>parseFloat(String(p.pct).replace(",","."))||0;
  const splitSum=split.reduce((s,p)=>s+splitPct(p),0);
  const splitValid=Math.abs(splitSum-100)<0.5;
  const splitAmounts=(()=>{const a=split.map(p=>Math.round(grand*splitPct(p)/100));if(splitValid&&a.length){a[a.length-1]+=Math.round(grand)-a.reduce((x,y)=>x+y,0);}return a;})();
  const sqm=parseFloat(hdr.salesArea)||0;
  const validUntil=hdr.quotationDate?addDaysISO(hdr.quotationDate,14):"";

  const errors=warnings.filter(w=>w.severity==="error");
  const warns=warnings.filter(w=>w.severity==="warn");
  const infos=warnings.filter(w=>w.severity==="info");

  const exportPDF=()=>{
    const aoItems=Object.entries(addOns).map(([id,{qty}])=>{const a=ADD_ONS.find(x=>x.id===id);return a?{name:a.name,qty,total:a.price*qty*cur.eurRate}:null}).filter(Boolean);
    const custItems=customs.filter(i=>i.name&&parseLooseEur(i.price)!==0).map(i=>({name:i.name,qty:parseInt(i.qty)||1,total:parseLooseEur(i.price)*(parseInt(i.qty)||1)}));
    const qDate=hdr.quotationDate?fmtDate(hdr.quotationDate):fmtDate(todayISO());
    const vDate=fmtDate(validUntil);
    const w=window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Quotation – ${hdr.project||'Selected Frame'}</title><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;color:#2C2C2C;padding:40px 60px;max-width:900px;margin:0 auto;-webkit-print-color-adjust:exact;print-color-adjust:exact}.hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:2px solid #1A1A1A}.logo-wrap{display:flex;flex-direction:column;align-items:flex-start}.logo-img{height:36px;width:auto;max-width:240px;object-fit:contain;margin-bottom:8px;display:block}.logo-tag{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8A8D8F}.meta{text-align:right;font-size:12px;color:#6B6B6B}.meta strong{color:#2C2C2C;display:block;font-size:14px;margin-bottom:4px}.meta .row{margin-top:6px}.meta .lbl{display:inline-block;min-width:80px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#8A8D8F}h2{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:400;margin:32px 0 16px;padding-bottom:8px;border-bottom:1px solid #ECEAE5}table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px}th{text-align:left;padding:8px 12px;background:#F5F4F1;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6B6B6B;border-bottom:1px solid #ECEAE5;-webkit-print-color-adjust:exact;print-color-adjust:exact}td{padding:6px 12px;border-bottom:1px solid #F5F4F1}.r{text-align:right}.tot{background:#1A1A1A!important;color:#fff!important;padding:24px 28px;border-radius:8px;margin-top:32px;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.tot .l{font-size:14px;color:#B8BBBE!important}.tot .a{font-size:28px;font-family:'Cormorant Garamond',serif;font-weight:300;color:#fff!important}.sq{font-size:11px;color:#8A8D8F;text-align:right;margin-top:6px}.csplit{margin-top:18px;page-break-inside:avoid}.csplit .h{font-family:'Cormorant Garamond',serif;font-size:14px;font-weight:400;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #ECEAE5}.csplit table{font-size:10px;margin-bottom:0}.csplit th{padding:3px 8px}.csplit td{padding:2px 8px}.csplit .note{font-size:9px;color:#C75B4A;margin-top:4px}.validity{margin-top:20px;padding:14px 18px;background:#F5F4F1;border-radius:6px;border-left:3px solid #C4944A;font-size:12px;color:#2C2C2C;-webkit-print-color-adjust:exact;print-color-adjust:exact}.validity strong{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6B6B6B;margin-bottom:4px}.ft{margin-top:48px;padding-top:20px;border-top:1px solid #ECEAE5;font-size:10px;color:#8A8D8F;display:flex;justify-content:space-between}@media print{body{padding:20px 40px}button{display:none!important}.tot{background:#1A1A1A!important;color:#fff!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}</style></head><body>
<div class="hd">
  <div class="logo-wrap"><img src="${LOGO_BLACK}" alt="Selected Frame" class="logo-img"/><span class="logo-tag">[ A frame for the business we share ]</span></div>
  <div class="meta">
    <strong>Quotation</strong>
    ${hdr.project||''}
    <div class="row"><span class="lbl">Date</span> ${qDate}</div>
    <div class="row"><span class="lbl">Valid until</span> ${vDate}</div>
    ${hdr.salesArea?`<div class="row"><span class="lbl">Sales area</span> ${hdr.salesArea} m²</div>`:''}
    ${hdr.gender?`<div class="row"><span class="lbl">Gender</span> ${hdr.gender}</div>`:''}
    <div class="row"><span class="lbl">Currency</span> ${currency}</div>
  </div>
</div>
<button onclick="window.print()" style="background:#1A1A1A;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-size:13px;cursor:pointer;margin-bottom:24px">Print / Save as PDF</button>
<h2>Project Cost incl. construction, shopfitting and logistics</h2>
<table><thead><tr><th>Category</th><th class="r">Amount</th></tr></thead><tbody>
<tr><td>Inventory</td><td class="r">${fmtEur(inv)}</td></tr>
<tr><td>Selected Deliveries</td><td class="r">${fmtEur(del)}</td></tr>
<tr><td>Specific Project Cost</td><td class="r">${fmtEur(proj)}</td></tr>
<tr style="font-weight:600;border-top:2px solid #ECEAE5"><td>Total</td><td class="r">${fmtEur(supTotal)}</td></tr>
</tbody></table>
${aoItems.length?`<h2>Add-ons</h2><table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Total</th></tr></thead><tbody>${aoItems.map(a=>`<tr><td>${a.name}</td><td class="r">${a.qty}</td><td class="r">${fmtEur(a.total)}</td></tr>`).join('')}<tr style="font-weight:600;border-top:2px solid #ECEAE5"><td colspan="2">Add-ons Total</td><td class="r">${fmtEur(aoTotal)}</td></tr></tbody></table>${currency!=='EUR'?`<div style="font-size:10px;color:#8A8D8F;margin-top:-12px">Add-on prices converted from EUR at 1 EUR = ${rate} ${currency}.</div>`:''}`:''}
${custItems.length?`<h2>Additional Items</h2><table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Total</th></tr></thead><tbody>${custItems.map(a=>`<tr><td>${a.name}</td><td class="r">${a.qty}</td><td class="r">${fmtEurSigned(a.total)}</td></tr>`).join('')}<tr style="font-weight:600;border-top:2px solid #ECEAE5"><td colspan="2">Total</td><td class="r">${fmtEurSigned(custTotal)}</td></tr></tbody></table>`:''}
<div class="tot"><div class="l">Total excl. VAT</div><div class="a">${fmtEur(grand)}</div></div>
${sqm>0?`<div class="sq">${fmtEur(Math.round(grand/sqm))} / m²</div>`:''}
${splitOn?`<div class="csplit"><div class="h">Cost Split</div><table><thead><tr><th>Party</th><th class="r">Share</th><th class="r">Amount</th></tr></thead><tbody>${split.map((p,i)=>`<tr><td>${p.label||`Party ${i+1}`}</td><td class="r">${splitPct(p).toLocaleString("en-US",{maximumFractionDigits:1})}%</td><td class="r">${fmtEur(splitAmounts[i])}</td></tr>`).join('')}<tr style="font-weight:600;border-top:2px solid #ECEAE5"><td>Total</td><td class="r">${splitSum.toLocaleString("en-US",{maximumFractionDigits:1})}%</td><td class="r">${fmtEur(grand)}</td></tr></tbody></table>${splitValid?'':`<div class="note">Note: shares total ${splitSum}%, not 100%.</div>`}</div>`:''}
<div class="validity"><strong>Validity</strong>This quotation is valid until ${vDate} (14 days from quotation date).</div>
<div class="ft"><span>Selected Frame · Brand Spaces</span><span>Confidential</span></div>
</body></html>`);w.document.close()};

  const sendEmail=()=>{
    if(!emailTo||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo)){
      setSendResult({ok:false,message:"Please enter a valid email address"});
      return;
    }
    const sqmPriceStr=sqm>0?` (${fmtEur(Math.round(grand/sqm))} / sqm)`:"";
    const subject=`Selected Frame Quotation – ${hdr.project||"Project"}`;
    const body=`Dear partner,

Please find attached the Selected Frame quotation for ${hdr.project||"your project"}.

PROJECT
${hdr.project||"—"}
${hdr.salesArea?`Sales area: ${hdr.salesArea} sqm`:""}
${hdr.gender?`Gender: ${hdr.gender}`:""}

QUOTATION
Date: ${fmtDate(hdr.quotationDate)}
Valid until: ${fmtDate(validUntil)} (14 days from quotation date)

INVESTMENT
Total excl. VAT: ${fmtEur(grand)}${sqmPriceStr}${splitOn?`

COST SPLIT
${split.map((p,i)=>`${p.label||`Party ${i+1}`}: ${splitPct(p).toLocaleString("en-US",{maximumFractionDigits:1})}% — ${fmtEur(splitAmounts[i])}`).join("\n")}`:""}

The full breakdown is in the attached PDF.

Best regards,
Selected Frame · Brand Spaces
Bestseller A/S`;
    window.location.href=`mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSendResult({ok:true,message:`Mail-app åbnet. Husk at vedhæfte den eksporterede PDF før du sender.`});
    setTimeout(()=>{setSendResult(null)},5000);
  };

  return<div><Title sub="Upload a supplier quotation PDF to generate a branded project quotation">Quotation Builder</Title>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:32}}>
      <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>
        <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:16}}>1. Upload Supplier Quotation</div>
        <div onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragOver} onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${parsing?C.oak:C.surfaceD}`,borderRadius:8,padding:32,textAlign:"center",cursor:"pointer",background:parsing?C.oak+"06":"transparent",transition:"border-color .2s"}}>
          <input ref={fileRef} type="file" accept=".pdf" style={{display:"none"}} onChange={handleFileInput}/>
          {parsing?<div><div style={{fontSize:24,marginBottom:8}}>⏳</div><div style={{fontSize:13,color:C.oak,fontWeight:500}}>Parsing PDF…</div></div>:parsed?<div><div style={{fontSize:24,marginBottom:8}}>✅</div><div style={{fontSize:13,color:C.success,fontWeight:500}}>{parsed.project}</div><div style={{fontSize:11,color:C.textS,marginTop:4}}>Click or drag to replace</div></div>:<div><div style={{fontSize:24,marginBottom:8}}>📄</div><div style={{fontSize:13,color:C.textS}}>Drop PDF here or click to upload</div></div>}
        </div>
        {err&&<div style={{marginTop:12,padding:"10px 14px",background:"#FDEAE6",borderRadius:6,fontSize:12,color:C.danger}}>{err}</div>}
      </div>
      <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>
        <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:16}}>Project Details</div>
        <div style={{marginBottom:12}}><label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Project Name</label><input value={hdr.project} onChange={e=>setHdr(h=>({...h,project:e.target.value}))} style={{width:"100%",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/></div>
        <div style={{marginBottom:12}}><label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Sales Area (m²)</label><input value={hdr.salesArea} onChange={e=>setHdr(h=>({...h,salesArea:e.target.value}))} style={{width:"100%",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/></div>
        <div style={{marginBottom:12}}><label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Gender</label><select value={hdr.gender} onChange={e=>setHdr(h=>({...h,gender:e.target.value}))} style={{width:"100%",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,background:C.white}}><option value="">Choose Gender</option><option>Unisex</option><option>Womens</option><option>Mens</option></select></div>
        <div style={{display:"grid",gridTemplateColumns:currency==="EUR"?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>
          <div><label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Currency</label><select value={currency} onChange={e=>changeCurrency(e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,background:C.white}}>{Object.keys(CURRENCIES).map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          {currency!=="EUR"&&<div><label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>1 EUR = {currency}</label><input type="text" inputMode="decimal" value={fxRate} onChange={e=>setFxRate(e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/></div>}
        </div>
        {currency!=="EUR"&&<div style={{fontSize:11,color:C.textS,marginBottom:12,lineHeight:1.5}}>Amounts you enter/parse are treated as {currency}. The fixed add-on list (priced in EUR) is converted at this rate.</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Quotation Date</label><input type="date" value={hdr.quotationDate} onChange={e=>setHdr(h=>({...h,quotationDate:e.target.value}))} style={{width:"100%",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/></div>
          <div><label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>Valid Until</label><input type="text" readOnly value={fmtDate(validUntil)} style={{width:"100%",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none",background:C.surface,color:C.textS}}/></div>
        </div>
      </div>
    </div>

    {/* Parse warnings */}
    {warnings.length>0&&<div style={{marginBottom:24}}>
      <div onClick={()=>setWarningsCollapsed(c=>!c)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:errors.length>0?"#FDEAE6":warns.length>0?"#FDF3E0":"#F0F4FA",borderRadius:8,border:`1px solid ${errors.length>0?C.danger:warns.length>0?C.warn:"#B8C5D9"}`,cursor:"pointer"}}>
        <div style={{fontSize:18}}>{errors.length>0?"⚠️":warns.length>0?"⚡":"ℹ️"}</div>
        <div style={{flex:1,fontSize:13,fontWeight:500}}>
          {errors.length>0&&<span>{errors.length} error{errors.length>1?"s":""} </span>}
          {warns.length>0&&<span>{warns.length} warning{warns.length>1?"s":""} </span>}
          {infos.length>0&&<span>{infos.length} note{infos.length>1?"s":""}</span>}
          <span style={{color:C.textS,fontWeight:400}}> · Review before exporting</span>
        </div>
        <div style={{fontSize:11,color:C.textS}}>{warningsCollapsed?"▸ Show":"▾ Hide"}</div>
      </div>
      {!warningsCollapsed&&<div style={{background:C.white,borderRadius:8,marginTop:8,border:`1px solid ${C.surfaceD}`,maxHeight:240,overflow:"auto"}}>
        {warnings.map((w,i)=><div key={i} style={{padding:"10px 16px",borderBottom:i<warnings.length-1?`1px solid ${C.surfaceD}`:"none",fontSize:12,display:"flex",gap:10,alignItems:"flex-start"}}>
          <Badge variant={w.severity==="error"?"danger":w.severity==="warn"?"warn":"default"}>{w.severity}</Badge>
          <div style={{flex:1}}><div>{w.message}</div>{w.context?.line&&<div style={{fontSize:11,color:C.textS,marginTop:2,fontFamily:"'DM Mono',monospace"}}>{w.context.line}</div>}</div>
        </div>)}
      </div>}
    </div>}

    {parsed&&<div style={{marginBottom:32}}><Title sub="From supplier quotation – click amounts to edit">Cost Breakdown</Title><div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:8}}><ET label="Inventory" field="inventory" cats={cats} setCats={setCats} symbol={cur.symbol}/><ET label="Selected Deliveries" field="selectedDeliveries" cats={cats} setCats={setCats} symbol={cur.symbol}/><ET label="Specific Project Cost" field="specificProjectCost" cats={cats} setCats={setCats} symbol={cur.symbol}/></div>
      {(parsed.summary?.inventoryBreakdown?.length>1||parsed.summary?.projectCostBreakdown?.length>1)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16,fontSize:10,color:C.textS,lineHeight:1.4}}>
        <div>{parsed.summary?.inventoryBreakdown?.length>1?<>Includes: {parsed.summary.inventoryBreakdown.map(x=>`${x.name.toLowerCase()} (${fmtEur(x.value)})`).join(", ")}</>:<>&nbsp;</>}</div>
        <div>&nbsp;</div>
        <div>{parsed.summary?.projectCostBreakdown?.length>1?<>Includes: {parsed.summary.projectCostBreakdown.map(x=>`${x.name.toLowerCase()} (${fmtEur(x.value)})`).join(", ")}</>:<>&nbsp;</>}</div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}><div style={{padding:"10px 14px",background:C.black,borderRadius:6,color:C.white}}><div style={{fontSize:11,fontWeight:600,color:C.steelL,textTransform:"uppercase",letterSpacing:".5px"}}>Total</div><div style={{fontSize:20,fontWeight:300,fontFamily:"'Cormorant Garamond',serif"}}>{fmtEur(supTotal)}</div></div>{sqm>0&&<div style={{padding:"10px 14px",background:C.surface,borderRadius:6}}><div style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase"}}>SQM Price</div><div style={{fontSize:20,fontWeight:300,fontFamily:"'Cormorant Garamond',serif"}}>{fmtEur(Math.round(supTotal/sqm))} / m²</div></div>}</div>
      {parsed.categories?.map(cat=><details key={cat.name} style={{marginBottom:8}}><summary style={{cursor:"pointer",fontSize:13,fontWeight:600,padding:"8px 0",borderBottom:`1px solid ${C.surfaceD}`}}>{cat.name} — {fmtEur(cat.total)} ({cat.items?.length||0} items)</summary><div style={{padding:"8px 0"}}>{cat.items?.map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0",color:C.textS}}><span>{it.qty>0?`${it.qty}× `:""}{it.name}</span><span style={{fontWeight:500,color:C.text}}>{fmtEur(it.totalPrice)}</span></div>)}</div></details>)}
    </div></div>}
    {(()=>{
      // ── Hanger Calculator ─────────────────────────────────────────
      // Auto-derived from parsed Inventory items. Hidden when nothing matches.
      if(!parsed)return null;
      const inv=parsed.categories?.find(c=>c.name==="INVENTORY");
      if(!inv?.items?.length)return null;
      const matched=inv.items.map(it=>{const r=matchHangerRule(it.name);return r?{...it,rule:r,subtotal:(it.qty||0)*r.hangers}:null}).filter(Boolean);
      if(!matched.length)return null;
      const rawTotal=matched.reduce((s,m)=>s+m.subtotal,0);
      const shirtRaw=Math.round(rawTotal*0.60);
      const clipsRaw=Math.round(rawTotal*0.25);
      const coatRaw=Math.round(rawTotal*0.15);
      const shirt=Math.max(0,roundShirtClips(shirtRaw));
      const clips=Math.max(0,roundShirtClips(clipsRaw));
      const coat=Math.max(0,roundCoat(coatRaw));
      const addToQuote=()=>{
        setAddOns(p=>{
          const next={...p};
          if(shirt>0)next.shirt50={qty:shirt/50};
          if(clips>0)next.clip50={qty:clips/50};
          if(coat>0)next.coat25={qty:coat/25};
          return next;
        });
      };
      // Detect if hangers are already added matching these exact qtys (so CTA can show "Updated")
      const alreadyMatching=
        (shirt===0||addOns.shirt50?.qty===shirt/50)&&
        (clips===0||addOns.clip50?.qty===clips/50)&&
        (coat===0||addOns.coat25?.qty===coat/25)&&
        (shirt>0||clips>0||coat>0)&&
        (addOns.shirt50||addOns.clip50||addOns.coat25);
      return <div style={{marginBottom:32}}>
        <Title sub="Auto-calculated from parsed fixtures – click Add to Quote to populate add-ons">Hanger Calculator</Title>
        <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>Matched fixtures</div>
            <div style={{maxHeight:200,overflow:"auto",marginBottom:12}}>{matched.map((m,i)=>
              <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:i<matched.length-1?`1px solid ${C.surfaceD}`:"none"}}>
                <span style={{color:C.text}}>{m.qty}× {m.rule.label}</span>
                <span style={{color:C.textS,fontFamily:"'DM Mono',monospace"}}>{m.qty} × {m.rule.hangers} = {m.subtotal}</span>
              </div>
            )}</div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:C.surface,borderRadius:6}}>
              <span style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase"}}>Raw total</span>
              <span style={{fontSize:18,fontWeight:300,fontFamily:"'Cormorant Garamond',serif"}}>{rawTotal} hangers</span>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>Type split (60/25/15)</div>
            {[
              {label:"Shirt",pct:60,raw:shirtRaw,rounded:shirt,pack:50,price:69,id:"shirt50"},
              {label:"Clips",pct:25,raw:clipsRaw,rounded:clips,pack:50,price:83,id:"clip50"},
              {label:"Coat",pct:15,raw:coatRaw,rounded:coat,pack:25,price:89,id:"coat25"},
            ].map(s=><div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"8px 0",borderBottom:`1px solid ${C.surfaceD}`}}>
              <div>
                <span style={{fontSize:13,fontWeight:600,color:C.text}}>{s.label}</span>
                <span style={{fontSize:11,color:C.textS,marginLeft:8}}>({s.pct}% · {s.raw} → {s.rounded})</span>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{s.rounded} pcs</div>
                <div style={{fontSize:10,color:C.textS}}>{s.rounded>0?`${s.rounded/s.pack}× ${s.pack}-pack · ${fmtEur((s.rounded/s.pack)*s.price*cur.eurRate)}`:"—"}</div>
              </div>
            </div>)}
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:C.black,borderRadius:6,color:C.white,marginTop:12}}>
              <span style={{fontSize:11,fontWeight:600,color:C.steelL,textTransform:"uppercase"}}>Hanger cost</span>
              <span style={{fontSize:18,fontWeight:300,fontFamily:"'Cormorant Garamond',serif"}}>{fmtEur(((shirt/50)*69+(clips/50)*83+(coat/25)*89)*cur.eurRate)}</span>
            </div>
            <button onClick={addToQuote} disabled={rawTotal===0} style={{width:"100%",marginTop:12,padding:"12px",borderRadius:8,border:"none",background:rawTotal===0?C.steelL:(alreadyMatching?C.success:C.oak),color:C.white,fontSize:13,fontWeight:600,cursor:rawTotal===0?"not-allowed":"pointer"}}>{alreadyMatching?"✓ Added to Quote":"Add to Quote →"}</button>
          </div>
        </div>
      </div>;
    })()}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:32}}>
      <div><Title sub="Select optional elements">2. Add-ons</Title><div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>{ADD_ONS.map(a=>{const sel=addOns[a.id];return<div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.surfaceD}`}}><input type="checkbox" checked={!!sel} onChange={()=>toggleAO(a.id)} style={{width:16,height:16,accentColor:C.oak}}/><div style={{flex:1}}><div style={{fontSize:13}}>{a.name}</div><div style={{fontSize:11,color:C.textS}}>{a.cat} · {fmtEur(a.price*cur.eurRate)} / pc</div></div>{sel&&<PM value={sel.qty} onChange={v=>setAOQty(a.id,v)}/>}{sel&&<div style={{fontSize:13,fontWeight:600,minWidth:60,textAlign:"right"}}>{fmtEur(a.price*sel.qty*cur.eurRate)}</div>}</div>})}</div></div>
      <div><Title sub="Additional costs">3. Custom Items</Title><div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>{customs.map((it,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><input placeholder="Description" value={it.name} onChange={e=>setCustoms(p=>p.map((x,j)=>j===i?{...x,name:e.target.value}:x))} style={{flex:2,padding:"8px 10px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/><input placeholder={cur.symbol.trim()} type="text" inputMode="decimal" value={it.price} onChange={e=>setCustoms(p=>p.map((x,j)=>j===i?{...x,price:e.target.value}:x))} style={{width:80,padding:"8px 10px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/><input placeholder="Qty" type="text" inputMode="numeric" value={it.qty} onChange={e=>setCustoms(p=>p.map((x,j)=>j===i?{...x,qty:e.target.value}:x))} style={{width:48,padding:"8px 10px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,textAlign:"center",outline:"none"}}/><div style={{minWidth:60,textAlign:"right",fontSize:12,fontWeight:600,color:parseLooseEur(it.price)!==0?(parseLooseEur(it.price)<0?C.danger:C.text):C.textS}}>{fmtEurSigned(parseLooseEur(it.price)*(parseInt(it.qty)||1))}</div><button onClick={()=>setCustoms(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16}}>×</button></div>)}<button onClick={()=>setCustoms(p=>[...p,{name:"",price:"",qty:"1"}])} style={{width:"100%",padding:"10px",borderRadius:6,border:`1px dashed ${C.surfaceD}`,background:"transparent",cursor:"pointer",fontSize:13,color:C.textS}}>+ Add custom item</button>{custTotal!==0&&<div style={{display:"flex",justifyContent:"space-between",padding:"12px 4px 0",marginTop:12,borderTop:`1px solid ${C.surfaceD}`,fontSize:12}}><span style={{color:C.textS}}>Custom Items subtotal</span><span style={{fontWeight:600,color:custTotal<0?C.danger:C.text}}>{fmtEurSigned(custTotal)}</span></div>}</div>
        <div style={{background:C.black,borderRadius:8,padding:24,marginTop:20,color:C.white}}>
          <div style={{fontSize:11,color:C.steelL,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",marginBottom:12}}>Quotation Summary</div>
          {supTotal>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}><span style={{color:C.steelL}}>Project Cost</span><span>{fmtEur(supTotal)}</span></div>}
          {aoTotal>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}><span style={{color:C.steelL}}>Add-ons</span><span>{fmtEur(aoTotal)}</span></div>}
          {custTotal!==0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}><span style={{color:C.steelL}}>Custom</span><span>{fmtEurSigned(custTotal)}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:20,paddingTop:12,fontFamily:"'Cormorant Garamond',serif"}}><span>Total excl. VAT</span><span>{fmtEur(grand)}</span></div>
          {sqm>0&&<div style={{fontSize:12,color:C.steelL,marginTop:4,textAlign:"right"}}>{fmtEur(Math.round(grand/sqm))} / m²</div>}
          {grand>0&&hdr.quotationDate&&<div style={{fontSize:11,color:C.steelL,marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.1)"}}>Valid until {fmtDate(validUntil)}</div>}
        </div>
        {grand>0&&<CostSplitCard grand={grand} split={split} setSplit={setSplit} splitOn={splitOn} setSplitOn={setSplitOn} amounts={splitAmounts} sum={splitSum} valid={splitValid} money={fmtEur}/>}
        {grand>0&&<div style={{display:"flex",gap:8,marginTop:16}}>
          <button onClick={exportPDF} style={{flex:1,padding:"14px",borderRadius:8,border:"none",background:C.oak,color:C.white,fontSize:14,fontWeight:600,cursor:"pointer"}}>Export Quotation as PDF →</button>
          <button onClick={()=>setEmailOpen(o=>!o)} style={{padding:"14px 20px",borderRadius:8,border:`1px solid ${C.oak}`,background:emailOpen?C.oak+"15":C.white,color:C.oak,fontSize:14,fontWeight:600,cursor:"pointer"}}>Send via Email ✉</button>
        </div>}
        {grand>0&&emailOpen&&<div style={{marginTop:12,background:C.white,border:`1px solid ${C.surfaceD}`,borderRadius:8,padding:20}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Send quotation by email</div>
          <div style={{fontSize:11,color:C.textS,marginBottom:14}}>Opens your default mail app with subject and summary prefilled. Remember to attach the exported PDF before sending.</div>
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <input type="email" placeholder="recipient@partner.com" value={emailTo} onChange={e=>setEmailTo(e.target.value)} style={{flex:1,padding:"10px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,outline:"none"}}/>
            <button onClick={sendEmail} disabled={!emailTo} style={{padding:"10px 18px",borderRadius:6,border:"none",background:!emailTo?C.steelL:C.black,color:C.white,fontSize:13,fontWeight:600,cursor:!emailTo?"not-allowed":"pointer",minWidth:90}}>Open mail</button>
          </div>
          {sendResult&&<div style={{marginTop:10,padding:"8px 12px",borderRadius:6,fontSize:12,background:sendResult.ok?"#E8F2EA":"#FDEAE6",color:sendResult.ok?C.go:C.danger}}>{sendResult.ok?"✓ ":""}{sendResult.message}</div>}
        </div>}
      </div>
    </div></div>};

// ─── ROI ──────────────────────────────────────────────────
const ROIField=({label,field,suffix,options,inp,setInp,help})=><div style={{marginBottom:14}}>
  <label style={{display:"block",fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>{label}</label>
  {options?
    <select value={inp[field]} onChange={e=>setInp(p=>({...p,[field]:e.target.value}))} style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:14,background:C.white}}>{options.map(o=><option key={o}>{o}</option>)}</select>
    :<div style={{display:"flex",alignItems:"center",gap:6}}>
      <input type="text" inputMode="decimal" value={inp[field]} onChange={e=>setInp(p=>({...p,[field]:e.target.value}))} onFocus={e=>e.target.select()} style={{flex:1,padding:"10px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:14,outline:"none",fontFamily:"'DM Mono',monospace"}}/>
      {suffix&&<span style={{fontSize:12,color:C.textS,minWidth:28}}>{suffix}</span>}
    </div>
  }
  {help&&<div style={{fontSize:10,color:C.textS,marginTop:4,lineHeight:1.4}}>{help}</div>}
</div>;

const ROI_MODEL_INFO={
  uplift:{
    title:"Uplift Model",
    subtitle:"Existing partner / Structural relaunch",
    what:"Converts expected retail sales into wholesale value, applies a defined uplift to isolate the incremental impact of the Selected Frame investment, and compares this against required CAPEX and ongoing OPEX. Result is a payback in months.",
    principle:"ROI is calculated on incremental value only — not total shop turnover. This ensures decisions are based on additional business created by the investment, not baseline sales that would exist anyway.",
    use:"Use this when an existing distribution point is being upgraded or relaunched. Requires a reliable baseline.",
  },
  total:{
    title:"Total Payback Model",
    subtitle:"New distribution",
    what:"Converts expected annual retail sales into wholesale turnover using the mark-up, subtracts annual OPEX, compares net value against CAPEX. Output is payback in months.",
    principle:"Designed for new shops where no reliable baseline exists. Does NOT isolate incremental uplift; instead answers: 'Can the total expected business justify the investment?'",
    use:"Use this for greenfield distribution. Can be run alongside Uplift for grey-zone cases (e.g. multibrand → dedicated SIS).",
  },
};

const ROIPage=({projects=[]})=>{
  const [model,setModel]=useState("uplift");
  const [linkedProject,setLinkedProject]=useState(null);
  const [pushStatus,setPushStatus]=useState(null); // {ok, message}
  const [pushing,setPushing]=useState(false);
  const [inp,setInp]=useState({
    retail:"150000",        // Last year retail sales
    expectedRetail:"172500",// Expected retail next year (drives uplift % for Uplift Model)
    upliftPct:"15",         // Manual uplift % (Uplift Model only)
    markup:"2.9",
    capex:"20000",
    opex:"16",
    valueView:"Gross Profit",
    gm:"35",
    ebit:"19",
    existSqm:"20",
    addSqm:"10",
    totalSqm:"30",          // Total Payback Model only - independent sqm field
  });
  const n=k=>parseFloat(inp[k])||0;
  const goT=24,revT=36;

  // Auto-calc uplift % from Last Year vs Expected
  const calcUpliftFromExpected=()=>{
    const ly=n("retail"),ey=n("expectedRetail");
    if(ly>0&&ey>0){
      const pct=((ey-ly)/ly)*100;
      setInp(p=>({...p,upliftPct:pct.toFixed(1)}));
    }
  };
  // Preset shortcuts
  const setPreset=(p)=>setInp(prev=>({...prev,upliftPct:p}));

  const ao=n("capex")*(n("opex")/100);

  // Uplift Model calculations
  const ts=n("existSqm")+n("addSqm");
  const rs=ts>0?n("retail")/ts:0;
  const upliftFraction=n("upliftPct")/100;
  const incRetailUplift=n("existSqm")*rs*upliftFraction;
  const incRetailVolume=n("addSqm")*rs;
  const incRetailTotal=incRetailUplift+incRetailVolume;
  const iw=n("markup")>0?incRetailTotal/n("markup"):0;
  const volumeShare=incRetailTotal>0?incRetailVolume/incRetailTotal:0;
  const upliftShare=incRetailTotal>0?incRetailUplift/incRetailTotal:0;
  const primaryDriver=volumeShare>=upliftShare?"Volume-driven":"Brand Presence-driven";

  // Total Payback Model calculations (uses its own sqm)
  const totalSqmTP=n("totalSqm");
  const tw=n("markup")>0?n("retail")/n("markup"):0;

  // Net annual value depends on model + value view
  let nv;
  const baseValue=model==="uplift"?iw:tw;
  if(inp.valueView==="Wholesale")nv=baseValue-ao;
  else if(inp.valueView==="Gross Profit")nv=(baseValue*(n("gm")/100))-ao;
  else nv=(baseValue*(n("ebit")/100))-ao;

  const pm=nv>0?(n("capex")/nv)*12:null;
  const st=!pm||nv<=0?"NO GO":pm<=goT?"GO":pm<=revT?"REVIEW":"NO GO";
  const re=nv<=0?"Net annual value is zero or negative":st==="NO GO"?"Payback exceeds policy threshold of 36 months":st==="REVIEW"?"Borderline — between 24 and 36 months payback. Conscious escalation required.":"Within policy thresholds (≤24 months payback)";

  const info=ROI_MODEL_INFO[model];

  // ASANA-ready summary string (matches Excel B32 format)
  const sqmDisplay=model==="uplift"?`Existing ${n("existSqm")} + Added ${n("addSqm")} = Total ${ts}`:`Total ${totalSqmTP}`;
  const projectLine=linkedProject?`Project: ${linkedProject.name}\n`:"";
  const asanaSummary=`ROI Summary – SIS Investment\n${projectLine}View: ${inp.valueView}\n${model==="uplift"?`Scenario: ${n("upliftPct").toFixed(1)}% uplift`:`Model: Total Payback (new distribution)`}\nSpace (m²): ${sqmDisplay}\nCAPEX (EUR): ${n("capex").toLocaleString("de-DE",{minimumFractionDigits:1,maximumFractionDigits:1})}\nNet Annual Value (EUR): ${nv?nv.toLocaleString("de-DE",{minimumFractionDigits:0,maximumFractionDigits:0}):"—"}\nPayback (Months): ${pm?Math.round(pm):"N/A"}\nDecision: ${st} – ${re}`;

  const [copied,setCopied]=useState(false);
  const copySummary=()=>{
    navigator.clipboard.writeText(asanaSummary).then(()=>{
      setCopied(true);
      setTimeout(()=>setCopied(false),2000);
    });
  };
  const pushToAsana=async()=>{
    if(!linkedProject?.gid)return;
    setPushing(true);setPushStatus(null);
    try{
      const r=await fetch("/api/asana-comment",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({taskGid:linkedProject.gid,text:asanaSummary}),
      });
      const data=await r.json();
      if(!r.ok)throw new Error(data.error||"Push failed");
      setPushStatus({ok:true,message:`Posted to "${linkedProject.name}"`});
      setTimeout(()=>setPushStatus(null),4000);
    }catch(e){
      setPushStatus({ok:false,message:e.message||"Could not push"});
    }finally{
      setPushing(false);
    }
  };

  return <div>
    <Title sub="Decision support framework for SIS investment cases">ROI Decision Engine</Title>

    {/* Project linker */}
    <div style={{background:C.white,borderRadius:8,padding:16,border:`1px solid ${C.surfaceD}`,marginBottom:24,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <div style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px"}}>Linked project</div>
      {linkedProject?<>
        <div style={{flex:1,minWidth:200,fontSize:13,fontWeight:600,color:C.text,padding:"6px 12px",background:C.oak+"15",borderRadius:6,borderLeft:`3px solid ${C.oak}`}}>{linkedProject.name}</div>
        <button onClick={()=>{setLinkedProject(null);setPushStatus(null)}} style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,background:C.white,fontSize:11,color:C.textS,cursor:"pointer"}}>Clear</button>
      </>:<>
        <select onChange={e=>{const p=projects.find(x=>x.gid===e.target.value);if(p)setLinkedProject(p)}} value="" style={{flex:1,minWidth:200,padding:"8px 12px",borderRadius:6,border:`1px solid ${C.surfaceD}`,fontSize:13,background:C.white,cursor:"pointer"}}>
          <option value="" disabled>Select a project to link…</option>
          {projects.filter(p=>!p.completed).sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(p=><option key={p.gid} value={p.gid}>{p.name}</option>)}
        </select>
        <span style={{fontSize:10,color:C.textS,maxWidth:280}}>Optional. Required only to push the summary back to Asana.</span>
      </>}
    </div>

    {/* Model toggle with description */}
    <div style={{display:"flex",gap:8,marginBottom:24}}>
      {[["uplift","Uplift Model","Existing / Relaunch"],["total","Total Payback","New Distribution"]].map(([k,l,d])=>
        <div key={k} style={{flex:1,padding:"16px 20px",borderRadius:8,cursor:"pointer",border:`2px solid ${model===k?C.oak:C.surfaceD}`,background:model===k?C.oak+"08":C.white}} onClick={()=>setModel(k)}>
          <div style={{fontSize:14,fontWeight:600}}>{l}</div>
          <div style={{fontSize:11,color:C.textS,marginTop:4}}>{d}</div>
        </div>)}
    </div>

    {/* Explainer card */}
    <div style={{background:C.surface,borderRadius:8,padding:20,marginBottom:24,borderLeft:`3px solid ${C.oak}`}}>
      <div style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>About this model</div>
      <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>{info.title} — <span style={{color:C.textS,fontWeight:400}}>{info.subtitle}</span></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,marginTop:12,fontSize:11,lineHeight:1.5}}>
        <div><div style={{fontWeight:600,color:C.text,marginBottom:4}}>What the tool does</div><div style={{color:C.textS}}>{info.what}</div></div>
        <div><div style={{fontWeight:600,color:C.text,marginBottom:4}}>Key principle</div><div style={{color:C.textS}}>{info.principle}</div></div>
        <div><div style={{fontWeight:600,color:C.text,marginBottom:4}}>Intended use</div><div style={{color:C.textS}}>{info.use}</div></div>
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 320px",gap:24,marginBottom:24}}>
      {/* Financial inputs */}
      <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>Financial</div>
        <ROIField label="Last Year Retail Sales" field="retail" suffix="EUR" inp={inp} setInp={setInp} help="Baseline retail turnover from the prior year"/>
        {model==="uplift"&&<>
          <ROIField label="Expected Retail Sales / Year" field="expectedRetail" suffix="EUR" inp={inp} setInp={setInp} help="Total retail expected once the SIS is operational"/>
          <button onClick={calcUpliftFromExpected} style={{width:"100%",marginBottom:14,padding:"8px 10px",border:`1px solid ${C.oak}`,borderRadius:6,background:C.oak+"15",color:C.oak,fontSize:11,fontWeight:600,cursor:"pointer"}}>↻ Auto-calculate uplift % from expected vs last year</button>
          <ROIField label="Uplift %" field="upliftPct" suffix="%" inp={inp} setInp={setInp} help="Performance uplift on existing space. Manual entry or use auto-calculate above."/>
          <div style={{display:"flex",gap:6,marginBottom:14,marginTop:-8}}>
            <span style={{fontSize:10,color:C.textS,alignSelf:"center"}}>Presets:</span>
            {[["5","Worst"],["10","Base"],["15","Best"]].map(([v,l])=><button key={l} onClick={()=>setPreset(v)} style={{flex:1,padding:"4px 6px",fontSize:10,borderRadius:4,border:`1px solid ${C.surfaceD}`,background:inp.upliftPct===v?C.oak+"15":C.white,color:inp.upliftPct===v?C.oak:C.textS,cursor:"pointer",fontWeight:600}}>{l} {v}%</button>)}
          </div>
        </>}
        <ROIField label="Mark-up (Retail ÷ Wholesale)" field="markup" inp={inp} setInp={setInp} help="Ratio used to convert retail to wholesale value"/>
        <ROIField label="CAPEX" field="capex" suffix="EUR" inp={inp} setInp={setInp} help="One-time investment to design, produce, deliver, and install Selected Frame setup"/>
        <ROIField label="OPEX" field="opex" suffix="%" inp={inp} setInp={setInp} help="Annual operating cost as % of CAPEX (maintenance, repairs)"/>
        <ROIField label="Value View" field="valueView" options={["Wholesale","Gross Profit","EBIT"]} inp={inp} setInp={setInp}/>
        {inp.valueView==="Gross Profit"&&<ROIField label="Gross Margin" field="gm" suffix="%" inp={inp} setInp={setInp}/>}
        {inp.valueView==="EBIT"&&<ROIField label="EBIT" field="ebit" suffix="%" inp={inp} setInp={setInp}/>}
      </div>

      {/* Space */}
      <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>Space</div>
        {model==="uplift"?<>
          <ROIField label="Existing Space" field="existSqm" suffix="m²" inp={inp} setInp={setInp} help="Sqm currently allocated to the brand"/>
          <ROIField label="Added Space" field="addSqm" suffix="m²" inp={inp} setInp={setInp} help="Net additional sqm created by the SIS investment"/>
          <div style={{background:C.surface,borderRadius:6,padding:"12px 14px",marginTop:14}}>
            <div style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase"}}>Total Shop Size</div>
            <div style={{fontSize:22,fontWeight:300,fontFamily:"'Cormorant Garamond',serif"}}>{ts} m²</div>
          </div>
          {/* Mini Indicator preview - simple bar */}
          {incRetailTotal>0&&<div style={{marginTop:16}}>
            <div style={{fontSize:10,fontWeight:600,color:C.textS,textTransform:"uppercase",marginBottom:6}}>Value Driver Split</div>
            <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",background:C.surfaceD}}>
              <div style={{width:`${volumeShare*100}%`,background:C.oak}}/>
              <div style={{width:`${upliftShare*100}%`,background:C.go}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.textS,marginTop:4}}>
              <span>Volume {(volumeShare*100).toFixed(0)}%</span>
              <span>Uplift {(upliftShare*100).toFixed(0)}%</span>
            </div>
            <div style={{fontSize:10,color:C.text,marginTop:6,fontWeight:600}}>Primary driver: {primaryDriver}</div>
          </div>}
        </>:<>
          <ROIField label="Total Shop Size" field="totalSqm" suffix="m²" inp={inp} setInp={setInp} help="Total floor area of the new distribution point"/>
          <div style={{background:C.surface,borderRadius:6,padding:"12px 14px",marginTop:14,fontSize:11,color:C.textS,lineHeight:1.5}}>
            New distribution does not split into existing/added — only the total shop size matters for this model.
          </div>
        </>}
      </div>

      {/* Decision panel */}
      <div style={{borderRadius:8,padding:24,border:`2px solid ${st==="GO"?C.go:st==="REVIEW"?C.review:C.nogo}`,background:st==="GO"?"#E8F2EA":st==="REVIEW"?"#FDF3E0":"#FDEAE6",display:"flex",flexDirection:"column"}}>
        <div style={{textAlign:"center",marginBottom:8}}>
          <div style={{fontSize:48,fontWeight:300,fontFamily:"'Cormorant Garamond',serif",color:st==="GO"?C.go:st==="REVIEW"?C.review:C.nogo,lineHeight:1}}>{st}</div>
        </div>
        <div style={{fontSize:11,color:C.textS,textAlign:"center",marginBottom:16,lineHeight:1.4,padding:"0 6px"}}>{re}</div>
        <div style={{borderTop:`1px solid rgba(0,0,0,.08)`,paddingTop:12}}>
          {[["Net Annual Value",nv?fmtEur(Math.round(nv)):"—"],["Payback",pm?`${pm.toFixed(1)} mo`:"N/A"],["Annual OPEX",fmtEur(Math.round(ao))]].map(([l,v])=>
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:12,borderBottom:"1px solid rgba(0,0,0,.06)"}}>
              <span style={{color:C.textS}}>{l}</span>
              <span style={{fontWeight:600}}>{v}</span>
            </div>)}
        </div>
        <div style={{marginTop:12,fontSize:10,color:C.textS,textAlign:"center"}}>
          Thresholds: GO ≤24 mo · REVIEW ≤36 mo · NO GO &gt;36 mo
        </div>
      </div>
    </div>

    {/* ASANA-ready summary */}
    <div style={{background:C.black,borderRadius:8,padding:24,color:C.white,marginBottom:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:11,color:C.steelL,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase"}}>ASANA-ready summary</div>
          <div style={{fontSize:11,color:C.steel,marginTop:2}}>{linkedProject?`Push directly to "${linkedProject.name}" or copy to clipboard`:"Link a project above to enable push, or copy to clipboard"}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={copySummary} style={{padding:"8px 16px",borderRadius:6,border:`1px solid ${C.steel}`,background:copied?C.go:"transparent",color:C.white,fontSize:12,fontWeight:600,cursor:"pointer"}}>{copied?"✓ Copied":"Copy summary"}</button>
          <button onClick={pushToAsana} disabled={!linkedProject||pushing} style={{padding:"8px 16px",borderRadius:6,border:"none",background:!linkedProject||pushing?C.steel:(pushStatus?.ok?C.go:C.oak),color:C.white,fontSize:12,fontWeight:600,cursor:!linkedProject||pushing?"not-allowed":"pointer",opacity:!linkedProject?0.5:1}}>{pushing?"Pushing…":pushStatus?.ok?"✓ Posted":"Push to Asana"}</button>
        </div>
      </div>
      {pushStatus&&!pushStatus.ok&&<div style={{fontSize:11,color:C.danger,padding:"8px 12px",background:"rgba(196,108,68,.15)",borderRadius:6,marginBottom:12,borderLeft:`3px solid ${C.danger}`}}>✗ {pushStatus.message}</div>}
      {pushStatus?.ok&&<div style={{fontSize:11,color:C.steelL,padding:"8px 12px",background:"rgba(46,125,50,.15)",borderRadius:6,marginBottom:12,borderLeft:`3px solid ${C.go}`}}>✓ {pushStatus.message}</div>}
      <pre style={{fontSize:11,color:C.steelL,fontFamily:"'DM Mono',monospace",whiteSpace:"pre-wrap",lineHeight:1.6,margin:0}}>{asanaSummary}</pre>
    </div>

    {/* Threshold reference */}
    <div style={{background:C.white,borderRadius:8,padding:20,border:`1px solid ${C.surfaceD}`}}>
      <div style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>Decision logic</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,fontSize:11}}>
        <div style={{padding:"10px 14px",background:"#E8F2EA",borderRadius:6,borderLeft:`3px solid ${C.go}`}}><div style={{fontWeight:700,color:C.go,marginBottom:4}}>GO</div><div style={{color:C.textS,lineHeight:1.4}}>Payback within defined policy thresholds (≤24 months). Investment proceeds normally.</div></div>
        <div style={{padding:"10px 14px",background:"#FDF3E0",borderRadius:6,borderLeft:`3px solid ${C.review}`}}><div style={{fontWeight:700,color:C.review,marginBottom:4}}>REVIEW</div><div style={{color:C.textS,lineHeight:1.4}}>Borderline cases (24–36 months) requiring conscious escalation and strategic rationale.</div></div>
        <div style={{padding:"10px 14px",background:"#FDEAE6",borderRadius:6,borderLeft:`3px solid ${C.nogo}`}}><div style={{fontWeight:700,color:C.nogo,marginBottom:4}}>NO GO</div><div style={{color:C.textS,lineHeight:1.4}}>Payback exceeds 36 months or net annual value is negative. Strategic exception required to override.</div></div>
      </div>
    </div>
  </div>;
};

const FlowPage=({projects=[],setPage})=>{
  const [openPhase,setOpenPhase]=useState(0);
  // Count active (non-completed) projects per phase
  const countFor=(num)=>projects.filter(p=>!p.completed&&p.phaseNum===num).length;
  const totalActive=projects.filter(p=>!p.completed).length;
  return <div>
    <Title sub={`Phase 0–10 · ${totalActive} active projects`}>Project Flow</Title>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:32,borderRadius:8,overflow:"hidden"}}>
      <div style={{height:200}}><img src="/images/kh_selected_sis_048_web.jpg" alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
      <div style={{height:200}}><img src="/images/kh_selected_sis_023_web.jpg" alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
    </div>
    <div style={{position:"relative"}}>
      <div style={{position:"absolute",left:23,top:20,bottom:20,width:2,background:`linear-gradient(to bottom,${C.steelL},${C.accent})`}}/>
      {PHASES.map(ph=>{
        const isOpen=openPhase===ph.num;
        const count=countFor(ph.num);
        return <div key={ph.num} style={{display:"flex",gap:24,marginBottom:12,position:"relative"}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:ph.color,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,fontWeight:600,boxShadow:`0 2px 8px ${ph.color}44`,zIndex:1}}>{ph.num}</div>
          <div style={{background:C.white,borderRadius:8,border:`1px solid ${C.surfaceD}`,flex:1,borderLeft:`4px solid ${ph.color}`,overflow:"hidden",transition:"all .2s"}}>
            <div onClick={()=>setOpenPhase(isOpen?-1:ph.num)} style={{padding:"14px 20px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:600,color:ph.color,textTransform:"uppercase",letterSpacing:"1px"}}>Phase {ph.num}</div>
                <div style={{fontSize:18,fontWeight:400,fontFamily:"'Cormorant Garamond',serif"}}>{ph.name}</div>
                {!isOpen&&<div style={{fontSize:11,color:C.textS,marginTop:2}}>{ph.tagline}</div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:11,padding:"4px 10px",borderRadius:12,background:count>0?ph.color+"22":C.surface,color:count>0?ph.color:C.textS,fontWeight:600,whiteSpace:"nowrap"}}>{count} {count===1?"project":"projects"}</div>
                <div style={{fontSize:14,color:C.textS,transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</div>
              </div>
            </div>
            {isOpen&&<div style={{padding:"4px 20px 18px 20px",borderTop:`1px solid ${C.surfaceD}`}}>
              <p style={{fontSize:12,color:C.text,margin:"12px 0 0",lineHeight:1.6}}>{ph.desc}</p>
              {count>0&&<div style={{marginTop:14,padding:"10px 14px",background:C.surface,borderRadius:6,fontSize:11,color:C.textS}}>Currently <strong style={{color:C.text}}>{count} active {count===1?"project":"projects"}</strong> in this phase.</div>}
              {ph.num===2&&<div style={{marginTop:14,display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>setPage("roi")} style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${C.oak}`,background:C.oak+"15",color:C.oak,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>📊 Open ROI Engine</button>
                <button onClick={()=>setPage("quotation")} style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${C.oak}`,background:C.oak+"15",color:C.oak,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>📋 Open Quotation Builder</button>
              </div>}
            </div>}
          </div>
        </div>;
      })}
    </div>
  </div>;
};
const InstalledExternalFolderLink=({asanaProjectId,setPage,setExternalFolderTarget})=>{
  const [folder,setFolder]=useState(null);
  useEffect(()=>{
    if(!asanaProjectId)return;
    fetch(`/api/external-folders/by-project/${asanaProjectId}`)
      .then(r=>r.ok?r.json():{folder:null})
      .then(d=>setFolder(d.folder||null))
      .catch(()=>{});
  },[asanaProjectId]);
  if(!folder)return null;
  return <button onClick={()=>{setExternalFolderTarget(folder.id);setPage("external-folders");}} style={{marginLeft:12,fontSize:11,color:C.oak,background:"none",border:"none",cursor:"pointer",fontWeight:500,padding:0}}>Open External Project Folder →</button>;
};
const InstalledPage=({projects,setPage,setExternalFolderTarget})=>{const c=projects.filter(p=>p.completed);return<div><Title sub="Completed">Installed Base</Title><div style={{display:"flex",gap:16,marginBottom:24}}><KPI label="Total" value={c.length}/></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>{c.map(p=><div key={p.gid} style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`,borderTop:`4px solid ${C.accent}`}}><div style={{fontSize:16,fontWeight:400,fontFamily:"'Cormorant Garamond',serif",marginBottom:8}}>{p.name}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>{[["Type",p.type],["Completed",fmtDate(p.completedAt)]].map(([l,v])=><div key={l}><div style={{color:C.textS,fontSize:10,fontWeight:600,textTransform:"uppercase"}}>{l}</div><div style={{fontWeight:500}}>{v}</div></div>)}</div><div style={{marginTop:12,display:"flex",flexWrap:"wrap",alignItems:"center"}}><a href={p.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:C.oak,textDecoration:"none",fontWeight:500}}>Details →</a><InstalledExternalFolderLink asanaProjectId={p.gid} setPage={setPage} setExternalFolderTarget={setExternalFolderTarget}/></div></div>)}</div></div>};
const ReviewPill=()=><span style={{fontSize:9,fontWeight:700,color:C.review,background:"#FDF3E0",padding:"2px 6px",borderRadius:3,letterSpacing:".5px",marginLeft:8,verticalAlign:"middle",border:`1px solid ${C.review}33`}}>REVIEW</span>;

const SectionHeader=({eyebrow,title,intro,id})=><div id={id} style={{paddingTop:24,marginBottom:24,scrollMarginTop:24}}>
  <div style={{fontSize:10,fontWeight:600,color:C.oak,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:8}}>{eyebrow}</div>
  <h2 style={{fontSize:32,fontWeight:400,fontFamily:"'Cormorant Garamond',serif",margin:"0 0 12px",color:C.text,lineHeight:1.1}}>{title}</h2>
  {intro&&<p style={{fontSize:13,color:C.textS,maxWidth:680,lineHeight:1.6,margin:0}}>{intro}</p>}
</div>;

const StandardsPage=()=>{
  const [active,setActive]=useState("intro");
  // Track scroll for active section highlighting
  React.useEffect(()=>{
    const onScroll=()=>{
      let current="intro";
      for(const s of SF_SECTIONS){
        const el=document.getElementById(s.id);
        if(el&&el.getBoundingClientRect().top<200)current=s.id;
      }
      setActive(current);
    };
    window.addEventListener("scroll",onScroll,{passive:true});
    return ()=>window.removeEventListener("scroll",onScroll);
  },[]);

  return <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:48,maxWidth:1100}}>
    {/* Sticky sidebar nav */}
    <nav style={{position:"sticky",top:24,alignSelf:"start",height:"fit-content"}}>
      <div style={{fontSize:10,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:14}}>Sections</div>
      {SF_SECTIONS.map(s=><a key={s.id} href={`#${s.id}`} onClick={e=>{e.preventDefault();document.getElementById(s.id)?.scrollIntoView({behavior:"smooth"})}} style={{display:"block",padding:"6px 0 6px 12px",fontSize:12,color:active===s.id?C.oak:C.textS,fontWeight:active===s.id?600:400,borderLeft:`2px solid ${active===s.id?C.oak:C.surfaceD}`,textDecoration:"none",transition:"all .2s",cursor:"pointer"}}>{s.label}</a>)}
    </nav>

    {/* Content column */}
    <div>

      {/* INTRO */}
      <section id="intro" style={{marginBottom:48,scrollMarginTop:24}}>
        <div style={{fontSize:10,fontWeight:600,color:C.oak,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:8}}>{SF_INTRO.kicker}</div>
        <h1 style={{fontSize:42,fontWeight:400,fontFamily:"'Cormorant Garamond',serif",margin:"0 0 16px",color:C.text,lineHeight:1.1}}>{SF_INTRO.title}</h1>
        <p style={{fontSize:14,color:C.text,maxWidth:680,lineHeight:1.7,margin:"0 0 24px"}}>{SF_INTRO.body}</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,padding:"20px 24px",background:C.white,borderRadius:8,border:`1px solid ${C.surfaceD}`}}>
          {SF_INTRO.meta.map(m=><div key={m.label}>
            <div style={{fontSize:10,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>{m.label}</div>
            <div style={{fontSize:12,color:C.text,fontWeight:500}}>{m.value}</div>
          </div>)}
        </div>
      </section>

      {/* DNA */}
      <SectionHeader id="dna" eyebrow="01" title="Concept DNA" intro={SF_DNA.intro}/>
      {SF_DNA.image&&<div style={{marginBottom:24,borderRadius:8,overflow:"hidden",position:"relative"}}>
        <div style={{height:280,background:`url(${SF_DNA.image}) center/cover`}}/>
        {SF_DNA.imageCaption&&<div style={{padding:"12px 16px",fontSize:11,color:C.textS,fontStyle:"italic",lineHeight:1.5,background:C.white,borderTop:`1px solid ${C.surfaceD}`}}>{SF_DNA.imageCaption}</div>}
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:48}}>
        {SF_DNA.principles.map((p,i)=><div key={i} style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`,position:"relative"}}>
          <div style={{fontSize:10,fontWeight:600,color:C.oak,letterSpacing:"1px",marginBottom:8}}>0{i+1}</div>
          <div style={{fontSize:18,fontWeight:400,fontFamily:"'Cormorant Garamond',serif",marginBottom:10,color:C.text}}>{p.title}{p.review&&<ReviewPill/>}</div>
          <p style={{fontSize:12,color:C.textS,lineHeight:1.6,margin:0}}>{p.body}</p>
        </div>)}
      </div>

      {/* NON-NEGOTIABLES */}
      <SectionHeader id="non-negotiables" eyebrow="02 · Fixed rules" title="Non-Negotiables" intro={SF_NON_NEGOTIABLES.intro}/>
      <div style={{background:C.black,borderRadius:8,padding:"4px 0",marginBottom:48}}>
        {(()=>{let counter=0;return SF_NON_NEGOTIABLES.groups.map((g,gi)=><div key={gi}>
          <div style={{padding:"22px 24px 14px",borderBottom:"1px solid #2A2A2A",display:"flex",justifyContent:"space-between",alignItems:"baseline",borderTop:gi>0?"1px solid #2A2A2A":"none"}}>
            <div>
              <div style={{fontSize:16,fontWeight:500,color:C.white,letterSpacing:".3px"}}>{g.title}</div>
              <div style={{fontSize:10,fontWeight:600,color:C.oak,textTransform:"uppercase",letterSpacing:"1.5px",marginTop:4}}>{g.kicker}</div>
            </div>
            <div style={{fontSize:10,color:C.steel,fontFamily:"'DM Mono',monospace"}}>{String(counter+1).padStart(2,"0")}–{String(counter+g.rules.length).padStart(2,"0")}</div>
          </div>
          {g.rules.map((r,i)=>{counter++;return <div key={i} style={{display:"flex",gap:20,padding:"16px 24px",borderBottom:i<g.rules.length-1?"1px solid #2A2A2A":"none"}}>
            <div style={{fontSize:14,color:C.oak,fontWeight:600,minWidth:32,fontFamily:"'DM Mono',monospace"}}>{String(counter).padStart(2,"0")}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:C.white,marginBottom:4}}>{r.title}</div>
              <div style={{fontSize:12,color:C.steelL,lineHeight:1.6}}>{r.body}</div>
            </div>
          </div>})}
        </div>)})()}
      </div>

      {/* SPACE MANAGEMENT */}
      <SectionHeader id="space" eyebrow="03" title="Space Management" intro={SF_SPACE_MANAGEMENT.intro}/>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:48}}>
        {SF_SPACE_MANAGEMENT.zones.map((z,i)=><details key={i} style={{background:C.white,borderRadius:8,border:`1px solid ${C.surfaceD}`,overflow:"hidden"}}>
          <summary style={{cursor:"pointer",padding:"18px 24px",listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:15,fontWeight:500,color:C.text}}>{z.title}</div>
            </div>
            <div style={{fontSize:14,color:C.textS}}>+</div>
          </summary>
          <div style={{padding:"0 24px 24px"}}>
            <p style={{fontSize:12,color:C.textS,lineHeight:1.7,margin:"0 0 14px",borderTop:`1px solid ${C.surfaceD}`,paddingTop:16}}>{z.body}</p>
            {z.supporting&&<p style={{fontSize:12,color:C.textS,lineHeight:1.7,margin:"0 0 18px",fontStyle:"italic",paddingLeft:14,borderLeft:`2px solid ${C.surfaceD}`}}>{z.supporting}</p>}
            {z.commercialZones&&<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:18}}>{z.commercialZones.map(cz=><div key={cz.number} style={{padding:"14px 16px",background:C.surface,borderRadius:6,borderLeft:`3px solid ${C.oak}`}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:6}}>
                <span style={{fontSize:10,color:C.oak,fontWeight:700,fontFamily:"'DM Mono',monospace",letterSpacing:".5px"}}>ZONE {cz.number}</span>
                <span style={{fontSize:14,fontWeight:500,color:C.text}}>{cz.name}</span>
              </div>
              <div style={{fontSize:11,color:C.textS,lineHeight:1.5}}>{cz.body}</div>
            </div>)}</div>}
            {(z.dos||z.donts)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {z.dos&&<div style={{padding:"14px 16px",background:"#F0F7F2",borderRadius:6,borderLeft:`3px solid ${C.go}`}}>
                <div style={{fontSize:10,fontWeight:700,color:C.go,letterSpacing:"1px",marginBottom:8}}>DO</div>
                {z.dos.map((d,j)=><div key={j} style={{fontSize:11,color:C.text,padding:"3px 0",lineHeight:1.5}}>· {d}</div>)}
              </div>}
              {z.donts&&<div style={{padding:"14px 16px",background:"#FBF0EE",borderRadius:6,borderLeft:`3px solid ${C.nogo}`}}>
                <div style={{fontSize:10,fontWeight:700,color:C.nogo,letterSpacing:"1px",marginBottom:8}}>DON'T</div>
                {z.donts.map((d,j)=><div key={j} style={{fontSize:11,color:C.text,padding:"3px 0",lineHeight:1.5}}>· {d}</div>)}
              </div>}
            </div>}
          </div>
        </details>)}
      </div>

      {/* BRAND APPLICATION */}
      <SectionHeader id="brand" eyebrow="04 · Mini CI guide" title="Brand Application" intro={SF_BRAND_APPLICATION.intro}/>
      <div style={{background:C.white,borderRadius:8,padding:"8px 0",border:`1px solid ${C.surfaceD}`,marginBottom:24}}>
        {SF_BRAND_APPLICATION.rules.map((r,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:24,padding:"14px 24px",borderBottom:i<SF_BRAND_APPLICATION.rules.length-1?`1px solid ${C.surfaceD}`:"none"}}>
          <div style={{fontSize:11,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px"}}>{r.label}{r.review&&<ReviewPill/>}</div>
          <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{r.value}</div>
        </div>)}
      </div>
      <div style={{padding:"18px 24px",background:"#FBF0EE",borderRadius:8,borderLeft:`3px solid ${C.nogo}`,marginBottom:48}}>
        <div style={{fontSize:10,fontWeight:700,color:C.nogo,letterSpacing:"1px",marginBottom:10}}>LOGO MISUSE — NOT APPROVED</div>
        {SF_BRAND_APPLICATION.misuse.map((m,j)=><div key={j} style={{fontSize:12,color:C.text,padding:"3px 0",lineHeight:1.5}}>· {m}</div>)}
      </div>

      {/* FIXTURES */}
      <SectionHeader id="fixtures" eyebrow="05" title="Fixtures & Modules" intro={SF_FIXTURES.intro}/>
      {SF_FIXTURES.meta&&<div style={{fontSize:11,color:C.textS,fontStyle:"italic",marginBottom:20}}>{SF_FIXTURES.meta}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:48}}>
        {SF_FIXTURES.categories.map((cat,ci)=><details key={ci} style={{background:C.white,borderRadius:8,border:`1px solid ${C.surfaceD}`,overflow:"hidden"}}>
          <summary style={{cursor:"pointer",padding:"18px 24px",listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:12}}>
              <div style={{fontSize:15,fontWeight:500,color:C.text}}>{cat.name}</div>
              <div style={{fontSize:10,color:C.textS,fontFamily:"'DM Mono',monospace"}}>{cat.items.length} {cat.items.length===1?"item":"items"}</div>
            </div>
            <div style={{fontSize:14,color:C.textS}}>+</div>
          </summary>
          <div style={{padding:"0 24px 24px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))",gap:14,borderTop:`1px solid ${C.surfaceD}`,paddingTop:18}}>
              {cat.items.map((it,i)=><div key={i} style={{background:C.white,borderRadius:8,border:`1px solid ${C.surfaceD}`,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                <div style={{aspectRatio:"1 / 1",background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                  {it.image?<img src={it.image} alt={it.name} style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<div style={{fontSize:10,color:C.textS,textTransform:"uppercase",letterSpacing:"1px"}}>No image</div>}
                </div>
                <div style={{padding:"12px 14px 14px",borderTop:`1px solid ${C.surfaceD}`}}>
                  <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:C.textS,marginBottom:4}}>{it.code}</div>
                  <div style={{fontSize:13,fontWeight:500,color:C.text,marginBottom:8,lineHeight:1.3,minHeight:34}}>{it.name}</div>
                  <div style={{fontSize:10,color:C.textS,fontFamily:"'DM Mono',monospace",lineHeight:1.5,marginBottom:4}}>{it.dims}</div>
                  <div style={{fontSize:10,color:C.textS,marginBottom:it.hangers?6:0}}>{it.material}</div>
                  {it.hangers&&<div style={{display:"inline-block",fontSize:10,fontWeight:600,color:C.oak,background:C.oak+"15",padding:"2px 8px",borderRadius:3,marginTop:4}}>{it.hangers} hangers</div>}
                </div>
              </div>)}
            </div>
          </div>
        </details>)}
      </div>

      {/* MERCHANDISING */}
      <SectionHeader id="vm" eyebrow="06" title="Merchandising" intro={SF_MERCHANDISING.intro}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14,marginBottom:24}}>
        {SF_MERCHANDISING.principles.map((p,i)=><div key={i} style={{background:C.white,borderRadius:8,padding:20,border:`1px solid ${C.surfaceD}`}}>
          <div style={{fontSize:14,fontWeight:500,color:C.text,marginBottom:8}}>{p.title}{p.review&&<ReviewPill/>}</div>
          <div style={{fontSize:11,color:C.textS,lineHeight:1.6}}>{p.body}</div>
        </div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:48}}>
        <div style={{padding:"18px 22px",background:"#F0F7F2",borderRadius:8,borderLeft:`3px solid ${C.go}`}}>
          <div style={{fontSize:10,fontWeight:700,color:C.go,letterSpacing:"1px",marginBottom:10}}>DO</div>
          {SF_MERCHANDISING.dos.map((d,i)=><div key={i} style={{fontSize:12,color:C.text,padding:"4px 0",lineHeight:1.5}}>· {d}</div>)}
        </div>
        <div style={{padding:"18px 22px",background:"#FBF0EE",borderRadius:8,borderLeft:`3px solid ${C.nogo}`}}>
          <div style={{fontSize:10,fontWeight:700,color:C.nogo,letterSpacing:"1px",marginBottom:10}}>DON'T</div>
          {SF_MERCHANDISING.donts.map((d,i)=><div key={i} style={{fontSize:12,color:C.text,padding:"4px 0",lineHeight:1.5}}>· {d}</div>)}
        </div>
      </div>

      {/* PLAYBOOKS */}
      <SectionHeader id="playbooks" eyebrow="07" title="Store Size Playbooks" intro={SF_PLAYBOOKS.intro}/>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:48}}>
        {SF_PLAYBOOKS.sizes.map((s,i)=><details key={i} style={{background:C.white,borderRadius:8,border:`1px solid ${C.surfaceD}`,overflow:"hidden"}}>
          <summary style={{cursor:"pointer",padding:"18px 24px",listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:16}}>
              <div style={{fontSize:28,fontWeight:300,fontFamily:"'Cormorant Garamond',serif",color:C.text,lineHeight:1}}>{s.sqm}<span style={{fontSize:13,color:C.textS}}> m²</span></div>
              <div style={{fontSize:11,color:C.oak,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase"}}>{s.name}</div>
            </div>
            <div style={{fontSize:14,color:C.textS}}>+</div>
          </summary>
          <div style={{padding:"0 24px 24px"}}>
            <div style={{borderTop:`1px solid ${C.surfaceD}`,paddingTop:18}}>
              <div style={{fontSize:13,color:C.text,lineHeight:1.6,marginBottom:20}}>{s.description}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"18px 24px",marginBottom:18}}>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:C.textS,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Best used when</div>
                  <ul style={{margin:0,padding:0,listStyle:"none"}}>{s.bestUsedWhen.map((x,j)=><li key={j} style={{fontSize:12,color:C.text,lineHeight:1.55,paddingLeft:12,position:"relative",marginBottom:3}}><span style={{position:"absolute",left:0,color:C.textS}}>·</span>{x}</li>)}</ul>
                </div>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:C.textS,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Key logic</div>
                  <ul style={{margin:0,padding:0,listStyle:"none"}}>{s.keyLogic.map((x,j)=><li key={j} style={{fontSize:12,color:C.text,lineHeight:1.55,paddingLeft:12,position:"relative",marginBottom:3}}><span style={{position:"absolute",left:0,color:C.textS}}>·</span>{x}</li>)}</ul>
                </div>
              </div>
              <div style={{marginBottom:18}}>
                <div style={{fontSize:9,fontWeight:700,color:C.nogo,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Avoid</div>
                <ul style={{margin:0,padding:0,listStyle:"none"}}>{s.avoid.map((x,j)=><li key={j} style={{fontSize:12,color:C.text,lineHeight:1.55,paddingLeft:12,position:"relative",marginBottom:3}}><span style={{position:"absolute",left:0,color:C.textS}}>·</span>{x}</li>)}</ul>
              </div>
              <div style={{padding:"12px 16px",background:C.surface,borderLeft:`3px solid ${C.oak}`,borderRadius:4}}>
                <div style={{fontSize:9,fontWeight:700,color:C.oak,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>Commercial role</div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.6,fontStyle:"italic"}}>{s.commercialRole}</div>
              </div>
            </div>
          </div>
        </details>)}
      </div>

      {/* EXCEPTIONS */}
      <SectionHeader id="exceptions" eyebrow="08" title="Exceptions & Approval" intro={SF_EXCEPTIONS.intro}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`,borderTop:`3px solid ${C.nogo}`}}>
          <div style={{fontSize:10,fontWeight:700,color:C.nogo,letterSpacing:"1.2px",marginBottom:6}}>FIXED — NO DEVIATION</div>
          <div style={{fontSize:11,color:C.textS,marginBottom:14,lineHeight:1.5}}>Concept-defining rules. These cannot be changed at project level.</div>
          {SF_EXCEPTIONS.fixed.map((r,i)=><div key={i} style={{fontSize:12,color:C.text,padding:"7px 0",borderTop:`1px solid ${C.surfaceD}`,lineHeight:1.5}}>· {r}</div>)}
        </div>
        <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`,borderTop:`3px solid ${C.oak}`}}>
          <div style={{fontSize:10,fontWeight:700,color:C.oak,letterSpacing:"1.2px",marginBottom:6}}>FLEXIBLE — CONTROLLED ADAPTATION</div>
          <div style={{fontSize:11,color:C.textS,marginBottom:14,lineHeight:1.5}}>Open to local adaptation within the concept logic — always reviewed.</div>
          {SF_EXCEPTIONS.flexible.map((r,i)=><div key={i} style={{fontSize:12,color:C.text,padding:"7px 0",borderTop:`1px solid ${C.surfaceD}`,lineHeight:1.5}}>· {r}</div>)}
        </div>
      </div>
      <div style={{background:C.white,borderRadius:8,padding:28,border:`1px solid ${C.surfaceD}`,marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:C.text,textTransform:"uppercase",letterSpacing:"1.2px",marginBottom:4}}>Approval process</div>
        <div style={{fontSize:11,color:C.textS,marginBottom:22,lineHeight:1.5}}>Every deviation follows the same four steps. No shortcuts.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:24,position:"relative"}}>
          {SF_EXCEPTIONS.process.map((p,idx)=><div key={p.step} style={{position:"relative"}}>
            {idx<SF_EXCEPTIONS.process.length-1&&<div style={{position:"absolute",top:14,left:40,right:-24,height:1,background:C.surfaceD}}/>}
            <div style={{width:28,height:28,borderRadius:"50%",background:C.oak,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,marginBottom:12,position:"relative",zIndex:1}}>{p.step}</div>
            <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:6}}>{p.title}</div>
            <div style={{fontSize:11,color:C.textS,lineHeight:1.55}}>{p.body}</div>
          </div>)}
        </div>
      </div>
      {SF_EXCEPTIONS.callout&&<div style={{padding:"16px 22px",background:C.black,color:C.white,borderRadius:8,marginBottom:24,display:"flex",alignItems:"center",gap:14}}>
        <div style={{fontSize:9,fontWeight:700,color:C.oak,letterSpacing:"1.5px",textTransform:"uppercase",borderRight:`1px solid ${C.steelD}`,paddingRight:14}}>Rule</div>
        <div style={{fontSize:13,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",letterSpacing:".3px"}}>{SF_EXCEPTIONS.callout}</div>
      </div>}

    </div>
  </div>;
};
const AdminPage=({projects})=>{
  const [testing,setTesting]=useState(false);
  const [result,setResult]=useState(null);
  const runTest=async()=>{
    setTesting(true);setResult(null);
    try{
      const r=await fetch("/api/test-asana-write",{method:"POST"});
      const data=await r.json();
      setResult(data);
    }catch(e){
      setResult({success:false,summary:"Network or server error: "+e.message,log:[]});
    }finally{
      setTesting(false);
    }
  };
  return <div>
    <Title sub="System health">Admin</Title>
    <div style={{display:"flex",gap:16,marginBottom:24}}>
      <KPI label="Source" value="BRAND SPACES"/>
      <KPI label="Tasks" value={projects.length}/>
      <KPI label="Status" value="Connected"/>
    </div>
    <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`,marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>Field Completeness</div>
      {[["Name",100],["Due Date",Math.round(projects.filter(p=>p.dueOn).length/Math.max(projects.length,1)*100)],["Sex",Math.round(projects.filter(p=>p.sex).length/Math.max(projects.length,1)*100)],["Region",Math.round(projects.filter(p=>p.region).length/Math.max(projects.length,1)*100)]].map(([f,pct])=>
        <div key={f} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
            <span>{f}</span><span style={{color:pct>=80?C.success:pct>=40?C.warn:C.danger,fontWeight:600}}>{pct}%</span>
          </div>
          <div style={{height:4,background:C.surfaceD,borderRadius:2}}>
            <div style={{height:4,borderRadius:2,width:`${pct}%`,background:pct>=80?C.success:pct>=40?C.warn:C.danger}}/>
          </div>
        </div>)}
    </div>
    <div style={{background:C.white,borderRadius:8,padding:24,border:`1px solid ${C.surfaceD}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div>
          <div style={{fontSize:14,fontWeight:600}}>Asana Write Access Test</div>
          <div style={{fontSize:11,color:C.textS,marginTop:4,maxWidth:520,lineHeight:1.5}}>Verifies if the configured ASANA_TOKEN can write comments to tasks. Required for the upcoming "Push ROI Summary to Asana" feature. The test creates a temporary comment and deletes it immediately — no permanent change to your Asana workspace.</div>
        </div>
        <button onClick={runTest} disabled={testing} style={{padding:"10px 18px",borderRadius:6,border:"none",background:testing?C.steelL:C.oak,color:C.white,fontSize:12,fontWeight:600,cursor:testing?"not-allowed":"pointer",minWidth:120,whiteSpace:"nowrap"}}>{testing?"Testing...":"Run Test"}</button>
      </div>
      {result&&<div style={{marginTop:16,padding:16,borderRadius:8,background:result.success?"#E8F2EA":"#FDEAE6",borderLeft:`4px solid ${result.success?C.go:C.nogo}`}}>
        <div style={{fontSize:13,fontWeight:600,color:result.success?C.go:C.nogo,marginBottom:8}}>{result.success?"✓ "+result.summary:"✗ "+result.summary}</div>
        {result.testedTaskName&&<div style={{fontSize:11,color:C.textS,marginBottom:12}}>Tested against task: <strong>{result.testedTaskName}</strong></div>}
        {result.log&&result.log.length>0&&<div style={{borderTop:`1px solid ${C.surfaceD}`,paddingTop:12,marginTop:8}}>
          <div style={{fontSize:10,fontWeight:600,color:C.textS,textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>Test Log</div>
          {result.log.map((entry,i)=><div key={i} style={{display:"flex",gap:10,fontSize:11,padding:"6px 0",borderBottom:i<result.log.length-1?`1px solid ${C.surfaceD}`:"none"}}>
            <span style={{color:entry.ok?C.go:C.nogo,fontWeight:700,minWidth:14}}>{entry.ok?"✓":"✗"}</span>
            <div style={{flex:1}}>
              <div style={{color:C.text,fontWeight:600}}>{entry.label}</div>
              <div style={{color:C.textS,fontFamily:"'DM Mono',monospace",fontSize:10,marginTop:2,wordBreak:"break-word"}}>{entry.detail}</div>
            </div>
          </div>)}
        </div>}
      </div>}
    </div>
  </div>;
};

export default function Home(){const [page,setPage]=useState("overview");const [detail,setDetail]=useState(null);const [hover,setHover]=useState(null);const [projects,setProjects]=useState(FALLBACK_PROJECTS);const [externalFolderTarget,setExternalFolderTarget]=useState(null);
  useEffect(()=>{const f=async()=>{try{const r=await fetch("/api/projects");if(r.ok){const d=await r.json();if(d.projects?.length>0)setProjects(d.projects)}}catch(e){}};f();const i=setInterval(f,15*60*1000);return()=>clearInterval(i)},[]);
  const navSections=[
    {items:[{id:"overview",label:"Overview",icon:"◈"}]},
    {label:"Projects",items:[
      {id:"intake",label:"Project Intake",icon:"✛"},
      {id:"projects",label:"Current",icon:"▦"},
      {id:"flow",label:"Project Flow",icon:"⟳"},
      {id:"installed",label:"Installed Base",icon:"⊞"},
    ]},
    {label:"Tools",items:[
      {id:"roi",label:"ROI Engine",icon:"◇"},
      {id:"draft",label:"Draft Studio",icon:"✎"},
      {id:"quotation",label:"Quotation",icon:"📋"},
      {id:"opening-report",label:"Opening Report",icon:"✓"},
      {id:"toolbox",label:"Toolbox",icon:"⊟"},
    ]},
    {label:"Showroom Ops",items:[
      {id:"showroom-ops",label:"Showroom Ops",icon:"❖"},
    ]},
    {items:[{id:"standards",label:"Standards",icon:"☰"}]},
    {bottom:true,items:[
      {id:"external-folders",label:"External Folders",icon:"⊕"},
      {id:"admin",label:"Admin",icon:"⚙"},
    ]},
  ];
  const nav=navSections.flatMap(s=>s.items);
  return<div style={{display:"flex",minHeight:"100vh",background:C.surface}}>
    <div style={{width:220,background:C.black,color:C.white,flexShrink:0,display:"flex",flexDirection:"column",padding:"28px 0",position:"sticky",top:0,height:"100vh"}}>
      <div style={{padding:"0 24px",marginBottom:32}}><img src={LOGO_WHITE} alt="" style={{height:28,marginBottom:8}}/><div style={{fontSize:9,color:C.steel,letterSpacing:"1.5px",textTransform:"uppercase",marginTop:4}}>Command Space</div></div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        {navSections.filter(s=>!s.bottom).map((s,si)=><div key={si} style={{marginBottom:18}}>
          {s.label&&<div style={{padding:"0 24px 8px",fontSize:9,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",color:C.steel}}>{s.label}</div>}
          {s.items.map(it=><div key={it.id} style={{padding:"10px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontSize:13,fontWeight:page===it.id?600:400,background:page===it.id?C.steelD+"33":hover===it.id?"rgba(255,255,255,.04)":"transparent",color:page===it.id?C.white:C.steelL,borderLeft:page===it.id?`3px solid ${C.oak}`:"3px solid transparent"}} onClick={()=>{setPage(it.id);setDetail(null)}} onMouseEnter={()=>setHover(it.id)} onMouseLeave={()=>setHover(null)}><span style={{fontSize:16,width:20,textAlign:"center",opacity:.7}}>{it.icon}</span>{it.label}</div>)}
        </div>)}
        <div style={{marginTop:"auto"}}>
          {navSections.filter(s=>s.bottom).map((s,si)=><div key={`b${si}`} style={{borderTop:`1px solid ${C.steelD}33`,paddingTop:14,marginTop:14}}>
            {s.items.map(it=><div key={it.id} style={{padding:"10px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontSize:12,fontWeight:page===it.id?600:400,background:page===it.id?C.steelD+"33":hover===it.id?"rgba(255,255,255,.04)":"transparent",color:page===it.id?C.white:C.steel,borderLeft:page===it.id?`3px solid ${C.oak}`:"3px solid transparent"}} onClick={()=>{setPage(it.id);setDetail(null)}} onMouseEnter={()=>setHover(it.id)} onMouseLeave={()=>setHover(null)}><span style={{fontSize:14,width:20,textAlign:"center",opacity:.6}}>{it.icon}</span>{it.label}</div>)}
          </div>)}
        </div>
      </div>
      <div style={{padding:"16px 24px",borderTop:`1px solid ${C.steelD}33`}}><div style={{fontSize:10,color:C.steel}}>v2.9.1</div><div style={{fontSize:10,color:C.steel,marginTop:2}}>[ A frame for the business we share ]</div></div>
    </div>
    <div style={{flex:1,overflow:"auto"}}><div style={{padding:"14px 40px",background:C.white,borderBottom:`1px solid ${C.surfaceD}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:13,color:C.textS}}>{nav.find(n=>n.id===page)?.label}</div><div style={{fontSize:12,color:C.textS}}>{new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div></div>
      <div style={{padding:"32px 40px",maxWidth:1200}}>
        {page==="overview"&&<OverviewPage projects={projects} setPage={setPage} setDetail={setDetail}/>}
        {page==="projects"&&<ProjectsPage projects={projects} detail={detail} setDetail={setDetail} setPage={setPage} setExternalFolderTarget={setExternalFolderTarget}/>}
        {page==="external-folders"&&<ExternalFoldersPage initialFolderId={externalFolderTarget} onClearInitial={()=>setExternalFolderTarget(null)}/>}
        {page==="intake"&&<ProjectIntakePage/>}
        {page==="quotation"&&<QuotationPage/>}
        {page==="opening-report"&&<OpeningReportsPage/>}
        {page==="draft"&&<DraftStudioPage/>}
        {page==="toolbox"&&<ToolboxPage/>}
        {page==="roi"&&<ROIPage projects={projects}/>}
        {page==="flow"&&<FlowPage projects={projects} setPage={setPage}/>}
        {page==="installed"&&<InstalledPage projects={projects} setPage={setPage} setExternalFolderTarget={setExternalFolderTarget}/>}
        {page==="showroom-ops"&&<ShowroomOpsPage/>}
        {page==="standards"&&<StandardsPage/>}
        {page==="admin"&&<AdminPage projects={projects}/>}
      </div></div></div>}
