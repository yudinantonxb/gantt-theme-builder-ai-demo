const CLR = {
	reset: "\x1b[0m",
	gray: "\x1b[90m",
	cyan: "\x1b[36m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	green: "\x1b[32m"
};

function ts() {
	return `${CLR.gray}[${new Date().toISOString()}]${CLR.reset}`;
}

function paint(color, label) {
	return `${color}${label}${CLR.reset}`;
}

export const log = {
	info: (...msg) => console.log(ts(), paint(CLR.cyan, 'INFO '), ...msg),
	warn: (...msg) => console.warn(ts(), paint(CLR.yellow, 'WARN '), ...msg),
	error: (...msg) => console.error(ts(), paint(CLR.red, 'ERROR'), ...msg),
	success: (...msg) => console.log(ts(), paint(CLR.green, 'OK   '), ...msg)
};