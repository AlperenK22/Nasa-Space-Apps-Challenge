(() => {
 const pending=new Map();
 window.chrome?.webview?.addEventListener('message',event=>{const m=event.data;if(m?.type!=='bridge-result')return;const job=pending.get(m.id);if(!job)return;clearTimeout(job.timer);pending.delete(m.id);m.ok?job.resolve(m.data):job.reject(new Error(m.error||'Operation could not be completed.'));});
 function request(type,payload={}){return new Promise((resolve,reject)=>{if(!window.chrome?.webview){reject(new Error('Desktop data bridge is unavailable.'));return;}const id=crypto.randomUUID();const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Request timed out. The last saved record is retained.'));},85000);pending.set(id,{resolve,reject,timer});window.chrome.webview.postMessage({...payload,type,id});});}
 window.OrbitBridge={request};
})();
