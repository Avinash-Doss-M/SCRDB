(function initClassroomLogin() {
	const introScreen = document.getElementById("introScreen");
	const loginPanel = document.getElementById("loginPanel");
	const typingText = document.getElementById("typingText");
	const googleLoginBtn = document.getElementById("googleLoginBtn");
	const loginMessage = document.getElementById("loginMessage");

	if (!introScreen || !loginPanel || !typingText || !googleLoginBtn || !loginMessage) {
		return;
	}

	if (!window.supabase || typeof window.supabase.createClient !== "function") {
		setMessage("Authentication service is unavailable.", false);
		return;
	}

	const INTRO_DELAY_MS = 1800;
	const TYPE_SPEED_MS = 95;
	const DELETE_SPEED_MS = 55;
	const HOLD_AFTER_TYPE_MS = 1000;
	const HOLD_AFTER_DELETE_MS = 320;
	const DOMAIN = "@amjaincollege.edu.in";
	const SUPABASE_URL = "https://zusvmyxaqidypumehfsr.supabase.co";
	const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1c3ZteXhhcWlkeXB1bWVoZnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwODk1MjksImV4cCI6MjA4OTY2NTUyOX0.j2cgjwqn0Y5edp0MrYcfcXOQwBIr9bebz_KGv70KYdo";
	const TITLE_TEXTS = ["Classroom Dashboard", "Login"];
	const SPECIAL_ROLES = {
		"24h310@amjaincollege.edu.in": "cr",
		"vijiyamalini@amjaincollege.edu.in": "class_incharge",
		"24h319@amjaincollege.edu.in": "tech_support"
	};
	const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

	typingText.textContent = "";
	void runTitleTypewriter();
	window.setTimeout(showLoginPanel, INTRO_DELAY_MS);
	googleLoginBtn.addEventListener("click", handleGoogleLogin);
	void handleSupabaseUserOnLoad();

	async function runTitleTypewriter() {
		let phraseIndex = 0;

		while (true) {
			const phrase = TITLE_TEXTS[phraseIndex];
			await typePhrase(phrase);
			await wait(HOLD_AFTER_TYPE_MS);
			await deletePhrase(phrase);
			await wait(HOLD_AFTER_DELETE_MS);

			phraseIndex = (phraseIndex + 1) % TITLE_TEXTS.length;
		}
	}

	async function typePhrase(phrase) {
		for (let index = 1; index <= phrase.length; index += 1) {
			typingText.textContent = phrase.slice(0, index);
			await wait(TYPE_SPEED_MS);
		}
	}

	async function deletePhrase(phrase) {
		for (let index = phrase.length - 1; index >= 0; index -= 1) {
			typingText.textContent = phrase.slice(0, index);
			await wait(DELETE_SPEED_MS);
		}
	}

	function wait(delayMs) {
		return new Promise(function resolveAfterDelay(resolve) {
			window.setTimeout(resolve, delayMs);
		});
	}

	function showLoginPanel() {
		introScreen.classList.add("is-exit");
		loginPanel.classList.add("is-active");
		loginPanel.setAttribute("aria-hidden", "false");
	}

	async function handleGoogleLogin() {
		googleLoginBtn.disabled = true;
		setMessage("Redirecting to Google...", true);

		await supabaseClient.auth.signOut();

		const redirectTo = window.location.origin;
		const authResult = await supabaseClient.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo,
				queryParams: {
					prompt: "select_account"
				}
			}
		});

		if (authResult.error) {
			googleLoginBtn.disabled = false;
			setMessage(authResult.error.message || "Unable to start Google sign-in.", false);
		}
	}

	async function handleSupabaseUserOnLoad() {
		const userResult = await supabaseClient.auth.getUser();
		if (userResult.error || !userResult.data || !userResult.data.user) {
			googleLoginBtn.disabled = false;
			return;
		}

		const email = String(userResult.data.user.email || "").toLowerCase();
		const userName = resolveUserName(userResult.data.user, email);
		const role = resolveRole(email);

		if (!role) {
			clearLocalAuth();
			await supabaseClient.auth.signOut();
			window.alert("Access restricted");
			googleLoginBtn.disabled = false;
			setMessage("Access restricted", false);
			return;
		}

		localStorage.setItem("userEmail", email);
		localStorage.setItem("userName", userName);
		localStorage.setItem("role", role);
		window.location.href = "pages/dashboard.html";
	}

	function resolveRole(email) {
		if (SPECIAL_ROLES[email]) {
			return SPECIAL_ROLES[email];
		}

		if (!email.endsWith(DOMAIN)) {
			return null;
		}

		const localPart = email.slice(0, -DOMAIN.length);
		const rollMatch = /^24h(\d{3})$/.exec(localPart);

		if (!rollMatch) {
			return null;
		}

		const rollNumber = Number(rollMatch[1]);
		if (rollNumber < 301 || rollNumber > 350) {
			return null;
		}

		return "student";
	}

	function clearLocalAuth() {
		localStorage.removeItem("userName");
		localStorage.removeItem("userEmail");
		localStorage.removeItem("role");
	}

	function resolveUserName(user, email) {
		const userMeta = user.user_metadata || {};
		const identityData =
			user.identities && user.identities[0] && user.identities[0].identity_data
				? user.identities[0].identity_data
				: {};

		const preferredNames = [
			userMeta.full_name,
			userMeta.name,
			identityData.full_name,
			identityData.name,
			[userMeta.given_name, userMeta.family_name].filter(Boolean).join(" "),
			[identityData.given_name, identityData.family_name].filter(Boolean).join(" ")
		];

		for (let i = 0; i < preferredNames.length; i += 1) {
			if (preferredNames[i] && String(preferredNames[i]).trim()) {
				return String(preferredNames[i]).trim();
			}
		}

		return email.split("@")[0];
	}

	function setMessage(text, isSuccess) {
		loginMessage.textContent = text;
		loginMessage.classList.toggle("is-success", Boolean(isSuccess));
	}
})();

