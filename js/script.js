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
	const taskAddButton = document.getElementById("taskAddButton");
	const taskAssignModal = document.getElementById("taskAssignModal");
	const taskModalClose = document.getElementById("taskModalClose");
	const taskAssignForm = document.getElementById("taskAssignForm");
	const assignTaskTitleInput = document.getElementById("assignTaskTitle");
	const assignTaskSubjectInput = document.getElementById("assignTaskSubject");
	const assignTaskDeadlineInput = document.getElementById("assignTaskDeadline");
	const assignTaskProofInput = document.getElementById("assignTaskProof");
	const studentSearchInput = document.getElementById("studentSearch");
	const selectAllStudentsInput = document.getElementById("selectAllStudents");
	const studentList = document.getElementById("studentList");
	const taskStatusModal = document.getElementById("taskStatusModal");
	const taskStatusClose = document.getElementById("taskStatusClose");
	const markAllCompleteBtn = document.getElementById("markAllCompleteBtn");
	const taskStatusTableBody = document.getElementById("taskStatusTableBody");
	const proofPreviewModal = document.getElementById("proofPreviewModal");
	const proofPreviewClose = document.getElementById("proofPreviewClose");
	const proofPreviewContent = document.getElementById("proofPreviewContent");
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
	const notificationBtn = document.getElementById("notificationBtn");
	const notificationBoard = document.getElementById("notificationBoard");
	const notificationClose = document.getElementById("notificationClose");
	const announcementsPanel = document.getElementById("announcementsPanel");

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
	const SUPABASE_URL = "https://zusvmyxaqidypumehfsr.supabase.co";
	const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1c3ZteXhhcWlkeXB1bWVoZnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwODk1MjksImV4cCI6MjA4OTY2NTUyOX0.j2cgjwqn0Y5edp0MrYcfcXOQwBIr9bebz_KGv70KYdo";
	const TASK_PROOF_BUCKET = "task-proofs";
	const ALLOWED_PROOF_TYPES = ["image/png", "image/jpeg", "application/pdf"];
	const ASSIGNMENT_ROLL_FIELDS = ["assigned_student_roll", "roll_number", "student_roll", "roll"];
	const HYBRID_STUDENT_ROLLS = ["24H310", "24H319"];
	const supabaseClient = window.supabase && typeof window.supabase.createClient === "function"
		? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
		: null;
	const currentRole = String(localStorage.getItem("role") || "student").trim().toLowerCase();
	const currentRoleKey = currentRole.replace(/\s+/g, "_");
	const userEmail = localStorage.getItem("userEmail") || "Guest";
	const userName = localStorage.getItem("userName") || userEmail.split("@")[0];
	const studentRolls = buildStudentRolls();
	const currentStudentRoll = resolveStudentRoll(userEmail);
	let tasks = [];
	let selectedDateIso = formatISODate(new Date());
	let activeStatusTaskId = null;
	let currentAuthUserId = null;
	let activeAssignmentRollField = null;

	configureTaskPermissions();
	setupProfileSection();
	setupNotificationBoard();
	setupTaskAssignmentModal();
	setupTaskStatusModal();
	taskList.addEventListener("click", handleTaskListClick);
	taskList.addEventListener("change", handleTaskProofChange);
	nextDaysSlider.addEventListener("click", handleNextDaySelection);
	void initializeTaskSystem();

	renderDashboard();
	window.setInterval(renderDashboard, 30000);
	window.setInterval(function refreshTasksBackground() {
		if (!supabaseClient) {
			return;
		}
		void refreshTasksFromSupabase();
	}, 45000);

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

	async function initializeTaskSystem() {
		tasks = loadTasks(!supabaseClient);
		renderTasks();

		if (!supabaseClient) {
			return;
		}

		try {
			const authResult = await supabaseClient.auth.getUser();
			if (authResult.data && authResult.data.user) {
				currentAuthUserId = authResult.data.user.id;
			}

			await supabaseClient
				.from("users")
				.upsert([{ email: userEmail, name: userName, role: currentRole }], { onConflict: "email" });
		} catch (error) {
			console.warn("User sync skipped:", error);
		}

		await refreshTasksFromSupabase();
	}

	async function refreshTasksFromSupabase() {
		if (!supabaseClient) {
			return;
		}

		try {
			const taskQuery = supabaseClient
				.from("tasks")
				.select("*")
				.order("deadline", { ascending: true });

			const assignmentQuery = supabaseClient.from("task_assignments").select("*");

			const [taskResult, assignmentResult] = await Promise.all([taskQuery, assignmentQuery]);

			if (taskResult.error) {
				throw taskResult.error;
			}
			if (assignmentResult.error) {
				throw assignmentResult.error;
			}

			const assignmentRows = (assignmentResult.data || []).filter(function filterRowsByRole(row) {
				if (canAddTasks()) {
					return true;
				}

				const rowRoll = getAssignmentRollFromRow(row);
				return Boolean(currentStudentRoll) && rowRoll === String(currentStudentRoll).toUpperCase();
			});

			const assignmentsByTaskId = assignmentRows.reduce(function groupAssignments(accumulator, row) {
				const taskId = Number(readField(row, ["task_id", "taskId", "task"], 0));
				if (!taskId) {
					return accumulator;
				}

				if (!accumulator[taskId]) {
					accumulator[taskId] = [];
				}

				const rollField = getExistingFieldName(row, ASSIGNMENT_ROLL_FIELDS);
				if (rollField) {
					activeAssignmentRollField = rollField;
				}

				accumulator[taskId].push({
					rollNumber: getAssignmentRollFromRow(row),
					status: normalizeAssignmentStatus(readField(row, ["status"], "pending")),
					proofName: readField(row, ["proof_name", "proof_filename", "proof_file_name"], null),
					proofPath: readField(row, ["proof_url", "proof_path"], null),
					proofDataUrl: null
				});
				return accumulator;
			}, {});

			tasks = (taskResult.data || []).map(function mapTaskRow(row) {
				const taskId = Number(readField(row, ["id", "task_id"], getNextTaskId()));
				return normalizeTask({
					id: taskId,
					title: readField(row, ["title", "task_title"], "Untitled Task"),
					subject: readField(row, ["subject"], "GENERAL"),
					deadline: String(readField(row, ["deadline", "due_date"], formatISODate(new Date()))).slice(0, 10),
					requiresProof: Boolean(readField(row, ["requires_proof", "requiresProof"], false)),
					assignments: assignmentsByTaskId[taskId] || []
				});
			});

			saveTasks();
			renderTasks();
		} catch (error) {
			console.error("Task sync failed:", error);
		}
	}

	function getAssignmentRollFromRow(row) {
		return String(readField(row, ASSIGNMENT_ROLL_FIELDS, "")).toUpperCase();
	}

	function getExistingFieldName(source, keys) {
		for (let i = 0; i < keys.length; i += 1) {
			const key = keys[i];
			if (source && Object.prototype.hasOwnProperty.call(source, key) && source[key] !== null && source[key] !== undefined) {
				return key;
			}
		}
		return null;
	}

	function readField(source, keys, fallbackValue) {
		for (let i = 0; i < keys.length; i += 1) {
			const key = keys[i];
			if (source && Object.prototype.hasOwnProperty.call(source, key) && source[key] !== null && source[key] !== undefined) {
				return source[key];
			}
		}
		return fallbackValue;
	}

	function normalizeAssignmentStatus(statusValue) {
		const normalized = String(statusValue || "pending").trim().toLowerCase();
		if (["completed", "pending", "missed"].includes(normalized)) {
			return normalized;
		}
		if (normalized === "approved" || normalized === "done") {
			return "completed";
		}
		if (normalized === "rejected") {
			return "pending";
		}
		return "pending";
	}

	function renderTasks() {
		tasks = tasks.map(normalizeTask);
		updateMissedStatuses(tasks);

		const visibleTasks = getVisibleTasks();
		const summary = getTaskSummary(visibleTasks);
		taskSummary.textContent = "Tasks: " + summary.pending + " Pending | " + summary.completed + " Completed | " + summary.missed + " Missed";
		homeTaskSummary.textContent = taskSummary.textContent;
		completedTasksCount.textContent = String(summary.completed);

		if (visibleTasks.length === 0) {
			taskList.innerHTML = canAddTasks()
				? '<p class="task-empty">No tasks yet. Use Add Task to assign students.</p>'
				: '<p class="task-empty">No tasks assigned to your roll number right now.</p>';
			return;
		}

		taskList.innerHTML = visibleTasks
			.slice()
			.sort(function byDeadline(a, b) {
				return a.deadline.localeCompare(b.deadline);
			})
			.map(function mapTask(task) {
				const assignment = getAssignmentForRoll(task, currentStudentRoll);
				const status = canAddTasks() ? getTaskLevelStatus(task) : getTaskStatus(task, assignment);
				const statusClass = status.toLowerCase();
				const missedClass = status === "Missed" ? "is-missed-task" : "";
				const actions = buildTaskActions(task, status, assignment);
				const proofText = assignment && assignment.proofName ? '<p class="task-proof">Proof: ' + escapeHtml(assignment.proofName) + '</p>' : "";
				const assignmentMeta = canAddTasks() ? buildAssignmentMeta(task) : "";

				return [
					'<article class="task-card ' + missedClass + '" data-task-id="' + task.id + '">',
					'<div class="task-content">',
					'<p class="task-title">' + escapeHtml(task.title) + "</p>",
					'<p class="task-meta"><span>Subject: ' + escapeHtml(task.subject) + '</span><span>Deadline: ' + formatHumanDate(new Date(task.deadline + "T00:00:00")) + "</span></p>",
					assignmentMeta,
					proofText,
					actions,
					"</div>",
					'<p class="task-status is-' + statusClass + '">' + status + "</p>",
					"</article>"
				].join("");
			})
			.join("");

		saveTasks();
	}

	function setupTaskAssignmentModal() {
		if (
			!taskAssignModal ||
			!taskModalClose ||
			!taskAssignForm ||
			!assignTaskTitleInput ||
			!assignTaskSubjectInput ||
			!assignTaskDeadlineInput ||
			!assignTaskProofInput ||
			!studentSearchInput ||
			!selectAllStudentsInput ||
			!studentList
		) {
			if (canAddTasks()) {
				tasksRoleNote.textContent = currentRole + " access (task modal missing in current page build)";
			}
			return;
		}

		closeModal(taskAssignModal);
		if (taskStatusModal) {
			closeModal(taskStatusModal);
		}
		if (proofPreviewModal) {
			closeModal(proofPreviewModal);
		}
		renderStudentList("");

		taskAddButton.addEventListener("click", function openAssignModal() {
			if (!canAddTasks()) {
				window.alert("Only CR / class incharge / tech support can assign tasks.");
				return;
			}

			openModal(taskAssignModal);
			assignTaskTitleInput.focus();
		});

		taskForm.addEventListener("click", function openAssignFromForm(event) {
			const trigger = event.target.closest("#taskAddButton");
			if (!trigger || !canAddTasks()) {
				return;
			}
			openModal(taskAssignModal);
			assignTaskTitleInput.focus();
		});

		taskModalClose.addEventListener("click", function closeAssignModal() {
			closeModal(taskAssignModal);
		});

		taskAssignModal.addEventListener("click", function closeByOverlay(event) {
			if (event.target === taskAssignModal) {
				closeModal(taskAssignModal);
			}
		});

		taskAssignForm.addEventListener("submit", handleAssignTaskSubmit);

		studentSearchInput.addEventListener("input", function handleStudentSearch() {
			renderStudentList(studentSearchInput.value.trim());
		});

		selectAllStudentsInput.addEventListener("change", function toggleSelectAll() {
			const visibleChecks = studentList.querySelectorAll(".student-select-item");
			visibleChecks.forEach(function setChecked(checkbox) {
				checkbox.checked = selectAllStudentsInput.checked;
			});
		});

		document.addEventListener("keydown", function closeAssignOnEscape(event) {
			if (event.key === "Escape") {
				closeModal(taskAssignModal);
			}
		});
	}

	function setupTaskStatusModal() {
		if (!taskStatusModal || !taskStatusClose || !markAllCompleteBtn || !taskStatusTableBody || !proofPreviewModal || !proofPreviewClose || !proofPreviewContent) {
			return;
		}

		taskStatusClose.addEventListener("click", function closeStatus() {
			closeModal(taskStatusModal);
		});

		taskStatusModal.addEventListener("click", function closeStatusByOverlay(event) {
			if (event.target === taskStatusModal) {
				closeModal(taskStatusModal);
			}
		});

		proofPreviewClose.addEventListener("click", function closeProofPreview() {
			closeModal(proofPreviewModal);
		});

		proofPreviewModal.addEventListener("click", function closeProofByOverlay(event) {
			if (event.target === proofPreviewModal) {
				closeModal(proofPreviewModal);
			}
		});

		markAllCompleteBtn.addEventListener("click", function markEveryoneComplete() {
			if (!activeStatusTaskId) {
				return;
			}
			void setAllAssignmentsStatus(activeStatusTaskId, "completed");
		});

		taskStatusTableBody.addEventListener("click", function handleStatusActions(event) {
			const actionButton = event.target.closest("[data-status-action]");
			if (!actionButton) {
				return;
			}

			if (!activeStatusTaskId) {
				return;
			}

			const action = actionButton.getAttribute("data-status-action");
			const roll = actionButton.getAttribute("data-roll");

			if (action === "view-proof") {
				void openProofPreview(activeStatusTaskId, roll);
				return;
			}

			if (action === "set-pending") {
				void setAssignmentStatus(activeStatusTaskId, roll, "pending");
				return;
			}

			if (action === "approve") {
				void setAssignmentStatus(activeStatusTaskId, roll, "completed");
				return;
			}

			if (action === "reject") {
				void setAssignmentStatus(activeStatusTaskId, roll, "pending");
			}
		});

		document.addEventListener("keydown", function closeStatusOnEscape(event) {
			if (event.key !== "Escape") {
				return;
			}
			closeModal(taskStatusModal);
			closeModal(proofPreviewModal);
		});
	}

	function openModal(modalElement) {
		if (!modalElement) {
			return;
		}
		modalElement.removeAttribute("hidden");
	}

	function closeModal(modalElement) {
		if (!modalElement) {
			return;
		}
		modalElement.setAttribute("hidden", "");
	}

	function renderStudentList(filterText) {
		const normalizedFilter = String(filterText || "").trim().toUpperCase();
		const filteredRolls = studentRolls.filter(function matchesRoll(roll) {
			return !normalizedFilter || roll.includes(normalizedFilter);
		});

		if (filteredRolls.length === 0) {
			studentList.innerHTML = '<p class="task-empty">No students found for this search.</p>';
			selectAllStudentsInput.checked = false;
			selectAllStudentsInput.indeterminate = false;
			return;
		}

		studentList.innerHTML = filteredRolls
			.map(function buildStudentRow(roll) {
				return [
					'<label class="student-row">',
					'<input class="student-select-item" type="checkbox" value="' + roll + '" />',
					"<span>" + roll + "</span>",
					"</label>"
				].join("");
			})
			.join("");

		studentList.querySelectorAll(".student-select-item").forEach(function bindStudentCheck(item) {
			item.addEventListener("change", syncSelectAllState);
		});

		syncSelectAllState();
	}

	function syncSelectAllState() {
		const visibleChecks = Array.from(studentList.querySelectorAll(".student-select-item"));
		if (visibleChecks.length === 0) {
			selectAllStudentsInput.checked = false;
			selectAllStudentsInput.indeterminate = false;
			return;
		}

		const checkedCount = visibleChecks.filter(function isChecked(checkbox) {
			return checkbox.checked;
		}).length;

		selectAllStudentsInput.checked = checkedCount > 0 && checkedCount === visibleChecks.length;
		selectAllStudentsInput.indeterminate = checkedCount > 0 && checkedCount < visibleChecks.length;
	}

	async function handleAssignTaskSubmit(event) {
		event.preventDefault();

		if (!canAddTasks()) {
			return;
		}

		const title = assignTaskTitleInput.value.trim();
		const subject = assignTaskSubjectInput.value.trim().toUpperCase();
		const deadline = assignTaskDeadlineInput.value;
		const requiresProof = assignTaskProofInput.checked;
		const selectedStudents = Array.from(studentList.querySelectorAll(".student-select-item:checked")).map(function mapRoll(item) {
			return item.value;
		});

		if (!title || !subject || !deadline || selectedStudents.length === 0) {
			window.alert("Please fill all fields and select at least one student.");
			return;
		}

		const newTask = {
			id: getNextTaskId(),
			title: title,
			subject: subject,
			deadline: deadline,
			requiresProof: requiresProof,
			assignments: selectedStudents.map(function mapAssignment(roll) {
				return {
					rollNumber: roll,
					status: "pending",
					proofName: null,
					proofDataUrl: null
				};
			})
		};

		let createdTaskId = newTask.id;
		if (supabaseClient) {
			const remoteTaskId = await createTaskInSupabase(newTask);
			if (remoteTaskId) {
				createdTaskId = remoteTaskId;
				await refreshTasksFromSupabase();
			} else {
				tasks.push(newTask);
				saveTasks();
			}
		} else {
			tasks.push(newTask);
			saveTasks();
		}

		taskAssignForm.reset();
		renderStudentList("");
		closeModal(taskAssignModal);
		renderTasks();
		openStatusModal(createdTaskId);
	}

	async function createTaskInSupabase(taskPayload) {
		if (!supabaseClient) {
			return null;
		}

		try {
			let taskInsert = null;
			const taskInsertPayloads = [
				{
					title: taskPayload.title,
					subject: taskPayload.subject,
					deadline: taskPayload.deadline,
					requires_proof: Boolean(taskPayload.requiresProof)
				},
				{
					title: taskPayload.title,
					subject: taskPayload.subject,
					due_date: taskPayload.deadline,
					requires_proof: Boolean(taskPayload.requiresProof)
				},
				{
					title: taskPayload.title,
					subject: taskPayload.subject,
					deadline: taskPayload.deadline,
					requiresProof: Boolean(taskPayload.requiresProof)
				}
			];

			for (let i = 0; i < taskInsertPayloads.length; i += 1) {
				taskInsert = await supabaseClient
					.from("tasks")
					.insert([taskInsertPayloads[i]])
					.select("id")
					.single();

				if (!taskInsert.error && taskInsert.data) {
					break;
				}
			}

			if (!taskInsert || taskInsert.error || !taskInsert.data) {
				throw (taskInsert && taskInsert.error) || new Error("Task insertion failed.");
			}

			const taskId = Number(taskInsert.data.id);
			const assignmentInsert = await insertAssignmentsWithFallback(taskId, taskPayload.assignments);
			if (assignmentInsert && assignmentInsert.error) {
				throw assignmentInsert.error;
			}

			return taskId;
		} catch (error) {
			console.error("Supabase task create failed:", error);
			window.alert("Task saved locally because server sync failed. " + extractErrorMessage(error));
			return null;
		}
	}

	function extractErrorMessage(error) {
		if (!error) {
			return "Unknown database error.";
		}

		if (typeof error === "string") {
			return error;
		}

		const code = error.code ? "[" + error.code + "] " : "";
		const message = error.message || "Database request failed.";
		const hint = error.hint ? " Hint: " + error.hint : "";
		return code + message + hint;
	}

	async function insertAssignmentsWithFallback(taskId, assignmentsList) {
		if (!supabaseClient) {
			return { error: { message: "Supabase client unavailable." } };
		}

		const rollKeyCandidates = ASSIGNMENT_ROLL_FIELDS.slice();
		let lastResult = null;

		for (let i = 0; i < rollKeyCandidates.length; i += 1) {
			const rollKey = rollKeyCandidates[i];
			const rowTemplate = {
				task_id: taskId,
				status: "pending",
				proof_url: null
			};

			rowTemplate[rollKey] = "";
			const rows = assignmentsList.map(function mapAssignmentRow(assignment) {
				const row = Object.assign({}, rowTemplate);
				row[rollKey] = assignment.rollNumber;
				return row;
			});

			let payload = rows;
			for (let attempt = 0; attempt < 4; attempt += 1) {
				lastResult = await supabaseClient
					.from("task_assignments")
					.insert(payload);

				if (!lastResult.error) {
					activeAssignmentRollField = rollKey;
					return lastResult;
				}

				const missingColumn = parseMissingColumnName(lastResult.error);
				if (!missingColumn) {
					break;
				}

				if (!Object.prototype.hasOwnProperty.call(payload[0] || {}, missingColumn)) {
					break;
				}

				payload = payload.map(function stripMissingColumn(row) {
					const nextRow = Object.assign({}, row);
					delete nextRow[missingColumn];
					return nextRow;
				});
			}
		}

		return lastResult || { error: { message: "Assignment insertion failed." } };
	}

	function getVisibleTasks() {
		if (canAddTasks()) {
			return tasks.slice();
		}

		if (!currentStudentRoll) {
			return [];
		}

		return tasks.filter(function isAssignedTask(task) {
			return Boolean(getAssignmentForRoll(task, currentStudentRoll));
		});
	}

	function getTaskSummary(visibleTasks) {
		return visibleTasks.reduce(
			function summarize(accumulator, task) {
				const assignment = getAssignmentForRoll(task, currentStudentRoll);
				const status = canAddTasks() ? getTaskLevelStatus(task) : getTaskStatus(task, assignment);
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

	function getTaskStatus(task, assignment) {
		if (!assignment) {
			return "Pending";
		}

		if (assignment.status === "completed") {
			return "Completed";
		}

		if (assignment.status === "missed") {
			return "Missed";
		}

		return isTaskDeadlineMissed(task.deadline) ? "Missed" : "Pending";
	}

	function getTaskLevelStatus(task) {
		const statuses = task.assignments.map(function mapStatus(assignment) {
			return getTaskStatus(task, assignment);
		});

		if (statuses.length === 0) {
			return "Pending";
		}

		if (statuses.every(function isDone(status) { return status === "Completed"; })) {
			return "Completed";
		}

		if (statuses.every(function isMissed(status) { return status === "Missed"; })) {
			return "Missed";
		}

		return "Pending";
	}

	function buildAssignmentMeta(task) {
		const stats = getAssignmentStats(task);
		return [
			'<p class="task-assignment-badges">',
			'<span class="task-badge task-badge-assigned">Assigned: ' + stats.total + "</span>",
			'<span class="task-badge task-badge-completed">Completed: ' + stats.completed + "/" + stats.total + "</span>",
			"</p>"
		].join("");
	}

	function getAssignmentStats(task) {
		const total = task.assignments.length;
		const completed = task.assignments.filter(function isCompleted(assignment) {
			return getTaskStatus(task, assignment) === "Completed";
		}).length;

		return { total: total, completed: completed };
	}

	function isTaskDeadlineMissed(deadlineIso) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const deadlinePlusTwo = new Date(deadlineIso + "T00:00:00");
		deadlinePlusTwo.setDate(deadlinePlusTwo.getDate() + 2);
		return today > deadlinePlusTwo;
	}

	function getAssignmentForRoll(task, rollNumber) {
		if (!rollNumber || !task || !Array.isArray(task.assignments)) {
			return null;
		}

		return task.assignments.find(function findAssignment(assignment) {
			return String(assignment.rollNumber).toUpperCase() === String(rollNumber).toUpperCase();
		}) || null;
	}

	function updateMissedStatuses(taskList) {
		taskList.forEach(function updateTask(task) {
			task.assignments.forEach(function updateAssignment(assignment) {
				if (assignment.status === "completed") {
					return;
				}

				assignment.status = isTaskDeadlineMissed(task.deadline) ? "missed" : "pending";
			});
		});
	}

	function normalizeTask(rawTask) {
		const normalizedTask = {
			id: Number(rawTask.id) || getNextTaskId(),
			title: String(rawTask.title || "Untitled Task"),
			subject: String(rawTask.subject || "GENERAL").toUpperCase(),
			deadline: String(rawTask.deadline || formatISODate(new Date())),
			requiresProof: Boolean(rawTask.requiresProof),
			assignments: []
		};

		if (Array.isArray(rawTask.assignments) && rawTask.assignments.length > 0) {
			normalizedTask.assignments = rawTask.assignments.map(function normalizeAssignment(assignment) {
				return {
					rollNumber: String(assignment.rollNumber || "").toUpperCase(),
					status: ["pending", "completed", "missed"].includes(assignment.status) ? assignment.status : "pending",
					proofName: assignment.proofName || null,
					proofPath: assignment.proofPath || null,
					proofDataUrl: assignment.proofDataUrl || null
				};
			}).filter(function hasRoll(assignment) {
				return Boolean(assignment.rollNumber);
			});
		} else if (Array.isArray(rawTask.assignedStudents) && rawTask.assignedStudents.length > 0) {
			normalizedTask.assignments = rawTask.assignedStudents.map(function mapStudent(roll) {
				return {
					rollNumber: String(roll).toUpperCase(),
					status: "pending",
					proofName: null,
					proofPath: null,
					proofDataUrl: null
				};
			});
		} else {
			normalizedTask.assignments = studentRolls.map(function mapAllStudents(roll) {
				return {
					rollNumber: roll,
					status: rawTask.completed ? "completed" : "pending",
					proofName: rawTask.submittedFile || null,
					proofPath: null,
					proofDataUrl: null
				};
			});
		}

		return normalizedTask;
	}

	async function markComplete(taskId) {
		const task = tasks.find(function findTask(item) {
			return item.id === taskId;
		});
		if (!task) {
			return;
		}

		const assignment = getAssignmentForRoll(task, currentStudentRoll);
		if (!assignment) {
			return;
		}

		if (supabaseClient) {
			const updated = await updateAssignmentRow(taskId, assignment.rollNumber, {
				status: "completed"
			});
			if (!updated) {
				return;
			}
			await refreshTasksFromSupabase();
			return;
		}

		assignment.status = "completed";
		saveTasks();
		renderTasks();
	}

	async function uploadProof(taskId, file) {
		const task = tasks.find(function findTask(item) {
			return item.id === taskId;
		});
		if (!task) {
			return;
		}

		const assignment = getAssignmentForRoll(task, currentStudentRoll);
		if (!assignment) {
			return;
		}

		if (ALLOWED_PROOF_TYPES.indexOf(file.type) === -1) {
			window.alert("Only PNG, JPG, and PDF files are allowed.");
			return;
		}

		if (supabaseClient) {
			const ownerKey = sanitizeStorageName(currentAuthUserId || userEmail || assignment.rollNumber || "student");
			const filePath = String(taskId) + "/" + ownerKey + "/" + sanitizeStorageName(file.name);

			const uploadResult = await supabaseClient.storage
				.from(TASK_PROOF_BUCKET)
				.upload(filePath, file, { upsert: true, contentType: file.type });

			if (uploadResult.error) {
				console.error("Proof upload failed:", uploadResult.error);
				window.alert("Proof upload failed. Please verify storage bucket permissions.");
				return;
			}

			const updated = await updateAssignmentRow(taskId, assignment.rollNumber, {
				status: "completed",
				proof_url: filePath,
				proof_name: file.name
			});
			if (!updated) {
				return;
			}

			await refreshTasksFromSupabase();
			if (activeStatusTaskId === taskId) {
				const activeTask = tasks.find(function findActiveTask(item) {
					return item.id === taskId;
				});
				if (activeTask) {
					renderStatusTable(activeTask);
				}
			}
			return;
		}

		const applyProofData = function applyProof(dataUrl) {
			assignment.proofName = file.name;
			assignment.proofDataUrl = dataUrl;
			assignment.proofPath = null;
			assignment.status = "completed";
			saveTasks();
			renderTasks();
			if (activeStatusTaskId === taskId) {
				renderStatusTable(task);
			}
		};

		if (typeof FileReader === "undefined") {
			applyProofData(null);
			return;
		}

		const reader = new FileReader();
		reader.onload = function onLoad() {
			applyProofData(String(reader.result || ""));
		};
		reader.onerror = function onError() {
			applyProofData(null);
		};
		reader.readAsDataURL(file);
	}

	function openStatusModal(taskId) {
		if (!taskStatusModal || !taskStatusTableBody) {
			return;
		}
		activeStatusTaskId = taskId;
		const task = tasks.find(function findTask(item) {
			return item.id === taskId;
		});
		if (!task) {
			return;
		}

		renderStatusTable(task);
		openModal(taskStatusModal);
	}

	function renderStatusTable(task) {
		if (!taskStatusTableBody) {
			return;
		}
		taskStatusTableBody.innerHTML = task.assignments
			.slice()
			.sort(function byRoll(a, b) {
				return a.rollNumber.localeCompare(b.rollNumber);
			})
			.map(function mapStatusRow(assignment) {
				const status = getTaskStatus(task, assignment);
				const statusClass = status.toLowerCase();
				const proofButton = (assignment.proofName || assignment.proofPath)
					? '<button type="button" class="task-action-button" data-status-action="view-proof" data-roll="' + assignment.rollNumber + '">View Proof</button>'
					: "-";

				return [
					"<tr>",
					"<td>" + escapeHtml(assignment.rollNumber) + "</td>",
					'<td><span class="status-chip is-' + statusClass + '">' + status + "</span></td>",
					"<td>" + proofButton + "</td>",
					'<td><div class="table-actions">'
						+ '<button type="button" class="task-action-button" data-status-action="set-pending" data-roll="' + assignment.rollNumber + '">Pending</button>'
						+ '<button type="button" class="task-action-button" data-status-action="approve" data-roll="' + assignment.rollNumber + '">Approve</button>'
						+ '<button type="button" class="task-action-button is-danger" data-status-action="reject" data-roll="' + assignment.rollNumber + '">Reject</button>'
						+ "</div></td>",
					"</tr>"
				].join("");
			})
			.join("");
	}

	async function setAssignmentStatus(taskId, rollNumber, nextStatus) {
		const task = tasks.find(function findTask(item) {
			return item.id === taskId;
		});
		if (!task) {
			return;
		}

		const assignment = getAssignmentForRoll(task, rollNumber);
		if (!assignment) {
			return;
		}

		if (supabaseClient) {
			const updated = await updateAssignmentRow(taskId, rollNumber, {
				status: nextStatus
			});
			if (!updated) {
				return;
			}
			await refreshTasksFromSupabase();
			const refreshedTask = tasks.find(function findRefreshedTask(item) {
				return item.id === taskId;
			});
			if (refreshedTask) {
				renderStatusTable(refreshedTask);
			}
			renderTasks();
			return;
		}

		assignment.status = nextStatus;
		saveTasks();
		renderStatusTable(task);
		renderTasks();
	}

	async function setAllAssignmentsStatus(taskId, nextStatus) {
		const task = tasks.find(function findTask(item) {
			return item.id === taskId;
		});
		if (!task) {
			return;
		}

		if (supabaseClient) {
			const bulkUpdate = await supabaseClient
				.from("task_assignments")
				.update({ status: nextStatus })
				.eq("task_id", taskId);

			if (bulkUpdate.error) {
				console.error("Bulk status update failed:", bulkUpdate.error);
				window.alert("Unable to update all students right now.");
				return;
			}

			await refreshTasksFromSupabase();
			const refreshedTask = tasks.find(function findRefreshedTask(item) {
				return item.id === taskId;
			});
			if (refreshedTask) {
				renderStatusTable(refreshedTask);
			}
			renderTasks();
			return;
		}

		task.assignments.forEach(function setStatus(assignment) {
			assignment.status = nextStatus;
		});
		saveTasks();
		renderStatusTable(task);
		renderTasks();
	}

	async function openProofPreview(taskId, rollNumber) {
		if (!proofPreviewContent || !proofPreviewModal) {
			return;
		}
		const task = tasks.find(function findTask(item) {
			return item.id === taskId;
		});
		if (!task) {
			return;
		}

		const targetRoll = rollNumber || currentStudentRoll;
		const assignment = getAssignmentForRoll(task, targetRoll);
		if (!assignment || (!assignment.proofName && !assignment.proofPath && !assignment.proofDataUrl)) {
			return;
		}

		const displayProofName = assignment.proofName || extractFileNameFromPath(assignment.proofPath) || "Uploaded Proof";
		const fileLabel = '<p><strong>File:</strong> ' + escapeHtml(displayProofName) + "</p>";
		if (assignment.proofDataUrl && assignment.proofDataUrl.startsWith("data:image")) {
			proofPreviewContent.innerHTML = fileLabel + '<img src="' + assignment.proofDataUrl + '" alt="Uploaded proof" />';
		} else if (assignment.proofDataUrl) {
			proofPreviewContent.innerHTML = fileLabel + '<a class="task-action-button" href="' + assignment.proofDataUrl + '" target="_blank" rel="noopener">Open Proof File</a>';
		} else if (assignment.proofPath && supabaseClient) {
			const signed = await supabaseClient.storage.from(TASK_PROOF_BUCKET).createSignedUrl(assignment.proofPath, 3600);
			if (signed.error || !signed.data || !signed.data.signedUrl) {
				proofPreviewContent.innerHTML = fileLabel + "<p>Unable to open proof preview right now.</p>";
			} else if (/\.(png|jpg|jpeg)$/i.test(displayProofName)) {
				proofPreviewContent.innerHTML = fileLabel + '<img src="' + signed.data.signedUrl + '" alt="Uploaded proof" />';
			} else {
				proofPreviewContent.innerHTML = fileLabel + '<a class="task-action-button" href="' + signed.data.signedUrl + '" target="_blank" rel="noopener">Open Proof File</a>';
			}
		} else {
			proofPreviewContent.innerHTML = fileLabel + "<p>Preview not available for this file type.</p>";
		}

		openModal(proofPreviewModal);
	}

	function extractFileNameFromPath(pathValue) {
		const value = String(pathValue || "");
		if (!value) {
			return "";
		}
		const parts = value.split("/");
		return parts[parts.length - 1] || value;
	}

	async function updateAssignmentRow(taskId, rollNumber, updates) {
		if (!supabaseClient) {
			return false;
		}

		const normalizedRoll = String(rollNumber || "").toUpperCase();
		const rollFieldCandidates = [];
		if (activeAssignmentRollField) {
			rollFieldCandidates.push(activeAssignmentRollField);
		}
		ASSIGNMENT_ROLL_FIELDS.forEach(function addCandidate(field) {
			if (!rollFieldCandidates.includes(field)) {
				rollFieldCandidates.push(field);
			}
		});

		let result = null;
		for (let i = 0; i < rollFieldCandidates.length; i += 1) {
			const rollField = rollFieldCandidates[i];
			const attemptResult = await attemptAssignmentUpdateWithRollField(taskId, normalizedRoll, updates, rollField);
			result = attemptResult;
			if (result && !result.error) {
				activeAssignmentRollField = rollField;
				break;
			}

			const missingColumn = parseMissingColumnName(result && result.error);
			if (!missingColumn || missingColumn !== rollField) {
				break;
			}
		}

		if (!result || result.error) {
			console.error("Assignment update failed:", result ? result.error : null);
			window.alert("Unable to update task status right now. " + extractErrorMessage(result ? result.error : null));
			return false;
		}

		return true;
	}

	async function attemptAssignmentUpdateWithRollField(taskId, normalizedRoll, updates, rollField) {
		let updatePayload = Object.assign({}, updates);
		let result = null;

		for (let attempt = 0; attempt < 4; attempt += 1) {
			result = await supabaseClient
				.from("task_assignments")
				.update(updatePayload)
				.eq("task_id", taskId)
				.eq(rollField, normalizedRoll);

			if (!result.error) {
				return result;
			}

			const missingColumn = parseMissingColumnName(result.error);
			if (!missingColumn) {
				return result;
			}

			if (missingColumn === rollField) {
				return result;
			}

			if (!Object.prototype.hasOwnProperty.call(updatePayload, missingColumn)) {
				return result;
			}

			const nextPayload = Object.assign({}, updatePayload);
			delete nextPayload[missingColumn];
			updatePayload = nextPayload;
		}

		return result;
	}

	function parseMissingColumnName(error) {
		const message = String((error && error.message) || "");
		const matchPgrst = /Could not find the '([^']+)' column/.exec(message);
		if (matchPgrst && matchPgrst[1]) {
			return matchPgrst[1];
		}

		const matchPostgres = /column\s+task_assignments\.([a-zA-Z0-9_]+)\s+does not exist/i.exec(message);
		if (matchPostgres && matchPostgres[1]) {
			return matchPostgres[1];
		}

		return null;
	}

	function sanitizeStorageName(value) {
		return String(value || "file")
			.replace(/[^a-zA-Z0-9._-]/g, "_")
			.slice(0, 140);
	}

	function handleTaskListClick(event) {
		const actionButton = event.target.closest("[data-action]");
		if (!actionButton) {
			return;
		}

		const taskId = Number(actionButton.getAttribute("data-task-id"));
		const action = actionButton.getAttribute("data-action");

		if (action === "complete") {
			if (canActAsStudent()) {
				void markComplete(taskId);
			}
			return;
		}

		if (action === "choose-proof") {
			if (!canActAsStudent()) {
				return;
			}
			const fileInput = document.getElementById("proofInput-" + taskId);
			if (fileInput) {
				fileInput.click();
			}
			return;
		}

		if (action === "view-status") {
			if (!canAddTasks()) {
				return;
			}
			openStatusModal(taskId);
			return;
		}

		if (action === "view-proof") {
			void openProofPreview(taskId, currentStudentRoll);
			return;
		}

		if (action === "delete") {
			if (!hasFullControl()) {
				return;
			}
			void deleteTask(taskId);
			return;
		}

		if (action === "edit") {
			if (!hasFullControl()) {
				return;
			}
			void editTask(taskId);
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

		void uploadProof(taskId, input.files[0]);
	}

	async function editTask(taskId) {
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

		if (supabaseClient) {
			const updateResult = await supabaseClient
				.from("tasks")
				.update({
					title: task.title,
					subject: task.subject,
					deadline: task.deadline
				})
				.eq("id", taskId);

			if (updateResult.error) {
				console.error("Task update failed:", updateResult.error);
				window.alert("Unable to edit task right now.");
				return;
			}

			await refreshTasksFromSupabase();
			return;
		}

		saveTasks();
		renderTasks();
	}

	async function deleteTask(taskId) {
		if (supabaseClient) {
			const deleteAssignments = await supabaseClient
				.from("task_assignments")
				.delete()
				.eq("task_id", taskId);

			if (deleteAssignments.error) {
				console.error("Assignment delete failed:", deleteAssignments.error);
			}

			const deleteTaskResult = await supabaseClient
				.from("tasks")
				.delete()
				.eq("id", taskId);

			if (deleteTaskResult.error) {
				console.error("Task delete failed:", deleteTaskResult.error);
				window.alert("Unable to delete task right now.");
				return;
			}

			await refreshTasksFromSupabase();
			return;
		}

		tasks = tasks.filter(function removeTask(item) {
			return item.id !== taskId;
		});
		saveTasks();
		renderTasks();
	}

	function buildTaskActions(task, status, assignment) {
		const actions = [];
		const allowStudentActions = canActAsStudent() && Boolean(assignment);
		const studentStatus = allowStudentActions ? getTaskStatus(task, assignment) : status;
		const hasProof = Boolean(assignment && (assignment.proofName || assignment.proofPath));
		actions.push('<div class="task-actions">');

		if (allowStudentActions) {
			if (studentStatus !== "Completed" && studentStatus !== "Missed") {
				if (task.requiresProof) {
					actions.push('<input id="proofInput-' + task.id + '" data-task-id="' + task.id + '" type="file" accept=".png,.jpg,.jpeg,.pdf" hidden />');
					actions.push('<button type="button" class="task-action-button" data-action="choose-proof" data-task-id="' + task.id + '">Upload Proof</button>');
				} else {
					actions.push('<button type="button" class="task-action-button" data-action="complete" data-task-id="' + task.id + '">Mark as Complete</button>');
				}
			}

			if (hasProof) {
				actions.push('<button type="button" class="task-action-button" data-action="view-proof" data-task-id="' + task.id + '">View Proof</button>');
			}
		}

		if (canAddTasks()) {
			actions.push('<button type="button" class="task-action-button is-primary" data-action="view-status" data-task-id="' + task.id + '">View Status Board</button>');
			if (hasFullControl()) {
				actions.push('<button type="button" class="task-action-button" data-action="edit" data-task-id="' + task.id + '">Edit</button>');
				actions.push('<button type="button" class="task-action-button is-danger" data-action="delete" data-task-id="' + task.id + '">Delete</button>');
			}
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
		return ["student", "cr", "class_incharge", "tech_support"].includes(currentRoleKey);
	}

	function canActAsStudent() {
		if (!canMarkTasks() || !currentStudentRoll) {
			return false;
		}

		if (currentRoleKey === "student") {
			return true;
		}

		return HYBRID_STUDENT_ROLLS.includes(String(currentStudentRoll).toUpperCase());
	}

	function canAddTasks() {
		return ["cr", "class_incharge", "tech_support"].includes(currentRoleKey);
	}

	function hasFullControl() {
		return ["class_incharge", "tech_support"].includes(currentRoleKey);
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

	function setupNotificationBoard() {
		if (!notificationBtn) {
			return;
		}

		notificationBtn.addEventListener("click", function jumpToAnnouncements(event) {
			event.stopPropagation();

			if (typeof window.showPage === "function") {
				window.showPage("homePage");
			}
			if (typeof window.setActiveNav === "function") {
				window.setActiveNav("homePage");
			}

			if (notificationBoard) {
				notificationBoard.setAttribute("hidden", "");
			}
			notificationBtn.setAttribute("aria-expanded", "false");

			if (!announcementsPanel) {
				return;
			}

			announcementsPanel.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
			announcementsPanel.focus({ preventScroll: true });

			announcementsPanel.classList.remove("is-highlight");
			void announcementsPanel.offsetWidth;
			announcementsPanel.classList.add("is-highlight");
			window.setTimeout(function clearHighlight() {
				announcementsPanel.classList.remove("is-highlight");
			}, 1000);
		});

		if (notificationClose && notificationBoard) {
			notificationClose.addEventListener("click", function closeNotifications() {
			notificationBoard.setAttribute("hidden", "");
			notificationBtn.setAttribute("aria-expanded", "false");
			});
		}
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

	function buildStudentRolls() {
		const list = [];
		for (let roll = 301; roll <= 350; roll += 1) {
			list.push("24H" + String(roll));
		}
		return list;
	}

	function resolveStudentRoll(email) {
		const lowerEmail = String(email || "").toLowerCase();
		const match = /^24h(\d{3})@/.exec(lowerEmail);
		if (!match) {
			return null;
		}
		return "24H" + match[1];
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

	function loadTasks(seedIfEmpty) {
		const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
		if (storedTasks) {
			try {
				const parsed = JSON.parse(storedTasks);
				if (Array.isArray(parsed)) {
					return parsed.map(normalizeTask);
				}
			} catch (error) {
				// Falls back to seed data if storage is malformed.
			}
		}

		if (!seedIfEmpty) {
			return [];
		}

		const seedTasks = [
			{
				id: 1,
				title: "Java Assignment 1",
				subject: "JAVA",
				deadline: "2026-03-25",
				requiresProof: true,
				assignments: studentRolls.map(function mapSeedStudents(roll) {
					return {
						rollNumber: roll,
						status: "pending",
						proofName: null,
						proofDataUrl: null
					};
				})
			}
		];

		const normalizedSeed = seedTasks.map(normalizeTask);
		localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(normalizedSeed));
		return normalizedSeed;
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
