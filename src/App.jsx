import { useState, useRef, useEffect } from "react";

/* ── Helpers ── */
const ago=d=>{const x=new Date();x.setDate(x.getDate()-d);return x.toISOString().split("T")[0];};
const fmtDate=s=>{try{return new Date(s).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});}catch{return s||"—";}};
const parseAmt=s=>parseInt((s||"0").replace(/[^0-9]/g,""))||0;
const fmtCurr=n=>`₹${n.toLocaleString("en-IN")}`;
const rIcon=r=>({Groomer:"✂️",Trainer:"🎓",Vet:"🏥",Admin:"🛡️"})[r]||"👤";
const sColor=s=>({completed:"bg-green-100 text-green-700",upcoming:"bg-blue-100 text-blue-700",ongoing:"bg-orange-100 text-orange-700",pending:"bg-yellow-100 text-yellow-700",approved:"bg-green-100 text-green-700",rejected:"bg-red-100 text-red-700",active:"bg-green-100 text-green-700",suspended:"bg-red-100 text-red-700"})[s]||"bg-gray-100 text-gray-600";

/* ═══════════════════════════════════════════════
   PROFESSIONAL DATABASE — each phone = unique pro
═══════════════════════════════════════════════ */
const PRO_DB={
  /* ── GROOMER 1: Arjun Mehta, Mumbai (Verified) ── */
  "9999999999":{role:"professional",subRole:"Groomer",isNew:false,verified:true,idStatus:"approved",
    profile:{name:"Arjun Mehta",email:"arjun.mehta@gmail.com",phone:"9999999999",city:"Mumbai",area:"Andheri West",address:"Flat 12B, Lokhandwala, Andheri West, Mumbai – 400058",since:"Mar 2022",avatar:"🧔",gender:"Male",dob:"1992-05-14",bio:"8+ years professional grooming. Specialist in Labrador, Golden Retriever & breed-specific cuts. IGPA certified.",experience:"8+ years",services:["Full Groom","Basic Groom","Spa Premium","De-shedding","Herbal Bath","Tick & Flea Bath"],serviceAreas:"Andheri, Juhu, Versova, Malad, Kandivali",priceBasic:"599",priceFull:"999",priceCustom:"1499",idType:"Aadhaar",idNum:"XXXX XXXX 3892",payoutType:"UPI",upiId:"arjun@gpay",langs:"Hindi, English, Marathi"},
    stats:{rating:4.9,reviews:312,sessions:312,thisMonth:18450,total:245800,cancelRate:"2%"},
    docs:{front:"aadhaar_front.jpg",back:"aadhaar_back.jpg",selfie:"selfie_arjun.jpg"},
    bookings:[
      {id:"b1",customer:"Rahul Sharma",pet:"Bruno (Lab)",svc:"Full Groom",date:ago(1),time:"10:00 AM",amt:"₹999",status:"completed",addr:"Andheri West",rating:5,chat:3},
      {id:"b2",customer:"Anita K.",pet:"Max (Beagle)",svc:"Basic Groom",date:"Today",time:"2:30 PM",amt:"₹599",status:"upcoming",addr:"Juhu",rating:null,chat:1},
      {id:"b3",customer:"Priya M.",pet:"Charlie (Pug)",svc:"Spa Premium",date:"Today",time:"4:00 PM",amt:"₹1,499",status:"upcoming",addr:"Versova",rating:null,chat:0},
      {id:"b4",customer:"Rahul M.",pet:"Rocky (GSD)",svc:"Full Groom",date:ago(3),time:"11:00 AM",amt:"₹999",status:"completed",addr:"Kandivali",rating:5,chat:0},
      {id:"b5",customer:"Sneha P.",pet:"Bella (Pom)",svc:"Basic Groom",date:ago(5),time:"3:00 PM",amt:"₹499",status:"completed",addr:"Borivali",rating:4,chat:0},
      {id:"b6",customer:"Kavya S.",pet:"Coco (Shih Tzu)",svc:"Herbal Bath",date:ago(8),time:"12:00 PM",amt:"₹699",status:"completed",addr:"Goregaon",rating:5,chat:2},
    ]},
  /* ── GROOMER 2: Sunita Rao, Mumbai (Pending Verify) ── */
  "9876500001":{role:"professional",subRole:"Groomer",isNew:false,verified:false,idStatus:"pending",
    profile:{name:"Sunita Rao",email:"sunita.rao@gmail.com",phone:"9876500001",city:"Mumbai",area:"Bandra West",address:"16th Road, Bandra West, Mumbai – 400050",since:"May 2025",avatar:"👩",gender:"Female",dob:"1995-08-22",bio:"4 years grooming experience. Specialist in cats and small breeds. Gentle, calm approach with anxious pets.",experience:"4 years",services:["Full Groom","Basic Groom","Cat Grooming","Nail Trim"],serviceAreas:"Bandra, Khar, Santacruz, Kurla",priceBasic:"499",priceFull:"799",priceCustom:"1199",idType:"Aadhaar",idNum:"XXXX XXXX 7234",payoutType:"UPI",upiId:"sunita@paytm",langs:"Hindi, English, Tamil"},
    stats:{rating:0,reviews:0,sessions:0,thisMonth:0,total:0,cancelRate:"—"},
    docs:{front:"aadhaar_sunita_front.jpg",back:null,selfie:"selfie_sunita.jpg"},
    bookings:[]},
  /* ── TRAINER 1: Priya Sharma, Delhi (Verified) ── */
  "8888888888":{role:"professional",subRole:"Trainer",isNew:false,verified:true,idStatus:"approved",
    profile:{name:"Priya Sharma",email:"priya.sharma@gmail.com",phone:"8888888888",city:"Delhi",area:"Hauz Khas",address:"Hauz Khas Village, South Delhi – 110016",since:"Jan 2021",avatar:"👩",gender:"Female",dob:"1990-11-03",bio:"Certified dog trainer, 6+ years. Positive reinforcement specialist. CPDT-KA certified. Expert in behaviour correction & puppy training.",experience:"6+ years",services:["Puppy Basics","Basic Obedience","Advanced Obedience","Agility","Behaviour Correction","Leash Training"],serviceAreas:"South Delhi, Saket, Vasant Kunj, Dwarka, Gurugram",priceBasic:"800",priceFull:"1200",priceCustom:"1500",idType:"Passport",idNum:"P2034567",payoutType:"Bank",accountNum:"XXXX1234",ifsc:"HDFC0001234",accountName:"Priya Sharma",langs:"Hindi, English, Punjabi"},
    stats:{rating:5.0,reviews:198,sessions:198,thisMonth:14400,total:158400,cancelRate:"1%"},
    docs:{front:"passport_priya.jpg",back:null,selfie:"selfie_priya.jpg"},
    bookings:[
      {id:"b1",customer:"Sneha Patel",pet:"Simba (GR)",svc:"Advanced Obedience",date:ago(2),time:"9:00 AM",amt:"₹1,200",status:"completed",addr:"Saket",rating:5,chat:2},
      {id:"b2",customer:"Arun K.",pet:"Tiger (GSD)",svc:"Behaviour Correction",date:"Today",time:"11:00 AM",amt:"₹1,500",status:"upcoming",addr:"Vasant Kunj",rating:null,chat:4},
      {id:"b3",customer:"Meena R.",pet:"Coco (Beagle)",svc:"Puppy Basics",date:ago(4),time:"3:00 PM",amt:"₹800",status:"completed",addr:"Hauz Khas",rating:5,chat:0},
      {id:"b4",customer:"Raj K.",pet:"Max (Lab)",svc:"Basic Obedience",date:ago(7),time:"10:00 AM",amt:"₹900",status:"completed",addr:"Saket",rating:5,chat:1},
      {id:"b5",customer:"Pooja M.",pet:"Daisy (Poodle)",svc:"Agility Training",date:ago(10),time:"8:00 AM",amt:"₹1,200",status:"completed",addr:"Gurugram",rating:5,chat:0},
    ]},
  /* ── TRAINER 2: Vikram Nair, Pune (New → Onboarding) ── */
  "8800001111":{role:"professional",subRole:"Trainer",isNew:true,verified:false,idStatus:"not_submitted",
    profile:{name:"",email:"",phone:"8800001111",city:"",area:"",address:"",since:"",avatar:"👨"},
    stats:{rating:0,reviews:0,sessions:0,thisMonth:0,total:0},
    docs:{front:null,back:null,selfie:null},bookings:[]},
  /* ── VET 1: Dr. Kavitha R., Bengaluru (Verified) ── */
  "7777777777":{role:"professional",subRole:"Vet",isNew:false,verified:true,idStatus:"approved",
    profile:{name:"Dr. Kavitha R.",email:"kavitha.vet@gmail.com",phone:"7777777777",city:"Bengaluru",area:"Indiranagar",address:"12th Main, Indiranagar, Bengaluru – 560038",since:"Feb 2020",avatar:"👩‍⚕️",gender:"Female",dob:"1985-03-17",bio:"BVSc & AH, MVSc – Small Animal Medicine. 12+ yrs clinical experience. Specialised in oncology, emergency & critical care.",experience:"12+ years",services:["General Check-up","Vaccination","Deworming","Dental Care","Surgery","Emergency Care","Nutrition Consult"],serviceAreas:"Indiranagar, Koramangala, HSR Layout, Whitefield, Marathahalli",priceBasic:"350",priceFull:"800",priceCustom:"1200",idType:"Aadhaar",idNum:"XXXX XXXX 5612",payoutType:"UPI",upiId:"kavitha@gpay",langs:"Kannada, English, Hindi, Tamil"},
    stats:{rating:4.8,reviews:423,sessions:423,thisMonth:21000,total:312500,cancelRate:"0.5%"},
    docs:{front:"aadhaar_kavitha_f.jpg",back:"aadhaar_kavitha_b.jpg",selfie:"selfie_kavitha.jpg"},
    bookings:[
      {id:"b1",customer:"Rahul Sharma",pet:"Bruno (Lab)",svc:"Vaccination – Rabies",date:ago(1),time:"11:00 AM",amt:"₹450",status:"completed",addr:"Home visit",rating:5,chat:1},
      {id:"b2",customer:"Sneha Patel",pet:"Simba (GR)",svc:"Routine Check-up",date:"Today",time:"3:00 PM",amt:"₹350",status:"upcoming",addr:"Clinic",rating:null,chat:2},
      {id:"b3",customer:"Vikram Rao",pet:"Max (GSD)",svc:"Deworming",date:ago(3),time:"10:00 AM",amt:"₹250",status:"completed",addr:"Clinic",rating:4,chat:0},
      {id:"b4",customer:"Anita K.",pet:"Mochi (Persian)",svc:"Dental Scaling",date:ago(5),time:"2:00 PM",amt:"₹800",status:"completed",addr:"Clinic",rating:5,chat:0},
      {id:"b5",customer:"Deepak M.",pet:"Fluffy (Pom)",svc:"Emergency Care",date:ago(8),time:"8:00 PM",amt:"₹1,200",status:"completed",addr:"Home visit",rating:5,chat:6},
    ]},
  /* ── VET 2: Dr. Anil Verma, Mumbai (New → Onboarding) ── */
  "7700001111":{role:"professional",subRole:"Vet",isNew:true,verified:false,idStatus:"not_submitted",
    profile:{name:"",email:"",phone:"7700001111",city:"",area:"",address:"",since:"",avatar:"👨‍⚕️"},
    stats:{rating:0,reviews:0,sessions:0,thisMonth:0,total:0},
    docs:{front:null,back:null,selfie:null},bookings:[]},
  /* ── ADMIN ── */
  "0000000000":{role:"admin",
    profile:{name:"Admin Kumar",email:"admin@petclub.in",phone:"0000000000",avatar:"🛡️",city:"Mumbai"}}
};