(function initProfilePage() {
	const isProfilePage = document.body && document.body.classList.contains("profile-page");
	if (!isProfilePage) {
		return;
	}

	const profileEmail = document.getElementById("profileEmail");
	const profileName = document.getElementById("profileName");
	const profileRole = document.getElementById("profileRole");
	const logoutBtn = document.getElementById("logoutBtn");
	const profileMessage = document.getElementById("profileMessage");

	if (!profileEmail || !profileName || !profileRole || !logoutBtn || !profileMessage) {
		return;
	}

	const userName = localStorage.getItem("userName");
	const userEmail = localStorage.getItem("userEmail");
	const role = localStorage.getItem("role");

	if (!userEmail || !role) {
		window.location.href = "../index.html";
		return;
	}

	profileName.textContent = userName || userEmail.split("@")[0];
	profileEmail.textContent = userEmail;
	profileRole.textContent = role;
	void syncProfileFromSupabase();

	logoutBtn.addEventListener("click", handleLogout);

	async function handleLogout() {
		logoutBtn.disabled = true;
		profileMessage.textContent = "Signing out...";

		if (window.supabase && typeof window.supabase.createClient === "function") {
			const supabaseClient = window.supabase.createClient(
				"https://zusvmyxaqidypumehfsr.supabase.co",
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1c3ZteXhhcWlkeXB1bWVoZnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwODk1MjksImV4cCI6MjA4OTY2NTUyOX0.j2cgjwqn0Y5edp0MrYcfcXOQwBIr9bebz_KGv70KYdo"
			);
			await supabaseClient.auth.signOut();
		}

		localStorage.removeItem("userEmail");
		localStorage.removeItem("userName");
		localStorage.removeItem("role");
		window.location.href = "../index.html";
	}

	async function syncProfileFromSupabase() {
		if (!window.supabase || typeof window.supabase.createClient !== "function") {
			return;
		}

		const supabaseClient = window.supabase.createClient(
			"https://zusvmyxaqidypumehfsr.supabase.co",
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1c3ZteXhhcWlkeXB1bWVoZnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwODk1MjksImV4cCI6MjA4OTY2NTUyOX0.j2cgjwqn0Y5edp0MrYcfcXOQwBIr9bebz_KGv70KYdo"
		);

		const userResult = await supabaseClient.auth.getUser();
		if (userResult.error || !userResult.data || !userResult.data.user) {
			return;
		}

		const supabaseUser = userResult.data.user;
		const liveEmail = String(supabaseUser.email || userEmail).toLowerCase();
		const liveName = extractProfileName(supabaseUser, liveEmail);

		profileEmail.textContent = liveEmail;
		profileName.textContent = liveName;
		localStorage.setItem("userEmail", liveEmail);
		localStorage.setItem("userName", liveName);
	}

	function extractProfileName(user, email) {
		const userMeta = user.user_metadata || {};
		const identityData =
			user.identities && user.identities[0] && user.identities[0].identity_data
				? user.identities[0].identity_data
				: {};

		const candidateNames = [
			userMeta.full_name,
			userMeta.name,
			identityData.full_name,
			identityData.name,
			[userMeta.given_name, userMeta.family_name].filter(Boolean).join(" "),
			[identityData.given_name, identityData.family_name].filter(Boolean).join(" ")
		];

		for (let i = 0; i < candidateNames.length; i += 1) {
			if (candidateNames[i] && String(candidateNames[i]).trim()) {
				return String(candidateNames[i]).trim();
			}
		}

		return email.split("@")[0];
	}
})();

