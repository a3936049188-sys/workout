// ── 로컬 저장소 ──
function getAllWorkouts() {
  try { return JSON.parse(localStorage.getItem('wj_workouts') || '{}'); }
  catch { return {}; }
}

function saveAllWorkouts(data) {
  localStorage.setItem('wj_workouts', JSON.stringify(data));
}

// ── 날짜 유틸 ──
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateKo(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const days = ['일','월','화','수','목','금','토'];
  const date = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
  return `${parseInt(m)}월 ${parseInt(d)}일 (${days[date.getDay()]})`;
}

// ── 캘린더 상태 ──
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = null;

// ── 캘린더 렌더링 ──
function renderCalendar() {
  document.getElementById('month-label').textContent = `${currentYear}년 ${currentMonth + 1}월`;

  const grid = document.getElementById('calendar-grid');
  const workouts = getAllWorkouts();
  const today = todayKey();

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  let html = '';

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="day-cell empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const hasWorkout = workouts[dateStr] && (workouts[dateStr].exercises || []).length > 0;
    const isToday = dateStr === today;
    const isSelected = dateStr === selectedDate;
    const dow = new Date(currentYear, currentMonth, d).getDay();

    const classes = ['day-btn'];
    if (isToday) classes.push('is-today');
    if (hasWorkout) classes.push('has-workout');
    if (isSelected) classes.push('is-selected');
    if (dow === 0) classes.push('is-sunday');
    if (dow === 6) classes.push('is-saturday');

    html += `<div class="day-cell">
      <button class="${classes.join(' ')}" onclick="selectDate('${dateStr}')">${d}</button>
    </div>`;
  }

  grid.innerHTML = html;
}

function prevMonth() {
  if (currentMonth === 0) { currentYear--; currentMonth = 11; }
  else currentMonth--;
  renderCalendar();
}

function nextMonth() {
  if (currentMonth === 11) { currentYear++; currentMonth = 0; }
  else currentMonth++;
  renderCalendar();
}

function goToToday() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  renderCalendar();
}

function selectDate(dateStr) {
  selectedDate = dateStr;
  renderCalendar();
  openWorkoutModal(dateStr);
}

// ── 운동 기록 모달 ──
let modalDate = null;
let modalWorkout = null;

function openTodayWorkout() {
  selectDate(todayKey());
}

function openWorkoutModal(dateStr) {
  modalDate = dateStr;
  const all = getAllWorkouts();
  modalWorkout = JSON.parse(JSON.stringify(all[dateStr] || { exercises: [] }));

  document.getElementById('modal-date-label').textContent = formatDateKo(dateStr);
  renderModalExercises();
  document.getElementById('workout-modal').classList.add('open');
}

function closeWorkoutModal() {
  document.getElementById('workout-modal').classList.remove('open');
  selectedDate = null;
  renderCalendar();
}