/* Derive lists for admin */
const ALL_PROS=Object.entries(PRO_DB).filter(([,v])=>v.role==="professional").map(([ph,v])=>({ph,...v.profile,subRole:v.subRole,verified:v.verified,idStatus:v.idStatus,stats:v.stats,docs:v.docs}));
const MOCK_CUSTOMERS=[
  {ph:"9876543210",name:"Rahul Sharma",role:"Customer",city:"Mumbai",since:"Jan 2023",extra:"2 Pets",status:"active"},
  {ph:"9123456789",name:"Sneha Patel",role:"Customer",city:"Bengaluru",since:"Mar 2023",extra:"2 Pets",status:"active"},
  {ph:"9988776655",name:"Vikram Rao",role:"Customer",city:"Delhi",since:"Jun 2024",extra:"1 Pet",status:"active"},
  {ph:"9870001111",name:"Anita Krishnan",role:"Customer",city:"Chennai",since:"Aug 2023",extra:"1 Pet",status:"active"},
];
const ALL_BOOKINGS=[
  ...PRO_DB["9999999999"].bookings.map(b=>({...b,pro:"Arjun Mehta",proRole:"Groomer",city:"Mumbai"})),
  ...PRO_DB["8888888888"].bookings.map(b=>({...b,pro:"Priya Sharma",proRole:"Trainer",city:"Delhi"})),
  ...PRO_DB["7777777777"].bookings.map(b=>({...b,pro:"Dr. Kavitha R.",proRole:"Vet",city:"Bengaluru"})),
].sort((a,b)=>(a.date==="Today"?-1:b.date==="Today"?1:new Date(b.date)-new Date(a.date)));

const SVC_OPTS={Groomer:["Bath & Brush","Nail Trim","Haircut","De-shedding","Herbal Bath","Spa Treatment","Tick & Flea Bath"],Trainer:["Puppy Basics","Basic Obedience","Advanced Obedience","Agility","Behaviour Correction","Leash Training"],Vet:["General Check-up","Vaccination","Deworming","Dental Care","Surgery","Emergency Care","Nutrition Consult"]};

/* ── Shared UI ── */
const PawLogo=({sz=40})=>(
  <svg width={sz} height={sz} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="40" r="18" fill="#f97316"/>
    <ellipse cx="20" cy="20" rx="6" ry="8" fill="#f97316" transform="rotate(-20 20 20)"/>
    <ellipse cx="44" cy="20" rx="6" ry="8" fill="#f97316" transform="rotate(20 44 20)"/>
    <ellipse cx="10" cy="34" rx="5" ry="7" fill="#f97316" transform="rotate(-30 10 34)"/>
    <ellipse cx="54" cy="34" rx="5" ry="7" fill="#f97316" transform="rotate(30 54 34)"/>
    <ellipse cx="24" cy="44" rx="4" ry="5" fill="white" opacity="0.9"/>
    <ellipse cx="32" cy="47" rx="4" ry="5" fill="white" opacity="0.9"/>
    <ellipse cx="40" cy="44" rx="4" ry="5" fill="white" opacity="0.9"/>
    <ellipse cx="28" cy="38" rx="7" ry="8" fill="white" opacity="0.9"/>
    <ellipse cx="36" cy="38" rx="7" ry="8" fill="white" opacity="0.9"/>
  </svg>
);
const Bdg=({text,cls})=><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{text}</span>;
const Modal=({title,onClose,children})=>(
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between p-5 border-b"><h3 className="font-bold text-gray-800 text-lg">{title}</h3><button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">×</button></div>
      <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);
