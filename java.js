// Constantes e configurações
const STORAGE_KEY = 'routineAppData';
const DEFAULT_DATA = {
  routines: [],
  tags: [
    { id: 'tag1', name: 'pessoal', color: '#4f46e5' },
    { id: 'tag2', name: 'trabalho', color: '#10b981' },
    { id: 'tag3', name: 'saúde', color: '#ef4444' },
    { id: 'tag4', name: 'estudos', color: '#f59e0b' }
  ],
  preferences: {
    theme: 'light',
    showCompleted: true,
    compactMode: false
  }
};

// Estado da aplicação
let state = {
  currentView: 'hoje',
  currentViewMode: 'lista',
  selectedTask: null,
  currentDate: new Date(),
  showSidebar: true,
  routines: [],
  tags: [],
  preferences: {}
};

// Seletores DOM
const DOM = {
  app: document.querySelector('.app'),
  sidebar: document.getElementById('sidebar'),
  mainContent: document.getElementById('mainContent'),
  btnToggleSidebar: document.getElementById('btnToggleSidebar'),
  btnToggleTheme: document.getElementById('btnToggleTheme'),
  btnQuickAdd: document.getElementById('btnQuickAdd'),
  searchInput: document.getElementById('searchInput'),
  todayDate: document.getElementById('todayDate'),
  nowTime: document.getElementById('nowTime'),
  menuLinks: document.querySelectorAll('.menu-link'),
  tagList: document.getElementById('tagList'),
  btnAddTag: document.getElementById('btnAddTag'),
  prefCompact: document.getElementById('prefCompact'),
  prefShowCompleted: document.getElementById('prefShowCompleted'),
  viewTitle: document.getElementById('viewTitle'),
  crumbView: document.getElementById('crumbView'),
  viewTabs: document.querySelectorAll('.tab'),
  btnAddRoutineTop: document.getElementById('btnAddRoutineTop'),
  btnSort: document.getElementById('btnSort'),
  btnFilter: document.getElementById('btnFilter'),
  viewLista: document.getElementById('viewLista'),
  viewQuadro: document.getElementById('viewQuadro'),
  viewCalendario: document.getElementById('viewCalendario'),
  taskListToday: document.getElementById('taskListToday'),
  todoList: document.querySelector('[data-col="todo"] .card-list'),
  doingList: document.querySelector('[data-col="doing"] .card-list'),
  doneList: document.querySelector('[data-col="done"] .card-list'),
  detailsPanel: document.getElementById('detailsPanel'),
  detailsClose: document.getElementById('detailsClose'),
  detailsForm: document.getElementById('detailsForm'),
  taskTitle: document.getElementById('taskTitle'),
  taskDesc: document.getElementById('taskDesc'),
  taskDate: document.getElementById('taskDate'),
  taskTime: document.getElementById('taskTime'),
  taskPriority: document.getElementById('taskPriority'),
  taskTag: document.getElementById('taskTag'),
  btnSaveTask: document.getElementById('btnSaveTask'),
  btnDeleteTask: document.getElementById('btnDeleteTask'),
  btnDuplicateTask: document.getElementById('btnDuplicateTask'),
  modalQuickAdd: document.getElementById('modalQuickAdd'),
  quickAddForm: document.getElementById('quickAddForm'),
  quickTitle: document.getElementById('quickTitle'),
  quickDate: document.getElementById('quickDate'),
  quickPriority: document.getElementById('quickPriority'),
  quickTag: document.getElementById('quickTag'),
  modalAddTag: document.getElementById('modalAddTag'),
  addTagForm: document.getElementById('addTagForm'),
  tagName: document.getElementById('tagName'),
  tagColor: document.getElementById('tagColor'),
  calPrev: document.getElementById('calPrev'),
  calNext: document.getElementById('calNext'),
  calToday: document.getElementById('calToday'),
  calTitle: document.getElementById('calTitle'),
  calendarGrid: document.querySelector('.calendar-grid')
};

