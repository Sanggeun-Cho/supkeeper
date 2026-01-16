import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";
import logoImg from "./assets/Logo.png";

/* 아이콘 */
import addSemIcon   from "./assets/add_semester.svg";
import addSubIcon   from "./assets/add_subject.svg";
import editIcon     from "./assets/edit.svg";
import trashIcon    from "./assets/trash.svg";
import cancelXIcon  from "./assets/cancel_x.svg";
import calPrevIcon from "./assets/cal_prev.svg";
import calNextIcon from "./assets/cal_next.svg";

/* 날짜 선택 라이브러리 */
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/* ✅ 구글 로그인 라이브러리 */
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

/* ⚠️ 구글 클라우드 콘솔에서 발급받은 Client ID */
const GOOGLE_CLIENT_ID = "819117992716-vte3g2rcp56uo6l8tfr3nk3ve6o9kc7h.apps.googleusercontent.com";

/** ===== 타입 ===== */
interface User { userId:number; userName:string; email?:string; lastSemId?: number | null }
interface SemesterItem { semId:number; semName:string; current?:boolean }
interface Subject { subId:number; subName:string }
interface Assignment {
    assignId:number; assignName:string; dueDate:string; category:number; isComplete:number;
    subId?:number | string; subName?:string; dueLabel?:string;
}
interface Dashboard {
    dashboard:{ userId:number; userName:string; semId:number; semName:string; subjectList:Subject[] };
    semesters:SemesterItem[];
    sections:{ incomplete:Assignment[]; complete:Assignment[] };
}

/** ===== 상수/유틸 ===== */
const API_BASE = "";

const CATEGORY_LABEL: Record<number, "과제" | "강의" | "할 일"> = {
    0: "과제",
    1: "강의",
    2: "할 일",
};

/** 과목명 글자수 제한 */
function truncateSubject(name: string): string {
    if (!name) return "";
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(name);
    const limit = hasKorean ? 10 : 16;
    return name.length > limit ? name.slice(0, limit) + "..." : name;
}

/** 입력 핸들러용 길이 제한 함수 (과목) */
function limitSubjectInput(val: string): string {
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(val);
    const limit = hasKorean ? 10 : 16;
    if (val.length > limit) return val.slice(0, limit);
    return val;
}

/** 학기 이름 길이 제한 */
function limitSemesterInput(val: string): string {
    return val.slice(0, 8);
}

