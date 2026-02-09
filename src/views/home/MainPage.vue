<template>
  <div class="smart-workshop" @click="handleGlobalClick">
    <!-- 内容区包装器 -->
    <div class="content-wrapper">
      <!-- 左侧面板 -->
      <div class="side-info-panel">
        <!-- PLC状态与订单信息区域 -->
        <div class="plc-info-section">
          <div class="section-header">当前扫码托盘信息</div>
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
                    'status-active': node.motorStatus || node.sensorStatus,
                    'status-idle': !node.motorStatus && !node.sensorStatus,
                    'is-selected': currentSelectedNodeId === node.id
                  }"
                  :data-x="node.x"
                  :data-y="node.y"
                  @click.stop="handleNodeClick(node, $event)"
                >
                  <!-- 托盘图片：仅在指定节点且处于激活状态(发绿)时显示 -->
                  <img
                    v-if="
                      node.showTray && (node.motorStatus || node.sensorStatus)
                    "
                    src="@/assets/weigao-img/tray.png"
                    class="tray-icon"
                  />
                  <div class="signal-base">
                    <div class="signal-core"></div>
                  </div>
                </div>
                <div
                  v-for="marker in queueMarkers"
                  :key="marker.id"
                  class="queue-marker"
                  :data-x="marker.x"
                  :data-y="marker.y"
                  @click="handleQueueMarkerClick(marker.queueId)"
                >
                  <!-- 进度条填充层 - 从底部向上生长 -->
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
                  :style="popoverStyle"
                  @click.stop
                >
                  <div class="popover-arrow"></div>

                  <div class="popover-header">
                    <span class="device-title">{{ popoverData.name }}</span>
                    <i
                      class="el-icon-close close-btn"
                      @click="closePopover"
                    ></i>
                  </div>

                  <div class="status-tiles">
                    <div
                      class="status-tile"
                      :class="
                        popoverData.motorStatus ? 'is-running' : 'is-stopped'
                      "
                    >
                      <div class="icon-box"><i class="el-icon-cpu"></i></div>
                      <div class="text-box">
                        <div class="label">电机状态</div>
                        <div class="value">
                          {{ popoverData.motorStatus ? '运行中' : '已停止' }}
                        </div>
                      </div>
                    </div>
                    <div
                      class="status-tile"
                      :class="
                        popoverData.sensorStatus ? 'is-active' : 'is-empty'
                      "
                    >
                      <div class="icon-box"><i class="el-icon-view"></i></div>
                      <div class="text-box">
                        <div class="label">光电检测</div>
                        <div class="value">
                          {{ popoverData.sensorStatus ? '有货物' : '无货物' }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="data-capsules">
                    <div class="capsule-item">
                      <span class="capsule-label">托盘虚拟ID</span>
                      <span class="capsule-value highlight">
                        {{ popoverData.trayId || '--' }}
                      </span>
                    </div>
                    <div class="capsule-item">
                      <span class="capsule-label">任务目的地</span>
                      <span class="capsule-value">
                        {{ popoverData.destination || '无任务' }}
                      </span>
                    </div>
                  </div>
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
                v-for="(queue, filteredIndex) in filteredQueues"
                :key="'queue-' + queue.id + '-' + filteredIndex"
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
                            v-if="
                              tray.sendTo &&
                              ['A1', 'B1', 'C1', '缓存区'].includes(
                                selectedQueue.queueName
                              )
                            "
                            >{{
                              ['A1', 'B1', 'C1'].includes(
                                selectedQueue.queueName
                              )
                                ? '预热房位置：'
                                : '预热房发送中：'
                            }}{{ tray.sendTo }}</span
                          >
                          <span
                            class="tray-batch"
                            v-if="tray.sequenceNumber > 0"
                            ><span class="sequence-number"
                              >(序号：{{ tray.sequenceNumber }})</span
                            ></span
                          >
                          <span
                            class="tray-batch"
                            v-if="selectedQueue.queueName == '分发区'"
                            >PLC命令：{{
                              tray.state === '0' ? '未执行' : '已执行'
                            }}</span
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
      nowScanTrayInfo: {},
      isDataReady: false, // 添加数据准备就绪标志位
      showTestPanel: false,
      orderQueryDialogVisible: false,
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
        { id: 1, queueName: 'Y3215', trayInfo: [] },
        { id: 2, queueName: '3215', trayInfo: [] },
        { id: 3, queueName: 'Y3214', trayInfo: [] },
        { id: 4, queueName: '3214', trayInfo: [] },
        { id: 5, queueName: 'Y3213', trayInfo: [] },
        { id: 6, queueName: '3213', trayInfo: [] },
        { id: 7, queueName: 'Y3212', trayInfo: [] },
        { id: 8, queueName: '3212', trayInfo: [] },
        { id: 9, queueName: 'Y3211', trayInfo: [] },
        { id: 10, queueName: '3211', trayInfo: [] },
        { id: 11, queueName: 'Y3210', trayInfo: [] },
        { id: 12, queueName: '3210', trayInfo: [] },
        { id: 13, queueName: 'Y3209', trayInfo: [] },
        { id: 14, queueName: '3209', trayInfo: [] },
        { id: 15, queueName: 'Y3208', trayInfo: [] },
        { id: 16, queueName: '3208', trayInfo: [] },
        { id: 17, queueName: 'Y3207', trayInfo: [] },
        { id: 18, queueName: '3207', trayInfo: [] },
        { id: 19, queueName: 'Y3206', trayInfo: [] },
        { id: 20, queueName: '3206', trayInfo: [] },
        { id: 21, queueName: 'Y3205', trayInfo: [] },
        { id: 22, queueName: '3205', trayInfo: [] },
        { id: 23, queueName: 'Y3204', trayInfo: [] },
        { id: 24, queueName: '3204', trayInfo: [] },
        { id: 25, queueName: 'Y3203', trayInfo: [] },
        { id: 26, queueName: '3203', trayInfo: [] },
        { id: 27, queueName: 'Y3202', trayInfo: [] },
        { id: 28, queueName: '3202', trayInfo: [] },
        { id: 29, queueName: 'Y3201', trayInfo: [] },
        { id: 30, queueName: '3201', trayInfo: [] }
      ],
      // 队列位置标识数据
      queueMarkers: [
        { id: 1, name: 'Y3215', queueId: 1, x: 1210, y: 615 },
        { id: 2, name: '3215', queueId: 2, x: 1210, y: 300 },
        { id: 3, name: 'Y3214', queueId: 3, x: 1135, y: 615 },
        { id: 4, name: '3214', queueId: 4, x: 1135, y: 300 },
        { id: 5, name: 'Y3213', queueId: 5, x: 1065, y: 615 },
        { id: 6, name: '3213', queueId: 6, x: 1065, y: 300 },
        { id: 7, name: 'Y3212', queueId: 7, x: 990, y: 615 },
        { id: 8, name: '3212', queueId: 8, x: 990, y: 300 },
        { id: 9, name: 'Y3211', queueId: 9, x: 915, y: 615 },
        { id: 10, name: '3211', queueId: 10, x: 915, y: 300 },
        { id: 11, name: 'Y3210', queueId: 11, x: 842, y: 615 },
        { id: 12, name: '3210', queueId: 12, x: 842, y: 300 },
        { id: 13, name: 'Y3209', queueId: 13, x: 767, y: 615 },
        { id: 14, name: '3209', queueId: 14, x: 767, y: 300 },
        { id: 15, name: 'Y3208', queueId: 15, x: 692, y: 615 },
        { id: 16, name: '3208', queueId: 16, x: 692, y: 300 },
        { id: 17, name: 'Y3207', queueId: 17, x: 620, y: 615 },
        { id: 18, name: '3207', queueId: 18, x: 620, y: 300 },
        { id: 19, name: 'Y3206', queueId: 19, x: 545, y: 615 },
        { id: 20, name: '3206', queueId: 20, x: 545, y: 300 },
        { id: 21, name: 'Y3205', queueId: 21, x: 472, y: 615 },
        { id: 22, name: '3205', queueId: 22, x: 472, y: 300 },
        { id: 23, name: 'Y3204', queueId: 23, x: 397, y: 615 },
        { id: 24, name: '3204', queueId: 24, x: 397, y: 300 },
        { id: 25, name: 'Y3203', queueId: 25, x: 328, y: 615 },
        { id: 26, name: '3203', queueId: 26, x: 328, y: 300 },
        { id: 27, name: 'Y3202', queueId: 27, x: 253, y: 615 },
        { id: 28, name: '3202', queueId: 28, x: 253, y: 300 },
        { id: 29, name: 'Y3201', queueId: 29, x: 178, y: 615 },
        { id: 30, name: '3201', queueId: 30, x: 178, y: 300 }
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
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01002': {
          name: '01002',
          x: 1310,
          y: 280,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01004': {
          name: '01004',
          x: 1273,
          y: 280,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01005': {
          name: '01005',
          x: 1273,
          y: 310,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01006': {
          name: '01006',
          x: 1273,
          y: 340,
          motorStatus: false,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01008': {
          name: '01008',
          x: 1273,
          y: 375,
          groupCode: '01008-01009',
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01009': {
          name: '01009',
          x: 1300,
          y: 375,
          groupCode: '01008-01009',
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01011': {
          name: '01011',
          x: 1273,
          y: 438,
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01012': {
          name: '01012',
          x: 1300,
          y: 438,
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01013': {
          name: '01013',
          x: 1273,
          y: 490,
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01014': {
          name: '01014',
          x: 1300,
          y: 490,
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01015': {
          name: '01015',
          x: 1273,
          y: 540,
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01016': {
          name: '01016',
          x: 1300,
          y: 540,
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01017': {
          name: '01017',
          x: 1273,
          y: 590,
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01018': {
          name: '01018',
          x: 1300,
          y: 590,
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01019': {
          name: '01019',
          x: 1273,
          y: 640,
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01020': {
          name: '01020',
          x: 1300,
          y: 640,
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01021': {
          name: '01021',
          x: 1273,
          y: 690,
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01022': {
          name: '01022',
          x: 1300,
          y: 690,
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01023': {
          name: '01023',
          x: 1273,
          y: 735,
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01024': {
          name: '01024',
          x: 1300,
          y: 735,
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01026': {
          name: '01026',
          x: 1273,
          y: 778,
          showTray: true,
          motorStatus: false,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01027': {
          name: '01027',
          x: 1300,
          y: 778,
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01029': {
          name: '01029',
          x: 1195,
          y: 778,
          showTray: true,
          motorStatus: true,
          sensorStatus: true,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        },
        '01030': {
          name: '01030',
          x: 1220,
          y: 778,
          showTray: true,
          motorStatus: true,
          sensorStatus: false,
          trayId: 'T-202502',
          destination: '成品库',
          plcAddress: 'DB1.DBX0.3'
        }
        // '02009': {
        //   name: '02009',
        //   x: 1120,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '02011': {
        //   name: '02011',
        //   x: 1145,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '02012': {
        //   name: '02012',
        //   x: 1048,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '02014': {
        //   name: '02014',
        //   x: 1073,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '02015': {
        //   name: '02015',
        //   x: 973,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '02016': {
        //   name: '02016',
        //   x: 998,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '02018': {
        //   name: '02018',
        //   x: 900,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '02019': {
        //   name: '02019',
        //   x: 925,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '02021': {
        //   name: '02021',
        //   x: 828,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '02022': {
        //   name: '02022',
        //   x: 853,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '03009': {
        //   name: '立体库接口',
        //   x: 753,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '03011': {
        //   name: '立体库接口',
        //   x: 778,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '03012': {
        //   name: '立体库接口',
        //   x: 680,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '03014': {
        //   name: '立体库接口',
        //   x: 705,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '03015': {
        //   name: '立体库接口',
        //   x: 606,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '03016': {
        //   name: '立体库接口',
        //   x: 631,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01041': {
        //   name: '立体库接口',
        //   x: 530,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01042': {
        //   name: '立体库接口',
        //   x: 556,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01043': {
        //   name: '立体库接口',
        //   x: 460,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01044': {
        //   name: '立体库接口',
        //   x: 486,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01045': {
        //   name: '立体库接口',
        //   x: 386,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01046': {
        //   name: '立体库接口',
        //   x: 411,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01047': {
        //   name: '立体库接口',
        //   x: 315,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01048': {
        //   name: '立体库接口',
        //   x: 341,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01049': {
        //   name: '立体库接口',
        //   x: 240,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01050': {
        //   name: '立体库接口',
        //   x: 266,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01051': {
        //   name: '立体库接口',
        //   x: 165,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01052': {
        //   name: '立体库接口',
        //   x: 191,
        //   y: 778,
        //   showTray: true,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01053': {
        //   name: '立体库接口',
        //   x: 1195,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01054': {
        //   name: '立体库接口',
        //   x: 1220,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01055': {
        //   name: '立体库接口',
        //   x: 1120,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01056': {
        //   name: '立体库接口',
        //   x: 1145,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01057': {
        //   name: '立体库接口',
        //   x: 1048,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01058': {
        //   name: '立体库接口',
        //   x: 1073,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01059': {
        //   name: '立体库接口',
        //   x: 973,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01060': {
        //   name: '立体库接口',
        //   x: 998,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01061': {
        //   name: '立体库接口',
        //   x: 900,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01062': {
        //   name: '立体库接口',
        //   x: 925,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01063': {
        //   name: '立体库接口',
        //   x: 828,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01064': {
        //   name: '立体库接口',
        //   x: 853,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01065': {
        //   name: '立体库接口',
        //   x: 753,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01066': {
        //   name: '立体库接口',
        //   x: 778,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01067': {
        //   name: '立体库接口',
        //   x: 680,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01068': {
        //   name: '立体库接口',
        //   x: 705,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01069': {
        //   name: '立体库接口',
        //   x: 606,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01070': {
        //   name: '立体库接口',
        //   x: 631,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01071': {
        //   name: '立体库接口',
        //   x: 530,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01072': {
        //   name: '立体库接口',
        //   x: 556,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01073': {
        //   name: '立体库接口',
        //   x: 460,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01074': {
        //   name: '立体库接口',
        //   x: 486,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01075': {
        //   name: '立体库接口',
        //   x: 386,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01076': {
        //   name: '立体库接口',
        //   x: 411,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01077': {
        //   name: '立体库接口',
        //   x: 315,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01078': {
        //   name: '立体库接口',
        //   x: 341,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01079': {
        //   name: '立体库接口',
        //   x: 240,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01080': {
        //   name: '立体库接口',
        //   x: 266,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01081': {
        //   name: '立体库接口',
        //   x: 165,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01082': {
        //   name: '立体库接口',
        //   x: 191,
        //   y: 735,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01083': {
        //   name: '立体库接口',
        //   x: 1195,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01084': {
        //   name: '立体库接口',
        //   x: 1220,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01085': {
        //   name: '立体库接口',
        //   x: 1120,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01086': {
        //   name: '立体库接口',
        //   x: 1145,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01087': {
        //   name: '立体库接口',
        //   x: 1048,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01088': {
        //   name: '立体库接口',
        //   x: 1073,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01089': {
        //   name: '立体库接口',
        //   x: 973,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01090': {
        //   name: '立体库接口',
        //   x: 998,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01091': {
        //   name: '立体库接口',
        //   x: 900,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01092': {
        //   name: '立体库接口',
        //   x: 925,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01093': {
        //   name: '立体库接口',
        //   x: 828,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01094': {
        //   name: '立体库接口',
        //   x: 853,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01095': {
        //   name: '立体库接口',
        //   x: 753,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01096': {
        //   name: '立体库接口',
        //   x: 778,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01097': {
        //   name: '立体库接口',
        //   x: 680,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01098': {
        //   name: '立体库接口',
        //   x: 705,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01099': {
        //   name: '立体库接口',
        //   x: 606,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01100': {
        //   name: '立体库接口',
        //   x: 631,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01101': {
        //   name: '立体库接口',
        //   x: 530,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01102': {
        //   name: '立体库接口',
        //   x: 556,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01103': {
        //   name: '立体库接口',
        //   x: 460,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01104': {
        //   name: '立体库接口',
        //   x: 486,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01105': {
        //   name: '立体库接口',
        //   x: 386,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01106': {
        //   name: '立体库接口',
        //   x: 411,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01107': {
        //   name: '立体库接口',
        //   x: 315,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01108': {
        //   name: '立体库接口',
        //   x: 341,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01109': {
        //   name: '立体库接口',
        //   x: 240,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01110': {
        //   name: '立体库接口',
        //   x: 266,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01111': {
        //   name: '立体库接口',
        //   x: 165,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01112': {
        //   name: '立体库接口',
        //   x: 191,
        //   y: 490,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01113': {
        //   name: '立体库接口',
        //   x: 1195,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01114': {
        //   name: '立体库接口',
        //   x: 1220,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01115': {
        //   name: '立体库接口',
        //   x: 1120,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01116': {
        //   name: '立体库接口',
        //   x: 1145,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01117': {
        //   name: '立体库接口',
        //   x: 1048,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01118': {
        //   name: '立体库接口',
        //   x: 1073,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01119': {
        //   name: '立体库接口',
        //   x: 973,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01120': {
        //   name: '立体库接口',
        //   x: 998,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01121': {
        //   name: '立体库接口',
        //   x: 900,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01122': {
        //   name: '立体库接口',
        //   x: 925,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01123': {
        //   name: '立体库接口',
        //   x: 828,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01124': {
        //   name: '立体库接口',
        //   x: 853,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01125': {
        //   name: '立体库接口',
        //   x: 753,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01126': {
        //   name: '立体库接口',
        //   x: 778,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01127': {
        //   name: '立体库接口',
        //   x: 680,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01128': {
        //   name: '立体库接口',
        //   x: 705,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01129': {
        //   name: '立体库接口',
        //   x: 606,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01130': {
        //   name: '立体库接口',
        //   x: 631,
        //   y: 180,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01131': {
        //   name: '立体库接口',
        //   x: 530,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01132': {
        //   name: '立体库接口',
        //   x: 556,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01133': {
        //   name: '立体库接口',
        //   x: 460,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01134': {
        //   name: '立体库接口',
        //   x: 486,
        //   y: 180,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01135': {
        //   name: '立体库接口',
        //   x: 386,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01136': {
        //   name: '立体库接口',
        //   x: 411,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01137': {
        //   name: '立体库接口',
        //   x: 315,
        //   y: 180,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01138': {
        //   name: '立体库接口',
        //   x: 341,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01139': {
        //   name: '立体库接口',
        //   x: 240,
        //   y: 180,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01140': {
        //   name: '立体库接口',
        //   x: 266,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01141': {
        //   name: '立体库接口',
        //   x: 165,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01142': {
        //   name: '立体库接口',
        //   x: 191,
        //   y: 180,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01143': {
        //   name: '立体库接口',
        //   x: 1195,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01144': {
        //   name: '立体库接口',
        //   x: 1220,
        //   y: 132,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01145': {
        //   name: '立体库接口',
        //   x: 1120,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01146': {
        //   name: '立体库接口',
        //   x: 1145,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01147': {
        //   name: '立体库接口',
        //   x: 1048,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01148': {
        //   name: '立体库接口',
        //   x: 1073,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01149': {
        //   name: '立体库接口',
        //   x: 973,
        //   y: 132,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01150': {
        //   name: '立体库接口',
        //   x: 998,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01151': {
        //   name: '立体库接口',
        //   x: 900,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01152': {
        //   name: '立体库接口',
        //   x: 925,
        //   y: 132,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01153': {
        //   name: '立体库接口',
        //   x: 828,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01154': {
        //   name: '立体库接口',
        //   x: 853,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01155': {
        //   name: '立体库接口',
        //   x: 753,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01156': {
        //   name: '立体库接口',
        //   x: 778,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01157': {
        //   name: '立体库接口',
        //   x: 680,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01158': {
        //   name: '立体库接口',
        //   x: 705,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01159': {
        //   name: '立体库接口',
        //   x: 606,
        //   y: 132,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01160': {
        //   name: '立体库接口',
        //   x: 631,
        //   y: 132,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01161': {
        //   name: '立体库接口',
        //   x: 530,
        //   y: 132,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01162': {
        //   name: '立体库接口',
        //   x: 556,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01163': {
        //   name: '立体库接口',
        //   x: 460,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01164': {
        //   name: '立体库接口',
        //   x: 486,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01165': {
        //   name: '立体库接口',
        //   x: 386,
        //   y: 132,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01166': {
        //   name: '立体库接口',
        //   x: 411,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01167': {
        //   name: '立体库接口',
        //   x: 315,
        //   y: 132,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01168': {
        //   name: '立体库接口',
        //   x: 341,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01169': {
        //   name: '立体库接口',
        //   x: 240,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01170': {
        //   name: '立体库接口',
        //   x: 266,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01171': {
        //   name: '立体库接口',
        //   x: 165,
        //   y: 132,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01172': {
        //   name: '立体库接口',
        //   x: 191,
        //   y: 132,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01173': {
        //   name: '立体库接口',
        //   x: 460,
        //   y: 97,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01174': {
        //   name: '立体库接口',
        //   x: 486,
        //   y: 97,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01175': {
        //   name: '立体库接口',
        //   x: 386,
        //   y: 97,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01176': {
        //   name: '立体库接口',
        //   x: 411,
        //   y: 97,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01177': {
        //   name: '立体库接口',
        //   x: 315,
        //   y: 97,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01178': {
        //   name: '立体库接口',
        //   x: 341,
        //   y: 97,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01179': {
        //   name: '立体库接口',
        //   x: 240,
        //   y: 97,
        //   motorStatus: true,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01180': {
        //   name: '立体库接口',
        //   x: 266,
        //   y: 97,
        //   motorStatus: false,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01181': {
        //   name: '立体库接口',
        //   x: 165,
        //   y: 97,
        //   motorStatus: false,
        //   sensorStatus: true,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // },
        // '01182': {
        //   name: '立体库接口',
        //   x: 191,
        //   y: 97,
        //   motorStatus: true,
        //   sensorStatus: false,
        //   trayId: 'T-202502',
        //   destination: '成品库',
        //   plcAddress: 'DB1.DBX0.3'
        // }
      },

      // 弹窗相关状态
      popoverVisible: false,
      popoverData: {}, // 当前弹窗显示的数据
      currentSelectedNodeId: null, // 当前选中的节点ID
      popoverPosition: { top: 0, left: 0 } // 弹窗相对容器的位置
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
    filteredQueues() {
      return this.queues.filter((q) => q.id !== 15);
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
      return Object.keys(this.deviceNodes).map((key) => ({
        id: key,
        ...this.deviceNodes[key]
      }));
    }
  },
  mounted() {
    this.initializeMarkers();
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
      this.popoverData = node;
      this.currentSelectedNodeId = node.id;

      // 1. 获取点击目标（小圆点）的屏幕矩形
      const targetRect = event.currentTarget.getBoundingClientRect();

      // 2. 获取容器（floor-image-container）的屏幕矩形
      const container = this.$refs.floorImageContainer;
      const containerRect = container.getBoundingClientRect();

      // 3. 计算相对坐标
      // 弹窗宽度约为320px，我们希望它居中显示在节点上方
      // 左偏移 = (目标左边 - 容器左边) + 目标宽度的一半
      // 上偏移 = (目标上边 - 容器上边) - 间距
      const left = targetRect.left - containerRect.left + targetRect.width / 2;
      const top = targetRect.top - containerRect.top - 12; // 留出一点空隙

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
          '.device-signal-node, .preheating-room-marker'
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
            // 高度跟随图片缩放比例
            marker.style.height = `${baseMarkerHeight * scaleY}px`;
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
    beforeDestroy() {
      window.removeEventListener('resize', this.updateMarkerPositions);
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
    }
  }
};
</script>
<style lang="less" scoped>
@import './css/MainPage.less';
</style>