// Templates
const templates = {
  taskItem: document.getElementById('tplTaskItem'),
  boardCard: document.getElementById('tplBoardCard'),
  toast: document.getElementById('tplToast')
};

// Inicialização da aplicação
function init() {
  loadData();
  setupEventListeners();
  updateClock();
  setInterval(updateClock, 60000);
  setupDragAndDrop();
  render();
}

// Carrega dados do localStorage
function loadData() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    const parsedData = JSON.parse(savedData);
    state.routines = parsedData.routines || DEFAULT_DATA.routines;
    state.tags = parsedData.tags || DEFAULT_DATA.tags;
    state.preferences = parsedData.preferences || DEFAULT_DATA.preferences;
    state.showSidebar = parsedData.showSidebar !== undefined ? parsedData.showSidebar : true;
  } else {
    state.routines = DEFAULT_DATA.routines;
    state.tags = DEFAULT_DATA.tags;
    state.preferences = DEFAULT_DATA.preferences;
    saveData();
  }
  
  // Aplica preferências
  DOM.app.setAttribute('data-theme', state.preferences.theme);
  DOM.btnToggleTheme.setAttribute('aria-pressed', state.preferences.theme === 'dark');
  DOM.prefCompact.checked = state.preferences.compactMode;
  DOM.prefShowCompleted.checked = state.preferences.showCompleted;
  DOM.app.setAttribute('data-layout', state.showSidebar ? 'with-sidebar' : 'without-sidebar');
}

// Salva dados no localStorage
function saveData() {
  const dataToSave = {
    routines: state.routines,
    tags: state.tags,
    preferences: state.preferences,
    showSidebar: state.showSidebar
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

// Configura event listeners
function setupEventListeners() {
  // Topbar
  DOM.btnToggleSidebar.addEventListener('click', toggleSidebar);
  DOM.btnToggleTheme.addEventListener('click', toggleTheme);
  DOM.btnQuickAdd.addEventListener('click', () => DOM.modalQuickAdd.showModal());
  DOM.searchInput.addEventListener('input', handleSearch);
  
  // Sidebar navigation
  DOM.menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      setCurrentView(link.dataset.view);
    });
  });
  
  // View mode tabs
  DOM.viewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setViewMode(tab.dataset.viewmode);
    });
  });
  
  // Tag management
  DOM.btnAddTag.addEventListener('click', () => DOM.modalAddTag.showModal());
  
  // Preferences
  DOM.prefCompact.addEventListener('change', (e) => {
    state.preferences.compactMode = e.target.checked;
    saveData();
    render();
  });
  
  DOM.prefShowCompleted.addEventListener('change', (e) => {
    state.preferences.showCompleted = e.target.checked;
    saveData();
    render();
  });
  
  // Task actions
  DOM.btnAddRoutineTop.addEventListener('click', () => DOM.modalQuickAdd.showModal());
  
  // Details panel
  DOM.detailsClose.addEventListener('click', closeDetails);
  DOM.detailsForm.addEventListener('submit', saveTaskDetails);
  DOM.btnDeleteTask.addEventListener('click', deleteCurrentTask);
  DOM.btnDuplicateTask.addEventListener('click', duplicateCurrentTask);
  
  // Quick add modal
  DOM.quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
      title: DOM.quickTitle.value.trim(),
      date: DOM.quickDate.value || undefined,
      priority: DOM.quickPriority.value || 'medium',
      tag: DOM.quickTag.value ? DOM.quickTag.value.replace('#', '') : undefined
    };
    
    if (formData.title) {
      addNewRoutine(formData);
      DOM.quickAddForm.reset();
      DOM.modalQuickAdd.close();
    }
  });
  
  // Cancel button for quick add modal
  DOM.quickAddForm.querySelector('button[value="cancel"]').addEventListener('click', () => {
    DOM.quickAddForm.reset();
    DOM.modalQuickAdd.close();
  });
  
  // Add tag modal
  DOM.addTagForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
      name: DOM.tagName.value.trim(),
      color: DOM.tagColor.value
    };
    
    if (formData.name) {
      addNewTag(formData);
      DOM.addTagForm.reset();
      DOM.modalAddTag.close();
    }
  });
  
  // Cancel button for add tag modal
  DOM.addTagForm.querySelector('button[value="cancel"]').addEventListener('click', () => {
    DOM.addTagForm.reset();
    DOM.modalAddTag.close();
  });
  
  // Calendar navigation
  DOM.calPrev.addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    renderCalendar();
  });
  
  DOM.calNext.addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    renderCalendar();
  });
  
  DOM.calToday.addEventListener('click', () => {
    state.currentDate = new Date();
    renderCalendar();
  });
  
  // Configura drag and drop
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
}

