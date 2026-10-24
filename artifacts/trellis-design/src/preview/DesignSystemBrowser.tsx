import { Suspense,useEffect,useState } from "react";
import { groups,title } from "./registry";
import { brand } from "../brand-snapshot";
import "./preview.css";
export function DesignSystemBrowser(){
 const [page,setPage]=useState(()=>new URLSearchParams(location.hash.slice(1)).get("page")||"overview");
 const [dark,setDark]=useState(false);
 useEffect(()=>{const change=()=>setPage(new URLSearchParams(location.hash.slice(1)).get("page")||"overview");window.addEventListener("hashchange",change);return()=>window.removeEventListener("hashchange",change);},[]);
 useEffect(()=>{document.documentElement.classList.toggle("dark",dark);},[dark]);
 useEffect(()=>{document.title=`${title} · ${page}`;},[page]);
 const entry=groups.flatMap(g=>g.entries).find(e=>e.id===page)||groups[0].entries[0];
 const Page=entry.component;
 return <div className="browser"><aside><a className="wordmark" href="#page=overview">{brand.name}<span>Design system</span></a><div className="source-note">VENMO-DERIVED / APP-READY</div><nav aria-label="Design system">{groups.map(g=><section key={g.name}><p className="nav-heading">{g.name}</p>{g.entries.map(e=><a key={e.id} href={`#page=${e.id}`} aria-current={entry.id===e.id?"page":undefined}>{e.name}</a>)}</section>)}</nav><button className="theme-toggle" onClick={()=>setDark(!dark)} aria-pressed={dark}>{dark?"Switch to light":"Explore dark theme"}</button><p className="caption">Dark theme is derived.<br/>First component review.</p></aside><main><header className="page-header"><span>{entry.name}</span><span>FOUNDATION / 01</span></header><Suspense fallback={<p>Loading component…</p>}><Page/></Suspense><footer>Designed for shared money. Built to stay consistent.</footer></main></div>;
}