(function initClassroomDashboard() {
	const isDashboardPage = document.body && document.body.classList.contains("dashboard-page");
	if (!isDashboardPage) {
		return;
	}

	const userEmailCheck = localStorage.getItem("userEmail");
	const roleCheck = localStorage.getItem("role");

	if (!userEmailCheck || !roleCheck) {
		window.location.href = "../index.html";
		return;
	}
	const todayDateEl = document.getElementById("todayDate");
	const todayOrderEl = document.getElementById("todayOrder");
	const todaySubtextEl = document.getElementById("todaySubtext");
	const currentStatusBar = document.getElementById("currentStatusBar");
	const nextDaysSlider = document.getElementById("nextDaysSlider");
	const periodGrid = document.getElementById("periodGrid");
	const timetablePanel = document.getElementById("timetablePanel");
	const holidayMessage = document.getElementById("holidayMessage");
	const currentPeriodLabel = document.getElementById("currentPeriodLabel");
	const dashboardUser = document.getElementById("dashboardUser");
	const taskList = document.getElementById("taskList");
	const taskForm = document.getElementById("taskForm");
	const taskTitleInput = document.getElementById("taskTitle");
	const taskSubjectInput = document.getElementById("taskSubject");
	const taskDeadlineInput = document.getElementById("taskDeadline");
	const taskProofInput = document.getElementById("taskProof");
	const taskAddButton = document.getElementById("taskAddButton");
	const tasksRoleNote = document.getElementById("tasksRoleNote");
	const taskSummary = document.getElementById("taskSummary");
	const homeTaskSummary = document.getElementById("homeTaskSummary");
	const profileName = document.getElementById("profileName");
	const profileEmail = document.getElementById("profileEmail");
	const profileRole = document.getElementById("profileRole");
	const completedTasksCount = document.getElementById("completedTasksCount");
	const logoutBtn = document.getElementById("logoutBtn");
	const profileMessage = document.getElementById("profileMessage");
	const themeToggle = document.getElementById("themeToggle");

	if (
		!todayDateEl ||
		!todayOrderEl ||
		!todaySubtextEl ||
		!currentStatusBar ||
		!nextDaysSlider ||
		!periodGrid ||
		!timetablePanel ||
		!holidayMessage ||
		!currentPeriodLabel ||
		!dashboardUser ||
		!taskList ||
		!taskForm ||
		!taskTitleInput ||
		!taskSubjectInput ||
		!taskDeadlineInput ||
		!taskProofInput ||
		!taskAddButton ||
		!tasksRoleNote ||
		!taskSummary ||
		!homeTaskSummary ||
		!profileName ||
		!profileEmail ||
		!profileRole ||
		!completedTasksCount ||
		!logoutBtn ||
		!profileMessage ||
		!themeToggle
	) {
		return;
	}

	const calendarData = [
		{ date: "2026-03-20", type: "working", dayOrder: 4 },
		{ date: "2026-03-21", type: "holiday", dayOrder: null },
		{ date: "2026-03-22", type: "holiday", dayOrder: null },
		{ date: "2026-03-23", type: "working", dayOrder: 5 },
		{ date: "2026-03-24", type: "working", dayOrder: 6 },
		{ date: "2026-03-25", type: "working", dayOrder: 1 },
		{ date: "2026-03-26", type: "working", dayOrder: 2 },
		{ date: "2026-03-27", type: "working", dayOrder: 3 },
		{ date: "2026-03-28", type: "holiday", dayOrder: null },
		{ date: "2026-03-29", type: "holiday", dayOrder: null },
		{ date: "2026-03-30", type: "working", dayOrder: 4 },
		{ date: "2026-03-31", type: "working", dayOrder: 5 },
		{ date: "2026-04-01", type: "working", dayOrder: 6 },
		{ date: "2026-04-02", type: "working", dayOrder: 1 },
		{ date: "2026-04-03", type: "working", dayOrder: 2 },
		{ date: "2026-04-04", type: "holiday", dayOrder: null },
		{ date: "2026-04-05", type: "holiday", dayOrder: null },
		{ date: "2026-04-06", type: "working", dayOrder: 3 },
		{ date: "2026-04-07", type: "working", dayOrder: 4 },
		{ date: "2026-04-08", type: "working", dayOrder: 5 },
		{ date: "2026-04-09", type: "working", dayOrder: 6 },
		{ date: "2026-04-10", type: "working", dayOrder: 1 },
		{ date: "2026-04-11", type: "holiday", dayOrder: null },
		{ date: "2026-04-12", type: "holiday", dayOrder: null },
		{ date: "2026-04-13", type: "working", dayOrder: 2 }
	];

	const timetable = {
		1: ["NMN LAB-LA", "NMN LAB-LA", "C&M A/C", "LANG", "JAVA"],
		2: ["ENG", "C&M A/C", "JAVA", "LANG", "JAVA"],
		3: ["JAVA", "ENG", "JAVA LAB", "JAVA LAB", "LANG"],
		4: ["JAVA LAB", "JAVA LAB", "JAVA", "LANG", "ENG"],
		5: ["EVS", "ENG", "C&M A/C", "VE", "LANG"],
		6: ["VE", "C&M A/C", "ENG", "JAVA LAB", "JAVA LAB"]
	};

	const periods = [
		{ id: 1, start: "13:30", end: "14:20" },
		{ id: 2, start: "14:21", end: "15:10" },
		{ id: 3, start: "15:31", end: "16:20" },
		{ id: 4, start: "16:21", end: "17:10" },
		{ id: 5, start: "17:11", end: "18:00" }
	];

	const TASKS_STORAGE_KEY = "classroomTasks";
	const currentRole = localStorage.getItem("role") || "student";
	const userEmail = localStorage.getItem("userEmail") || "Guest";
	const userName = localStorage.getItem("userName") || userEmail.split("@")[0];
	let tasks = loadTasks();
	let selectedDateIso = formatISODate(new Date());

	configureTaskPermissions();
	setupProfileSection();
	taskForm.addEventListener("submit", addTask);
	taskList.addEventListener("click", handleTaskListClick);
	taskList.addEventListener("change", handleTaskProofChange);
	nextDaysSlider.addEventListener("click", handleNextDaySelection);

	renderDashboard();
	window.setInterval(renderDashboard, 30000);

	function getTodayData() {
		const todayIso = formatISODate(new Date());
		return getDateData(todayIso);
	}

	function getDateData(targetIso) {
		return (
			calendarData.find(function matchDate(entry) {
				return entry.date === targetIso;
			}) ||
			{ date: targetIso, type: "holiday", dayOrder: null }
		);
	}

	function getDayOrder(date) {
		const targetIso = typeof date === "string" ? date : formatISODate(date);
		const entry = calendarData.find(function matchDate(item) {
			return item.date === targetIso;
		});
		return entry && entry.type === "working" ? entry.dayOrder : null;
	}

	function getCurrentTime() {
		const now = new Date();
		return {
			now,
			totalMinutes: now.getHours() * 60 + now.getMinutes()
		};
	}

	function getCurrentPeriod() {
		const currentTime = getCurrentTime();
		const firstPeriodStart = toMinutes(periods[0].start);
		const lastPeriodEnd = toMinutes(periods[periods.length - 1].end);

		if (currentTime.totalMinutes < firstPeriodStart) {
			return { status: "not_started", period: null, currentTime };
		}

		if (currentTime.totalMinutes > lastPeriodEnd) {
			return { status: "classes_over", period: null, currentTime };
		}

		for (let i = 0; i < periods.length; i += 1) {
			const periodStart = toMinutes(periods[i].start);
			const periodEnd = toMinutes(periods[i].end);

			if (currentTime.totalMinutes >= periodStart && currentTime.totalMinutes <= periodEnd) {
				return {
					status: "current",
					period: periods[i],
					currentTime
				};
			}

			if (currentTime.totalMinutes < periodStart) {
				return { status: "break", period: null, currentTime };
			}
		}

		return { status: "break", period: null, currentTime };
	}

	function renderDayOrder() {
		const todayData = getTodayData();
		const todayDate = new Date(todayData.date + "T00:00:00");
		todayDateEl.textContent = formatHumanDate(todayDate);

		if (todayData.type === "working") {
			todayOrderEl.textContent = "Day " + todayData.dayOrder;
			todayOrderEl.classList.remove("is-holiday");
			todaySubtextEl.textContent = "Working day in the 6-day cycle.";
		} else {
			todayOrderEl.textContent = "⚠️ Holiday";
			todayOrderEl.classList.add("is-holiday");
			const nextWorkingDay = getNextWorkingDay(todayData.date);
			todaySubtextEl.textContent = nextWorkingDay
				? "No classes today. Next working day: " + new Date(nextWorkingDay.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long" })
				: "No classes today. Next working day is not available in calendar.";
		}
	}

	function renderTimetable() {
		const selectedData = getDateData(selectedDateIso);
		const subjects = selectedData.type === "working" ? timetable[selectedData.dayOrder] || [] : [];
		const isViewingToday = selectedDateIso === formatISODate(new Date());

		if (selectedData.type !== "working") {
			timetablePanel.classList.add("is-hidden");
			holidayMessage.hidden = false;
			holidayMessage.textContent = "No classes on " + formatDayMonth(selectedData.date);
			currentPeriodLabel.textContent = "Holiday";
			currentStatusBar.textContent = "📅 Holiday • No classes on " + formatDayMonth(selectedData.date);
			return;
		}

		timetablePanel.classList.remove("is-hidden");
		holidayMessage.hidden = true;

		periodGrid.innerHTML = subjects
			.map(function buildPeriodCard(subject, index) {
				const slot = periods[index];

				return [
					'<article class="period-card" data-period-id="' + slot.id + '">',
					'<p class="period-no">Period ' + (index + 1) + "</p>",
					'<p class="period-subject">' + subject + "</p>",
					'<p class="period-time">' + slot.start + " - " + slot.end + "</p>",
					"</article>"
				].join("");
			})
			.join("");

		if (isViewingToday) {
			updateUIStatus(subjects);
		} else {
			currentPeriodLabel.textContent = "Schedule for " + formatDayMonth(selectedData.date);
			currentStatusBar.textContent = "Viewing: " + formatDayMonth(selectedData.date) + " • Day " + selectedData.dayOrder;
		}
	}

	function updateUIStatus(subjects) {
		const periodState = getCurrentPeriod();
		const cards = periodGrid.querySelectorAll(".period-card");

		cards.forEach(function applyCardStatus(card, index) {
			const slot = periods[index];
			const periodEnd = toMinutes(slot.end);

			card.classList.remove("is-current", "is-completed");

			if (periodState.currentTime.totalMinutes > periodEnd) {
				card.classList.add("is-completed");
			}

			if (periodState.status === "current" && periodState.period && periodState.period.id === slot.id) {
				card.classList.remove("is-completed");
				card.classList.add("is-current");
			}
		});

		if (periodState.status === "current" && periodState.period) {
			const periodId = periodState.period.id;
			const label = "Now: " + subjects[periodId - 1] + " (Period " + periodId + ")";
			currentPeriodLabel.textContent = label;
			currentStatusBar.textContent = label;
			return;
		}

		if (periodState.status === "break") {
			currentPeriodLabel.textContent = "Break Time";
			currentStatusBar.textContent = "Break Time";
			return;
		}

		if (periodState.status === "not_started") {
			currentPeriodLabel.textContent = "Classes not started";
			currentStatusBar.textContent = "Classes not started";
			return;
		}

		currentPeriodLabel.textContent = "Classes over";
		currentStatusBar.textContent = "Classes Over";
	}

	function renderNextDays() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		nextDaysSlider.innerHTML = "";

		for (let offset = 0; offset < 7; offset += 1) {
			const cardDate = new Date(today);
			cardDate.setDate(today.getDate() + offset);

			const cardDateIso = formatISODate(cardDate);
			const entry = calendarData.find(function findDate(item) {
				return item.date === cardDateIso;
			});
			const cardType = entry ? entry.type : "holiday";
			const dayOrder = getDayOrder(cardDateIso);

			const card = document.createElement("article");
			card.className = "next-day-card";
			card.setAttribute("data-date", cardDateIso);
			if (offset === 0) {
				card.classList.add("is-today");
			}
			if (cardDateIso === selectedDateIso) {
				card.classList.add("is-selected");
			}
			if (cardType === "holiday") {
				card.classList.add("is-holiday");
			}

			card.innerHTML = [
				offset === 0
					? '<p class="next-day-tag is-today">Today</p>'
					: offset === 1
						? '<p class="next-day-tag is-tomorrow">Tomorrow</p>'
						: '<p class="next-day-tag">Upcoming</p>',
				'<p class="next-day-name">' + formatDayName(cardDate) + "</p>",
				'<p class="next-day-date">' + formatShortDate(cardDate) + "</p>",
				'<p class="next-day-order">' + (dayOrder ? "Day " + dayOrder : "Holiday") + "</p>"
			].join("");

			nextDaysSlider.appendChild(card);
		}
	}

	function renderDashboard() {
		const todayIso = formatISODate(new Date());
		if (!isDateInUpcomingWindow(selectedDateIso, todayIso)) {
			selectedDateIso = todayIso;
		}

		renderDayOrder();
		renderNextDays();
		renderTimetable();
		renderTasks();

		dashboardUser.textContent = "Logged in: " + userEmail + " (" + currentRole + ")";
		renderProfileCard();
	}

	function handleNextDaySelection(event) {
		const selectedCard = event.target.closest(".next-day-card[data-date]");
		if (!selectedCard) {
			return;
		}

		selectedDateIso = selectedCard.getAttribute("data-date");
		renderNextDays();
		renderTimetable();
	}

	function isDateInUpcomingWindow(targetIso, todayIso) {
		const todayDate = new Date(todayIso + "T00:00:00");
		for (let offset = 0; offset < 7; offset += 1) {
			const checkDate = new Date(todayDate);
			checkDate.setDate(todayDate.getDate() + offset);
			if (formatISODate(checkDate) === targetIso) {
				return true;
			}
		}
		return false;
	}

	function renderTasks() {
		const summary = getTaskSummary();
		taskSummary.textContent = "Tasks: " + summary.pending + " Pending | " + summary.completed + " Completed | " + summary.missed + " Missed";
		homeTaskSummary.textContent = taskSummary.textContent;
		completedTasksCount.textContent = String(summary.completed);

		if (tasks.length === 0) {
			taskList.innerHTML = '<p class="task-empty">No tasks yet. Add a new task to get started.</p>';
			return;
		}

		taskList.innerHTML = tasks
			.slice()
			.sort(function byDeadline(a, b) {
				return a.deadline.localeCompare(b.deadline);
			})
			.map(function mapTask(task) {
				const status = getTaskStatus(task);
				const statusClass = status.toLowerCase();
				const missedClass = status === "Missed" ? "is-missed-task" : "";
				const actions = buildTaskActions(task, status);

				return [
					'<article class="task-card ' + missedClass + '" data-task-id="' + task.id + '">',
					'<div class="task-content">',
					'<p class="task-title">' + escapeHtml(task.title) + "</p>",
					'<p class="task-meta"><span>Subject: ' + escapeHtml(task.subject) + '</span><span>Deadline: ' + formatHumanDate(new Date(task.deadline + "T00:00:00")) + "</span></p>",
					task.submittedFile ? '<p class="task-proof">Proof: ' + escapeHtml(task.submittedFile) + "</p>" : "",
					actions,
					"</div>",
					'<p class="task-status is-' + statusClass + '">' + status + "</p>",
					"</article>"
				].join("");
			})
			.join("");
	}

	function setupProfileSection() {
		themeToggle.checked = localStorage.getItem("themeMode") === "light";
		applyTheme(themeToggle.checked ? "light" : "dark");

		themeToggle.addEventListener("change", function toggleThemeMode() {
			const mode = themeToggle.checked ? "light" : "dark";
			localStorage.setItem("themeMode", mode);
			applyTheme(mode);
		});

		logoutBtn.addEventListener("click", handleDashboardLogout);
	}

	function renderProfileCard() {
		profileName.textContent = userName;
		profileEmail.textContent = userEmail;
		profileRole.textContent = currentRole;
	}

	async function handleDashboardLogout() {
		logoutBtn.disabled = true;
		profileMessage.textContent = "Signing out...";

		if (window.supabase && typeof window.supabase.createClient === "function") {
			const supabaseClient = window.supabase.createClient(
				"https://zusvmyxaqidypumehfsr.supabase.co",
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1c3ZteXhhcWlkeXB1bWVoZnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwODk1MjksImV4cCI6MjA4OTY2NTUyOX0.j2cgjwqn0Y5edp0MrYcfcXOQwBIr9bebz_KGv70KYdo"
			);
			await supabaseClient.auth.signOut();
		}

		localStorage.removeItem("userEmail");
		localStorage.removeItem("userName");
		localStorage.removeItem("role");
		window.location.href = "../index.html";
	}

	function applyTheme(mode) {
		document.body.classList.toggle("theme-light", mode === "light");
		themeToggle.setAttribute("aria-label", mode === "light" ? "Switch to dark mode" : "Switch to light mode");
		themeToggle.setAttribute("title", mode === "light" ? "Light theme active (Sun)" : "Dark theme active (Moon)");
	}

	function getTaskSummary() {
		return tasks.reduce(
			function summarize(accumulator, task) {
				const status = getTaskStatus(task);
				if (status === "Completed") {
					accumulator.completed += 1;
				} else if (status === "Missed") {
					accumulator.missed += 1;
				} else {
					accumulator.pending += 1;
				}
				return accumulator;
			},
			{ pending: 0, completed: 0, missed: 0 }
		);
	}

	function getTaskStatus(task) {
		if (task.completed) {
			return "Completed";
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const deadlinePlusTwo = new Date(task.deadline + "T00:00:00");
		deadlinePlusTwo.setDate(deadlinePlusTwo.getDate() + 2);

		if (today > deadlinePlusTwo) {
			return "Missed";
		}

		return "Pending";
	}

	function markComplete(taskId) {
		const task = tasks.find(function matchTask(item) {
			return item.id === taskId;
		});

		if (!task) {
			return;
		}

		task.completed = true;
		saveTasks();
		renderTasks();
	}

	function uploadProof(taskId, fileName) {
		const task = tasks.find(function matchTask(item) {
			return item.id === taskId;
		});

		if (!task) {
			return;
		}

		task.submittedFile = fileName;
		task.completed = true;
		saveTasks();
		renderTasks();
	}

	function addTask(event) {
		event.preventDefault();

		if (!canAddTasks()) {
			return;
		}

		const title = taskTitleInput.value.trim();
		const subject = taskSubjectInput.value.trim().toUpperCase();
		const deadline = taskDeadlineInput.value;
		const requiresProof = taskProofInput.checked;

		if (!title || !subject || !deadline) {
			return;
		}

		const newTask = {
			id: getNextTaskId(),
			title,
			subject,
			deadline,
			requiresProof,
			completed: false,
			submittedFile: null
		};

		tasks.push(newTask);
		saveTasks();
		taskForm.reset();
		renderTasks();
	}

	function handleTaskListClick(event) {
		const actionButton = event.target.closest("[data-action]");
		if (!actionButton) {
			return;
		}

		const taskId = Number(actionButton.getAttribute("data-task-id"));
		const action = actionButton.getAttribute("data-action");

		if (action === "complete") {
			if (canMarkTasks()) {
				markComplete(taskId);
			}
			return;
		}

		if (action === "choose-proof") {
			if (!canMarkTasks()) {
				return;
			}
			const fileInput = document.getElementById("proofInput-" + taskId);
			if (fileInput) {
				fileInput.click();
			}
			return;
		}

		if (action === "delete") {
			if (!hasFullControl()) {
				return;
			}
			tasks = tasks.filter(function removeTask(item) {
				return item.id !== taskId;
			});
			saveTasks();
			renderTasks();
			return;
		}

		if (action === "edit") {
			if (!hasFullControl()) {
				return;
			}
			editTask(taskId);
		}
	}

	function handleTaskProofChange(event) {
		const input = event.target;
		if (!input.matches("input[type='file'][data-task-id]")) {
			return;
		}

		const taskId = Number(input.getAttribute("data-task-id"));
		if (!input.files || input.files.length === 0) {
			return;
		}

		uploadProof(taskId, input.files[0].name);
	}

	function editTask(taskId) {
		const task = tasks.find(function matchTask(item) {
			return item.id === taskId;
		});
		if (!task) {
			return;
		}

		const title = window.prompt("Edit task title", task.title);
		if (!title) {
			return;
		}

		const subject = window.prompt("Edit task subject", task.subject);
		if (!subject) {
			return;
		}

		const deadline = window.prompt("Edit deadline (YYYY-MM-DD)", task.deadline);
		if (!deadline || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
			return;
		}

		task.title = title.trim();
		task.subject = subject.trim().toUpperCase();
		task.deadline = deadline;
		saveTasks();
		renderTasks();
	}

	function buildTaskActions(task, status) {
		const canMark = canMarkTasks();
		const isDone = status === "Completed";
		const actions = [];

		actions.push('<div class="task-actions">');

		if (!isDone && canMark) {
			if (task.requiresProof) {
				actions.push('<input id="proofInput-' + task.id + '" data-task-id="' + task.id + '" type="file" hidden />');
				actions.push('<button type="button" class="task-action-button" data-action="choose-proof" data-task-id="' + task.id + '">Upload Proof</button>');
			} else {
				actions.push('<button type="button" class="task-action-button" data-action="complete" data-task-id="' + task.id + '">Mark as Complete</button>');
			}
		}

		if (hasFullControl()) {
			actions.push('<button type="button" class="task-action-button" data-action="edit" data-task-id="' + task.id + '">Edit</button>');
			actions.push('<button type="button" class="task-action-button is-danger" data-action="delete" data-task-id="' + task.id + '">Delete</button>');
		}

		actions.push("</div>");
		return actions.join("");
	}

	function configureTaskPermissions() {
		if (canAddTasks()) {
			taskForm.classList.remove("is-hidden");
			tasksRoleNote.textContent = currentRole + " access";
		} else {
			taskForm.classList.add("is-hidden");
			tasksRoleNote.textContent = "student access";
		}
	}

	function canMarkTasks() {
		return ["student", "cr", "class_incharge", "tech_support"].includes(currentRole);
	}

	function canAddTasks() {
		return ["cr", "class_incharge", "tech_support"].includes(currentRole);
	}

	function hasFullControl() {
		return ["class_incharge", "tech_support"].includes(currentRole);
	}

	function getNextTaskId() {
		const maxId = tasks.reduce(function findMax(currentMax, task) {
			return task.id > currentMax ? task.id : currentMax;
		}, 0);
		return maxId + 1;
	}

	function saveTasks() {
		localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
	}

	function loadTasks() {
		const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
		if (storedTasks) {
			try {
				const parsed = JSON.parse(storedTasks);
				if (Array.isArray(parsed)) {
					return parsed;
				}
			} catch (error) {
				// Falls back to seed data if storage is malformed.
			}
		}

		const seedTasks = [
			{
				id: 1,
				title: "Java Assignment 1",
				subject: "JAVA",
				deadline: "2026-03-25",
				requiresProof: true,
				completed: false,
				submittedFile: null
			}
		];

		localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(seedTasks));
		return seedTasks;
	}

	function escapeHtml(value) {
		return String(value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function toMinutes(time24Hour) {
		const parts = time24Hour.split(":");
		const hours = Number(parts[0]);
		const minutes = Number(parts[1]);
		return hours * 60 + minutes;
	}

	function formatISODate(date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return year + "-" + month + "-" + day;
	}

	function formatHumanDate(date) {
		return date.toLocaleDateString("en-GB", {
			day: "numeric",
			month: "long",
			year: "numeric"
		});
	}

	function formatDayName(date) {
		return date.toLocaleDateString("en-GB", { weekday: "short" });
	}

	function formatShortDate(date) {
		return date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short"
		});
	}

	function formatDayMonth(dateIso) {
		return new Date(dateIso + "T00:00:00").toLocaleDateString("en-GB", {
			day: "numeric",
			month: "long"
		});
	}

	function getNextWorkingDay(fromIsoDate) {
		const nextWorking = calendarData.find(function findNext(entry) {
			return entry.type === "working" && entry.date > fromIsoDate;
		});
		return nextWorking || null;
	}
})();

