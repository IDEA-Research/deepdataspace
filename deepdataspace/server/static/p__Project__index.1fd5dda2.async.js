"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[721],{28897:function(te,U,e){var w=e(8671),L=e(47287),k=e(52983),D=e(86606),A=e(97458),T=["fieldProps","proFieldProps"],Q=["fieldProps","proFieldProps"],x="text",W=function(b){var g=b.fieldProps,F=b.proFieldProps,d=(0,L.Z)(b,T);return(0,A.jsx)(D.Z,(0,w.Z)({valueType:x,fieldProps:g,filedConfig:{valueType:x},proFieldProps:F},d))},R=function(b){var g=b.fieldProps,F=b.proFieldProps,d=(0,L.Z)(b,Q);return(0,A.jsx)(D.Z,(0,w.Z)({valueType:"password",fieldProps:g,proFieldProps:F,filedConfig:{valueType:x}},d))},$=W;$.Password=R,$.displayName="ProFormComponent",U.Z=$},17445:function(te,U,e){e.d(U,{Z:function(){return Q}});var w=e(63900),L=e.n(w),k=e(88205),D=e.n(k),A=e(52983),T=e(85661);function Q(x){var W=x.pageState,R=x.onInitPageState,$=x.onPageDidMount,O=x.onPageWillUnmount,b=(0,T.Z)({},{navigateMode:"replace"}),g=D()(b,2),F=g[0],d=g[1];(0,A.useEffect)(function(){if(R){var H={};try{H=F.pageState?JSON.parse(F.pageState):{}}catch(n){console.error("get urlPageState error: ",n)}R(H,F)}return $&&$(F),function(){O&&O()}},[]),(0,A.useEffect)(function(){d(L()(L()({},F),{},{pageState:JSON.stringify(W)}))},[W])}},23673:function(te,U,e){e.d(U,{Z:function(){return T}});var w=e(41474),L=e(13800),k={tagsWrap:"tagsWrap___bmrPM"},D=e(97458),A=function(x){var W=x.data,R=x.max,$=x.isPerson,O=R?W.slice(0,R):W;return(0,D.jsxs)("div",{className:k.tagsWrap,children:[O&&O.map(function(b){return(0,D.jsx)(L.Z,{icon:$?(0,D.jsx)(w.Z,{}):null,color:b.color||"geekblue",children:b.text},b.text)}),O.length<W.length?"...":""]})},T=A},71689:function(te,U,e){e.r(U),e.d(U,{default:function(){return Po}});var w=e(18288),L=e(81409),k=e(32030),D=e(13800),A=e(58174),T=e(65343),Q=e(24454),x=e.n(Q),W=e(56592),R=e.n(W),$=e(84377),O=e(5102),b=e(28897),g=e(8671),F=e(47287),d=e(52983),H=e(86606),n=e(97458),Pe=["fieldProps","proFieldProps"],je=function(o,a){var r=o.fieldProps,l=o.proFieldProps,c=(0,F.Z)(o,Pe);return(0,n.jsx)(H.Z,(0,g.Z)({ref:a,valueType:"textarea",fieldProps:r,proFieldProps:l},c))},se=d.forwardRef(je),ie=e(85791),re=e(64229),xe=e(44580),de=e(22702),Ce=["options","fieldProps","proFieldProps","valueEnum"],ye=d.forwardRef(function(t,o){var a=t.options,r=t.fieldProps,l=t.proFieldProps,c=t.valueEnum,m=(0,F.Z)(t,Ce);return(0,n.jsx)(H.Z,(0,g.Z)({ref:o,valueType:"checkbox",valueEnum:(0,re.h)(c,void 0),fieldProps:(0,g.Z)({options:a},r),lightProps:(0,g.Z)({labelFormatter:function(){return(0,n.jsx)(H.Z,(0,g.Z)({ref:o,valueType:"checkbox",mode:"read",valueEnum:(0,re.h)(c,void 0),filedConfig:{customLightMode:!0},fieldProps:(0,g.Z)({options:a},r),proFieldProps:l},m))}},m.lightProps),proFieldProps:l},m))}),be=d.forwardRef(function(t,o){var a=t.fieldProps,r=t.children;return(0,n.jsx)(xe.Z,(0,g.Z)((0,g.Z)({ref:o},a),{},{children:r}))}),Me=(0,de.G)(be,{valuePropName:"checked"}),ce=Me;ce.Group=ye;var Fe=ce,ue=e(49532),pe=e(56084),Se=["fieldProps","options","radioType","layout","proFieldProps","valueEnum"],Ee=d.forwardRef(function(t,o){var a=t.fieldProps,r=t.options,l=t.radioType,c=t.layout,m=t.proFieldProps,P=t.valueEnum,C=(0,F.Z)(t,Se);return(0,n.jsx)(H.Z,(0,g.Z)((0,g.Z)({valueType:l==="button"?"radioButton":"radio",ref:o,valueEnum:(0,re.h)(P,void 0)},C),{},{fieldProps:(0,g.Z)({options:r,layout:c},a),proFieldProps:m,filedConfig:{customLightMode:!0}}))}),Te=d.forwardRef(function(t,o){var a=t.fieldProps,r=t.children;return(0,n.jsx)(pe.ZP,(0,g.Z)((0,g.Z)({},a),{},{ref:o,children:r}))}),Ze=(0,de.G)(Te,{valuePropName:"checked",ignoreWidth:!0}),ee=Ze;ee.Group=Ee,ee.Button=pe.ZP.Button,ee.displayName="ProFormComponent";var me=ee,Ie=["fieldProps","min","proFieldProps","max"],Oe=function(o,a){var r=o.fieldProps,l=o.min,c=o.proFieldProps,m=o.max,P=(0,F.Z)(o,Ie);return(0,n.jsx)(H.Z,(0,g.Z)({valueType:"digit",fieldProps:(0,g.Z)({min:l,max:m},r),ref:a,filedConfig:{defaultProps:{width:"100%"}},proFieldProps:c},P))},Be=d.forwardRef(Oe),$e=Be,Ne=e(73974),ze=e(12684),De=e(45171),We=e(22494),Re=e(38634),Le=e(67552),Ae=e(87608),ae=e.n(Ae),Ge=e(77089),Ue=e(6453),we=e(41564),He=e(17374),Ke=e(30730),Ve=e(52636),Je=e(58684),ke=e(29656),Qe=function(t){(0,Je.Z)(a,t);var o=(0,ke.Z)(a);function a(){var r;return(0,Ke.Z)(this,a),r=o.apply(this,arguments),r.state={error:void 0,info:{componentStack:""}},r}return(0,Ve.Z)(a,[{key:"componentDidCatch",value:function(l,c){this.setState({error:l,info:c})}},{key:"render",value:function(){const{message:l,description:c,children:m}=this.props,{error:P,info:C}=this.state,M=C&&C.componentStack?C.componentStack:null,N=typeof l=="undefined"?(P||"").toString():l,B=typeof c=="undefined"?M:c;return P?d.createElement(fe,{type:"error",message:N,description:d.createElement("pre",{style:{fontSize:"0.9em",overflowX:"auto"}},B)}):m}}]),a}(d.Component),Xe=e(93411),Ye=e(19573),qe=e(26554);const oe=(t,o,a,r,l)=>({backgroundColor:t,border:`${r.lineWidth}px ${r.lineType} ${o}`,[`${l}-icon`]:{color:a}}),_e=t=>{const{componentCls:o,motionDurationSlow:a,marginXS:r,marginSM:l,fontSize:c,fontSizeLG:m,lineHeight:P,borderRadiusLG:C,motionEaseInOutCirc:M,alertIconSizeLG:N,colorText:B,paddingContentVerticalSM:s,alertPaddingHorizontal:Z,paddingMD:j,paddingContentHorizontalLG:K}=t;return{[o]:Object.assign(Object.assign({},(0,qe.Wf)(t)),{position:"relative",display:"flex",alignItems:"center",padding:`${s}px ${Z}px`,wordWrap:"break-word",borderRadius:C,[`&${o}-rtl`]:{direction:"rtl"},[`${o}-content`]:{flex:1,minWidth:0},[`${o}-icon`]:{marginInlineEnd:r,lineHeight:0},["&-description"]:{display:"none",fontSize:c,lineHeight:P},"&-message":{color:B},[`&${o}-motion-leave`]:{overflow:"hidden",opacity:1,transition:`max-height ${a} ${M}, opacity ${a} ${M},
        padding-top ${a} ${M}, padding-bottom ${a} ${M},
        margin-bottom ${a} ${M}`},[`&${o}-motion-leave-active`]:{maxHeight:0,marginBottom:"0 !important",paddingTop:0,paddingBottom:0,opacity:0}}),[`${o}-with-description`]:{alignItems:"flex-start",paddingInline:K,paddingBlock:j,[`${o}-icon`]:{marginInlineEnd:l,fontSize:N,lineHeight:0},[`${o}-message`]:{display:"block",marginBottom:r,color:B,fontSize:m},[`${o}-description`]:{display:"block"}},[`${o}-banner`]:{marginBottom:0,border:"0 !important",borderRadius:0}}},eo=t=>{const{componentCls:o,colorSuccess:a,colorSuccessBorder:r,colorSuccessBg:l,colorWarning:c,colorWarningBorder:m,colorWarningBg:P,colorError:C,colorErrorBorder:M,colorErrorBg:N,colorInfo:B,colorInfoBorder:s,colorInfoBg:Z}=t;return{[o]:{"&-success":oe(l,r,a,t,o),"&-info":oe(Z,s,B,t,o),"&-warning":oe(P,m,c,t,o),"&-error":Object.assign(Object.assign({},oe(N,M,C,t,o)),{[`${o}-description > pre`]:{margin:0,padding:0}})}}},oo=t=>{const{componentCls:o,iconCls:a,motionDurationMid:r,marginXS:l,fontSizeIcon:c,colorIcon:m,colorIconHover:P}=t;return{[o]:{["&-action"]:{marginInlineStart:l},[`${o}-close-icon`]:{marginInlineStart:l,padding:0,overflow:"hidden",fontSize:c,lineHeight:`${c}px`,backgroundColor:"transparent",border:"none",outline:"none",cursor:"pointer",[`${a}-close`]:{color:m,transition:`color ${r}`,"&:hover":{color:P}}},"&-close-text":{color:m,transition:`color ${r}`,"&:hover":{color:P}}}}},to=t=>[_e(t),eo(t),oo(t)];var ro=(0,Xe.Z)("Alert",t=>{const{fontSizeHeading3:o}=t,a=(0,Ye.TS)(t,{alertIconSizeLG:o,alertPaddingHorizontal:12});return[to(a)]}),ao=function(t,o){var a={};for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&o.indexOf(r)<0&&(a[r]=t[r]);if(t!=null&&typeof Object.getOwnPropertySymbols=="function")for(var l=0,r=Object.getOwnPropertySymbols(t);l<r.length;l++)o.indexOf(r[l])<0&&Object.prototype.propertyIsEnumerable.call(t,r[l])&&(a[r[l]]=t[r[l]]);return a};const no={success:ze.Z,info:Le.Z,error:De.Z,warning:Re.Z},lo=t=>{const{icon:o,prefixCls:a,type:r}=t,l=no[r]||null;return o?(0,He.wm)(o,d.createElement("span",{className:`${a}-icon`},o),()=>({className:ae()(`${a}-icon`,{[o.props.className]:o.props.className})})):d.createElement(l,{className:`${a}-icon`})},so=t=>{const{isClosable:o,closeText:a,prefixCls:r,closeIcon:l,handleClose:c}=t;return o?d.createElement("button",{type:"button",onClick:c,className:`${r}-close-icon`,tabIndex:0},a?d.createElement("span",{className:`${r}-close-text`},a):l):null},ve=t=>{var{description:o,prefixCls:a,message:r,banner:l,className:c,rootClassName:m,style:P,onMouseEnter:C,onMouseLeave:M,onClick:N,afterClose:B,showIcon:s,closable:Z,closeText:j,closeIcon:K=d.createElement(We.Z,null),action:f}=t,G=ao(t,["description","prefixCls","message","banner","className","rootClassName","style","onMouseEnter","onMouseLeave","onClick","afterClose","showIcon","closable","closeText","closeIcon","action"]);const[X,z]=d.useState(!1),p=d.useRef(),{getPrefixCls:i,direction:v}=d.useContext(Ue.E_),u=i("alert",a),[y,E]=ro(u),J=V=>{var _;z(!0),(_=G.onClose)===null||_===void 0||_.call(G,V)},h=()=>{const{type:V}=G;return V!==void 0?V:l?"warning":"info"},I=j?!0:Z,Y=h(),he=l&&s===void 0?!0:s,jo=ae()(u,`${u}-${Y}`,{[`${u}-with-description`]:!!o,[`${u}-no-icon`]:!he,[`${u}-banner`]:!!l,[`${u}-rtl`]:v==="rtl"},c,m,E),xo=(0,we.Z)(G);return y(d.createElement(Ge.ZP,{visible:!X,motionName:`${u}-motion`,motionAppear:!1,motionEnter:!1,onLeaveStart:V=>({maxHeight:V.offsetHeight}),onLeaveEnd:B},V=>{let{className:_,style:Co}=V;return d.createElement("div",Object.assign({ref:p,"data-show":!X,className:ae()(jo,_),style:Object.assign(Object.assign({},P),Co),onMouseEnter:C,onMouseLeave:M,onClick:N,role:"alert"},xo),he?d.createElement(lo,{description:o,icon:G.icon,prefixCls:u,type:Y}):null,d.createElement("div",{className:`${u}-content`},r?d.createElement("div",{className:`${u}-message`},r):null,o?d.createElement("div",{className:`${u}-description`},o):null),f?d.createElement("div",{className:`${u}-action`},f):null,d.createElement(so,{isClosable:!!I,closeText:j,prefixCls:u,closeIcon:K,handleClose:J}))}))};ve.ErrorBoundary=Qe;var fe=ve,ge=e(26237),io=e(22745),S=e(29880),q=e(73205),co=function(){var o=(0,T.useModel)("user"),a=o.user,r=(0,T.useModel)("Project.list"),l=r.projectModal,c=r.closeProjectModal,m=r.onProjectModalCurrentChange,P=r.projectModalNext,C=r.projectModalFinish,M=(0,T.useModel)("Project.auth"),N=M.checkPermission,B=(0,ge.bU)(),s=B.localeText,Z=(0,d.useRef)([]),j=l.targetProject,K=j&&j.status!==S.tz.Waiting,f=Boolean(j),G=j&&!N(j.userRoles,q.Oc.ProjectEdit),X=K||l.disableInitProject,z=function(i){if(!j||!K){var v,u,y,E=(v=Z.current)===null||v===void 0?void 0:v[0],J=(u=Z.current)===null||u===void 0?void 0:u[1],h=E==null||(y=E.current)===null||y===void 0?void 0:y.getFieldValue(["basics","managerIds"]),I=h==null?void 0:h.includes(a.userId);if(!I){var Y;J==null||(Y=J.current)===null||Y===void 0||Y.setFieldValue(["workflowInitNow"],[])}}return P(i)};return(0,n.jsx)(Ne.Z,{title:s(j?"proj.editModal.editProj":"proj.editModal.newProj"),width:750,open:l.show,onCancel:c,destroyOnClose:!0,footer:null,maskClosable:!1,children:(0,n.jsxs)(O.L,{formMapRef:Z,current:l.current,onCurrentChange:m,onFinish:C,formProps:{initialValues:l.initialValues},children:[(0,n.jsxs)(O.L.StepForm,{name:"basics",title:s("proj.editModal.stepForm.title"),stepProps:{description:s("proj.editModal.stepForm.desc")},onFinish:z,disabled:G,children:[(0,n.jsx)(b.Z,{label:s("proj.editModal.stepForm.name.label"),placeholder:s("proj.editModal.stepForm.name.placeholder"),name:["basics","name"],rules:[{required:!0,message:s("proj.editModal.stepForm.name.rule")}],disabled:f}),(0,n.jsx)(se,{label:s("proj.editModal.stepForm.desc.label"),placeholder:s("proj.editModal.stepForm.desc.placeholder"),name:["basics","description"]}),(0,n.jsx)(ie.Z.SearchSelect,{label:s("proj.editModal.stepForm.dataset.label"),placeholder:s("proj.editModal.stepForm.dataset.placeholder"),name:["basics","datasetIds"],fieldProps:{mode:"multiple",labelInValue:!1},debounceTime:300,request:function(){var p=R()(x()().mark(function i(v){var u,y,E;return x()().wrap(function(h){for(;;)switch(h.prev=h.next){case 0:if(u=v.keyWords,y=u===void 0?"":u,E=(j==null?void 0:j.datasets)||[],!y){h.next=6;break}return h.next=5,(0,$.J9)({name:y,purpose:"label_project"});case 5:return h.abrupt("return",h.sent.datasetList.map(function(I){return{label:I.name,value:I.id,disabled:!I.valid}}));case 6:return h.abrupt("return",E.map(function(I){return{label:I.name,value:I.id}}));case 7:case"end":return h.stop()}},i)}));return function(i){return p.apply(this,arguments)}}(),rules:[{required:!0,message:s("proj.editModal.stepForm.dataset.rule"),type:"array"}],disabled:f}),(0,n.jsx)(se,{label:s("proj.editModal.stepForm.category.label"),placeholder:s("proj.editModal.stepForm.category.placeholder"),name:["basics","categories"],rules:[{required:!0,message:s("proj.editModal.stepForm.category.rule")}],disabled:f}),(0,n.jsx)(ie.Z.SearchSelect,{label:s("proj.editModal.stepForm.PM.label"),placeholder:s("proj.editModal.stepForm.PM.placeholder"),extra:s("proj.editModal.stepForm.PM.extra"),name:["basics","managerIds"],fieldProps:{mode:"multiple",labelInValue:!1},debounceTime:300,request:function(){var p=R()(x()().mark(function i(v){var u,y,E;return x()().wrap(function(h){for(;;)switch(h.prev=h.next){case 0:if(u=v.keyWords,y=u===void 0?"":u,E=(j==null?void 0:j.managers)||[],!y){h.next=6;break}return h.next=5,(0,$.Qm)({name:y});case 5:E=h.sent.userList;case 6:return h.abrupt("return",E.map(function(I){return{label:I.name,value:I.id}}));case 7:case"end":return h.stop()}},i)}));return function(i){return p.apply(this,arguments)}}(),rules:[{required:!0,message:s("proj.editModal.stepForm.PM.rule"),type:"array"}]})]}),(0,n.jsxs)(O.L.StepForm,{name:"taskSetting",title:s("proj.editModal.stepForm.task.title"),stepProps:{description:s("proj.editModal.stepForm.task.desc")},disabled:X,children:[l.disableInitProject&&(0,n.jsx)(fe,{style:{marginBottom:20},message:s("proj.editModal.stepForm.task.msg"),type:"warning"}),(0,n.jsx)(Fe.Group,{name:"workflowInitNow",options:[s(io.I)]}),(0,n.jsx)(ue.Z,{name:["workflowInitNow"],children:function(i){var v=i.workflowInitNow;return v&&v.length?(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(me.Group,{name:"hadBatchSize",label:s("proj.editModal.stepForm.radio.label"),options:[{label:s("proj.editModal.stepForm.radio.dataset"),value:!1},{label:s("proj.editModal.stepForm.radio.size"),value:!0}]}),(0,n.jsx)(ue.Z,{name:["hadBatchSize"],children:function(y){var E=y.hadBatchSize;return E?(0,n.jsx)($e,{label:s("proj.editModal.stepForm.batchSize.label"),name:["settings","batchSize"],min:1,width:"sm",placeholder:s("proj.editModal.stepForm.batchSize.placeholder"),tooltip:s("proj.editModal.stepForm.batchSize.tooltip"),rules:[{required:!0,message:s("proj.editModal.stepForm.batchSize.msg")}]}):null}}),(0,n.jsx)(me.Group,{name:"hadReviewer",label:s("proj.editModal.stepForm.rview.label"),options:[{label:s("proj.editModal.stepForm.rview.no"),value:!1},{label:s("proj.editModal.stepForm.rview.one"),value:!0}]})]}):(0,n.jsx)("div",{style:{width:"100%",height:"200px"}})}})]})]})})},uo=co,po=e(36647),mo=function(o){var a=o.complete,r=o.total;return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(po.Z,{percent:a/r*100,showInfo:!1,trailColor:"#e4e4e4"}),(0,n.jsx)("div",{children:"".concat(a," / ").concat(r)})]})},vo=mo,fo=e(17445),ne=e(23673),go=e(19950),le={page:"page___VUB1h",table:"table___BzPd6",actionCell:"actionCell___IDtFO"},ho=function(){var o=(0,T.useModel)("user"),a=o.user,r=(0,T.useModel)("Project.auth"),l=r.checkPermission,c=(0,go.Z)(document.querySelector(".ant-pro-grid-content")),m=(0,T.useModel)("Project.list"),P=m.pageData,C=m.pageState,M=m.loading,N=m.onPageChange,B=m.onInitPageState,s=m.onNewProject,Z=m.onEditProject,j=m.onChangeProjectResult;(0,fo.Z)({onInitPageState:B,pageState:C});var K=(0,ge.bU)(),f=K.localeText,G=function(p){var i=[];return l(p.userRoles,q.Oc.ProjectQa)&&[S.tz.Reviewing,S.tz.Accepted,S.tz.Rejected].includes(p.status)&&(p.status!==S.tz.Accepted&&i.push((0,n.jsx)("a",{style:{color:"#4fbb30"},onClick:function(){return j(p,S.JE.Accept)},children:f("proj.table.action.accept")},"accept")),p.status!==S.tz.Rejected&&i.push((0,n.jsx)(k.Z,{title:"Are you sure to reject this project?",onConfirm:function(){return j(p,S.JE.Reject)},children:(0,n.jsx)("a",{style:{color:"red"},children:f("proj.table.action.reject")},"reject")},"reject"))),l(p.userRoles,q.Oc.ProjectEdit)?i.push((0,n.jsx)("a",{onClick:function(){Z(p)},children:f("proj.table.action.edit")},"edit")):l(p.userRoles,q.Oc.ProjectInit)&&p.status===S.tz.Waiting?i.push((0,n.jsx)("a",{onClick:function(){Z(p)},children:f("proj.table.action.init")},"init")):l(p.userRoles,q.Oc.ProjectInfo)&&p.status!==S.tz.Waiting&&i.push((0,n.jsx)("a",{onClick:function(){Z(p)},children:f("proj.table.action.info")},"info")),[S.tz.Waiting,S.tz.Initializing].includes(p.status)||i.push((0,n.jsx)(T.Link,{to:"/project/".concat(p.id),children:f("proj.table.action.detail")},"detail")),i},X=[{title:f("proj.table.name"),dataIndex:"name",ellipsis:!1},{title:f("proj.table.owner"),ellipsis:!0,render:function(p,i){return(0,n.jsx)(ne.Z,{isPerson:!0,data:[{text:i.owner.name,color:"green"}]})}},{title:f("proj.table.datasets"),ellipsis:!0,render:function(p,i){return(0,n.jsx)(ne.Z,{max:2,data:i.datasets.map(function(v){return{text:v.name,color:"blue"}})})}},{title:f("proj.table.progress"),render:function(p,i){return i.taskNumTotal?(0,n.jsx)(vo,{complete:i.taskNumAccepted,total:i.taskNumTotal}):"-"}},{title:f("proj.table.PM"),ellipsis:!0,render:function(p,i){var v;return(0,n.jsx)(ne.Z,{isPerson:!0,max:2,data:(v=i.managers)===null||v===void 0?void 0:v.map(function(u){return{text:u.name}})})}},{title:f("proj.table.status"),dataIndex:"status",ellipsis:!0,valueType:"select",valueEnum:S.mu,render:function(p,i){var v=S.mu[i.status],u=v.text,y=v.color;return(0,n.jsx)(D.Z,{color:y,children:f(u)})}},{title:f("proj.table.createAt"),dataIndex:"createdTs",valueType:"date"},{title:f("proj.table.action"),valueType:"option",key:"option",render:function(p,i){return(0,n.jsx)("div",{className:le.actionCell,children:G(i)})}}];return(0,n.jsxs)(w._z,{className:le.page,header:{title:f("proj.title"),extra:a.isStaff?[(0,n.jsxs)(A.ZP,{type:"primary",onClick:s,children:["+ ",f("proj.table.newProject")]},"new")]:[],breadcrumb:{}},children:[(0,n.jsx)(L.Z,{rowKey:"id",className:le.table,scroll:{x:1200,y:c!=null&&c.height?c.height-124:void 0},columns:X,cardBordered:!0,dataSource:P.list,toolBarRender:function(){return[(0,n.jsx)(n.Fragment,{})]},options:!1,search:!1,loading:M,pagination:{current:C.page,pageSize:C.pageSize,total:P.total,showSizeChanger:!0,onChange:N}}),(0,n.jsx)(uo,{})]})},Po=ho}}]);

//# sourceMappingURL=p__Project__index.1fd5dda2.async.js.map