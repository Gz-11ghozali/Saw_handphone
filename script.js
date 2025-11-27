// Sample dataset: edit or extend as needed
const smartphones = [
  {name:"Apex X1", cpu:9.0, cam:8.5, batt:5000, price:6000000, storage:128},
  {name:"Nova Z5", cpu:8.2, cam:9.0, batt:4500, price:7500000, storage:256},
  {name:"Zen Pro", cpu:8.8, cam:8.0, batt:4800, price:6800000, storage:128},
  {name:"Lite 2025", cpu:7.5, cam:7.0, batt:6000, price:4200000, storage:64},
  {name:"Flagship S", cpu:9.5, cam:9.4, batt:4300, price:12000000, storage:512},
];

// Criteria metadata: type 'benefit' or 'cost'
const criteria = [
  {key:"cpu", type:"benefit"},
  {key:"cam", type:"benefit"},
  {key:"batt", type:"benefit"},
  {key:"price", type:"cost"},
  {key:"storage", type:"benefit"},
];

function renderData(){
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";
  smartphones.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${s.name}</td><td>${s.cpu}</td><td>${s.cam}</td><td>${s.batt}</td><td>${s.price}</td><td>${s.storage}</td>`;
    tbody.appendChild(tr);
  });
}

function getWeights(){
  const w_cpu = +document.getElementById("w_cpu").value;
  const w_cam = +document.getElementById("w_cam").value;
  const w_batt = +document.getElementById("w_batt").value;
  const w_price = +document.getElementById("w_price").value;
  const w_storage = +document.getElementById("w_storage").value;
  const sum = w_cpu + w_cam + w_batt + w_price + w_storage || 1;
  return {
    cpu: w_cpu/sum,
    cam: w_cam/sum,
    batt: w_batt/sum,
    price: w_price/sum,
    storage: w_storage/sum
  };
}

function normalizeMatrix(data){
  // For each criterion compute max (benefit) or min (cost)
  const norms = {};
  criteria.forEach(c => {
    const key = c.key;
    if(c.type === "benefit"){
      norms[key] = Math.max(...data.map(d => d[key]));
    } else {
      norms[key] = Math.min(...data.map(d => d[key]));
    }
  });
  // Build normalized values
  const normalized = data.map(d => {
    const obj = {name:d.name};
    criteria.forEach(c => {
      const key = c.key;
      if(c.type === "benefit"){
        obj[key] = d[key] / norms[key];
      } else {
        obj[key] = norms[key] / d[key]; // cost normalized inversely
      }
    });
    return obj;
  });
  return normalized;
}

function computeSAW(){
  const weights = getWeights();
  const normalized = normalizeMatrix(smartphones);
  const scored = normalized.map(n => {
    const score =
      n.cpu * weights.cpu +
      n.cam * weights.cam +
      n.batt * weights.batt +
      n.price * weights.price +
      n.storage * weights.storage;
    return {name:n.name, score:+score.toFixed(4)};
  });
  scored.sort((a,b)=>b.score - a.score);
  renderResults(scored);
  return scored;
}

function renderResults(res){
  const tbody = document.querySelector("#resultTable tbody");
  tbody.innerHTML = "";
  res.forEach((r,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i+1}</td><td>${r.name}</td><td>${r.score}</td>`;
    tbody.appendChild(tr);
  });
}

function downloadCSV(rows){
  if(!rows || !rows.length) return;
  const header = ["Rank","Nama","Skor"];
  const lines = [header.join(",")].concat(rows.map((r,i)=>[i+1, `"${r.name}"`, r.score].join(",")));
  const blob = new Blob([lines.join("\n")], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "saw_smartphone_ranking.csv";
  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", ()=>{
  renderData();
  // show slider values
  const ids = ["cpu","cam","batt","price","storage"];
  ids.forEach(id=>{
    const el = document.getElementById("w_"+id);
    const val = document.getElementById("v_"+id);
    el.addEventListener("input", ()=> val.textContent = el.value);
  });

  document.getElementById("compute").addEventListener("click", ()=> {
    window.latestResult = computeSAW();
  });
  document.getElementById("reset").addEventListener("click", ()=>{
    document.getElementById("w_cpu").value=25;
    document.getElementById("w_cam").value=20;
    document.getElementById("w_batt").value=20;
    document.getElementById("w_price").value=20;
    document.getElementById("w_storage").value=15;
    ["cpu","cam","batt","price","storage"].forEach(k=>document.getElementById("v_"+k).textContent=document.getElementById("w_"+k).value);
  });

  document.getElementById("download").addEventListener("click", ()=>{
    if(window.latestResult && window.latestResult.length) downloadCSV(window.latestResult);
    else {
      const r = computeSAW();
      downloadCSV(r);
    }
  });

  // Auto-compute on load
  computeSAW();
});
