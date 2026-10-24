import { brand } from "../brand-snapshot";
import { ButtonDemo,HeaderDemo,NavigationDemo,LinkDemo,HeroDemo } from "./demos/pilot";
const typefaces = [...new Set([brand.fonts.heading, brand.fonts.body])].join(" + ");
export function Overview(){return <>
 <p className="eyebrow">A shared visual language</p><h1>Built for trust.<br/>Made for family.</h1>
 <p className="lead">The foundations of {brand.name}: confident blue, warm sand, and simple, human details.</p>
 <div className="palette-strip">{["primary","signature","surfaceAlt","ink"].map(k=><div key={k} style={{background:brand.colors[k as keyof typeof brand.colors]}}/>)}</div>
 <p className="caption">Explore the full catalog: <a href="#page=cards">Cards</a> · <a href="#page=badges">Badges</a> · <a href="#page=footer">Footer</a> · <a href="#page=download">Download pills</a></p><div className="section-heading"><h2>The approved foundation</h2><span className="caption">9 families · complete catalog</span></div>
 <p className="caption">Adapted from the Venmo reference. {typefaces} replaces the proprietary fonts. Dark mode is a derived theme, not part of the source.</p>
 <div className="specimen"><h3>01 / Header gradient</h3><HeaderDemo/></div>
 <div className="specimen"><h3>02 / Top navigation</h3><NavigationDemo/></div>
 <div className="specimen"><h3>03 / Links</h3><LinkDemo/></div>
 <div className="specimen"><h3>04 / Buttons</h3><ButtonDemo/></div>
 <div className="specimen"><h3>05 / Hero bands</h3><HeroDemo/></div>
 </>;}
export function Colors(){return <><h1>Color with purpose.</h1><p className="lead">Interactive blue for actions. Signature blue for atmosphere. Sand and white for structure.</p><div className="swatches">{Object.entries(brand.colors).map(([name,value])=><div key={name}><div style={{background:value}}/><strong>{name}</strong><p className="caption">{value}</p></div>)}</div><p>Decision colors are an app extension. Always pair them with an icon and a label.</p></>;}
export function Fonts(){return <><h1>Clear at every size.</h1><p className="lead">{typefaces} · 400 / 500 / 600 / 700</p>{[[63,500,1,-1.89],[51,500,1.05,-1.02],[33,500,1.05,-.67],[22,400,1.4,0],[18,400,1.4,0],[16,400,1.4,0],[14,400,1.43,0]].map(([size,weight,line,spacing])=><div className="specimen" key={size}><p className="caption">{size}px / {weight} · line height {line}</p><p style={{fontSize:size,fontWeight:weight,lineHeight:line,letterSpacing:spacing}}>Family money, with guardrails.</p></div>)}<p className="money">Tabular money: $1,234.56</p></>;}
export function Layout(){return <><h1>Less decoration.<br/>More clarity.</h1><div className="specimen"><h2>Geometry</h2><p>Buttons: 1000px radius, 48px height, 12px × 34px padding.</p><p>Cards: 32px. Small cards: 24px. Inputs: 8px. Tags: 4px.</p><p>Spacing: 4 · 8 · 12 · 16 · 24 · 32 · 48px.</p></div><h2>Design guidelines</h2><ul className="guidelines"><li>Use signature blue for atmospheric headers and hero cards, never button fills.</li><li>Use darker interactive blue for primary actions, with its documented hover step.</li><li>Switch white and sand surfaces at hard edges. Avoid decorative shadows.</li><li>Keep headings medium-weight with negative letter spacing.</li><li>Use short, friendly sentences and tabular numbers for money.</li><li>Center app screens at 430px on desktop; this documentation browser is wider.</li><li>Use 150–250ms transitions and honor reduced motion.</li></ul></>;}
