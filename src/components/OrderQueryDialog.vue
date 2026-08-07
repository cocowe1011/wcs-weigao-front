<template>
  <div>
    <el-dialog
      title="历史批次查询"
      :visible.sync="dialogVisible"
      width="95%"
      :close-on-click-modal="false"
      :modal-append-to-body="false"
      append-to-body
      class="order-query-dialog"
    >
      <!-- 查询条件 -->
      <div class="query-form">
        <div class="query-item">
          <label>创建时间：</label>
          <el-date-picker
            v-model="queryForm.createdAtRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            clearable
            style="width: 260px"
          >
          </el-date-picker>
        </div>
        <div class="query-item">
          <label>灭菌单号：</label>
          <el-input
            v-model="queryForm.sterilizationOrderNo"
            placeholder="请输入灭菌单号"
            style="width: 180px"
            clearable
          ></el-input>
        </div>
        <div class="query-item query-actions">
          <el-button type="primary" @click="handleQuery" :loading="loading">
            <i class="el-icon-search"></i>查询
          </el-button>
          <el-button @click="handleReset">
            <i class="el-icon-refresh-left"></i>重置
          </el-button>
          <el-button
            type="success"
            @click="handleExportExcel"
            :loading="exportLoading"
            :disabled="pagination.total === 0"
          >
            <i class="el-icon-download"></i>导出Excel
          </el-button>
        </div>
      </div>

      <!-- 查询结果表格 -->
      <div class="table-container">
        <el-table
          :data="tableData"
          border
          stripe
          v-loading="loading"
          element-loading-text="正在查询..."
          style="width: 100%"
          max-height="400px"
        >
          <el-table-column
            prop="sterilizationOrderNo"
            label="灭菌单号"
            min-width="140"
            show-overflow-tooltip
          ></el-table-column>
          <el-table-column
            prop="batchNo"
            label="批次号"
            min-width="140"
            show-overflow-tooltip
          ></el-table-column>
          <el-table-column
            prop="palletQuantity"
            label="托盘数量"
            width="100"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="sterilizerNameCode"
            label="灭菌柜"
            min-width="120"
            show-overflow-tooltip
          ></el-table-column>
          <el-table-column
            prop="processPlanNameCode"
            label="工艺方案"
            min-width="120"
            show-overflow-tooltip
          ></el-table-column>
          <el-table-column
            prop="status"
            label="状态"
            width="100"
            align="center"
          >
            <template slot-scope="scope">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="confirmTime"
            label="确认时间"
            width="170"
            show-overflow-tooltip
          ></el-table-column>
          <el-table-column
            prop="finishTime"
            label="完成时间"
            width="170"
            show-overflow-tooltip
          ></el-table-column>
          <el-table-column
            prop="createdAt"
            label="创建时间"
            width="170"
            show-overflow-tooltip
          ></el-table-column>
          <el-table-column label="操作" width="90" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button
                type="text"
                size="small"
                @click="showDetail(scope.row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.pageNum"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        >
        </el-pagination>
      </div>
    </el-dialog>

    <!-- 批次详情（托盘 + 货物） -->
    <el-dialog
      title="批次详情"
      :visible.sync="detailVisible"
      width="90%"
      :close-on-click-modal="false"
      append-to-body
      class="batch-detail-dialog"
    >
      <div v-loading="detailLoading" class="detail-body">
        <div v-if="detailBatch" class="detail-batch-info">
          <span>灭菌单号：{{ detailBatch.sterilizationOrderNo || '--' }}</span>
          <span>批次号：{{ detailBatch.batchNo || '--' }}</span>
          <span>
            状态：
            <el-tag :type="getStatusType(detailBatch.status)" size="mini">
              {{ getStatusText(detailBatch.status) }}
            </el-tag>
          </span>
          <span>托盘数：{{ (detailPallets || []).length }}</span>
        </div>

        <el-table
          :data="detailPallets"
          border
          stripe
          style="width: 100%"
          max-height="480px"
          row-key="id"
        >
          <el-table-column type="expand">
            <template slot-scope="scope">
              <el-table
                :data="scope.row.goods || []"
                border
                size="mini"
                style="width: 100%"
              >
                <el-table-column
                  prop="uid"
                  label="货物UID"
                  min-width="160"
                  show-overflow-tooltip
                ></el-table-column>
                <el-table-column
                  prop="productName"
                  label="产品名称"
                  min-width="120"
                  show-overflow-tooltip
                ></el-table-column>
                <el-table-column
                  prop="productCode"
                  label="产品货号"
                  min-width="120"
                  show-overflow-tooltip
                ></el-table-column>
                <el-table-column
                  prop="spec"
                  label="规格"
                  min-width="100"
                  show-overflow-tooltip
                ></el-table-column>
                <el-table-column
                  prop="productionBatchNumber"
                  label="生产批次"
                  min-width="120"
                  show-overflow-tooltip
                ></el-table-column>
                <el-table-column
                  prop="scanStatus"
                  label="扫码状态"
                  width="90"
                  align="center"
                >
                  <template slot-scope="g">
                    {{ g.row.scanStatus === '1' ? '已扫' : '未扫' }}
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </el-table-column>
          <el-table-column
            prop="palletNo"
            label="托盘号"
            min-width="120"
            show-overflow-tooltip
          ></el-table-column>
          <el-table-column
            prop="virtualId"
            label="虚拟托盘ID"
            width="120"
            show-overflow-tooltip
          ></el-table-column>
          <el-table-column
            prop="loadStatus"
            label="上货状态"
            width="100"
            align="center"
          >
            <template slot-scope="scope">
              {{ scope.row.loadStatus === '1' ? '已上货' : '未上货' }}
            </template>
          </el-table-column>
          <el-table-column
            prop="trayStatus"
            label="扫码状态"
            width="110"
            align="center"
          >
            <template slot-scope="scope">
              {{ getTrayStatusText(scope.row.trayStatus) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="sendDestinationCode"
            label="目的地"
            width="100"
            show-overflow-tooltip
          ></el-table-column>
          <el-table-column
            prop="sendStatus"
            label="发送状态"
            width="100"
            align="center"
          >
            <template slot-scope="scope">
              {{ scope.row.sendStatus === '1' ? '已发送' : '未发送' }}
            </template>
          </el-table-column>
          <el-table-column
            prop="loadTime"
            label="上货时间"
            width="170"
            show-overflow-tooltip
          ></el-table-column>
          <el-table-column label="货物数" width="80" align="center">
            <template slot-scope="scope">
              {{ (scope.row.goods || []).length }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as XLSX from 'xlsx';
import fs from 'fs';
import HttpUtil from '@/utils/HttpUtil';

const remote = require('electron').remote;

const formatDate = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const todayStr = () => formatDate(new Date());

const emptyQueryForm = () => {
  const today = todayStr();
  return {
    createdAtRange: [today, today],
    sterilizationOrderNo: ''
  };
};

export default {
  name: 'OrderQueryDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      exportLoading: false,
      queryForm: emptyQueryForm(),
      tableData: [],
      pagination: {
        pageNum: 1,
        pageSize: 20,
        total: 0
      },
      detailVisible: false,
      detailLoading: false,
      detailBatch: null,
      detailPallets: []
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit('update:visible', val);
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.handleSearch();
      }
    }
  },
  methods: {
    buildSearchParams(overrides = {}) {
      const { createdAtRange, ...rest } = this.queryForm;
      const params = {
        pageNum: this.pagination.pageNum,
        pageSize: this.pagination.pageSize,
        ...rest,
        ...overrides
      };

      if (Array.isArray(createdAtRange) && createdAtRange.length === 2) {
        params.createdAtStart = createdAtRange[0];
        params.createdAtEnd = createdAtRange[1];
      }

      Object.keys(params).forEach((key) => {
        if (
          params[key] === '' ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      return params;
    },

    mapBatchBase(batch) {
      return {
        灭菌单号: (batch && batch.sterilizationOrderNo) || '',
        批次号: (batch && batch.batchNo) || '',
        托盘数量:
          batch && batch.palletQuantity != null ? batch.palletQuantity : '',
        灭菌柜: (batch && batch.sterilizerNameCode) || '',
        工艺方案: (batch && batch.processPlanNameCode) || '',
        批次状态: this.getStatusText(batch && batch.status),
        确认时间: (batch && batch.confirmTime) || '',
        完成时间: (batch && batch.finishTime) || '',
        创建时间: (batch && batch.createdAt) || ''
      };
    },

    mapPalletBase(pallet) {
      return {
        托盘号: (pallet && pallet.palletNo) || '',
        虚拟托盘ID: (pallet && pallet.virtualId) || '',
        是否入库:
          pallet && pallet.toWarehouse === '1'
            ? '是'
            : pallet && pallet.toWarehouse === '0'
            ? '否'
            : '',
        托盘扫码状态: this.getTrayStatusText(pallet && pallet.trayStatus),
        上货状态:
          pallet && pallet.loadStatus === '1'
            ? '已上货'
            : pallet
            ? '未上货'
            : '',
        上货时间: (pallet && pallet.loadTime) || '',
        目的地: (pallet && pallet.sendDestinationCode) || '',
        发送状态:
          pallet && pallet.sendStatus === '1'
            ? '已发送'
            : pallet
            ? '未发送'
            : '',
        发送时间: (pallet && pallet.sendTime) || ''
      };
    },

    mapGoodsBase(goods) {
      return {
        货物UID: (goods && goods.uid) || '',
        货物UDI: (goods && goods.udi) || '',
        产品名称: (goods && goods.productName) || '',
        产品货号: (goods && goods.productCode) || '',
        规格: (goods && goods.spec) || '',
        生产批次: (goods && goods.productionBatchNumber) || '',
        生产日期: (goods && goods.productionDate) || '',
        备注: (goods && goods.remark) || '',
        货物扫码状态:
          goods && goods.scanStatus === '1' ? '已扫' : goods ? '未扫' : '',
        扫码位置: (goods && goods.scanLocation) || '',
        扫码时间: (goods && goods.scanTime) || ''
      };
    },

    flattenBatchDetail(detail) {
      const batch = (detail && detail.batch) || {};
      const pallets = (detail && detail.pallets) || [];
      const batchBase = this.mapBatchBase(batch);
      const rows = [];

      if (!pallets.length) {
        rows.push({
          ...batchBase,
          ...this.mapPalletBase(null),
          ...this.mapGoodsBase(null)
        });
        return rows;
      }

      pallets.forEach((pallet) => {
        const palletBase = this.mapPalletBase(pallet);
        const goodsList = pallet.goods || [];
        if (!goodsList.length) {
          rows.push({
            ...batchBase,
            ...palletBase,
            ...this.mapGoodsBase(null)
          });
          return;
        }
        goodsList.forEach((goods) => {
          rows.push({
            ...batchBase,
            ...palletBase,
            ...this.mapGoodsBase(goods)
          });
        });
      });

      return rows;
    },

    async handleExportExcel() {
      if (this.pagination.total === 0) {
        this.$message.warning('暂无数据可导出');
        return;
      }

      this.exportLoading = true;
      try {
        const params = this.buildSearchParams({
          pageNum: 1,
          pageSize: this.pagination.total
        });
        const res = await HttpUtil.post(
          '/produce_batch/selectListByPage',
          params
        );
        const list = (res && res.data && res.data.list) || [];
        if (!list.length) {
          this.$message.warning('暂无数据可导出');
          return;
        }

        const exportRows = [];
        for (const batchRow of list) {
          const detailRes = await HttpUtil.get('/produce_batch/getById', {
            params: { id: batchRow.id }
          });
          if (detailRes && detailRes.data) {
            exportRows.push(...this.flattenBatchDetail(detailRes.data));
          } else {
            exportRows.push({
              ...this.mapBatchBase(batchRow),
              ...this.mapPalletBase(null),
              ...this.mapGoodsBase(null)
            });
          }
        }

        if (!exportRows.length) {
          this.$message.warning('暂无数据可导出');
          return;
        }

        const ws = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '历史批次明细');

        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const timestamp = `${now.getFullYear()}-${pad(
          now.getMonth() + 1
        )}-${pad(now.getDate())}_${pad(now.getHours())}${pad(
          now.getMinutes()
        )}${pad(now.getSeconds())}`;
        const { canceled, filePath } = await remote.dialog.showSaveDialog({
          title: '导出Excel',
          defaultPath: `历史批次查询_${timestamp}.xlsx`,
          filters: [{ name: 'Excel文件', extensions: ['xlsx'] }]
        });
        if (canceled || !filePath) return;

        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        fs.writeFileSync(filePath, buffer);
        this.$message.success('导出成功');
      } catch (error) {
        console.error('导出Excel失败:', error);
        this.$message.error('导出失败，请重试');
      } finally {
        this.exportLoading = false;
      }
    },

    async handleSearch() {
      this.loading = true;
      try {
        const params = this.buildSearchParams();
        const response = await HttpUtil.post(
          '/produce_batch/selectListByPage',
          params
        );
        if (response && response.data) {
          this.tableData = response.data.list || [];
          this.pagination.total = response.data.total || 0;
        } else {
          this.tableData = [];
          this.pagination.total = 0;
        }
      } catch (error) {
        console.error('查询历史批次失败:', error);
        this.$message.error('查询历史批次失败，请重试');
        this.tableData = [];
        this.pagination.total = 0;
      } finally {
        this.loading = false;
      }
    },

    handleQuery() {
      this.pagination.pageNum = 1;
      this.handleSearch();
    },

    handleReset() {
      this.queryForm = emptyQueryForm();
      this.pagination.pageNum = 1;
      this.handleSearch();
    },

    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.pageNum = 1;
      this.handleSearch();
    },

    handleCurrentChange(val) {
      this.pagination.pageNum = val;
      this.handleSearch();
    },

    async showDetail(row) {
      if (!row || !row.id) {
        this.$message.warning('批次ID无效');
        return;
      }
      this.detailVisible = true;
      this.detailLoading = true;
      this.detailBatch = null;
      this.detailPallets = [];
      try {
        const response = await HttpUtil.get('/produce_batch/getById', {
          params: { id: row.id }
        });
        if (response && response.data) {
          this.detailBatch = response.data.batch || null;
          this.detailPallets = response.data.pallets || [];
        } else {
          this.$message.warning('未查询到批次详情');
        }
      } catch (error) {
        console.error('查询批次详情失败:', error);
        this.$message.error('查询批次详情失败，请重试');
      } finally {
        this.detailLoading = false;
      }
    },

    getStatusText(status) {
      const statusMap = {
        0: '待确认',
        1: '已确认',
        2: '生产中',
        3: '完成'
      };
      return statusMap[String(status)] || '未知';
    },

    getStatusType(status) {
      const typeMap = {
        0: 'info',
        1: 'warning',
        2: '',
        3: 'success'
      };
      return typeMap[String(status)] || 'info';
    },

    getTrayStatusText(trayStatus) {
      const map = {
        0: '待扫',
        1: '部分已扫',
        2: '全部已扫'
      };
      return map[String(trayStatus)] || '未知';
    }
  }
};
</script>

<style lang="less" scoped>
.order-query-dialog {
  .query-form {
    padding: 10px 0;
    margin-bottom: 10px;
    text-align: left;
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    .query-item {
      display: flex;
      align-items: center;
      margin-right: 20px;
      margin-bottom: 8px;

      label {
        font-size: 14px;
        color: #606266;
        white-space: nowrap;
        margin-right: 8px;
      }

      .el-button + .el-button {
        margin-left: 10px;
      }
    }

    .query-actions {
      white-space: nowrap;
    }
  }

  .table-container {
    margin-bottom: 15px;
  }

  .pagination-container {
    text-align: right;
    padding: 15px 0;
    border-top: 1px solid #ebeef5;
  }
}

.batch-detail-dialog {
  .detail-body {
    min-height: 120px;
  }

  .detail-batch-info {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 12px;
    font-size: 14px;
    color: #606266;

    > span {
      margin-right: 24px;
      margin-bottom: 6px;
    }
  }
}
</style>
