// frontend/src/App.tsx
import React, { useEffect, useState } from "react";
import "./styles.css";
import logoImg from "./assets/Logo.png";

/** ===== 타입 정의 ===== */
interface User { userId:number; userName:string }
interface SemesterItem { semId:number; semName:string; current?:boolean }
interface Subject { subId:number; subName:string }
interface Assignment {
    assignId:number; assignName:string; dueDate:string; category:number; isComplete:number;
    subId?:number; subName?:string; dueLabel?:string;
}
interface Dashboard {
    dashboard:{ userId:number; userName:string; semId:number; semName:string; subjectList:Subject[] };
    semesters:SemesterItem[];
    sections:{ incomplete:Assignment[]; complete:Assignment[] };
}

/** ===== API 공통 ===== */
const API_BASE = ""; // 동일 포트 정적서빙이면 상대경로로 OK
async function api<T>(path:string, init?:RequestInit):Promise<T>{
    const res = await fetch(`${API_BASE}${path}`, {
        ...init, // ← 먼저 펼치고
        headers: {
            "Content-Type":"application/json",
            ...(init?.headers || {}),  // ← 마지막에 병합해 Content-Type이 유지되도록
        },
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
    fetch(`/semester/${semId}`,{ method:"DELETE" }).then(()=>{});

const getDashboard = (userId:number, semId:number)=>
    api<Dashboard>(`/semester/${semId}/dashboard`,{ headers:{ "X-USER-ID":String(userId) } });

const createSubject = (semId:number, subName:string)=>
    api<Subject>(`/subject/${semId}`,{ method:"POST", body:JSON.stringify({ subName }) });

const deleteSubject = (subId:number)=>
    fetch(`/subject/${subId}`,{ method:"DELETE" }).then(()=>{});

const createAssignment = (subId:number, payload:{assignName:string;dueDate:string;category:number;})=>
    api<Assignment>(`/assignment/subject/${subId}`,{ method:"POST", body:JSON.stringify({ ...payload, subId }) });

const updateAssignment = (assignId:number, payload:{assignName:string;dueDate:string;category:number;subId:number;})=>
    api<Assignment>(`/assignment/${assignId}`,{ method:"PATCH", body:JSON.stringify(payload) });

const deleteAssignment = (assignId:number)=>
    fetch(`/assignment/${assignId}`,{ method:"DELETE" }).then(()=>{});

const toggleComplete = (assignId:number, isComplete:number)=>
    api<{assignId:number;isComplete:number;dueDate:string}>(`/assignment/${assignId}/complete`,{ method:"PATCH", body:JSON.stringify({ isComplete }) });

/** ===== 공용 모달: 시맨틱 구조 + 정돈된 여백 ===== */
const Modal:React.FC<{ title:string; open:boolean; onClose:()=>void; children:React.ReactNode }>=
    ({ title, open, onClose, children })=>{
        if(!open) return null;
        return (
            <div className="overlay" onClick={onClose}>
                <div className="modal" onClick={(e)=>e.stopPropagation()}>
                    <div className="modalHeader">
                        <div className="modalTitle">{title}</div>
                        <button className="btn" onClick={onClose}>닫기</button>
                    </div>
                    <div className="modalBody">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

/** ===== 로그인 화면 =====
 * - 항상 로그인부터 시작: localStorage에 사용자 저장하지 않음
 * - 로고는 로그인에서 쓰던 파일(Logo.png) 그대로 사용
 */
const LoginView:React.FC<{ onSuccess:(u:User)=>void }>=({ onSuccess })=>{
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|undefined>();

    async function handleLogin(){
        if(!name.trim()){ setError("이름을 입력하세요"); return; }
        setError(undefined); setLoading(true);
        try{
            const user = await createOrFetchUser(name.trim());
            onSuccess(user); // 세션 상태에만 올리고 저장 안 함
        }catch(e:any){
            setError(e.message || "로그인 실패");
        }finally{ setLoading(false); }
    }

    return (
        <div className="login-full">
            {/* 로그인에서는 헤더바 미노출 */}
            <div className="topbar login-hidden" />
            <div className="login-panel">
                <div className="logoRing"><img src={logoImg} alt="2359" /></div>
                <div className="loginTitleCenter">이름을 입력하세요</div>
                <input
                    className="inputLarge"
                    placeholder="예: 홍길동"
                    value={name}
                    onChange={(e)=>setName(e.target.value)}
                />
                {error && <div className="loginHelp" style={{ color:"#d32f2f" }}>{error}</div>}
                <button className="loginBigBtn" onClick={handleLogin} disabled={loading}>
                    {loading ? "진행 중…" : "2359 이용하기"}
                </button>
            </div>
        </div>
    );
};

/** ===== 대시보드 ===== */
const DashboardView:React.FC<{ user:User; onLogout:()=>void }>=({ user, onLogout })=>{
    // 마지막 학기 선택 기억 (학기 전환 UX용)
    const [semId, setSemId] = useState<number|null>(()=> {
        const s = localStorage.getItem("2359:lastSemId"); return s? Number(s) : null;
    });

    const [data, setData] = useState<Dashboard|null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|undefined>();

    // 모달 상태들
    const [showSemModal, setShowSemModal] = useState(false);
    const [newSemName, setNewSemName] = useState("");
    const [showSubModal, setShowSubModal] = useState(false);
    const [newSubName, setNewSubName] = useState("");
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignForm, setAssignForm] = useState<{ subId?:number; assignName:string; dueDate:string; category:number; assignId?:number }>({ assignName:"", dueDate:"", category:0 });
    const [creatingSem, setCreatingSem] = useState(false);

    const subjects = data?.dashboard.subjectList || [];

    // 대시보드 조회
    async function load(sem:number){
        setLoading(true); setError(undefined);
        try{
            const d = await getDashboard(user.userId, sem);
            setData(d); setSemId(sem); localStorage.setItem("2359:lastSemId", String(sem));
        }catch(e:any){
            setError(e.message || "불러오기 실패");
        }finally{ setLoading(false); }
    }
    useEffect(()=>{ if(semId!=null) load(semId); },[]);

    // 빈 상태 뷰
    const emptyState = (
        <div style={{display:"flex", alignItems:"center", justifyContent:"center", height:"60vh"}}>
            <div className="muted" style={{ textAlign:"center" }}>
                아직 학기 데이터가 없어요.<br/>
                좌측 상단의 <b>+ 새 학기</b>를 누르거나&nbsp;
                <button className="btn ok" onClick={()=>setShowSemModal(true)}>여기서 바로 만들기</button>
            </div>
        </div>
    );

    /** ===== 학기/과목/과제 액션 ===== */
    async function handleCreateSem(){
        if(!newSemName.trim()) return;
        try{
            setCreatingSem(true);                       // ← 로딩 시작
            // API 명세서 기준: POST /semester,  헤더 X-USER-ID, 바디 { semName }
            const s = await createSemester(user.userId, newSemName.trim());
            setShowSemModal(false);
            setNewSemName("");
            await load(s.semId);                        // 생성한 학기로 곧장 진입
        }catch(e:any){
            alert(e.message);
        }finally{
            setCreatingSem(false);                      // ← 로딩 끝
        }
    }
    async function handleDeleteSem(id:number){
        if(!confirm("학기를 삭제할까요?")) return;
        await deleteSemester(id);
        if(semId===id){ setData(null); setSemId(null); localStorage.removeItem("2359:lastSemId"); }
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
        if(edit){
            setAssignForm({ assignId:edit.assignId, subId:edit.subId || sub?.subId, assignName:edit.assignName, dueDate:edit.dueDate, category:edit.category });
        }else{
            setAssignForm({ subId:sub?.subId, assignName:"", dueDate:"", category:0 });
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

    return (
        <div className="app">
            {/* ===== 헤더바: 흰 글씨 유지, 로그아웃은 진한 배경+흰 글씨 ===== */}
            <div className="topbar">
                <img src={logoImg} alt="2359" className="brandLogo" />
                <div className="hello">
                    {user.userName}님, 안녕하세요!
                    <button
                        className="btn logout"     // ← 새 색 적용
                        onClick={()=>{
                            localStorage.removeItem("2359:lastSemId");
                            onLogout();
                        }}
                    >로그아웃</button>
                </div>
            </div>

            {/* ===== 본문 ===== */}
            <div className="shell">
                {/* 좌측: 학기 영역 */}
                <aside className="side">
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
                        <div className="h2">학기</div>
                        <button className="btn ok" onClick={()=>setShowSemModal(true)}>+ 새 학기</button>
                    </div>
                    <div className="semList">
                        {(data?.semesters || []).map(s=>(
                            <div key={s.semId} className="semItem">
                                <button
                                    className="btn"
                                    style={{ background:(data?.dashboard.semId===s.semId) ? "#DFE8FF" : "#fff" }}
                                    onClick={()=>load(s.semId)}
                                >
                                    {s.semName}
                                </button>
                                <button className="btn danger" onClick={()=>handleDeleteSem(s.semId)}>삭제</button>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* 오른쪽: 대시보드 */}
                <main className="main">
                    {loading && <div className="muted">불러오는 중...</div>}
                    {error && <div className="muted" style={{ color:"#d32f2f" }}>{error}</div>}

                    {!data ? (
                        emptyState
                    ) : (
                        <>
                            <div className="h1">과목</div>

                            {/* 과목 칩 + 추가 버튼 */}
                            <div className="toolbar" style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                                <div>
                                    {subjects.length===0 ? (
                                        <span className="muted">등록된 과목이 없습니다.</span>
                                    ) : (
                                        subjects.map(sub=>(
                                            <span key={sub.subId} className="chip" style={{display:"inline-flex",alignItems:"center",gap:6, padding:"8px 12px", borderRadius:999, background:"#EEE", marginRight:8, fontWeight:600}}>
                        <span>#{sub.subName}</span>
                        <button className="btn ghost" onClick={()=>handleDeleteSubject(sub.subId)}>x</button>
                        <button className="btn" onClick={()=>openAssignModal(sub)}>+ 과제</button>
                      </span>
                                        ))
                                    )}
                                </div>
                                <button className="btn ok" onClick={()=>setShowSubModal(true)}>+ 과목 추가</button>
                            </div>

                            {/* 완료/미완료 2칼럼 */}
                            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:24}}>
                                {/* 완료 */}
                                <div className="col">
                                    <div className="h1">완료된 과제</div>
                                    <div className="list" style={{display:"flex", flexDirection:"column", gap:14}}>
                                        {data.sections.complete.length===0
                                            ? <div className="muted">완료된 과제가 없습니다.</div>
                                            : data.sections.complete.map(a=>(
                                                <div key={a.assignId} className="doneCard">
                                                    <div style={{display:"flex", alignItems:"center"}}>
                                                        <div className="taskBadge">
                                                            <div>{a.dueLabel?.split(" ")[0] || "DUE"}</div>
                                                            <div style={{fontSize:12}}>{a.dueLabel?.split(" ")[1] || ""}</div>
                                                        </div>
                                                        <div style={{marginLeft:12}}>
                                                            <div className="muted">#{a.subName || ""}</div>
                                                            <div className="taskTitle">{a.assignName}</div>
                                                        </div>
                                                    </div>
                                                    <div className="actions">
                                                        <button className="btn" onClick={()=>openAssignModal(undefined,a)}>편집</button>
                                                        <button className="btn" onClick={()=>handleToggleComplete(a)}>되돌리기</button>
                                                        <button className="btn danger" onClick={()=>handleDeleteAssign(a.assignId)}>삭제</button>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>

                                {/* 미완료 */}
                                <div className="col">
                                    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                                        <div className="h1">해야할 과제</div>
                                        <button className="btn" onClick={()=>openAssignModal()}>+ 새 과제 등록</button>
                                    </div>
                                    <div className="list" style={{display:"flex", flexDirection:"column", gap:14}}>
                                        {data.sections.incomplete.length===0
                                            ? <div className="muted">해야할 과제가 없습니다.</div>
                                            : data.sections.incomplete.map(a=>(
                                                <div key={a.assignId} className="taskCard">
                                                    <div style={{display:"flex", alignItems:"center"}}>
                                                        <div className="taskBadge">
                                                            <div>{a.dueLabel?.split(" ")[0] || "DUE"}</div>
                                                            <div style={{fontSize:12}}>{a.dueLabel?.split(" ")[1] || ""}</div>
                                                        </div>
                                                        <div style={{marginLeft:12}}>
                                                            <div className="muted">#{a.subName || ""}</div>
                                                            <div className="taskTitle">{a.assignName}</div>
                                                        </div>
                                                    </div>
                                                    <div className="actions">
                                                        <button className="btn" title="편집" onClick={()=>openAssignModal(undefined,a)}>✎</button>
                                                        <button className="btn ok" title="완료" onClick={()=>handleToggleComplete(a)}>✔</button>
                                                        <button className="btn danger" title="삭제" onClick={()=>handleDeleteAssign(a.assignId)}>🗑</button>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* ===== 모달: 새 학기 ===== */}
            <Modal title="새 학기 생성" open={showSemModal} onClose={()=>setShowSemModal(false)}>
                <div className="field">
                    <label className="label">학기 이름</label>
                    <input
                        className="input"
                        placeholder="예: 2025년 1학기"
                        value={newSemName}
                        onChange={e=>setNewSemName(e.target.value)}
                        disabled={creatingSem}                 // ← 입력 중 잠금
                    />
                </div>
                <div className="modalActions">
                    <button className="btn" onClick={()=>setShowSemModal(false)} disabled={creatingSem}>취소</button>
                    <button className="btn ok" onClick={handleCreateSem} disabled={creatingSem || !newSemName.trim()}>
                        {creatingSem ? "생성 중…" : "생성"}     {/* ← 글씨 명확 + 상태 표시 */}
                    </button>
                </div>
            </Modal>

            {/* ===== 모달: 과목 ===== */}
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

            {/* ===== 모달: 과제 ===== */}
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
                    <input className="input" type="date" value={assignForm.dueDate} onChange={e=>setAssignForm(f=>({...f, dueDate:e.target.value}))}/>
                </div>
                <div className="field">
                    <label className="label">카테고리 (0~2)</label>
                    <input className="input" type="number" min={0} max={2} value={assignForm.category} onChange={e=>setAssignForm(f=>({...f, category:Number(e.target.value)}))}/>
                </div>
                <div className="modalActions">
                    <button className="btn" onClick={()=>setShowAssignModal(false)}>취소</button>
                    <button className="btn ok" onClick={saveAssignment}>{assignForm.assignId? "수정":"등록"}</button>
                </div>
            </Modal>
        </div>
    );
};

/** ===== 루트 컴포넌트 =====
 * - 항상 로그인부터 시작 (저장된 사용자 불러오지 않음)
 */
export default function App(){
    const [user, setUser] = useState<User|null>(null);
    if(!user) return <LoginView onSuccess={setUser} />;
    return <DashboardView user={user} onLogout={()=>setUser(null)} />;
}
