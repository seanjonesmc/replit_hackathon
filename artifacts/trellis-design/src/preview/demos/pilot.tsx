import { useState } from "react";
import { Button } from "../../components/ui/button";
import { HeaderGradient } from "../../components/ui/header-gradient";
import { TopNav } from "../../components/ui/top-nav";
import { Link } from "../../components/ui/link";
import { HeroBand } from "../../components/ui/hero-band";
import { brand } from "../../brand-snapshot";
export function ButtonDemo() {
 const [count,setCount]=useState(0);
 return <><div className="specimen-row"><Button onClick={()=>setCount(count+1)}>Try a button</Button><Button variant="outline" onClick={()=>setCount(0)}>Reset</Button><Button disabled>Disabled</Button></div><p aria-live="polite" className="caption">Preview clicks: {count}. No payment is made.</p></>;
}
export function HeaderDemo(){return <HeaderGradient>Family money, thoughtfully shared.</HeaderGradient>;}
export function NavigationDemo(){return <TopNav><strong>{brand.name}</strong><Link href="#page=buttons">Buttons</Link><Link href="#page=colors">Colors</Link></TopNav>;}
export function LinkDemo(){return <div className="specimen-row"><Link href="#page=overview">Navigation</Link><Link variant="inline" href="#page=colors">Explore colors</Link><Link variant="row" href="#page=fonts">Type scale ↗</Link><Link variant="footer" href="#page=layout">Layout guide</Link></div>;}
export function HeroDemo(){return <div><HeroBand><p className="eyebrow">Room to grow.</p><h2>Shared money.<br/>Clear intentions.</h2><p>{brand.tagline}</p></HeroBand><HeroBand tone="sand"><h3>A little guidance.<br/>A lot of possibility.</h3><p>Warm surfaces. Straightforward words. Space to breathe.</p></HeroBand></div>;}
