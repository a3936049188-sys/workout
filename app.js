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
  if (timerRunning) pauseTimer();
  else startTimer();
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

  const progress = timerOriginal > 0 ? timerSeconds / timerOriginal : 1;
  const offset = TIMER_CIRCUMFERENCE * (1 - progress);
  document.getElementById('timer-ring-fill').style.strokeDashoffset = offset;
}

// ── 로컬 저장소 ──
function getAllWorkouts() {
  try {
    return JSON.parse(localStorage.getItem('wj_workouts') || '{}');
  } catch { return {}; }
}

function saveAllWorkouts(data) {
  localStorage.setItem('wj_workouts', JSON.stringify(data));
}

function loadTodayWorkout() {
  const all = getAllWorkouts();
  todayWorkout = all[todayKey()] || { exercises: [] };
}

function saveTodayWorkout() {
  const all = getAllWorkouts();
  all[todayKey()] = { ...todayWorkout, savedAt: new Date().toISOString() };
  saveAllWorkouts(all);
}

function loadHistory() {
  const all = getAllWorkouts();
  const today = todayKey();
  return Object.entries(all)
    .filter(([date]) => date !== today)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 60)
    .map(([date, data]) => ({ date, ...data }));
}

function loadAllForStats() {
  const all = getAllWorkouts();
  return Object.entries(all)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, data]) => ({ date, ...data }));
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
  return `${y}년 ${m}월 ${d}일 (${days[date.getDay()]})`;
}

// ── 상태 ──
let todayWorkout = null;
let selectedExercise = null;
let customType = 'reps';

