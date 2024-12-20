const LAUNCHERS = ['OSRS', 'OSRSPS', 'OSNR', 'August'];
const TOTAL_WALLPAPERS = 20;

class Launcher {
	constructor() {
		this.updateInfo = { update: false, localVer: '1.0.0', latestVer: '1.0.0' };
		this.javaInstalled = false;
		this.buttonContainer = document.getElementById('buttonContainer');
		this.updateButton = document.getElementById('updateButton');
		this.versionFooter = document.getElementById('version-footer');
		this.OSRSAccounts = ['No Jagex Account Found'];
		this.selectedAccount = 'empty';
		this.cachedVersionInfo = {
			jdk: 'Unknown',
			local: 'Unknown',
			remote: 'Unknown',
			update: false,
		};
		this.buttons = new Map();
		this.init();
	}

	init() {
		this.setRandomBackground();
		this.startBackgroundRotation();
		this.setupEventListeners();
		this.createLauncherButtons();
	}

	setRandomBackground() {
		const randomWallpaperNumber = Math.floor(Math.random() * TOTAL_WALLPAPERS) + 1;
		const wallpaperFilename = `${randomWallpaperNumber}.webp`;
		document.body.style.backgroundImage = `url('../img/wallpapers/${wallpaperFilename}')`;
	}

	startBackgroundRotation() {
		const minInterval = 1 * 60 * 1000; // 1 minute in milliseconds
		const maxInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
		setInterval(
			() => {
				this.setRandomBackground();
			},
			Math.random() * (maxInterval - minInterval) + minInterval,
		);
	}

	setupEventListeners() {
		window.api.onVersionInfo(this.handleVersionInfo.bind(this));
		window.api.onUpdateProgress(this.handleUpdateProgress.bind(this));
		window.api.onResetButton(this.handleResetButton.bind(this));
		window.api.onJagexAccounts(this.handleJagexAccounts.bind(this));
	}

	handleJagexAccounts(accounts) {
		this.OSRSAccounts = accounts;
		this.handleRefreshOSRSAccountsSelectListUpdate();
	}

	handleVersionInfo({ jdk, local, remote, update } = {}) {
		// Update cached values with new information, if provided
		this.cachedVersionInfo = {
			jdk: jdk || this.cachedVersionInfo.jdk,
			local: local || this.cachedVersionInfo.local,
			remote: remote || this.cachedVersionInfo.remote,
			update: update !== undefined ? update : this.cachedVersionInfo.update,
		};
		// Use cached values
		const { jdk: cachedJdk, local: cachedLocal, remote: cachedRemote, update: cachedUpdate } = this.cachedVersionInfo;
		// Update version footer
		this.versionFooter.textContent = `Java: ${cachedJdk || 'Unknown'} | Launcher: ${cachedLocal || 'Unknown'}`;
		// Check Java version
		this.javaInstalled = cachedJdk === '11.0.22';
		// Update info for launcher update
		this.updateInfo = {
			update: cachedUpdate,
			localVer: cachedLocal,
			latestVer: cachedRemote,
		};
		// Update UI elements
		this.updateLauncherButtons();
		this.updateUpdateButton();
	}

	handleUpdateProgress({ progress }) {
		this.updateButton.textContent =
			progress === 100 ? 'Restarting Launcher...' : `Updating Launcher (${progress.toFixed(1)}%)...`;
	}

	handleRefreshOSRSAccounts() {
		console.log('Refreshing OSRS Accounts');
		window.api.RefreshJagexAccounts()
			.then(() => {
				this.handleRefreshOSRSAccountsSelectListUpdate();
			})
			.catch(error => {
				console.error('Error refreshing accounts:', error);
			});
	}

	handleRefreshOSRSAccountsSelectListUpdate() {
		const selectList = document.getElementById('account-select');
		if(this.OSRSAccounts.length > 0){
			selectList.innerHTML = '';
		}
		this.createSelectList(selectList);
	}

	handleSelectAccount(account) {
		this.selectedAccount = account;
		if(account !== 'empty'){
			window.api.copyJagexAccountCreds(account);
		} else {
			window.api.deleteJagexAccountCreds();
		}
	}