const Inp=p=><input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" {...p}/>;
const Sel=({opts,...p})=><select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" {...p}>{opts.map(o=><option key={o}>{o}</option>)}</select>;
const Txta=p=><textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none" rows={3} {...p}/>;
const Fld=({label,children})=><div className="mb-3"><label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>{children}</div>;

const FileUpload=({label,file,onFile})=>{
  const ref=useRef();
  return(
    <div onClick={()=>ref.current.click()} className={`border-2 border-dashed rounded-xl p-4 cursor-pointer transition text-center ${file?"border-green-400 bg-green-50":"border-gray-200 hover:border-orange-400 bg-gray-50"}`}>
      <input ref={ref} type="file" className="hidden" accept="image/*,.pdf" onChange={e=>{const f=e.target.files[0];if(f)onFile(f.name);}}/>
      {file?<><div className="text-2xl mb-1">✅</div><div className="text-xs font-semibold text-green-700 truncate px-2">{file}</div><div className="text-xs text-green-500">Uploaded</div></>:<><div className="text-2xl mb-1">📎</div><div className="text-xs font-semibold text-gray-500">{label}</div><div className="text-xs text-gray-400 mt-0.5">Tap to select</div></>}
    </div>
  );
};

/* ══════════════════════════════════════════════
   LOGIN SCREEN
══════════════════════════════════════════════ */
const LoginScreen=({onLogin})=>{
  const [phone,setPhone]=useState("");
  const [otp,setOtp]=useState(["","","","","",""]);
  const [step,setStep]=useState("phone");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [timer,setTimer]=useState(30);
  const refs=useRef([]);

  useEffect(()=>{if(step==="otp"){refs.current[0]?.focus();const t=setInterval(()=>setTimer(r=>r>0?r-1:0),1000);return()=>clearInterval(t);}},[step]);

  const sendOTP=()=>{
    const c=phone.replace(/\D/g,"");
    if(c.length!==10){setErr("Enter valid 10-digit number");return;}
    if(!PRO_DB[c]){setErr("Not registered. Try a demo number.");return;}
    setErr("");setLoading(true);
    setTimeout(()=>{setLoading(false);setStep("otp");setTimer(30);},1000);
  };
  const verify=()=>{
    if(otp.join("")!=="123456"){setErr("Wrong OTP. Use 123456");setOtp(["","","","","",""]);refs.current[0]?.focus();return;}
    setLoading(true);setTimeout(()=>onLogin(phone.replace(/\D/g,"")),700);
  };
  const handleOtp=(i,v)=>{if(!/^\d*$/.test(v))return;setErr("");const n=[...otp];n[i]=v.slice(-1);setOtp(n);if(v&&i<5)refs.current[i+1]?.focus();};

  const demoGroups=[
    {label:"✂️ Groomers",color:"bg-orange-50 border-orange-200",demos:[{ph:"9999999999",name:"Arjun Mehta",sub:"Mumbai · Verified · 4.9★",badge:"✅"},{ph:"9876500001",name:"Sunita Rao",sub:"Mumbai · Pending Verification",badge:"⏳"}]},
    {label:"🎓 Trainers",color:"bg-blue-50 border-blue-200",demos:[{ph:"8888888888",name:"Priya Sharma",sub:"Delhi · Verified · 5.0★",badge:"✅"},{ph:"8800001111",name:"New Trainer",sub:"Pune · New → Onboarding flow",badge:"🆕"}]},
    {label:"🏥 Vets",color:"bg-red-50 border-red-200",demos:[{ph:"7777777777",name:"Dr. Kavitha R.",sub:"Bengaluru · Verified · 4.8★",badge:"✅"},{ph:"7700001111",name:"New Vet",sub:"Mumbai · New → Onboarding flow",badge:"🆕"}]},
    {label:"🛡️ Admin",color:"bg-gray-50 border-gray-200",demos:[{ph:"0000000000",name:"Admin Kumar",sub:"Super Admin — manage all data",badge:"🛡️"}]},
  ];

  return(
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col">
      <div className="h-2 bg-gradient-to-r from-orange-400 to-amber-500"/>
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="flex flex-col items-center mb-6">
          <PawLogo sz={56}/>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-3">PET<span className="text-orange-500">club</span></h1>
          <p className="text-gray-400 text-sm mt-1">Professional & Admin Portal 🇮🇳</p>
        </div>
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 mb-5">
          {step==="phone"?(
            <>
              <h2 className="text-xl font-extrabold text-gray-800 mb-1">Professional Login 👋</h2>
              <p className="text-gray-400 text-sm mb-4">Enter your registered mobile number</p>
              <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden mb-2 focus-within:border-orange-400 transition">
                <div className="flex items-center gap-1.5 px-3 py-3 bg-gray-50 border-r border-gray-200"><span>🇮🇳</span><span className="text-sm font-semibold text-gray-600">+91</span></div>
                <input type="tel" maxLength={10} value={phone} placeholder="Enter mobile number"
                  onChange={e=>{setErr("");setPhone(e.target.value.replace(/\D/g,""));}}
                  onKeyDown={e=>e.key==="Enter"&&sendOTP()}
                  className="flex-1 px-3 py-3 text-base font-medium focus:outline-none tracking-widest"/>
              </div>
              {err&&<p className="text-red-500 text-xs mb-2">{err}</p>}
              <button onClick={sendOTP} disabled={loading} className="w-full mt-2 bg-orange-500 text-white font-bold py-3.5 rounded-2xl hover:bg-orange-600 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {loading?<><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/><span>Sending OTP…</span></>:"Get OTP →"}
              </button>
            </>
          ):(
            <>
              <button onClick={()=>{setStep("phone");setOtp(["","","","","",""]);}} className="text-sm text-orange-500 font-semibold mb-4 flex items-center gap-1">← +91 {phone}</button>
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">📱</div>
                <h2 className="text-xl font-extrabold text-gray-800">Enter OTP</h2>
                <p className="text-xs text-gray-400 mt-1">Sent to +91 {phone}</p>
              </div>
              <div className="flex gap-2 justify-center mb-2">
                {otp.map((d,i)=>(
                  <input key={i} ref={el=>refs.current[i]=el} type="tel" maxLength={1} value={d}
                    onChange={e=>handleOtp(i,e.target.value)}
                    onKeyDown={e=>{if(e.key==="Backspace"&&!d&&i>0)refs.current[i-1]?.focus();}}
                    className={`w-11 h-12 text-center text-xl font-extrabold rounded-xl border-2 focus:outline-none transition ${d?"border-orange-400 bg-orange-50 text-orange-600":"border-gray-200"} ${err?"border-red-400":""}`}/>
                ))}
              </div>
              {err&&<p className="text-red-500 text-xs text-center mb-2">{err}</p>}
              <div className="text-center text-xs text-gray-400 mb-3">
                {timer>0?<span>Resend in <strong className="text-orange-500">{timer}s</strong></span>:<button onClick={()=>{setOtp(["","","","","",""]);setTimer(30);refs.current[0]?.focus();}} className="text-orange-500 font-bold">Resend OTP</button>}
              </div>
              <button onClick={verify} disabled={otp.join("").length<6} className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition">Verify & Login 🐾</button>
            </>
          )}
        </div>

        {/* Demo accounts grouped by role */}
        <div className="w-full max-w-sm space-y-3">
          <p className="text-xs font-bold text-gray-500 text-center">Demo Accounts — OTP: <span className="text-orange-500 font-extrabold">123456</span></p>
          {demoGroups.map(g=>(
            <div key={g.label} className={`border rounded-2xl p-3 ${g.color}`}>
              <div className="text-xs font-bold text-gray-600 mb-2">{g.label}</div>
              {g.demos.map(d=>(
                <button key={d.ph} onClick={()=>{setPhone(d.ph);setErr("");setStep("phone");}}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-white hover:shadow-sm transition text-left mb-1 last:mb-0">
                  <span className="text-lg">{d.badge}</span>
                  <div className="flex-1 min-w-0"><div className="text-sm font-bold text-gray-800">{d.name}</div><div className="text-xs text-gray-400 truncate">{d.sub}</div></div>
                  <code className="text-xs text-orange-500 font-bold shrink-0">{d.ph}</code>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   PROFESSIONAL ONBOARDING (4 steps)
══════════════════════════════════════════════ */
const ProfessionalOnboarding=({proData,onComplete})=>{
  const phone=proData.profile.phone;
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({role:proData.subRole||"Groomer",name:"",email:"",dob:"",gender:"Male",address:"",area:"",city:"",pincode:"",services:[],experience:"",bio:"",serviceAreas:"",langs:"",priceA:"",priceB:"",priceC:"",idType:"Aadhaar",idNum:"",docFront:null,docBack:null,docSelfie:null,payoutType:"UPI",upiId:"",accountName:"",accountNum:"",ifsc:""});
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const sv=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleSvc=s=>sv("services",form.services.includes(s)?form.services.filter(x=>x!==s):[...form.services,s]);
  const STEPS=["Basic Info","Professional","ID Verify","Bank & Review"];
  const canNext=[!!(form.name&&form.email&&form.city),!!(form.services.length>0&&form.experience&&form.bio),!!(form.idNum&&form.docFront&&form.docSelfie),!!(form.payoutType==="UPI"?form.upiId:form.accountNum&&form.ifsc)];

  return(
    <div className="min-h-screen bg-gray-50">
      <div className="h-2 bg-gradient-to-r from-orange-400 to-amber-500"/>
      <div className="bg-white border-b px-5 py-3 flex items-center gap-3">
        <PawLogo sz={28}/><div><span className="font-extrabold text-orange-500 text-base">PETclub</span><span className="text-xs text-gray-400 ml-2">Professional Registration</span></div>
      </div>
      {/* Stepper */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center max-w-xl mx-auto">
          {STEPS.map((s,i)=>(
            <div key={s} className="flex-1 flex flex-col items-center relative">
              {i<STEPS.length-1&&<div className={`absolute top-3.5 left-1/2 w-full h-0.5 z-0 ${i<step-1?"bg-orange-400":"bg-gray-200"}`}/>}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition ${i<step-1?"bg-orange-500 text-white":i===step-1?"bg-orange-100 border-2 border-orange-400 text-orange-600":"bg-gray-100 text-gray-400"}`}>{i<step-1?"✓":i+1}</div>
              <span className={`text-xs mt-1 hidden sm:block ${i===step-1?"text-orange-600 font-semibold":"text-gray-400"}`}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 py-6">
        {step===1&&(
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Basic Information</h2>
            <p className="text-sm text-gray-400 mb-5">Personal details as per government ID</p>
            <Fld label="I am registering as *"><Sel opts={["Groomer","Trainer","Vet"]} value={form.role} onChange={e=>{sf("role")(e);sv("services",[]);}}/></Fld>
            <Fld label="Full Name * (as per ID)"><Inp placeholder="e.g. Arjun Kumar Mehta" value={form.name} onChange={sf("name")}/></Fld>
            <Fld label="Email Address *"><Inp type="email" placeholder="you@gmail.com" value={form.email} onChange={sf("email")}/></Fld>
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Date of Birth"><Inp type="date" value={form.dob} onChange={sf("dob")}/></Fld>
              <Fld label="Gender"><Sel opts={["Male","Female","Other"]} value={form.gender} onChange={sf("gender")}/></Fld>
            </div>
            <Fld label="Registered Mobile">
              <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                <span className="px-3 py-2.5 border-r text-sm text-gray-500">🇮🇳 +91</span>
                <span className="px-3 py-2.5 text-sm font-medium text-gray-700 tracking-widest">{phone}</span>
              </div>
            </Fld>
            <Fld label="Full Address *"><Txta placeholder="House/Flat No., Street, Locality" value={form.address} onChange={sf("address")} rows={2}/></Fld>
            <div className="grid grid-cols-3 gap-2">
              <Fld label="Area"><Inp placeholder="Andheri" value={form.area} onChange={sf("area")}/></Fld>
              <Fld label="City *"><Inp placeholder="Mumbai" value={form.city} onChange={sf("city")}/></Fld>
              <Fld label="PIN Code"><Inp placeholder="400053" maxLength={6} value={form.pincode} onChange={sf("pincode")}/></Fld>
            </div>
          </div>
        )}

        {step===2&&(
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Professional Details</h2>
            <p className="text-sm text-gray-400 mb-5">Your expertise, services & pricing</p>
            <Fld label={`Services as ${form.role} *`}>
              <div className="flex flex-wrap gap-2 mt-1">
                {(SVC_OPTS[form.role]||[]).map(s=>(
                  <button key={s} onClick={()=>toggleSvc(s)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${form.services.includes(s)?"bg-orange-500 text-white border-orange-500":"border-gray-200 text-gray-600 hover:border-orange-300"}`}>{s}</button>
                ))}
              </div>
            </Fld>
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Experience *"><Sel opts={["<1 year","1–2 years","2–5 years","5–8 years","8+ years"]} value={form.experience} onChange={sf("experience")}/></Fld>
              <Fld label="Languages"><Inp placeholder="Hindi, English" value={form.langs} onChange={sf("langs")}/></Fld>
            </div>
            <Fld label="Short Bio *"><Txta placeholder="Tell pet parents about your experience, certifications, approach…" value={form.bio} onChange={sf("bio")} rows={4}/></Fld>
            <Fld label="Service Areas"><Inp placeholder="e.g. Andheri, Juhu, Versova, Malad" value={form.serviceAreas} onChange={sf("serviceAreas")}/></Fld>
            <div className="text-xs font-semibold text-gray-500 mb-2 mt-2">Pricing (₹ per session)</div>
            {form.role==="Groomer"&&<div className="grid grid-cols-3 gap-2"><Fld label="Basic"><Inp type="number" placeholder="599" value={form.priceA} onChange={sf("priceA")}/></Fld><Fld label="Full Groom"><Inp type="number" placeholder="999" value={form.priceB} onChange={sf("priceB")}/></Fld><Fld label="Premium"><Inp type="number" placeholder="1499" value={form.priceC} onChange={sf("priceC")}/></Fld></div>}
            {form.role!=="Groomer"&&<Fld label="Per Session / Consultation (₹)"><Inp type="number" placeholder={form.role==="Vet"?"350":"800"} value={form.priceA} onChange={sf("priceA")}/></Fld>}
          </div>
        )}

        {step===3&&(
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Identity Verification</h2>
            <p className="text-sm text-gray-400 mb-5">Mandatory for background check. Documents are 256-bit encrypted.</p>
            <Fld label="Select ID Type *">
              <div className="flex gap-2">
                {["Aadhaar","Passport","Driving License"].map(t=>(
                  <button key={t} onClick={()=>sv("idType",t)} className={`flex-1 text-xs font-semibold py-2.5 rounded-xl border transition ${form.idType===t?"bg-orange-500 text-white border-orange-500":"border-gray-200 text-gray-600"}`}>{t}</button>
                ))}
              </div>
            </Fld>
            <Fld label={`${form.idType} Number *`}>
              <Inp placeholder={form.idType==="Aadhaar"?"XXXX XXXX XXXX":form.idType==="Passport"?"A1234567":"MH-XX-XXXX-XXXXXXX"} value={form.idNum} onChange={sf("idNum")}/>
            </Fld>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Fld label={`${form.idType} Front *`}><FileUpload label="Upload Front" file={form.docFront} onFile={v=>sv("docFront",v)}/></Fld>
              <Fld label={`${form.idType} Back`}><FileUpload label="Upload Back" file={form.docBack} onFile={v=>sv("docBack",v)}/></Fld>
            </div>
            <Fld label="Selfie holding ID document *"><FileUpload label="Upload Selfie with ID" file={form.docSelfie} onFile={v=>sv("docSelfie",v)}/></Fld>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 mt-3 space-y-1">
              <div className="font-bold">📋 Upload Requirements</div>
              <div>• Clear, well-lit photos — all 4 corners must be visible</div>
              <div>• Selfie: your face AND ID clearly visible together</div>
              <div>• JPG, PNG or PDF · Max 5 MB each</div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700 mt-2">🔒 End-to-end encrypted. Reviewed only by PETclub compliance team.</div>
          </div>
        )}

        {step===4&&(
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-extrabold text-gray-800 mb-1">Payout Details</h2>
              <p className="text-sm text-gray-400 mb-4">How should we send your earnings?</p>
              <div className="flex gap-2 mb-4">
                {["UPI","Bank Account"].map(t=>(
                  <button key={t} onClick={()=>sv("payoutType",t)} className={`flex-1 text-sm font-bold py-2.5 rounded-xl border transition ${form.payoutType===t?"bg-orange-500 text-white border-orange-500":"border-gray-200 text-gray-600"}`}>{t}</button>
                ))}
              </div>
              {form.payoutType==="UPI"?<Fld label="UPI ID *"><Inp placeholder="yourname@gpay / @paytm" value={form.upiId} onChange={sf("upiId")}/></Fld>:<><Fld label="Account Holder Name *"><Inp placeholder="Full legal name" value={form.accountName} onChange={sf("accountName")}/></Fld><Fld label="Account Number *"><Inp placeholder="XXXXXXXXXXXX" value={form.accountNum} onChange={sf("accountNum")}/></Fld><Fld label="IFSC Code *"><Inp placeholder="SBIN0000123" value={form.ifsc} onChange={sf("ifsc")}/></Fld></>}
              <div className="bg-orange-50 rounded-xl p-3 text-xs text-orange-700">💸 Payouts within 24 hrs of service completion. Min ₹100.</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-extrabold text-gray-800 mb-4">Review & Submit</h2>
              {[["Role",form.role],["Name",form.name||"—"],["Phone",`+91 ${phone}`],["Email",form.email||"—"],["City",`${form.area}, ${form.city} ${form.pincode}`],["Experience",form.experience||"—"],["Services",(form.services.slice(0,3).join(", ")+(form.services.length>3?` +${form.services.length-3} more`:""))||"—"],["ID",`${form.idType}: ${form.idNum||"—"}`],["Documents",`Front: ${form.docFront?"✅":"❌"} · Selfie: ${form.docSelfie?"✅":"❌"}`],["Payout",form.payoutType==="UPI"?`UPI: ${form.upiId||"—"}`:`Bank: ****${(form.accountNum||"").slice(-4)}`]].map(([l,v])=>(
                <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm"><span className="text-gray-400 shrink-0 mr-3">{l}</span><span className="font-medium text-gray-700 text-right">{v}</span></div>
              ))}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">⏳ Your documents will be reviewed within <strong>24–48 hours</strong>. You'll be notified by SMS once approved.</div>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          {step>1&&<button onClick={()=>setStep(s=>s-1)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-full hover:bg-gray-50">← Back</button>}
          {step<4?(
            <button onClick={()=>canNext[step-1]&&setStep(s=>s+1)} className={`flex-1 font-bold py-3 rounded-full transition ${canNext[step-1]?"bg-orange-500 text-white hover:bg-orange-600":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Next →</button>
          ):(
            <button onClick={()=>onComplete({...form,phone})} className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-full hover:bg-orange-600">Submit for Review 🐾</button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   PROFESSIONAL DASHBOARD — uses THIS pro's data
══════════════════════════════════════════════ */
const ProfessionalDashboard=({proData,onLogout})=>{
  const [view,setView]=useState("home");
  const [available,setAvailable]=useState(true);
  const p=proData.profile;
  const stats=proData.stats;
  const docs=proData.docs;
  const bk=proData.bookings||[];
  const isVerified=proData.verified;
  const todayBk=bk.filter(b=>b.date==="Today");
  const navItems=[{id:"home",icon:"🏠",label:"Home"},{id:"bookings",icon:"📅",label:"Bookings"},{id:"docs",icon:"📄",label:"Documents"},{id:"profile",icon:"👤",label:"Profile"}];

  const Home=()=>(
    <div className="p-5 space-y-4">
      {/* Verification status banner */}
      {!isVerified&&<div className={`border rounded-2xl p-4 flex items-start gap-3 ${proData.idStatus==="pending"?"bg-yellow-50 border-yellow-300":"bg-blue-50 border-blue-200"}`}>
        <span className="text-2xl">{proData.idStatus==="pending"?"⏳":"📋"}</span>
        <div>
          <div className="font-bold text-gray-800">{proData.idStatus==="pending"?"Verification Pending":"Profile Submitted"}</div>
          <div className="text-xs text-gray-600 mt-0.5">{proData.idStatus==="pending"?"Your ID documents are under review (24–48 hrs). We'll SMS you once approved.":"Your profile is queued for admin review."}</div>
        </div>
      </div>}
      {isVerified&&<div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div className="flex-1"><div className="font-bold text-green-800">Verified Professional</div><div className="text-xs text-green-600">Listed on PETclub · Accepting bookings</div></div>
        <Bdg text="Active" cls="bg-green-500 text-white"/>
      </div>}

      {/* Profile card — shows THIS pro's name & role */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl">{rIcon(proData.subRole)}</div>
          <div className="flex-1">
            <div className="text-lg font-extrabold">{p.name||"Complete your profile"}</div>
            <div className="text-orange-100 text-sm">{proData.subRole} · {p.area?`${p.area}, `:"—"}{p.city||""}</div>
            {stats.rating>0&&<div className="flex items-center gap-2 mt-1"><span className="text-yellow-300 text-sm">{"★".repeat(Math.floor(stats.rating))}</span><span className="text-orange-100 text-xs">{stats.rating} · {stats.reviews} reviews</span></div>}
            {stats.rating===0&&<div className="text-orange-100 text-xs mt-1">Start accepting bookings after verification</div>}
          </div>
        </div>
      </div>

      {/* Earnings — THIS pro's numbers */}
      <div className="grid grid-cols-3 gap-3">
        {[{l:"Today's Earn",v:fmtCurr(todayBk.reduce((s,b)=>s+parseAmt(b.amt),0)),icon:"💰",bg:"bg-green-50",tc:"text-green-600"},
          {l:"This Month",v:fmtCurr(stats.thisMonth),icon:"📈",bg:"bg-blue-50",tc:"text-blue-600"},
          {l:"Total Jobs",v:`${stats.sessions} Jobs`,icon:"✅",bg:"bg-purple-50",tc:"text-purple-600"}].map(s=>(
          <div key={s.l} className={`${s.bg} rounded-2xl p-3 text-center`}><div className="text-xl mb-1">{s.icon}</div><div className={`text-sm font-extrabold ${s.tc}`}>{s.v}</div><div className="text-xs text-gray-400">{s.l}</div></div>
        ))}
      </div>

      {/* Today's schedule */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="font-bold text-gray-700 mb-3">📅 Today's Schedule ({todayBk.length} bookings)</h2>
        {todayBk.length===0?<p className="text-sm text-gray-400 text-center py-3">{isVerified?"No bookings today.":"You'll see bookings here after verification."}</p>:todayBk.map(b=>(
          <div key={b.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">{b.time.split(":")[0]}</div>
            <div className="flex-1 min-w-0"><div className="text-sm font-bold text-gray-800">{b.customer} · {b.pet}</div><div className="text-xs text-gray-400">{b.svc} · {b.time} · 📍 {b.addr}</div></div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold">{b.amt}</div>
              <Bdg text={b.status} cls={sColor(b.status)}/>
              {b.chat>0&&<div className="text-xs text-blue-500 mt-0.5">💬 {b.chat} msgs</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Availability */}
      {isVerified&&<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
        <div><div className="font-bold text-gray-800">Availability Status</div><div className="text-xs text-gray-400">Toggle to pause or accept new bookings</div></div>
        <div className="flex gap-2">
          <button onClick={()=>setAvailable(true)} className={`text-xs font-bold px-4 py-2 rounded-full transition ${available?"bg-green-500 text-white":"bg-gray-100 text-gray-400"}`}>🟢 Online</button>
          <button onClick={()=>setAvailable(false)} className={`text-xs font-bold px-4 py-2 rounded-full transition ${!available?"bg-red-400 text-white":"bg-gray-100 text-gray-400"}`}>⏸ Pause</button>
        </div>
      </div>}
    </div>
  );

  const Bookings=()=>(
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold text-gray-800">All Bookings</h1>
        <div className="text-xs text-gray-400">{bk.length} total</div>
      </div>
      {bk.length===0?<div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">📅</div><div className="font-bold">No bookings yet</div><div className="text-sm mt-1">They'll appear here after verification</div></div>:
      <div className="space-y-3">
        {bk.map(b=>(
          <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between mb-2">
              <div><div className="font-bold text-sm text-gray-800">{b.customer}</div><div className="text-xs text-gray-400">{b.pet} · {b.svc}</div></div>
              <Bdg text={b.status} cls={sColor(b.status)}/>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-400">
              <span>📅 {b.date==="Today"?"Today":fmtDate(b.date)}</span>
              <span>🕐 {b.time}</span>
              <span>📍 {b.addr}</span>
              {b.chat>0&&<span className="text-blue-500">💬 {b.chat} msgs</span>}
              <span className="ml-auto font-bold text-gray-700">{b.amt}</span>
            </div>
            {b.rating&&<div className="mt-1 text-yellow-400 text-xs">{"★".repeat(b.rating)}{"☆".repeat(5-b.rating)}</div>}
          </div>
        ))}
      </div>}
    </div>
  );

  const Documents=()=>(
    <div className="p-5">
      <h1 className="text-xl font-extrabold text-gray-800 mb-1">My Documents</h1>
      <p className="text-sm text-gray-400 mb-5">Verification status of your uploaded ID documents</p>
      <div className="space-y-3">
        {[{l:`${p.idType||"Aadhaar"} Card — Front`,icon:"🪪",file:docs.front},{l:`${p.idType||"Aadhaar"} Card — Back`,icon:"🪪",file:docs.back},{l:"Selfie with ID Document",icon:"🤳",file:docs.selfie},{l:"Professional Certificate (Optional)",icon:"📜",file:null}].map(d=>{
          const st=d.file?(isVerified?"verified":"pending"):"not_uploaded";
          return(
            <div key={d.l} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0">{d.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 mb-1 truncate">{d.l}</div>
                {d.file&&<div className="text-xs text-gray-400 truncate mb-1">📄 {d.file}</div>}
                <Bdg text={st==="verified"?"✅ Verified":st==="pending"?"⏳ Under Review":"❌ Not Uploaded"} cls={st==="verified"?"bg-green-100 text-green-700":st==="pending"?"bg-yellow-100 text-yellow-700":"bg-red-100 text-red-700"}/>
              </div>
              <button className="text-xs font-semibold text-orange-500 border border-orange-300 px-3 py-1.5 rounded-full hover:bg-orange-50 shrink-0">{st==="not_uploaded"?"Upload":"Replace"}</button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-700">🔒 All documents stored with 256-bit encryption. Reviewed only by PETclub's compliance team.</div>
    </div>
  );

  const Profile=()=>(
    <div className="p-5 max-w-xl">
      <h1 className="text-xl font-extrabold text-gray-800 mb-4">My Profile</h1>
      <div className={`rounded-2xl p-5 text-center mb-4 bg-gradient-to-br from-orange-50 to-amber-100`}>
        <div className="text-5xl mb-2">{rIcon(proData.subRole)}</div>
        <h2 className="text-lg font-extrabold text-gray-800">{p.name||"—"}</h2>
        <p className="text-sm text-gray-500">{proData.subRole} · {p.area||"—"}, {p.city||"—"} · {p.experience||"—"} exp</p>
        <div className="flex justify-center gap-2 mt-2 flex-wrap">
          {stats.rating>0&&<Bdg text={`⭐ ${stats.rating}`} cls="bg-yellow-100 text-yellow-700"/>}
          {stats.reviews>0&&<Bdg text={`${stats.reviews} Reviews`} cls="bg-orange-100 text-orange-600"/>}
          <Bdg text={isVerified?"✅ Verified":"⏳ Pending"} cls={isVerified?"bg-green-100 text-green-700":"bg-yellow-100 text-yellow-700"}/>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        {[["📱 Phone",`+91 ${p.phone}`],["📧 Email",p.email||"—"],["📍 Address",p.address||"—"],["🐾 Services",(p.services||[]).join(", ")||"—"],["💰 Starting Price",`₹${p.priceBasic||"—"}/session`],["🗣️ Languages",p.langs||"—"],["💳 Payout",p.payoutType==="UPI"?`UPI: ${p.upiId}`:`Bank: ****${(p.accountNum||"").slice(-4)}`]].map(([l,v])=>(
          <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm"><span className="text-gray-400">{l}</span><span className="font-medium text-gray-700 text-right max-w-xs truncate">{v}</span></div>
        ))}
        {p.bio&&<div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs text-gray-600">💬 {p.bio}</div>}
        <button className="mt-3 w-full border border-orange-400 text-orange-500 font-semibold py-2 rounded-full text-sm hover:bg-orange-50">✏️ Edit Profile</button>
      </div>
      <button onClick={onLogout} className="w-full border border-red-300 text-red-400 font-semibold py-2 rounded-full text-sm hover:bg-red-50 transition">🚪 Logout</button>
    </div>
  );

  return(
    <div className="flex bg-gray-50 min-h-screen text-gray-800 text-sm">
      <aside className="hidden md:flex flex-col w-56 bg-gray-900 text-white min-h-screen p-4 shrink-0">
        <div className="flex items-center gap-2 mb-8 mt-1"><PawLogo sz={30}/><div><div className="font-extrabold text-orange-400">PETclub</div><div className="text-xs text-gray-400">Professional</div></div></div>
        {navItems.map(n=>(<button key={n.id} onClick={()=>setView(n.id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-semibold transition ${view===n.id?"bg-orange-500 text-white":"text-gray-300 hover:bg-gray-800"}`}>{n.icon} {n.label}</button>))}
        <div className="mt-auto space-y-2">
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">{rIcon(proData.subRole)}</div>
            <div className="text-xs font-bold text-white truncate">{p.name||"New Professional"}</div>
            <div className="text-xs text-gray-400">{proData.subRole} · {p.city||"—"}</div>
            <Bdg text={isVerified?"✅ Verified":"⏳ Pending"} cls={`mt-1 ${isVerified?"bg-green-900 text-green-300":"bg-yellow-900 text-yellow-300"}`}/>
          </div>
          <button onClick={onLogout} className="w-full text-xs text-gray-400 hover:text-red-400 flex items-center justify-center gap-1 py-2 rounded-xl hover:bg-gray-800 transition">🚪 Logout</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 min-h-screen">
        {view==="home"&&<Home/>}{view==="bookings"&&<Bookings/>}{view==="docs"&&<Documents/>}{view==="profile"&&<Profile/>}
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40 flex shadow-lg">
        {navItems.map(n=>(<button key={n.id} onClick={()=>setView(n.id)} className={`flex-1 flex flex-col items-center py-2.5 text-xs font-semibold transition ${view===n.id?"text-orange-500":"text-gray-400"}`}><span className="text-xl mb-0.5">{n.icon}</span>{n.label}</button>))}
      </nav>
    </div>
  );
};

/* ══════════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════════ */
const AdminDashboard=({onLogout})=>{
  const [view,setView]=useState("overview");
  const [proList,setProList]=useState(ALL_PROS);
  const [search,setSearch]=useState("");
  const [roleFilter,setRoleFilter]=useState("All");
  const [rejectModal,setRejectModal]=useState(null);
  const [rejectReason,setRejectReason]=useState("");

  const pending=proList.filter(p=>p.idStatus==="pending");
  const approve=ph=>{setProList(l=>l.map(p=>p.ph===ph?{...p,verified:true,idStatus:"approved",status:"active"}:p));};
  const reject=ph=>{setProList(l=>l.filter(p=>p.ph!==ph));setRejectModal(null);setRejectReason("");};
  const toggleSuspend=ph=>setProList(l=>l.map(p=>p.ph===ph?{...p,status:p.status==="suspended"?"active":"suspended"}:p));
  const allUsers=[...MOCK_CUSTOMERS,...proList.map(p=>({ph:p.ph,name:p.name,role:p.subRole,city:p.city,since:p.since||"—",extra:p.stats?.rating>0?`⭐${p.stats.rating} · ${p.stats.sessions} sessions`:`${p.idStatus==="pending"?"Pending verify":"Not verified"}`,status:p.status||"active",verified:p.verified}))];
  const filteredUsers=allUsers.filter(u=>(roleFilter==="All"||u.role===roleFilter)&&(!search||u.name?.toLowerCase().includes(search.toLowerCase())||u.ph?.includes(search)));
  const totalRevenue=ALL_BOOKINGS.filter(b=>b.status==="completed").reduce((s,b)=>s+parseAmt(b.amt),0);

  const navItems=[{id:"overview",icon:"📊",label:"Overview"},{id:"verify",icon:"🔍",label:`Verify (${pending.length})`},{id:"users",icon:"👥",label:"Users"},{id:"bookings",icon:"📅",label:"Bookings"}];

  const Overview=()=>(
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-extrabold text-gray-800">Admin Dashboard</h1><p className="text-gray-400 text-sm">PETclub India · All Regions</p></div>
        <button onClick={onLogout} className="text-xs text-red-400 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-50">🚪 Logout</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{l:"Total Users",v:allUsers.length,icon:"👥",bg:"bg-blue-50",tc:"text-blue-600"},{l:"Verified Pros",v:proList.filter(p=>p.verified).length,icon:"✅",bg:"bg-green-50",tc:"text-green-600"},{l:"Pending Verify",v:pending.length,icon:"⏳",bg:"bg-yellow-50",tc:"text-yellow-600"},{l:"Total Revenue",v:fmtCurr(totalRevenue),icon:"💰",bg:"bg-orange-50",tc:"text-orange-600"}].map(s=>(
          <div key={s.l} className={`${s.bg} rounded-2xl p-4`}><div className="text-2xl mb-1">{s.icon}</div><div className={`text-2xl font-extrabold ${s.tc}`}>{s.v}</div><div className="text-xs text-gray-500 font-medium">{s.l}</div></div>
        ))}
      </div>
      {/* Pro breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {[["✂️ Groomers",proList.filter(p=>p.subRole==="Groomer").length,"text-orange-600"],["🎓 Trainers",proList.filter(p=>p.subRole==="Trainer").length,"text-blue-600"],["🏥 Vets",proList.filter(p=>p.subRole==="Vet").length,"text-red-600"]].map(([l,v,tc])=>(
          <div key={l} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
            <div className={`text-2xl font-extrabold ${tc}`}>{v}</div>
            <div className="text-xs text-gray-500">{l}</div>
          </div>
        ))}
      </div>
      {pending.length>0&&<div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3"><span className="text-2xl">⚠️</span><div><div className="font-bold text-yellow-800">{pending.length} professionals awaiting ID verification</div><div className="text-xs text-yellow-700">Review Aadhaar/passport documents & approve</div></div></div>
        <button onClick={()=>setView("verify")} className="bg-yellow-500 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-yellow-600 shrink-0">Review Now</button>
      </div>}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-700 mb-3">📅 Recent Bookings (All Professionals)</h2>
        <div className="space-y-2">
          {ALL_BOOKINGS.slice(0,6).map((b,i)=>(
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 flex-wrap">
              <span className="text-lg shrink-0">{rIcon(b.proRole)}</span>
              <div className="flex-1 min-w-0"><div className="text-xs font-bold text-gray-800 truncate">{b.customer} → {b.pro}</div><div className="text-xs text-gray-400 truncate">{b.pet} · {b.svc} · {b.city}</div></div>
              <div className="flex items-center gap-2 shrink-0"><span className="text-xs font-bold">{b.amt}</span><Bdg text={b.status} cls={sColor(b.status)}/></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const VerifyPanel=()=>(
    <div className="p-5">
      <h1 className="text-xl font-extrabold text-gray-800 mb-1">ID Verifications</h1>
      <p className="text-sm text-gray-400 mb-5">Review Aadhaar/Passport documents and approve or reject professionals</p>
      {pending.length===0?<div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">✅</div><div className="font-bold text-lg">All caught up!</div><div className="text-sm">No pending verifications.</div></div>:(
        <div className="space-y-4">
          {pending.map(pro=>(
            <div key={pro.ph} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl font-bold text-orange-600 shrink-0">{pro.name?.[0]||"?"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><span className="font-bold text-gray-800">{pro.name}</span><Bdg text={pro.subRole} cls="bg-orange-100 text-orange-600"/></div>
                  <div className="text-xs text-gray-500 mt-0.5">{pro.city} · 📱 {pro.ph}</div>
                  <div className="text-xs text-gray-400">Submitted {fmtDate(pro.since)}</div>
                </div>
                <Bdg text="⏳ Pending" cls="bg-yellow-100 text-yellow-700 shrink-0"/>
              </div>
              {/* ID type & uploaded docs */}
              <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs">
                <div className="font-semibold text-gray-700 mb-2">Uploaded Documents:</div>
                <div className="grid grid-cols-3 gap-2">
                  {[["🪪 Front",pro.docs?.front],["🪪 Back",pro.docs?.back],["🤳 Selfie",pro.docs?.selfie]].map(([l,f])=>(
                    <div key={l} className={`rounded-lg p-2 text-center border ${f?"border-green-200 bg-green-50 text-green-700":"border-gray-200 bg-white text-gray-400"}`}>
                      <div className="font-semibold">{l}</div>
                      {f?<div className="truncate text-xs mt-0.5">{f}</div>:<div className="text-xs mt-0.5">Missing</div>}
                      <div>{f?"✅":"❌"}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-gray-500">
                  Status: {pro.docs?.front&&pro.docs?.selfie?<span className="text-green-600 font-semibold">Ready to approve</span>:<span className="text-red-500 font-semibold">Incomplete documents</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>approve(pro.ph)} className="flex-1 bg-green-500 text-white font-bold py-2.5 rounded-full hover:bg-green-600 transition text-sm">✅ Approve</button>
                <button onClick={()=>setRejectModal(pro.ph)} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-full hover:bg-red-600 transition text-sm">❌ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {rejectModal&&<Modal title="Reject Application" onClose={()=>setRejectModal(null)}>
        <p className="text-sm text-gray-500 mb-4">Reason will be sent to the professional via SMS.</p>
        <Fld label="Rejection Reason *"><Txta placeholder="e.g. Aadhaar photo is blurry. Please reupload a clear image." value={rejectReason} onChange={e=>setRejectReason(e.target.value)}/></Fld>
        <div className="flex gap-2 mt-2">
          <button onClick={()=>setRejectModal(null)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2 rounded-full text-sm">Cancel</button>
          <button onClick={()=>reject(rejectModal)} className="flex-1 bg-red-500 text-white font-bold py-2 rounded-full text-sm">Confirm Reject</button>
        </div>
      </Modal>}
    </div>
  );

  const UsersPanel=()=>(
    <div className="p-5">
      <h1 className="text-xl font-extrabold text-gray-800 mb-4">User Management</h1>
      <div className="flex gap-2 mb-3 flex-wrap">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search name or phone…" className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-orange-400 min-w-36"/>
      </div>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {["All","Customer","Groomer","Trainer","Vet"].map(r=>(<button key={r} onClick={()=>setRoleFilter(r)} className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${roleFilter===r?"bg-orange-500 text-white":"bg-gray-100 text-gray-600"}`}>{r}</button>))}
      </div>
      <div className="space-y-2">
        {filteredUsers.map(u=>(
          <div key={u.ph} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl shrink-0">{rIcon(u.role)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap"><span className="font-bold text-sm text-gray-800">{u.name||"—"}</span>{u.verified&&<span className="text-green-500 text-xs">✅</span>}</div>
              <div className="text-xs text-gray-400 truncate">{u.role} · {u.city||"—"} · {u.ph}</div>
              <div className="text-xs text-gray-300">{u.extra}</div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Bdg text={u.status||"active"} cls={sColor(u.status||"active")}/>
              <button onClick={()=>toggleSuspend(u.ph)} className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition ${u.status==="suspended"?"border-green-300 text-green-600":"border-red-300 text-red-500"}`}>{u.status==="suspended"?"Restore":"Suspend"}</button>
            </div>
          </div>
        ))}
        {filteredUsers.length===0&&<div className="text-center py-10 text-gray-400">No users found.</div>}
      </div>
    </div>
  );

  const BookingsPanel=()=>(
    <div className="p-5">
      <h1 className="text-xl font-extrabold text-gray-800 mb-4">All Bookings</h1>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{l:"Completed",v:ALL_BOOKINGS.filter(b=>b.status==="completed").length,cls:"bg-green-50 text-green-600"},{l:"Upcoming",v:ALL_BOOKINGS.filter(b=>b.status==="upcoming").length,cls:"bg-blue-50 text-blue-600"},{l:"Revenue",v:fmtCurr(totalRevenue),cls:"bg-orange-50 text-orange-600"}].map(s=>(
          <div key={s.l} className={`rounded-2xl p-3 text-center ${s.cls}`}><div className="text-lg font-extrabold">{s.v}</div><div className="text-xs font-medium">{s.l}</div></div>
        ))}
      </div>
      <div className="space-y-3">
        {ALL_BOOKINGS.map((b,i)=>(
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between mb-2">
              <div><div className="font-bold text-sm text-gray-800">{b.customer} → {b.pro}</div><div className="text-xs text-gray-400">{b.pet} · {b.svc} · {rIcon(b.proRole)} {b.proRole}</div></div>
              <Bdg text={b.status} cls={sColor(b.status)}/>
            </div>
            <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
              <span>📅 {b.date==="Today"?"Today":fmtDate(b.date)}</span>
              <span>📍 {b.city}</span>
              {b.rating&&<span className="text-yellow-500">{"★".repeat(b.rating)}</span>}
              <span className="ml-auto font-bold text-gray-700">{b.amt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return(
    <div className="flex bg-gray-50 min-h-screen text-gray-800 text-sm">
      <aside className="hidden md:flex flex-col w-56 bg-gray-900 text-white min-h-screen p-4 shrink-0">
        <div className="flex items-center gap-2 mb-8 mt-1"><PawLogo sz={30}/><div><div className="font-extrabold text-orange-400">PETclub</div><div className="text-xs text-red-400 font-bold tracking-wider">ADMIN</div></div></div>
        {navItems.map(n=>(<button key={n.id} onClick={()=>setView(n.id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-semibold transition ${view===n.id?"bg-orange-500 text-white":"text-gray-300 hover:bg-gray-800"}`}>{n.icon} {n.label}</button>))}
        <div className="mt-auto space-y-2">
          <div className="bg-gray-800 rounded-xl p-3 text-center"><div className="text-2xl mb-1">🛡️</div><div className="text-xs font-bold text-white">Admin Kumar</div><div className="text-xs text-gray-400">Super Admin</div></div>
          <button onClick={onLogout} className="w-full text-xs text-gray-400 hover:text-red-400 flex items-center justify-center gap-1 py-2 rounded-xl hover:bg-gray-800 transition">🚪 Logout</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 min-h-screen">
        {view==="overview"&&<Overview/>}{view==="verify"&&<VerifyPanel/>}{view==="users"&&<UsersPanel/>}{view==="bookings"&&<BookingsPanel/>}
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40 flex shadow-lg">
        {navItems.map(n=>(<button key={n.id} onClick={()=>setView(n.id)} className={`flex-1 flex flex-col items-center py-2.5 text-xs font-semibold transition ${view===n.id?"text-orange-500":"text-gray-400"}`}><span className="text-xl mb-0.5">{n.icon}</span>{n.label.split(" ")[0]}</button>))}
      </nav>
    </div>
  );
};

/* ══════════════════════════════════════════════
   ROOT — AUTH ROUTER
══════════════════════════════════════════════ */
export default function App(){
  const [screen,setScreen]=useState("login");
  const [proData,setProData]=useState(null);

  const handleLogin=phone=>{
    const d=PRO_DB[phone];
    setProData(d);
    if(d.role==="admin") setScreen("admin");
    else if(d.isNew) setScreen("onboard");
    else setScreen("profDash");
  };
  const handleOnboardComplete=form=>{
    setProData(p=>({...p,isNew:false,profile:{...p.profile,...form},idStatus:"pending"}));
    setScreen("profDash");
  };
  const logout=()=>{setScreen("login");setProData(null);};

  if(screen==="login") return <LoginScreen onLogin={handleLogin}/>;
  if(screen==="onboard") return <ProfessionalOnboarding proData={proData} onComplete={handleOnboardComplete}/>;
  if(screen==="profDash") return <ProfessionalDashboard proData={proData} onLogout={logout}/>;
  if(screen==="admin") return <AdminDashboard onLogout={logout}/>;
  return null;
}