// Atualiza o relógio na topbar
function updateClock() {
  const now = new Date();
  DOM.todayDate.textContent = now.toLocaleDateString('pt-BR');
  DOM.nowTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Alterna a sidebar
function toggleSidebar() {
  state.showSidebar = !state.showSidebar;
  DOM.app.setAttribute('data-layout', state.showSidebar ? 'with-sidebar' : 'without-sidebar');
  saveData();
}

// Alterna o tema claro/escuro
function toggleTheme() {
  const newTheme = state.preferences.theme === 'light' ? 'dark' : 'light';
  state.preferences.theme = newTheme;
  DOM.app.setAttribute('data-theme', newTheme);
  DOM.btnToggleTheme.setAttribute('aria-pressed', newTheme === 'dark');
  saveData();
}

// Define a visualização atual (Hoje, Semana, etc.)
function setCurrentView(view) {
  state.currentView = view;
  DOM.menuLinks.forEach(link => {
    link.classList.toggle('is-active', link.dataset.view === view);
  });
  render();
}

// Define o modo de visualização (Lista, Quadro, Calendário)
function setViewMode(mode) {
  state.currentViewMode = mode;
  DOM.viewTabs.forEach(tab => {
    tab.classList.toggle('is-active', tab.dataset.viewmode === mode);
  });
  
  // Mostra a view correta
  DOM.viewLista.classList.toggle('is-active', mode === 'lista');
  DOM.viewQuadro.classList.toggle('is-active', mode === 'quadro');
  DOM.viewCalendario.classList.toggle('is-active', mode === 'calendario');
  
  render();
}

// Filtra tarefas com base na busca
function handleSearch(e) {
  const term = e.target.value.toLowerCase();
  if (term.length > 0) {
    const filteredTasks = state.routines.filter(task => 
      task.title.toLowerCase().includes(term) || 
      (task.description && task.description.toLowerCase().includes(term)) || 
      (task.tag && task.tag.toLowerCase().includes(term))
    );
    
    renderTaskListWithTasks(filteredTasks);
  } else {
    render();
  }
}

// Renderiza a lista de tarefas com um conjunto específico de tarefas
function renderTaskListWithTasks(tasks) {
  if (!DOM.taskListToday) return;
  
  DOM.taskListToday.innerHTML = '';
  
  if (tasks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Nenhuma rotina encontrada';
    DOM.taskListToday.appendChild(emptyState);
    return;
  }
  
  tasks.forEach(task => {
    const taskElement = createTaskElement(task);
    DOM.taskListToday.appendChild(taskElement);
  });
}

// Renderiza toda a aplicação
function render() {
  updateViewTitle();
  
  switch (state.currentViewMode) {
    case 'lista':
      renderTaskList();
      break;
    case 'quadro':
      renderBoard();
      break;
    case 'calendario':
      renderCalendar();
      break;
  }
  
  renderTags();
}

// Atualiza o título da view
function updateViewTitle() {
  const titles = {
    'hoje': 'Hoje',
    'semana': 'Próximos 7 dias',
    'todas': 'Todas as rotinas',
    'calendario': 'Calendário'
  };
  
  DOM.viewTitle.textContent = titles[state.currentView] || 'Rotinas';
  DOM.crumbView.textContent = titles[state.currentView] || 'Rotinas';
}

// Renderiza a lista de tarefas
function renderTaskList() {
  if (!DOM.taskListToday) return;
  
  DOM.taskListToday.innerHTML = '';
  
  const tasks = getFilteredTasks();
  
  if (tasks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Nenhuma rotina encontrada';
    DOM.taskListToday.appendChild(emptyState);
    return;
  }
  
  tasks.forEach(task => {
    const taskElement = createTaskElement(task);
    DOM.taskListToday.appendChild(taskElement);
  });
}

// Renderiza o quadro Kanban
function renderBoard() {
  if (!DOM.todoList) return;
  
  // Limpa as colunas
  DOM.todoList.innerHTML = '';
  DOM.doingList.innerHTML = '';
  DOM.doneList.innerHTML = '';
  
  const tasks = getFilteredTasks();
  
  tasks.forEach(task => {
    const card = createBoardCard(task);
    
    // Adiciona à coluna correta
    if (task.status === 'done') {
      DOM.doneList.appendChild(card);
    } else if (task.status === 'doing') {
      DOM.doingList.appendChild(card);
    } else {
      DOM.todoList.appendChild(card);
    }
  });
  
  // Atualiza contadores
  document.getElementById('todoCount').textContent = `${DOM.todoList.children.length} itens`;
  document.getElementById('doingCount').textContent = `${DOM.doingList.children.length} itens`;
  document.getElementById('doneCount').textContent = `${DOM.doneList.children.length} itens`;
}

// Renderiza o calendário
function renderCalendar() {
  if (!DOM.calendarGrid) return;
  
  DOM.calendarGrid.innerHTML = '';
  
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  
  // Atualiza o título do calendário
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  DOM.calTitle.textContent = `${monthNames[month]} ${year}`;
  
  // Obtém o primeiro dia do mês e quantos dias tem
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Obtém o último dia do mês anterior
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  // Cria cabeçalhos dos dias da semana
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  dayNames.forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day-header';
    dayElement.textContent = day;
    DOM.calendarGrid.appendChild(dayElement);
  });
  
  // Preenche dias do mês anterior
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayElement = createCalendarDay(prevMonthDays - i, true);
    DOM.calendarGrid.appendChild(dayElement);
  }
  
  // Preenche dias do mês atual
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = today.getDate() === i && 
                    today.getMonth() === month && 
                    today.getFullYear() === year;
    const dayElement = createCalendarDay(i, false, isToday);
    DOM.calendarGrid.appendChild(dayElement);
  }
  
  // Preenche dias do próximo mês para completar a grade
  const totalCells = 42; // 6 linhas x 7 colunas
  const daysSoFar = firstDay + daysInMonth;
  const nextMonthDays = totalCells - daysSoFar;
  
  for (let i = 1; i <= nextMonthDays; i++) {
    const dayElement = createCalendarDay(i, true);
    DOM.calendarGrid.appendChild(dayElement);
  }
}

