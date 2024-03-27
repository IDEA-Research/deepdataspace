"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[397],{51204:function(q,M,e){e.d(M,{Z:function(){return I}});var W=e(58757),m=e(59504),j=e(53357),P={wrapper:"wrapper___FtwXk"},u=e(35667),o=function(y){var l=(0,j.bU)(),t=l.localeText,g=y.categoryId,n=y.categories,h=y.onCategoryChange,s=(0,W.useMemo)(function(){return n.map(function(N){return{label:N.name,value:N.id}})},[n]);return(0,u.jsxs)("div",{className:P.wrapper,children:[t("dataset.detail.category"),":",(0,u.jsx)(m.Z,{showSearch:!0,style:{width:"160px",marginLeft:"10px"},placeholder:"Select a category",options:s,optionFilterProp:"label",value:g,onChange:h,getPopupContainer:function(){var r;return((r=document.getElementById("filterWrap"))===null||r===void 0?void 0:r.parentElement)||null}})]})},I=o},85205:function(q,M,e){e.d(M,{Z:function(){return n}});var W=e(58757),m=e(10852),j=e(38904),P=e(57414),u={dropBtn:"dropBtn___SYvIY",displayPanel:"displayPanel___JkzSB",objectTypeOption:"objectTypeOption___O6sJL",typeTitle:"typeTitle___l97pr",displayOptions:"displayOptions___NQVYA"},o=e(87615),I=e(87608),Z=e.n(I),y=e(53357),l=e(76180),t=e(35667),g=function(s){var N=(0,y.bU)(),r=N.localeText,z=s.annotationTypes,L=s.disableChangeType,b=s.displayAnnotationType,B=s.displayOptions,a=s.displayOptionsValue,E=s.onDisplayAnnotationTypeChange,O=s.onDisplayOptionsChange;return(0,t.jsx)(o.Z,{className:u.dropBtn,customOverlay:(0,t.jsxs)("div",{className:Z()(u.displayPanel),children:[z.length>0&&(0,t.jsxs)("div",{className:u.objectTypeOption,children:[(0,t.jsxs)("span",{className:u.typeTitle,children:[r("dataset.detail.displayType"),":"]}),(0,t.jsx)(m.ZP.Group,{disabled:L,onChange:function(J){return E(J.target.value)},value:b,children:z.map(function(x){return(0,t.jsx)(m.ZP,{value:x,children:x},x)})})]}),(0,t.jsx)(j.Z.Group,{className:u.displayOptions,onChange:O,value:a,children:(0,t.jsx)(P.Z,{direction:"vertical",children:B.map(function(x){return(0,t.jsx)(j.Z,{value:x,children:r(l.Ss[x])},x)})})})]}),children:r("dataset.detail.displayOptions")})},n=g},87615:function(q,M,e){e.d(M,{Z:function(){return g}});var W=e(58757),m=e(38904),j=e(10852),P=e(73267),u=e(57414),o=e(12562),I=e(10130),Z=e(53357),y={dropdownSelector:"dropdownSelector___gvMFq",dropdownWrap:"dropdownWrap___WWYlz",dropdownBox:"dropdownBox___lpUVf"},l=e(35667),t=function(h){var s=h.data,N=h.multiple,r=h.type,z=r===void 0?"primary":r,L=h.ghost,b=L===void 0?!0:L,B=h.value,a=h.filterOptionValue,E=h.filterOptionName,O=h.onChange,x=h.className,J=h.children,K=h.customOverlay,$=N?m.Z:j.ZP,_=function(S){O&&O(N?S:S.target.value)};return(0,l.jsx)(P.Z,{overlayClassName:y.dropdownSelector,trigger:["click"],dropdownRender:function(){return(0,l.jsx)("div",{className:y.dropdownWrap,children:K||(0,l.jsx)($.Group,{className:y.dropdownBox,onChange:_,value:B,children:(0,l.jsx)(u.Z,{direction:"vertical",children:s==null?void 0:s.map(function(S,U){var Q=a?a(S):S,A=E?E(S):S;return(0,l.jsx)($,{value:Q,children:(0,Z._w)(A)},U)})})})})},children:(0,l.jsxs)(o.ZP,{className:x,type:z,ghost:b,children:[J,(0,l.jsx)(I.Z,{})]})})},g=t},77589:function(q,M,e){e.d(M,{Z:function(){return s}});var W=e(58757),m=e(38904),j=e(57414),P=e(94706),u=e(10852),o={labelsPanel:"labelsPanel___nCoUr",labels:"labels___f2KO4",labelTitle:"labelTitle___C12Si",optionRow:"optionRow___X46cn",checkbox:"checkbox___Z6wLJ",slider:"slider___GUIhq",lineStyle:"lineStyle___Kmd9H",actionBtns:"actionBtns___JfDVN",modes:"modes___HaJVD"},I=e(87615),Z=e(87608),y=e.n(Z),l=e(76180),t=e(74595),g=e(53357),n=e(35667),h=function(r){var z=(0,g.bU)(),L=z.localeText,b=r.showMatting,B=r.showKeyPoints,a=r.isTiledDiff,E=r.labels,O=r.selectedLabelIds,x=r.diffMode,J=r.disableChangeDiffMode,K=r.onLabelsChange,$=r.onLabelConfidenceChange,_=r.onLabelsDiffModeChange;return(0,n.jsx)(I.Z,{customOverlay:(0,n.jsxs)("div",{className:y()(o.labelsPanel),id:"labelsPanel",children:[(0,n.jsxs)("div",{className:o.labels,children:[(0,n.jsxs)("div",{className:o.labelTitle,children:[(0,n.jsx)("div",{style:{width:"240px",paddingLeft:"24px"},children:L("dataset.detail.labelSetsName")}),!b&&(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("div",{style:{width:"132px"},children:L("dataset.detail.confidence")}),(0,n.jsx)("div",{style:{width:"100px",marginLeft:"40px"},children:L("dataset.detail.style")})]})]}),(0,n.jsx)(m.Z.Group,{onChange:K,value:O,className:o.options,children:(0,n.jsx)(j.Z,{direction:"vertical",children:E.map(function(p,S){var U=(0,t.iE)(p.id,O,a),Q=U.strokeDash,A=U.lineWidth,F=U.colorAplha;return(0,n.jsxs)("div",{className:o.optionRow,children:[(0,n.jsx)(m.Z,{value:p.id,className:o.checkbox,disabled:!O.includes(p.id)&&O.length>=l.JQ.length,children:p.name}),!b&&(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(P.Z,{tooltip:{open:!0,prefixCls:"slider-tooltip",getPopupContainer:function(){return document.getElementById("labelsPanel")}},className:o.slider,range:!0,min:0,max:1,value:p.confidenceRange,step:.01,onChange:function(se){return $(S,se)},disabled:p.source!==l.$j.pred}),(0,n.jsx)("div",{style:{width:"100px",marginLeft:"40px"},children:O.includes(p.id)&&(0,n.jsxs)("svg",{className:o.lineStyle,children:[(0,n.jsx)("line",{x1:5,y1:5,x2:70,y2:5,strokeDasharray:Q.join(","),strokeWidth:"".concat(A,"pt")}),B&&(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("circle",{cx:5,cy:5,r:3,stroke:"black",strokeWidth:1,fill:"rgba(133, 208, 252, ".concat(F,")")}),(0,n.jsx)("circle",{cx:70,cy:5,r:3,stroke:"black",strokeWidth:1,fill:"rgba(133, 208, 252, ".concat(F,")")})]})]})})]})]},p.id)})})})]}),!b&&!J&&(0,n.jsx)("div",{className:o.modes,children:(0,n.jsx)(u.ZP.Group,{onChange:function(S){return _(S.target.value)},value:x,children:l.Wp.map(function(p){return(0,n.jsx)(u.ZP,{value:p,children:L(p)},p)})})})]}),children:L("dataset.detail.labelSets")})},s=h},14481:function(q,M,e){e.r(M),e.d(M,{default:function(){return je}});var W=e(24454),m=e.n(W),j=e(56592),P=e.n(j),u=e(58757),o=e(97375),I=e(28506),Z=e(61845),y=e(37617),l=e(79233),t=e(6233),g=e.n(t),n=e(12562),h=e(92183),s=e(76180),N=e(23707),r=e(51204),z=e(77589),L=e(85205),b=e(51830),B={fixMenu:"fixMenu___3BTI4",filter:"filter___f53Ll",rightFilters:"rightFilters___PcqUj",backBtn:"backBtn___zqjXV",dropBtn:"dropBtn___f3XQO"},a=e(35667),E=function(){var d=(0,o.useModel)("dataset.common",function(H){return{isTiledDiff:H.isTiledDiff,cloumnCount:H.pageState.cloumnCount,filters:H.pageData.filters,filterValues:H.pageState.filterValues,comparisons:H.pageState.comparisons}}),i=d.filters,f=d.filterValues,C=d.comparisons,G=d.isTiledDiff,w=d.cloumnCount,T=(0,o.useModel)("dataset.filters"),Y=T.onCategoryChange,ee=T.onDisplayOptionsChange,X=T.onDisplayAnnotationTypeChange,ae=T.onLabelsChange,c=T.onLabelConfidenceChange,v=T.onLabelsDiffModeChange,re=T.onColumnCountChange,de=i.labels,ce=f.selectedLabelIds,ge=f.displayAnnotationType===s.JJ.Matting,ue=f.displayAnnotationType===s.JJ.KeyPoints;return(0,a.jsxs)("div",{className:B.fixMenu,id:"filterWrap",children:[(0,a.jsxs)("div",{className:B.filter,children:[(0,a.jsx)(n.ZP,{icon:(0,a.jsx)(h.Z,{}),type:"text",className:B.backBtn,onClick:function(){return(0,N.yS)("/dataset")}}),(0,a.jsx)(r.Z,{categoryId:f.categoryId,categories:i.categories,onCategoryChange:Y})]}),(0,a.jsxs)("div",{className:B.rightFilters,children:[(0,a.jsx)(z.Z,{showMatting:ge,showKeyPoints:ue,isTiledDiff:G,labels:de,selectedLabelIds:ce,diffMode:s.uP.Overlay,disableChangeDiffMode:!0,onLabelsChange:ae,onLabelConfidenceChange:c,onLabelsDiffModeChange:v}),(0,a.jsx)(L.Z,{annotationTypes:i.annotationTypes,disableChangeType:!!C,displayAnnotationType:f.displayAnnotationType,displayOptions:i.displayOptions,displayOptionsValue:f.displayOptions,onDisplayAnnotationTypeChange:X,onDisplayOptionsChange:ee}),!G&&(0,a.jsx)(b.ii,{cloumnCount:w,onColumnCountChange:re})]})]})},O=E,x=e(38904),J=e(74820),K=e(60698),$={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M168 504.2c1-43.7 10-86.1 26.9-126 17.3-41 42.1-77.7 73.7-109.4S337 212.3 378 195c42.4-17.9 87.4-27 133.9-27s91.5 9.1 133.8 27A341.5 341.5 0 01755 268.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.7 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c0-6.7-7.7-10.5-12.9-6.3l-56.4 44.1C765.8 155.1 646.2 92 511.8 92 282.7 92 96.3 275.6 92 503.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8zm756 7.8h-60c-4.4 0-7.9 3.5-8 7.8-1 43.7-10 86.1-26.9 126-17.3 41-42.1 77.8-73.7 109.4A342.45 342.45 0 01512.1 856a342.24 342.24 0 01-243.2-100.8c-9.9-9.9-19.2-20.4-27.8-31.4l60.2-47a8 8 0 00-3-14.1l-175.7-43c-5-1.2-9.9 2.6-9.9 7.7l-.7 181c0 6.7 7.7 10.5 12.9 6.3l56.4-44.1C258.2 868.9 377.8 932 512.2 932c229.2 0 415.5-183.7 419.8-411.8a8 8 0 00-8-8.2z"}}]},name:"sync",theme:"outlined"},_=$,p=e(17202),S=function(d,i){return u.createElement(p.Z,(0,K.Z)({},d,{ref:i,icon:_}))},U=u.forwardRef(S),Q=e(4394),A=e(53357),F={toolsBar:"toolsBar___BaJ18",selector:"selector___oykI4",antiBtn:"antiBtn___BMNv_",flagTip:"flagTip___jQeUr",flag:"flag___AuDg7",flagBtn:"flagBtn___kI5rw",rightContent:"rightContent___J7I4T",lineSplit:"lineSplit___cRXnA"},oe=e(87615),se=function(){var d,i=(0,o.useModel)("dataset.common",function(c){var v;return{pageSize:c.pageState.pageSize,flagStatus:(v=c.pageState.flagTools)===null||v===void 0?void 0:v.flagStatus,flagTools:c.pageState.flagTools&&c.pageData.flagTools}}),f=i.flagTools,C=i.flagStatus,G=i.pageSize,w=(0,o.useModel)("dataset.flag"),T=w.onChangeFlagStatus,Y=w.changeSelectAll,ee=w.antiSelect,X=w.saveFlag,ae=w.updateOrder;return f?(0,a.jsxs)("div",{className:F.toolsBar,children:[(0,a.jsxs)("div",{className:F.selector,children:[(0,a.jsx)(x.Z,{indeterminate:f.count>0&&f.count!==G,checked:(f==null?void 0:f.count)===G,onChange:Y,children:f.count===0?(0,a.jsx)(A.Og,{id:"lab.toolsBar.selectAll"}):(0,a.jsx)(A.Og,{id:"lab.toolsBar.selectSome",values:{num:f.count}})}),(0,a.jsx)(n.ZP,{onClick:function(){return ee()},className:F.antiBtn,children:(0,a.jsx)(A.Og,{id:"lab.toolsBar.selectInvert"})}),(0,a.jsxs)(oe.Z,{data:s.j3,value:C,filterOptionName:function(v){return v.name},filterOptionValue:function(v){return v.value},onChange:function(v){return T(v)},ghost:!1,type:"default",className:F.antiBtn,children:[(0,a.jsx)(A.Og,{id:"lab.toolsBar.filter"})," :"," ",(d=s.j3.find(function(c){return c.value===C}))===null||d===void 0?void 0:d.name]}),(0,a.jsxs)("div",{className:F.flagTip,children:[(0,a.jsx)(A.Og,{id:"lab.toolsBar.saveAs"}),"\uFF1A"]}),s.YC.map(function(c){return(0,a.jsx)(J.Z,{placement:"bottom",title:c.tip,children:(0,a.jsx)(n.ZP,{ghost:!0,onClick:function(){return X(c.value)},className:F.flagBtn,style:{borderColor:s.a5[c.value],opacity:f.count<=0?.5:1},icon:(0,a.jsx)(Q.r,{fill:s.a5[c.value]})})},c.value)})]}),(0,a.jsx)("div",{className:F.rightContent,children:(0,a.jsxs)(n.ZP,{onClick:ae,children:[(0,a.jsx)(U,{}),(0,a.jsx)(A.Og,{id:"lab.toolsBar.updateOrder"})]})})]}):null},me=se,he=e(88662),ye=e(74595),R={page:"page___gO_hp",container:"container___ZoYU1",item:"item___gLaMX",itemImgWrap:"itemImgWrap___I92CG",flagIcon:"flagIcon___snhaL",label:"label___m8WJS",itemSelectedMask:"itemSelectedMask___oYwMk",pagination:"pagination___Z13Xp",editor:"editor___ZxT8b",pageSpin:"pageSpin___kIm_a"},xe=e(95073),Ce=function(){var d=(0,o.useModel)("dataset.common"),i=d.pageState,f=d.onInitPageState,C=d.pageData,G=d.loading,w=d.displayLabelIds,T=d.isTiledDiff,Y=d.displayOptionsResult,ee=d.onPageContentLoaded,X=d.onPreviewIndexChange,ae=d.exitPreview,c=d.displayObjectsFilter,v=(0,o.useModel)("Lab.FlagTool.model"),re=v.onPageDidMount,de=v.onPageWillUnmount,ce=v.clickItem,ge=v.doubleClickItem,ue=v.onPageChange,H=v.onPageSizeChange,Oe=i.cloumnCount,Se=i.isSingleAnnotation,Te=i.filterValues,ve=i.flagTools;(0,I._)({onPageDidMount:re,onPageWillUnmount:de,onInitPageState:f,pageState:i});var le=(0,xe.Z)(function(){return document.querySelector(".ant-pro-page-container")}),fe=le!=null&&le.width?le.width-80:0,ne=(0,u.useMemo)(function(){return T?(0,ye.JC)(C.imgList,w,Te.displayAnnotationType):C.imgList},[T,C.imgList,w]),pe=T?ne.length/(C.imgList.length||1):Oe,k=fe?(fe-16*(pe-1))/(pe||1):0;return(0,a.jsxs)(Z._z,{ghost:!0,className:R.page,pageHeaderRender:function(){return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(O,{}),(0,a.jsx)(me,{})]})},fixedHeader:!0,children:[(0,a.jsx)("div",{className:R.container,children:(0,a.jsx)(y.Z,{loading:G,children:ne.length?(0,a.jsx)(g(),{options:{gutter:16,horizontalOrder:!0,transitionDuration:0},onImagesLoaded:function(){return ee()},children:ne.map(function(D,te){return(0,a.jsxs)("div",{className:R.item,style:{width:k},onClick:function(){return ce(te)},onDoubleClick:function(){return ge(te)},children:[(0,a.jsx)("div",{className:R.itemImgWrap,style:{width:k,height:ve?k*3/4:"auto"},children:(0,a.jsx)(he.D5,{isOldMode:!0,categories:C.filters.categories,data:D,wrapWidth:k,wrapHeight:ve?k*3/4:void 0,minHeight:k*3/4,objectsFilter:c,displayOptionsResult:Y})}),D.flag>0&&(0,a.jsx)(Q.r,{fill:s.a5[D.flag],className:R.flagIcon}),Y.showImgDesc&&(0,a.jsxs)("div",{className:R.label,children:[" ",D.caption||D.desc," "]}),ve&&D.selected?(0,a.jsx)("div",{className:R.itemSelectedMask}):null]},"".concat(D.id,"_").concat(te))})}):null})}),!G&&(0,a.jsx)(b.ZJ,{current:i.page,size:i.pageSize,total:C.total,onPageChange:ue,onPageSizeChange:H}),(0,a.jsx)(he.j5,{isOldMode:!0,visible:i.previewIndex>=0&&!Se,categories:C.filters.categories,list:ne,current:i.previewIndex,onCancel:ae,onNext:P()(m()().mark(function D(){return m()().wrap(function(V){for(;;)switch(V.prev=V.next){case 0:i.previewIndex<ne.length-1&&X(i.previewIndex+1);case 1:case"end":return V.stop()}},D)})),onPrev:P()(m()().mark(function D(){return m()().wrap(function(V){for(;;)switch(V.prev=V.next){case 0:i.previewIndex>0&&X(i.previewIndex-1);case 1:case"end":return V.stop()}},D)})),objectsFilter:c,displayOptionsResult:Y}),C.screenLoading?(0,a.jsx)("div",{className:R.pageSpin,children:(0,a.jsx)(l.Z,{spinning:!0,tip:C.screenLoading})}):null]})},je=Ce},4394:function(q,M,e){e.d(M,{r:function(){return Z}});var W=e(58757),m=Object.defineProperty,j=Object.getOwnPropertySymbols,P=Object.prototype.hasOwnProperty,u=Object.prototype.propertyIsEnumerable,o=(l,t,g)=>t in l?m(l,t,{enumerable:!0,configurable:!0,writable:!0,value:g}):l[t]=g,I=(l,t)=>{for(var g in t||(t={}))P.call(t,g)&&o(l,g,t[g]);if(j)for(var g of j(t))u.call(t,g)&&o(l,g,t[g]);return l};const Z=l=>W.createElement("svg",I({viewBox:"0 0 16 16",fill:"#52C41A",xmlns:"http://www.w3.org/2000/svg"},l),W.createElement("path",{d:"M12.633 4.84 3.838 1.05A.599.599 0 0 0 3 1.602v12.793a.602.602 0 1 0 1.204 0v-4l8.475-4.47a.601.601 0 0 0-.046-1.086Z"}));var y="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTYgMTYiIGZpbGw9IiM1MkM0MUEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEyLjYzMyA0Ljg0IDMuODM4IDEuMDVBLjU5OS41OTkgMCAwIDAgMyAxLjYwMnYxMi43OTNhLjYwMi42MDIgMCAxIDAgMS4yMDQgMHYtNGw4LjQ3NS00LjQ3YS42MDEuNjAxIDAgMCAwLS4wNDYtMS4wODZaIi8+PC9zdmc+"}}]);
