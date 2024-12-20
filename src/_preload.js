const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
	runJar: (filePath, server) => ipcRenderer.send('runJar', filePath, server),
	downloadAndUpdate: () => ipcRenderer.send('downloadAndUpdate'),
	onVersionInfo: callback => ipcRenderer.on('versionInfo', (_, data) => callback(data)),
	onUpdateProgress: callback => ipcRenderer.on('updateProgress', (_, data) => callback(data)),
	onResetButton: callback => ipcRenderer.on('resetButton', (_, serverName) => callback(serverName)),
	onJagexAccounts: callback => ipcRenderer.on('jagexAccounts', (_, data) => callback(data)),
	RefreshJagexAccounts: () => ipcRenderer.invoke('refreshJagexAccounts'),
	deleteJagexAccountCreds: () => ipcRenderer.invoke('deleteJagexAccountCreds'),
	copyJagexAccountCreds: (account) => ipcRenderer.invoke('copyJagexAccountCreds', account),
});
