# wcs-weigao-front
新版3D视图
# 1
更换图标请先将icon.png放至pubilc目录，并用npm run electron:generate-icons 命令执行
# 2
install前首先将npm版本升级到8.2以上，否则下载的依赖包会报错（node14版本）。
# 3
现场包：npm run electron:build
监控包：先把 scripts/build-monitor.js 里的 MONITOR_HOST 改成现场电脑 IP，再执行 npm run electron:build:monitor。监控包不打 public/jre 和 public/jarlib。
本地调试：一个终端 npm run electron:serve，另一个终端 npm run electron:serve:monitor。监控连本机 127.0.0.1。