// Cria um elemento de dia para o calendário
function createCalendarDay(day, isOtherMonth, isToday = false) {
  const dayElement = document.createElement('div');
  dayElement.className = 'calendar-day';
  if (isOtherMonth) dayElement.classList.add('other-month');
  if (isToday) dayElement.classList.add('today');
  
  const dayHeader = document.createElement('div');
  dayHeader.className = 'calendar-day-header';
  dayHeader.textContent = day;
  dayElement.appendChild(dayHeader);
  
  // Adiciona tarefas para este dia
  const tasksForDay = state.routines.filter(task => {
    if (!task.date) return false;
    const taskDate = new Date(task.date);
    return (
      !isOtherMonth &&
      taskDate.getDate() === day &&
      taskDate.getMonth() === state.currentDate.getMonth() &&
      taskDate.getFullYear() === state.currentDate.getFullYear()
    );
  });
  
  tasksForDay.forEach(task => {
    const event = document.createElement('div');
    event.className = 'calendar-event';
    event.textContent = task.title;
    dayElement.appendChild(event);
  });
  
  return dayElement;
}

// Cria um elemento de tarefa para a lista
function createTaskElement(task) {
  const element = templates.taskItem.content.cloneNode(true);
  const li = element.querySelector('li');
  li.dataset.taskId = task.id;
  
  // Preenche os dados
  const checkbox = element.querySelector('.checkbox input');
  checkbox.checked = task.completed || false;
  checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
  
  element.querySelector('.task-title').textContent = task.title;
  
  // Data
  const dueElement = element.querySelector('.due');
  if (task.date) {
    const dueDate = new Date(task.date);
    dueElement.textContent = dueDate.toLocaleDateString('pt-BR');
    
    // Destaca se estiver atrasada
    if (!task.completed && dueDate < new Date()) {
      dueElement.classList.add('overdue');
    }
  } else {
    dueElement.textContent = 'Sem data';
  }
  
  // Prioridade
  const priorityElement = element.querySelector('.priority');
  priorityElement.textContent = 
    task.priority === 'high' ? 'Alta' : 
    task.priority === 'low' ? 'Baixa' : 'Média';
  priorityElement.classList.add(task.priority || 'medium');
  
  // Tag
  const tagElement = element.querySelector('.tag');
  if (task.tag) {
    tagElement.textContent = `#${task.tag}`;
    // Aplica a cor da tag se existir
    const tagInfo = state.tags.find(t => t.name === task.tag);
    if (tagInfo) {
      tagElement.style.backgroundColor = `${tagInfo.color}20`;
      tagElement.style.color = tagInfo.color;
    }
  } else {
    tagElement.textContent = '#geral';
  }
  
  // Botão para abrir detalhes
  element.querySelector('.task-open').addEventListener('click', () => openTaskDetails(task.id));
  
  // Drag and drop
  li.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', task.id);
  });
  
  return element;
}

