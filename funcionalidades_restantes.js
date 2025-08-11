/* FUNCIONALIDADES RESTANTES PARA DASHBOARD FASE 2 */

/* Charts (destroy/create safe) */
let pesoChart=null, adherenciaChart=null, strengthChart=null, correlationChart=null, distributionChart=null, predictionChart=null;

function crearGraficoPeso(){
  if(pesoChart){ try{ pesoChart.destroy(); }catch(e){} pesoChart=null; }
  const ctx=q('#peso-chart').getContext('2d');
  pesoChart = new Chart(ctx,{ 
    type:'line', 
    data:{
      labels:[],
      datasets:[{
        label:'Peso',
        data:[],
        borderColor:'#3b82f6',
        backgroundColor:'rgba(59,130,246,.08)',
        tension:.3,
        fill:true
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins: {
        legend: { display: false }
      }
    }
  });
  actualizarGraficoPeso();
}

function actualizarGraficoPeso(){
  if(!pesoChart) return crearGraficoPeso();
  const labels = estado.slice(-12).map(e=>new Date(e.fecha).toLocaleDateString());
  const data = estado.slice(-12).map(e=>e.peso);
  pesoChart.data.labels = labels.length?labels:['Inicio'];
  pesoChart.data.datasets[0].data = data.length?data:[85];
  pesoChart.update();
}

function crearGraficoAdherencia(){
  if(adherenciaChart){ try{ adherenciaChart.destroy(); }catch(e){} adherenciaChart=null; }
  const ctx=q('#adherencia-chart').getContext('2d');
  adherenciaChart = new Chart(ctx,{
    type:'bar',
    data:{
      labels:[],
      datasets:[{
        label:'Adherencia (%)',
        data:[],
        borderRadius:4,
        backgroundColor:[]
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      scales:{
        y:{
          beginAtZero:true,
          max:100
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
  actualizarGraficoAdherencia();
}

function actualizarGraficoAdherencia(){
  if(!adherenciaChart) return crearGraficoAdherencia();
  const labels=[];
  const data=[];
  for(let i=6;i>=0;i--){
    const d=new Date();
    d.setDate(d.getDate()-i);
    const iso=d.toISOString().split('T')[0];
    labels.push(daysName[d.getDay()].slice(0,3));
    const a=adherenciaDiaria[iso]||{};
    const completed=(a.pesos?1:0)+(a.cardio?1:0)+(a.dieta?1:0)+(a.ayuno?1:0);
    data.push(Math.round((completed/4)*100));
  }
  adherenciaChart.data.labels=labels;
  adherenciaChart.data.datasets[0].data=data;
  adherenciaChart.data.datasets[0].backgroundColor = data.map(d => d>=75? '#10b981': d>=50? '#f59e0b':'#ef4444');
  adherenciaChart.update();
}

/* NUEVAS FUNCIONALIDADES - Insights Automáticos */
function generarInsightsAutomaticos() {
  const container = q('#insights-container');
  container.innerHTML = '';
  
  const insights = [];
  
  // Insight 1: Tendencia de peso
  if (estado.length >= 2) {
    const lastWeight = estado[estado.length - 1].peso;
    const prevWeight = estado[estado.length - 2].peso;
    const weightDiff = lastWeight - prevWeight;
    
    if (weightDiff < -0.5) {
      insights.push({
        type: 'positive',
        icon: '📉',
        title: '¡Excelente progreso!',
        message: `Has perdido ${Math.abs(weightDiff).toFixed(1)}kg desde la última medición.`
      });
    } else if (weightDiff > 0.5) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Atención al peso',
        message: `Has ganado ${weightDiff.toFixed(1)}kg. Revisa tu dieta y entrenamiento.`
      });
    }
  }
  
  // Insight 2: Adherencia semanal
  const weekAdherence = calcularAdherenciaSemanal();
  if (weekAdherence >= 80) {
    insights.push({
      type: 'positive',
      icon: '🎯',
      title: '¡Adherencia excepcional!',
      message: `Tu adherencia semanal es del ${weekAdherence}%. ¡Sigue así!`
    });
  } else if (weekAdherence < 50) {
    insights.push({
      type: 'warning',
      icon: '📊',
      title: 'Adherencia baja',
      message: `Tu adherencia semanal es del ${weekAdherence}%. Intenta mejorar esta semana.`
    });
  }
  
  // Insight 3: Racha de entrenamientos
  const streak = calcularRachaEntrenamientos();
  if (streak >= 3) {
    insights.push({
      type: 'positive',
      icon: '🔥',
      title: '¡Racha impresionante!',
      message: `Llevas ${streak} días consecutivos entrenando. ¡Mantén la consistencia!`
    });
  }
  
  // Insight 4: Recomendación de ejercicio
  const bestExercise = encontrarMejorEjercicio();
  if (bestExercise) {
    insights.push({
      type: 'info',
      icon: '💪',
      title: 'Tu ejercicio estrella',
      message: `${bestExercise} es donde más progresas. ¡Sigue trabajándolo!`
    });
  }
  
  // Mostrar insights (máximo 3)
  insights.slice(0, 3).forEach(insight => {
    const insightCard = document.createElement('div');
    insightCard.className = `insight-card ${insight.type} p-4 rounded-lg mb-4`;
    insightCard.innerHTML = `
      <div class="flex items-start">
        <span class="text-2xl mr-3">${insight.icon}</span>
        <div>
          <h4 class="font-semibold mb-1">${insight.title}</h4>
          <p class="text-sm">${insight.message}</p>
        </div>
      </div>
    `;
    container.appendChild(insightCard);
  });
}

function calcularAdherenciaSemanal() {
  let totalDays = 0;
  let completedDays = 0;
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    const adherence = adherenciaDiaria[iso] || {};
    
    if (Object.keys(adherence).length > 0) {
      totalDays++;
      const completed = (adherence.pesos ? 1 : 0) + (adherence.cardio ? 1 : 0) + (adherence.dieta ? 1 : 0) + (adherence.ayuno ? 1 : 0);
      if (completed >= 2) completedDays++;
    }
  }
  
  return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
}

function calcularRachaEntrenamientos() {
  let streak = 0;
  let currentDate = new Date();
  
  while (true) {
    const iso = currentDate.toISOString().split('T')[0];
    const adherence = adherenciaDiaria[iso] || {};
    
    if (adherence.pesos) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

function encontrarMejorEjercicio() {
  const exerciseProgress = {};
  
  pesos.forEach(entry => {
    if (entry.ejercicio && entry.peso && entry.reps) {
      if (!exerciseProgress[entry.ejercicio]) {
        exerciseProgress[entry.ejercicio] = [];
      }
      exerciseProgress[entry.ejercicio].push({
        peso: entry.peso,
        reps: entry.reps,
        fecha: entry.fecha
      });
    }
  });
  
  let bestExercise = null;
  let bestProgress = 0;
  
  Object.keys(exerciseProgress).forEach(exercise => {
    const progress = exerciseProgress[exercise];
    if (progress.length >= 2) {
      const first = progress[0];
      const last = progress[progress.length - 1];
      const progressScore = (last.peso - first.peso) + (last.reps - first.reps);
      
      if (progressScore > bestProgress) {
        bestProgress = progressScore;
        bestExercise = exercise;
      }
    }
  });
  
  return bestExercise;
}

/* NUEVAS FUNCIONALIDADES - Analytics Avanzados */
function initializeAnalytics() {
  actualizarMetricasPrincipales();
  crearGraficosAvanzados();
  generarInsightsDetallados();
}

function actualizarMetricasPrincipales() {
  // Tendencia de peso
  const weightTrend = calcularTendenciaPeso();
  q('#weight-trend').textContent = `${weightTrend > 0 ? '+' : ''}${weightTrend.toFixed(1)} kg/sem`;
  
  // Adherencia promedio
  const avgAdherence = calcularAdherenciaPromedio();
  q('#avg-adherence').textContent = `${avgAdherence}%`;
  
  // Mejor ejercicio
  const bestExercise = encontrarMejorEjercicio();
  q('#best-exercise').textContent = bestExercise || 'N/A';
  
  // Días restantes
  const daysRemaining = calcularDiasRestantes();
  q('#days-remaining').textContent = daysRemaining;
}

function calcularTendenciaPeso() {
  if (estado.length < 7) return 0;
  
  const lastWeek = estado.slice(-7);
  const firstWeight = lastWeek[0].peso;
  const lastWeight = lastWeek[lastWeek.length - 1].peso;
  
  return lastWeight - firstWeight;
}

function calcularAdherenciaPromedio() {
  const adherenceValues = [];
  
  Object.keys(adherenciaDiaria).forEach(date => {
    const adherence = adherenciaDiaria[date];
    const completed = (adherence.pesos ? 1 : 0) + (adherence.cardio ? 1 : 0) + (adherence.dieta ? 1 : 0) + (adherence.ayuno ? 1 : 0);
    adherenceValues.push((completed / 4) * 100);
  });
  
  return adherenceValues.length > 0 ? Math.round(adherenceValues.reduce((a, b) => a + b, 0) / adherenceValues.length) : 0;
}

function calcularDiasRestantes() {
  const inicio = new Date('2025-08-11');
  const diasTot = 42;
  const diasTrans = Math.floor((new Date() - inicio) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, diasTot - diasTrans);
}

function crearGraficosAvanzados() {
  crearGraficoProgresionFuerza();
  crearGraficoCorrelacion();
  crearGraficoDistribucion();
  crearGraficoPrediccion();
}

function crearGraficoProgresionFuerza() {
  if (strengthChart) { try { strengthChart.destroy(); } catch (e) {} strengthChart = null; }
  
  const ctx = q('#strength-progression-chart').getContext('2d');
  const exerciseData = procesarDatosFuerza();
  
  strengthChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: exerciseData.labels,
      datasets: exerciseData.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function procesarDatosFuerza() {
  const exerciseProgress = {};
  
  pesos.forEach(entry => {
    if (entry.ejercicio && entry.peso && entry.reps) {
      if (!exerciseProgress[entry.ejercicio]) {
        exerciseProgress[entry.ejercicio] = [];
      }
      exerciseProgress[entry.ejercicio].push({
        peso: entry.peso,
        reps: entry.reps,
        fecha: entry.fecha
      });
    }
  });
  
  const topExercises = Object.keys(exerciseProgress)
    .filter(ex => exerciseProgress[ex].length >= 3)
    .slice(0, 3);
  
  const datasets = topExercises.map((exercise, index) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b'];
    const data = exerciseProgress[exercise].map(entry => entry.peso);
    const labels = exerciseProgress[exercise].map(entry => new Date(entry.fecha).toLocaleDateString());
    
    return {
      label: exercise,
      data: data,
      borderColor: colors[index],
      backgroundColor: colors[index] + '20',
      tension: 0.3
    };
  });
  
  return {
    labels: datasets.length > 0 ? datasets[0].data.map((_, i) => `Sesión ${i + 1}`) : [],
    datasets: datasets
  };
}

function crearGraficoCorrelacion() {
  if (correlationChart) { try { correlationChart.destroy(); } catch (e) {} correlationChart = null; }
  
  const ctx = q('#correlation-chart').getContext('2d');
  const correlationData = procesarDatosCorrelacion();
  
  correlationChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Peso vs Rendimiento',
        data: correlationData,
        backgroundColor: '#3b82f6',
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          title: { display: true, text: 'Peso (kg)' }
        },
        y: {
          title: { display: true, text: 'Rendimiento (peso × reps)' }
        }
      }
    }
  });
}

function procesarDatosCorrelacion() {
  const correlationData = [];
  
  pesos.forEach(entry => {
    if (entry.peso && entry.reps) {
      const performance = entry.peso * entry.reps;
      correlationData.push({
        x: entry.peso,
        y: performance
      });
    }
  });
  
  return correlationData;
}

function crearGraficoDistribucion() {
  if (distributionChart) { try { distributionChart.destroy(); } catch (e) {} distributionChart = null; }
  
  const ctx = q('#workout-distribution-chart').getContext('2d');
  const distributionData = procesarDatosDistribucion();
  
  distributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: distributionData.labels,
      datasets: [{
        data: distributionData.data,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function procesarDatosDistribucion() {
  const workoutCounts = {
    'Pull': 0,
    'Push': 0,
    'Piernas': 0,
    'Cardio': 0,
    'Descanso': 0
  };
  
  Object.keys(adherenciaDiaria).forEach(date => {
    const adherence = adherenciaDiaria[date];
    if (adherence.pesos) {
      // Determinar tipo de entrenamiento basado en el día de la semana
      const dayOfWeek = new Date(date).getDay();
      if (dayOfWeek === 1 || dayOfWeek === 5) workoutCounts['Pull']++;
      else if (dayOfWeek === 2 || dayOfWeek === 6) workoutCounts['Push']++;
      else if (dayOfWeek === 3) workoutCounts['Piernas']++;
    }
    if (adherence.cardio) workoutCounts['Cardio']++;
  });
  
  return {
    labels: Object.keys(workoutCounts),
    data: Object.values(workoutCounts)
  };
}

function crearGraficoPrediccion() {
  if (predictionChart) { try { predictionChart.destroy(); } catch (e) {} predictionChart = null; }
  
  const ctx = q('#prediction-chart').getContext('2d');
  const predictionData = procesarDatosPrediccion();
  
  predictionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: predictionData.labels,
      datasets: [{
        label: 'Peso Actual',
        data: predictionData.actual,
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        tension: 0.3
      }, {
        label: 'Predicción',
        data: predictionData.predicted,
        borderColor: '#ef4444',
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

function procesarDatosPrediccion() {
  const actualData = estado.slice(-7).map(e => e.peso);
  const labels = estado.slice(-7).map(e => new Date(e.fecha).toLocaleDateString());
  
  // Predicción simple basada en tendencia
  const trend = actualData.length >= 2 ? (actualData[actualData.length - 1] - actualData[0]) / (actualData.length - 1) : 0;
  const predictedData = [];
  
  for (let i = 0; i < 7; i++) {
    const lastWeight = actualData[actualData.length - 1] || 85;
    predictedData.push(lastWeight + (trend * (i + 1)));
  }
  
  return {
    labels: labels,
    actual: actualData,
    predicted: predictedData
  };
}

function generarInsightsDetallados() {
  const container = q('#detailed-insights');
  container.innerHTML = '';
  
  const insights = [
    {
      title: '📊 Análisis de Progreso',
      content: generarAnalisisProgreso()
    },
    {
      title: '🎯 Recomendaciones',
      content: generarRecomendaciones()
    },
    {
      title: '📈 Predicciones',
      content: generarPredicciones()
    }
  ];
  
  insights.forEach(insight => {
    const insightDiv = document.createElement('div');
    insightDiv.className = 'mb-6';
    insightDiv.innerHTML = `
      <h4 class="font-semibold mb-2">${insight.title}</h4>
      <div class="text-sm text-gray-600 space-y-1">
        ${insight.content}
      </div>
    `;
    container.appendChild(insightDiv);
  });
}

function generarAnalisisProgreso() {
  const weightTrend = calcularTendenciaPeso();
  const adherence = calcularAdherenciaPromedio();
  const streak = calcularRachaEntrenamientos();
  
  return `
    <p>• Tendencia de peso: ${weightTrend > 0 ? '+' : ''}${weightTrend.toFixed(1)}kg/semana</p>
    <p>• Adherencia promedio: ${adherence}%</p>
    <p>• Racha actual: ${streak} días consecutivos</p>
    <p>• Ejercicios registrados: ${pesos.length}</p>
  `;
}

function generarRecomendaciones() {
  const recommendations = [];
  
  const adherence = calcularAdherenciaPromedio();
  if (adherence < 70) {
    recommendations.push('• Aumenta tu consistencia en el entrenamiento');
  }
  
  const weightTrend = calcularTendenciaPeso();
  if (weightTrend > 0.5) {
    recommendations.push('• Revisa tu ingesta calórica diaria');
  }
  
  if (pesos.length < 10) {
    recommendations.push('• Registra más ejercicios para mejor análisis');
  }
  
  return recommendations.length > 0 ? recommendations.join('<br>') : '<p>• ¡Sigue así! Tu progreso es excelente</p>';
}

function generarPredicciones() {
  const daysRemaining = calcularDiasRestantes();
  const weightTrend = calcularTendenciaPeso();
  const currentWeight = estado.length > 0 ? estado[estado.length - 1].peso : 85;
  const predictedWeight = currentWeight + (weightTrend * (daysRemaining / 7));
  
  return `
    <p>• Peso estimado al final: ${predictedWeight.toFixed(1)}kg</p>
    <p>• Días restantes: ${daysRemaining}</p>
    <p>• Objetivo alcanzable: ${predictedWeight <= 80 ? 'Sí' : 'Necesita ajustes'}</p>
  `;
}

/* Calendar drag/drop */
function actualizarCalendarioSemanal(){
  const calendar=q('#calendar-semanal'); calendar.innerHTML='';
  planSemanal.forEach((day,idx)=>{ 
    const isToday=day.dia===getTodayName(); 
    const card=document.createElement('div'); 
    card.className=`p-3 rounded-xl ${isToday?'bg-blue-50 border-blue-200':'bg-white border-gray-200'} card`;
    card.innerHTML=`
      <div class="font-semibold text-center mb-2">${day.dia}${isToday?'<div class="text-xs text-blue-600">HOY</div>':''}</div>
      <div id="slot-${idx}" class="min-h-[80px] space-y-2" ondragover="allowDrop(event)" ondrop="drop(event,${idx})"></div>
    `; 
    calendar.appendChild(card);
    const slot=q(`#slot-${idx}`);
    day.tareas.forEach((t,ti)=>{ 
      const el=document.createElement('div'); 
      el.className=`p-2 rounded text-xs font-medium ${t==='Descanso'?'bg-gray-200': t.includes('Pull')?'bg-blue-200': t.includes('Push')?'bg-green-200': t.includes('Piernas')?'bg-yellow-200':'bg-red-200'} draggable`; 
      el.draggable=true; 
      el.id=`task-${idx}-${ti}`; 
      el.ondragstart=e=>e.dataTransfer.setData('application/json',JSON.stringify({fromDay:idx,taskIndex:ti})); 
      el.textContent=t; 
      slot.appendChild(el); 
    });
  });
}

function allowDrop(e){ e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function drop(e,toDay){ 
  e.preventDefault(); 
  e.currentTarget.classList.remove('drag-over'); 
  try{ 
    const {fromDay,taskIndex}=JSON.parse(e.dataTransfer.getData('application/json')); 
    if(fromDay===toDay) return; 
    const task=planSemanal[fromDay].tareas.splice(taskIndex,1)[0]; 
    planSemanal[toDay].tareas.push(task); 
    saveAll(); 
    actualizarCalendarioSemanal(); 
    actualizarTodoList(); 
    showToast('✅ Plan actualizado'); 
  }catch(err){console.warn(err);} 
}

/* Funciones existentes simplificadas */
function inicializarTablaPesos(){
  const microcicloFiltro=q('#filtro-microciclo').value || 'all';
  const filtroDia=q('#filtro-dia'); 
  filtroDia.innerHTML = '<option value="all">Todos</option>' + Object.keys(mesociclo).filter(k=>k!=='Cardio').map(k=>`<option value="${k}">${k}</option>`).join('');
  const diaFiltro=filtroDia.value;
  const tbody=q('#tabla-pesos tbody'); 
  tbody.innerHTML='';
  
  Object.keys(mesociclo).filter(k=>k!=='Cardio' && (diaFiltro==='all' || k===diaFiltro)).forEach(dia=>{
    mesociclo[dia].forEach(ej=>{
      const mcArray = ej.microciclo || [1,2,3,4,5,'Descarga'];
      mcArray.filter(m => microcicloFiltro==='all' || String(m)===String(microcicloFiltro)).forEach(mVal=>{
        const existing = pesos.find(p=>p.dia===dia && p.ejercicio===ej.ejercicio && String(p.microciclo)===String(mVal));
        const pesoVal = existing?.peso || 0;
        const reps = existing?.reps || '';
        
        const row = tbody.insertRow();
        row.innerHTML = `
          <td class="p-2 border text-sm">${ej.ejercicio}</td>
          <td class="p-2 border"><input type="number" class="w-20 p-1 border rounded focus:ring-2 focus:ring-blue-500" value="${pesoVal}" onchange="guardarPesoRepsSimple(this,'${dia}','${ej.ejercicio}',${JSON.stringify(mVal)})"></td>
          <td class="p-2 border"><input type="number" class="w-20 p-1 border rounded focus:ring-2 focus:ring-blue-500" value="${reps}" onchange="guardarPesoRepsSimple(this,'${dia}','${ej.ejercicio}',${JSON.stringify(mVal)})"></td>
          <td class="p-2 border text-sm ${reps>0? 'bg-green-500 text-white':'bg-gray-100'}">${reps>0? '✅ Completado':'⏳ Pendiente'}</td>
        `;
      });
    });
  });
}

window.guardarPesoRepsSimple = function(input, dia, ejercicio, microciclo) {
  const row = input.closest('tr');
  const peso = parseFloat(row.cells[1].querySelector('input').value) || 0;
  const reps = parseInt(row.cells[2].querySelector('input').value) || 0;
  
  if (peso <= 0 && reps <= 0) {
    pesos = pesos.filter(p => !(p.dia === dia && p.ejercicio === ejercicio && String(p.microciclo) === String(microciclo)));
  } else {
    pesos = pesos.filter(p => !(p.dia === dia && p.ejercicio === ejercicio && String(p.microciclo) === String(microciclo)));
    pesos.push({ dia, ejercicio, microciclo, peso, reps, fecha: todayISO() });
  }
  
  saveAll();
  row.cells[3].className = `p-2 border text-sm ${reps > 0 ? 'bg-green-500 text-white' : 'bg-gray-100'}`;
  row.cells[3].textContent = reps > 0 ? '✅ Completado' : '⏳ Pendiente';
  
  if (reps > 0) {
    showToast(`✅ ${ejercicio} guardado`);
    actualizarAdherenciaTask('pesos', true);
  }
};

function inicializarTablaCardio(){
  const filtro = q('#filtro-microciclo-cardio').value || 'all'; 
  const tbody=q('#tabla-cardio tbody'); tbody.innerHTML='';
  
  mesociclo.Cardio.filter(c=> filtro==='all' || String(c.microciclo)===String(filtro)).forEach(c=>{
    c.sesiones.forEach(s=>{
      const existing = cardio.find(r=>String(r.microciclo)===String(c.microciclo) && r.sesionId===s.id && r.fecha===todayISO());
      const row = tbody.insertRow();
      row.innerHTML = `
        <td class="p-2 border text-sm">${existing?.fecha||todayISO()}</td>
        <td class="p-2 border text-sm">Sesión ${s.id}</td>
        <td class="p-2 border"><input type="number" class="w-20 p-1 border rounded focus:ring-2 focus:ring-blue-500" value="${existing?.km||''}" onchange="guardarCardioSimple(this,${c.microciclo},${s.id})"></td>
        <td class="p-2 border"><input type="number" class="w-20 p-1 border rounded focus:ring-2 focus:ring-blue-500" value="${existing?.tiempo||''}" onchange="guardarCardioSimple(this,${c.microciclo},${s.id})"></td>
        <td class="p-2 border text-sm ${existing && existing.km>=s.km ? 'bg-green-500 text-white':'bg-gray-100'}">${existing && existing.km>=s.km ? '✅ Completado':'⏳ Pendiente'}</td>
      `;
    });
  });
}

window.guardarCardioSimple = function(input, microciclo, sesionId) {
  const row = input.closest('tr');
  const km = parseFloat(row.cells[2].querySelector('input').value) || 0;
  const tiempo = parseInt(row.cells[3].querySelector('input').value) || 0;
  
  if (km <= 0 || tiempo <= 0) {
    showToast('⚠️ KM y tiempo deben ser > 0', 'error');
    return;
  }
  
  const fecha = todayISO();
  cardio = cardio.filter(c => !(String(c.microciclo) === String(microciclo) && c.sesionId === sesionId && c.fecha === fecha));
  cardio.push({
    fecha, microciclo, sesionId, km, tiempo,
    ritmo: tiempo/km,
    calorias: Math.round(tiempo * (tiempo/km > 6 ? 10 : 12))
  });
  
  saveAll();
  row.cells[4].className = 'p-2 border text-sm bg-green-500 text-white';
  row.cells[4].textContent = '✅ Completado';
  showToast(`✅ Cardio guardado: ${km}km en ${tiempo}min`);
  actualizarAdherenciaTask('cardio', true);
  inicializarTablaCardio();
};

function inicializarTablaDieta(){ 
  const tbody=q('#tabla-dieta tbody'); tbody.innerHTML=''; 
  dieta.forEach(reg=>{ 
    const estadoClass = reg.calorias>=1700 && reg.calorias<=1900 && reg.proteinas>=150 && reg.proteinas<=185 ? 'bg-green-500 text-white' : 'bg-yellow-500'; 
    const fb=[]; 
    if(reg.calorias>=1700 && reg.calorias<=1900) fb.push('✅ Calorías en rango'); 
    else if(reg.calorias<1700) fb.push('⚠️ Calorías bajas'); 
    else fb.push('⚠️ Calorías altas'); 
    if(reg.proteinas>=150 && reg.proteinas<=185) fb.push('✅ Proteínas ok'); 
    else fb.push('⚠️ Ajustar proteínas'); 
    const tr=tbody.insertRow(); 
    tr.innerHTML=`
      <td class="p-2 border text-sm">${reg.fecha}</td>
      <td class="p-2 border">${reg.calorias}</td>
      <td class="p-2 border">${reg.proteinas}</td>
      <td class="p-2 border ${estadoClass}">${reg.calorias>=1700 && reg.calorias<=1900 && reg.proteinas>=150 && reg.proteinas<=185 ? '✅' : '⚠️'}</td>
      <td class="p-2 border text-xs">${fb.map(f=>`<p>${f}</p>`).join('')}</td>
    `; 
  }); 
}

// Event listeners para dieta
q('#btn-guardar-dieta').addEventListener('click', ()=>{
  const f=q('#fecha-dieta').value||todayISO(), 
      c=parseInt(q('#calorias-dieta').value)||0, 
      p=parseInt(q('#proteinas-dieta').value)||0, 
      carb=parseInt(q('#carbos-dieta').value)||0, 
      g=parseInt(q('#grasas-dieta').value)||0, 
      ay=!!q('#ayuno-dieta').checked; 
  
  if(c<=0||p<=0||carb<=0||g<=0){
    showToast('⚠️ Introduce valores válidos', 'error');
    return;
  } 
  
  dieta=dieta.filter(d=>d.fecha!==f); 
  dieta.push({fecha:f,calorias:c,proteinas:p,carbos:carb,grasas:g,ayuno:ay}); 
  saveAll(); 
  actualizarAdherenciaTask('dieta', c>=1700 && c<=1900 && p>=150 && p<=185); 
  inicializarTablaDieta();
  showToast('✅ Dieta guardada');
});