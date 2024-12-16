async function getCurrentTab() {
	let queryOptions = { active: true, lastFocusedWindow: true };
	// `tab` will either be a `tabs.Tab` instance or `undefined`.
	let [tab] = await chrome.tabs.query(queryOptions);
	return tab;
}

function getInfo() {
	function getPublicFormInfo() {	
		const form = document.querySelector('form.cog-cognito');
	
		if (form) {
			return {
				orgId: form.__vue__.session.organizationId,
				formId: form.__vue__.entry.Form.Id
			}
		}
	
		return null;
	}
	
	function getAdminInfo() {
		let orgId = null;
		let formId = null;
		const flags = [];
	
		if (window.Cognito && window.Cognito.config) {
			orgId = window.Cognito.config.oid;
	
			if (window.Cognito.Forms && window.Cognito.Forms.model) {
				if (window.Cognito.Forms.model.currentForm)
					formId = window.Cognito.Forms.model.currentForm.get_Id();
				else
					formId = window.Cognito.Forms.model.formId;
			}
	
			Object.entries(window.Cognito.config.flags).forEach(([flag, value]) => {
				if (value)
					flags.push(flag);
			});
	
			return {
				orgId: orgId,
				formId: formId,
				flags: flags
			}
		}
		else if (window.location.host.includes("cognito")) {
			const globalStore = document.querySelector("#app").__vue__.globalStore;

			if (!globalStore)
				return null;

			orgId = globalStore.organization?.Id;
			formId = globalStore.currentForm?.Id;

			if (window.Cognito && window.Cognito.config && window.Cognito.config.flags)
				Object.entries(window.Cognito.config.flags).forEach(([flag, value]) => {
					if (value)
						flags.push(flag);
				});

			return {
				orgId: orgId,
				formId: formId,
				flags: flags
			}
		}
	
		return null;
	}

	const adminInfo = getAdminInfo();

	if (adminInfo)
		return adminInfo;

	return getPublicFormInfo();
}

function writeResult(info) {
	document.getElementById('orgId').innerText = info.orgId;
	document.getElementById('formId').innerText = info.formId;

	if (info.flags) {
		info.flags.forEach(function (flag) {
			const tableRow = document.createElement('tr');
			const flagName = document.createElement('td');
			flagName.innerText = flag;

			tableRow.appendChild(flagName);

			document.getElementById('featureFlags').appendChild(tableRow);
		})
	}
}

async function updateInfo() {
	const currentTab = await getCurrentTab();

	chrome.scripting.executeScript({
		target: { tabId: currentTab.id, allFrames: true },
		func: getInfo,
		world: 'MAIN'
	}).then(results => {
		for (const {frameId, result} of results) {
			if (result) {
				writeResult(result);
				break;
			}
		}
	})
}

await updateInfo();