// Cria um card para o quadro Kanban
function createBoardCard(task) {
  const element = templates.boardCard.content.cloneNode(true);
  const card = element.querySelector('.card');
  card.dataset.taskId = task.id;
  card.draggable = true;
  
  // Preenche os dados
  element.querySelector('.card-title').textContent = task.title;
  
  // Data
  const dueElement = element.querySelector('.due');
  if (task.date) {
    const dueDate = new Date(task.date);
    dueElement.textContent = dueDate.toLocaleDateString('pt-BR');
    
    // Destaca se estiver atrasada
    if (!task.completed && dueDate < new Date()) {
      dueElement.classList.add('overdue');
    }
  } else {
    dueElement.textContent = 'Sem data';
  }
  
  // Prioridade
  const priorityElement = element.querySelector('.priority');
  priorityElement.textContent = 
    task.priority === 'high' ? 'Alta' : 
    task.priority === 'low' ? 'Baixa' : 'Média';
  priorityElement.classList.add(task.priority || 'medium');
  
  // Tag
  const tagElement = element.querySelector('.tag');
  if (task.tag) {
    tagElement.textContent = `#${task.tag}`;
    // Aplica a cor da tag se existir
    const tagInfo = state.tags.find(t => t.name === task.tag);
    if (tagInfo) {
      tagElement.style.backgroundColor = `${tagInfo.color}20`;
      tagElement.style.color = tagInfo.color;
    }
  } else {
    tagElement.textContent = '#geral';
  }
  
  // Status (cor do indicador)
  const statusElement = element.querySelector('.status');
  if (task.status === 'done') {
    statusElement.style.backgroundColor = '#10b981';
  } else if (task.status === 'doing') {
    statusElement.style.backgroundColor = '#f59e0b';
  } else {
    statusElement.style.backgroundColor = '#e5e7eb';
  }
  
  // Botões de ação
  element.querySelector('.card-actions button:first-child').addEventListener('click', () => openTaskDetails(task.id));
  element.querySelector('.card-actions button:last-child').addEventListener('click', () => toggleTaskCompletion(task.id));
  
  // Drag and drop
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', task.id);
  });
  
  return element;
}

