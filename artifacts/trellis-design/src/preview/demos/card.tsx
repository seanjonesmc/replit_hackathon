import { Card,CardHeader,CardTitle,CardDescription,CardContent,CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Link } from "../../components/ui/link";
import { Badge } from "../../components/ui/badge";
export default function CardDemo(){return <><h1>Room for what matters.</h1><p className="lead">Four surfaces. One family of cards. No shadows, no unnecessary decoration.</p><div className="card-gallery">
 <Card variant="hero"><CardHeader><p className="eyebrow">Signature surface</p><CardTitle>Made for together.</CardTitle><CardDescription>Lime marks money: balances and the card. Text on it is lime ink.</CardDescription></CardHeader><CardContent>Money card · illustration-free specimen</CardContent></Card>
 <Card><CardHeader><Badge>Product tile</Badge><CardTitle>A clear next step.</CardTitle><CardDescription>White surface, a hairline border, and generous corners.</CardDescription></CardHeader><CardContent>Use a single idea per card. Keep the supporting copy short.</CardContent><CardFooter><Button asChild><a href="#page=buttons">Explore buttons</a></Button></CardFooter></Card>
 <Card variant="photography"><CardHeader><CardTitle>People come first.</CardTitle></CardHeader><CardContent><div className="media-slot">Photography slot · bring your own image</div><p>Photo-led cards leave room for real people and their stories.</p></CardContent><CardFooter><Link variant="inline" href="#page=layout">Composition guidelines</Link></CardFooter></Card>
 <Card variant="feature"><CardHeader><Badge>A little context</Badge><CardTitle>Helpful, not loud.</CardTitle><CardDescription>A pale lime surface for a supporting idea.</CardDescription></CardHeader><CardContent>Keep useful details nearby without competing with the main action.</CardContent></Card>
 </div><p className="caption">The signature card uses lime-ink text for accessible contrast; white text is never used on lime. All content is illustrative.</p></>;}
