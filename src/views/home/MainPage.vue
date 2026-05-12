<template>
  <div class="smart-workshop" @click="handleGlobalClick">
    <!-- 内容区包装器 -->
    <div class="content-wrapper">
      <!-- 左侧面板 -->
      <div class="side-info-panel">
        <!-- PLC状态与订单信息区域 -->
        <div class="plc-info-section">
          <div class="section-header">
            当前扫码托盘信息
            <el-button
              type="success"
              size="mini"
              @click="showMobileConnectionStatus"
              icon="el-icon-connection"
              :disabled="!wsServerStatus.isRunning"
            >
              PDA互联
            </el-button>
          </div>
          <div class="scrollable-content" style="margin-top: 5px">
            <div class="status-overview">
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop granient-text">
                    订单id
                  </div>
                  <div
                    class="data-card-border-borderDown"
                    style="font-size: 1.3vw"
                  >
                    2025000001
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">产品名称</div>
                  <div class="data-card-border-borderDown">
                    一次性使用避光静脉输液针
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">注册证规格型号</div>
                  <div class="data-card-border-borderDown">0.45×13.5RWLB</div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">EAS规格型号</div>
                  <div class="data-card-border-borderDown">B-0.45</div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">装量</div>
                  <div class="data-card-border-borderDown">1000</div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">体积（mm³）</div>
                  <div class="data-card-border-borderDown">530×350×330</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作区 -->
        <div class="operation-panel">
          <div class="section-header">
            <span>操作区</span>
            <el-button
              type="primary"
              size="mini"
              icon="el-icon-search"
              @click="showOrderQueryDialog"
            >
              查询历史订单
            </el-button>
          </div>
          <div class="operation-buttons">
            <button
              @click="toggleButtonState('start')"
              :class="{ pressed: buttonStates.start }"
            >
              <i class="el-icon-switch-button"></i><span>全线启动</span>
            </button>
            <button
              @click="toggleButtonState('stop')"
              :class="{ pressed: buttonStates.stop }"
            >
              <i class="el-icon-error"></i><span>全线停止</span>
            </button>
            <button
              v-show="false"
              @click="toggleButtonState('reset')"
              :class="{ pressed: buttonStates.reset }"
            >
              <i class="el-icon-video-pause"></i><span>全线暂停</span>
            </button>
            <button @click="toggleButtonState('fault_reset')">
              <i class="el-icon-refresh"></i><span>故障复位</span>
            </button>
            <button @click="toggleButtonState('clear')">
              <i class="el-icon-delete"></i><span>全线清空</span>
            </button>
          </div>
        </div>

        <!-- 日志区域 -->
        <div class="log-section">
          <div class="section-header">
            日志区
            <div class="log-tabs">
              <div
                class="log-tab"
                :class="{ active: activeLogType === 'running' }"
                @click="activeLogType = 'running'"
              >
                运行日志
              </div>
              <div
                class="log-tab"
                :class="{ active: activeLogType === 'alarm' }"
                @click="switchToAlarmLog"
              >
                报警日志
                <div v-if="unreadAlarms > 0" class="alarm-badge">
                  {{ unreadAlarms }}
                </div>
              </div>
            </div>
          </div>
          <div class="scrollable-content">
            <div class="log-list">
              <template v-if="currentLogs.length > 0">
                <div
                  v-for="log in currentLogs"
                  :key="log.id"
                  :class="[
                    'log-item',
                    { alarm: log.type === 'alarm', unread: log.unread }
                  ]"
                >
                  <div class="log-time">{{ formatTime(log.timestamp) }}</div>
                  <div class="log-item-content">{{ log.message }}</div>
                </div>
              </template>
              <div v-else class="empty-state">
                <i class="el-icon-chat-line-square"></i>
                <p>
                  {{
                    activeLogType === 'running'
                      ? '暂无运行日志'
                      : '暂无报警日志'
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="main-content">
        <div class="floor-container">
          <div class="floor-left">
            <div class="floor-title">
              <i class="el-icon-set-up"></i> 作业区域
            </div>
            <div class="floor-image-container" ref="floorImageContainer">
              <div class="image-wrapper">
                <!-- 面板A：批次订单 + 当前处理托盘信息 -->
                <div class="marker-with-panel" data-x="1495" data-y="100">
                  <div
                    class="data-panel position-left always-show"
                    style="width: 170px; padding: 10px; z-index: 100"
                  >
                    <div class="data-panel-header">批次订单信息</div>
                    <div class="data-panel-content">
                      <!-- 第一部分：当前执行批次概览 -->
                      <template v-if="currentExecutingBatch">
                        <div class="data-panel-row">
                          <span class="data-panel-label">批次号：</span>
                          <span
                            style="font-size: 11px; word-break: break-all"
                            >{{ currentExecutingBatch.batch.batchNo }}</span
                          >
                        </div>
                        <div class="data-panel-row">
                          <span class="data-panel-label">状态：</span>
                          <span
                            :style="{
                              color:
                                currentExecutingBatch.batch.status === '2'
                                  ? '#67c23a'
                                  : '#409eff'
                            }"
                          >
                            {{
                              currentExecutingBatch.batch.status === '1'
                                ? '已确认'
                                : '生产中'
                            }}
                          </span>
                        </div>
                        <div class="data-panel-row">
                          <span class="data-panel-label">托盘数：</span>
                          <span>{{
                            (currentExecutingBatch.pallets || []).length
                          }}</span>
                        </div>
                      </template>
                      <div
                        v-else
                        class="data-panel-row"
                        style="color: #909399; font-size: 11px"
                      >
                        暂无运行批次
                      </div>
                      <!-- 分割线 -->
                      <div
                        style="border-top: 1px dashed #dcdfe6; margin: 6px 0"
                      ></div>
                      <!-- 第二部分：最近处理托盘快照 -->
                      <div class="data-panel-row">
                        <span class="data-panel-label">虚拟ID：</span>
                        <span style="font-size: 11px; word-break: break-all">{{
                          lastProcessedPallet.virtualId || '--'
                        }}</span>
                      </div>
                      <div class="data-panel-row">
                        <span class="data-panel-label">货物名称：</span>
                        <span style="font-size: 11px">{{
                          lastProcessedPallet.cargoName || '--'
                        }}</span>
                      </div>
                      <div
                        class="data-panel-row"
                        style="
                          flex-direction: column;
                          align-items: flex-start;
                          padding-bottom: 0;
                        "
                      >
                        <span
                          class="data-panel-label"
                          style="margin-bottom: 4px"
                        >
                          条码({{ lastProcessedPallet.barcodes.length }}):
                        </span>
                        <div
                          style="
                            max-height: 56px;
                            overflow-y: auto;
                            width: 100%;
                            background: #f5f7fa;
                            padding: 4px;
                            border-radius: 4px;
                            font-size: 11px;
                            line-height: 1.6;
                            color: #606266;
                            box-sizing: border-box;
                          "
                        >
                          <div
                            v-for="(code, idx) in lastProcessedPallet.barcodes"
                            :key="idx"
                          >
                            {{ code }}
                          </div>
                          <div
                            v-if="lastProcessedPallet.barcodes.length === 0"
                            style="color: #909399; text-align: center"
                          >
                            暂无条码
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 面板C：下货信息卡片1 -->
                <div
                  class="preheating-room-marker"
                  data-x="65"
                  data-y="120"
                  style="width: 110px"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">下货信息1</div>
                    <div class="preheating-room-body">
                      <div class="route-select-container">
                        <div
                          class="route-row"
                          style="
                            flex-direction: column;
                            align-items: flex-start;
                          "
                        >
                          <span class="route-label" style="margin-bottom: 2px"
                            >虚拟ID：</span
                          >
                          <span
                            style="
                              font-size: 11px;
                              word-break: break-all;
                              color: greenyellow;
                            "
                            >{{ unloadInfo.virtualId || '--' }}</span
                          >
                        </div>
                        <div
                          class="route-row"
                          style="
                            flex-direction: column;
                            align-items: flex-start;
                          "
                        >
                          <span class="route-label" style="margin-bottom: 2px"
                            >货物名称：</span
                          >
                          <span style="font-size: 11px; color: greenyellow">{{
                            unloadInfo.cargoName || '--'
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 面板D：下货信息卡片2 -->
                <div
                  class="preheating-room-marker"
                  data-x="65"
                  data-y="250"
                  style="width: 110px"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">下货信息2</div>
                    <div class="preheating-room-body">
                      <div class="route-select-container">
                        <div
                          class="route-row"
                          style="
                            flex-direction: column;
                            align-items: flex-start;
                          "
                        >
                          <span class="route-label" style="margin-bottom: 2px"
                            >虚拟ID：</span
                          >
                          <span
                            style="
                              font-size: 11px;
                              word-break: break-all;
                              color: greenyellow;
                            "
                            >{{ unloadInfo2.virtualId || '--' }}</span
                          >
                        </div>
                        <div
                          class="route-row"
                          style="
                            flex-direction: column;
                            align-items: flex-start;
                          "
                        >
                          <span class="route-label" style="margin-bottom: 2px"
                            >货物名称：</span
                          >
                          <span style="font-size: 11px; color: greenyellow">{{
                            unloadInfo2.cargoName || '--'
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 面板B：已发送进度 + 目的地展示 -->
                <div class="marker-with-panel" data-x="1480" data-y="450">
                  <div
                    class="data-panel position-left always-show"
                    style="width: 90px; padding: 10px; z-index: 100"
                  >
                    <div class="data-panel-header">上货进度 / 目的地</div>
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">已发送：</span>
                        <span>
                          {{
                            currentExecutingBatch
                              ? (currentExecutingBatch.pallets || []).filter(
                                  (p) => p.virtualId
                                ).length
                              : 0
                          }}
                          / 28
                        </span>
                      </div>
                      <div
                        class="data-panel-row"
                        style="
                          flex-direction: column;
                          align-items: flex-start;
                          margin-top: 6px;
                        "
                      >
                        <span
                          class="data-panel-label"
                          style="margin-bottom: 4px"
                          >目的地：</span
                        >
                        <el-select
                          :value="
                            currentDestination
                              ? currentDestination.destinationCode
                              : ''
                          "
                          size="mini"
                          style="width: 100%"
                          disabled
                          placeholder="PDA未设置"
                        >
                          <el-option
                            v-for="n in 15"
                            :key="n"
                            :label="String(3200 + n)"
                            :value="String(3200 + n)"
                          ></el-option>
                        </el-select>
                        <span
                          v-if="!currentDestination"
                          style="
                            font-size: 11px;
                            color: #e6a23c;
                            margin-top: 3px;
                          "
                        >
                          目的地未设置（请通过PDA设置）
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <img
                  src="@/assets/weigao-img/image.png"
                  alt="一楼平面图"
                  class="floor-image"
                  @load="updateMarkerPositions"
                />

                <div
                  v-for="node in deviceList"
                  :key="node.id"
                  class="device-signal-node"
                  :class="{
                    'status-active':
                      hasAnyStatus(node) && getDisplayStatus(node),
                    'status-idle':
                      hasAnyStatus(node) && !getDisplayStatus(node),
                    'is-selected': currentSelectedNodeId === node.id
                  }"
                  :data-x="node.x"
                  :data-y="node.y"
                  @click.stop="handleNodeClick(node, $event)"
                >
                  <!-- 托盘图片：仅在指定节点且处于激活状态(发绿)时显示 -->
                  <img
                    v-if="
                      node.showTray && node.trayId && getDisplayStatus(node)
                    "
                    src="@/assets/weigao-img/tray.png"
                    class="tray-icon"
                  />
                  <div class="signal-base">
                    <div class="signal-core"></div>
                  </div>
                </div>
                <template v-for="marker in queueMarkers">
                  <!-- 普通高进度条样式 -->
                  <div
                    v-if="!marker.compact"
                    :key="marker.id"
                    class="queue-marker"
                    :data-x="marker.x"
                    :data-y="marker.y"
                    @click="handleQueueMarkerClick(marker.queueId)"
                  >
                    <div
                      class="capacity-fill"
                      :style="{
                        height: getQueueCapacityPercent(marker.queueId) + '%'
                      }"
                    ></div>
                    <div class="queue-marker-content">
                      <span class="queue-marker-name">{{ marker.name }}</span>
                      <span class="queue-marker-count">{{
                        queues.find((q) => q.id === marker.queueId)?.trayInfo
                          ?.length || 0
                      }}</span>
                    </div>
                  </div>
                  <!-- 紧凑样式（上货区，与常州项目普通队列结构一致） -->
                  <div
                    v-else
                    :key="'compact-' + marker.id"
                    class="queue-marker"
                    data-compact="true"
                    :data-x="marker.x"
                    :data-y="marker.y"
                    @click="handleQueueMarkerClick(marker.queueId)"
                  >
                    <div class="queue-marker-content">
                      <span class="queue-marker-count">{{
                        queues.find((q) => q.id === marker.queueId)?.trayInfo
                          ?.length || 0
                      }}</span>
                      <span class="queue-marker-name">{{ marker.name }}</span>
                    </div>
                  </div>
                </template>
                <!-- 修改小车元素 -->
                <div
                  v-for="cart in carts"
                  :key="cart.name"
                  class="cart-container"
                  :data-x="cart.x"
                  :data-y="cart.y"
                  :data-width="cart.width"
                >
                  <img :src="cart.image" :alt="cart.name" class="cart-image" />
                </div>
                <!-- 预热完成信号 -->
                <div
                  v-for="(item, index) in preheatCompleted"
                  :key="'preheat-' + index"
                  class="analysis-status-marker"
                  :data-x="item.x"
                  :data-y="item.y"
                >
                  <el-tag v-show="item.completed" type="success" size="small">
                    预热完成
                  </el-tag>
                </div>
                <!-- 灭菌完成信号 -->
                <div
                  v-for="(item, index) in sterilizationCompleted"
                  :key="'sterilization-' + index"
                  class="analysis-status-marker"
                  :data-x="item.x"
                  :data-y="item.y"
                >
                  <el-tag v-show="item.completed" type="success" size="small">
                    灭菌完成
                  </el-tag>
                </div>
                <div
                  class="preheating-room-marker"
                  data-x="65"
                  data-y="450"
                  style="width: 110px"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">预热柜到灭菌柜选择</div>
                    <div class="preheating-room-body">
                      <div class="route-select-container">
                        <div class="route-row">
                          <span class="route-label">预热：</span>
                          <el-select
                            v-model="preheatSelectedFrom"
                            placeholder="预热柜"
                            size="mini"
                            :disabled="disinfectionExecuting"
                            style="width: 80px"
                          >
                            <el-option
                              v-for="item in preHeatQueues"
                              :key="'from-' + item.queueName"
                              :label="item.queueName"
                              :value="item.queueName.replace('Y', '')"
                            ></el-option>
                          </el-select>
                        </div>
                        <div class="route-row">
                          <span class="route-label">灭菌：</span>
                          <el-select
                            v-model="sterilizeSelectedTo"
                            placeholder="灭菌柜"
                            size="mini"
                            :disabled="disinfectionExecuting"
                            style="width: 80px"
                          >
                            <el-option
                              v-for="item in sterilizationQueues"
                              :key="'to-' + item.queueName"
                              :label="item.queueName"
                              :value="item.queueName"
                            ></el-option>
                          </el-select>
                        </div>
                      </div>
                      <el-button
                        type="primary"
                        size="mini"
                        :loading="disinfectionRoomLoading"
                        @click="sendToDisinfectionRoom"
                        style="width: 100%"
                        >执行</el-button
                      >
                      <el-button
                        v-if="disinfectionExecuting"
                        type="danger"
                        size="mini"
                        @click="cancelDisinfectionRoom"
                        style="width: 100%; margin-left: 0px"
                        >取消</el-button
                      >
                      <div
                        v-if="disinfectionExecuting && disinfectionTrayCode"
                        style="display: flex; align-items: center"
                      >
                        <span style="font-size: 12px; color: #9fe3d3"
                          >执行中：</span
                        >
                        <span style="font-size: 12px; color: greenyellow">{{
                          disinfectionTrayCode
                        }}</span>
                      </div>
                      <div style="font-size: 12px; color: #9fe3d3">
                        需进货：<b style="color: greenyellow">{{
                          disinfectionNeedQty
                        }}</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <transition name="fade-scale">
                <div
                  v-if="popoverVisible && popoverData"
                  class="singleton-popover"
                  :class="[
                    popoverList.length > 1 ? 'popover-multi-device' : '',
                    popoverDirection === 'down' ? 'popover-down' : ''
                  ]"
                  :style="popoverStyle"
                  @click.stop
                >
                  <div class="popover-header">
                    <span class="device-title">{{
                      popoverList.length > 1
                        ? `设备组 (${popoverList.length}台)`
                        : popoverData.name
                    }}</span>
                    <i
                      class="el-icon-close close-btn"
                      @click="closePopover"
                    ></i>
                  </div>

                  <!-- 独立设备：保持原样式 -->
                  <template v-if="popoverList.length === 1">
                    <div class="status-lines">
                      <div
                        v-if="hasMotorStatus(popoverData)"
                        class="status-line"
                        :class="
                          popoverData.motorStatus ? 'is-running' : 'is-stopped'
                        "
                      >
                        <span class="line-label"
                          >{{ popoverData.motorName || '' }} 电机状态</span
                        >
                        <span class="line-value">
                          {{ popoverData.motorStatus ? '启动' : '停止' }}
                        </span>
                      </div>
                      <div
                        v-if="hasSensorStatus(popoverData)"
                        class="status-line"
                        :class="
                          popoverData.sensorStatus ? 'is-active' : 'is-empty'
                        "
                      >
                        <span class="line-label"
                          >{{ popoverData.sensorName || '' }} 光电检测</span
                        >
                        <span class="line-value">
                          {{ popoverData.sensorStatus ? '启动' : '停止' }}
                        </span>
                      </div>
                    </div>

                    <div class="data-capsules">
                      <div v-if="hasTrayId(popoverData)" class="capsule-item">
                        <span class="capsule-label">托盘虚拟ID</span>
                        <span class="capsule-value highlight">
                          {{ popoverData.trayId }}
                        </span>
                      </div>
                      <div
                        v-if="hasDestination(popoverData)"
                        class="capsule-item"
                      >
                        <span class="capsule-label">任务目的地</span>
                        <span class="capsule-value">
                          {{ popoverData.destination }}
                        </span>
                      </div>
                    </div>
                  </template>

                  <!-- 成组设备：横向排列 -->
                  <template v-else>
                    <div class="devices-container">
                      <div
                        v-for="(device, index) in popoverList"
                        :key="device.id"
                        class="device-column"
                        :class="{
                          'has-divider': index < popoverList.length - 1
                        }"
                      >
                        <div class="device-name-header">{{ device.name }}</div>
                        <div class="status-lines">
                          <div
                            v-if="hasMotorStatus(device)"
                            class="status-line"
                            :class="
                              device.motorStatus ? 'is-running' : 'is-stopped'
                            "
                          >
                            <span class="line-label"
                              >{{ device.motorName || '' }} 电机状态</span
                            >
                            <span class="line-value">
                              {{ device.motorStatus ? '启动' : '停止' }}
                            </span>
                          </div>
                          <div
                            v-if="hasSensorStatus(device)"
                            class="status-line"
                            :class="
                              device.sensorStatus ? 'is-active' : 'is-empty'
                            "
                          >
                            <span class="line-label"
                              >{{ device.sensorName || '' }} 光电检测</span
                            >
                            <span class="line-value">
                              {{ device.sensorStatus ? '启动' : '停止' }}
                            </span>
                          </div>
                        </div>

                        <div class="data-capsules">
                          <div v-if="hasTrayId(device)" class="capsule-item">
                            <span class="capsule-label">托盘虚拟ID</span>
                            <span class="capsule-value highlight">
                              {{ device.trayId }}
                            </span>
                          </div>
                          <div
                            v-if="hasDestination(device)"
                            class="capsule-item"
                          >
                            <span class="capsule-label">任务目的地</span>
                            <span class="capsule-value">
                              {{ device.destination }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="side-info-panel-queue"
      :style="{
        width: isQueueExpanded ? '850px' : 'auto',
        height: isQueueExpanded ? 'calc(100% - 40px)' : 'auto'
      }"
    >
      <!-- 队列信息区域 -->
      <div class="queue-section" :class="{ expanded: isQueueExpanded }">
        <div class="section-header">
          <template v-if="isQueueExpanded">
            <div class="header-left">
              <span><i class="el-icon-s-data"></i> 队列信息</span>
              <el-button
                type="primary"
                size="mini"
                icon="el-icon-search"
                @click.stop="showTraySearchDialog"
                style="margin-left: 15px"
              >
                检索托盘
              </el-button>
            </div>
            <span
              class="arrow-icon"
              :class="{ 'expanded-arrow': isQueueExpanded }"
              @click="changeQueueExpanded"
              >▼</span
            >
          </template>
          <template v-else>
            <i class="el-icon-s-data" @click="changeQueueExpanded"></i>
          </template>
        </div>
        <div v-if="isQueueExpanded" class="expandable-content-queue">
          <div class="queue-container">
            <!-- 左侧队列列表 -->
            <div class="queue-container-left">
              <div
                v-for="(queue, index) in queues"
                :key="'queue-' + queue.id + '-' + index"
                class="queue"
                :class="{ active: selectedQueueIndex === queue.id - 1 }"
                @click="showTrays(queue.id - 1)"
                @dragover.prevent
                @drop="handleDrop(queue.id - 1)"
              >
                <span class="queue-name">{{ queue.queueName }}</span>
                <span class="tray-count">{{
                  queue.trayInfo?.length || 0
                }}</span>
              </div>
            </div>

            <!-- 右侧托盘列表 -->
            <div class="queue-container-right">
              <div class="selected-queue-header" v-if="selectedQueue">
                <h3>{{ selectedQueue.queueName }}</h3>
                <div class="queue-header-actions">
                  <el-button
                    type="primary"
                    size="small"
                    @click="showAddTrayDialog"
                    :disabled="!selectedQueue"
                    icon="el-icon-plus"
                  >
                    添加托盘
                  </el-button>
                  <span class="tray-total"
                    >托盘数量: {{ selectedQueue.trayInfo?.length || 0 }}</span
                  >
                </div>
              </div>
              <div class="tray-list">
                <template v-if="nowTrays && nowTrays.length > 0">
                  <div
                    v-for="(tray, index) in nowTrays"
                    :key="'tray-' + tray.id + '-' + index"
                    class="tray-item"
                    :class="{
                      dragging: isDragging && draggedTray?.id === tray.id
                    }"
                    draggable="true"
                    @dragstart="
                      handleDragStart($event, tray, selectedQueueIndex)
                    "
                    @dragend="handleDragEnd"
                  >
                    <div class="tray-info">
                      <div class="tray-info-row">
                        <span class="tray-name">{{ tray.name }}</span>
                        <div class="tray-batch-group">
                          <span class="tray-batch">
                            <span>
                              {{
                                tray.isTerile === 1 ? '消毒' : '不消毒'
                              }}</span
                            >
                          </span>
                          <span
                            class="tray-batch"
                            v-if="tray.sequenceNumber > 0"
                            ><span class="sequence-number"
                              >(序号：{{ tray.sequenceNumber }})</span
                            ></span
                          >
                        </div>
                      </div>
                      <div class="tray-info-row">
                        <span class="tray-detail"
                          >订单ID：{{ tray.orderId || '--' }}</span
                        >
                        <span class="tray-detail"
                          >物料编码：{{ tray.productCode || '--' }}</span
                        >
                      </div>
                      <div class="tray-info-row">
                        <span class="tray-detail"
                          >产品名称：{{ tray.productName || '--' }}</span
                        >
                        <span class="tray-detail"
                          >规格：{{ tray.unit || '--' }}</span
                        >
                      </div>
                      <div class="tray-info-row">
                        <span class="tray-detail"
                          >备注：{{ tray.batchNo || '--' }}</span
                        >
                      </div>
                      <span class="tray-time">{{ tray.time }}</span>
                    </div>
                    <div class="tray-actions">
                      <el-button
                        type="primary"
                        size="mini"
                        icon="el-icon-arrow-up"
                        circle
                        :disabled="index === 0"
                        @click.stop="moveTrayUp(index)"
                        class="move-btn"
                      ></el-button>
                      <el-button
                        type="primary"
                        size="mini"
                        icon="el-icon-arrow-down"
                        circle
                        :disabled="index === nowTrays.length - 1"
                        @click.stop="moveTrayDown(index)"
                        class="move-btn"
                      ></el-button>
                      <el-button
                        type="danger"
                        size="mini"
                        icon="el-icon-delete"
                        circle
                        @click.stop="deleteTray(tray, index)"
                      ></el-button>
                    </div>
                  </div>
                </template>
                <div v-else class="empty-state">
                  <i class="el-icon-box"></i>
                  <p>暂无托盘信息</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 测试面板 -->
    <div class="test-panel-container">
      <!-- 测试按钮 -->
      <div class="test-toggle-btn" @click="showTestPanel = !showTestPanel">
        <i class="el-icon-setting"></i>
      </div>
      <!-- 测试面板 -->
      <div class="test-panel" :class="{ collapsed: !showTestPanel }">
        <div class="test-panel-header">
          <span>测试面板</span>
          <i class="el-icon-close" @click.stop="showTestPanel = false"></i>
        </div>
        <div class="test-panel-content">
          <div class="test-section">
            <span class="test-label">上货测试:</span>
            <div style="margin-top: 10px">
              <el-button
                type="primary"
                size="small"
                @click="triggerVirtualIdRequest"
              >
                触发写虚拟ID请求
              </el-button>
            </div>
          </div>
          <!-- 扫码模拟（01002 / 01006） -->
          <div class="test-section">
            <span class="test-label">扫码模拟:</span>
            <div style="margin-top: 8px">
              <div
                style="
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  margin-bottom: 8px;
                "
              >
                <span
                  style="font-size: 12px; color: #606266; white-space: nowrap"
                  >01002:</span
                >
                <el-input
                  v-model="scanInput01002"
                  size="mini"
                  placeholder="输入货物 uid"
                  style="flex: 1"
                  @keyup.enter.native="handleScanConfirm('01002')"
                  clearable
                ></el-input>
                <el-button
                  size="mini"
                  type="primary"
                  @click="handleScanConfirm('01002')"
                  >确认</el-button
                >
              </div>
              <div style="display: flex; align-items: center; gap: 6px">
                <span
                  style="font-size: 12px; color: #606266; white-space: nowrap"
                  >01006:</span
                >
                <el-input
                  v-model="scanInput01006"
                  size="mini"
                  placeholder="输入货物 uid"
                  style="flex: 1"
                  @keyup.enter.native="handleScanConfirm('01006')"
                  clearable
                ></el-input>
                <el-button
                  size="mini"
                  type="primary"
                  @click="handleScanConfirm('01006')"
                  >确认</el-button
                >
              </div>
            </div>
          </div>
          <!-- 发送目的地 -->
          <div class="test-section">
            <span class="test-label">发送目的地:</span>
            <div style="margin-top: 8px">
              <el-button
                type="warning"
                size="small"
                @click="handleSendDestination"
              >
                请求发送目的地
              </el-button>
            </div>
          </div>
          <!-- 上货前电机信号 -->
          <div class="test-section">
            <span class="test-label">上货前电机信号:</span>
            <div
              style="
                margin-top: 8px;
                font-size: 11px;
                color: #909399;
                margin-bottom: 6px;
              "
            >
              触发后将上货区第一个托盘移入对应预热队列
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px">
              <el-button
                v-for="q in preHeatQueues"
                :key="q.id"
                size="mini"
                type="success"
                plain
                @click="triggerPreHeatMotorSignal(q)"
              >
                {{ q.queueName }}
              </el-button>
            </div>
          </div>
          <!-- 灭菌后预热信号 -->
          <div class="test-section">
            <span class="test-label">灭菌后预热信号:</span>
            <div
              style="
                margin-top: 8px;
                font-size: 11px;
                color: #909399;
                margin-bottom: 6px;
              "
            >
              触发后删除对应灭菌队列的第一个托盘
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px">
              <el-button
                v-for="q in sterilizationQueues"
                :key="q.id"
                size="mini"
                type="danger"
                plain
                @click="triggerSterilizationMotorSignal(q)"
              >
                {{ q.queueName }}
              </el-button>
            </div>
          </div>
          <div class="test-section">
            <span class="test-label">小车位置测试:</span>
            <div class="cart-position-test-container">
              <div class="cart-position-group">
                <div class="cart-position-label">
                  <span>小车1 (19-6210):</span>
                  <span class="cart-value">{{ cartPositionValues.cart1 }}</span>
                </div>
                <div class="cart-position-slider-container">
                  <el-slider
                    v-model="cartPositionValues.cart1"
                    :min="19"
                    :max="6210"
                    :step="1"
                    class="cart-position-slider"
                  ></el-slider>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 订单查询对话框 -->
    <OrderQueryDialog :visible.sync="orderQueryDialogVisible" />
    <!-- 托盘检索弹窗 -->
    <el-dialog
      title="托盘检索"
      :visible.sync="traySearchDialogVisible"
      width="821px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="tray-search-form">
        <el-form
          :model="traySearchForm"
          ref="traySearchForm"
          label-width="100px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="托盘号" prop="trayCode">
                <el-input
                  v-model="traySearchForm.trayCode"
                  placeholder="请输入托盘号进行查询"
                  clearable
                >
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="订单号" prop="orderId">
                <el-input
                  v-model="traySearchForm.orderId"
                  placeholder="请输入订单号进行查询"
                  clearable
                >
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="物料编码" prop="productCode">
                <el-input
                  v-model="traySearchForm.productCode"
                  placeholder="请输入物料编码进行查询"
                  clearable
                >
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="物料名称" prop="productName">
                <el-input
                  v-model="traySearchForm.productName"
                  placeholder="请输入物料名称进行查询"
                  clearable
                >
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- 查询结果展示 -->
        <div
          v-if="searchResults && searchResults.length > 0"
          class="search-result"
        >
          <el-divider content-position="left">
            查询结果 (共 {{ searchResults.length }} 个托盘)
          </el-divider>
          <el-table
            :data="searchResults"
            style="width: 100%"
            stripe
            border
            height="300"
            :max-height="300"
          >
            <el-table-column
              prop="trayCode"
              label="托盘号"
              width="180"
              align="center"
            ></el-table-column>
            <el-table-column
              prop="orderId"
              label="订单号"
              width="180"
              align="center"
            >
              <template slot-scope="scope">
                {{ scope.row.orderId || '--' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="productCode"
              label="物料编码"
              width="150"
              align="center"
            >
              <template slot-scope="scope">
                {{ scope.row.productCode || '--' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="productName"
              label="物料名称"
              width="150"
              align="center"
            >
              <template slot-scope="scope">
                {{ scope.row.productName || '--' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="queueName"
              label="当前队列"
              width="120"
              align="center"
            >
              <template slot-scope="scope">
                <span style="color: red; font-weight: bold">{{
                  scope.row.queueName
                }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 无结果提示 -->
        <div
          v-else-if="
            hasSearched && (!searchResults || searchResults.length === 0)
          "
          class="no-result"
        >
          <el-divider content-position="left">查询结果</el-divider>
          <div class="no-result-content">
            <i class="el-icon-warning"></i>
            <p>未找到符合条件的托盘信息</p>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="traySearchDialogVisible = false">关 闭</el-button>
        <el-button type="primary" @click="searchTray" :loading="searchLoading"
          >查 询</el-button
        >
      </div>
    </el-dialog>

    <!-- 添加托盘对话框 -->
    <el-dialog
      title="添加托盘"
      :visible.sync="addTrayDialogVisible"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="add-tray-form">
        <el-form
          :model="newTrayForm"
          ref="newTrayForm"
          label-width="100px"
          :rules="trayFormRules"
        >
          <el-form-item label="托盘编号" prop="trayCode">
            <el-input
              v-model="newTrayForm.trayCode"
              placeholder="请输入托盘编号"
            ></el-input>
          </el-form-item>
          <el-form-item label="批次号" prop="batchId">
            <el-input
              v-model="newTrayForm.batchId"
              placeholder="请输入批次号"
            ></el-input>
          </el-form-item>
          <el-form-item label="是否灭菌" prop="isSterile">
            <el-switch
              v-model="newTrayForm.isSterile"
              active-text="灭菌"
              inactive-text="不灭菌"
              active-color="#13ce66"
              inactive-color="#ff4949"
            >
            </el-switch>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addTrayDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitAddTray" :loading="isSubmitting"
          >确 定</el-button
        >
      </div>
    </el-dialog>

    <!-- PDA连接状态弹窗 -->
    <el-dialog
      title="PDA连接状态"
      :visible.sync="mobileConnectionDialogVisible"
      width="80%"
      append-to-body
      :close-on-click-modal="false"
      custom-class="mobile-connection-dialog"
    >
      <div class="connection-status-header">
        <div class="server-status">
          <el-tag :type="wsServerStatus.isRunning ? 'success' : 'danger'">
            WebSocket服务器:
            {{ wsServerStatus.isRunning ? '运行中' : '已停止' }}
          </el-tag>
          <span class="server-info">端口: {{ wsServerStatus.port }}</span>
          <span class="server-info"
            >在线客户端: {{ mobileConnections.length }}</span
          >
        </div>
        <el-button
          type="primary"
          size="small"
          icon="el-icon-refresh"
          @click="refreshMobileConnections"
          :loading="refreshingConnections"
        >
          刷新
        </el-button>
      </div>
      <el-table
        :data="mobileConnections"
        style="width: 100%; margin-top: 16px"
        :height="400"
        empty-text="暂无移动端连接"
      >
        <el-table-column prop="id" label="客户端ID" width="200" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="userAgent" label="设备信息" />
        <el-table-column prop="connectedAt" label="连接时间" width="180">
          <template slot-scope="scope">
            {{ formatConnectionTime(scope.row.connectedAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastPing" label="最后心跳" width="180">
          <template slot-scope="scope">
            {{ formatConnectionTime(scope.row.lastPing) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template slot-scope="scope">
            <el-tag
              :type="scope.row.status === '在线' ? 'success' : 'danger'"
              size="small"
            >
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import HttpUtil from '@/utils/HttpUtil';
import moment from 'moment';
import { ipcRenderer } from 'electron';
import OrderQueryDialog from '@/components/OrderQueryDialog.vue';

// 预热柜编号 → 预热柜队列索引(Y前缀)
// queues: [0]上货区, [1]Y3215, [3]Y3214, [5]Y3213, ... [29]Y3201
const PREHEAT_QUEUE_MAP = {
  3201: 29,
  3202: 27,
  3203: 25,
  3204: 23,
  3205: 21,
  3206: 19,
  3207: 17,
  3208: 15,
  3209: 13,
  3210: 11,
  3211: 9,
  3212: 7,
  3213: 5,
  3214: 3,
  3215: 1
};
// 灭菌柜编号 → 灭菌柜队列索引
// queues: [2]3215, [4]3214, [6]3213, ... [30]3201
const STERILIZE_QUEUE_MAP = {
  3201: 30,
  3202: 28,
  3203: 26,
  3204: 24,
  3205: 22,
  3206: 20,
  3207: 18,
  3208: 16,
  3209: 14,
  3210: 12,
  3211: 10,
  3212: 8,
  3213: 6,
  3214: 4,
  3215: 2
};
// 预热柜编号 → W_DBW18 bit位键名(预热房出货命令)
const PREHEAT_DBW18_MAP = {
  3201: 'W_DBW18_BIT0',
  3202: 'W_DBW18_BIT1',
  3203: 'W_DBW18_BIT2',
  3204: 'W_DBW18_BIT3',
  3205: 'W_DBW18_BIT4',
  3206: 'W_DBW18_BIT5',
  3207: 'W_DBW18_BIT6',
  3208: 'W_DBW18_BIT7',
  3209: 'W_DBW18_BIT8',
  3210: 'W_DBW18_BIT9',
  3211: 'W_DBW18_BIT10',
  3212: 'W_DBW18_BIT11',
  3213: 'W_DBW18_BIT12',
  3214: 'W_DBW18_BIT13',
  3215: 'W_DBW18_BIT14'
};
// 灭菌柜编号 → W_DBW20 bit位键名(灭菌柜进货命令)
const STERILIZE_DBW20_MAP = {
  3201: 'W_DBW20_BIT0',
  3202: 'W_DBW20_BIT1',
  3203: 'W_DBW20_BIT2',
  3204: 'W_DBW20_BIT3',
  3205: 'W_DBW20_BIT4',
  3206: 'W_DBW20_BIT5',
  3207: 'W_DBW20_BIT6',
  3208: 'W_DBW20_BIT7',
  3209: 'W_DBW20_BIT8',
  3210: 'W_DBW20_BIT9',
  3211: 'W_DBW20_BIT10',
  3212: 'W_DBW20_BIT11',
  3213: 'W_DBW20_BIT12',
  3214: 'W_DBW20_BIT13',
  3215: 'W_DBW20_BIT14'
};

export default {
  name: 'MonitorScreen',
  components: {
    OrderQueryDialog
  },
  data() {
    return {
      // ---- 轮询数据（批次 + 目的地） ----
      currentExecutingBatch: null, // BatchDetailDTO: { batch, pallets }
      currentDestination: null, // ProduceBatchDestination: { destinationCode, ... }
      // ---- 测试面板扫码输入 ----
      scanInput01002: '',
      scanInput01006: '',
      // ---- 面板A-第二部分：最近一次触发虚拟ID后更新，不被轮询覆盖 ----
      lastProcessedPallet: {
        virtualId: '',
        cargoName: '',
        barcodes: []
      },
      // ---- 面板C：下货信息 ----
      unloadInfo: {
        virtualId: '',
        cargoName: ''
      },
      // ---- 面板D：下货信息2 ----
      unloadInfo2: {
        virtualId: '',
        cargoName: ''
      },
      nowScanTrayInfo: {},
      isDataReady: false, // 添加数据准备就绪标志位
      showTestPanel: false,
      orderQueryDialogVisible: false,
      // PDA 互联
      wsServerStatus: { isRunning: false, port: 8081, clientCount: 0 },
      mobileConnections: [],
      mobileConnectionDialogVisible: false,
      refreshingConnections: false,
      buttonStates: {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      },
      activeLogType: 'running',
      runningLogs: [],
      alarmLogs: [],
      // 小车y轴范围配置（MonitorScreen页面小车沿x轴水平行走）
      cartXRanges: {
        cart1: { min: 175, max: 1215 } // x轴范围318-1395线到G线)
      },
      carts: [
        {
          id: 1,
          name: '小车1',
          x: 1215,
          y: 458, // 对应PLC值0的位置（y轴最小值）
          width: 70,
          image: require('@/assets/weigao-img/cart1.png')
        }
      ],
      // 小车位置数值-读取PLC
      cartPositionValues: {
        cart1: 19 // 范围19-6210
      },
      nowTrays: [],
      draggedTray: null,
      dragSourceQueue: null,
      isQueueExpanded: false,
      selectedQueueIndex: 0,
      isDragging: false,
      addTrayDialogVisible: false,
      // 托盘检索相关
      traySearchDialogVisible: false,
      searchLoading: false,
      traySearchForm: {
        trayCode: '',
        orderId: '',
        productCode: '',
        productName: ''
      },
      searchResults: [],
      hasSearched: false,
      isSubmitting: false,
      newTrayForm: {
        trayCode: '',
        batchId: '',
        isSterile: true
      },
      trayFormRules: {
        trayCode: [
          { required: true, message: '请输入托盘编号', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ],
        batchId: [
          { required: true, message: '请输入批次号', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ]
      },
      queues: [
        { id: 1, queueName: '上货区', trayInfo: [] },
        { id: 2, queueName: 'Y3215', trayInfo: [] },
        { id: 3, queueName: '3215', trayInfo: [] },
        { id: 4, queueName: 'Y3214', trayInfo: [] },
        { id: 5, queueName: '3214', trayInfo: [] },
        { id: 6, queueName: 'Y3213', trayInfo: [] },
        { id: 7, queueName: '3213', trayInfo: [] },
        { id: 8, queueName: 'Y3212', trayInfo: [] },
        { id: 9, queueName: '3212', trayInfo: [] },
        { id: 10, queueName: 'Y3211', trayInfo: [] },
        { id: 11, queueName: '3211', trayInfo: [] },
        { id: 12, queueName: 'Y3210', trayInfo: [] },
        { id: 13, queueName: '3210', trayInfo: [] },
        { id: 14, queueName: 'Y3209', trayInfo: [] },
        { id: 15, queueName: '3209', trayInfo: [] },
        { id: 16, queueName: 'Y3208', trayInfo: [] },
        { id: 17, queueName: '3208', trayInfo: [] },
        { id: 18, queueName: 'Y3207', trayInfo: [] },
        { id: 19, queueName: '3207', trayInfo: [] },
        { id: 20, queueName: 'Y3206', trayInfo: [] },
        { id: 21, queueName: '3206', trayInfo: [] },
        { id: 22, queueName: 'Y3205', trayInfo: [] },
        { id: 23, queueName: '3205', trayInfo: [] },
        { id: 24, queueName: 'Y3204', trayInfo: [] },
        { id: 25, queueName: '3204', trayInfo: [] },
        { id: 26, queueName: 'Y3203', trayInfo: [] },
        { id: 27, queueName: '3203', trayInfo: [] },
        { id: 28, queueName: 'Y3202', trayInfo: [] },
        { id: 29, queueName: '3202', trayInfo: [] },
        { id: 30, queueName: 'Y3201', trayInfo: [] },
        { id: 31, queueName: '3201', trayInfo: [] }
      ],
      // 队列位置标识数据
      queueMarkers: [
        { id: 1, name: '上货区', queueId: 1, x: 1345, y: 325, compact: true },
        { id: 2, name: 'Y3215', queueId: 2, x: 1210, y: 615 },
        { id: 3, name: '3215', queueId: 3, x: 1210, y: 300 },
        { id: 4, name: 'Y3214', queueId: 4, x: 1135, y: 615 },
        { id: 5, name: '3214', queueId: 5, x: 1135, y: 300 },
        { id: 6, name: 'Y3213', queueId: 6, x: 1065, y: 615 },
        { id: 7, name: '3213', queueId: 7, x: 1065, y: 300 },
        { id: 8, name: 'Y3212', queueId: 8, x: 990, y: 615 },
        { id: 9, name: '3212', queueId: 9, x: 990, y: 300 },
        { id: 10, name: 'Y3211', queueId: 10, x: 915, y: 615 },
        { id: 11, name: '3211', queueId: 11, x: 915, y: 300 },
        { id: 12, name: 'Y3210', queueId: 12, x: 842, y: 615 },
        { id: 13, name: '3210', queueId: 13, x: 842, y: 300 },
        { id: 14, name: 'Y3209', queueId: 14, x: 767, y: 615 },
        { id: 15, name: '3209', queueId: 15, x: 767, y: 300 },
        { id: 16, name: 'Y3208', queueId: 16, x: 692, y: 615 },
        { id: 17, name: '3208', queueId: 17, x: 692, y: 300 },
        { id: 18, name: 'Y3207', queueId: 18, x: 620, y: 615 },
        { id: 19, name: '3207', queueId: 19, x: 620, y: 300 },
        { id: 20, name: 'Y3206', queueId: 20, x: 545, y: 615 },
        { id: 21, name: '3206', queueId: 21, x: 545, y: 300 },
        { id: 22, name: 'Y3205', queueId: 22, x: 472, y: 615 },
        { id: 23, name: '3205', queueId: 23, x: 472, y: 300 },
        { id: 24, name: 'Y3204', queueId: 24, x: 397, y: 615 },
        { id: 25, name: '3204', queueId: 25, x: 397, y: 300 },
        { id: 26, name: 'Y3203', queueId: 26, x: 328, y: 615 },
        { id: 27, name: '3203', queueId: 27, x: 328, y: 300 },
        { id: 28, name: 'Y3202', queueId: 28, x: 253, y: 615 },
        { id: 29, name: '3202', queueId: 29, x: 253, y: 300 },
        { id: 30, name: 'Y3201', queueId: 30, x: 178, y: 615 },
        { id: 31, name: '3201', queueId: 31, x: 178, y: 300 }
      ],
      // 预热完成信号（15条线，含位置和状态）
      preheatCompleted: [
        { x: 1210, y: 530, completed: true }, // Y3215
        { x: 1135, y: 530, completed: true }, // Y3214
        { x: 1065, y: 530, completed: true }, // Y3213
        { x: 990, y: 530, completed: true }, // Y3212
        { x: 915, y: 530, completed: true }, // Y3211
        { x: 842, y: 530, completed: true }, // Y3210
        { x: 767, y: 530, completed: true }, // Y3209
        { x: 692, y: 530, completed: true }, // Y3208
        { x: 620, y: 530, completed: true }, // Y3207
        { x: 545, y: 530, completed: true }, // Y3206
        { x: 472, y: 530, completed: true }, // Y3205
        { x: 397, y: 530, completed: true }, // Y3204
        { x: 328, y: 530, completed: true }, // Y3203
        { x: 253, y: 530, completed: true }, // Y3202
        { x: 178, y: 530, completed: true } // Y3201
      ],
      // 灭菌完成信号（15条线，含位置和状态）
      sterilizationCompleted: [
        { x: 1210, y: 215, completed: true }, // 3215
        { x: 1135, y: 215, completed: true }, // 3214
        { x: 1065, y: 215, completed: true }, // 3213
        { x: 990, y: 215, completed: true }, // 3212
        { x: 915, y: 215, completed: true }, // 3211
        { x: 842, y: 215, completed: true }, // 3210
        { x: 767, y: 215, completed: true }, // 3209
        { x: 692, y: 215, completed: true }, // 3208
        { x: 620, y: 215, completed: true }, // 3207
        { x: 545, y: 215, completed: true }, // 3206
        { x: 472, y: 215, completed: true }, // 3205
        { x: 397, y: 215, completed: true }, // 3204
        { x: 328, y: 215, completed: true }, // 3203
        { x: 253, y: 215, completed: true }, // 3202
        { x: 178, y: 215, completed: true } // 3201
      ],
      logId: 1000,

      // ---- 预热柜到灭菌柜相关 ----
      preheatSelectedFrom: null, // 选择的预热柜编号(3201-3215)
      sterilizeSelectedTo: null, // 选择的灭菌柜编号(3201-3215)
      disinfectionRoomLoading: false, // 执行按钮loading
      disinfectionExecuting: false, // 是否正在执行
      disinfectionTrayCode: '', // 执行中显示的托盘编码
      disinfectionNeedQty: 0, // 需进货数量
      disinfectionTargetTotal: 0, // 目标总数量

      // ==========================================================
      // 【修改结果】直接在 data 里定义好所有设备点位
      //  无需额外的 init 方法，直接写死即可
      //  以后后端数据来了，直接更新 this.deviceNodes 对应的字段
      // ==========================================================
      deviceNodes: {
        '01001': {
          name: '01001',
          x: 1350,
          y: 280,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 0 },
          sensorAddr: { db: 'DBW1606', bit: 0 },
          trayIdAddr: 'DBW62',
          destinationAddr: 'DBW800',
          motorName: '01001',
          sensorName: 'SP_01001'
        },
        '01002': {
          name: '01002',
          x: 1310,
          y: 280,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 1 },
          sensorAddr: { db: 'DBW1606', bit: 1 },
          trayIdAddr: 'DBW64',
          destinationAddr: 'DBW802',
          motorName: '01002',
          sensorName: 'SP_01002'
        },
        '01004': {
          name: '01004',
          x: 1273,
          y: 280,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 3 },
          sensorAddr: { db: 'DBW1606', bit: 2 },
          trayIdAddr: 'DBW66',
          destinationAddr: 'DBW804',
          motorName: '01004',
          sensorName: 'SP_01004'
        },
        '01005': {
          name: '01005',
          x: 1273,
          y: 310,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 4 },
          sensorAddr: { db: 'DBW1606', bit: 3 },
          trayIdAddr: 'DBW68',
          destinationAddr: 'DBW806',
          motorName: '01005',
          sensorName: 'SP_01005'
        },
        '01006': {
          name: '01006',
          x: 1273,
          y: 340,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 5 },
          sensorAddr: { db: 'DBW1606', bit: 4 },
          trayIdAddr: 'DBW70',
          destinationAddr: 'DBW808',
          motorName: '01006',
          sensorName: 'SP_01006'
        },
        '01008': {
          name: '01008',
          x: 1273,
          y: 375,
          groupId: 'G_01008_01009',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 7 },
          sensorAddr: { db: 'DBW1606', bit: 5 },
          trayIdAddr: 'DBW72',
          destinationAddr: 'DBW810',
          motorName: '01008',
          sensorName: 'SP_01009'
        },
        '01009': {
          name: '01009',
          x: 1273,
          y: 375,
          groupId: 'G_01008_01009',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 8 },
          sensorAddr: { db: 'DBW1606', bit: 5 },
          trayIdAddr: 'DBW74',
          destinationAddr: 'DBW812',
          motorName: '01009',
          sensorName: 'SP_01009'
        },
        '01011': {
          name: '01011',
          x: 1300,
          y: 375,
          groupId: 'G_01011_01012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 10 },
          sensorAddr: { db: 'DBW1606', bit: 6 },
          trayIdAddr: 'DBW76',
          destinationAddr: 'DBW814',
          motorName: '01011',
          sensorName: 'SP_01011'
        },
        '01012': {
          name: '01012',
          x: 1300,
          y: 375,
          groupId: 'G_01011_01012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 11 },
          sensorAddr: { db: 'DBW1606', bit: 7 },
          trayIdAddr: 'DBW78',
          destinationAddr: 'DBW816',
          motorName: '01012',
          sensorName: 'SP_01012'
        },
        '01013A': {
          name: '01013A',
          x: 1273,
          y: 450,
          groupId: 'G_01013A_01013B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 12 },
          sensorAddr: { db: 'DBW1606', bit: 8 },
          trayIdAddr: 'DBW80',
          destinationAddr: 'DBW818',
          motorName: '01013A',
          sensorName: 'SP_01013-1'
        },
        '01013B': {
          name: '01013B',
          x: 1273,
          y: 450,
          groupId: 'G_01013A_01013B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 12 },
          sensorAddr: { db: 'DBW1606', bit: 9 },
          trayIdAddr: 'DBW82',
          destinationAddr: 'DBW820',
          motorName: '01013B',
          sensorName: 'SP_01013-2'
        },
        '01019A': {
          name: '01019A',
          x: 1300,
          y: 450,
          groupId: 'G_01019A_01019B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 2 },
          sensorAddr: { db: 'DBW1606', bit: 15 },
          trayIdAddr: 'DBW104',
          destinationAddr: 'DBW842',
          motorName: '01019A',
          sensorName: 'SP_01019-1'
        },
        '01019B': {
          name: '01019B',
          x: 1300,
          y: 450,
          groupId: 'G_01019A_01019B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 2 },
          sensorAddr: { db: 'DBW1608', bit: 0 },
          trayIdAddr: 'DBW106',
          destinationAddr: 'DBW844',
          motorName: '01019B',
          sensorName: 'SP_01019-2'
        },
        '01014A': {
          name: '01014A',
          x: 1273,
          y: 510,
          groupId: 'G_01014A_01014B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 13 },
          sensorAddr: { db: 'DBW1606', bit: 10 },
          trayIdAddr: 'DBW84',
          destinationAddr: 'DBW822',
          motorName: '01014A',
          sensorName: 'SP_01014'
        },
        '01014B': {
          name: '01014B',
          x: 1273,
          y: 510,
          groupId: 'G_01014A_01014B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 13 },
          sensorAddr: { db: 'DBW1606', bit: 10 },
          trayIdAddr: 'DBW86',
          destinationAddr: 'DBW824',
          motorName: '01014B',
          sensorName: 'SP_01014'
        },
        '01020A': {
          name: '01020A',
          x: 1300,
          y: 510,
          groupId: 'G_01020A_01020B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 3 },
          sensorAddr: { db: 'DBW1608', bit: 1 },
          trayIdAddr: 'DBW108',
          destinationAddr: 'DBW846',
          motorName: '01020A',
          sensorName: 'SP_01020'
        },
        '01020B': {
          name: '01020B',
          x: 1300,
          y: 510,
          groupId: 'G_01020A_01020B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 3 },
          sensorAddr: { db: 'DBW1608', bit: 1 },
          trayIdAddr: 'DBW110',
          destinationAddr: 'DBW848',
          motorName: '01020B',
          sensorName: 'SP_01020'
        },
        '01015A': {
          name: '01015A',
          x: 1273,
          y: 570,
          groupId: 'G_01015A_01015B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 14 },
          sensorAddr: { db: 'DBW1606', bit: 11 },
          trayIdAddr: 'DBW88',
          destinationAddr: 'DBW826',
          motorName: '01015A',
          sensorName: 'SP_01015'
        },
        '01015B': {
          name: '01015B',
          x: 1273,
          y: 570,
          groupId: 'G_01015A_01015B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 14 },
          sensorAddr: { db: 'DBW1606', bit: 11 },
          trayIdAddr: 'DBW90',
          destinationAddr: 'DBW828',
          motorName: '01015B',
          sensorName: 'SP_01015'
        },
        '01021A': {
          name: '01021A',
          x: 1300,
          y: 570,
          groupId: 'G_01021A_01021B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 4 },
          sensorAddr: { db: 'DBW1608', bit: 2 },
          trayIdAddr: 'DBW112',
          destinationAddr: 'DBW1900',
          motorName: '01021A',
          sensorName: 'SP_01021'
        },
        '01021B': {
          name: '01021B',
          x: 1300,
          y: 570,
          groupId: 'G_01021A_01021B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 4 },
          sensorAddr: { db: 'DBW1608', bit: 2 },
          trayIdAddr: 'DBW114',
          destinationAddr: 'DBW1902',
          motorName: '01021B',
          sensorName: 'SP_01021'
        },
        '01016A': {
          name: '01016A',
          x: 1273,
          y: 620,
          groupId: 'G_01016A_01016B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 15 },
          sensorAddr: { db: 'DBW1606', bit: 12 },
          trayIdAddr: 'DBW92',
          destinationAddr: 'DBW830',
          motorName: '01016A',
          sensorName: 'SP_01016'
        },
        '01016B': {
          name: '01016B',
          x: 1273,
          y: 620,
          groupId: 'G_01016A_01016B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW6', bit: 15 },
          sensorAddr: { db: 'DBW1606', bit: 12 },
          trayIdAddr: 'DBW94',
          destinationAddr: 'DBW832',
          motorName: '01016B',
          sensorName: 'SP_01016'
        },
        '01022A': {
          name: '01022A',
          x: 1300,
          y: 620,
          groupId: 'G_01022A_01022B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 5 },
          sensorAddr: { db: 'DBW1608', bit: 3 },
          trayIdAddr: 'DBW116',
          destinationAddr: 'DBW1904',
          motorName: '01022A',
          sensorName: 'SP_01022'
        },
        '01022B': {
          name: '01022B',
          x: 1300,
          y: 620,
          groupId: 'G_01022A_01022B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 5 },
          sensorAddr: { db: 'DBW1608', bit: 3 },
          trayIdAddr: 'DBW118',
          destinationAddr: 'DBW1906',
          motorName: '01022B',
          sensorName: 'SP_01022'
        },
        '01017A': {
          name: '01017A',
          x: 1273,
          y: 670,
          groupId: 'G_01017A_01017B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 0 },
          sensorAddr: { db: 'DBW1606', bit: 13 },
          trayIdAddr: 'DBW96',
          destinationAddr: 'DBW834',
          motorName: '01017A',
          sensorName: 'SP_01017'
        },
        '01017B': {
          name: '01017B',
          x: 1300,
          y: 670,
          groupId: 'G_01017A_01017B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 0 },
          sensorAddr: { db: 'DBW1606', bit: 13 },
          trayIdAddr: 'DBW98',
          destinationAddr: 'DBW836',
          motorName: '01017B',
          sensorName: 'SP_01017'
        },
        '01023A': {
          name: '01023A',
          x: 1300,
          y: 670,
          groupId: 'G_01023A_01023B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 6 },
          sensorAddr: { db: 'DBW1608', bit: 4 },
          trayIdAddr: 'DBW1800',
          destinationAddr: 'DBW1908',
          motorName: '01023A',
          sensorName: 'SP_01023'
        },
        '01023B': {
          name: '01023B',
          x: 1300,
          y: 670,
          groupId: 'G_01023A_01023B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 6 },
          sensorAddr: { db: 'DBW1608', bit: 4 },
          trayIdAddr: 'DBW1802',
          destinationAddr: 'DBW1910',
          motorName: '01023B',
          sensorName: 'SP_01023'
        },
        '01018A': {
          name: '01018A',
          x: 1273,
          y: 720,
          groupId: 'G_01018A_01018B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 1 },
          sensorAddr: { db: 'DBW1606', bit: 14 },
          trayIdAddr: 'DBW100',
          destinationAddr: 'DBW838',
          motorName: '01018A',
          sensorName: 'SP_01018'
        },
        '01018B': {
          name: '01018B',
          x: 1300,
          y: 720,
          groupId: 'G_01018A_01018B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 1 },
          sensorAddr: { db: 'DBW1606', bit: 14 },
          trayIdAddr: 'DBW102',
          destinationAddr: 'DBW840',
          motorName: '01018B',
          sensorName: 'SP_01018'
        },
        '01024A': {
          name: '01024A',
          x: 1300,
          y: 720,
          groupId: 'G_01024A_01024B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 7 },
          sensorAddr: { db: 'DBW1608', bit: 5 },
          trayIdAddr: 'DBW1804',
          destinationAddr: 'DBW1912',
          motorName: '01024A',
          sensorName: 'SP_01024'
        },
        '01024B': {
          name: '01024B',
          x: 1300,
          y: 720,
          groupId: 'G_01024A_01024B',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 7 },
          sensorAddr: { db: 'DBW1608', bit: 5 },
          trayIdAddr: 'DBW1806',
          destinationAddr: 'DBW1914',
          motorName: '01024B',
          sensorName: 'SP_01024'
        },
        '01026': {
          name: '01026',
          x: 1273,
          y: 778,
          groupId: 'G_01026_01027',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 9 },
          sensorAddr: { db: 'DBW1608', bit: 6 },
          trayIdAddr: 'DBW1808',
          destinationAddr: 'DBW1916',
          motorName: '01026',
          sensorName: 'SP_01027'
        },
        '01027': {
          name: '01027',
          x: 1273,
          y: 778,
          groupId: 'G_01026_01027',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 10 },
          sensorAddr: { db: 'DBW1608', bit: 6 },
          trayIdAddr: 'DBW1810',
          destinationAddr: 'DBW1918',
          motorName: '01027',
          sensorName: 'SP_01027'
        },
        '01029': {
          name: '01029',
          x: 1300,
          y: 778,
          groupId: 'G_01029_01030',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 12 },
          sensorAddr: { db: 'DBW1608', bit: 7 },
          trayIdAddr: 'DBW1812',
          destinationAddr: 'DBW1920',
          motorName: '01029',
          sensorName: 'SP_01030'
        },
        '01030': {
          name: '01030',
          x: 1300,
          y: 778,
          groupId: 'G_01029_01030',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW8', bit: 13 },
          sensorAddr: { db: 'DBW1608', bit: 7 },
          trayIdAddr: 'DBW1814',
          destinationAddr: 'DBW1922',
          motorName: '01030',
          sensorName: 'SP_01030'
        },
        '02014': {
          name: '02014',
          x: 1195,
          y: 778,
          groupId: 'G_02014_02015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW10', bit: 13 },
          sensorAddr: { db: 'DBW1610', bit: 10 },
          trayIdAddr: 'DBW126',
          destinationAddr: 'DBW866',
          motorName: '02014',
          sensorName: 'SP_02014'
        },
        '02015': {
          name: '02015',
          x: 1195,
          y: 778,
          groupId: 'G_02014_02015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW10', bit: 14 },
          sensorAddr: { db: 'DBW1610', bit: 10 },
          trayIdAddr: 'DBW128',
          destinationAddr: 'DBW868',
          motorName: '02015',
          sensorName: 'SP_02014'
        },
        '02011': {
          name: '02011',
          x: 1220,
          y: 778,
          groupId: 'G_02011_02012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW10', bit: 10 },
          sensorAddr: { db: 'DBW1610', bit: 9 },
          trayIdAddr: 'DBW122',
          destinationAddr: 'DBW862',
          motorName: '02011',
          sensorName: 'SP_02011'
        },
        '02012': {
          name: '02012',
          x: 1220,
          y: 778,
          groupId: 'G_02011_02012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW10', bit: 11 },
          sensorAddr: { db: 'DBW1610', bit: 9 },
          trayIdAddr: 'DBW124',
          destinationAddr: 'DBW864',
          motorName: '02012',
          sensorName: 'SP_02011'
        },
        '02021': {
          name: '02021',
          x: 1120,
          y: 778,
          groupId: 'G_02021_02022',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 4 },
          sensorAddr: { db: 'DBW1610', bit: 13 },
          trayIdAddr: 'DBW136',
          destinationAddr: 'DBW876',
          motorName: '02021',
          sensorName: 'SP_02021'
        },
        '02022': {
          name: '02022',
          x: 1120,
          y: 778,
          groupId: 'G_02021_02022',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 5 },
          sensorAddr: { db: 'DBW1610', bit: 13 },
          trayIdAddr: 'DBW138',
          destinationAddr: 'DBW878',
          motorName: '02022',
          sensorName: 'SP_02021'
        },
        '02018': {
          name: '02018',
          x: 1145,
          y: 778,
          groupId: 'G_02018_02019',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 1 },
          sensorAddr: { db: 'DBW1610', bit: 12 },
          trayIdAddr: 'DBW132',
          destinationAddr: 'DBW872',
          motorName: '02018',
          sensorName: 'SP_02018'
        },
        '02019': {
          name: '02019',
          x: 1145,
          y: 778,
          groupId: 'G_02018_02019',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 2 },
          sensorAddr: { db: 'DBW1610', bit: 12 },
          trayIdAddr: 'DBW134',
          destinationAddr: 'DBW874',
          motorName: '02019',
          sensorName: 'SP_02018'
        },
        '03014': {
          name: '03014',
          x: 1048,
          y: 778,
          groupId: 'G_03014_03015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW16', bit: 13 },
          sensorAddr: { db: 'DBW1616', bit: 10 },
          trayIdAddr: 'DBW206',
          destinationAddr: 'DBW946',
          motorName: '03014',
          sensorName: 'SP_03014'
        },
        '03015': {
          name: '03015',
          x: 1048,
          y: 778,
          groupId: 'G_03014_03015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW16', bit: 14 },
          sensorAddr: { db: 'DBW1616', bit: 10 },
          trayIdAddr: 'DBW208',
          destinationAddr: 'DBW948',
          motorName: '03015',
          sensorName: 'SP_03014'
        },
        '03011': {
          name: '03011',
          x: 1073,
          y: 778,
          groupId: 'G_03011_03012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW16', bit: 10 },
          sensorAddr: { db: 'DBW1616', bit: 9 },
          trayIdAddr: 'DBW202',
          destinationAddr: 'DBW942',
          motorName: '03011',
          sensorName: 'SP_03011'
        },
        '03012': {
          name: '03012',
          x: 1073,
          y: 778,
          groupId: 'G_03011_03012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW16', bit: 11 },
          sensorAddr: { db: 'DBW1616', bit: 9 },
          trayIdAddr: 'DBW204',
          destinationAddr: 'DBW944',
          motorName: '03012',
          sensorName: 'SP_03011'
        },
        '03021': {
          name: '03021',
          x: 973,
          y: 778,
          groupId: 'G_03021_03022',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 4 },
          sensorAddr: { db: 'DBW1616', bit: 13 },
          trayIdAddr: 'DBW216',
          destinationAddr: 'DBW956',
          motorName: '03021',
          sensorName: 'SP_03021'
        },
        '03022': {
          name: '03022',
          x: 973,
          y: 778,
          groupId: 'G_03021_03022',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 5 },
          sensorAddr: { db: 'DBW1616', bit: 13 },
          trayIdAddr: 'DBW218',
          destinationAddr: 'DBW958',
          motorName: '03022',
          sensorName: 'SP_03021'
        },
        '03018': {
          name: '03018',
          x: 998,
          y: 778,
          groupId: 'G_03018_03019',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 1 },
          sensorAddr: { db: 'DBW1616', bit: 12 },
          trayIdAddr: 'DBW212',
          destinationAddr: 'DBW952',
          motorName: '03018',
          sensorName: 'SP_03018'
        },
        '03019': {
          name: '03019',
          x: 998,
          y: 778,
          groupId: 'G_03018_03019',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 2 },
          sensorAddr: { db: 'DBW1616', bit: 12 },
          trayIdAddr: 'DBW214',
          destinationAddr: 'DBW954',
          motorName: '03019',
          sensorName: 'SP_03018'
        },
        '04014': {
          name: '04014',
          x: 900,
          y: 778,
          groupId: 'G_04014_04015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW22', bit: 13 },
          sensorAddr: { db: 'DBW1622', bit: 10 },
          trayIdAddr: 'DBW286',
          destinationAddr: 'DBW1026',
          motorName: '04014',
          sensorName: 'SP_04014'
        },
        '04015': {
          name: '04015',
          x: 900,
          y: 778,
          groupId: 'G_04014_04015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW22', bit: 14 },
          sensorAddr: { db: 'DBW1622', bit: 10 },
          trayIdAddr: 'DBW288',
          destinationAddr: 'DBW1028',
          motorName: '04015',
          sensorName: 'SP_04014'
        },
        '04011': {
          name: '04011',
          x: 925,
          y: 778,
          groupId: 'G_04011_04012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW22', bit: 10 },
          sensorAddr: { db: 'DBW1622', bit: 9 },
          trayIdAddr: 'DBW282',
          destinationAddr: 'DBW1022',
          motorName: '04011',
          sensorName: 'SP_04011'
        },
        '04012': {
          name: '04012',
          x: 925,
          y: 778,
          groupId: 'G_04011_04012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW22', bit: 11 },
          sensorAddr: { db: 'DBW1622', bit: 9 },
          trayIdAddr: 'DBW284',
          destinationAddr: 'DBW1024',
          motorName: '04012',
          sensorName: 'SP_04011'
        },
        '04021': {
          name: '04021',
          x: 828,
          y: 778,
          groupId: 'G_04021_04022',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 4 },
          sensorAddr: { db: 'DBW1622', bit: 13 },
          trayIdAddr: 'DBW296',
          destinationAddr: 'DBW1036',
          motorName: '04021',
          sensorName: 'SP_04021'
        },
        '04022': {
          name: '04022',
          x: 828,
          y: 778,
          groupId: 'G_04021_04022',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 5 },
          sensorAddr: { db: 'DBW1622', bit: 13 },
          trayIdAddr: 'DBW298',
          destinationAddr: 'DBW1038',
          motorName: '04022',
          sensorName: 'SP_04021'
        },
        '04018': {
          name: '04018',
          x: 853,
          y: 778,
          groupId: 'G_04018_04019',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 1 },
          sensorAddr: { db: 'DBW1622', bit: 12 },
          trayIdAddr: 'DBW292',
          destinationAddr: 'DBW1032',
          motorName: '04018',
          sensorName: 'SP_04018'
        },
        '04019': {
          name: '04019',
          x: 853,
          y: 778,
          groupId: 'G_04018_04019',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 2 },
          sensorAddr: { db: 'DBW1622', bit: 12 },
          trayIdAddr: 'DBW294',
          destinationAddr: 'DBW1034',
          motorName: '04019',
          sensorName: 'SP_04018'
        },
        '05014': {
          name: '05014',
          x: 753,
          y: 778,
          groupId: 'G_05014_05015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW28', bit: 13 },
          sensorAddr: { db: 'DBW1628', bit: 10 },
          trayIdAddr: 'DBW366',
          destinationAddr: 'DBW1106',
          motorName: '05014',
          sensorName: 'SP_05014'
        },
        '05015': {
          name: '05015',
          x: 753,
          y: 778,
          groupId: 'G_05014_05015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW28', bit: 14 },
          sensorAddr: { db: 'DBW1628', bit: 10 },
          trayIdAddr: 'DBW368',
          destinationAddr: 'DBW1108',
          motorName: '05015',
          sensorName: 'SP_05014'
        },
        '05011': {
          name: '05011',
          x: 778,
          y: 778,
          groupId: 'G_05011_05012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW28', bit: 10 },
          sensorAddr: { db: 'DBW1628', bit: 9 },
          trayIdAddr: 'DBW362',
          destinationAddr: 'DBW1102',
          motorName: '05011',
          sensorName: 'SP_05011'
        },
        '05012': {
          name: '05012',
          x: 778,
          y: 778,
          groupId: 'G_05011_05012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW28', bit: 11 },
          sensorAddr: { db: 'DBW1628', bit: 9 },
          trayIdAddr: 'DBW364',
          destinationAddr: 'DBW1104',
          motorName: '05012',
          sensorName: 'SP_05011'
        },
        '05021': {
          name: '05021',
          x: 680,
          y: 778,
          groupId: 'G_05021_05022',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 4 },
          sensorAddr: { db: 'DBW1628', bit: 13 },
          trayIdAddr: 'DBW376',
          destinationAddr: 'DBW1116',
          motorName: '05021',
          sensorName: 'SP_05021'
        },
        '05022': {
          name: '05022',
          x: 680,
          y: 778,
          groupId: 'G_05021_05022',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 5 },
          sensorAddr: { db: 'DBW1628', bit: 13 },
          trayIdAddr: 'DBW378',
          destinationAddr: 'DBW1118',
          motorName: '05022',
          sensorName: 'SP_05021'
        },
        '05018': {
          name: '05018',
          x: 705,
          y: 778,
          groupId: 'G_05018_05019',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 1 },
          sensorAddr: { db: 'DBW1628', bit: 12 },
          trayIdAddr: 'DBW372',
          destinationAddr: 'DBW1112',
          motorName: '05018',
          sensorName: 'SP_05018'
        },
        '05019': {
          name: '05019',
          x: 705,
          y: 778,
          groupId: 'G_05018_05019',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 2 },
          sensorAddr: { db: 'DBW1628', bit: 12 },
          trayIdAddr: 'DBW374',
          destinationAddr: 'DBW1114',
          motorName: '05019',
          sensorName: 'SP_05018'
        },
        '06014': {
          name: '06014',
          x: 606,
          y: 778,
          groupId: 'G_06014_06015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW34', bit: 13 },
          sensorAddr: { db: 'DBW1634', bit: 10 },
          trayIdAddr: 'DBW446',
          destinationAddr: 'DBW1186',
          motorName: '06014',
          sensorName: 'SP_06014'
        },
        '06015': {
          name: '06015',
          x: 606,
          y: 778,
          groupId: 'G_06014_06015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW34', bit: 14 },
          sensorAddr: { db: 'DBW1634', bit: 10 },
          trayIdAddr: 'DBW448',
          destinationAddr: 'DBW1188',
          motorName: '06015',
          sensorName: 'SP_06014'
        },
        '06011': {
          name: '06011',
          x: 631,
          y: 778,
          groupId: 'G_06011_06012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW34', bit: 10 },
          sensorAddr: { db: 'DBW1634', bit: 9 },
          trayIdAddr: 'DBW442',
          destinationAddr: 'DBW1182',
          motorName: '06011',
          sensorName: 'SP_06011'
        },
        '06012': {
          name: '06012',
          x: 631,
          y: 778,
          groupId: 'G_06011_06012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW34', bit: 11 },
          sensorAddr: { db: 'DBW1634', bit: 9 },
          trayIdAddr: 'DBW444',
          destinationAddr: 'DBW1184',
          motorName: '06012',
          sensorName: 'SP_06011'
        },
        '06021': {
          name: '06021',
          x: 530,
          y: 778,
          groupId: 'G_06021_06022',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 4 },
          sensorAddr: { db: 'DBW1634', bit: 13 },
          trayIdAddr: 'DBW456',
          destinationAddr: 'DBW1196',
          motorName: '06021',
          sensorName: 'SP_06021'
        },
        '06022': {
          name: '06022',
          x: 530,
          y: 778,
          groupId: 'G_06021_06022',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 5 },
          sensorAddr: { db: 'DBW1634', bit: 13 },
          trayIdAddr: 'DBW458',
          destinationAddr: 'DBW1198',
          motorName: '06022',
          sensorName: 'SP_06021'
        },
        '06018': {
          name: '06018',
          x: 556,
          y: 778,
          groupId: 'G_06018_06019',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 1 },
          sensorAddr: { db: 'DBW1634', bit: 12 },
          trayIdAddr: 'DBW452',
          destinationAddr: 'DBW1192',
          motorName: '06018',
          sensorName: 'SP_06018'
        },
        '06019': {
          name: '06019',
          x: 556,
          y: 778,
          groupId: 'G_06018_06019',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 2 },
          sensorAddr: { db: 'DBW1634', bit: 12 },
          trayIdAddr: 'DBW454',
          destinationAddr: 'DBW1194',
          motorName: '06019',
          sensorName: 'SP_06019'
        },
        '07014': {
          name: '07014',
          x: 460,
          y: 778,
          groupId: 'G_07014_07015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW40', bit: 13 },
          sensorAddr: { db: 'DBW1640', bit: 10 },
          trayIdAddr: 'DBW526',
          destinationAddr: 'DBW1266',
          motorName: '07014',
          sensorName: 'SP_07014'
        },
        '07015': {
          name: '07015',
          x: 460,
          y: 778,
          groupId: 'G_07014_07015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW40', bit: 14 },
          sensorAddr: { db: 'DBW1640', bit: 10 },
          trayIdAddr: 'DBW528',
          destinationAddr: 'DBW1268',
          motorName: '07015',
          sensorName: 'SP_07015'
        },
        '07011': {
          name: '07011',
          x: 486,
          y: 778,
          groupId: 'G_07011_07012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW40', bit: 10 },
          sensorAddr: { db: 'DBW1640', bit: 9 },
          trayIdAddr: 'DBW522',
          destinationAddr: 'DBW1262',
          motorName: '07011',
          sensorName: 'SP_07011'
        },
        '07012': {
          name: '07012',
          x: 486,
          y: 778,
          groupId: 'G_07011_07012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW40', bit: 11 },
          sensorAddr: { db: 'DBW1640', bit: 9 },
          trayIdAddr: 'DBW524',
          destinationAddr: 'DBW1264',
          motorName: '07012',
          sensorName: 'SP_07011'
        },
        '07021': {
          name: '07021',
          x: 386,
          y: 778,
          groupId: 'G_07021_07022',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW44', bit: 4 },
          sensorAddr: { db: 'DBW1640', bit: 13 },
          trayIdAddr: 'DBW536',
          destinationAddr: 'DBW1276',
          motorName: '07021',
          sensorName: 'SP_07021'
        },
        '07022': {
          name: '07022',
          x: 386,
          y: 778,
          groupId: 'G_07021_07022',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW44', bit: 5 },
          sensorAddr: { db: 'DBW1640', bit: 13 },
          trayIdAddr: 'DBW538',
          destinationAddr: 'DBW1278',
          motorName: '07022',
          sensorName: 'SP_07021'
        },
        '07018': {
          name: '07018',
          x: 411,
          y: 778,
          groupId: 'G_07018_07019',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW44', bit: 1 },
          sensorAddr: { db: 'DBW1640', bit: 12 },
          trayIdAddr: 'DBW532',
          destinationAddr: 'DBW1272',
          motorName: '07018',
          sensorName: 'SP_07018'
        },
        '07019': {
          name: '07019',
          x: 411,
          y: 778,
          groupId: 'G_07018_07019',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW44', bit: 2 },
          sensorAddr: { db: 'DBW1640', bit: 12 },
          trayIdAddr: 'DBW534',
          destinationAddr: 'DBW1274',
          motorName: '07019',
          sensorName: 'SP_07018'
        },
        '08014': {
          name: '08014',
          x: 315,
          y: 778,
          groupId: 'G_08014_08015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW46', bit: 13 },
          sensorAddr: { db: 'DBW1646', bit: 10 },
          trayIdAddr: 'DBW606',
          destinationAddr: 'DBW1346',
          motorName: '08014',
          sensorName: 'SP_08014'
        },
        '08015': {
          name: '08015',
          x: 315,
          y: 778,
          groupId: 'G_08014_08015',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW46', bit: 14 },
          sensorAddr: { db: 'DBW1646', bit: 10 },
          trayIdAddr: 'DBW608',
          destinationAddr: 'DBW1348',
          motorName: '08015',
          sensorName: 'SP_08014'
        },
        '08011': {
          name: '08011',
          x: 341,
          y: 778,
          groupId: 'G_08011_08012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW46', bit: 10 },
          sensorAddr: { db: 'DBW1646', bit: 9 },
          trayIdAddr: 'DBW602',
          destinationAddr: 'DBW1342',
          motorName: '08011',
          sensorName: 'SP_08011'
        },
        '08012': {
          name: '08012',
          x: 341,
          y: 778,
          groupId: 'G_08011_08012',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW46', bit: 11 },
          sensorAddr: { db: 'DBW1646', bit: 9 },
          trayIdAddr: 'DBW604',
          destinationAddr: 'DBW1344',
          motorName: '08012',
          sensorName: 'SP_08011'
        },
        '08021': {
          name: '08021',
          x: 240,
          y: 778,
          showTray: true,
          groupId: 'G_08021_08022',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 4 },
          sensorAddr: { db: 'DBW1646', bit: 13 },
          trayIdAddr: 'DBW616',
          destinationAddr: 'DBW1356',
          motorName: '08021',
          sensorName: 'SP_08021'
        },
        '08022': {
          name: '08022',
          x: 240,
          y: 778,
          showTray: true,
          groupId: 'G_08021_08022',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 5 },
          sensorAddr: { db: 'DBW1646', bit: 13 },
          trayIdAddr: 'DBW618',
          destinationAddr: 'DBW1358',
          motorName: '08022',
          sensorName: 'SP_08021'
        },
        '08018': {
          name: '08018',
          x: 266,
          y: 778,
          showTray: true,
          groupId: 'G_08018_08019',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 1 },
          sensorAddr: { db: 'DBW1646', bit: 12 },
          trayIdAddr: 'DBW612',
          destinationAddr: 'DBW1352',
          motorName: '08018',
          sensorName: 'SP_08018'
        },
        '08019': {
          name: '08019',
          x: 266,
          y: 778,
          showTray: true,
          groupId: 'G_08018_08019',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 2 },
          sensorAddr: { db: 'DBW1646', bit: 12 },
          trayIdAddr: 'DBW614',
          destinationAddr: 'DBW1354',
          motorName: '08019',
          sensorName: 'SP_08018'
        },
        '09010': {
          name: '09010',
          x: 165,
          y: 778,
          groupId: 'G_09010_09011',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW52', bit: 9 },
          sensorAddr: { db: 'DBW1652', bit: 6 },
          trayIdAddr: 'DBW686',
          destinationAddr: 'DBW1426',
          motorName: '09010',
          sensorName: 'SP_09010'
        },
        '09011': {
          name: '09011',
          x: 165,
          y: 778,
          groupId: 'G_09010_09011',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW52', bit: 10 },
          sensorAddr: { db: 'DBW1652', bit: 6 },
          trayIdAddr: 'DBW688',
          destinationAddr: 'DBW1428',
          motorName: '09011',
          sensorName: 'SP_09010'
        },
        '09007': {
          name: '09007',
          x: 191,
          y: 778,
          groupId: 'G_09007_09008',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW52', bit: 6 },
          sensorAddr: { db: 'DBW1652', bit: 5 },
          trayIdAddr: 'DBW682',
          destinationAddr: 'DBW1422',
          motorName: '09007',
          sensorName: 'SP_09007'
        },
        '09008': {
          name: '09008',
          x: 191,
          y: 778,
          groupId: 'G_09007_09008',
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW52', bit: 7 },
          sensorAddr: { db: 'DBW1652', bit: 5 },
          trayIdAddr: 'DBW684',
          destinationAddr: 'DBW1424',
          motorName: '09008',
          sensorName: 'SP_09007'
        },
        // // 以下为预热第一排的光电信号
        '02002SP': {
          name: 'SP02002-1',
          x: 1195,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1610', bit: 2 },
          sensorName: 'SP02002-1'
        },
        '02001SP': {
          name: 'SP02001-1',
          x: 1220,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1610', bit: 0 },
          sensorName: 'SP02001-1'
        },
        '02004SP': {
          name: 'SP02004-1',
          x: 1120,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1610', bit: 6 },
          sensorName: 'SP02004-1'
        },
        '02003SP': {
          name: 'SP02003-1',
          x: 1145,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1610', bit: 4 },
          sensorName: 'SP02003-1'
        },
        '03002SP': {
          name: 'SP03002-1',
          x: 1048,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1616', bit: 2 },
          sensorName: 'SP03002-1'
        },
        '03001SP': {
          name: 'SP03001-1',
          x: 1073,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1616', bit: 0 },
          sensorName: 'SP03001-1'
        },
        '03004SP': {
          name: 'SP03004-1',
          x: 973,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1616', bit: 6 },
          sensorName: 'SP03004-1'
        },
        '03003SP': {
          name: 'SP03003-1',
          x: 998,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1616', bit: 4 },
          sensorName: 'SP03003-1'
        },
        '04002SP': {
          name: 'SP04002-1',
          x: 900,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1622', bit: 2 },
          sensorName: 'SP04002-1'
        },
        '04001SP': {
          name: 'SP04001-1',
          x: 925,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1622', bit: 0 },
          sensorName: 'SP04001-1'
        },
        '04004SP': {
          name: 'SP04004-1',
          x: 828,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1622', bit: 6 },
          sensorName: 'SP04004-1'
        },
        '04003SP': {
          name: 'SP04003-1',
          x: 853,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1622', bit: 4 },
          sensorName: 'SP04003-1'
        },
        '05002SP': {
          name: 'SP05002-1',
          x: 753,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1628', bit: 2 },
          sensorName: 'SP05002-1'
        },
        '05001SP': {
          name: 'SP05001-1',
          x: 778,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1628', bit: 0 },
          sensorName: 'SP05001-1'
        },
        '05004SP': {
          name: 'SP05004-1',
          x: 680,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1628', bit: 6 },
          sensorName: 'SP05004-1'
        },
        '05003SP': {
          name: 'SP05003-1',
          x: 705,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1628', bit: 4 },
          sensorName: 'SP05003-1'
        },
        '06002SP': {
          name: 'SP06002-1',
          x: 606,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1634', bit: 2 },
          sensorName: 'SP06002-1'
        },
        '06001SP': {
          name: 'SP06001-1',
          x: 631,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1634', bit: 0 },
          sensorName: 'SP06001-1'
        },
        '06004SP': {
          name: 'SP06004-1',
          x: 530,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1634', bit: 6 },
          sensorName: 'SP06004-1'
        },
        '06003SP': {
          name: 'SP06003-1',
          x: 556,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1634', bit: 4 },
          sensorName: 'SP06003-1'
        },
        '07002SP': {
          name: 'SP07002-1',
          x: 460,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1640', bit: 2 },
          sensorName: 'SP07002-1'
        },
        '07001SP': {
          name: 'SP07001-1',
          x: 486,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1640', bit: 0 },
          sensorName: 'SP07001-1'
        },
        '07004SP': {
          name: 'SP07004-1',
          x: 386,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1640', bit: 6 },
          sensorName: 'SP07004-1'
        },
        '07003SP': {
          name: 'SP07003-1',
          x: 411,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1640', bit: 4 },
          sensorName: 'SP07003-1'
        },
        '08002SP': {
          name: 'SP08002-1',
          x: 315,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1646', bit: 2 },
          sensorName: 'SP08002-1'
        },
        '08001SP': {
          name: 'SP08001-1',
          x: 341,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1646', bit: 0 },
          sensorName: 'SP08001-1'
        },
        '08004SP': {
          name: 'SP08004-1',
          x: 240,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1646', bit: 6 },
          sensorName: 'SP08004-1'
        },
        '08003SP': {
          name: 'SP08003-1',
          x: 266,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1646', bit: 4 },
          sensorName: 'SP08003-1'
        },
        '09002SP': {
          name: 'SP09002-1',
          x: 165,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1652', bit: 2 },
          sensorName: 'SP09002-1'
        },
        '09001SP': {
          name: 'SP09001-1',
          x: 191,
          y: 735,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1652', bit: 0 },
          sensorName: 'SP09001-1'
        },
        // // 以上为预热第一排的光电信号
        // 以下为预热第二排的光电信号
        '02002': {
          name: '02002',
          x: 1195,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW10', bit: 1 },
          sensorAddr: { db: 'DBW1610', bit: 3 },
          motorName: '02002',
          sensorName: 'SP02002-2'
        },
        '02001': {
          name: '02001',
          x: 1220,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW10', bit: 0 },
          sensorAddr: { db: 'DBW1610', bit: 1 },
          motorName: '02001',
          sensorName: 'SP02001-2'
        },
        '02004': {
          name: '02004',
          x: 1120,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW10', bit: 3 },
          sensorAddr: { db: 'DBW1610', bit: 7 },
          motorName: '02004',
          sensorName: 'SP02004-2'
        },
        '02003': {
          name: '02003',
          x: 1145,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW10', bit: 2 },
          sensorAddr: { db: 'DBW1610', bit: 5 },
          motorName: '02003',
          sensorName: 'SP02003-2'
        },
        '03002': {
          name: '03002',
          x: 1048,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW16', bit: 1 },
          sensorAddr: { db: 'DBW1616', bit: 3 },
          motorName: '03002',
          sensorName: 'SP03002-2'
        },
        '03001': {
          name: '03001',
          x: 1073,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW16', bit: 0 },
          sensorAddr: { db: 'DBW1616', bit: 1 },
          motorName: '03001',
          sensorName: 'SP03001-2'
        },
        '03004': {
          name: '03004',
          x: 973,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW16', bit: 3 },
          sensorAddr: { db: 'DBW1616', bit: 7 },
          motorName: '03004',
          sensorName: 'SP03004-2'
        },
        '03003': {
          name: '03003',
          x: 998,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW16', bit: 2 },
          sensorAddr: { db: 'DBW1616', bit: 5 },
          motorName: '03003',
          sensorName: 'SP03003-2'
        },
        '04002': {
          name: '04002',
          x: 900,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW22', bit: 1 },
          sensorAddr: { db: 'DBW1622', bit: 3 },
          motorName: '04002',
          sensorName: 'SP04002-2'
        },
        '04001': {
          name: '04001',
          x: 925,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW22', bit: 0 },
          sensorAddr: { db: 'DBW1622', bit: 1 },
          motorName: '04001',
          sensorName: 'SP04001-2'
        },
        '04004': {
          name: '04004',
          x: 828,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW22', bit: 3 },
          sensorAddr: { db: 'DBW1622', bit: 7 },
          motorName: '04004',
          sensorName: 'SP04004-2'
        },
        '04003': {
          name: '04003',
          x: 853,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW22', bit: 2 },
          sensorAddr: { db: 'DBW1622', bit: 5 },
          motorName: '04003',
          sensorName: 'SP04003-2'
        },
        '05002': {
          name: '05002',
          x: 753,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW28', bit: 1 },
          sensorAddr: { db: 'DBW1628', bit: 3 },
          motorName: '05002',
          sensorName: 'SP05002-2'
        },
        '05001': {
          name: '05001',
          x: 778,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW28', bit: 0 },
          sensorAddr: { db: 'DBW1628', bit: 1 },
          motorName: '05001',
          sensorName: 'SP05001-2'
        },
        '05004': {
          name: '05004',
          x: 680,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW28', bit: 3 },
          sensorAddr: { db: 'DBW1628', bit: 7 },
          motorName: '05004',
          sensorName: 'SP05004-2'
        },
        '05003': {
          name: '05003',
          x: 705,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW28', bit: 2 },
          sensorAddr: { db: 'DBW1628', bit: 5 },
          motorName: '05003',
          sensorName: 'SP05003-2'
        },
        '06002': {
          name: '06002',
          x: 606,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW34', bit: 1 },
          sensorAddr: { db: 'DBW1634', bit: 3 },
          motorName: '06002',
          sensorName: 'SP06002-2'
        },
        '06001': {
          name: '06001',
          x: 631,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW34', bit: 0 },
          sensorAddr: { db: 'DBW1634', bit: 1 },
          motorName: '06001',
          sensorName: 'SP06001-2'
        },
        '06004': {
          name: '06004',
          x: 530,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW34', bit: 3 },
          sensorAddr: { db: 'DBW1634', bit: 7 },
          motorName: '06004',
          sensorName: 'SP06004-2'
        },
        '06003': {
          name: '06003',
          x: 556,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW34', bit: 2 },
          sensorAddr: { db: 'DBW1634', bit: 5 },
          motorName: '06003',
          sensorName: 'SP06003-2'
        },
        '07002': {
          name: '07002',
          x: 460,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW40', bit: 1 },
          sensorAddr: { db: 'DBW1640', bit: 3 },
          motorName: '07002',
          sensorName: 'SP07002-2'
        },
        '07001': {
          name: '07001',
          x: 486,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW40', bit: 0 },
          sensorAddr: { db: 'DBW1640', bit: 1 },
          motorName: '07001',
          sensorName: 'SP07001-2'
        },
        '07004': {
          name: '07004',
          x: 386,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW40', bit: 3 },
          sensorAddr: { db: 'DBW1640', bit: 7 },
          motorName: '07004',
          sensorName: 'SP07004-2'
        },
        '07003': {
          name: '07003',
          x: 411,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW40', bit: 2 },
          sensorAddr: { db: 'DBW1640', bit: 5 },
          motorName: '07003',
          sensorName: 'SP07003-2'
        },
        '08002': {
          name: '08002',
          x: 315,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW46', bit: 1 },
          sensorAddr: { db: 'DBW1646', bit: 3 },
          motorName: '08002',
          sensorName: 'SP08002-2'
        },
        '08001': {
          name: '08001',
          x: 341,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW46', bit: 0 },
          sensorAddr: { db: 'DBW1646', bit: 1 },
          motorName: '08001',
          sensorName: 'SP08001-2'
        },
        '08004': {
          name: '08004',
          x: 240,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW46', bit: 3 },
          sensorAddr: { db: 'DBW1646', bit: 7 },
          motorName: '08004',
          sensorName: 'SP08004-2'
        },
        '08003': {
          name: '08003',
          x: 266,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW46', bit: 2 },
          sensorAddr: { db: 'DBW1646', bit: 5 },
          motorName: '08003',
          sensorName: 'SP08003-2'
        },
        '09002': {
          name: '09002',
          x: 165,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW52', bit: 1 },
          sensorAddr: { db: 'DBW1652', bit: 3 },
          motorName: '09002',
          sensorName: 'SP09004-2'
        },
        '09001': {
          name: '09001',
          x: 191,
          y: 490,
          motorStatus: false,
          sensorStatus: false,
          motorAddr: { db: 'DBW52', bit: 0 },
          sensorAddr: { db: 'DBW1652', bit: 1 },
          motorName: '09001',
          sensorName: 'SP09003-2'
        },
        // 以下为预热第三排的电机信号
        '02006': {
          name: '02006',
          x: 1195,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW10', bit: 5 },
          motorName: '02006'
        },
        '02005': {
          name: '02005',
          x: 1220,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW10', bit: 4 },
          motorName: '02005'
        },
        '02008': {
          name: '02008',
          x: 1120,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW10', bit: 7 },
          motorName: '02008'
        },
        '02007': {
          name: '02007',
          x: 1145,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW10', bit: 6 },
          motorName: '02007'
        },
        '03006': {
          name: '03006',
          x: 1048,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW16', bit: 5 },
          motorName: '03006'
        },
        '03005': {
          name: '03005',
          x: 1073,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW16', bit: 4 },
          motorName: '03005'
        },
        '03008': {
          name: '03008',
          x: 973,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW16', bit: 7 },
          motorName: '03008'
        },
        '03007': {
          name: '03007',
          x: 998,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW16', bit: 6 },
          motorName: '03007'
        },
        '04006': {
          name: '04006',
          x: 900,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW22', bit: 5 },
          motorName: '04006'
        },
        '04005': {
          name: '04005',
          x: 925,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW22', bit: 4 },
          motorName: '04005'
        },
        '04008': {
          name: '04008',
          x: 828,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW22', bit: 7 },
          motorName: '04008'
        },
        '04007': {
          name: '04007',
          x: 853,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW22', bit: 6 },
          motorName: '04007'
        },
        '05006': {
          name: '05006',
          x: 753,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW28', bit: 5 },
          motorName: '05006'
        },
        '05005': {
          name: '05005',
          x: 778,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW28', bit: 4 },
          motorName: '05005'
        },
        '05008': {
          name: '05008',
          x: 680,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW28', bit: 7 },
          motorName: '05008'
        },
        '05007': {
          name: '05007',
          x: 705,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW28', bit: 6 },
          motorName: '05007'
        },
        '06006': {
          name: '06006',
          x: 606,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW34', bit: 5 },
          motorName: '06006'
        },
        '06005': {
          name: '06005',
          x: 631,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW34', bit: 4 },
          motorName: '06005'
        },
        '06008': {
          name: '06008',
          x: 530,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW34', bit: 7 },
          motorName: '06008'
        },
        '06007': {
          name: '06007',
          x: 556,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW34', bit: 6 },
          motorName: '06007'
        },
        '07006': {
          name: '07006',
          x: 460,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW40', bit: 5 },
          motorName: '07006'
        },
        '07005': {
          name: '07005',
          x: 486,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW40', bit: 4 },
          motorName: '07005'
        },
        '07008': {
          name: '07008',
          x: 386,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW40', bit: 7 },
          motorName: '07008'
        },
        '07007': {
          name: '07007',
          x: 411,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW40', bit: 6 },
          motorName: '07007'
        },
        '08006': {
          name: '08006',
          x: 315,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW46', bit: 5 },
          motorName: '08006'
        },
        '08005': {
          name: '08005',
          x: 341,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW46', bit: 4 },
          motorName: '08005'
        },
        '08008': {
          name: '08008',
          x: 240,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW46', bit: 7 },
          motorName: '08008'
        },
        '08007': {
          name: '08007',
          x: 266,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW46', bit: 6 },
          motorName: '08007'
        },
        '09004': {
          name: '09004',
          x: 165,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW52', bit: 3 },
          motorName: '09004'
        },
        '09003': {
          name: '09003',
          x: 191,
          y: 180,
          motorStatus: false,
          motorAddr: { db: 'DBW52', bit: 2 },
          motorName: '09003'
        },
        // 以上为第三排电机信号
        // 以下为出货/电机光电信号
        '02028': {
          name: '02028',
          x: 1195,
          y: 132,
          groupId: 'G_02028_02029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 11 },
          sensorAddr: { db: 'DBW1612', bit: 3 },
          trayIdAddr: 'DBW146',
          destinationAddr: 'DBW886',
          motorName: '02028',
          sensorName: 'SP_02028-2'
        },
        '02029': {
          name: '02029',
          groupId: 'G_02028_02029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 12 },
          sensorAddr: { db: 'DBW1612', bit: 2 },
          trayIdAddr: 'DBW148',
          destinationAddr: 'DBW888',
          motorName: '02029',
          sensorName: 'SP_02028-1'
        },
        '02025': {
          name: '02025',
          x: 1220,
          y: 132,
          groupId: 'G_02025_02026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 8 },
          sensorAddr: { db: 'DBW1612', bit: 1 },
          trayIdAddr: 'DBW142',
          destinationAddr: 'DBW882',
          motorName: '02025',
          sensorName: 'SP_02025-2'
        },
        '02026': {
          name: '02026',
          groupId: 'G_02025_02026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 9 },
          sensorAddr: { db: 'DBW1612', bit: 0 },
          trayIdAddr: 'DBW144',
          destinationAddr: 'DBW884',
          motorName: '02026',
          sensorName: 'SP_02025-1'
        },
        '02035': {
          name: '02035',
          x: 1120,
          y: 132,
          groupId: 'G_02035_02036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW14', bit: 2 },
          sensorAddr: { db: 'DBW1612', bit: 9 },
          trayIdAddr: 'DBW156',
          destinationAddr: 'DBW896',
          motorName: '02035',
          sensorName: 'SP_02035-2'
        },
        '02036': {
          name: '02036',
          groupId: 'G_02035_02036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW14', bit: 3 },
          sensorAddr: { db: 'DBW1612', bit: 8 },
          trayIdAddr: 'DBW158',
          destinationAddr: 'DBW898',
          motorName: '02036',
          sensorName: 'SP_02035-1'
        },
        '02032': {
          name: '02032',
          x: 1145,
          y: 132,
          groupId: 'G_02032_02033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 15 },
          sensorAddr: { db: 'DBW1612', bit: 7 },
          trayIdAddr: 'DBW152',
          destinationAddr: 'DBW892',
          motorName: '02032',
          sensorName: 'SP_02032-2'
        },
        '02033': {
          name: '02033',
          groupId: 'G_02032_02033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW14', bit: 0 },
          sensorAddr: { db: 'DBW1612', bit: 6 },
          trayIdAddr: 'DBW154',
          destinationAddr: 'DBW894',
          motorName: '02033',
          sensorName: 'SP_02032-1'
        },
        '03028': {
          name: '03028',
          x: 1048,
          y: 132,
          groupId: 'G_03028_03029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 11 },
          sensorAddr: { db: 'DBW1618', bit: 3 },
          trayIdAddr: 'DBW226',
          destinationAddr: 'DBW966',
          motorName: '03028',
          sensorName: 'SP_03028-2'
        },
        '03029': {
          name: '03029',
          groupId: 'G_03028_03029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 12 },
          sensorAddr: { db: 'DBW1618', bit: 2 },
          trayIdAddr: 'DBW228',
          destinationAddr: 'DBW968',
          motorName: '03029',
          sensorName: 'SP_03028-1'
        },
        '03025': {
          name: '03025',
          x: 1073,
          y: 132,
          groupId: 'G_03025_03026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 8 },
          sensorAddr: { db: 'DBW1618', bit: 1 },
          trayIdAddr: 'DBW222',
          destinationAddr: 'DBW962',
          motorName: '03025',
          sensorName: 'SP_03025-2'
        },
        '03026': {
          name: '03026',
          groupId: 'G_03025_03026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 9 },
          sensorAddr: { db: 'DBW1618', bit: 0 },
          trayIdAddr: 'DBW224',
          destinationAddr: 'DBW964',
          motorName: '03026',
          sensorName: 'SP_03025-1'
        },
        '03035': {
          name: '03035',
          x: 973,
          y: 132,
          groupId: 'G_03035_03036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW20', bit: 2 },
          sensorAddr: { db: 'DBW1618', bit: 9 },
          trayIdAddr: 'DBW236',
          destinationAddr: 'DBW976',
          motorName: '03035',
          sensorName: 'SP_03035-2'
        },
        '03036': {
          name: '03036',
          groupId: 'G_03035_03036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW20', bit: 3 },
          sensorAddr: { db: 'DBW1618', bit: 8 },
          trayIdAddr: 'DBW238',
          destinationAddr: 'DBW978',
          motorName: '03036',
          sensorName: 'SP_03035-1'
        },
        '03032': {
          name: '03032',
          x: 998,
          y: 132,
          groupId: 'G_03032_03033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 15 },
          sensorAddr: { db: 'DBW1618', bit: 7 },
          trayIdAddr: 'DBW232',
          destinationAddr: 'DBW972',
          motorName: '03032',
          sensorName: 'SP_03032-2'
        },
        '03033': {
          name: '03033',
          groupId: 'G_03032_03033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW20', bit: 0 },
          sensorAddr: { db: 'DBW1618', bit: 6 },
          trayIdAddr: 'DBW234',
          destinationAddr: 'DBW974',
          motorName: '03033',
          sensorName: 'SP_03032-1'
        },
        '04028': {
          name: '04028',
          x: 900,
          y: 132,
          groupId: 'G_04028_04029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 11 },
          sensorAddr: { db: 'DBW1624', bit: 3 },
          trayIdAddr: 'DBW306',
          destinationAddr: 'DBW1046',
          motorName: '04028',
          sensorName: 'SP_04028-2'
        },
        '04029': {
          name: '04029',
          groupId: 'G_04028_04029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 12 },
          sensorAddr: { db: 'DBW1624', bit: 2 },
          trayIdAddr: 'DBW308',
          destinationAddr: 'DBW1048',
          motorName: '04029',
          sensorName: 'SP_04028-1'
        },
        '04025': {
          name: '04025',
          x: 925,
          y: 132,
          groupId: 'G_04025_04026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 8 },
          sensorAddr: { db: 'DBW1624', bit: 1 },
          trayIdAddr: 'DBW302',
          destinationAddr: 'DBW1042',
          motorName: '04025',
          sensorName: 'SP_04025-2'
        },
        '04026': {
          name: '04026',
          groupId: 'G_04025_04026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 9 },
          sensorAddr: { db: 'DBW1624', bit: 0 },
          trayIdAddr: 'DBW304',
          destinationAddr: 'DBW1044',
          motorName: '04026',
          sensorName: 'SP_04025-1'
        },
        '04035': {
          name: '04035',
          x: 825,
          y: 132,
          groupId: 'G_04035_04036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW26', bit: 2 },
          sensorAddr: { db: 'DBW1624', bit: 9 },
          trayIdAddr: 'DBW316',
          destinationAddr: 'DBW1056',
          motorName: '04035',
          sensorName: 'SP_04035-2'
        },
        '04036': {
          name: '04036',
          groupId: 'G_04035_04036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW26', bit: 3 },
          sensorAddr: { db: 'DBW1624', bit: 8 },
          trayIdAddr: 'DBW318',
          destinationAddr: 'DBW1058',
          motorName: '04036',
          sensorName: 'SP_04035-1'
        },
        '04032': {
          name: '04032',
          x: 853,
          y: 132,
          groupId: 'G_04032_04033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 15 },
          sensorAddr: { db: 'DBW1624', bit: 7 },
          trayIdAddr: 'DBW312',
          destinationAddr: 'DBW1052',
          motorName: '04032',
          sensorName: 'SP_04032-2'
        },
        '04033': {
          name: '04033',
          groupId: 'G_04032_04033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW26', bit: 0 },
          sensorAddr: { db: 'DBW1624', bit: 6 },
          trayIdAddr: 'DBW314',
          destinationAddr: 'DBW1054',
          motorName: '04033',
          sensorName: 'SP_04032-1'
        },
        '05028': {
          name: '05028',
          x: 753,
          y: 132,
          groupId: 'G_05028_05029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 11 },
          sensorAddr: { db: 'DBW1630', bit: 3 },
          trayIdAddr: 'DBW386',
          destinationAddr: 'DBW1126',
          motorName: '05028',
          sensorName: 'SP_05028-2'
        },
        '05029': {
          name: '05029',
          groupId: 'G_05028_05029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 12 },
          sensorAddr: { db: 'DBW1630', bit: 2 },
          trayIdAddr: 'DBW388',
          destinationAddr: 'DBW1128',
          motorName: '05029',
          sensorName: 'SP_05028-1'
        },
        '05025': {
          name: '05025',
          x: 778,
          y: 132,
          groupId: 'G_05025_05026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 8 },
          sensorAddr: { db: 'DBW1630', bit: 1 },
          trayIdAddr: 'DBW382',
          destinationAddr: 'DBW1122',
          motorName: '05025',
          sensorName: 'SP_05025-2'
        },
        '05026': {
          name: '05026',
          groupId: 'G_05025_05026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 9 },
          sensorAddr: { db: 'DBW1630', bit: 0 },
          trayIdAddr: 'DBW384',
          destinationAddr: 'DBW1124',
          motorName: '05026',
          sensorName: 'SP_05025-1'
        },
        '05035': {
          name: '05035',
          x: 680,
          y: 132,
          groupId: 'G_05035_05036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW32', bit: 2 },
          sensorAddr: { db: 'DBW1630', bit: 9 },
          trayIdAddr: 'DBW396',
          destinationAddr: 'DBW1136',
          motorName: '05035',
          sensorName: 'SP_05035-2'
        },
        '05036': {
          name: '05036',
          groupId: 'G_05035_05036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW32', bit: 3 },
          sensorAddr: { db: 'DBW1630', bit: 8 },
          trayIdAddr: 'DBW398',
          destinationAddr: 'DBW1138',
          motorName: '05036',
          sensorName: 'SP_05035-1'
        },
        '05032': {
          name: '05032',
          x: 705,
          y: 132,
          groupId: 'G_05032_05033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 15 },
          sensorAddr: { db: 'DBW1630', bit: 7 },
          trayIdAddr: 'DBW392',
          destinationAddr: 'DBW1132',
          motorName: '05032',
          sensorName: 'SP_05032-2'
        },
        '05033': {
          name: '05033',
          groupId: 'G_05032_05033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW32', bit: 0 },
          sensorAddr: { db: 'DBW1630', bit: 6 },
          trayIdAddr: 'DBW394',
          destinationAddr: 'DBW1134',
          motorName: '05033',
          sensorName: 'SP_05032-1'
        },
        '06028': {
          name: '06028',
          x: 606,
          y: 132,
          groupId: 'G_06028_06029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 11 },
          sensorAddr: { db: 'DBW1636', bit: 3 },
          trayIdAddr: 'DBW466',
          destinationAddr: 'DBW1206',
          motorName: '06028',
          sensorName: 'SP_06028-2'
        },
        '06029': {
          name: '06029',
          groupId: 'G_06028_06029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 12 },
          sensorAddr: { db: 'DBW1636', bit: 2 },
          trayIdAddr: 'DBW468',
          destinationAddr: 'DBW1208',
          motorName: '06029',
          sensorName: 'SP_06028-1'
        },
        '06025': {
          name: '06025',
          x: 631,
          y: 132,
          groupId: 'G_06025_06026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 8 },
          sensorAddr: { db: 'DBW1636', bit: 1 },
          trayIdAddr: 'DBW462',
          destinationAddr: 'DBW1202',
          motorName: '06025',
          sensorName: 'SP_06025-2'
        },
        '06026': {
          name: '06026',
          groupId: 'G_06025_06026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 9 },
          sensorAddr: { db: 'DBW1636', bit: 0 },
          trayIdAddr: 'DBW464',
          destinationAddr: 'DBW1204',
          motorName: '06026',
          sensorName: 'SP_06025-1'
        },
        '06035': {
          name: '06035',
          x: 530,
          y: 132,
          groupId: 'G_06035_06036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW38', bit: 2 },
          sensorAddr: { db: 'DBW1636', bit: 9 },
          trayIdAddr: 'DBW476',
          destinationAddr: 'DBW1216',
          motorName: '06035',
          sensorName: 'SP_06035-2'
        },
        '06036': {
          name: '06036',
          groupId: 'G_06035_06036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW38', bit: 3 },
          sensorAddr: { db: 'DBW1636', bit: 8 },
          trayIdAddr: 'DBW478',
          destinationAddr: 'DBW1218',
          motorName: '06036',
          sensorName: 'SP_06035-1'
        },
        '06032': {
          name: '06032',
          x: 556,
          y: 132,
          groupId: 'G_06032_06033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 15 },
          sensorAddr: { db: 'DBW1636', bit: 7 },
          trayIdAddr: 'DBW472',
          destinationAddr: 'DBW1212',
          motorName: '06032',
          sensorName: 'SP_06032-2'
        },
        '06033': {
          name: '06033',
          groupId: 'G_06032_06033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW38', bit: 0 },
          sensorAddr: { db: 'DBW1636', bit: 6 },
          trayIdAddr: 'DBW474',
          destinationAddr: 'DBW1214',
          motorName: '06033',
          sensorName: 'SP_06032-1'
        },
        '07028': {
          name: '07028',
          x: 460,
          y: 132,
          groupId: 'G_07028_07029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW42', bit: 11 },
          sensorAddr: { db: 'DBW1642', bit: 3 },
          trayIdAddr: 'DBW546',
          destinationAddr: 'DBW1286',
          motorName: '07028',
          sensorName: 'SP_07028-2'
        },
        '07029': {
          name: '07029',
          groupId: 'G_07028_07029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW42', bit: 12 },
          sensorAddr: { db: 'DBW1642', bit: 2 },
          trayIdAddr: 'DBW548',
          destinationAddr: 'DBW1288',
          motorName: '07029',
          sensorName: 'SP_07028-1'
        },
        '07025': {
          name: '07025',
          x: 486,
          y: 132,
          groupId: 'G_07025_07026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW42', bit: 8 },
          sensorAddr: { db: 'DBW1642', bit: 1 },
          trayIdAddr: 'DBW542',
          destinationAddr: 'DBW1282',
          motorName: '07025',
          sensorName: 'SP_07025-2'
        },
        '07026': {
          name: '07026',
          groupId: 'G_07025_07026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW42', bit: 9 },
          sensorAddr: { db: 'DBW1642', bit: 0 },
          trayIdAddr: 'DBW544',
          destinationAddr: 'DBW1284',
          motorName: '07026',
          sensorName: 'SP_07025-1'
        },
        '07035': {
          name: '07035',
          x: 386,
          y: 132,
          groupId: 'G_07035_07036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW44', bit: 2 },
          sensorAddr: { db: 'DBW1642', bit: 9 },
          trayIdAddr: 'DBW556',
          destinationAddr: 'DBW1296',
          motorName: '07035',
          sensorName: 'SP_07035-2'
        },
        '07036': {
          name: '07036',
          groupId: 'G_07035_07036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW44', bit: 3 },
          sensorAddr: { db: 'DBW1642', bit: 8 },
          trayIdAddr: 'DBW558',
          destinationAddr: 'DBW1298',
          motorName: '07036',
          sensorName: 'SP_07035-1'
        },
        '07032': {
          name: '07032',
          x: 411,
          y: 132,
          groupId: 'G_07032_07033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW42', bit: 15 },
          sensorAddr: { db: 'DBW1642', bit: 7 },
          trayIdAddr: 'DBW552',
          destinationAddr: 'DBW1292',
          motorName: '07032',
          sensorName: 'SP_07032-2'
        },
        '07033': {
          name: '07033',
          groupId: 'G_07032_07033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW44', bit: 0 },
          sensorAddr: { db: 'DBW1642', bit: 6 },
          trayIdAddr: 'DBW554',
          destinationAddr: 'DBW1294',
          motorName: '07033',
          sensorName: 'SP_07032-1'
        },
        '08028': {
          name: '08028',
          x: 315,
          y: 132,
          groupId: 'G_08028_08029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 11 },
          sensorAddr: { db: 'DBW1648', bit: 3 },
          trayIdAddr: 'DBW626',
          destinationAddr: 'DBW1366',
          motorName: '08028',
          sensorName: 'SP_08028-2'
        },
        '08029': {
          name: '08029',
          groupId: 'G_08028_08029',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 12 },
          sensorAddr: { db: 'DBW1648', bit: 2 },
          trayIdAddr: 'DBW628',
          destinationAddr: 'DBW1368',
          motorName: '08029',
          sensorName: 'SP_08028-1'
        },
        '08025': {
          name: '08025',
          x: 341,
          y: 132,
          groupId: 'G_08025_08026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 8 },
          sensorAddr: { db: 'DBW1648', bit: 1 },
          trayIdAddr: 'DBW622',
          destinationAddr: 'DBW1362',
          motorName: '08025',
          sensorName: 'SP_08025-2'
        },
        '08026': {
          name: '08026',
          groupId: 'G_08025_08026',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 9 },
          sensorAddr: { db: 'DBW1648', bit: 0 },
          trayIdAddr: 'DBW624',
          destinationAddr: 'DBW1364',
          motorName: '08026',
          sensorName: 'SP_08025-1'
        },
        '08035': {
          name: '08035',
          x: 240,
          y: 132,
          groupId: 'G_08035_08036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW50', bit: 2 },
          sensorAddr: { db: 'DBW1648', bit: 9 },
          trayIdAddr: 'DBW636',
          destinationAddr: 'DBW1376',
          motorName: '08035',
          sensorName: 'SP_08035-2'
        },
        '08036': {
          name: '08036',
          groupId: 'G_08035_08036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW50', bit: 3 },
          sensorAddr: { db: 'DBW1648', bit: 8 },
          trayIdAddr: 'DBW638',
          destinationAddr: 'DBW1378',
          motorName: '08036',
          sensorName: 'SP_08035-1'
        },
        '08032': {
          name: '08032',
          x: 266,
          y: 132,
          groupId: 'G_08032_08033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 15 },
          sensorAddr: { db: 'DBW1648', bit: 7 },
          trayIdAddr: 'DBW632',
          destinationAddr: 'DBW1372',
          motorName: '08032',
          sensorName: 'SP_08032-2'
        },
        '08033': {
          name: '08033',
          groupId: 'G_08032_08033',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW50', bit: 0 },
          sensorAddr: { db: 'DBW1648', bit: 6 },
          trayIdAddr: 'DBW634',
          destinationAddr: 'DBW1374',
          motorName: '08033',
          sensorName: 'SP_08032-1'
        },
        '09017': {
          name: '09017',
          x: 165,
          y: 132,
          groupId: 'G_09017_09018',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 1 },
          sensorAddr: { db: 'DBW1652', bit: 12 },
          trayIdAddr: 'DBW696',
          destinationAddr: 'DBW1436',
          motorName: '09017',
          sensorName: 'SP_09017-2'
        },
        '09018': {
          name: '09018',
          groupId: 'G_09017_09018',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 2 },
          sensorAddr: { db: 'DBW1652', bit: 11 },
          trayIdAddr: 'DBW698',
          destinationAddr: 'DBW1438',
          motorName: '09018',
          sensorName: 'SP_09017-1'
        },
        '09014': {
          name: '09014',
          x: 191,
          y: 132,
          groupId: 'G_09014_09015',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW52', bit: 13 },
          sensorAddr: { db: 'DBW1652', bit: 10 },
          trayIdAddr: 'DBW692',
          destinationAddr: 'DBW1432',
          motorName: '09014',
          sensorName: 'SP_09014-2'
        },
        '09015': {
          name: '09015',
          groupId: 'G_09014_09015',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW52', bit: 14 },
          sensorAddr: { db: 'DBW1652', bit: 9 },
          trayIdAddr: 'DBW694',
          destinationAddr: 'DBW1434',
          motorName: '09015',
          sensorName: 'SP_09014-1'
        },
        // 以上为下货第一排
        // 以下为下货第二排
        '09023': {
          name: '09023',
          x: 460,
          y: 97,
          groupId: 'G_09023_09024',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 6 },
          sensorAddr: { db: 'DBW1654', bit: 1 },
          trayIdAddr: 'DBW704',
          destinationAddr: 'DBW1444',
          motorName: '09023',
          sensorName: 'SP_09023-2'
        },
        '09024': {
          name: '09024',
          groupId: 'G_09023_09024',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 7 },
          sensorAddr: { db: 'DBW1654', bit: 0 },
          trayIdAddr: 'DBW706',
          destinationAddr: 'DBW1446',
          motorName: '09024',
          sensorName: 'SP_09023-1'
        },
        '09024SP': {
          name: 'SP_09024',
          x: 460,
          y: 76,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1654', bit: 2 },
          sensorName: 'SP_09024'
        },
        '09020': {
          name: '09020',
          x: 486,
          y: 97,
          groupId: 'G_09020_09021',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 3 },
          sensorAddr: { db: 'DBW1652', bit: 14 },
          trayIdAddr: 'DBW700',
          destinationAddr: 'DBW1440',
          motorName: '09020',
          sensorName: 'SP_09020-2'
        },
        '09021': {
          name: '09021',
          groupId: 'G_09020_09021',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 4 },
          sensorAddr: { db: 'DBW1652', bit: 13 },
          trayIdAddr: 'DBW702',
          destinationAddr: 'DBW1442',
          motorName: '09021',
          sensorName: 'SP_09020-1'
        },
        '09021SP': {
          name: 'SP_09021',
          x: 486,
          y: 76,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1652', bit: 15 },
          sensorName: 'SP_09021'
        },
        'SP_09025-2': {
          name: 'SP_09025-2',
          x: 434,
          y: 97,
          groupId: 'G_090252_090251',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 8 },
          sensorAddr: { db: 'DBW1654', bit: 4 },
          trayIdAddr: 'DBW708',
          destinationAddr: 'DBW1448',
          motorName: '09025',
          sensorName: 'SP_09025-2'
        },
        'SP_09025-1': {
          name: 'SP_09025-1',
          groupId: 'G_090252_090251',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 8 },
          sensorAddr: { db: 'DBW1654', bit: 3 },
          trayIdAddr: 'DBW708',
          destinationAddr: 'DBW1448',
          motorName: '09025',
          sensorName: 'SP_09025-1'
        },
        'SP_09026-2': {
          name: 'SP_09026-2',
          x: 407,
          y: 97,
          groupId: 'G_090262_090261',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 9 },
          sensorAddr: { db: 'DBW1654', bit: 6 },
          trayIdAddr: 'DBW710',
          destinationAddr: 'DBW1450',
          motorName: '09026',
          sensorName: 'SP_09026-2'
        },
        'SP_09026-1': {
          name: 'SP_09026-1',
          groupId: 'G_090262_090261',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 9 },
          sensorAddr: { db: 'DBW1654', bit: 5 },
          trayIdAddr: 'DBW710',
          destinationAddr: 'DBW1450',
          motorName: '09026',
          sensorName: 'SP_09026-1'
        },
        'SP_09027-2': {
          name: 'SP_09027-2',
          x: 380,
          y: 97,
          groupId: 'G_090272_090271',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 10 },
          sensorAddr: { db: 'DBW1654', bit: 8 },
          trayIdAddr: 'DBW712',
          destinationAddr: 'DBW1452',
          motorName: '09027',
          sensorName: 'SP_09027-2'
        },
        'SP_09027-1': {
          name: 'SP_09027-1',
          groupId: 'G_090272_090271',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 10 },
          sensorAddr: { db: 'DBW1654', bit: 7 },
          trayIdAddr: 'DBW712',
          destinationAddr: 'DBW1452',
          motorName: '09027',
          sensorName: 'SP_09027-1'
        },
        'SP_09028-2': {
          name: 'SP_09028-2',
          x: 353,
          y: 97,
          groupId: 'G_090282_090281',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 11 },
          sensorAddr: { db: 'DBW1654', bit: 10 },
          trayIdAddr: 'DBW714',
          destinationAddr: 'DBW1454',
          motorName: '09028',
          sensorName: 'SP_09028-2'
        },
        'SP_09028-1': {
          name: 'SP_09028-1',
          groupId: 'G_090282_090281',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 11 },
          sensorAddr: { db: 'DBW1654', bit: 9 },
          trayIdAddr: 'DBW714',
          destinationAddr: 'DBW1454',
          motorName: '09028',
          sensorName: 'SP_09028-1'
        },
        'SP_09029-2': {
          name: 'SP_09029-2',
          x: 326,
          y: 97,
          groupId: 'G_090292_090291',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 12 },
          sensorAddr: { db: 'DBW1654', bit: 12 },
          trayIdAddr: 'DBW716',
          destinationAddr: 'DBW1456',
          motorName: '09029',
          sensorName: 'SP_09029-2'
        },
        'SP_09029-1': {
          name: 'SP_09029-1',
          groupId: 'G_090292_090291',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 12 },
          sensorAddr: { db: 'DBW1654', bit: 11 },
          trayIdAddr: 'DBW716',
          destinationAddr: 'DBW1456',
          motorName: '09029',
          sensorName: 'SP_09029-1'
        },
        'SP_09030-2': {
          name: 'SP_09030-2',
          x: 299,
          y: 97,
          groupId: 'G_090302_090301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 13 },
          sensorAddr: { db: 'DBW1654', bit: 14 },
          trayIdAddr: 'DBW718',
          destinationAddr: 'DBW1458',
          motorName: '09030',
          sensorName: 'SP_09030-2'
        },
        'SP_09030-1': {
          name: 'SP_09030-1',
          groupId: 'G_090302_090301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 13 },
          sensorAddr: { db: 'DBW1654', bit: 13 },
          trayIdAddr: 'DBW718',
          destinationAddr: 'DBW1458',
          motorName: '09030',
          sensorName: 'SP_09030-1'
        },
        'SP_09031-2': {
          name: 'SP_09031-2',
          x: 272,
          y: 97,
          groupId: 'G_090312_090311',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 14 },
          sensorAddr: { db: 'DBW1656', bit: 0 },
          trayIdAddr: 'DBW720',
          destinationAddr: 'DBW1460',
          motorName: '09031',
          sensorName: 'SP_09031-2'
        },
        'SP_09031-1': {
          name: 'SP_09031-1',
          groupId: 'G_090312_090311',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 14 },
          sensorAddr: { db: 'DBW1654', bit: 15 },
          trayIdAddr: 'DBW720',
          destinationAddr: 'DBW1460',
          motorName: '09031',
          sensorName: 'SP_09031-1'
        },
        'SP_09032-2': {
          name: 'SP_09032-2',
          x: 245,
          y: 97,
          groupId: 'G_090322_090321',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 15 },
          sensorAddr: { db: 'DBW1656', bit: 2 },
          trayIdAddr: 'DBW722',
          destinationAddr: 'DBW1462',
          motorName: '09032',
          sensorName: 'SP_09032-2'
        },
        'SP_09032-1': {
          name: 'SP_09032-1',
          groupId: 'G_090322_090321',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW54', bit: 15 },
          sensorAddr: { db: 'DBW1656', bit: 1 },
          trayIdAddr: 'DBW722',
          destinationAddr: 'DBW1462',
          motorName: '09032',
          sensorName: 'SP_09032-1'
        },
        'SP_09033-2': {
          name: 'SP_09033-2',
          x: 218,
          y: 97,
          groupId: 'G_090332_090331',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW56', bit: 0 },
          sensorAddr: { db: 'DBW1656', bit: 4 },
          trayIdAddr: 'DBW724',
          destinationAddr: 'DBW1464',
          motorName: '09033',
          sensorName: 'SP_09033-2'
        },
        'SP_09033-1': {
          name: 'SP_09033-1',
          groupId: 'G_090332_090331',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW56', bit: 0 },
          sensorAddr: { db: 'DBW1656', bit: 3 },
          trayIdAddr: 'DBW724',
          destinationAddr: 'DBW1464',
          motorName: '09033',
          sensorName: 'SP_09033-1'
        },
        '09038': {
          name: '09038',
          x: 165,
          y: 97,
          groupId: 'G_09038_09039',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW56', bit: 5 },
          sensorAddr: { db: 'DBW1656', bit: 9 },
          trayIdAddr: 'DBW730',
          destinationAddr: 'DBW1470',
          motorName: '09038',
          sensorName: 'SP_09038-2'
        },
        '09039': {
          name: '09039',
          groupId: 'G_09038_09039',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW56', bit: 6 },
          sensorAddr: { db: 'DBW1656', bit: 8 },
          trayIdAddr: 'DBW732',
          destinationAddr: 'DBW1472',
          motorName: '09039',
          sensorName: 'SP_09038-1'
        },
        '09039SP': {
          name: 'SP_09039',
          x: 165,
          y: 76,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1656', bit: 10 },
          sensorName: 'SP_09039'
        },
        '09035': {
          name: '09035',
          x: 191,
          y: 97,
          groupId: 'G_09035_09036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW56', bit: 2 },
          sensorAddr: { db: 'DBW1656', bit: 6 },
          trayIdAddr: 'DBW726',
          destinationAddr: 'DBW1466',
          motorName: '09035',
          sensorName: 'SP_09035-2'
        },
        '09036': {
          name: '09036',
          groupId: 'G_09035_09036',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW56', bit: 3 },
          sensorAddr: { db: 'DBW1656', bit: 5 },
          trayIdAddr: 'DBW728',
          destinationAddr: 'DBW1468',
          motorName: '09036',
          sensorName: 'SP_09035-1'
        },
        '09036SP': {
          name: 'SP_09036',
          x: 191,
          y: 76,
          sensorStatus: false,
          sensorAddr: { db: 'DBW1656', bit: 7 },
          sensorName: 'SP_09036'
        },
        // 以下为后补充的夹缝的光电电机设备状态
        '02009': {
          name: '02009',
          x: 1245,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW10', bit: 8 },
          sensorAddr: { db: 'DBW1610', bit: 8 },
          trayIdAddr: 'DBW120',
          destinationAddr: 'DBW860',
          motorName: '02009',
          sensorName: 'SP_02009'
        },
        '02016': {
          name: '02016',
          x: 1170,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW10', bit: 15 },
          sensorAddr: { db: 'DBW1610', bit: 11 },
          trayIdAddr: 'DBW130',
          destinationAddr: 'DBW870',
          motorName: '02016',
          sensorName: 'SP_02016'
        },
        '03009': {
          name: '03009',
          x: 1097,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW16', bit: 8 },
          sensorAddr: { db: 'DBW1616', bit: 8 },
          trayIdAddr: 'DBW200',
          destinationAddr: 'DBW940',
          motorName: '03009',
          sensorName: 'SP_03009'
        },
        '03016': {
          name: '03016',
          x: 1023,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW16', bit: 15 },
          sensorAddr: { db: 'DBW1616', bit: 11 },
          trayIdAddr: 'DBW210',
          destinationAddr: 'DBW950',
          motorName: '03016',
          sensorName: 'SP_03016'
        },
        '04009': {
          name: '04009',
          x: 950,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW22', bit: 8 },
          sensorAddr: { db: 'DBW1622', bit: 8 },
          trayIdAddr: 'DBW280',
          destinationAddr: 'DBW1020',
          motorName: '04009',
          sensorName: 'SP_04009'
        },
        '04016': {
          name: '04016',
          x: 876,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW22', bit: 15 },
          sensorAddr: { db: 'DBW1622', bit: 11 },
          trayIdAddr: 'DBW290',
          destinationAddr: 'DBW1030',
          motorName: '04016',
          sensorName: 'SP_04016'
        },
        '05009': {
          name: '05009',
          x: 805,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW28', bit: 8 },
          sensorAddr: { db: 'DBW1628', bit: 8 },
          trayIdAddr: 'DBW360',
          destinationAddr: 'DBW1100',
          motorName: '05009',
          sensorName: 'SP_05009'
        },
        '05016': {
          name: '05016',
          x: 730,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW28', bit: 15 },
          sensorAddr: { db: 'DBW1628', bit: 11 },
          trayIdAddr: 'DBW370',
          destinationAddr: 'DBW1110',
          motorName: '05016',
          sensorName: 'SP_05016'
        },
        '06009': {
          name: '06009',
          x: 655,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW34', bit: 8 },
          sensorAddr: { db: 'DBW1634', bit: 8 },
          trayIdAddr: 'DBW440',
          destinationAddr: 'DBW1180',
          motorName: '06009',
          sensorName: 'SP_06009'
        },
        '06016': {
          name: '06016',
          x: 582,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW34', bit: 15 },
          sensorAddr: { db: 'DBW1634', bit: 11 },
          trayIdAddr: 'DBW450',
          destinationAddr: 'DBW1190',
          motorName: '06016',
          sensorName: 'SP_06016'
        },
        '07009': {
          name: '07009',
          x: 508,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW40', bit: 8 },
          sensorAddr: { db: 'DBW1640', bit: 8 },
          trayIdAddr: 'DBW520',
          destinationAddr: 'DBW1260',
          motorName: '07009',
          sensorName: 'SP_07009'
        },
        '07016': {
          name: '07016',
          x: 437,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW40', bit: 15 },
          sensorAddr: { db: 'DBW1640', bit: 11 },
          trayIdAddr: 'DBW530',
          destinationAddr: 'DBW1270',
          motorName: '07016',
          sensorName: 'SP_07016'
        },
        '08009': {
          name: '08009',
          x: 364,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW46', bit: 8 },
          sensorAddr: { db: 'DBW1646', bit: 8 },
          trayIdAddr: 'DBW600',
          destinationAddr: 'DBW1340',
          motorName: '08009',
          sensorName: 'SP_08009'
        },
        '08016': {
          name: '08016',
          x: 290,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW46', bit: 15 },
          sensorAddr: { db: 'DBW1646', bit: 11 },
          trayIdAddr: 'DBW610',
          destinationAddr: 'DBW1350',
          motorName: '08016',
          sensorName: 'SP_08016'
        },
        '09005': {
          name: '09005',
          x: 216,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW52', bit: 4 },
          sensorAddr: { db: 'DBW1652', bit: 4 },
          trayIdAddr: 'DBW680',
          destinationAddr: 'DBW1420',
          motorName: '09005',
          sensorName: 'SP_09005'
        },
        // 以后为补充后最后一排的夹缝的光电电机设备状态
        'SP_02023-2': {
          name: 'SP_02023-2',
          x: 1245,
          y: 132,
          groupId: 'G_020232_020231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 6 },
          sensorAddr: { db: 'DBW1610', bit: 15 },
          trayIdAddr: 'DBW140',
          destinationAddr: 'DBW880',
          motorName: '02023',
          sensorName: 'SP_02023-2'
        },
        'SP_02023-1': {
          name: 'SP_02023-1',
          groupId: 'G_020232_020231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 6 },
          sensorAddr: { db: 'DBW1610', bit: 14 },
          trayIdAddr: 'DBW140',
          destinationAddr: 'DBW880',
          motorName: '02023',
          sensorName: 'SP_02023-1'
        },
        'SP_02030-2': {
          name: 'SP_02030-2',
          x: 1170,
          y: 132,
          groupId: 'G_020302_020301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 13 },
          sensorAddr: { db: 'DBW1612', bit: 5 },
          trayIdAddr: 'DBW150',
          destinationAddr: 'DBW890',
          motorName: '02030',
          sensorName: 'SP_02030-2'
        },
        'SP_02030-1': {
          name: 'SP_02030-1',
          groupId: 'G_020302_020301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW12', bit: 13 },
          sensorAddr: { db: 'DBW1612', bit: 4 },
          trayIdAddr: 'DBW150',
          destinationAddr: 'DBW890',
          motorName: '02030',
          sensorName: 'SP_02030-1'
        },
        'SP_03023-2': {
          name: 'SP_03023-2',
          x: 1097,
          y: 132,
          groupId: 'G_030232_030231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 6 },
          sensorAddr: { db: 'DBW1616', bit: 15 },
          trayIdAddr: 'DBW220',
          destinationAddr: 'DBW960',
          motorName: '03023',
          sensorName: 'SP_03023-2'
        },
        'SP_03023-1': {
          name: 'SP_03023-1',
          groupId: 'G_030232_030231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 6 },
          sensorAddr: { db: 'DBW1616', bit: 14 },
          trayIdAddr: 'DBW220',
          destinationAddr: 'DBW960',
          motorName: '03023',
          sensorName: 'SP_03023-1'
        },
        'SP_03030-2': {
          name: 'SP_03030-2',
          x: 1023,
          y: 132,
          groupId: 'G_030302_030301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 13 },
          sensorAddr: { db: 'DBW1618', bit: 5 },
          trayIdAddr: 'DBW230',
          destinationAddr: 'DBW970',
          motorName: '03030',
          sensorName: 'SP_03030-2'
        },
        'SP_03030-1': {
          name: 'SP_03030-1',
          groupId: 'G_030302_030301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW18', bit: 13 },
          sensorAddr: { db: 'DBW1618', bit: 4 },
          trayIdAddr: 'DBW230',
          destinationAddr: 'DBW970',
          motorName: '03030',
          sensorName: 'SP_03030-1'
        },
        'SP_04023-2': {
          name: 'SP_04023-2',
          x: 950,
          y: 132,
          groupId: 'G_040232_040231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 6 },
          sensorAddr: { db: 'DBW1622', bit: 15 },
          trayIdAddr: 'DBW300',
          destinationAddr: 'DBW1040',
          motorName: '04023',
          sensorName: 'SP_04023-2'
        },
        'SP_04023-1': {
          name: 'SP_04023-1',
          groupId: 'G_040232_040231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 6 },
          sensorAddr: { db: 'DBW1622', bit: 14 },
          trayIdAddr: 'DBW300',
          destinationAddr: 'DBW1040',
          motorName: '04023',
          sensorName: 'SP_04023-1'
        },
        'SP_04030-2': {
          name: 'SP_04030-2',
          x: 876,
          y: 132,
          groupId: 'G_040302_040301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 13 },
          sensorAddr: { db: 'DBW1624', bit: 5 },
          trayIdAddr: 'DBW310',
          destinationAddr: 'DBW1050',
          motorName: '04030',
          sensorName: 'SP_04030-2'
        },
        'SP_04030-1': {
          name: 'SP_04030-1',
          groupId: 'G_040302_040301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW24', bit: 13 },
          sensorAddr: { db: 'DBW1624', bit: 4 },
          trayIdAddr: 'DBW310',
          destinationAddr: 'DBW1050',
          motorName: '04030',
          sensorName: 'SP_04030-1'
        },
        'SP_05023-2': {
          name: 'SP_05023-2',
          x: 805,
          y: 132,
          groupId: 'G_050232_050231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 6 },
          sensorAddr: { db: 'DBW1628', bit: 15 },
          trayIdAddr: 'DBW380',
          destinationAddr: 'DBW1120',
          motorName: '05023',
          sensorName: 'SP_05023-2'
        },
        'SP_05023-1': {
          name: 'SP_05023-1',
          groupId: 'G_050232_050231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 6 },
          sensorAddr: { db: 'DBW1628', bit: 14 },
          trayIdAddr: 'DBW380',
          destinationAddr: 'DBW1120',
          motorName: '05023',
          sensorName: 'SP_05023-1'
        },
        'SP_05030-2': {
          name: 'SP_05030-2',
          x: 730,
          y: 132,
          groupId: 'G_050302_050301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 13 },
          sensorAddr: { db: 'DBW1630', bit: 5 },
          trayIdAddr: 'DBW390',
          destinationAddr: 'DBW1130',
          motorName: '05030',
          sensorName: 'SP_05030-2'
        },
        'SP_05030-1': {
          name: 'SP_05030-1',
          groupId: 'G_050302_050301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW30', bit: 13 },
          sensorAddr: { db: 'DBW1630', bit: 4 },
          trayIdAddr: 'DBW390',
          destinationAddr: 'DBW1130',
          motorName: '05030',
          sensorName: 'SP_05030-1'
        },
        'SP_06023-2': {
          name: 'SP_06023-2',
          x: 655,
          y: 132,
          groupId: 'G_060232_060231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 6 },
          sensorAddr: { db: 'DBW1634', bit: 15 },
          trayIdAddr: 'DBW460',
          destinationAddr: 'DBW1200',
          motorName: '06023',
          sensorName: 'SP_06023-2'
        },
        'SP_06023-1': {
          name: 'SP_06023-1',
          groupId: 'G_060232_060231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 6 },
          sensorAddr: { db: 'DBW1634', bit: 14 },
          trayIdAddr: 'DBW460',
          destinationAddr: 'DBW1200',
          motorName: '06023',
          sensorName: 'SP_06023-1'
        },
        'SP_06030-2': {
          name: 'SP_06030-2',
          x: 582,
          y: 132,
          groupId: 'G_060302_060301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 13 },
          sensorAddr: { db: 'DBW1636', bit: 5 },
          trayIdAddr: 'DBW470',
          destinationAddr: 'DBW1210',
          motorName: '06030',
          sensorName: 'SP_06030-2'
        },
        'SP_06030-1': {
          name: 'SP_06030-1',
          groupId: 'G_060302_060301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW36', bit: 13 },
          sensorAddr: { db: 'DBW1636', bit: 4 },
          trayIdAddr: 'DBW470',
          destinationAddr: 'DBW1210',
          motorName: '06030',
          sensorName: 'SP_06030-1'
        },
        'SP_07023-2': {
          name: 'SP_07023-2',
          x: 508,
          y: 132,
          groupId: 'G_070232_070231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW42', bit: 6 },
          sensorAddr: { db: 'DBW1640', bit: 15 },
          trayIdAddr: 'DBW540',
          destinationAddr: 'DBW1280',
          motorName: '07023',
          sensorName: 'SP_07023-2'
        },
        'SP_07023-1': {
          name: 'SP_07023-1',
          groupId: 'G_070232_070231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW42', bit: 6 },
          sensorAddr: { db: 'DBW1640', bit: 14 },
          trayIdAddr: 'DBW540',
          destinationAddr: 'DBW1280',
          motorName: '07023',
          sensorName: 'SP_07023-1'
        },
        'SP_07030-2': {
          name: 'SP_07030-2',
          x: 437,
          y: 132,
          groupId: 'G_070302_070301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW42', bit: 13 },
          sensorAddr: { db: 'DBW1642', bit: 5 },
          trayIdAddr: 'DBW550',
          destinationAddr: 'DBW1290',
          motorName: '07030',
          sensorName: 'SP_07030-2'
        },
        'SP_07030-1': {
          name: 'SP_07030-1',
          groupId: 'G_070302_070301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW42', bit: 13 },
          sensorAddr: { db: 'DBW1642', bit: 4 },
          trayIdAddr: 'DBW550',
          destinationAddr: 'DBW1290',
          motorName: '07030',
          sensorName: 'SP_07030-1'
        },
        'SP_08023-2': {
          name: 'SP_08023-2',
          x: 364,
          y: 132,
          groupId: 'G_080232_080231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 6 },
          sensorAddr: { db: 'DBW1646', bit: 15 },
          trayIdAddr: 'DBW620',
          destinationAddr: 'DBW1360',
          motorName: '08023',
          sensorName: 'SP_08023-2'
        },
        'SP_08023-1': {
          name: 'SP_08023-1',
          groupId: 'G_080232_080231',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 6 },
          sensorAddr: { db: 'DBW1646', bit: 14 },
          trayIdAddr: 'DBW620',
          destinationAddr: 'DBW1360',
          motorName: '08023',
          sensorName: 'SP_08023-1'
        },
        'SP_08030-2': {
          name: 'SP_08030-2',
          x: 290,
          y: 132,
          groupId: 'G_080302_080301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 13 },
          sensorAddr: { db: 'DBW1648', bit: 5 },
          trayIdAddr: 'DBW630',
          destinationAddr: 'DBW1370',
          motorName: '08030',
          sensorName: 'SP_08030-2'
        },
        'SP_08030-1': {
          name: 'SP_08030-1',
          groupId: 'G_080302_080301',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW48', bit: 13 },
          sensorAddr: { db: 'DBW1648', bit: 4 },
          trayIdAddr: 'DBW630',
          destinationAddr: 'DBW1370',
          motorName: '08030',
          sensorName: 'SP_08030-1'
        },
        'SP_09012-2': {
          name: 'SP_09012-2',
          x: 216,
          y: 132,
          groupId: 'G_090122_090121',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW52', bit: 11 },
          sensorAddr: { db: 'DBW1652', bit: 8 },
          trayIdAddr: 'DBW690',
          destinationAddr: 'DBW1430',
          motorName: '09012',
          sensorName: 'SP_09012-2'
        },
        'SP_09012-1': {
          name: 'SP_09012-1',
          groupId: 'G_090122_090121',
          motorStatus: false,
          sensorStatus: false,
          trayId: '',
          destination: 0,
          motorAddr: { db: 'DBW52', bit: 11 },
          sensorAddr: { db: 'DBW1652', bit: 7 },
          trayIdAddr: 'DBW690',
          destinationAddr: 'DBW1430',
          motorName: '09012',
          sensorName: 'SP_09012-1'
        }
      },

      // 弹窗相关状态
      popoverVisible: false,
      popoverData: {}, // 当前弹窗显示的数据（单个设备或组长设备）
      popoverList: [], // 弹窗展示的设备列表（支持多设备横向排列）
      currentSelectedNodeId: null, // 当前选中的节点ID
      popoverPosition: { top: 0, left: 0 }, // 弹窗相对容器的位置
      popoverDirection: 'up', // 弹窗弹出方向：'up' 向上，'down' 向下

      // 分组索引：{ groupId: [deviceId1, deviceId2, ...] }
      // 在 mounted 中通过 Object.freeze 冻结以提升性能
      groupIndex: null
    };
  },
  computed: {
    currentLogs() {
      return this.activeLogType === 'running'
        ? this.runningLogs
        : this.alarmLogs;
    },
    unreadAlarms() {
      return this.alarmLogs.filter((log) => log.unread).length;
    },
    selectedQueue() {
      return this.queues[this.selectedQueueIndex];
    },
    // 动态计算弹窗位置样式
    popoverStyle() {
      return {
        top: `${this.popoverPosition.top}px`,
        left: `${this.popoverPosition.left}px`
      };
    },
    deviceList() {
      const allDevices = Object.keys(this.deviceNodes).map((key) => ({
        id: key,
        ...this.deviceNodes[key]
      }));

      // 分组过滤：对于有 groupId 的设备，只保留组长（该组第一个出现的设备）
      const seenGroups = new Set();
      return allDevices.filter((device) => {
        // 独立设备（无 groupId）直接保留
        if (!device.groupId) {
          return true;
        }
        // 成组设备：仅保留该组第一个出现的设备作为组长
        if (seenGroups.has(device.groupId)) {
          return false;
        }
        seenGroups.add(device.groupId);
        return true;
      });
    },
    // 预热(Yxxx)队列列表，用于上货前电机信号按钮
    preHeatQueues() {
      return this.queues
        .filter((q) => q.queueName.startsWith('Y'))
        .sort(
          (a, b) =>
            Number(a.queueName.replace('Y', '')) -
            Number(b.queueName.replace('Y', ''))
        );
    },
    // 灭菌(xxxx)队列列表，用于灭菌后预热信号按钮
    sterilizationQueues() {
      return this.queues
        .filter((q) => !q.queueName.startsWith('Y') && q.queueName !== '上货区')
        .sort((a, b) => Number(a.queueName) - Number(b.queueName));
    }
  },
  mounted() {
    this.initializeMarkers();
    this.loadQueueInfoFromDatabase();
    this.buildGroupIndex();
    this.initWebSocketServer();
    // 启动批次+目的地轮询
    this.pollBatchAndDestination();
    this._pollBatchTimer = setInterval(this.pollBatchAndDestination, 5000);
    // 数据加载完成后创建监听（跳过 id 为 1-5 的队列）
    this._queueWatchers = []; // 保存 watcher 取消函数
    this.$nextTick(() => {
      this.queues.forEach((queue, index) => {
        const unwatch = this.$watch(`queues.${index}.trayInfo`, {
          handler(newVal, oldVal) {
            this.updateQueueInfo(queue.id);
          },
          deep: true
        });
        this._queueWatchers.push(unwatch);
      });
    });
    ipcRenderer.on('receivedMsg', (event, values, values2) => {
      // S7 PLC 位解析工具: 逻辑bit序号 → word中的实际bit位置
      // S7大端序: 逻辑bit0→word.bit8, bit7→word.bit15, bit8→word.bit0, bit15→word.bit7
      const getBit = (word, bitIndex) => ((word >> bitIndex) & 1).toString();

      // 预先解析高频使用的 Word (按需从 values 里取并转换)
      const parsedWords = {};
      const getParsedWord = (db) => {
        if (parsedWords[db] === undefined) {
          parsedWords[db] = this.convertToWord(values[db]);
        }
        return parsedWords[db];
      };

      // 核心：遍历设备列表，统一赋值
      Object.values(this.deviceNodes).forEach((node) => {
        // 赋值电机状态
        if (node.motorAddr) {
          const { db, bit } = node.motorAddr;
          const actualBit = bit < 8 ? bit + 8 : bit - 8;
          node.motorStatus = getBit(getParsedWord(db), actualBit) === '1';
        }

        // 赋值传感器状态
        if (node.sensorAddr) {
          const { db, bit } = node.sensorAddr;
          const actualBit = bit < 8 ? bit + 8 : bit - 8;
          node.sensorStatus = getBit(getParsedWord(db), actualBit) === '1';
        }

        // 赋值托盘 ID
        if (node.trayIdAddr) {
          const v = Number(values[node.trayIdAddr] ?? 0);
          node.trayId = v !== 0 ? String(v) : '';
        }

        // 赋值目的地
        if (node.destinationAddr) {
          node.destination = Number(values[node.destinationAddr] ?? 0);
        }
      });

      // 如果弹窗处于打开状态，同步更新弹窗内的数据
      if (this.popoverVisible && this.popoverData) {
        if (!this.popoverData.groupId) {
          this.popoverList = [this.deviceNodes[this.popoverData.id]];
        } else {
          const groupIds = this.groupIndex?.[this.popoverData.groupId] || [];
          this.popoverList = groupIds.map((id) => ({
            id,
            ...this.deviceNodes[id]
          }));
        }
        // 更新 popoverData 指向最新的对象引用（若找不到则保持原引用，防止被置为 undefined 导致渲染报错）
        const latestNode = this.deviceNodes[this.popoverData.id];
        if (latestNode) {
          this.popoverData = latestNode;
        }
      }

      // 灭菌前1#小车位置值
      this.cartPositionValues.cart1 = Number(values.DBW58 ?? 0);
    });
  },
  watch: {
    // 监听上货区 (ID: 1)
    'queues.0.trayInfo': {
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(1);
      }
    },
    // 监听小车位置数值变化
    'cartPositionValues.cart1'(newVal) {
      this.updateCartPositionByValue(1, newVal);
    }
  },
  methods: {
    // ================= 批次+目的地轮询 =================
    async pollBatchAndDestination() {
      try {
        const batchRes = await HttpUtil.get(
          '/produce_batch/getCurrentExecuting'
        );
        if (batchRes && batchRes.data) {
          this.currentExecutingBatch = batchRes.data;
          const batchId = batchRes.data.batch.id;
          const destRes = await HttpUtil.get(
            `/produce_batch_destination/current?batchId=${batchId}`
          );
          this.currentDestination = (destRes && destRes.data) || null;
        } else {
          this.currentExecutingBatch = null;
          this.currentDestination = null;
        }
      } catch (e) {
        console.error('轮询批次/目的地失败:', e);
      }
    },

    // ================= 扫码模拟 =================
    async handleScanConfirm(location) {
      const uid =
        location === '01002'
          ? this.scanInput01002.trim()
          : this.scanInput01006.trim();
      if (!uid) {
        this.$message.warning('请输入货物 uid');
        return;
      }
      try {
        const res = await HttpUtil.post('/produce_goods/markScanned', {
          uid,
          scanLocation: location
        });
        if (res && res.code === '200') {
          this.$message.success(`[${location}] uid ${uid} 已标记为已扫码`);
          this.addLog(`扫码模拟[${location}]: uid=${uid} 已扫码`, 'running');
          if (location === '01002') {
            this.scanInput01002 = '';
          } else {
            this.scanInput01006 = '';
          }
        } else {
          this.$message.error(res?.message || '扫码失败，请重试');
        }
      } catch (e) {
        console.error('扫码模拟失败:', e);
        this.$message.error('网络异常，请重试');
      }
    },

    // ================= 发送目的地 =================
    async handleSendDestination() {
      if (!this.currentExecutingBatch) {
        this.$message.warning('暂无运行中的批次，请先通过 PDA 确认批次');
        return;
      }
      if (
        !this.currentDestination ||
        !this.currentDestination.destinationCode
      ) {
        this.$message.warning('当前批次未设置目的地，请先通过 PDA 设置目的地');
        return;
      }
      const batchId = this.currentExecutingBatch.batch.id;
      try {
        // 1. 单独查询当前批次最新托盘列表
        const listRes = await HttpUtil.get(
          `/produce_pallet/listByBatchId?batchId=${batchId}`
        );
        if (!listRes || !listRes.data) {
          this.$message.error('查询托盘列表失败，请重试');
          return;
        }
        const pallets = listRes.data;
        // 2. 遍历找第一个没有发送过目的地的托盘（send_status=0）
        const target = pallets.find(
          (p) => !p.sendStatus || p.sendStatus === '0'
        );
        if (!target) {
          this.$message.warning('当前批次所有托盘均已发送过目的地');
          return;
        }
        // 3. 调后端发送目的地接口
        const res = await HttpUtil.post('/produce_pallet/sendDestination', {
          palletId: String(target.id),
          virtualId: target.virtualId,
          destinationCode: this.currentDestination.destinationCode
        });
        if (res && res.code === '200') {
          const updated = res.data;
          const trayStatusText =
            {
              0: '未扫描',
              1: '部分扫描完成',
              2: '全部扫描完成'
            }[updated.trayStatus] || '未知状态';
          this.addLog(
            `发送目的地: 托盘 ${updated.palletNo || updated.id}(virtualId=${
              updated.virtualId
            }) → 目的地=${updated.sendDestinationCode}，扫码状态=${
              updated.trayStatus
            }(${trayStatusText})`,
            'running'
          );
          this.$message.success(`目的地已发送: ${updated.sendDestinationCode}`);
        } else {
          this.$message.error(res?.message || '发送目的地失败，请重试');
        }
      } catch (e) {
        console.error('发送目的地失败:', e);
        this.$message.error('操作失败，请重试');
      }
    },

    // ================= 上货信息面板 =================
    async triggerVirtualIdRequest() {
      // 1. 校验：必须有运行中的批次
      if (!this.currentExecutingBatch) {
        this.$message.warning('暂无运行中的批次，请先通过 PDA 确认批次');
        return;
      }

      const pallets = this.currentExecutingBatch.pallets || [];

      // 2. 校验：已发送数量未超限
      const sentCount = pallets.filter((p) => p.virtualId).length;
      if (sentCount >= 28) {
        this.$message.warning(
          '本批次已完成 28 个托盘上货，请等待 PDA 重新设置目的地'
        );
        return;
      }

      // 3. 找到当前批次中第一个没有虚拟ID的托盘
      const targetPallet = pallets.find((p) => !p.virtualId);
      if (!targetPallet) {
        this.$message.warning('当前批次所有托盘已分配虚拟ID，无可处理托盘');
        return;
      }

      // 4. 生成唯一虚拟ID（时间戳，天然不重复）
      const virtualId = 'VID' + Date.now();

      // 5. 调接口持久化到数据库
      try {
        const res = await HttpUtil.post('/produce_pallet/assignVirtualId', {
          palletId: String(targetPallet.id),
          virtualId: virtualId
        });
        if (!res || !res.data) {
          this.$message.error('分配虚拟ID失败，请重试');
          return;
        }
        const updatedPallet = res.data; // PalletDetailDTO

        // 6. 更新面板A-第二部分（最近处理托盘快照）
        const goods = updatedPallet.goods || [];
        this.lastProcessedPallet = {
          virtualId: updatedPallet.virtualId,
          cargoName: goods.length > 0 ? goods[0].productName : '--',
          barcodes: goods.map((g) => g.uid)
        };

        // 7. 将托盘追加到上货区队列（前端展示）
        const trayEntry = {
          palletId: String(updatedPallet.id),
          trayCode: updatedPallet.palletNo || 'P' + updatedPallet.id,
          virtualId: updatedPallet.virtualId,
          trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
          batchId: String(updatedPallet.batchId),
          destination: this.currentDestination
            ? this.currentDestination.destinationCode
            : '',
          sendStatus: '0',
          state: '1',
          barcodes: this.lastProcessedPallet.barcodes
        };
        this.queues[0].trayInfo.push(trayEntry);

        // 8. 更新本地批次缓存中该托盘的 virtualId（避免轮询刷新前重复分配）
        const localPallet = pallets.find((p) => p.id === targetPallet.id);
        if (localPallet) {
          this.$set(localPallet, 'virtualId', virtualId);
        }

        this.$message.success(
          `托盘 ${
            updatedPallet.palletNo || updatedPallet.id
          } 已分配虚拟ID: ${virtualId}`
        );
      } catch (e) {
        console.error('触发写虚拟ID请求失败:', e);
        this.$message.error('操作失败，请重试');
      }
    },

    // ================= 测试面板：电机信号模拟 =================
    /**
     * 上货前电机信号：将上货区第一个托盘移入指定预热(Yxxx)队列
     * @param {Object} targetQueue - 目标预热队列对象
     */
    triggerPreHeatMotorSignal(targetQueue) {
      const loadingArea = this.queues[0];
      if (!loadingArea.trayInfo || loadingArea.trayInfo.length === 0) {
        this.$message.warning(
          `上货区暂无托盘，无法移入 ${targetQueue.queueName}`
        );
        return;
      }
      if (!Array.isArray(targetQueue.trayInfo)) {
        this.$set(targetQueue, 'trayInfo', []);
      }
      const tray = loadingArea.trayInfo.splice(0, 1)[0];
      targetQueue.trayInfo.push(tray);
      this.addLog(
        `[电机信号] 上货前电机触发(${targetQueue.queueName})：托盘 ${tray.trayCode} 从上货区移入 ${targetQueue.queueName}`
      );
      this.$message.success(
        `托盘 ${tray.trayCode} 已从上货区移入 ${targetQueue.queueName}`
      );
    },

    /**
     * 灭菌后预热信号：删除指定灭菌(xxxx)队列的第一个托盘
     * @param {Object} targetQueue - 目标灭菌队列对象
     */
    triggerSterilizationMotorSignal(targetQueue) {
      if (!targetQueue.trayInfo || targetQueue.trayInfo.length === 0) {
        this.$message.warning(`${targetQueue.queueName} 队列暂无托盘`);
        return;
      }
      const tray = targetQueue.trayInfo.splice(0, 1)[0];
      this.addLog(
        `[电机信号] 灭菌后预热信号触发(${targetQueue.queueName})：托盘 ${tray.trayCode} 已从队列首位删除`
      );
      this.$message.success(
        `${targetQueue.queueName} 队列托盘 ${tray.trayCode} 已删除`
      );
    },

    // ================= 分组索引构建 =================
    /**
     * 构建分组索引，并使用 Object.freeze 冻结以提升性能
     * 索引结构：{ 'G_01008_01009': ['01008', '01009'], ... }
     */
    buildGroupIndex() {
      const index = {};
      Object.keys(this.deviceNodes).forEach((id) => {
        const device = this.deviceNodes[id];
        if (device.groupId) {
          if (!index[device.groupId]) {
            index[device.groupId] = [];
          }
          index[device.groupId].push(id);
        }
      });
      // 冻结索引对象，防止意外修改，同时提升 Vue 响应式性能
      this.groupIndex = Object.freeze(index);
    },

    /**
     * 获取设备节点的显示状态（支持分组状态合并）
     * @param {Object} node - 设备节点对象
     * @returns {boolean} - 是否处于激活状态（一亮全亮）
     */
    hasOwnField(target, key) {
      return !!target && Object.prototype.hasOwnProperty.call(target, key);
    },
    hasMotorStatus(target) {
      return this.hasOwnField(target, 'motorStatus');
    },
    hasSensorStatus(target) {
      return this.hasOwnField(target, 'sensorStatus');
    },
    hasTrayId(target) {
      return this.hasOwnField(target, 'trayId');
    },
    hasDestination(target) {
      return this.hasOwnField(target, 'destination');
    },
    hasAnyStatus(target) {
      return this.hasMotorStatus(target) || this.hasSensorStatus(target);
    },
    getDisplayStatus(node) {
      const hasMotor = this.hasMotorStatus(node);
      const hasSensor = this.hasSensorStatus(node);
      const nodeMotorOn = hasMotor && !!node.motorStatus;
      const nodeSensorOn = hasSensor && !!node.sensorStatus;

      // 独立设备：返回自身状态
      if (!node.groupId) {
        return nodeMotorOn || nodeSensorOn;
      }
      // 成组设备：遍历组内所有设备，任一激活则全亮
      const groupIds = this.groupIndex?.[node.groupId] || [];
      for (const id of groupIds) {
        const device = this.deviceNodes[id];
        if (!device) continue;
        const motorOn = this.hasMotorStatus(device) && !!device.motorStatus;
        const sensorOn = this.hasSensorStatus(device) && !!device.sensorStatus;
        if (motorOn || sensorOn) {
          return true;
        }
      }
      return false;
    },

    // ================= 队列容量进度条 =================
    /**
     * 计算队列容量百分比
     * @param {number} queueId - 队列ID
     * @returns {number} 0-100 的百分比值
     */
    getQueueCapacityPercent(queueId) {
      const queue = this.queues.find((q) => q.id === queueId);
      if (!queue || !queue.trayInfo) return 0;

      const currentCount = queue.trayInfo.length || 0;
      // 默认最大容量为 28，可根据实际需求调整或从 marker 配置中读取
      const maxCapacity = 28;
      const percent = Math.min((currentCount / maxCapacity) * 100, 100);
      return percent;
    },

    // ================= 设备层交互逻辑 =================
    // 1. 点击节点显示弹窗
    handleNodeClick(node, event) {
      // 根据是否分组，决定弹窗展示的设备列表
      if (!node.groupId) {
        // 独立设备：单个设备数组
        this.popoverList = [node];
      } else {
        // 成组设备：获取组内所有设备
        const groupIds = this.groupIndex?.[node.groupId] || [];
        this.popoverList = groupIds.map((id) => ({
          id,
          ...this.deviceNodes[id]
        }));
      }
      // 保留 popoverData 用于兼容性（指向组长设备）
      this.popoverData = node;
      this.currentSelectedNodeId = node.id;

      // 1. 获取点击目标（小圆点）的屏幕矩形
      const targetRect = event.currentTarget.getBoundingClientRect();

      // 2. 获取容器（floor-image-container）的屏幕矩形
      const container = this.$refs.floorImageContainer;
      const containerRect = container.getBoundingClientRect();

      // 3. 计算弹窗尺寸
      // 独立设备：320px，成组设备：每个设备约 210px（为容纳编号前缀加宽）
      const popoverWidth =
        this.popoverList.length === 1
          ? 320
          : this.popoverList.length * 210 + 32;
      const popoverHeight = 200; // 预估弹窗高度

      // 4. 计算初始位置（弹窗中心对齐点击点）
      let left = targetRect.left - containerRect.left + targetRect.width / 2;
      let top = targetRect.top - containerRect.top - 12;

      // 5. 边界检测与修正
      // 由于弹窗使用 transform: translate(-50%, -100%)，需要考虑变换后的实际位置

      // 左边界检测：弹窗左边缘 = left - popoverWidth/2
      const popoverLeftEdge = left - popoverWidth / 2;
      if (popoverLeftEdge < 0) {
        // 超出左边界，将弹窗左移
        left = popoverWidth / 2 + 10;
      }

      // 右边界检测：弹窗右边缘 = left + popoverWidth/2
      const containerWidth = containerRect.width;
      const popoverRightEdge = left + popoverWidth / 2;
      if (popoverRightEdge > containerWidth) {
        // 超出右边界，将弹窗右移
        left = containerWidth - popoverWidth / 2 - 10;
      }

      // 上边界检测：弹窗顶部 = top - popoverHeight（因为 -100% transform）
      const popoverTopEdge = top - popoverHeight;
      if (popoverTopEdge < 0) {
        // 超出上边界，改为向下弹出（在点击点下方显示）
        top = targetRect.top - containerRect.top + targetRect.height + 12;
        this.popoverDirection = 'down';
      } else {
        this.popoverDirection = 'up';
      }

      this.popoverPosition = { left, top };
      this.popoverVisible = true;
    },

    closePopover() {
      this.popoverVisible = false;
      this.currentSelectedNodeId = null;
    },

    handleGlobalClick() {
      // 点击页面空白处关闭弹窗
      if (this.popoverVisible) {
        this.closePopover();
      }
    },
    // ==========================================================

    changeQueueExpanded() {
      this.isQueueExpanded = !this.isQueueExpanded;
      // 当展开面板时，刷新当前选中队列的托盘信息
      if (this.isQueueExpanded && this.selectedQueueIndex !== -1) {
        this.showTrays(this.selectedQueueIndex);
      }
    },
    // 显示订单查询对话框
    showOrderQueryDialog() {
      this.orderQueryDialogVisible = true;
    },
    toggleButtonState(button) {
      if (button === 'start') {
        this.$confirm('确定要全线启动吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates = {
              start: false,
              stop: false,
              reset: false,
              fault_reset: false,
              clear: false
            };
            // 全线启动：写入 DB1001.DBW2（WCS-全线启动），见 写入PLC点位.csv
            ipcRenderer.send('writeValuesToPLC', 'W_DBW2', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'W_DBW2', 0);
            }, 2000);
            this.buttonStates[button] = !this.buttonStates[button];
            this.$message.success('全线启动成功');
            this.addLog('全线启动成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'stop') {
        this.$confirm('确定要全线停止吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates = {
              start: false,
              stop: false,
              reset: false,
              fault_reset: false,
              clear: false
            };
            // 全线停止：写入 DB1001.DBW4（WCS-全线停止），见 写入PLC点位.csv
            ipcRenderer.send('writeValuesToPLC', 'W_DBW4', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'W_DBW4', 0);
            }, 2000);
            this.buttonStates[button] = !this.buttonStates[button];
            this.$message.success('全线停止成功');
            this.addLog('全线停止成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'reset') {
        this.$confirm('确定要全线暂停吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates = {
              start: false,
              stop: false,
              reset: false,
              fault_reset: false,
              clear: false
            };
            this.buttonStates[button] = !this.buttonStates[button];
            // 全线暂停：写入点位以 写入PLC点位.csv 为准，暂用 W_DBW6；可按实际协议调整
            ipcRenderer.send('writeValuesToPLC', 'W_DBW6', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'W_DBW6', 0);
            }, 2000);
            this.$message.success('全线暂停成功');
            this.addLog('全线暂停成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'fault_reset') {
        this.$confirm('确定要故障复位吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            // 故障复位：写入 DB1001.DBW8（WCS-故障复位），见 写入PLC点位.csv
            ipcRenderer.send('writeValuesToPLC', 'W_DBW8', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'W_DBW8', 0);
            }, 2000);
            this.$message.success('故障复位成功');
            this.addLog('故障复位成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'clear') {
        this.$confirm('确定要全线清空吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            // 把所有的队列，初试状态都清空
            this.queues.forEach((queue) => {
              queue.trayInfo = [];
            });
            this.nowScanTrayInfo = {};
            this.runningLogs = []; // 修改为空数组
            this.alarmLogs = []; // 修改为空数组
            this.nowTrays = [];
            this.$message.success('全线清空成功');
            this.addLog('全线清空成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      }
    },
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    initializeMarkers() {
      this.$nextTick(() => {
        this.updateMarkerPositions();
        window.addEventListener('resize', this.updateMarkerPositions);
      });
    },
    // 修改：updateMarkerPositions 增加对 device-signal-node 的处理
    updateMarkerPositions() {
      const images = document.querySelectorAll('.floor-image');
      images.forEach((image) => {
        const imageWrapper = image.parentElement;
        if (!imageWrapper) return;

        const markers = imageWrapper.querySelectorAll('.queue-marker');
        const carts = imageWrapper.querySelectorAll('.cart-container');
        // ============= 新增：获取设备节点 =============
        const nodes = imageWrapper.querySelectorAll(
          '.device-signal-node, .preheating-room-marker, .marker-with-panel, .analysis-status-marker'
        );
        // ===========================================

        const wrapperRect = imageWrapper.getBoundingClientRect();

        // 计算图片的实际显示区域
        const displayedWidth = image.width;
        const displayedHeight = image.height;
        const scaleX = displayedWidth / image.naturalWidth;
        const scaleY = displayedHeight / image.naturalHeight;

        // 计算图片在容器中的偏移量
        const imageOffsetX = (wrapperRect.width - displayedWidth) / 2;
        const imageOffsetY = (wrapperRect.height - displayedHeight) / 2;

        // 进度条基础高度（对应原始图片尺寸）
        const baseMarkerHeight = 275;

        markers.forEach((marker) => {
          const x = parseFloat(marker.dataset.x);
          const y = parseFloat(marker.dataset.y);
          if (!isNaN(x) && !isNaN(y)) {
            marker.style.left = `${imageOffsetX + x * scaleX}px`;
            marker.style.top = `${imageOffsetY + y * scaleY}px`;
            if (!marker.dataset.compact) {
              marker.style.height = `${baseMarkerHeight * scaleY}px`;
            }
          }
        });

        // 更新小车位置和大小
        carts.forEach((cart) => {
          const x = parseFloat(cart.dataset.x);
          const y = parseFloat(cart.dataset.y);
          const width = parseFloat(cart.dataset.width);
          if (!isNaN(x) && !isNaN(y)) {
            cart.style.left = `${imageOffsetX + x * scaleX}px`;
            cart.style.top = `${imageOffsetY + y * scaleY}px`;
            if (!isNaN(width)) {
              cart.style.width = `${width * scaleX}px`;
            }
          }
        });

        // ============= 新增：更新设备节点位置 =============
        nodes.forEach((node) => {
          const x = parseFloat(node.dataset.x);
          const y = parseFloat(node.dataset.y);
          if (!isNaN(x) && !isNaN(y)) {
            // 使用与 marker 相同的逻辑进行绝对定位计算
            node.style.left = `${imageOffsetX + x * scaleX}px`;
            node.style.top = `${imageOffsetY + y * scaleY}px`;
          }
        });
        // ================================================
      });
    },
    // 根据PLC数值更新小车位置
    updateCartPositionByValue(cartId, value) {
      const cart = this.carts.find((c) => c.id === cartId);
      if (!cart) return;

      // 获取对应小车的y轴范围
      const xRange = this.cartXRanges[`cart${cartId}`];
      if (!xRange) return;

      // 获取PLC数值范围
      const plcRanges = {
        cart1: { min: 19, max: 6210 }
      };

      const plcRange = plcRanges[`cart${cartId}`];
      if (!plcRange) return;

      // 计算比例（基于新的范围起点）
      const ratio = value / plcRange.max;

      // 根据比例计算y轴位置（PLC原点对应y轴最小值，PLC终点对应y轴最大值）
      const xPosition = xRange.min + (xRange.max - xRange.min) * ratio;

      // 更新小车位置
      cart.x = Math.round(xPosition);

      // 更新视图
      this.$nextTick(() => {
        this.updateMarkerPositions();
      });
    },
    showTrays(index) {
      if (index < 0 || index >= this.queues.length) {
        this.nowTrays = [];
        return;
      }

      this.selectedQueueIndex = index;
      const selectedQueue = this.queues[index];

      if (!selectedQueue) {
        this.nowTrays = [];
        return;
      }

      try {
        // 确保 trayInfo 是数组
        const trayInfo = Array.isArray(selectedQueue.trayInfo)
          ? selectedQueue.trayInfo
          : [];

        this.nowTrays = trayInfo
          .map((tray) => ({
            id: tray.trayCode || '',
            name: tray.trayCode ? `托盘 ${tray.trayCode}` : '未知托盘',
            time: tray.trayTime || '',
            isTerile: tray.isTerile,
            sendTo: tray.sendTo || '', // 添加sendTo属性
            state: tray.state || '', // 添加state属性
            sequenceNumber: tray.sequenceNumber || '', // 添加sequenceNumber属性
            orderId: tray.orderId || '', // 添加订单ID
            productCode: tray.productCode || '', // 添加物料编码
            productName: tray.productName || '', // 添加产品名称
            unit: tray.unit || '', // 添加规格
            batchNo: tray.batchNo || '' // 添加备注
          }))
          .filter((tray) => tray.id); // 过滤掉没有 id 的托盘
      } catch (error) {
        console.error('处理托盘信息时出错:', error);
        this.nowTrays = [];
      }
    },
    handleDragStart(event, tray, queueIndex) {
      if (!tray || queueIndex === undefined) return;

      this.isDragging = true;
      this.draggedTray = tray;
      this.dragSourceQueue = queueIndex;

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', tray.id);

      setTimeout(() => {
        event.target.classList.add('dragging');
      }, 0);
    },
    handleDragEnd(event) {
      this.isDragging = false;
      event.target.classList.remove('dragging');
    },
    async handleDrop(targetQueueIndex) {
      if (
        !this.draggedTray ||
        this.dragSourceQueue === null ||
        targetQueueIndex === null
      )
        return;
      if (this.dragSourceQueue === targetQueueIndex) return;

      const sourceQueue = this.queues[this.dragSourceQueue];
      const targetQueue = this.queues[targetQueueIndex];

      if (!sourceQueue || !targetQueue) {
        this.$message.error('队列不存在，无法移动托盘');
        return;
      }

      sourceQueue.trayInfo = Array.isArray(sourceQueue.trayInfo)
        ? sourceQueue.trayInfo
        : [];
      targetQueue.trayInfo = Array.isArray(targetQueue.trayInfo)
        ? targetQueue.trayInfo
        : [];

      try {
        // 确认移动操作
        await this.$confirm(
          `确认将托盘 ${this.draggedTray.id} 从 ${sourceQueue.queueName} 移动到 ${targetQueue.queueName}？`,
          '移动托盘确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        if (!this.draggedTray.id) {
          throw new Error('托盘信息无效');
        }

        const trayIndex = sourceQueue.trayInfo.findIndex(
          (t) => t.trayCode === this.draggedTray.id
        );
        if (trayIndex === -1) {
          throw new Error('找不到要移动的托盘');
        }

        const [movedTray] = sourceQueue.trayInfo.splice(trayIndex, 1);
        targetQueue.trayInfo.push(movedTray);

        // 更新队列数据
        this.updateQueueTrays(sourceQueue.id, sourceQueue.trayInfo);
        this.updateQueueTrays(targetQueue.id, targetQueue.trayInfo);

        const currentQueueIndex = this.selectedQueueIndex;
        if (
          currentQueueIndex === targetQueueIndex ||
          currentQueueIndex === this.dragSourceQueue
        ) {
          this.$nextTick(() => {
            this.showTrays(currentQueueIndex);
          });
        }

        // 添加托盘移动日志
        this.addLog(
          `托盘 ${movedTray.trayCode} 从 ${sourceQueue.queueName} 移动到 ${targetQueue.queueName}`
        );

        this.$message({
          type: 'success',
          message: `托盘 ${movedTray.trayCode} 已成功移动到 ${targetQueue.queueName}`,
          duration: 2000
        });
      } catch (error) {
        if (error === 'cancel') {
          // 用户取消操作
          return;
        }
        console.error('移动托盘时出错:', error);
        this.$message.error(error.message || '移动托盘失败，请重试');
      } finally {
        this.draggedTray = null;
        this.dragSourceQueue = null;
        this.isDragging = false;
      }
    },
    // 添加更新队列托盘的方法
    updateQueueTrays(queueId, trayInfo) {
      // 查找对应ID的队列
      const queueIndex = this.queues.findIndex((queue) => queue.id === queueId);
      if (queueIndex !== -1) {
        // 直接更新前端队列数据
        this.queues[queueIndex].trayInfo = trayInfo;
        // 添加日志
        this.addLog(`队列 ${this.queues[queueIndex].queueName} 数据已更新`);
      } else {
        this.$message.error('找不到队列ID: ' + queueId);
      }
    },
    async deleteTray(tray, index) {
      if (!this.selectedQueue) return;

      try {
        // 确认是否删除
        await this.$confirm(
          '确认要删除该托盘吗？删除后请注意是否需要同步修改PLC队列数据！',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        // 从队列中移除托盘，直接使用传递的index
        if (index >= 0 && index < this.selectedQueue.trayInfo.length) {
          this.selectedQueue.trayInfo.splice(index, 1);

          // 更新队列数据
          this.updateQueueTrays(
            this.selectedQueue.id,
            this.selectedQueue.trayInfo
          );

          // 刷新显示
          this.showTrays(this.selectedQueueIndex);

          // 添加删除托盘日志
          this.addLog(
            `托盘 ${tray.id} 已从 ${this.selectedQueue.queueName} 删除`
          );

          this.$message.success('托盘删除成功');
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除托盘失败，请重试');
        }
      }
    },
    // 上移托盘
    async moveTrayUp(index) {
      if (!this.selectedQueue || index <= 0) return;

      try {
        // 获取当前队列的托盘信息
        const trayInfo = Array.isArray(this.selectedQueue.trayInfo)
          ? this.selectedQueue.trayInfo
          : [];

        const currentTray = trayInfo[index];
        const prevTray = trayInfo[index - 1];

        // 确认上移操作
        await this.$confirm(
          `确认将托盘 ${currentTray.trayCode} 上移一位（与 ${prevTray.trayCode} 交换位置）？`,
          '上移托盘确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        // 交换位置
        trayInfo[index] = prevTray;
        trayInfo[index - 1] = currentTray;

        // 更新队列数据
        this.updateQueueTrays(this.selectedQueue.id, trayInfo);

        // 刷新显示
        this.showTrays(this.selectedQueueIndex);

        // 添加操作日志
        this.addLog(
          `托盘 ${currentTray.trayCode} 在 ${this.selectedQueue.queueName} 中上移`
        );

        this.$message.success('托盘上移成功');
      } catch (error) {
        if (error === 'cancel') {
          // 用户取消操作
          return;
        }
        this.$message.error('托盘上移失败，请重试');
      }
    },
    // 下移托盘
    async moveTrayDown(index) {
      if (!this.selectedQueue || index >= this.nowTrays.length - 1) return;

      try {
        // 获取当前队列的托盘信息
        const trayInfo = Array.isArray(this.selectedQueue.trayInfo)
          ? this.selectedQueue.trayInfo
          : [];

        const currentTray = trayInfo[index];
        const nextTray = trayInfo[index + 1];

        // 确认下移操作
        await this.$confirm(
          `确认将托盘 ${currentTray.trayCode} 下移一位（与 ${nextTray.trayCode} 交换位置）？`,
          '下移托盘确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        // 交换位置
        trayInfo[index] = nextTray;
        trayInfo[index + 1] = currentTray;

        // 更新队列数据
        this.updateQueueTrays(this.selectedQueue.id, trayInfo);

        // 刷新显示
        this.showTrays(this.selectedQueueIndex);

        // 添加操作日志
        this.addLog(
          `托盘 ${currentTray.trayCode} 在 ${this.selectedQueue.queueName} 中下移`
        );

        this.$message.success('托盘下移成功');
      } catch (error) {
        if (error === 'cancel') {
          // 用户取消操作
          return;
        }
        this.$message.error('托盘下移失败，请重试');
      }
    },
    showAddTrayDialog() {
      this.addTrayDialogVisible = true;
      this.newTrayForm = {
        trayCode: '',
        batchId: '',
        isSterile: true
      };
    },
    // 显示托盘检索弹窗
    showTraySearchDialog() {
      this.traySearchDialogVisible = true;
      this.traySearchForm.trayCode = '';
      this.traySearchForm.orderId = '';
      this.traySearchForm.productCode = '';
      this.traySearchForm.productName = '';
      this.searchResults = [];
      this.hasSearched = false;
    },
    // 托盘检索方法
    async searchTray() {
      // 检查至少有一个查询条件
      const hasSearchCondition =
        this.traySearchForm.trayCode.trim() ||
        this.traySearchForm.orderId.trim() ||
        this.traySearchForm.productCode.trim() ||
        this.traySearchForm.productName.trim();

      if (!hasSearchCondition) {
        this.$message.warning('请至少输入一个查询条件');
        return;
      }

      this.searchLoading = true;
      this.hasSearched = true;
      this.searchResults = [];

      try {
        const searchCriteria = {
          trayCode: this.traySearchForm.trayCode.trim(),
          orderId: this.traySearchForm.orderId.trim(),
          productCode: this.traySearchForm.productCode.trim(),
          productName: this.traySearchForm.productName.trim()
        };

        // 在所有队列中查找符合条件的托盘
        const foundTrays = [];

        for (const queue of this.queues) {
          if (queue.trayInfo && Array.isArray(queue.trayInfo)) {
            for (const tray of queue.trayInfo) {
              // 检查是否符合所有输入的查询条件
              let matches = true;

              if (
                searchCriteria.trayCode &&
                String(tray.trayCode || '').trim() !==
                  String(searchCriteria.trayCode).trim()
              ) {
                matches = false;
              }
              if (
                searchCriteria.orderId &&
                (!tray.orderId ||
                  !String(tray.orderId).includes(searchCriteria.orderId))
              ) {
                matches = false;
              }
              if (
                searchCriteria.productCode &&
                (!tray.productCode ||
                  !String(tray.productCode).includes(
                    searchCriteria.productCode
                  ))
              ) {
                matches = false;
              }
              if (
                searchCriteria.productName &&
                (!tray.productName ||
                  !String(tray.productName).includes(
                    searchCriteria.productName
                  ))
              ) {
                matches = false;
              }

              if (matches) {
                foundTrays.push({
                  ...tray,
                  queueName: queue.queueName
                });
              }
            }
          }
        }

        if (foundTrays.length > 0) {
          this.searchResults = foundTrays;
          this.addLog(
            `托盘检索成功：找到 ${foundTrays.length} 个符合条件的托盘`
          );
        } else {
          this.searchResults = [];
          this.addLog('托盘检索：未找到符合条件的托盘');
        }
      } catch (error) {
        console.error('托盘检索失败:', error);
        this.$message.error('托盘检索失败，请重试');
        this.addLog(`托盘检索失败：${error.message}`);
      } finally {
        this.searchLoading = false;
      }
    },
    async submitAddTray() {
      if (!this.selectedQueue) return;

      try {
        // 表单验证
        await this.$refs.newTrayForm.validate();

        this.isSubmitting = true;
        const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const newTray = {
          trayCode: this.newTrayForm.trayCode,
          trayTime: currentTime,
          batchId: this.newTrayForm.batchId,
          isTerile: this.newTrayForm.isSterile ? 1 : 0,
          state: '0',
          sendTo: '',
          sequenceNumber: null
        };

        // 确保trayInfo是数组
        if (!Array.isArray(this.selectedQueue.trayInfo)) {
          this.selectedQueue.trayInfo = [];
        }

        // 添加新托盘
        this.selectedQueue.trayInfo.push(newTray);

        // 更新队列数据
        this.updateQueueTrays(
          this.selectedQueue.id,
          this.selectedQueue.trayInfo
        );

        // 刷新显示
        this.showTrays(this.selectedQueueIndex);

        // 添加新托盘日志
        this.addLog(
          `新托盘 ${newTray.trayCode} 已添加到 ${
            this.selectedQueue.queueName
          }，批次号：${newTray.batchId}，${
            newTray.isTerile === 1 ? '灭菌' : '不灭菌'
          }`
        );

        this.$message.success('托盘添加成功');
        this.addTrayDialogVisible = false;
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('添加托盘失败，请重试');
        }
      } finally {
        this.isSubmitting = false;
      }
    },
    // 点击队列标识
    handleQueueMarkerClick(queueId) {
      // 展开队列面板
      this.isQueueExpanded = true;

      // 找到队列在数组中的索引
      const queueIndex = this.queues.findIndex((q) => q.id === queueId);
      if (queueIndex !== -1) {
        // 选中并显示对应队列
        this.selectedQueueIndex = queueIndex;
        this.showTrays(queueIndex);
      }
    },
    // 添加新的日志方法
    addLog(message, type = 'running') {
      const log = {
        id: this.logId++,
        type,
        message,
        timestamp: new Date().getTime(),
        unread: type === 'alarm'
      };

      if (type === 'running') {
        this.runningLogs.unshift(log);
        // 保持日志数量在合理范围内
        if (this.runningLogs.length > 100) {
          this.runningLogs.pop();
        }
      } else {
        this.alarmLogs.unshift(log);
        if (this.alarmLogs.length > 100) {
          this.alarmLogs.pop();
        }
      }
      // 同时写入本地文件
      const logTypeText = type === 'running' ? '运行日志' : '报警日志';
      const logMessage = `[${logTypeText}] ${message}`;
      ipcRenderer.send('writeLogToLocal', logMessage);
    },
    convertToWord(value) {
      if (value < 0) {
        return (value & 0xffff) >>> 0; // 负数转换为无符号的16位整数
      } else {
        return value; // 非负数保持不变
      }
    },
    // 更新数据库队列信息
    updateQueueInfo(id) {
      const param = {
        id: id,
        trayInfo: JSON.stringify(this.queues[id - 1].trayInfo)
      };
      HttpUtil.post('/queue_info/update', param).catch((err) => {
        this.$message.error(err);
      });
    },
    // 从数据库加载队列信息
    loadQueueInfoFromDatabase() {
      HttpUtil.post('/queue_info/queryQueueList', {})
        .then((res) => {
          if (res.data && res.data.length > 0) {
            // 遍历数据库返回的队列信息
            res.data.forEach((queueData) => {
              const queueId = queueData.id;
              const queueIndex = queueId - 1; // 数组索引从0开始，队列ID从1开始

              // 确保队列索引有效
              if (queueIndex >= 0 && queueIndex < this.queues.length) {
                try {
                  // 解析托盘信息JSON字符串
                  const trayInfo = queueData.trayInfo
                    ? JSON.parse(queueData.trayInfo)
                    : [];
                  // 赋值给对应的队列
                  this.queues[queueIndex].trayInfo = Array.isArray(trayInfo)
                    ? trayInfo
                    : [];
                  this.addLog(
                    `已加载队列${queueData.queueName || queueId}的托盘信息，共${
                      this.queues[queueIndex].trayInfo.length
                    }个托盘`
                  );
                } catch (error) {
                  console.error(`解析队列${queueId}的托盘信息失败:`, error);
                  this.queues[queueIndex].trayInfo = [];
                  this.addLog(`队列${queueId}托盘信息解析失败，已重置为空`);
                }
              }
            });
            this.addLog('队列信息加载完成');
          } else {
            this.addLog('数据库中暂无队列信息');
          }
        })
        .catch((err) => {
          console.error('加载队列信息失败:', err);
          this.$message.error('加载队列信息失败: ' + err);
          this.addLog('队列信息加载失败');
        });
    },
    // 切换到报警日志时清除未读状态
    switchToAlarmLog() {
      this.activeLogType = 'alarm';
      // 清除所有报警日志的未读状态
      this.alarmLogs.forEach((log) => {
        log.unread = false;
      });
    },
    // ============ PDA WebSocket 相关 ============
    initWebSocketServer() {
      try {
        // 先移除旧监听，避免重复注册导致一次扫码触发多次提示
        this._removeWebSocketIpcListeners();
        this._wsStatusHandler = (event, status) => {
          this.wsServerStatus = status;
        };
        this._mobileScanCodeHandler = (event, data) => {
          this.handleMobileScanCode(data);
        };
        this._mobileTrayDataChangedHandler = (event, data) => {
          this.handleMobileTrayDataChanged(data);
        };
        ipcRenderer.on('websocket-status-update', this._wsStatusHandler);
        ipcRenderer.on('mobile-scan-code', this._mobileScanCodeHandler);
        ipcRenderer.on(
          'mobile-tray-data-changed',
          this._mobileTrayDataChangedHandler
        );
        ipcRenderer.send('get-websocket-status');
        if (this._wsStatusInterval) clearInterval(this._wsStatusInterval);
        this._wsStatusInterval = setInterval(() => {
          ipcRenderer.send('get-websocket-status');
        }, 5000);
      } catch (error) {
        console.error('PDA WebSocket 初始化失败:', error);
      }
    },
    _removeWebSocketIpcListeners() {
      if (this._wsStatusHandler) {
        ipcRenderer.removeListener(
          'websocket-status-update',
          this._wsStatusHandler
        );
        this._wsStatusHandler = null;
      }
      if (this._mobileScanCodeHandler) {
        ipcRenderer.removeListener(
          'mobile-scan-code',
          this._mobileScanCodeHandler
        );
        this._mobileScanCodeHandler = null;
      }
      if (this._mobileTrayDataChangedHandler) {
        ipcRenderer.removeListener(
          'mobile-tray-data-changed',
          this._mobileTrayDataChangedHandler
        );
        this._mobileTrayDataChangedHandler = null;
      }
      if (this._wsStatusInterval) {
        clearInterval(this._wsStatusInterval);
        this._wsStatusInterval = null;
      }
    },
    handleMobileScanCode(data) {
      const { method, trayCode, source, clientId } = data;
      try {
        if (this[method] && typeof this[method] === 'function') {
          this[method](trayCode, source);
          this.addLog(`PDA扫码处理: ${method}(${trayCode})`, 'running');
          ipcRenderer.send('send-scan-result-to-mobile', {
            clientId: clientId,
            result: {
              success: true,
              message: '扫码处理成功',
              data: { trayCode, location: method }
            }
          });
        } else {
          throw new Error(`方法 ${method} 不存在`);
        }
      } catch (error) {
        console.error('处理PDA扫码失败:', error);
        this.addLog(`PDA扫码处理失败: ${error.message}`, 'alarm');
        ipcRenderer.send('send-scan-result-to-mobile', {
          clientId: clientId,
          result: {
            success: false,
            message: `处理失败: ${error.message}`,
            data: null
          }
        });
      }
    },
    /** PDA 扫码添加托盘到上货区（由 handleMobileScanCode 调用） */
    addTrayFromPda(trayCode, source) {
      const shanghuoQueue = this.queues.find((q) => q.queueName === '上货区');
      if (!shanghuoQueue) {
        throw new Error('未找到上货区队列');
      }
      const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
      const newTray = {
        trayCode: trayCode,
        trayTime: currentTime,
        batchId: 'PDA',
        isTerile: 1,
        state: '0',
        sendTo: '',
        sequenceNumber: null
      };
      if (!Array.isArray(shanghuoQueue.trayInfo)) {
        shanghuoQueue.trayInfo = [];
      }
      shanghuoQueue.trayInfo.push(newTray);
      this.updateQueueTrays(shanghuoQueue.id, shanghuoQueue.trayInfo);
      this.addLog(
        `PDA扫码托盘 ${trayCode} 已加入上货区（来源: ${source}）`,
        'running'
      );
      this.$message.success(`托盘 ${trayCode} 已加入上货区`);
    },
    handleMobileTrayDataChanged(data) {
      console.log('收到移动端托盘数据变更通知:', data);
      // 可按需重新加载队列数据
    },
    showMobileConnectionStatus() {
      this.mobileConnectionDialogVisible = true;
      this.refreshMobileConnections();
    },
    refreshMobileConnections() {
      this.refreshingConnections = true;
      ipcRenderer.send('get-websocket-clients');
      ipcRenderer.once('websocket-clients-list', (event, clients) => {
        this.mobileConnections = clients || [];
        this.refreshingConnections = false;
      });
    },
    formatConnectionTime(timeValue) {
      if (!timeValue) return '--';
      return moment(timeValue).format('YYYY-MM-DD HH:mm:ss');
    },

    // ================= 预热柜到灭菌柜 =================
    /**
     * 预热柜到灭菌柜 - 执行
     * 参考写入点位.csv:
     *   DB1001.DBW14: WCS执行出货预热房编号(起始: 3201-3215)
     *   DB1001.DBW16: WCS执行进货灭菌柜编号(目的地: 3201-3215)
     *   DB1001.DBW18: WCS执行预热房出货命令(BIT0-14对应3201-3215)
     *   DB1001.DBW20: WCS执行进货灭菌柜出货命令(BIT0-14对应3201-3215)
     *   发送命令2秒后取消
     */
    sendToDisinfectionRoom() {
      if (!this.preheatSelectedFrom || !this.sterilizeSelectedTo) {
        this.$message.warning('请选择预热柜和灭菌柜编号');
        return;
      }

      const fromCabinet = Number(this.preheatSelectedFrom);
      const toCabinet = Number(this.sterilizeSelectedTo);
      const fromIdx = PREHEAT_QUEUE_MAP[fromCabinet];
      const toIdx = STERILIZE_QUEUE_MAP[toCabinet];

      // 检查起始预热柜是否有托盘
      const sourceCount =
        this.queues[fromIdx] && this.queues[fromIdx].trayInfo
          ? this.queues[fromIdx].trayInfo.length
          : 0;
      if (sourceCount <= 0) {
        this.$message.warning(
          `预热柜Y${fromCabinet}出队列中没有可用的托盘，请检查起始地数量`
        );
        return;
      }

      // 计算目标总数量
      const destinationCount =
        this.queues[toIdx] && this.queues[toIdx].trayInfo
          ? this.queues[toIdx].trayInfo.length
          : 0;
      this.disinfectionTargetTotal = sourceCount + destinationCount;

      this.addLog(
        `预热到灭菌执行开始：起始预热柜=Y${fromCabinet}，队列数量=${sourceCount}，目的地灭菌柜=${toCabinet}，当前数量=${destinationCount}，目标总数量=${this.disinfectionTargetTotal}`
      );

      this.disinfectionRoomLoading = true;
      this.disinfectionExecuting = true;

      // 1. 写入起始预热柜编号到 W_DBW14 (DB1001.DBW14)，2秒后取消
      this.addLog(`[PLC发送] W_DBW14 = ${fromCabinet} (出货预热房编号)`);
      ipcRenderer.send('writeSingleValueToPLC', 'W_DBW14', fromCabinet);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'W_DBW14');
      }, 2000);

      // 2. 写入目的地灭菌柜编号到 W_DBW16 (DB1001.DBW16)，2秒后取消
      this.addLog(`[PLC发送] W_DBW16 = ${toCabinet} (进货灭菌柜编号)`);
      ipcRenderer.send('writeSingleValueToPLC', 'W_DBW16', toCabinet);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'W_DBW16');
      }, 2000);

      // 3. 设置起始预热柜对应的 W_DBW18 bit位(true)，2秒后取消
      const fromBitKey = PREHEAT_DBW18_MAP[fromCabinet];
      if (fromBitKey) {
        this.addLog(
          `[PLC发送] ${fromBitKey} = true (预热房Y${fromCabinet}出货命令)`
        );
        ipcRenderer.send('writeSingleValueToPLC', fromBitKey, true);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', fromBitKey);
        }, 2000);
      }

      // 4. 设置目的地灭菌柜对应的 W_DBW20 bit位(true)，2秒后取消
      const toBitKey = STERILIZE_DBW20_MAP[toCabinet];
      if (toBitKey) {
        this.addLog(
          `[PLC发送] ${toBitKey} = true (灭菌柜${toCabinet}进货命令)`
        );
        ipcRenderer.send('writeSingleValueToPLC', toBitKey, true);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', toBitKey);
        }, 2000);
      }

      // 显示执行中状态 - 取起始预热柜队列第一个托盘编码
      if (
        this.queues[fromIdx] &&
        this.queues[fromIdx].trayInfo &&
        this.queues[fromIdx].trayInfo.length > 0
      ) {
        this.disinfectionTrayCode =
          this.queues[fromIdx].trayInfo[0].trayCode || '';
      }

      // 更新需进货数量
      this.disinfectionNeedQty = sourceCount;

      this.addLog(
        `预热柜Y${fromCabinet}到灭菌柜${toCabinet}开始执行，需进货：${sourceCount}`
      );
      this.$message.success(
        `已发送从预热柜Y${fromCabinet}到灭菌柜${toCabinet}的执行命令`
      );
    },
    /**
     * 预热柜到灭菌柜 - 取消执行
     */
    cancelDisinfectionRoom() {
      this.disinfectionExecuting = false;
      this.disinfectionTrayCode = '';
      this.disinfectionNeedQty = 0;
      this.disinfectionRoomLoading = false;
      this.preheatSelectedFrom = null;
      this.sterilizeSelectedTo = null;

      this.addLog('预热柜到灭菌柜执行已取消');
      this.$message.info('已取消预热柜到灭菌柜执行');
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateMarkerPositions);
    this._removeWebSocketIpcListeners();
    if (this._pollBatchTimer) {
      clearInterval(this._pollBatchTimer);
      this._pollBatchTimer = null;
    }
    // 取消动态创建的 $watch 监听器
    if (this._queueWatchers && this._queueWatchers.length > 0) {
      this._queueWatchers.forEach((unwatch) => {
        if (typeof unwatch === 'function') {
          unwatch();
        }
      });
      this._queueWatchers = [];
    }
  }
};
</script>
<style lang="less" scoped>
@import './css/MainPage.less';
</style>