// Filtra tarefas com base na view atual
function getFilteredTasks() {
  let tasks = [...state.routines];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Filtra por view
  switch (state.currentView) {
    case 'hoje':
      tasks = tasks.filter(task => {
        if (!task.date) return false;
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });
      break;
      
    case 'semana':
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      tasks = tasks.filter(task => {
        if (!task.date) return false;
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate >= today && taskDate < nextWeek;
      });
      break;
      
    case 'calendario':
      // Para o calendário, mostramos todas as tarefas com data
      tasks = tasks.filter(task => task.date);
      break;
      
    // 'todas' não precisa de filtro especial
  }
  
  // Aplica preferência de mostrar concluídas
  if (!state.preferences.showCompleted) {
    tasks = tasks.filter(task => !task.completed);
  }
  
  return tasks;
}

// Abre o painel de detalhes da tarefa
function openTaskDetails(taskId) {
  const task = state.routines.find(t => t.id === taskId);
  if (!task) return;
  
  state.selectedTask = task;
  
  // Preenche o formulário
  DOM.taskTitle.value = task.title;
  DOM.taskDesc.value = task.description || '';
  DOM.taskPriority.value = task.priority || 'medium';
  DOM.taskTag.value = task.tag ? `#${task.tag}` : '';
  
  if (task.date) {
    const date = new Date(task.date);
    DOM.taskDate.value = date.toISOString().split('T')[0];
    
    if (task.time) {
      DOM.taskTime.value = task.time;
    }
  } else {
    DOM.taskDate.value = '';
    DOM.taskTime.value = '';
  }
  
  // Mostra o painel
  DOM.detailsPanel.setAttribute('aria-hidden', 'false');
}

// Fecha o painel de detalhes
function closeDetails() {
  state.selectedTask = null;
  DOM.detailsPanel.setAttribute('aria-hidden', 'true');
  DOM.detailsForm.reset();
}

// Salva as alterações da tarefa
function saveTaskDetails(e) {
  e.preventDefault();
  
  if (!state.selectedTask) return;
  
  // Atualiza a tarefa
  const task = state.routines.find(t => t.id === state.selectedTask.id);
  if (!task) return;
  
  task.title = DOM.taskTitle.value.trim();
  task.description = DOM.taskDesc.value.trim();
  task.priority = DOM.taskPriority.value;
  
  // Processa a tag (remove # se existir)
  const tagValue = DOM.taskTag.value.trim();
  task.tag = tagValue.startsWith('#') ? tagValue.substring(1) : tagValue || undefined;
  
  // Data e hora
  if (DOM.taskDate.value) {
    task.date = DOM.taskDate.value;
    task.time = DOM.taskTime.value || undefined;
  } else {
    task.date = undefined;
    task.time = undefined;
  }
  
  task.updatedAt = new Date().toISOString();
  
  saveData();
  render();
  closeDetails();
  showToast('Rotina atualizada com sucesso', 'success');
}

// Exclui a tarefa atual
function deleteCurrentTask() {
  if (!state.selectedTask) return;
  
  if (confirm('Tem certeza que deseja excluir esta rotina?')) {
    state.routines = state.routines.filter(t => t.id !== state.selectedTask.id);
    saveData();
    render();
    closeDetails();
    showToast('Rotina excluída', 'warning');
  }
}