// ── 렌더링 ──
function renderTodayView() {
  const container = document.getElementById('today-content');
  document.getElementById('today-date').textContent = formatDateKo(todayKey());

  const exercises = todayWorkout?.exercises || [];

  if (exercises.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏃</div>
        <h3>오늘 운동을 기록하세요!</h3>
        <p>아래 + 버튼을 눌러 운동을 추가하세요</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="exercise-list">
      ${exercises.map((ex, i) => renderExerciseCard(ex, i)).join('')}
    </div>
    <button class="btn-finish" onclick="finishWorkout()">
      ✅ 운동 완료 저장
    </button>`;
}

function renderExerciseCard(ex, idx) {
  const sets = ex.sets || [];
  const summary = sets.length > 0 ? `${sets.length}세트 완료` : '세트 없음';

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
              onchange="updateSet(${idx}, ${si}, 'value', this.value)"
              inputmode="numeric">
            <input type="text" class="set-input" value="${s.note || ''}"
              placeholder="-"
              onchange="updateSet(${idx}, ${si}, 'note', this.value)">
            <button class="btn-delete-set" onclick="deleteSet(${idx}, ${si})">×</button>
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
        <div class="exercise-actions">
          <button class="btn-sm btn-danger-sm" onclick="deleteExercise(${idx})">삭제</button>
        </div>
      </div>
      ${setsHtml}
    </div>`;
}

function renderHistoryView() {
  const container = document.getElementById('history-content');
  const items = loadHistory();

  if (items.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <div style="font-size:48px;margin-bottom:12px">📅</div>
        <p>아직 기록된 운동이 없어요</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="history-list">
      ${items.map(item => `
        <div class="history-item" onclick='showHistoryDetail("${item.date}", ${JSON.stringify(item)})'>
          <div class="history-date">${formatDateKo(item.date)}</div>
          <div class="history-exercises">
            ${(item.exercises || []).map(e => `<span class="exercise-tag">${e.icon || ''} ${e.name}</span>`).join('')}
          </div>
        </div>`).join('')}
    </div>`;
}

function renderStatsView() {
  const all = loadAllForStats();
  const totalDays = all.length;

  let streak = 0;
  if (all.length > 0) {
    let prev = null;
    for (const item of all) {
      if (!prev) { streak = 1; prev = item.date; continue; }
      const a = new Date(prev), b = new Date(item.date);
      const diff = Math.round((a - b) / 86400000);
      if (diff === 1) { streak++; prev = item.date; }
      else break;
    }
  }

  const totalSets = all.reduce((acc, w) =>
    acc + (w.exercises || []).reduce((a, e) => a + (e.sets || []).length, 0), 0);

  const counter = {};
  all.forEach(w => (w.exercises || []).forEach(e => {
    counter[e.name] = (counter[e.name] || 0) + 1;
  }));
  const topExercises = Object.entries(counter).sort((a, b) => b[1] - a[1]).slice(0, 5);

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
      <div class="stat-card">
        <div class="stat-value">${totalDays}</div>
        <div class="stat-label">총 운동일</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${streak}</div>
        <div class="stat-label">현재 연속</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalSets}</div>
        <div class="stat-label">총 세트</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalDays > 0 ? Math.round(totalSets/totalDays) : 0}</div>
        <div class="stat-label">평균 세트/회</div>
      </div>
    </div>
    ${topExercises.length > 0 ? `
      <div class="section-title" style="margin-top:8px">자주 한 운동</div>
      <div class="exercise-list">
        ${topExercises.map(([name, count]) => `
          <div class="exercise-card" style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between">
            <span style="font-weight:600">${name}</span>
            <span style="color:#6366f1;font-weight:700">${count}회</span>
          </div>`).join('')}
      </div>` : ''}`;
}

// ── 운동 조작 ──
function addSet(exerciseIdx) {
  todayWorkout.exercises[exerciseIdx].sets.push({ value: '', note: '' });
  renderTodayView();
}

function deleteSet(exerciseIdx, setIdx) {
  todayWorkout.exercises[exerciseIdx].sets.splice(setIdx, 1);
  renderTodayView();
}

function updateSet(exerciseIdx, setIdx, field, value) {
  todayWorkout.exercises[exerciseIdx].sets[setIdx][field] = value;
}

function deleteExercise(idx) {
  if (!confirm(`"${todayWorkout.exercises[idx].name}" 을(를) 삭제할까요?`)) return;
  todayWorkout.exercises.splice(idx, 1);
  renderTodayView();
}

function finishWorkout() {
  saveTodayWorkout();
  showToast('✅ 운동 기록이 저장됐어요!');
}

// ── 모달: 운동 추가 ──
function openAddModal() {
  selectedExercise = null;
  customType = 'reps';
  document.getElementById('custom-name').value = '';
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
    exercise = { name: customName, type: customType, icon: '🏋️', sets: [] };
  } else if (selectedExercise) {
    exercise = { ...selectedExercise, sets: [] };
  } else {
    showToast('운동을 선택하거나 직접 입력하세요');
    return;
  }

  todayWorkout.exercises.push(exercise);
  closeAddModal();
  renderTodayView();
  addSet(todayWorkout.exercises.length - 1);
}

// ── 히스토리 상세 ──
function showHistoryDetail(date, data) {
  document.getElementById('detail-date').textContent = formatDateKo(date);

  const exercises = data.exercises || [];
  document.getElementById('detail-content').innerHTML = exercises.length === 0
    ? '<p style="color:#94a3b8;text-align:center;padding:20px">기록된 운동이 없어요</p>'
    : exercises.map(ex => {
        const sets = ex.sets || [];
        return `
          <div class="exercise-card" style="margin-bottom:12px">
            <div class="exercise-header">
              <div class="exercise-name-wrap">
                <div class="exercise-icon">${ex.icon || '🏋️'}</div>
                <div class="exercise-name">${ex.name}</div>
              </div>
              <span style="font-size:13px;color:#94a3b8">${sets.length}세트</span>
            </div>
            <div class="sets-container">
              <div class="sets-header">
                <span>세트</span>
                <span>${ex.type === 'time' ? '시간(초)' : '횟수'}</span>
                <span>메모</span>
                <span></span>
              </div>
              ${sets.map((s, i) => `
                <div class="set-row">
                  <div class="set-num">${i+1}</div>
                  <div style="text-align:center;padding:8px;background:#f8fafc;border-radius:10px;border:1.5px solid #e2e8f0">
                    ${s.value || '-'} ${ex.type === 'time' ? '초' : '회'}
                  </div>
                  <div style="text-align:center;padding:8px;background:#f8fafc;border-radius:10px;border:1.5px solid #e2e8f0">
                    ${s.note || '-'}
                  </div>
                  <div></div>
                </div>`).join('')}
            </div>
          </div>`;
      }).join('');

  document.getElementById('detail-modal').classList.add('open');
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.remove('open');
}

// ── 탭 전환 ──
function switchTab(tab) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${tab}`).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('fab').classList.toggle('hidden', tab !== 'today');

  if (tab === 'history') renderHistoryView();
  if (tab === 'stats') renderStatsView();
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
  loadTodayWorkout();
  renderTodayView();
});
