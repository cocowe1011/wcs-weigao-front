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
                <div class="marker-with-panel" data-x="1490" data-y="100">
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

                <!-- 面板C：下货信息卡片 -->
                <div
                  class="preheating-room-marker"
                  data-x="65"
                  data-y="120"
                  style="width: 110px"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">下货信息</div>
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
                    v-if="node.showTray && getDisplayStatus(node)"
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
                    <div class="preheating-room-header">灭菌柜到解析房选择</div>
                    <div class="preheating-room-body">
                      <div class="route-select-container">
                        <div class="route-row">
                          <span class="route-label">灭菌：</span>
                          <el-select placeholder="灭菌" size="mini">
                            <el-option label="不执行" :value="null"></el-option>
                            <el-option label="A" value="A"></el-option>
                            <el-option label="B" value="B"></el-option>
                            <el-option label="C" value="C"></el-option>
                          </el-select>
                        </div>
                        <div class="route-row">
                          <span class="route-label">解析：</span>
                          <el-select placeholder="解析" size="mini">
                            <el-option label="不执行" :value="null"></el-option>
                            <el-option label="A" value="A"></el-option>
                            <el-option label="B" value="B"></el-option>
                            <el-option label="C" value="C"></el-option>
                          </el-select>
                        </div>
                      </div>
                      <el-button type="primary" size="mini" style="width: 100%"
                        >执行</el-button
                      >
                      <el-button
                        type="danger"
                        size="mini"
                        style="width: 100%; margin-left: 0px"
                        >取消</el-button
                      >
                      <div style="display: flex; align-items: center">
                        <span style="font-size: 12px; color: greenyellow"
                          ><span style="font-size: 12px; color: #9fe3d3"
                            >执行中：<br /></span
                          >T-202502</span
                        >
                      </div>
                      <div style="font-size: 12px; color: #9fe3d3">
                        需进货：<b style="color: greenyellow">12</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <transition name="fade-scale">
                <div
                  v-if="popoverVisible"
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
                        <span class="line-label">电机状态</span>
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
                        <span class="line-label">光电检测</span>
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
                            <span class="line-label">电机状态</span>
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
                            <span class="line-label">光电检测</span>
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
                  <span>小车1 (0-1010):</span>
                  <span class="cart-value">{{ cartPositionValues.cart1 }}</span>
                </div>
                <div class="cart-position-slider-container">
                  <el-slider
                    v-model="cartPositionValues.cart1"
                    :min="0"
                    :max="1010"
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
        cart1: 250 // DBW88, 范围0-1010
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
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01002': {
          name: '01002',
          x: 1310,
          y: 280,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01004': {
          name: '01004',
          x: 1273,
          y: 280,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01005': {
          name: '01005',
          x: 1273,
          y: 310,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01006': {
          name: '01006',
          x: 1273,
          y: 340,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01008': {
          name: '01008',
          x: 1273,
          y: 375,
          groupId: 'G_01008_01009',
          showTray: true, // 显示托盘背景图片
          motorStatus: true, // 电机状态
          sensorStatus: false, // 传感器状态
          trayId: 'T-202502', // 托盘虚拟ID
          destination: '成品库' // 任务目的地
        },
        '01009': {
          name: '01009',
          x: 1273,
          y: 375,
          groupId: 'G_01008_01009',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01011': {
          name: '01011',
          x: 1300,
          y: 375,
          groupId: 'G_01011_01012',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01012': {
          name: '01012',
          x: 1300,
          y: 375,
          groupId: 'G_01011_01012',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01013A': {
          name: '01013A',
          x: 1273,
          y: 450,
          groupId: 'G_01013A_01013B',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01013B': {
          name: '01013B',
          x: 1273,
          y: 450,
          groupId: 'G_01013A_01013B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01019A': {
          name: '01019A',
          x: 1300,
          y: 450,
          groupId: 'G_01019A_01019B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01019B': {
          name: '01019B',
          x: 1300,
          y: 450,
          groupId: 'G_01019A_01019B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01014A': {
          name: '01014A',
          x: 1273,
          y: 510,
          groupId: 'G_01014A_01014B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01014B': {
          name: '01014B',
          x: 1273,
          y: 510,
          groupId: 'G_01014A_01014B',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01020A': {
          name: '01020A',
          x: 1300,
          y: 510,
          groupId: 'G_01020A_01020B',
          showTray: false,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01020B': {
          name: '01020B',
          x: 1300,
          y: 510,
          groupId: 'G_01020A_01020B',
          showTray: false,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01015A': {
          name: '01015A',
          x: 1273,
          y: 570,
          groupId: 'G_01015A_01015B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01015B': {
          name: '01015B',
          x: 1273,
          y: 570,
          groupId: 'G_01015A_01015B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01021A': {
          name: '01021A',
          x: 1300,
          y: 570,
          groupId: 'G_01021A_01021B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01021B': {
          name: '01021B',
          x: 1300,
          y: 570,
          groupId: 'G_01021A_01021B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01016A': {
          name: '01016A',
          x: 1273,
          y: 620,
          groupId: 'G_01016A_01016B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01016B': {
          name: '01016B',
          x: 1273,
          y: 620,
          groupId: 'G_01016A_01016B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01022A': {
          name: '01022A',
          x: 1300,
          y: 620,
          groupId: 'G_01022A_01022B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01022B': {
          name: '01022B',
          x: 1300,
          y: 620,
          groupId: 'G_01022A_01022B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01017A': {
          name: '01017A',
          x: 1273,
          y: 670,
          groupId: 'G_01017A_01017B',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01017B': {
          name: '01017B',
          x: 1300,
          y: 670,
          groupId: 'G_01017A_01017B',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01023A': {
          name: '01023A',
          x: 1300,
          y: 670,
          groupId: 'G_01023A_01023B',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01023B': {
          name: '01023B',
          x: 1300,
          y: 670,
          groupId: 'G_01023A_01023B',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01018A': {
          name: '01018A',
          x: 1273,
          y: 720,
          groupId: 'G_01018A_01018B',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01018B': {
          name: '01018B',
          x: 1300,
          y: 720,
          groupId: 'G_01018A_01018B',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01024A': {
          name: '01024A',
          x: 1300,
          y: 720,
          groupId: 'G_01024A_01024B',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01024B': {
          name: '01024B',
          x: 1300,
          y: 720,
          groupId: 'G_01024A_01024B',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01026': {
          name: '01026',
          x: 1273,
          y: 778,
          groupId: 'G_01026_01027',
          showTray: true,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01027': {
          name: '01027',
          x: 1273,
          y: 778,
          groupId: 'G_01026_01027',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01029': {
          name: '01029',
          x: 1300,
          y: 778,
          groupId: 'G_01029_01030',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01030': {
          name: '01030',
          x: 1300,
          y: 778,
          groupId: 'G_01029_01030',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '02014': {
          name: '02014',
          x: 1195,
          y: 778,
          groupId: 'G_02014_02015',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '02015': {
          name: '02015',
          x: 1195,
          y: 778,
          groupId: 'G_02014_02015',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '02011': {
          name: '02011',
          x: 1220,
          y: 778,
          groupId: 'G_02011_02012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '02012': {
          name: '02012',
          x: 1220,
          y: 778,
          groupId: 'G_02011_02012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '02021': {
          name: '02021',
          x: 1120,
          y: 778,
          groupId: 'G_02021_02022',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '02022': {
          name: '02022',
          x: 1120,
          y: 778,
          groupId: 'G_02021_02022',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '02018': {
          name: '02018',
          x: 1145,
          y: 778,
          groupId: 'G_02018_02019',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '02019': {
          name: '02019',
          x: 1145,
          y: 778,
          groupId: 'G_02018_02019',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '03014': {
          name: '03014',
          x: 1048,
          y: 778,
          groupId: 'G_03014_03015',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '03015': {
          name: '03015',
          x: 1048,
          y: 778,
          groupId: 'G_03014_03015',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '03011': {
          name: '03011',
          x: 1073,
          y: 778,
          groupId: 'G_03011_03012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '03012': {
          name: '03012',
          x: 1073,
          y: 778,
          groupId: 'G_03011_03012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '03021': {
          name: '03021',
          x: 973,
          y: 778,
          groupId: 'G_03021_03022',
          showTray: true,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '03022': {
          name: '03022',
          x: 973,
          y: 778,
          groupId: 'G_03021_03022',
          showTray: true,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '03018': {
          name: '03018',
          x: 998,
          y: 778,
          groupId: 'G_03018_03019',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '03019': {
          name: '03019',
          x: 998,
          y: 778,
          groupId: 'G_03018_03019',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '04014': {
          name: '04014',
          x: 900,
          y: 778,
          groupId: 'G_04014_04015',
          showTray: true,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '04015': {
          name: '04015',
          x: 900,
          y: 778,
          groupId: 'G_04014_04015',
          showTray: true,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '04011': {
          name: '04011',
          x: 925,
          y: 778,
          groupId: 'G_04011_04012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '04012': {
          name: '04012',
          x: 925,
          y: 778,
          groupId: 'G_04011_04012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '04021': {
          name: '04021',
          x: 828,
          y: 778,
          groupId: 'G_04021_04022',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '04022': {
          name: '04022',
          x: 828,
          y: 778,
          groupId: 'G_04021_04022',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '04018': {
          name: '04018',
          x: 853,
          y: 778,
          groupId: 'G_04018_04019',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '04019': {
          name: '04019',
          x: 853,
          y: 778,
          groupId: 'G_04018_04019',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '05014': {
          name: '05014',
          x: 753,
          y: 778,
          groupId: 'G_05014_05015',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '05015': {
          name: '05015',
          x: 753,
          y: 778,
          groupId: 'G_05014_05015',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '05011': {
          name: '05011',
          x: 778,
          y: 778,
          groupId: 'G_05011_05012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '05012': {
          name: '05012',
          x: 778,
          y: 778,
          groupId: 'G_05011_05012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '05021': {
          name: '05021',
          x: 680,
          y: 778,
          groupId: 'G_05021_05022',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '05022': {
          name: '05022',
          x: 680,
          y: 778,
          groupId: 'G_05021_05022',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '05018': {
          name: '05018',
          x: 705,
          y: 778,
          groupId: 'G_05018_05019',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '05019': {
          name: '05019',
          x: 705,
          y: 778,
          groupId: 'G_05018_05019',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '06014': {
          name: '06014',
          x: 606,
          y: 778,
          groupId: 'G_06014_06015',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '06015': {
          name: '06015',
          x: 606,
          y: 778,
          groupId: 'G_06014_06015',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '06011': {
          name: '06011',
          x: 631,
          y: 778,
          groupId: 'G_06011_06012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '06012': {
          name: '06012',
          x: 631,
          y: 778,
          groupId: 'G_06011_06012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '06021': {
          name: '06021',
          x: 530,
          y: 778,
          groupId: 'G_06021_06022',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '06022': {
          name: '06022',
          x: 530,
          y: 778,
          groupId: 'G_06021_06022',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '06018': {
          name: '06018',
          x: 556,
          y: 778,
          groupId: 'G_06018_06019',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '06019': {
          name: '06019',
          x: 556,
          y: 778,
          groupId: 'G_06018_06019',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '07014': {
          name: '07014',
          x: 460,
          y: 778,
          groupId: 'G_07014_07015',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '07015': {
          name: '07015',
          x: 460,
          y: 778,
          groupId: 'G_07014_07015',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '07011': {
          name: '07011',
          x: 486,
          y: 778,
          groupId: 'G_07011_07012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '07012': {
          name: '07012',
          x: 486,
          y: 778,
          groupId: 'G_07011_07012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '07021': {
          name: '07021',
          x: 386,
          y: 778,
          groupId: 'G_07021_07022',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '07022': {
          name: '07022',
          x: 386,
          y: 778,
          groupId: 'G_07021_07022',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '07018': {
          name: '07018',
          x: 411,
          y: 778,
          groupId: 'G_07018_07019',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '07019': {
          name: '07019',
          x: 411,
          y: 778,
          groupId: 'G_07018_07019',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '08014': {
          name: '08014',
          x: 315,
          y: 778,
          groupId: 'G_08014_08015',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '08015': {
          name: '08015',
          x: 315,
          y: 778,
          groupId: 'G_08014_08015',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '08011': {
          name: '08011',
          x: 341,
          y: 778,
          groupId: 'G_08011_08012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '08012': {
          name: '08012',
          x: 341,
          y: 778,
          groupId: 'G_08011_08012',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '08021': {
          name: '08021',
          x: 240,
          y: 778,
          showTray: true,
          groupId: 'G_08021_08022',
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '08022': {
          name: '08022',
          x: 240,
          y: 778,
          showTray: true,
          groupId: 'G_08021_08022',
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '08018': {
          name: '08018',
          x: 266,
          y: 778,
          showTray: true,
          groupId: 'G_08018_08019',
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '08019': {
          name: '08019',
          x: 266,
          y: 778,
          showTray: true,
          groupId: 'G_08018_08019',
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '09010': {
          name: '09010',
          x: 165,
          y: 778,
          groupId: 'G_09010_09011',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '09011': {
          name: '09011',
          x: 165,
          y: 778,
          groupId: 'G_09010_09011',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '09007': {
          name: '09007',
          x: 191,
          y: 778,
          groupId: 'G_09007_09008',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '09008': {
          name: '09008',
          x: 191,
          y: 778,
          groupId: 'G_09007_09008',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        // // 以下为预热第一排的光电信号
        '02002SP': {
          name: 'SP02002-1',
          x: 1195,
          y: 735,
          sensorStatus: false
        },
        '02001SP': {
          name: 'SP02001-1',
          x: 1220,
          y: 735,
          sensorStatus: false
        },
        '02004SP': {
          name: 'SP02004-1',
          x: 1120,
          y: 735,
          sensorStatus: true
        },
        '02003SP': {
          name: 'SP02003-1',
          x: 1145,
          y: 735,
          sensorStatus: true
        },
        '03002SP': {
          name: 'SP03002-1',
          x: 1048,
          y: 735,
          sensorStatus: true
        },
        '03001SP': {
          name: 'SP03001-1',
          x: 1073,
          y: 735,
          sensorStatus: false
        },
        '03004SP': {
          name: 'SP03004-1',
          x: 973,
          y: 735,
          sensorStatus: true
        },
        '03003SP': {
          name: 'SP03003-1',
          x: 998,
          y: 735,
          sensorStatus: false
        },
        '04002SP': {
          name: 'SP04002-1',
          x: 900,
          y: 735,
          sensorStatus: true
        },
        '04001SP': {
          name: 'SP04001-1',
          x: 925,
          y: 735,
          sensorStatus: false
        },
        '04004SP': {
          name: 'SP04004-1',
          x: 828,
          y: 735,
          sensorStatus: true
        },
        '04003SP': {
          name: 'SP04003-1',
          x: 853,
          y: 735,
          sensorStatus: false
        },
        '05002SP': {
          name: 'SP05002-1',
          x: 753,
          y: 735,
          sensorStatus: true
        },
        '05001SP': {
          name: 'SP05001-1',
          x: 778,
          y: 735,
          sensorStatus: false
        },
        '05004SP': {
          name: 'SP05004-1',
          x: 680,
          y: 735,
          sensorStatus: true
        },
        '05003SP': {
          name: 'SP05003-1',
          x: 705,
          y: 735,
          sensorStatus: false
        },
        '06002SP': {
          name: 'SP06002-1',
          x: 606,
          y: 735,
          sensorStatus: true
        },
        '06001SP': {
          name: 'SP06001-1',
          x: 631,
          y: 735,
          sensorStatus: false
        },
        '06004SP': {
          name: 'SP06004-1',
          x: 530,
          y: 735,
          sensorStatus: true
        },
        '06003SP': {
          name: 'SP06003-1',
          x: 556,
          y: 735,
          sensorStatus: false
        },
        '07002SP': {
          name: 'SP07002-1',
          x: 460,
          y: 735,
          sensorStatus: true
        },
        '07001SP': {
          name: 'SP07001-1',
          x: 486,
          y: 735,
          sensorStatus: false
        },
        '07004SP': {
          name: 'SP07004-1',
          x: 386,
          y: 735,
          sensorStatus: true
        },
        '07003SP': {
          name: 'SP07003-1',
          x: 411,
          y: 735,
          sensorStatus: false
        },
        '08002SP': {
          name: 'SP08002-1',
          x: 315,
          y: 735,
          sensorStatus: true
        },
        '08001SP': {
          name: 'SP08001-1',
          x: 341,
          y: 735,
          sensorStatus: false
        },
        '08004SP': {
          name: 'SP08004-1',
          x: 240,
          y: 735,
          sensorStatus: true
        },
        '08003SP': {
          name: 'SP08003-1',
          x: 266,
          y: 735,
          sensorStatus: false
        },
        '09002SP': {
          name: 'SP09002-1',
          x: 165,
          y: 735,
          sensorStatus: true
        },
        '09001SP': {
          name: 'SP09001-1',
          x: 191,
          y: 735,
          sensorStatus: false
        },
        // // 以上为预热第一排的光电信号
        // 以下为预热第二排的光电信号
        '02002': {
          name: '02002',
          x: 1195,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '02001': {
          name: '02001',
          x: 1220,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '02004': {
          name: '02004',
          x: 1120,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '02003': {
          name: '02003',
          x: 1145,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '03002': {
          name: '03002',
          x: 1048,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '03001': {
          name: '03001',
          x: 1073,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '03004': {
          name: '03004',
          x: 973,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '03003': {
          name: '03003',
          x: 998,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '04002': {
          name: '04002',
          x: 900,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '04001': {
          name: '04001',
          x: 925,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '04004': {
          name: '04004',
          x: 828,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '04003': {
          name: '04003',
          x: 853,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '05002': {
          name: '05002',
          x: 753,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '05001': {
          name: '05001',
          x: 778,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '05004': {
          name: '05004',
          x: 680,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '05003': {
          name: '05003',
          x: 705,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '06002': {
          name: '06002',
          x: 606,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '06001': {
          name: '06001',
          x: 631,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '06004': {
          name: '06004',
          x: 530,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '06003': {
          name: '06003',
          x: 556,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '07002': {
          name: '07002',
          x: 460,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '07001': {
          name: '07001',
          x: 486,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '07004': {
          name: '07004',
          x: 386,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '07003': {
          name: '07003',
          x: 411,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '08002': {
          name: '08002',
          x: 315,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '08001': {
          name: '08001',
          x: 341,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '08004': {
          name: '08004',
          x: 240,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '08003': {
          name: '08003',
          x: 266,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        '09002': {
          name: '09002',
          x: 165,
          y: 490,
          motorStatus: false,
          sensorStatus: true
        },
        '09001': {
          name: '09001',
          x: 191,
          y: 490,
          motorStatus: false,
          sensorStatus: false
        },
        // 以下为预热第三排的电机信号
        '02006': {
          name: '02006',
          x: 1195,
          y: 180,
          motorStatus: false
        },
        '02005': {
          name: '02005',
          x: 1220,
          y: 180,
          motorStatus: false
        },
        '02008': {
          name: '02008',
          x: 1120,
          y: 180,
          motorStatus: false
        },
        '02007': {
          name: '02007',
          x: 1145,
          y: 180,
          motorStatus: false
        },
        '03006': {
          name: '03006',
          x: 1048,
          y: 180,
          motorStatus: false
        },
        '03005': {
          name: '03005',
          x: 1073,
          y: 180,
          motorStatus: false
        },
        '03008': {
          name: '03008',
          x: 973,
          y: 180,
          motorStatus: false
        },
        '03007': {
          name: '03007',
          x: 998,
          y: 180,
          motorStatus: false
        },
        '04006': {
          name: '04006',
          x: 900,
          y: 180,
          motorStatus: false
        },
        '04005': {
          name: '04005',
          x: 925,
          y: 180,
          motorStatus: false
        },
        '04008': {
          name: '04008',
          x: 828,
          y: 180,
          motorStatus: false
        },
        '04007': {
          name: '04007',
          x: 853,
          y: 180,
          motorStatus: false
        },
        '05006': {
          name: '05006',
          x: 753,
          y: 180,
          motorStatus: false
        },
        '05005': {
          name: '05005',
          x: 778,
          y: 180,
          motorStatus: false
        },
        '05008': {
          name: '05008',
          x: 680,
          y: 180,
          motorStatus: false
        },
        '05007': {
          name: '05007',
          x: 705,
          y: 180,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '06006': {
          name: '06006',
          x: 606,
          y: 180,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '06005': {
          name: '06005',
          x: 631,
          y: 180,
          motorStatus: true
        },
        '06008': {
          name: '06008',
          x: 530,
          y: 180,
          motorStatus: false
        },
        '06007': {
          name: '06007',
          x: 556,
          y: 180,
          motorStatus: false
        },
        '07006': {
          name: '07006',
          x: 460,
          y: 180,
          motorStatus: false
        },
        '07005': {
          name: '07005',
          x: 486,
          y: 180,
          motorStatus: true
        },
        '07008': {
          name: '07008',
          x: 386,
          y: 180,
          motorStatus: false
        },
        '07007': {
          name: '07007',
          x: 411,
          y: 180,
          motorStatus: false
        },
        '08006': {
          name: '08006',
          x: 315,
          y: 180,
          motorStatus: true
        },
        '08005': {
          name: '08005',
          x: 341,
          y: 180,
          motorStatus: false
        },
        '08008': {
          name: '08008',
          x: 240,
          y: 180,
          motorStatus: true
        },
        '08007': {
          name: '08007',
          x: 266,
          y: 180,
          motorStatus: false
        },
        '09004': {
          name: '09004',
          x: 165,
          y: 180,
          motorStatus: false
        },
        '09003': {
          name: '09003',
          x: 191,
          y: 180,
          motorStatus: false
        },
        // 以上为第三排光电信号
        '01143T': {
          name: '立体库接口',
          x: 1195,
          y: 132,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01144T': {
          name: '立体库接口',
          x: 1220,
          y: 132,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01145T': {
          name: '立体库接口',
          x: 1120,
          y: 132,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01146T': {
          name: '立体库接口',
          x: 1145,
          y: 132,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01147T': {
          name: '立体库接口',
          x: 1048,
          y: 132,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01148': {
          name: '立体库接口',
          x: 1073,
          y: 132,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01149': {
          name: '立体库接口',
          x: 973,
          y: 132,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01150': {
          name: '立体库接口',
          x: 998,
          y: 132,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01151': {
          name: '立体库接口',
          x: 900,
          y: 132,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01152': {
          name: '立体库接口',
          x: 925,
          y: 132,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01153': {
          name: '立体库接口',
          x: 828,
          y: 132,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01154': {
          name: '立体库接口',
          x: 853,
          y: 132,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01155': {
          name: '立体库接口',
          x: 753,
          y: 132,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01156': {
          name: '立体库接口',
          x: 778,
          y: 132,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01157': {
          name: '立体库接口',
          x: 680,
          y: 132,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01158': {
          name: '立体库接口',
          x: 705,
          y: 132,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01159': {
          name: '立体库接口',
          x: 606,
          y: 132,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01160': {
          name: '立体库接口',
          x: 631,
          y: 132,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01161': {
          name: '立体库接口',
          x: 530,
          y: 132,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01162': {
          name: '立体库接口',
          x: 556,
          y: 132,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01163': {
          name: '立体库接口',
          x: 460,
          y: 132,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01164': {
          name: '立体库接口',
          x: 486,
          y: 132,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01165': {
          name: '立体库接口',
          x: 386,
          y: 132,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01166': {
          name: '立体库接口',
          x: 411,
          y: 132,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01167': {
          name: '立体库接口',
          x: 315,
          y: 132,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01168': {
          name: '立体库接口',
          x: 341,
          y: 132,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01169': {
          name: '立体库接口',
          x: 240,
          y: 132,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01170': {
          name: '立体库接口',
          x: 266,
          y: 132,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01171': {
          name: '立体库接口',
          x: 165,
          y: 132,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01172': {
          name: '立体库接口',
          x: 191,
          y: 132,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01173': {
          name: '立体库接口',
          x: 460,
          y: 97,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01174': {
          name: '立体库接口',
          x: 486,
          y: 97,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01175': {
          name: '立体库接口',
          x: 386,
          y: 97,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01176': {
          name: '立体库接口',
          x: 411,
          y: 97,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01177': {
          name: '立体库接口',
          x: 315,
          y: 97,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01178': {
          name: '立体库接口',
          x: 341,
          y: 97,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01179': {
          name: '立体库接口',
          x: 240,
          y: 97,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01180': {
          name: '立体库接口',
          x: 266,
          y: 97,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01181': {
          name: '立体库接口',
          x: 165,
          y: 97,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库'
        },
        '01182': {
          name: '立体库接口',
          x: 191,
          y: 97,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库'
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
      return this.queues.filter((q) => q.queueName.startsWith('Y'));
    },
    // 灭菌(xxxx)队列列表，用于灭菌后预热信号按钮
    sterilizationQueues() {
      return this.queues.filter(
        (q) => !q.queueName.startsWith('Y') && q.queueName !== '上货区'
      );
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
    // ipcRenderer.on('receivedMsg', (event, values, values2) => {
    //   // 使用位运算优化赋值
    //   const getBit = (word, bitIndex) => ((word >> bitIndex) & 1).toString();

    //   // A线电机运行信号 (DBW6)
    //   let word6 = this.convertToWord(values.DBW6);
    //   this.aLineMotorRunning.bit0 = getBit(word6, 8);
    //   this.aLineMotorRunning.bit1 = getBit(word6, 9);
    //   this.aLineMotorRunning.bit2 = getBit(word6, 10);
    //   this.aLineMotorRunning.bit3 = getBit(word6, 11);
    //   this.aLineMotorRunning.bit4 = getBit(word6, 12);
    //   this.aLineMotorRunning.bit5 = getBit(word6, 13);
    //   this.aLineMotorRunning.bit6 = getBit(word6, 14);
    //   this.aLineMotorRunning.bit7 = getBit(word6, 15);
    //   this.aLineMotorRunning.bit8 = getBit(word6, 0);
    //   this.aLineMotorRunning.bit9 = getBit(word6, 1);
    //   this.aLineMotorRunning.bit10 = getBit(word6, 2);
    //   this.aLineMotorRunning.bit11 = getBit(word6, 3);

    //   // A线光电检测信号 (DBW8)
    //   let word8 = this.convertToWord(values.DBW8);
    //   this.aLinePhotoelectricSignal.bit0 = getBit(word8, 8);
    //   this.aLinePhotoelectricSignal.bit1 = getBit(word8, 9);
    //   this.aLinePhotoelectricSignal.bit2 = getBit(word8, 10);
    //   this.aLinePhotoelectricSignal.bit3 = getBit(word8, 11);
    //   this.aLinePhotoelectricSignal.bit4 = getBit(word8, 12);
    //   this.aLinePhotoelectricSignal.bit5 = getBit(word8, 13);
    //   this.aLinePhotoelectricSignal.bit6 = getBit(word8, 14);
    //   this.aLinePhotoelectricSignal.bit7 = getBit(word8, 15);
    //   this.aLinePhotoelectricSignal.bit8 = getBit(word8, 0);
    //   this.aLinePhotoelectricSignal.bit9 = getBit(word8, 1);
    //   this.aLinePhotoelectricSignal.bit10 = getBit(word8, 2);
    //   this.aLinePhotoelectricSignal.bit11 = getBit(word8, 3);
    //   this.aLinePhotoelectricSignal.bit12 = getBit(word8, 4);
    //   this.aLinePhotoelectricSignal.bit13 = getBit(word8, 5);
    //   this.aLinePhotoelectricSignal.bit14 = getBit(word8, 6);
    //   this.aLinePhotoelectricSignal.bit15 = getBit(word8, 7);

    //   // B线电机运行信号 (DBW10)
    //   let word10 = this.convertToWord(values.DBW10);
    //   this.bLineMotorRunning.bit0 = getBit(word10, 8);
    //   this.bLineMotorRunning.bit1 = getBit(word10, 9);
    //   this.bLineMotorRunning.bit2 = getBit(word10, 10);
    //   this.bLineMotorRunning.bit3 = getBit(word10, 11);
    //   this.bLineMotorRunning.bit4 = getBit(word10, 12);
    //   this.bLineMotorRunning.bit5 = getBit(word10, 13);
    //   this.bLineMotorRunning.bit6 = getBit(word10, 14);
    //   this.bLineMotorRunning.bit7 = getBit(word10, 15);
    //   this.bLineMotorRunning.bit8 = getBit(word10, 0);
    //   this.bLineMotorRunning.bit9 = getBit(word10, 1);
    //   this.bLineMotorRunning.bit10 = getBit(word10, 2);
    //   this.bLineMotorRunning.bit11 = getBit(word10, 3);

    //   // B线光电检测信号 (DBW12)
    //   let word12 = this.convertToWord(values.DBW12);
    //   this.bLinePhotoelectricSignal.bit0 = getBit(word12, 8);
    //   this.bLinePhotoelectricSignal.bit1 = getBit(word12, 9);
    //   this.bLinePhotoelectricSignal.bit2 = getBit(word12, 10);
    //   this.bLinePhotoelectricSignal.bit3 = getBit(word12, 11);
    //   this.bLinePhotoelectricSignal.bit4 = getBit(word12, 12);
    //   this.bLinePhotoelectricSignal.bit5 = getBit(word12, 13);
    //   this.bLinePhotoelectricSignal.bit6 = getBit(word12, 14);
    //   this.bLinePhotoelectricSignal.bit7 = getBit(word12, 15);
    //   this.bLinePhotoelectricSignal.bit8 = getBit(word12, 0);
    //   this.bLinePhotoelectricSignal.bit9 = getBit(word12, 1);
    //   this.bLinePhotoelectricSignal.bit10 = getBit(word12, 2);
    //   this.bLinePhotoelectricSignal.bit11 = getBit(word12, 3);
    //   this.bLinePhotoelectricSignal.bit12 = getBit(word12, 4);
    //   this.bLinePhotoelectricSignal.bit13 = getBit(word12, 5);
    //   this.bLinePhotoelectricSignal.bit14 = getBit(word12, 6);
    //   this.bLinePhotoelectricSignal.bit15 = getBit(word12, 7);

    //   // C线电机运行信号 (DBW14)
    //   let word14 = this.convertToWord(values.DBW14);
    //   this.cLineMotorRunning.bit0 = getBit(word14, 8);
    //   this.cLineMotorRunning.bit1 = getBit(word14, 9);
    //   this.cLineMotorRunning.bit2 = getBit(word14, 10);
    //   this.cLineMotorRunning.bit3 = getBit(word14, 11);
    //   this.cLineMotorRunning.bit4 = getBit(word14, 12);
    //   this.cLineMotorRunning.bit5 = getBit(word14, 13);
    //   this.cLineMotorRunning.bit6 = getBit(word14, 14);
    //   this.cLineMotorRunning.bit7 = getBit(word14, 15);
    //   this.cLineMotorRunning.bit8 = getBit(word14, 0);
    //   this.cLineMotorRunning.bit9 = getBit(word14, 1);
    //   this.cLineMotorRunning.bit10 = getBit(word14, 2);
    //   this.cLineMotorRunning.bit11 = getBit(word14, 3);
    //   // C线光电检测信号 (DBW16)
    //   let word16 = this.convertToWord(values.DBW16);
    //   this.cLinePhotoelectricSignal.bit0 = getBit(word16, 8);
    //   this.cLinePhotoelectricSignal.bit1 = getBit(word16, 9);
    //   this.cLinePhotoelectricSignal.bit2 = getBit(word16, 10);
    //   this.cLinePhotoelectricSignal.bit3 = getBit(word16, 11);
    //   this.cLinePhotoelectricSignal.bit4 = getBit(word16, 12);
    //   this.cLinePhotoelectricSignal.bit5 = getBit(word16, 13);
    //   this.cLinePhotoelectricSignal.bit6 = getBit(word16, 14);
    //   this.cLinePhotoelectricSignal.bit7 = getBit(word16, 15);
    //   this.cLinePhotoelectricSignal.bit8 = getBit(word16, 0);
    //   this.cLinePhotoelectricSignal.bit9 = getBit(word16, 1);
    //   this.cLinePhotoelectricSignal.bit10 = getBit(word16, 2);
    //   this.cLinePhotoelectricSignal.bit11 = getBit(word16, 3);
    //   this.cLinePhotoelectricSignal.bit12 = getBit(word16, 4);
    //   this.cLinePhotoelectricSignal.bit13 = getBit(word16, 5);
    //   this.cLinePhotoelectricSignal.bit14 = getBit(word16, 6);
    //   this.cLinePhotoelectricSignal.bit15 = getBit(word16, 7);
    //   // D线电机运行信号-读取PLC
    //   let word18 = this.convertToWord(values.DBW18);
    //   this.dLineMotorRunning.bit0 = getBit(word18, 8);
    //   this.dLineMotorRunning.bit1 = getBit(word18, 9);
    //   this.dLineMotorRunning.bit2 = getBit(word18, 10);
    //   this.dLineMotorRunning.bit3 = getBit(word18, 11);
    //   this.dLineMotorRunning.bit4 = getBit(word18, 12);
    //   this.dLineMotorRunning.bit5 = getBit(word18, 13);
    //   this.dLineMotorRunning.bit6 = getBit(word18, 14);
    //   this.dLineMotorRunning.bit7 = getBit(word18, 15);
    //   this.dLineMotorRunning.bit8 = getBit(word18, 0);
    //   this.dLineMotorRunning.bit9 = getBit(word18, 1);
    //   this.dLineMotorRunning.bit10 = getBit(word18, 2);
    //   this.dLineMotorRunning.bit11 = getBit(word18, 3);
    //   // D线光电检测信号-读取PLC
    //   let word20 = this.convertToWord(values.DBW20);
    //   this.dLinePhotoelectricSignal.bit1 = getBit(word20, 9);
    //   this.dLinePhotoelectricSignal.bit2 = getBit(word20, 10);
    //   this.dLinePhotoelectricSignal.bit3 = getBit(word20, 11);
    //   this.dLinePhotoelectricSignal.bit4 = getBit(word20, 12);
    //   this.dLinePhotoelectricSignal.bit5 = getBit(word20, 13);
    //   this.dLinePhotoelectricSignal.bit6 = getBit(word20, 14);
    //   this.dLinePhotoelectricSignal.bit7 = getBit(word20, 15);
    //   this.dLinePhotoelectricSignal.bit8 = getBit(word20, 0);
    //   this.dLinePhotoelectricSignal.bit9 = getBit(word20, 1);
    //   this.dLinePhotoelectricSignal.bit10 = getBit(word20, 2);
    //   this.dLinePhotoelectricSignal.bit11 = getBit(word20, 3);
    //   this.dLinePhotoelectricSignal.bit12 = getBit(word20, 4);
    //   this.dLinePhotoelectricSignal.bit13 = getBit(word20, 5);
    //   this.dLinePhotoelectricSignal.bit14 = getBit(word20, 6);
    //   this.dLinePhotoelectricSignal.bit15 = getBit(word20, 7);
    //   // E线电机运行信号-读取PLC
    //   let word22 = this.convertToWord(values.DBW22);
    //   this.eLineMotorRunning.bit0 = getBit(word22, 8);
    //   this.eLineMotorRunning.bit1 = getBit(word22, 9);
    //   this.eLineMotorRunning.bit2 = getBit(word22, 10);
    //   this.eLineMotorRunning.bit3 = getBit(word22, 11);
    //   this.eLineMotorRunning.bit4 = getBit(word22, 12);
    //   this.eLineMotorRunning.bit5 = getBit(word22, 13);
    //   this.eLineMotorRunning.bit6 = getBit(word22, 14);
    //   this.eLineMotorRunning.bit7 = getBit(word22, 15);
    //   this.eLineMotorRunning.bit8 = getBit(word22, 0);
    //   this.eLineMotorRunning.bit9 = getBit(word22, 1);
    //   this.eLineMotorRunning.bit10 = getBit(word22, 2);
    //   this.eLineMotorRunning.bit11 = getBit(word22, 3);
    //   // E线光电检测信号-读取PLC
    //   let word24 = this.convertToWord(values.DBW24);
    //   this.eLinePhotoelectricSignal.bit1 = getBit(word24, 9);
    //   this.eLinePhotoelectricSignal.bit2 = getBit(word24, 10);
    //   this.eLinePhotoelectricSignal.bit3 = getBit(word24, 11);
    //   this.eLinePhotoelectricSignal.bit4 = getBit(word24, 12);
    //   this.eLinePhotoelectricSignal.bit5 = getBit(word24, 13);
    //   this.eLinePhotoelectricSignal.bit6 = getBit(word24, 14);
    //   this.eLinePhotoelectricSignal.bit7 = getBit(word24, 15);
    //   this.eLinePhotoelectricSignal.bit8 = getBit(word24, 0);
    //   this.eLinePhotoelectricSignal.bit9 = getBit(word24, 1);
    //   this.eLinePhotoelectricSignal.bit10 = getBit(word24, 2);
    //   this.eLinePhotoelectricSignal.bit11 = getBit(word24, 3);
    //   this.eLinePhotoelectricSignal.bit12 = getBit(word24, 4);
    //   this.eLinePhotoelectricSignal.bit13 = getBit(word24, 5);
    //   this.eLinePhotoelectricSignal.bit14 = getBit(word24, 6);
    //   this.eLinePhotoelectricSignal.bit15 = getBit(word24, 7);

    //   // A线数量-读取PLC
    //   this.aLineQuantity.a12 = Number(values.DBW28 ?? 0);
    //   this.aLineQuantity.a13 = Number(values.DBW30 ?? 0);
    //   this.aLineQuantity.a21in = Number(values.DBW32 ?? 0);
    //   this.aLineQuantity.a21out = Number(values.DBW140 ?? 0);
    //   this.aLineQuantity.a31 = Number(values.DBW34 ?? 0);
    //   this.aLineQuantity.a32 = Number(values.DBW36 ?? 0);
    //   this.aLineQuantity.a15 = Number(values.DBW38 ?? 0);
    //   this.aLineQuantity.a16 = Number(values.DBW40 ?? 0);
    //   this.aLineQuantity.a22in = Number(values.DBW42 ?? 0);
    //   this.aLineQuantity.a22out = Number(values.DBW142 ?? 0);
    //   this.aLineQuantity.a34 = Number(values.DBW44 ?? 0);
    //   this.aLineQuantity.a35 = Number(values.DBW46 ?? 0);

    //   // B线数量-读取PLC
    //   this.bLineQuantity.b12 = Number(values.DBW48 ?? 0);
    //   this.bLineQuantity.b13 = Number(values.DBW50 ?? 0);
    //   this.bLineQuantity.b21in = Number(values.DBW52 ?? 0);
    //   this.bLineQuantity.b21out = Number(values.DBW144 ?? 0);
    //   this.bLineQuantity.b31 = Number(values.DBW54 ?? 0);
    //   this.bLineQuantity.b32 = Number(values.DBW56 ?? 0);
    //   this.bLineQuantity.b15 = Number(values.DBW58 ?? 0);
    //   this.bLineQuantity.b16 = Number(values.DBW60 ?? 0);
    //   this.bLineQuantity.b22in = Number(values.DBW62 ?? 0);
    //   this.bLineQuantity.b22out = Number(values.DBW146 ?? 0);
    //   this.bLineQuantity.b34 = Number(values.DBW64 ?? 0);
    //   this.bLineQuantity.b35 = Number(values.DBW66 ?? 0);

    //   // C线数量-读取PLC
    //   this.cLineQuantity.c12 = Number(values.DBW68 ?? 0);
    //   this.cLineQuantity.c13 = Number(values.DBW70 ?? 0);
    //   this.cLineQuantity.c21in = Number(values.DBW72 ?? 0);
    //   this.cLineQuantity.c21out = Number(values.DBW148 ?? 0);
    //   this.cLineQuantity.c31 = Number(values.DBW74 ?? 0);
    //   this.cLineQuantity.c32 = Number(values.DBW76 ?? 0);
    //   this.cLineQuantity.c15 = Number(values.DBW78 ?? 0);
    //   this.cLineQuantity.c16 = Number(values.DBW80 ?? 0);
    //   this.cLineQuantity.c22in = Number(values.DBW82 ?? 0);
    //   this.cLineQuantity.c22out = Number(values.DBW150 ?? 0);
    //   this.cLineQuantity.c34 = Number(values.DBW84 ?? 0);
    //   this.cLineQuantity.c35 = Number(values.DBW86 ?? 0);

    //   // D线数量-读取PLC
    //   this.dLineQuantity.d12 = Number(values.DBW88 ?? 0);
    //   this.dLineQuantity.d13 = Number(values.DBW90 ?? 0);
    //   this.dLineQuantity.d21in = Number(values.DBW92 ?? 0);
    //   this.dLineQuantity.d21out = Number(values.DBW152 ?? 0);
    //   this.dLineQuantity.d31 = Number(values.DBW94 ?? 0);
    //   this.dLineQuantity.d32 = Number(values.DBW96 ?? 0);
    //   this.dLineQuantity.d15 = Number(values.DBW98 ?? 0);
    //   this.dLineQuantity.d16 = Number(values.DBW100 ?? 0);
    //   this.dLineQuantity.d22in = Number(values.DBW102 ?? 0);
    //   this.dLineQuantity.d22out = Number(values.DBW154 ?? 0);
    //   this.dLineQuantity.d34 = Number(values.DBW104 ?? 0);
    //   this.dLineQuantity.d35 = Number(values.DBW106 ?? 0);

    //   // E线数量-读取PLC
    //   this.eLineQuantity.e12 = Number(values.DBW108 ?? 0);
    //   this.eLineQuantity.e13 = Number(values.DBW110 ?? 0);
    //   this.eLineQuantity.e21in = Number(values.DBW112 ?? 0);
    //   this.eLineQuantity.e21out = Number(values.DBW156 ?? 0);
    //   this.eLineQuantity.e31 = Number(values.DBW114 ?? 0);
    //   this.eLineQuantity.e32 = Number(values.DBW116 ?? 0);
    //   this.eLineQuantity.e15 = Number(values.DBW118 ?? 0);
    //   this.eLineQuantity.e16 = Number(values.DBW120 ?? 0);
    //   this.eLineQuantity.e22in = Number(values.DBW122 ?? 0);
    //   this.eLineQuantity.e22out = Number(values.DBW158 ?? 0);
    //   this.eLineQuantity.e34 = Number(values.DBW124 ?? 0);
    //   this.eLineQuantity.e35 = Number(values.DBW126 ?? 0);

    //   // 上货区请求进货信号scanPhotoelectricSignal
    //   let word128 = this.convertToWord(values.DBW128);
    //   this.scanPhotoelectricSignal.bit0 = getBit(word128, 8);
    //   this.scanPhotoelectricSignal.bit1 = getBit(word128, 9);
    //   this.scanPhotoelectricSignal.bit2 = getBit(word128, 10);
    //   this.scanPhotoelectricSignal.bit3 = getBit(word128, 11);
    //   this.scanPhotoelectricSignal.bit4 = getBit(word128, 12);
    //   this.scanPhotoelectricSignal.bit5 = getBit(word128, 13);
    //   this.scanPhotoelectricSignal.bit6 = getBit(word128, 14);
    //   this.scanPhotoelectricSignal.bit7 = getBit(word128, 15);
    //   this.scanPhotoelectricSignal.bit8 = getBit(word128, 0);
    //   this.scanPhotoelectricSignal.bit9 = getBit(word128, 1);

    //   // 预热、灭菌完成信号
    //   let word160 = this.convertToWord(values.DBW160);
    //   this.disinfectionCompleted.bit0 = getBit(word160, 8);
    //   this.disinfectionCompleted.bit1 = getBit(word160, 9);
    //   this.disinfectionCompleted.bit2 = getBit(word160, 10);
    //   this.disinfectionCompleted.bit3 = getBit(word160, 11);
    //   this.disinfectionCompleted.bit4 = getBit(word160, 12);
    //   this.disinfectionCompleted.bit5 = getBit(word160, 13);
    //   this.disinfectionCompleted.bit6 = getBit(word160, 14);
    //   this.disinfectionCompleted.bit7 = getBit(word160, 15);
    //   this.disinfectionCompleted.bit8 = getBit(word160, 0);
    //   this.disinfectionCompleted.bit9 = getBit(word160, 1);
    //   this.disinfectionCompleted.bit10 = getBit(word160, 2);
    //   this.disinfectionCompleted.bit11 = getBit(word160, 3);
    //   this.disinfectionCompleted.bit12 = getBit(word160, 4);
    //   this.disinfectionCompleted.bit13 = getBit(word160, 5);
    //   this.disinfectionCompleted.bit14 = getBit(word160, 6);

    //   // 解析完成信号
    //   let word162 = this.convertToWord(values.DBW162);
    //   this.analysisCompleted.bit0 = getBit(word162, 8);
    //   this.analysisCompleted.bit1 = getBit(word162, 9);
    //   this.analysisCompleted.bit2 = getBit(word162, 10);
    //   this.analysisCompleted.bit3 = getBit(word162, 11);
    //   this.analysisCompleted.bit4 = getBit(word162, 12);
    //   this.analysisCompleted.bit5 = getBit(word162, 13);
    //   this.analysisCompleted.bit6 = getBit(word162, 14);
    //   this.analysisCompleted.bit7 = getBit(word162, 15);
    //   this.analysisCompleted.bit8 = getBit(word162, 0);
    //   this.analysisCompleted.bit9 = getBit(word162, 1);

    //   // 灭菌前1#小车位置值
    //   this.cartPositionValues.cart1 = Number(values.DBW134 ?? 0);
    //   // 灭菌前2#小车位置值
    //   this.cartPositionValues.cart2 = Number(values.DBW136 ?? 0);

    //   // 更新报警点位数据 - 统一使用convertToWord处理word数据
    //   // 先保存旧值用于报警检查
    //   const oldAlarmPoints = { ...this.alarmPoints };

    //   this.alarmPoints.DBW500 = this.convertToWord(values.DBW500 ?? 0);
    //   this.alarmPoints.DBW502 = this.convertToWord(values.DBW502 ?? 0);
    //   this.alarmPoints.DBW504 = this.convertToWord(values.DBW504 ?? 0);
    //   this.alarmPoints.DBW506 = this.convertToWord(values.DBW506 ?? 0);
    //   this.alarmPoints.DBW508 = this.convertToWord(values.DBW508 ?? 0);
    //   this.alarmPoints.DBW510 = this.convertToWord(values.DBW510 ?? 0);
    //   this.alarmPoints.DBW512 = this.convertToWord(values.DBW512 ?? 0);
    //   this.alarmPoints.DBW514 = this.convertToWord(values.DBW514 ?? 0);
    //   this.alarmPoints.DBW516 = this.convertToWord(values.DBW516 ?? 0);
    //   this.alarmPoints.DBW518 = this.convertToWord(values.DBW518 ?? 0);
    //   this.alarmPoints.DBW520 = this.convertToWord(values.DBW520 ?? 0);
    //   this.alarmPoints.DBW522 = this.convertToWord(values.DBW522 ?? 0);
    //   this.alarmPoints.DBW524 = this.convertToWord(values.DBW524 ?? 0);
    //   this.alarmPoints.DBW526 = this.convertToWord(values.DBW526 ?? 0);
    //   this.alarmPoints.DBW528 = this.convertToWord(values.DBW528 ?? 0);
    //   this.alarmPoints.DBW530 = this.convertToWord(values.DBW530 ?? 0);
    //   this.alarmPoints.DBW532 = this.convertToWord(values.DBW532 ?? 0);
    //   this.alarmPoints.DBW534 = this.convertToWord(values.DBW534 ?? 0);
    //   this.alarmPoints.DBW536 = this.convertToWord(values.DBW536 ?? 0);
    //   this.alarmPoints.DBW538 = this.convertToWord(values.DBW538 ?? 0);
    //   this.alarmPoints.DBW540 = this.convertToWord(values.DBW540 ?? 0);
    //   this.alarmPoints.DBW542 = this.convertToWord(values.DBW542 ?? 0);
    //   this.alarmPoints.DBW544 = this.convertToWord(values.DBW544 ?? 0);
    //   this.alarmPoints.DBW546 = this.convertToWord(values.DBW546 ?? 0);
    //   this.alarmPoints.DBW548 = this.convertToWord(values.DBW548 ?? 0);
    //   this.alarmPoints.DBW550 = this.convertToWord(values.DBW550 ?? 0);
    //   this.alarmPoints.DBW552 = this.convertToWord(values.DBW552 ?? 0);
    //   this.alarmPoints.DBW554 = this.convertToWord(values.DBW554 ?? 0);
    //   this.alarmPoints.DBW556 = this.convertToWord(values.DBW556 ?? 0);
    //   this.alarmPoints.DBW558 = this.convertToWord(values.DBW558 ?? 0);
    //   this.alarmPoints.DBW560 = this.convertToWord(values.DBW560 ?? 0);
    //   this.alarmPoints.DBW562 = this.convertToWord(values.DBW562 ?? 0);
    //   this.alarmPoints.DBW564 = this.convertToWord(values.DBW564 ?? 0);
    //   this.alarmPoints.DBW566 = this.convertToWord(values.DBW566 ?? 0);
    //   this.alarmPoints.DBW568 = this.convertToWord(values.DBW568 ?? 0);
    //   this.alarmPoints.DBW570 = this.convertToWord(values.DBW570 ?? 0);
    //   this.alarmPoints.DBW572 = this.convertToWord(values.DBW572 ?? 0);
    //   this.alarmPoints.DBW574 = this.convertToWord(values.DBW574 ?? 0);
    //   this.alarmPoints.DBW576 = this.convertToWord(values.DBW576 ?? 0);
    //   this.alarmPoints.DBW578 = this.convertToWord(values.DBW578 ?? 0);
    //   this.alarmPoints.DBW580 = this.convertToWord(values.DBW580 ?? 0);
    //   this.alarmPoints.DBW582 = this.convertToWord(values.DBW582 ?? 0);
    //   this.alarmPoints.DBW584 = this.convertToWord(values.DBW584 ?? 0);
    //   this.alarmPoints.DBW586 = this.convertToWord(values.DBW586 ?? 0);
    //   this.alarmPoints.DBW588 = this.convertToWord(values.DBW588 ?? 0);
    //   this.alarmPoints.DBW590 = this.convertToWord(values.DBW590 ?? 0);
    //   this.alarmPoints.DBW592 = this.convertToWord(values.DBW592 ?? 0);
    //   this.alarmPoints.DBW594 = this.convertToWord(values.DBW594 ?? 0);
    //   this.alarmPoints.DBW596 = this.convertToWord(values.DBW596 ?? 0);
    //   this.alarmPoints.DBW598 = this.convertToWord(values.DBW598 ?? 0);
    //   this.alarmPoints.DBW600 = this.convertToWord(values.DBW600 ?? 0);
    //   this.alarmPoints.DBW602 = this.convertToWord(values.DBW602 ?? 0);
    //   this.alarmPoints.DBW604 = this.convertToWord(values.DBW604 ?? 0);
    //   this.alarmPoints.DBW606 = this.convertToWord(values.DBW606 ?? 0);
    //   this.alarmPoints.DBW608 = this.convertToWord(values.DBW608 ?? 0);
    //   this.alarmPoints.DBW610 = this.convertToWord(values.DBW610 ?? 0);
    //   this.alarmPoints.DBW612 = this.convertToWord(values.DBW612 ?? 0);
    //   this.alarmPoints.DBW614 = this.convertToWord(values.DBW614 ?? 0);
    //   this.alarmPoints.DBW616 = this.convertToWord(values.DBW616 ?? 0);
    //   this.alarmPoints.DBW618 = this.convertToWord(values.DBW618 ?? 0);
    //   this.alarmPoints.DBW620 = this.convertToWord(values.DBW620 ?? 0);
    //   this.alarmPoints.DBW622 = this.convertToWord(values.DBW622 ?? 0);
    //   this.alarmPoints.DBW624 = this.convertToWord(values.DBW624 ?? 0);
    //   this.alarmPoints.DBW626 = this.convertToWord(values.DBW626 ?? 0);
    //   this.alarmPoints.DBW628 = this.convertToWord(values.DBW628 ?? 0);
    //   this.alarmPoints.DBW630 = this.convertToWord(values.DBW630 ?? 0);
    //   this.alarmPoints.DBW632 = this.convertToWord(values.DBW632 ?? 0);
    //   this.alarmPoints.DBW634 = this.convertToWord(values.DBW634 ?? 0);
    // });
    // // 给PLC数据加载时间
    // setTimeout(() => {
    //   this.addLog('isDataReady数据加载完成');
    //   this.isDataReady = true;
    // }, 3000);
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
      // 默认最大容量为 10，可根据实际需求调整或从 marker 配置中读取
      const maxCapacity = 10;
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
      // 独立设备：320px，成组设备：每个设备约 180px
      const popoverWidth =
        this.popoverList.length === 1
          ? 320
          : this.popoverList.length * 180 + 32;
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
        cart1: { min: 0, max: 1010 }
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
