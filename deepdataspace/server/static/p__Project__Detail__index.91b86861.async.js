"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[69],{17445:function(le,U,a){a.d(U,{Z:function(){return H}});var J=a(63900),E=a.n(J),V=a(88205),R=a.n(V),W=a(52983),F=a(85661);function H(L){var I=L.pageState,O=L.onInitPageState,B=L.onPageDidMount,y=L.onPageWillUnmount,p=(0,F.Z)({},{navigateMode:"replace"}),m=R()(p,2),D=m[0],Y=m[1];(0,W.useEffect)(function(){if(O){var A={};try{A=D.pageState?JSON.parse(D.pageState):{}}catch(X){console.error("get urlPageState error: ",X)}O(A,D)}return B&&B(D),function(){y&&y()}},[]),(0,W.useEffect)(function(){Y(E()(E()({},D),{},{pageState:JSON.stringify(I)}))},[I])}},91443:function(le,U,a){a.r(U),a.d(U,{default:function(){return be}});var J=a(34485),E=a.n(J),V=a(88205),R=a.n(V),W=a(89398),F=a(56744),H=a(68505),L=a(18288),I=a(81409),O=a(32030),B=a(13800),y=a(58174),p=a(65343),m=a(29880),D=a(23673),Y=a(17445),A=a(26237),X=a(42376),G=a(85791),S=a(60421),e=a(97458),ce=function(){var j=(0,p.useModel)("Project.detail"),x=j.pageData,u=j.assignModal,g=j.onCloseAssignModal,T=j.userLintRequest,C=j.assignModalFinish,d=x.projectDetail,M=(0,A.bU)(),t=M.localeText;return d?(0,e.jsxs)(X.Y,{title:u.types.includes(S.u.reassign)?t("proj.assign.modal.reassign"):t("proj.assign.modal.assign"),width:640,modalProps:{onCancel:g,destroyOnClose:!0,maskClosable:!1},visible:u.show,initialValues:u.initialValues,onFinish:C,children:[u.types.includes(S.u.labelLeader)&&(0,e.jsx)(G.Z,{label:t("proj.assign.modal.ll.label"),placeholder:t("proj.assign.modal.ll.placeholder"),tooltip:t("proj.assign.modal.ll.tooltip"),name:"labelLeaderId",fieldProps:{showSearch:!0,labelInValue:!1},debounceTime:300,request:T,rules:[{required:!0,message:t("proj.assign.modal.ll.msg")}]}),u.types.includes(S.u.reviewLeader)&&(0,e.jsx)(G.Z,{label:t("proj.assign.modal.rl.label"),placeholder:t("proj.assign.modal.rl.placeholder"),tooltip:t("proj.assign.modal.rl.tooltip"),name:"reviewLeaderId",fieldProps:{showSearch:!0,labelInValue:!1},debounceTime:300,request:T,rules:[{required:!0,message:t("proj.assign.modal.rl.msg")}]}),u.types.includes(S.u.labeler)&&(0,e.jsx)(G.Z.SearchSelect,{label:t("proj.assign.modal.ler.label"),placeholder:t("proj.assign.modal.ler.placeholder",{times:d.labelTimes}),tooltip:t("proj.assign.modal.ler.tootltip"),name:"labelerIds",fieldProps:{mode:"multiple",labelInValue:!1},debounceTime:300,request:T,rules:[{required:!0,message:t("proj.assign.modal.ler.msg",{times:d.labelTimes})},{len:d.labelTimes,transform:function(s){return s.length?"s".repeat(s.length):""},message:t("proj.assign.modal.ler.msgTimes",{times:d.labelTimes})}]}),u.types.includes(S.u.reviewer)&&(0,e.jsx)(G.Z.SearchSelect,{label:t("proj.assign.modal.rer.label"),placeholder:t("proj.assign.modal.rer.placeholder",{times:d.reviewTimes}),tooltip:t("proj.assign.modal.rer.tootltip"),name:"reviewerIds",fieldProps:{mode:"multiple",labelInValue:!1},debounceTime:300,request:T,rules:[{required:!0,message:t("proj.assign.modal.rer.msg",{times:d.reviewTimes})},{len:d.reviewTimes,transform:function(s){return s.length?"s".repeat(s.length):""},message:t("proj.assign.modal.rer.msgTimes",{times:d.reviewTimes})}]}),u.types.includes(S.u.reassign)&&(0,e.jsx)(G.Z,{label:t("proj.assign.modal.reassign.label"),placeholder:t("proj.assign.modal.reassign.placeholder"),name:"reassigner",fieldProps:{showSearch:!0,labelInValue:!1},debounceTime:300,request:T,rules:[{required:!0,message:t("proj.assign.modal.reassign.msg")}]})]}):null},pe=ce,ge=a(73974),se=a(52983),b=a(73205),K={container:"container___SbJNH",progress:"progress___E0MmQ",progressItem:"progressItem___NiZAB",labels:"labels___TBmcS",split:"split___NOm1V"},ve=function(j){var x=j.data,u=(0,A.bU)(),g=u.localeText;if(!x)return(0,e.jsx)(e.Fragment,{children:"-"});var T=x.labelNumWaiting,C=x.reviewNumWaiting,d=x.reviewNumRejected,M=x.reviewNumAccepted,t=T+C+d+M,h=[{label:g("proj.taskProgress.done"),color:"#72c240",progressColor:"#72c240",value:M},{label:g("proj.taskProgress.inRework"),color:"#ec5b56",progressColor:"#ec5b56",value:d},{label:g("proj.taskProgress.toReview"),color:"#448ef7",progressColor:"#448ef7",value:C},{label:g("proj.taskProgress.toLabel"),color:"#575252",progressColor:"#e4e4e4",value:T}];return(0,e.jsxs)("div",{className:K.container,children:[(0,e.jsx)("div",{className:K.progress,children:h.map(function(s,k){return(0,e.jsx)("div",{className:K.progressItem,style:{backgroundColor:s.progressColor,width:"".concat(s.value*100/t,"%")}},k)})}),(0,e.jsx)("div",{className:K.labels,children:h.map(function(s,k){return(0,e.jsxs)("div",{style:{color:s.color},children:[k!==0?(0,e.jsx)("span",{className:K.split,children:"|"}):null,(0,e.jsx)("span",{children:s.label}),"(",s.value,")"]},k)})})]})},ne=ve,me=function(){var j=(0,p.useModel)("Project.auth"),x=j.getUserRoles,u=j.checkPermission,g=(0,p.useModel)("Project.detail"),T=g.taskDetailModalIndex,C=g.setTaskDetailModalIndex,d=g.pageData,M=g.reassignWorker,t=(0,A.bU)(),h=t.localeText,s=T!==void 0?d.list[T]:void 0,k=(0,se.useMemo)(function(){return s?s.labelers.concat(s.reviewers):[]},[s]),ee=function(o){var P=[],Q=x(d.projectDetail,s);return(u(Q,b.Oc.AssignLabeler)&&o.role===b.vb.Labeler||u(Q,b.Oc.AssignReviewer)&&o.role===b.vb.Reviewer)&&P.push((0,e.jsx)("a",{style:{color:"#2db7f5"},onClick:function(){return M(s,o)},children:h("proj.detail.modal.reassign")},"Reassign")),P},_=[{title:h("proj.detail.modal.index"),valueType:"index",width:80},{title:h("proj.detail.modal.role"),dataIndex:"role"},{title:h("proj.detail.modal.worker"),ellipsis:!0,render:function(o,P){return(0,e.jsx)(D.Z,{isPerson:!0,data:[{text:P.userName}]})}},{title:h("proj.detail.modal.progress"),ellipsis:!0,width:350,render:function(o,P){return(0,e.jsx)(ne,{data:P})}},{title:h("proj.detail.modal.action"),valueType:"option",key:"option",render:function(o,P){return ee(P)}}];return(0,e.jsx)(ge.Z,{title:h("proj.detail.modal.title",{id:s==null?void 0:s.id}),width:1200,open:Boolean(s),onCancel:function(){return C(void 0)},destroyOnClose:!0,footer:null,children:s&&(0,e.jsx)(I.Z,{scroll:{x:800},rowKey:"id",columns:_,cardBordered:!0,dataSource:k,toolBarRender:function(){return[(0,e.jsx)(e.Fragment,{})]},options:!1,search:!1})})},je=me,he=a(19950),$={page:"page___HrYAe",table:"table___vpXyu",actionCell:"actionCell___NNJhx"},oe=a(32997),fe=function(){var j,x,u,g,T=(0,p.useModel)("user"),C=T.user,d=(0,p.useModel)("Project.auth"),M=d.getUserRoles,t=d.checkPermission,h=(0,se.useState)(!1),s=R()(h,2),k=s[0],ee=s[1],_=(0,he.Z)(document.querySelector(".ant-pro-grid-content")),c=(0,p.useModel)("Project.detail"),o=c.pageData,P=c.pageState,Q=c.loading,ie=c.onSelectChange,xe=c.onPageChange,Te=c.onInitPageState,Ce=c.setTaskDetailModalIndex,de=c.assignLeaders,Pe=c.assignWorker,De=c.restartTask,ue=c.onChangeTaskResult;(0,Y.Z)({onInitPageState:Te,pageState:P});var Le=(0,A.bU)(),i=Le.localeText,Ie=function(l,r){if(!o.projectDetail)return[];var n=[],f=M(o.projectDetail,l);t(f,b.Oc.AssignLeader)&&n.push((0,e.jsx)("a",{style:{color:"#2db7f5"},onClick:function(){return de([l.id])},children:i("proj.table.detail.action.assignLeader")},"assignLeader"));var Z=t(f,b.Oc.AssignLabeler)&&o.projectDetail.labelTimes>0&&l.labelers.length<=0,z=t(f,b.Oc.AssignReviewer)&&o.projectDetail.reviewTimes>0&&l.reviewers.length<=0;if(Z||z){var N=[];Z&&N.push(S.u.labeler),z&&N.push(S.u.reviewer),n.push((0,e.jsx)("a",{style:{color:"#2db7f5"},onClick:function(){return Pe(l,N)},children:i("proj.table.detail.action.assignWorker")},"assignWorker"))}(l.labelers.length||l.reviewers.length)&&n.push((0,e.jsx)("a",{onClick:function(){return Ce(r)},children:i("proj.table.detail.action.detail")},"detail")),t(f,b.Oc.RestartTask)&&l.status===m.gZ.Rejected&&n.push((0,e.jsx)("a",{style:{color:"#4fbb30"},onClick:function(){return De(l)},children:i("proj.table.detail.action.restart")},"restart")),t(f,b.Oc.TaskQa)&&((l.status===m.gZ.Reviewing||l.status===m.gZ.Rejected)&&n.push((0,e.jsx)("a",{style:{color:"#4fbb30"},onClick:function(){return ue(l,l.status===m.gZ.Rejected?m.JE.ForceAccept:m.JE.Accept)},children:i("proj.table.detail.action.accept")},"accept")),l.status===m.gZ.Reviewing&&n.push((0,e.jsx)(O.Z,{title:"Are you sure to reject this task?",onConfirm:function(){return ue(l,m.JE.Reject)},children:(0,e.jsx)("a",{style:{color:"red"},children:i("proj.table.detail.action.reject")},"reject")},"reject")));var ae="/project/task/workspace?projectId=".concat((0,oe.Oe)(),"&taskId=").concat(l.id);if(t(f,b.Oc.View)&&n.push((0,e.jsx)(p.Link,{to:ae,children:i("proj.table.detail.action.view")},"view")),t(f,b.Oc.StartLabel)){var te,Me=(te=l.labelers.find(function(w){return w.userId===C.userId}))===null||te===void 0?void 0:te.id,ke=encodeURIComponent(JSON.stringify({status:m.j$.Labeling,roleId:Me}));n.push((0,e.jsx)(p.Link,{to:"".concat(ae,"&pageState=").concat(ke),children:i("proj.table.detail.action.startLabel")},"StartLabel"))}if(t(f,b.Oc.StartReview)){var re,we=(re=l.reviewers.find(function(w){return w.userId===C.userId}))===null||re===void 0?void 0:re.id,Se=encodeURIComponent(JSON.stringify({status:m.j$.Reviewing,roleId:we}));n.push((0,e.jsx)(p.Link,{to:"".concat(ae,"&pageState=").concat(Se),children:i("proj.table.detail.action.startReview")},"StartReview"))}return n},ye=[{title:i("proj.table.detail.index"),valueType:"index",width:80,render:function(l,r){return r.idx+1}},{title:i("proj.table.detail.labelLeader"),ellipsis:!0,width:200,render:function(l,r){return r.labelLeader?(0,e.jsx)(D.Z,{isPerson:!0,data:[{text:r.labelLeader.userName,color:"green"}]}):"-"}},{title:i("proj.table.detail.labeler"),dataIndex:"labeler",ellipsis:!0,width:200,render:function(l,r){return r.labelers&&r.labelers.length?(0,e.jsx)(D.Z,{isPerson:!0,data:(r.labelers||[]).map(function(n){return{text:n.userName}})}):"-"}}].concat(E()(o.projectDetail&&o.projectDetail.reviewTimes>0?[{title:i("proj.table.detail.reviewLeader"),ellipsis:!0,width:200,render:function(l,r){return r.reviewLeader?(0,e.jsx)(D.Z,{isPerson:!0,data:[{text:r.reviewLeader.userName,color:"green"}]}):"-"}},{title:i("proj.table.detail.reviewer"),dataIndex:"reviewer",ellipsis:!0,width:200,render:function(l,r){return r.reviewers&&r.reviewers.length?(0,e.jsx)(D.Z,{isPerson:!0,data:(r.reviewers||[]).map(function(n){return{text:n.userName}})}):"-"}}]:[]),[{title:i("proj.table.detail.progress"),dataIndex:"progress",valueType:"progress",ellipsis:!0,width:350,render:function(l,r){var n,f,Z=((n=r.labelLeader)===null||n===void 0?void 0:n.userId)!==C.userId&&r.labelers.length===1&&r.labelers[0].userId===C.userId,z=((f=r.reviewLeader)===null||f===void 0?void 0:f.userId)!==C.userId&&r.reviewers.length===1&&r.reviewers[0].userId===C.userId,N=r.labelLeader;return Z&&!z?N=r.labelers[0]:z&&!Z&&(N=r.reviewers[0]),r.labelers.length>0||r.reviewers.length>0?(0,e.jsx)(ne,{data:N}):"-"}},{title:i("proj.table.detail.status"),dataIndex:"status",valueType:"select",ellipsis:!0,width:120,render:function(l,r){if(r.status){var n=m.ZA[r.status],f=n.text,Z=n.color;return(0,e.jsx)(B.Z,{color:Z,children:i(f)})}}},{title:i("proj.table.detail.action"),valueType:"option",key:"option",width:240,render:function(l,r,n){return(0,e.jsx)("div",{className:$.actionCell,children:Ie(r,n)})}}]);return(0,e.jsxs)(L._z,{className:$.page,header:{title:(j=o.projectDetail)===null||j===void 0?void 0:j.name,backIcon:(0,e.jsx)(W.Z,{}),onBack:function(){return(0,oe.yS)("/project")},extra:[(0,e.jsxs)("div",{style:{color:"rgba(0, 0, 0, 0.45)"},children:[i("proj.detail.owner"),":"," ",(x=o.projectDetail)===null||x===void 0?void 0:x.owner.name," |"," ",i("proj.detail.managers"),":"," ",(u=o.projectDetail)===null||u===void 0?void 0:u.managers.map(function(v){return v.name}).join(", ")]},"owner"),(0,e.jsx)(y.ZP,{size:"small",type:"text",icon:k?(0,e.jsx)(F.Z,{}):(0,e.jsx)(H.Z,{}),onClick:function(){return ee(function(l){return!l})}},"icon")],breadcrumb:{}},content:k?null:(g=o.projectDetail)===null||g===void 0?void 0:g.description,children:[(0,e.jsx)(I.Z,{rowKey:"id",className:$.table,scroll:{x:1200,y:_!=null&&_.height?_.height-124:void 0},columns:ye,cardBordered:!0,dataSource:o.list,toolBarRender:function(){return[(0,e.jsx)(e.Fragment,{})]},options:!1,search:!1,rowSelection:t(M(o.projectDetail),b.Oc.AssignLeader)?{getCheckboxProps:function(l){return{disabled:Boolean(l.labelLeader||l.reviewLeader)}},selectedRowKeys:o.selectedTaskIds,onChange:ie}:!1,tableAlertOptionRender:function(){return(0,e.jsxs)(y.ZP,{type:"primary",onClick:function(){return de()},children:["+ ",i("proj.table.detail.batchAssignLeader")]})},loading:Q,pagination:{current:P.page,pageSize:P.pageSize,total:o.total,showSizeChanger:!0,onChange:xe}}),(0,e.jsx)(je,{}),(0,e.jsx)(pe,{})]})},be=fe},23673:function(le,U,a){a.d(U,{Z:function(){return F}});var J=a(41474),E=a(13800),V={tagsWrap:"tagsWrap___bmrPM"},R=a(97458),W=function(L){var I=L.data,O=L.max,B=L.isPerson,y=O?I.slice(0,O):I;return(0,R.jsxs)("div",{className:V.tagsWrap,children:[y&&y.map(function(p){return(0,R.jsx)(E.Z,{icon:B?(0,R.jsx)(J.Z,{}):null,color:p.color||"geekblue",children:p.text},p.text)}),y.length<I.length?"...":""]})},F=W}}]);
