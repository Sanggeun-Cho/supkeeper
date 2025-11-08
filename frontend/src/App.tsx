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

/** ===== 타입 ===== */
interface User { userId:number; userName:string; lastSemId?: number | null }
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
const API_BASE = "/api"; // 동일 포트 정적서빙이면 비워도 OK

const CATEGORY_LABEL: Record<number, "과제" | "강의" | "할 일"> = {
    0: "과제",
    1: "강의",
    2: "할 일",
};

/** Date → 로컬 기준 YYYY-MM-DD (타임존 안전) */
function toYMDLocal(date: Date){
    const y = date.getFullYear();
    const m = `${date.getMonth()+1}`.padStart(2,"0");
    const d = `${date.getDate()}`.padStart(2,"0");
    return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD → 로컬 Date (00:00) */
function parseYMDLocal(ymd:string){
    const [y,m,d] = ymd.split("-").map(Number);
    return new Date(y, m-1, d, 0,0,0,0);
}

/** "YYYY-MM-DD" 또는 "YYYY-MM-DD HH:mm:ss.SSSSSS" → "YYYY-MM-DD" */
function pickYMD(dateStr: string): string | null {
    if (!dateStr) return null;
    const m = dateStr.match(/(\d{4})\D(\d{2})\D(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** 하루 추가 */
function shiftYMD(ymd: string, days: number): string {
    const [y,m,d] = ymd.split("-").map(Number);
    const dt = new Date(y, m-1, d);
    dt.setDate(dt.getDate() + days);
    return toYMDLocal(dt);
}

/** 화면 표시에만 적용할 날짜 보정값 (원하신 대로 +1일) */
const DATE_OFFSET_DAYS_FOR_DISPLAY = 1;

function getBadgeForFront(dueDate: string, isComplete: number, serverLabel?: string){
    // 완료(1)는 임박 아님
    if (isComplete === 1) return { label: serverLabel || "DUE", urgent: false };

    const ymd = pickYMD(dueDate);
    if (!ymd) return { label: serverLabel || "DUE", urgent: false };

    // 자정 기준 Date로 변환 (로컬)
    const due = (() => {
        const [y,m,d] = ymd.split("-").map(Number);
        const dt = new Date(y, m-1, d, 0, 0, 0, 0);
        return Number.isNaN(dt.getTime()) ? null : dt;
    })();
    if (!due) return { label: serverLabel || "DUE", urgent: false };

    const today = new Date();
    today.setHours(0,0,0,0);

    // 일수 차이(오늘=-1, 내일=0)
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

    // 캘린더는 임박 필요 없다고 하셨으니, 목록 배지 기준만 단순화
    // 서버가 임박 신호(2)를 주는 항목에서만 오늘/내일 라벨링
    if (diffDays === 0) return { label: "D-1",   urgent: true };
    if (diffDays === -1) return { label: "D-DAY", urgent: true };

    // 임박 신호(2)가 아닌 경우에는 기본 라벨 유지
    return { label: serverLabel || "DUE", urgent: false };
}

/** D-1/D-DAY 확대용 isD 클래스 추가 */
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

/** ===== API 래퍼 ===== */
const createOrFetchUser = (userName:string)=>
    api<User>("/user",{ method:"POST", body:JSON.stringify({ userName }) });

const createSemester = (userId:number, semName:string)=>
    api<SemesterItem>("/semester",{ method:"POST", headers:{ "X-USER-ID":String(userId) }, body:JSON.stringify({ semName }) });

const deleteSemester = (semId:number)=>
    api<void>(`/semester/${semId}`,{ method:"DELETE" });

const getDashboard = (userId:number, semId:number)=>
    api<Dashboard>(`/semester/${semId}/dashboard`,{ headers:{ "X-USER-ID":String(userId) } });

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

/** ✅ 달력 API 래퍼 (현재 학기 과제 채우기) */
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
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|undefined>();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [candidate, setCandidate] = useState("");

    // 묻지도 따지지도 않는 기존 로그인
    // async function handleLogin(){
    //     if(!name.trim()){ setError("이름을 입력하세요"); return; }
    //     setError(undefined); setLoading(true);
    //     try{
    //         const user = await createOrFetchUser(name.trim());
    //         onSuccess(user); // user: { userId, userName, lastSemId? }
    //     }catch(e:any){
    //         setError(e.message || "로그인 실패");
    //     }finally{ setLoading(false); }
    // }

    function handlePrecheck(){
        const nm = name.trim();
        if(!nm) { setError("이름을 입력하세요"); return; }
        setError(undefined);
        setCandidate(nm);
        setConfirmOpen(true);
    }

    async function handleConfirmLogin(){
        setLoading(true);
        try{
            const user = await createOrFetchUser(candidate);
            onSuccess(user);
        } catch(e:any){
            setError(e.message || "로그인 실패");
        } finally {
            setLoading(false);
            setConfirmOpen(false);
        }
    }

    return (
        <div className="login-full">
            <div className="topbar login-hidden" />
            <div className="login-panel">
                <div className="logoRing"><img src={logoImg} alt="2359" /></div>
                <div className="loginTitleCenter">이름을 입력하세요</div>
                <input className="inputLarge" placeholder="예: 홍길동" value={name} onChange={(e)=>setName(e.target.value)} />
                {error && <div className="loginHelp" style={{ color:"#d32f2f" }}>{error}</div>}
                <button className="loginBigBtn" onClick={handlePrecheck} disabled={loading}>{loading ? "진행 중…" : "2359 이용하기"}</button>
                {/* 새 이름 확인 모달 */}
                <Modal title="이름 확인" open={confirmOpen} onClose={()=>setConfirmOpen(false)}>
                  <div className="field">
                    <div className="label">입력한 이름</div>
                    <div><b>‘{candidate}’</b>(으)로 진행하시겠습니까?</div>
                    <div className="muted" style={{marginTop:6}}>
                      이미 존재하는 이름이면 해당 사용자의 학기로 이동하고,<br/>
                      없으면 새 사용자로 시작합니다.
                    </div>
                  </div>
                  <div className="modalActions">
                    <button className="btn" onClick={()=>setConfirmOpen(false)}>취소</button>
                    <button className="btn ok" onClick={handleConfirmLogin}>확인</button>
                  </div>
                </Modal>
            </div>
        </div>
    );
};

/** ===== 대시보드 ===== */
const DashboardView:React.FC<{ user:User; onLogout:()=>void }>=({ user, onLogout })=>{
    // 우선순위: localStorage > user.lastSemId > null
    const [semId, setSemId] = useState<number|null>(()=> {
        const saved = localStorage.getItem("2359:lastSemId");
        if (saved) return Number(saved);
        return (user.lastSemId ?? null) as number | null;
    });

    const [data, setData] = useState<Dashboard|null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|undefined>();

    // 모달 상태
    const [showSemModal, setShowSemModal]    = useState(false);
    const [newSemName, setNewSemName]        = useState("");
    const [showSubModal, setShowSubModal]    = useState(false);
    const [newSubName, setNewSubName]        = useState("");
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignForm, setAssignForm]        = useState<{ subId?:number; assignName:string; dueDate:string; category:number; assignId?:number }>({ assignName:"", dueDate:"", category:0 });
    const [pickerDate, setPickerDate]        = useState<Date|null>(null);
    const [creatingSem, setCreatingSem]      = useState(false);

    // 캘린더 상태
    const [showCalendar, setShowCalendar] = useState(false);
    const [calRefDate, setCalRefDate] = useState<Date>(new Date());
    const [calItems, setCalItems] = useState<{subName:string; dueDate:string; assignName:string; category:number}[]|null>(null);
    const [calLoading] = useState(false);
    const [calError] = useState<string|undefined>();

    // 배지 리프레시(1분 주기) – 저장 직후/시간 경과 시 갱신
    const [, setNowTick] = useState(0);
    useEffect(()=>{
        const t = setInterval(()=>setNowTick(Date.now()), 60_000);
        return ()=>clearInterval(t);
    },[]);

    const refreshingRef = React.useRef(false);

    const subjects = data?.dashboard.subjectList || [];

    /** 초기 부트스트랩 */
    useEffect(() => {
        (async () => {
            try{
                if(semId != null){
                    await load(semId);
                }else{
                    setData(null);
                    setShowSemModal(true); // 최초 사용자: 학기 생성 유도
                }
            }catch(e:any){
                setError(e.message || "초기화 실패");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 로그인 후 1회

    // 대시보드 조회
    async function load(sem:number){
        setLoading(true); setError(undefined);
        try{
            const d = await getDashboard(user.userId, sem);

            // ✅ subId → subName 매핑 (미지정 금지: 반드시 채움)
            const sMap = new Map<number, string>();
            (d.dashboard.subjectList || []).forEach(s => sMap.set(Number(s.subId), (s.subName || "").trim()));

            // 반드시 매핑 주입 (미지정 방지)
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

            setData(d); setSemId(sem);
            localStorage.setItem("2359:lastSemId", String(sem));
        }catch(e:any){
            setError(e.message || "불러오기 실패");
        }finally{ setLoading(false); }
    }

    async function silentRefresh(){
        if (!data?.dashboard.semId || refreshingRef.current) return;
        refreshingRef.current = true;
        try {
            const sem = data.dashboard.semId;
            const d = await getDashboard(user.userId, sem);

            // ── load()와 동일한 subId → subName 매핑 ──
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
    }, []);

    // 과목 id -> 이름 매핑
    const subNameById = useMemo(()=> {
        const map = new Map<number,string>();
        subjects.forEach(s=>map.set(Number(s.subId), s.subName));
        return map;
    }, [subjects]);

    // ✅ 항상 ID 매핑 우선, 없으면 응답 subName, 그래도 없으면 (과목#ID)
    function getSubjectName(a:Assignment): string{
        const key = a.subId != null ? Number(a.subId as any) : NaN;
        return subNameById.get(key) || (a.subName?.trim()) || `(과목#${key})`;
    }

    /** ===== 액션 ===== */
    async function handleCreateSem(){
        if(!newSemName.trim()) return;
        try{
            setCreatingSem(true);
            const s = await createSemester(user.userId, newSemName.trim());
            setShowSemModal(false); setNewSemName("");
            await load(s.semId); // 생성 직후 첫 대시보드 로드
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
                    const next = remaining.reduce((a,b)=> a.semId > b.semId ? a : b); // 가장 최신 id
                    await load(next.semId);
                }else{
                    await load(currentSemId);
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
        if(data) load(data.dashboard.semId);
    }

    function openAssignModal(sub?:Subject, edit?:Assignment){
        if (edit) {
            const raw = (edit.subId ?? sub?.subId) as any;
            const sid = (raw === 0 || raw) ? Number(raw) : undefined;

            // ✅ 어떤 형식이 와도 YMD로 뽑아서 프리셋
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

    // 달력 유틸
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

    // ✅ 학기 바뀌면 달력 캐시 초기화
    useEffect(()=>{ setCalItems(null); }, [data?.dashboard.semId]);

    // ✅ 달력 열릴 때 현재 학기 데이터 로드
    useEffect(()=>{
        if (showCalendar && data){
            getCalendar(data.dashboard.semId)
                .then(res => setCalItems(res.items || []))
                .catch(()=>setCalItems(null));
        }
    }, [showCalendar, data?.dashboard.semId]);

    // 달력용 집계 (서버 캘린더 API or 대시보드의 sections)
    type CalCell = { assignName:string; category:number; subName:string; isDone?:boolean };

    const calCellsByDate = useMemo(() => {
        const map = new Map<string, CalCell[]>();
        const list =
            calItems /* 서버 캘린더 API 결과(items) */
            ?? (data ? [...data.sections.incomplete, ...data.sections.complete] : []);

        list.forEach((a:any) => {
            const ymd = pickYMD(a.dueDate);
            if (!ymd) return;

            const plusDayOne = shiftYMD(ymd, DATE_OFFSET_DAYS_FOR_DISPLAY); // + 1일

            // category가 문자열로 올 수도 있으니 숫자로 보정
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

    // 빈 상태
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
                            <div key={s.semId} className="semRow">
                <span
                    className={`semLink ${selectedSemId===s.semId ? "active" : ""}`}
                    onClick={()=>load(s.semId)}
                    role="button" tabIndex={0}
                    onKeyDown={(e)=> (e.key==="Enter"||e.key===" ") && load(s.semId)}
                >{s.semName}</span>
                                <button
                                    className="semDelete plainX forceInk"
                                    title="삭제"
                                    aria-label={`${s.semName} 삭제`}
                                    onClick={()=>handleDeleteSem(s.semId)}
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
                            {/* 상단 과목 바(고정) */}
                            <div className="subjectsBar">
                                <div className="h1">과목</div>
                                <div className="toolbar wide">
                                    <div className="chips compact">
                                        {subjects.length===0 ? (
                                            <span className="muted">등록된 과목이 없습니다.</span>
                                        ) : (
                                            subjects.map(sub=>(
                                                <span key={sub.subId} className="chipPill strong slim">
                          <span className="chipText">{sub.subName}</span>
                          <button className="x" title="과목 삭제" onClick={()=>handleDeleteSubject(Number(sub.subId))}>×</button>
                        </span>
                                            ))
                                        )}
                                        {/* 칩 흐름에 + 포함 */}
                                        <button className="chipAdd inFlow" onClick={()=>setShowSubModal(true)} title="과목 추가" aria-label="과목 추가">
                                            <img src={addSubIcon} alt="" className="icon28"/>
                                        </button>
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
                                                    const hash = `# ${cat}  # ${sub}`;
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

                                    {/* 미완료 */}
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
                                                    const hash = `# ${cat}  # ${sub}`;
                                                    const badge = getBadgeForFront(a.dueDate, a.isComplete, a.dueLabel);

                                                    return (
                                                        <div key={a.assignId} className={`taskCapsule ${badge.urgent ? "urgent" : "todo"}`}>
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

                    {/* 달력 뷰어 */}
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

                            {/* 요일 헤더: 날짜 그리드와 분리 */}
                            <div className="calHeaderRow">
                                {["일","월","화","수","목","금","토"].map(d=>(
                                    <div key={d} className="calDow">{d}</div>
                                ))}
                            </div>

                            {/* 날짜 셀만 들어가는 그리드 */}
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
                                                                data-tip={`# ${CATEGORY_LABEL[it.category] ?? "과제"}  # ${it.subName || ""}`}
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

            {/* 모달: 새 학기 */}
            <Modal title="새 학기 생성" open={showSemModal} onClose={()=>setShowSemModal(false)}>
                <div className="field">
                    <label className="label">학기 이름</label>
                    <input className="input" placeholder="예: 2025년 1학기" value={newSemName} onChange={e=>setNewSemName(e.target.value)} disabled={creatingSem}/>
                </div>
                <div className="modalActions">
                    <button className="btn" onClick={()=>setShowSemModal(false)} disabled={creatingSem}>취소</button>
                    <button className="btn ok" onClick={handleCreateSem} disabled={creatingSem || !newSemName.trim()}>
                        {creatingSem ? "생성 중…" : "생성"}
                    </button>
                </div>
            </Modal>

            {/* 모달: 과목 */}
            <Modal title="과목 추가" open={showSubModal} onClose={()=>setShowSubModal(false)}>
                <div className="field">
                    <label className="label">과목 이름</label>
                    <input className="input" value={newSubName} onChange={e=>setNewSubName(e.target.value)} placeholder="예: 운영체제"/>
                </div>
                <div className="modalActions">
                    <button className="btn" onClick={()=>setShowSubModal(false)}>취소</button>
                    <button className="btn ok" onClick={handleCreateSubject}>추가</button>
                </div>
            </Modal>

            {/* 모달: 과제 */}
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
                            setAssignForm(f=>({...f, dueDate: d? toYMDLocal(d): "" }));  // UTC 변환 금지, 로컬 YYYY-MM-DD
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

/** ===== 루트 ===== */
export default function App(){
    const [user, setUser] = useState<User|null>(null);
    if(!user) return <LoginView onSuccess={setUser} />;
    return <DashboardView user={user} onLogout={()=>setUser(null)} />;
}
