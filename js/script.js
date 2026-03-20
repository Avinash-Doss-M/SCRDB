(function initClassroomLogin() {
	const introScreen = document.getElementById("introScreen");
	const loginPanel = document.getElementById("loginPanel");
	const loginForm = document.getElementById("loginForm");
	const typingText = document.getElementById("typingText");
	const emailInput = document.getElementById("emailInput");
	const passwordInput = document.getElementById("passwordInput");
	const passwordToggle = document.getElementById("passwordToggle");
	const loginButton = document.getElementById("loginButton");
	const loginMessage = document.getElementById("loginMessage");

	if (!introScreen || !loginPanel || !loginForm || !emailInput || !passwordInput || !passwordToggle || !loginButton || !loginMessage || !typingText) {
		return;
	}

	const INTRO_DELAY_MS = 1800;
	const REDIRECT_DELAY_MS = 500;
	const TYPE_SPEED_MS = 95;
	const DELETE_SPEED_MS = 55;
	const HOLD_AFTER_TYPE_MS = 1000;
	const HOLD_AFTER_DELETE_MS = 320;
	const DOMAIN = "@amjaincollege.edu.in";
	const TITLE_TEXTS = ["Classroom Dashboard", "Login"];
	const SPECIAL_ROLES = {
		"24h310@amjaincollege.edu.in": "cr",
		"vijiyamalini@amjaincollege.edu.in": "class_incharge",
		"24h319@amjaincollege.edu.in": "tech_support"
	};

	typingText.textContent = "";
	void runTitleTypewriter();
	window.setTimeout(showLoginPanel, INTRO_DELAY_MS);
	loginForm.addEventListener("submit", handleLoginSubmit);
	passwordToggle.addEventListener("click", togglePasswordVisibility);

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

		window.setTimeout(function focusEmail() {
			emailInput.focus();
		}, 260);
	}

	function handleLoginSubmit(event) {
		event.preventDefault();
		setMessage("");

		const email = emailInput.value.trim().toLowerCase();
		const password = passwordInput.value.trim();
		const authResult = validateCredentials(email, password);

		if (!authResult.isEmailAllowed) {
			setMessage("Access restricted to this classroom", false);
			return;
		}

		if (!authResult.isPasswordValid) {
			setMessage("Incorrect password", false);
			return;
		}

		const role = authResult.role;

		loginButton.disabled = true;
		setMessage("Access granted. Redirecting...", true);

		localStorage.setItem("userEmail", email);
		localStorage.setItem("role", role);

		window.setTimeout(function redirectToDashboard() {
			window.location.href = "dashboard.html";
		}, REDIRECT_DELAY_MS);
	}

	function validateCredentials(email, password) {
		const role = resolveRole(email);

		if (!role) {
			return {
				isEmailAllowed: false,
				isPasswordValid: false,
				role: null
			};
		}

		const expectedPassword = resolveExpectedPassword(email, role);
		return {
			isEmailAllowed: true,
			isPasswordValid: password === expectedPassword,
			role
		};
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

	function resolveExpectedPassword(email, role) {
		if (role === "class_incharge") {
			return "Login@classincharge";
		}

		if (role === "cr") {
			return "Login@classrep310";
		}

		const localPart = email.split("@")[0];
		return "Login@" + localPart;
	}

	function togglePasswordVisibility() {
		const isVisible = passwordInput.type === "text";
		passwordInput.type = isVisible ? "password" : "text";
		passwordToggle.classList.toggle("is-visible", !isVisible);
		passwordToggle.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
	}

	function setMessage(text, isSuccess) {
		loginMessage.textContent = text;
		loginMessage.classList.toggle("is-success", Boolean(isSuccess));
	}
})();
