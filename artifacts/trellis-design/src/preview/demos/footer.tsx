import { Footer } from "../../components/ui/footer";
import { Link } from "../../components/ui/link";
import { brand } from "../../brand-snapshot";
export default function FooterDemo(){return <><h1>A thoughtful ending.</h1><p className="lead">Muted text, a quiet divider, and helpful links. No borrowed financial claims.</p><Footer><strong>{brand.name}</strong><p>{brand.tagline}</p><nav aria-label="Example footer" className="specimen-row"><Link variant="footer" href="#page=colors">Our colors</Link><Link variant="footer" href="#page=fonts">Typography</Link><Link variant="footer" href="#page=layout">Design principles</Link></nav><p className="caption">Component specimen only. No banking or card service is provided by this preview.</p></Footer></>;}
