import { useState } from "react";
import { DownloadPill } from "../../components/ui/download-pill";
export default function DownloadPillDemo(){
 const [message,setMessage]=useState("This is a visual specimen. No mobile app is available for download.");
 return <><h1>A distinct download action.</h1><p className="lead">The source reserves its dark pill for app-download actions.</p><div className="specimen-row"><DownloadPill onClick={()=>setMessage("Preview action confirmed. No download was started.")}>Preview download action</DownloadPill><DownloadPill disabled>Coming soon</DownloadPill><DownloadPill asChild><a href="#page=overview">Linked pill example</a></DownloadPill></div><p className="caption" role="status">{message}</p></>;
}