function renderModalExercises() {
  const container = document.getElementById('modal-exercise-list');
  const exercises = modalWorkout.exercises || [];

  if (exercises.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:32px 0;color:var(--text-muted)">
        <div style="font-size:40px;margin-bottom:8px">🏋️</div>
        <p style="font-size:14px">운동을 추가해보세요</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="exercise-list">${exercises.map((ex, i) => renderExerciseCard(ex, i)).join('')}</div>`;
}

function renderExerciseCard(ex, idx) {
  const sets = ex.sets || [];
  const summary = sets.length > 0 ? `${sets.length}세트` : '세트 없음';

  const setsHtml = `
    <div class="sets-container">
      ${sets.length > 0 ? `
        <div class="sets-header">
          <span>세트</span>
          <span>${ex.type === 'time' ? '시간(초)' : '횟수'}</span>
          <span>메모</span>
          <span></span>
        </div>
        ${sets.map((s, si) => `
          <div class="set-row">
            <div class="set-num">${si+1}</div>
            <input type="number" class="set-input" value="${s.value || ''}"
              placeholder="${ex.type === 'time' ? '초' : '회'}"
              onchange="updateSet(${idx},${si},'value',this.value)"
              inputmode="numeric">
            <input type="text" class="set-input" value="${s.note || ''}"
              placeholder="-"
              onchange="updateSet(${idx},${si},'note',this.value)">
            <button class="btn-delete-set" onclick="deleteSet(${idx},${si})">×</button>
          </div>`).join('')}
      ` : ''}
      <button class="btn-add-set" onclick="addSet(${idx})">
        ＋ ${sets.length === 0 ? '첫 세트 추가' : '세트 추가'}
      </button>
    </div>`;

  return `
    <div class="exercise-card">
      <div class="exercise-header">
        <div class="exercise-name-wrap">
          <div class="exercise-icon">${ex.icon || '🏋️'}</div>
          <div>
            <div class="exercise-name">${ex.name}</div>
            <div class="exercise-summary">${summary}</div>
          </div>
        </div>
        <button class="btn-sm btn-danger-sm" onclick="deleteExercise(${idx})">삭제</button>
      </div>
      ${setsHtml}
    </div>`;
}

function addSet(exerciseIdx) {
  modalWorkout.exercises[exerciseIdx].sets.push({ value: '', note: '' });
  renderModalExercises();
}

function deleteSet(exerciseIdx, setIdx) {
  modalWorkout.exercises[exerciseIdx].sets.splice(setIdx, 1);
  renderModalExercises();
}

function updateSet(exerciseIdx, setIdx, field, value) {
  modalWorkout.exercises[exerciseIdx].sets[setIdx][field] = value;
}

function deleteExercise(idx) {
  if (!confirm(`"${modalWorkout.exercises[idx].name}" 을(를) 삭제할까요?`)) return;
  modalWorkout.exercises.splice(idx, 1);
  renderModalExercises();
}

function saveModalWorkout() {
  const all = getAllWorkouts();
  all[modalDate] = { ...modalWorkout, savedAt: new Date().toISOString() };
  saveAllWorkouts(all);
  closeWorkoutModal();
  renderCalendar();
  showToast('✅ 저장됐어요!');
}

// ── 운동 추가 모달 ──
let selectedExercise = null;
let customType = 'reps';
let exerciseDuration = 0; // minutes (total workout time)

function adjDuration(delta) {
  exerciseDuration = Math.max(0, exerciseDuration + delta);
  document.getElementById('dur-display').textContent =
    exerciseDuration === 0 ? '없음' : `${exerciseDuration}분`;
}

function showPrevRecord(name) {
  const all = getAllWorkouts();
  const today = todayKey();
  const sorted = Object.entries(all).sort(([a],[b]) => b.localeCompare(a));

  let found = null;
  for (const [date, workout] of sorted) {
    if (date >= today) continue;
    const ex = (workout.exercises || []).find(e => e.name === name);
    if (ex && ex.sets && ex.sets.length > 0) { found = { date, ex }; break; }
  }

  const section = document.getElementById('prev-record-section');
  if (!found) { section.style.display = 'none'; return; }

  const unit = found.ex.type === 'time' ? '초' : '회';
  section.style.display = 'block';
  document.getElementById('prev-record-content').innerHTML = `
    <div class="prev-record-date">${formatDateKo(found.date)}</div>
    ${found.ex.sets.map((s, i) => `
      <div class="prev-set-row">
        <span class="prev-set-num">세트 ${i+1}</span>
        <span class="prev-set-val">${s.value || 0}${unit}</span>
        ${s.time ? `<span class="prev-set-time">${fmtTime(s.time)}</span>` : ''}
        ${s.note ? `<span class="prev-set-note">${s.note}</span>` : ''}
      </div>`).join('')}`;
}

function openAddModal() {
  selectedExercise = null;
  customType = 'reps';
  exerciseDuration = 20;
  document.getElementById('custom-name').value = '';
  document.getElementById('dur-display').textContent = '20분';
  document.getElementById('prev-record-section').style.display = 'none';
  document.querySelectorAll('.exercise-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.type === 'reps');
  });
  document.getElementById('add-modal').classList.add('open');
}

function closeAddModal() {
  document.getElementById('add-modal').classList.remove('open');
}

function selectPreset(name, type, icon) {
  selectedExercise = { name, type, icon };
  document.querySelectorAll('.exercise-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.name === name);
  });
  document.getElementById('custom-name').value = '';
  showPrevRecord(name);
}

function setCustomType(type) {
  customType = type;
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.type === type);
  });
}

function confirmAddExercise() {
  const customName = document.getElementById('custom-name').value.trim();
  let exercise;

  if (customName) {
    exercise = { name: customName, type: customType, icon: '🏋️', sets: [], duration: exerciseDuration * 60 };
  } else if (selectedExercise) {
    exercise = { ...selectedExercise, sets: [], duration: exerciseDuration * 60 };
  } else {
    showToast('운동을 선택하거나 직접 입력하세요');
    return;
  }

  modalWorkout.exercises.push(exercise);
  closeAddModal();
  renderModalExercises();
}

// ── 운동 중 화면 ──
const aw = {
  date: null, exercises: [], exIdx: 0, setNum: 1,
  sets: {},  // { exIdx: [{ value, note, time }] }
};

// 스톱워치
const sw = { secs: 0, original: 0, countdown: false, running: false, interval: null };

function fmtTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function initStopwatch(durationSecs) {
  clearInterval(sw.interval);
  sw.running = false;
  sw.countdown = durationSecs > 0;
  sw.original = durationSecs;
  sw.secs = durationSecs > 0 ? durationSecs : 0;
  document.getElementById('aw-sw-display').textContent = fmtTime(sw.secs);
  document.getElementById('aw-sw-btn').textContent = '▶ 시작';
  // 카운트다운이면 빨간 색으로 표시 안 함 (정상 색)
  document.getElementById('aw-sw-display').style.color = '';
}

function toggleStopwatch() {
  if (sw.running) {
    clearInterval(sw.interval);
    sw.running = false;
    document.getElementById('aw-sw-btn').textContent = '▶ 계속';
  } else {
    sw.running = true;
    document.getElementById('aw-sw-btn').textContent = '⏸ 정지';
    sw.interval = setInterval(() => {
      if (sw.countdown) {
        sw.secs = Math.max(0, sw.secs - 1);
        // 남은 시간에 따라 색상 변경
        const pct = sw.original > 0 ? sw.secs / sw.original : 1;
        const disp = document.getElementById('aw-sw-display');
        disp.style.color = pct < 0.2 ? 'var(--danger)' : pct < 0.5 ? 'var(--amber)' : '';
        if (sw.secs <= 0) {
          clearInterval(sw.interval);
          sw.running = false;
          document.getElementById('aw-sw-btn').textContent = '▶ 다시';
          if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
          showToast('⏰ 운동 시간 완료!');
        }
      } else {
        sw.secs++;
      }
      document.getElementById('aw-sw-display').textContent = fmtTime(sw.secs);
    }, 1000);
  }
}

function resetStopwatch() {
  clearInterval(sw.interval);
  sw.running = false;
  sw.secs = sw.countdown ? sw.original : 0;
  document.getElementById('aw-sw-display').textContent = fmtTime(sw.secs);
  document.getElementById('aw-sw-display').style.color = '';
  document.getElementById('aw-sw-btn').textContent = '▶ 시작';
}

function getPrevSets(name) {
  const all = getAllWorkouts();
  const today = todayKey();
  const sorted = Object.entries(all).sort(([a],[b]) => b.localeCompare(a));
  for (const [date, workout] of sorted) {
    if (date >= today) continue;
    const ex = (workout.exercises || []).find(e => e.name === name);
    if (ex && ex.sets && ex.sets.length > 0) return ex.sets;
  }
  return null;
}

function startActiveWorkout() {
  if (!modalWorkout.exercises || modalWorkout.exercises.length === 0) {
    showToast('운동을 먼저 추가하세요'); return;
  }
  aw.date = modalDate;
  aw.exercises = JSON.parse(JSON.stringify(modalWorkout.exercises));
  aw.exIdx = 0; aw.setNum = 1; aw.sets = {};
  aw.exercises.forEach((_, i) => { aw.sets[i] = []; });
  document.getElementById('workout-modal').classList.remove('open');
  document.getElementById('active-workout').classList.add('visible');
  renderAWFull();
}

function renderAW() {
  const ex = aw.exercises[aw.exIdx];
  document.getElementById('aw-exercise-name').textContent = `${ex.icon || '🏋️'} ${ex.name}`;
  document.getElementById('aw-progress-text').textContent = `${aw.exIdx + 1} / ${aw.exercises.length}`;
  document.getElementById('aw-set-label').textContent = `세트 ${aw.setNum}`;
  document.getElementById('aw-reps').value = '0';
  document.getElementById('aw-unit').textContent = ex.type === 'time' ? '초' : '회';
  document.getElementById('aw-btn-prev').disabled = aw.exIdx === 0;
  document.getElementById('aw-btn-next').disabled = aw.exIdx === aw.exercises.length - 1;
  renderAWTable();
}

function renderAWFull() {
  const ex = aw.exercises[aw.exIdx];
  initStopwatch(ex.duration || 0);
  renderAW();
}

function renderAWTable() {
  const sets = aw.sets[aw.exIdx] || [];
  const section = document.getElementById('aw-table-section');
  if (sets.length === 0) { section.style.display = 'none'; return; }

  section.style.display = 'block';
  const ex = aw.exercises[aw.exIdx];
  const unit = ex.type === 'time' ? '초' : '회';

  const prevSets = getPrevSets(ex.name);

  const rowCells = sets.map((s, i) => {
    const prev = prevSets && prevSets[i];
    const prevHtml = prev
      ? `<div class="prev-reps-hint">전 ${prev.value}${unit}</div>` : '';
    return `
      <tr>
        <td class="aw-row-label">세트 ${i+1}</td>
        <td class="highlight">${s.value}${unit}${prevHtml}</td>
        <td>${fmtTime(s.time || 0)}</td>
      </tr>`;
  }).join('');

  document.getElementById('aw-table').innerHTML = `
    <thead><tr><th></th><th>횟수</th><th>타이머</th></tr></thead>
    <tbody>${rowCells}</tbody>`;
}

function adjustReps(delta) {
  const input = document.getElementById('aw-reps');
  input.value = Math.max(0, (parseInt(input.value) || 0) + delta);
}

function completeSet() {
  const value = document.getElementById('aw-reps').value || '0';
  const elapsed = sw.countdown ? sw.original - sw.secs : sw.secs;
  aw.sets[aw.exIdx].push({ value, time: elapsed });
  aw.setNum++;
  renderAW();
  if (navigator.vibrate) navigator.vibrate(80);
  showToast(`✓ ${aw.sets[aw.exIdx].length}세트 완료!`);
}

function prevExercise() {
  if (aw.exIdx > 0) {
    aw.exIdx--;
    aw.setNum = aw.sets[aw.exIdx].length + 1;
    renderAWFull();
  }
}

function nextExercise() {
  if (aw.exIdx < aw.exercises.length - 1) {
    aw.exIdx++;
    aw.setNum = aw.sets[aw.exIdx].length + 1;
    renderAWFull();
  }
}

function finishActiveWorkout() {
  aw.exercises.forEach((ex, i) => {
    if (aw.sets[i] && aw.sets[i].length > 0) ex.sets = aw.sets[i];
  });
  const all = getAllWorkouts();
  all[aw.date] = { exercises: aw.exercises, savedAt: new Date().toISOString() };
  saveAllWorkouts(all);
  resetStopwatch();
  document.getElementById('active-workout').classList.remove('visible');
  renderCalendar();
  showToast('🎉 운동 완료! 저장됐어요');
}

function exitActiveWorkout() {
  const hasSets = Object.values(aw.sets).some(s => s.length > 0);
  if (hasSets && !confirm('기록 중인 운동이 있어요. 저장하지 않고 나갈까요?')) return;
  resetStopwatch();
  document.getElementById('active-workout').classList.remove('visible');
  openWorkoutModal(aw.date);
}

// ── 통계 ──
function renderStatsView() {
  const all = Object.entries(getAllWorkouts())
    .sort(([a],[b]) => b.localeCompare(a))
    .map(([date, data]) => ({ date, ...data }));

  const totalDays = all.length;
  let streak = 0;
  if (all.length > 0) {
    let prev = null;
    for (const item of all) {
      if (!prev) { streak = 1; prev = item.date; continue; }
      const diff = Math.round((new Date(prev) - new Date(item.date)) / 86400000);
      if (diff === 1) { streak++; prev = item.date; } else break;
    }
  }

  const totalSets = all.reduce((acc, w) =>
    acc + (w.exercises || []).reduce((a, e) => a + (e.sets || []).length, 0), 0);

  const counter = {};
  all.forEach(w => (w.exercises || []).forEach(e => {
    counter[e.name] = (counter[e.name] || 0) + 1;
  }));
  const top = Object.entries(counter).sort((a,b) => b[1]-a[1]).slice(0, 5);

  const streakHtml = streak >= 2 ? `
    <div class="streak-banner">
      <div class="streak-fire">🔥</div>
      <div class="streak-info">
        <h3>${streak}일 연속 운동!</h3>
        <p>대단해요, 계속 이어가세요!</p>
      </div>
    </div>` : '';

  document.getElementById('stats-content').innerHTML = `
    ${streakHtml}
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-value">${totalDays}</div><div class="stat-label">총 운동일</div></div>
      <div class="stat-card"><div class="stat-value">${streak}</div><div class="stat-label">현재 연속</div></div>
      <div class="stat-card"><div class="stat-value">${totalSets}</div><div class="stat-label">총 세트</div></div>
      <div class="stat-card"><div class="stat-value">${totalDays > 0 ? Math.round(totalSets/totalDays) : 0}</div><div class="stat-label">평균 세트/회</div></div>
    </div>
    ${top.length > 0 ? `
      <div class="section-title" style="margin-top:8px">자주 한 운동</div>
      <div class="top-exercise-list">
        ${top.map(([name, count]) => `
          <div class="top-exercise-item">
            <span>${name}</span>
            <span>${count}회</span>
          </div>`).join('')}
      </div>` : ''}`;
}

// ── 탭 전환 ──
function switchTab(tab) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${tab}`).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById('cal-header').style.display = tab === 'calendar' ? 'flex' : 'none';
  if (tab === 'stats') renderStatsView();
}

