import { lazy, type ComponentType } from "react";
import { Overview, Colors, Fonts, Layout } from "./foundations";
import { brand } from "../brand-snapshot";
const demo=(name:"ButtonDemo"|"HeaderDemo"|"NavigationDemo"|"LinkDemo"|"HeroDemo")=>lazy(()=>import("./demos/pilot").then(m=>({default:m[name]})));
export const title=`${brand.name} Design System`;
export const groups: {name:string;entries:{id:string;name:string;component:ComponentType}[]}[]=[
 {name:"Foundations",entries:[{id:"overview",name:"Overview",component:Overview},{id:"colors",name:"Colors",component:Colors},{id:"fonts",name:"Typography",component:Fonts},{id:"layout",name:"Layout & principles",component:Layout}]},
 {name:"Components · first review",entries:[{id:"header",name:"Header gradient",component:demo("HeaderDemo")},{id:"navigation",name:"Top navigation",component:demo("NavigationDemo")},{id:"links",name:"Links",component:demo("LinkDemo")},{id:"buttons",name:"Buttons",component:demo("ButtonDemo")},{id:"hero",name:"Hero bands",component:demo("HeroDemo")}]}
];