/** Date → 로컬 기준 YYYY-MM-DD */
function toYMDLocal(date: Date){
    const y = date.getFullYear();
    const m = `${date.getMonth()+1}`.padStart(2,"0");
    const d = `${date.getDate()}`.padStart(2,"0");
    return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD → 로컬 Date */
function parseYMDLocal(ymd:string){
    const [y,m,d] = ymd.split("-").map(Number);
    return new Date(y, m-1, d, 0,0,0,0);
}

/** 문자열에서 날짜 추출 */
function pickYMD(dateStr: string): string | null {
    if (!dateStr) return null;
    const m = dateStr.match(/(\d{4})\D(\d{2})\D(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** 날짜 하루 이동 */
function shiftYMD(ymd: string, days: number): string {
    const [y,m,d] = ymd.split("-").map(Number);
    const dt = new Date(y, m-1, d);
    dt.setDate(dt.getDate() + days);
    return toYMDLocal(dt);
}

const DATE_OFFSET_DAYS_FOR_DISPLAY = 1;

/** ✅ [수정] 배지 로직: overdue(기한 지남) 상태 추가 */
function getBadgeForFront(dueDate: string, isComplete: number, serverLabel?: string){
    // 완료된 건 기본 처리
    if (isComplete === 1) return { label: serverLabel || "DUE", urgent: false, overdue: false };

    const ymd = pickYMD(dueDate);
    if (!ymd) return { label: serverLabel || "DUE", urgent: false, overdue: false };

    const due = (() => {
        const [y,m,d] = ymd.split("-").map(Number);
        const dt = new Date(y, m-1, d, 0, 0, 0, 0);
        return Number.isNaN(dt.getTime()) ? null : dt;
    })();
    if (!due) return { label: serverLabel || "DUE", urgent: false, overdue: false };

    const today = new Date();
    today.setHours(0,0,0,0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

    // 기존 로직 유지
    if (diffDays === 0) return { label: "D-1",   urgent: true, overdue: false };
    if (diffDays === -1) return { label: "D-DAY", urgent: true, overdue: false };
    
    // ✅ [추가] 기한 지남 (D-DAY 보다 과거)
    if (diffDays < -1) return { label: "OVER", urgent: true, overdue: true };

    return { label: serverLabel || "DUE", urgent: false, overdue: false };
}

const DateBadge:React.FC<{label:string; urgent:boolean}> = ({label, urgent})=>{
    const isD = label === "D-1" || label === "D-DAY" || label === "OVER";
    const [m, day] = isD ? [label, ""] : (label || "").split(" ");
    return (
        <div className={`taskBadge ${urgent ? "urgent" : ""} ${isD ? "isD" : ""}`}>
            <div className="badgeMain">{m || "DUE"}</div>
            {!isD && <div className="badgeSub">{day || ""}</div>}
        </div>
    );
};

/** ===== API 공통 ===== */
async function api<T>(path:string, init?:RequestInit):Promise<T>{
    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: { "Content-Type":"application/json", ...(init?.headers || {}) },
    });
    if(!res.ok){ throw new Error(await res.text() || `HTTP ${res.status}`); }
    return res.headers.get("content-type")?.includes("application/json")
        ? await res.json() as T
        : (undefined as T);
}

/** API 래퍼 */
const googleLoginApi = (credential: string) =>
    api<User>("/user/login/google", {
        method: "POST",
        body: JSON.stringify({ credential })
    });

const createSemester = (userId:number, semName:string)=>
    api<SemesterItem>("/semester",{ method:"POST", headers:{ "X-USER-ID":String(userId) }, body:JSON.stringify({ semName }) });

const deleteSemester = (semId:number)=>
    api<void>(`/semester/${semId}`,{ method:"DELETE" });

const getDashboard = (userId:number, semId:number, subId?:number|null, categories?:number[]) => {
    const params = new URLSearchParams();
    if (subId != null) params.append("subId", String(subId));
    if (categories && categories.length > 0) {
        params.append("categories", categories.join(","));
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    
    return api<Dashboard>(`/semester/${semId}/dashboard${query}`, {
        headers: { "X-USER-ID": String(userId) }
    });
};

const createSubject = (semId:number, subName:string)=>
    api<Subject>(`/subject/${semId}`,{ method:"POST", body:JSON.stringify({ subName }) });

const deleteSubject = (subId:number)=>
    api<void>(`/subject/${subId}`,{ method:"DELETE" });

const createAssignment = (subId:number, payload:{assignName:string;dueDate:string;category:number;})=>
    api<Assignment>(`/assignment/subject/${subId}`,{ method:"POST", body:JSON.stringify({ ...payload, subId }) });

const updateAssignment = (assignId:number, payload:{assignName:string;dueDate:string;category:number;subId:number;})=>
    api<Assignment>(`/assignment/${assignId}`,{ method:"PATCH", body:JSON.stringify(payload) });

const deleteAssignment = (assignId:number)=>
    api<void>(`/assignment/${assignId}`,{ method:"DELETE" });

const toggleComplete = (assignId:number, isComplete:number)=>
    api<{assignId:number;isComplete:number;dueDate:string}>(`/assignment/${assignId}/complete`,{ method:"PATCH", body:JSON.stringify({ isComplete }) });

const getCalendar = (semId:number)=>
    api<{userName:string; items:{subName:string; dueDate:string; assignName:string; category:number}[]}>(
        `/semester/${semId}/calendar`
    );

/** ===== 공용 모달 ===== */
const Modal:React.FC<{ title:string; open:boolean; onClose:()=>void; children:React.ReactNode }>=
    ({ title, open, onClose, children })=>{
        if(!open) return null;
        return (
            <div className="overlay" onClick={onClose}>
                <div className="modal" onClick={(e)=>e.stopPropagation()}>
                    <div className="modalHeader">
                        <div className="modalTitle">{title}</div>
                    </div>
                    <div className="modalBody">{children}</div>
                </div>
            </div>
        );
    };

/** ===== 로그인 화면 ===== */
const LoginView:React.FC<{ onSuccess:(u:User)=>void }>=({ onSuccess })=>{
    const [error, setError] = useState<string|undefined>();

    return (
        <div className="login-full">
            <div className="topbar login-hidden" />
            <div className="login-panel">
                <div className="logoRing"><img src={logoImg} alt="2359" /></div>
                
                <div className="loginTitleCenter">환영합니다!</div>
                <div className="muted" style={{textAlign:"center", marginBottom: 20}}>
                    Google 계정으로 간편하게 시작하세요.
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            try {
                                if (credentialResponse.credential) {
                                    const user = await googleLoginApi(credentialResponse.credential);
                                    localStorage.setItem("2359:user", JSON.stringify(user));
                                    onSuccess(user);
                                }
                            } catch (e: any) {
                                setError("로그인 처리 중 오류가 발생했습니다.");
                                console.error(e);
                            }
                        }}
                        onError={() => {
                            setError("구글 로그인에 실패했습니다.");
                        }}
                        useOneTap
                    />
                </div>

                {error && <div className="loginHelp" style={{ color:"#d32f2f", marginTop: 16 }}>{error}</div>}
            </div>
        </div>
    );
};

/** ===== 대시보드 ===== */
const DashboardView:React.FC<{ user:User; onLogout:()=>void }>=({ user, onLogout })=>{
    const [semId, setSemId] = useState<number|null>(()=> {
        const saved = localStorage.getItem("2359:lastSemId");
        if (saved) return Number(saved);
        return (user.lastSemId ?? null) as number | null;
    });

    const [filterSubId, setFilterSubId] = useState<number|null>(null); 
    const [filterCats, setFilterCats] = useState<number[]>([]);       

    const [data, setData] = useState<Dashboard|null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|undefined>();

    const [showSemModal, setShowSemModal]    = useState(false);
    const [newSemName, setNewSemName]        = useState("");
    const [showSubModal, setShowSubModal]    = useState(false);
    const [newSubName, setNewSubName]        = useState("");
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignForm, setAssignForm]        = useState<{ subId?:number; assignName:string; dueDate:string; category:number; assignId?:number }>({ assignName:"", dueDate:"", category:0 });
    const [pickerDate, setPickerDate]        = useState<Date|null>(null);
    const [creatingSem, setCreatingSem]      = useState(false);

    const [showCalendar, setShowCalendar] = useState(false);
    const [calRefDate, setCalRefDate] = useState<Date>(new Date());
    const [calItems, setCalItems] = useState<{subName:string; dueDate:string; assignName:string; category:number}[]|null>(null);
    const [calLoading] = useState(false);
    const [calError] = useState<string|undefined>();

    const [, setNowTick] = useState(0);
    useEffect(()=>{
        const t = setInterval(()=>setNowTick(Date.now()), 60_000);
        return ()=>clearInterval(t);
    },[]);

    const refreshingRef = React.useRef(false);
    const subjects = data?.dashboard.subjectList || [];

    async function load(targetSemId:number){
        setLoading(true); setError(undefined);
        try{
            const d = await getDashboard(user.userId, targetSemId, filterSubId, filterCats);

            const sMap = new Map<number, string>();
            (d.dashboard.subjectList || []).forEach(s => sMap.set(Number(s.subId), (s.subName || "").trim()));

            const norm = (arr: Assignment[]) => arr.map(a => {
                const sid = a.subId != null ? Number(a.subId as any) : undefined;
                const sname =
                    (sid!=null ? sMap.get(sid) : undefined) ||
                    (a.subName?.trim()) ||
                    (sid!=null ? `(과목#${sid})` : "(과목#?)");
                return { ...a, subId: sid, subName: sname, category: Number(a.category) };
            });
            d.sections = {
                incomplete: norm(d.sections.incomplete || []),
                complete:   norm(d.sections.complete   || [])
            };

            setData(d);
            setSemId(targetSemId);
            localStorage.setItem("2359:lastSemId", String(targetSemId));
        }catch(e:any){
            setError(e.message || "불러오기 실패");
        }finally{ setLoading(false); }
    }

    useEffect(() => {
        if(semId != null){
            load(semId);
        }else{
            setData(null);
            setShowSemModal(true);
        }
    }, [semId, filterSubId, filterCats]);

    const switchSemester = (id: number) => {
        setFilterSubId(null);
        setFilterCats([]);
        setSemId(id);
    };

    const toggleCategory = (catIdx: number) => {
        setFilterCats(prev => {
            if (prev.includes(catIdx)) return prev.filter(c => c !== catIdx);
            return [...prev, catIdx];
        });
    };

    async function silentRefresh(){
        if (!data?.dashboard.semId || refreshingRef.current) return;
        refreshingRef.current = true;
        try {
            const sem = data.dashboard.semId;
            const d = await getDashboard(user.userId, sem, filterSubId, filterCats);

            const sMap = new Map<number, string>();
            (d.dashboard.subjectList || []).forEach(s =>
                sMap.set(Number(s.subId), (s.subName || "").trim())
            );
            const norm = (arr: Assignment[]) => (arr || []).map(a => {
                const sid = a.subId != null ? Number(a.subId as any) : undefined;
                const sname =
                    (sid!=null ? sMap.get(sid) : undefined) ||
                    (a.subName?.trim()) ||
                    (sid!=null ? `(과목#${sid})` : "(과목#?)");
                return { ...a, subId: sid, subName: sname };
            });
            d.sections = { incomplete: norm(d.sections.incomplete), complete: norm(d.sections.complete) };

            setData(d);
        } finally {
            refreshingRef.current = false;
        }
    }

    useEffect(() => {
        const doRefresh = () => { silentRefresh(); };
        window.addEventListener("focus", doRefresh);
        const onVis = () => { if (document.visibilityState === "visible") doRefresh(); };
        document.addEventListener("visibilitychange", onVis);
        window.addEventListener("online", doRefresh);
        const t = setInterval(doRefresh, 60_000);
        return () => {
            window.removeEventListener("focus", doRefresh);
            document.removeEventListener("visibilitychange", onVis);
            window.removeEventListener("online", doRefresh);
            clearInterval(t);
        };
    }, [semId, filterSubId, filterCats]);

    const subNameById = useMemo(()=> {
        const map = new Map<number,string>();
        subjects.forEach(s=>map.set(Number(s.subId), s.subName));
        return map;
    }, [subjects]);

    function getSubjectName(a:Assignment): string{
        const key = a.subId != null ? Number(a.subId as any) : NaN;
        return subNameById.get(key) || (a.subName?.trim()) || `(과목#${key})`;
    }

    async function handleCreateSem(){
        if(!newSemName.trim()) return;
        try{
            setCreatingSem(true);
            const s = await createSemester(user.userId, newSemName.trim());
            setShowSemModal(false); setNewSemName("");
            switchSemester(s.semId);
        }catch(e:any){ alert(e.message); }
        finally{ setCreatingSem(false); }
    }

    async function handleDeleteSem(id:number){
        if(!confirm("이 학기를 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;
        try{
            await deleteSemester(id);
            if(data){
                const currentSemId = data.dashboard.semId;
                const remaining = (data.semesters || []).filter(s => s.semId !== id);

                if(remaining.length === 0){
                    setData(null);
                    setSemId(null);
                    localStorage.removeItem("2359:lastSemId");
                    setShowSemModal(true);
                    return;
                }

                if(currentSemId === id){
                    const next = remaining.reduce((a,b)=> a.semId > b.semId ? a : b);
                    switchSemester(next.semId);
                }else{
                    load(currentSemId);
                }
            }else{
                setData(null);
                setSemId(null);
                localStorage.removeItem("2359:lastSemId");
                setShowSemModal(true);
            }
        }catch(e:any){
            alert(e.message || "학기 삭제에 실패했습니다.");
        }
    }

    async function handleCreateSubject(){
        if(!data || !newSubName.trim()) return;
        try{
            await createSubject(data.dashboard.semId, newSubName.trim());
            setShowSubModal(false); setNewSubName("");
            load(data.dashboard.semId);
        }catch(e:any){ alert(e.message); }
    }

    async function handleDeleteSubject(id:number){
        if(!confirm("과목을 삭제할까요?")) return;
        await deleteSubject(id);
        if(data) {
            if(filterSubId === id) setFilterSubId(null);
            load(data.dashboard.semId);
        }
    }

    function openAssignModal(sub?:Subject, edit?:Assignment){
        if (edit) {
            const raw = (edit.subId ?? sub?.subId) as any;
            const sid = (raw === 0 || raw) ? Number(raw) : undefined;
            const ymd = shiftYMD(pickYMD(edit.dueDate) ?? "", 1) || "";

            setAssignForm({
                assignId: edit.assignId,
                subId: sid,
                assignName: edit.assignName,
                dueDate: ymd,
                category: edit.category
            });

            setPickerDate(ymd ? parseYMDLocal(ymd) : null);
        } else {
            setAssignForm({ subId: sub?.subId, assignName: "", dueDate: "", category: 0 });
            setPickerDate(null);
        }
        setShowAssignModal(true);
    }

    async function saveAssignment(){
        const f = assignForm;
        if(!f.assignName || !f.dueDate){ alert("모든 값을 입력하세요"); return; }
        try{
            if(f.assignId){
                await updateAssignment(f.assignId, { assignName:f.assignName, dueDate:f.dueDate, category:f.category, subId:f.subId! });
            }else{
                if(!f.subId){ alert("과목을 선택하세요"); return; }
                await createAssignment(f.subId, { assignName:f.assignName, dueDate:f.dueDate, category:f.category });
            }
            setShowAssignModal(false);
            if(data) load(data.dashboard.semId);
        }catch(e:any){ alert(e.message); }
    }

    async function handleDeleteAssign(id:number){
        if(!confirm("과제를 삭제할까요?")) return;
        await deleteAssignment(id);
        if(data) load(data.dashboard.semId);
    }

    async function handleToggleComplete(a:Assignment){
        const next = a.isComplete===1 ? 0 : 1;
        await toggleComplete(a.assignId, next);
        if(data) load(data.dashboard.semId);
    }

    function fmt(d:Date){
        const y=d.getFullYear(); const m=`${d.getMonth()+1}`.padStart(2,'0'); const dd=`${d.getDate()}`.padStart(2,'0');
        return `${y}-${m}-${dd}`;
    }
    function buildMonthGrid(base:Date){
        const y = base.getFullYear(), m = base.getMonth();
        const first = new Date(y, m, 1);
        const start = new Date(first);
        start.setDate(first.getDate() - ((first.getDay()+7)%7));
        const days: Date[] = [];
        for(let i=0;i<42;i++){ const d = new Date(start); d.setDate(start.getDate()+i); days.push(d); }
        return days;
    }

    useEffect(()=>{ setCalItems(null); }, [data?.dashboard.semId]);

    useEffect(()=>{
        if (showCalendar && data){
            getCalendar(data.dashboard.semId)
                .then(res => setCalItems(res.items || []))
                .catch(()=>setCalItems(null));
        }
    }, [showCalendar, data?.dashboard.semId]);

    type CalCell = { assignName:string; category:number; subName:string; isDone?:boolean };

    const calCellsByDate = useMemo(() => {
        const map = new Map<string, CalCell[]>();
        const list =
            calItems
            ?? (data ? [...data.sections.incomplete, ...data.sections.complete] : []);

        list.forEach((a:any) => {
            const ymd = pickYMD(a.dueDate);
            if (!ymd) return;

            const plusDayOne = shiftYMD(ymd, DATE_OFFSET_DAYS_FOR_DISPLAY); 
            const cat = Number(a.category ?? 0);

            const cell: CalCell = {
                assignName: a.assignName,
                category: cat,
                subName: a.subName ?? getSubjectName(a),
                isDone: a.isComplete === 1,
            };
            const arr = map.get(plusDayOne) || [];
            arr.push(cell);
            map.set(plusDayOne, arr);
        });
        return map;
    }, [calItems, data]);

    const emptyState = (
        <div className="emptyFlexCenter">
            <div className="muted" style={{ textAlign:"center" }}>
                아직 학기 데이터가 없어요.<br/>
                좌측 상단의 <b>+</b>를 누르거나&nbsp;
                <button className="btn ok" onClick={()=>setShowSemModal(true)}>여기서 바로 만들기</button>
            </div>
        </div>
    );

    const selectedSemId = data?.dashboard.semId;

    return (
        <div className="app">
            {/* 헤더 */}
            <div className="topbar">
                <img src={logoImg} alt="2359" className="brandLogo" />
                <div className="hello">
                    {user.userName}님, 안녕하세요!
                    <button className="btn logout" onClick={()=>{
                        localStorage.removeItem("2359:lastSemId");
                        localStorage.removeItem("2359:user");
                        onLogout();
                    }}>로그아웃</button>
                </div>
            </div>

            {/* 본문 */}
            <div className="shell">
                {/* 사이드바 */}
                <aside className="side">
                    <div className="headerRow">
                        <div className="h2">학기</div>
                        <button className="btn iconCircle noborder forceTransparent" onClick={()=>setShowSemModal(true)} title="새 학기 추가" aria-label="새 학기 추가">
                            <img src={addSemIcon} alt="" aria-hidden="true" className="icon24" />
                        </button>
                    </div>

                    <div className="semList">
                        {(data?.semesters || []).map(s=>(
                            <div 
                                key={s.semId} 
                                className={`semRow ${selectedSemId===s.semId ? "active" : ""}`}
                                onClick={()=>switchSemester(s.semId)}
                            >
                                <span className="semText">{s.semName}</span>
                                <button
                                    className="semDelete plainX"
                                    title="삭제"
                                    aria-label={`${s.semName} 삭제`}
                                    onClick={(e)=>{
                                        e.stopPropagation(); 
                                        handleDeleteSem(s.semId);
                                    }}
                                >×</button>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* 메인 */}
                <main className="main">
                    {error && <div className="globalError">{error}</div>}
                    {loading && <div className="globalLoading">불러오는 중…</div>}
                    {!data ? (
                        emptyState
                    ) : (
                        <div className="mainInner">
                            {/* 상단 과목 바 */}
                            <div className="subjectsBar">
                                <div className="h1">과목</div>
                                <div className="toolbar splitLayout">
                                    <div className="subjectZone">
                                        {subjects.length===0 ? (
                                            <span className="muted">등록된 과목이 없습니다.</span>
                                        ) : (
                                            subjects.map(sub=>(
                                                <div key={sub.subId} className="chipCard">
                                                    <span className="chipText">{truncateSubject(sub.subName)}</span>
                                                    <button className="x" title="과목 삭제" onClick={(e)=>{
                                                        e.stopPropagation();
                                                        handleDeleteSubject(Number(sub.subId));
                                                    }}>×</button>
                                                </div>
                                            ))
                                        )}
                                        <button className="chipAdd inFlow" onClick={()=>setShowSubModal(true)} title="과목 추가" aria-label="과목 추가">
                                            <img src={addSubIcon} alt="" className="icon28"/>
                                        </button>
                                    </div>

                                    {/* 컨트롤러 */}
                                    <div className="controlZone">
                                        <select 
                                            className="filterSelect"
                                            value={filterSubId ?? ""}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setFilterSubId(v ? Number(v) : null);
                                            }}
                                        >
                                            <option value="">전체 과목</option>
                                            {subjects.map(s => (
                                                <option key={s.subId} value={s.subId}>{truncateSubject(s.subName)}</option>
                                            ))}
                                        </select>

                                        <div className="filterGroup">
                                            {[0, 1, 2].map(code => (
                                                <label key={code} className="checkboxLabel">
                                                    <input 
                                                        type="checkbox"
                                                        checked={filterCats.includes(code)}
                                                        onChange={() => toggleCategory(code)}
                                                    />
                                                    {CATEGORY_LABEL[code]}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 아래 컨텐츠 영역 */}
                            <div className="contentArea">
                                <div className="cols">
                                    {/* 완료 */}
                                    <div className="col">
                                        <div className="titleRow fixed">
                                            <div className="h1">완료된 과제</div>
                                        </div>
                                        <div className="listScroll">
                                            {data.sections.complete.length===0 ? (
                                                <div className="muted">완료된 과제가 없습니다.</div>
                                            ) : (
                                                data.sections.complete.map(a=>{
                                                    const cat  = CATEGORY_LABEL[a.category] ?? "과제";
                                                    const sub  = getSubjectName(a);
                                                    const hash = `# ${cat}  # ${truncateSubject(sub)}`;
                                                    const badge = getBadgeForFront(a.dueDate, a.isComplete, a.dueLabel);

                                                    return (
                                                        <div key={a.assignId} className="taskCapsule done">
                                                            <div className="capsuleLeft">
                                                                <DateBadge label={badge.label} urgent={badge.urgent}/>
                                                                <div className="capsuleText">
                                                                    <div className="hashLine">{hash}</div>
                                                                    <div className="taskTitle">{a.assignName}</div>
                                                                </div>
                                                            </div>
                                                            <div className="capsuleActions">
                                                                <button className="sqBtn red" title="되돌리기" onClick={()=>handleToggleComplete(a)}>
                                                                    <img src={cancelXIcon} alt="취소"/>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* 미완료 (해야할 과제) */}
                                    <div className="col rightCol">
                                        <div className="titleRow fixed">
                                            <div className="h1">해야할 과제</div>
                                            <button className="btn outline pill xs" onClick={()=>openAssignModal()}>+ 새 과제 등록</button>
                                        </div>

                                        <div className="listScroll">
                                            {data.sections.incomplete.length===0 ? (
                                                <div className="muted">해야할 과제가 없습니다.</div>
                                            ) : (
                                                data.sections.incomplete.map(a=>{
                                                    const cat  = CATEGORY_LABEL[a.category] ?? "과제";
                                                    const sub  = getSubjectName(a);
                                                    const hash = `# ${cat}  # ${truncateSubject(sub)}`;
                                                    const badge = getBadgeForFront(a.dueDate, a.isComplete, a.dueLabel);

                                                    // ✅ [수정] 기한 지남 여부에 따라 클래스 분기
                                                    // overdue가 true면 "taskCapsule overdue" (회색) 적용
                                                    const capsuleClass = badge.overdue 
                                                        ? "taskCapsule overdue" 
                                                        : (badge.urgent ? "taskCapsule urgent" : "taskCapsule todo");

                                                    return (
                                                        <div key={a.assignId} className={capsuleClass}>
                                                            <div className="capsuleLeft">
                                                                <DateBadge label={badge.label} urgent={badge.urgent}/>
                                                                <div className="capsuleText">
                                                                    <div className="hashLine">{hash}</div>
                                                                    <div className="taskTitle">{a.assignName}</div>
                                                                </div>
                                                            </div>
                                                            <div className="capsuleActions">
                                                                <button className="sqBtn red"   title="삭제" onClick={()=>handleDeleteAssign(a.assignId)}>
                                                                    <img src={trashIcon} alt="삭제"/>
                                                                </button>
                                                                <button className="sqBtn blue"  title="편집" onClick={()=>openAssignModal(undefined,a)}>
                                                                    <img src={editIcon} alt="편집"/>
                                                                </button>
                                                                <button className="sqBtn green" title="완료" onClick={()=>handleToggleComplete(a)}>✔</button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 플로팅 달력 버튼 */}
                    <button className="fab" aria-label="월간 달력 열기" title="월간 달력" onClick={()=>setShowCalendar(true)}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                            <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>

                    <Modal title="캘린더" open={showCalendar} onClose={()=>setShowCalendar(false)}>
                        <div className="calendarModal">
                            <div className="calHeader">
                                <button className="calNavBtn" aria-label="이전 달"
                                        onClick={()=>setCalRefDate(d=> new Date(d.getFullYear(), d.getMonth()-1, 1))}>
                                    <img src={calPrevIcon} alt="" className="calIcon" />
                                </button>
                                <div className="calTitle">{calRefDate.getFullYear()}년 {calRefDate.getMonth()+1}월</div>
                                <button className="calNavBtn" aria-label="다음 달"
                                        onClick={()=>setCalRefDate(d=> new Date(d.getFullYear(), d.getMonth()+1, 1))}>
                                    <img src={calNextIcon} alt="" className="calIcon" />
                                </button>


                        </div>

                            <div className="calHeaderRow">
                                {["일","월","화","수","목","금","토"].map(d=>(
                                    <div key={d} className="calDow">{d}</div>
                                ))}
                            </div>

                            <div className="calGrid">
                                {buildMonthGrid(calRefDate).map((d, idx)=>{
                                    const inMonth = d.getMonth()===calRefDate.getMonth();
                                    const key = fmt(d);
                                    const items = calCellsByDate.get(key) || [];
                                    return (
                                        <div key={idx} className={`calDay ${inMonth? "in":"out"}`}>
                                            <div className="calDate">{d.getDate()}</div>
                                            <div className="calItems">
                                                <div className="calItemsScroll">
                                                    {calLoading && items.length===0 ? (
                                                        <div className="muted">불러오는 중…</div>
                                                    ) : calError && items.length===0 ? (
                                                        <div className="muted">로드 실패</div>
                                                    ) : (
                                                        items.map((it,i)=>(
                                                            <div
                                                                key={i}
                                                                className={`calItem ${it.isDone ? "done" : "todo"}`}
                                                                data-tip={`# ${CATEGORY_LABEL[it.category] ?? "과제"}  # ${truncateSubject(it.subName || "")}`}
                                                            >
                                                                <div className="calName">{it.assignName}</div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Modal>
                </main>
            </div>

            <Modal title="새 학기 생성" open={showSemModal} onClose={()=>setShowSemModal(false)}>
                <div className="field">
                    <label className="label">학기 이름</label>
                    <input className="input" placeholder="예: 2025년 1학기" value={newSemName} onChange={e=>setNewSemName(limitSemesterInput(e.target.value))} disabled={creatingSem}/>
                </div>
                <div className="modalActions">
                    <button className="btn" onClick={()=>setShowSemModal(false)} disabled={creatingSem}>취소</button>
                    <button className="btn ok" onClick={handleCreateSem} disabled={creatingSem || !newSemName.trim()}>
                        {creatingSem ? "생성 중…" : "생성"}
                    </button>
                </div>
            </Modal>

            <Modal title="과목 추가" open={showSubModal} onClose={()=>setShowSubModal(false)}>
                <div className="field">
                    <label className="label">과목 이름</label>
                    <input className="input" value={newSubName} onChange={e=>setNewSubName(limitSubjectInput(e.target.value))} placeholder="예: 운영체제"/>
                </div>
                <div className="modalActions">
                    <button className="btn" onClick={()=>setShowSubModal(false)}>취소</button>
                    <button className="btn ok" onClick={handleCreateSubject}>추가</button>
                </div>
            </Modal>

            <Modal title={assignForm.assignId ? "과제 수정" : "새 과제 등록"} open={showAssignModal} onClose={()=>setShowAssignModal(false)}>
                <div className="field">
                    <label className="label">과목 선택</label>
                    <select className="input" value={assignForm.subId || ""} onChange={e=>setAssignForm(f=>({...f, subId:Number(e.target.value)}))}>
                        <option value="" disabled>과목 선택</option>
                        {subjects.map(s=><option key={s.subId} value={s.subId}>{s.subName}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label className="label">과제명</label>
                    <input className="input" value={assignForm.assignName} onChange={e=>setAssignForm(f=>({...f, assignName:e.target.value}))} placeholder="예: HW1 제출하기"/>
                </div>
                <div className="field">
                    <label className="label">마감일</label>
                    <DatePicker
                        selected={pickerDate}
                        onChange={(d)=>{
                            setPickerDate(d);
                            setAssignForm(f=>({...f, dueDate: d? toYMDLocal(d): "" }));
                        }}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="날짜를 선택하세요"
                        className="input"
                    />
                </div>
                <div className="field">
                    <label className="label">카테고리</label>
                    <select
                        className="input"
                        value={assignForm.category}
                        onChange={e=>setAssignForm(f=>({...f, category:Number(e.target.value)}))}
                    >
                        <option value={0}>과제</option>
                        <option value={1}>강의</option>
                        <option value={2}>할 일</option>
                    </select>
                </div>
                <div className="modalActions">
                    <button className="btn" onClick={()=>setShowAssignModal(false)}>취소</button>
                    <button className="btn ok" onClick={saveAssignment}>{assignForm.assignId? "수정":"등록"}</button>
                </div>
            </Modal>
        </div>
    );
};

export default function App(){
    const [user, setUser] = useState<User|null>(null);

    useEffect(() => {
        const savedUserStr = localStorage.getItem("2359:user");
        if (savedUserStr) {
            try {
                const savedUser = JSON.parse(savedUserStr);
                setUser(savedUser);
            } catch(e) {
                console.error("저장된 유저 정보 파싱 실패", e);
                localStorage.removeItem("2359:user");
            }
        }
    }, []);

    if(!user) return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <LoginView onSuccess={setUser} />
        </GoogleOAuthProvider>
    );

    return <DashboardView user={user} onLogout={()=>setUser(null)} />;
}