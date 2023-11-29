const { exec } = require('child_process');
const { spawn } = require('child_process');

//获取设备信息
const getConnectedDevices = (adbPath) => {
    return new Promise((resolve, reject) => {
        exec(`${adbPath} devices`, (error, stdout, stderr) => {
            if (error) {
            reject(`Error executing ADB command: ${error}`);
            return;
            }
            const devices = stdout
            .split('\n')
            .slice(1) // 跳过第一行（表头）
            .filter(line => line.trim() !== '')
            .map(line => {
                const [serial, state] = line.trim().split('\t');
                return { serial, state };
            });
            resolve(devices);
        });
    });
}

//获取进程信息
function getProcessInfo(adbPath, packageName) {
    return new Promise((resolve, reject) => {
        exec(`${adbPath} shell ps | grep ${packageName}`, (error, stdout, stderr) => {
            if (error && error.code !== 1) { // 排除 grep 未找到匹配项的情况
            reject(new Error(`adb执行遇到错误,请重试`));
            return;
            }
            if (stderr) {
            reject(new Error(`ADB command stderr: ${stderr}`));
            return;
            }
            if (stdout.trim() === '') {
            resolve('没有找到对应的进程信息。'); // 没有找到匹配的进程
            } else {
            resolve(stdout.trim()); // 找到了匹配的进程信息
            }
        });
    });
}

//强制退出进程
function forceStopProcess(adbPath, packageName) {
    return new Promise((resolve, reject) => {
        console.log('开始执行 forceStopProcess', packageName); // 调试信息

        exec(`${adbPath} shell su -c "am force-stop ${packageName}"`, (error) => {
            if (error) {
            console.error('ADB 命令执行出错：', error); // 调试信息
            reject(new Error(`Error executing ADB command`));
            return;
            }
            resolve();
        });
    });
}

//获取日志, 因为spwan是一个没有promise的异步操作, 所以回调方式更加适合
function getAllLogcat(adbPath, outputCallback, errorCallback, closeCallback) {
    const logcat = spawn(`${adbPath}`, ['logcat']);

    logcat.stdout.on('data', (data) => {
        outputCallback(data.toString());
    });

    logcat.stderr.on('data', (data) => {
        errorCallback(data.toString());
    });

    logcat.on('close', (code) => {
        closeCallback(code);
    });

}



module.exports = { getConnectedDevices, getProcessInfo, forceStopProcess, getAllLogcat };