// ── 타이머 ──
const TIMER_CIRCUMFERENCE = 439.82;
let timerSeconds = 30 * 60;
let timerOriginal = 30 * 60;
let timerInterval = null;
let timerRunning = false;

function setTimer(minutes) {
  if (timerRunning) return;
  timerSeconds = minutes * 60;
  timerOriginal = timerSeconds;
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.textContent) === minutes);
  });
  document.getElementById('timer-custom-display').textContent = minutes + '분';
  updateTimerDisplay();
}

function adjustTimer(delta) {
  if (timerRunning) return;
  const newMin = Math.max(1, Math.round(timerOriginal / 60) + delta);
  setTimer(newMin);
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
}

function toggleTimer() {
  if (timerRunning) pauseTimer(); else startTimer();
}

function startTimer() {
  if (timerSeconds <= 0) resetTimer();
  timerRunning = true;
  document.getElementById('btn-timer-start').textContent = '⏸ 일시정지';
  document.getElementById('timer-status').textContent = '운동 중';
  document.getElementById('timer-card').classList.add('running');
  document.getElementById('timer-card').classList.remove('done');

  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('btn-timer-start').textContent = '▶ 시작';
      document.getElementById('timer-status').textContent = '완료!';
      document.getElementById('timer-card').classList.remove('running');
      document.getElementById('timer-card').classList.add('done');
      showToast('🎉 운동 완료! 수고했어요!');
      if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('btn-timer-start').textContent = '▶ 계속';
  document.getElementById('timer-status').textContent = '일시정지';
  document.getElementById('timer-card').classList.remove('running');
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = timerOriginal;
  document.getElementById('btn-timer-start').textContent = '▶ 시작';
  document.getElementById('timer-status').textContent = '준비';
  document.getElementById('timer-card').classList.remove('running', 'done');
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  document.getElementById('timer-display').textContent =
    `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const offset = TIMER_CIRCUMFERENCE * (1 - (timerOriginal > 0 ? timerSeconds / timerOriginal : 1));
  document.getElementById('timer-ring-fill').style.strokeDashoffset = offset;
}

// ── 토스트 ──
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── 앱 시작 ──
window.addEventListener('load', () => {
  renderCalendar();
  updateTimerDisplay();
});