// Duplica a tarefa atual
function duplicateCurrentTask() {
  if (!state.selectedTask) return;
  
  const originalTask = state.routines.find(t => t.id === state.selectedTask.id);
  if (!originalTask) return;
  
  const newTask = {
    ...originalTask,
    id: generateId(),
    title: `${originalTask.title} (cópia)`,
    completed: false,
    status: 'todo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  state.routines.push(newTask);
  saveData();
  render();
  openTaskDetails(newTask.id);
  showToast('Rotina duplicada com sucesso', 'success');
}

// Alterna o status de conclusão da tarefa
function toggleTaskCompletion(taskId) {
  const task = state.routines.find(t => t.id === taskId);
  if (!task) return;
  
  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date().toISOString() : undefined;
  
  // Se estiver concluída, muda para "done", senão volta para "todo"
  if (task.completed) {
    task.status = 'done';
  } else {
    task.status = 'todo';
  }
  
  task.updatedAt = new Date().toISOString();
  
  saveData();
  render();
  
  showToast(
    task.completed ? 'Rotina marcada como concluída!' : 'Rotina reaberta',
    task.completed ? 'success' : 'info'
  );
}

// Adiciona uma nova rotina
function addNewRoutine(taskData) {
  const newTask = {
    id: generateId(),
    title: taskData.title,
    description: '',
    date: taskData.date,
    time: undefined,
    priority: taskData.priority || 'medium',
    tag: taskData.tag,
    status: 'todo',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  state.routines.push(newTask);
  saveData();
  render();
  showToast('Nova rotina adicionada!', 'success');
  
  // Opcional: abrir detalhes da nova tarefa
  openTaskDetails(newTask.id);
}

// Adiciona uma nova etiqueta
function addNewTag(tagData) {
  const newTag = {
    id: generateId(),
    name: tagData.name.toLowerCase(),
    color: tagData.color
  };
  
  // Verifica se a tag já existe
  const tagExists = state.tags.some(tag => tag.name === newTag.name);
  if (tagExists) {
    showToast('Esta etiqueta já existe!', 'warning');
    return;
  }
  
  state.tags.push(newTag);
  saveData();
  renderTags();
  showToast('Nova etiqueta adicionada!', 'success');
}

// Renderiza a lista de etiquetas na sidebar
function renderTags() {
  DOM.tagList.innerHTML = '';
  
  state.tags.forEach(tag => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'tag';
    a.href = '#';
    a.dataset.tag = tag.name;
    a.textContent = `#${tag.name}`;
    a.style.backgroundColor = `${tag.color}20`; // 20% de opacidade
    a.style.color = tag.color;
    
    a.addEventListener('click', (e) => {
      e.preventDefault();
      // Filtra tarefas por esta tag
      const filteredTasks = state.routines.filter(task => task.tag === tag.name);
      renderTaskListWithTasks(filteredTasks);
      showToast(`Mostrando tarefas com a etiqueta #${tag.name}`, 'info');
    });
    
    li.appendChild(a);
    DOM.tagList.appendChild(li);
  });
}

// Mostra uma notificação toast
function showToast(message, type = 'info') {
  const toastElement = templates.toast.content.cloneNode(true);
  const toast = toastElement.querySelector('.toast');
  toast.classList.add(type);
  toast.querySelector('.toast-content').textContent = message;
  
  const container = document.getElementById('toasts');
  container.appendChild(toast);
  
  // Configura para fechar automaticamente
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => toast.remove());
  
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Gera um ID único
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Configura drag and drop entre as colunas
function setupDragAndDrop() {
  const columns = document.querySelectorAll('.column');
  
  columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.classList.add('drag-over');
    });
    
    column.addEventListener('dragleave', () => {
      column.classList.remove('drag-over');
    });
    
    column.addEventListener('drop', (e) => {
      e.preventDefault();
      column.classList.remove('drag-over');
      
      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = column.dataset.col;
      
      const task = state.routines.find(t => t.id === taskId);
      if (task && task.status !== newStatus) {
        task.status = newStatus;
        
        // Se mover para "done", marca como concluída
        if (newStatus === 'done') {
          task.completed = true;
          task.completedAt = new Date().toISOString();
        } else if (task.completed) {
          // Se mover para outra coluna e estava concluída, reabre
          task.completed = false;
          task.completedAt = undefined;
        }
        
        task.updatedAt = new Date().toISOString();
        
        saveData();
        renderBoard();
        showToast(`Tarefa movida para ${getStatusName(newStatus)}`, 'info');
      }
    });
  });
}

// Retorna o nome amigável para o status
function getStatusName(status) {
  const names = {
    'todo': 'A fazer',
    'doing': 'Em progresso',
    'done': 'Concluído'
  };
  return names[status] || status;
}

// Inicia a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);