(function initDashboardNavigation() {
	const isDashboardPage = document.body && document.body.classList.contains("dashboard-page");
	if (!isDashboardPage) {
		return;
	}

	const pageSections = Array.from(document.querySelectorAll(".spa-page"));
	const navItems = Array.from(document.querySelectorAll(".spa-nav-link[data-page], .quick-action[data-page], .bottom-nav-link[data-page]"));

	if (pageSections.length === 0 || navItems.length === 0) {
		return;
	}

	navItems.forEach(function bindNav(item) {
		item.addEventListener("click", function handleSpaNav(event) {
			event.preventDefault();
			const pageId = item.getAttribute("data-page");
			showPage(pageId);
			setActiveNav(pageId);
		});
	});

	const initialPage = "homePage";
	showPage(initialPage);
	setActiveNav(initialPage);

	window.showPage = showPage;
	window.setActiveNav = setActiveNav;

	function showPage(pageId) {
		pageSections.forEach(function hideSection(section) {
			section.classList.add("hidden");
		});

		const activeSection = document.getElementById(pageId);
		if (activeSection) {
			activeSection.classList.remove("hidden");
		}
	}

	function setActiveNav(pageId) {
		navItems.forEach(function resetState(item) {
			item.classList.remove("is-active");
			if (item.getAttribute("data-page") === pageId) {
				item.classList.add("is-active");
			}
		});
	}
})();