	createSelectList(selectList) {
		const defaultOption = document.createElement('option');
		defaultOption.value = 'empty';
		defaultOption.textContent = 'User/Pass';
		selectList.appendChild(defaultOption);
		console.log('OSRS Accounts:', this.OSRSAccounts);
		if(this.OSRSAccounts.length > 0){
			this.OSRSAccounts.forEach(account => {
			const option = document.createElement('option');
			if(account === 'No Jagex Account Found'){
				option.disabled = true;
			}
			option.value = account;
			option.textContent = account;
				selectList.appendChild(option);
			});
		}
		return selectList;
	}

	createLauncherButtons() {
		LAUNCHERS.forEach(name => {
			let showRefresh = false;
			const buttonContainer = document.createElement('div');
			buttonContainer.className = 'button-container';
			const logo = document.createElement('img');
			logo.src = `../img/${name.toLowerCase()}.png`;
			logo.className = 'button-logo';
			const selectListContainer = document.createElement('div');
			selectListContainer.className = 'select-list-container';
			if(name === 'OSRS'){
				showRefresh = true;
				const selectList = document.createElement('select');
				selectList.addEventListener('change', () => this.handleSelectAccount(selectList.value));
				selectList.name = 'account-select';
				selectList.id = 'account-select';
				selectList.className = 'select-list';
				this.createSelectList(selectList);
				selectListContainer.appendChild(selectList);
			}
			const button = this.createButton(name);			
			this.buttons.set(name.toLowerCase(), button);
			const refreshButton = document.createElement('button');
			refreshButton.textContent = 'Refresh Accounts';
			refreshButton.className = 'play';
			refreshButton.addEventListener('click', () => this.handleRefreshOSRSAccounts());
			const progressBarContainer = document.createElement('div');
			progressBarContainer.className = 'progress-bar';
			const progressBar = document.createElement('div');
			progressBar.id = `progress-${name}`;
			progressBar.className = 'progress-bar-value';
			progressBarContainer.appendChild(progressBar);
			if(showRefresh){
				buttonContainer.append(logo, selectListContainer, refreshButton, button, progressBarContainer);
			} else {
				buttonContainer.append(logo, selectListContainer, button, progressBarContainer);
			}
			this.buttonContainer.appendChild(buttonContainer);
		});
	}

	createButton(name) {
		const button = document.createElement('button');
		button.className = 'play';
		button.textContent = `Play ${name}`;
		button.addEventListener('click', () => this.handlePlay(button, name));
		return button;
	}

	handlePlay(button, name) {
		if (button.disabled || !this.javaInstalled) return;
		window.api.runJar('Launcher.jar', name.toLowerCase());
		this.animateButton(button);
	}

	animateButton(button) {
		this.resetButtonImmediate(button);
		button.disabled = true;
		button.style.backgroundColor = '#213c24';
		// Force a reflow
		void button.offsetWidth;
		button.classList.add('filling');
		setTimeout(() => {
			button.classList.remove('filling');
			button.classList.add('filled');
			this.resetButton(button);
		}, 10000);
	}

	resetButton(button) {
		button.disabled = false;
		button.style.backgroundColor = '';
		this.resetButtonImmediate(button);
	}

	resetButtonImmediate(button) {
		button.classList.remove('filling', 'filled');
		button.classList.add('resetting');
		// Force a reflow
		void button.offsetWidth;
		button.classList.remove('resetting');
	}

	handleResetButton(serverName) {
		const button = this.buttons.get(serverName.toLowerCase());
		if (button) {
			this.resetButton(button);
		}
	}

	updateLauncherButtons() {
		this.buttons.forEach(button => {
			button.disabled = !this.javaInstalled;
		});
	}

	updateUpdateButton() {
		const { update, localVer, latestVer } = this.updateInfo;
		this.updateButton.style.display = update ? 'block' : 'none';
		if (update) {
			this.updateButton.textContent = `Update Launcher: ${localVer} -> ${latestVer}`;
			this.updateButton.onclick = () => {
				if (this.javaInstalled) {
					window.api.downloadAndUpdate();
					this.updateButton.disabled = true;
					this.updateButton.textContent = 'Updating Launcher (0%)...';
				}
			};
		}
	}
}

document.addEventListener('DOMContentLoaded', () => new Launcher());
